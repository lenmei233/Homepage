import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import techStack from '../config/tech-stack.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';
import * as simpleIcons from 'simple-icons';

const messages: Record<string, Record<string, string>> = { en, zh };

// slug -> simple-icons constant name 映射
const slugToConstant: Record<string, string> = {
  react: 'siReact',
  typescript: 'siTypescript',
  astro: 'siAstro',
  nodejs: 'siNodedotjs',
  python: 'siPython',
  git: 'siGit',
  docker: 'siDocker',
  avaloniaui: 'siAvaloniaui',
  tauri: 'siTauri',
  dotnet: 'siDotnet',
  html5: 'siHtml5',
  javascript: 'siJavascript',
  css: 'siCss',
  tailwindcss: 'siTailwindcss',
  simpleicons: 'siSimpleicons',
  rider: 'siRider',
  androidstudio: 'siAndroidstudio',
  obsstudio: 'siObsstudio',
  vercel: 'siVercel',
  cloudflare: 'siCloudflare',
  cloudflareworkers: 'siCloudflareworkers',
  cloudflarepages: 'siCloudflarepages',
  npm: 'siNpm',
  pnpm: 'siPnpm',
  opencode: 'siOpencode',
  claudecode: 'siClaudecode',
};

function getIcon(slug: string) {
  const constant = slugToConstant[slug];
  if (!constant) return null;
  const icon = (simpleIcons as Record<string, { path: string; title: string }>)[constant];
  return icon || null;
}

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
              {cat.items.map(item => {
                const icon = item.icon ? getIcon(item.icon) : null;
                return (
                  <GlassCard key={item.name} class="!p-3">
                    <div className="flex items-center gap-2">
                      {icon && (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                          <path d={icon.path} />
                        </svg>
                      )}
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
