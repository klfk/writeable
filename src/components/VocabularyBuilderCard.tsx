import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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

export function VocabularyBuilderCard({
  cards,
  taskId,
}: {
  cards: CorrectionCard[];
  taskId?: string;
}) {
  const [bank, setBank] = useState<VocabBankEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setBank(readBank());
    const onStorage = (e: StorageEvent) => {
      if (e.key === BANK_KEY) setBank(readBank());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const vocabCards = cards.filter((c) => c.type === "vocabulary" && c.suggestion && c.original);

  const savedIds = new Set(bank.map((e) => e.id));

  const save = (card: CorrectionCard) => {
    const id = entryId(card.original, card.suggestion);
    if (savedIds.has(id)) return;
    const next: VocabBankEntry[] = [
      {
        id,
        term: card.original,
        suggestion: card.suggestion,
        note: card.why,
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
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="text-sm font-semibold text-foreground">
          <T>Vocabulary Builder</T>
        </div>
        <span className="text-xs text-muted-foreground">
          {bank.length} <T>saved</T>
        </span>
      </div>

      <div className="px-4 py-4">
        {vocabCards.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            <T>Run a check to see suggested vocabulary upgrades.</T>
          </p>
        ) : (
          <>
            <div className="mb-2 text-xs font-medium text-foreground">
              <T>From this text</T>
            </div>
            <ul className="space-y-2">
              {vocabCards.map((c, i) => {
                const id = entryId(c.original, c.suggestion);
                const saved = savedIds.has(id);
                return (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-2 border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-foreground">
                        <span className="line-through text-muted-foreground">{c.original}</span>{" "}
                        <span className="font-semibold" style={{ color: "#2a9d8f" }}>
                          → {c.suggestion}
                        </span>
                      </div>
                      {c.why && <div className="mt-0.5 text-xs text-muted-foreground">{c.why}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => save(c)}
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
                          <div className="mt-0.5 text-muted-foreground line-clamp-2">{e.note}</div>
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
    </div>
  );
}
