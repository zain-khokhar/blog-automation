// Custom Details/Accordion extension
import { Node, mergeAttributes } from '@tiptap/core';

export const Details = Node.create({
  name: 'details',

  group: 'block',

  content: 'summary block*',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'border border-slate-300 rounded-lg overflow-hidden my-4 bg-white',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDetails: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: [
            { type: 'summary' },
            { type: 'paragraph', content: [{ type: 'text', text: 'Content goes here...' }] },
          ],
        });
      },
    };
  },
});

export const Summary = Node.create({
  name: 'summary',

  group: 'block',

  content: 'text*',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'summary',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'summary',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'px-4 py-3 bg-slate-50 font-semibold cursor-pointer hover:bg-slate-100 transition-colors list-none flex items-center gap-2',
      }),
      0,
    ];
  },
});

export default Details;
