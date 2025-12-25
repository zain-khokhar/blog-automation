// Custom LetterSpacing extension for TipTap
import { Extension } from '@tiptap/core';

export const LetterSpacing = Extension.create({
  name: 'letterSpacing',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: element => element.style.letterSpacing,
            renderHTML: attributes => {
              if (!attributes.letterSpacing) {
                return {};
              }

              return {
                style: `letter-spacing: ${attributes.letterSpacing}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLetterSpacing: letterSpacing => ({ chain }) => {
        return chain()
          .setMark('textStyle', { letterSpacing })
          .run();
      },
      unsetLetterSpacing: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { letterSpacing: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

export default LetterSpacing;
