import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace, extractCanonicalUrl, cleanUrlParams } from '../helpers';
import { createDocument } from '../dom';

export class GeekJobParser extends BaseParser {
  name = "geekjob";
  source = "GeekJob";
  priority = 10;
  needs_extension = false;
  domains = ["geekjob.ru"];

  matches(url: string): boolean {
    return url.toLowerCase().includes('geekjob.ru');
  }

  extractJobId(url: string): string | null {
    const m = url.match(/\/(?:vacancy|geek)\/([a-f0-9]+)/i);
    return m ? m[1] : null;
  }

  normalizeUrl(url: string, html?: string): string {
    if (html) {
      const canonical = extractCanonicalUrl(html);
      if (canonical) return cleanUrlParams(canonical);
    }
    const jid = this.extractJobId(url);
    if (jid) {
      return `https://geekjob.ru/vacancy/${jid}`;
    }
    return cleanUrlParams(url);
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = this.normalizeUrl(url, html);
    const job_id = this.extractJobId(url) || undefined;
    if (!html) return { url, source: this.source, job_id };

    const doc = createDocument(html);
    
    let title: string | undefined;
    let company: string | undefined;
    let location: string | undefined;
    let city: string | undefined;
    let description: string | undefined;
    let is_closed = false;

    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();

    const companyEl = doc.querySelector('.company-name a') || doc.querySelector('.company-name');
    if (companyEl) company = companyEl.textContent?.trim();

    const locEl = doc.querySelector('.location');
    if (locEl) {
      location = locEl.textContent?.trim();
      city = location;
    }

    const descEl = doc.querySelector('#vacancy-description');
    if (descEl) description = cleanText(descEl);

    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");

    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("вакансия в архиве") || text.includes("вакансия закрыта")) {
      is_closed = true;
    }

    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country: "Russia",
      description: description?.substring(0, 15000),
      workplace_type: workplace_type || undefined,
      is_closed
    };
  }
}
