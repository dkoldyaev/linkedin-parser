import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace, parseSalaryString } from '../helpers';
import { createDocument } from '../dom';

export class HabrParser extends BaseParser {
  name = "habr";
  source = "Habr Career";
  priority = 10;
  needs_extension = false;
  domains = ["career.habr.com", "habr.com"];

  matches(url: string): boolean {
    return url.toLowerCase().includes('career.habr.com');
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
    let salary_min: number | undefined;
    let salary_max: number | undefined;
    let salary_currency: string | undefined;
    let salary_period: string | undefined;

    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();

    const companyEl = doc.querySelector('.company_name');
    if (companyEl) company = companyEl.textContent?.trim();

    const metaList = Array.from(doc.querySelectorAll('.meta-info'));
    for (const el of metaList) {
      const text = el.textContent || "";
      if (text.includes('Город:') || text.includes('Можно удаленно')) {
        location = text.replace('Город:', '').trim();
        city = location;
      }
    }

    const descEl = doc.querySelector('.vacancy-description__text');
    if (descEl) description = cleanText(descEl);

    const salaryEl = doc.querySelector('.basic-salary');
    if (salaryEl) {
      const salStr = salaryEl.textContent || "";
      const parsed = parseSalaryString(salStr);
      salary_min = parsed.salary_min;
      salary_max = parsed.salary_max;
      salary_currency = parsed.salary_currency;
      salary_period = parsed.salary_period;
    }

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
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
}
