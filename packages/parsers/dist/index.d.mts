interface VacancyData {
    url?: string;
    source?: string;
    job_id?: string;
    title?: string;
    company?: string;
    company_url?: string;
    company_info?: string;
    location?: string;
    city?: string;
    country?: string;
    workplace_type?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
    is_closed?: boolean;
    description?: string;
}

declare abstract class BaseParser {
    name?: string;
    source?: string;
    priority?: number;
    needs_extension?: boolean;
    abstract domains: string[];
    abstract matches(url: string): boolean;
    abstract parse(url: string, html: string): Promise<VacancyData> | VacancyData;
    extractJobId?(url: string): string | null;
}

declare function cleanText(htmlElem: any | string | undefined | null): string;
declare function findJsonLd(html: string, targetType?: string): any;
declare function normalizeCurrency(curr: string | null | undefined): string | null;
declare function normalizePeriod(periodStr: string | null | undefined): string | null;
declare function parseJsonLdSalary(data: any): {
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
};
declare function parseSalaryString(text: string | null | undefined): {
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
};
declare function normalizeWorkplace(text: string | null | undefined): string | null;

declare const KNOWN_COUNTRIES: Set<string>;
declare const COUNTRY_ALIASES: Record<string, string>;
declare function normalizeCountry(country: string): string;
declare function parseLocation(location: string): [string | undefined, string | undefined];

declare class Registry {
    private parsers;
    register(parser: BaseParser): void;
    find(url: string): BaseParser | undefined;
    parse(url: string, html?: string): Promise<VacancyData>;
    extractJobId(url: string): string | null;
    allParsers(): BaseParser[];
}
declare const registry: Registry;

export { BaseParser, COUNTRY_ALIASES, KNOWN_COUNTRIES, Registry, type VacancyData, cleanText, findJsonLd, normalizeCountry, normalizeCurrency, normalizePeriod, normalizeWorkplace, parseJsonLdSalary, parseLocation, parseSalaryString, registry };
