import { createServerFn } from "@tanstack/react-start";

export type TranslateResult = { ok: true; translations: string[] } | { ok: false; error: string };

const LANG_NAMES: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
};

async function callOpenAi(prompt: string, key: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export const translateStrings = createServerFn({ method: "POST" })
  .inputValidator((data: { strings: string[]; targetLang: string }) => {
    if (!data || !Array.isArray(data.strings) || typeof data.targetLang !== "string") {
      throw new Error("Invalid input");
    }
    const targetLang = data.targetLang.slice(0, 5);
    const strings = data.strings.slice(0, 50).map((s) => String(s).slice(0, 4000));
    return { strings, targetLang };
  })
  .handler(async ({ data }): Promise<TranslateResult> => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, error: "Missing OpenAI API key" };
    if (data.targetLang === "en" || data.strings.length === 0) {
      return { ok: true, translations: data.strings };
    }
    const langName = LANG_NAMES[data.targetLang] ?? data.targetLang;

    const numbered = data.strings.map((s, i) => `${i + 1}. ${s.replace(/\n/g, " ⏎ ")}`).join("\n");
    const prompt = `Translate the following ${data.strings.length} numbered strings from English into ${langName}. 
Rules:
- Return ONLY a JSON array of ${data.strings.length} translated strings, same order, no numbering, no preamble, no markdown, no code fences.
- Preserve punctuation, capitalisation conventions of the target language, and any "⏎" markers (which represent line breaks — keep them inline as " ⏎ ").
- Do NOT translate proper nouns (names, brand names like IELTS, B2 First).
- Keep numbers, units (e.g. "150 words", "~20 min") readable in the target language.

Strings:
${numbered}`;

    try {
      let content = await callOpenAi(prompt, key);
      content = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return { ok: false, error: "Invalid response shape" };
      const translations = parsed
        .slice(0, data.strings.length)
        .map((s) => (typeof s === "string" ? s.replace(/ ⏎ /g, "\n") : ""));
      while (translations.length < data.strings.length) {
        translations.push(data.strings[translations.length]);
      }
      return { ok: true, translations };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
