import puppeteer from 'puppeteer';
import path from 'path';

// Singleton to hold the browser instance across hot reloads in dev
let globalBrowserInstance = global.geminiInstance || null;

class GeminiAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
    // Store session in the project root/session
    this.userDataDir = path.resolve(process.cwd(), 'session-data');
    // Default to false (visible) so user can see what's happening and login
    this.headless = false; 
    this.activeRequest = null;
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
}

// Ensure global singleton
if (!global.geminiInstance) {
    global.geminiInstance = new GeminiAutomation();
}

export default global.geminiInstance;
