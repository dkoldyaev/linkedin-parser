import { BaseParser } from '../BaseParser';
import { VacancyData } from '../types';
import {
  cleanText,
  findJsonLd,
  normalizeWorkplace,
  parseJsonLdSalary,
  parseSalaryString,
  extractCanonicalUrl,
  cleanUrlParams,
} from '../helpers';
import { createDocument } from '../dom';
import { normalizeCountry, parseLocation } from '../locationParser';

export class IndeedParser extends BaseParser {
  name = "indeed";
  source = "Indeed";
  priority = 10;
  needs_extension = true;
  domains = [
    "indeed.com",
    "indeed.co.uk",
    "indeed.de",
    "indeed.fr",
    "indeed.ca",
    "indeed.es",
    "indeed.it",
    "indeed.nl",
    "indeed.ch",
    "indeed.at",
    "indeed.be",
    "indeed.pl",
    "indeed.com.au",
    "indeed.co.in",
    "indeed.co.jp",
    "indeed.ie"
  ];

  matches(url: string): boolean {
    if (!url) return false;
    return url.toLowerCase().includes('indeed.');
  }

  extractJobId(url: string): string | null {
    if (!url) return null;
    const mParam = url.match(/[?&](?:jk|vjk)=([a-f0-9]+)/i);
    if (mParam) return mParam[1];
    const mPath = url.match(/\/(?:viewjob|job)\/(?:[^\s/?#]*-)?([a-f0-9]{16})(?:[/?#]|$)/i);
    if (mPath) return mPath[1];
    const mClk = url.match(/\/rc\/clk\?.*?[?&]jk=([a-f0-9]+)/i);
    if (mClk) return mClk[1];
    return null;
  }

  normalizeUrl(url: string, html?: string): string {
    let effectiveUrl = url;
    if (html) {
      const canonical = extractCanonicalUrl(html);
      if (canonical) effectiveUrl = canonical;
    }
    const jid = this.extractJobId(effectiveUrl) || this.extractJobId(url);
    if (jid) {
      try {
        const u = new URL(effectiveUrl.includes('://') ? effectiveUrl : `https://${effectiveUrl}`);
        return `https://${u.hostname}/viewjob?jk=${jid}`;
      } catch {
        return `https://www.indeed.com/viewjob?jk=${jid}`;
      }
    }
    return cleanUrlParams(effectiveUrl);
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = this.normalizeUrl(url, html);
    const job_id = this.extractJobId(url) || undefined;
    if (!html) {
      return { url, source: this.source, job_id, is_closed: false };
    }

    const doc = createDocument(html);
    const jld = findJsonLd(html, "JobPosting");

    let title: string | undefined;
    let company: string | undefined;
    let company_url: string | undefined;
    let location: string | undefined;
    let city: string | undefined;
    let country: string | undefined;
    let description: string | undefined;
    let salary_min: number | undefined;
    let salary_max: number | undefined;
    let salary_currency: string | undefined;
    let salary_period: string | undefined;
    let workplace_type: string | undefined;
    let is_closed = false;

    if (jld) {
      title = jld.title;
      if (jld.hiringOrganization) {
        if (typeof jld.hiringOrganization === 'object') {
          company = jld.hiringOrganization.name;
          company_url = jld.hiringOrganization.sameAs;
        } else if (typeof jld.hiringOrganization === 'string') {
          company = jld.hiringOrganization;
        }
      }
      if (jld.jobLocation?.address) {
        const addr = jld.jobLocation.address;
        city = addr.addressLocality;
        let cName = addr.addressCountry;
        if (cName && typeof cName === 'object') {
          cName = cName.name;
        }
        if (cName) {
          country = normalizeCountry(String(cName));
        }
        const parts = [addr.streetAddress, city, addr.addressRegion, country].filter(Boolean);
        location = parts.length > 0 ? parts.join(", ") : city;
      }
      if (jld.description) {
        try {
          description = cleanText(createDocument(jld.description).body);
        } catch {
          description = cleanText(jld.description);
        }
      }
      const sal = parseJsonLdSalary(jld);
      if (sal.salary_min !== undefined) salary_min = sal.salary_min;
      if (sal.salary_max !== undefined) salary_max = sal.salary_max;
      if (sal.salary_currency !== undefined) salary_currency = sal.salary_currency;
      if (sal.salary_period !== undefined) salary_period = sal.salary_period;

      if (jld.jobLocationType === "TELECOMMUTE") {
        workplace_type = "remote";
      }

      if (jld.validThrough) {
        try {
          const vt = new Date(jld.validThrough);
          if (vt.getTime() < Date.now()) {
            is_closed = true;
          }
        } catch {}
      }
    }

    // DOM fallbacks
    if (!title) {
      const h1 = doc.querySelector('[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title, h1');
      if (h1) title = h1.textContent?.trim();
    }

    if (!company) {
      const compEl = doc.querySelector('[data-testid="inlineHeader-companyName"], [data-testid="company-name"]');
      if (compEl) {
        company = compEl.textContent?.trim();
        const compLink = compEl.querySelector('a');
        if (compLink) {
          company_url = compLink.getAttribute('href') || undefined;
        }
      }
    }

    if (!location) {
      const locEl = doc.querySelector('[data-testid="inlineHeader-companyLocation"], [data-testid="jobsearch-JobInfoHeader-companyLocation"]');
      if (locEl) {
        location = locEl.textContent?.trim();
        const [c, cnt] = parseLocation(location!);
        if (!city) city = c;
        if (!country && cnt) country = cnt;
      }
    }

    if (!description) {
      const descEl = doc.querySelector('#jobDescriptionText, [data-testid="jobsearch-JobComponent-description"]');
      if (descEl) description = cleanText(descEl);
    }

    if (salary_min === undefined && salary_max === undefined) {
      const salEl = doc.querySelector('#salaryInfoAndJobType, [data-testid="jobsearch-JobMetadataHeader-item"], [data-testid="jobsearch-OtherJobDetailsContainer"]');
      if (salEl && salEl.textContent) {
        const salData = parseSalaryString(salEl.textContent);
        if (salData.salary_min !== undefined) salary_min = salData.salary_min;
        if (salData.salary_max !== undefined) salary_max = salData.salary_max;
        if (salData.salary_currency !== undefined) salary_currency = salData.salary_currency;
        if (salData.salary_period !== undefined) salary_period = salData.salary_period;
      }
    }

    if (!workplace_type) {
      workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
      if (!workplace_type) {
        const textLower = (html || "").toLowerCase();
        if (["homeoffice", "mobiles arbeiten", "telearbeit", "remote", "wfh", "teletrabajo", "en remoto", "remoto", "télétravail"].some(k => textLower.includes(k))) {
          workplace_type = "remote";
        } else if (["hybrid", "híbrido", "hybride"].some(k => textLower.includes(k))) {
          workplace_type = "hybrid";
        } else if (["on-site", "onsite", "presencial", "sur site", "vor ort"].some(k => textLower.includes(k))) {
          workplace_type = "on-site";
        }
      }
    }

    if (!is_closed) {
      if (html.includes('"isJobExpired":true') || html.includes('"isJobExpired": true')) {
        is_closed = true;
      } else {
        const docCopy = createDocument(html);
        docCopy.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        const text = docCopy.body?.textContent?.toLowerCase() || "";
        if (
          text.includes("this job has expired") ||
          text.includes("this job is closed") ||
          text.includes("no longer accepting applications") ||
          text.includes("diese stelle ist abgelaufen") ||
          text.includes("stellenanzeige ist abgelaufen") ||
          text.includes("este empleo ha expirado") ||
          text.includes("esta oferta ya no está disponible") ||
          text.includes("oferta de empleo cerrada") ||
          text.includes("cette offre a expiré") ||
          text.includes("cette offre n'est plus disponible")
        ) {
          is_closed = true;
        }
      }
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
      country,
      description: description?.substring(0, 15000),
      workplace_type: (workplace_type as any) || undefined,
      salary_min,
      salary_max,
      salary_currency,
      salary_period,
      is_closed
    };
  }
}
