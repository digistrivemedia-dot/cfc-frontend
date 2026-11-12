"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, HelpCircle, Info, Wrench } from "lucide-react";
import {
  acceptQuotation,
  askQuotationQuestion,
  declineQuotation,
  getMyQuotation,
} from "@cfc/mocks";
import { ApiError, type QuotationDetail } from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  ErrorState,
  InlineAlert,
  PhotoGrid,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Textarea,
  formatCurrency,
  formatSchedule,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";

/**
 * Customer 22, 23, 24 — a quotation received, decided, and confirmed.
 *
 * One route. 22 is the body, 23 is the action bar plus its dialogs, and 24 is
 * the same route once the status is `customer_accepted` — a customer who has
 * just paid an advance should be able to reload the page they are on and still
 * see the confirmation, not be bounced to a URL they cannot return to.
 *
 * There is no countdown on this screen. The 15-minute window in the agreement
 * is an admin rule ("pro cannot wait longer", Admin 4/5); no customer-side
 * deadline is documented, and inventing one would be a pressure tactic rather
 * than a fact.
 */

function QuotationPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [quote, setQuote] = React.useState<QuotationDetail | null>(null);
  const [error, setError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirmDecline, setConfirmDecline] = React.useState(false);
  const [confirmAccept, setConfirmAccept] = React.useState(false);
  const [askOpen, setAskOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    getMyQuotation(id)
      .then((q) => (q === null ? setError(true) : setQuote(q)))
      .catch(() => setError(true));
  }, [id]);

  React.useEffect(() => load(), [load]);

  /**
   * Customer 23 — confirm the quotation and pay the 50% advance.
   *
   * **No money moves here.** The 50% advance is gone — the customer pays the
   * whole quotation when the job is finished, with the booking — so approving
   * is an agreement rather than a transaction, and the only thing it produces
   * is the code that lets the professional begin.
   *
   * It still goes through a confirmation step. The amount runs to thousands,
   * and the previous version committed to it on a single tap.
   */
  const accept = () => {
    setBusy(true);
    acceptQuotation(id)
      .then(() => {
        toast.success("Approved. Read your code to the professional to begin.");
        setConfirmAccept(false);
        // Reloaded rather than merged: the response carries the start code, and
        // one source for it is better than two.
        load();
      })
      .catch((e: unknown) =>
        toast.error(
          e instanceof ApiError ? e.message : "We could not accept that. Try again.",
        ),
      )
      .finally(() => setBusy(false));
  };

  const decline = () => {
    setBusy(true);
    declineQuotation(id)
      .then(() => {
        toast.success("Quotation declined");
        setConfirmDecline(false);
        load();
      })
      .catch(() => toast.error("We could not decline that. Try again."))
      .finally(() => setBusy(false));
  };

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not find that quotation"
          description="It may still be under review by our team."
          action={{ label: "My bookings", onClick: () => router.push("/bookings") }}
        />
      </div>
    );
  }

  if (quote === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="mt-3 h-block-sm rounded-card" />
      </div>
    );
  }

  const materialTotal = quote.materials.reduce((s, m) => s + m.costPaise, 0);

  /**
   * Waiting on this customer.
   *
   * **Both statuses.** `pending` is the live one — a quotation now reaches the
   * customer the moment the pro raises it — and `approved` survives only on
   * rows created under the old admin-approval flow, which must stay decidable
   * rather than becoming unreachable.
   */
  const awaitingCustomer =
    quote.status === "pending" || quote.status === "approved";
  const accepted = quote.status === "customer_accepted";
  const declined = quote.status === "customer_declined";
  const rejectedByCfc = quote.status === "rejected";

  return (
    <div className="bg-canvas min-h-screen px-4 pb-20 pt-6 md:px-6">
      <div className="mx-auto max-w-screen-md">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        My bookings
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title font-bold text-ink">
            {accepted ? "Work approved" : "Extra work needed"}
          </h1>
          <p className="text-small text-ink-muted">{quote.serviceName}</p>
          <p className="tabular mt-1 select-all text-caption text-ink-faint">
            {quote.jobRef}
          </p>
        </div>
      </div>

      {/**
       * Customer 24 — the state after confirming.
       *
       * The old copy claimed "Advance paid — you paid ₹1,850" unconditionally,
       * which for a cash advance was simply untrue, and then told the customer
       * the pro "will start as soon as the parts are to hand" — a promise about
       * someone else's van.
       *
       * What actually has to happen next is that the customer reads a code to
       * the professional standing in front of them, so that is the whole
       * content of this state.
       */}
      {accepted && !quote.workStarted && quote.startOtp && (
        <section className="mt-4 overflow-hidden rounded-card border border-action-line bg-surface">
          <div className="bg-action-subtle px-4 py-3">
            <h2 className="text-small font-bold text-action">
              Read this code to {quote.proName}
            </h2>
            <p className="mt-px text-caption text-action">
              The extra work starts once they enter it. Do not share it before
              you are happy for them to begin.
            </p>
          </div>
          <div className="p-4 text-center">
            <p
              className="tabular text-display font-extrabold tracking-widest text-ink"
              aria-label={`Your code is ${quote.startOtp.split("").join(" ")}`}
            >
              {quote.startOtp}
            </p>
            <p className="mt-2 text-caption text-ink-muted">
              Nothing to pay now. {formatCurrency(quote.totalPaise)} is added to
              this job and payable once the work is finished.
            </p>
          </div>
        </section>
      )}

      {accepted && quote.workStarted && (
        <div className="mt-4">
          <InlineAlert tone="live" title="The extra work has started">
            {quote.proName} entered your code and is working on it now.{" "}
            <span className="tabular font-semibold">
              {formatCurrency(quote.totalPaise)}
            </span>{" "}
            is payable when the job is finished.
          </InlineAlert>
        </div>
      )}

      {/* Confirmed, but the code has been spent and the work has not been
          flagged as started — only reachable mid-update. Says nothing rather
          than inventing a state. */}
      {accepted && !quote.workStarted && !quote.startOtp && (
        <div className="mt-4">
          <InlineAlert tone="live" title="Quotation approved">
            {quote.proName} has been told.{" "}
            <span className="tabular font-semibold">
              {formatCurrency(quote.totalPaise)}
            </span>{" "}
            is payable once the work is finished.
          </InlineAlert>
        </div>
      )}

      {declined && (
        <div className="mt-4">
          <InlineAlert tone="info" title="You declined this quotation">
            The extra work was not carried out. You are charged only for the
            visit.
          </InlineAlert>
        </div>
      )}

      {rejectedByCfc && (
        <div className="mt-4">
          <InlineAlert tone="critical" title="This quotation was not approved">
            Our team reviewed it and did not approve the amount. Nothing has
            been charged, and we will be in touch about the work.
          </InlineAlert>
        </div>
      )}

      {awaitingCustomer && (
        <div className="mt-4">
          <InlineAlert tone="clock" title="Your approval is needed">
            {quote.proName} found work beyond the original booking. Nothing is
            charged until you accept.
          </InlineAlert>
        </div>
      )}

      {/* What the professional found. */}
      <section className="mt-4 rounded-card bg-surface shadow-sm p-4">
        <h2 className="text-small font-semibold text-ink">
          What {quote.proName} found
        </h2>
        <p className="mt-2 text-small leading-relaxed text-ink-muted">
          {quote.proNotes}
        </p>
        <p className="mt-2 text-caption text-ink-faint">
          Raised {formatSchedule(quote.submittedAt)}
        </p>
      </section>

      {/* Customer 22 — before photos. Evidence, so they open full size. */}
      {quote.beforePhotoUrls.length > 0 && (
        <section className="mt-4 rounded-card bg-surface shadow-sm p-4">
          <h2 className="text-small font-semibold text-ink">Photos</h2>
          <p className="mb-2 text-caption text-ink-muted">
            Taken on site before any work.
          </p>
          <PhotoGrid urls={quote.beforePhotoUrls} label="Before" />
        </section>
      )}

      {/* Customer 22 — the material list, itemised. */}
      <section className="mt-4 rounded-card bg-surface shadow-sm">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          What it costs
        </h2>

        {quote.materials.length > 0 && (
          <ul className="divide-y divide-border-soft">
            {quote.materials.map((m, i) => (
              <li
                key={`${m.description}-${i}`}
                className="flex items-start gap-3 px-4 py-3"
              >
                <Wrench
                  className="mt-px size-4 shrink-0 text-ink-faint"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-small text-ink">
                  {m.description}
                </span>
                <span className="tabular shrink-0 text-small text-ink">
                  {formatCurrency(m.costPaise)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <dl className="space-y-2 border-t border-border p-4">
          {quote.materials.length > 0 && (
            <Line label="Parts and materials" value={materialTotal} />
          )}
          <Line label="Labour" value={quote.laborPaise} />
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <dt className="text-small font-bold text-ink">Quotation total</dt>
            {/* the figure the customer is deciding on - set like money */}
            <dd className="tabular text-title font-extrabold tracking-tight text-ink">
              {formatCurrency(quote.totalPaise)}
            </dd>
          </div>
        </dl>
      </section>

      {/**
       * When it is paid, which is the whole of the payment story now.
       *
       * This was a 50/50 split with "Pay now — 50% advance" at display weight.
       * The advance is gone: the customer pays the full amount when the job is
       * finished, so there is one figure and one moment, and saying that
       * plainly is worth more than a two-row table of one number.
       */}
      {(awaitingCustomer || accepted) && (
        <section className="cfc-card mt-4 overflow-hidden">
          <h2 className="bg-clock px-4 py-3 text-body font-bold text-on-action">
            When you pay
          </h2>

          <div className="p-4">
            <div className="rounded-card bg-action-subtle p-4 text-center">
              <p className="text-caption font-semibold uppercase tracking-wide text-action">
                Payable when the work is done
              </p>
              <p className="tabular mt-1 text-display font-extrabold tracking-tight text-action">
                {formatCurrency(quote.totalPaise)}
              </p>
            </div>

            <p className="cfc-info mt-3">
              <Info className="cfc-info-ic size-4" aria-hidden="true" />
              <span>
                Nothing is taken now, and nothing is taken when you approve.
                This is added to your booking and paid once the professional has
                finished — cash, UPI or card.
              </span>
            </p>
          </div>
        </section>
      )}

      {/* Customer 23 — accept, decline, ask. */}
      {awaitingCustomer && (
        <div className="mt-4 space-y-2">
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            onClick={() => setConfirmAccept(true)}
          >
            <Check />
            Review and confirm
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setAskOpen(true)}
            >
              <HelpCircle />
              Ask a question
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirmDecline(true)}
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      {accepted && (
        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href="/bookings">Back to my bookings</Link>
        </Button>
      )}

      <AlertDialog open={confirmDecline} onOpenChange={setConfirmDecline}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              The extra work will not be carried out. You will still be charged
              for the visit itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              variant="critical"
              onClick={decline}
              disabled={busy}
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmAcceptSheet
        open={confirmAccept}
        onOpenChange={setConfirmAccept}
        quote={quote}
        busy={busy}
        onConfirm={accept}
      />

      <AskSheet
        open={askOpen}
        onOpenChange={setAskOpen}
        quotationId={id}
        proName={quote.proName}
      />
      </div>
    </div>
  );
}

/**
 * Customer 23 — the confirmation step.
 *
 * It exists because the previous screen committed to thousands of rupees on
 * **one tap of one button**.
 *
 * The payment choice that briefly lived here is gone with the advance: there is
 * nothing to pay at this moment, so asking how they would like to pay would be
 * a question about a transaction that is not happening. What they are agreeing
 * to, and when it becomes payable, is the whole content.
 */
function ConfirmAcceptSheet({
  open,
  onOpenChange,
  quote,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuotationDetail;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Approve the extra work</SheetTitle>
        </SheetHeader>

        <SheetBody>
          <p className="text-small text-ink-muted">
            You are agreeing to {quote.proName} carrying out the quoted work on{" "}
            <span className="tabular">{quote.jobRef}</span>.
          </p>

          <div className="mt-4 rounded-card border border-border p-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small text-ink-muted">Quotation total</span>
              <span className="tabular text-body font-extrabold text-ink">
                {formatCurrency(quote.totalPaise)}
              </span>
            </div>
            <p className="mt-1 text-caption text-ink-muted">
              Added to this booking and payable once the work is finished.
              Nothing is taken now.
            </p>
          </div>

          {/* The one thing that becomes irreversible. Said before they tap,
              not discovered afterwards. */}
          {quote.officeMayStillEdit && (
            <p className="mt-3 rounded-control bg-clock-subtle p-3 text-caption text-clock-ink">
              Our team can still adjust this amount for a few more minutes.
              Approving it now fixes it at {formatCurrency(quote.totalPaise)} —
              after that it cannot be changed.
            </p>
          )}

          <p className="cfc-info mt-4">
            <Info className="cfc-info-ic size-4" aria-hidden="true" />
            <span>
              After you approve you will get a 4-digit code. The professional
              cannot start the extra work until you read it to them.
            </span>
          </p>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            onClick={onConfirm}
          >
            <Check />
            Approve {formatCurrency(quote.totalPaise)}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Go back
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="tabular text-small text-ink">{formatCurrency(value)}</dd>
    </div>
  );
}

/**
 * "Ask a question", honestly.
 *
 * There is no message thread on a quotation in the data model, so this does
 * not pretend to open a chat. The question is sent, and the screen says what
 * actually happens next — support calls. Showing a thread with no reply coming
 * is worse than saying plainly that someone will phone.
 */
function AskSheet({
  open,
  onOpenChange,
  quotationId,
  proName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  proName: string;
}) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) setText("");
  }, [open]);

  const send = () => {
    const question = text.trim();
    if (question === "") return;
    setBusy(true);
    askQuotationQuestion(quotationId, question)
      .then(() => {
        toast.success("Question sent. Our team will call you shortly.");
        onOpenChange(false);
      })
      .catch(() => toast.error("We could not send that. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Ask about this quotation</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-3">
          <p className="text-small text-ink-muted">
            Our team will read your question and call you. {proName} is not
            messaged directly.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="e.g. Why does the part cost this much? Is there a cheaper option?"
            aria-label="Your question"
          />
        </SheetBody>

        <SheetFooter>
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            disabled={text.trim() === ""}
            onClick={send}
          >
            Send question
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** This is one customer's own record. A visitor without an account is offered
 *  one rather than being shown somebody else's booking. */
export default function QuotationPage() {
  return (
    <RequireAccount title="Sign in to see this quotation" description="Quotations, material lists and photos are sent to the customer who requested them.">
      <QuotationPageInner />
    </RequireAccount>
  );
}
