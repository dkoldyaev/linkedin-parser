import re
from typing import Tuple, Optional

# US States mapping
US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC"
}

# Canadian provinces
CA_PROVINCES = {"AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK"}

# Canonical country name overrides / aliases
COUNTRY_ALIASES = {
    "uk": "United Kingdom",
    "u.k.": "United Kingdom",
    "great britain": "United Kingdom",
    "england": "United Kingdom",
    "scotland": "United Kingdom",
    "wales": "United Kingdom",
    "northern ireland": "United Kingdom",
    "usa": "United States",
    "u.s.a.": "United States",
    "us": "United States",
    "u.s.": "United States",
    "uae": "United Arab Emirates",
    "u.a.e.": "United Arab Emirates",
    "czech republic": "Czechia",
    "the netherlands": "Netherlands",
    "holland": "Netherlands",
    "españa": "Spain",
    "deutschland": "Germany",
}

# Known countries set (lowercased for matching)
KNOWN_COUNTRIES = {
    "afghanistan", "albania", "algeria", "andorra", "angola", "argentina", "armenia",
    "australia", "austria", "azerbaijan", "bahamas", "bahrain", "bangladesh", "barbados",
    "belarus", "belgium", "belize", "benin", "bhutan", "bolivia", "bosnia and herzegovina",
    "botswana", "brazil", "bulgaria", "cambodia", "cameroon", "canada", "chile", "china",
    "colombia", "costa rica", "croatia", "cuba", "cyprus", "czechia", "denmark",
    "dominican republic", "ecuador", "egypt", "estonia", "finland", "france", "georgia",
    "germany", "ghana", "greece", "guatemala", "hungary", "iceland", "india", "indonesia",
    "iran", "iraq", "ireland", "israel", "italy", "japan", "jordan", "kazakhstan", "kenya",
    "kuwait", "latvia", "lebanon", "lithuania", "luxembourg", "malaysia", "malta", "mexico",
    "moldova", "monaco", "montenegro", "morocco", "netherlands", "new zealand", "nigeria",
    "norway", "oman", "pakistan", "panama", "paraguay", "peru", "philippines", "poland",
    "portugal", "qatar", "romania", "russia", "saudi arabia", "serbia", "singapore",
    "slovakia", "slovenia", "south africa", "south korea", "spain", "sri lanka", "sweden",
    "switzerland", "taiwan", "thailand", "tunisia", "turkey", "ukraine",
    "united arab emirates", "united kingdom", "united states", "uruguay", "uzbekistan",
    "venezuela", "vietnam"
}

# Popular tech cities -> default country when city is specified alone
CITY_TO_COUNTRY = {
    "madrid": "Spain",
    "barcelona": "Spain",
    "valencia": "Spain",
    "seville": "Spain",
    "malaga": "Spain",
    "bilbao": "Spain",
    "berlin": "Germany",
    "munich": "Germany",
    "hamburg": "Germany",
    "frankfurt": "Germany",
    "cologne": "Germany",
    "paris": "France",
    "lyon": "France",
    "marseille": "France",
    "london": "United Kingdom",
    "manchester": "United Kingdom",
    "edinburgh": "United Kingdom",
    "birmingham": "United Kingdom",
    "amsterdam": "Netherlands",
    "rotterdam": "Netherlands",
    "the hague": "Netherlands",
    "utrecht": "Netherlands",
    "dublin": "Ireland",
    "cork": "Ireland",
    "warsaw": "Poland",
    "krakow": "Poland",
    "wroclaw": "Poland",
    "poznan": "Poland",
    "gdansk": "Poland",
    "lisbon": "Portugal",
    "porto": "Portugal",
    "rome": "Italy",
    "milan": "Italy",
    "turin": "Italy",
    "florence": "Italy",
    "zurich": "Switzerland",
    "geneva": "Switzerland",
    "lausanne": "Switzerland",
    "vienna": "Austria",
    "stockholm": "Sweden",
    "gothenburg": "Sweden",
    "oslo": "Norway",
    "copenhagen": "Denmark",
    "helsinki": "Finland",
    "prague": "Czechia",
    "brno": "Czechia",
    "budapest": "Hungary",
    "bucharest": "Romania",
    "sofia": "Bulgaria",
    "athens": "Greece",
    "tallinn": "Estonia",
    "riga": "Latvia",
    "vilnius": "Lithuania",
    "limassol": "Cyprus",
    "nicosia": "Cyprus",
    "tbilisi": "Georgia",
    "yerevan": "Armenia",
    "belgrade": "Serbia",
    "tel aviv": "Israel",
    "tel aviv-yafo": "Israel",
    "dubai": "United Arab Emirates",
    "abu dhabi": "United Arab Emirates",
    "singapore": "Singapore",
    "tokyo": "Japan",
    "sydney": "Australia",
    "melbourne": "Australia",
    "toronto": "Canada",
    "vancouver": "Canada",
    "montreal": "Canada",
    "new york": "United States",
    "san francisco": "United States",
    "seattle": "United States",
    "austin": "United States",
    "boston": "United States",
    "chicago": "United States",
    "los angeles": "United States",
    "san jose": "United States",
    "san diego": "United States",
    "denver": "United States",
    "atlanta": "United States",
    "miami": "United States",
    "hanoi": "Vietnam",
    "ho chi minh": "Vietnam",
    "ho chi minh city": "Vietnam",
    "alicante": "Spain",
}


