import React, { useEffect } from 'react';
import type { Preview } from '@storybook/react-vite';
import { OverlayProvider } from '../src/utils/overlay';
import { blueprintDarkTheme } from './blueprintTheme';
import '../src/tokens/tokens.css';
import '../src/stories/storybook-canvas.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Blueprint Color Theme (CSS Custom Properties)',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark Blueprint (#0A1729)', icon: 'moon' },
          { value: 'light', title: 'Light Blueprint (#F4F4F1)', icon: 'sun' },
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
        <OverlayProvider>
          <div data-theme={activeTheme} dir={activeDir} className="sb-blueprint-canvas">
            <Story />
          </div>
        </OverlayProvider>
      );
    },
  ],
  parameters: {
    docs: {
      theme: blueprintDarkTheme,
      codePanel: true,
      source: {
        type: 'dynamic',
      },
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
          ['Colors', 'Typography', 'Spacing & 32px Grid', 'Shadows & Borders', 'Icons'],
          'Atoms',
          [
            'Button',
            ['Button', 'SortButton'],
            'Input',
            'Textarea',
            'Label',
            'Text',
            [
              'Text',
              'Heading',
              'Paragraph',
              'Link',
              'Code',
              'Kbd',
              'Blockquote',
              'List',
              'OrderedList',
              'UnorderedList',
              'ListItem',
            ],
            'Badge',
            'StatusDot',
            'Spinner',
            'Skeleton',
            'Checkbox',
            'Icon',
          ],
          'Molecules',
          [
            'FormField',
            'SearchBar',
            'Select',
            'Overlay',
            'Tabs',
            'Tooltip',
            'ButtonGroup',
            'AlertBanner',
            'TokenList',
            'FilterBar',
            ['FilterBar', 'FilterBarReset'],
            'SectionHeader',
            'Section',
            ['Section', 'SectionBody'],
            'CollapsibleSection',
            'Accordion',
            ['Accordion', 'AccordionItem'],
            'Stepper',
            ['Stepper', 'StepperItem'],
            'ColorPicker',
            'EmptyState',
          ],
          'Organisms',
          [
            'Modal',
            ['Modal', 'ModalHeader', 'ModalHeaderMeta', 'ModalBody', 'ModalFooter', 'ModalFooterActions'],
            'Drawer',
            'Card',
            [
              'Card',
              'CardFull',
              'CardCollapsed',
              'CardHeader',
              'CardBody',
              'CardFooter',
              'CardFullLoading',
              'CardCollapsedLoading',
            ],
            'Table',
            ['Table', 'TableCol', 'TableHeader', 'TableBody', 'TableRow', 'TableCell', 'TableFooter'],
            'DataTable',
            ['DataTable', 'DataTableLoading'],
            'Header',
            ['Header', 'HeaderBrand', 'HeaderActions', 'HeaderUserMenu'],
            'Form',
            'TagsList',
            ['TagsList', 'TagsListInput'],
            'ReportAccordion',
            'VacancyCard',
            'VacancyDetailsModal',
          ],
          'Layouts',
          ['PageLayout', 'DashboardLayout'],
          'Utils',
          [
            'Overlay',
            ['OverlayProvider'],
            'Responsive',
            ['MediaQuery', 'ContainerQuery', 'ContainerQuerySlot'],
          ],
          'Hooks',
          ['Hooks Showcase'],
          'Showcases (Job Tracker)',
          ['Vacancy Card Showcase', 'Kanban Board Showcase', 'Vacancy Details Showcase'],
        ],
      },
    },
  },
};

export default preview;
