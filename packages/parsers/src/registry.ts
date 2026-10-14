import { BaseParser } from './BaseParser';
import { VacancyData } from './types';

export class Registry {
  private parsers: BaseParser[] = [];

  register(parser: BaseParser) {
    this.parsers.push(parser);
    // Sort by priority (highest first)
    this.parsers.sort((a, b) => {
      const pA = (a as any).priority ?? 0;
      const pB = (b as any).priority ?? 0;
      return pB - pA;
    });
  }

  find(url: string): BaseParser | undefined {
    return this.parsers.find(p => p.matches && p.matches(url));
  }

  async parse(url: string, html?: string): Promise<VacancyData> {
    const parser = this.find(url);
    if (!parser) {
      throw new Error(`No parser found for url: ${url}`);
    }
    return await parser.parse(url, html || "");
  }

  extractJobId(url: string): string | null {
    const parser = this.find(url);
    if (parser && (parser as any).extractJobId) {
      return (parser as any).extractJobId(url);
    }
    return null;
  }

  normalizeUrl(url: string, html?: string): string {
    const parser = this.find(url);
    if (parser && parser.normalizeUrl) {
      return parser.normalizeUrl(url, html);
    }
    return url.trim();
  }

  allParsers(): BaseParser[] {
    return this.parsers;
  }
}

export const registry = new Registry();
