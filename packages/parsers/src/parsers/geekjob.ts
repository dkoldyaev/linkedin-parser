import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace } from '../helpers';
import { createDocument } from '../dom';

export class GeekJobParser extends BaseParser {
  name = "geekjob";
  source = "GeekJob";
  priority = 10;
  needs_extension = false;

  matches(url: string): boolean {
    return url.toLowerCase().includes('geekjob.ru');
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = url.trim();
    if (!html) return { url, source: this.source };

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
