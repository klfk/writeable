import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { CheckIssue, CorrectionCard, ErrorType } from "@/lib/check.functions";

export type HighlightEntry = { original: string; type: ErrorType };
export type SuggestionEntry = { original: string; suggestion: string; type: ErrorType };
export type VocabEntry = { term: string; note: string };
export type AiFeedback = {
  strengths: string;
  priorities: string;
  nextStep: string;
};

export type CorrectionContextValue = {
  userText: string;
  highlights: HighlightEntry[];
  cards: CorrectionCard[];
  suggestions: SuggestionEntry[];
  vocabularyNotes: VocabEntry[];
  rewriteAttempt: string | null;
  aiFeedback: AiFeedback | null;
};

type Ctx = CorrectionContextValue & {
  setUserText: (t: string) => void;
  setHighlights: (h: HighlightEntry[]) => void;
  setCards: (c: CorrectionCard[]) => void;
  setSuggestions: (s: SuggestionEntry[]) => void;
  setVocabularyNotes: (v: VocabEntry[]) => void;
  setRewriteAttempt: (r: string | null) => void;
  setAiFeedback: (f: AiFeedback | null) => void;
  reset: () => void;
};

const empty: CorrectionContextValue = {
  userText: "",
  highlights: [],
  cards: [],
  suggestions: [],
  vocabularyNotes: [],
  rewriteAttempt: null,
  aiFeedback: null,
};

const CorrectionCtx = createContext<Ctx | null>(null);

export function CorrectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CorrectionContextValue>(empty);

  const setUserText = useCallback((userText: string) => setState((s) => ({ ...s, userText })), []);
  const setHighlights = useCallback(
    (highlights: HighlightEntry[]) => setState((s) => ({ ...s, highlights })),
    [],
  );
  const setCards = useCallback((cards: CorrectionCard[]) => setState((s) => ({ ...s, cards })), []);
  const setSuggestions = useCallback(
    (suggestions: SuggestionEntry[]) => setState((s) => ({ ...s, suggestions })),
    [],
  );
  const setVocabularyNotes = useCallback(
    (vocabularyNotes: VocabEntry[]) => setState((s) => ({ ...s, vocabularyNotes })),
    [],
  );
  const setRewriteAttempt = useCallback(
    (rewriteAttempt: string | null) => setState((s) => ({ ...s, rewriteAttempt })),
    [],
  );
  const setAiFeedback = useCallback(
    (aiFeedback: AiFeedback | null) => setState((s) => ({ ...s, aiFeedback })),
    [],
  );
  const reset = useCallback(() => setState(empty), []);

  return (
    <CorrectionCtx.Provider
      value={{
        ...state,
        setUserText,
        setHighlights,
        setCards,
        setSuggestions,
        setVocabularyNotes,
        setRewriteAttempt,
        setAiFeedback,
        reset,
      }}
    >
      {children}
    </CorrectionCtx.Provider>
  );
}

export function useCorrectionContext() {
  const ctx = useContext(CorrectionCtx);
  if (!ctx) throw new Error("useCorrectionContext must be used within CorrectionProvider");
  return ctx;
}

// Helpers to convert CheckIssue[] -> HighlightEntry[]
export function toHighlights(issues: CheckIssue[]): HighlightEntry[] {
  return issues.map((i) => ({ original: i.original, type: i.type }));
}

export function parseAiFeedback(raw: string): AiFeedback {
  // Split on the "## ✦" markdown headers. Order is guaranteed by the prompt:
  // 1) strengths, 2) priorities, 3) nextStep — regardless of language.
  const parts = raw
    .split(/##\s*✦\s*/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      const nl = p.indexOf("\n");
      return (nl === -1 ? "" : p.slice(nl + 1)).trim();
    });
  return {
    strengths: parts[0] ?? "",
    priorities: parts[1] ?? "",
    nextStep: parts[2] ?? "",
  };
}
