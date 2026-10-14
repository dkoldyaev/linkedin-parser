import { describe, it, expect } from 'vitest';

import {
  cleanText,
  findJsonLd,
  parseJsonLdSalary,
  normalizeCurrency,
  normalizePeriod,
  parseSalaryString,
  normalizeWorkplace,
  cleanUrlParams,
  extractCanonicalUrl
} from './helpers';
import { createDocument } from './dom';

describe('helpers', () => {
  it('cleanText should format HTML correctly', () => {
    const html = '<div>Hello<br>World<p>Paragraph</p><ul><li>Item 1</li><li>Item 2</li></ul></div>';
    const doc = createDocument(html);
    const text = cleanText(doc.body);
    expect(text).toContain('Hello');
    expect(text).toContain('World');
    expect(text).toContain('Paragraph');
    expect(text).toContain('Item 1');
    expect(text).toContain('Item 2');
  });

  it('findJsonLd should find JobPosting', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "http://schema.org",
              "@type": "JobPosting",
              "title": "Software Engineer"
            }
          </script>
        </head>
      </html>
    `;
    const data = findJsonLd(html);
    expect(data).toBeDefined();
    expect(data['@type']).toBe('JobPosting');
    expect(data.title).toBe('Software Engineer');
  });

  it('parseJsonLdSalary should parse salary object', () => {
    const data = {
      baseSalary: {
        currency: 'USD',
        value: {
          unitText: 'YEAR',
          minValue: 100000,
          maxValue: 150000
        }
      }
    };
    const parsed = parseJsonLdSalary(data);
    expect(parsed.salary_min).toBe(100000);
    expect(parsed.salary_max).toBe(150000);
    expect(parsed.salary_currency).toBe('USD');
    expect(parsed.salary_period).toBe('year');
  });

  it('parseSalaryString should handle unstructured salaries', () => {
    expect(parseSalaryString('от 100 000 ₽ на руки')).toEqual({
      salary_min: 100000,
      salary_currency: 'RUB',
      salary_period: 'month'
    });
    
    expect(parseSalaryString('$25 - $50 / hr')).toEqual({
      salary_min: 25,
      salary_max: 50,
      salary_currency: 'USD',
      salary_period: 'hour'
    });

    expect(parseSalaryString('261 900 — 371 000 руб.')).toEqual({
      salary_min: 261900,
      salary_max: 371000,
      salary_currency: 'RUB',
      salary_period: 'month'
    });
  });

  it('normalizeWorkplace should detect remote, hybrid, on-site', () => {
    expect(normalizeWorkplace('Удаленная работа')).toBe('remote');
    expect(normalizeWorkplace('Гибридный формат')).toBe('hybrid');
    expect(normalizeWorkplace('В офисе')).toBe('on-site');
  });

  it('cleanUrlParams and extractCanonicalUrl work as expected', () => {
    expect(cleanUrlParams('https://www.example.com/jobs/123?utm_source=test&ref=abc#section')).toBe('https://www.example.com/jobs/123');
    const htmlWithCanonical = '<html><head><link rel="canonical" href="https://example.com/canonical/job/456"></head></html>';
    expect(extractCanonicalUrl(htmlWithCanonical)).toBe('https://example.com/canonical/job/456');
  });
});

