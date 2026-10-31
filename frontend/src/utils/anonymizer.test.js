import { describe, it } from 'node:test';
import assert from 'node:assert';
import { anonymizeCVText, deanonymizeCVText, extractPotentialCompanies, hashString, getHashedPlaceholder } from './anonymizer.js';

describe('Client-side Hashing PII & Company Anonymizer', () => {
  it('hashes name, email, phone, URLs, and companies with deterministic hashes', () => {
    const input = 'John Smith, john@example.com, +34 600 123 456. GitHub: github.com/johnsmith. Senior React Developer at Acme Corp.';
    const result = anonymizeCVText(input);

    assert.ok(result.anonymizedText.includes('[PERSON_NAME_'), 'Contains hashed person placeholder');
    assert.ok(result.anonymizedText.includes('[EMAIL_'), 'Contains hashed email placeholder');
    assert.ok(result.anonymizedText.includes('[PHONE_'), 'Contains hashed phone placeholder');
    assert.ok(result.anonymizedText.includes('[PERSONAL_URL_'), 'Contains hashed URL placeholder');
    assert.ok(result.anonymizedText.includes('[COMPANY_'), 'Contains hashed company placeholder');
    assert.ok(!result.anonymizedText.includes('john@example.com'), 'Email is completely stripped');
    assert.ok(!result.anonymizedText.includes('Acme Corp'), 'Company is hashed');
    assert.ok(result.anonymizedText.includes('Senior React Developer'), 'Preserves professional title');
  });

  it('restores original personal data and company names via deanonymizeCVText', () => {
    const originalCV = 'Alice Stone, alice@company.com, +1 555 123 4567. Lead Engineer at Stripe.';
    const anonResult = anonymizeCVText(originalCV);

    assert.ok(!anonResult.anonymizedText.includes('alice@company.com'));
    assert.ok(!anonResult.anonymizedText.includes('Alice Stone'));
    assert.ok(!anonResult.anonymizedText.includes('Stripe'));

    // Deanonymize back using saved mappings
    const restoredCV = deanonymizeCVText(anonResult.anonymizedText, anonResult.mappings);
    assert.strictEqual(restoredCV.includes('alice@company.com'), true);
    assert.strictEqual(restoredCV.includes('Alice Stone'), true);
    assert.strictEqual(restoredCV.includes('Stripe'), true);
    assert.strictEqual(restoredCV.includes('+1 555 123 4567'), true);
  });

  it('preserves technical skills and does not false-positive on common tech names', () => {
    const input = 'Experienced with React, Python, Docker, and Node.js. Built high throughput APIs.';
    const result = anonymizeCVText(input);

    assert.strictEqual(result.anonymizedText.includes('React'), true);
    assert.strictEqual(result.anonymizedText.includes('Python'), true);
    assert.strictEqual(result.anonymizedText.includes('Docker'), true);
    assert.strictEqual(result.anonymizedText.includes('Node.js'), true);
  });

  it('supports custom entity replacements with hashing', () => {
    const input = 'Worked at Secret Project Zebra in 2023.';
    const result = anonymizeCVText(input, [
      { original: 'Secret Project Zebra' },
    ]);
    assert.ok(result.anonymizedText.includes('[CUSTOM_'));
    assert.ok(!result.anonymizedText.includes('Secret Project Zebra'));

    const restored = deanonymizeCVText(result.anonymizedText, result.mappings);
    assert.strictEqual(restored.includes('Secret Project Zebra'), true);
  });

  it('extracts potential employer names from CV text', () => {
    const input = 'Senior Frontend Engineer at Example Bank. Previously Software Engineer @ Acme Corp.';
    const companies = extractPotentialCompanies(input);
    assert.ok(companies.some((c) => c.includes('Example Bank') || c.includes('Acme Corp')));
  });
});
