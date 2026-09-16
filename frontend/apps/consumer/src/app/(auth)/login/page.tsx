"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, FormField, Input, toast } from "@cfc/ui";
import { sendOtp } from "@cfc/mocks";
import { AuthShell } from "@/components/auth-shell";
import { useSession } from "@/lib/session";

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

/**
 * `80000 00000` - the way an Indian mobile number is read aloud and printed.
 *
 * Ten unbroken digits are genuinely hard to check for a typo, and the
 * placeholder already showed a grouped number, so what a customer typed did
 * not match the example they were given. Only the DISPLAY is grouped: state
 * stays as raw digits, so `sendOtp` still receives +91XXXXXXXXXX.
 */
function formatPhone(digits: string): string {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export default function LoginPage() {
  const router = useRouter();
  const { signedIn } = useSession();

  // A customer who is already signed in has no business on a sign-in form.
  // Sent home rather than shown a screen that asks them to prove who they
  // already are.
  React.useEffect(() => {
    // `/` renders the signed-in home for a signed-in customer.
    if (signedIn) router.replace("/");
  }, [signedIn, router]);
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
      subheading="Enter your mobile number to receive a one-time code."
    >
      <form
        id="login-form"
        className="space-y-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <FormField label="Mobile number" required>
          <div className="relative">
            {/* The country code sits in its own divided cell rather than
                floating as grey text inside the field. It is fixed and
                unerasable, so it reads as part of the control, not as
                something already typed. */}
            <span
              className="pointer-events-none absolute inset-y-px left-px flex items-center rounded-l-control border-r border-border bg-action-subtle px-3 text-body font-bold text-action"
              aria-hidden
            >
              +91
            </span>
            <Input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              // Grouped for reading; `digits` above stays the source of truth.
              value={formatPhone(digits)}
              onChange={(e) => setPhone(e.target.value)}
              // 11, not 10: the displayed value carries a space. At 10 the
              // last digit could not be typed once the group separator
              // appeared.
              maxLength={11}
              autoComplete="tel-national"
              // clears the +91 cell, and tracks the digits so a phone number
              // reads as a number rather than as running text
              className="pl-16 text-body font-semibold tracking-wide"
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
          {/* font-semibold to match the weight the approved design gives every
              teal link. At font-medium on a 2:1-contrast teal it was the
              faintest thing on the card. */}
          <button
            id="login-go-register"
            type="button"
            className="font-bold text-promo underline-offset-2 hover:underline"
            onClick={() => router.push("/register")}
          >
            Create an account
          </button>
        </div>
        {/* "Forgot password?" was wrong: this platform has no passwords, and
            the screen it opens says so in its first paragraph. The link is
            really for someone who has lost access to their number.

            Full ink weight, not muted. Someone locked out of their number is
            the most stuck person who reaches this screen, and this was the
            faintest thing on the card - grey and small, directly beneath a
            bold orange link that pulled the eye away from it. */}
        <button
          id="login-forgot-password"
          type="button"
          className="text-small font-semibold text-ink underline-offset-2 hover:text-action hover:underline"
          onClick={() => router.push("/forgot-password")}
        >
          Can&rsquo;t access your number?
        </button>
      </div>

      {/* Real links. These were teal <span>s - styled exactly like the links
          beside them but doing nothing, which is worse than plain text: it
          offers the terms and then refuses to show them. Both routes exist. */}
      <p className="mt-8 text-center text-caption text-ink-muted">
        By continuing you agree to our{" "}
        <Link
          href="/legal/terms"
          className="font-semibold text-ink underline-offset-2 hover:text-action hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/legal/privacy"
          className="font-semibold text-ink underline-offset-2 hover:text-action hover:underline"
        >
          Privacy Policy
        </Link>
      </p>
    </AuthShell>
  );
}
