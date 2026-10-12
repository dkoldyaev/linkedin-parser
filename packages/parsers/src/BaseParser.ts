import { VacancyData } from './types';

export abstract class BaseParser {
  name?: string;
  source?: string;
  priority?: number;
  needs_extension?: boolean;
  abstract domains: string[];
  abstract matches(url: string): boolean;
  abstract parse(url: string, html: string): Promise<VacancyData> | VacancyData;
  extractJobId?(url: string): string | null;
}

