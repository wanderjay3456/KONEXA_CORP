import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
export type Locale = "ko" | "en";
const SUPPORTED_LOCALES: Locale[] = ["ko", "en"];
interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}
const LocaleContext = createContext<LocaleContextValue | null>(null);
function detectLocale(): Locale {
    if (typeof window === "undefined")
        return "ko";
    try {
        const saved = window.localStorage.getItem("konexa_locale") as Locale | null;
        if (String(saved) === "vi") return "en";
        if (saved && SUPPORTED_LOCALES.includes(saved))
            return saved;
    }
    catch {
        // Private browsers may block storage. Language selection must still work.
    }
    const browserLocale = window.navigator.language.toLowerCase();
    if (browserLocale.startsWith("ko"))
        return "ko";
    return "en";
}
export function LocaleProvider({ children }: {
    children: React.ReactNode;
}) {
    const [locale, setLocale] = useState<Locale>(detectLocale);
    useEffect(() => {
        try {
            window.localStorage.setItem("konexa_locale", locale);
        }
        catch { /* Session-only preference. */ }
        document.documentElement.lang = locale;
    }, [locale]);
    const value = useMemo(() => ({ locale, setLocale }), [locale]);
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context)
        throw new Error("useLocale must be used within LocaleProvider");
    return context;
}
export const localeNames: Record<Locale, string> = {
    ko: "한국어",
    en: "English"
};
