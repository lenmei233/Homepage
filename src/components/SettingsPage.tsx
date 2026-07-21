import { useState, useEffect } from 'react';
import { loadSettings, saveSettings, applySettings } from '../lib/settings';
import GlassCard from '../components/GlassCard';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const messages: Record<string, Record<string, string>> = { en, zh };

const ACCENTS = [
  { color: '#6c63ff', title: 'Purple' },
  { color: '#3b82f6', title: 'Blue' },
  { color: '#10b981', title: 'Green' },
  { color: '#ec4899', title: 'Pink' },
  { color: '#f59e0b', title: 'Orange' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [lang, setLangState] = useState<'en' | 'zh'>(() => {
    try { const s = localStorage.getItem('lang'); return s === 'en' || s === 'zh' ? s : (navigator.language.startsWith('zh') ? 'zh' : 'en'); }
    catch { return 'en'; }
  });

  const t = (key: string) => messages[lang]?.[key] || key;

  const update = (partial: Partial<typeof settings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
    applySettings(next);
  };

  const changeLang = (l: 'en' | 'zh') => {
    setLangState(l);
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
    document.dispatchEvent(new CustomEvent('lang-changed', { detail: l }));
  };

  return (
    <div className="max-w-5xl">
      <h1 className="page-title">{t('settings.title')}</h1>
      <p className="page-description">{t('settings.description')}</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard class="lg:col-span-2">
          <h3 className="section-card-title">{t('settings.background')}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
            {[
              { bg: '/images/mountains.webp', key: 'settings.presets.mountains' },
              { bg: '/images/ocean.webp', key: 'settings.presets.ocean' },
              { bg: '/images/dark.webp', key: 'settings.presets.dark' },
              { bg: '/images/forest.webp', key: 'settings.presets.forest' },
            ].map(p => (
              <button key={p.bg} className={`option-btn${settings.bgUrl === p.bg ? ' active' : ''}`} onClick={() => update({ bgUrl: p.bg })}>{t(p.key)}</button>
            ))}
          </div>
          <input type="text" className="settings-input" value={settings.bgUrl} onChange={e => update({ bgUrl: e.target.value })} placeholder={t('settings.background.custom')} />
        </GlassCard>

        <GlassCard>
          <h3 className="section-card-title">{t('settings.accent')}</h3>
          <div className="flex flex-wrap gap-4">
            {ACCENTS.map(a => (
              <button key={a.color} className={`accent-btn${settings.accent === a.color ? ' active' : ''}`} style={{ background: a.color }} onClick={() => update({ accent: a.color })} title={a.title} />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="section-card-title">
            {t('settings.glass')}
            <span className="text-[var(--color-accent)]"> ({settings.blur}px)</span>
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-muted)]">4</span>
            <input type="range" min="4" max="24" value={settings.blur} onChange={e => update({ blur: Number(e.target.value) })} className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-[var(--color-settings-card-border)] accent-[var(--color-accent)]" />
            <span className="text-xs text-[var(--color-muted)]">24</span>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="section-card-title">{t('settings.font-size')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['sm', 'md', 'lg'] as const).map(size => (
              <button key={size} className={`option-btn uppercase${settings.fontSize === size ? ' active' : ''}`} onClick={() => update({ fontSize: size })}>{size}</button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="section-card-title">{t('settings.language')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {(['en', 'zh'] as const).map(l => (
              <button key={l} className={`option-btn${lang === l ? ' active' : ''}`} onClick={() => changeLang(l)}>{l === 'en' ? 'English' : '中文'}</button>
            ))}
          </div>
        </GlassCard>
      </div>

      <style>{`
        .settings-input {
          width: 100%; padding: 10px 14px; border-radius: 8px;
          border: 1px solid var(--color-settings-card-border);
          background: rgba(0,0,0,0.2); color: var(--color-foreground);
          font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        .settings-input:focus { border-color: var(--color-accent); }
        .settings-input::placeholder { color: var(--color-muted); }
        .option-btn {
          padding: 10px 12px; border-radius: 8px;
          border: 1px solid var(--color-settings-card-border);
          background: transparent; color: var(--color-foreground);
          font-size: 13px; cursor: pointer; transition: all 0.2s;
        }
        .option-btn:hover { background: rgba(255,255,255,0.05); }
        .option-btn.active { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-accent-foreground); }
        .accent-btn {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid transparent; cursor: pointer; transition: all 0.2s;
        }
        .accent-btn:hover { transform: scale(1.1); }
        .accent-btn.active { border-color: #fff; box-shadow: 0 0 0 2px var(--color-accent); }
      `}</style>
    </div>
  );
}
