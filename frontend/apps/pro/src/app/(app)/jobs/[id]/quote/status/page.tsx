"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { QUOTATION_WINDOW_MINUTES, getProJob } from "@cfc/mocks";
import type { ProJobQuotation } from "@cfc/types";
import { Button, ErrorState, Skeleton, cn, formatCurrency } from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 17 — quotation status.
 *
 * The pro is standing in the customer's house while this screen is open, and
 * what they are waiting for is **the customer in front of them**, not the
 * office. A quotation now goes straight to the customer when it is raised; the
 * office's 15 minutes are a window in which they may still adjust the figure.
 *
 * So the question this screen answers is "where has my quotation got to", and
 * the answer is one of four:
 *
 *   with the customer   the amount, and whether the office could still change it
 *   approved            ask for the 4-digit code and begin
 *   cancelled by office the reason, and a way to re-quote
 *   declined            the customer said no; do only the original booking
 *
 * ## It used to answer with a fiction
 *
 * The whole screen was local state: a hardcoded `SUBMITTED_TOTAL_PAISE` of
 * ₹6,825 shown to every pro regardless of what they quoted, a `useState` the
 * pro themselves flipped between pending, approved and rejected, and a
 * hardcoded rejection reason about a pipe fitting. A pro could "approve" their
 * own quotation by tapping a button, and the ₹6,825 was the figure they would
 * then have asked a customer for. It was honestly labelled "Preview — admin
 * decision", written when the mock layer had no decision channel at all.
 *
 * ## Why it polls
 *
 * The approval arrives from another app and a web app cannot be woken by a
 * push. Every 15 seconds while the decision is outstanding, and **not at all**
 * once it is in: polling a settled quotation forever is how a phone in
 * someone's pocket flattens its battery.
 */
