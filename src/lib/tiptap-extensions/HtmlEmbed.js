// Custom HtmlEmbed extension for scripts and widgets
import { Node } from '@tiptap/core';

export const HtmlEmbed = Node.create({
  name: 'htmlEmbed',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      content: {
        default: '',
      },
      type: {
        default: 'script', // 'script', 'iframe', 'embed'
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-html-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-html-embed': 'true',
        class: 'html-embed-container p-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg my-4',
      },
      [
        'div',
        { class: 'text-xs text-slate-500 mb-2' },
        `Embedded ${HTMLAttributes.type}`,
      ],
      [
        'div',
        {
          class: 'text-xs font-mono bg-white p-2 rounded overflow-x-auto',
          innerHTML: HTMLAttributes.content.substring(0, 100) + '...',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setHtmlEmbed: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default HtmlEmbed;
