// Custom Button/CTA extension
import { Node, mergeAttributes } from '@tiptap/core';

export const Button = Node.create({
  name: 'button',

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
      text: {
        default: 'Click me',
      },
      url: {
        default: '#',
      },
      variant: {
        default: 'primary', // primary, secondary, outline
      },
      alignment: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="button"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-slate-600 text-white hover:bg-slate-700',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      success: 'bg-green-600 text-white hover:bg-green-700',
    };

    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, {
        href: HTMLAttributes.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        'data-type': 'button',
        class: `inline-block px-6 py-3 rounded-lg font-semibold transition-colors no-underline my-2 ${variants[HTMLAttributes.variant] || variants.primary}`,
      }),
      HTMLAttributes.text,
    ];
  },

  addCommands() {
    return {
      setButton: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default Button;
