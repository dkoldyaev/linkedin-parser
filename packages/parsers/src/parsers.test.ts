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
});
