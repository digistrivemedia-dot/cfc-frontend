"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Phone,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { SUPPORT_HOURS, SUPPORT_PHONE, getApprovalState } from "@cfc/mocks";
import type { ApprovalState } from "@cfc/mocks";
import { Badge, Button, Skeleton, cn } from "@cfc/ui";
import { OnboardingShell } from "@/components/onboarding-shell";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 9 — approval pending.
 *
 * "Waiting for Admin KYC verification."
 *
 * The screen a pro sits on for hours or days, and the one most likely to
 * generate a support call. So it answers the three questions that call would
 * ask, in order:
 *
 *   **Where has it got to?** Per-document status, not one global spinner. A pro
 *   whose Aadhaar is approved and whose selfie was rejected needs to know that
 *   — a single "under review" tells them nothing and a single "rejected" makes
 *   them re-do all four.
 *
 *   **How long?** The agreement gives no KYC turnaround time, so this does not
 *   invent one. It says what happens rather than when, and gives the helpline
 *   with its hours. Promising "within 24 hours" against no documented
 *   commitment would be a developer inventing an SLA.
 *
 *   **What do I do now?** Nothing, if it is pending — said explicitly, because
 *   a pro staring at a screen with no action assumes they have missed a step.
 *   If a document was rejected, the specific one and the reason.
 *
 * ## No step bar
 *
 * The sequence is finished. Showing "step 6 of 6" on a screen where the pro is
 * waiting on someone else would imply there is a seventh thing for them to do.
 */

export default function ProApprovalPage() {
  const proId = React.useMemo(() => currentProId(), []);
  const [state, setState] = React.useState<ApprovalState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setFailed(false);
    let cancelled = false;
    void getApprovalState(proId)
      .then((s) => {
        if (!cancelled) {
          setState(s);
          setLoading(false);
        }
      })
      .catch(() => {
        // A failed fetch must not look like a missing record. Left unhandled,
        // this screen rendered "No documents on file yet" — which to a pro
        // waiting on KYC reads as their paperwork having been lost, on the one
        // screen where they are already anxious.
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  const rejected = state?.status === "rejected";
  const approved = state?.status === "approved";

  return (
    <OnboardingShell
      heading={
        approved
          ? "You are approved"
          : rejected
            ? "We need something corrected"
            : "Your documents are with the office"
      }
      subheading={
        approved
          ? "Your account is verified. You can start taking jobs."
          : rejected
            ? "One or more documents could not be verified. Fix those and the review continues."
            : "A member of the CFC team is checking them. You do not need to do anything else."
      }
    >
      <div className="space-y-4">
        {/* The state, as one clear mark. */}
        <section
          className={cn(
            "rounded-card border p-5 text-center",
            approved
              ? "border-live-line bg-live-subtle"
              : rejected
                ? "border-critical-line bg-critical-subtle"
                : "border-structure-line bg-structure-raised",
          )}
        >
          <span
            className={cn(
              "mx-auto flex size-emblem items-center justify-center rounded-full",
              approved
                ? "bg-live text-on-action"
                : rejected
                  ? "bg-critical text-on-action"
                  : "bg-structure text-brand",
            )}
          >
            {approved ? (
              <ShieldCheck className="size-8" aria-hidden="true" />
            ) : rejected ? (
              <XCircle className="size-8" aria-hidden="true" />
            ) : (
              <Clock className="size-8" aria-hidden="true" />
            )}
          </span>

          <p
            className={cn(
              "mt-3 text-heading font-semibold",
              approved
                ? "text-live-ink"
                : rejected
                  ? "text-critical-ink"
                  : "text-on-structure",
            )}
          >
            {approved
              ? "Verified professional"
              : rejected
                ? "Action needed"
                : "Under review"}
          </p>

          {state !== null && !approved && (
            <p
              className={cn(
                "mt-1 text-caption",
                rejected ? "text-critical-ink" : "text-on-structure-muted",
              )}
            >
              Submitted{" "}
              {new Date(state.submittedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
              })}
            </p>
          )}

          {approved && (
            <Button size="pro" className="mt-4 w-full" asChild>
              <Link href="/dashboard">Go to your dashboard</Link>
            </Button>
          )}
        </section>

        {/* Per-document status. */}
        <section className="overflow-hidden rounded-card border border-structure-line bg-structure-raised">
          <h2 className="border-b border-structure-line px-4 py-3 text-small font-semibold text-on-structure">
            Your documents
          </h2>

          {loading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-line-lg" />
            </div>
          ) : failed ? (
            <div className="p-4">
              <p className="flex items-start gap-2 text-small text-clock-ink">
                <TriangleAlert
                  className="mt-px size-4 shrink-0"
                  aria-hidden="true"
                />
                Could not load your documents just now. They are safe — this is
                a connection problem, not a missing record.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={load}
              >
                <RefreshCw />
                Try again
              </Button>
            </div>
          ) : state === null || state.documents.length === 0 ? (
            <p className="p-4 text-small text-on-structure-muted">
              No documents on file yet.
            </p>
          ) : (
            <ul className="divide-y divide-structure-line">
              {state.documents.map((doc) => (
                <li key={doc.type} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-small text-on-structure">
                      {doc.label}
                    </span>
                    {doc.status === "approved" ? (
                      <Badge tone="live">
                        <Check className="size-3" aria-hidden="true" />
                        Approved
                      </Badge>
                    ) : doc.status === "rejected" ? (
                      <Badge tone="critical">Needs re-upload</Badge>
                    ) : (
                      <Badge tone="clock">Checking</Badge>
                    )}
                  </div>

                  {/* The reason, where there is one. A rejection with no reason
                      is the most demoralising thing this screen can show. */}
                  {doc.rejectionReason !== null && (
                    <p className="mt-1 flex items-start gap-2 text-caption text-critical-ink">
                      <TriangleAlert
                        className="mt-px size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {doc.rejectionReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {rejected && (
            <div className="border-t border-structure-line p-4">
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/documents">
                  <RefreshCw />
                  Re-upload the documents
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* What happens next. No invented turnaround time. */}
        {!approved && (
          <section className="rounded-card border border-structure-line bg-structure-raised p-4">
            <h2 className="text-small font-semibold text-on-structure">
              What happens next
            </h2>
            <ol className="mt-2 space-y-2">
              <Step
                n={1}
                text="The office checks your Aadhaar, PAN and selfie against each other."
              />
              <Step
                n={2}
                text="They confirm the services you registered for."
              />
              <Step
                n={3}
                text="You are notified as soon as it is done, and this screen updates."
              />
            </ol>
            <p className="mt-3 border-t border-structure-line pt-3 text-caption text-on-structure-faint">
              Nothing further is needed from you unless a document is marked for
              re-upload above.
            </p>
          </section>
        )}

        {/* A way to reach a person, with hours. */}
        <section className="rounded-card border border-structure-line bg-structure-raised p-4">
          <p className="text-small font-medium text-on-structure">
            Been waiting a while?
          </p>
          <p className="mt-px text-caption text-on-structure-muted">
            Call the office and quote your mobile number. Open {SUPPORT_HOURS}.
          </p>
          <Button variant="secondary" className="mt-3 w-full" asChild>
            <a href={`tel:${SUPPORT_PHONE}`}>
              <Phone />
              Call the CFC office
            </a>
          </Button>
        </section>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw />
            {loading ? "Checking…" : "Check for an update"}
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-structure-line text-caption font-semibold text-on-structure-muted"
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="min-w-0 text-caption text-on-structure-muted">
        {text}
      </span>
    </li>
  );
}
