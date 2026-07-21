import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import projects from '../config/projects.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

export default function Projects() {
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
      <h1 className="page-title">{t('projects.title')}</h1>
      <div className="page-grid">
        {projects.map(p => (
          <GlassCard key={p.url} href={p.url}>
            <div className="flex items-center gap-3">
              {p.image && <img src={p.image} alt={p.title} className="w-11 h-11 object-cover" />}
              <div>
                <h2 className="text-base font-semibold">{p.title}</h2>
                {p.description && <p className="text-sm text-muted">{p.description}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-6">
              {p.tags.map(tag => (
                <span key={tag} className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-accent/15 text-accent">{tag}</span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
