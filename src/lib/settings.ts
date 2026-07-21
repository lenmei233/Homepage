export interface UserSettings {
  bgUrl: string;
  blur: number;
  accent: string;
  fontSize: 'sm' | 'md' | 'lg';
}

const DEFAULTS: UserSettings = {
  bgUrl: '/images/mountains.webp',
  blur: 4,
  accent: '#6c63ff',
  fontSize: 'md',
};

const KEY = 'personal-homepage-settings';

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function applySettings(settings: UserSettings): void {
  const root = document.documentElement;
  const last = root.dataset;

  if (last.asBgUrl !== settings.bgUrl) {
    root.style.setProperty('--bg-image', `url('${settings.bgUrl}')`);
    last.asBgUrl = settings.bgUrl;
  }
  if (last.asBlur !== String(settings.blur)) {
    root.style.setProperty('--glass-blur', `${settings.blur}px`);
    last.asBlur = String(settings.blur);
  }
  if (last.asAccent !== settings.accent) {
    root.style.setProperty('--accent', settings.accent);
    root.style.setProperty('--color-accent', settings.accent);
    last.asAccent = settings.accent;
  }

  const sizes = { sm: '14px', md: '16px', lg: '18px' };
  const newFontSize = sizes[settings.fontSize];
  if (last.asFontSize !== newFontSize) {
    root.style.setProperty('--font-size', newFontSize);
    root.style.fontSize = newFontSize;
    last.asFontSize = newFontSize;
  }
}
