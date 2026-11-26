import { cleanText, cleanUrlParams, extractCanonicalUrl } from '../helpers';
import { BaseParser } from '../BaseParser';
import { createDocument } from '../dom';
import DOMPurify from 'isomorphic-dompurify';
import { Readability } from '@mozilla/readability';
import { VacancyData } from '../types';

export class UniversalParser extends BaseParser {
  name = 'universal';
  source = 'Universal';
  priority = 0; // Lowest priority, acts as a fallback
  needs_extension = false;
  domains: string[] = [];

  matches(_url: string): boolean {
    return true; // Matches any URL
  }

  normalizeUrl(url: string, html?: string): string {
    if (html) {
      const canonical = extractCanonicalUrl(html);
      if (canonical) return cleanUrlParams(canonical);
    }
    return cleanUrlParams(url);
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    url = this.normalizeUrl(url, html);
    if (!html) return { url, source: this.source };

    const doc = createDocument(html);

    // Run Readability
    let title: string | undefined;
    let description: string | undefined;

    // Readability mutates the DOM, so clone it if we need original later
    const docClone = createDocument(html);
    const reader = new Readability(docClone);
    const article = reader.parse();

    if (article) {
      if (article.title) {
        title = article.title.trim();
      }
      if (article.content) {
        const cleanHtml = DOMPurify.sanitize(article.content);
        const tempDoc = createDocument(cleanHtml);
        description = cleanText(tempDoc.body);
      }
    }

    if (!title) {
      const h1 = doc.querySelector('h1');
      if (h1) title = h1.textContent?.trim();
    }

    if (!title) {
      title = doc.title;
    }

    return {
      url,
      source: this.source,
      title,
      description: description?.substring(0, 15000),
    };
  }
}
