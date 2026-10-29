/**
 * Client-side PII Anonymization Pipeline using Compromise NLP + Deterministic Regex Rules.
 *
 * Typed placeholders:
 * - [PERSON_NAME]
 * - [EMAIL]
 * - [PHONE]
 * - [ADDRESS]
 * - [PERSONAL_URL]
 * - [DATE_OF_BIRTH]
 * - [PERSONAL_IDENTIFIER]
 *
 * Guarantees:
 * - Deterministic, consistent replacements across repeated occurrences.
 * - Preserves technical skills, job titles, technologies, and achievements.
 */

import nlp from 'compromise';

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
};

/**
 * Runs the complete client-side anonymization pipeline.
 */
export function anonymizeCVText(inputText, customReplacements = []) {
  if (!inputText || typeof inputText !== 'string') {
    return {
      anonymizedText: '',
      detectedEntities: [],
    };
  }

  const entities = [];

  // Helper to add entity with boundary safety
  function addEntity(matchText, placeholder, type, startIndex) {
    const trimmed = matchText.trim();
    if (!trimmed || trimmed.length < 2) return;
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
    addEntity(match[0], PLACEHOLDERS.EMAIL, 'EMAIL', match.index);
  }

  // 2. Deterministic Detection: Explicit IDs
  while ((match = IDENTIFIER_REGEX.exec(inputText)) !== null) {
    addEntity(match[0], PLACEHOLDERS.IDENTIFIER, 'IDENTIFIER', match.index);
  }

  // 3. Deterministic Detection: Dates of Birth
  while ((match = DOB_REGEX.exec(inputText)) !== null) {
    addEntity(match[0], PLACEHOLDERS.DOB, 'DOB', match.index);
  }

  // 4. Deterministic Detection: URLs (Filter out generic tech terms like node.js, vue.js, next.js)
  const EXCLUDED_URL_TERMS = ['node.js', 'vue.js', 'next.js', 'react.js', 'express.js', 'nest.js', 'three.js'];
  while ((match = URL_REGEX.exec(inputText)) !== null) {
    const rawMatch = match[0];
    const isExcluded = EXCLUDED_URL_TERMS.some((term) => rawMatch.toLowerCase().includes(term));
    // Must look like an actual URL or profile
    if (!isExcluded && (rawMatch.startsWith('http') || rawMatch.includes('linkedin.com') || rawMatch.includes('github.com') || rawMatch.includes('t.me') || rawMatch.includes('www.'))) {
      addEntity(rawMatch, PLACEHOLDERS.URL, 'URL', match.index);
    }
  }

  // 5. Deterministic Detection: Phone Numbers (Filter out single year ranges like 2020-2024 or dates)
  while ((match = PHONE_REGEX.exec(inputText)) !== null) {
    const phoneStr = match[0].trim();
    const digitsOnly = phoneStr.replace(/\D/g, '');
    const isYearRange = /^\d{4}[-–]\d{4}$/.test(phoneStr);
    if (!isYearRange && digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      addEntity(phoneStr, PLACEHOLDERS.PHONE, 'PHONE', match.index);
    }
  }

  // 6. NLP Named Entity Recognition using Compromise (Persons & Places)
  try {
    const doc = nlp(inputText);

    // People
    const people = doc.people().out('array');
    people.forEach((p) => {
      const trimmed = p.trim();
      // Ensure name is not a common tech name or single letter
      const techFilter = ['react', 'python', 'docker', 'spring', 'rust', 'ruby', 'git', 'swift', 'linux', 'bash'];
      if (trimmed.length > 2 && !techFilter.includes(trimmed.toLowerCase())) {
        let idx = inputText.indexOf(trimmed);
        while (idx !== -1) {
          addEntity(trimmed, PLACEHOLDERS.PERSON, 'PERSON', idx);
          idx = inputText.indexOf(trimmed, idx + trimmed.length);
        }
      }
    });

    // Physical Addresses / Specific Locations if identified
    const places = doc.places().out('array');
    places.forEach((pl) => {
      const trimmed = pl.trim();
      // Filter out general countries/cities that are fine to keep unless part of a full home address
      const addressIndicators = ['street', 'str.', 'avenue', 'ave', 'road', 'rd', 'blvd', 'boulevard', 'apt', 'apartment'];
      const hasStreet = addressIndicators.some((ind) => trimmed.toLowerCase().includes(ind));
      if (hasStreet && trimmed.length > 4) {
        let idx = inputText.indexOf(trimmed);
        while (idx !== -1) {
          addEntity(trimmed, PLACEHOLDERS.ADDRESS, 'ADDRESS', idx);
          idx = inputText.indexOf(trimmed, idx + trimmed.length);
        }
      }
    });
  } catch (err) {
    console.warn('Compromise NLP parsing error:', err);
  }

  // 7. Add Custom Replacements from user
  if (Array.isArray(customReplacements)) {
    customReplacements.forEach((cr) => {
      if (cr.original && cr.replacement) {
        let idx = inputText.indexOf(cr.original);
        while (idx !== -1) {
          entities.push({
            original: cr.original,
            placeholder: cr.replacement,
            type: cr.type || 'CUSTOM',
            start: idx,
            end: idx + cr.original.length,
          });
          idx = inputText.indexOf(cr.original, idx + cr.original.length);
        }
      }
    });
  }

  // 8. Deduplicate and resolve overlapping entity ranges (longest match takes precedence)
  entities.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
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

  // 9. Reconstruct text with consistent placeholders
  let resultText = '';
  let cursor = 0;

  for (const ent of resolvedEntities) {
    resultText += inputText.slice(cursor, ent.start);
    resultText += ent.placeholder;
    cursor = ent.end;
  }
  resultText += inputText.slice(cursor);

  // Generate mapping dictionary for client-side deanonymization: { [placeholderOrGeneralized]: original }
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
 * Reverses anonymization on the client: replaces placeholders/generalized names back with original text.
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
 * Extracts potential company / employer names from CV text using client-side heuristics
 * and Compromise organizations/patterns so the user can review and approve them.
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
        'sql', 'postgres', 'frontend', 'backend', 'fullstack', 'developer', 'engineer'
      ];
      if (clean.length >= 3 && !skipTerms.some((t) => lower === t)) {
        foundCompanies.add(clean);
      }
    });

    // Detect patterns like "at [Company]", "Software Engineer @ [Company]"
    const atRegex = /(?:at|@)\s+([A-Z][A-Za-z0-9&.\s]{2,30})(?:,|\.|\n|$)/g;
    let match;
    while ((match = atRegex.exec(cvText)) !== null) {
      const candidate = match[1].trim();
      if (candidate.length >= 3 && !foundCompanies.has(candidate)) {
        foundCompanies.add(candidate);
      }
    }
  } catch (err) {
    console.warn('Company extraction error:', err);
  }

  return Array.from(foundCompanies);
}
