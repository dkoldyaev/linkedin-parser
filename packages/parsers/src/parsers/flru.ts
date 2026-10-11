import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace, parseSalaryString } from '../helpers';
import { createDocument } from '../dom';

export class FLRuParser extends BaseParser {
  name = "flru";
  source = "FL.ru";
  priority = 10;
  needs_extension = false;
  domains = ["fl.ru"];

  matches(url: string): boolean {
    return url.toLowerCase().includes('fl.ru');
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = url.trim();
    if (!html) return { url, source: this.source };

    const doc = createDocument(html);
    
    let title: string | undefined;
    let description: string | undefined;
    let is_closed = false;
    let salary_min: number | undefined;
    let salary_max: number | undefined;
    let salary_currency: string | undefined;
    let salary_period: string | undefined;

    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();

    const descEl = doc.querySelector('.b-layout__txt_lineheight_1');
    if (descEl) description = cleanText(descEl);

    const salaryEl = doc.querySelector('.b-layout__title span.b-layout__txt');
    if (salaryEl) {
      const salStr = salaryEl.textContent || "";
      const parsed = parseSalaryString(salStr);
      salary_min = parsed.salary_min;
      salary_max = parsed.salary_max;
      salary_currency = parsed.salary_currency;
      salary_period = parsed.salary_period;
    }

    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("проект закрыт") || text.includes("заказ закрыт")) {
      is_closed = true;
    }

    return {
      url,
      source: this.source,
      title,
      description: description?.substring(0, 15000),
      workplace_type: "remote", // Freelance is inherently remote
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
}
