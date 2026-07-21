import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import about from '../config/about.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

export default function About() {
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
      <h1 className="page-title">{t('about.title')}</h1>
      <GlassCard>
        <div className="leading-relaxed text-sm whitespace-pre-wrap">{about.bio}</div>
      </GlassCard>
      <div className="page-section">
        <h2 className="text-xl font-semibold mb-4">{t('about.timeline')}</h2>
        <div className="relative pl-6 border-l-2 border-white/10">
          {about.timeline.map(t => (
            <div key={t.year} className="mb-5 relative">
              <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-accent border-2 border-black/40" />
              <div className="text-sm font-semibold text-accent">{t.year}</div>
              <div className="text-sm">{t.event}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
