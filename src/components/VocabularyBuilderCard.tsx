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

const COMMON_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "because",
  "but",
  "can",
  "could",
  "das",
  "der",
  "die",
  "ein",
  "eine",
  "for",
  "from",
  "have",
  "ich",
  "ist",
  "mit",
  "not",
  "pour",
  "que",
  "the",
  "und",
  "une",
  "was",
  "werden",
  "will",
  "with",
  "you",
]);

type VocabSuggestion = {
  id: string;
  term: string;
  suggestion: string;
  note: string;
  source: "correction" | "text";
};

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

function textSuggestionId(term: string) {
  return entryId(term, term);
}

function buildTextSuggestions(
  text: string,
  takenIds: Set<string>,
  limit: number,
): VocabSuggestion[] {
  if (limit <= 0) return [];

  const counts = new Map<string, { term: string; count: number }>();
  for (const match of text.matchAll(/[\p{L}][\p{L}'’-]{2,}/gu)) {
    const term = match[0].replace(/[’']/g, "'");
    const key = term.toLocaleLowerCase();
    if (COMMON_WORDS.has(key) || takenIds.has(textSuggestionId(term))) continue;
    const current = counts.get(key);
    counts.set(key, { term: current?.term ?? term, count: (current?.count ?? 0) + 1 });
  }

  return [...counts.values()]
    .sort(
      (a, b) => b.count - a.count || b.term.length - a.term.length || a.term.localeCompare(b.term),
    )
    .slice(0, limit)
    .map(({ term, count }) => ({
      id: textSuggestionId(term),
      term,
      suggestion: term,
      note:
        count > 1
          ? `You used this word ${count} times. Save it and practise using it in new sentences.`
          : "Useful word from your text. Save it and practise using it in new sentences.",
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
                <T>From this text</T>
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
                          {suggestion.source === "correction" ? (
                            <>
                              <span className="line-through text-muted-foreground">
                                {suggestion.term}
                              </span>{" "}
                              <span className="font-semibold" style={{ color: "#2a9d8f" }}>
                                → {suggestion.suggestion}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold" style={{ color: "#2a9d8f" }}>
                              {suggestion.term}
                            </span>
                          )}
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
