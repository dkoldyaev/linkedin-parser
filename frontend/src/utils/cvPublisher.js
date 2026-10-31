/**
 * Client-side integration service with the Curriculum Vitae Dynamic API
 * (https://cv.build.dkoldyaev.com/openapi.json).
 *
 * Strict Privacy Requirement:
 * The tailored anonymized DeveloperCV generated on the server is deanonymized
 * EXCLUSIVELY on the client using the user's local replacement mappings before
 * being transmitted with the authentication token to publish a new dedicated CV URL.
 */

import { deanonymizeObject } from './anonymizer.js';
import { getLocalCV } from './cvIndexedDB.js';

export const DEFAULT_CV_API_URL = 'https://cv.build.dkoldyaev.com';
export const CV_SERVICE_TOKEN = 'cvt_6aa894042bcc46afc448983f57b7756a63a075626a7eba2e';

/**
 * Validates and cleans DeveloperCV payload according to the API schema
 * before submitting to https://cv.build.dkoldyaev.com/api/cv
 */
export function sanitizeDeveloperCVPayload(rawCv) {
  const cv = JSON.parse(JSON.stringify(rawCv || {}));

  // Ensure top-level required fields
  cv.name = String(cv.name || 'Anonymous Developer').trim();
  cv.headline = String(cv.headline || 'Software Engineer').trim();
  cv.summary = String(cv.summary || '').trim();

  // Contact
  cv.contact = cv.contact || {};
  let email = String(cv.contact.email || '').trim();
  if (!email || !email.includes('@')) {
    email = 'candidate@email.local';
  }
  cv.contact.email = email;
  cv.contact.phone = String(cv.contact.phone || '+1 555 000 0000').trim();

  // Contact Location
  const loc = cv.contact.location || {};
  cv.contact.location = {
    city: loc.city || null,
    country: String(loc.country || 'Spain').trim(),
  };
  if (loc.region) {
    cv.contact.location.region = String(loc.region).trim();
  }

  // Links: must have pattern "^https://"
  const validLinks = [];
  if (Array.isArray(cv.contact.links)) {
    for (const link of cv.contact.links) {
      if (link && link.label && link.url && String(link.url).startsWith('https://')) {
        validLinks.push({
          label: String(link.label).trim(),
          url: String(link.url).trim(),
        });
      }
    }
  }
  cv.contact.links = validLinks;

  // Work experience
  cv.workExperience = Array.isArray(cv.workExperience) ? cv.workExperience.map((w, idx) => {
    let slug = String(w.id || `work-${idx + 1}`).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = `exp-${idx + 1}`;

    const validEmploymentTypes = ['freelance', 'full-time', 'part-time', 'contract', 'internship', 'unspecified'];
    const empType = validEmploymentTypes.includes(w.employmentType) ? w.employmentType : 'unspecified';

    let startDate = String(w.startDate || '2020-01').trim();
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(startDate)) {
      startDate = '2020-01';
    }

    let endDate = w.endDate ? String(w.endDate).trim() : null;
    if (endDate && !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(endDate)) {
      endDate = null;
    }

    let companyUrl = w.company?.url || null;
    if (companyUrl && !String(companyUrl).startsWith('https://')) {
      companyUrl = null;
    }

    return {
      id: slug,
      title: String(w.title || 'Developer').trim(),
      company: {
        name: String(w.company?.name || 'Company').trim(),
        url: companyUrl,
      },
      employmentType: empType,
      startDate,
      endDate,
      location: {
        city: w.location?.city || null,
        country: String(w.location?.country || 'Remote').trim(),
      },
      summary: w.summary ? String(w.summary).trim() : null,
      highlights: Array.isArray(w.highlights) && w.highlights.length > 0
        ? w.highlights.map((h) => String(h).trim()).filter(Boolean)
        : ['Contributed to core development and project goals.'],
    };
  }) : [];

  // Skills
  cv.skills = Array.isArray(cv.skills) && cv.skills.length > 0
    ? Array.from(new Set(cv.skills.map((s) => String(s).trim()).filter(Boolean)))
    : ['Software Development'];

  // Languages
  cv.languages = Array.isArray(cv.languages) && cv.languages.length > 0
    ? Array.from(new Set(cv.languages.map((l) => String(l).trim()).filter(Boolean)))
    : ['English'];

  // Education
  cv.education = Array.isArray(cv.education) ? cv.education.map((e) => {
    let startYear = String(e.startDate || '2015').trim().slice(0, 4);
    if (!/^[0-9]{4}$/.test(startYear)) startYear = '2015';

    let endYear = e.endDate ? String(e.endDate).trim().slice(0, 4) : null;
    if (endYear && !/^[0-9]{4}$/.test(endYear)) endYear = null;

    return {
      institution: String(e.institution || 'University').trim(),
      fieldOfStudy: String(e.fieldOfStudy || 'Computer Science').trim(),
      startDate: startYear,
      endDate: endYear,
      location: {
        city: e.location?.city || null,
        country: String(e.location?.country || 'Spain').trim(),
      },
      degree: e.degree ? String(e.degree).trim() : null,
    };
  }) : [];

  // Volunteer
  cv.volunteerExperience = Array.isArray(cv.volunteerExperience) ? cv.volunteerExperience.map((v) => {
    let startYear = String(v.startDate || '2018').trim().slice(0, 4);
    if (!/^[0-9]{4}$/.test(startYear)) startYear = '2018';

    let endYear = v.endDate ? String(v.endDate).trim().slice(0, 4) : null;
    if (endYear && !/^[0-9]{4}$/.test(endYear)) endYear = null;

    return {
      organization: String(v.organization || 'Community').trim(),
      role: String(v.role || 'Volunteer').trim(),
      startDate: startYear,
      endDate: endYear,
      location: {
        city: v.location?.city || null,
        country: String(v.location?.country || 'Spain').trim(),
      },
      highlights: Array.isArray(v.highlights) && v.highlights.length > 0
        ? v.highlights.map((h) => String(h).trim()).filter(Boolean)
        : ['Volunteered support and assistance.'],
    };
  }) : [];

  return cv;
}

