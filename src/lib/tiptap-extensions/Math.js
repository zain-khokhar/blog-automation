// Custom Math/LaTeX extension
import { Node, mergeAttributes } from '@tiptap/core';

export const Math = Node.create({
  name: 'math',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      latex: {
        default: '',
      },
      display: {
        default: 'block', // 'block' or 'inline'
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-math]',
      },
      {
        tag: 'span[data-math-inline]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const isBlock = HTMLAttributes.display === 'block';
    
    return [
      isBlock ? 'div' : 'span',
      mergeAttributes(this.options.HTMLAttributes, {
        [isBlock ? 'data-math' : 'data-math-inline']: 'true',
        class: isBlock 
          ? 'math-block p-4 bg-slate-50 rounded-lg my-4 overflow-x-auto text-center'
          : 'math-inline px-1',
      }),
      `$$${HTMLAttributes.latex}$$`,
    ];
  },

  addCommands() {
    return {
      setMath: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default Math;
