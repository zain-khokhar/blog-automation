"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Link } from '@tiptap/extension-link';
import ImageEnhanced from '@/lib/tiptap-extensions/ImageEnhanced';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import VideoEnhanced from '@/lib/tiptap-extensions/VideoEnhanced';
import Audio from '@/lib/tiptap-extensions/Audio';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Typography } from '@tiptap/extension-typography';
import { Underline } from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';
import FontSize from '@/lib/tiptap-extensions/FontSize';
import LineHeight from '@/lib/tiptap-extensions/LineHeight';
import LetterSpacing from '@/lib/tiptap-extensions/LetterSpacing';
import Indent from '@/lib/tiptap-extensions/Indent';
import Anchor from '@/lib/tiptap-extensions/Anchor';
import TableOfContents from '@/lib/tiptap-extensions/TableOfContents';
import Footnote from '@/lib/tiptap-extensions/Footnote';
import Math from '@/lib/tiptap-extensions/Math';
import HtmlEmbed from '@/lib/tiptap-extensions/HtmlEmbed';
import Button from '@/lib/tiptap-extensions/Button';
import Details, { Summary } from '@/lib/tiptap-extensions/Details';
import Social from '@/lib/tiptap-extensions/Social';
import Poll from '@/lib/tiptap-extensions/Poll';
import Tabs, { TabItem } from '@/lib/tiptap-extensions/Tabs';

import { useEffect, useState, useCallback, useRef } from 'react';
import EditorToolbar from './editor/EditorToolbar';
import MediaUploader from './editor/MediaUploader';
import SEOPanel from './editor/SEOPanel';
import { calculateSEOScore, calculateReadability, generateSlug } from '@/utils/seo';
import { Wand2, Loader2, Image as ImageIcon } from 'lucide-react';

const lowlight = createLowlight(common);

