import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, Trash2, ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import type { CorrectionCard } from "@/lib/check.functions";
import { T } from "@/lib/useAutoT";

export type VocabBankEntry = {
  id: string;
  term: string;
  suggestion: string;
  note: string;
  taskId?: string;
  savedAt: string;
};

const BANK_KEY = "vocab_bank_v1";
const MIN_TEXT_SUGGESTIONS = 3;

type VocabSuggestion = {
  id: string;
  term: string;
  suggestion: string;
  note: string;
  source: "correction" | "text";
};

type UpgradeRule = {
  term: string;
  suggestion: string;
  note: string;
  pattern?: RegExp;
};

const TEXT_UPGRADE_RULES: UpgradeRule[] = [
  {
    term: "I want",
    suggestion: "I would like",
    note: "A more polite and natural phrase for requests, emails, and formal writing.",
  },
  {
    term: "a lot",
    suggestion: "considerably",
    note: "More precise than “a lot” when describing degree or amount.",
  },
  {
    term: "very",
    suggestion: "particularly",
    note: "A stronger adverb that often sounds more specific than “very”.",
  },
  {
    term: "really",
    suggestion: "genuinely",
    note: "More expressive than “really” when you want to sound sincere.",
  },
  {
    term: "good",
    suggestion: "effective",
    note: "A clearer upgrade when describing something that works well.",
  },
  {
    term: "nice",
    suggestion: "thoughtful",
    note: "More specific than “nice” when describing a gesture, person, or detail.",
  },
  {
    term: "bad",
    suggestion: "unhelpful",
    note: "More precise than “bad” when describing a problem or result.",
  },
  {
    term: "big",
    suggestion: "significant",
    note: "More academic and precise than “big” for importance or impact.",
  },
  {
    term: "small",
    suggestion: "minor",
    note: "More precise than “small” when describing a limited issue or detail.",
  },
  {
    term: "important",
    suggestion: "essential",
    note: "Stronger than “important” when something is necessary.",
  },
  {
    term: "thing",
    suggestion: "point",
    note: "More specific than “thing” when referring to an idea or argument.",
  },
  {
    term: "things",
    suggestion: "aspects",
    note: "More specific than “things” when referring to parts of a topic.",
  },
  {
    term: "get",
    suggestion: "receive",
    note: "More formal than “get” when something is given or sent to you.",
  },
  {
    term: "make",
    suggestion: "create",
    note: "Often more precise than “make” when producing something new.",
  },
  {
    term: "help",
    suggestion: "support",
    note: "A stronger option when describing assistance or benefits.",
  },
  {
    term: "use",
    suggestion: "apply",
    note: "More precise than “use” when putting a method or idea into practice.",
  },
  {
    term: "tell",
    suggestion: "explain",
    note: "More precise when the text gives reasons, details, or clarification.",
  },
  {
    term: "show",
    suggestion: "demonstrate",
    note: "A stronger verb for evidence, examples, or proof.",
  },
  {
    term: "think",
    suggestion: "believe",
    note: "More confident than “think” when stating an opinion.",
  },
  {
    term: "like",
    suggestion: "appreciate",
    note: "More polished than “like” when expressing positive feeling or gratitude.",
  },
  {
    term: "many",
    suggestion: "numerous",
    note: "A more formal option when describing quantity.",
  },
  {
    term: "people",
    suggestion: "individuals",
    note: "More formal than “people” in essays and reports.",
  },
  {
    term: "problem",
    suggestion: "challenge",
    note: "Often more constructive than “problem” in explanations or reflections.",
  },
  {
    term: "change",
    suggestion: "improve",
    note: "Use this when the intended change makes something better.",
  },
];

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

