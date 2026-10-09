import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace, parseSalaryString } from '../helpers';
import { createDocument } from '../dom';

export class SuperJobParser extends BaseParser {
  name = "superjob";
  source = "SuperJob";
  priority = 10;
  needs_extension = false;

  matches(url: string): boolean {
    return url.toLowerCase().includes('superjob.ru');
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

    const companyEls = Array.from(doc.querySelectorAll('a, span'));
    for (const el of companyEls) {
      const href = el.getAttribute('href') || "";
      if (href.includes('/clients/')) {
        company = el.textContent?.trim();
        break;
      }
    }

    const locEls = Array.from(doc.querySelectorAll('span'));
    for (const el of locEls) {
      const text = el.textContent || "";
      if (text.includes('Москва') || text.includes('Санкт-Петербург') || text.includes('город')) { // Simple heuristic
         if (text.length < 50 && !location) {
           location = text;
           city = location;
         }
      }
    }

    const descEl = doc.querySelector('[class*="VacancyDescription"]') || doc.querySelector('[class*="vacancy-description"]');
    if (descEl) description = cleanText(descEl);
    
    if (!description) {
      // Fallback
      const spans = Array.from(doc.querySelectorAll('span'));
      for (const span of spans) {
        if (span.textContent?.includes('Обязанности') || span.textContent?.includes('Требования')) {
           description = cleanText(span.parentElement || span);
           break;
        }
      }
    }

    const h1Parent = h1?.parentElement;
    if (h1Parent) {
       const salText = h1Parent.textContent?.replace(title || "", "") || "";
       if (salText) {
          const parsed = parseSalaryString(salText);
          salary_min = parsed.salary_min;
          salary_max = parsed.salary_max;
          salary_currency = parsed.salary_currency;
          salary_period = parsed.salary_period;
       }
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