export default function BlogEditor({ initialContent, initialMetadata, postId, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [metadata, setMetadata] = useState(initialMetadata || {
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    slug: '',
  });
  const [seoScore, setSeoScore] = useState(0);
  const [readability, setReadability] = useState(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementProgress, setEnhancementProgress] = useState('');
  const saveTimeoutRef = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block
      }),
      TextStyle,
      FontSize,
      LineHeight,
      LetterSpacing,
      Indent,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Subscript,
      Superscript,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      ImageEnhanced.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-slate-900 text-white p-4 rounded-lg my-4 overflow-x-auto',
        },
      }),
      VideoEnhanced,
      Audio,
      Anchor,
      TableOfContents,
      Footnote,
      Math,
      HtmlEmbed,
      Button,
      Details,
      Summary,
      Social,
      Poll,
      Tabs,
      TabItem,
      Placeholder.configure({
        placeholder: 'Start writing your content here...',
      }),
      Typography,
    ],
    content: initialContent || '<p>Start writing your amazing blog post...</p>',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-150 px-12 py-8 prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-base prose-a:text-blue-600 prose-img:rounded-lg',
      },
    },
    onUpdate: ({ editor }) => {
      // Trigger auto-save with debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(editor);
      }, 3000); // Auto-save after 3 seconds of inactivity
    },
  });

  // Auto-save function
  const handleAutoSave = useCallback(async (editorInstance) => {
    if (!editorInstance || !postId) return;

    setIsSaving(true);

    try {
      const content = editorInstance.getJSON();
      const htmlContent = editorInstance.getHTML();
      const textContent = editorInstance.getText();

      // Calculate SEO metrics
      const score = calculateSEOScore(textContent, {
        ...metadata,
        htmlContent,
      });
      setSeoScore(score);

      const readabilityScores = calculateReadability(textContent);
      setReadability(readabilityScores);

      // Save to database
      const response = await fetch('/api/blog-post/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content,
          htmlContent,
          metadata,
          seoScore: score,
          readabilityScore: readabilityScores.fleschReadingEase,
          wordCount: textContent.split(/\s+/).length,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        if (onSave) {
          onSave({ content, htmlContent, metadata, seoScore: score });
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [metadata, postId, onSave]);

  // Update metadata handlers
  const updateMetadata = useCallback((key, value) => {
    setMetadata(prev => {
      const updated = { ...prev, [key]: value };
      
      // Auto-generate slug from title if title is updated
      if (key === 'metaTitle' && !prev.slug) {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
  }, []);

  // Handle AI enhancement from toolbar
  const handleAIEnhance = useCallback((type, data) => {
    if (type === 'meta' && data) {
      if (data.metaTitle) updateMetadata('metaTitle', data.metaTitle);
      if (data.metaDescription) updateMetadata('metaDescription', data.metaDescription);
      setShowSEOPanel(true); // Show SEO panel to display the generated meta
    }
  }, [updateMetadata]);

  // Generate and insert AI images
  const handleGenerateImages = useCallback(async () => {
    if (!editor) return;
    
    setIsEnhancing(true);
    setEnhancementProgress('Analyzing content for image placement...');
    
    try {
      const content = editor.getHTML();
      const topic = metadata.metaTitle || 'Blog post';
      
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogContent: content,
          topic: topic,
          imageCount: 1,
        }),
      });
      
      const data = await res.json();
      
      if (data.success && data.images?.length) {
        setEnhancementProgress('Inserting hero image...');
        
        // Insert ONLY ONE image right below the title
        let updatedContent = content;
        const heroImage = data.images[0]; // Use only the first (and only) image
        
        const imageHtml = `
          <figure class="my-8 text-center">
            <img src="${heroImage.url}" alt="${heroImage.alt || ''}" class="w-full max-w-2xl mx-auto rounded-xl shadow-lg" />
            ${heroImage.caption ? `<figcaption class="mt-3 text-sm text-gray-600 italic">${heroImage.caption}</figcaption>` : ''}
          </figure>
        `;
        
        // Insert after h1 only
        updatedContent = updatedContent.replace(/<\/h1>/i, `</h1>${imageHtml}`);
        
        editor.commands.setContent(updatedContent);
        setEnhancementProgress('Hero image added successfully!');
      } else {
        setEnhancementProgress('No images generated');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      setEnhancementProgress('Failed to generate images');
    } finally {
      setTimeout(() => {
        setIsEnhancing(false);
        setEnhancementProgress('');
      }, 2000);
    }
  }, [editor, metadata.metaTitle]);

  // Handle media insertion
  const handleMediaInsert = useCallback((url, type, options = {}) => {
    if (!editor) return;

    if (type === 'image') {
      editor.chain().focus().setImage({ 
        src: url,
        alt: options.altText || '',
        caption: options.caption || '',
        align: options.align || 'left',
        width: options.width || null,
      }).run();
    } else if (type === 'video') {
      // Detect video type from URL
      let videoType = 'youtube';
      if (url.includes('vimeo.com')) {
        videoType = 'vimeo';
      } else if (url.endsWith('.mp4') || url.endsWith('.webm')) {
        videoType = 'mp4';
      }

      editor.chain().focus().setVideo({ 
        src: url,
        type: videoType,
      }).run();
    } else if (type === 'audio') {
      editor.chain().focus().setAudio({
        src: url,
        title: options.title || 'Audio file',
      }).run();
    }

    setShowMediaUploader(false);
  }, [editor]);

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const seconds = Math.floor((new Date() - lastSaved) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  if (!editor) {
    return <div className="flex items-center justify-center min-h-150">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Loading editor...</p>
      </div>
    </div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Editor Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-700">Blog Editor</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isSaving ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Saved {formatLastSaved()}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateImages}
            disabled={isEnhancing}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isEnhancing
                ? 'bg-purple-100 text-purple-600 cursor-wait'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
            }`}
          >
            {isEnhancing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            {isEnhancing ? 'Generating...' : 'Add AI Images'}
          </button>
          <button
            onClick={() => setShowSEOPanel(!showSEOPanel)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showSEOPanel
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            SEO Panel
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg">
            <span className="text-xs font-medium text-slate-600">SEO Score:</span>
            <span className={`text-sm font-bold ${
              seoScore >= 80 ? 'text-green-600' :
              seoScore >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {seoScore}/100
            </span>
          </div>
        </div>
      </div>
      
      {/* Enhancement Progress */}
      {(isEnhancing || enhancementProgress) && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 px-6 py-3 flex items-center gap-3">
          <div className="animate-pulse">
            <Wand2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-700">{enhancementProgress}</p>
            <p className="text-xs text-purple-600">AI is analyzing your content and generating relevant images...</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        onMediaClick={() => setShowMediaUploader(true)}
        onAIEnhance={handleAIEnhance}
      />

      {/* Editor Layout */}
      <div className="flex">
        {/* Main Editor */}
        <div className={`flex-1 transition-all duration-300 ${showSEOPanel ? 'w-2/3' : 'w-full'}`}>
          <div className="bg-white">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* SEO Panel (conditionally shown) */}
        {showSEOPanel && (
          <div className="w-1/3 border-l border-slate-200 bg-slate-50">
            <SEOPanel
              metadata={metadata}
              onMetadataChange={updateMetadata}
              seoScore={seoScore}
              readability={readability}
              content={editor.getText()}
              htmlContent={editor.getHTML()}
            />
          </div>
        )}
      </div>

      {/* Media Uploader Modal */}
      {showMediaUploader && (
        <MediaUploader
          onClose={() => setShowMediaUploader(false)}
          onInsert={handleMediaInsert}
          postId={postId}
        />
      )}
    </div>
  );
}
