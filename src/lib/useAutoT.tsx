import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateStrings } from "@/lib/translate.functions";
import { useLang, type Lang } from "@/lib/i18n";

/**
 * Generic auto-translation for arbitrary English source strings.
 * - Reads a sync cache (in-memory + localStorage) so cached strings render on
 *   the first paint (no English flash).
 * - On cache miss, batches every string requested in the same tick into one
 *   server call (chunked at 45 to stay under the 50-string cap).
 */

const CACHE_VERSION = "v1";
const storageKey = (lang: Lang, text: string) => `auto_i18n_${CACHE_VERSION}_${lang}_${hash(text)}`;

function hash(s: string): string {
  // Small, fast, non-cryptographic. Only used as a stable storage key.
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const mem = new Map<string, string>(); // key = `${lang}|${text}` → translation
const subscribers = new Map<string, Set<() => void>>();

type Pending = { lang: Lang; texts: Set<string> };
let pending: Pending | null = null;
let flushScheduled = false;

function memKey(lang: Lang, text: string) {
  return `${lang}|${text}`;
}

function readSync(lang: Lang, text: string): string | null {
  if (lang === "en" || !text) return text;
  const k = memKey(lang, text);
  const m = mem.get(k);
  if (m !== undefined) return m;
  if (typeof window === "undefined") return null;
  try {
    const ls = localStorage.getItem(storageKey(lang, text));
    if (ls) {
      mem.set(k, ls);
      return ls;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeCache(lang: Lang, text: string, translation: string) {
  const k = memKey(lang, text);
  mem.set(k, translation);
  try {
    localStorage.setItem(storageKey(lang, text), translation);
  } catch {
    // ignore quota
  }
  subscribers.get(k)?.forEach((fn) => fn());
}

function subscribe(lang: Lang, text: string, cb: () => void) {
  const k = memKey(lang, text);
  if (!subscribers.has(k)) subscribers.set(k, new Set());
  subscribers.get(k)!.add(cb);
  return () => {
    subscribers.get(k)?.delete(cb);
  };
}

function scheduleFlush(
  translate_fn: (args: {
    data: { strings: string[]; targetLang: string };
  }) => Promise<{ ok: true; translations: string[] } | { ok: false; error: string }>,
) {
  if (flushScheduled) return;
  flushScheduled = true;
  // Small timeout so multiple components mounting in the same tick share one
  // batch. queueMicrotask would fire before all sibling effects register.
  setTimeout(async () => {
    flushScheduled = false;
    const batch = pending;
    pending = null;
    if (!batch || batch.texts.size === 0) return;
    const arr = Array.from(batch.texts);
    for (let i = 0; i < arr.length; i += 45) {
      const chunk = arr.slice(i, i + 45);
      try {
        const res = await translate_fn({ data: { strings: chunk, targetLang: batch.lang } });
        if (!res.ok) continue;
        chunk.forEach((s, idx) => {
          const out = res.translations[idx];
          if (typeof out === "string" && out.length > 0) writeCache(batch.lang, s, out);
        });
      } catch {
        // ignore — original text stays visible
      }
    }
  }, 0);
}

/**
 * Translate one string. Returns cached translation immediately if available,
 * otherwise returns the English source until the background fetch resolves.
 */
export function useAutoT(text: string): string {
  const { lang } = useLang();
  const translate_fn = useServerFn(translateStrings);
  const initial = readSync(lang, text);
  const [value, setValue] = useState<string | null>(initial);

  useEffect(() => {
    if (lang === "en" || !text) {
      setValue(text);
      return;
    }
    const cached = readSync(lang, text);
    if (cached) {
      setValue(cached);
      return;
    }
    // Queue for the next batched flush.
    if (!pending || pending.lang !== lang) pending = { lang, texts: new Set() };
    pending.texts.add(text);
    const unsub = subscribe(lang, text, () => setValue(mem.get(memKey(lang, text)) ?? null));
    scheduleFlush(translate_fn);
    return unsub;
  }, [lang, text, translate_fn]);

  if (lang === "en" || !text) return text;
  return value ?? text;
}

/**
 * Wrap a static English string so it renders translated to the active UI
 * language. Only supports plain-string children.
 */
export function T({ children }: { children: string }) {
  const s = useAutoT(children);
  return <>{s}</>;
}
