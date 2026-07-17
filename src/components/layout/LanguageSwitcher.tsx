import React from "react";
import { Languages } from "lucide-react";
import { localeNames, type Locale, useLocale } from "../../i18n/LocaleContext";

interface LanguageSwitcherProps {
  compact?: boolean;
  floating?: boolean;
}

export default function LanguageSwitcher({ compact = false, floating = false }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const locales: Locale[] = ["ko", "en", "vi"];

  return (
    <div
      data-no-translate
      className={`${floating ? "fixed right-4 top-4 z-[70] shadow-lg" : ""} inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/95 p-1 backdrop-blur-xl`}
      aria-label="Language selector"
    >
      {!compact && <Languages className="ml-2 h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />}
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          aria-pressed={locale === item}
          title={localeNames[item]}
          className={`rounded-full px-2.5 py-1.5 text-[10px] font-black transition sm:text-[11px] ${
            locale === item ? "bg-neutral-950 text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          {compact ? item.toUpperCase() : localeNames[item]}
        </button>
      ))}
    </div>
  );
}

