/**
 * Client-side PII & Company Anonymization Pipeline.
 *
 * Deterministic SHA-256 (or fast hash) based placeholders:
 * - [PERSON_NAME_hash]
 * - [EMAIL_hash]
 * - [PHONE_hash]
 * - [ADDRESS_hash]
 * - [PERSONAL_URL_hash]
 * - [DATE_OF_BIRTH_hash]
 * - [COMPANY_hash]
 *
 * All identification and hashing is performed strictly on the client.
 * LLM is NOT used for company or entity anonymization.
 *
 * Guarantees:
 * - Deterministic, consistent hashed replacements across repeated occurrences.
 * - Full client-side reversibility (deanonymization) using saved mappings.
 * - Preserves technical skills, job titles, technologies, and achievements.
 */

import nlp from 'compromise';

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

// Deterministic Regular Expressions for Structured PII
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;

// International & standard phone numbers (e.g., +34 600 123 456, (123) 456-7890, +7 999 123-45-67)
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}\b/g;

// Social & Personal profile URLs (LinkedIn, GitHub, Personal website / portfolios, Telegram)
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+|github\.com\/[a-zA-Z0-9_-]+|t\.me\/[a-zA-Z0-9_]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(?:\/[^\s]*)?)/gi;

// Date of birth patterns (e.g. Born: 12/05/1990, DOB: 1990-05-12, Date of birth: May 12, 1990)
const DOB_REGEX = /\b(?:dob|date\s+of\s+birth|born(?:\s+on)?|birthdate)[\s:]+([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4}|[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2}|[a-zA-Z]+\s+\d{1,2},?\s+\d{4})\b/gi;

