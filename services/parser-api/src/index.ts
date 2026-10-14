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
    if (!url || !html) {
      return res.status(400).json({ error: 'Missing url or html' });
    }

    const data = await registry.parse(url, html);

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Parser API listening on port ${PORT}`);
});
