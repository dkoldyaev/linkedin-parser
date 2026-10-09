import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace, parseSalaryString } from '../helpers';
import { createDocument } from '../dom';

export class UpworkParser extends BaseParser {
  name = "upwork";
  source = "Upwork";
  priority = 20;
  needs_extension = true;

  matches(url: string): boolean {
    return url.toLowerCase().includes('upwork.com');
  }

  extractJobId(url: string): string | null {
    const match = url.match(/~(.*?)(?:\/|\?|$)/);
    return match ? match[1] : null;
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = url.trim();
    const job_id = this.extractJobId(url) || undefined;
    if (!html) return { url, source: this.source, job_id, is_closed: false };

    const doc = createDocument(html);
    
    let title: string | undefined;
    let description: string | undefined;
    let is_closed = false;
    let salary_min: number | undefined;
    let salary_max: number | undefined;
    let salary_currency: string | undefined = "USD";
    let salary_period: string | undefined;

    const h4 = doc.querySelector("h4");
    if (h4) title = h4.textContent?.trim();

    const h1 = doc.querySelector("h1");
    if (!title && h1) title = h1.textContent?.trim();

    const descEl = doc.querySelector('.job-description') || doc.querySelector('[data-test="JobDescription"]');
    if (descEl) description = cleanText(descEl);

    // Try to extract budget or hourly rate
    const budgetEls = Array.from(doc.querySelectorAll('strong, [data-test="budget"], [data-test="hourly-rate"]'));
    for (const el of budgetEls) {
      const text = el.textContent || "";
      if (text.includes('$')) {
        const parsed = parseSalaryString(text);
        if (parsed.salary_min) {
          salary_min = parsed.salary_min;
          salary_max = parsed.salary_max;
          salary_currency = parsed.salary_currency || "USD";
          salary_period = parsed.salary_period;
          break;
        }
      }
    }

    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("this job is closed") || text.includes("no longer available")) {
      is_closed = true;
    }

    return {
      url,
      source: this.source,
      job_id,
      title,
      description: description?.substring(0, 15000),
      workplace_type: "remote", // Upwork is always remote
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
}
