// Custom Poll extension
import { Node, mergeAttributes } from '@tiptap/core';

export const Poll = Node.create({
  name: 'poll',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      question: {
        default: 'Poll Question',
      },
      options: {
        default: ['Option 1', 'Option 2'],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-poll]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-poll': 'true',
        class: 'poll-container p-6 border-2 border-blue-100 rounded-xl my-6 bg-white shadow-sm',
      }),
      [
        'div',
        { class: 'font-bold text-lg mb-4 text-slate-900' },
        HTMLAttributes.question,
      ],
      [
        'div',
        { class: 'space-y-2' },
        ...HTMLAttributes.options.map(opt => [
            'div',
            { class: 'flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors' },
            [
                'div',
                { class: 'w-4 h-4 rounded-full border-2 border-slate-400' }
            ],
            opt
        ])
      ]
    ];
  },

  addCommands() {
    return {
      setPoll: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default Poll;
