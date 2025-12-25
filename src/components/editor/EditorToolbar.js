"use client";

import { 
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Video, Table,
  Undo, Redo, MoreHorizontal,
  Type, Palette, Highlighter,
  IndentDecrease, IndentIncrease,
  ListTree, Hash, MessageSquare, Sigma, FileCode,
  MousePointer2, ChevronDown, Share2, Vote, Layout
} from 'lucide-react';
import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

export default function EditorToolbar({ editor, onMediaClick }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  if (!editor) return null;

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL:');
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  const setFontFamily = (font) => {
    if (font === 'default') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(font).run();
    }
  };

  const setFontSize = (size) => {
    if (size === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
  };

  const setLineHeight = (height) => {
    if (height === 'default') {
      editor.chain().focus().unsetLineHeight().run();
    } else {
      editor.chain().focus().setLineHeight(height).run();
    }
  };

  const setLetterSpacing = (spacing) => {
    if (spacing === 'default') {
      editor.chain().focus().unsetLetterSpacing().run();
    } else {
      editor.chain().focus().setLetterSpacing(spacing).run();
    }
  };

  const buttonClass = (isActive = false) => 
    `p-2 rounded hover:bg-slate-200 transition-colors ${isActive ? 'bg-slate-300 text-slate-900' : 'text-slate-700'}`;

  return (
    <div className="border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
      {/* Main Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 items-center">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={buttonClass(editor.isActive('bold'))}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={buttonClass(editor.isActive('italic'))}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={buttonClass(editor.isActive('underline'))}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={buttonClass(editor.isActive('strike'))}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={buttonClass(editor.isActive('code'))}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 3 }))}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Font Family & Size */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <select
            onChange={(e) => setFontFamily(e.target.value)}
            value={editor.getAttributes('textStyle').fontFamily || 'default'}
            className="text-xs px-2 py-1.5 border border-slate-300 rounded hover:bg-slate-100 cursor-pointer outline-none focus:border-blue-500"
            title="Font Family"
          >
            <option value="default">Default</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="'Comic Sans MS', cursive">Comic Sans</option>
            <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
            <option value="Impact, sans-serif">Impact</option>
            <option value="'Lucida Console', monospace">Lucida</option>
          </select>

          <select
            onChange={(e) => setFontSize(e.target.value)}
            value={editor.getAttributes('textStyle').fontSize || 'default'}
            className="text-xs px-2 py-1.5 border border-slate-300 rounded hover:bg-slate-100 cursor-pointer outline-none focus:border-blue-500"
            title="Font Size"
          >
            <option value="default">Size</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
            <option value="36px">36px</option>
            <option value="48px">48px</option>
          </select>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={buttonClass(editor.isActive({ textAlign: 'left' }))}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={buttonClass(editor.isActive({ textAlign: 'center' }))}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={buttonClass(editor.isActive({ textAlign: 'right' }))}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={buttonClass(editor.isActive({ textAlign: 'justify' }))}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Layout Controls - Line Height, Letter Spacing, Indentation */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <select
            onChange={(e) => setLineHeight(e.target.value)}
            className="text-xs px-2 py-1.5 border border-slate-300 rounded hover:bg-slate-100 cursor-pointer outline-none focus:border-blue-500"
            title="Line Height"
          >
            <option value="default">Line H.</option>
            <option value="1">1.0</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="1.75">1.75</option>
            <option value="2">2.0</option>
            <option value="2.5">2.5</option>
          </select>

          <select
            onChange={(e) => setLetterSpacing(e.target.value)}
            className="text-xs px-2 py-1.5 border border-slate-300 rounded hover:bg-slate-100 cursor-pointer outline-none focus:border-blue-500"
            title="Letter Spacing"
          >
            <option value="default">Letter</option>
            <option value="-0.05em">Tight</option>
            <option value="0">Normal</option>
            <option value="0.05em">Wide</option>
            <option value="0.1em">Wider</option>
            <option value="0.15em">Widest</option>
          </select>

          <button
            onClick={() => editor.chain().focus().outdent().run()}
            className={buttonClass()}
            title="Decrease Indent (Shift+Tab)"
          >
            <IndentDecrease className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().indent().run()}
            className={buttonClass()}
            title="Increase Indent (Tab)"
          >
            <IndentIncrease className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={buttonClass(editor.isActive('bulletList'))}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={buttonClass(editor.isActive('orderedList'))}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={buttonClass(editor.isActive('blockquote'))}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2 relative">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={buttonClass()}
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full mt-2 z-50 bg-white p-3 rounded-lg shadow-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Text Color</span>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>
                <HexColorPicker
                  color={editor.getAttributes('textStyle').color || '#000000'}
                  onChange={(color) => editor.chain().focus().setColor(color).run()}
                />
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className={buttonClass(editor.isActive('highlight'))}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full mt-2 z-50 bg-white p-3 rounded-lg shadow-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Highlight Color</span>
                  <button
                    onClick={() => setShowHighlightPicker(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>
                <HexColorPicker
                  color={editor.getAttributes('highlight').color || '#ffff00'}
                  onChange={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                />
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media & Insert */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <div className="relative">
            <button
              onClick={() => setShowLinkDialog(!showLinkDialog)}
              className={buttonClass(editor.isActive('link'))}
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            {showLinkDialog && (
              <div className="absolute top-full mt-2 z-50 bg-white p-3 rounded-lg shadow-xl border border-slate-200 w-64">
                <div className="mb-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Enter URL:
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && addLink()}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addLink}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Add Link
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setShowLinkDialog(false);
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded hover:bg-slate-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onMediaClick}
            className={buttonClass()}
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            onClick={addYoutubeVideo}
            className={buttonClass()}
            title="Embed YouTube Video"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={addTable}
            className={buttonClass(editor.isActive('table'))}
            title="Insert Table"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>

        {/* Subscript/Superscript */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={buttonClass(editor.isActive('subscript'))}
            title="Subscript"
          >
            <span className="text-xs">X₂</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={buttonClass(editor.isActive('superscript'))}
            title="Superscript"
          >
            <span className="text-xs">X²</span>
          </button>
        </div>

        {/* Code Block */}
        <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={buttonClass(editor.isActive('codeBlock'))}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`${buttonClass()} disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`${buttonClass()} disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
