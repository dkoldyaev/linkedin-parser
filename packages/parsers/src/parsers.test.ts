import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { registry } from './index';

// One fixture per case: large saved pages must not share a single 5s budget.
const examplesDir = path.join(__dirname, '..', '..', '..', 'examples');
const files = fs.existsSync(examplesDir) ? fs.readdirSync(examplesDir).filter(f => f.endsWith('.html')) : [];
const sources = [
  { prefix: 'glassdoor', source: 'Glassdoor', url: 'https://www.glassdoor.com/job-listing/job.htm?jl=1009581177659' },
  { prefix: 'geekjob', source: 'GeekJob', url: 'https://geekjob.ru/vacancy/691aef77ce60ad56c3046275' },
  { prefix: 'layboard', source: 'Layboard', url: 'https://layboard.com/vakansiya/2392607/job' },
  { prefix: 'career.habr', source: 'Habr Career', url: 'https://career.habr.com/vacancies/1000168669' },
  { prefix: 'avito', source: 'Avito', url: 'https://www.avito.ru/moskva/vakansii/job_8086146184' },
  { prefix: 'rabota.ru', source: 'Rabota.ru', url: 'https://www.rabota.ru/vacancy/54211993/' },
  { prefix: 'fl.ru', source: 'FL.ru', url: 'https://www.fl.ru/projects/5523901/job.html' },
  { prefix: 'linkedin', source: 'LinkedIn', url: 'https://www.linkedin.com/jobs/view/4460516197/' },
  { prefix: 'upwork', source: 'Upwork', url: 'https://www.upwork.com/jobs/~022104418223352040840/' },
  { prefix: 'superjob', source: 'SuperJob', url: 'https://superjob.ru/vakansii/job-52236624.html' },
  { prefix: 'indeed', source: 'Indeed', url: 'https://de.indeed.com/viewjob?jk=baeede3fdb6f9f89' },
];

describe('Saved HTML parser contracts', () => {
  for (const { prefix, source, url } of sources) {
    const fixtures = files.filter(file => file.startsWith(prefix));
    if (!fixtures.length && source === 'LinkedIn') {
      it('LinkedIn: self-contained HTML contract', async () => {
        const data = await registry.parse(url, '<html><body><h1 class="top-card-layout__title">Python Engineer</h1><a class="topcard__org-name-link">Test Corp</a><div class="description__text">Build Python services</div></body></html>');
        expect(data.source).toBe('LinkedIn');
        expect(data.title).toBe('Python Engineer');
      });
    } else if (!fixtures.length) {
      it.skip(`${source}: optional saved HTML fixtures unavailable`, () => {});
    }
    for (const file of fixtures) {
      it(`${source}: ${file}`, async () => {
        const html = fs.readFileSync(path.join(examplesDir, file), 'utf8');
        const data = await registry.parse(url, html);
        expect(data.source).toBe(source);
        expect(data.title).toBeTruthy();
        if (file === 'indeed.com.html') {
          expect(data.company).toBe('n8n');
          expect(data.salary_min).toBe(72800);
          expect(data.salary_max).toBe(144400);
          expect(data.salary_currency).toBe('EUR');
          expect(data.salary_period).toBe('year');
        }
      }, 30000);
    }
  }
  it('should normalize URLs properly across parsers', () => {
    const rawLinkedIn = 'https://www.linkedin.com/jobs/search-results/?currentJobId=4460516197&eBP=NON_CHARGEABLE_CHANNEL&refId=hdqrIZIq3pleSxJ6sU0mPQ%3D%3D&trackingId=hAEzi3&keywords=Full+Stack+Engineer&origin=QUALIFICATION_LANDING&geoId=105646813';
    expect(registry.normalizeUrl(rawLinkedIn)).toBe('https://www.linkedin.com/jobs/view/4460516197/');

    const rawGlassdoor = 'https://www.glassdoor.com/job-listing/senior-engineer?jl=100987654321&pos=101&ao=123';
    expect(registry.normalizeUrl(rawGlassdoor)).toBe('https://www.glassdoor.com/job-listing/job.htm?jl=100987654321');

    const rawGeekjob = 'https://geekjob.ru/vacancy/64f8a1b2c3d4e5f6?utm_source=tg&utm_medium=post';
    expect(registry.normalizeUrl(rawGeekjob)).toBe('https://geekjob.ru/vacancy/64f8a1b2c3d4e5f6');

    const rawHabr = 'https://career.habr.com/vacancies/1000123456?type=all';
    expect(registry.normalizeUrl(rawHabr)).toBe('https://career.habr.com/vacancies/1000123456');

    const rawUpwork = 'https://www.upwork.com/jobs/~01abc123def456?source=search';
    expect(registry.normalizeUrl(rawUpwork)).toBe('https://www.upwork.com/jobs/~01abc123def456/');

    const rawIndeed = 'https://de.indeed.com/viewjob?jk=294318deae1b3655&from=hp.jobsForYou&tk=123&vjs=3';
    expect(registry.normalizeUrl(rawIndeed)).toBe('https://de.indeed.com/viewjob?jk=294318deae1b3655');

    const rawIndeedSearch = 'https://de.indeed.com/jobs?q=engineer&l=berlin&vjk=baeede3fdb6f9f89';
    expect(registry.normalizeUrl(rawIndeedSearch)).toBe('https://de.indeed.com/viewjob?jk=baeede3fdb6f9f89');
  });
});
