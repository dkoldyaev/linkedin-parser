export const KNOWN_COUNTRIES = new Set([
  "russia", "usa", "ukraine", "belarus", "kazakhstan", "cyprus", "georgia",
  "armenia", "serbia", "germany", "uk", "united kingdom", "spain",
  "poland", "netherlands", "france", "italy", "turkey", "uae",
  "united arab emirates", "israel"
]);

export const COUNTRY_ALIASES: Record<string, string> = {
  "рф": "Russia",
  "россия": "Russia",
  "ru": "Russia",
  "сша": "USA",
  "united states": "USA",
  "us": "USA",
  "украина": "Ukraine",
  "беларусь": "Belarus",
  "казахстан": "Kazakhstan",
  "кипр": "Cyprus",
  "грузия": "Georgia",
  "армения": "Armenia",
  "сербия": "Serbia",
  "германия": "Germany",
  "великобритания": "UK",
  "испания": "Spain",
  "польша": "Poland",
  "нидерланды": "Netherlands",
  "франция": "France",
  "италия": "Italy",
  "турция": "Turkey",
  "оаэ": "UAE",
  "израиль": "Israel"
};

export function normalizeCountry(country: string): string {
  const lower = country.toLowerCase().trim();
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];
  if (KNOWN_COUNTRIES.has(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return country.trim();
}

export function parseLocation(location: string): [string | undefined, string | undefined] {
  if (!location) return [undefined, undefined];
  
  let city: string | undefined;
  let country: string | undefined;

  const parts = location.split(/[,/|]/).map(p => p.trim()).filter(Boolean);
  
  if (parts.length === 1) {
    const single = parts[0];
    const words = single.split(/\s+/);
    let matchedCountry: string | undefined;
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i].toLowerCase();
      if (COUNTRY_ALIASES[w] || KNOWN_COUNTRIES.has(w)) {
        matchedCountry = normalizeCountry(w);
        words.splice(i, 1);
        break;
      }
    }
    if (matchedCountry) {
      country = matchedCountry;
      if (words.length) city = words.join(" ");
    } else {
      city = single;
    }
  } else {
    const lastPart = parts[parts.length - 1].toLowerCase();
    if (COUNTRY_ALIASES[lastPart] || KNOWN_COUNTRIES.has(lastPart)) {
      country = normalizeCountry(lastPart);
      parts.pop();
    }
    if (parts.length) {
      city = parts.join(", ");
    }
  }

  return [city, country];
}
