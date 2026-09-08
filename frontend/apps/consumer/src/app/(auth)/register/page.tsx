"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, FormField, Input, toast } from "@cfc/ui";
import { sendOtp } from "@cfc/mocks";
import { AuthShell } from "@/components/auth-shell";

/**
 * Consumer Screen 4 — Register.
 *
 * Inventory: "Name, mobile, area registration."
 */

function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

export default function RegisterPage() {
  const router = useRouter();
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
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body font-medium text-ink-muted"
              aria-hidden
            >
              +91
            </span>
            <Input
              id="register-phone"
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

        <FormField
          label="Your area"
          required
          help="We\u2019ll show you nearby professionals"
        >
          <Input
            id="register-area"
            type="text"
            placeholder="e.g. Srirangam, Thillai Nagar\u2026"
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

      <div className="mt-8 text-center text-body text-ink-muted">
        Already have an account?{" "}
        <button
          id="register-go-login"
          type="button"
          className="font-medium text-action hover:text-action-hover"
          onClick={() => router.push("/login")}
        >
          Log in
        </button>
      </div>

      <p className="mt-6 text-center text-caption text-ink-muted">
        By registering you agree to our{" "}
        <span className="text-action">Terms of Service</span> and{" "}
        <span className="text-action">Privacy Policy</span>
      </p>
    </AuthShell>
  );
}
