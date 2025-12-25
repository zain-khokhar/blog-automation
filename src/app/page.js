"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Search, FileText, Check, Settings2, Sparkles, ArrowLeft, Download } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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

export default function Dashboard() {
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
  const [generatedBlogs, setGeneratedBlogs] = useState({}); // { topic: content }
  const editorRef = useRef(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('blog-automation-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.niche) setNiche(parsed.niche);
        if (parsed.topics) setTopics(parsed.topics);
        if (parsed.generatedBlogs) setGeneratedBlogs(parsed.generatedBlogs);
        if (parsed.config) setConfig(parsed.config);
        // We don't restore selectedTopic/blogContent automatically to let user choose, 
        // or we could if we wanted to restore exact session.
        // Let's restore if available to be helpful.
        if (parsed.selectedTopic) {
            setSelectedTopic(parsed.selectedTopic);
            // If there was content for this topic, set it
            if (parsed.generatedBlogs && parsed.generatedBlogs[parsed.selectedTopic]) {
                setBlogContent(parsed.generatedBlogs[parsed.selectedTopic]);
            }
        }
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    const stateToSave = {
      niche,
      topics,
      generatedBlogs,
      config,
      selectedTopic
    };
    localStorage.setItem('blog-automation-state', JSON.stringify(stateToSave));
  }, [niche, topics, generatedBlogs, config, selectedTopic]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
    ],
    content: blogContent || '<p>Generated content will appear here...</p>',
    editorProps: {
        attributes: {
            class: 'focus:outline-none min-h-[500px]',
        },
    },
    onUpdate: ({ editor }) => {
        // Update the generatedBlogs state when user edits
        if (selectedTopic) {
            const newContent = editor.getHTML();
            // Only update if content actually changed to avoid loops
            if (newContent !== generatedBlogs[selectedTopic]) {
                setGeneratedBlogs(prev => ({
                    ...prev,
                    [selectedTopic]: newContent
                }));
                // We don't setBlogContent here to avoid re-rendering loop with editor
            }
        }
    }
  });

  // Effect to update editor content when blogContent changes (e.g. switching topics)
  useEffect(() => {
    if (editor && blogContent && editor.getHTML() !== blogContent) {
        editor.commands.setContent(blogContent);
    }
  }, [blogContent, editor]);

  const handleResearch = async () => {
    if (!niche) return;
    setLoading(true);
    setTopics([]);
    setSelectedTopic(null);
    setBlogContent(null);
    // We keep generatedBlogs in case they want to go back to previous niche results? 
    // Or should we clear them? The user might want to keep them. 
    // Let's keep them but maybe they won't be accessible if topics change.
    // Actually, if topics change, the keys in generatedBlogs won't match displayed topics.
    // That's fine, it acts as a cache.

    try {
      const res = await fetch("/api/research-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
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
            setBlogContent(data.content);
            setGeneratedBlogs(prev => ({
                ...prev,
                [selectedTopic]: data.content
            }));
        } else {
            alert("Failed to generate blog: " + (data.error || "Unknown error"));
        }
    } catch (e) {
        alert("Error generating blog: " + e.message);
    } finally {
        setGenLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!editor) return;

    try {
        // Get the HTML content directly from the editor
        const htmlContent = editor.getHTML();
        
        // Call the server-side API to generate the PDF
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                html: htmlContent,
                title: selectedTopic || "Blog Post"
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate PDF');
        }

        // Download the PDF blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTopic ? selectedTopic.substring(0, 30).replace(/[^a-z0-9]/gi, '_') : 'blog-post'}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error("PDF Export Error:", error);
        alert("Failed to export PDF: " + error.message);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex items-center space-x-3 border-b border-slate-200 pb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Blog Automation</h1>
            <p className="text-slate-500">Research topics, generate content, and export formatted blogs.</p>
          </div>
        </header>

        {/* Phase 4: Editor View (Shows when content exists) */}
        {blogContent ? (
            <section className="space-y-6 animate-in fade-in zoom-in duration-300">
                 <div className="flex items-center justify-between">
                    <button 
                        onClick={() => {
                            setBlogContent(null);
                            // We keep selectedTopic so they can see what they selected, 
                            // but if they want to select another one, they can just click it in the list.
                            // However, the list is hidden when blogContent is true.
                            // So we need to go back to a state where the list is visible.
                            // If we just setBlogContent(null), the list becomes visible (because of the conditional rendering below).
                            // But if we want to "deselect" the current topic to encourage picking a new one:
                            setSelectedTopic(null);
                        }}
                        className="text-slate-500 hover:text-slate-900 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Topics
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <Check className="w-4 h-4" /> Generated successfully
                        </span>
                        <button 
                            onClick={handleDownloadPDF}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <MenuBar editor={editor} />
                    <div ref={editorRef} className="p-12 min-h-200 prose prose-slate max-w-none bg-white">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </section>
        ) : (
            <>
                {/* Phase 1: Research */}
                <section className="space-y-4">
                <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-sm font-bold text-slate-700">1</span>
                    <h2 className="text-lg font-semibold text-slate-800">Topic Research</h2>
                </div>
                
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
                    onClick={handleResearch} 
                    disabled={loading || !niche}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? "Researching..." : "Find Topics"}
                    </button>
                </div>
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
                            onClick={() => {
                                setSelectedTopic(topic);
                                // If we already have content for this topic, load it
                                if (generatedBlogs[topic]) {
                                    setBlogContent(generatedBlogs[topic]);
                                } else {
                                    setBlogContent(null);
                                }
                            }}
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
                                <h3 className="font-medium text-slate-900 leading-snug">{topic}</h3>
                            </div>
                            {(selectedTopic === topic || generatedBlogs[topic]) && (
                                <div className={`rounded-full p-1 text-white ${generatedBlogs[topic] ? "bg-green-500" : "bg-blue-600"}`}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>

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
