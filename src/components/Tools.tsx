import { useState, useEffect } from 'react';
import tools from '../config/tools.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';
import DomainPrice from './tools/DomainPrice';

const messages: Record<string, Record<string, string>> = { en, zh };

const toolIcons: Record<string, JSX.Element> = {
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
};

const toolComponents: Record<string, () => JSX.Element> = {
  'domain-price': DomainPrice,
};

export default function Tools() {
  const [lang, setLang] = useState(() => {
    try { const s = localStorage.getItem('lang'); return s === 'en' || s === 'zh' ? s : (navigator.language.startsWith('zh') ? 'zh' : 'en'); }
    catch { return 'en'; }
  });
  const t = (key: string) => messages[lang]?.[key] || key;
  const [active, setActive] = useState(tools[0]?.id || 'domain-price');

  useEffect(() => {
    const handler = (e: Event) => setLang((e as CustomEvent).detail);
    document.addEventListener('lang-changed', handler);
    return () => document.removeEventListener('lang-changed', handler);
  }, []);

  const ActiveComp = toolComponents[active];

  return (
    <div className="tools-layout">
      <h1 className="page-title">{t('tools.title')}</h1>
      <div className="tools-body">
        <nav className="tools-nav">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tools-nav-item${active === tool.id ? ' active' : ''}`}
              onClick={() => setActive(tool.id)}
            >
              <span className="tools-nav-icon">{toolIcons[tool.icon]}</span>
              <span>{t(`tools.${tool.id}`)}</span>
            </button>
          ))}
        </nav>
        <div className="tools-content">
          {ActiveComp ? <ActiveComp /> : <p className="text-muted">{t('tools.not-found')}</p>}
        </div>
      </div>
      <style>{`
        .tools-layout { max-width: 100%; }
        .tools-body { display: flex; gap: 1.5rem; min-height: 400px; }
        .tools-nav { display: flex; flex-direction: column; gap: 4px; min-width: 140px; flex-shrink: 0; }
        .tools-nav-item {
          display: flex; align-items: center; gap: 8px; padding: 10px 14px;
          border-radius: 10px; border: 0; background: transparent;
          color: var(--color-muted); cursor: pointer; font-size: 0.9rem;
          transition: all 0.2s; text-align: left; width: 100%;
        }
        .tools-nav-item:hover { color: var(--color-foreground); background: rgba(255,255,255,0.06); }
        .tools-nav-item.active { color: var(--color-accent); background: var(--color-accent)/0.1; }
        .tools-nav-icon { width: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tools-content { flex: 1; min-width: 0; }
        @media (max-width: 600px) {
          .tools-body { flex-direction: column; }
          .tools-nav { flex-direction: row; overflow-x: auto; min-width: 0; gap: 0; }
          .tools-nav-item { white-space: nowrap; width: auto; }
        }
      `}</style>
    </div>
  );
}