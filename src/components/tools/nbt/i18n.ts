// Path: src/components/tools/nbt/i18n.ts
//
// The tool's own translator.
//
// Every tool on this site keeps its own language state (see `../DomainPrice.tsx`
// and `Tools.tsx`), and the tree components sit three levels below the tool
// entry, so the active language is installed here once and read through `t()`
// everywhere below. That keeps the ported components free of a translator prop
// without introducing a context the rest of the site does not use.
//
// `t` also does the `{0}` / `{1}` substitution the tool's sentences need, which
// the flat key/value catalogue cannot express on its own.

import en from '../../../i18n/en.json';
import zh from '../../../i18n/zh.json';

export type Lang = 'en' | 'zh';

const messages: Record<Lang, Record<string, string>> = { en, zh };

/** The language the tool starts in: the saved choice, else the browser's. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'zh') {
      return saved;
    }
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = 'en';

/** Installs the active language for every `t()` call below. */
export function setLang(lang: Lang): void {
  current = lang;
}

export function t(key: string, ...args: (string | number)[]): string {
  let text = messages[current]?.[key] || key;
  args.forEach((value, index) => {
    text = text.split(`{${index}}`).join(String(value));
  });
  return text;
}
