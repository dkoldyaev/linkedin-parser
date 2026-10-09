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

  it('should parse universal examples', async () => {
    const html = `<html><head><title>Test Universal</title></head><body><h1>Software Engineer</h1><p>We are looking for an engineer.</p></body></html>`;
    const data = await registry.parse('https://example.com/job/123', html);
    expect(data).toBeDefined();
    expect(data.source).toBe('Universal');
    expect(data.title).toBe('Test Universal');
    expect(data.description).toContain('We are looking for an engineer');
  });
});
