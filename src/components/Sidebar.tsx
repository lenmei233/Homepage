import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import site from '../config/site.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

function navI18nKey(path: string, label: string): string {
  if (path === '/') return 'nav.home';
  if (path.startsWith('http')) return `nav.${label.toLowerCase()}`;
  return `nav.${path.replace('/', '')}`;
}

const icons: Record<string, JSX.Element> = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  code: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>,
  cpu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/></svg>,
  'book-open': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>,
  link: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(() => {
    try { const s = localStorage.getItem('lang'); return s === 'en' || s === 'zh' ? s : (navigator.language.startsWith('zh') ? 'zh' : 'en'); }
    catch { return 'en'; }
  });
  const t = (key: string) => messages[lang]?.[key] || key;

  useEffect(() => {
    const onToggle = () => setOpen(v => !v);
    const onLang = (e: Event) => setLang((e as CustomEvent).detail);
    document.addEventListener('toggle-sidebar', onToggle);
    document.addEventListener('lang-changed', onLang);
    return () => { document.removeEventListener('toggle-sidebar', onToggle); document.removeEventListener('lang-changed', onLang); };
  }, []);

  const close = () => { setExpanded(false); setOpen(false); };

  return (
    <aside id="sidebar" className={`sidebar${open ? ' open' : ''}${expanded ? ' expanded' : ''}`}>
      <button className="sidebar-item sidebar-button sidebar-expand" onClick={() => setExpanded(v => !v)} aria-label="Expand sidebar">
        <span className="sidebar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </span>
        <span className="sidebar-label">{t('sidebar.menu')}</span>
      </button>
      <nav className="sidebar-nav">
        {site.nav.map(item =>
          item.external ? (
            <a key={item.path} href={item.path} className="sidebar-item" target="_blank" rel="noopener noreferrer" onClick={close}>
              <span className="sidebar-icon">{icons[item.icon]}</span>
              <span className="sidebar-label">{t(navI18nKey(item.path, item.label))}</span>
            </a>
          ) : (
            <NavLink key={item.path} to={item.path} className="sidebar-item" onClick={close}>
              <span className="sidebar-icon">{icons[item.icon]}</span>
              <span className="sidebar-label">{t(navI18nKey(item.path, item.label))}</span>
            </NavLink>
          )
        )}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/settings" className="sidebar-item" onClick={close}>
          <span className="sidebar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </span>
          <span className="sidebar-label">{t('settings.title')}</span>
        </NavLink>
      </div>
    </aside>
  );
}
