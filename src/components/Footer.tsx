import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" />
              <span className="text-sm font-semibold text-foreground">Writable</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("Practice a new language by writing with task-based exercises.")}
            </p>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Product")}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  to="/workbook/$level"
                  params={{ level: "beginner" }}
                  className="text-foreground/80 hover:text-foreground"
                >
                  {t("Workbooks")}
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-foreground/80 hover:text-foreground">
                  {t("Settings")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Legal")}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-foreground/80 hover:text-foreground">
                  {t("Privacy Policy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-foreground/80 hover:text-foreground">
                  {t("Terms of Service")}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-foreground/80 hover:text-foreground">
                  {t("Cookie Policy")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Contact")}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:hello@writable.app"
                  className="text-foreground/80 hover:text-foreground"
                >
                  hello@writable.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>
            © {year} Writable. {t("All rights reserved.")}
          </div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">
              {t("Privacy")}
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              {t("Terms")}
            </Link>
            <Link to="/cookies" className="hover:text-foreground">
              {t("Cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