function readBank(): VocabBankEntry[] {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBank(entries: VocabBankEntry[]) {
  try {
    localStorage.setItem(BANK_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function entryId(term: string, suggestion: string) {
  return `${term.toLowerCase().trim()}::${suggestion.toLowerCase().trim()}`;
}

function textSuggestionId(term: string, suggestion: string) {
  return entryId(term, suggestion);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rulePattern(rule: UpgradeRule) {
  return rule.pattern ?? new RegExp(`\\b${escapeRegExp(rule.term)}\\b`, "giu");
}

function buildTextSuggestions(
  text: string,
  takenIds: Set<string>,
  limit: number,
): VocabSuggestion[] {
  if (limit <= 0) return [];

  return TEXT_UPGRADE_RULES.map((rule, index) => {
    const matches = [...text.matchAll(rulePattern(rule))];
    return {
      rule,
      index,
      count: matches.length,
      firstIndex: matches[0]?.index ?? Number.MAX_SAFE_INTEGER,
    };
  })
    .filter(
      ({ rule, count }) => count > 0 && !takenIds.has(textSuggestionId(rule.term, rule.suggestion)),
    )
    .sort((a, b) => b.count - a.count || a.firstIndex - b.firstIndex || a.index - b.index)
    .slice(0, limit)
    .map(({ rule }) => ({
      id: textSuggestionId(rule.term, rule.suggestion),
      term: rule.term,
      suggestion: rule.suggestion,
      note: rule.note,
      source: "text",
    }));
}

export function VocabularyBuilderCard({
  cards,
  taskId,
  text = "",
}: {
  cards: CorrectionCard[];
  taskId?: string;
  text?: string;
}) {
  const [bank, setBank] = useState<VocabBankEntry[]>([]);
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setBank(readBank());
    const onStorage = (e: StorageEvent) => {
      if (e.key === BANK_KEY) setBank(readBank());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const suggestions = useMemo(() => {
    const correctionSuggestions: VocabSuggestion[] = cards
      .filter((c) => c.type === "vocabulary" && c.suggestion && c.original)
      .map((card) => ({
        id: entryId(card.original, card.suggestion),
        term: card.original,
        suggestion: card.suggestion,
        note: card.why,
        source: "correction",
      }));

    const takenIds = new Set(correctionSuggestions.map((suggestion) => suggestion.id));
    const textSuggestions = buildTextSuggestions(
      text,
      takenIds,
      Math.max(0, MIN_TEXT_SUGGESTIONS - correctionSuggestions.length),
    );

    return [...correctionSuggestions, ...textSuggestions];
  }, [cards, text]);

  const savedIds = new Set(bank.map((e) => e.id));

  const save = (suggestion: VocabSuggestion) => {
    if (savedIds.has(suggestion.id)) return;
    const next: VocabBankEntry[] = [
      {
        id: suggestion.id,
        term: suggestion.term,
        suggestion: suggestion.suggestion,
        note: suggestion.note,
        taskId,
        savedAt: new Date().toISOString(),
      },
      ...bank,
    ];
    setBank(next);
    writeBank(next);
  };

  const remove = (id: string) => {
    const next = bank.filter((e) => e.id !== id);
    setBank(next);
    writeBank(next);
  };

  const clearAll = () => {
    setBank([]);
    writeBank([]);
  };

  return (
    <div className="border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground">
          <T>Vocabulary Builder</T>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {bank.length} <T>saved</T>
          </span>
          <FoldIndicator open={open} />
        </span>
      </button>

      {open && (
        <div className="px-4 py-4">
          {suggestions.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              <T>Write a little more to see at least three vocabulary suggestions.</T>
            </p>
          ) : (
            <>
              <div className="mb-2 text-xs font-medium text-foreground">
                <T>Better fits for this text</T>
              </div>
              <ul className="space-y-2">
                {suggestions.map((suggestion) => {
                  const saved = savedIds.has(suggestion.id);
                  return (
                    <li
                      key={suggestion.id}
                      className="flex items-start justify-between gap-2 border border-border/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-foreground">
                          <span className="line-through text-muted-foreground">
                            {suggestion.term}
                          </span>{" "}
                          <span className="font-semibold" style={{ color: "#2a9d8f" }}>
                            → {suggestion.suggestion}
                          </span>
                        </div>
                        {suggestion.note && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {suggestion.note}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => save(suggestion)}
                        disabled={saved}
                        title={saved ? "Saved" : "Save to word bank"}
                        className={`shrink-0 rounded-sm p-1.5 ${
                          saved
                            ? "text-teal cursor-default"
                            : "text-muted-foreground hover:text-teal hover:bg-teal-soft"
                        }`}
                      >
                        {saved ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {bank.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center justify-between text-xs font-medium text-foreground hover:text-teal"
              >
                <span>
                  <T>Your word bank</T> ({bank.length})
                </span>
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {expanded && (
                <>
                  <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                    {bank.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-start justify-between gap-2 px-2 py-1.5 text-xs hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="text-foreground">
                            <span className="line-through text-muted-foreground">{e.term}</span>{" "}
                            <span className="font-semibold" style={{ color: "#2a9d8f" }}>
                              → {e.suggestion}
                            </span>
                          </div>
                          {e.note && (
                            <div className="mt-0.5 text-muted-foreground line-clamp-2">
                              {e.note}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(e.id)}
                          title="Remove"
                          className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      <T>Clear word bank</T>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
