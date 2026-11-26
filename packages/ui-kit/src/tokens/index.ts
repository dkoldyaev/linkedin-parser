import './tokens.css';

export type ThemeMode = 'dark' | 'light';

export type SemanticTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type SpacingToken =
  | '0'
  | '0-5'
  | '1'
  | '1-5'
  | '2'
  | '2-5'
  | '3'
  | '3-5'
  | '4'
  | '5'
  | '6'
  | '8'
  | '10'
  | '12'
  | '16';

export type FontSizeToken = '2xs' | 'xs' | 'sm' | 'md' | 'base' | 'lg' | 'xl' | '2xl';

export type FontFamilyToken = 'sans' | 'mono' | 'display';

export type IconSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const ICON_SIZE_PX: Readonly<Record<IconSize, number>> = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export interface TokenDescriptor {
  readonly name: string;
  readonly cssVar: string;
  readonly darkValue: string;
  readonly lightValue: string;
  readonly description: string;
}

export const COLOR_TOKENS: readonly TokenDescriptor[] = [
  {
    name: 'bg-main',
    cssVar: '--ui-bg-main',
    darkValue: '#0a1729',
    lightValue: '#f4f4f1',
    description: 'Primary workspace canvas background (Blueprint Canvas)',
  },
  {
    name: 'bg-surface',
    cssVar: '--ui-bg-surface',
    darkValue: '#101f35',
    lightValue: '#ffffff',
    description: 'Surface background for headers, modals, and panels',
  },
  {
    name: 'bg-subtle',
    cssVar: '--ui-bg-subtle',
    darkValue: '#182c46',
    lightValue: '#efefeb',
    description: 'Subtle background for secondary sections and interactive hover states',
  },
  {
    name: 'text-primary',
    cssVar: '--ui-text-primary',
    darkValue: '#e7f1ff',
    lightValue: '#222321',
    description: 'Primary high-contrast foreground text',
  },
  {
    name: 'text-secondary',
    cssVar: '--ui-text-secondary',
    darkValue: '#b0c4db',
    lightValue: '#555a54',
    description: 'Secondary text for descriptions and metadata',
  },
  {
    name: 'text-muted',
    cssVar: '--ui-text-muted',
    darkValue: '#91a9c3',
    lightValue: '#6c716a',
    description: 'Muted text for hints, placeholders, and counters',
  },
  {
    name: 'border-subtle',
    cssVar: '--ui-border-subtle',
    darkValue: '#304c6c',
    lightValue: '#d7d8d2',
    description: 'Base 1px structural grid line and divider border',
  },
  {
    name: 'border-strong',
    cssVar: '--ui-border-strong',
    darkValue: '#527292',
    lightValue: '#a8aaa4',
    description: 'Emphasized border for interactive controls and columns',
  },
  {
    name: 'pixel-line',
    cssVar: '--ui-pixel-line',
    darkValue: '#527aa3',
    lightValue: '#98a8b8',
    description: 'Drafting section divider line',
  },
  {
    name: 'primary',
    cssVar: '--ui-primary',
    darkValue: '#79aeff',
    lightValue: '#304bde',
    description: 'Primary interactive accent (Blueprint Blue)',
  },
  {
    name: 'success',
    cssVar: '--ui-success',
    darkValue: '#7eddb0',
    lightValue: '#237844',
    description: 'Semantic positive status and confirmation accent',
  },
  {
    name: 'warning',
    cssVar: '--ui-warning',
    darkValue: '#f59e0b',
    lightValue: '#9b5f00',
    description: 'Semantic caution and warning status accent',
  },
  {
    name: 'danger',
    cssVar: '--ui-danger',
    darkValue: '#f87171',
    lightValue: '#b63840',
    description: 'Semantic destructive action and error accent',
  },
  {
    name: 'info',
    cssVar: '--ui-info',
    darkValue: '#99d9ff',
    lightValue: '#176389',
    description: 'Semantic informational status accent',
  },
] as const;

