import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateStrings } from "@/lib/translate.functions";
import { useLang, type Lang } from "@/lib/i18n";
import type { Task } from "@/data/tasks";

type TranslatedFields = Pick<
  Task,
  "title" | "subtitle" | "prompt" | "bullets" | "wordCount" | "group"
> & {
  badge?: string;
};

const CACHE_VERSION = "v2";
const cacheKey = (taskId: string, lang: Lang) => `task_i18n_${CACHE_VERSION}_${lang}_${taskId}`;
const labelsKey = (tag: string, lang: Lang) => `labels_i18n_${CACHE_VERSION}_${lang}_${tag}`;

// In-memory cache so render can read synchronously (no English flash).
const memTask = new Map<string, TranslatedFields>();
const memLabels = new Map<string, string[]>();
const inflightWorkbook = new Set<string>();

function readCache(taskId: string, lang: Lang): TranslatedFields | null {
  const k = `${lang}|${taskId}`;
  const mem = memTask.get(k);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(taskId, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TranslatedFields;
    memTask.set(k, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(taskId: string, lang: Lang, fields: TranslatedFields) {
  memTask.set(`${lang}|${taskId}`, fields);
  try {
    localStorage.setItem(cacheKey(taskId, lang), JSON.stringify(fields));
  } catch {
    // ignore quota
  }
}

function readLabelsCache(tag: string, lang: Lang, expectedLen: number): string[] | null {
  const k = `${lang}|${tag}`;
  const mem = memLabels.get(k);
  if (mem && mem.length === expectedLen) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(labelsKey(tag, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed) || parsed.length !== expectedLen) return null;
    memLabels.set(k, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeLabelsCache(tag: string, lang: Lang, values: string[]) {
  memLabels.set(`${lang}|${tag}`, values);
  try {
    localStorage.setItem(labelsKey(tag, lang), JSON.stringify(values));
  } catch {
    // ignore
  }
}

function taskFields(task: Task): string[] {
  return [
    task.title,
    task.subtitle,
    task.prompt,
    task.wordCount,
    task.group,
    task.badge ?? "",
    ...task.bullets,
  ];
}

function unpackTask(task: Task, t: string[]): TranslatedFields {
  return {
    title: t[0] ?? task.title,
    subtitle: t[1] ?? task.subtitle,
    prompt: t[2] ?? task.prompt,
    wordCount: t[3] ?? task.wordCount,
    group: t[4] ?? task.group,
    badge: task.badge ? (t[5] ?? task.badge) : undefined,
    bullets: t.slice(6, 6 + task.bullets.length),
  };
}

/**
 * Bulk translate every uncached task for a workbook in one server call and
 * populate the cache. Idempotent; safe to call repeatedly.
 */
export async function prewarmWorkbookTranslations(
  tasks: Task[],
  lang: Lang,
  translate_fn: (args: {
    data: { strings: string[]; targetLang: string };
  }) => Promise<{ ok: true; translations: string[] } | { ok: false; error: string }>,
): Promise<void> {
  if (lang === "en") return;
  const uncached = tasks.filter((t) => !readCache(t.id, lang));
  if (uncached.length === 0) return;

  // Chunk to stay within server-side 50-string cap.
  const chunks: Task[][] = [];
  let current: Task[] = [];
  let currentLen = 0;
  for (const t of uncached) {
    const fields = taskFields(t);
    if (currentLen + fields.length > 45 && current.length > 0) {
      chunks.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(t);
    currentLen += fields.length;
  }
  if (current.length) chunks.push(current);

  await Promise.all(
    chunks.map(async (chunk) => {
      const lens = chunk.map((t) => taskFields(t).length);
      const strings = chunk.flatMap(taskFields);
      const key = `${lang}|${chunk.map((t) => t.id).join(",")}`;
      if (inflightWorkbook.has(key)) return;
      inflightWorkbook.add(key);
      try {
        const res = await translate_fn({ data: { strings, targetLang: lang } });
        if (!res.ok) return;
        let offset = 0;
        chunk.forEach((task, i) => {
          const slice = res.translations.slice(offset, offset + lens[i]);
          offset += lens[i];
          writeCache(task.id, lang, unpackTask(task, slice));
        });
      } finally {
        inflightWorkbook.delete(key);
      }
    }),
  );
}

export function useTranslatedTask(task: Task): TranslatedFields & { isTranslating: boolean } {
  const { lang } = useLang();
  const translate_fn = useServerFn(translateStrings);
  // Read cache synchronously during render so cached translations render
  // in the target language on the first paint (no English flash).
  const cached = lang === "en" ? null : readCache(task.id, lang);
  const [override, setOverride] = useState<TranslatedFields | null>(cached);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lang === "en") {
      setOverride(null);
      return;
    }
    const c = readCache(task.id, lang);
    if (c) {
      setOverride(c);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void translate_fn({ data: { strings: taskFields(task), targetLang: lang } })
      .then((res) => {
        if (cancelled || !res.ok) return;
        const out = unpackTask(task, res.translations);
        writeCache(task.id, lang, out);
        setOverride(out);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [task.id, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => {
    const active = override ?? (lang === "en" ? null : readCache(task.id, lang));
    const fallback: TranslatedFields = {
      title: task.title,
      subtitle: task.subtitle,
      prompt: task.prompt,
      bullets: task.bullets,
      wordCount: task.wordCount,
      group: task.group,
      badge: task.badge,
    };
    return { ...(active ?? fallback), isTranslating: loading && !active };
  }, [task, override, loading, lang]);
}

/**
 * Translate a label list (e.g. workbook section labels). Reads cache
 * synchronously so cached translations render on first paint.
 */
export function useTranslatedLabels(labels: string[], cacheTag: string): string[] {
  const { lang } = useLang();
  const translate_fn = useServerFn(translateStrings);
  const cached = lang === "en" ? null : readLabelsCache(cacheTag, lang, labels.length);
  const [override, setOverride] = useState<string[] | null>(cached);

  useEffect(() => {
    if (lang === "en") {
      setOverride(null);
      return;
    }
    const c = readLabelsCache(cacheTag, lang, labels.length);
    if (c) {
      setOverride(c);
      return;
    }
    let cancelled = false;
    void translate_fn({ data: { strings: labels, targetLang: lang } }).then((res) => {
      if (cancelled || !res.ok) return;
      writeLabelsCache(cacheTag, lang, res.translations);
      setOverride(res.translations);
    });
    return () => {
      cancelled = true;
    };
  }, [lang, cacheTag, labels.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (lang === "en") return labels;
  return override ?? readLabelsCache(cacheTag, lang, labels.length) ?? labels;
}
