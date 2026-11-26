import type { StatusDotTone } from '@blueprint/ui-kit';

export const PALETTE_TO_HEX: Record<string, string> = {
  blue: '#2563eb',
  cyan: '#0891b2',
  amber: '#d97706',
  purple: '#9333ea',
  emerald: '#059669',
  rose: '#e11d48',
  indigo: '#1d4ed8',
  slate: '#475569',
};

export const HEX_TO_PALETTE: Record<string, string> = {
  '#2563eb': 'blue',
  '#0284c7': 'cyan',
  '#0891b2': 'cyan',
  '#d97706': 'amber',
  '#9333ea': 'purple',
  '#059669': 'emerald',
  '#e11d48': 'rose',
  '#ea580c': 'amber',
  '#1d4ed8': 'indigo',
  '#475569': 'slate',
};

export const HEX_TO_TONE: Record<string, StatusDotTone> = {
  '#2563eb': 'primary',
  '#0284c7': 'info',
  '#0891b2': 'info',
  '#d97706': 'warning',
  '#9333ea': 'accent',
  '#059669': 'success',
  '#e11d48': 'danger',
  '#ea580c': 'warning',
  '#1d4ed8': 'primary',
  '#475569': 'neutral',
};

export function resolvePaletteFromHex(color: string): string {
  return HEX_TO_PALETTE[color] || 'blue';
}

export function resolveToneFromHex(color?: string): StatusDotTone {
  if (!color) return 'primary';
  return HEX_TO_TONE[color.toLowerCase()] || 'primary';
}

export function resolveHexFromPalette(palette: string): string {
  return PALETTE_TO_HEX[palette] || '#2563eb';
}
