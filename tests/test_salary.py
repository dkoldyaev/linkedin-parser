import unittest
from bs4 import BeautifulSoup
from backend.scraper import extract_salary_from_soup
from backend.database import ensure_db_schema, engine
from backend.models import Vacancy
from backend.schemas import VacancyBase, VacancyUpdate

class TestSalary(unittest.TestCase):
    def test_json_ld_annual_salary(self):
        html = """
        <html>
        <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Senior Software Engineer",
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
              "@type": "QuantitativeValue",
              "minValue": 120000,
              "maxValue": 150000,
              "unitText": "YEAR"
            }
          }
        }
        </script>
        </head>
        <body></body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        res = extract_salary_from_soup(soup)
        self.assertEqual(res["salary_min"], 120000.0)
        self.assertEqual(res["salary_max"], 150000.0)
        self.assertEqual(res["salary_currency"], "USD")
        self.assertEqual(res["salary_period"], "year")

    def test_json_ld_hourly_salary(self):
        html = """
        <html>
        <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Contract Developer",
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "EUR",
            "value": {
              "@type": "QuantitativeValue",
              "value": 65,
              "unitText": "HOUR"
            }
          }
        }
        </script>
        </head>
        <body></body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        res = extract_salary_from_soup(soup)
        self.assertEqual(res["salary_min"], 65.0)
        self.assertEqual(res["salary_max"], 65.0)
        self.assertEqual(res["salary_currency"], "EUR")
        self.assertEqual(res["salary_period"], "hour")

    def test_ensure_db_schema(self):
        # Verify ensure_db_schema runs without raising exceptions
        ensure_db_schema()

    def test_schemas(self):
        v = VacancyBase(
            title="Dev",
            company="Co",
            url="https://linkedin.com/jobs/view/123",
            salary_min=100000,
            salary_max=120000,
            salary_currency="$",
            salary_period="year"
        )
        self.assertEqual(v.salary_min, 100000)
        self.assertEqual(v.salary_period, "year")

        up = VacancyUpdate(salary_min=110000)
        self.assertEqual(up.salary_min, 110000)

if __name__ == "__main__":
    unittest.main()
