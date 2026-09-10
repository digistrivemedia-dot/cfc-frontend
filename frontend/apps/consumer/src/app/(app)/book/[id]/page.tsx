"use client";

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Check,
  Crosshair,
  House,
  MapPin,
  Plus,
} from "lucide-react";
import {
  createBooking,
  getAddresses,
  getConsumerProfile,
  getService,
  getSlots,
  priceBooking,
  saveAddress,
} from "@cfc/mocks";
import type { Address, Coupon, ServiceDetail, Slot } from "@cfc/types";
import {
  CouponSheet,
  OptionsStep,
  PaymentStep,
  SummaryStep,
  type PaymentMethod,
} from "./checkout-steps";
import { ConfirmationStep } from "./confirmation";
import {
  Badge,
  Button,
  Calendar,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  MapView,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Textarea,
  cn,
  formatCurrency,
  formatDayShort,
  formatTime,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";
import { useCart } from "@/lib/cart";

/**
 * Customer 15, 16, 17 — when, and where.
 *
 * One route, two steps in `?step=`. A stepped flow with real URLs means the
 * browser back button undoes one step rather than abandoning the booking,
 * which on a phone is the difference between a recoverable mistake and a lost
 * customer.
 *
 * Screen 17 (add/edit address) is a Sheet over step 2, not a third step. It is
 * a sub-task of choosing an address — a customer who adds one expects to land
 * back on the picker with it selected, not to be pushed forward.
 */

type Step = "options" | "slot" | "address" | "summary" | "payment" | "done";

const LABEL_ICON = {
  home: House,
  work: Briefcase,
  other: MapPin,
} as const;

const LABEL_TEXT = {
  home: "Home",
  work: "Work",
  other: "Other",
} as const;

/** Local `YYYY-MM-DD`. `toISOString()` would shift the day in IST. */
function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function BookInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const serviceId = params.id;
  const step = (search.get("step") as Step | null) ?? "options";
  const variantId = search.get("variant");

  /**
   * Add-ons chosen on Customer 14, as a comma-separated list of ids.
   *
   * In the URL for the same reason the variant and quantity are: a customer who
   * goes back to change the slot must not lose the extras they picked.
   */
  const addOnIds = React.useMemo(() => {
    const raw = search.get("addons");
    return raw === null || raw === "" ? [] : raw.split(",");
  }, [search]);

  /**
   * Units of the service. Customer 14 asks for a quantity.
   *
   * Held in the URL alongside the variant so a customer who goes back a step,
   * refreshes, or shares the link keeps what they chose — the same reason the
   * step and the variant live there.
   */
  const quantity = Math.max(1, Number(search.get("qty") ?? "1") || 1);

  const [service, setService] = React.useState<ServiceDetail | null>(null);
  const [error, setError] = React.useState(false);

  const [day, setDay] = React.useState<Date>(() => new Date());
  const [slots, setSlots] = React.useState<Slot[] | null>(null);
  const [slotAt, setSlotAt] = React.useState<string | null>(null);

  const [addresses, setAddresses] = React.useState<Address[] | null>(null);
  const [addressId, setAddressId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Address | null | "new">(null);

  const [coupon, setCoupon] = React.useState<Coupon | null>(null);
  const [discountPaise, setDiscountPaise] = React.useState(0);
  const [couponOpen, setCouponOpen] = React.useState(false);
  const [method, setMethod] = React.useState<PaymentMethod>("upi");
  const [walletPaise, setWalletPaise] = React.useState(0);
  const [paying, setPaying] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);

  const {
    lines: cartLines,
    remove: removeFromCart,
    has: inCart,
  } = useCart();

  /**
   * Whether the quantity was already set in the basket.
   *
   * Quantity belongs to the basket — it is chosen where the service is added.
   * Asking again on Customer 14 is the one thing genuinely duplicated between
   * the two screens, so when the service came from the basket the stepper is
   * replaced by a read-only line pointing back there.
   *
   * A customer who reached this route straight from a service page has no
   * basket line, and no other place to say "three ACs" — so they keep it.
   */
  const quantityFromCart = inCart(serviceId);

  React.useEffect(() => {
    getConsumerProfile()
      .then((profile) => setWalletPaise(profile.walletPaise))
      .catch(() => setWalletPaise(0));
  }, []);

  React.useEffect(() => {
    getService(serviceId)
      .then((s) => (s === null ? setError(true) : setService(s)))
      .catch(() => setError(true));
  }, [serviceId]);

  // Slots reload per day. The chosen slot clears with the day, because a
  // 10:00 window on Tuesday is not the same booking as 10:00 on Wednesday.
  React.useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setSlotAt(null);
    getSlots(serviceId, isoDay(day))
      .then((rows) => {
        if (!cancelled) setSlots(rows);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, day]);

  const loadAddresses = React.useCallback(() => {
    getAddresses()
      .then((rows) => {
        setAddresses(rows);
        setAddressId((current) => current ?? rows.find((a) => a.isDefault)?.id ?? null);
      })
      .catch(() => setAddresses([]));
  }, []);

  React.useEffect(() => loadAddresses(), [loadAddresses]);

  const goStep = (next: Step) => {
    const q = new URLSearchParams(search.toString());
    q.set("step", next);
    router.push(`/book/${serviceId}?${q.toString()}`);
  };

  // Falls back to the service's own default so the picker is never blank on a
  // customer who reached the flow without choosing a variant first.
  const variant =
    service?.variants.find((v) => v.id === variantId) ??
    service?.variants.find((v) => v.isDefault && v.active) ??
    service?.variants.find((v) => v.active) ??
    null;
  const unitPricePaise =
    (service?.basePricePaise ?? 0) + (variant?.priceDeltaPaise ?? 0);

  const selectedAddOns = React.useMemo(
    () => (service?.addOns ?? []).filter((a) => addOnIds.includes(a.id)),
    [service, addOnIds],
  );

  const addOnsPaise = selectedAddOns.reduce((sum, a) => sum + a.pricePaise, 0);

  // What the flow shows on Customer 14 before fees are added. Fees belong to
  // the summary, where they are itemised — showing them here would make the
  // subtotal disagree with every price on the screen above it.
  const optionsSubtotalPaise = unitPricePaise * quantity + addOnsPaise;

  const durationMinutes =
    (variant?.durationMinutes ?? 60) * quantity +
    selectedAddOns.reduce((sum, a) => sum + a.durationMinutes, 0);

  /**
   * Whether Customer 14 has anything to ask.
   *
   * A service with one variant and no add-ons has nothing to configure that
   * the basket has not already collected, and a step that renders a single
   * read-only line is a step a customer resents. Null while the service is
   * still loading — the answer is unknown, not "no".
   */
  const hasOptions =
    service === null || cartLines === null
      ? null
      : service.variants.filter((v) => v.active).length > 1 ||
        service.addOns.filter((a) => a.active).length > 0 ||
        !quantityFromCart;

  /**
   * Skip the empty step.
   *
   * `replace`, not `push`: the step was never shown, so it must not sit in
   * history for the back button to land on. Going back from date & time then
   * reaches the service page, which is where the customer actually came from.
   */
  React.useEffect(() => {
    if (step === "options" && hasOptions === false) {
      const q = new URLSearchParams(search.toString());
      q.set("step", "slot");
      router.replace(`/book/${serviceId}?${q.toString()}`, { scroll: false });
    }
  }, [step, hasOptions, search, router, serviceId]);

  // One breakdown, shared by the summary, the payment screen and the
  // confirmation, so the number a customer agreed to is the number charged.
  const breakdown = React.useMemo(
    () =>
      priceBooking({
        serviceId,
        variantDeltaPaise: variant?.priceDeltaPaise ?? 0,
        addOnsPaise,
        discountPaise,
        quantity,
      }),
    [serviceId, variant, addOnsPaise, discountPaise, quantity],
  );

  /** Rewrites one search param without adding a history entry. */
  const setParam = (key: string, value: string | null) => {
    const q = new URLSearchParams(search.toString());
    if (value === null || value === "") q.delete(key);
    else q.set(key, value);
    router.replace(`/book/${serviceId}?${q.toString()}`, { scroll: false });
  };

  const pay = () => {
    if (slotAt === null || addressId === null) return;
    setPaying(true);
    createBooking({
      serviceId,
      variantId: variant?.id ?? null,
      addOnIds,
      quantity,
      startsAt: slotAt,
      addressId,
      paymentMethod: method,
      couponCode: coupon?.code ?? null,
    })
      .then((result) => {
        setReference(result.reference);
        // Booked, so it leaves the basket. Otherwise a customer who came from
        // the cart returns to find the job they just paid for still sitting
        // there, and books it twice.
        removeFromCart(serviceId);
        goStep("done");
      })
      .catch(() => toast.error("We could not place that booking. Try again."))
      .finally(() => setPaying(false));
  };

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not start this booking"
          description="The service may no longer be available."
          action={{ label: "Browse services", onClick: () => router.push("/categories") }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12">
      {/* The confirmation is a terminal state: there is nothing to go back
          to, and offering it invites a customer to try re-paying. */}
      {step !== "done" && (
        <>
          <button
            type="button"
            onClick={() => {
              const back: Record<Step, () => void> = {
                options: () => router.push(`/service/${serviceId}`),
                // With nothing to configure there is no options step to go
                // back to — the service page is where they came from.
                slot: () =>
                  hasOptions === false
                    ? router.push(`/service/${serviceId}`)
                    : goStep("options"),
                address: () => goStep("slot"),
                summary: () => goStep("address"),
                payment: () => goStep("summary"),
                done: () => undefined,
              };
              back[step]();
            }}
            className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            {step === "slot" && hasOptions === false
              ? "Back to service"
              : BACK_LABEL[step]}
          </button>

          <Steps current={step} showOptions={hasOptions !== false} />
        </>
      )}

      {service === null ? (
        <Skeleton className="mt-4 h-block-lg rounded-card" />
      ) : (
        <>
          <div className="mt-4 rounded-card border border-border bg-surface p-4">
            <p className="text-caption text-ink-muted">You are booking</p>
            <p className="text-small font-semibold text-ink">{service.name}</p>
            <p className="tabular mt-1 text-small text-ink-muted">
              {variant ? `${variant.name} · ` : ""}
              {formatCurrency(unitPricePaise)}
              {quantity > 1 ? ` × ${quantity}` : ""}
            </p>
          </div>

          {step === "done" && reference !== null ? (
            <ConfirmationStep
              reference={reference}
              service={service}
              address={addresses?.find((a) => a.id === addressId) ?? null}
              startsAt={slotAt ?? new Date().toISOString()}
            />
          ) : step === "payment" ? (
            <PaymentStep
              breakdown={breakdown}
              method={method}
              onMethodChange={setMethod}
              walletPaise={walletPaise}
              paying={paying}
              onPay={pay}
            />
          ) : step === "summary" ? (
            <SummaryStep
              service={service}
              quantity={quantity}
              variant={variant}
              addOns={selectedAddOns}
              address={addresses?.find((a) => a.id === addressId) ?? null}
              slotAt={slotAt}
              coupon={coupon}
              breakdown={breakdown}
              onOpenCoupons={() => setCouponOpen(true)}
              onRemoveCoupon={() => {
                setCoupon(null);
                setDiscountPaise(0);
              }}
              onContinue={() => goStep("payment")}
            />
          ) : step === "slot" ? (
            <SlotStep
              day={day}
              onDayChange={setDay}
              slots={slots}
              slotAt={slotAt}
              onSlotChange={setSlotAt}
              onContinue={() => goStep("address")}
            />
          ) : step === "address" ? (
            <AddressStep
              addresses={addresses}
              selectedId={addressId}
              onSelect={setAddressId}
              onAdd={() => setEditing("new")}
              onEdit={(a) => setEditing(a)}
              slotAt={slotAt}
              onContinue={() => goStep("summary")}
            />
          ) : hasOptions === null ? (
            /* The basket is still loading, so whether this step has anything
               to ask is unknown. Rendering it now would flash a screen that
               the effect above is about to skip. */
            <Skeleton className="mt-4 h-block-lg rounded-card" />
          ) : (
            <OptionsStep
              service={service}
              variant={variant}
              onVariantChange={(id) => setParam("variant", id)}
              addOnIds={addOnIds}
              onToggleAddOn={(id) => {
                const next = addOnIds.includes(id)
                  ? addOnIds.filter((x) => x !== id)
                  : [...addOnIds, id];
                setParam("addons", next.join(","));
              }}
              quantity={quantity}
              onQuantityChange={(next) =>
                setParam("qty", next <= 1 ? null : String(next))
              }
              quantityFromCart={quantityFromCart}
              runningTotalPaise={optionsSubtotalPaise}
              durationMinutes={durationMinutes}
              onContinue={() => goStep("slot")}
            />
          )}
        </>
      )}

      {service !== null && (
        <CouponSheet
          open={couponOpen}
          onOpenChange={setCouponOpen}
          subtotalPaise={optionsSubtotalPaise}
          serviceName={service.name}
          area={addresses?.find((a) => a.id === addressId)?.area ?? ""}
          onApplied={(c, amount) => {
            setCoupon(c);
            setDiscountPaise(amount);
          }}
        />
      )}

      <AddressSheet
        open={editing !== null}
        address={editing === "new" ? null : editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSaved={(saved) => {
          setEditing(null);
          setAddressId(saved.id);
          loadAddresses();
        }}
      />
    </div>
  );
}

/**
 * Where the customer is in the flow.
 *
 * Four steps are named even though two are built, because a progress
 * indicator that grows as screens land tells a customer the flow got longer.
 * Unbuilt steps are visibly ahead, not hidden.
 */
const BACK_LABEL: Record<Step, string> = {
  options: "Back to service",
  slot: "Change options",
  address: "Change date and time",
  summary: "Change address",
  payment: "Back to summary",
  done: "",
};

function Steps({
  current,
  showOptions,
}: {
  current: Step;
  /** False for services with nothing to configure — the step is skipped. */
  showOptions: boolean;
}) {
  const steps: { key: string; label: string }[] = [
    ...(showOptions ? [{ key: "options", label: "Options" }] : []),
    { key: "slot", label: "Date & time" },
    { key: "address", label: "Address" },
    { key: "summary", label: "Summary" },
    { key: "payment", label: "Payment" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === current);

  return (
    <ol className="mt-3 flex items-center gap-1" aria-label="Booking steps">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={s.key} className="flex min-w-0 flex-1 items-center gap-1">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
                done && "bg-live text-on-action",
                active && "bg-action text-on-action",
                !done && !active && "bg-neutral-subtle text-ink-faint",
              )}
              aria-hidden="true"
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            <span
              className={cn(
                "truncate text-caption",
                active ? "font-medium text-ink" : "text-ink-faint",
              )}
              aria-current={active ? "step" : undefined}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="h-px min-w-0 flex-1 bg-border" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Customer 15 — calendar plus an AM/PM slot grid. */
function SlotStep({
  day,
  onDayChange,
  slots,
  slotAt,
  onSlotChange,
  onContinue,
}: {
  day: Date;
  onDayChange: (d: Date) => void;
  slots: Slot[] | null;
  slotAt: string | null;
  onSlotChange: (at: string) => void;
  onContinue: () => void;
}) {
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // The spec asks for AM/PM. Splitting at noon is what a customer means by
  // "morning" and "afternoon", and it halves the grid they have to scan.
  const groups = React.useMemo(() => {
    if (slots === null) return null;
    const morning = slots.filter((s) => new Date(s.startsAt).getHours() < 12);
    const afternoon = slots.filter((s) => new Date(s.startsAt).getHours() >= 12);
    return { morning, afternoon };
  }, [slots]);

  const anyAvailable = slots?.some((s) => s.available) ?? false;

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Pick a date
        </h2>
        <Calendar
          mode="single"
          selected={day}
          onSelect={(d) => d && onDayChange(d)}
          disabled={{ before: today }}
          // Booking beyond a month out is not something this platform
          // supports; a calendar that scrolls forever invites it.
          toDate={new Date(today.getTime() + 30 * 86_400_000)}
        />
      </section>

      <section className="rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Pick an arrival window
        </h2>

        {groups === null ? (
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-touch rounded-control" />
            ))}
          </div>
        ) : !anyAvailable ? (
          <EmptyState
            title="Nothing left on this day"
            description="Every window is taken. Try tomorrow, or a little later in the week."
          />
        ) : (
          <div className="space-y-4 p-4">
            <SlotGroup
              label="Morning"
              slots={groups.morning}
              slotAt={slotAt}
              onSelect={onSlotChange}
            />
            <SlotGroup
              label="Afternoon and evening"
              slots={groups.afternoon}
              slotAt={slotAt}
              onSelect={onSlotChange}
            />
          </div>
        )}
      </section>

      <Button
        variant="primary"
        className="w-full"
        disabled={slotAt === null}
        onClick={onContinue}
      >
        {slotAt === null ? "Pick a time to continue" : "Continue to address"}
      </Button>
    </div>
  );
}

