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
 * Consumer Screen 4 — Register.
 *
 * Inventory: "Name, mobile, area registration."
 */

function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

/** `80000 00000`, matching /login. Display only - state stays raw digits. */
function formatPhone(digits: string): string {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const { signedIn } = useSession();

  // A customer who is already signed in has no business on a sign-in form.
  // Sent home rather than shown a screen that asks them to prove who they
  // already are.
  React.useEffect(() => {
    // `/` renders the signed-in home for a signed-in customer.
    if (signedIn) router.replace("/");
  }, [signedIn, router]);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [area, setArea] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const digits = normalisePhone(phone);
  const isValid =
    name.trim().length >= 2 && digits.length === 10 && area.trim().length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    try {
      sessionStorage.setItem("cfc_reg_name", name.trim());
      sessionStorage.setItem("cfc_reg_area", area.trim());
      await sendOtp(`+91${digits}`);
      router.push(`/otp?from=register&phone=${encodeURIComponent(digits)}`);
    } catch {
      toast.error("Couldn\u2019t send OTP. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      heading="Create your account"
      subheading="Book a verified professional in a few taps."
      backHref="/login"
      backLabel="Back to login"
    >
      <form
        id="register-form"
        className="space-y-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <FormField label="Full name" required>
          <Input
            id="register-name"
            type="text"
            placeholder="e.g. Priya Venkatesh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Mobile number" required>
          <div className="relative">
            {/* matches /login: a divided cell, not grey text floating inside
                the field - the code is fixed and cannot be edited away */}
            <span
              className="pointer-events-none absolute inset-y-px left-px flex items-center rounded-l-control border-r border-border bg-action-subtle px-3 text-body font-bold text-action"
              aria-hidden
            >
              +91
            </span>
            <Input
              id="register-phone"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={formatPhone(digits)}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
              autoComplete="tel-national"
              className="pl-16 text-body font-semibold tracking-wide"
              aria-label="Mobile number"
            />
          </div>
        </FormField>

        <FormField
          label="Your area"
          required
          help={"We\u2019ll show you nearby professionals"}
        >
          <Input
            id="register-area"
            type="text"
            placeholder={"e.g. Srirangam, Thillai Nagar\u2026"}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            autoComplete="address-level3"
          />
        </FormField>

        <Button
          id="register-submit"
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
              Continue
              <ArrowRight className="size-5" />
            </>
          )}
        </Button>
      </form>

      {/* Divider, as on /login, so the two screens read as one flow rather
          than two differently-built forms. */}
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-small text-ink-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="text-center text-body text-ink-muted">
        Already have an account?{" "}
        <button
          id="register-go-login"
          type="button"
          className="font-bold text-promo underline-offset-2 hover:underline"
          onClick={() => router.push("/login")}
        >
          Log in
        </button>
      </div>

      {/* real links - these were teal spans that did nothing */}
      <p className="mt-8 text-center text-caption text-ink-muted">
        By registering you agree to our{" "}
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
