import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SettingsState = {
  showTaskHelp: boolean;
  showProgress: boolean;
  showTimer: boolean;
  showWriting: boolean;
};

export type PluginId =
  | "inline-highlighting"
  | "correction-cards"
  | "suggestion-reveal"
  | "rewrite-challenge"
  | "before-after-diff"
  | "ai-chat"
  | "ai-feedback"
  | "task-timer"
  | "your-progress"
  | "vocabulary-builder";

export type Plugin = {
  id: PluginId;
  title: string;
  description: string;
  stars: number;
  enabled: boolean;
  dependsOn?: PluginId[];
};

export const defaultPlugins: Plugin[] = [
  {
    id: "inline-highlighting",
    title: "Inline Highlighting",
    description:
      "Highlights grammar, style and vocabulary errors directly in your text using colour-coded marks after you press Check.",
    stars: 5,
    enabled: true,
  },
  {
    id: "correction-cards",
    title: "Correction Cards",
    description:
      "Shows a detailed card for each error with the type, a why-explanation, and a link to the relevant grammar rule.",
    stars: 5,
    enabled: false,
  },
  {
    id: "suggestion-reveal",
    title: "Suggestion Reveal",
    description:
      "Adds a hidden toggle to each correction card that lets you reveal the suggested fix on demand.",
    stars: 4,
    enabled: false,
    dependsOn: ["correction-cards"],
  },
  {
    id: "rewrite-challenge",
    title: "Rewrite Challenge",
    description:
      "On the most important error, challenges you to fix it yourself before comparing your attempt to the ideal correction.",
    stars: 4,
    enabled: false,
    dependsOn: ["correction-cards"],
  },
  {
    id: "before-after-diff",
    title: "Before / After Diff",
    description:
      "Shows a two-column view of your original text vs the fully corrected version at the bottom of the feedback panel.",
    stars: 3,
    enabled: false,
    dependsOn: ["correction-cards"],
  },
  {
    id: "ai-chat",
    title: "AI Chat",
    description:
      "An AI assistant that has full context of your text and all corrections. Helps you understand your mistakes through conversation.",
    stars: 4,
    enabled: true,
  },
  {
    id: "ai-feedback",
    title: "AI Feedback",
    description:
      "After each check, gives you a structured written assessment: what you are doing well, what to prioritise, and one concrete next step.",
    stars: 5,
    enabled: true,
  },
  {
    id: "task-timer",
    title: "Task Timer",
    description: "Times your writing sessions to help you practice under exam-like conditions.",
    stars: 3,
    enabled: true,
  },
  {
    id: "your-progress",
    title: "Your Progress",
    description: "Tracks your writing improvement over time with a visual progress graph.",
    stars: 4,
    enabled: true,
  },
  {
    id: "vocabulary-builder",
    title: "Vocabulary Builder",
    description:
      "Suggests stronger, more precise word choices and saves new vocabulary to your personal word bank.",
    stars: 4,
    enabled: false,
  },
];

type Ctx = {
  settings: SettingsState;
  toggle: (key: keyof SettingsState) => void;
  popoverOpen: boolean;
  setPopoverOpen: (v: boolean) => void;
  plugins: Plugin[];
  togglePlugin: (id: PluginId) => void;
  isPluginEnabled: (id: PluginId) => boolean;
  firstName: string;
  setFirstName: (n: string) => void;
  lastName: string;
  setLastName: (n: string) => void;
  nativeLanguage: string;
  setNativeLanguage: (v: string) => void;
  learnerType: string;
  setLearnerType: (v: string) => void;
  learningReason: string;
  setLearningReason: (v: string) => void;
};

const defaultSettings: SettingsState = {
  showTaskHelp: true,
  showProgress: true,
  showTimer: true,
  showWriting: true,
};

const FIRST_NAME_KEY = "account_first_name";
const LAST_NAME_KEY = "account_last_name";
const NATIVE_LANG_KEY = "account_native_language";
const LEARNER_TYPE_KEY = "account_learner_type";
const LEARNING_REASON_KEY = "account_learning_reason";
const PLUGINS_KEY = "learning_plugins_enabled_v1";
const SETTINGS_KEY = "display_settings_v1";

