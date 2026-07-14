import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { T, useAutoT } from "@/lib/useAutoT";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password · Writable" },
      { name: "description", content: "Choose a new password for your Writable account." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const tError = useAutoT(error ?? "");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("At least 8 characters");
    if (password !== confirm) return setError("Passwords don't match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/workbook/$level", params: { level: "beginner" } }), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-normal">
        <T>Set a new password</T>
      </h1>
      {!ready ? (
        <p className="text-sm text-muted-foreground">
          <T>Open the reset link from your email to set a new password.</T>
        </p>
      ) : done ? (
        <p className="text-sm text-teal">
          <T>Password updated. Redirecting…</T>
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium">
              <T>New password</T>
            </div>
            <input
              type="password"
              required
              className="w-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-teal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium">
              <T>Confirm password</T>
            </div>
            <input
              type="password"
              required
              className="w-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-teal"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {error && <div className="text-sm text-destructive">{tError}</div>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 bg-teal px-4 py-2.5 text-sm font-medium text-teal-foreground hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "…" : <T>Update password</T>}
          </button>
        </form>
      )}
    </div>
  );
}
