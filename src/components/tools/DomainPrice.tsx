import { useState, useEffect, useMemo } from 'react';
import en from '../../i18n/en.json';
import zh from '../../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

interface TldData { n: [number, number][]; r: [number, number][]; t: [number, number][] }
interface PricesData { updated: number; registrars: string[]; prices: Record<string, TldData> }

const POPULAR = ['com', 'net', 'org', 'ai', 'io', 'co', 'xyz', 'dev', 'app', 'me'];

export default function DomainPrice() {
  const [lang, setLang] = useState(() => {
    try { const s = localStorage.getItem('lang'); return s === 'en' || s === 'zh' ? s : (navigator.language.startsWith('zh') ? 'zh' : 'en'); }
    catch { return 'en'; }
  });
  const t = (key: string) => messages[lang]?.[key] || key;
  const [data, setData] = useState<PricesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('com');
  const [sortCol, setSortCol] = useState<'n' | 'r' | 't'>('n');

  useEffect(() => {
    const handler = (e: Event) => setLang((e as CustomEvent).detail);
    document.addEventListener('lang-changed', handler);
    return () => document.removeEventListener('lang-changed', handler);
  }, []);

  useEffect(() => {
    fetch('/data/tldes-prices.json')
      .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(setData)
      .catch(e => setError(String(e)));
  }, []);

  const tld = useMemo(() => query.trim().toLowerCase().replace(/^\./, ''), [query]);
  const tldData = data?.prices[tld] || null;

  const rows = useMemo(() => {
    if (!tldData) return [];
    const byReg = new Map<number, Partial<TldData>>();
    (['n', 'r', 't'] as const).forEach(key => {
      tldData[key].forEach(item => {
        const [price, regIdx] = item;
        const cur = byReg.get(regIdx) || {};
        cur[key] = price;
        byReg.set(regIdx, cur);
      });
    });
    return [...byReg.entries()]
      .map(([id, v]) => ({ id, name: data!.registrars[id] || '#' + id, ...v }))
      .sort((a, b) => (a[sortCol] ?? Infinity) - (b[sortCol] ?? Infinity));
  }, [tldData, sortCol, data]);

  const fmt = (v?: number) => (v === undefined ? '—' : '$' + v.toFixed(2));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          className="domain-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('tools.domain-price.placeholder')}
          aria-label={t('tools.domain-price.placeholder')}
        />
        <span className="text-sm text-muted">{t('tools.domain-price.suffix')}</span>
        {POPULAR.map(p => (
          <button key={p} className="domain-chip" onClick={() => setQuery(p)}>{p}</button>
        ))}
      </div>

      {error && <p className="text-red-400">{t('tools.domain-price.error')} {error}</p>}

      {!data && !error && <p className="text-muted">{t('tools.loading')}</p>}

      {data && !tldData && (
        <p className="text-muted">{t('tools.domain-price.not-found')} <b>.{tld}</b></p>
      )}

      {tldData && (
        <div className="gc overflow-x-auto">
          <table className="domain-table">
            <thead>
              <tr>
                <th>{t('tools.domain-price.registrar')}</th>
                {(['n', 'r', 't'] as const).map(col => (
                  <th key={col} className="sortable" onClick={() => setSortCol(col)}>
                    {t(`tools.domain-price.${col}`)} {sortCol === col && '▾'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="font-medium">{row.name}</td>
                  <td>{fmt(row.n)}</td>
                  <td>{fmt(row.r)}</td>
                  <td>{fmt(row.t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted mt-3">
            {t('tools.domain-price.updated')} {data ? new Date(data.updated).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US') : ''}
            {' · '}{t('tools.domain-price.source')}
          </p>
        </div>
      )}

      <style>{`
        .domain-input {
          width: 180px; padding: 8px 12px; border-radius: 10px;
          border: 1px solid var(--color-glass-border);
          background: var(--color-glass-bg); color: var(--color-foreground);
          font-size: 0.95rem; outline: none;
        }
        .domain-input:focus { border-color: var(--color-accent); }
        .domain-chip {
          padding: 4px 10px; border-radius: 999px; border: 1px solid var(--color-glass-border);
          background: transparent; color: var(--color-muted); cursor: pointer; font-size: 0.8rem;
          transition: all 0.2s;
        }
        .domain-chip:hover { color: var(--color-accent); border-color: var(--color-accent); }
        .domain-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .domain-table th, .domain-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .domain-table th { color: var(--color-muted); font-weight: 600; }
        .domain-table th.sortable { cursor: pointer; user-select: none; }
        .domain-table th.sortable:hover { color: var(--color-accent); }
        .domain-table tr:hover td { background: rgba(255,255,255,0.04); }
      `}</style>
    </div>
  );
}