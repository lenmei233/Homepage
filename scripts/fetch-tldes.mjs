import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const PUBLIC = path.resolve(process.cwd(), 'public/data/tldes-prices.json');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.get(
      { hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 120000 },
      (res) => {
        if (res.statusCode >= 400) return reject(new Error('HTTP ' + res.statusCode));
        if (res.statusCode >= 300 && res.headers.location) {
          res.resume();
          return resolve(fetch(res.headers.location));
        }
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => resolve(data));
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function main() {
  const url = process.argv[2] || 'https://r.jina.ai/https://tldes.com/all-tlds-data/all-tlds-full.json';
  const raw = await fetch(url);
  const i = raw.indexOf('[');
  const j = raw.lastIndexOf(']');
  const json = raw.slice(i, j + 1);
  const rows = JSON.parse(json);
  if (!Array.isArray(rows) || rows.length < 2) throw new Error('unexpected data shape');
  const meta = rows[0];
  const registrars = meta.aRegs.map((r) => r[0]);
  const prices = {};
  for (let k = 1; k < rows.length; k++) {
    const row = rows[k];
    if (!Array.isArray(row) || row.length < 5) continue;
    const [tld, , nArr, rArr, tArr] = row;
    if (typeof tld !== 'string') continue;
    const pick = (arr) =>
      (arr || [])
        .filter((x) => Array.isArray(x) && x.length >= 2)
        .map((x) => [Number(x[0]), x[1]]);
    prices[tld] = { n: pick(nArr), r: pick(rArr), t: pick(tArr) };
  }
  const out = { updated: meta.timestamp, registrars, prices };
  const pretty = JSON.stringify(out);
  fs.mkdirSync(path.dirname(PUBLIC), { recursive: true });
  fs.writeFileSync(PUBLIC, pretty);
  console.log('TLDs:', Object.keys(prices).length);
  console.log('Registrars:', registrars.length);
  console.log('Written:', PUBLIC, (pretty.length / 1024).toFixed(1) + 'KB');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
