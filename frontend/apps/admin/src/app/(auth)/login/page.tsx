"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
} from "lucide-react";
import { ApiError } from "@cfc/types";
import { adminLogin } from "@cfc/mocks";
import { Button, FormField, InlineAlert, Input, cn } from "@cfc/ui";
import { AuthShell } from "@/components/auth-shell";
import { useSession } from "@/lib/actor";

/**
 * Admin 1 — Admin login.
 *
 * Inventory: "Email + password, 2FA support."
 *
 * Real as of Phase 2: a request to `/api/admin/auth/login`, a signed token, and
 * an identity the server decided. Three things the previous version did are
 * gone, and each for a reason worth keeping written down.
 *
 * **The role picker is gone.** It let the person signing in choose between
 * Super Admin, Sub Admin and Area Admin — which is the entire RBAC hole in one
 * segmented control, because a sub-admin would simply pick Super Admin. A role
 * is a property of an account, so it now arrives from the server and this form
 * asks only for credentials.
 *
 * **The area field is gone**, for the same reason. An Area Admin's area is on
 * their record; letting them pick it at sign-in would let them pick someone
 * else's.
 *
 * **The demo credentials are gone.** They were a hardcoded email and password
 * compared in the browser. The Super Admin's credentials now live in the
 * server's `.env` (BACKEND-PLAN.md §0.2) — the one deliberately temporary piece
 * of this phase, and the only one.
 *
 * 2FA is **not built** (§0.2). Rather than keep a code step that accepts
 * `123456` — the same lie as §2.2's *"a switch claiming to be on"* — the step
 * is driven by the server's `twoFactorRequired`, which is false until TOTP
 * exists. The UI is kept so enrolment later needs no rebuild.
 */

type Step = "credentials" | "code" | "verified";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [step, setStep] = React.useState<Step>("credentials");

  // Signing in is what makes the session real; the provider has to re-read it
  // before any screen behind the guard renders, or the dashboard mounts with a
  // null actor and bounces straight back to here.
  const enter = React.useCallback(async () => {
    await refresh();
    router.push("/");
  }, [refresh, router]);

  return (
    <AuthShell
      title={
        step === "code"
          ? "Two-factor authentication"
          : step === "verified"
            ? "Signed in"
            : "Sign in"
      }
      subtitle={
        step === "code"
          ? "Enter the 6-digit code from your authenticator app."
          : step === "verified"
            ? undefined
            : "Use the email your CFC admin account was created with."
      }
    >
      {step === "credentials" && (
        <CredentialsStep
          onSignedIn={(twoFactorRequired) =>
            setStep(twoFactorRequired ? "code" : "verified")
          }
        />
      )}
      {step === "code" && (
        <CodeStep
          onBack={() => setStep("credentials")}
          onDone={() => setStep("verified")}
        />
      )}
      {step === "verified" && (
        <VerifiedStep
          onContinue={() => {
            void enter();
          }}
        />
      )}
    </AuthShell>
  );
}

// -- Step 1 ------------------------------------------------------------------

function CredentialsStep({
  onSignedIn,
}: {
  /** Carries the server's 2FA answer up, so the step order is its decision. */
  onSignedIn: (twoFactorRequired: boolean) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [reveal, setReveal] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = React.useState(false);

  const clear = () => setErrors({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation is still worth doing — it catches an empty field
    // without a round trip — but it is not a check, it is a courtesy. The
    // server validates the same things and does not trust any of this.
    const found: typeof errors = {};
    if (email.trim() === "") found.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      found.email = "That does not look like an email address.";
    if (password === "") found.password = "Enter your password.";

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setErrors({});
    setBusy(true);

    try {
      const session = await adminLogin(email.trim(), password, { remember });
      onSignedIn(session.twoFactorRequired);
    } catch (err) {
      // The server sends one message for a wrong password and for an unknown
      // account, on purpose — distinguishing them would let anyone test which
      // addresses have admin accounts. It is rendered as sent.
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : "Could not sign in. Please try again.",
      });
      setBusy(false);
    }
    // No `setBusy(false)` on success: the form is about to be replaced, and
    // re-enabling the button first lets a second submit through.
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        void submit(e);
      }}
      noValidate
    >
      {errors.form && <InlineAlert tone="critical">{errors.form}</InlineAlert>}

      <div className="space-y-4">
        <FormField
          label="Email"
          required
          {...(errors.email ? { error: errors.email } : {})}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clear();
            }}
            placeholder="you@cfcservice.in"
            icon={<Mail />}
            autoComplete="email"
            autoFocus
          />
        </FormField>

        <FormField
          label="Password"
          required
          {...(errors.password ? { error: errors.password } : {})}
        >
          <Input
            type={reveal ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clear();
            }}
            placeholder="••••••••"
            icon={<Lock />}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide password" : "Show password"}
                aria-pressed={reveal}
                className="rounded-pill text-ink-faint transition-colors duration-fast hover:text-ink"
              >
                {reveal ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            }
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Decides whether closing the tab ends the session — localStorage
            versus sessionStorage — not how long the token lasts. No screen
            states a session length: PLATFORM-FACTS.md lists that under
            "not stated anywhere — do not claim". */}
        <label className="flex cursor-pointer items-center gap-2 text-small text-ink-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded-control border-border-strong text-action"
          />
          Keep me signed in
        </label>
        <Link
          href="/forgot-password"
          className="rounded-pill text-small font-medium text-action hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={busy}
      >
        Sign in
      </Button>
    </form>
  );
}

