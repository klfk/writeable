import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTaskForLanguage, tasksByLevel, type WorkbookLevel, type Task } from "@/data/tasks";
import { useSettings } from "@/lib/settings";
import {
  checkWriting,
  scoreRelevance,
  scoreCefr,
  getCorrectionCards,
  getAiFeedback,
  chatWithCoach,
  type CheckIssue,
  type CorrectionCard,
  type ErrorType,
  type ChatMessage,
} from "@/lib/check.functions";
import { motivationalMessages, getMotivationalMessages } from "@/lib/motivationalMessages";
import { useLang } from "@/lib/i18n";
import {
  CorrectionProvider,
  useCorrectionContext,
  toHighlights,
  parseAiFeedback,
  type SuggestionEntry,
  type AiFeedback,
} from "@/lib/correction-context";
import { pushTaskSave } from "@/lib/task-sync";
import { VocabularyBuilderCard } from "@/components/VocabularyBuilderCard";

// Shuffle cycle: no repeat until all 20 shown (per language).
const messageQueues: Record<string, string[]> = {};
function pickMotivationalMessage(lang: string): string {
  const pool = getMotivationalMessages(lang);
  if (!messageQueues[lang] || messageQueues[lang].length === 0) {
    messageQueues[lang] = [...pool];
    for (let i = messageQueues[lang].length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [messageQueues[lang][i], messageQueues[lang][j]] = [
        messageQueues[lang][j],
        messageQueues[lang][i],
      ];
    }
  }
  return messageQueues[lang].pop()!;
}
// Silence "imported but unused" warning when only used via getMotivationalMessages
void motivationalMessages;

type ScoreState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; score: number }
  | { status: "error" };

export const Route = createFileRoute("/workbook/$level/task/$taskId")({
  component: TaskDetailPageWrapper,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Task not found.</div>,
  loader: ({ params }) => {
    if (!(params.level in tasksByLevel)) throw notFound();
    const level = params.level as WorkbookLevel;
    const task = tasksByLevel[level].find((t) => t.id === params.taskId);
    if (!task) throw notFound();
    return { level, task };
  },
});

function TaskDetailPageWrapper() {
  const data = Route.useLoaderData() as { level: WorkbookLevel; task: Task };
  return (
    <CorrectionProvider key={data.task.id}>
      <TaskDetailPage />
    </CorrectionProvider>
  );
}

const TYPE_STYLES: Record<ErrorType, { bg: string; border: string; color: string; label: string }> =
  {
    grammar: {
      bg: "rgba(192, 57, 43, 0.2)",
      border: "#c0392b",
      color: "#c0392b",
      label: "Grammar",
    },
    style: { bg: "rgba(230, 126, 34, 0.2)", border: "#e67e22", color: "#e67e22", label: "Style" },
    vocabulary: {
      bg: "rgba(42, 157, 143, 0.2)",
      border: "#2a9d8f",
      color: "#2a9d8f",
      label: "Vocabulary",
    },
  };

type CheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "disabled" }
  | { status: "error"; message: string }
  | { status: "done"; issues: CheckIssue[] };

type CardsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; cards: CorrectionCard[] };

type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "none";
type ChatUiMsg = { role: "user" | "assistant"; content: string; ts: number };

type CorrectionProgressInput = {
  inlineOn: boolean;
  cardsNeeded: boolean;
  aiFeedbackOn: boolean;
  check: CheckState;
  cards: CardsState;
  score: ScoreState;
  cefrStatus: "idle" | "loading" | "done" | "error";
  aiFeedbackStatus: "idle" | "loading" | "done" | "error";
};

function stepDone(status: string) {
  return status === "done" || status === "disabled" || status === "error";
}

function getCorrectionProgress(input: CorrectionProgressInput) {
  const steps = [
    input.inlineOn ? { label: "Highlights", status: input.check.status } : null,
    { label: "Relevance", status: input.score.status },
    { label: "Level", status: input.cefrStatus },
    input.cardsNeeded ? { label: "Correction cards", status: input.cards.status } : null,
    input.aiFeedbackOn ? { label: "AI feedback", status: input.aiFeedbackStatus } : null,
  ].filter((step): step is { label: string; status: string } => Boolean(step));
  const active = steps.some((step) => step.status === "loading");
  const completed = steps.filter((step) => stepDone(step.status)).length;
  const failed = steps.some((step) => step.status === "error");
  const percent = steps.length === 0 ? 0 : Math.round((completed / steps.length) * 100);
  const current = steps.find((step) => step.status === "loading")?.label ?? null;
  return { active, completed, failed, percent, current, total: steps.length };
}

function tokenizeForDiff(text: string) {
  return text.match(/\s+|\S+/g) ?? [];
}

function diffTokens(before: string, after: string) {
  const a = tokenizeForDiff(before);
  const b = tokenizeForDiff(after);
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: { type: "same" | "added" | "removed"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i++] });
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "removed", text: a[i++] });
    } else {
      out.push({ type: "added", text: b[j++] });
    }
  }
  while (i < a.length) out.push({ type: "removed", text: a[i++] });
  while (j < b.length) out.push({ type: "added", text: b[j++] });
  return out;
}

type TaskSave = {
  taskId: string;
  savedAt: string;
  userText: string;
  correctionContext: {
    highlights: import("@/lib/correction-context").HighlightEntry[];
    cards: CorrectionCard[];
    suggestions: SuggestionEntry[];
    vocabularyNotes: import("@/lib/correction-context").VocabEntry[];
    rewriteAttempt: string | null;
    aiFeedback: AiFeedback | null;
  };
  relevanceScore: number | null;
  cefrScore: number | null;
  progressHistory: number[];
  chatHistory: ChatUiMsg[];
  timerElapsed: number;
  checkDone: boolean;
};

const storageTaskId = (taskId: string, lang: string) =>
  lang === "en" ? taskId : `${lang}_${taskId}`;
const saveKey = (taskId: string) => `task_save_${taskId}`;
const isOldDemoPrefill = (taskId: string, text: string | undefined) =>
  taskId === "b-email-present" &&
  !!text &&
  text.includes("Yesterday I go to shopping because I need buy present") &&
  text.includes("I buyed a blue scarf");