export default function QuoteStatusPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const proId = React.useMemo(() => currentProId(), []);

  const [quote, setQuote] = React.useState<ProJobQuotation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  /** Outstanding with the customer. `approved` is the legacy spelling. */
  const pending = quote?.status === "pending" || quote?.status === "approved";

  const load = React.useCallback(async () => {
    try {
      const job = await getProJob(proId, jobId);
      // A missing job and a job with no quotation land in the same place: the
      // "nothing to show" card, which offers the way forward either way.
      setQuote(job?.quotation ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [proId, jobId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [pending, load]);

  return (
    <div className="mx-auto max-w-detail px-4 py-4 md:px-6">
      <Link
        href={`/jobs/${jobId}`}
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the job
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">Your quotation</h1>

      {loading ? (
        <Skeleton className="mt-4 h-block-md w-full rounded-card" />
      ) : error ? (
        <ErrorState
          title="Could not load your quotation"
          description="The connection may have dropped. Your quotation is safe — try again."
          action={{ label: "Try again", onClick: () => void load() }}
        />
      ) : quote === null ? (
        /* No quotation on this job. Reachable by opening the URL directly, or
           after an admin deleted one — so it offers the way forward rather
           than an empty screen. */
        <section className="mt-4 rounded-card border border-border bg-surface p-6 text-center">
          <span className="mx-auto flex size-tile-lg items-center justify-center rounded-full bg-canvas text-ink-faint">
            <FileText className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-body font-semibold text-ink">
            No quotation on this job
          </h2>
          <p className="mx-auto mt-1 max-w-prose text-small text-ink-muted">
            Raise one if the work turns out bigger than the booking.
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/jobs/${jobId}/quote`}>Raise a quotation</Link>
          </Button>
        </section>
      ) : quote.status === "pending" || quote.status === "approved" ? (
        <PendingCard quote={quote} />
      ) : quote.status === "rejected" ? (
        <RejectedCard jobId={jobId} quote={quote} />
      ) : quote.status === "customer_declined" ? (
        <DeclinedCard jobId={jobId} quote={quote} />
      ) : (
        <ApprovedCard jobId={jobId} quote={quote} />
      )}
    </div>
  );
}

/**
 * With the customer.
 *
 * **The clock is no longer the content.** It used to count down an admin's
 * decision — the pro waited and could do nothing else. The quotation now goes
 * straight to the customer, so what the pro is waiting for is the person in
 * front of them, and the clock only says how long the office could still
 * adjust the figure.
 *
 * It counts minutes and seconds because at this scale minutes alone sit
 * unchanged for sixty seconds and read as frozen. It runs off the server's own
 * `decisionBy`, so it cannot show more time than actually remains.
 */
function PendingCard({ quote }: { quote: ProJobQuotation }) {
  const deadline = React.useMemo(
    () => new Date(quote.decisionBy).getTime(),
    [quote.decisionBy],
  );
  const [msLeft, setMsLeft] = React.useState(() =>
    Math.max(0, deadline - Date.now()),
  );

  React.useEffect(() => {
    const tick = () => setMsLeft(Math.max(0, deadline - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const expired = msLeft <= 0;
  const mins = Math.floor(msLeft / 60_000);
  const secs = Math.floor((msLeft % 60_000) / 1000);

  return (
    <section
      /* A closed window is **not** an error. It used to render critical-red,
         which was right when the clock was an approval deadline and the quote
         died with it; now it only means the amount is final. */
      className={cn(
        "mt-4 overflow-hidden rounded-card border",
        expired ? "border-border" : "border-clock-line",
      )}
    >
      <div
        className={cn(
          "px-4 py-5 text-center",
          expired ? "bg-canvas" : "bg-clock-subtle",
        )}
      >
        <span
          className={cn(
            "mx-auto flex size-tile-lg items-center justify-center rounded-full",
            expired ? "bg-structure text-on-structure" : "bg-clock text-on-action",
          )}
        >
          <Clock className="size-6" aria-hidden="true" />
        </span>

        <h2
          className={cn(
            "mt-3 text-heading font-semibold",
            expired ? "text-ink" : "text-clock-ink",
          )}
        >
          With the customer now
        </h2>

        {expired ? (
          /* The office's window has closed, and that is **not a problem** —
             it only means the amount is final. The old copy said "taking
             longer than expected" and told the pro to ring support, which was
             right when this clock was an approval deadline. */
          <p className="mx-auto mt-1 max-w-prose text-small text-ink-muted">
            The amount is final. Ask the customer to approve it on their phone
            when they are ready.
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
              the office can still adjust this for{" "}
              {QUOTATION_WINDOW_MINUTES} minutes from submission
            </p>
          </>
        )}
      </div>

      <div className="bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-small text-ink-muted">You quoted</span>
          <span className="tabular text-body font-semibold text-ink">
            {formatCurrency(quote.submittedTotalPaise)}
          </span>
        </div>

        <p className="mt-3 border-t border-border pt-3 text-caption text-ink-muted">
          The customer approves this on their phone. Once they do, ask them for
          the 4-digit code and you can start — they pay for everything when the
          job is finished.
        </p>
      </div>
    </section>
  );
}

/**
 * Approved, or already accepted by the customer.
 *
 * The 50/50 split is spelled out in rupees rather than as a percentage, because
 * a pro about to ask a customer for money needs the number, not the rule. The
 * halves come from the server, which fixed them at approval — recomputing them
 * here is how the figure the admin committed to and the figure the pro asks for
 * come to differ by a rupee.
 */
function ApprovedCard({
  jobId,
  quote,
}: {
  jobId: string;
  quote: ProJobQuotation;
}) {
  const accepted = quote.status === "customer_accepted";

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-live-line">
      <div className="bg-live-subtle px-4 py-5 text-center">
        <span className="mx-auto flex size-tile-lg items-center justify-center rounded-full bg-live text-on-action">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-heading font-semibold text-live-ink">
          {accepted ? "Approved — you can start" : "With the customer"}
        </h2>
        <p className="mx-auto mt-1 max-w-prose text-small text-live-ink">
          {accepted
            ? quote.workStarted
              ? "The work is under way."
              : "Ask the customer for their 4-digit code to begin."
            : "Waiting on the customer to approve it."}
        </p>
      </div>

      <div className="bg-surface p-4">
        {/* The office changed the figure. Stated before the split, because the
            split is derived from it and the pro is about to say a number out
            loud to a customer. */}
        {quote.edited && (
          <p className="mb-3 rounded-control bg-clock-subtle p-3 text-caption text-clock-ink">
            The office edited your quotation. You submitted{" "}
            <span className="tabular font-medium">
              {formatCurrency(quote.submittedTotalPaise)}
            </span>{" "}
            and it was approved at{" "}
            <span className="tabular font-medium">
              {formatCurrency(quote.totalPaise)}
            </span>
            . Ask the customer for the approved amount.
          </p>
        )}

        <dl className="divide-y divide-border-soft">
          <Split
            label="Quotation total"
            value={formatCurrency(quote.totalPaise)}
            bold
          />
          <Split
            label="Customer pays"
            value="When the job is finished"
          />
        </dl>

        <p className="mt-3 border-t border-border pt-3 text-caption text-ink-muted">
          There is no advance to collect. Your earning is calculated on the full
          quotation, less the CFC platform fee, and credited within 48 hours of
          completing the job.
        </p>

        <Button size="pro" className="mt-3 w-full" asChild>
          <Link href={`/jobs/${jobId}/work`}>Continue the work</Link>
        </Button>
      </div>
    </section>
  );
}

/**
 * Rejected by the office.
 *
 * The reason first, and a way forward. A pro who has photographed a site and
 * priced a job deserves to know precisely what was wrong with it — and the
 * admin screen requires remarks on rejection, so the reason exists. When one
 * somehow does not, this says so rather than inventing a plausible one.
 */
function RejectedCard({
  jobId,
  quote,
}: {
  jobId: string;
  quote: ProJobQuotation;
}) {
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
        <p className="text-small font-medium text-ink">Office’s reason</p>
        <p className="mt-1 rounded-control bg-canvas p-3 text-small text-ink-muted">
          {quote.rejectionReason !== null && quote.rejectionReason !== ""
            ? `“${quote.rejectionReason}”`
            : "None was recorded. Call the office and ask before re-quoting."}
        </p>

        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
          <span className="text-small text-ink-muted">You had quoted</span>
          <span className="tabular text-small font-medium text-ink">
            {formatCurrency(quote.submittedTotalPaise)}
          </span>
        </div>

        <p className="mt-3 text-caption text-ink-muted">
          You can submit a revised quotation. Nothing you photographed is lost.
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

/**
 * The customer declined.
 *
 * A different thing from a rejection, and worth its own card: the office
 * approved the work and the customer did not want it at that price. There is no
 * reason to show, because the customer is not asked for one — so it says what
 * happened and leaves the next move to the pro.
 */
function DeclinedCard({
  jobId,
  quote,
}: {
  jobId: string;
  quote: ProJobQuotation;
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-card border border-critical-line">
      <div className="bg-critical-subtle px-4 py-5 text-center">
        <span className="mx-auto flex size-tile-lg items-center justify-center rounded-full bg-critical text-on-action">
          <XCircle className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-heading font-semibold text-critical-ink">
          The customer declined
        </h2>
        <p className="mx-auto mt-1 max-w-prose text-small text-critical-ink">
          They were sent {formatCurrency(quote.totalPaise)} and chose not to go
          ahead.
        </p>
      </div>

      <div className="bg-surface p-4">
        <p className="text-caption text-ink-muted">
          Do not start the extra work. Finish what the original booking covers,
          or call the office if the customer wants to discuss the price.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="min-w-0 flex-1" asChild>
            <Link href={`/jobs/${jobId}/work`}>Back to the work</Link>
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
