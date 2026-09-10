"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  Calendar as CalendarIcon,
  Check,
  CreditCard,
  MapPin,
  Minus,
  Plus,
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
  ServiceAddOn,
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

// -- 14: Service options ------------------------------------------------------

/**
 * Minutes as a customer would say them. 90 → "1 hr 30 min".
 *
 * Durations here are estimates on site, so anything past an hour reads better
 * in hours than as a three-digit minute count nobody converts in their head.
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = `${hours} hr`;
  return rest === 0 ? h : `${h} ${rest} min`;
}

/**
 * Customer 14 — variant picker, add-ons, quantity.
 *
 * The three decisions that define *what* is being booked, before the flow moves
 * on to when and where. They belong on one screen because they are one
 * question — a customer choosing "2 ton window" is also deciding whether they
 * want the outdoor unit washed, and splitting that across screens makes them
 * navigate backwards to compare prices.
 *
 * A running total sits at the bottom rather than only on the summary: every
 * control here changes the price, and a customer who cannot see the effect of
 * ticking an add-on is being asked to commit blind.
 */
export function OptionsStep({
  service,
  variant,
  onVariantChange,
  addOnIds,
  onToggleAddOn,
  quantity,
  onQuantityChange,
  quantityFromCart,
  runningTotalPaise,
  durationMinutes,
  onContinue,
}: {
  service: ServiceDetail;
  variant: ServiceVariant | null;
  onVariantChange: (id: string) => void;
  addOnIds: string[];
  onToggleAddOn: (id: string) => void;
  quantity: number;
  onQuantityChange: (next: number) => void;
  /**
   * True when the basket already set the quantity.
   *
   * The stepper is hidden in that case: quantity is a basket concept, and
   * asking for it twice is the one thing this screen and the basket genuinely
   * duplicate. A customer who came straight from a service page keeps it,
   * because there is nowhere else for them to say "three ACs".
   */
  quantityFromCart: boolean;
  runningTotalPaise: number;
  durationMinutes: number;
  onContinue: () => void;
}) {
  const variants = service.variants.filter((v) => v.active);
  const addOns = service.addOns.filter((a) => a.active);

  return (
    <div className="mt-4 space-y-4">
      {variants.length > 1 && (
        <section className="rounded-card border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
            Choose an option
          </h2>
          <fieldset className="space-y-2 p-4">
            <legend className="sr-only">Service option</legend>
            {variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                basePricePaise={service.basePricePaise}
                selected={variant?.id === v.id}
                onSelect={() => onVariantChange(v.id)}
              />
            ))}
          </fieldset>
        </section>
      )}

      {quantityFromCart ? (
        quantity > 1 && (
          <div className="flex items-baseline justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
            <p className="text-small text-ink">
              <span className="tabular font-semibold">{quantity}</span> of this
              service
            </p>
            <Link
              href="/cart"
              className="shrink-0 text-caption font-medium text-action hover:text-action-hover"
            >
              Change in basket
            </Link>
          </div>
        )
      ) : (
        <QuantityPicker
          value={quantity}
          unitPricePaise={
            service.basePricePaise + (variant?.priceDeltaPaise ?? 0)
          }
          onChange={onQuantityChange}
        />
      )}

      {addOns.length > 0 && (
        <section className="rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-small font-semibold text-ink">
              Add anything else?
            </h2>
            <p className="mt-px text-caption text-ink-muted">
              Optional. The same professional does these on the same visit.
            </p>
          </div>
          <ul className="divide-y divide-border-soft">
            {addOns.map((a) => (
              <li key={a.id}>
                <AddOnRow
                  addOn={a}
                  checked={addOnIds.includes(a.id)}
                  onToggle={() => onToggleAddOn(a.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The estimate is time on site, not a promise of when the pro arrives —
          that is the slot on the next step, and conflating the two is how a
          customer ends up expecting a 60-minute job to be finished 60 minutes
          after booking. */}
      <div className="flex items-baseline justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="text-caption text-ink-muted">
            Estimated time on site
          </p>
          <p className="tabular text-small font-medium text-ink">
            About {formatDuration(durationMinutes)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-caption text-ink-muted">Subtotal</p>
          <p className="tabular text-heading font-semibold text-ink">
            {formatCurrency(runningTotalPaise)}
          </p>
        </div>
      </div>

      <Button variant="primary" className="w-full" onClick={onContinue}>
        Continue to date and time
      </Button>
    </div>
  );
}

/**
 * One variant.
 *
 * Priced absolutely rather than as "+₹200": a customer comparing options wants
 * to know what each one costs, not to do arithmetic against a base price shown
 * somewhere else on the screen.
 */
function VariantRow({
  variant,
  basePricePaise,
  selected,
  onSelect,
}: {
  variant: ServiceVariant;
  basePricePaise: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-control border p-3",
        "transition-colors duration-fast",
        selected ? "border-action bg-action-subtle" : "border-border",
      )}
    >
      <input
        type="radio"
        name="variant"
        value={variant.id}
        checked={selected}
        onChange={onSelect}
        className="size-4 shrink-0 accent-action"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-small font-medium text-ink">
          {variant.name}
        </span>
        <span className="tabular block text-caption text-ink-muted">
          About {formatDuration(variant.durationMinutes)}
        </span>
      </span>
      <span className="tabular shrink-0 text-small font-semibold text-ink">
        {formatCurrency(basePricePaise + variant.priceDeltaPaise)}
      </span>
    </label>
  );
}

/** One optional extra. */
function AddOnRow({
  addOn,
  checked,
  onToggle,
}: {
  addOn: ServiceAddOn;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 p-4 transition-colors duration-fast",
        checked && "bg-action-subtle",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-px size-4 shrink-0 accent-action"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-small font-medium text-ink">
          {addOn.name}
        </span>
        <span className="mt-px block text-caption text-ink-muted">
          {addOn.description}
        </span>
        <span className="tabular mt-px block text-caption text-ink-faint">
          Adds about {formatDuration(addOn.durationMinutes)}
        </span>
      </span>
      <span className="tabular shrink-0 text-small font-semibold text-ink">
        {formatCurrency(addOn.pricePaise)}
      </span>
    </label>
  );
}

/**
 * How many of this service. Customer 14.
 *
 * Capped at a number a single visit can plausibly cover. Someone who needs
 * fifteen ACs serviced is not making a consumer booking — they want the
 * business enquiry, and letting them type 15 here would promise a slot no pro
 * can honour.
 *
 * The unit price is restated beside the stepper because the total multiplies
 * it, and a customer who cannot see the arithmetic assumes the larger number
 * is a mistake.
 */
const MAX_UNITS = 6;

function QuantityPicker({
  value,
  unitPricePaise,
  onChange,
}: {
  value: number;
  unitPricePaise: number;
  onChange: (next: number) => void;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-small font-semibold text-ink">How many?</h2>
          <p className="mt-1 text-caption text-ink-muted">
            <span className="tabular">{formatCurrency(unitPricePaise)}</span>{" "}
            each. One visit covers all of them.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-control border border-border">
          <Button
            variant="ghost"
            size="icon-md"
            onClick={() => onChange(value - 1)}
            disabled={value <= 1}
            aria-label="One fewer"
          >
            <Minus />
          </Button>
          <span
            className="tabular w-6 text-center text-body font-semibold text-ink"
            aria-live="polite"
          >
            {value}
          </span>
          <Button
            variant="ghost"
            size="icon-md"
            onClick={() => onChange(value + 1)}
            disabled={value >= MAX_UNITS}
            aria-label="One more"
          >
            <Plus />
          </Button>
        </div>
      </div>

      {value >= MAX_UNITS && (
        <p className="mt-3 text-caption text-ink-muted">
          Need more than {MAX_UNITS}? Call us and we will arrange a team.
        </p>
      )}
    </section>
  );
}

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
  quantity,
  variant,
  addOns,
  address,
  slotAt,
  coupon,
  breakdown,
  onOpenCoupons,
  onRemoveCoupon,
  onContinue,
}: {
  service: ServiceDetail;
  /** Units booked. Shown on the service line when it is more than one. */
  quantity: number;
  variant: ServiceVariant | null;
  /** The extras chosen on Customer 14. Named here, not just totalled. */
  addOns: ServiceAddOn[];
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
                {/* Quantity rides on the service line rather than getting a
                    row of its own: it is a property of what was booked, and
                    a "Quantity: 1" row on every single-unit booking is noise.
                    Shown only when it is not one — which is when it explains
                    a total that would otherwise look wrong. */}
                {quantity > 1 && (
                  <span className="tabular"> × {quantity}</span>
                )}
                {variant ? (
                  <span className="block text-caption text-ink-muted">
                    {variant.name}
                  </span>
                ) : null}
              </>
            }
          />
          {addOns.length > 0 && (
            <SummaryRow
              icon={<Plus />}
              label="Add-ons"
              value={
                <ul className="space-y-px">
                  {addOns.map((a) => (
                    <li key={a.id} className="flex justify-between gap-3">
                      <span className="min-w-0">{a.name}</span>
                      <span className="tabular shrink-0 text-ink-muted">
                        {formatCurrency(a.pricePaise)}
                      </span>
                    </li>
                  ))}
                </ul>
              }
            />
          )}
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
        {breakdown.addOnsPaise > 0 && (
          <Line label="Add-ons" value={breakdown.addOnsPaise} />
        )}
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
