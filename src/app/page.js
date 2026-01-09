"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Search, FileText, Check, Settings2, Sparkles, ArrowLeft, Download, Edit3, Wand2, Image as ImageIcon, Copy, X } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import BlogEditor from '@/components/BlogEditor';

/**
 * Converts modern CSS color functions (lab, oklch, oklab, lch) to RGB
 * This fixes html2canvas compatibility issues with Tailwind CSS v4
 */
function convertModernColorsToRGB(element) {
  const clone = element.cloneNode(true);
  
  // Get all elements including the clone itself
  const allElements = [clone, ...clone.querySelectorAll('*')];
  
  allElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const stylesToCheck = [
      'color', 'backgroundColor', 'borderColor', 
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'textDecorationColor', 'boxShadow'
    ];
    
    stylesToCheck.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (value && /\b(lab|oklch|oklab|lch)\s*\(/i.test(value)) {
        // Create a temporary element to compute the RGB value
        const temp = document.createElement('div');
        temp.style.color = value;
        document.body.appendChild(temp);
        const rgbValue = window.getComputedStyle(temp).color;
        document.body.removeChild(temp);
        
        // Apply the converted RGB value
        el.style[prop] = rgbValue;
      }
    });
    
    // Also handle CSS custom properties that might use modern colors
    const inlineStyle = el.getAttribute('style') || '';
    if (/\b(lab|oklch|oklab|lch)\s*\(/i.test(inlineStyle)) {
      el.setAttribute('style', inlineStyle.replace(
        /\b(lab|oklch|oklab|lch)\s*\([^)]+\)/gi,
        'rgb(128, 128, 128)' // Fallback gray
      ));
    }
  });
  
  return clone;
}

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-slate-200 bg-slate-50 rounded-t-lg sticky top-0 z-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200' : ''}`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200' : ''}`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200' : ''}`}
      >
        List
      </button>
    </div>
  );
};

// LocalStorage keys
const STORAGE_KEYS = {
  NICHE: 'blog_automation_niche',
  TOPICS: 'blog_automation_topics',
  SELECTED_TOPIC: 'blog_automation_selected_topic',
  CONFIG: 'blog_automation_config',
  BLOG_CONTENT: 'blog_automation_blog_content',
  DIRECT_MODE: 'blog_automation_direct_mode',
  CUSTOM_TOPIC: 'blog_automation_custom_topic',
  USE_ADVANCED_EDITOR: 'blog_automation_use_advanced_editor',
};

