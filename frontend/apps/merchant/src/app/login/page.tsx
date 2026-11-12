"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Package, ShieldCheck, Store, Truck } from "lucide-react";
import { Button, Input } from "@cfc/ui";

/**
 * Merchant sign-in (screen 2).
 *
 * Phone and OTP, matching how a Pro signs in: a shop owner has a phone to hand
 * and no interest in remembering a password. The OTP step is revealed in place
 * rather than on a second route, so a mistyped number is corrected without
 * losing the screen.
 *
 * No backend yet — any six digits advance.
 */

const TRUST_MARKS = [
  { icon: Package, label: "Material requests" },
  { icon: Truck, label: "Pickup ready" },
  { icon: ShieldCheck, label: "Verified shops" },
] as const;

const OTP_LENGTH = 6;
const PHONE_LENGTH = 10;

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [stage, setStage] = React.useState<"phone" | "otp">("phone");
  const [error, setError] = React.useState<string | null>(null);

  const onSendOtp = (event: React.FormEvent) => {
    event.preventDefault();
    if (phone.length !== PHONE_LENGTH) {
      setError("Enter the 10-digit mobile number registered to the shop.");
      return;
    }
    setError(null);
    setStage("otp");
  };

  const onVerify = (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel. Hidden on a phone, where it would push the form below
          the fold for no gain. */}
      <aside className="hidden bg-structure p-8 lg:flex lg:w-2/5 lg:flex-col lg:justify-between">
        <span className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-action text-on-action">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-on-structure">
            CFC Merchant
          </span>
        </span>

        <div>
          <h1 className="text-2xl font-semibold leading-tight text-on-structure">
            Supply the materials.
            <br />
            Nothing else to manage.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-on-structure-muted">
            See what a job needs, confirm what you have in stock, and mark it
            ready for the professional to collect. Payment is settled by CFC.
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {TRUST_MARKS.map((mark) => (
            <li
              key={mark.label}
              className="flex items-center gap-2 text-sm text-on-structure-muted"
            >
              <mark.icon className="size-4" aria-hidden="true" />
              {mark.label}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile-only mark, since the brand panel is hidden there. */}
          <span className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-action text-on-action">
              <Store className="size-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink">
              CFC Merchant
            </span>
          </span>

          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {stage === "phone" ? "Sign in" : "Enter the code"}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {stage === "phone"
              ? "We will text a one-time code to your registered number."
              : `Sent to +91 ${phone}.`}
          </p>

          {stage === "phone" ? (
            <form onSubmit={onSendOtp} className="mt-8 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Mobile number
                </label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-touch items-center rounded-md border border-border px-3 text-sm text-ink-muted">
                    +91
                  </span>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="9791964797"
                    value={phone}
                    maxLength={PHONE_LENGTH}
                    onChange={(event) => {
                      setPhone(event.target.value.replace(/\D/g, ""));
                      setError(null);
                    }}
                    aria-invalid={error ? true : undefined}
                  />
                </div>
              </div>

              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full">
                Send code
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="mt-8 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  One-time code
                </label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={otp}
                  maxLength={OTP_LENGTH}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, ""));
                    setError(null);
                  }}
                  aria-invalid={error ? true : undefined}
                  
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full">
                Verify and sign in
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStage("phone");
                  setOtp("");
                  setError(null);
                }}
                className="w-full text-sm text-action hover:underline"
              >
                Change number
              </button>
            </form>
          )}

          <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
            <Lock className="mt-px size-4 shrink-0" aria-hidden="true" />
            Shops are verified by CFC before they receive requests.{" "}
            <Link href="/register" className="text-action hover:underline">
              Register a shop
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
