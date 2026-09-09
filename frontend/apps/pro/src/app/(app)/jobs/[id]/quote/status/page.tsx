"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Phone,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { QUOTATION_WINDOW_MINUTES } from "@cfc/mocks";
import type { QuotationStatus } from "@cfc/types";
import { Button, cn, formatCurrency } from "@cfc/ui";

/**
 * Pro 17 — quotation status.
 *
 * The pro is standing in the customer's house while this screen is open, which
 * is the fact that decides everything about it. The agreement gives the admin
 * **15 minutes**, so the one thing this screen must answer is "do I wait, or do
 * I pack up?" — and it answers that with a live clock rather than a spinner.
 *
 * ## Three outcomes, three different screens
 *
 * **Pending** — a countdown, and what to do while waiting. The clock is the
 * whole content, because until it resolves there is nothing else to say.
 *
 * **Approved** — what the customer owes, split 50/50, and the next action. The
 * agreement is specific: 50% advance, balance on completion. A pro who does not
 * know that will ask for the wrong amount.
 *
 * **Rejected** — the reason, prominently. A rejection with no reason is the
 * single most demoralising thing this platform can show a pro, and the admin
 * screen already requires remarks, so there is no excuse for hiding them.
 *
 * ## Why the status is local state here
 *
 * The mock layer has no admin-decision channel, and inventing a
 * `getQuotationStatus` that flips on a timer would be a fiction dressed as
 * data. The three states are reachable through the scenario switcher below,
 * which is honest: this screen's job is to render a decision, and the decision
 * comes from the admin panel.
 */

/** What the pro submitted. Carried in state, since there is no store yet. */
const SUBMITTED_TOTAL_PAISE = 682_500;

