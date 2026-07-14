import { createServerFn } from "@tanstack/react-start";

export type ErrorType = "grammar" | "style" | "vocabulary";
export type CheckIssue = { original: string; type: ErrorType };
export type CheckResult = { ok: true; issues: CheckIssue[] } | { ok: false; error: string };

export type CorrectionCard = {
  original: string;
  type: ErrorType;
  why: string;
  rule_url: string;
  important: boolean;
  suggestion: string;
};
export type CorrectionCardsResult =
  | { ok: true; cards: CorrectionCard[] }
  | { ok: false; error: string };

const LANG_NAMES: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
};

function langName(code?: string) {
  return LANG_NAMES[code ?? "en"] ?? "English";
}

function langDirective(code?: string) {
  const name = langName(code);
  if (name === "English") return "";
  return `\n\nIMPORTANT: All natural-language fields you produce (explanations, prose, feedback, replies) MUST be written in ${name}. Keep technical/JSON keys and enum values exactly as specified.`;
}

const PEG_BASE = "https://www.englishpage.com";
const FALLBACK_MAP: { keywords: string[]; url: string }[] = [
  {
    keywords: ["past simple", "past tense", "simple past"],
    url: `${PEG_BASE}/verbpage/simplepast.html`,
  },
  { keywords: ["present perfect"], url: `${PEG_BASE}/verbpage/presentperfect.html` },
  { keywords: ["past perfect"], url: `${PEG_BASE}/verbpage/pastperfect.html` },
  {
    keywords: ["present continuous", "present progressive"],
    url: `${PEG_BASE}/verbpage/presentcontinuous.html`,
  },
  {
    keywords: ["past continuous", "past progressive"],
    url: `${PEG_BASE}/verbpage/pastcontinuous.html`,
  },
  { keywords: ["future"], url: `${PEG_BASE}/verbpage/simplefuture.html` },
  { keywords: ["passive"], url: `${PEG_BASE}/verbpage/passivevoice.html` },
  { keywords: ["article", " a ", " an ", " the "], url: `${PEG_BASE}/articles/` },
  { keywords: ["conditional"], url: `${PEG_BASE}/conditional.htm` },
  { keywords: ["modal"], url: `${PEG_BASE}/modals.html` },
  { keywords: ["gerund", "infinitive"], url: `${PEG_BASE}/gerunds/` },
  { keywords: ["preposition"], url: `${PEG_BASE}/prepositions.html` },
  { keywords: ["irregular verb"], url: `${PEG_BASE}/irregularverbs/list.html` },
];

type OpenAiMessage = { role: "system" | "user" | "assistant"; content: string };

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY;
}

async function callOpenAi(messages: OpenAiMessage[], key: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callModel(prompt: string, key: string): Promise<string> {
  return callOpenAi([{ role: "user", content: prompt }], key);
}

async function resolveRuleUrl(rawUrl: string, why: string, key: string): Promise<string> {
  if (typeof rawUrl === "string" && rawUrl.startsWith(PEG_BASE)) return rawUrl;
  const lower = ` ${why.toLowerCase()} `;
  for (const entry of FALLBACK_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry.url;
  }
  try {
    const prompt = `Return ONLY a valid URL to the single most relevant page on englishpage.com for this English grammar or style issue. The URL must start with ${PEG_BASE}. No explanation, no punctuation, just the URL.\n\nIssue: ${why}`;
    const content = await callModel(prompt, key);
    const match = content.match(/https?:\/\/\S+/);
    const url = match?.[0]?.replace(/[.,;)\]]+$/, "") ?? "";
    if (url.startsWith(PEG_BASE)) return url;
  } catch {
    // ignore
  }
  return PEG_BASE;
}

