import { Settings } from "lucide-react";
import { useSettings, type SettingsState } from "@/lib/settings";

const items: { key: keyof SettingsState; label: string }[] = [
  { key: "showTaskHelp", label: "Show Task Help panel" },
  { key: "showProgress", label: "Show Your Progress panel" },
  { key: "showTimer", label: "Show Task Timer" },
  { key: "showWriting", label: "Show Your Writing panel" },
];

export function SettingsButton() {
  const { settings, toggle, popoverOpen, setPopoverOpen } = useSettings();

  return (
    <div className="fixed right-3 top-3 z-30">
      <button
        type="button"
        aria-label="Display settings"
        onClick={() => setPopoverOpen(!popoverOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </button>

      {popoverOpen && (
        <div
          role="dialog"
          aria-label="Display Settings"
          className="absolute right-0 top-10 w-72 border border-border bg-card p-4 text-sm shadow-sm"
        >
          <div className="mb-3 text-sm font-semibold text-foreground">Display Settings</div>
          <div className="space-y-2">
            {items.map((it) => (
              <label key={it.key} className="flex cursor-pointer items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={settings[it.key]}
                  onChange={() => toggle(it.key)}
                  className="h-4 w-4 accent-[color:var(--teal)]"
                />
                <span className="text-foreground">{it.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Press Esc to close. Changes apply instantly.
          </p>
        </div>
      )}
    </div>
  );
}
