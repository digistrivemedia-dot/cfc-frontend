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
      // Login had NO back control at all - Register and Forgot Password both
      // set one, this did not. Someone who reached this screen and changed
      // their mind had no way out except the browser's back button.
      backHref="/"
      backLabel="Back to home"
      // Titles only left the three cards looking hollow - a bold line and
      // nothing under it, in a card sized for more. They carry the same
      // explanations /register does.
      //
      // The four-item row is off here. With three detailed cards the panel
      // already reaches the login card's height, and the extra row ran past
      // its bottom edge.
      showExtras={false}
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

      {/* ONE ORDER, NOT FOUR COMPETING BLOCKS.

          Under the button sat: a dark link, a rule, a teal link, then legal
          text - four separate stacks at three different sizes, each with its
          own margin, reading as a list of afterthoughts.

          Now: the recovery link directly under the form because the person who
          needs it is the most stuck person on this screen; then one rule; then
          the cross-link; then legal, visibly last at caption size. */}
      <p className="mt-4 text-center">
        <button
          id="login-forgot-password"
          type="button"
          className={
            // M2 - measured 170x18. Standalone on its own line, so it can
            // take a full 44px box.
            "text-small font-semibold text-ink underline-offset-2 hover:text-action hover:underline coarse:inline-flex coarse:h-touch coarse:items-center coarse:justify-center coarse:px-3"
          }
          onClick={() => router.push("/forgot-password")}
        >
          Can&rsquo;t access your number?
        </button>
      </p>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <p className="text-small text-ink-muted">
          New to CFC?{" "}
          <button
            id="login-go-register"
            type="button"
            className={
              // M2 - measured 37x18 on /register, the smallest target in the
              // app and the only route back to Log in. It sits INSIDE a
              // sentence, so it cannot become a 44px block without breaking
              // the line; vertical padding grows the hit box instead and
              // `inline-block` makes that padding count.
              "font-bold text-action underline-offset-2 hover:underline coarse:inline-block coarse:py-3"
            }
            onClick={() => router.push("/register")}
          >
            Create an account
          </button>
        </p>

        {/* Real links. These were teal <span>s - styled exactly like the links
            beside them but doing nothing, which is worse than plain text: it
            offers the terms and then refuses to show them. */}
        <p className="mt-3 text-caption leading-relaxed text-ink-faint">
          By continuing you agree to our{" "}
          <Link
            href="/legal/terms"
            className="font-semibold text-ink-muted underline-offset-2 hover:text-action hover:underline coarse:inline-block coarse:py-2"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="font-semibold text-ink-muted underline-offset-2 hover:text-action hover:underline coarse:inline-block coarse:py-2"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
