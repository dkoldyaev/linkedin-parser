import unittest
from backend.parsers.helpers import clean_url_params, extract_canonical_url
from backend.parsers.registry import registry
from backend.scraper import normalize_url

class TestUrlNormalization(unittest.TestCase):
    def test_clean_url_params(self):
        url = "https://www.linkedin.com/jobs/view/1234567890/?refId=abcd&trackingId=xyz&utm_source=test"
        clean = clean_url_params(url)
        self.assertEqual(clean, "https://www.linkedin.com/jobs/view/1234567890/")

    def test_extract_canonical_url(self):
        html = '<html><head><link rel="canonical" href="https://www.linkedin.com/jobs/view/1234567890/"></head></html>'
        canonical = extract_canonical_url(html)
        self.assertEqual(canonical, "https://www.linkedin.com/jobs/view/1234567890/")

    def test_linkedin_url_normalization(self):
        # Long tracking URL like in user bug report
        long_url = (
            "https://www.linkedin.com/jobs/search-results/?currentJobId=4460516197"
            "&eBP=NON_CHARGEABLE_CHANNEL&refId=hdqrIZIq3pleSxJ6sU0mPQ%3D%3D"
            "&trackingId=hAEzi3&keywords=Full+Stack+Engineer&origin=QUALIFICATION_LANDING"
            "&geoId=105646813&lipi=urn%3Ali%3Apage%3Ad_flagship3_job_home%3BAJE6Z4orRfe8df3OsOujow%3D%3D"
        )
        normalized = normalize_url(long_url)
        self.assertEqual(normalized, "https://www.linkedin.com/jobs/view/4460516197/")

    def test_other_parsers_normalization(self):
        self.assertEqual(
            normalize_url("https://career.habr.com/vacancies/12345?utm_source=feed"),
            "https://career.habr.com/vacancies/12345"
        )
        self.assertEqual(
            normalize_url("https://geekjob.ru/vacancy/abc123def?utm_source=tg"),
            "https://geekjob.ru/vacancy/abc123def"
        )
        self.assertEqual(
            normalize_url("https://www.fl.ru/projects/987654/?utm_medium=email"),
            "https://www.fl.ru/projects/987654/"
        )

if __name__ == "__main__":
    unittest.main()
