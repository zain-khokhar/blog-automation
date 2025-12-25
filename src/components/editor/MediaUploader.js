"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function MediaUploader({ onClose, onInsert, postId }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [generatingAlt, setGeneratingAlt] = useState(false);
  const [align, setAlign] = useState('left');
  const [mediaType, setMediaType] = useState('image'); // image, video, audio

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);

    try {
      // Determine media type
      let type = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      if (file.type.startsWith('audio/')) type = 'audio';
      
      setMediaType(type);

      // Compress image if it's large
      let processedFile = file;
      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        processedFile = await imageCompression(file, options);
      }

      // Upload to server
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('postId', postId || 'temp');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.url) {
        setUploadedFile({
          url: data.url,
          type: type,
          name: file.name,
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [postId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm'],
    },
    maxFiles: 1,
  });

  const handleGenerateAltText = async () => {
    if (!uploadedFile) return;

    setGeneratingAlt(true);
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-alt-text',
          imageUrl: uploadedFile.url,
          imageName: uploadedFile.name,
        }),
      });

      const data = await response.json();
      if (data.altText) {
        setAltText(data.altText);
      }
    } catch (error) {
      console.error('Failed to generate alt text:', error);
    } finally {
      setGeneratingAlt(false);
    }
  };

  const handleInsert = () => {
    if (!uploadedFile) return;

    onInsert(uploadedFile.url, uploadedFile.type, {
      altText,
      caption,
      align,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Upload Media</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!uploadedFile ? (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div className="space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                    <p className="text-slate-600">Uploading...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-semibold text-slate-700">
                        {isDragActive ? 'Drop file here' : 'Drag and drop your media file'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        or click to browse (Images, Videos, Audio supported)
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Maximum file size: 10MB • Supported: JPG, PNG, GIF, WebP, MP4, WebM, MP3
                    </p>
                  </div>
                )}
              </div>

              {/* URL Input */}
              <div className="text-center text-sm text-slate-500">
                <span>— or —</span>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Insert from URL (Image, Video, or Audio)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/media.jpg or YouTube/Vimeo URL"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        const url = e.target.value;
                        let type = 'image';
                        if (url.includes('youtube.com') || url.includes('vimeo.com') || url.endsWith('.mp4') || url.endsWith('.webm')) {
                          type = 'video';
                        } else if (url.endsWith('.mp3') || url.endsWith('.wav')) {
                          type = 'audio';
                        }
                        
                        setUploadedFile({
                          url,
                          type,
                          name: 'External media',
                        });
                        setMediaType(type);
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      if (input.value) {
                        const url = input.value;
                        let type = 'image';
                        if (url.includes('youtube.com') || url.includes('vimeo.com') || url.endsWith('.mp4') || url.endsWith('.webm')) {
                          type = 'video';
                        } else if (url.endsWith('.mp3') || url.endsWith('.wav')) {
                          type = 'audio';
                        }
                        
                        setUploadedFile({
                          url,
                          type,
                          name: 'External media',
                        });
                        setMediaType(type);
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">File uploaded successfully!</span>
                </div>

                {uploadedFile.type === 'image' && (
                  <div className="rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={uploadedFile.url}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain bg-slate-50"
                    />
                  </div>
                )}

                {mediaType === 'image' && (
                  <>
                    {/* Alt Text */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-700">
                          Alt Text (SEO Important)
                        </label>
                        <button
                          onClick={handleGenerateAltText}
                          disabled={generatingAlt}
                          className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
                        >
                          {generatingAlt ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>✨ AI Generate</>
                          )}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Describe the image for accessibility and SEO"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Caption */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Caption (Optional)
                      </label>
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Add a caption for the image"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Alignment */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Alignment
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAlign('left')}
                          className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                            align === 'left'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Left
                        </button>
                        <button
                          onClick={() => setAlign('center')}
                          className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                            align === 'center'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Center
                        </button>
                        <button
                          onClick={() => setAlign('right')}
                          className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors ${
                            align === 'right'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Right
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleInsert}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Insert into Editor
                  </button>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