const SettingsCtx = createContext<Ctx | null>(null);

function readLS(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
function writeLS(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    // ignore
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function normalizePlugins(saved: Partial<Record<PluginId, boolean>> = {}): Plugin[] {
  const enabled = new Map(
    defaultPlugins.map((plugin) => [plugin.id, saved[plugin.id] ?? plugin.enabled]),
  );

  // Enforce plugin dependencies so child plugins never appear enabled without
  // the data-producing parent plugin they need.
  for (const plugin of defaultPlugins) {
    if (!enabled.get(plugin.id)) continue;
    for (const dependency of plugin.dependsOn ?? []) enabled.set(dependency, true);
  }

  return defaultPlugins.map((plugin) => ({
    ...plugin,
    enabled: enabled.get(plugin.id) ?? plugin.enabled,
  }));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [plugins, setPlugins] = useState<Plugin[]>(defaultPlugins);
  const [firstName, setFirstNameState] = useState("");
  const [lastName, setLastNameState] = useState("");
  const [nativeLanguage, setNativeLanguageState] = useState("");
  const [learnerType, setLearnerTypeState] = useState("");
  const [learningReason, setLearningReasonState] = useState("");

  useEffect(() => {
    setSettings({ ...defaultSettings, ...readJson<Partial<SettingsState>>(SETTINGS_KEY, {}) });
    setPlugins(normalizePlugins(readJson<Partial<Record<PluginId, boolean>>>(PLUGINS_KEY, {})));
    setFirstNameState(readLS(FIRST_NAME_KEY));
    setLastNameState(readLS(LAST_NAME_KEY));
    setNativeLanguageState(readLS(NATIVE_LANG_KEY));
    setLearnerTypeState(readLS(LEARNER_TYPE_KEY));
    setLearningReasonState(readLS(LEARNING_REASON_KEY));
  }, []);

  useEffect(() => {
    if (!popoverOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popoverOpen]);

  const toggle = (key: keyof SettingsState) =>
    setSettings((current) => {
      const next = { ...current, [key]: !current[key] };
      writeJson(SETTINGS_KEY, next);
      return next;
    });

  const togglePlugin = (id: PluginId) =>
    setPlugins((current) => {
      const target = current.find((plugin) => plugin.id === id);
      if (!target) return current;

      const saved: Partial<Record<PluginId, boolean>> = {};
      for (const plugin of current) saved[plugin.id] = plugin.enabled;
      saved[id] = !target.enabled;

      if (!target.enabled) {
        for (const dependency of target.dependsOn ?? []) saved[dependency] = true;
      } else {
        for (const plugin of current) {
          if (plugin.dependsOn?.includes(id)) saved[plugin.id] = false;
        }
      }

      const next = normalizePlugins(saved);
      writeJson(PLUGINS_KEY, Object.fromEntries(next.map((plugin) => [plugin.id, plugin.enabled])));
      return next;
    });

  const isPluginEnabled = (id: PluginId) => plugins.find((p) => p.id === id)?.enabled ?? false;

  const wrap = (k: string, set: (v: string) => void) => (v: string) => {
    set(v);
    writeLS(k, v);
  };

  return (
    <SettingsCtx.Provider
      value={{
        settings,
        toggle,
        popoverOpen,
        setPopoverOpen,
        plugins,
        togglePlugin,
        isPluginEnabled,
        firstName,
        setFirstName: wrap(FIRST_NAME_KEY, setFirstNameState),
        lastName,
        setLastName: wrap(LAST_NAME_KEY, setLastNameState),
        nativeLanguage,
        setNativeLanguage: wrap(NATIVE_LANG_KEY, setNativeLanguageState),
        learnerType,
        setLearnerType: wrap(LEARNER_TYPE_KEY, setLearnerTypeState),
        learningReason,
        setLearningReason: wrap(LEARNING_REASON_KEY, setLearningReasonState),
      }}
    >
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
