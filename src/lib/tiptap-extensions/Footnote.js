// Custom Footnote extension
import { Node, mergeAttributes } from '@tiptap/core';

export const Footnote = Node.create({
  name: 'footnote',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      text: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'sup',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-footnote': 'true',
        class: 'footnote-ref text-blue-600 cursor-pointer hover:underline',
      }),
      [
        'a',
        {
          href: `#fn-${HTMLAttributes.id}`,
          id: `fnref-${HTMLAttributes.id}`,
        },
        `[${HTMLAttributes.id}]`,
      ],
    ];
  },

  addCommands() {
    return {
      setFootnote: attributes => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});

export default Footnote;
