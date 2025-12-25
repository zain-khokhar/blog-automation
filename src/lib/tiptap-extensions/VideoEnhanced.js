// Enhanced Video extension supporting YouTube, Vimeo, and direct MP4
import { Node, mergeAttributes } from '@tiptap/core';

export const VideoEnhanced = Node.create({
  name: 'videoEnhanced',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      type: {
        default: 'youtube', // youtube, vimeo, or mp4
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-video]',
      },
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, type, width, height } = HTMLAttributes;

    // For MP4/direct video files
    if (type === 'mp4' || src?.endsWith?.('.mp4') || src?.endsWith?.('.webm')) {
      return [
        'video',
        mergeAttributes(this.options.HTMLAttributes, {
          src,
          controls: 'controls',
          class: 'w-full max-w-4xl aspect-video rounded-lg my-4',
        }),
      ];
    }

    // For Vimeo
    if (type === 'vimeo' || src?.includes?.('vimeo.com')) {
      const videoId = this.getVimeoId(src);
      const embedSrc = `https://player.vimeo.com/video/${videoId}`;
      
      return [
        'iframe',
        mergeAttributes(this.options.HTMLAttributes, {
          src: embedSrc,
          'data-video': 'vimeo',
          class: 'w-full max-w-4xl aspect-video rounded-lg my-4',
          frameborder: '0',
          allow: 'autoplay; fullscreen; picture-in-picture',
          allowfullscreen: 'allowfullscreen',
        }),
      ];
    }

    // For YouTube (default)
    const videoId = this.getYouTubeId(src);
    const embedSrc = `https://www.youtube.com/embed/${videoId}`;
    
    return [
      'iframe',
      mergeAttributes(this.options.HTMLAttributes, {
        src: embedSrc,
        'data-video': 'youtube',
        class: 'w-full max-w-4xl aspect-video rounded-lg my-4',
        frameborder: '0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: 'allowfullscreen',
      }),
    ];
  },

  addCommands() {
    return {
      setVideo: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  // Helper methods
  getYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  },

  getVimeoId(url) {
    if (!url) return '';
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : url;
  },
});

export default VideoEnhanced;
