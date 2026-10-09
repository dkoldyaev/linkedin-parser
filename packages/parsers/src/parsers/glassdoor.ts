import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, findJsonLd, normalizeWorkplace } from '../helpers';
import { createDocument } from '../dom';
import { normalizeCountry, parseLocation } from '../locationParser';

export class GlassdoorParser extends BaseParser {
  name = "glassdoor";
  source = "Glassdoor";
  priority = 10;
  needs_extension = false;

  matches(url: string): boolean {
    return url.toLowerCase().includes('glassdoor');
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = url.trim();
    if (!html) {
      return { url, source: this.source };
    }

    const doc = createDocument(html);
    const jld = findJsonLd(html, "JobPosting");
    
    let title: string | undefined;
    let company: string | undefined;
    let location: string | undefined;
    let city: string | undefined;
    let country: string | undefined;
    let description: string | undefined;
    let is_closed = false;

    if (jld) {
      title = jld.title;
      if (jld.hiringOrganization?.name) {
        company = jld.hiringOrganization.name;
      }
      if (jld.jobLocation?.address) {
        const addr = jld.jobLocation.address;
        city = addr.addressLocality;
        if (addr.addressCountry) {
          country = normalizeCountry(String(addr.addressCountry));
        }
        location = [city, addr.addressRegion, country].filter(Boolean).join(", ");
      }
      if (jld.description) {
        description = cleanText(createDocument(jld.description).body);
      }
    }

    if (!title) {
      const h1 = doc.querySelector("h1");
      if (h1) title = h1.textContent?.trim();
    }
    
    if (!company) {
      const el = doc.querySelector('[data-test="employerName"]');
      if (el) company = el.textContent?.trim().replace(/★.*/, '').trim();
    }
    
    if (!location) {
      const el = doc.querySelector('[data-test="location"]');
      if (el) {
        location = el.textContent?.trim();
        const [c, cnt] = parseLocation(location!);
        city = c;
        if (cnt) country = cnt;
      }
    }
    
    if (!description) {
      const el = doc.querySelector('#JobDescriptionContainer') || doc.querySelector('.jobDescriptionContent');
      if (el) description = cleanText(el);
    }

    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");

    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("this job is no longer available") || text.includes("вакансия закрыта")) {
      is_closed = true;
    }

    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country,
      description: description?.substring(0, 15000),
      workplace_type: workplace_type || undefined,
      is_closed
    };
  }
}