function TaskDetailPage() {
  const data = Route.useLoaderData() as { level: WorkbookLevel; task: Task };
  const { level, task } = data;
  const { lang, t } = useLang();
  const activeTaskId = storageTaskId(task.id, lang);
  const isDemoMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1";
  const saveTaskId = isDemoMode ? `demo_${activeTaskId}` : activeTaskId;
  const tr = getTaskForLanguage(level, task.id, lang) ?? task;
  const { settings, isPluginEnabled } = useSettings();
  const correctionCtx = useCorrectionContext();
  const [text, setText] = useState("");
  const [check, setCheck] = useState<CheckState>({ status: "idle" });
  const [score, setScore] = useState<ScoreState>({ status: "idle" });
  const [motivational, setMotivational] = useState<string | null>(null);
  const [cards, setCards] = useState<CardsState>({ status: "idle" });
  const check_fn = useServerFn(checkWriting);
  const score_fn = useServerFn(scoreRelevance);
  const cefr_fn = useServerFn(scoreCefr);
  const cards_fn = useServerFn(getCorrectionCards);
  const ai_feedback_fn = useServerFn(getAiFeedback);

  const [cefrScore, setCefrScore] = useState<number | null>(null);
  const [cefrStatus, setCefrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [progressHistory, setProgressHistory] = useState<number[]>([]);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatUiMsg[] | null>(null);
  const [aiFeedbackStatus, setAiFeedbackStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("none");

  const loadedRef = useRef(false);
  const autoCheckPendingRef = useRef(false);
  const unsavedTimerRef = useRef<number | null>(null);
  const writeTimerRef = useRef<number | null>(null);
  const checkRunRef = useRef(0);

  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const canCheck = words > 0;
  const showHighlights = check.status === "done";

  const inlineOn = isPluginEnabled("inline-highlighting");
  const correctionCardsOn = isPluginEnabled("correction-cards");
  const suggestionRevealOn = isPluginEnabled("suggestion-reveal");
  const rewriteChallengeOn = isPluginEnabled("rewrite-challenge");
  const beforeAfterOn = isPluginEnabled("before-after-diff");
  const aiChatOn = isPluginEnabled("ai-chat");
  const aiFeedbackOn = isPluginEnabled("ai-feedback");
  const vocabularyBuilderOn = isPluginEnabled("vocabulary-builder");
  const cardsNeeded =
    correctionCardsOn || rewriteChallengeOn || beforeAfterOn || vocabularyBuilderOn;
  const correctionProgress = getCorrectionProgress({
    inlineOn,
    cardsNeeded,
    aiFeedbackOn,
    check,
    cards,
    score,
    cefrStatus,
    aiFeedbackStatus,
  });

  // Build current snapshot (read fresh state each call)
  const buildSnapshot = (): TaskSave => ({
    taskId: saveTaskId,
    savedAt: new Date().toISOString(),
    userText: text,
    correctionContext: {
      highlights: correctionCtx.highlights,
      cards: correctionCtx.cards,
      suggestions: correctionCtx.suggestions,
      vocabularyNotes: correctionCtx.vocabularyNotes,
      rewriteAttempt: correctionCtx.rewriteAttempt,
      aiFeedback: correctionCtx.aiFeedback,
    },
    relevanceScore: score.status === "done" ? score.score : null,
    cefrScore,
    progressHistory,
    chatHistory: chatHistory ?? [],
    timerElapsed,
    checkDone: check.status === "done" || check.status === "disabled",
  });
  const snapshotRef = useRef<TaskSave | null>(null);
  snapshotRef.current = buildSnapshot();

  function doWrite() {
    try {
      const snap = snapshotRef.current;
      if (!snap) return;
      localStorage.setItem(saveKey(saveTaskId), JSON.stringify(snap));
      setSaveStatus("saved");
      // Fire-and-forget cloud sync; no-op when signed out. Demo runs stay local.
      if (!isDemoMode) void pushTaskSave(activeTaskId);
    } catch {
      setSaveStatus("error");
    }
  }

  function triggerSave(immediate: boolean) {
    if (!loadedRef.current) return;
    setSaveStatus("unsaved");
    if (unsavedTimerRef.current != null) window.clearTimeout(unsavedTimerRef.current);
    if (writeTimerRef.current != null) window.clearTimeout(writeTimerRef.current);
    if (immediate) {
      doWrite();
      return;
    }
    unsavedTimerRef.current = window.setTimeout(() => {
      setSaveStatus("saving");
    }, 100);
    writeTimerRef.current = window.setTimeout(() => {
      doWrite();
    }, 1500);
  }

  // Restore on mount
  useEffect(() => {
    loadedRef.current = false;
    setText("");
    setCheck({ status: "idle" });
    setScore({ status: "idle" });
    setMotivational(null);
    setCards({ status: "idle" });
    setCefrScore(null);
    setCefrStatus("idle");
    setProgressHistory([]);
    setTimerElapsed(0);
    setChatHistory([]);
    setAiFeedbackStatus("idle");
    setSaveStatus("none");
    correctionCtx.reset();

    let loadTimer: number | null = null;
    let demoTextToCheck: string | null = null;
    try {
      const demoKey = `demo_prefill_${activeTaskId}`;
      const demoText =
        isDemoMode && typeof window !== "undefined" ? sessionStorage.getItem(demoKey) : null;
      const raw = localStorage.getItem(saveKey(saveTaskId));
      if (demoText) {
        setText(demoText);
        correctionCtx.setUserText(demoText);
        setSaveStatus("unsaved");
        autoCheckPendingRef.current = false;
        demoTextToCheck = demoText;
      } else if (raw) {
        const save = JSON.parse(raw) as TaskSave;
        if (!isDemoMode && isOldDemoPrefill(activeTaskId, save.userText)) {
          localStorage.removeItem(saveKey(activeTaskId));
          setText("");
        } else {
          setText(save.userText ?? "");
          if (save.correctionContext) {
            correctionCtx.setUserText(save.userText ?? "");
            correctionCtx.setHighlights(save.correctionContext.highlights ?? []);
            correctionCtx.setCards(save.correctionContext.cards ?? []);
            correctionCtx.setSuggestions(save.correctionContext.suggestions ?? []);
            correctionCtx.setVocabularyNotes(save.correctionContext.vocabularyNotes ?? []);
            correctionCtx.setRewriteAttempt(save.correctionContext.rewriteAttempt ?? null);
            correctionCtx.setAiFeedback(save.correctionContext.aiFeedback ?? null);
            if (save.correctionContext.aiFeedback) setAiFeedbackStatus("done");
          }
          if (save.checkDone) {
            if (inlineOn) {
              const issues: CheckIssue[] = (save.correctionContext?.highlights ?? []).map((h) => ({
                original: h.original,
                type: h.type,
              }));
              setCheck({ status: "done", issues });
            } else {
              setCheck({ status: "disabled" });
            }
            if (cardsNeeded) {
              setCards({ status: "done", cards: save.correctionContext?.cards ?? [] });
            }
          }
          if (typeof save.relevanceScore === "number") {
            setScore({ status: "done", score: save.relevanceScore });
          }
          setCefrScore(typeof save.cefrScore === "number" ? save.cefrScore : null);
          setProgressHistory(Array.isArray(save.progressHistory) ? save.progressHistory : []);
          setTimerElapsed(typeof save.timerElapsed === "number" ? save.timerElapsed : 0);
          setChatHistory(Array.isArray(save.chatHistory) ? save.chatHistory : []);
          setSaveStatus("saved");
        }
      }
    } catch {
      // ignore corrupted save
    }
    // Allow auto-saves only after restored state has rendered. This prevents
    // the initial blank render from overwriting a demo prefill in StrictMode.
    loadTimer = window.setTimeout(() => {
      loadedRef.current = true;
      if (demoTextToCheck && demoTextToCheck.trim().length > 0) {
        try {
          sessionStorage.removeItem(`demo_prefill_${activeTaskId}`);
        } catch {
          // ignore storage errors
        }
        void onCheck(demoTextToCheck);
      }
    }, 0);
    return () => {
      if (loadTimer != null) window.clearTimeout(loadTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskId, isDemoMode, saveTaskId]);

  // Auto-save: typing & chat are debounced; other state changes save immediately.
  useEffect(() => {
    if (!loadedRef.current) return;
    triggerSave(false);
    if (autoCheckPendingRef.current && text.trim().length > 0) {
      autoCheckPendingRef.current = false;
      void onCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (!loadedRef.current) return;
    triggerSave(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistory]);

  useEffect(() => {
    if (!loadedRef.current) return;
    triggerSave(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    correctionCtx.highlights,
    correctionCtx.cards,
    correctionCtx.suggestions,
    correctionCtx.vocabularyNotes,
    correctionCtx.rewriteAttempt,
    correctionCtx.aiFeedback,
    check.status,
    cards.status,
    score.status,
    cefrScore,
    progressHistory,
    timerElapsed,
  ]);

  useEffect(() => {
    return () => {
      if (unsavedTimerRef.current != null) window.clearTimeout(unsavedTimerRef.current);
      if (writeTimerRef.current != null) window.clearTimeout(writeTimerRef.current);
    };
  }, []);

  async function onCheck(textOverride?: string) {
    const textToCheck = textOverride ?? text;
    if (textToCheck.trim().length === 0) return;
    const runId = checkRunRef.current + 1;
    checkRunRef.current = runId;
    const isCurrentRun = () => checkRunRef.current === runId;
    const assessmentLang = lang;
    setCheck({ status: "idle" });
    setMotivational(pickMotivationalMessage(lang));
    setScore({ status: "loading" });
    setCefrStatus("loading");

    // Reset shared correction context, then seed userText
    correctionCtx.reset();
    correctionCtx.setUserText(textToCheck);

    if (inlineOn) {
      setCheck({ status: "loading" });
      void (async () => {
        try {
          const res = await check_fn({ data: { text: textToCheck, lang: assessmentLang } });
          if (!isCurrentRun()) return;
          if (!res.ok) setCheck({ status: "error", message: res.error });
          else {
            setCheck({ status: "done", issues: res.issues });
            correctionCtx.setHighlights(toHighlights(res.issues));
          }
        } catch {
          if (!isCurrentRun()) return;
          setCheck({ status: "error", message: t("Could not parse feedback. Please try again.") });
        }
      })();
    } else {
      setCheck({ status: "disabled" });
    }

    if (cardsNeeded) {
      setCards({ status: "loading" });
      void (async () => {
        try {
          const res = await cards_fn({ data: { text: textToCheck, lang } });
          if (!isCurrentRun()) return;
          if (!res.ok) setCards({ status: "error" });
          else {
            setCards({ status: "done", cards: res.cards });
            correctionCtx.setCards(res.cards);
            const sugg: SuggestionEntry[] = res.cards
              .filter((c) => c.suggestion && c.suggestion.length > 0)
              .map((c) => ({ original: c.original, suggestion: c.suggestion, type: c.type }));
            correctionCtx.setSuggestions(sugg);
          }
        } catch {
          if (!isCurrentRun()) return;
          setCards({ status: "error" });
        }
      })();
    } else {
      setCards({ status: "idle" });
    }

    void (async () => {
      try {
        const res = await score_fn({
          data: { taskPrompt: tr.prompt, text: textToCheck, lang: assessmentLang },
        });
        if (!isCurrentRun()) return;
        if (!res.ok) setScore({ status: "error" });
        else setScore({ status: "done", score: res.score });
      } catch {
        if (!isCurrentRun()) return;
        setScore({ status: "error" });
      }
    })();
    void (async () => {
      let lvl = 3.0;
      let ok = true;
      try {
        const res = await cefr_fn({ data: { text: textToCheck, lang: assessmentLang } });
        if (res.ok) lvl = Math.max(1, Math.min(6, res.level));
        else ok = false;
      } catch {
        ok = false;
        lvl = 3.0;
      }
      if (!isCurrentRun()) return;
      const rounded = Number(lvl.toFixed(2));
      setCefrScore(rounded);
      setCefrStatus(ok ? "done" : "error");
      setProgressHistory((arr) => [...arr, rounded].slice(-10));
    })();

    if (aiFeedbackOn) {
      setAiFeedbackStatus("loading");
      void (async () => {
        try {
          const res = await ai_feedback_fn({
            data: { taskPrompt: tr.prompt, text: textToCheck, lang: assessmentLang },
          });
          if (!isCurrentRun()) return;
          if (!res.ok) {
            setAiFeedbackStatus("error");
          } else {
            const parsed = parseAiFeedback(res.raw);
            correctionCtx.setAiFeedback(parsed);
            setAiFeedbackStatus("done");
          }
        } catch {
          if (!isCurrentRun()) return;
          setAiFeedbackStatus("error");
        }
      })();
    } else {
      setAiFeedbackStatus("idle");
    }
  }

  return (
    <div className="px-10 pb-16 pt-8">
      <div className="mb-4 text-xs text-muted-foreground">
        <Link to="/workbook/$level" params={{ level }} className="hover:underline">
          ← {t("Back to")} {level}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <section className="border border-border bg-card">
            <div className="px-6 py-5">
              <h1 className="text-xl font-semibold text-foreground">{tr.title}</h1>
              <p className="mt-3 text-sm text-foreground/85">{tr.prompt}</p>
              {tr.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground/85">
                  {tr.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm font-semibold text-foreground">{tr.wordCount}</p>

              <hr className="my-4 border-border" />

              <p className="text-xs italic text-muted-foreground">
                {t("Do not write your real name or email address in your answer.")}
              </p>

              <div className="mt-3 flex items-center justify-end">
                <SaveStatusIndicator status={saveStatus} />
              </div>

              <div className="mt-3 border border-border">
                {showHighlights ? (
                  <HighlightedText
                    text={text}
                    issues={(check as { issues: CheckIssue[] }).issues}
                  />
                ) : (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t("Write your text here.")}
                    className="block min-h-[320px] w-full resize-y bg-card p-4 text-sm leading-6 text-foreground outline-none"
                  />
                )}
                {text.trim().length === 0 && (
                  <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs italic text-muted-foreground">
                    {t("You haven't written anything yet.")}
                  </div>
                )}
                <div className="bg-teal px-4 py-2 text-xs text-teal-foreground">
                  {words} {t("words entered (the word count for this task is about")}{" "}
                  {tr.wordCount.match(/\d+/)?.[0] ?? "25"} {t("words).")}
                </div>
              </div>
              <CorrectionProgressBar progress={correctionProgress} />

              {showHighlights && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setCheck({ status: "idle" });
                      setScore({ status: "idle" });
                      setMotivational(null);
                      setCards({ status: "idle" });
                    }}
                    className="text-sm text-teal hover:underline"
                    style={{ color: "#2a9d8f" }}
                  >
                    {t("Edit again")}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border px-6 py-4">
              <button
                onClick={() => onCheck()}
                disabled={!canCheck || check.status === "loading"}
                className={`flex items-center gap-1.5 border px-4 py-2 text-sm ${
                  canCheck && check.status !== "loading"
                    ? "border-teal bg-teal text-teal-foreground hover:opacity-90"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {check.status === "loading" ? t("Checking…") : t("Check")}{" "}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <div className="space-y-4">
            {aiFeedbackOn && (
              <AiFeedbackCard
                status={aiFeedbackStatus}
                feedback={correctionCtx.aiFeedback}
                cefrScore={cefrScore}
              />
            )}
            {correctionCardsOn && (
              <CorrectionCardsBlock state={cards} showSuggestions={suggestionRevealOn} />
            )}
            {rewriteChallengeOn && <RewriteChallengeCard cards={correctionCtx.cards} />}
            {beforeAfterOn && (
              <BeforeAfterCard text={correctionCtx.userText || text} cards={correctionCtx.cards} />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {settings.showTaskHelp && (
            <TaskHelpCard
              check={check}
              score={score}
              motivational={motivational}
              hasImages={(tr.images?.length ?? 0) > 0}
              checkedText={correctionCtx.userText}
              currentText={text}
            />
          )}
          {settings.showProgress && isPluginEnabled("your-progress") && (
            <ProgressCard history={progressHistory} />
          )}
          {settings.showTimer && isPluginEnabled("task-timer") && (
            <TimerCard initialElapsed={timerElapsed} onElapsedChange={setTimerElapsed} />
          )}
          {aiChatOn && (
            <AIChatCard initialMessages={chatHistory} onMessagesChange={setChatHistory} />
          )}
          {vocabularyBuilderOn && (
            <VocabularyBuilderCard
              cards={cards.status === "done" ? cards.cards : []}
              taskId={activeTaskId}
              text={text}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function HighlightedText({ text, issues }: { text: string; issues: CheckIssue[] }) {
  const { t } = useLang();
  const segments = useMemo(() => buildSegments(text, issues), [text, issues]);
  if (text.trim().length === 0) {
    return (
      <div className="block min-h-[320px] w-full bg-card p-4 text-sm italic leading-6 text-muted-foreground">
        {t("You haven't written anything yet.")}
      </div>
    );
  }
  return (
    <div className="block min-h-[320px] w-full whitespace-pre-wrap bg-card p-4 text-sm leading-6 text-foreground">
      {segments.map((seg, i) =>
        seg.type ? (
          <mark
            key={i}
            style={{
              backgroundColor: TYPE_STYLES[seg.type].bg,
              borderBottom: `1px solid ${TYPE_STYLES[seg.type].border}`,
              color: "inherit",
              padding: 0,
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </div>
  );
}

function buildSegments(text: string, issues: CheckIssue[]): { text: string; type?: ErrorType }[] {
  // Find non-overlapping ranges; first match wins on overlap.
  type Range = { start: number; end: number; type: ErrorType };
  const ranges: Range[] = [];

  for (const issue of issues) {
    if (!issue.original) continue;
    let from = 0;
    while (from <= text.length) {
      const idx = text.indexOf(issue.original, from);
      if (idx === -1) break;
      const end = idx + issue.original.length;
      const overlaps = ranges.some((r) => !(end <= r.start || idx >= r.end));
      if (!overlaps) {
        ranges.push({ start: idx, end, type: issue.type });
        break;
      }
      from = idx + 1;
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  const out: { text: string; type?: ErrorType }[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) out.push({ text: text.slice(cursor, r.start) });
    out.push({ text: text.slice(r.start, r.end), type: r.type });
    cursor = r.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

function CorrectionProgressBar({
  progress,
}: {
  progress: ReturnType<typeof getCorrectionProgress>;
}) {
  const { t } = useLang();
  if (!progress.active && progress.completed === 0) return null;
  const label = progress.active
    ? `${t("Checking")}: ${t(progress.current ?? "writing")}`
    : progress.failed
      ? t("Finished with some errors")
      : t("Correction complete");
  return (
    <div className="mt-3 border border-border bg-muted/30 px-3 py-2">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {progress.completed}/{progress.total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%`, backgroundColor: "#2a9d8f" }}
        />
      </div>
    </div>
  );
}

function FoldIndicator({ open }: { open: boolean }) {
  const Icon = open ? ChevronDown : ChevronLeft;
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#c9c9c9] bg-white text-[#6f6f6f] shadow-sm"
    >
      <Icon className="h-4 w-4" strokeWidth={2.4} />
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left text-sm font-semibold text-foreground"
      >
        <span>{t(title)}</span>
        <FoldIndicator open={open} />
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

function TaskHelpCard({
  check,
  score,
  motivational,
  hasImages,
  checkedText,
  currentText,
}: {
  check: CheckState;
  score: ScoreState;
  motivational: string | null;
  hasImages: boolean;
  checkedText: string;
  currentText: string;
}) {
  const { t } = useLang();
  type Tab = "Images" | "Feedback" | "Changes";
  const tabs: Tab[] = ["Images", "Feedback", "Changes"];
  const [tab, setTab] = useState<Tab>("Feedback");

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">
        {t("Task Help")}
      </div>
      <div className="flex border-b border-border">
        {tabs.map((tabName) => {
          const disabled = tabName === "Images" && !hasImages;
          const isActive = tab === tabName;
          return (
            <button
              key={tabName}
              onClick={() => !disabled && setTab(tabName)}
              disabled={disabled}
              aria-disabled={disabled}
              className={`flex-1 border-r border-border px-3 py-2 text-xs last:border-r-0 ${
                disabled
                  ? "cursor-not-allowed text-muted-foreground/50 opacity-50"
                  : isActive
                    ? "bg-muted font-semibold text-foreground underline underline-offset-4"
                    : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {t(tabName)}
            </button>
          );
        })}
      </div>
      <div className="px-4 py-4">
        {tab === "Feedback" ? (
          <FeedbackContent check={check} score={score} motivational={motivational} />
        ) : tab === "Changes" ? (
          <ChangesContent checkedText={checkedText} currentText={currentText} />
        ) : (
          <p className="text-xs italic text-muted-foreground">
            {t("No task images are available for this exercise.")}
          </p>
        )}
      </div>
    </div>
  );
}

function ChangesContent({
  checkedText,
  currentText,
}: {
  checkedText: string;
  currentText: string;
}) {
  const { t } = useLang();
  if (!checkedText.trim()) {
    return (
      <p className="text-xs italic text-muted-foreground">
        {t("Press Check once, then edit your text to see your changes here.")}
      </p>
    );
  }
  if (checkedText === currentText) {
    return (
      <p className="text-xs italic text-muted-foreground">{t("No edits since the last check.")}</p>
    );
  }
  const diff = diffTokens(checkedText, currentText);
  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-2 text-muted-foreground">
        <span className="rounded-sm bg-red-50 px-2 py-1" style={{ color: "#c0392b" }}>
          - {t("removed")}
        </span>
        <span className="rounded-sm bg-emerald-50 px-2 py-1" style={{ color: "#2a9d8f" }}>
          + {t("added")}
        </span>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap border border-border bg-muted/30 p-3 font-mono leading-6">
        {diff.map((part, index) => {
          if (part.type === "same") return <span key={index}>{part.text}</span>;
          if (part.type === "added") {
            return (
              <span
                key={index}
                style={{ backgroundColor: "rgba(42, 157, 143, 0.16)", color: "#1f7a70" }}
              >
                {part.text}
              </span>
            );
          }
          return (
            <span
              key={index}
              style={{
                backgroundColor: "rgba(192, 57, 43, 0.14)",
                color: "#a93226",
                textDecoration: "line-through",
              }}
            >
              {part.text}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

function MotivationalBlock({ message }: { message: string }) {
  const { t } = useLang();
  return (
    <div className="border bg-card p-4" style={{ borderColor: "#e0e0e0", borderRadius: 4 }}>
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="select-none font-bold leading-none"
          style={{ color: "#2a9d8f", fontSize: 64 }}
        >
          &amp;
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold italic" style={{ color: "#2d2d2d" }}>
            {message}
          </p>
          <p className="mt-2 text-xs italic text-muted-foreground">
            {t("Keep editing and press Check again to improve your score.")}
          </p>
        </div>
      </div>
    </div>
  );
}

function RelevanceScoreBar({ score }: { score: ScoreState }) {
  const { t } = useLang();
  if (score.status === "error") {
    return (
      <p className="text-xs italic text-muted-foreground">{t("Could not score relevance.")}</p>
    );
  }
  const isLoading = score.status === "loading" || score.status === "idle";
  const active = score.status === "done" ? score.score : -1;

  return (
    <div>
      <p className="mb-1.5 text-xs italic text-muted-foreground">
        {isLoading ? t("Scoring relevance…") : t("Did you write about the task? (5 is best)")}
      </p>
      <div
        className="relative w-full"
        style={{ height: 28, borderRadius: 4, backgroundColor: "#3d3d3d" }}
      >
        <div className="flex h-full w-full">
          {[0, 1, 2, 3, 4, 5].map((n) => {
            const passed = active >= 0 && n < active;
            const isActive = n === active;
            const bg = isLoading ? "#3d3d3d" : passed ? "#5a5a5a" : "#3d3d3d";
            return (
              <div
                key={n}
                className="relative flex h-full flex-1 items-center justify-center text-xs font-bold text-white"
                style={{
                  backgroundColor: bg,
                  borderTopLeftRadius: n === 0 ? 4 : 0,
                  borderBottomLeftRadius: n === 0 ? 4 : 0,
                  borderTopRightRadius: n === 5 ? 4 : 0,
                  borderBottomRightRadius: n === 5 ? 4 : 0,
                }}
              >
                {!isActive && <span>{n}</span>}
              </div>
            );
          })}
        </div>
        {active >= 0 && (
          <div
            className="pointer-events-none absolute top-1/2 flex items-center justify-center text-xs font-bold text-white"
            style={{
              left: `calc(${(active + 0.5) * (100 / 6)}% - 18px)`,
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: "9999px",
              backgroundColor: "#2a9d8f",
            }}
          >
            {active}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackContent({
  check,
  score,
  motivational,
}: {
  check: CheckState;
  score: ScoreState;
  motivational: string | null;
}) {
  const { t } = useLang();
  if (check.status === "idle") {
    return (
      <p className="text-xs italic text-muted-foreground">
        {t("Your automatic feedback will appear here after we finish checking your work.")}
      </p>
    );
  }
  if (check.status === "disabled") {
    return (
      <p className="text-xs italic text-muted-foreground">
        {t("Inline Highlighting is disabled. Enable it in Settings.")}
      </p>
    );
  }

  const summary = (() => {
    if (check.status === "loading") {
      return <p className="text-xs italic text-muted-foreground">{t("Checking your writing…")}</p>;
    }
    if (check.status === "error") {
      return (
        <p className="text-xs italic text-muted-foreground">
          {t("Could not parse feedback. Please try again.")}
        </p>
      );
    }
    const issues = check.issues;
    if (issues.length === 0) {
      return (
        <p className="text-xs italic text-muted-foreground">{t("No issues found. Well done.")}</p>
      );
    }
    const counts = {
      grammar: issues.filter((i) => i.type === "grammar").length,
      style: issues.filter((i) => i.type === "style").length,
      vocabulary: issues.filter((i) => i.type === "vocabulary").length,
    };
    const parts: { type: ErrorType; count: number }[] = (
      ["grammar", "style", "vocabulary"] as ErrorType[]
    )
      .map((type) => ({ type, count: counts[type] }))
      .filter((p) => p.count > 0);

    return (
      <>
        <p className="text-xs text-muted-foreground">
          {issues.length} {t(issues.length === 1 ? "issue" : "issues")} {t("found:")}{" "}
          {parts.map((p, i) => (
            <span key={p.type}>
              {p.count}{" "}
              <span style={{ color: TYPE_STYLES[p.type].color }}>
                {t(TYPE_STYLES[p.type].label)}
              </span>
              {i < parts.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(["grammar", "style", "vocabulary"] as ErrorType[]).map((type) => (
            <span key={type} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3"
                style={{
                  backgroundColor: TYPE_STYLES[type].bg,
                  borderBottom: `1px solid ${TYPE_STYLES[type].border}`,
                }}
              />
              {t(TYPE_STYLES[type].label)}
            </span>
          ))}
        </div>
      </>
    );
  })();

  return (
    <div className="space-y-4">
      {motivational && <MotivationalBlock message={motivational} />}
      <RelevanceScoreBar score={score} />
      <div className="space-y-3">{summary}</div>
    </div>
  );
}

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function SkewButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 border border-teal bg-teal px-4 py-2 text-sm text-teal-foreground hover:opacity-90"
    >
      {children}
    </button>
  );
}

function TimerCard({
  initialElapsed,
  onElapsedChange,
}: {
  initialElapsed: number;
  onElapsedChange: (e: number) => void;
}) {
  const { t } = useLang();
  type TState = "idle" | "running" | "stopped";
  const [state, setState] = useState<TState>(initialElapsed > 0 ? "stopped" : "idle");
  const [elapsed, setElapsed] = useState(initialElapsed);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(initialElapsed);

  useEffect(() => {
    baseRef.current = initialElapsed;
    setElapsed(initialElapsed);
    setState(initialElapsed > 0 ? "stopped" : "idle");
    startRef.current = null;
  }, [initialElapsed]);

  useEffect(() => {
    if (state !== "running") return;
    const id = window.setInterval(() => {
      if (startRef.current != null) {
        setElapsed(baseRef.current + (Date.now() - startRef.current) / 1000);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state]);

  function start() {
    baseRef.current = elapsed;
    startRef.current = Date.now();
    setState("running");
  }
  function stop() {
    let total = elapsed;
    if (startRef.current != null) {
      total = baseRef.current + (Date.now() - startRef.current) / 1000;
      setElapsed(total);
      baseRef.current = total;
      startRef.current = null;
    }
    setState("stopped");
    onElapsedChange(total);
  }
  function reset() {
    startRef.current = null;
    baseRef.current = 0;
    setElapsed(0);
    setState("idle");
    onElapsedChange(0);
  }

  const line1 =
    state === "running"
      ? "Click on 'Stop timer' when you are ready to Check your writing."
      : "Click on 'Start timer' to time your writing.";

  return (
    <Card title="Task Timer">
      <div>
        <p className="text-sm" style={{ color: "#2d2d2d" }}>
          {t(line1)}
        </p>
        <p className="mt-2 text-sm" style={{ color: "#2d2d2d" }}>
          {t("You have used this much time:")}{" "}
          <span className="font-mono">{formatHMS(elapsed)}</span>
        </p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {state === "running" ? (
          <SkewButton onClick={stop}>{t("Stop timer")}</SkewButton>
        ) : (
          <>
            <SkewButton onClick={reset}>{t("Reset timer")}</SkewButton>
            <SkewButton onClick={start}>{t("Start timer")}</SkewButton>
          </>
        )}
      </div>
    </Card>
  );
}

const CEFR_LABELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function ProgressCard({ history }: { history: number[] }) {
  const { t } = useLang();
  const scores = history.filter((n) => typeof n === "number");
  const width = 320;
  const height = 220;
  const pad = { top: 14, right: 18, bottom: 18, left: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const yFor = (value: number) => pad.top + ((6.2 - value) / (6.2 - 0.8)) * plotH;
  const xFor = (index: number) => pad.left + ((index + 1) / 11) * plotW;

  return (
    <Card title="Your progress">
      <div className="mb-3 inline-flex flex-col items-center border border-border px-3 py-1">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: "#7a7a7a" }}>
          {t("Checks")}
        </span>
        <span className="text-lg font-bold leading-none" style={{ color: "#2d2d2d" }}>
          {scores.length}
        </span>
      </div>
      <div className="bg-white px-2 pt-3" style={{ height: 280 }}>
        {scores.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs italic text-muted-foreground">
            {t("Your progress graph will appear here after your first check.")}
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            role="img"
            aria-label={t("Your progress chart")}
          >
            {[1, 2, 3, 4, 5, 6].map((tick) => {
              const y = yFor(tick);
              return (
                <g key={tick}>
                  <line
                    x1={pad.left}
                    x2={width - pad.right}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="4 4"
                  />
                  <text x={8} y={y + 4} fontSize="11" fill="var(--muted-foreground)">
                    {CEFR_LABELS[tick - 1]}
                  </text>
                </g>
              );
            })}
            {scores.map((scoreValue, index) => (
              <circle
                key={`${index}-${scoreValue}`}
                cx={xFor(index)}
                cy={yFor(scoreValue)}
                r="6"
                fill="var(--teal)"
              />
            ))}
          </svg>
        )}
      </div>
      <div className="px-3 py-3 text-xs" style={{ backgroundColor: "#e0f4f4", color: "#2d2d2d" }}>
        {t("This graph shows your CEFR level estimate for your last 10 checks.")}
      </div>
    </Card>
  );
}

const CARD_TYPE_COLORS: Record<ErrorType, string> = {
  grammar: "#c0392b",
  style: "#e67e22",
  vocabulary: "#2a9d8f",
};

function CorrectionCardsBlock({
  state,
  showSuggestions,
}: {
  state: CardsState;
  showSuggestions: boolean;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const [showAllCards, setShowAllCards] = useState(false);
  const count = state.status === "done" ? state.cards.length : 0;
  const countLabel =
    state.status === "done" ? `${count} ${t(count === 1 ? "issue" : "issues")}` : "";
  const visibleCards =
    state.status === "done" && !showAllCards ? state.cards.slice(0, 3) : state.cards;
  const hiddenCardCount = state.status === "done" ? state.cards.length - visibleCards.length : 0;

  return (
    <div className="border bg-card" style={{ borderColor: "#e0e0e0", borderRadius: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b px-4 py-2.5 text-left"
        style={{ borderColor: "#e0e0e0" }}
      >
        <span className="text-sm font-semibold text-foreground">{t("Correction Cards")}</span>
        <span className="inline-flex items-center gap-2">
          {countLabel && (
            <span className="text-xs" style={{ color: "#7a7a7a" }}>
              {countLabel}
            </span>
          )}
          <FoldIndicator open={open} />
        </span>
      </button>

      {open && state.status === "idle" && (
        <div className="px-4 py-4">
          <p className="text-xs italic text-muted-foreground">
            {t("Run a check to see detailed correction cards.")}
          </p>
        </div>
      )}

      {open && state.status === "loading" && (
        <div className="space-y-2 px-4 py-4">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 56, backgroundColor: "#f0f0f0" }} />
          ))}
        </div>
      )}

      {open && state.status === "error" && (
        <div className="px-4 py-4">
          <p className="text-xs italic text-muted-foreground">
            {t("Could not load correction cards. Please try again.")}
          </p>
        </div>
      )}

      {open && state.status === "done" && state.cards.length === 0 && (
        <div className="flex items-center justify-center px-4 py-6">
          <p className="text-xs italic text-muted-foreground">
            {t("No issues found. Great work!")}
          </p>
        </div>
      )}

      {open &&
        state.status === "done" &&
        visibleCards.map((card, i) => {
          const color = CARD_TYPE_COLORS[card.type];
          const isLast = i === visibleCards.length - 1 && hiddenCardCount === 0;
          return (
            <CardRow
              key={i}
              card={card}
              color={color}
              isLast={isLast}
              showSuggestion={showSuggestions && !!card.suggestion}
            />
          );
        })}

      {open && state.status === "done" && state.cards.length > 3 && (
        <div className="border-t px-4 py-3" style={{ borderColor: "#eeeeee" }}>
          <button
            type="button"
            onClick={() => setShowAllCards((current) => !current)}
            className="text-xs font-semibold underline underline-offset-2"
            style={{ color: "#2a9d8f" }}
          >
            {showAllCards
              ? t("Show fewer correction cards")
              : `${t("Show all correction cards")} (${state.cards.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

function CardRow({
  card,
  color,
  isLast,
  showSuggestion,
}: {
  card: CorrectionCard;
  color: string;
  isLast: boolean;
  showSuggestion: boolean;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        borderBottom: isLast ? "none" : "1px solid #eeeeee",
        backgroundColor: card.important ? "rgba(42, 157, 143, 0.06)" : undefined,
      }}
      className="px-4 py-3"
    >
      {card.important && (
        <p className="mb-1 text-[11px] italic" style={{ color: "#7a7a7a" }}>
          {t("Most important")}
        </p>
      )}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
          {t(TYPE_STYLES[card.type].label)}
        </span>
        <span className="text-xs" style={{ color: "#7a7a7a", textDecoration: "line-through" }}>
          {card.original}
        </span>
      </div>
      <p className="mt-1.5 text-sm" style={{ color: "#2d2d2d" }}>
        {card.why}
      </p>
      <div className="mt-1.5">
        <a
          href={card.rule_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs underline"
          style={{ color: "#2a9d8f" }}
        >
          {t("See rule →")}
        </a>
      </div>
      {showSuggestion && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-xs"
            style={{
              color: "#2a9d8f",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {t(open ? "Hide suggestion ▴" : "Show suggestion ▾")}
          </button>
          {open && (
            <div
              className="mt-1.5 pl-2 text-sm"
              style={{ borderLeft: "2px solid #2a9d8f", color: "#2d2d2d" }}
            >
              {card.suggestion}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function applySuggestions(text: string, cards: CorrectionCard[]) {
  return cards.reduce((current, card) => {
    if (!card.original || !card.suggestion || !current.includes(card.original)) return current;
    return current.replace(card.original, card.suggestion);
  }, text);
}

function RewriteChallengeCard({ cards }: { cards: CorrectionCard[] }) {
  const { t } = useLang();
  const ctx = useCorrectionContext();
  const card =
    cards.find((item) => item.important && item.suggestion) ??
    cards.find((item) => item.suggestion);
  const [attempt, setAttempt] = useState(ctx.rewriteAttempt ?? "");

  useEffect(() => {
    setAttempt(ctx.rewriteAttempt ?? "");
  }, [ctx.rewriteAttempt]);

  if (!card) {
    return (
      <Card title="Rewrite Challenge">
        <p className="text-xs italic text-muted-foreground">
          {t("Run a check to see your rewrite challenge.")}
        </p>
      </Card>
    );
  }

  return (
    <Card title="Rewrite Challenge">
      <div className="space-y-3 text-sm">
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">
            {t("Try rewriting this phrase:")}
          </div>
          <p className="border border-border bg-muted/40 px-3 py-2 text-foreground">
            {card.original}
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">
            {t("Your rewrite")}
          </span>
          <textarea
            value={attempt}
            onChange={(event) => {
              setAttempt(event.target.value);
              ctx.setRewriteAttempt(event.target.value);
            }}
            className="min-h-[72px] w-full resize-y border border-border bg-card px-3 py-2 text-sm outline-none focus:border-teal"
          />
        </label>
        {attempt.trim().length > 0 && (
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">
              {t("Suggested correction")}
            </div>
            <p className="border-l-2 border-teal bg-teal-soft px-3 py-2 text-foreground">
              {card.suggestion}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function BeforeAfterCard({ text, cards }: { text: string; cards: CorrectionCard[] }) {
  const { t } = useLang();
  const corrected = applySuggestions(text, cards);
  const hasCorrections = cards.some(
    (card) => card.original && card.suggestion && text.includes(card.original),
  );

  return (
    <Card title="Before / After">
      {!hasCorrections ? (
        <p className="text-xs italic text-muted-foreground">
          {t("Run a check to see the before/after comparison.")}
        </p>
      ) : (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("Original")}</div>
            <p className="min-h-[96px] whitespace-pre-wrap border border-border bg-muted/40 p-3">
              {text}
            </p>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("Corrected")}</div>
            <p className="min-h-[96px] whitespace-pre-wrap border border-teal/40 bg-teal-soft p-3">
              {corrected}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function fmtTime(ts: number) {
  if (ts <= 0) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`|~~[^~]+~~)/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.9em",
            backgroundColor: "rgba(0,0,0,0.06)",
            padding: "0 3px",
            borderRadius: 3,
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <del key={idx}>{part.slice(2, -2)}</del>;
    }
    return part;
  });
}

function buildSystemPrompt(
  firstName: string,
  ctx: ReturnType<typeof useCorrectionContext>,
): string {
  const name = firstName.trim() || "the student";
  const hasAny =
    ctx.userText.length > 0 ||
    ctx.highlights.length > 0 ||
    ctx.cards.length > 0 ||
    ctx.suggestions.length > 0 ||
    ctx.vocabularyNotes.length > 0 ||
    ctx.rewriteAttempt !== null;

  const tail = `

Address the user by their first name occasionally but naturally — not in every message.
Be encouraging but honest. Never rewrite the full text for them unless they explicitly ask.
Keep responses concise — 2 to 4 sentences unless a longer explanation is genuinely needed.`;

  if (!hasAny) {
    return `You are a friendly but precise English writing coach. You are helping a student named ${name} improve their writing.

The user has not checked their writing yet. Encourage them to write something and press Check.${tail}`;
  }

  const parts: string[] = [];
  parts.push(
    `You are a friendly but precise English writing coach. You are helping a student named ${name} improve their writing.`,
  );
  parts.push(`\nHere is the context you have:\n`);
  parts.push(`USER'S TEXT:\n${ctx.userText || "(empty)"}`);

  if (ctx.highlights.length > 0) {
    parts.push(
      `\nHIGHLIGHTED ERRORS (type and position):\n` +
        ctx.highlights.map((h) => `- [${h.type}] "${h.original}"`).join("\n"),
    );
  }
  if (ctx.cards.length > 0) {
    parts.push(
      `\nCORRECTION DETAILS:\n` +
        ctx.cards.map((c) => `- [${c.type}] "${c.original}" — ${c.why}`).join("\n"),
    );
  }
  if (ctx.suggestions.length > 0) {
    parts.push(
      `\nSUGGESTED FIXES:\n` +
        ctx.suggestions.map((s) => `- "${s.original}" → "${s.suggestion}"`).join("\n"),
    );
  }
  if (ctx.vocabularyNotes.length > 0) {
    parts.push(
      `\nVOCABULARY NOTES:\n` + ctx.vocabularyNotes.map((v) => `- ${v.term}: ${v.note}`).join("\n"),
    );
  }
  if (ctx.rewriteAttempt !== null) {
    parts.push(`\nUSER'S REWRITE ATTEMPT:\n${ctx.rewriteAttempt}`);
  }

  return parts.join("\n") + tail;
}

function AIChatCard({
  initialMessages,
  onMessagesChange,
}: {
  initialMessages: ChatUiMsg[] | null;
  onMessagesChange: (m: ChatUiMsg[]) => void;
}) {
  const { t } = useLang();
  const { firstName } = useSettings();
  const ctx = useCorrectionContext();
  const chat_fn = useServerFn(chatWithCoach);
  const displayName = firstName.trim() || t("there");
  const greeting = `Hi ${displayName}! I can see your writing and any corrections found so far. Ask me anything about your errors, why something is wrong, or how to improve a specific part of your text.`;
  const [messages, setMessages] = useState<ChatUiMsg[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages;
    return [{ role: "assistant", content: greeting, ts: 0 }];
  });
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedRef = useRef<ChatUiMsg[] | null>(initialMessages);

  // Adopt parent-provided messages when they change (e.g., Start again clears them)
  useEffect(() => {
    if (initialMessages === lastSyncedRef.current) return;
    lastSyncedRef.current = initialMessages;
    if (!initialMessages || initialMessages.length === 0) {
      setMessages([{ role: "assistant", content: greeting, ts: Date.now() }]);
    } else {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  // Notify parent on local changes
  useEffect(() => {
    onMessagesChange(messages);
    lastSyncedRef.current = messages;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    const userMsg: ChatUiMsg = { role: "user", content: trimmed, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setPending(true);
    try {
      const system = buildSystemPrompt(firstName, ctx);
      const payload: ChatMessage[] = nextHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await chat_fn({ data: { system, messages: payload } });
      const reply =
        res.ok && res.reply ? res.reply : t("Sorry, I couldn't reply just now. Please try again.");
      setMessages((cur) => [...cur, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch {
      setMessages((cur) => [
        ...cur,
        {
          role: "assistant",
          content: t("Sorry, I couldn't reply just now. Please try again."),
          ts: Date.now(),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border bg-card" style={{ borderColor: "#e0e0e0", borderRadius: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b px-4 py-2.5 text-left text-sm font-semibold text-foreground"
        style={{ borderColor: "#e0e0e0" }}
      >
        <span>{t("AI Chat")}</span>
        <FoldIndicator open={open} />
      </button>
      {open && (
        <>
          <div
            ref={scrollRef}
            className="space-y-3 overflow-y-auto px-4 py-3"
            style={{ height: 320 }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className="px-3 py-2 text-sm"
                  style={{
                    maxWidth: "80%",
                    borderRadius: 4,
                    backgroundColor: m.role === "user" ? "#2a9d8f" : "#f0f0f0",
                    color: m.role === "user" ? "#ffffff" : "#2d2d2d",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.role === "assistant" ? renderInlineMarkdown(m.content) : m.content}
                </div>
                {m.ts > 0 && (
                  <span className="mt-1 text-[10px]" style={{ color: "#9a9a9a" }}>
                    {fmtTime(m.ts)}
                  </span>
                )}
              </div>
            ))}
            {pending && (
              <div className="flex flex-col items-start">
                <div
                  className="px-3 py-2 text-sm"
                  style={{
                    maxWidth: "80%",
                    borderRadius: 4,
                    backgroundColor: "#f0f0f0",
                    color: "#2d2d2d",
                  }}
                >
                  …
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t px-3 py-2" style={{ borderColor: "#e0e0e0" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t("Ask about your writing…")}
              disabled={pending}
              className="flex-1 border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#e0e0e0", borderRadius: 4, backgroundColor: "#ffffff" }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={pending || input.trim().length === 0}
              className="px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: "#2a9d8f",
                color: "#ffffff",
                borderRadius: 4,
                opacity: pending || input.trim().length === 0 ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "none") return <span />;
  if (status === "error") {
    return (
      <span className="text-xs italic" style={{ color: "#c0392b" }}>
        Could not save
      </span>
    );
  }
  if (status === "unsaved") {
    return <span className="text-xs italic text-muted-foreground">Unsaved changes</span>;
  }
  if (status === "saving") {
    return <span className="text-xs italic text-muted-foreground">Saving…</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs italic text-muted-foreground">
      Saved{" "}
      <span
        aria-hidden="true"
        style={{
          color: "#2a9d8f",
          display: "inline-block",
          fontSize: "3em",
          lineHeight: 1,
          transform: "translateY(-0.18em)",
        }}
      >
        ☁
      </span>
    </span>
  );
}

function cefrBandFromScore(score: number | null): string | null {
  if (score == null) return null;
  const idx = Math.max(0, Math.min(5, Math.round(score) - 1));
  return CEFR_LABELS[idx] ?? null;
}

function AiFeedbackCard({
  status,
  feedback,
  cefrScore,
}: {
  status: "idle" | "loading" | "done" | "error";
  feedback: AiFeedback | null;
  cefrScore: number | null;
}) {
  const { t } = useLang();
  const band = cefrBandFromScore(cefrScore);
  const showLoading = status === "loading";
  const showEmpty = status === "idle" && !feedback;
  const showError = status === "error" && !feedback;
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{t("AI Feedback")}</span>
        <span className="inline-flex items-center gap-2">
          {band && (
            <span className="flex flex-col items-center border border-border px-3 py-1">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "#7a7a7a" }}>
                {t("Level")}
              </span>
              <span className="text-lg font-bold leading-none" style={{ color: "#2d2d2d" }}>
                {band}
              </span>
            </span>
          )}
          <FoldIndicator open={open} />
        </span>
      </button>
      {open && (
        <div className="px-4 py-4">
          {showLoading ? (
            <div className="space-y-3">
              <div style={{ height: 48, backgroundColor: "#f0f0f0" }} />
              <div style={{ height: 48, backgroundColor: "#f0f0f0" }} />
              <div style={{ height: 48, backgroundColor: "#f0f0f0" }} />
            </div>
          ) : showEmpty ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <p className="text-sm italic" style={{ color: "#7a7a7a" }}>
                {t("Press Check to receive your writing assessment.")}
              </p>
            </div>
          ) : showError ? (
            <p className="text-sm italic text-muted-foreground">
              {t("Could not generate AI feedback. Press Check to try again.")}
            </p>
          ) : feedback ? (
            <div className="space-y-3">
              <FeedbackBlock
                title={t("What you are doing well")}
                accentColor="#2a9d8f"
                tintColor="rgba(42, 157, 143, 0.04)"
                body={feedback.strengths}
              />
              <FeedbackBlock
                title={t("What to prioritise")}
                accentColor="#e67e22"
                tintColor="rgba(230, 126, 34, 0.04)"
                body={feedback.priorities}
                dividedItems
              />
              <FeedbackBlock
                title={t("Next step")}
                accentColor="#2d2d2d"
                tintColor="rgba(0, 0, 0, 0.02)"
                body={feedback.nextStep}
                emphasized
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FeedbackBlock({
  title,
  accentColor,
  tintColor,
  body,
  emphasized,
  dividedItems,
}: {
  title: string;
  accentColor: string;
  tintColor: string;
  body: string;
  emphasized?: boolean;
  dividedItems?: boolean;
}) {
  const { t } = useLang();
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div
      style={{
        backgroundColor: tintColor,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 2,
        padding: 16,
      }}
    >
      <div
        className="font-bold uppercase"
        style={{
          color: accentColor,
          fontSize: 11,
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        ✦ {title}
      </div>
      <div
        style={{
          color: "#2d2d2d",
          fontSize: emphasized ? "1.05em" : "0.875rem",
          lineHeight: 1.55,
        }}
      >
        {paragraphs.length === 0 ? (
          <p className="italic text-muted-foreground">{t("No content.")}</p>
        ) : (
          paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                marginTop: i === 0 ? 0 : 10,
                paddingTop: i > 0 && dividedItems ? 10 : 0,
                borderTop: i > 0 && dividedItems ? "1px solid #eeeeee" : "none",
                whiteSpace: "pre-wrap",
              }}
            >
              {renderInlineMarkdown(p)}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
