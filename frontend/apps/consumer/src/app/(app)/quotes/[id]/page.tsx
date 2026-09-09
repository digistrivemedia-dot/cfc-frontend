"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, HelpCircle, Wrench } from "lucide-react";
import {
  acceptQuotation,
  askQuotationQuestion,
  declineQuotation,
  getMyQuotation,
  splitQuotation,
} from "@cfc/mocks";
import type { QuotationDetail } from "@cfc/types";
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

export default function QuotationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [quote, setQuote] = React.useState<QuotationDetail | null>(null);
  const [error, setError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirmDecline, setConfirmDecline] = React.useState(false);
  const [askOpen, setAskOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    getMyQuotation(id)
      .then((q) => (q === null ? setError(true) : setQuote(q)))
      .catch(() => setError(true));
  }, [id]);

  React.useEffect(() => load(), [load]);

  const accept = () => {
    setBusy(true);
    acceptQuotation(id)
      .then(() => {
        toast.success("Advance paid. Your professional has been told.");
        load();
      })
      .catch(() => toast.error("We could not accept that. Try again."))
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

  const { advancePaise, balancePaise } = splitQuotation(quote.totalPaise);
  const materialTotal = quote.materials.reduce((s, m) => s + m.costPaise, 0);

  const awaitingCustomer = quote.status === "approved";
  const accepted = quote.status === "customer_accepted";
  const declined = quote.status === "customer_declined";
  const rejectedByCfc = quote.status === "rejected";

  return (
    <div className="mx-auto max-w-screen-md px-4 pb-tab-bar pt-4 md:px-6 md:pb-12">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        My bookings
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title font-semibold text-ink">
            {accepted ? "Work approved" : "Extra work needed"}
          </h1>
          <p className="text-small text-ink-muted">{quote.serviceName}</p>
          <p className="tabular mt-1 select-all text-caption text-ink-faint">
            {quote.jobRef}
          </p>
        </div>
      </div>

      {/* Customer 24 — the state after accepting. */}
      {accepted && (
        <div className="mt-4">
          <InlineAlert tone="live" title="Advance paid">
            You paid{" "}
            <span className="tabular font-semibold">
              {formatCurrency(advancePaise)}
            </span>
            . The remaining{" "}
            <span className="tabular font-semibold">
              {formatCurrency(balancePaise)}
            </span>{" "}
            is due when the work is finished. {quote.proName} will start as soon
            as the parts are to hand.
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
      <section className="mt-4 rounded-card border border-border bg-surface p-4">
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
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-semibold text-ink">Photos</h2>
          <p className="mb-2 text-caption text-ink-muted">
            Taken on site before any work.
          </p>
          <PhotoGrid urls={quote.beforePhotoUrls} label="Before" />
        </section>
      )}

      {/* Customer 22 — the material list, itemised. */}
      <section className="mt-4 rounded-card border border-border bg-surface">
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
            <dt className="text-small font-semibold text-ink">Quotation total</dt>
            <dd className="tabular text-heading font-semibold text-ink">
              {formatCurrency(quote.totalPaise)}
            </dd>
          </div>
        </dl>
      </section>

      {/* The 50/50 split, spelled out. A customer agreeing to pay half now
          should see both halves and what triggers the second. */}
      {(awaitingCustomer || accepted) && (
        <section className="mt-4 rounded-card border border-action-line bg-action-subtle p-4">
          <h2 className="text-small font-semibold text-ink">
            {accepted ? "Payment" : "How payment works"}
          </h2>
          <dl className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-small text-ink-muted">
                {accepted ? "Advance paid" : "Pay now (50%)"}
              </dt>
              <dd className="tabular text-small font-semibold text-ink">
                {formatCurrency(advancePaise)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-small text-ink-muted">
                Balance on completion
              </dt>
              <dd className="tabular text-small text-ink">
                {formatCurrency(balancePaise)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* Customer 23 — accept, decline, ask. */}
      {awaitingCustomer && (
        <div className="mt-4 space-y-2">
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            onClick={accept}
          >
            <Check />
            Accept and pay {formatCurrency(advancePaise)}
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

      <AskSheet
        open={askOpen}
        onOpenChange={setAskOpen}
        quotationId={id}
        proName={quote.proName}
      />
    </div>
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
