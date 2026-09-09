"use client";

import * as React from "react";
import {
  BadgeCheck,
  Banknote,
  Calendar as CalendarIcon,
  Check,
  CreditCard,
  MapPin,
  Smartphone,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { applyCoupon, getAvailableCoupons } from "@cfc/mocks";
import type {
  Address,
  Coupon,
  PriceBreakdown,
  ServiceDetail,
  ServiceVariant,
} from "@cfc/types";
import {
  Badge,
  Button,
  InlineAlert,
  Input,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  cn,
  formatCurrency,
  formatDayShort,
  formatTime,
  toast,
} from "@cfc/ui";

/**
 * Customer 18, 19, 20, 21 — summary, coupon, payment, confirmation.
 *
 * Split out of the booking route because that file already carries the slot
 * and address steps. These four share one price breakdown and one draft, so
 * they belong together rather than in four more files.
 */

// -- 18: Booking summary ------------------------------------------------------

/**
 * The itemised bill.
 *
 * Every line is shown, including the ones a customer would rather not see: the
 * visit charge and the platform fee are named in the inventory precisely
 * because hiding them is what makes a total feel like a surprise. GST is
 * labelled as being on the platform fee, since that is the rule and a customer
 * who checks the arithmetic should find it consistent.
 */
export function SummaryStep({
  service,
  variant,
  address,
  slotAt,
  coupon,
  breakdown,
  onOpenCoupons,
  onRemoveCoupon,
  onContinue,
}: {
  service: ServiceDetail;
  variant: ServiceVariant | null;
  address: Address | null;
  slotAt: string | null;
  coupon: Coupon | null;
  breakdown: PriceBreakdown;
  onOpenCoupons: () => void;
  onRemoveCoupon: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Your booking
        </h2>
        <dl className="divide-y divide-border-soft">
          <SummaryRow
            icon={<BadgeCheck />}
            label="Service"
            value={
              <>
                {service.name}
                {variant ? (
                  <span className="block text-caption text-ink-muted">
                    {variant.name}
                  </span>
                ) : null}
              </>
            }
          />
          {slotAt !== null && (
            <SummaryRow
              icon={<CalendarIcon />}
              label="Arriving"
              value={
                <span className="tabular">
                  {formatDayShort(slotAt)}, {formatTime(slotAt)}
                </span>
              }
            />
          )}
          {address !== null && (
            <SummaryRow
              icon={<MapPin />}
              label="Address"
              value={
                <>
                  {address.line1}
                  <span className="block text-caption text-ink-muted">
                    {address.area} — <span className="tabular">{address.pincode}</span>
                  </span>
                </>
              }
            />
          )}
        </dl>
      </section>

      {/* Customer 19 — the coupon entry point. */}
      <section className="rounded-card border border-border bg-surface p-4">
        {coupon === null ? (
          <button
            type="button"
            onClick={onOpenCoupons}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
              <Tag className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-small font-medium text-ink">
                Apply a coupon
              </span>
              <span className="block text-caption text-ink-muted">
                See what is available
              </span>
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-live-subtle text-live-ink">
              <Check className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="tabular block text-small font-medium text-ink">
                {coupon.code} applied
              </span>
              <span className="block text-caption text-live-ink">
                You saved {formatCurrency(breakdown.discountPaise)}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={onRemoveCoupon}>
              <X />
              Remove
            </Button>
          </div>
        )}
      </section>

      <PriceBreakdownCard breakdown={breakdown} />

      <Button variant="primary" className="w-full" onClick={onContinue}>
        Continue to payment
      </Button>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span
        className="flex size-6 shrink-0 items-center justify-center text-ink-faint [&>svg]:size-4"
        aria-hidden="true"
      >
        {icon}
      </span>
      <dt className="w-line-xs shrink-0 text-caption text-ink-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-small text-ink">{value}</dd>
    </div>
  );
}

/**
 * The bill.
 *
 * Shared by the summary and the payment screen, so the number a customer
 * agreed to is provably the number they are charged.
 */
export function PriceBreakdownCard({
  breakdown,
}: {
  breakdown: PriceBreakdown;
}) {
  const gstPaise = breakdown.cgstPaise + breakdown.sgstPaise;

  return (
    <section className="rounded-card border border-border bg-surface">
      <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
        Payment details
      </h2>
      <dl className="space-y-2 p-4">
        <Line label="Service" value={breakdown.servicePaise} />
        {breakdown.discountPaise > 0 && (
          <Line label="Coupon discount" value={-breakdown.discountPaise} good />
        )}
        {breakdown.visitChargePaise > 0 && (
          <Line label="Visit charge" value={breakdown.visitChargePaise} />
        )}
        <Line label="Platform fee" value={breakdown.platformFeePaise} />
        {gstPaise > 0 && (
          <Line
            label="GST on platform fee"
            hint="CGST 9% + SGST 9%"
            value={gstPaise}
          />
        )}

        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
          <dt className="text-small font-semibold text-ink">Total payable</dt>
          <dd className="tabular text-heading font-semibold text-ink">
            {formatCurrency(breakdown.totalPaise)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function Line({
  label,
  hint,
  value,
  good = false,
}: {
  label: string;
  hint?: string | undefined;
  value: number;
  good?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="min-w-0 text-small text-ink-muted">
        {label}
        {hint && (
          <span className="block text-caption text-ink-faint">{hint}</span>
        )}
      </dt>
      <dd
        className={cn(
          "tabular shrink-0 text-small",
          good ? "font-medium text-live-ink" : "text-ink",
        )}
      >
        {value < 0 ? `− ${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
      </dd>
    </div>
  );
}

// -- 19: Coupons --------------------------------------------------------------

const COUPON_MESSAGE: Record<string, string> = {
  unknown: "That code does not exist, or is no longer active.",
  expired: "That coupon has expired.",
  exhausted: "That coupon has been fully claimed.",
  "min-order": "Your order is below the minimum for this coupon.",
  service: "That coupon does not apply to this service.",
  area: "That coupon is not available in your area.",
};

/**
 * Customer 19 — coupon entry, available offers, discount preview.
 *
 * A Sheet rather than a step: applying a coupon is optional, and a customer
 * who has none should never be made to walk through a screen about them.
 *
 * Refusals name the reason. "Invalid code" tells a customer nothing they can
 * act on; "your order is ₹200 below the minimum" tells them to add something.
 */
export function CouponSheet({
  open,
  onOpenChange,
  subtotalPaise,
  serviceName,
  area,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotalPaise: number;
  serviceName: string;
  area: string;
  onApplied: (coupon: Coupon, discountPaise: number) => void;
}) {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);
  const [offers, setOffers] = React.useState<Coupon[] | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setCode("");
    setFailure(null);
    getAvailableCoupons().then(setOffers).catch(() => setOffers([]));
  }, [open]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") return;
    setBusy(true);
    setFailure(null);
    applyCoupon({ code: trimmed, subtotalPaise, serviceName, area })
      .then((result) => {
        if (result.ok && result.coupon && result.discountPaise !== undefined) {
          toast.success(`${result.coupon.code} applied`);
          onApplied(result.coupon, result.discountPaise);
          onOpenChange(false);
          return;
        }
        setFailure(
          COUPON_MESSAGE[result.reason ?? "unknown"] ?? COUPON_MESSAGE["unknown"]!,
        );
      })
      .catch(() => setFailure("We could not check that code. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Coupons</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(code);
            }}
            className="flex gap-2"
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter a code"
              aria-label="Coupon code"
              autoCapitalize="characters"
              autoComplete="off"
              className="tabular"
            />
            <Button
              type="submit"
              variant="secondary"
              loading={busy}
              disabled={code.trim() === ""}
            >
              Apply
            </Button>
          </form>

          {failure !== null && (
            <InlineAlert tone="critical">{failure}</InlineAlert>
          )}

          <div>
            <h3 className="mb-2 text-small font-semibold text-ink">
              Available offers
            </h3>
            {offers === null ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-block-xs rounded-control" />
                ))}
              </div>
            ) : offers.length === 0 ? (
              <p className="text-small text-ink-muted">
                No offers are running right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {offers.map((c) => (
                  <li key={c.id}>
                    <OfferRow coupon={c} onApply={() => submit(c.code)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/**
 * One offer.
 *
 * The conditions are stated up front rather than discovered on refusal — a
 * minimum order or a service restriction is the difference between an offer a
 * customer can use and one that wastes their time.
 */
function OfferRow({
  coupon,
  onApply,
}: {
  coupon: Coupon;
  onApply: () => void;
}) {
  const value =
    coupon.discountType === "percent"
      ? `${coupon.discountValue}% off`
      : `${formatCurrency(coupon.discountValue)} off`;

  const conditions: string[] = [];
  if (coupon.restrictions.minOrderPaise > 0) {
    conditions.push(`on orders above ${formatCurrency(coupon.restrictions.minOrderPaise)}`);
  }
  if (coupon.restrictions.maxDiscountPaise > 0) {
    conditions.push(`up to ${formatCurrency(coupon.restrictions.maxDiscountPaise)}`);
  }
  if (coupon.restrictions.serviceNames.length > 0) {
    conditions.push(`selected services only`);
  }
  if (coupon.firstBookingOnly) conditions.push("first booking only");

  return (
    <div className="flex items-center gap-3 rounded-control border border-dashed border-border-strong p-3">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="tabular text-small font-semibold text-ink">
            {coupon.code}
          </span>
          <Badge tone="neutral">{value}</Badge>
        </span>
        {conditions.length > 0 && (
          <span className="mt-px block text-caption text-ink-muted">
            {conditions.join(" · ")}
          </span>
        )}
      </span>
      <Button variant="ghost" size="sm" className="shrink-0" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}

// -- 20: Payment --------------------------------------------------------------

const METHODS = [
  { id: "upi", label: "UPI", hint: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Card", hint: "Credit or debit", icon: CreditCard },
  { id: "wallet", label: "CFC wallet", hint: "Use your balance", icon: Wallet },
  { id: "cash", label: "Cash", hint: "Pay after the job", icon: Banknote },
] as const;

export type PaymentMethod = (typeof METHODS)[number]["id"];

/**
 * Customer 20 — how to pay.
 *
 * Razorpay is a backend integration and there are no keys here, so the online
 * methods hand off to a stand-in dialog rather than a real gateway. The screen
 * is honest about the boundary instead of miming a card form that goes
 * nowhere.
 *
 * Cash is a real path with no gateway at all, which is why it is offered as an
 * equal choice rather than a fallback.
 */
export function PaymentStep({
  breakdown,
  method,
  onMethodChange,
  walletPaise,
  onPay,
  paying,
}: {
  breakdown: PriceBreakdown;
  method: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  walletPaise: number;
  onPay: () => void;
  paying: boolean;
}) {
  const walletShort = walletPaise < breakdown.totalPaise;

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          How would you like to pay?
        </h2>
        <fieldset className="space-y-2 p-4">
          <legend className="sr-only">Payment method</legend>
          {METHODS.map(({ id, label, hint, icon: Icon }) => {
            const selected = method === id;
            const disabled = id === "wallet" && walletShort;
            return (
              <label
                key={id}
                className={cn(
                  "flex items-center gap-3 rounded-control border p-3",
                  "transition-colors duration-fast",
                  disabled
                    ? "cursor-not-allowed border-border-soft bg-disabled"
                    : "cursor-pointer",
                  selected && !disabled
                    ? "border-action bg-action-subtle"
                    : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="method"
                  value={id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onMethodChange(id)}
                  className="size-4 shrink-0 accent-action"
                />
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    disabled ? "text-disabled-ink" : "text-ink-muted",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-small font-medium",
                      disabled ? "text-disabled-ink" : "text-ink",
                    )}
                  >
                    {label}
                  </span>
                  <span className="block text-caption text-ink-muted">
                    {id === "wallet"
                      ? walletShort
                        ? `Balance ${formatCurrency(walletPaise)} — not enough for this booking`
                        : `Balance ${formatCurrency(walletPaise)}`
                      : hint}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      <PriceBreakdownCard breakdown={breakdown} />

      <Button
        variant="primary"
        className="w-full"
        loading={paying}
        onClick={onPay}
      >
        {method === "cash"
          ? `Confirm booking · ${formatCurrency(breakdown.totalPaise)}`
          : `Pay ${formatCurrency(breakdown.totalPaise)}`}
      </Button>

      <p className="text-caption text-ink-faint">
        {method === "cash"
          ? "Pay the professional after the job is done."
          : "You will be taken to a secure payment page."}
      </p>
    </div>
  );
}
