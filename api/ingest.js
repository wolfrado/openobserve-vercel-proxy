// /api/ingest.js  (Vercel Serverless Function)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('OK');

  // Body must be an array for OpenObserve
  const body = Array.isArray(req.body) ? req.body : [req.body];

  // Allow overrides via query string: ?org=...&stream=...
  const q = req.query || {};
  const orgQ    = (q.org || '').trim();
  const streamQ = (q.stream || '').trim();

  // Defaults from env
  const ORG_DEFAULT    = process.env.OO_ORG    || 'default';
  const STREAM_DEFAULT = process.env.OO_STREAM || 'default';
  const BASE = (process.env.OO_BASE || 'http://159.203.77.36:5080').replace(/\/$/, '');

  // (Optional) whitelist streams to avoid abuse: comma-separated list in env
  const ALLOWED = (process.env.OO_STREAM_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Basic sanitization: alphanumeric, dash, underscore only
  const safe = s => (s || '').match(/^[A-Za-z0-9_-]+$/) ? s : '';

  const org    = safe(orgQ)    || ORG_DEFAULT;
  const stream = safe(streamQ) || STREAM_DEFAULT;

  if (ALLOWED.length && !ALLOWED.includes(stream)) {
    return res.status(403).json({ error: 'stream_not_allowed', stream, allowed: ALLOWED });
  }

  const url = `${BASE}/api/${org}/${stream}/_json`;

  // ---- Auth: Basic (use what worked for you) ----
  const pair = process.env.OO_BASIC; // "email:password"
  if (!pair) return res.status(500).send('Missing OO_BASIC env var');
  const auth = 'Basic ' + Buffer.from(pair, 'utf8').toString('base64');
  //res.status(200).send(auth);
  res.status(200).send(url);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).send(String(e));
  }
};
