'use client';

import React, { useState } from 'react';
import { Loader2, Check, RefreshCw, Wand2, BarChart } from 'lucide-react';

export default function BlogGenerator() {
  const [step, setStep] = useState(1); // 1: Topics, 2: Keywords, 3: Content
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [blogContent, setBlogContent] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState(null);
  const [niche, setNiche] = useState(''); // Replaces siteUrl

  const humanizeBlog = () => {
    let content = blogContent;
    
    // Remove em dashes and replace with regular hyphens
    content = content.replace(/—/g, '-');
    
    // Remove long separator lines (3 or more dashes/underscores/equals/asterisks)
    content = content.replace(/^[-_=*]{3,}$/gm, '');
    content = content.replace(/^\s*[-_=*]{3,}\s*$/gm, '');
    
    // Remove excessive newlines (more than 2 consecutive)
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Replace fancy quotes with regular quotes
    content = content.replace(/[""]/g, '"');
    content = content.replace(/['']/g, "'");
    
    // Remove excessive exclamation marks
    content = content.replace(/!{2,}/g, '!');
    
    // Remove AI-style phrases
    const aiPhrases = [
      /\*\*Note:\*\*/gi,
      /\*\*Important:\*\*/gi,
      /\*\*Disclaimer:\*\*/gi,
      /In conclusion,/gi,
      /In summary,/gi,
      /To sum up,/gi
    ];
    
    aiPhrases.forEach(phrase => {
      content = content.replace(phrase, '');
    });
    
    // Remove markdown bold/italic markers that look too formatted
    content = content.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
    
    // Remove excessive bullet point variations
    content = content.replace(/^[\s]*[•●○■□▪▫]\s/gm, '- ');
    
    // Clean up multiple spaces
    content = content.replace(/ {2,}/g, ' ');
    
    // Trim whitespace from each line
    content = content.split('\n').map(line => line.trim()).join('\n');
    
    // Remove trailing/leading whitespace
    content = content.trim();
    
    setBlogContent(content);
  };

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/topics/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche }),
      });
      const data = await res.json();
      if (data.topics) setTopics(data.topics);
    } catch (error) {
      console.error("Failed to fetch topics", error);
    } finally {
      setLoading(false);
    }
  };

  const generateKeywords = async (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    try {
      const res = await fetch('/api/keywords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.topic, problem: topic.problem }),
      });
      const data = await res.json();
      if (data.keywords) {
        setKeywords(data.keywords);
        setSelectedKeywords(data.keywords.map(k => k.keyword)); // Select all by default
        setStep(2);
      }
    } catch (error) {
      console.error("Failed to generate keywords", error);
    } finally {
      setLoading(false);
    }
  };

  const generateBlog = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: selectedTopic.topic, 
          keywords: selectedKeywords 
        }),
      });
      const data = await res.json();
      if (data.content) {
        setBlogContent(data.content);
        setStep(3);
        // Auto analyze SEO after generation
        analyzeSeo(data.content, selectedKeywords);
      }
    } catch (error) {
      console.error("Failed to generate blog", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSeo = async (content, kw) => {
    try {
      const res = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, keywords: kw }),
      });
      const data = await res.json();
      setSeoAnalysis(data);
    } catch (error) {
      console.error("Failed to analyze SEO", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Blog Automation</h1>
          <p className="text-gray-600">Gemini Deep Search Integration</p>
        </header>

        {/* Step 1: Topic Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex gap-4 items-end bg-white p-6 rounded-xl shadow-sm">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Topic Area (Optional)</label>
                <input 
                  type="text" 
                  value={niche} 
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. React Development, Cloud Computing, Gardening"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={fetchTopics} 
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                Fetch Topics
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((t, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border hover:border-blue-500 cursor-pointer transition-all" onClick={() => generateKeywords(t)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{t.topic}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      t.difficulty === 'High' ? 'bg-red-100 text-red-800' : 
                      t.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {t.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{t.problem}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{t.intent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Keyword Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Select Keywords for "{selectedTopic?.topic}"</h2>
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700">Back to Topics</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between mb-4">
                <span className="text-sm text-gray-500">{selectedKeywords.length} selected</span>
                <button 
                  onClick={() => setSelectedKeywords(keywords.map(k => k.keyword))}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {keywords.map((k, i) => (
                  <label key={i} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedKeywords.includes(k.keyword)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedKeywords([...selectedKeywords, k.keyword]);
                        else setSelectedKeywords(selectedKeywords.filter(kw => kw !== k.keyword));
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{k.keyword}</div>
                      <div className="text-xs text-gray-500">{k.type} • {k.relevance} Relevance</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={generateBlog}
                  disabled={loading || selectedKeywords.length === 0}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                  Generate Blog Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Content & SEO */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Generated Content</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={humanizeBlog}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Wand2 size={18} />
                    Humanize
                  </button>
                  <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700">Back to Keywords</button>
                </div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800">{blogContent}</pre>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold">SEO Analysis</h2>
              {seoAnalysis ? (
                <div className="bg-white p-6 rounded-xl shadow-sm sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-600">Dynamic Score</span>
                    <div className={`text-4xl font-bold ${
                      seoAnalysis.score >= 80 ? 'text-green-600' : 
                      seoAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {seoAnalysis.score}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BarChart size={16} /> Analysis
                    </h4>
                    <p className="text-sm text-gray-600">{seoAnalysis.analysis}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-blue-600">Improvements</h4>
                    <ul className="space-y-2">
                      {seoAnalysis.improvements?.map((imp, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-blue-500">•</span> {typeof imp === 'string' ? imp : (imp?.text || imp?.suggestion || JSON.stringify(imp))}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-center h-40 text-gray-500">
                  {loading ? <Loader2 className="animate-spin" /> : 'Analyzing...'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
