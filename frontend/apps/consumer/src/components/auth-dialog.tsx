"use client";

import * as React from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { sendOtp, verifyOtp } from "@cfc/mocks";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  cn,
  toast,
} from "@cfc/ui";
import { useSession } from "@/lib/session";

/**
 * Sign in, without leaving the page.
 *
 * Browsing this site is public. A visitor can reach the homepage from a search
 * result, open a service, read what is included and see the price without an
 * account — which is the only way a stranger is ever going to be convinced. An
 * account is asked for at the point of commitment: adding to the cart, or
 * booking.
 *
 * At that moment, sending them to `/login` would throw away the page they were
 * on and whatever they had chosen. So it is raised here instead, over the top,
 * and `onDone` continues the exact action they were trying to take.
 *
 * The full-page screens at `/login`, `/register` and `/otp` still exist — for
 * direct links, password managers, and anyone who navigates there themselves —
 * and share the same mock calls, so the two paths cannot drift apart.
 */

const LENGTH = 6;
const RESEND_SECONDS = 30;
const DEMO_CODE = "123456";

type Step = "phone" | "code";

export function AuthDialog({
  open,
  onOpenChange,
  onDone,
  /** What the customer was doing, so the reason for asking is stated plainly. */
  reason = "Sign in to continue",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  reason?: string | undefined;
}) {
  const { signIn } = useSession();
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");

  // Every open starts clean. A half-entered code from a dismissed attempt
  // reappearing later is confusing and looks broken.
  React.useEffect(() => {
    if (!open) return;
    setStep("phone");
    setPhone("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-detail">
        <DialogHeader>
          <DialogTitle>
            {step === "phone" ? reason : "Enter your code"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "We'll text you a one-time password. No password to remember."
              : `Sent to +91 ${phone}. It fills in automatically on most phones.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <PhoneStep
            onSent={(digits) => {
              setPhone(digits);
              setStep("code");
            }}
          />
        ) : (
          <CodeStep
            phone={phone}
            onBack={() => setStep("phone")}
            onVerified={() => {
              // Persist the session before continuing. Without this the
              // customer verified a code and stayed signed out — the modal
              // closed, the action ran, and the header still said "Log in".
              signIn();
              onOpenChange(false);
              onDone();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function normalise(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

function PhoneStep({ onSent }: { onSent: (digits: string) => void }) {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const digits = normalise(value);
  const valid = digits.length === 10;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await sendOtp(`+91${digits}`);
      onSent(digits);
    } catch {
      toast.error("Couldn't send the code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormField label="Mobile number" required>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body font-medium text-ink-muted"
            aria-hidden="true"
          >
            +91
          </span>
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="98765 43210"
            aria-label="Mobile number"
            className="pl-12"
          />
        </div>
      </FormField>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!valid || busy}
      >
        {busy ? "Sending…" : "Send code"}
        {!busy && <ArrowRight className="size-4" />}
      </Button>

      <p className="text-center text-caption text-ink-muted">
        New to CFC? Entering your number creates your account.
      </p>
    </form>
  );
}

function CodeStep({
  phone,
  onBack,
  onVerified,
}: {
  phone: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const [digits, setDigits] = React.useState<string[]>(
    Array.from({ length: LENGTH }, () => ""),
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [seconds, setSeconds] = React.useState(RESEND_SECONDS);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);


  React.useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const verify = React.useCallback(
    async (value: string) => {
      setBusy(true);
      setError(null);
      try {
        await verifyOtp(`+91${phone}`, value);
        onVerified();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "That code is not right. Try again.",
        );
        setDigits(Array.from({ length: LENGTH }, () => ""));
        refs.current[0]?.focus();
      } finally {
        setBusy(false);
      }
    },
    [phone, onVerified],
  );

  /** Writing the last box submits — nobody reaches for a button after that. */
  const write = (next: string[]) => {
    setDigits(next);
    setError(null);
    const joined = next.join("");
    if (joined.length === LENGTH && !joined.includes("")) void verify(joined);
  };

  const handleChange = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (clean === "") {
      write(digits.map((d, idx) => (idx === i ? "" : d)));
      return;
    }
    // A fast typist or a paste fills forward rather than keeping one character.
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

  return (
    <div className="space-y-4">
      <div
        className="flex justify-between gap-2"
        onPaste={(e) => {
          const text = e.clipboardData.getData("text").replace(/\D/g, "");
          if (!text) return;
          e.preventDefault();
          write(
            Array.from({ length: LENGTH }, (_, idx) => text[idx] ?? ""),
          );
          refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
        }}
        role="group"
        aria-label="Six digit code"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => {
              // Backspace in an empty box clears the one before it, rather
              // than sitting there doing nothing.
              if (e.key === "Backspace" && digits[i] === "" && i > 0) {
                e.preventDefault();
                setDigits(digits.map((d, idx) => (idx === i - 1 ? "" : d)));
                setError(null);
                refs.current[i - 1]?.focus();
              }
            }}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={LENGTH}
            disabled={busy}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            aria-invalid={error !== null}
            className={cn(
              "tabular h-touch-lg w-full min-w-0 rounded-control border text-center",
              "text-title font-semibold text-ink",
              "transition-colors duration-fast",
              "focus:outline-none focus-visible:outline-focus",
              "disabled:bg-neutral-subtle",
              error
                ? "border-critical"
                : digit !== ""
                  ? "border-action"
                  : "border-border-strong",
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-small text-critical-ink" role="alert">
          {error}
        </p>
      )}

      <p className="text-center text-caption text-ink-muted">
        For this demo the code is{" "}
        <span className="tabular font-semibold text-ink">{DEMO_CODE}</span>
      </p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "rounded-control text-small text-ink-muted",
            "transition-colors duration-fast hover:text-ink",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          Change number
        </button>

        {seconds > 0 ? (
          <span className="text-small text-ink-muted">
            Resend in{" "}
            <span className="tabular font-medium text-ink">0:{String(seconds).padStart(2, "0")}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              void sendOtp(`+91${phone}`);
              toast.success("Code resent.");
              setSeconds(RESEND_SECONDS);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-control text-small font-medium text-action",
              "transition-colors duration-fast hover:text-action-hover",
              "focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
