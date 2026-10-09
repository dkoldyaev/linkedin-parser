import { VacancyData } from './types';

export abstract class BaseParser {
  abstract domains: string[];
  abstract parse(url: string, html: string): Promise<VacancyData> | VacancyData;
}
