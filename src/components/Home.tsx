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

  const links = site.nav.filter(n => n.path !== '/');

  return (
    <div className="home-shell">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-kicker"><span className="status-dot" /> {t('home.kicker') || 'AVAILABLE FOR SELECT WORK'}</div>
        <div className="home-hero-grid">
          <div>
            <h1 id="home-title">{site.author}</h1>
            <p className="home-subtitle">{t('home.subtitle')}</p>
          </div>
          {site.avatar && <img src={site.avatar} alt={site.author} className="home-avatar" />}
        </div>
      </section>
      <section className="home-index" aria-label="Site index">
        <div className="index-label">INDEX <span>({String(links.length).padStart(2, '0')})</span></div>
        <div className="index-list">
          {links.map((item, index) => {
            const label = item.external ? t(`nav.${item.label.toLowerCase()}`) : t(`nav.${item.path.replace('/', '')}`);
            const content = <><span className="index-number">0{index + 1}</span><span>{label}</span><span className="index-arrow">↗</span></>;
            return item.external ? <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer">{content}</a> : <Link key={item.path} to={item.path}>{content}</Link>;
          })}
        </div>
      </section>
      <div className="home-footer-line"><span>PERSONAL SYSTEM / 2024—25</span><span>SCROLL TO EXPLORE ↓</span></div>
    </div>
  );
}
