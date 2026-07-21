import { useState, useEffect } from 'react';
import { loadSettings, saveSettings, applySettings, type UserSettings } from '../lib/settings';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';

import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

type Lang = 'en' | 'zh';
const messages: Record<Lang, Record<string, string>> = { en, zh };

const PRESET_BGS = [
  { nameKey: 'settings.presets.mountains', url: '/images/mountains.webp' },
  { nameKey: 'settings.presets.ocean', url: '/images/ocean.webp' },
  { nameKey: 'settings.presets.dark', url: '/images/dark.webp' },
  { nameKey: 'settings.presets.forest', url: '/images/forest.webp' },
];

const ACCENTS = [
  { name: 'Purple', value: '#6c63ff' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f59e0b' },
];

function useLang() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'zh') {
      setLang(saved);
    } else {
      setLang(navigator.language.startsWith('zh') ? 'zh' : 'en');
    }
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail === 'en' || e.detail === 'zh') setLang(e.detail as Lang);
    };
    document.addEventListener('lang-changed', handler as EventListener);
    return () => document.removeEventListener('lang-changed', handler as EventListener);
  }, []);

  const t = (key: string) => messages[lang][key] || key;
  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
    document.dispatchEvent(new CustomEvent('lang-changed', { detail: l }));
  };

  return { lang, t, setLang: changeLang };
}

export default function SettingsPanel() {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());

  useEffect(() => {
    const handler = () => setOpen(v => !v);
    document.addEventListener('toggle-settings', handler);
    return () => document.removeEventListener('toggle-settings', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    saveSettings(settings);
    applySettings(settings);
  }, [settings, open]);

  const update = (partial: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(640px,92vw)] max-h-[88vh] p-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-settings-card-border)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-bold">{t('settings.title')}</DialogTitle>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{t('settings.description')}</p>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close settings" className="shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Background */}
          <div className="rounded-xl border border-[var(--color-settings-card-border)] bg-[var(--color-settings-card)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">{t('settings.background')}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              {PRESET_BGS.map(bg => (
                <Button key={bg.url} variant={settings.bgUrl === bg.url ? 'default' : 'outline'} size="sm" onClick={() => update({ bgUrl: bg.url })}>
                  {t(bg.nameKey)}
                </Button>
              ))}
            </div>
            <input
              type="text"
              placeholder={t('settings.background.custom')}
              value={settings.bgUrl}
              onChange={e => update({ bgUrl: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-settings-card-border)] bg-[rgba(0,0,0,0.2)] px-4 py-2.5 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
            />
          </div>

          {/* Accent */}
          <div className="rounded-xl border border-[var(--color-settings-card-border)] bg-[var(--color-settings-card)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">{t('settings.accent')}</h3>
            <div className="flex flex-wrap gap-4">
              {ACCENTS.map(a => (
                <button
                  key={a.value}
                  onClick={() => update({ accent: a.value })}
                  className="w-10 h-10 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]"
                  style={{
                    background: a.value,
                    borderColor: settings.accent === a.value ? '#fff' : 'transparent',
                    boxShadow: settings.accent === a.value ? `0 0 0 2px ${a.value}` : 'none'
                  }}
                  title={a.name}
                />
              ))}
            </div>
          </div>

          {/* Blur */}
          <div className="rounded-xl border border-[var(--color-settings-card-border)] bg-[var(--color-settings-card)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">
              {t('settings.glass')} <span className="text-[var(--color-accent)]">({settings.blur}px)</span>
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-muted)]">4</span>
              <input
                type="range"
                min="4"
                max="24"
                value={settings.blur}
                onChange={e => update({ blur: Number(e.target.value) })}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-[var(--color-settings-card-border)] accent-[var(--color-accent)]"
              />
              <span className="text-xs text-[var(--color-muted)]">24</span>
            </div>
          </div>

          {/* Font Size */}
          <div className="rounded-xl border border-[var(--color-settings-card-border)] bg-[var(--color-settings-card)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">{t('settings.font-size')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['sm', 'md', 'lg'] as const).map(size => (
                <Button
                  key={size}
                  variant={settings.fontSize === size ? 'default' : 'outline'}
                  onClick={() => update({ fontSize: size })}
                  className="uppercase"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="rounded-xl border border-[var(--color-settings-card-border)] bg-[var(--color-settings-card)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">{t('settings.language')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['en', 'zh'] as Lang[]).map(l => (
                <Button key={l} variant={lang === l ? 'default' : 'outline'} onClick={() => setLang(l)}>
                  {l === 'en' ? 'English' : '中文'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}