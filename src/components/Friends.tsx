import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import friends from '../config/friends.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

export default function Friends() {
  const [lang, setLang] = useState(() => {
    try { const s = localStorage.getItem('lang'); return s === 'en' || s === 'zh' ? s : (navigator.language.startsWith('zh') ? 'zh' : 'en'); }
    catch { return 'en'; }
  });
  const t = (key: string) => messages[lang]?.[key] || key;

  useEffect(() => {
    const handler = (e: Event) => setLang((e as CustomEvent).detail);
    document.addEventListener('lang-changed', handler);
    return () => document.removeEventListener('lang-changed', handler);
  }, []);

  return (
    <>
      <h1 className="page-title">{t('friends.title')}</h1>
      <div className="page-grid">
        {friends.map(f => (
          <GlassCard key={f.url} href={f.url}>
            <div className="flex items-center gap-3">
              {f.avatar && <img src={f.avatar} alt={f.name} className="w-11 h-11 rounded-full object-cover" />}
              <div>
                <h2 className="text-base font-semibold">{f.name}</h2>
                {f.description && <p className="text-sm text-muted">{f.description}</p>}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
