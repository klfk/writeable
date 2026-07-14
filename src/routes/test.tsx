import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/test")({
  component: TestLaunchPage,
  head: () => ({
    meta: [
      { title: "AI correction test · Writable" },
      {
        name: "description",
        content: "Launch a prefilled Writable exercise with all AI correction plugins enabled.",
      },
    ],
  }),
});

const TEST_TASK_ID = "b-email-present";
const TEST_URL = "/workbook/beginner/task/b-email-present";

const TEST_TEXT = `Hi Blake,

Yesterday I go to shopping because I need buy present for my sister birthday. I buyed a blue scarf because she really like blue colour and she always say that her neck is cold in winter. The scarf was not very expensive but it looks beautiful and soft. I choose it because I think it is useful and more personal than a gift card.

See you soon,
Alex`;

function prepareFullCorrectionTest() {
  const allPlugins = {
    "inline-highlighting": true,
    "correction-cards": true,
    "suggestion-reveal": true,
    "rewrite-challenge": true,
    "before-after-diff": true,
    "ai-chat": true,
    "ai-feedback": true,
    "task-timer": true,
    "your-progress": true,
    "vocabulary-builder": true,
  };

  const allDisplaySettings = {
    showTaskHelp: true,
    showProgress: true,
    showTimer: true,
    showWriting: true,
  };

  localStorage.setItem("app_lang", "en");
  localStorage.setItem("learning_plugins_enabled_v1", JSON.stringify(allPlugins));
  localStorage.setItem("display_settings_v1", JSON.stringify(allDisplaySettings));
  localStorage.removeItem(`task_save_${TEST_TASK_ID}`);
  sessionStorage.setItem(`demo_prefill_${TEST_TASK_ID}`, TEST_TEXT);
}

function TestLaunchPage() {
  useEffect(() => {
    try {
      prepareFullCorrectionTest();
    } finally {
      window.location.assign(TEST_URL);
    }
  }, []);

  return (
    <div className="px-10 py-12">
      <section className="max-w-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Test launcher</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          Launching AI correction test…
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enabling every learning plugin, pasting a mock answer into the beginner email exercise,
          and running the full AI correction flow automatically.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          If you are not redirected,{" "}
          <a className="text-teal underline" href={TEST_URL}>
            open the test exercise
          </a>
          .
        </p>
      </section>
    </div>
  );
}
