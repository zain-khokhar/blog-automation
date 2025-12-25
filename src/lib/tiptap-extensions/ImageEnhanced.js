// Enhanced Image extension with resizing and alignment
import { Image as TiptapImage } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export const ImageEnhanced = TiptapImage.extend({
  name: 'imageEnhanced',

  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
      allowBase64: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => {
          const float = element.style.float;
          const display = element.style.display;
          const margin = element.style.margin;
          
          if (float === 'left') return 'left';
          if (float === 'right') return 'right';
          if (display === 'block' && margin === '0 auto') return 'center';
          return 'left';
        },
        renderHTML: attributes => {
          const align = attributes.align || 'left';
          
          if (align === 'left') {
            return {
              style: 'float: left; margin-right: 1rem;',
            };
          }
          if (align === 'right') {
            return {
              style: 'float: right; margin-left: 1rem;',
            };
          }
          if (align === 'center') {
            return {
              style: 'display: block; margin: 0 auto;',
            };
          }
          return {};
        },
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
      setImageAlign: align => ({ commands }) => {
        return commands.updateAttributes(this.name, { align });
      },
      setImageWidth: width => ({ commands }) => {
        return commands.updateAttributes(this.name, { width });
      },
    };
  },
});

export default ImageEnhanced;
