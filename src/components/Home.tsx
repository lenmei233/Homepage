import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import site from '../config/site.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

export default function Home() {
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
    <div className="flex flex-col items-center justify-center min-h-[76vh] text-center gap-5">
      {site.avatar && (
        <img src={site.avatar} alt={site.author} className="w-28 h-28 rounded-full object-cover border-2 border-white/15 shadow-lg" />
      )}
      <div className="space-y-2">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-[-0.05em] bg-gradient-to-r from-foreground via-accent to-purple-400 bg-clip-text text-transparent">
          {site.author}
        </h1>
        <p className="text-lg text-muted max-w-md mx-auto">{t('home.subtitle')}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {site.nav.filter(n => n.path !== '/').map(item =>
          item.external ? (
            <a key={item.path} href={item.path} className="gc px-6 py-3.5 text-sm font-medium no-underline hover:-translate-y-1 transition-all duration-300" target="_blank" rel="noopener noreferrer">
              {t(`nav.${item.label.toLowerCase()}`)}
            </a>
          ) : (
            <Link key={item.path} to={item.path} className="gc px-6 py-3.5 text-sm font-medium no-underline hover:-translate-y-1 transition-all duration-300">
              {t(`nav.${item.path.replace('/', '')}`)}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
