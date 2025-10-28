export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const body = Array.isArray(req.body) ? req.body : [req.body];

  // Build the OpenObserve ingest URL
  const org = process.env.OO_ORG || 'default';
  const stream = process.env.OO_STREAM || 'soundrollapp';
  const base = (process.env.OO_BASE || 'http://159.203.77.36:5080').replace(/\/$/, '');
  const url = `${base}/api/${org}/${stream}/_json`;

  // Auth: Basic (since that works for you)
  const pair = process.env.OO_BASIC; // "email:password"
  const auth = 'Basic ' + Buffer.from(pair, 'utf8').toString('base64');

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': auth },
    body: JSON.stringify(body)
  });

  const text = await r.text();
  res.status(r.status).send(text);
}
