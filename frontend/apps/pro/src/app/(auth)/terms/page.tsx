"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  PENALTY_AMOUNTS_NOT_SET,
  acceptTerms,
  getGoldenRules,
  getPenaltyStructure,
  type GoldenRule,
  type PenaltyStep,
} from "@cfc/mocks";
import { Button, Checkbox, Skeleton, cn, toast } from "@cfc/ui";
import { GoldenRules, PenaltyStructure } from "@/components/conduct-rules";
import { OnboardingShell } from "@/components/onboarding-shell";

/**
 * Pro 8 — the Partner Code of Conduct.
 *
 * "CFC Partner Code of Conduct acceptance."
 *
 * ## What a pro is actually agreeing to
 *
 * The three rules are word-for-word the same component Pro 35 renders, because
 * a professional who signs one wording and later reads another has a
 * legitimate grievance — and two copies of a document is precisely how that
 * happens.
 *
 * ## The checkbox is not a formality
 *
 * A single "I agree" over a wall of text is the pattern everyone has learned to
 * click through. This asks for two acknowledgements, and they are the two
 * things that most often surprise a new pro:
 *
 *   that photos, GPS and the customer's code are **required**, not optional
 *   that warnings and deductions are real consequences
 *
 * Splitting them means a pro has to read at least far enough to know what the
 * second one refers to. It is a small friction bought deliberately.
 *
 * ## No invented penalty amounts
 *
 * The agreement names none. The screen says the office sets them per incident
 * — which is true, and better than a fine list a developer made up on a
 * document a professional signs. PRO-OPEN-ITEMS 1.1.
 */

export default function ProTermsPage() {
  const router = useRouter();

  const [rules, setRules] = React.useState<GoldenRule[] | null>(null);
  const [penalties, setPenalties] = React.useState<PenaltyStep[] | null>(null);
  const [proof, setProof] = React.useState(false);
  const [consequences, setConsequences] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([getGoldenRules(), getPenaltyStructure()])
      .then(([r, p]) => {
        if (cancelled) return;
        setRules(r);
        setPenalties(p);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load the terms. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const accepted = proof && consequences;

  const submit = async () => {
    if (!accepted) return;
    setBusy(true);
    try {
      await acceptTerms("pro_new");
      router.push("/approval");
    } catch {
      toast.error("Could not record your acceptance. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      heading="The CFC Partner Code of Conduct"
      subheading="Three rules. They are what customers are promised, and what CFC will hold you to."
      step="terms"
      backHref="/bank-details"
    >
      <div className="space-y-4">
        {rules === null ? (
          <>
            <Skeleton className="h-block-md w-full rounded-card" />
            <Skeleton className="h-block-md w-full rounded-card" />
          </>
        ) : (
          <GoldenRules rules={rules} tone="navy" />
        )}

        {penalties === null ? (
          <Skeleton className="h-block-sm w-full rounded-card" />
        ) : (
          <PenaltyStructure
            steps={penalties}
            amountsNotSet={PENALTY_AMOUNTS_NOT_SET}
            tone="navy"
          />
        )}

        {/* Two acknowledgements, not one. */}
        <section className="rounded-card border border-structure-line bg-structure-raised p-4">
          <ul className="space-y-3">
            <li>
              <label className="flex cursor-pointer items-start gap-3">
                <span className="mt-px shrink-0">
                  <Checkbox
                    checked={proof}
                    onCheckedChange={(v) => setProof(v === true)}
                  />
                </span>
                <span className="min-w-0 text-caption text-on-structure">
                  I understand that photos, my location and the customer’s code
                  are required to complete a job, and that a job cannot be
                  closed without them.
                </span>
              </label>
            </li>
            <li>
              <label className="flex cursor-pointer items-start gap-3">
                <span className="mt-px shrink-0">
                  <Checkbox
                    checked={consequences}
                    onCheckedChange={(v) => setConsequences(v === true)}
                  />
                </span>
                <span className="min-w-0 text-caption text-on-structure">
                  I accept the Code of Conduct, and that breaking it can lead to
                  a warning, a deduction set by the CFC office, or my account
                  being blocked.
                </span>
              </label>
            </li>
          </ul>
        </section>

        <Button
          size="pro"
          className={cn("w-full")}
          disabled={!accepted || busy}
          onClick={() => void submit()}
        >
          {busy ? "Submitting…" : "Accept and submit for review"}
          {!busy && <ArrowRight />}
        </Button>

        {!accepted && (
          <p className="text-center text-caption text-on-structure-muted">
            Read the rules and tick both boxes to continue.
          </p>
        )}

        <p className="text-center text-caption text-on-structure-faint">
          You can read this again any time from your profile.
        </p>
      </div>
    </OnboardingShell>
  );
}
