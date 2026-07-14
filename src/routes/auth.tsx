import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { T, useAutoT } from "@/lib/useAutoT";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in · Writable" },
      {
        name: "description",
        content: "Sign in or create a Writable account to sync your writing across devices.",
      },
    ],
  }),
});

type Mode = "sign_in" | "sign_up" | "forgot";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(200);

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const translatedError = useAutoT(error ?? "");
  const translatedInfo = useAutoT(info ?? "");

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/workbook/$level", params: { level: "beginner" }, replace: true });
    }
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const em = emailSchema.parse(email);
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(em, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("Check your inbox for the reset link.");
        return;
      }
      const pw = passwordSchema.parse(password);
      if (mode === "sign_up") {
        const { error } = await supabase.auth.signUp({
          email: em,
          password: pw,
          options: {
            emailRedirectTo: window.location.origin,
            data: firstName.trim() ? { first_name: firstName.trim() } : undefined,
          },
        });
        if (error) throw error;
        setInfo("Check your inbox to confirm your email, then sign in.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-normal text-foreground">
          {mode === "sign_up" ? (
            <T>Create your account</T>
          ) : mode === "forgot" ? (
            <T>Reset your password</T>
          ) : (
            <T>Welcome back</T>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "sign_up" ? (
            <T>Sync your writing across devices.</T>
          ) : mode === "forgot" ? (
            <T>We'll send you a reset link.</T>
          ) : (
            <T>Sign in to sync your progress.</T>
          )}
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === "sign_up" && (
          <label className="block">
            <div className="mb-1 text-xs font-medium">
              <T>First name (optional)</T>
            </div>
            <input
              className="w-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-teal"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={80}
            />
          </label>
        )}
        <label className="block">
          <div className="mb-1 text-xs font-medium">
            <T>Email</T>
          </div>
          <input
            type="email"
            required
            autoComplete="email"
            className="w-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-teal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {mode !== "forgot" && (
          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs font-medium">
              <span>
                <T>Password</T>
              </span>
              {mode === "sign_in" && (
                <button
                  type="button"
                  className="text-teal hover:underline"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  <T>Forgot?</T>
                </button>
              )}
            </div>
            <input
              type="password"
              required
              autoComplete={mode === "sign_up" ? "new-password" : "current-password"}
              className="w-full border border-border bg-card px-3 py-2 text-sm outline-none focus:border-teal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {error && <div className="text-sm text-destructive">{translatedError}</div>}
        {info && <div className="text-sm text-teal">{translatedInfo}</div>}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 bg-teal px-4 py-2.5 text-sm font-medium text-teal-foreground hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            "…"
          ) : mode === "sign_up" ? (
            <T>Create account</T>
          ) : mode === "forgot" ? (
            <T>Send reset link</T>
          ) : (
            <T>Sign in</T>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "sign_in" && (
          <>
            <T>No account?</T>{" "}
            <button
              className="text-teal hover:underline"
              onClick={() => {
                setMode("sign_up");
                setError(null);
                setInfo(null);
              }}
            >
              <T>Create one</T>
            </button>
          </>
        )}
        {mode === "sign_up" && (
          <>
            <T>Have an account?</T>{" "}
            <button
              className="text-teal hover:underline"
              onClick={() => {
                setMode("sign_in");
                setError(null);
                setInfo(null);
              }}
            >
              <T>Sign in</T>
            </button>
          </>
        )}
        {mode === "forgot" && (
          <button
            className="text-teal hover:underline"
            onClick={() => {
              setMode("sign_in");
              setError(null);
              setInfo(null);
            }}
          >
            ← <T>Back to sign in</T>
          </button>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">
          <T>Skip — keep writing without an account</T>
        </Link>
      </div>
    </div>
  );
}