// Explicit personal IDs (passport numbers, national IDs, SSN-like patterns)
const IDENTIFIER_REGEX = /\b(?:passport|id\s*(?:no|number)?|dni|nie|ssn)[\s:#]+([A-Z0-9-]{6,15})\b/gi;

export const PLACEHOLDERS = {
  PERSON: '[PERSON_NAME]',
  EMAIL: '[EMAIL]',
  PHONE: '[PHONE]',
  ADDRESS: '[ADDRESS]',
  URL: '[PERSONAL_URL]',
  DOB: '[DATE_OF_BIRTH]',
  IDENTIFIER: '[PERSONAL_IDENTIFIER]',
  COMPANY: '[COMPANY]',
};

/**
 * Builds a deterministic hashed placeholder for an entity.
 */
export function getHashedPlaceholder(type, originalValue) {
  const h = hashString(originalValue);
  switch (type) {
    case 'PERSON':
      return `[PERSON_NAME_${h}]`;
    case 'EMAIL':
      return `[EMAIL_${h}]`;
    case 'PHONE':
      return `[PHONE_${h}]`;
    case 'ADDRESS':
      return `[ADDRESS_${h}]`;
    case 'URL':
      return `[PERSONAL_URL_${h}]`;
    case 'DOB':
      return `[DATE_OF_BIRTH_${h}]`;
    case 'IDENTIFIER':
      return `[PERSONAL_IDENTIFIER_${h}]`;
    case 'COMPANY':
      return `[COMPANY_${h}]`;
    default:
      return `[CUSTOM_${h}]`;
  }
}

/**
 * Extracts potential company / employer names from CV text using client-side heuristics.
 */
export function extractPotentialCompanies(cvText) {
  if (!cvText) return [];

  const foundCompanies = new Set();

  try {
    const doc = nlp(cvText);
    const orgs = doc.organizations().out('array');
    orgs.forEach((org) => {
      const clean = org.trim();
      const lower = clean.toLowerCase();
      // Skip common tech stacks or job titles misclassified as orgs
      const skipTerms = [
        'react', 'node', 'javascript', 'typescript', 'python', 'docker', 'aws',
        'sql', 'postgres', 'frontend', 'backend', 'fullstack', 'developer', 'engineer',
        'git', 'linux', 'ci/cd', 'rest', 'graphql', 'html', 'css', 'redux', 'angular', 'vue'
      ];
      if (clean.length >= 3 && !skipTerms.some((t) => lower === t)) {
        foundCompanies.add(clean);
      }
    });

    // Detect patterns like "at [Company]", "Software Engineer @ [Company]"
    const atRegex = /(?:at|@)\s+([A-Z][A-Za-z0-9&.\s]{1,30}?)(?=[,.\n\r]|\s+in\s+[0-9]|\s+since\s+|\s*$)/g;
    let match;
    while ((match = atRegex.exec(cvText)) !== null) {
      const candidate = match[1].trim();
      const lower = candidate.toLowerCase();
      const skipTerms = ['react', 'node', 'javascript', 'typescript', 'python', 'docker', 'home', 'work', 'night'];
      if (candidate.length >= 2 && !skipTerms.includes(lower) && !foundCompanies.has(candidate)) {
        foundCompanies.add(candidate);
      }
    }
  } catch (err) {
    console.warn('Company extraction error:', err);
  }

  return Array.from(foundCompanies);
}

/**
 * Runs the complete client-side anonymization pipeline.
 * All PII and company names are hashed directly in the browser without any LLM calls.
 */
export function anonymizeCVText(inputText, customReplacements = []) {
  if (!inputText || typeof inputText !== 'string') {
    return {
      anonymizedText: '',
      detectedEntities: [],
      mappings: [],
    };
  }

  const entities = [];

  // Helper to add entity with boundary safety
  function addEntity(matchText, type, startIndex) {
    const trimmed = matchText.trim();
    if (!trimmed || trimmed.length < 2) return;
    const placeholder = getHashedPlaceholder(type, trimmed);
    entities.push({
      original: trimmed,
      placeholder,
      type,
      start: startIndex,
      end: startIndex + matchText.length,
    });
  }

  // 1. Deterministic Detection: Emails
  let match;
  while ((match = EMAIL_REGEX.exec(inputText)) !== null) {
    addEntity(match[0], 'EMAIL', match.index);
  }

  // 2. Deterministic Detection: Explicit IDs
  while ((match = IDENTIFIER_REGEX.exec(inputText)) !== null) {
    addEntity(match[0], 'IDENTIFIER', match.index);
  }

  // 3. Deterministic Detection: Dates of Birth
  while ((match = DOB_REGEX.exec(inputText)) !== null) {
    addEntity(match[0], 'DOB', match.index);
  }

  // 4. Deterministic Detection: URLs (Filter out generic tech terms)
  const EXCLUDED_URL_TERMS = ['node.js', 'vue.js', 'next.js', 'react.js', 'express.js', 'nest.js', 'three.js'];
  while ((match = URL_REGEX.exec(inputText)) !== null) {
    const rawMatch = match[0];
    const isExcluded = EXCLUDED_URL_TERMS.some((term) => rawMatch.toLowerCase().includes(term));
    if (!isExcluded && (rawMatch.startsWith('http') || rawMatch.includes('linkedin.com') || rawMatch.includes('github.com') || rawMatch.includes('t.me') || rawMatch.includes('www.'))) {
      addEntity(rawMatch, 'URL', match.index);
    }
  }

  // 5. Deterministic Detection: Phone Numbers
  while ((match = PHONE_REGEX.exec(inputText)) !== null) {
    const phoneStr = match[0].trim();
    if (!/^\d{4}$/.test(phoneStr) && !/^\d{4}[-–]\d{4}$/.test(phoneStr)) {
      const digits = phoneStr.replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        addEntity(match[0], 'PHONE', match.index);
      }
    }
  }

  // 6. NLP Detection: Person Names, Addresses & Companies
  try {
    const doc = nlp(inputText);

    // People
    const people = doc.people().out('array');
    people.forEach((p) => {
      const trimmed = p.trim();
      const techFilter = ['react', 'python', 'docker', 'spring', 'rust', 'ruby', 'git', 'swift', 'linux', 'bash'];
      if (trimmed.length > 2 && !techFilter.includes(trimmed.toLowerCase())) {
        let idx = inputText.indexOf(trimmed);
        while (idx !== -1) {
          addEntity(trimmed, 'PERSON', idx);
          idx = inputText.indexOf(trimmed, idx + trimmed.length);
        }
      }
    });

    // Physical Addresses
    const places = doc.places().out('array');
    places.forEach((pl) => {
      const trimmed = pl.trim();
      const addressIndicators = ['street', 'str.', 'avenue', 'ave', 'road', 'rd', 'blvd', 'boulevard', 'apt', 'apartment'];
      const hasStreet = addressIndicators.some((ind) => trimmed.toLowerCase().includes(ind));
      if (hasStreet && trimmed.length > 4) {
        let idx = inputText.indexOf(trimmed);
        while (idx !== -1) {
          addEntity(trimmed, 'ADDRESS', idx);
          idx = inputText.indexOf(trimmed, idx + trimmed.length);
        }
      }
    });

    // Automatically Detect & Hash Companies on the client
    const detectedCompanies = extractPotentialCompanies(inputText);
    detectedCompanies.forEach((comp) => {
      let idx = inputText.indexOf(comp);
      while (idx !== -1) {
        addEntity(comp, 'COMPANY', idx);
        idx = inputText.indexOf(comp, idx + comp.length);
      }
    });
  } catch (err) {
    console.warn('NLP parsing error in client anonymizer:', err);
  }

  // 7. Add Custom Replacements from user (if any manual overrides provided)
  if (Array.isArray(customReplacements)) {
    customReplacements.forEach((cr) => {
      if (cr.original) {
        const placeholder = cr.replacement || getHashedPlaceholder(cr.type || 'CUSTOM', cr.original);
        let idx = inputText.indexOf(cr.original);
        while (idx !== -1) {
          // Priority over automatic matches: place custom replacement at front
          entities.unshift({
            original: cr.original,
            placeholder,
            type: cr.type || 'CUSTOM',
            start: idx,
            end: idx + cr.original.length,
            isCustom: true,
          });
          idx = inputText.indexOf(cr.original, idx + cr.original.length);
        }
      }
    });
  }

  // 8. Deduplicate and resolve overlapping entity ranges (custom and longest match take precedence)
  entities.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (Boolean(a.isCustom) !== Boolean(b.isCustom)) return a.isCustom ? -1 : 1;
    return (b.end - b.start) - (a.end - a.start);
  });

  const resolvedEntities = [];
  let lastEnd = 0;

  for (const ent of entities) {
    if (ent.start >= lastEnd) {
      resolvedEntities.push(ent);
      lastEnd = ent.end;
    }
  }

  // 9. Reconstruct text with hashed placeholders
  let resultText = '';
  let cursor = 0;

  for (const ent of resolvedEntities) {
    resultText += inputText.slice(cursor, ent.start);
    resultText += ent.placeholder;
    cursor = ent.end;
  }
  resultText += inputText.slice(cursor);

  // Generate mapping dictionary for client-side deanonymization: { placeholder, original, type }
  const mappings = [];
  const seen = new Set();
  for (const ent of resolvedEntities) {
    const key = `${ent.placeholder}->${ent.original}`;
    if (!seen.has(key)) {
      seen.add(key);
      mappings.push({
        placeholder: ent.placeholder,
        original: ent.original,
        type: ent.type,
      });
    }
  }

  return {
    anonymizedText: resultText,
    detectedEntities: resolvedEntities,
    mappings,
  };
}

/**
 * Reverses anonymization on the client: replaces hashed placeholders back with original text.
 * @param {string} text Anonymized text to restore
 * @param {Array<{placeholder: string, original: string}>} mappings Saved replacement mappings
 * @returns {string} Restored/Deanonymized text
 */
export function deanonymizeCVText(text, mappings = []) {
  if (!text || typeof text !== 'string') return '';
  if (!Array.isArray(mappings) || mappings.length === 0) return text;

  let restored = text;

  // Sort mappings by placeholder length descending to avoid partial substring collisions
  const sortedMappings = [...mappings].sort(
    (a, b) => (b.placeholder || '').length - (a.placeholder || '').length
  );

  for (const map of sortedMappings) {
    if (map.placeholder && map.original) {
      // Escape placeholder for regex
      const escaped = map.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restored = restored.replace(new RegExp(escaped, 'g'), map.original);
    }
  }

  return restored;
}

/**
 * Recursively deanonymizes an object or array (e.g. DeveloperCV structured JSON)
 * by reversing all placeholder tokens and generalized names using saved mappings.
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
