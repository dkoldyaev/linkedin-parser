import React, { useEffect } from 'react';
import type { Preview } from '@storybook/react-vite';
import { blueprintDarkTheme } from './blueprintTheme';
import '../src/ui-kit/tokens/tokens.css';
import '../src/ui-kit/stories/storybook-canvas.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Blueprint Color Theme (CSS Custom Properties)',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark Blueprint (#08101E)', icon: 'moon' },
          { value: 'light', title: 'Light Blueprint (#F1F5F9)', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Text direction (LTR / RTL)',
      toolbar: {
        title: 'Direction',
        icon: 'globe',
        items: [
          { value: 'ltr', title: 'LTR (Left-to-Right)' },
          { value: 'rtl', title: 'RTL (Right-to-Left)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
    direction: 'ltr',
  },
  decorators: [
    (Story, context) => {
      const activeTheme = context.globals.theme === 'light' ? 'light' : 'dark';
      const activeDir = context.globals.direction === 'rtl' ? 'rtl' : 'ltr';

      useEffect(() => {
        document.documentElement.setAttribute('data-theme', activeTheme);
        document.documentElement.setAttribute('dir', activeDir);
      }, [activeTheme, activeDir]);

      return (
        <div
          data-theme={activeTheme}
          dir={activeDir}
          className="sb-blueprint-canvas"
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      theme: blueprintDarkTheme,
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disabled: true,
    },
    viewport: {
      options: {
        mobile375: {
          name: 'Mobile (375px)',
          styles: { width: '375px', height: '812px' },
        },
        tablet768: {
          name: 'Tablet (768px)',
          styles: { width: '768px', height: '1024px' },
        },
        desktop1440: {
          name: 'Blueprint Desktop (1440px)',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations (Tokens)',
          [
            'Colors',
            'Typography',
            'Spacing & 32px Grid',
            'Shadows & Borders',
            'Icons',
          ],
          'Atoms',
          [
            'Button',
            'Input',
            'Textarea',
            'Label',
            'Text',
            'Badge',
            'StatusDot',
            'Spinner',
            'Checkbox',
            'Icon',
          ],
          'Molecules',
          [
            'FormField',
            'SearchBar',
            'Select',
            'Tabs',
            'Tooltip',
            'AlertBanner',
            'EditableTokenList',
            'ColorPicker',
            'EmptyState',
          ],
          'Organisms',
          ['Modal', 'Card', 'DataTable', 'Header', 'Form'],
          'Templates',
          ['PageLayout', 'DashboardLayout'],
          'Hooks',
          ['Hooks Showcase'],
        ],
      },
    },
  },
};

export default preview;
