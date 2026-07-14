import { createFileRoute } from "@tanstack/react-router";
import { T } from "@/lib/useAutoT";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Writable" },
      { name: "description", content: "The terms that govern your use of Writable." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-12 text-foreground">
      <h1 className="text-3xl font-normal">
        <T>Terms of Service</T>
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        <T>Last updated: July 13, 2026</T>
      </p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <p>
          <T>
            By accessing or using Writable, you agree to be bound by these Terms of Service. If you
            do not agree, do not use the service.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>1. Use of the service</T>
        </h2>
        <p>
          <T>
            Writable is provided for personal, non-commercial language learning. You agree not to
            misuse the service, attempt to disrupt it, or use it for unlawful purposes.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>2. Accounts</T>
        </h2>
        <p>
          <T>
            You are responsible for maintaining the confidentiality of your account and for any
            activity under it.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>3. Content</T>
        </h2>
        <p>
          <T>
            You retain ownership of the writing you submit. You grant us a limited license to
            process your writing to provide corrections and feedback.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>4. AI-generated feedback</T>
        </h2>
        <p>
          <T>
            AI feedback is provided for educational purposes and may contain errors. Do not rely on
            it for professional, legal, or medical decisions.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>5. Disclaimer</T>
        </h2>
        <p>
          <T>{`Writable is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we disclaim all liability arising from your use of the service.`}</T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>6. Changes</T>
        </h2>
        <p>
          <T>
            We may update these terms from time to time. Continued use after changes indicates
            acceptance of the updated terms.
          </T>
        </p>

        <h2 className="text-lg font-semibold text-foreground">
          <T>7. Contact</T>
        </h2>
        <p>
          <T>Contact us at hello@writable.app.</T>
        </p>
      </section>
    </article>
  );
}
