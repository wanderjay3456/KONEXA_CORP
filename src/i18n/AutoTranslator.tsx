import { useEffect, useRef } from "react";
import { useLocale, type Locale } from "./LocaleContext";
import { canApplyUiTranslation, preservesTranslationNumbers } from './translationSafety';
import { LOCALIZATION_BATCH_SIZE, LOCALIZATION_CLIENT_TIMEOUT_MS, LOCALIZATION_RETRY_DELAY_MS, needsUiTranslation } from './localizationPolicy';

type TranslationCache = Record<string, string>;
type TextState = { original: string; lastApplied: string };
type AttrState = { original: string; lastApplied: string };
type TranslationContext = "heading" | "body" | "button" | "navigation" | "label" | "placeholder" | "status" | "other";
type TranslationTarget =
  | { kind: "text"; node: Text; source: string; context: TranslationContext }
  | { kind: "attribute"; node: HTMLElement; attribute: string; source: string; context: TranslationContext };

const CACHE_VERSION = "v5";
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
    if (!state || !canApplyUiTranslation({ ...state, source: target.source, translated,
      connected: target.node.isConnected, excluded: isExcluded(target.node.parentElement), current: target.node.textContent || '' })) return;
    if (target.node.textContent === translated) return;
    target.node.textContent = translated;
    textStates.set(target.node, { ...state, lastApplied: translated });
    return;
  }
  const states = attributeStates.get(target.node);
  const state = states?.get(target.attribute);
  if (!state || !canApplyUiTranslation({ ...state, source: target.source, translated,
    connected: target.node.isConnected, excluded: isExcluded(target.node), current: target.node.getAttribute(target.attribute) || '' })) return;
  if (target.node.getAttribute(target.attribute) === translated) return;
  target.node.setAttribute(target.attribute, translated);
  states!.set(target.attribute, { ...state, lastApplied: translated });
}

export default function AutoTranslator() {
  const { locale } = useLocale();
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
    let timer: number | undefined;
    let cancelled = false;
    let running = false;
    let rerun = false;
    let retryAfter = 0;
    const controller = new AbortController();

    const translatePage = async () => {
      if (running) {
        rerun = true;
        return;
      }
      running = true;
      try {
        const activeLocale = localeRef.current;
        const targets = collectTargets();
        const cache = readCache(activeLocale);
        const byKey = new Map<string, TranslationTarget[]>();
        for (const target of targets) {
          if (!needsUiTranslation(target.source, activeLocale)) {
            applyTranslation(target, target.source);
            continue;
          }
          const key = targetKey(target);
          byKey.set(key, [...(byKey.get(key) || []), target]);
        }

        for (const [key, keyTargets] of byKey) {
          if (cache[key]) keyTargets.forEach((target) => applyTranslation(target, cache[key]));
        }

        const missing = Array.from(byKey.keys()).filter((key) => !cache[key]);
        for (let offset = 0; offset < missing.length && !cancelled; offset += LOCALIZATION_BATCH_SIZE) {
          const batchKeys = missing.slice(offset, offset + LOCALIZATION_BATCH_SIZE);
          const batchTargets = batchKeys.map((key) => byKey.get(key)![0]);
          const batch = batchTargets.map((target) => target.source.replace(/\s+/g, " ").trim());
          const contexts = batchTargets.map((target) => target.context);
          const response = await fetch("/api/localization/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: activeLocale, texts: batch, contexts }),
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(LOCALIZATION_CLIENT_TIMEOUT_MS)]),
          });
          if (!response.ok) { retryAfter=Date.now()+LOCALIZATION_RETRY_DELAY_MS; break; }
          const payload = await response.json() as { translations?: string[] };
          if (cancelled || localeRef.current !== activeLocale) break;
          batchKeys.forEach((key, index) => {
            const translated = payload.translations?.[index]?.trim();
            if (!translated || !preservesTranslationNumbers(batchTargets[index].source, translated)) return;
            cache[key] = translated;
            byKey.get(key)?.forEach((target) => applyTranslation(target, translated));
          });
          writeCache(activeLocale, cache);
        }
      } catch (error) {
        if (!cancelled) {
          retryAfter=Date.now()+LOCALIZATION_RETRY_DELAY_MS;
          console.warn("[KONEXA] UI localization fallback unavailable:", error);
        }
      } finally {
        running = false;
        if (rerun && !cancelled) {
          rerun = false;
          timer=window.setTimeout(translatePage, Math.max(80,retryAfter-Date.now()));
        }
      }
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(translatePage, Math.max(220,retryAfter-Date.now()));
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();
    return () => {
      cancelled = true;
      controller.abort();
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [locale]);

  return null;
}

