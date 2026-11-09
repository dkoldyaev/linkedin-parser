import json
import re

with open('backend/location_parser.py', 'r') as f:
    content = f.read()

# Extract US_STATES
us_states = re.search(r'US_STATES\s*=\s*({[^}]+})', content).group(1)
# Extract CA_PROVINCES
ca_provinces = re.search(r'CA_PROVINCES\s*=\s*({[^}]+})', content).group(1)
# Extract COUNTRY_ALIASES
country_aliases = re.search(r'COUNTRY_ALIASES\s*=\s*({[^}]+})', content).group(1)
# Extract KNOWN_COUNTRIES
known_countries = re.search(r'KNOWN_COUNTRIES\s*=\s*({[^}]+})', content).group(1)
# Extract CITY_TO_COUNTRY
city_to_country = re.search(r'CITY_TO_COUNTRY\s*=\s*({[^}]+})', content).group(1)

js_code = f"""export const US_STATES = new Set(
{us_states.replace('{', '[').replace('}', ']')}
);

export const CA_PROVINCES = new Set(
{ca_provinces.replace('{', '[').replace('}', ']')}
);

export const COUNTRY_ALIASES: Record<string, string> = {country_aliases};

export const KNOWN_COUNTRIES = new Set(
{known_countries.replace('{', '[').replace('}', ']')}
);

export const CITY_TO_COUNTRY: Record<string, string> = {city_to_country};

export function normalizeCountry(rawCountry?: string | null): string {{
  if (!rawCountry) return "";
  const c = rawCountry.trim();
  const cLower = c.toLowerCase();

  if (COUNTRY_ALIASES[cLower]) return COUNTRY_ALIASES[cLower];

  if (KNOWN_COUNTRIES.has(cLower)) {{
    return cLower.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }}

  return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}}

export function cleanCityName(rawCity?: string | null): string {{
  if (!rawCity) return "";
  let cleaned = rawCity.trim();

  const metroMatch = cleaned.match(/^(?:Greater\\s+)?(.*?)(?:\\s+(?:Metropolitan|Capital|Bay))?\\s+(?:Area|Region)$/i);
  if (metroMatch) {{
    const extracted = metroMatch[1].trim();
    if (extracted) cleaned = extracted;
  }}

  cleaned = cleaned.replace(/^Greater\\s+/i, "").trim();
  return cleaned;
}}

export function parseLocation(rawLocation?: string | null): [string, string] {{
  if (!rawLocation) return ["", ""];

  let text = rawLocation.trim();
  text = text.replace(/\\s*\\((?:Hybrid|Remote|On-site|Гибрид|Удаленно|В офисе)\\)\\s*/ig, "");
  text = text.replace(/^[ ,-]+|[ ,-]+$/g, "");

  if (!text) return ["", ""];

  if (["remote", "worldwide", "anywhere", "global", "удаленно"].includes(text.toLowerCase())) {{
    return ["", ""];
  }}

  const parts = text.split(",").map(p => p.trim()).filter(Boolean);

  if (parts.length >= 2) {{
    const rawCity = parts[0];
    const rawCountry = parts[parts.length - 1];

    if (US_STATES.has(rawCountry.toUpperCase())) {{
      return [cleanCityName(rawCity), "United States"];
    }}

    if (CA_PROVINCES.has(rawCountry.toUpperCase())) {{
      return [cleanCityName(rawCity), "Canada"];
    }}

    if ((KNOWN_COUNTRIES.has(rawCity.toLowerCase()) || COUNTRY_ALIASES[rawCity.toLowerCase()]) &&
        !(KNOWN_COUNTRIES.has(rawCountry.toLowerCase()) || COUNTRY_ALIASES[rawCountry.toLowerCase()])) {{
      return [cleanCityName(rawCountry), normalizeCountry(rawCity)];
    }}

    return [cleanCityName(rawCity), normalizeCountry(rawCountry)];
  }}

  const single = parts[0];
  const singleLower = single.toLowerCase();

  if (KNOWN_COUNTRIES.has(singleLower) || COUNTRY_ALIASES[singleLower]) {{
    return ["", normalizeCountry(single)];
  }}

  const metroMatch = single.match(/^(?:Greater\\s+)?(.*?)(?:\\s+(?:Metropolitan|Capital|Bay))?\\s+(?:Area|Region)$/i);
  if (metroMatch) {{
    const extracted = metroMatch[1].trim();
    const cleanedCity = cleanCityName(extracted);
    return [cleanedCity, CITY_TO_COUNTRY[cleanedCity.toLowerCase()] || ""];
  }}

  const cleanedCity = cleanCityName(single);
  if (CITY_TO_COUNTRY[cleanedCity.toLowerCase()]) {{
    return [cleanedCity, CITY_TO_COUNTRY[cleanedCity.toLowerCase()]];
  }}

  return [cleanedCity, ""];
}}
"""

with open('packages/parsers/src/locationParser.ts', 'w') as f:
    f.write(js_code)
