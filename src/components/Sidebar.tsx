import { Link, useParams, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Settings as SettingsIcon,
  HelpCircle,
  ChevronDown,
  LogOut,
  LogIn,
} from "lucide-react";
import { useSidebarState } from "@/lib/sidebar-state";
import { workbooks, testZone } from "@/data/tasks";
import { useLang, LANG_NAMES, type Lang } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/useAuth";

export function Sidebar() {
  const params = useParams({ strict: false }) as { level?: string };
  const location = useLocation();
  const activeLevel = params.level;
  const isSettings = location.pathname.startsWith("/settings");
  const { collapsed, toggle } = useSidebarState();
  const { lang, setLang, t } = useLang();
  const { firstName } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName =
    firstName ||
    (user?.user_metadata?.first_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Learner";

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        aria-label="Expand sidebar"
        className="fixed bottom-3 left-3 z-20 flex h-9 w-9 items-center justify-center rounded-md bg-sidebar text-sidebar-foreground shadow-sm hover:bg-[color:var(--sidebar-active)] hover:text-[color:var(--sidebar-active-foreground)]"
      >
        <PanelLeftIcon filled={false} />
      </button>
    );
  }

  const langs: Lang[] = ["en", "de", "fr"];

  return (
    <aside className="fixed left-0 top-0 z-10 flex h-screen w-[260px] flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {t("Welcome,")} {displayName}
            </div>
            {user ? (
              <div className="truncate text-[11px] text-sidebar-muted">{user.email}</div>
            ) : (
              <div className="text-[11px] text-sidebar-muted">{t("Not signed in")}</div>
            )}
          </div>
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                void navigate({ to: "/" });
              }}
              title={t("Sign out")}
              aria-label={t("Sign out")}
              className="shrink-0 rounded p-1 text-sidebar-muted hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              to="/auth"
              title={t("Sign in")}
              aria-label={t("Sign in")}
              className="shrink-0 rounded p-1 text-sidebar-muted hover:bg-white/10 hover:text-white"
            >
              <LogIn className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="mt-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
            {t("Language")}
          </div>
          <div className="relative">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="w-full appearance-none rounded-sm border border-white/15 bg-sidebar px-3 py-1.5 pr-8 text-xs text-sidebar-foreground focus:border-teal focus:outline-none"
            >
              {langs.map((l) => (
                <option key={l} value={l}>
                  {LANG_NAMES[l]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-muted"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="my-2 border-t border-white/10" />
        <nav className="px-2">
          {workbooks.map((wb) => {
            const isActive = activeLevel === wb.slug;
            return (
              <Link
                key={wb.slug}
                to="/workbook/$level"
                params={{ level: wb.slug }}
                className={`flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-active text-sidebar-active-foreground"
                    : "text-sidebar-foreground hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />
                  <span className="truncate">{t(wb.label)}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="my-4 border-t border-white/10" />

        <div className="px-5 pb-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
            <span>{t("Test Zone")}</span>
            <Plus className="h-3 w-3" />
          </div>
        </div>
        <nav className="px-2">
          {testZone.map((tz) => {
            const isActive = activeLevel === tz.slug;
            return (
              <Link
                key={tz.slug}
                to="/workbook/$level"
                params={{ level: tz.slug }}
                className={`flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-active text-sidebar-active-foreground"
                    : "text-sidebar-foreground hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />
                  <span className="truncate">{t(tz.label)}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="my-3 border-t border-white/10" />

        <nav className="px-5 pb-3 text-sm">
          <Link
            to="/settings"
            className={`flex items-center gap-2 py-1.5 ${
              isSettings ? "text-white" : "text-sidebar-foreground/90 hover:text-white"
            }`}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            <span>{t("Settings")}</span>
          </Link>
          <a
            href="https://www.reddit.com/r/languagelearning/comments/1l6zi6v/writing_is_definitely_one_of_the_best_ways_to/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-1.5 text-sidebar-foreground/90 hover:text-white"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{t("Help centre")}</span>
          </a>
        </nav>
      </div>
      <div className="border-t border-white/10 px-3 py-2">
        <button
          onClick={toggle}
          aria-label="Collapse sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-white/10"
        >
          <PanelLeftIcon filled />
        </button>
      </div>
    </aside>
  );
}

function PanelLeftIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <line x1="9" y1="4" x2="9" y2="20" />
      {filled && (
        <rect x="3" y="4" width="6" height="16" rx="2.5" fill="currentColor" stroke="none" />
      )}
    </svg>
  );
}
