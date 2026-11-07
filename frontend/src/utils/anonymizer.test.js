import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { anonymizeCVText, deanonymizeCVText, deanonymizeObject, extractPotentialCompanies, hashString, getHashedPlaceholder } from './anonymizer.js';

describe('Current CV processing contract (anonymization disabled)', () => {
  it('preserves source text and does not claim to have anonymized entities', () => {
    const input = 'John Smith, john@example.com, Engineer at Acme Corp.';
    assert.deepEqual(anonymizeCVText(input), { anonymizedText: input, detectedEntities: [], mappings: [] });
    assert.deepEqual(anonymizeCVText(input, [{ original: 'Acme Corp', replacement: 'Company' }]),
      { anonymizedText: input, detectedEntities: [], mappings: [] });
    assert.deepEqual(extractPotentialCompanies(input), []);
    assert.equal(getHashedPlaceholder('EMAIL', 'john@example.com'), 'john@example.com');
  });
  it('handles invalid and empty input', () => {
    for (const value of [null, undefined, 123, '']) {
      assert.deepEqual(anonymizeCVText(value), { anonymizedText: '', detectedEntities: [], mappings: [] });
    }
  });
  it('restores legacy mappings including literal regexp punctuation', () => {
    const mappings = [{ placeholder: '[EMAIL_1]', original: 'alice@example.com' }];
    assert.equal(deanonymizeCVText('[EMAIL_1] [EMAIL_1]', mappings), 'alice@example.com alice@example.com');
    assert.deepEqual(deanonymizeObject({ a: ['[EMAIL_1]', null, 7] }, mappings), { a: ['alice@example.com', null, 7] });
  });
  it('preserves text without legacy mappings', () => {
    assert.equal(deanonymizeCVText('Python React'), 'Python React');
    assert.equal(deanonymizeCVText(null), '');
    assert.equal(hashString('Python'), hashString('Python'));
    assert.notEqual(hashString('Python'), hashString('React'));
  });
});
