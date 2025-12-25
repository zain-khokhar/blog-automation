// Custom Social Media Embed extension
import { Node, mergeAttributes } from '@tiptap/core';

export const Social = Node.create({
  name: 'social',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      platform: {
        default: 'generic',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-social]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    let embedContent = '';
    const url = HTMLAttributes.url;

    if (url.includes('twitter.com') || url.includes('x.com')) {
        embedContent = 'Twitter/X Post';
    } else if (url.includes('instagram.com')) {
        embedContent = 'Instagram Post';
    } else if (url.includes('linkedin.com')) {
        embedContent = 'LinkedIn Post';
    } else {
        embedContent = 'Social Embed';
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-social': 'true',
        class: 'social-embed p-4 border border-slate-200 rounded-xl my-6 bg-slate-50 flex flex-col items-center justify-center gap-2 min-h-[150px]',
      }),
      [
        'div',
        { class: 'font-bold text-slate-700' },
        embedContent
      ],
      [
        'a',
        { 
            href: url, 
            target: '_blank', 
            rel: 'noopener noreferrer',
            class: 'text-sm text-blue-600 hover:underline break-all' 
        },
        url
      ]
    ];
  },

  addCommands() {
    return {
      setSocial: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default Social;
