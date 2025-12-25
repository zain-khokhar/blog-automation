// Custom LineHeight extension for TipTap
import { Extension } from '@tiptap/core';

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {};
              }

              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: lineHeight => ({ chain }) => {
        return chain()
          .updateAttributes('paragraph', { lineHeight })
          .updateAttributes('heading', { lineHeight })
          .run();
      },
      unsetLineHeight: () => ({ chain }) => {
        return chain()
          .updateAttributes('paragraph', { lineHeight: null })
          .updateAttributes('heading', { lineHeight: null })
          .run();
      },
    };
  },
});

export default LineHeight;
