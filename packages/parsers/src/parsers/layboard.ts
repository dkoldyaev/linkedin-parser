import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace, extractCanonicalUrl, cleanUrlParams } from '../helpers';
import { createDocument } from '../dom';
import { normalizeCountry, parseLocation } from '../locationParser';

export class LayboardParser extends BaseParser {
  name = "layboard";
  source = "Layboard";
  priority = 10;
  needs_extension = false;
  domains = ["layboard.com"];

  matches(url: string): boolean {
    return url.toLowerCase().includes('layboard.com');
  }

  extractJobId(url: string): string | null {
    const m = url.match(/vakansiya\/(\d+)/);
    return m ? m[1] : null;
  }

  normalizeUrl(url: string, html?: string): string {
    if (html) {
      const canonical = extractCanonicalUrl(html);
      if (canonical) return cleanUrlParams(canonical);
    }
    const jid = this.extractJobId(url);
    if (jid) {
      // keep basic path without tracking query params
      const clean = cleanUrlParams(url);
      const match = clean.match(/https?:\/\/[^\/]+\/vakansiya\/\d+-[^\/?#]+/);
      if (match) return match[0];
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
    let country: string | undefined;
    let description: string | undefined;
    let is_closed = false;

    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();

    const els = doc.querySelectorAll('.info-list li');
    els.forEach(el => {
      const text = el.textContent || "";
      if (text.includes("Компания:") || text.includes("Company:")) {
        company = text.replace(/Компания:|Company:/g, '').trim();
      }
      if (text.includes("Город:") || text.includes("City:")) {
        city = text.replace(/Город:|City:/g, '').trim();
      }
      if (text.includes("Страна:") || text.includes("Country:")) {
        country = normalizeCountry(text.replace(/Страна:|Country:/g, '').trim());
      }
    });

    if (city || country) {
      location = [city, country].filter(Boolean).join(", ");
    }

    const descEl = doc.querySelector('.description-content') || doc.querySelector('.job-description');
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
      country,
      description: description?.substring(0, 15000),
      workplace_type: workplace_type || undefined,
      is_closed
    };
  }
}
