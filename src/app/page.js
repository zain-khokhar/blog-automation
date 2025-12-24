"use client";

import { useState, useRef } from "react";
import { Loader2, Search, FileText, Check, Settings2, Sparkles, ArrowLeft, Download } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const editorRef = useRef(null);

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
        // Optional: Update state if needed for export later
        // setBlogContent(editor.getHTML());
    }
  });

  // Effect to update editor content when blogContent changes
  if (editor && blogContent && editor.getHTML() !== blogContent) {
      editor.commands.setContent(blogContent);
  }

  const handleResearch = async () => {
    if (!niche) return;
    setLoading(true);
    setTopics([]);
    setSelectedTopic(null);
    setBlogContent(null);

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
    if (!editorRef.current) return;

    try {
        const element = editorRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true
        });
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
                        onClick={() => setBlogContent(null)}
                        className="text-slate-500 hover:text-slate-900 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Research
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
                    <div ref={editorRef} className="p-12 min-h-[800px] prose prose-slate max-w-none bg-white">
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
                                <h3 className="font-medium text-slate-900 leading-snug">{topic}</h3>
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
