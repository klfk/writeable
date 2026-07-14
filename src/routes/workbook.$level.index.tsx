import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  tasksByLevel,
  getAllSectionsForLanguage,
  getTasksForLevel,
  type WorkbookLevel,
  type Task,
} from "@/data/tasks";
import { useLang, type Lang } from "@/lib/i18n";
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

const storageTaskId = (taskId: string, lang: Lang) =>
  lang === "en" ? taskId : `${lang}_${taskId}`;
const saveKey = (taskId: string, lang: Lang) => `task_save_${storageTaskId(taskId, lang)}`;

function loadWriting(level: WorkbookLevel, lang: Lang): WritingEntry[] {
  if (typeof window === "undefined") return [];
  const tasks = getTasksForLevel(level, lang);
  const entries: WritingEntry[] = [];
  try {
    for (const task of tasks) {
      const raw = localStorage.getItem(saveKey(task.id, lang));
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (typeof data?.userText !== "string" || data.userText.trim().length === 0) continue;
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
  const { lang, t } = useLang();
  const sections = getAllSectionsForLanguage(lang);
  const wb = sections.find((w) => w.slug === level)!;
  const tasks = getTasksForLevel(level, lang);
  const [writing, setWriting] = useState<WritingEntry[]>([]);
  const [tutorialStage, setTutorialStage] = useState<"none" | "prompt" | "show">("none");

  useEffect(() => {
    setWriting(loadWriting(level, lang));
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("task_save_")) setWriting(loadWriting(level, lang));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [level, lang]);

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
            <div aria-hidden="true" className="min-h-6" />
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
  return (
    <li className="group relative border-b border-border bg-card transition-colors duration-300 ease-out last:border-b-0 hover:bg-teal-soft focus-within:bg-teal-soft">
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
              <div className="text-sm font-semibold text-foreground">{task.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{task.subtitle}</div>
            </div>
          </div>
          <div className="mt-1 grid grid-rows-[0fr] opacity-60 transition-all duration-300 ease-out group-hover:mt-3 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100 max-sm:mt-3 max-sm:grid-rows-[1fr] max-sm:opacity-100">
            <div className="overflow-hidden">
              <p className="text-xs leading-relaxed text-foreground/80">{task.prompt}</p>
              {task.bullets.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
                  {task.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs font-semibold text-foreground">{task.wordCount}</p>
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