// Helper to safely get from localStorage
const getFromStorage = (key, defaultValue) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper to safely save to localStorage
const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export default function Dashboard() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [config, setConfig] = useState({
    wordCount: 1500,
    tone: "Professional",
  });
  const [blogContent, setBlogContent] = useState(null);
  
  // Direct topic input mode
  const [directMode, setDirectMode] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const editorRef = useRef(null);
  
  // Enhancement states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementProgress, setEnhancementProgress] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [autoEnhance, setAutoEnhance] = useState(true);
  
  // Image prompt state
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
  // Humanize state
  const [isHumanizing, setIsHumanizing] = useState(false);

  // Load data from localStorage on mount (client-side only)
  useEffect(() => {
    setNiche(getFromStorage(STORAGE_KEYS.NICHE, ""));
    setTopics(getFromStorage(STORAGE_KEYS.TOPICS, []));
    setSelectedTopic(getFromStorage(STORAGE_KEYS.SELECTED_TOPIC, null));
    setConfig(getFromStorage(STORAGE_KEYS.CONFIG, { wordCount: 1500, tone: "Professional" }));
    setBlogContent(getFromStorage(STORAGE_KEYS.BLOG_CONTENT, null));
    setDirectMode(getFromStorage(STORAGE_KEYS.DIRECT_MODE, false));
    setCustomTopic(getFromStorage(STORAGE_KEYS.CUSTOM_TOPIC, ""));
    setUseAdvancedEditor(getFromStorage(STORAGE_KEYS.USE_ADVANCED_EDITOR, false));
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.NICHE, niche);
  }, [niche, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
  }, [topics, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.SELECTED_TOPIC, selectedTopic);
  }, [selectedTopic, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.CONFIG, config);
  }, [config, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.BLOG_CONTENT, blogContent);
  }, [blogContent, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.DIRECT_MODE, directMode);
  }, [directMode, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.CUSTOM_TOPIC, customTopic);
  }, [customTopic, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(STORAGE_KEYS.USE_ADVANCED_EDITOR, useAdvancedEditor);
  }, [useAdvancedEditor, isHydrated]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
    ],
    content: blogContent || '<p>Generated content will appear here...</p>',
    editorProps: {
        attributes: {
            class: 'focus:outline-none min-h-125',
        },
    },
    onUpdate: ({ editor }) => {
        // Optional: Update state if needed for export later
        // setBlogContent(editor.getHTML());
    }
  });

  // Effect to update editor content when blogContent changes
  if (editor && blogContent && editor.getHTML() !== blogContent) {
      editor.commands.setContent(blogContent);
  }

  // Auto-enhance blog with AI-generated images
  const enhanceBlogWithImages = async (content, topic) => {
    setIsEnhancing(true);
    setEnhancementProgress('Analyzing blog structure...');
    
    try {
      // Step 1: Generate image suggestions
      setEnhancementProgress('Generating image suggestions...');
      console.log('🎨 Calling generate-images API...');
      
      const imageRes = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          blogContent: content,
          topic: topic,
          imageCount: 1
        }),
      });
      
      const imageData = await imageRes.json();
      console.log('📸 Image API Response:', imageData);
      
      // Check for errors or missing images
      if (imageData.error) {
        console.error('Image API Error:', imageData.error);
        setEnhancementProgress('Failed to generate images: ' + imageData.error);
        return content;
      }
      
      if (!imageData.images || imageData.images.length === 0) {
        console.log('No images returned from API');
        setEnhancementProgress('No images generated');
        return content;
      }
      
      setGeneratedImages(imageData.images);
      setEnhancementProgress(`Inserting ${imageData.images.length} images...`);
      console.log(`📍 Inserting ${imageData.images.length} images into content...`);
      
      // Step 2: Insert images into the content
      let enhancedContent = content;
      let imagesInserted = 0;
      
      // Insert ONLY one hero image right below the title (after h1)
      const heroImage = imageData.images[0]; // Use the first (and only) image
      if (heroImage) {
        const imageHtml = createImageHtml(heroImage);
        // Insert after first </h1>
        if (enhancedContent.includes('</h1>')) {
          enhancedContent = enhancedContent.replace(
            /<\/h1>/i,
            `</h1>\n${imageHtml}`
          );
          imagesInserted++;
          console.log('✅ Hero image inserted after H1 (single image only)');
        }
      }
      
      // Remove placeholder comments
      enhancedContent = enhancedContent.replace(/<!--\s*IMAGE_PLACEHOLDER:[^>]*-->/gi, '');
      
      console.log(`🎉 Total images inserted: ${imagesInserted}`);
      setEnhancementProgress(`Enhancement complete! ${imagesInserted} images added.`);
      
      return enhancedContent;
      
    } catch (error) {
      console.error('Enhancement failed:', error);
      setEnhancementProgress('Enhancement failed, using original content');
      return content;
    } finally {
      setTimeout(() => {
        setIsEnhancing(false);
        setEnhancementProgress('');
      }, 2000);
    }
  };
  
  // Helper to create image HTML
  const createImageHtml = (imageData) => {
    return `
      <figure class="my-8 text-center">
        <img 
          src="${imageData.url}" 
          alt="${imageData.alt || ''}" 
          class="w-full max-w-2xl mx-auto rounded-xl shadow-lg"
          loading="lazy"
        />
        ${imageData.caption ? `<figcaption class="mt-3 text-sm text-gray-600 italic">${imageData.caption}</figcaption>` : ''}
      </figure>
    `.trim();
  };

  const handleResearch = async (overrideNiche) => {
    const searchNiche = typeof overrideNiche === 'string' ? overrideNiche : niche;
    if (!searchNiche) return;
    setLoading(true);
    setTopics([]);
    setSelectedTopic(null);
    setBlogContent(null);

    try {
      const res = await fetch("/api/research-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: searchNiche }),
      });
      const data = await res.json();
      if (data.topics) {
        setTopics(data.topics);
      } else {
        alert("Failed to fetch topics: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenLoading(true);
    try {
        const res = await fetch("/api/generate-blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                topic: selectedTopic,
                wordCount: config.wordCount,
                tone: config.tone
            }),
        });
        const data = await res.json();
        
        if (data.content) {
            let finalContent = data.content;
            
            // Auto-enhance with images if enabled
            if (autoEnhance) {
              finalContent = await enhanceBlogWithImages(data.content, selectedTopic);
            }
            
            setBlogContent(finalContent);
            setCurrentPostId('new');
        } else {
            alert("Failed to generate blog: " + (data.error || "Unknown error"));
        }
    } catch (e) {
        alert("Error generating blog: " + e.message);
    } finally {
        setGenLoading(false);
    }
  };

  // Handle direct topic generation (skip topic research)
  const handleDirectGenerate = async () => {
    if (!customTopic.trim()) return;
    
    setSelectedTopic(customTopic.trim());
    setGenLoading(true);
    
    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: customTopic.trim(),
          wordCount: config.wordCount,
          tone: config.tone
        }),
      });
      const data = await res.json();
      
      if (data.content) {
        let finalContent = data.content;
        
        // Auto-enhance with images if enabled
        if (autoEnhance) {
          finalContent = await enhanceBlogWithImages(data.content, customTopic.trim());
        }
        
        setBlogContent(finalContent);
        setCurrentPostId('new');
      } else {
        alert("Failed to generate blog: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error generating blog: " + e.message);
    } finally {
      setGenLoading(false);
    }
  };
  
  // Manual enhancement trigger
  const handleManualEnhance = async () => {
    if (!blogContent) {
      alert('No blog content to enhance');
      return;
    }
    
    const topicToUse = selectedTopic || customTopic || 'Blog post';
    console.log('🔧 Manual enhancement triggered for topic:', topicToUse);
    
    const enhancedContent = await enhanceBlogWithImages(blogContent, topicToUse);
    
    if (enhancedContent !== blogContent) {
      setBlogContent(enhancedContent);
      console.log('✅ Blog content updated with images');
    } else {
      console.log('⚠️ No changes made to content');
    }
  };
  
  // Generate image prompt for user to use manually
  const handleGenerateImagePrompt = async () => {
    if (!blogContent) {
      alert('Generate a blog first before creating an image prompt');
      return;
    }
    
    const topicToUse = selectedTopic || customTopic || 'Blog post';
    setIsGeneratingPrompt(true);
    setImagePrompt('');
    
    try {
      const res = await fetch('/api/generate-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogContent: blogContent,
          topic: topicToUse
        }),
      });
      
      const data = await res.json();
      
      if (data.success && data.prompt) {
        setImagePrompt(data.prompt);
        console.log('✅ Image prompt generated successfully');
      } else {
        alert('Failed to generate image prompt: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating image prompt:', error);
      alert('Error generating image prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };
  
  // Humanize blog content - remove AI patterns
  const handleHumanize = async () => {
    if (!blogContent) {
      alert('No blog content to humanize');
      return;
    }
    
    setIsHumanizing(true);
    
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: blogContent }),
      });
      
      const data = await res.json();
      
      if (data.success && data.content) {
        setBlogContent(data.content);
        if (editor) {
          editor.commands.setContent(data.content);
        }
        console.log(`✅ Blog humanized! Removed ${data.stats.removedCharacters} characters (${data.stats.reductionPercent}%)`);
      } else {
        alert('Failed to humanize content: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error humanizing content:', error);
      alert('Error humanizing content');
    } finally {
      setIsHumanizing(false);
    }
  };
  
  // Copy image prompt to clipboard
  const handleCopyPrompt = () => {
    if (imagePrompt) {
      navigator.clipboard.writeText(imagePrompt);
      alert('Image prompt copied to clipboard!');
    }
  };

  const handleDownloadPDF = async () => {
    if (!editorRef.current) return;

    try {
        const element = editorRef.current;
        
        // Clone and convert modern CSS colors (lab, oklch, etc.) to RGB for html2canvas compatibility
        const clonedElement = convertModernColorsToRGB(element);
        clonedElement.style.position = 'absolute';
        clonedElement.style.left = '-9999px';
        clonedElement.style.top = '0';
        clonedElement.style.width = element.offsetWidth + 'px';
        document.body.appendChild(clonedElement);
        
        const canvas = await html2canvas(clonedElement, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        
        // Clean up the cloned element
        document.body.removeChild(clonedElement);
        
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add Header
        pdf.setFontSize(20);
        pdf.setTextColor(40, 40, 40);
        pdf.text("AI Generated Blog", 105, 20, { align: "center" });
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Topic: ${selectedTopic || "Untitled"}`, 105, 28, { align: "center" });
        
        // Add Content Image
        pdf.addImage(imgData, 'PNG', 0, 40, imgWidth, imgHeight);
        
        pdf.save(`${selectedTopic ? selectedTopic.substring(0, 30) : 'blog-post'}.pdf`);
    } catch (error) {
        console.error("PDF Export Error:", error);
        alert("Failed to export PDF");
    }
  };

  const handleSave = async (data) => {
    console.log('Blog saved:', data);
    // Handle post-save actions
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Blog Automation</h1>
              <p className="text-slate-500">Research topics, generate content, and create SEO-optimized blogs.</p>
            </div>
          </div>
          
          {blogContent && (
            <button
              onClick={() => setUseAdvancedEditor(!useAdvancedEditor)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                useAdvancedEditor
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {useAdvancedEditor ? 'Advanced Editor Active' : 'Use Advanced Editor'}
            </button>
          )}
        </header>

        {/* Phase 4: Editor View (Shows when content exists) */}
        {blogContent && useAdvancedEditor ? (
          <section className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => {
                  setBlogContent(null);
                  setUseAdvancedEditor(false);
                }}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Research
              </button>
            </div>

            <BlogEditor
              initialContent={blogContent}
              initialMetadata={{
                metaTitle: selectedTopic || '',
                metaDescription: '',
                focusKeyword: '',
                slug: '',
              }}
              postId={currentPostId}
              onSave={handleSave}
            />
          </section>
        ) : blogContent ? (
          <section className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setBlogContent(null)}
                  className="text-slate-500 hover:text-slate-900 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Research
                </button>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Generated successfully
                  </span>
                  <button 
                    onClick={handleHumanize}
                    disabled={isHumanizing}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    title="Remove AI-style patterns like ___, ---, and robotic phrases"
                  >
                    {isHumanizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isHumanizing ? 'Humanizing...' : 'Humanize'}
                  </button>
                  <button 
                    onClick={handleGenerateImagePrompt}
                    disabled={isGeneratingPrompt}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    title="Generate a detailed image prompt for this blog"
                  >
                    {isGeneratingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {isGeneratingPrompt ? 'Generating...' : 'Get Image Prompt'}
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>
              
              {/* Enhancement Progress Bar */}
              {(isEnhancing || enhancementProgress) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="animate-pulse">
                    <Wand2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700">{enhancementProgress}</p>
                    <p className="text-xs text-blue-600">AI is generating and inserting relevant images...</p>
                  </div>
                </div>
              )}
              
              {/* Image Prompt Display */}
              {imagePrompt && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-amber-800">Image Generation Prompt</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyPrompt}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-4 h-4" /> Copy Prompt
                      </button>
                      <button
                        onClick={() => setImagePrompt('')}
                        className="text-amber-600 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{imagePrompt}</p>
                  </div>
                  <p className="text-xs text-amber-700">
                    💡 Copy this prompt and paste it into Gemini, DALL-E, Midjourney, or any AI image generator to create your hero image.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <MenuBar editor={editor} />
                <div ref={editorRef} className="p-12 min-h-200 prose prose-slate max-w-none bg-white">
                  <EditorContent editor={editor} />
                </div>
              </div>
          </section>
        ) : (
          <>
            {/* Phase 1: Research or Direct Input */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-sm font-bold text-slate-700">1</span>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {directMode ? 'Direct Topic Input' : 'Topic Research'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setDirectMode(!directMode);
                    setTopics([]);
                    setSelectedTopic(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {directMode ? (
                    <><Search className="w-4 h-4" /> Switch to Topic Research</>
                  ) : (
                    <><Edit3 className="w-4 h-4" /> Enter Topic Directly</>
                  )}
                </button>
              </div>
              
              {directMode ? (
                /* Direct Topic Input Mode */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                    <p className="text-sm text-slate-600 mb-4">
                      <strong>💡 Pro Tip:</strong> Enter your exact blog topic and we'll generate a complete blog post for you. Be specific for better results!
                    </p>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        placeholder="Enter your blog topic (e.g., 'How to Fix WebView Loading Issues in Android')" 
                        className="flex-1 px-4 py-3 outline-none text-slate-700 placeholder:text-slate-400 bg-white rounded-lg border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !genLoading && customTopic.trim() && handleDirectGenerate()}
                      />
                    </div>
                    
                    {/* Quick Config for Direct Mode */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Word Count</label>
                        <select 
                          value={config.wordCount}
                          onChange={(e) => setConfig({...config, wordCount: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-purple-400 bg-white"
                        >
                          <option value="1000">Short (1000)</option>
                          <option value="1500">Standard (1500)</option>
                          <option value="2500">In-depth (2500+)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Tone</label>
                        <select 
                          value={config.tone}
                          onChange={(e) => setConfig({...config, tone: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-purple-400 bg-white"
                        >
                          <option value="Professional">Professional</option>
                          <option value="Casual">Casual</option>
                          <option value="Humorous">Humorous</option>
                          <option value="Authoritative">Authoritative</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Auto Images</label>
                        <button
                          onClick={() => setAutoEnhance(!autoEnhance)}
                          className={`w-full p-2 border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                            autoEnhance 
                              ? 'bg-green-50 border-green-300 text-green-700' 
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4" />
                          {autoEnhance ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                      <div className="flex items-end">
                        <button 
                          onClick={handleDirectGenerate}
                          disabled={genLoading || !customTopic.trim()}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {genLoading ? "Generating..." : "Generate Blog"}
                        </button>
                      </div>
                    </div>
                    
                    {/* Enhancement Progress */}
                    {(isEnhancing || enhancementProgress) && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                        <Wand2 className="w-5 h-5 text-blue-600 animate-pulse" />
                        <span className="text-sm text-blue-700 font-medium">{enhancementProgress}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Example Topics */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-slate-500">Try:</span>
                    {[
                      "How to Integrate Stripe Payments in Next.js",
                      "Fix Docker Container Memory Issues",
                      "React useEffect Best Practices 2025"
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomTopic(example)}
                        className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Topic Research Mode */
                <>
                  <div className="flex gap-4 max-w-2xl bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <input 
                      type="text" 
                      placeholder="Enter your blog niche (e.g., 'Digital Marketing for Beginners')" 
                      className="flex-1 px-4 py-3 outline-none text-slate-700 placeholder:text-slate-400"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                    />
                    <button 
                      onClick={() => handleResearch()} 
                      disabled={loading || !niche}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {loading ? "Researching..." : "Find Topics"}
                    </button>
                  </div>
                  
                  <div className="flex justify-start">
                      <button
                        onClick={() => {
                            const techNiche = "Artificial Intelligence, Technology, Computer Science trends";
                            setNiche(techNiche);
                            handleResearch(techNiche);
                        }}
                        disabled={loading}
                        className="text-sm text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                        Auto-suggest AI & Tech Topics
                      </button>
                  </div>
                </>
              )}
            </section>

            {/* Results Grid */}
            {topics.length > 0 && (
              <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-sm font-bold text-slate-700">2</span>
                  <h2 className="text-lg font-semibold text-slate-800">Select a Trending Topic</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topics.map((topic, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedTopic(topic)}
                      className={`
                        group relative p-5 rounded-xl border cursor-pointer transition-all duration-200
                        ${selectedTopic === topic 
                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-md" 
                          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="p-2 bg-slate-100 w-fit rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FileText className={`w-5 h-5 ${selectedTopic === topic ? "text-blue-600" : "text-slate-500"}`} />
                          </div>
                          <h3 className="font-medium text-slate-900 leading-snug">
                            {typeof topic === 'string' ? topic : (topic?.topic || topic?.title || JSON.stringify(topic))}
                          </h3>
                        </div>
                        {selectedTopic === topic && (
                          <div className="bg-blue-600 rounded-full p-1 text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Phase 2: Configuration */}
            {selectedTopic && (
              <section className="space-y-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-sm font-bold text-slate-700">3</span>
                  <h2 className="text-lg font-semibold text-slate-800">Configuration</h2>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-3xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Word Count</label>
                      <select 
                        value={config.wordCount}
                        onChange={(e) => setConfig({...config, wordCount: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="1000">Short (1000 words)</option>
                        <option value="1500">Standard (1500 words)</option>
                        <option value="2500">Indepth (2500+ words)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Tone</label>
                      <select 
                        value={config.tone}
                        onChange={(e) => setConfig({...config, tone: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Casual">Casual & Friendly</option>
                        <option value="Humorous">Humorous</option>
                        <option value="Authoritative">Authoritative</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Auto-Enhance with Images</label>
                      <button
                        onClick={() => setAutoEnhance(!autoEnhance)}
                        className={`w-full p-2.5 border rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                          autoEnhance 
                            ? 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100' 
                            : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Wand2 className="w-4 h-4" />
                        {autoEnhance ? 'AI Images Enabled' : 'AI Images Disabled'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Enhancement Progress */}
                  {(isEnhancing || enhancementProgress) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                      <div className="animate-spin">
                        <Wand2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm text-blue-700 font-medium">{enhancementProgress}</span>
                        <p className="text-xs text-blue-600 mt-0.5">AI is generating and inserting images into your blog...</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleGenerate}
                      disabled={genLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-medium transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                      {genLoading ? "Generating Blog..." : "Generate Blog Post"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
