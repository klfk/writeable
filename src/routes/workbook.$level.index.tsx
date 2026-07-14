import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { tasksByLevel, allSections, type WorkbookLevel, type Task } from "@/data/tasks";
import { useLang } from "@/lib/i18n";
import { useTranslatedTask, prewarmWorkbookTranslations } from "@/lib/useTranslatedTask";
import { translateStrings } from "@/lib/translate.functions";
import { TutorialModal, TutorialPrompt } from "@/components/TutorialModal";

const TUTORIAL_KEY = "writable_tutorial_seen_v1";

export const Route = createFileRoute("/workbook/$level/")({
  component: WorkbookPage,
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Workbook not found.</div>
  ),
  loader: ({ params }) => {
    if (!(params.level in tasksByLevel)) throw notFound();
    return { level: params.level as WorkbookLevel };
  },
});

type WritingEntry = {
  taskId: string;
  title: string;
  subtitle: string;
  savedAt: string;
  checked: boolean;
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return "";
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

function loadWriting(level: WorkbookLevel): WritingEntry[] {
  if (typeof window === "undefined") return [];
  const taskIds = new Set(tasksByLevel[level].map((t) => t.id));
  const entries: WritingEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("task_save_")) continue;
      const taskId = key.slice("task_save_".length);
      if (!taskIds.has(taskId)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      const task = tasksByLevel[level].find((t) => t.id === taskId);
      if (!task) continue;
      const cards = data?.correctionContext?.cards ?? [];
      const checked = (Array.isArray(cards) && cards.length > 0) || data?.relevanceScore != null;
      entries.push({
        taskId,
        title: task.title,
        subtitle: task.subtitle,
        savedAt: data?.savedAt ?? new Date().toISOString(),
        checked,
      });
    }
  } catch {
    // ignore
  }
  entries.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  return entries;
}

function WorkbookPage() {
  const data = Route.useLoaderData() as { level: WorkbookLevel };
  const level = data.level;
  const wb = allSections.find((w) => w.slug === level)!;
  const tasks = tasksByLevel[level];
  const { lang, t } = useLang();
  const translate_fn = useServerFn(translateStrings);
  const [writing, setWriting] = useState<WritingEntry[]>([]);
  const [tutorialStage, setTutorialStage] = useState<"none" | "prompt" | "show">("none");

  // Pre-warm translations for the current workbook first (blocking cache
  // write), then for every other workbook in the background. Result:
  // switching workbooks renders in the target language on the first paint.
  useEffect(() => {
    if (lang === "en") return;
    let cancelled = false;
    void (async () => {
      await prewarmWorkbookTranslations(tasks, lang, translate_fn);
      if (cancelled) return;
      for (const section of allSections) {
        if (section.slug === level) continue;
        if (cancelled) break;
        await prewarmWorkbookTranslations(tasksByLevel[section.slug], lang, translate_fn);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, level]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setWriting(loadWriting(level));
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("task_save_")) setWriting(loadWriting(level));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [level]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) setTutorialStage("prompt");
    } catch {
      // ignore
    }
  }, []);

  const dismissTutorial = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      // ignore
    }
    setTutorialStage("none");
  };

  return (
    <div className="px-10 pb-16 pt-12">
      {tutorialStage === "prompt" && (
        <TutorialPrompt onStart={() => setTutorialStage("show")} onSkip={dismissTutorial} />
      )}
      {tutorialStage === "show" && <TutorialModal onClose={dismissTutorial} />}
      <h1 className="mb-6 text-3xl font-normal text-foreground">{t(wb.label)}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">{t("New tasks")}</h2>
          </div>
          <ul>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} level={level} />
            ))}
          </ul>
        </section>

        <aside className="border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">{t("Your Writing")}</h2>
          </div>
          {writing.length === 0 ? (
            <div className="px-5 py-4 text-xs italic text-muted-foreground">
              {t("Your completed and in-progress tasks will appear here.")}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {writing.map((w) => (
                <li key={w.taskId}>
                  <Link
                    to="/workbook/$level/task/$taskId"
                    params={{ level, taskId: w.taskId }}
                    preload="intent"
                    className="flex gap-3 px-5 py-4 hover:bg-teal-soft"
                  >
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/60">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: w.checked ? "#2a9d8f" : "transparent" }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground">{w.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{w.subtitle}</div>
                        </div>
                        <div className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelative(w.savedAt)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function TaskRow({ task, level }: { task: Task; level: WorkbookLevel }) {
  const tr = useTranslatedTask(task);

  return (
    <li className="relative border-b border-border bg-card transition-colors duration-200 ease-out last:border-b-0 hover:bg-teal-soft focus-within:bg-teal-soft">
      <Link
        to="/workbook/$level/task/$taskId"
        params={{ level, taskId: task.id }}
        preload="intent"
        className="flex gap-3 px-5 py-4 pl-12 pt-5"
      >
        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/60">
          <span className="h-2 w-2 rounded-full bg-transparent" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">{tr.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{tr.subtitle}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-rows-[1fr] opacity-100">
            <div className="overflow-hidden">
              <p className="text-xs leading-relaxed text-foreground/80">{tr.prompt}</p>
              {tr.bullets.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
                  {tr.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs font-semibold text-foreground">{tr.wordCount}</p>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function Pagination() {
  const pages = [1, 2, 3, 4, 5, 6, 7];
  const active = 1;
  const btn =
    "flex h-7 min-w-7 items-center justify-center border border-border bg-card px-2 text-xs text-foreground hover:bg-muted";
  return (
    <div className="flex items-center justify-center gap-1 border-t border-border px-5 py-4">
      <button className={btn}>«</button>
      <button className={btn}>‹</button>
      {pages.map((p) => (
        <button
          key={p}
          className={`flex h-7 min-w-7 items-center justify-center border px-2 text-xs ${
            p === active
              ? "border-teal bg-teal text-teal-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {p}
        </button>
      ))}
      <span className="px-1 text-xs text-muted-foreground">…</span>
      <button className={btn}>›</button>
      <button className={btn}>»</button>
    </div>
  );
}