export const SPACING_TOKENS: readonly {
  readonly key: SpacingToken;
  readonly cssVar: string;
  readonly px: number;
  readonly gridFraction: string;
}[] = [
  { key: '0', cssVar: '--ui-space-0', px: 0, gridFraction: '0' },
  { key: '0-5', cssVar: '--ui-space-0-5', px: 2, gridFraction: '0.0625 × grid' },
  { key: '1', cssVar: '--ui-space-1', px: 4, gridFraction: '0.125 × grid' },
  { key: '1-5', cssVar: '--ui-space-1-5', px: 6, gridFraction: '0.1875 × grid' },
  { key: '2', cssVar: '--ui-space-2', px: 8, gridFraction: '0.25 × grid (1 unit)' },
  { key: '2-5', cssVar: '--ui-space-2-5', px: 10, gridFraction: '0.3125 × grid' },
  { key: '3', cssVar: '--ui-space-3', px: 12, gridFraction: '0.375 × grid' },
  { key: '3-5', cssVar: '--ui-space-3-5', px: 14, gridFraction: '0.4375 × grid' },
  { key: '4', cssVar: '--ui-space-4', px: 16, gridFraction: '0.5 × grid (2 units)' },
  { key: '5', cssVar: '--ui-space-5', px: 20, gridFraction: '0.625 × grid' },
  { key: '6', cssVar: '--ui-space-6', px: 24, gridFraction: '0.75 × grid (line-height)' },
  { key: '8', cssVar: '--ui-space-8', px: 32, gridFraction: '1 × grid (base row)' },
  { key: '10', cssVar: '--ui-space-10', px: 40, gridFraction: '1.25 × grid' },
  { key: '12', cssVar: '--ui-space-12', px: 48, gridFraction: '1.5 × grid' },
  { key: '16', cssVar: '--ui-space-16', px: 64, gridFraction: '2 × grid (header/footer)' },
] as const;

export const TYPOGRAPHY_TOKENS: readonly {
  readonly key: FontSizeToken;
  readonly cssVar: string;
  readonly rem: string;
  readonly pxApprox: string;
  readonly usage: string;
}[] = [
  {
    key: '2xs',
    cssVar: '--ui-font-size-2xs',
    rem: '0.65rem',
    pxApprox: '10.4px',
    usage: 'Micro indices, counters, and column codes',
  },
  {
    key: 'xs',
    cssVar: '--ui-font-size-xs',
    rem: '0.6875rem',
    pxApprox: '11px',
    usage: 'Monospace uppercase section headers, form labels, and badges',
  },
  {
    key: 'sm',
    cssVar: '--ui-font-size-sm',
    rem: '0.75rem',
    pxApprox: '12px',
    usage: 'Compact buttons, tabs, filters, and secondary captions',
  },
  {
    key: 'md',
    cssVar: '--ui-font-size-md',
    rem: '0.8125rem',
    pxApprox: '13px',
    usage: 'Primary body copy in modals, tables, summaries, and inputs',
  },
  {
    key: 'base',
    cssVar: '--ui-font-size-base',
    rem: '0.875rem',
    pxApprox: '14px',
    usage: 'Alerts, confirmation dialogs, and prose descriptions',
  },
  {
    key: 'lg',
    cssVar: '--ui-font-size-lg',
    rem: '1rem',
    pxApprox: '16px',
    usage: 'Card titles and subsection headings',
  },
  {
    key: 'xl',
    cssVar: '--ui-font-size-xl',
    rem: '1.25rem',
    pxApprox: '20px',
    usage: 'Modal titles and KPI values',
  },
  {
    key: '2xl',
    cssVar: '--ui-font-size-2xl',
    rem: '1.5rem',
    pxApprox: '24px',
    usage: 'Primary page and view headings',
  },
] as const;

export const BREAKPOINT_TOKENS = {
  mobileSm: 480,
  mobile: 600,
  boardCompact: 700,
  tablet: 768,
  desktopSm: 1024,
  desktop: 1440,
} as const;
