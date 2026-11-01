/**
 * Client-side CV Pipeline.
 *
 * NOTE: Anonymization is currently DISABLED per user request:
 * The uploaded CV is used directly as-is without hashing or anonymizing personal data.
 * All functions below safely handle the text.
 */

// import nlp from 'compromise';

// Fast deterministic 8-character hash function for strings
export function hashString(str) {
  if (!str) return '00000000';
  let hash = 5381;
  const cleanStr = String(str).trim().toLowerCase();
  for (let i = 0; i < cleanStr.length; i++) {
    hash = ((hash << 5) + hash) + cleanStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return hex.slice(0, 8);
}

export function getHashedPlaceholder(type, originalValue) {
  return originalValue || '';
}

export function extractPotentialCompanies(text) {
  return [];
}

/**
 * Runs client-side CV processing.
 * Anonymization is disabled: returns the source text directly as anonymizedText.
 */
export function anonymizeCVText(inputText, customReplacements = []) {
  if (!inputText || typeof inputText !== 'string') {
    return {
      anonymizedText: '',
      detectedEntities: [],
      mappings: [],
    };
  }

  // ANONYMIZATION DISABLED: return original text as-is
  return {
    anonymizedText: inputText,
    detectedEntities: [],
    mappings: [],
  };
}

/**
 * Reverses anonymization: replaces placeholders if mappings exist, otherwise returns text as-is.
 */
export function deanonymizeCVText(text, mappings = []) {
  if (!text || typeof text !== 'string') return '';
  if (!Array.isArray(mappings) || mappings.length === 0) return text;

  let restored = text;
  const sortedMappings = [...mappings].sort(
    (a, b) => (b.placeholder || '').length - (a.placeholder || '').length
  );

  for (const map of sortedMappings) {
    if (map.placeholder && map.original) {
      const escaped = map.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restored = restored.replace(new RegExp(escaped, 'g'), map.original);
    }
  }

  return restored;
}

/**
 * Recursively deanonymizes an object or array.
 */
export function deanonymizeObject(obj, mappings = []) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return deanonymizeCVText(obj, mappings);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deanonymizeObject(item, mappings));
  }
  if (typeof obj === 'object') {
    const copy = {};
    for (const [key, val] of Object.entries(obj)) {
      copy[key] = deanonymizeObject(val, mappings);
    }
    return copy;
  }
  return obj;
}
