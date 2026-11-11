import { create } from 'storybook/theming';

export const blueprintDarkTheme = create({
  base: 'dark',
  brandTitle: 'CV.ALTER // BLUEPRINT UI-KIT',
  brandUrl: '/',
  brandTarget: '_self',

  colorPrimary: '#2563EB',
  colorSecondary: '#3B82F6',

  // UI
  appBg: '#08101E',
  appContentBg: '#0D192B',
  appPreviewBg: '#08101E',
  appBorderColor: 'rgba(96, 165, 250, 0.25)',
  appBorderRadius: 0,

  // Typography
  fontBase: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontCode: "'JetBrains Mono', monospace",

  // Text colors
  textColor: '#F8FAFC',
  textInverseColor: '#08101E',
  textMutedColor: '#94A3B8',

  // Toolbar default and active colors
  barTextColor: '#94A3B8',
  barSelectedColor: '#60A5FA',
  barHoverColor: '#F8FAFC',
  barBg: '#0D192B',

  // Form colors
  inputBg: '#0F1E36',
  inputBorder: 'rgba(96, 165, 250, 0.32)',
  inputTextColor: '#F8FAFC',
  inputBorderRadius: 0,
});