export default function QuoteStatusPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [status, setStatus] = React.useState<QuotationStatus>("pending");

  // The deadline is fixed on mount, like the job-alert countdown, so the clock
  // cannot drift into showing more time than remains.
  const deadlineRef = React.useRef(
    Date.now() + QUOTATION_WINDOW_MINUTES * 60_000,
  );
  const [msLeft, setMsLeft] = React.useState(
    QUOTATION_WINDOW_MINUTES * 60_000,
  );

  React.useEffect(() => {
    if (status !== "pending") return;
    const tick = () =>
      setMsLeft(Math.max(0, deadlineRef.current - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [status]);

  return (
    <div className="mx-auto max-w-detail px-4 py-4 md:px-6">
      <Link
        href={`/jobs/${jobId}/work`}
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the job
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">
        Your quotation
      </h1>

      {status === "pending" && (
        <PendingCard msLeft={msLeft} total={SUBMITTED_TOTAL_PAISE} />
      )}
      {status === "approved" && (
        <ApprovedCard jobId={jobId} total={SUBMITTED_TOTAL_PAISE} />
      )}
      {status === "rejected" && <RejectedCard jobId={jobId} />}

      {/* The decision comes from the admin panel, which is not wired to this
          app yet. Rather than fake a status that flips on a timer, the three
          real states are switchable — the same honesty as the platform's
          existing scenario harness. */}
      <div className="mt-8 rounded-card border border-dashed border-border bg-canvas p-4">
        <p className="text-caption font-medium uppercase tracking-wide text-ink-faint">
          Preview — admin decision
        </p>
        <p className="mt-1 text-caption text-ink-muted">
          The approval comes from the admin panel. Until the two are connected,
          switch between the real outcomes here.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                if (s === "pending") {
                  deadlineRef.current =
                    Date.now() + QUOTATION_WINDOW_MINUTES * 60_000;
                }
                setStatus(s);
              }}
            >
              {s === "pending"
                ? "Waiting"
                : s === "approved"
                  ? "Approved"
                  : "Rejected"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Waiting.
 *
 * The clock counts minutes and seconds, because at this scale minutes alone
 * would sit unchanged for sixty seconds and read as frozen — and a pro watching
 * a frozen clock reloads the page.
 */
function PendingCard({ msLeft, total }: { msLeft: number; total: number }) {
  const expired = msLeft <= 0;
  const mins = Math.floor(msLeft / 60_000);
  const secs = Math.floor((msLeft % 60_000) / 1000);

  return (
    <section
      className={cn(
        "mt-4 overflow-hidden rounded-card border",
        expired ? "border-critical-line" : "border-clock-line",
      )}
    >
      <div
        className={cn(
          "px-4 py-5 text-center",
          expired ? "bg-critical-subtle" : "bg-clock-subtle",
        )}
      >
        <span
          className={cn(
            "mx-auto flex size-tile-lg items-center justify-center rounded-full",
            expired ? "bg-critical text-on-action" : "bg-clock text-on-action",
          )}
        >
          <Clock className="size-6" aria-hidden="true" />
        </span>

        <h2
          className={cn(
            "mt-3 text-heading font-semibold",
            expired ? "text-critical-ink" : "text-clock-ink",
          )}
        >
          {expired ? "Taking longer than expected" : "With the admin now"}
        </h2>

        {expired ? (
          <p className="mx-auto mt-1 max-w-prose text-small text-critical-ink">
            The {QUOTATION_WINDOW_MINUTES}-minute window has passed. Call
            support before you leave the site.
          </p>
        ) : (
          <>
            <p
              className="mt-2 tabular text-display font-semibold text-clock-ink"
              role="timer"
              aria-live="off"
            >
              {mins}:{String(secs).padStart(2, "0")}
            </p>
            <p className="mt-1 text-caption text-clock-ink">
              left of the {QUOTATION_WINDOW_MINUTES}-minute review window
            </p>
          </>
        )}
      </div>

      <div className="bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-small text-ink-muted">You quoted</span>
          <span className="tabular text-body font-semibold text-ink">
            {formatCurrency(total)}
          </span>
        </div>

        <p className="mt-3 border-t border-border pt-3 text-caption text-ink-muted">
          Wait on site if you can — most quotations are answered well inside the
          window. The customer pays 50% in advance once they accept, and you can
          start immediately.
        </p>

        {expired && (
          <Button variant="secondary" className="mt-3 w-full" asChild>
            <Link href="/support">
              <Phone />
              Call CFC support
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

/**
 * Approved.
 *
 * The 50/50 split is spelled out in rupees rather than as a percentage, because
 * a pro about to ask a customer for money needs the number, not the rule. The
 * halves are computed so they sum exactly — the advance is rounded and the
 * balance takes the remainder, which is the same approach the consumer app's
 * quotation split uses.
 */
function ApprovedCard({ jobId, total }: { jobId: string; total: number }) {
  const advance = Math.round(total / 2);
  const balance = total - advance;

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-live-line">
      <div className="bg-live-subtle px-4 py-5 text-center">
        <span className="mx-auto flex size-tile-lg items-center justify-center rounded-full bg-live text-on-action">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-heading font-semibold text-live-ink">
          Approved — you can start
        </h2>
        <p className="mx-auto mt-1 max-w-prose text-small text-live-ink">
          The customer has been sent the quotation and pays the advance to
          confirm.
        </p>
      </div>

      <div className="bg-surface p-4">
        <dl className="divide-y divide-border-soft">
          <Split label="Quotation total" value={formatCurrency(total)} bold />
          <Split label="Advance — paid now (50%)" value={formatCurrency(advance)} />
          <Split
            label="Balance — on completion"
            value={formatCurrency(balance)}
          />
        </dl>

        <p className="mt-3 border-t border-border pt-3 text-caption text-ink-muted">
          Your earning is calculated on the full quotation, less the CFC
          platform fee, and credited within 48 hours of completing the job.
        </p>

        <Button size="pro" className="mt-3 w-full" asChild>
          <Link href={`/jobs/${jobId}/work`}>Continue the work</Link>
        </Button>
      </div>
    </section>
  );
}

/**
 * Rejected.
 *
 * The reason first, and a way forward. A pro who has photographed a site and
 * priced a job deserves to know precisely what was wrong with it — and the
 * admin screen requires remarks on rejection, so the reason exists.
 */
function RejectedCard({ jobId }: { jobId: string }) {
  return (
    <section className="mt-4 overflow-hidden rounded-card border border-critical-line">
      <div className="bg-critical-subtle px-4 py-5 text-center">
        <span className="mx-auto flex size-tile-lg items-center justify-center rounded-full bg-critical text-on-action">
          <XCircle className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-heading font-semibold text-critical-ink">
          Not approved
        </h2>
      </div>

      <div className="bg-surface p-4">
        <p className="text-small font-medium text-ink">Admin’s reason</p>
        <p className="mt-1 rounded-control bg-canvas p-3 text-small text-ink-muted">
          “The material cost is above the template rate for this service.
          Re-quote using the standard pipe fitting, or call the office if the
          job genuinely needs the heavier part.”
        </p>

        <p className="mt-3 text-caption text-ink-muted">
          You can submit a revised quotation from the job screen. Nothing you
          photographed is lost.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button className="min-w-0 flex-1" asChild>
            <Link href={`/jobs/${jobId}/quote`}>
              <RefreshCw />
              Revise the quotation
            </Link>
          </Button>
          <Button variant="secondary" className="min-w-0 flex-1" asChild>
            <Link href="/support">
              <Phone />
              Call the office
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Split({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className={cn("text-small", bold ? "font-medium text-ink" : "text-ink-muted")}>
        {label}
      </dt>
      <dd
        className={cn(
          "shrink-0 tabular text-body",
          bold ? "font-semibold text-ink" : "font-medium text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
