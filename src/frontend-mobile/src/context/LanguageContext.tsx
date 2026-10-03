import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocales } from 'expo-localization';
import { Language, TranslationParams, translateText } from '../i18n/translations';
import { getStoredLanguage, setStoredLanguage } from '../services/storage';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'EN',
  setLanguage: async () => undefined,
  t: (key) => key,
});

function getDefaultLanguage(): Language {
  const locale = getLocales()[0];
  const languageCode = locale?.languageCode?.toLowerCase();

  if (languageCode === 'zh') {
    return 'CN';
  }

  if (languageCode === 'tr') {
    return 'TR';
  }

  return 'EN';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getDefaultLanguage());

  useEffect(() => {
    void (async () => {
      const storedLanguage = await getStoredLanguage();
      if (storedLanguage === 'CN' || storedLanguage === 'EN' || storedLanguage === 'TR') {
        setLanguageState(storedLanguage);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    await setStoredLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translateText(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
