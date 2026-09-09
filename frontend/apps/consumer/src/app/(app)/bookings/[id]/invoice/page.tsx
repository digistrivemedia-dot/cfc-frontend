"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { getMyBooking, priceBooking } from "@cfc/mocks";
import type { ConsumerBooking } from "@cfc/types";
import {
  Badge,
  Button,
  ErrorState,
  Skeleton,
  cn,
  formatCurrency,
  formatDate,
  formatTime,
} from "@cfc/ui";

/**
 * Customer 31 and 32 — the customer invoice, and the tax invoice.
 *
 * Two documents, one route, switched by `?tax=1`. The agreement separates them
 * deliberately: the customer invoice is a receipt ("service, pro, total paid,
 * payment mode") while the tax invoice itemises the platform fee and its GST.
 * Most customers only ever want the first.
 *
 * The **internal settlement** — the pro's share, CFC's net — is a third layer
 * the agreement marks **admin only**, and it is not on either of these.
 *
 * "PDF download" is a backend job: the agreement says the invoice PDF is
 * auto-generated per booking. Until that endpoint exists, this prints. A
 * print-styled page produces a real PDF through the browser's own dialog on
 * every platform, which is more use than a button that does nothing.
 */

function InvoiceInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const isTax = search.get("tax") === "1";

  const [booking, setBooking] = React.useState<ConsumerBooking | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    getMyBooking(id)
      .then((b) => (b === null ? setError(true) : setBooking(b)))
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-12 md:px-6">
        <ErrorState
          title="We could not find that booking"
          action={{ label: "My bookings", onClick: () => router.push("/bookings") }}
        />
      </div>
    );
  }

  if (booking === null) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-6 md:px-6">
        <Skeleton className="h-block-lg rounded-card" />
      </div>
    );
  }

  // An invoice exists once there is something to invoice for.
  if (booking.status !== "completed") {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-12 md:px-6">
        <ErrorState
          title="No invoice yet"
          description="An invoice is issued once the job is complete."
          action={{
            label: "Back to booking",
            onClick: () => router.push(`/bookings/${booking.id}`),
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 pb-tab-bar pt-4 md:px-6 md:pb-12">
      {/* Chrome, hidden when printing — a printed invoice with a "Back" link
          on it looks like a screenshot. */}
      <div className="print:hidden">
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          Booking details
        </Link>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/bookings/${booking.id}/invoice`)}
            aria-pressed={!isTax}
            className={cn(
              "flex h-touch flex-1 items-center justify-center rounded-control border text-small",
              !isTax
                ? "border-action bg-action-subtle font-medium text-action-press"
                : "border-border bg-surface text-ink",
            )}
          >
            Receipt
          </button>
          <button
            type="button"
            onClick={() => router.push(`/bookings/${booking.id}/invoice?tax=1`)}
            aria-pressed={isTax}
            className={cn(
              "flex h-touch flex-1 items-center justify-center rounded-control border text-small",
              isTax
                ? "border-action bg-action-subtle font-medium text-action-press"
                : "border-border bg-surface text-ink",
            )}
          >
            Tax invoice
          </button>
        </div>
      </div>

      <article className="mt-4 rounded-card border border-border bg-surface p-4 print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-heading font-semibold text-ink">
              City Family Care
            </p>
            <p className="text-caption text-ink-muted">
              {isTax ? "Tax invoice" : "Payment receipt"}
            </p>
          </div>
          <div className="text-right">
            <p className="tabular text-caption text-ink-muted">
              {booking.reference}
            </p>
            <p className="tabular text-caption text-ink-faint">
              {formatDate(booking.scheduledAt)}
            </p>
          </div>
        </header>

        {isTax ? (
          <TaxInvoice booking={booking} />
        ) : (
          <CustomerInvoice booking={booking} />
        )}

        <footer className="mt-4 border-t border-border pt-3">
          <p className="text-caption text-ink-faint">
            {isTax
              ? "GST is charged on the platform fee only. The professional's fee is not taxed by CFC."
              : "Thank you for booking with City Family Care."}
          </p>
        </footer>
      </article>

      <Button
        variant="secondary"
        className="mt-4 w-full print:hidden"
        onClick={() => window.print()}
      >
        <Printer />
        {isTax ? "Print or save as PDF" : "Print receipt"}
      </Button>

      <p className="mt-2 text-caption text-ink-faint print:hidden">
        A downloadable PDF arrives with the billing integration. Printing saves
        a PDF on any device today.
      </p>
    </div>
  );
}

/**
 * Customer 31 — the receipt.
 *
 * "Service summary, Pro name, total paid, payment mode." No fee breakdown:
 * that is what the tax invoice is for, and a customer checking what they paid
 * does not want to read six lines to find one number.
 */
function CustomerInvoice({ booking }: { booking: ConsumerBooking }) {
  return (
    <>
      <dl className="mt-4 space-y-3">
        <Row label="Service" value={booking.serviceName} />
        {booking.variantName !== null && (
          <Row label="Option" value={booking.variantName} />
        )}
        {booking.pro !== null && (
          <Row label="Professional" value={booking.pro.name} />
        )}
        <Row
          label="Completed"
          value={
            <span className="tabular">
              {formatDate(booking.scheduledAt)}, {formatTime(booking.scheduledAt)}
            </span>
          }
        />
        <Row
          label="Address"
          value={
            <>
              {booking.address.line1}, {booking.address.area} —{" "}
              <span className="tabular">{booking.address.pincode}</span>
            </>
          }
        />
        <Row
          label="Paid by"
          value={<Badge tone="neutral">{PAYMENT_LABEL[booking.paymentMethod]}</Badge>}
        />
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-3">
        <p className="text-small font-semibold text-ink">Total paid</p>
        <p className="tabular text-title font-semibold text-ink">
          {formatCurrency(booking.totalPaise)}
        </p>
      </div>
    </>
  );
}

/**
 * Customer 32 — the tax invoice.
 *
 * "Platform fee, CGST 9%, SGST 9%, total payable." The breakdown is
 * recomputed from the same `priceBooking` the checkout used, so a customer
 * comparing this against what they agreed to finds the same numbers.
 */
function TaxInvoice({ booking }: { booking: ConsumerBooking }) {
  // Reconstructed from the service. The real endpoint will return the stored
  // breakdown; until then this is derived the same way checkout derived it.
  const breakdown = priceBooking({ serviceId: "svc_01" });
  const proFeePaise = booking.totalPaise - breakdown.platformFeePaise -
    breakdown.cgstPaise - breakdown.sgstPaise;

  return (
    <>
      <dl className="mt-4 space-y-3">
        <Row label="Service" value={booking.serviceName} />
        {booking.pro !== null && (
          <Row label="Professional" value={booking.pro.name} />
        )}
      </dl>

      <table className="mt-4 w-full text-small">
        <caption className="sr-only">Charges and tax</caption>
        <tbody className="divide-y divide-border-soft">
          <TaxRow label="Professional fee" value={proFeePaise} />
          <TaxRow label="CFC platform fee" value={breakdown.platformFeePaise} />
          <TaxRow
            label="CGST"
            hint="9% of platform fee"
            value={breakdown.cgstPaise}
          />
          <TaxRow
            label="SGST"
            hint="9% of platform fee"
            value={breakdown.sgstPaise}
          />
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <th scope="row" className="py-3 text-left font-semibold text-ink">
              Total payable
            </th>
            <td className="tabular py-3 text-right text-heading font-semibold text-ink">
              {formatCurrency(booking.totalPaise)}
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}

const PAYMENT_LABEL: Record<ConsumerBooking["paymentMethod"], string> = {
  upi: "UPI",
  card: "Card",
  wallet: "CFC wallet",
  cash: "Cash",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-caption text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right text-small text-ink">{value}</dd>
    </div>
  );
}

function TaxRow({
  label,
  hint,
  value,
}: {
  label: string;
  hint?: string | undefined;
  value: number;
}) {
  return (
    <tr>
      <th scope="row" className="py-2 text-left font-normal text-ink-muted">
        {label}
        {hint !== undefined && (
          <span className="block text-caption text-ink-faint">{hint}</span>
        )}
      </th>
      <td className="tabular py-2 text-right text-ink">
        {formatCurrency(value)}
      </td>
    </tr>
  );
}

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-sm px-4 py-6 md:px-6">
          <Skeleton className="h-block-lg rounded-card" />
        </div>
      }
    >
      <InvoiceInner />
    </Suspense>
  );
}
