import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { cloudAuth } from "@/integrations/cloud-auth";
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

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await cloudAuth.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
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

      {mode !== "forgot" && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mb-4 flex w-full items-center justify-center gap-2 border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            <GoogleIcon /> <T>Continue with Google</T>
          </button>
          <div className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> <T>or</T>{" "}
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
