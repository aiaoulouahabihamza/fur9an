import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Audio proxy endpoint to bypass CORS issues during offline downloads
app.get('/api/proxy-audio', async (req, res) => {
  const audioUrl = req.query.url;
  if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  try {
    const fetchRes = await fetch(audioUrl);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: `Remote returned HTTP ${fetchRes.status}` });
    }

    res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await fetchRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Audio proxy error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch remote audio', details: err.message });
  }
});

// Serve static files from the root directory
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

