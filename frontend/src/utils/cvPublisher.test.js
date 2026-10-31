import test from 'node:test';
import assert from 'node:assert/strict';
import { deanonymizeObject } from './anonymizer.js';
import { sanitizeDeveloperCVPayload } from './cvPublisher.js';

test('Client-side DeveloperCV Deanonymization & Sanitization', async (t) => {
  await t.test('deanonymizes structured DeveloperCV without exposing PII on server', () => {
    const anonymizedAdaptedCv = {
      name: '[PERSON_NAME]',
      headline: 'Senior Frontend Developer',
      summary: 'Experienced with React and Next.js at [COMPANY_1]. Contact at [EMAIL].',
      contact: {
        email: '[EMAIL]',
        phone: '[PHONE]',
        location: { city: 'Terrassa', country: 'Spain' },
        links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/test' }]
      },
      workExperience: [
        {
          id: 'exp-1',
          title: 'Frontend Engineer',
          company: { name: '[COMPANY_1]', url: 'https://example.com' },
          employmentType: 'full-time',
          startDate: '2023-01',
          endDate: '2024-01',
          location: { city: 'Terrassa', country: 'Spain' },
          summary: 'Built web apps at [COMPANY_1].',
          highlights: ['Optimized Next.js page loads by 40%']
        }
      ],
      skills: ['React', 'TypeScript', 'Next.js'],
      languages: ['English', 'Spanish'],
      education: [],
      volunteerExperience: []
    };

    const mappings = [
      { placeholder: '[PERSON_NAME]', original: 'Dmitry Koldyaev' },
      { placeholder: '[EMAIL]', original: 'dkoldyaev@gmail.com' },
      { placeholder: '[PHONE]', original: '+34 674 82 29 94' },
      { placeholder: '[COMPANY_1]', original: 'Tochka Bank' },
    ];

    const deanonymized = deanonymizeObject(anonymizedAdaptedCv, mappings);

    assert.equal(deanonymized.name, 'Dmitry Koldyaev');
    assert.equal(deanonymized.contact.email, 'dkoldyaev@gmail.com');
    assert.equal(deanonymized.contact.phone, '+34 674 82 29 94');
    assert.equal(deanonymized.workExperience[0].company.name, 'Tochka Bank');
    assert.match(deanonymized.summary, /Tochka Bank/);
    assert.match(deanonymized.summary, /dkoldyaev@gmail\.com/);
  });

  await t.test('sanitizes DeveloperCV payload according to OpenAPI schema requirements', () => {
    const raw = {
      name: 'Test Dev',
      headline: 'Engineer',
      summary: 'Summary',
      contact: {
        email: 'invalid-email',
        phone: '123',
        location: { city: 'Madrid', country: 'Spain' },
        links: [{ label: 'Site', url: 'http://insecure.com' }, { label: 'Secure', url: 'https://secure.com' }]
      },
      workExperience: [
        {
          id: 'Bad ID! #1',
          title: 'Dev',
          company: { name: 'Comp', url: 'not-a-url' },
          startDate: '2022',
          endDate: null,
          location: { city: 'Madrid', country: 'Spain' },
          highlights: ['Bullet 1']
        }
      ],
      skills: ['React', 'React', 'TypeScript'],
      languages: ['English'],
      education: [],
      volunteerExperience: []
    };

    const cleaned = sanitizeDeveloperCVPayload(raw);

    assert.equal(cleaned.name, 'Test Dev');
    // Invalid email replaced with valid fallback
    assert.match(cleaned.contact.email, /@/);
    // Insecure link stripped, https preserved
    assert.equal(cleaned.contact.links.length, 1);
    assert.equal(cleaned.contact.links[0].url, 'https://secure.com');
    // ID slugified
    assert.match(cleaned.workExperience[0].id, /^[a-z0-9-]+$/);
    // Invalid company URL removed
    assert.equal(cleaned.workExperience[0].company.url, null);
    // Unique skills
    assert.deepEqual(cleaned.skills, ['React', 'TypeScript']);
  });
});