def normalize_country(raw_country: str) -> str:
    """Normalize country string to canonical title-cased English name."""
    if not raw_country:
        return ""
    c = raw_country.strip()
    c_lower = c.lower()

    if c_lower in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[c_lower]

    for known in KNOWN_COUNTRIES:
        if c_lower == known:
            return " ".join(word.capitalize() for word in known.split())

    # Fallback to Title Case
    return " ".join(word.capitalize() for word in c.split())


def clean_city_name(raw_city: str) -> str:
    """
    Cleans city name by removing metropolitan area suffixes.
    e.g. 'Greater Madrid Metropolitan Area' -> 'Madrid'
    'San Francisco Bay Area' -> 'San Francisco'
    'Hanoi Capital Region' -> 'Hanoi'
    """
    if not raw_city:
        return ""
    cleaned = raw_city.strip()

    # Pattern: 'Greater X Metropolitan Area' or 'Greater X Area' or 'X Capital Region' etc.
    metro_match = re.search(
        r"^(?:Greater\s+)?(.*?)(?:\s+(?:Metropolitan|Capital|Bay))?\s+(?:Area|Region)$",
        cleaned,
        re.IGNORECASE,
    )
    if metro_match:
        extracted = metro_match.group(1).strip()
        if extracted:
            cleaned = extracted

    # Remove 'Greater ' prefix if left
    cleaned = re.sub(r"^Greater\s+", "", cleaned, flags=re.IGNORECASE).strip()

    return cleaned


def parse_location(raw_location: Optional[str]) -> Tuple[str, str]:
    """
    Parses a raw LinkedIn location string into (city, country).
    Returns tuple of (city: str, country: str).
    """
    if not raw_location:
        return "", ""

    # 1. Clean location string from workplace type indicators
    text = raw_location.strip()
    # Remove (Hybrid), (Remote), (On-site), (Гибрид), (Удаленно)
    text = re.sub(r"\s*\((?:Hybrid|Remote|On-site|Гибрид|Удаленно|В офисе)\)\s*", "", text, flags=re.IGNORECASE)
    # Remove trailing / leading comma or whitespace
    text = text.strip(" ,-")

    if not text:
        return "", ""

    # 2. Check if whole string indicates purely remote/worldwide
    if text.lower() in {"remote", "worldwide", "anywhere", "global", "удаленно"}:
        return "", ""

    # 3. Check for comma-separated parts
    parts = [p.strip() for p in text.split(",") if p.strip()]

    if len(parts) >= 2:
        raw_city = parts[0]
        raw_country = parts[-1]

        # Check for US state code in last part (e.g. 'Austin, TX' or 'Sunnyvale, CA, United States')
        if raw_country.upper() in US_STATES:
            country = "United States"
            city = clean_city_name(raw_city)
            return city, country

        # Check for Canadian province
        if raw_country.upper() in CA_PROVINCES:
            country = "Canada"
            city = clean_city_name(raw_city)
            return city, country

        country = normalize_country(raw_country)
        city = clean_city_name(raw_city)
        return city, country

    # 4. Single token without comma (e.g. 'Greater Madrid Metropolitan Area', 'Spain', 'Barcelona')
    single = parts[0]
    single_lower = single.lower()

    # Check if single token is a known country
    if single_lower in KNOWN_COUNTRIES or single_lower in COUNTRY_ALIASES:
        return "", normalize_country(single)

    # Check for 'Greater X Metropolitan Area' or 'X Capital Region'
    metro_match = re.search(
        r"^(?:Greater\s+)?(.*?)(?:\s+(?:Metropolitan|Capital|Bay))?\s+(?:Area|Region)$",
        single,
        re.IGNORECASE,
    )
    if metro_match:
        extracted = metro_match.group(1).strip()
        cleaned_city = clean_city_name(extracted)
        country = CITY_TO_COUNTRY.get(cleaned_city.lower(), "")
        return cleaned_city, country

    # Check if single token is a known city directly
    cleaned_city = clean_city_name(single)
    if cleaned_city.lower() in CITY_TO_COUNTRY:
        return cleaned_city, CITY_TO_COUNTRY[cleaned_city.lower()]

    # If nothing matched, treat as city if not looking like country
    return cleaned_city, ""
