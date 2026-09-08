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
      subheading="Enter your registered mobile number and we\u2019ll send you a verification code."
      backHref="/login"
      backLabel="Back to login"
    >
      {/* Informational callout */}
      <div className="mb-6 rounded-control border border-border bg-warning-subtle px-4 py-3">
        <p className="text-small text-warning">
          <span className="font-medium">Note\u00a0\u2014\u00a0</span>CFC uses
          mobile OTP for login. There&apos;s no separate password. If
          you&apos;ve changed your number, please contact support.
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
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body font-medium text-ink-muted"
              aria-hidden
            >
              +91
            </span>
            <Input
              id="forgot-phone"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              autoComplete="tel-national"
              className="pl-12"
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

      <p className="mt-8 text-center text-small text-ink-muted">
        Changed your number?{" "}
        <span className="font-medium text-action">Contact support</span>
      </p>

      <button
        id="forgot-go-login"
        type="button"
        className="mt-4 w-full text-center text-small text-ink-muted hover:text-ink"
        onClick={() => router.push("/login")}
      >
        Remember your account?{" "}
        <span className="font-medium text-action">Log in</span>
      </button>
    </AuthShell>
  );
}