/**
 * Deanonymizes the adapted DeveloperCV using client-stored replacement mappings,
 * sanitizes it according to OpenAPI schema requirements, and publishes it
 * directly from the browser to https://cv.build.dkoldyaev.com/api/cv.
 *
 * @param {Object} anonymizedAdaptedCv The anonymized DeveloperCV produced by LLM
 * @param {string} token API access token (cvt_...)
 * @returns {Promise<{id: string, url: string, markdownUrl: string, pdfUrl: string, jsonUrl: string}>}
 */
export async function publishAdaptedCV(anonymizedAdaptedCv, token = CV_SERVICE_TOKEN) {
  if (!anonymizedAdaptedCv) {
    throw new Error('No adapted CV data available to publish');
  }

  // 1. Retrieve local replacement mappings from IndexedDB
  const localData = await getLocalCV();
  const mappings = localData?.replacementMappings || [];

  // 2. Client-side deanonymization
  const deanonymizedCv = deanonymizeObject(anonymizedAdaptedCv, mappings);

  // 3. Clean and validate against OpenAPI schema
  const payload = sanitizeDeveloperCVPayload(deanonymizedCv);

  // 4. Send to CV API using proxy to avoid browser CORS restrictions
  let res;
  try {
    res = await fetch('/api/cv/publish-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': token,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // If local proxy fails due to network/routing, attempt direct fallback
    res = await fetch(`${DEFAULT_CV_API_URL}/api/cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-api-key': token,
      },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const errDetail = errorBody.error || errorBody.detail || (errorBody.details ? JSON.stringify(errorBody.details) : res.statusText);
    throw new Error(`Failed to publish tailored CV (${res.status}): ${typeof errDetail === 'object' ? JSON.stringify(errDetail) : errDetail}`);
  }

  const result = await res.json();
  return result;
}
