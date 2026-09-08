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
import { Button, Combobox, FormField, InlineAlert, Input, cn } from "@cfc/ui";
import { AuthShell } from "@/components/auth-shell";
import { useSignIn } from "@/lib/actor";

/**
 * Admin 1 — Admin login.
 *
 * Inventory: "Email + password, 2FA support."
 *
 * Frontend only. No session, no token, no network call — the backend team owns
 * all of that. What this screen owes is the interaction, and that is where it
 * was thin: fields that say when they are wrong, a code entry that behaves like
 * every OTP field a person has used, a button that cannot be pressed twice.
 *
 * The role selector lives in the shell rather than in this form: one segmented
 * control above the fields at every width, with the selected role's scope named
 * beneath it. Keeping it in the shell means the form owns only the credentials,
 * and the three-letter tab labels are never the only thing telling someone what
 * they picked.
 *
 * Only Area Admin asks a second question, because only that role is scoped to a
 * place.
 *
 * The demo credentials below stand in for the check the backend team will
 * make. They are not shown on the screen — a client looking at this should see
 * a sign-in screen, not a test harness.
 *
 *   admin@cityfamilycare.in / cfc-admin, then code 123456
 */

const DEMO_EMAIL = "admin@cityfamilycare.in";
const DEMO_PASSWORD = "cfc-admin";
const DEMO_CODE = "123456";

/** Trichy areas an Area Admin can be assigned to. */
const AREAS = [
  { value: "srirangam", label: "Srirangam" },
  { value: "thillai-nagar", label: "Thillai Nagar" },
  { value: "woraiyur", label: "Woraiyur" },
  { value: "kk-nagar", label: "K.K. Nagar" },
  { value: "cantonment", label: "Cantonment" },
  { value: "golden-rock", label: "Golden Rock" },
];

type Step = "credentials" | "code" | "verified";

/**
 * The picker stores slugs; the rest of the platform scopes on the display
 * name. Without this an Area Admin for "srirangam" would match no bookings at
 * all, because every row carries "Srirangam".
 */
function areaLabel(value: string | null): string | undefined {
  if (value === null) return undefined;
  return AREAS.find((a) => a.value === value)?.label;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const [step, setStep] = React.useState<Step>("credentials");
  const [role, setRole] = React.useState("super");
  const [area, setArea] = React.useState<string | null>(null);

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
      {...(step === "credentials"
        ? { role, onRoleChange: setRole }
        : {})}
    >
      {step === "credentials" && (
        <CredentialsStep
          role={role}
          onDone={(picked) => {
            setArea(picked);
            setStep("code");
          }}
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
            // The role picker was previously cosmetic: every session landed as
            // Super Admin whatever was chosen here.
            signIn(role, areaLabel(area));
            router.push("/");
          }}
        />
      )}
    </AuthShell>
  );
}

// -- Step 1 ------------------------------------------------------------------

function CredentialsStep({
  role,
  onDone,
}: {
  role: string;
  /** Carries the area up: only this step knows which one was picked. */
  onDone: (area: string | null) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [reveal, setReveal] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [area, setArea] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    area?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = React.useState(false);

  const scoped = role === "area";
  const clear = () => setErrors({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const found: typeof errors = {};
    if (email.trim() === "") found.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      found.email = "That does not look like an email address.";
    if (password === "") found.password = "Enter your password.";
    if (scoped && area === null) found.area = "Choose the area you manage.";

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setErrors({});
    setBusy(true);

    // Stands in for the request the backend team will make. The delay exists so
    // the button's busy state is a real state and not a single frame.
    window.setTimeout(() => {
      setBusy(false);
      if (
        email.trim().toLowerCase() === DEMO_EMAIL &&
        password === DEMO_PASSWORD
      ) {
        onDone(area);
      } else {
        setErrors({
          form: "That email and password do not match an admin account.",
        });
      }
    }, 600);
  };

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
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
            placeholder={DEMO_EMAIL}
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

        {/* Only an Area Admin is scoped to a place, so only that role is asked.
            The field appears rather than sitting disabled — a control nobody
            can use is worse than one that is not there. */}
        {scoped && (
          <FormField
            label="Area"
            required
            help="You will only see bookings and pros in this area."
            {...(errors.area ? { error: errors.area } : {})}
          >
            <Combobox
              options={AREAS}
              value={area}
              onChange={(v) => {
                setArea(v);
                clear();
              }}
              placeholder="Choose your area"
              searchPlaceholder="Search areas"
              aria-label="Area"
            />
          </FormField>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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
        Continue
      </Button>
    </form>
  );
}

// -- Step 2 ------------------------------------------------------------------

const LENGTH = 6;

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
      window.setTimeout(() => {
        setBusy(false);
        if (code === DEMO_CODE) {
          onDone();
        } else {
          setError("That code is not right. Check your authenticator app.");
          setDigits(Array.from({ length: LENGTH }, () => ""));
          refs.current[0]?.focus();
        }
      }, 600);
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
