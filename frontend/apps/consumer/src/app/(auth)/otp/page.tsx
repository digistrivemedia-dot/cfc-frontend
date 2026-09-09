"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button, toast } from "@cfc/ui";
import { verifyOtp, sendOtp } from "@cfc/mocks";
import { AuthShell } from "@/components/auth-shell";

/**
 * Consumer Screen 5 — OTP Verification.
 *
 * Inventory: "6-digit OTP, auto-read, resend timer."
 *
 * Shared across login, register, and forgot-password flows.
 * `useSearchParams` requires Suspense — OtpInner is the reactive part.
 */

const AUTO_FILL_CODE = "123456";
const RESEND_SECONDS = 30;

type OtpFrom = "login" | "register" | "forgot-password";

function isValidFrom(s: string | null): s is OtpFrom {
  return s === "login" || s === "register" || s === "forgot-password";
}

const FROM_BACK: Record<OtpFrom, string> = {
  login: "/login",
  register: "/register",
  "forgot-password": "/forgot-password",
};

const FROM_HEADING: Record<OtpFrom, string> = {
  login: "Enter your OTP",
  register: "Verify your number",
  "forgot-password": "Reset via OTP",
};

function OtpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const rawFrom = params.get("from");
  const from: OtpFrom = isValidFrom(rawFrom) ? rawFrom : "login";
  const phone = params.get("phone") ?? "";

  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [resendSeconds, setResendSeconds] = React.useState(RESEND_SECONDS);
  const [resending, setResending] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");
  const isComplete = digits.every((d) => d !== "");

  /* Countdown */
  React.useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendSeconds]);

  /* Auto-fill simulation (mimics SMS auto-read) */
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDigits(AUTO_FILL_CODE.split(""));
      inputRefs.current[5]?.focus();
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  function handleDigit(index: number, value: string) {
    const d = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => prev.map((x, i) => (i === index ? d : x)));
    if (d && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      setDigits(text.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete || loading) return;
    setLoading(true);
    try {
      await verifyOtp(`+91${phone}`, code);
      if (from === "forgot-password") {
        toast.success("Verified. Please log in.");
        router.replace("/login");
      } else {
        try { localStorage.setItem("cfc_onboarding_seen", "true"); } catch { /**/ }
        router.replace("/home");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendSeconds > 0 || resending) return;
    setResending(true);
    try {
      await sendOtp(`+91${phone}`);
      toast.success("OTP resent.");
      setResendSeconds(RESEND_SECONDS);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Couldn\u2019t resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      heading={FROM_HEADING[from]}
      subheading={`We sent a 6-digit code to +91\u00a0${phone}. Auto-filling in a moment\u2026`}
      backHref={FROM_BACK[from]}
      showAssurance={false}
      backLabel="Wrong number? Go back"
    >
      <form
        id="otp-form"
        className="space-y-8"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* 6-box OTP input */}
        <div
          className="flex justify-between gap-2"
          onPaste={handlePaste}
          aria-label="Enter the 6-digit OTP"
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              id={`otp-digit-${i}`}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1} of 6`}
              className={[
                "h-touch flex-1 rounded-control border text-center text-heading font-semibold text-ink",
                "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-action",
                digit
                  ? "border-action bg-action-subtle"
                  : "border-border bg-surface",
              ].join(" ")}
            />
          ))}
        </div>

        {/* Status hint */}
        <p className="text-center text-small text-ink-muted" aria-live="polite">
          {isComplete
            ? "Code ready \u2014 tap Verify to continue"
            : "Waiting for auto-fill\u2026"}
        </p>

        <Button
          id="otp-verify"
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!isComplete || loading}
        >
          {loading ? "Verifying\u2026" : "Verify and continue"}
        </Button>
      </form>

      {/* Resend */}
      <div className="mt-8 text-center">
        {resendSeconds > 0 ? (
          <p className="text-small text-ink-muted">
            Resend OTP in{" "}
            <span className="font-medium text-ink tabular-nums">
              0:{resendSeconds.toString().padStart(2, "0")}
            </span>
          </p>
        ) : (
          <button
            id="otp-resend"
            type="button"
            className="inline-flex items-center gap-1 text-small font-medium text-action hover:text-action-hover disabled:opacity-50"
            onClick={handleResend}
            disabled={resending}
          >
            <RefreshCw className="size-4" />
            {resending ? "Resending\u2026" : "Resend OTP"}
          </button>
        )}
      </div>
    </AuthShell>
  );
}

export default function OtpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-action" />
        </div>
      }
    >
      <OtpInner />
    </React.Suspense>
  );
}
