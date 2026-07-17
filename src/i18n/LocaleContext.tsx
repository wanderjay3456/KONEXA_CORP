import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "ko" | "en" | "vi";

const SUPPORTED_LOCALES: Locale[] = ["ko", "en", "vi"];

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  const saved = window.localStorage.getItem("konexa_locale") as Locale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  const browserLocale = window.navigator.language.toLowerCase();
  if (browserLocale.startsWith("vi")) return "vi";
  if (browserLocale.startsWith("ko")) return "ko";
  return "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    window.localStorage.setItem("konexa_locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}

export const localeNames: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  vi: "Tiếng Việt",
};

