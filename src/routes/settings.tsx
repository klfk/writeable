import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Star } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "@/lib/user-data.functions";
import { T, useAutoT } from "@/lib/useAutoT";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings · Writable" },
      {
        name: "description",
        content: "Manage your Writable account, profile, and learning plugins.",
      },
    ],
  }),
});

function SectionCard({
  title,
  children,
  titleClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
}) {
  const t = useAutoT(title);
  return (
    <section className="border border-border bg-card">
      <div className={`border-b border-border px-5 py-3 ${titleClassName}`}>
        <h2 className="text-sm font-semibold">{t}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useAutoT(label);
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-foreground">{t}</div>
      {children}
    </label>
  );
}

const inputCls =
  "w-full border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-teal";

function TealButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`bg-teal px-4 py-2 text-sm font-medium text-teal-foreground hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        on ? "bg-teal" : "bg-muted-foreground/40"
      }`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition-[left] ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="mt-1 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < count ? "fill-teal text-teal" : "fill-transparent text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

function SettingsPage() {
  const {
    plugins,
    togglePlugin,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    nativeLanguage,
    setNativeLanguage,
    learnerType,
    setLearnerType,
    learningReason,
    setLearningReason,
  } = useSettings();

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const getProfile_fn = useServerFn(getMyProfile);
  const updateProfile_fn = useServerFn(updateMyProfile);
  const deleteAccount_fn = useServerFn(deleteMyAccount);

  const [accountStatus, setAccountStatus] = useState<null | { kind: "ok" | "err"; msg: string }>(
    null,
  );
  const [pwStatus, setPwStatus] = useState<null | { kind: "ok" | "err"; msg: string }>(null);
  const [emailStatus, setEmailStatus] = useState<null | { kind: "ok" | "err"; msg: string }>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Hydrate profile fields from the cloud on sign-in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void getProfile_fn().then((p) => {
      if (cancelled || !p) return;
      if (p.first_name) setFirstName(p.first_name);
      if (p.last_name) setLastName(p.last_name);
      if (p.native_language) setNativeLanguage(p.native_language);
      if (p.learner_type) setLearnerType(p.learner_type);
      if (p.learning_reason != null) setLearningReason(p.learning_reason);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const saveAccount = async () => {
    setAccountStatus(null);
    if (!user) {
      setAccountStatus({ kind: "err", msg: "Sign in to save your profile to the cloud." });
      return;
    }
    try {
      await updateProfile_fn({
        data: {
          first_name: firstName || null,
          last_name: lastName || null,
          native_language: nativeLanguage || null,
          learner_type: learnerType || null,
          learning_reason: learningReason || null,
        },
      });
      setAccountStatus({ kind: "ok", msg: "Saved." });
    } catch (e) {
      setAccountStatus({ kind: "err", msg: e instanceof Error ? e.message : "Failed to save." });
    }
  };

  const changeEmail = async () => {
    setEmailStatus(null);
    if (!user) return setEmailStatus({ kind: "err", msg: "Sign in first." });
    if (!newEmail.trim()) return;
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setEmailStatus({ kind: "ok", msg: "Confirmation email sent to the new address." });
      setNewEmail("");
    } catch (e) {
      setEmailStatus({ kind: "err", msg: e instanceof Error ? e.message : "Failed" });
    }
  };

  const changePassword = async () => {
    setPwStatus(null);
    if (!user) return setPwStatus({ kind: "err", msg: "Sign in first." });
    if (newPw.length < 8) return setPwStatus({ kind: "err", msg: "At least 8 characters." });
    if (newPw !== confirmPw) return setPwStatus({ kind: "err", msg: "Passwords don't match." });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwStatus({ kind: "ok", msg: "Password updated." });
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setPwStatus({ kind: "err", msg: e instanceof Error ? e.message : "Failed" });
    }
  };

  const removeAccount = async () => {
    if (!user) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteAccount_fn();
      await supabase.auth.signOut();
      void navigate({ to: "/" });
    } catch (e) {
      setAccountStatus({ kind: "err", msg: e instanceof Error ? e.message : "Failed" });
    }
  };

  const emailPlaceholder = useAutoT("Change email address");
  const pwPlaceholder = useAutoT("at least 8 characters");
  const pwRepeatPlaceholder = useAutoT("repeat");
  const selectPlaceholder = useAutoT("Select…");
  const optLearner = useAutoT("A learner of English");
  const optTeacher = useAutoT("A teacher of English");
  const optNative = useAutoT("A native English speaker");
  const langEnglish = useAutoT("English");
  const langSpanish = useAutoT("Spanish");
  const langFrench = useAutoT("French");
  const langGerman = useAutoT("German");
  const langRussian = useAutoT("Russian");
  const langMandarin = useAutoT("Mandarin");
  const tStatusOk = useAutoT(accountStatus?.msg ?? "");
  const tEmailStatus = useAutoT(emailStatus?.msg ?? "");
  const tPwStatus = useAutoT(pwStatus?.msg ?? "");

  return (
    <div className="px-10 pb-16 pt-12">
      <h1 className="mb-6 text-3xl font-normal text-foreground">
        <T>Settings</T>
      </h1>

      {!authLoading && !user && (
        <div className="mb-6 max-w-6xl border border-teal/40 bg-teal-soft px-5 py-3 text-sm text-foreground">
          <T>You're not signed in — profile changes stay on this device only.</T>{" "}
          <Link to="/auth" className="font-semibold text-teal hover:underline">
            <T>Sign in to sync</T>
          </Link>
          .
        </div>
      )}

      <div className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        {/* Account */}
        <SectionCard title="Account">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input
                className={inputCls}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Field>
            <Field label="Last name">
              <input
                className={inputCls}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>
            <Field label="What is your first language?">
              <select
                className={inputCls}
                value={nativeLanguage || ""}
                onChange={(e) => setNativeLanguage(e.target.value)}
              >
                <option value="">{selectPlaceholder}</option>
                <option value="English">{langEnglish}</option>
                <option value="Spanish">{langSpanish}</option>
                <option value="French">{langFrench}</option>
                <option value="German">{langGerman}</option>
                <option value="Russian">{langRussian}</option>
                <option value="Mandarin">{langMandarin}</option>
              </select>
            </Field>
            <Field label="Which best describes you?">
              <select
                className={inputCls}
                value={learnerType || ""}
                onChange={(e) => setLearnerType(e.target.value)}
              >
                <option value="">{selectPlaceholder}</option>
                <option>{optLearner}</option>
                <option>{optTeacher}</option>
                <option>{optNative}</option>
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="What is your main reason for learning English?">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                maxLength={140}
                value={learningReason}
                onChange={(e) => setLearningReason(e.target.value)}
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {learningReason.length}/140
              </div>
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            {accountStatus && (
              <span
                className={`text-xs ${accountStatus.kind === "ok" ? "text-teal" : "text-destructive"}`}
              >
                {tStatusOk}
              </span>
            )}
            <TealButton onClick={saveAccount}>
              <T>Save →</T>
            </TealButton>
          </div>
        </SectionCard>

        {/* Email */}
        <SectionCard title="Email">
          {user ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-foreground">{user.email}</span>
                <span className="bg-[color:var(--badge-new)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <T>Main email address</T>
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder={emailPlaceholder}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={inputCls}
                />
                <TealButton className="shrink-0" onClick={changeEmail}>
                  <T>Update</T>
                </TealButton>
              </div>
              {emailStatus && (
                <div
                  className={`mt-2 text-xs ${emailStatus.kind === "ok" ? "text-teal" : "text-destructive"}`}
                >
                  {tEmailStatus}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-teal hover:underline">
                <T>Sign in</T>
              </Link>{" "}
              <T>to manage your email.</T>
            </p>
          )}
        </SectionCard>

        {/* Plugins */}
        <SectionCard title="Plugins">
          <p className="text-xs text-muted-foreground">
            <T>Enable or disable learning plugins. Changes apply instantly.</T>
          </p>

          <ul className="mt-3 divide-y divide-border">
            {plugins.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">
                    <T>{p.title}</T>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    <T>{p.description}</T>
                  </div>
                  {p.dependsOn && p.dependsOn.length > 0 && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      <T>Requires Correction Cards.</T>
                    </div>
                  )}
                  <Stars count={p.stars} />
                </div>
                <Toggle on={p.enabled} onChange={() => togglePlugin(p.id)} />
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Password */}
        <SectionCard title="Password">
          {user ? (
            <>
              <div className="flex flex-col gap-4">
                <Field label="New password">
                  <input
                    type="password"
                    placeholder={pwPlaceholder}
                    className={inputCls}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                </Field>
                <Field label="Confirm password">
                  <input
                    type="password"
                    placeholder={pwRepeatPlaceholder}
                    className={inputCls}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                {pwStatus && (
                  <span
                    className={`text-xs ${pwStatus.kind === "ok" ? "text-teal" : "text-destructive"}`}
                  >
                    {tPwStatus}
                  </span>
                )}
                <TealButton onClick={changePassword}>
                  <T>Change password</T>
                </TealButton>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-teal hover:underline">
                <T>Sign in</T>
              </Link>{" "}
              <T>to change your password.</T>
            </p>
          )}
        </SectionCard>

        {/* Remove account */}
        {user && (
          <section className="border border-border bg-card">
            <div className="border-b border-border bg-[#e07070] px-5 py-3">
              <h2 className="text-sm font-semibold text-white">
                <T>Remove account</T>
              </h2>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-foreground">
                <T>You can remove your account at any time. If you do this:</T>
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                <li>
                  <T>Your profile will be removed.</T>
                </li>
                <li>
                  <T>Your saved writing will be deleted from the cloud.</T>
                </li>
                <li>
                  <T>Your account can no longer be signed in to.</T>
                </li>
              </ul>
              <div className="mt-4 flex items-center justify-end gap-3">
                {confirmDelete && (
                  <span className="text-xs text-destructive">
                    <T>Click again to confirm — this can't be undone.</T>
                  </span>
                )}
                <button
                  onClick={removeAccount}
                  className="flex items-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
                >
                  <Trash2 className="h-4 w-4" />
                  {confirmDelete ? <T>Really remove my account</T> : <T>Yes! Remove my account</T>}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
