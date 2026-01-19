import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import yaml from 'js-yaml';

type Dictionary = Record<string, unknown>;

type I18nState = {
  t: (key: string) => string;
  loading: boolean;
};

const I18nContext = createContext<I18nState | undefined>(undefined);

function getValue(dictionary: Dictionary, key: string) {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Dictionary)[part];
    }
    return undefined;
  }, dictionary);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [dictionary, setDictionary] = useState<Dictionary>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/locales/es.yaml')
      .then((response) => response.text())
      .then((content) => yaml.load(content) as Dictionary)
      .then((data) => {
        if (!mounted) return;
        setDictionary(data || {});
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<I18nState>(() => {
    return {
      loading,
      t: (key: string) => {
        const result = getValue(dictionary, key);
        return typeof result === 'string' ? result : key;
      }
    };
  }, [dictionary, loading]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('I18nContext not found');
  }
  return context;
}
