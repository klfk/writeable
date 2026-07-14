import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

type Slide = {
  title: string;
  body: string;
  graphic: "pick" | "write" | "feedback" | "improve";
};

const slides: Slide[] = [
  {
    title: "Pick a writing task",
    body: "Browse workbooks by level or topic and choose a prompt that fits what you want to practice.",
    graphic: "pick",
  },
  {
    title: "Write in the target language",
    body: "Type your response in the editor. Word count and prompt stay in view while you write.",
    graphic: "write",
  },
  {
    title: "Get instant AI feedback",
    body: "Hit Check and receive corrections, explanations, and a relevance score for your text.",
    graphic: "feedback",
  },
  {
    title: "Learn from your mistakes",
    body: "Review correction cards, rewrite, and watch your writing improve over time.",
    graphic: "improve",
  },
];

export function TutorialModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const slide = slides[i];
  const last = i === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close tutorial"
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-56 items-center justify-center bg-teal-soft">
          <Graphic kind={slide.graphic} />
        </div>

        <div className="px-6 pb-5 pt-5 min-h-[210px] flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">{t(slide.title)}</h2>
          <p className="mt-2 text-sm text-muted-foreground min-h-[60px]">{t(slide.body)}</p>

          <div className="mt-auto pt-5 flex items-center justify-center gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-5 bg-teal" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setI((v) => Math.max(0, v - 1))}
              disabled={i === 0}
              className="flex min-w-[90px] items-center gap-1 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("Back")}
            </button>
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("Skip tutorial")}
            </button>
            {last ? (
              <button
                onClick={onClose}
                className="min-w-[110px] rounded-md bg-teal px-4 py-1.5 text-sm font-medium text-teal-foreground hover:opacity-90"
              >
                {t("Get started")}
              </button>
            ) : (
              <button
                onClick={() => setI((v) => Math.min(slides.length - 1, v + 1))}
                className="flex min-w-[110px] items-center justify-center gap-1 rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-teal-foreground hover:opacity-90"
              >
                {t("Next")}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialPrompt({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex h-32 items-center justify-center rounded-md bg-teal-soft">
          <Graphic kind="pick" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t("Welcome to Writable")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "Would you like a quick tour of how the app works, or jump straight into your first exercise?",
          )}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            onClick={onStart}
            className="flex-1 rounded-md bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:opacity-90"
          >
            {t("Show me around")}
          </button>
          <button
            onClick={onSkip}
            className="flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t("Skip to exercise")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Graphic({ kind }: { kind: Slide["graphic"] }) {
  const stroke = "var(--teal)";
  const soft = "var(--card)";
  if (kind === "pick") {
    return (
      <svg viewBox="0 0 200 120" className="h-32 w-auto">
        <rect x="20" y="20" width="160" height="22" rx="3" fill={soft} stroke={stroke} />
        <rect
          x="20"
          y="50"
          width="160"
          height="22"
          rx="3"
          fill={stroke}
          opacity="0.15"
          stroke={stroke}
        />
        <rect x="20" y="80" width="160" height="22" rx="3" fill={soft} stroke={stroke} />
        <circle cx="32" cy="61" r="4" fill={stroke} />
      </svg>
    );
  }
  if (kind === "write") {
    return (
      <svg viewBox="0 0 200 120" className="h-32 w-auto">
        <rect x="20" y="15" width="160" height="90" rx="4" fill={soft} stroke={stroke} />
        <line x1="32" y1="32" x2="150" y2="32" stroke={stroke} strokeWidth="2" opacity="0.6" />
        <line x1="32" y1="45" x2="168" y2="45" stroke={stroke} strokeWidth="2" opacity="0.4" />
        <line x1="32" y1="58" x2="140" y2="58" stroke={stroke} strokeWidth="2" opacity="0.4" />
        <line x1="32" y1="71" x2="160" y2="71" stroke={stroke} strokeWidth="2" opacity="0.4" />
        <rect x="32" y="82" width="8" height="14" fill={stroke} opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1s" repeatCount="indefinite" />
        </rect>
      </svg>
    );
  }
  if (kind === "feedback") {
    return (
      <svg viewBox="0 0 200 120" className="h-32 w-auto">
        <rect x="20" y="20" width="105" height="80" rx="4" fill={soft} stroke={stroke} />
        <line x1="30" y1="35" x2="110" y2="35" stroke={stroke} opacity="0.5" strokeWidth="2" />
        <line x1="30" y1="48" x2="100" y2="48" stroke="oklch(0.58 0.22 27)" strokeWidth="2" />
        <line x1="30" y1="61" x2="115" y2="61" stroke={stroke} opacity="0.5" strokeWidth="2" />
        <line x1="30" y1="74" x2="95" y2="74" stroke="oklch(0.58 0.22 27)" strokeWidth="2" />
        <rect x="135" y="30" width="45" height="26" rx="3" fill={stroke} />
        <text x="157" y="47" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
          A+
        </text>
        <rect x="135" y="64" width="45" height="36" rx="3" fill={soft} stroke={stroke} />
        <line x1="140" y1="74" x2="175" y2="74" stroke={stroke} opacity="0.5" strokeWidth="1.5" />
        <line x1="140" y1="82" x2="170" y2="82" stroke={stroke} opacity="0.5" strokeWidth="1.5" />
        <line x1="140" y1="90" x2="172" y2="90" stroke={stroke} opacity="0.5" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 120" className="h-32 w-auto">
      <polyline
        points="20,90 60,75 100,55 140,40 180,20"
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="75" r="4" fill={stroke} />
      <circle cx="100" cy="55" r="4" fill={stroke} />
      <circle cx="140" cy="40" r="4" fill={stroke} />
      <circle cx="180" cy="20" r="5" fill={stroke} />
      <line x1="20" y1="105" x2="180" y2="105" stroke={stroke} opacity="0.3" />
    </svg>
  );
}
