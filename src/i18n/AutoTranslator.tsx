import { useEffect, useRef } from "react";
import { useLocale, type Locale } from "./LocaleContext";

type TranslationCache = Record<string, string>;
type TextState = { original: string; lastApplied: string };
type AttrState = { original: string; lastApplied: string };
type TranslationContext = "heading" | "body" | "button" | "navigation" | "label" | "placeholder" | "status" | "other";
type TranslationTarget =
  | { kind: "text"; node: Text; source: string; context: TranslationContext }
  | { kind: "attribute"; node: HTMLElement; attribute: string; source: string; context: TranslationContext };

const CACHE_VERSION = "v3";
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

function textContext(element: HTMLElement | null): TranslationContext {
  if (!element) return "other";
  if (element.closest("h1, h2, h3, h4, h5, h6")) return "heading";
  if (element.closest("nav")) return "navigation";
  if (element.closest("button, [role='button']")) return "button";
  if (element.closest("label")) return "label";
  if (element.closest("[role='status'], [aria-live]")) return "status";
  if (element.closest("p, li, blockquote")) return "body";
  return "other";
}

function targetKey(target: TranslationTarget) {
  return `${target.context}\u0000${target.source.replace(/\s+/g, " ").trim()}`;
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
          targets.push({ kind: "text", node, source, context: textContext(parent) });
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
        targets.push({
          kind: "attribute",
          node: element,
          attribute,
          source,
          context: attribute === "placeholder" ? "placeholder" : "label",
        });
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
      try {
        const activeLocale = localeRef.current;
        const targets = collectTargets();
        const cache = readCache(activeLocale);
        const byKey = new Map<string, TranslationTarget[]>();
        for (const target of targets) {
          const key = targetKey(target);
          byKey.set(key, [...(byKey.get(key) || []), target]);
        }

        for (const [key, keyTargets] of byKey) {
          if (cache[key]) keyTargets.forEach((target) => applyTranslation(target, cache[key]));
        }

        const missing = Array.from(byKey.keys()).filter((key) => !cache[key]);
        for (let offset = 0; offset < missing.length && !cancelled; offset += 55) {
          const batchKeys = missing.slice(offset, offset + 55);
          const batchTargets = batchKeys.map((key) => byKey.get(key)![0]);
          const batch = batchTargets.map((target) => target.source.replace(/\s+/g, " ").trim());
          const contexts = batchTargets.map((target) => target.context);
          const response = await fetch("/api/localization/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: activeLocale, texts: batch, contexts }),
          });
          if (!response.ok) break;
          const payload = await response.json() as { translations?: string[] };
          if (localeRef.current !== activeLocale) break;
          batchKeys.forEach((key, index) => {
            const translated = payload.translations?.[index]?.trim();
            if (!translated) return;
            cache[key] = translated;
            byKey.get(key)?.forEach((target) => applyTranslation(target, translated));
          });
          writeCache(activeLocale, cache);
        }
      } catch (error) {
        console.warn("[KONEXA] UI localization fallback unavailable:", error);
      } finally {
        runningRef.current = false;
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

  return null;
}

