/**
 * Client-side CV Pipeline.
 *
 * NOTE: Anonymization is currently DISABLED per user request:
 * The uploaded CV is used directly as-is without hashing or anonymizing personal data.
 * All functions below safely handle the text.
 */

export interface AnonymizationMapping {
  placeholder?: string;
  original?: string;
  replacement?: string;
}

export interface AnonymizeResult {
  anonymizedText: string;
  detectedEntities: unknown[];
  mappings: AnonymizationMapping[];
}

export function hashString(str?: string | null): string {
  if (!str) return '00000000';
  let hash = 5381;
  const cleanStr = String(str).trim().toLowerCase();
  for (let i = 0; i < cleanStr.length; i++) {
    hash = ((hash << 5) + hash) + cleanStr.charCodeAt(i);
    hash |= 0;
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return hex.slice(0, 8);
}

export function getHashedPlaceholder(_type: string, originalValue?: string | null): string {
  return originalValue || '';
}

export function extractPotentialCompanies(_text?: string | null): string[] {
  return [];
}

/**
 * Runs client-side CV processing.
 * Anonymization is disabled: returns the source text directly as anonymizedText.
 */
export function anonymizeCVText(
  inputText?: unknown,
  _customReplacements?: AnonymizationMapping[]
): AnonymizeResult {
  if (!inputText || typeof inputText !== 'string') {
    return {
      anonymizedText: '',
      detectedEntities: [],
      mappings: [],
    };
  }

  return {
    anonymizedText: inputText,
    detectedEntities: [],
    mappings: [],
  };
}

function applySingleMapping(text: string, map: AnonymizationMapping): string {
  if (!map.placeholder || !map.original) return text;
  const escaped = map.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'g'), map.original);
}

/**
 * Reverses anonymization: replaces placeholders if mappings exist, otherwise returns text as-is.
 */
export function deanonymizeCVText(text?: unknown, mappings?: AnonymizationMapping[]): string {
  if (!text || typeof text !== 'string') return '';
  if (!Array.isArray(mappings) || mappings.length === 0) return text;

  const sortedMappings = [...mappings].sort(
    (a, b) => (b.placeholder || '').length - (a.placeholder || '').length
  );

  let restored = text;
  for (const map of sortedMappings) {
    restored = applySingleMapping(restored, map);
  }
  return restored;
}

/**
 * Recursively deanonymizes an object or array.
 */
export function deanonymizeObject<T>(obj: T, mappings?: AnonymizationMapping[]): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return deanonymizeCVText(obj, mappings) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deanonymizeObject(item, mappings)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      copy[key] = deanonymizeObject(val, mappings);
    }
    return copy as T;
  }
  return obj;
}
