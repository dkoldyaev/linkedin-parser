var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/BaseParser.ts
var BaseParser = class {
  name;
  source;
  priority;
  needs_extension;
};

// src/dom.ts
function createDocument(html) {
  if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
    const parser = new window.DOMParser();
    return parser.parseFromString(html, "text/html");
  } else {
    const { JSDOM } = __require("jsdom");
    const dom = new JSDOM(html);
    return dom.window.document;
  }
}

// src/helpers.ts
function cleanText(htmlElem) {
  if (!htmlElem) return "";
  let text = "";
  if (typeof htmlElem === "string") {
    text = htmlElem;
  } else {
    text = htmlElem.innerText || htmlElem.textContent || "";
  }
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const cleanLines = [];
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
function findJsonLd(html, targetType = "JobPosting") {
  const targetLower = targetType.toLowerCase();
  const doc = createDocument(html);
  let result = null;
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
      if (typeof item !== "object" || item === null) continue;
      const itemType = String(item["@type"] || "").toLowerCase();
      if (itemType === targetLower) {
        result = item;
        return result;
      }
      const graph = item["@graph"];
      if (Array.isArray(graph)) {
        for (const g of graph) {
          if (typeof g === "object" && g !== null && String(g["@type"] || "").toLowerCase() === targetLower) {
            result = g;
            return result;
          }
        }
      }
    }
  }
  return result;
}
function normalizeCurrency(curr) {
  if (!curr) return null;
  const c = curr.trim().toUpperCase();
  if (["RUB", "RUR", "\u20BD", "\u0420\u0423\u0411", "\u0420\u0423\u0411."].includes(c)) return "RUB";
  if (["USD", "$"].includes(c)) return "USD";
  if (["EUR", "\u20AC"].includes(c)) return "EUR";
  if (["GBP", "\xA3"].includes(c)) return "GBP";
  return curr.trim();
}
function normalizePeriod(periodStr) {
  if (!periodStr) return null;
  const p = periodStr.trim().toLowerCase();
  if (["hour", "\u0447\u0430\u0441", "hr"].some((k) => p.includes(k))) return "hour";
  if (["day", "\u0441\u043C\u0435\u043D", "\u0434\u0435\u043D\u044C", "shift"].some((k) => p.includes(k))) return "day";
  if (["week", "\u043D\u0435\u0434\u0435\u043B"].some((k) => p.includes(k))) return "week";
  if (["month", "\u043C\u0435\u0441\u044F\u0446", "\u043C\u0435\u0441"].some((k) => p.includes(k))) return "month";
  if (["year", "\u0433\u043E\u0434", "annual"].some((k) => p.includes(k))) return "year";
  return null;
}
function parseJsonLdSalary(data) {
  const result = {};
  const base = data?.baseSalary;
  if (typeof base !== "object" || base === null) return result;
  const rawCurrency = base.currency;
  if (rawCurrency) {
    const norm = normalizeCurrency(rawCurrency);
    if (norm) result.salary_currency = norm;
  }
  const valObj = base.value;
  let unitText = base.unitText;
  let minVal = null;
  let maxVal = null;
  if (typeof valObj === "object" && valObj !== null) {
    unitText = valObj.unitText || unitText;
    minVal = valObj.minValue;
    maxVal = valObj.maxValue;
    if (minVal == null && maxVal == null) {
      minVal = maxVal = valObj.value;
    }
  } else if (typeof valObj === "number") {
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
var toFloat = (s) => parseFloat(s.replace(/[\s]/g, "").replace(",", "."));
function parseSalaryString(text) {
  const result = {};
  if (!text) return result;
  const raw = text.replace(/\xa0/g, " ").replace(/&nbsp;/g, " ").trim();
  if (["\u20BD", "\u0440\u0443\u0431", "RUR", "RUB"].some((c) => raw.includes(c))) result.salary_currency = "RUB";
  else if (["$", "USD"].some((c) => raw.includes(c))) result.salary_currency = "USD";
  else if (["\u20AC", "EUR"].some((c) => raw.includes(c))) result.salary_currency = "EUR";
  else if (["\xA3", "GBP"].some((c) => raw.includes(c))) result.salary_currency = "GBP";
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
function normalizeWorkplace(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (["remote", "\u0443\u0434\u0430\u043B\u0435\u043D", "\u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u043E\u043D", "telecommute", "wfh", "worldwide"].some((k) => t.includes(k))) return "remote";
  if (["hybrid", "\u0433\u0438\u0431\u0440\u0438\u0434"].some((k) => t.includes(k))) return "hybrid";
  if (["on-site", "onsite", "on site", "\u0432 \u043E\u0444\u0438\u0441\u0435", "\u043E\u0447\u043D\u043E", "\u043D\u0430 \u043C\u0435\u0441\u0442\u0435"].some((k) => t.includes(k))) return "on-site";
  return null;
}

// src/locationParser.ts
var KNOWN_COUNTRIES = /* @__PURE__ */ new Set([
  "russia",
  "usa",
  "ukraine",
  "belarus",
  "kazakhstan",
  "cyprus",
  "georgia",
  "armenia",
  "serbia",
  "germany",
  "uk",
  "united kingdom",
  "spain",
  "poland",
  "netherlands",
  "france",
  "italy",
  "turkey",
  "uae",
  "united arab emirates",
  "israel"
]);
var COUNTRY_ALIASES = {
  "\u0440\u0444": "Russia",
  "\u0440\u043E\u0441\u0441\u0438\u044F": "Russia",
  "ru": "Russia",
  "\u0441\u0448\u0430": "USA",
  "united states": "USA",
  "us": "USA",
  "\u0443\u043A\u0440\u0430\u0438\u043D\u0430": "Ukraine",
  "\u0431\u0435\u043B\u0430\u0440\u0443\u0441\u044C": "Belarus",
  "\u043A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D": "Kazakhstan",
  "\u043A\u0438\u043F\u0440": "Cyprus",
  "\u0433\u0440\u0443\u0437\u0438\u044F": "Georgia",
  "\u0430\u0440\u043C\u0435\u043D\u0438\u044F": "Armenia",
  "\u0441\u0435\u0440\u0431\u0438\u044F": "Serbia",
  "\u0433\u0435\u0440\u043C\u0430\u043D\u0438\u044F": "Germany",
  "\u0432\u0435\u043B\u0438\u043A\u043E\u0431\u0440\u0438\u0442\u0430\u043D\u0438\u044F": "UK",
  "\u0438\u0441\u043F\u0430\u043D\u0438\u044F": "Spain",
  "\u043F\u043E\u043B\u044C\u0448\u0430": "Poland",
  "\u043D\u0438\u0434\u0435\u0440\u043B\u0430\u043D\u0434\u044B": "Netherlands",
  "\u0444\u0440\u0430\u043D\u0446\u0438\u044F": "France",
  "\u0438\u0442\u0430\u043B\u0438\u044F": "Italy",
  "\u0442\u0443\u0440\u0446\u0438\u044F": "Turkey",
  "\u043E\u0430\u044D": "UAE",
  "\u0438\u0437\u0440\u0430\u0438\u043B\u044C": "Israel"
};
function normalizeCountry(country) {
  const lower = country.toLowerCase().trim();
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];
  if (KNOWN_COUNTRIES.has(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return country.trim();
}
function parseLocation(location) {
  if (!location) return [void 0, void 0];
  let city;
  let country;
  const parts = location.split(/[,/|]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    const single = parts[0];
    const words = single.split(/\s+/);
    let matchedCountry;
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

// src/registry.ts
var Registry = class {
  parsers = [];
  register(parser) {
    this.parsers.push(parser);
    this.parsers.sort((a, b) => {
      const pA = a.priority ?? 0;
      const pB = b.priority ?? 0;
      return pB - pA;
    });
  }
  find(url) {
    return this.parsers.find((p) => p.matches && p.matches(url));
  }
  async parse(url, html) {
    const parser = this.find(url);
    if (!parser) {
      throw new Error(`No parser found for url: ${url}`);
    }
    return await parser.parse(url, html || "");
  }
  extractJobId(url) {
    const parser = this.find(url);
    if (parser && parser.extractJobId) {
      return parser.extractJobId(url);
    }
    return null;
  }
  allParsers() {
    return this.parsers;
  }
};
var registry = new Registry();

// src/parsers/glassdoor.ts
var GlassdoorParser = class extends BaseParser {
  name = "glassdoor";
  source = "Glassdoor";
  priority = 10;
  needs_extension = false;
  domains = ["glassdoor.com"];
  matches(url) {
    return url.toLowerCase().includes("glassdoor");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) {
      return { url, source: this.source };
    }
    const doc = createDocument(html);
    const jld = findJsonLd(html, "JobPosting");
    let title;
    let company;
    let location;
    let city;
    let country;
    let description;
    let is_closed = false;
    if (jld) {
      title = jld.title;
      if (jld.hiringOrganization?.name) {
        company = jld.hiringOrganization.name;
      }
      if (jld.jobLocation?.address) {
        const addr = jld.jobLocation.address;
        city = addr.addressLocality;
        if (addr.addressCountry) {
          country = normalizeCountry(String(addr.addressCountry));
        }
        location = [city, addr.addressRegion, country].filter(Boolean).join(", ");
      }
      if (jld.description) {
        description = cleanText(createDocument(jld.description).body);
      }
    }
    if (!title) {
      const h1 = doc.querySelector("h1");
      if (h1) title = h1.textContent?.trim();
    }
    if (!company) {
      const el = doc.querySelector('[data-test="employerName"]');
      if (el) company = el.textContent?.trim().replace(/★.*/, "").trim();
    }
    if (!location) {
      const el = doc.querySelector('[data-test="location"]');
      if (el) {
        location = el.textContent?.trim();
        const [c, cnt] = parseLocation(location);
        city = c;
        if (cnt) country = cnt;
      }
    }
    if (!description) {
      const el = doc.querySelector("#JobDescriptionContainer") || doc.querySelector(".jobDescriptionContent");
      if (el) description = cleanText(el);
    }
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("this job is no longer available") || text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country,
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed
    };
  }
};

// src/parsers/geekjob.ts
var GeekJobParser = class extends BaseParser {
  name = "geekjob";
  source = "GeekJob";
  priority = 10;
  needs_extension = false;
  domains = ["geekjob.ru"];
  matches(url) {
    return url.toLowerCase().includes("geekjob.ru");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let company;
    let location;
    let city;
    let description;
    let is_closed = false;
    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();
    const companyEl = doc.querySelector(".company-name a") || doc.querySelector(".company-name");
    if (companyEl) company = companyEl.textContent?.trim();
    const locEl = doc.querySelector(".location");
    if (locEl) {
      location = locEl.textContent?.trim();
      city = location;
    }
    const descEl = doc.querySelector("#vacancy-description");
    if (descEl) description = cleanText(descEl);
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0432 \u0430\u0440\u0445\u0438\u0432\u0435") || text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country: "Russia",
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed
    };
  }
};

// src/parsers/layboard.ts
var LayboardParser = class extends BaseParser {
  name = "layboard";
  source = "Layboard";
  priority = 10;
  needs_extension = false;
  domains = ["layboard.com"];
  matches(url) {
    return url.toLowerCase().includes("layboard.com");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let company;
    let location;
    let city;
    let country;
    let description;
    let is_closed = false;
    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();
    const els = doc.querySelectorAll(".info-list li");
    els.forEach((el) => {
      const text2 = el.textContent || "";
      if (text2.includes("\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F:") || text2.includes("Company:")) {
        company = text2.replace(/Компания:|Company:/g, "").trim();
      }
      if (text2.includes("\u0413\u043E\u0440\u043E\u0434:") || text2.includes("City:")) {
        city = text2.replace(/Город:|City:/g, "").trim();
      }
      if (text2.includes("\u0421\u0442\u0440\u0430\u043D\u0430:") || text2.includes("Country:")) {
        country = normalizeCountry(text2.replace(/Страна:|Country:/g, "").trim());
      }
    });
    if (city || country) {
      location = [city, country].filter(Boolean).join(", ");
    }
    const descEl = doc.querySelector(".description-content") || doc.querySelector(".job-description");
    if (descEl) description = cleanText(descEl);
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0432 \u0430\u0440\u0445\u0438\u0432\u0435") || text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country,
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed
    };
  }
};

// src/parsers/habr.ts
var HabrParser = class extends BaseParser {
  name = "habr";
  source = "Habr Career";
  priority = 10;
  needs_extension = false;
  domains = ["career.habr.com", "habr.com"];
  matches(url) {
    return url.toLowerCase().includes("career.habr.com");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let company;
    let location;
    let city;
    let description;
    let is_closed = false;
    let salary_min;
    let salary_max;
    let salary_currency;
    let salary_period;
    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();
    const companyEl = doc.querySelector(".company_name");
    if (companyEl) company = companyEl.textContent?.trim();
    const metaList = Array.from(doc.querySelectorAll(".meta-info"));
    for (const el of metaList) {
      const text2 = el.textContent || "";
      if (text2.includes("\u0413\u043E\u0440\u043E\u0434:") || text2.includes("\u041C\u043E\u0436\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u043D\u043E")) {
        location = text2.replace("\u0413\u043E\u0440\u043E\u0434:", "").trim();
        city = location;
      }
    }
    const descEl = doc.querySelector(".vacancy-description__text");
    if (descEl) description = cleanText(descEl);
    const salaryEl = doc.querySelector(".basic-salary");
    if (salaryEl) {
      const salStr = salaryEl.textContent || "";
      const parsed = parseSalaryString(salStr);
      salary_min = parsed.salary_min;
      salary_max = parsed.salary_max;
      salary_currency = parsed.salary_currency;
      salary_period = parsed.salary_period;
    }
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0432 \u0430\u0440\u0445\u0438\u0432\u0435") || text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country: "Russia",
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
};

// src/parsers/avito.ts
var AvitoParser = class extends BaseParser {
  name = "avito";
  source = "Avito";
  priority = 10;
  needs_extension = false;
  domains = ["avito.ru"];
  matches(url) {
    return url.toLowerCase().includes("avito.ru");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let company;
    let location;
    let city;
    let description;
    let is_closed = false;
    let salary_min;
    let salary_max;
    let salary_currency;
    let salary_period;
    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();
    const companyEl = doc.querySelector('[data-marker="seller-info/name"]') || doc.querySelector(".seller-info-name");
    if (companyEl) company = companyEl.textContent?.trim();
    const locEl = doc.querySelector('[data-marker="item-address/text"]') || doc.querySelector(".item-address");
    if (locEl) {
      location = locEl.textContent?.trim();
      city = location;
    }
    const descEl = doc.querySelector('[data-marker="item-view/item-description"]') || doc.querySelector(".item-description");
    if (descEl) description = cleanText(descEl);
    const salaryEl = doc.querySelector('[data-marker="item-view/item-price"]') || doc.querySelector(".item-price");
    if (salaryEl) {
      const salStr = salaryEl.textContent || "";
      const parsed = parseSalaryString(salStr);
      salary_min = parsed.salary_min;
      salary_max = parsed.salary_max;
      salary_currency = parsed.salary_currency;
      salary_period = parsed.salary_period;
    }
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("\u0441\u043D\u044F\u0442\u043E \u0441 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438") || text.includes("\u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u043E")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country: "Russia",
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
};

// src/parsers/rabotaru.ts
var RabotaRuParser = class extends BaseParser {
  name = "rabotaru";
  source = "Rabota.ru";
  priority = 10;
  needs_extension = false;
  domains = ["rabota.ru"];
  matches(url) {
    return url.toLowerCase().includes("rabota.ru");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let company;
    let location;
    let city;
    let description;
    let is_closed = false;
    let salary_min;
    let salary_max;
    let salary_currency;
    let salary_period;
    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();
    const companyEl = doc.querySelector(".vacancy-company__name");
    if (companyEl) company = companyEl.textContent?.trim();
    const locEl = doc.querySelector(".vacancy-location__text") || doc.querySelector(".vacancy-page__location");
    if (locEl) {
      location = locEl.textContent?.trim();
      city = location;
    }
    const descEl = doc.querySelector(".vacancy-description");
    if (descEl) description = cleanText(descEl);
    const salaryEl = doc.querySelector(".vacancy-salary__text") || doc.querySelector(".vacancy-page__salary");
    if (salaryEl) {
      const salStr = salaryEl.textContent || "";
      const parsed = parseSalaryString(salStr);
      salary_min = parsed.salary_min;
      salary_max = parsed.salary_max;
      salary_currency = parsed.salary_currency;
      salary_period = parsed.salary_period;
    }
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0432 \u0430\u0440\u0445\u0438\u0432\u0435") || text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country: "Russia",
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
};

// src/parsers/flru.ts
var FLRuParser = class extends BaseParser {
  name = "flru";
  source = "FL.ru";
  priority = 10;
  needs_extension = false;
  domains = ["fl.ru"];
  matches(url) {
    return url.toLowerCase().includes("fl.ru");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let description;
    let is_closed = false;
    let salary_min;
    let salary_max;
    let salary_currency;
    let salary_period;
    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();
    const descEl = doc.querySelector(".b-layout__txt_lineheight_1");
    if (descEl) description = cleanText(descEl);
    const salaryEl = doc.querySelector(".b-layout__title span.b-layout__txt");
    if (salaryEl) {
      const salStr = salaryEl.textContent || "";
      const parsed = parseSalaryString(salStr);
      salary_min = parsed.salary_min;
      salary_max = parsed.salary_max;
      salary_currency = parsed.salary_currency;
      salary_period = parsed.salary_period;
    }
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("\u043F\u0440\u043E\u0435\u043A\u0442 \u0437\u0430\u043A\u0440\u044B\u0442") || text.includes("\u0437\u0430\u043A\u0430\u0437 \u0437\u0430\u043A\u0440\u044B\u0442")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      description: description?.substring(0, 15e3),
      workplace_type: "remote",
      // Freelance is inherently remote
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
};

// src/parsers/linkedin.ts
var LinkedInParser = class extends BaseParser {
  name = "linkedin";
  source = "LinkedIn";
  priority = 20;
  needs_extension = false;
  domains = ["linkedin.com"];
  matches(url) {
    return url.toLowerCase().includes("linkedin.com/jobs");
  }
  extractJobId(url) {
    const match = url.match(/view\/(\d+)/) || url.match(/currentJobId=(\d+)/);
    return match ? match[1] : null;
  }
  async parse(url, html) {
    url = url.trim();
    const job_id = this.extractJobId(url) || void 0;
    if (!html) return { url, source: this.source, job_id };
    const doc = createDocument(html);
    let title;
    let company;
    let company_url;
    let location;
    let city;
    let description;
    let is_closed = false;
    const h1Guest = doc.querySelector(".top-card-layout__title");
    const h1Auth = doc.querySelector(".job-details-jobs-unified-top-card__job-title");
    const h1Auth2 = doc.querySelector("h1.t-24");
    if (h1Auth) title = h1Auth.textContent?.trim();
    else if (h1Auth2) title = h1Auth2.textContent?.trim();
    else if (h1Guest) title = h1Guest.textContent?.trim();
    const companyGuest = doc.querySelector(".topcard__org-name-link");
    const companyAuth = doc.querySelector(".job-details-jobs-unified-top-card__company-name a");
    if (companyAuth) {
      company = companyAuth.textContent?.trim();
      const href = companyAuth.getAttribute("href");
      if (href) {
        company_url = href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
        company_url = company_url.split("?")[0];
      }
    } else if (companyGuest) {
      company = companyGuest.textContent?.trim();
      const href = companyGuest.getAttribute("href");
      if (href) {
        company_url = href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
        company_url = company_url.split("?")[0];
      }
    }
    const locGuest = doc.querySelector(".topcard__flavor--bullet");
    const locAuth = doc.querySelector(".job-details-jobs-unified-top-card__primary-description-container span.tvm__text");
    if (locAuth) {
      location = locAuth.textContent?.trim();
      city = location;
    } else if (locGuest) {
      location = locGuest.textContent?.trim();
      city = location;
    }
    const descGuest = doc.querySelector(".show-more-less-html__markup");
    const descAuth = doc.querySelector(".jobs-description__container") || doc.querySelector("#job-details");
    if (descAuth) description = cleanText(descAuth);
    else if (descGuest) description = cleanText(descGuest);
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("no longer accepting applications") || text.includes("job is closed") || text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430")) {
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
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed
    };
  }
};

// src/parsers/upwork.ts
var UpworkParser = class extends BaseParser {
  name = "upwork";
  source = "Upwork";
  priority = 20;
  needs_extension = true;
  domains = ["upwork.com"];
  matches(url) {
    return url.toLowerCase().includes("upwork.com");
  }
  extractJobId(url) {
    const match = url.match(/~(.*?)(?:\/|\?|$)/);
    return match ? match[1] : null;
  }
  async parse(url, html) {
    url = url.trim();
    const job_id = this.extractJobId(url) || void 0;
    if (!html) return { url, source: this.source, job_id, is_closed: false };
    const doc = createDocument(html);
    let title;
    let description;
    let is_closed = false;
    let salary_min;
    let salary_max;
    let salary_currency = "USD";
    let salary_period;
    const h4 = doc.querySelector("h4");
    if (h4) title = h4.textContent?.trim();
    const h1 = doc.querySelector("h1");
    if (!title && h1) title = h1.textContent?.trim();
    const descEl = doc.querySelector(".job-description") || doc.querySelector('[data-test="JobDescription"]');
    if (descEl) description = cleanText(descEl);
    const budgetEls = Array.from(doc.querySelectorAll('strong, [data-test="budget"], [data-test="hourly-rate"]'));
    for (const el of budgetEls) {
      const text2 = el.textContent || "";
      if (text2.includes("$")) {
        const parsed = parseSalaryString(text2);
        if (parsed.salary_min) {
          salary_min = parsed.salary_min;
          salary_max = parsed.salary_max;
          salary_currency = parsed.salary_currency || "USD";
          salary_period = parsed.salary_period;
          break;
        }
      }
    }
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("this job is closed") || text.includes("no longer available")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      job_id,
      title,
      description: description?.substring(0, 15e3),
      workplace_type: "remote",
      // Upwork is always remote
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
};

// src/parsers/superjob.ts
var SuperJobParser = class extends BaseParser {
  name = "superjob";
  source = "SuperJob";
  priority = 10;
  needs_extension = false;
  domains = ["superjob.ru"];
  matches(url) {
    return url.toLowerCase().includes("superjob.ru");
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let company;
    let location;
    let city;
    let description;
    let is_closed = false;
    let salary_min;
    let salary_max;
    let salary_currency;
    let salary_period;
    const h1 = doc.querySelector("h1");
    if (h1) title = h1.textContent?.trim();
    const companyEls = Array.from(doc.querySelectorAll("a, span"));
    for (const el of companyEls) {
      const href = el.getAttribute("href") || "";
      if (href.includes("/clients/")) {
        company = el.textContent?.trim();
        break;
      }
    }
    const locEls = Array.from(doc.querySelectorAll("span"));
    for (const el of locEls) {
      const text2 = el.textContent || "";
      if (text2.includes("\u041C\u043E\u0441\u043A\u0432\u0430") || text2.includes("\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433") || text2.includes("\u0433\u043E\u0440\u043E\u0434")) {
        if (text2.length < 50 && !location) {
          location = text2;
          city = location;
        }
      }
    }
    const descEl = doc.querySelector('[class*="VacancyDescription"]') || doc.querySelector('[class*="vacancy-description"]');
    if (descEl) description = cleanText(descEl);
    if (!description) {
      const spans = Array.from(doc.querySelectorAll("span"));
      for (const span of spans) {
        if (span.textContent?.includes("\u041E\u0431\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438") || span.textContent?.includes("\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F")) {
          description = cleanText(span.parentElement || span);
          break;
        }
      }
    }
    const h1Parent = h1?.parentElement;
    if (h1Parent) {
      const salText = h1Parent.textContent?.replace(title || "", "") || "";
      if (salText) {
        const parsed = parseSalaryString(salText);
        salary_min = parsed.salary_min;
        salary_max = parsed.salary_max;
        salary_currency = parsed.salary_currency;
        salary_period = parsed.salary_period;
      }
    }
    const workplace_type = normalizeWorkplace(title || "") || normalizeWorkplace(location || "") || normalizeWorkplace(description || "");
    const text = doc.body.textContent?.toLowerCase() || "";
    if (text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0432 \u0430\u0440\u0445\u0438\u0432\u0435") || text.includes("\u0432\u0430\u043A\u0430\u043D\u0441\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u0430")) {
      is_closed = true;
    }
    return {
      url,
      source: this.source,
      title,
      company,
      location,
      city,
      country: "Russia",
      description: description?.substring(0, 15e3),
      workplace_type: workplace_type || void 0,
      is_closed,
      salary_min,
      salary_max,
      salary_currency,
      salary_period
    };
  }
};

// src/parsers/universal.ts
import { Readability } from "@mozilla/readability";
import DOMPurify from "isomorphic-dompurify";
var UniversalParser = class extends BaseParser {
  name = "universal";
  source = "Universal";
  priority = 0;
  // Lowest priority, acts as a fallback
  needs_extension = false;
  domains = [];
  matches(url) {
    return true;
  }
  async parse(url, html) {
    url = url.trim();
    if (!html) return { url, source: this.source };
    const doc = createDocument(html);
    let title;
    let description;
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
      const h1 = doc.querySelector("h1");
      if (h1) title = h1.textContent?.trim();
    }
    if (!title) {
      title = doc.title;
    }
    return {
      url,
      source: this.source,
      title,
      description: description?.substring(0, 15e3)
    };
  }
};

// src/index.ts
registry.register(new GlassdoorParser());
registry.register(new GeekJobParser());
registry.register(new LayboardParser());
registry.register(new HabrParser());
registry.register(new AvitoParser());
registry.register(new RabotaRuParser());
registry.register(new FLRuParser());
registry.register(new LinkedInParser());
registry.register(new UpworkParser());
registry.register(new SuperJobParser());
registry.register(new UniversalParser());
export {
  BaseParser,
  COUNTRY_ALIASES,
  KNOWN_COUNTRIES,
  Registry,
  cleanText,
  findJsonLd,
  normalizeCountry,
  normalizeCurrency,
  normalizePeriod,
  normalizeWorkplace,
  parseJsonLdSalary,
  parseLocation,
  parseSalaryString,
  registry
};
