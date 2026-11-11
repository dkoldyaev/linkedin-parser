import './tokens.css';

export type ThemeMode = 'dark' | 'light';

export type SemanticTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type FunnelStatusTone =
  | 'backlog'
  | 'applied'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'rejected';

export type SpacingToken = '0' | '1' | '2' | '3' | '4' | '6' | '8' | '12' | '16';

export type FontSizeToken = '2xs' | 'xs' | 'sm' | 'md' | 'base' | 'lg' | 'xl' | '2xl';

export type FontFamilyToken = 'sans' | 'mono' | 'display';

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
    description: 'Основной фон рабочей области (Blueprint Canvas)',
  },
  {
    name: 'bg-surface',
    cssVar: '--ui-bg-surface',
    darkValue: '#101f35',
    lightValue: '#ffffff',
    description: 'Поверхность шапки, модальных окон и панелей',
  },
  {
    name: 'bg-subtle',
    cssVar: '--ui-bg-subtle',
    darkValue: '#182c46',
    lightValue: '#efefeb',
    description: 'Приглушённый фон вторичных блоков и ховеров',
  },
  {
    name: 'text-primary',
    cssVar: '--ui-text-primary',
    darkValue: '#e7f1ff',
    lightValue: '#222321',
    description: 'Основной высококонтрастный текст',
  },
  {
    name: 'text-secondary',
    cssVar: '--ui-text-secondary',
    darkValue: '#b0c4db',
    lightValue: '#555a54',
    description: 'Вторичный текст описаний и метаданных',
  },
  {
    name: 'text-muted',
    cssVar: '--ui-text-muted',
    darkValue: '#91a9c3',
    lightValue: '#6c716a',
    description: 'Приглушённый текст подсказок и счётчиков',
  },
  {
    name: 'border-subtle',
    cssVar: '--ui-border-subtle',
    darkValue: '#304c6c',
    lightValue: '#d7d8d2',
    description: 'Базовая линия сетки и разделителей (1px)',
  },
  {
    name: 'border-strong',
    cssVar: '--ui-border-strong',
    darkValue: '#527292',
    lightValue: '#a8aaa4',
    description: 'Акцентная граница контролов и колонок',
  },
  {
    name: 'pixel-line',
    cssVar: '--ui-pixel-line',
    darkValue: '#527aa3',
    lightValue: '#98a8b8',
    description: 'Чертежная линия секций модального окна',
  },
  {
    name: 'primary',
    cssVar: '--ui-primary',
    darkValue: '#79aeff',
    lightValue: '#304bde',
    description: 'Основной интерактивный акцент (Blueprint Blue)',
  },
  {
    name: 'success',
    cssVar: '--ui-success',
    darkValue: '#7eddb0',
    lightValue: '#237844',
    description: 'Семантический цвет успеха, зарплаты и высокого совпадения CV (Aspen Mint)',
  },
  {
    name: 'warning',
    cssVar: '--ui-warning',
    darkValue: '#f59e0b',
    lightValue: '#9b5f00',
    description: 'Семантический цвет предупреждений и средних расхождений',
  },
  {
    name: 'danger',
    cssVar: '--ui-danger',
    darkValue: '#f87171',
    lightValue: '#b63840',
    description: 'Семантический цвет ошибок, отказа и удаления',
  },
  {
    name: 'info',
    cssVar: '--ui-info',
    darkValue: '#99d9ff',
    lightValue: '#176389',
    description: 'Информационный акцент и бейдж Remote',
  },
] as const;

export const SPACING_TOKENS: readonly {
  readonly key: SpacingToken;
  readonly cssVar: string;
  readonly px: number;
  readonly gridFraction: string;
}[] = [
  { key: '0', cssVar: '--ui-space-0', px: 0, gridFraction: '0' },
  { key: '1', cssVar: '--ui-space-1', px: 4, gridFraction: '0.125 × grid' },
  { key: '2', cssVar: '--ui-space-2', px: 8, gridFraction: '0.25 × grid (1 unit)' },
  { key: '3', cssVar: '--ui-space-3', px: 12, gridFraction: '0.375 × grid' },
  { key: '4', cssVar: '--ui-space-4', px: 16, gridFraction: '0.5 × grid (2 units)' },
  { key: '6', cssVar: '--ui-space-6', px: 24, gridFraction: '0.75 × grid (line-height)' },
  { key: '8', cssVar: '--ui-space-8', px: 32, gridFraction: '1 × grid (base row)' },
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
  { key: '2xs', cssVar: '--ui-font-size-2xs', rem: '0.65rem', pxApprox: '10.4px', usage: 'Верхние мета-индексы карточек и теги колонок' },
  { key: 'xs', cssVar: '--ui-font-size-xs', rem: '0.68rem', pxApprox: '10.9px', usage: 'Моноширинные заголовки секций (UPPERCASE), лейблы форм и бейджи' },
  { key: 'sm', cssVar: '--ui-font-size-sm', rem: '0.75rem', pxApprox: '12px', usage: 'Компактные кнопки, табы, фильтры и вторичные подписи' },
  { key: 'md', cssVar: '--ui-font-size-md', rem: '0.8125rem', pxApprox: '13px', usage: 'Основной рабочий текст модалок, таблиц, AI-саммари и инпутов' },
  { key: 'base', cssVar: '--ui-font-size-base', rem: '0.875rem', pxApprox: '14px', usage: 'Уведомления, диалоги подтверждения и описания' },
  { key: 'lg', cssVar: '--ui-font-size-lg', rem: '1rem', pxApprox: '16px', usage: 'Заголовки карточек вакансий (.card-title)' },
  { key: 'xl', cssVar: '--ui-font-size-xl', rem: '1.25rem', pxApprox: '20px', usage: 'Заголовки модальных окон и KPI-значения' },
  { key: '2xl', cssVar: '--ui-font-size-2xl', rem: '1.5rem', pxApprox: '24px', usage: 'Крупные заголовки экранов' },
] as const;

export const BREAKPOINT_TOKENS = {
  mobileSm: 480,
  mobile: 600,
  boardCompact: 700,
  tablet: 768,
  desktopSm: 1024,
  desktop: 1440,
} as const;
