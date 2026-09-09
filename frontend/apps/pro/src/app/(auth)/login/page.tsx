"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";
import { sendProOtp } from "@cfc/mocks";
import { Button, FormField, Input, toast } from "@cfc/ui";
import {
  OnboardingCard,
  OnboardingShell,
} from "@/components/onboarding-shell";

/**
 * Pro 2 — sign in.
 *
 * "Mobile OTP login." One field, because that is genuinely all it needs — a
 * pro's number is their account, and there is no password to lose.
 *
 * ## No step bar here
 *
 * Signing in is not step one of six. Showing progress on this screen would tell
 * a returning pro they are at the start of a registration they finished months
 * ago. The bar appears from Pro 3 onward.
 *
 * ## The phone field is doing real work
 *
 * `type="tel"`, `inputMode="numeric"` and `autoComplete="tel"` between them get
 * a pro the numeric keypad and their own number offered by the browser. Getting
 * this wrong means an alphabetic keyboard for a ten-digit entry, which is the
 * single most common way a mobile form wastes someone's time.
 */

export default function ProLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const digits = phone.replace(/\D/g, "");
  const valid = digits.length === 10;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await sendProOtp(`+91${digits}`);
      router.push(`/otp?phone=${encodeURIComponent(digits)}&from=login`);
    } catch {
      toast.error("Could not send the code. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      heading="Sign in to CFC Pro"
      subheading="Enter your mobile number and we will send you a code."
    >
      <OnboardingCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <FormField
            label="Mobile number"
            htmlFor="phone"
            required
            {...(phone !== "" && !valid
              ? { error: "Enter your 10-digit mobile number." }
              : {})}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-touch shrink-0 items-center rounded-control border border-border bg-canvas px-3 tabular text-body text-ink-muted">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="90000 12345"
                className="min-w-0 flex-1 tabular"
              />
            </div>
          </FormField>

          <Button
            type="submit"
            size="pro"
            className="mt-4 w-full"
            disabled={!valid || busy}
          >
            {busy ? "Sending code…" : "Send code"}
            {!busy && <ArrowRight />}
          </Button>
        </form>
      </OnboardingCard>

      <p className="mt-4 text-center text-small text-on-structure-muted">
        New to CFC?{" "}
        <Link
          href="/onboarding"
          className="font-medium text-brand hover:underline"
        >
          Join as a professional
        </Link>
      </p>

      {/* Worth saying: a pro whose account is under review will sign in and
          land on the approval screen rather than the dashboard, and without
          this they would think the sign-in failed. */}
      <p className="mt-6 flex items-start gap-2 text-caption text-on-structure-faint">
        <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
        If your account is still being verified, signing in will show you where
        the review has got to.
      </p>
    </OnboardingShell>
  );
}
