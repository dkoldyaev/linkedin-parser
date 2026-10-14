import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import { cleanText, normalizeWorkplace } from '../helpers';
import { createDocument } from '../dom';

export class LinkedInParser extends BaseParser {
  name = "linkedin";
  source = "LinkedIn";
  priority = 20;
  needs_extension = false;
  domains = ["linkedin.com"];

  matches(url: string): boolean {
    return url.toLowerCase().includes('linkedin.com/jobs');
  }

  extractJobId(url: string): string | null {
    const match = url.match(/view\/(\d+)/) || url.match(/currentJobId=(\d+)/) || url.match(/jobPosting:(\d+)/);
    return match ? match[1] : null;
  }

  normalizeUrl(url: string, html?: string): string {
    const jobId = this.extractJobId(url);
    if (jobId) {
      return `https://www.linkedin.com/jobs/view/${jobId}/`;
    }
    return url.trim();
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = this.normalizeUrl(url, html);
    const job_id = this.extractJobId(url) || undefined;
    if (!html) return { url, source: this.source, job_id };

    const doc = createDocument(html);
    
    let title: string | undefined;
    let company: string | undefined;
    let company_url: string | undefined;
    let location: string | undefined;
    let city: string | undefined;
    let description: string | undefined;
    let is_closed = false;

    // Guest view title
    const h1Guest = doc.querySelector('.top-card-layout__title');
    // Auth view title
    const h1Auth = doc.querySelector('.job-details-jobs-unified-top-card__job-title');
    const h1Auth2 = doc.querySelector('h1.t-24');

    if (h1Auth) title = h1Auth.textContent?.trim();
    else if (h1Auth2) title = h1Auth2.textContent?.trim();
    else if (h1Guest) title = h1Guest.textContent?.trim();

    // Guest view company
    const companyGuest = doc.querySelector('.topcard__org-name-link');
    // Auth view company
    const companyAuth = doc.querySelector('.job-details-jobs-unified-top-card__company-name a');

    if (companyAuth) {
      company = companyAuth.textContent?.trim();
      const href = companyAuth.getAttribute('href');
      if (href) {
        company_url = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
        company_url = company_url.split('?')[0];
      }
    } else if (companyGuest) {
      company = companyGuest.textContent?.trim();
      const href = companyGuest.getAttribute('href');
      if (href) {
        company_url = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
        company_url = company_url.split('?')[0];
      }
    }

    const locGuest = doc.querySelector('.topcard__flavor--bullet');
    const locAuth = doc.querySelector('.job-details-jobs-unified-top-card__primary-description-container span.tvm__text');
    
    if (locAuth) {
      location = locAuth.textContent?.trim();
      city = location;
    } else if (locGuest) {
      location = locGuest.textContent?.trim();
      city = location;
    }

    const descGuest = doc.querySelector('.show-more-less-html__markup');
    const descAuth = doc.querySelector('.jobs-description__container') || doc.querySelector('#job-details');
    
    if (descAuth) description = cleanText(descAuth);
    else if (descGuest) description = cleanText(descGuest);

    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");

    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("no longer accepting applications") || 
        text.includes("job is closed") || 
        text.includes("вакансия закрыта")) {
      is_closed = true;
    }

    return {
      url,
      source: this.source,
      job_id,
      title,
      company,
      company_url,
      location,
      city,
      description: description?.substring(0, 15000),
      workplace_type: workplace_type || undefined,
      is_closed
    };
  }
}
