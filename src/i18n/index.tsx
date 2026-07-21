import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import en from './en.json';
import zh from './zh.json';

export type Lang = 'en' | 'zh';
const messages: Record<Lang, Record<string, string>> = { en, zh };

interface I18nContextType {
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
}

const defaultT = (key: string) => messages.en[key] || key;

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  t: defaultT,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'zh') {
      setLang(saved);
    } else {
      const browser = navigator.language.startsWith('zh') ? 'zh' : 'en';
      setLang(browser);
    }
  }, []);

  const t = (key: string) => messages[lang][key] || key;

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
  };

  return (
    <I18nContext.Provider value={{ lang, t, setLang: changeLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
