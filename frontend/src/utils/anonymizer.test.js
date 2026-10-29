import { describe, it } from 'node:test';
import assert from 'node:assert';
import { anonymizeCVText, deanonymizeCVText, extractPotentialCompanies, PLACEHOLDERS } from './anonymizer.js';

describe('Client-side PII Anonymizer', () => {
  it('anonymizes name, email, phone, and profile URLs with typed placeholders', () => {
    const input = 'John Smith, john@example.com, +34 600 123 456. GitHub: github.com/johnsmith. Senior React Developer at Acme Corp.';
    const result = anonymizeCVText(input);

    assert.ok(result.anonymizedText.includes(PLACEHOLDERS.PERSON), 'Contains person placeholder');
    assert.ok(result.anonymizedText.includes(PLACEHOLDERS.EMAIL), 'Contains email placeholder');
    assert.ok(result.anonymizedText.includes(PLACEHOLDERS.PHONE), 'Contains phone placeholder');
    assert.ok(result.anonymizedText.includes(PLACEHOLDERS.URL), 'Contains URL placeholder');
    assert.ok(result.anonymizedText.includes('Senior React Developer'), 'Preserves professional title');
    assert.ok(result.anonymizedText.includes('Acme Corp'), 'Company name remains unchanged by default');
  });

  it('restores original personal data and company names via deanonymizeCVText', () => {
    const originalCV = 'Alice Stone, alice@company.com, +1 555 123 4567. Lead Engineer at Stripe.';
    const companyReplacements = [{ original: 'Stripe', replacement: 'Fintech / Payment company' }];
    const anonResult = anonymizeCVText(originalCV, companyReplacements);

    assert.ok(!anonResult.anonymizedText.includes('alice@company.com'));
    assert.ok(!anonResult.anonymizedText.includes('Stripe'));
    assert.ok(anonResult.anonymizedText.includes('Fintech / Payment company'));

    // Deanonymize back using saved mappings
    const restoredCV = deanonymizeCVText(anonResult.anonymizedText, anonResult.mappings);
    assert.strictEqual(restoredCV.includes('alice@company.com'), true);
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

  it('supports custom entity replacements', () => {
    const input = 'Worked at Secret Project Zebra in 2023.';
    const result = anonymizeCVText(input, [
      { original: 'Secret Project Zebra', replacement: '[PROJECT_NAME]' },
    ]);
    assert.ok(result.anonymizedText.includes('[PROJECT_NAME]'));
    assert.ok(!result.anonymizedText.includes('Secret Project Zebra'));
  });

  it('extracts potential employer names from CV text', () => {
    const input = 'Senior Frontend Engineer at Example Bank. Previously Software Engineer @ Acme Corp.';
    const companies = extractPotentialCompanies(input);
    assert.ok(companies.some((c) => c.includes('Example Bank') || c.includes('Acme Corp')));
  });
});
