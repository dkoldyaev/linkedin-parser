import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { registry } from './index';

describe('Parsers Batch 1', () => {
  const examplesDir = path.join(__dirname, '..', '..', '..', 'examples');

  it('should parse glassdoor examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('glassdoor'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://www.glassdoor.com/job-listing/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('Glassdoor');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse geekjob examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('geekjob'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://geekjob.ru/vacancy/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('GeekJob');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse layboard examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('layboard'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://layboard.com/vacancies/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('Layboard');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse habr examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('habr'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://career.habr.com/vacancies/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('Habr Career');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse avito examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('avito'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://www.avito.ru/moskva/vakansii/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('Avito');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse rabotaru examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('rabotaru') || f.startsWith('rabota_ru'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://www.rabota.ru/vacancy/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('Rabota.ru');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse flru examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('fl_ru') || f.startsWith('flru'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://www.fl.ru/projects/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('FL.ru');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse linkedin examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('linkedin'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://www.linkedin.com/jobs/view/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('LinkedIn');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse upwork examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('upwork'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://www.upwork.com/jobs/~${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('Upwork');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse superjob examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('superjob'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://superjob.ru/vakansii/${file}`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('SuperJob');
      expect(data.title).toBeTruthy();
    }
  });

  it('should parse indeed examples', async () => {
    const files = fs.readdirSync(examplesDir).filter(f => f.startsWith('indeed') && f.endsWith('.html'));
    for (const file of files) {
      const html = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
      const url = `https://de.indeed.com/viewjob?jk=dummy`;
      const data = await registry.parse(url, html);
      expect(data).toBeDefined();
      expect(data.source).toBe('Indeed');
      expect(data.title).toBeTruthy();
      expect(data.company).toBeTruthy();
      expect(data.city).toBe('Berlin');
      expect(data.country).toBe('Germany');
    }

    // Specific check for indeed.com.html with salary
    const htmlSalary = fs.readFileSync(path.join(examplesDir, 'indeed.com.html'), 'utf-8');
    const dataSalary = await registry.parse('https://de.indeed.com/viewjob?jk=baeede3fdb6f9f89', htmlSalary);
    expect(dataSalary.title).toBe('Senior Product Engineer (TS/NodeJS/Vue)');
    expect(dataSalary.company).toBe('n8n');
    expect(dataSalary.salary_min).toBe(72800);
    expect(dataSalary.salary_max).toBe(144400);
    expect(dataSalary.salary_currency).toBe('EUR');
    expect(dataSalary.salary_period).toBe('year');
    expect(dataSalary.url).toBe('https://de.indeed.com/viewjob?jk=baeede3fdb6f9f89');
  });

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