function SlotGroup({
  label,
  slots,
  slotAt,
  onSelect,
}: {
  label: string;
  slots: Slot[];
  slotAt: string | null;
  onSelect: (at: string) => void;
}) {
  if (slots.length === 0) return null;

  return (
    <fieldset>
      <legend className="mb-2 text-caption font-medium text-ink-muted">
        {label}
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((s) => {
          const start = new Date(s.startsAt);
          const end = new Date(start.getTime() + s.durationMinutes * 60_000);
          const selected = s.startsAt === slotAt;
          return (
            <button
              key={s.startsAt}
              type="button"
              disabled={!s.available}
              aria-pressed={selected}
              onClick={() => onSelect(s.startsAt)}
              className={cn(
                "tabular flex h-touch items-center justify-center rounded-control border text-small",
                "transition-colors duration-fast",
                selected
                  ? "border-action bg-action font-medium text-on-action"
                  : "border-border bg-surface text-ink hover:border-action-line hover:bg-action-subtle",
                // A taken window stays visible rather than disappearing: a
                // grid that changes shape between days is hard to scan.
                !s.available &&
                  "cursor-not-allowed border-border-soft bg-disabled text-disabled-ink line-through hover:bg-disabled",
              )}
            >
              {formatTime(start)} – {formatTime(end)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Customer 16 — saved addresses, map pin, detect location. */
function AddressStep({
  addresses,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  slotAt,
  onContinue,
}: {
  addresses: Address[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (a: Address) => void;
  slotAt: string | null;
  onContinue: () => void;
}) {
  const selected = addresses?.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="mt-4 space-y-4">
      {slotAt !== null && (
        <div className="rounded-card border border-action-line bg-action-subtle p-3">
          <p className="text-caption text-ink-muted">Arriving</p>
          <p className="tabular text-small font-medium text-ink">
            {formatDayShort(new Date(slotAt))}, {formatTime(new Date(slotAt))}
          </p>
        </div>
      )}

      <section className="rounded-card border border-border bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-small font-semibold text-ink">Where to?</h2>
          <Button variant="ghost" size="sm" onClick={onAdd}>
            <Plus />
            Add new
          </Button>
        </div>

        {addresses === null ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-block-xs rounded-control" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <EmptyState
            title="No saved addresses"
            description="Add one so a professional knows where to come."
            action={{ label: "Add an address", onClick: onAdd }}
          />
        ) : (
          <ul className="divide-y divide-border-soft">
            {addresses.map((a) => (
              <li key={a.id}>
                <AddressRow
                  address={a}
                  selected={a.id === selectedId}
                  onSelect={() => onSelect(a.id)}
                  onEdit={() => onEdit(a)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The map confirms the pin rather than setting it. Placing a pin by
          dragging needs the Maps SDK, which is out of frontend scope — so the
          honest thing is to show where we think the address is and let the
          customer correct the text. */}
      {selected !== null && (
        <section className="overflow-hidden rounded-card border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
            On the map
          </h2>
          <MapView
            className="h-block-md"
            markers={[
              {
                id: selected.id,
                // MapView is a styled canvas standing in for the Maps SDK, so
                // it takes percentages rather than coordinates. The pin is
                // centred: with one marker there is nothing to place it
                // relative to, and an off-centre pin would imply a precision
                // this placeholder does not have.
                x: 50,
                y: 50,
                kind: "customer",
                label: LABEL_TEXT[selected.label],
              },
            ]}
          />
        </section>
      )}

      <Button
        variant="primary"
        className="w-full"
        disabled={selectedId === null}
        onClick={onContinue}
      >
        {selectedId === null ? "Choose an address" : "Continue to summary"}
      </Button>
    </div>
  );
}

function AddressRow({
  address,
  selected,
  onSelect,
  onEdit,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const Icon = LABEL_ICON[address.label];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 transition-colors duration-fast",
        selected && "bg-action-subtle",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span
          className={cn(
            "flex size-tile shrink-0 items-center justify-center rounded-control",
            selected ? "bg-action text-on-action" : "bg-neutral-subtle text-ink-muted",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-small font-medium text-ink">
              {LABEL_TEXT[address.label]}
            </span>
            {address.isDefault && <Badge tone="neutral">Default</Badge>}
          </span>
          <span className="mt-px block text-caption text-ink-muted">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}, {address.area} —{" "}
            <span className="tabular">{address.pincode}</span>
          </span>
          {address.landmark && (
            <span className="mt-px block text-caption text-ink-faint">
              {address.landmark}
            </span>
          )}
        </span>
      </button>

      <Button variant="ghost" size="sm" className="shrink-0" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

/**
 * Customer 17 — the address form.
 *
 * A Sheet rather than a route: adding an address is a detour from choosing
 * one, and a customer who finishes expects to land back on the picker with the
 * new address selected.
 */
function AddressSheet({
  open,
  address,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  address: Address | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: Address) => void;
}) {
  const [label, setLabel] = React.useState<Address["label"]>("home");
  const [line1, setLine1] = React.useState("");
  const [line2, setLine2] = React.useState("");
  const [landmark, setLandmark] = React.useState("");
  const [area, setArea] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [makeDefault, setMakeDefault] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [point, setPoint] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLabel(address?.label ?? "home");
    setLine1(address?.line1 ?? "");
    setLine2(address?.line2 ?? "");
    setLandmark(address?.landmark ?? "");
    setArea(address?.area ?? "");
    setPincode(address?.pincode ?? "");
    setMakeDefault(address?.isDefault ?? false);
    setPoint(address?.point ?? null);
  }, [open, address]);

  const valid =
    line1.trim() !== "" && area.trim() !== "" && /^\d{6}$/.test(pincode);

  /**
   * "Detect location", honestly.
   *
   * The browser's Geolocation API gives coordinates, not an address — turning
   * one into the other needs a geocoding service we do not have. So this fills
   * the map pin and says as much, rather than pretending to fill the form.
   */
  const detect = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast.error("Your browser cannot share a location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Pin set. Please still type the address for the professional.");
      },
      () => {
        setLocating(false);
        toast.error("We could not get your location.");
      },
      { timeout: 10_000 },
    );
  };

  const submit = () => {
    if (!valid) return;
    setBusy(true);
    saveAddress({
      ...(address ? { id: address.id } : {}),
      label,
      line1: line1.trim(),
      ...(line2.trim() ? { line2: line2.trim() } : {}),
      ...(landmark.trim() ? { landmark: landmark.trim() } : {}),
      area: area.trim(),
      city: "Tiruchirappalli",
      state: "Tamil Nadu",
      pincode,
      point: point ?? { lat: 10.7905, lng: 78.7047 },
      isDefault: makeDefault,
    })
      .then((saved) => {
        toast.success(address ? "Address updated" : "Address saved");
        onSaved(saved);
      })
      .catch(() => toast.error("We could not save that. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{address ? "Edit address" : "Add an address"}</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <FormField label="Save as">
            <div className="flex gap-2">
              {(["home", "work", "other"] as const).map((key) => {
                const Icon = LABEL_ICON[key];
                const on = label === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLabel(key)}
                    aria-pressed={on}
                    className={cn(
                      "flex h-touch flex-1 items-center justify-center gap-2 rounded-control border text-small",
                      "transition-colors duration-fast",
                      on
                        ? "border-action bg-action-subtle font-medium text-action-press"
                        : "border-border bg-surface text-ink hover:border-action-line",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {LABEL_TEXT[key]}
                  </button>
                );
              })}
            </div>
          </FormField>

          <Button
            variant="secondary"
            className="w-full"
            loading={locating}
            onClick={detect}
          >
            <Crosshair />
            Use my current location
          </Button>

          <FormField label="Flat, house or building" required>
            <Input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="e.g. 42, Kaveri Nagar"
              autoComplete="address-line1"
            />
          </FormField>

          <FormField label="Street or locality">
            <Input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="e.g. Near Temple Street"
              autoComplete="address-line2"
            />
          </FormField>

          <FormField
            label="Landmark"
            help="What the professional should look for."
          >
            <Textarea
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Opposite the pharmacy, blue gate"
              rows={2}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Area" required>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Srirangam"
                autoComplete="address-level2"
              />
            </FormField>
            <FormField label="Pincode" required>
              <Input
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                placeholder="620006"
                autoComplete="postal-code"
                className="tabular"
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-small text-ink">
            <input
              type="checkbox"
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
              className="size-4 accent-action"
            />
            Use this as my default address
          </label>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            disabled={!valid}
            onClick={submit}
          >
            {address ? "Save changes" : "Save address"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function BookPageInner() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
          <Skeleton className="h-block-lg rounded-card" />
        </div>
      }
    >
      <BookInner />
    </Suspense>
  );
}

/**
 * Booking needs an account.
 *
 * Browsing, searching and filling a basket are all public — a stranger has to
 * be able to see what CFC sells and what it costs before committing to
 * anything. But this flow collects a saved address, a slot and a payment, all
 * of which belong to a person, so it asks here rather than failing later at
 * the address step with a form it cannot fill.
 */
export default function BookPage() {
  return (
    <RequireAccount
      title="Sign in to book"
      description="We need an account to save your address, hold your slot and send you the pro's details."
    >
      <BookPageInner />
    </RequireAccount>
  );
}
