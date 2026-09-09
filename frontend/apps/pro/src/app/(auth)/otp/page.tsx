"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";
import {
  OTP_RESEND_SECONDS,
  PRO_OTP_LENGTH,
  getPro,
  sendProOtp,
  verifyProOtp,
} from "@cfc/mocks";
import { Button, OtpInput, toast } from "@cfc/ui";
import {
  OnboardingCard,
  OnboardingShell,
} from "@/components/onboarding-shell";
import { signIn } from "@/lib/pro-session";

/**
 * Pro 4 — verify the number.
 *
 * ## "Auto-read OTP" honestly
 *
 * The inventory asks for auto-read. On Android that is the SMS Retriever API,
 * which is native-only and unavailable to any web app. What the web genuinely
 * offers is two things, both used here:
 *
 *   `autoComplete="one-time-code"` — iOS Safari and Android Chrome both offer
 *   the code from the notification as a keyboard suggestion. One tap, and it
 *   works today with no permission prompt.
 *
 *   **WebOTP**, behind a capability guard. Where `OTPCredential` exists
 *   (Chrome on Android, with an origin-bound SMS) the code fills itself. Where
 *   it does not, nothing is rendered and nothing is promised.
 *
 * What is deliberately *not* here is a fake auto-fill animation. A pro who
 * watches an app pretend to read their SMS and then has to type it anyway has
 * learnt that the app lies about small things. See PRO-OPEN-ITEMS 2.1.
 *
 * ## Where verification leads
 *
 * Three destinations, and getting this wrong is how a returning pro ends up
 * back at the start of registration:
 *
 *   from register → profile setup, continuing the sequence
 *   from login, approved → the dashboard
 *   from login, pending or rejected → the approval screen
 */

export default function ProOtpPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-structure" />}>
      <OtpInner />
    </React.Suspense>
  );
}

function OtpInner() {
  const router = useRouter();
  const params = useSearchParams();

  const digits = (params.get("phone") ?? "").replace(/\D/g, "");
  const fromRegister = params.get("from") === "register";

  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [wrong, setWrong] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(OTP_RESEND_SECONDS);

  // The resend countdown. A wall-clock deadline rather than a decrementing
  // counter, for the same reason as the job-alert ring: a throttled background
  // tab makes a per-tick counter drift.
  const deadlineRef = React.useRef(Date.now() + OTP_RESEND_SECONDS * 1000);
  React.useEffect(() => {
    const tick = () =>
      setSecondsLeft(
        Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)),
      );
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, []);

  const verify = React.useCallback(
    async (value: string) => {
      if (value.length !== PRO_OTP_LENGTH || busy) return;
      setBusy(true);
      setWrong(false);
      try {
        await verifyProOtp(`+91${digits}`, value);

        if (fromRegister) {
          // A new registration continues the sequence. No session yet — the
          // pro has nothing to sign in to until they are approved.
          router.push("/profile-setup");
          return;
        }

        // Signing in. Where they land depends on their approval state, which
        // is why this reads the record rather than assuming the dashboard.
        signIn("pro_0002");
        try {
          const pro = await getPro("pro_0002");
          router.push(
            pro.approvalStatus === "approved" ? "/dashboard" : "/approval",
          );
        } catch {
          router.push("/dashboard");
        }
      } catch {
        setWrong(true);
        setCode("");
        toast.error("That code is not right. Check the SMS and try again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, digits, fromRegister, router],
  );

  /**
   * WebOTP, where the browser has it.
   *
   * Guarded on the API existing rather than on a user-agent string. The abort
   * controller matters: an un-aborted `credentials.get` keeps listening after
   * the pro has navigated away, and on some Android builds that blocks the next
   * request on the same origin.
   */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("OTPCredential" in window)) return;

    const controller = new AbortController();
    let cancelled = false;

    void navigator.credentials
      .get({
        // Not in the DOM lib types yet; the cast is confined to this call.
        otp: { transport: ["sms"] },
        signal: controller.signal,
      } as CredentialRequestOptions)
      .then((credential) => {
        const value = (credential as { code?: string } | null)?.code;
        if (!cancelled && typeof value === "string") {
          setCode(value);
          void verify(value);
        }
      })
      .catch(() => {
        // Aborted, unsupported in practice, or the pro dismissed the prompt.
        // All three are ordinary and none is worth a message.
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [verify]);

  const resend = async () => {
    try {
      await sendProOtp(`+91${digits}`);
      deadlineRef.current = Date.now() + OTP_RESEND_SECONDS * 1000;
      setSecondsLeft(OTP_RESEND_SECONDS);
      toast.success("Code sent again.");
    } catch {
      toast.error("Could not resend the code. Check your connection.");
    }
  };

  return (
    <OnboardingShell
      heading="Enter the code"
      subheading={
        digits === ""
          ? "We have sent you a code by SMS."
          : `Sent by SMS to +91 ${digits.slice(0, 5)} ${digits.slice(5)}.`
      }
      {...(fromRegister ? { step: "otp" as const } : {})}
      backHref={fromRegister ? "/register" : "/login"}
    >
      <OnboardingCard>
        <OtpInput
          value={code}
          onChange={(next) => {
            setCode(next);
            setWrong(false);
          }}
          length={PRO_OTP_LENGTH}
          // The code was sent to THIS device, so the browser's suggestion is
          // the right one — unlike Pro 18, where the code belongs to the
          // customer standing in front of the pro.
          autoComplete="one-time-code"
          onComplete={(value) => void verify(value)}
          disabled={busy}
          invalid={wrong}
          label="Verification code"
        />

        {wrong && (
          <p className="mt-2 text-caption text-critical-ink">
            That code is not right. Codes expire, so use the most recent SMS.
          </p>
        )}

        <Button
          size="pro"
          className="mt-4 w-full"
          disabled={code.length !== PRO_OTP_LENGTH || busy}
          onClick={() => void verify(code)}
        >
          {busy ? "Verifying…" : "Verify"}
          {!busy && <ArrowRight />}
        </Button>

        <div className="mt-4 text-center">
          {secondsLeft > 0 ? (
            <p className="tabular text-caption text-ink-muted">
              Resend the code in {secondsLeft}s
            </p>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => void resend()}>
              Resend the code
            </Button>
          )}
        </div>
      </OnboardingCard>

      <p className="mt-4 flex items-start gap-2 text-caption text-on-structure-faint">
        <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
        Not arriving? Check the number is right, and that you have signal. The
        SMS can take up to a minute.
      </p>
    </OnboardingShell>
  );
}
