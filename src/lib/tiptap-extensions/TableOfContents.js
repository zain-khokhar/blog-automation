// Custom TableOfContents extension
import { Node } from '@tiptap/core';

export const TableOfContents = Node.create({
  name: 'tableOfContents',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-toc]',
      },
    ];
  },

  renderHTML() {
    return [
      'div',
      {
        'data-toc': 'true',
        class: 'table-of-contents p-6 bg-slate-50 border-l-4 border-blue-600 rounded-lg my-6',
      },
      [
        'div',
        { class: 'font-bold text-lg mb-3 text-slate-900' },
        'Table of Contents',
      ],
      [
        'div',
        { id: 'toc-content', class: 'space-y-1 text-sm' },
        'Headings will appear here automatically',
      ],
    ];
  },

  addCommands() {
    return {
      insertTableOfContents: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});

export default TableOfContents;
