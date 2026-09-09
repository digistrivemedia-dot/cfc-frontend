"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getPro } from "@cfc/mocks";
import { usePrefersReducedMotion } from "@cfc/ui";
import { Logo } from "@/components/logo";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 1 — Splash.
 *
 * A routing decision with a brand moment over it, not a screen a pro looks at.
 * It resolves three cases:
 *
 *   never signed in    → onboarding (Phase 9)
 *   KYC still pending  → the approval screen; the app proper is not usable yet
 *   approved           → the dashboard
 *
 * The gate matters: `/` redirects here unconditionally, so without it a
 * returning pro would sit through a branded interstitial on every single visit.
 * That was a real flaw in the consumer app's first version.
 *
 * The approval check is the reason this is not a static redirect. A pro whose
 * documents are still being reviewed must not land on a dashboard offering jobs
 * they cannot legally accept.
 */

/** Long enough to read the mark, short enough not to be in the way. */
const HOLD_MS = 900;

export default function ProSplashPage() {
  const router = useRouter();
  const reduceMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    let cancelled = false;

    const decide = async () => {
      let destination = "/dashboard";
      try {
        const pro = await getPro(currentProId());
        if (pro.approvalStatus !== "approved") destination = "/approval";
        else if (pro.blocked) destination = "/warnings";
      } catch {
        // No session, or the fetch failed. Onboarding is the safe landing —
        // it cannot show data that does not exist.
        destination = "/onboarding";
      }
      if (!cancelled) router.replace(destination);
    };

    // The hold and the fetch run together, so the splash is never longer than
    // whichever of the two takes more time.
    const timer = window.setTimeout(
      () => void decide(),
      reduceMotion ? 0 : HOLD_MS,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router, reduceMotion]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-structure px-6">
      <div className="flex flex-col items-center">
        <Logo className="size-emblem text-brand" />
        <h1 className="mt-6 text-title font-semibold tracking-tight text-on-structure">
          CFC Pro
        </h1>
        <p className="mt-2 text-small text-on-structure-muted">
          Manage jobs. Track earnings. Get paid daily.
        </p>
      </div>

      {/* A live region rather than a spinner: a screen reader should hear that
          something is happening, and a spinner conveys nothing it can read. */}
      <p role="status" className="mt-12 text-caption text-on-structure-faint">
        Loading your account…
      </p>
    </main>
  );
}
