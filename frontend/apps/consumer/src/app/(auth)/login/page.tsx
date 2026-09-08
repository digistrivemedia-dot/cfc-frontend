"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, FormField, Input, toast } from "@cfc/ui";
import { sendOtp } from "@cfc/mocks";
import { AuthShell } from "@/components/auth-shell";

/**
 * Consumer Screen 3 — Login.
 *
 * Inventory: "Mobile OTP login."
 *
 * Uses the shared AuthShell for the two-column desktop layout.
 * The form itself is dead-simple: one field, one button.
 */

function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

export default function LoginPage() {
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
      router.push(`/otp?from=login&phone=${encodeURIComponent(digits)}`);
    } catch {
      toast.error("Couldn\u2019t send OTP. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      heading="Welcome back"
      subheading="Enter your mobile number to receive a one-time password."
    >
      <form
        id="login-form"
        className="space-y-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <FormField label="Mobile number" required>
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body font-medium text-ink-muted"
              aria-hidden
            >
              +91
            </span>
            <Input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              autoComplete="tel-national"
              className="pl-12"
              aria-label="Mobile number"
            />
          </div>
        </FormField>

        <Button
          id="login-send-otp"
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
              Send OTP
              <ArrowRight className="size-5" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-small text-ink-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Secondary actions */}
      <div className="space-y-4 text-center">
        <div className="text-body text-ink-muted">
          New to CFC?{" "}
          <button
            id="login-go-register"
            type="button"
            className="font-medium text-action hover:text-action-hover"
            onClick={() => router.push("/register")}
          >
            Create an account
          </button>
        </div>
        <button
          id="login-forgot-password"
          type="button"
          className="text-small text-ink-muted hover:text-ink"
          onClick={() => router.push("/forgot-password")}
        >
          Forgot password / changed number?
        </button>
      </div>

      <p className="mt-10 text-center text-caption text-ink-muted">
        By continuing you agree to our{" "}
        <span className="text-action">Terms of Service</span> and{" "}
        <span className="text-action">Privacy Policy</span>
      </p>
    </AuthShell>
  );
}
