import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import techStack from '../config/tech-stack.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

export default function TechStack() {
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
      <h1 className="page-title">{t('tech-stack.title')}</h1>
      <div className="flex flex-col gap-6">
        {techStack.categories.map(cat => (
          <div key={cat.name}>
            <h2 className="text-lg font-semibold mb-3 text-muted">{cat.name}</h2>
            <div className="flex flex-wrap gap-3">
              {cat.items.map(item => (
                <GlassCard key={item.name} class="!p-3">
                  <div className="flex items-center gap-2">
                    {item.icon && <img src={`https://cdn.simple-icons.org/${item.icon}`} alt={item.name} className="w-5 h-5" loading="lazy" />}
                    <span className="text-sm">{item.name}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
