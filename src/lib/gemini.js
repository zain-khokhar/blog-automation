import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

// Singleton to hold the browser instance across hot reloads in dev
let globalBrowserInstance = global.geminiInstance || null;

class GeminiAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.imagePage = null; // Separate page for image generation (doesn't block images)
    this.isInitialized = false;
    this.isImagePageInitialized = false;
    // Store session in the project root/session
    this.userDataDir = path.resolve(process.cwd(), 'session-data');
    // Default to false (visible) so user can see what's happening and login
    this.headless = true; 
    this.activeRequest = null;
    this.uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'media');
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async initialize() {
    if (this.isInitialized && this.browser) {
       // Verify browser is actually still connected
       try {
           if (this.browser.isConnected()) {
               return true;
           }
       } catch (e) {
           this.isInitialized = false;
       }
    }

    try {
      console.log('Launching browser...');
      this.browser = await puppeteer.launch({
        headless: this.headless,
        userDataDir: this.userDataDir,
        defaultViewport: null,
        args: [
            '--start-maximized', 
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
      });

      this.page = await this.browser.newPage();

      // Mask webdriver
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });

      // Optimization: Block unnecessary resources
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log('Navigating to Gemini...');
      await this.page.goto('https://gemini.google.com/app', {
        waitUntil: 'networkidle2',
      });

      // Check login status
      const isLoggedIn = (await this.page.$('textarea, div[role="textbox"]')) !== null;

      if (!isLoggedIn) {
        console.log(
          '\n⚠️  NOT LOGGED IN - Please complete login manually in the browser window.'
        );
        // We can't use readline in Next.js server context easily like CLI.
        // Instead, we wait until the selector appears.
        console.log('Waiting for login to complete...');
        try {
             await this.page.waitForSelector('textarea, div[role="textbox"]', { timeout: 300000 }); // Wait 5 mins for user to login
             console.log('✓ Login detected');
        } catch (e) {
            console.error("Login timeout or failure");
            throw new Error("User did not log in within the timeout period.");
        }
      } else {
        console.log('✓ Already logged in');
      }

      this.isInitialized = true;
      console.log('✓ Browser initialized successfully\n');
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error.message);
      return false;
    }
  }

  async waitForResponse(timeoutMs = 180000, domDelayMs = 1000) {
      try {
          const startTime = Date.now();
          console.log('🔍 Waiting for Gemini to finish generating...');
          
          await this.page.waitForSelector('message-content', { visible: true, timeout: 120000 });
          await this.delay(800);
          
          const generationComplete = await this.page.evaluate((maxWaitMs) => {
              return new Promise((resolve, reject) => {
                  const startTime = Date.now();
                  let lastMutationTime = Date.now();
                  let stableCount = 0;
                  const STABLE_CHECKS_NEEDED = 5;
                  const STABLE_DURATION_MS = 1500;
                  
                  const messages = document.querySelectorAll('message-content');
                  if (messages.length === 0) {
                      reject(new Error('No message-content found'));
                      return;
                  }
                  const lastMessage = messages[messages.length - 1];
                  
                  const checkCompletionSignals = () => {
                      const signals = {
                          copyButton: false,
                          stopButton: false,
                          textStable: false,
                          cursorGone: false
                      };
                      
                      const copyButton = lastMessage.querySelector('button[aria-label*="Copy"], button[data-tooltip*="Copy"], button[title*="Copy"]');
                      signals.copyButton = copyButton && copyButton.offsetParent !== null;
                      
                      const stopButton = document.querySelector('button[aria-label*="Stop"], button[aria-label*="stop"]');
                      signals.stopButton = !stopButton || stopButton.offsetParent === null;
                      
                      const typingIndicator = lastMessage.querySelector('.typing-indicator, .cursor, [class*="typing"]');
                      signals.cursorGone = !typingIndicator || typingIndicator.offsetParent === null;
                      
                      const timeSinceLastMutation = Date.now() - lastMutationTime;
                      signals.textStable = timeSinceLastMutation >= STABLE_DURATION_MS;
                      
                      return signals;
                  };
                  
                  const observer = new MutationObserver((mutations) => {
                      const relevantMutation = mutations.some(mutation => {
                          if (mutation.type === 'childList' || mutation.type === 'characterData') {
                              return true;
                          }
                          return false;
                      });
                      
                      if (relevantMutation) {
                          lastMutationTime = Date.now();
                          stableCount = 0;
                      }
                  });
                  
                  observer.observe(lastMessage, {
                      childList: true,
                      subtree: true,
                      characterData: true,
                      attributes: false
                  });
                  
                  const checkInterval = setInterval(() => {
                      const elapsed = Date.now() - startTime;
                      
                      if (elapsed >= maxWaitMs) {
                          clearInterval(checkInterval);
                          observer.disconnect();
                          resolve({ completed: false, reason: 'timeout' });
                          return;
                      }
                      
                      const signals = checkCompletionSignals();
                      
                      const isComplete = signals.copyButton || 
                                       (signals.stopButton && signals.textStable && signals.cursorGone);
                      
                      if (isComplete) {
                          stableCount++;
                          
                          if (stableCount >= STABLE_CHECKS_NEEDED) {
                              clearInterval(checkInterval);
                              observer.disconnect();
                              resolve({ completed: true, signals });
                              return;
                          }
                      } else {
                          stableCount = 0;
                      }
                  }, 500);
              });
          }, timeoutMs);
          
          console.log(`⏳ DOM stable delay triggered (${domDelayMs}ms)...`);
          await this.delay(domDelayMs);
          
          console.log('📤 JSON return triggered...');
          
          const messages = await this.page.$$('message-content');
          if (messages.length === 0) {
              throw new Error('No messages found after waiting');
          }
          
          const lastMessage = messages[messages.length - 1];
          
          const text = await lastMessage.evaluate(el => {
              const codeBlock = el.querySelector('pre code, code[class*="language-"], .code-block code');
              if (codeBlock && codeBlock.textContent.trim().length > 50) {
                  return codeBlock.textContent.trim();
              }
              const markdown = el.querySelector('.markdown');
              if (markdown && markdown.textContent.trim().length > 50) {
                  return markdown.textContent.trim();
              }
              return el.textContent.trim();
          });
          
          if (!text || text.length < 2) { // Relaxed length check a bit
              throw new Error(`Response too short or empty (${text?.length} characters)`);
          }
          
          return text;
          
      } catch (error) {
          console.error('❌ Error in waitForResponse:', error.message);
          throw error;
      }
  }

  async sendQuery(text, systemPrompt, domDelayMs = 1000) {
    // Basic queueing if multiple requests come in, though for this app single user is assumed
    if (this.activeRequest) {
      console.log('⚠️  Request already in progress, waiting...');
      try {
          await this.activeRequest;
      } catch (e) { /* ignore previous error */ }
    }

    const requestPromise = (async () => {
      try {
        if (!this.isInitialized || !this.page) {
             const success = await this.initialize();
             if (!success) throw new Error("Could not initialize browser");
        }

        console.log('\n🚀 Sending query to Gemini...');
        const inputSel = 'textarea, div[role="textbox"]';

        await this.page.waitForSelector(inputSel, { visible: true, timeout: 15000 });
        await this.page.bringToFront();
        await this.delay(500);

        // Clear existing text
        await this.page.click(inputSel);
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('A');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');
        await this.delay(500);

        const fullPrompt = systemPrompt ? (systemPrompt + '\n\n' + text) : text;

        await this.page.evaluate(
          (selector, textContent) => {
            const element = document.querySelector(selector);
            if (element) {
                // Simulate typing/input event
                element.textContent = textContent; 
                // For some rich text editors, we might need to be more careful, strictly speaking
                // but setting textContent often works if we trigger input
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
          },
          inputSel,
          fullPrompt
        );

        await this.delay(1000);
        await this.page.keyboard.press('Enter');
        console.log('✓ Query sent, waiting for response...');

        const response = await this.waitForResponse(180000, domDelayMs);
        return response;

      } catch (error) {
        console.error(`❌ Request failed:`, error.message);
        throw error;
      }
    })();

    this.activeRequest = requestPromise;
    try {
        const res = await requestPromise;
        // Cool down
        await this.delay(2000);
        return res;
    } finally {
        this.activeRequest = null;
    }
  }

  // Initialize a separate page for image generation (doesn't block images)
  async initializeImagePage() {
    if (this.isImagePageInitialized && this.imagePage) {
      try {
        if (this.browser && this.browser.isConnected()) {
          return true;
        }
      } catch (e) {
        this.isImagePageInitialized = false;
      }
    }

    try {
      // Make sure browser is initialized first
      if (!this.browser || !this.browser.isConnected()) {
        await this.initialize();
      }

      console.log('🖼️ Creating image generation page...');
      this.imagePage = await this.browser.newPage();

      // Mask webdriver
      await this.imagePage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });

      // DO NOT block images on this page!
      // No request interception for image page

      console.log('Navigating to Gemini for image generation...');
      await this.imagePage.goto('https://gemini.google.com/app', {
        waitUntil: 'networkidle2',
      });

      // Check login status
      const isLoggedIn = (await this.imagePage.$('textarea, div[role="textbox"]')) !== null;

      if (!isLoggedIn) {
        console.log('⚠️ Not logged in on image page, waiting...');
        await this.imagePage.waitForSelector('textarea, div[role="textbox"]', { timeout: 300000 });
      }

      this.isImagePageInitialized = true;
      console.log('✓ Image page initialized successfully\n');
      return true;
    } catch (error) {
      console.error('Failed to initialize image page:', error.message);
      return false;
    }
  }

  // Download image from URL and save locally
  async downloadImage(imageUrl, filename) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    const filePath = path.join(this.uploadsDir, filename);
    const protocol = imageUrl.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      protocol.get(imageUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          file.close();
          fs.unlinkSync(filePath);
          return this.downloadImage(redirectUrl, filename).then(resolve).catch(reject);
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(`/uploads/media/${filename}`);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    });
  }

  // Generate an image using Gemini and save it locally
  async generateImage(imagePrompt, topic) {
    try {
      if (!this.isImagePageInitialized || !this.imagePage) {
        const success = await this.initializeImagePage();
        if (!success) throw new Error("Could not initialize image page");
      }

      console.log('\n🎨 Generating image with Gemini...');
      console.log('📝 Prompt:', imagePrompt.substring(0, 100) + '...');

      const inputSel = 'textarea, div[role="textbox"]';

      await this.imagePage.waitForSelector(inputSel, { visible: true, timeout: 15000 });
      await this.imagePage.bringToFront();
      await this.delay(500);

      // Clear existing text
      await this.imagePage.click(inputSel);
      await this.imagePage.keyboard.down('Control');
      await this.imagePage.keyboard.press('A');
      await this.imagePage.keyboard.up('Control');
      await this.imagePage.keyboard.press('Backspace');
      await this.delay(500);

      // Set the image generation prompt
      await this.imagePage.evaluate(
        (selector, textContent) => {
          const element = document.querySelector(selector);
          if (element) {
            element.textContent = textContent;
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        inputSel,
        imagePrompt
      );

      await this.delay(1000);
      await this.imagePage.keyboard.press('Enter');
      console.log('✓ Image prompt sent, waiting for generation...');

      // Wait for image to be generated (look for img elements in the response)
      await this.delay(5000); // Initial wait for generation to start
      
      // Wait for the response to complete and find generated images
      const imageResult = await this.imagePage.evaluate((maxWaitMs) => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          
          const checkForImage = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed >= maxWaitMs) {
              resolve({ success: false, error: 'Timeout waiting for image' });
              return;
            }

            // Look for generated images in the latest message
            const messages = document.querySelectorAll('message-content');
            if (messages.length === 0) {
              setTimeout(checkForImage, 1000);
              return;
            }
            
            const lastMessage = messages[messages.length - 1];
            
            // Look for images in the response
            const images = lastMessage.querySelectorAll('img');
            
            for (const img of images) {
              const src = img.src || '';
              // Filter out UI icons and look for actual generated images
              if (src && !src.includes('icon') && !src.includes('avatar') && 
                  !src.includes('logo') && (src.includes('blob:') || src.includes('googleusercontent') || 
                  src.includes('data:image') || img.width > 200)) {
                resolve({ 
                  success: true, 
                  imageUrl: src,
                  alt: img.alt || '',
                  width: img.naturalWidth || img.width,
                  height: img.naturalHeight || img.height
                });
                return;
              }
            }

            // Also check for images that might be in a canvas or special container
            const canvasImages = lastMessage.querySelectorAll('canvas, [data-image-url], .generated-image img');
            for (const el of canvasImages) {
              const dataUrl = el.getAttribute('data-image-url') || el.querySelector('img')?.src;
              if (dataUrl) {
                resolve({ success: true, imageUrl: dataUrl });
                return;
              }
            }

            // Check if still loading
            const loadingIndicators = document.querySelectorAll('.loading, [aria-label*="loading"], .spinner');
            const isLoading = loadingIndicators.length > 0;
            
            if (isLoading || elapsed < 30000) {
              // Keep waiting if still loading or within 30 seconds
              setTimeout(checkForImage, 2000);
            } else {
              // Check for any image one more time with broader criteria
              const anyImages = lastMessage.querySelectorAll('img[src*="http"], img[src*="blob:"], img[src*="data:"]');
              if (anyImages.length > 0) {
                const bestImg = Array.from(anyImages).find(img => img.width > 100) || anyImages[0];
                resolve({ success: true, imageUrl: bestImg.src });
                return;
              }
              resolve({ success: false, error: 'No image found in response' });
            }
          };

          setTimeout(checkForImage, 3000); // Start checking after 3 seconds
        });
      }, 120000); // 2 minute timeout

      if (!imageResult.success) {
        console.error('❌ Image generation failed:', imageResult.error);
        throw new Error(imageResult.error || 'Failed to generate image');
      }

      console.log('✓ Image found! Taking screenshot of the image element...');

      // Take a screenshot of the image element directly - most reliable method
      let localImagePath;
      const timestamp = Date.now();
      const safeTopicName = topic.replace(/[^a-z0-9]/gi, '-').substring(0, 30);
      const filename = `gemini-${safeTopicName}-${timestamp}.png`;
      const filePath = path.join(this.uploadsDir, filename);
      
      // Ensure directory exists
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }

      // Find the image element and screenshot it directly
      console.log('📸 Screenshotting image element...');
      const screenshotSuccess = await this.imagePage.evaluate(async () => {
        const messages = document.querySelectorAll('message-content');
        if (messages.length === 0) return { success: false, error: 'No messages' };
        
        const lastMessage = messages[messages.length - 1];
        const images = lastMessage.querySelectorAll('img');
        
        for (const img of images) {
          const src = img.src || '';
          if (src && !src.includes('icon') && !src.includes('avatar') && 
              !src.includes('logo') && img.width > 200) {
            // Scroll to the image to ensure it's in view
            img.scrollIntoView({ behavior: 'instant', block: 'center' });
            // Mark this image for screenshot
            img.setAttribute('data-screenshot-target', 'true');
            return { success: true };
          }
        }
        return { success: false, error: 'No suitable image found' };
      });

      if (!screenshotSuccess.success) {
        throw new Error(screenshotSuccess.error || 'Could not find image to screenshot');
      }

      await this.delay(500); // Wait for scroll to complete

      // Take screenshot of the marked image element
      const imageElement = await this.imagePage.$('img[data-screenshot-target="true"]');
      if (imageElement) {
        await imageElement.screenshot({ path: filePath, type: 'png' });
        localImagePath = `/uploads/media/${filename}`;
        console.log('✓ Image screenshot saved to:', localImagePath);
        
        // Clean up the attribute
        await this.imagePage.evaluate(() => {
          const img = document.querySelector('img[data-screenshot-target="true"]');
          if (img) img.removeAttribute('data-screenshot-target');
        });
      } else {
        throw new Error('Could not locate image element for screenshot');
      }

      // Cool down
      await this.delay(2000);

      return {
        success: true,
        url: localImagePath,
        alt: imageResult.alt || `Generated image for ${topic}`,
        caption: `AI-generated illustration for ${topic}`,
        type: 'hero'
      };

    } catch (error) {
      console.error('❌ Image generation failed:', error.message);
      throw error;
    }
  }
}

// Ensure global singleton - recreate if methods are missing (hot reload safety)
if (!global.geminiInstance || typeof global.geminiInstance.generateImage !== 'function') {
    console.log('🔄 Creating new GeminiAutomation instance...');
    global.geminiInstance = new GeminiAutomation();
}

export default global.geminiInstance;
