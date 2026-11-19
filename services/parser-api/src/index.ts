import express from 'express';
import { registry } from '@parser-as-service/parsers';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.send('OK');
});

app.post('/api/normalize', (req, res) => {
  try {
    const { url, html } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }
    const normalized = registry.normalizeUrl(url, html);
    res.json({ url: normalized });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/parse', async (req, res) => {
  try {
    const { url, html } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }

    let jobHtml = html;
    if (!jobHtml) {
      try {
        const resp = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        });
        if (resp.ok) {
          jobHtml = await resp.text();
        }
      } catch (e: any) {
        console.warn(`[parser-api] Failed to fetch HTML for ${url}: ${e.message}`);
      }
    }

    const data = await registry.parse(url, jobHtml || '');

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Parser API listening on port ${PORT}`);
});
