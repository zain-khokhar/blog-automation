// Custom Anchor extension for internal page links
import { Node, mergeAttributes } from '@tiptap/core';

export const Anchor = Node.create({
  name: 'anchor',

  group: 'block',

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
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'scroll-anchor inline-block',
        style: 'scroll-margin-top: 80px;',
      }),
      HTMLAttributes.label || '',
    ];
  },

  addCommands() {
    return {
      setAnchor: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default Anchor;