export const getCorrectionCards = createServerFn({ method: "POST" })
  .inputValidator((data: { text: string; lang?: string }) => {
    if (!data || typeof data.text !== "string") throw new Error("Invalid input");
    return { text: data.text.slice(0, 5000), lang: data.lang ?? "en" };
  })
  .handler(async ({ data }): Promise<CorrectionCardsResult> => {
    const key = getOpenAiKey();
    if (!key) return { ok: false, error: "Missing OpenAI API key" };

    const prompt = `You are a precise English writing coach. Analyse the text below and return ONLY a valid JSON array. No explanation, no preamble, no markdown, no code blocks — raw JSON only.

Each object must have exactly these fields:
- "original": the exact substring from the user's text that contains the error (must match character-for-character)
- "type": one of exactly these three strings: "grammar", "style", "vocabulary"
- "why": one sentence explaining why this is an issue, without revealing the fix. Be specific — reference the actual words.
- "suggestion": the corrected version of the "original" substring, as a short string (just the fixed phrase, no explanation).
- "rule_url": a URL to the single most relevant page on englishpage.com for this error type (e.g. https://www.englishpage.com/verbpage/simplepast.html). Only use real, existing pages on that domain.
- "important": boolean — true for the single most important correction only, false for all others

If there are no errors return: []${langDirective(data.lang)}

Text:
${data.text}`;

    try {
      let content = await callModel(prompt, key);
      content = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return { ok: false, error: "Invalid response shape" };

      const raw: CorrectionCard[] = [];
      for (const item of parsed) {
        if (
          item &&
          typeof item.original === "string" &&
          (item.type === "grammar" || item.type === "style" || item.type === "vocabulary") &&
          typeof item.why === "string"
        ) {
          raw.push({
            original: item.original,
            type: item.type,
            why: item.why,
            rule_url: typeof item.rule_url === "string" ? item.rule_url : "",
            important: item.important === true,
            suggestion: typeof item.suggestion === "string" ? item.suggestion : "",
          });
        }
      }

      let seenImportant = false;
      for (const c of raw) {
        if (c.important && !seenImportant) seenImportant = true;
        else c.important = false;
      }

      const cards = await Promise.all(
        raw.map(async (c) => ({
          ...c,
          rule_url: await resolveRuleUrl(c.rule_url, c.why, key),
        })),
      );
      return { ok: true, cards };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

export const checkWriting = createServerFn({ method: "POST" })
  .inputValidator((data: { text: string; lang?: string }) => {
    if (!data || typeof data.text !== "string") throw new Error("Invalid input");
    return { text: data.text.slice(0, 5000), lang: data.lang ?? "en" };
  })
  .handler(async ({ data }): Promise<CheckResult> => {
    const key = getOpenAiKey();
    if (!key) return { ok: false, error: "Missing OpenAI API key" };

    const prompt = `You are a precise English writing coach. Analyse the text below and return ONLY a valid JSON array. No explanation, no preamble, no markdown formatting, no code blocks — raw JSON only.

Each object in the array must have exactly these fields:
- "original": the exact substring from the user's text that contains the error (must match character-for-character)
- "type": one of exactly these three strings: "grammar", "style", "vocabulary"

If there are no errors return an empty array: []

Text to analyse:
${data.text}`;

    try {
      let content = await callModel(prompt, key);
      content = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return { ok: false, error: "Invalid response shape" };

      const issues: CheckIssue[] = [];
      for (const item of parsed) {
        if (
          item &&
          typeof item.original === "string" &&
          (item.type === "grammar" || item.type === "style" || item.type === "vocabulary")
        ) {
          issues.push({ original: item.original, type: item.type });
        }
      }
      return { ok: true, issues };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

export type ScoreResult = { ok: true; score: number } | { ok: false; error: string };

export const scoreRelevance = createServerFn({ method: "POST" })
  .inputValidator((data: { taskPrompt: string; text: string; lang?: string }) => {
    if (!data || typeof data.text !== "string" || typeof data.taskPrompt !== "string") {
      throw new Error("Invalid input");
    }
    return {
      taskPrompt: data.taskPrompt.slice(0, 2000),
      text: data.text.slice(0, 5000),
      lang: data.lang ?? "en",
    };
  })
  .handler(async ({ data }): Promise<ScoreResult> => {
    const key = getOpenAiKey();
    if (!key) return { ok: false, error: "Missing OpenAI API key" };

    const prompt = `Read the following writing task prompt and the user's response. Score how relevant the response is to the task on a scale of 0 to 5, where 5 means the response fully addresses all parts of the task and 0 means it is completely off-topic.

Return ONLY a single integer between 0 and 5. No explanation, no punctuation, nothing else.

Task prompt:
${data.taskPrompt}

User's response:
${data.text}`;

    try {
      const content = await callModel(prompt, key);
      const match = content.match(/[0-5]/);
      if (!match) return { ok: false, error: "Could not parse score" };
      const score = parseInt(match[0], 10);
      if (Number.isNaN(score) || score < 0 || score > 5) {
        return { ok: false, error: "Score out of range" };
      }
      return { ok: true, score };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

export type CefrResult = { ok: true; level: number } | { ok: false; error: string };

export const scoreCefr = createServerFn({ method: "POST" })
  .inputValidator((data: { text: string; lang?: string }) => {
    if (!data || typeof data.text !== "string") throw new Error("Invalid input");
    return { text: data.text.slice(0, 5000), lang: data.lang ?? "en" };
  })
  .handler(async ({ data }): Promise<CefrResult> => {
    const key = getOpenAiKey();
    if (!key) return { ok: false, error: "Missing OpenAI API key" };

    const langN = langName(data.lang);
    const prompt = `You are a language assessor for ${langN}. Based on the writing sample below, estimate the writer's CEFR level as a decimal number on a scale from 1.0 to 6.0, where:
1.0 = A1, 2.0 = A2, 3.0 = B1, 4.0 = B2, 5.0 = C1, 6.0 = C2

Intermediate values are expected and encouraged — for example 3.4 means solid B1 leaning towards B2, 4.8 means strong C1 close to C2.

Return ONLY a decimal number between 1.0 and 6.0. One decimal place. No explanation, no punctuation, nothing else.

Text:
${data.text}`;

    try {
      const content = await callModel(prompt, key);
      const match = content.match(/\d+(?:\.\d+)?/);
      if (!match) return { ok: false, error: "Could not parse level" };
      let level = parseFloat(match[0]);
      if (Number.isNaN(level)) return { ok: false, error: "Could not parse level" };
      level = Math.max(1, Math.min(6, level));
      return { ok: true, level };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
export type ChatResult = { ok: true; reply: string } | { ok: false; error: string };

export const chatWithCoach = createServerFn({ method: "POST" })
  .inputValidator((data: { system: string; messages: ChatMessage[]; lang?: string }) => {
    if (!data || typeof data.system !== "string" || !Array.isArray(data.messages)) {
      throw new Error("Invalid input");
    }
    const messages = data.messages
      .filter(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
      )
      .slice(-30)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    return { system: data.system.slice(0, 8000), messages, lang: data.lang ?? "en" };
  })
  .handler(async ({ data }): Promise<ChatResult> => {
    const key = getOpenAiKey();
    if (!key) return { ok: false, error: "Missing OpenAI API key" };
    try {
      const system = data.system + langDirective(data.lang);
      const reply = await callOpenAi([{ role: "system", content: system }, ...data.messages], key);
      return { ok: true, reply };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

export type AiFeedbackResult = { ok: true; raw: string } | { ok: false; error: string };

export const getAiFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: { taskPrompt: string; text: string; lang?: string }) => {
    if (!data || typeof data.text !== "string" || typeof data.taskPrompt !== "string") {
      throw new Error("Invalid input");
    }
    return {
      taskPrompt: data.taskPrompt.slice(0, 2000),
      text: data.text.slice(0, 5000),
      lang: data.lang ?? "en",
    };
  })
  .handler(async ({ data }): Promise<AiFeedbackResult> => {
    const key = getOpenAiKey();
    if (!key) return { ok: false, error: "Missing OpenAI API key" };

    const langN = langName(data.lang);
    const headings =
      data.lang === "de"
        ? {
            strengths: "Was du gut machst",
            priorities: "Was du priorisieren solltest",
            next: "Nächster Schritt",
          }
        : data.lang === "fr"
          ? {
              strengths: "Ce que vous faites bien",
              priorities: "À prioriser",
              next: "Prochaine étape",
            }
          : {
              strengths: "What you are doing well",
              priorities: "What to prioritise",
              next: "Next step",
            };

    const prompt = `You are an experienced ${langN} writing coach giving structured feedback to a language learner. Analyse the writing sample below against the task prompt and return feedback in the following exact structure. Use markdown formatting as specified. Write the entire response in ${langN}.

## ✦ ${headings.strengths}
Write 2–3 specific observations about genuine strengths in this writing. Reference actual phrases or sentences from the text. Do not give generic praise. If there are no real strengths, say one honest neutral observation instead of inventing praise.

## ✦ ${headings.priorities}
Write 2–3 specific improvement areas, ordered by importance. Each point must:
- Name the issue clearly
- Quote or reference the specific part of the text where it occurs
- Explain why it matters for the reader or for the task
Do not list every error — only the highest-leverage improvements.

## ✦ ${headings.next}
Write exactly one concrete, actionable instruction the learner should do right now before pressing Check again. Be specific — name the sentence or paragraph to work on.

Keep the total response under 250 words. Be honest, specific, and direct.

Task prompt:
${data.taskPrompt}

User's writing:
${data.text}`;

    try {
      const raw = await callModel(prompt, key);
      return { ok: true, raw };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
