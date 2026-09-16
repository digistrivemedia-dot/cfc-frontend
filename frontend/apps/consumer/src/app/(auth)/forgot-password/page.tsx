"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, FormField, Input, toast } from "@cfc/ui";
import { sendOtp } from "@cfc/mocks";
import { AuthShell } from "@/components/auth-shell";

/**
 * Consumer Screen 6 — Forgot Password / Number Change.
 *
 * Inventory: "Reset via OTP."
 */

function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

/** `80000 00000`, matching /login. Display only - state stays raw digits. */
function formatPhone(digits: string): string {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const digits = normalisePhone(phone);
  const isValid = digits.length === 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await sendOtp(`+91${digits}`);
      toast.success("OTP sent to +91 " + digits);
      router.push(
        `/otp?from=forgot-password&phone=${encodeURIComponent(digits)}`,
      );
    } catch {
      toast.error("Couldn\u2019t send OTP. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      heading="Reset your access"
      subheading={"Enter your registered mobile number and we\u2019ll send you a verification code."}
      backHref="/login"
      backLabel="Back to login"
    >
      {/* Informational, not a warning. Nothing has gone wrong - this explains
          that the platform has no passwords at all. It was amber-on-amber,
          which reads as an error and is the wrong signal for the first thing
          on the screen. Teal wash with a left rule: the approved design's
          treatment for a quiet aside. */}
      <div className="mb-6 rounded-control border-l-4 border-action bg-action-subtle px-4 py-3">
        <p className="text-small text-ink-muted">
          <span className="font-bold text-promo">{"Note\u00a0\u2014\u00a0"}</span>
          {"CFC uses mobile OTP for login. There\u2019s no separate password."}
        </p>
      </div>

      <form
        id="forgot-password-form"
        className="space-y-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <FormField label="Registered mobile number" required>
          <div className="relative">
            {/* matches /login and /register */}
            <span
              className="pointer-events-none absolute inset-y-px left-px flex items-center rounded-l-control border-r border-border bg-action-subtle px-3 text-body font-bold text-action"
              aria-hidden
            >
              +91
            </span>
            <Input
              id="forgot-phone"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={formatPhone(digits)}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
              autoComplete="tel-national"
              className="pl-16 text-body font-semibold tracking-wide"
              aria-label="Registered mobile number"
            />
          </div>
        </FormField>

        <Button
          id="forgot-send-otp"
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!isValid || loading}
        >
          {loading ? (
            "Sending OTP\u2026"
          ) : (
            <>
              Send verification code
              <ArrowRight className="size-5" />
            </>
          )}
        </Button>
      </form>

      {/* divider + link, matching /login and /register so all three read as
          one flow */}
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-small text-ink-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="text-center text-body text-ink-muted">
        Remember your account?{" "}
        <button
          id="forgot-go-login"
          type="button"
          className="font-semibold text-action underline-offset-2 hover:underline"
          onClick={() => router.push("/login")}
        >
          Log in
        </button>
      </div>
    </AuthShell>
  );
}
