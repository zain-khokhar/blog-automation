// Custom Tabs/Slider extension mockup
import { Node, mergeAttributes } from '@tiptap/core';

export const Tabs = Node.create({
  name: 'tabs',

  group: 'block',

  content: 'tabItem+',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class="tabs-container"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        class: 'tabs-container my-6 border border-slate-200 rounded-lg overflow-hidden',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setTabs: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: [
            { type: 'tabItem', attrs: { title: 'Tab 1' } },
            { type: 'tabItem', attrs: { title: 'Tab 2' } },
          ],
        });
      },
    };
  },
});

export const TabItem = Node.create({
  name: 'tabItem',

  group: 'block',

  content: 'paragraph+',

  addAttributes() {
    return {
      title: {
        default: 'Tab',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class="tab-item"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        class: 'tab-item p-4 bg-white',
        'data-title': HTMLAttributes.title
      }),
      [
        'div',
        { class: 'text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 border-b pb-1' },
        HTMLAttributes.title
      ],
      0,
    ];
  },
});

export default Tabs;
