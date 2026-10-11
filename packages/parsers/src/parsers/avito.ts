import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace, parseSalaryString } from '../helpers';
import { createDocument } from '../dom';

export class AvitoParser extends BaseParser {
  name = "avito";
  source = "Avito";
  priority = 10;
  needs_extension = false;
  domains = ["avito.ru"];

  matches(url: string): boolean {
    return url.toLowerCase().includes('avito.ru');
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

    const companyEl = doc.querySelector('[data-marker="seller-info/name"]') || doc.querySelector('.seller-info-name');
    if (companyEl) company = companyEl.textContent?.trim();

    const locEl = doc.querySelector('[data-marker="item-address/text"]') || doc.querySelector('.item-address');
    if (locEl) {
      location = locEl.textContent?.trim();
      city = location;
    }

    const descEl = doc.querySelector('[data-marker="item-view/item-description"]') || doc.querySelector('.item-description');
    if (descEl) description = cleanText(descEl);

    const salaryEl = doc.querySelector('[data-marker="item-view/item-price"]') || doc.querySelector('.item-price');
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
    if (text.includes("снято с публикации") || text.includes("объявление закрыто")) {
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
