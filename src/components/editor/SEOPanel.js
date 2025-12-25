"use client";

import { useState, useEffect } from 'react';
import { Target, FileText, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { calculateKeywordDensity, generateSEORecommendations } from '@/utils/seo';

export default function SEOPanel({ metadata, onMetadataChange, seoScore, readability, content, htmlContent }) {
  const [recommendations, setRecommendations] = useState([]);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (content && htmlContent) {
      const words = content.split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(words);

      const recs = generateSEORecommendations(content, {
        ...metadata,
        htmlContent,
      }, seoScore);
      setRecommendations(recs);
    }
  }, [content, htmlContent, metadata, seoScore]);

  const keywordDensity = metadata.focusKeyword
    ? calculateKeywordDensity(content, metadata.focusKeyword)
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getReadabilityColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* SEO Score */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            SEO Analysis
          </h3>

          <div className={`p-4 rounded-lg border-2 ${getScoreColor(seoScore)}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-2xl font-bold">{seoScore}/100</span>
            </div>
            <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-500"
                style={{ width: `${seoScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Meta Title */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Meta Title
          </label>
          <input
            type="text"
            value={metadata.metaTitle || ''}
            onChange={(e) => onMetadataChange('metaTitle', e.target.value)}
            placeholder="Enter SEO title (50-60 characters)"
            maxLength={70}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${
              metadata.metaTitle?.length >= 50 && metadata.metaTitle?.length <= 60
                ? 'text-green-600'
                : 'text-slate-500'
            }`}>
              {metadata.metaTitle?.length || 0} characters
            </span>
            <span className="text-slate-400">Optimal: 50-60</span>
          </div>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Meta Description
          </label>
          <textarea
            value={metadata.metaDescription || ''}
            onChange={(e) => onMetadataChange('metaDescription', e.target.value)}
            placeholder="Enter SEO description (150-160 characters)"
            maxLength={170}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${
              metadata.metaDescription?.length >= 150 && metadata.metaDescription?.length <= 160
                ? 'text-green-600'
                : 'text-slate-500'
            }`}>
              {metadata.metaDescription?.length || 0} characters
            </span>
            <span className="text-slate-400">Optimal: 150-160</span>
          </div>
        </div>

        {/* Focus Keyword */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Focus Keyword
          </label>
          <input
            type="text"
            value={metadata.focusKeyword || ''}
            onChange={(e) => onMetadataChange('focusKeyword', e.target.value)}
            placeholder="e.g., blog automation"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          {metadata.focusKeyword && (
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Keyword Density:</span>
                <span className={`font-bold ${
                  keywordDensity >= 1 && keywordDensity <= 2
                    ? 'text-green-600'
                    : keywordDensity > 2
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}>
                  {keywordDensity}%
                </span>
              </div>
              <p className="text-xs text-slate-500">Target: 1-2% for optimal SEO</p>
            </div>
          )}
        </div>

        {/* URL Slug */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            URL Slug
          </label>
          <input
            type="text"
            value={metadata.slug || ''}
            onChange={(e) => onMetadataChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="url-friendly-slug"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
          />
          {metadata.slug && (
            <p className="text-xs text-slate-500">
              Preview: <span className="text-blue-600">yoursite.com/blog/{metadata.slug}</span>
            </p>
          )}
        </div>

        {/* Readability */}
        {readability && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Readability</h4>
            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Flesch Reading Ease:</span>
                <span className={`text-sm font-bold ${getReadabilityColor(readability.fleschReadingEase)}`}>
                  {Math.round(readability.fleschReadingEase)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Difficulty:</span>
                <span className="text-xs font-medium text-slate-700">
                  {readability.interpretation}
                </span>
              </div>
              <p className="text-xs text-slate-500 pt-1 border-t border-slate-200">
                Target: 60-70 (Fairly Easy to read)
              </p>
            </div>
          </div>
        )}

        {/* Content Stats */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content Stats
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">Word Count</p>
              <p className="text-xl font-bold text-blue-900">{wordCount}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-700 font-medium">Characters</p>
              <p className="text-xl font-bold text-purple-900">{content.length}</p>
            </div>
          </div>
          {wordCount < 500 && (
            <p className="text-xs text-yellow-600 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Consider adding more content (aim for 500+ words for SEO)</span>
            </p>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Recommendations</h4>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    rec.type === 'error'
                      ? 'bg-red-50 text-red-700'
                      : rec.type === 'warning'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {rec.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : rec.type === 'warning' ? (
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{rec.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