// -- Step 2 ------------------------------------------------------------------

const LENGTH = 6;

/**
 * The 2FA code step. **Unreachable today** — the server always reports
 * `twoFactorRequired: false` because TOTP is not built (§0.2).
 *
 * Kept, rather than deleted, because the interaction is finished work: paste
 * handling, backspace into the previous box, auto-submit on the last digit.
 * Enrolment later needs a verify endpoint and this screen, not a rebuild.
 *
 * `verify` **throws** instead of checking a code. It used to compare against a
 * hardcoded `123456` in the browser, which is security theatre of exactly the
 * kind the plan's §2.2 catalogues. If 2FA is ever switched on server-side
 * before the endpoint exists, this fails loudly — which is the correct
 * behaviour, and far better than a code field that accepts a constant.
 */
function CodeStep({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const [digits, setDigits] = React.useState<string[]>(
    Array.from({ length: LENGTH }, () => ""),
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const value = digits.join("");
  const complete = value.length === LENGTH;

  React.useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const verify = React.useCallback(
    (code: string) => {
      setBusy(true);
      setError(null);
      void code;
      void onDone;
      // No endpoint to call. Never accept a code the browser checked itself.
      setBusy(false);
      setError(
        "Two-factor authentication is not available yet. Contact your administrator.",
      );
    },
    [onDone],
  );

  const write = (next: string[]) => {
    setDigits(next);
    setError(null);
    // Nobody reaches for a button after typing the last digit. Every OTP field
    // a person has used submits itself.
    const joined = next.join("");
    if (joined.length === LENGTH) verify(joined);
  };

  const handleChange = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (clean === "") {
      write(digits.map((d, idx) => (idx === i ? "" : d)));
      return;
    }
    // A pasted or fast-typed run fills forward rather than keeping only the
    // last character.
    const next = [...digits];
    let cursor = i;
    for (const ch of clean) {
      if (cursor >= LENGTH) break;
      next[cursor] = ch;
      cursor += 1;
    }
    write(next);
    refs.current[Math.min(cursor, LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && digits[i] === "" && i > 0) {
      // Backspace in an empty box deletes the digit before it rather than
      // sitting there doing nothing.
      e.preventDefault();
      setDigits(digits.map((d, idx) => (idx === i - 1 ? "" : d)));
      setError(null);
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (text === "") return;
    e.preventDefault();
    write(Array.from({ length: LENGTH }, (_, idx) => text[idx] ?? ""));
    refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (complete) verify(value);
      }}
    >
      {error && <InlineAlert tone="critical">{error}</InlineAlert>}

      <div
        className="grid grid-cols-6 gap-2"
        onPaste={handlePaste}
        role="group"
        aria-label="Six digit authentication code"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={LENGTH}
            disabled={busy}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            aria-invalid={error !== null}
            className={cn(
              "tabular h-12 w-full min-w-0 rounded-control border text-center",
              "text-heading font-semibold text-ink transition-colors duration-fast sm:text-title",
              "disabled:bg-disabled disabled:text-disabled-ink",
              error
                ? "border-critical"
                : digit !== ""
                  ? "border-action"
                  : "border-border-strong",
            )}
          />
        ))}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!complete}
        loading={busy}
      >
        <KeyRound />
        Verify and sign in
      </Button>

      <p className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-pill text-small text-ink-muted transition-colors duration-fast hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Use a different account
        </button>
      </p>
    </form>
  );
}

// -- Step 3 ------------------------------------------------------------------

function VerifiedStep({ onContinue }: { onContinue: () => void }) {
  React.useEffect(() => {
    const t = window.setTimeout(onContinue, 900);
    return () => window.clearTimeout(t);
  }, [onContinue]);

  return (
    <div className="space-y-3 py-2 text-center" role="status">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-live-subtle text-live">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </span>
      <p className="text-heading font-semibold text-ink">Signed in</p>
      <p className="text-body text-ink-muted">Taking you to the dashboard…</p>
    </div>
  );
}
