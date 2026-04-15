import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type AppLang = 'fr' | 'mg';

type I18nContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  toggleLang: () => void;
  tr: (fr: string, mg: string) => string;
};

const STORAGE_KEY = 'carhub.lang';

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>('fr');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'fr' || saved === 'mg') {
        setLangState(saved);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors.
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'mg' ? 'mg' : 'fr';
    }
  }, [lang]);

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    setLang: (next) => setLangState(next),
    toggleLang: () => setLangState((prev) => (prev === 'fr' ? 'mg' : 'fr')),
    tr: (fr, mg) => (lang === 'mg' ? mg : fr)
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}

