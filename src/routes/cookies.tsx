import { createFileRoute } from "@tanstack/react-router";
import { T } from "@/lib/useAutoT";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Writable" },
      { name: "description", content: "How Writable uses cookies and local storage." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-12 text-foreground">
      <h1 className="text-3xl font-normal">
        <T>Cookie Policy</T>
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        <T>Last updated: July 13, 2026</T>
      </p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <p>
          <T>
            Writable uses browser storage (localStorage and sessionStorage) to remember your
            preferences, language, and saved writing between visits. We do not use tracking cookies
            for advertising.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>Essential storage</T>
        </h2>
        <p>
          <T>
            Used to keep you signed in, remember your interface language, and preserve your
            in-progress writing on this device.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>Analytics</T>
        </h2>
        <p>
          <T>
            If enabled, we may use privacy-friendly, aggregated analytics to understand how the app
            is used. No personally identifying data is shared with third parties.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>Managing storage</T>
        </h2>
        <p>
          <T>
            You can clear browser storage at any time via your browser settings. Doing so will sign
            you out and remove locally saved drafts.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>Contact</T>
        </h2>
        <p>
          <T>Questions? Email hello@writable.app.</T>
        </p>
      </section>
    </article>
  );
}
