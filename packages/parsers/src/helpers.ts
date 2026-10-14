import { createDocument } from './dom';

export function cleanText(htmlElem: any | string | undefined | null): string {
  if (!htmlElem) return "";
  let text = "";
  if (typeof htmlElem === 'string') {
    text = htmlElem;
  } else {
    // Attempt to use innerText if available (browsers), fallback to textContent
    text = htmlElem.innerText || htmlElem.textContent || "";
  }

  const lines = text.split(/\r?\n/).map(line => line.trim());
  const cleanLines: string[] = [];
  let prevEmpty = false;

  for (const line of lines) {
    if (!line) {
      if (!prevEmpty) {
        cleanLines.push("");
        prevEmpty = true;
      }
    } else {
      cleanLines.push(line);
      prevEmpty = false;
    }
  }
  return cleanLines.join("\n").trim();
}

export function findJsonLd(html: string, targetType: string = "JobPosting"): any {
  const targetLower = targetType.toLowerCase();
  const doc = createDocument(html);
  
  let result: any = null;

  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    if (result) return result;
    
    const raw = scripts[i].textContent || scripts[i].innerHTML;
    if (!raw) continue;
    
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      continue;
    }

    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue;
      const itemType = String(item['@type'] || '').toLowerCase();
      if (itemType === targetLower) {
        result = item;
        return result;
      }
      
      const graph = item['@graph'];
      if (Array.isArray(graph)) {
        for (const g of graph) {
          if (typeof g === 'object' && g !== null && String(g['@type'] || '').toLowerCase() === targetLower) {
            result = g;
            return result;
          }
        }
      }
    }
  }
  
  return result;
}

export function normalizeCurrency(curr: string | null | undefined): string | null {
  if (!curr) return null;
  const c = curr.trim().toUpperCase();
  if (['RUB', 'RUR', '₽', 'РУБ', 'РУБ.'].includes(c)) return "RUB";
  if (['USD', '$'].includes(c)) return "USD";
  if (['EUR', '€'].includes(c)) return "EUR";
  if (['GBP', '£'].includes(c)) return "GBP";
  return curr.trim();
}

export function normalizePeriod(periodStr: string | null | undefined): string | null {
  if (!periodStr) return null;
  const p = periodStr.trim().toLowerCase();
  if (['hour', 'час', 'hr'].some(k => p.includes(k))) return "hour";
  if (['day', 'смен', 'день', 'shift'].some(k => p.includes(k))) return "day";
  if (['week', 'недел'].some(k => p.includes(k))) return "week";
  if (['month', 'месяц', 'мес'].some(k => p.includes(k))) return "month";
  if (['year', 'год', 'annual'].some(k => p.includes(k))) return "year";
  return null;
}

export function parseJsonLdSalary(data: any): { salary_min?: number; salary_max?: number; salary_currency?: string; salary_period?: string } {
  const result: { salary_min?: number; salary_max?: number; salary_currency?: string; salary_period?: string } = {};
  
  const base = data?.baseSalary;
  if (typeof base !== 'object' || base === null) return result;

  const rawCurrency = base.currency;
  if (rawCurrency) {
    const norm = normalizeCurrency(rawCurrency);
    if (norm) result.salary_currency = norm;
  }

  const valObj = base.value;
  let unitText = base.unitText;
  let minVal: any = null;
  let maxVal: any = null;

  if (typeof valObj === 'object' && valObj !== null) {
    unitText = valObj.unitText || unitText;
    minVal = valObj.minValue;
    maxVal = valObj.maxValue;
    if (minVal == null && maxVal == null) {
      minVal = maxVal = valObj.value;
    }
  } else if (typeof valObj === 'number') {
    minVal = maxVal = valObj;
  }

  if (unitText) {
    const p = normalizePeriod(String(unitText));
    if (p) result.salary_period = p;
  }

  if (minVal != null) {
    const m = Number(minVal);
    if (!isNaN(m) && m > 0) result.salary_min = m;
  }

  if (maxVal != null) {
    const m = Number(maxVal);
    if (!isNaN(m) && m > 0) result.salary_max = m;
  }

  return result;
}

const toFloat = (s: string) => parseFloat(s.replace(/[\s]/g, '').replace(',', '.'));

export function parseSalaryString(text: string | null | undefined): { salary_min?: number; salary_max?: number; salary_currency?: string; salary_period?: string } {
  const result: { salary_min?: number; salary_max?: number; salary_currency?: string; salary_period?: string } = {};
  if (!text) return result;

  const raw = text.replace(/\xa0/g, " ").replace(/&nbsp;/g, " ").trim();

  if (['₽', 'руб', 'RUR', 'RUB'].some(c => raw.includes(c))) result.salary_currency = "RUB";
  else if (['$', 'USD'].some(c => raw.includes(c))) result.salary_currency = "USD";
  else if (['€', 'EUR'].some(c => raw.includes(c))) result.salary_currency = "EUR";
  else if (['£', 'GBP'].some(c => raw.includes(c))) result.salary_currency = "GBP";

  const period = normalizePeriod(raw);
  if (period) result.salary_period = period;
  else if (result.salary_currency === "RUB") result.salary_period = "month";

  const rangeMatch = raw.match(/(?:от\s+)?(?:\$|€|£|₽)?\s*([\d\s]+(?:[.,]\d+)?)\s*(?:₽|руб|usd|\$|eur|€|gbp|£)?\s*(?:—|-|–|до)\s*(?:до\s+)?(?:\$|€|£|₽)?\s*([\d\s]+(?:[.,]\d+)?)/i);
  if (rangeMatch) {
    const sMin = toFloat(rangeMatch[1]);
    const sMax = toFloat(rangeMatch[2]);
    if (!isNaN(sMin)) result.salary_min = sMin;
    if (!isNaN(sMax)) result.salary_max = sMax;
    return result;
  }

  const minMatch = raw.match(/от\s+([\d\s]+(?:[.,]\d+)?)/i);
  if (minMatch) {
    const val = toFloat(minMatch[1]);
    if (!isNaN(val)) result.salary_min = val;
    return result;
  }

  const maxMatch = raw.match(/до\s+([\d\s]+(?:[.,]\d+)?)/i);
  if (maxMatch) {
    const val = toFloat(maxMatch[1]);
    if (!isNaN(val)) result.salary_max = val;
    return result;
  }

  const numMatch = raw.match(/([\d\s]{3,}(?:[.,]\d+)?)/);
  if (numMatch) {
    const val = toFloat(numMatch[1]);
    if (!isNaN(val)) {
      result.salary_min = val;
      result.salary_max = val;
      return result;
    }
  }

  return result;
}

export function normalizeWorkplace(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (['remote', 'удален', 'дистанцион', 'telecommute', 'wfh', 'worldwide'].some(k => t.includes(k))) return "remote";
  if (['hybrid', 'гибрид'].some(k => t.includes(k))) return "hybrid";
  if (['on-site', 'onsite', 'on site', 'в офисе', 'очно', 'на месте'].some(k => t.includes(k))) return "on-site";
  return null;
}

export function extractCanonicalUrl(html: string): string | null {
  if (!html) return null;
  const doc = createDocument(html);
  const linkCanonical = doc.querySelector('link[rel="canonical"]');
  if (linkCanonical) {
    const href = linkCanonical.getAttribute('href');
    if (href && href.trim()) return href.trim();
  }
  const ogUrl = doc.querySelector('meta[property="og:url"], meta[name="og:url"]');
  if (ogUrl) {
    const content = ogUrl.getAttribute('content');
    if (content && content.trim()) return content.trim();
  }
  return null;
}

export function cleanUrlParams(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

