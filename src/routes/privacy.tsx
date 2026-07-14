import { createFileRoute } from "@tanstack/react-router";
import { T } from "@/lib/useAutoT";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Writable" },
      { name: "description", content: "How Writable collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-12 text-foreground">
      <h1 className="text-3xl font-normal">
        <T>Privacy Policy</T>
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        <T>Last updated: July 13, 2026</T>
      </p>

      <section className="prose prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
        <p>
          <T>{`This Privacy Policy describes how Writable ("we", "us", "our") collects, uses, and shares information when you use our web application. By using Writable, you agree to the practices described here.`}</T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>1. Information we collect</T>
        </h2>
        <p>
          <T>
            We store your writing exercises, preferences, and language settings locally in your
            browser. If you sign in, we also store account information such as your email and
            display name.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>2. How we use information</T>
        </h2>
        <p>
          <T>
            Your writing is sent to our AI backend to generate corrections, feedback, and
            translations. We use this data solely to provide the service and improve its quality.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>3. Sharing</T>
        </h2>
        <p>
          <T>
            We do not sell your personal data. We share limited data with service providers
            (hosting, AI providers) strictly to operate Writable.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>4. Data retention</T>
        </h2>
        <p>
          <T>
            Local browser data remains until you clear it. Account data is retained until you
            request deletion at hello@writable.app.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>5. Your rights</T>
        </h2>
        <p>
          <T>
            Depending on your jurisdiction, you may have rights to access, correct, or delete your
            data. Contact us at hello@writable.app to exercise these rights.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>6. Contact</T>
        </h2>
        <p>
          <T>Questions? Reach us at hello@writable.app.</T>
        </p>
      </section>
    </article>
  );
}
