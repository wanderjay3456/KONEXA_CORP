import { useEffect, useRef, useState } from "react";
import { useLocale, type Locale } from "./LocaleContext";

type TranslationCache = Record<string, string>;
type TextState = { original: string; lastApplied: string };
type AttrState = { original: string; lastApplied: string };
type TranslationTarget =
  | { kind: "text"; node: Text; source: string }
  | { kind: "attribute"; node: HTMLElement; attribute: string; source: string };

const CACHE_VERSION = "v2";
const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label"];
const textStates = new WeakMap<Text, TextState>();
const attributeStates = new WeakMap<HTMLElement, Map<string, AttrState>>();

function cacheKey(locale: Locale) {
  return `konexa_ui_translations_${CACHE_VERSION}_${locale}`;
}

function readCache(locale: Locale): TranslationCache {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(locale)) || "{}") as TranslationCache;
  } catch {
    return {};
  }
}

function writeCache(locale: Locale, cache: TranslationCache) {
  try {
    const entries = Object.entries(cache).slice(-1800);
    localStorage.setItem(cacheKey(locale), JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Translation is an enhancement; storage limits must never block the product.
  }
}

function shouldTranslate(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > 420) return false;
  if (/^(KONEXA|KO|EN|VI)$/i.test(text)) return false;
  if (/^[\d\s.,:%+\-–—/()#]+$/.test(text)) return false;
  if (/^(https?:\/\/|www\.|[^\s]+@[^\s]+\.[^\s]+$)/i.test(text)) return false;
  return /[A-Za-z가-힣À-ỹ]/.test(text);
}

function isExcluded(element: Element | null) {
  return Boolean(element?.closest("[data-no-translate], script, style, code, pre, textarea, [contenteditable='true']"));
}

function collectTargets(): TranslationTarget[] {
  const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-auto-translate]"));
  const targets: TranslationTarget[] = [];

  for (const root of roots) {
    if (isExcluded(root)) continue;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const node = current as Text;
      const parent = node.parentElement;
      if (!isExcluded(parent)) {
        const value = node.textContent || "";
        const previous = textStates.get(node);
        const source = previous && value === previous.lastApplied ? previous.original : value;
        if (shouldTranslate(source)) {
          textStates.set(node, { original: source, lastApplied: previous?.lastApplied || value });
          targets.push({ kind: "text", node, source });
        }
      }
      current = walker.nextNode();
    }

    for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      if (isExcluded(element)) continue;
      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        const states = attributeStates.get(element) || new Map<string, AttrState>();
        const previous = states.get(attribute);
        const source = previous && value === previous.lastApplied ? previous.original : value;
        if (!shouldTranslate(source)) continue;
        states.set(attribute, { original: source, lastApplied: previous?.lastApplied || value });
        attributeStates.set(element, states);
        targets.push({ kind: "attribute", node: element, attribute, source });
      }
    }
  }
  return targets;
}

function applyTranslation(target: TranslationTarget, translated: string) {
  if (!translated) return;
  if (target.kind === "text") {
    const state = textStates.get(target.node);
    if (!state) return;
    target.node.textContent = translated;
    textStates.set(target.node, { ...state, lastApplied: translated });
    return;
  }
  const states = attributeStates.get(target.node);
  const state = states?.get(target.attribute);
  if (!state) return;
  target.node.setAttribute(target.attribute, translated);
  states!.set(target.attribute, { ...state, lastApplied: translated });
}

export default function AutoTranslator() {
  const { locale } = useLocale();
  const localeRef = useRef(locale);
  const runningRef = useRef(false);
  const rerunRef = useRef(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    localeRef.current = locale;
    let timer: number | undefined;
    let cancelled = false;

    const translatePage = async () => {
      if (runningRef.current) {
        rerunRef.current = true;
        return;
      }
      runningRef.current = true;
      setTranslating(true);
      try {
        const activeLocale = localeRef.current;
        const targets = collectTargets();
        const cache = readCache(activeLocale);
        const bySource = new Map<string, TranslationTarget[]>();
        for (const target of targets) {
          const source = target.source.replace(/\s+/g, " ").trim();
          bySource.set(source, [...(bySource.get(source) || []), target]);
        }

        for (const [source, sourceTargets] of bySource) {
          if (cache[source]) sourceTargets.forEach((target) => applyTranslation(target, cache[source]));
        }

        const missing = Array.from(bySource.keys()).filter((source) => !cache[source]);
        for (let offset = 0; offset < missing.length && !cancelled; offset += 55) {
          const batch = missing.slice(offset, offset + 55);
          const response = await fetch("/api/localization/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: activeLocale, texts: batch }),
          });
          if (!response.ok) break;
          const payload = await response.json() as { translations?: string[] };
          if (localeRef.current !== activeLocale) break;
          batch.forEach((source, index) => {
            const translated = payload.translations?.[index]?.trim();
            if (!translated) return;
            cache[source] = translated;
            bySource.get(source)?.forEach((target) => applyTranslation(target, translated));
          });
          writeCache(activeLocale, cache);
        }
      } catch (error) {
        console.warn("[KONEXA] UI localization fallback unavailable:", error);
      } finally {
        runningRef.current = false;
        setTranslating(false);
        if (rerunRef.current && !cancelled) {
          rerunRef.current = false;
          window.setTimeout(translatePage, 80);
        }
      }
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(translatePage, 220);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();
    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [locale]);

  return translating ? (
    <div data-no-translate className="fixed bottom-20 right-4 z-[80] rounded-full border border-neutral-200 bg-white/95 px-3 py-2 text-[10px] font-bold text-neutral-600 shadow-lg backdrop-blur md:bottom-4" role="status">
      {locale === "ko" ? "번역 중…" : locale === "vi" ? "Đang dịch…" : "Translating…"}
    </div>
  ) : null;
}

