import type { Coupon, PriceBreakdown } from "@cfc/types";
import { CGST_BPS, SGST_BPS } from "@cfc/types";
import { coupons } from "../fixtures/promotions";
import { pricingRules } from "../fixtures/catalog";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

/**
 * Customer 18, 19, 20, 21 — pricing a booking, applying a coupon, and placing
 * it.
 *
 * The money rules live here rather than on a screen so the summary, the
 * payment screen and the invoice cannot drift apart.
 */

export type CouponFailure =
  | "unknown"
  | "expired"
  | "exhausted"
  | "min-order"
  | "service"
  | "area";

export interface CouponResult {
  ok: boolean;
  coupon?: Coupon;
  discountPaise?: number;
  /** Why it was refused. The screen turns this into a sentence. */
  reason?: CouponFailure;
}

/**
 * Prices one booking.
 *
 * **GST is on the platform fee only**, per the agreement — never on the
 * professional's fee. It is 9% CGST + 9% SGST *of the platform fee*, not of
 * the subtotal, and computing it the other way overcharges every customer.
 *
 * The discount comes off the service before fees. A coupon discounts the work,
 * not CFC's fee, so the platform fee and its GST are unchanged by it.
 */
export function priceBooking({
  serviceId,
  variantDeltaPaise = 0,
  addOnsPaise = 0,
  discountPaise = 0,
  quantity = 1,
}: {
  serviceId: string;
  variantDeltaPaise?: number;
  /**
   * Every selected add-on, summed. Customer 14.
   *
   * Charged once per booking rather than per unit: an add-on is a discrete
   * extra the pro does on the visit, not a property of each unit being
   * serviced. Someone booking three ACs and one deep-clean add-on wants one
   * deep clean, and multiplying it would bill them for three.
   */
  addOnsPaise?: number;
  discountPaise?: number;
  /**
   * How many of this service, for jobs that come in units — two bathrooms,
   * three ACs. Customer 14 asks for it.
   *
   * Only the work multiplies. The visit charge covers getting a pro to the
   * door and the platform fee covers taking the booking, and neither happens
   * twice because the customer asked for two bathrooms cleaned in one visit.
   * Charging them per unit would be double-billing for one trip.
   */
  quantity?: number;
}): PriceBreakdown {
  const rule = pricingRules.find((r) => r.serviceId === serviceId);
  const base = rule?.basePricePaise ?? 0;
  const visitChargePaise = rule?.visitChargePaise ?? 0;
  const platformFeePaise = rule?.platformFeePaise ?? 0;

  const units = Math.max(1, Math.floor(quantity));
  const servicePaise = (base + variantDeltaPaise) * units;
  const extrasPaise = Math.max(0, addOnsPaise);

  // A discount never exceeds the work it applies to, or the total goes
  // negative and the customer is owed money for booking. Add-ons count as
  // work: they are the professional's labour too, so a coupon discounts them.
  const capped = Math.min(
    Math.max(0, discountPaise),
    servicePaise + extrasPaise,
  );

  const cgstPaise = Math.round((platformFeePaise * CGST_BPS) / 10_000);
  const sgstPaise = Math.round((platformFeePaise * SGST_BPS) / 10_000);

  return {
    servicePaise,
    addOnsPaise: extrasPaise,
    visitChargePaise,
    platformFeePaise,
    discountPaise: capped,
    cgstPaise,
    sgstPaise,
    totalPaise:
      servicePaise +
      extrasPaise -
      capped +
      visitChargePaise +
      platformFeePaise +
      cgstPaise +
      sgstPaise,
  };
}

/**
 * The server's own price for a draft. Customer 18.
 *
 * `priceBooking` above stays **synchronous and client-side**, because a summary
 * that re-renders on every add-on tick cannot wait on a round trip. This is the
 * authority: `createBooking` recomputes from the same code path server-side, so
 * what is displayed and what is charged come from one implementation.
 *
 * Where the two disagree, the server wins and `createBooking` answers 409
 * rather than quietly charging a different number.
 */
export async function priceBookingLive(draft: {
  serviceId: string;
  variantId?: string | null;
  addOnIds?: string[];
  quantity?: number;
  addressId?: string;
  couponCode?: string | null;
}): Promise<PriceBreakdown> {
  return fetchJson<PriceBreakdown>("/consumer/bookings/price", { body: draft });
}

/**
 * Checks a code against a booking.
 *
 * Every restriction the coupon carries is enforced, and the failure is named,
 * because "invalid code" is the least useful message a checkout can give. A
 * customer told the order is ₹200 short of the minimum will add something; a
 * customer told "invalid" will leave.
 */
export async function applyCoupon({
  code,
  subtotalPaise,
  serviceName,
  area,
  serviceId,
  addressId,
  variantId,
  addOnIds,
  quantity,
}: {
  code: string;
  subtotalPaise: number;
  serviceName: string;
  area: string;
  /** Live only — the server evaluates against the real draft, not a subtotal. */
  serviceId?: string;
  addressId?: string;
  variantId?: string | null;
  addOnIds?: string[];
  quantity?: number;
}): Promise<CouponResult> {
  if (isLive("applyCoupon")) {
    return fetchJson<CouponResult>("/consumer/bookings/coupon", {
      body: { code, serviceId, addressId, variantId, addOnIds, quantity },
    });
  }
  await latency();

  const found = coupons.find(
    (c) => c.code.toLowerCase() === code.trim().toLowerCase() && c.active,
  );
  if (!found) return applyScenario({ ok: false, reason: "unknown" }, { ok: false });

  if (Date.parse(found.expiresAt) < Date.now()) {
    return applyScenario({ ok: false, reason: "expired" }, { ok: false });
  }
  if (found.maxUses > 0 && found.usedCount >= found.maxUses) {
    return applyScenario({ ok: false, reason: "exhausted" }, { ok: false });
  }

  const r = found.restrictions;
  if (r.minOrderPaise > 0 && subtotalPaise < r.minOrderPaise) {
    return applyScenario({ ok: false, reason: "min-order", coupon: found }, { ok: false });
  }
  if (r.serviceNames.length > 0 && !r.serviceNames.includes(serviceName)) {
    return applyScenario({ ok: false, reason: "service", coupon: found }, { ok: false });
  }
  if (r.areas.length > 0 && !r.areas.includes(area)) {
    return applyScenario({ ok: false, reason: "area", coupon: found }, { ok: false });
  }

  const raw =
    found.discountType === "percent"
      ? Math.round((subtotalPaise * found.discountValue) / 100)
      : found.discountValue;

  // A percentage coupon can carry a rupee ceiling — "20% off up to ₹300".
  const discountPaise =
    r.maxDiscountPaise > 0 ? Math.min(raw, r.maxDiscountPaise) : raw;

  return applyScenario(
    { ok: true, coupon: found, discountPaise },
    { ok: false },
  );
}

/** Coupons a customer can see and tap, rather than having to know the code. */
export async function getAvailableCoupons() {
  if (isLive("getAvailableCoupons")) {
    return fetchJson<Coupon[]>("/consumer/bookings/coupons");
  }
  await latency();
  const live = coupons.filter(
    (c) =>
      c.active &&
      Date.parse(c.expiresAt) > Date.now() &&
      (c.maxUses === 0 || c.usedCount < c.maxUses),
  );
  return applyScenario(live, []);
}

/**
 * Places the booking. Customer 21 needs the reference back.
 *
 * There is no write path behind this — the reference is generated here and
 * nothing persists. That is the honest boundary of a mock, and the shape is
 * what the real endpoint will return.
 */
export async function createBooking(draft: {
  serviceId: string;
  variantId: string | null;
  /** Ids of the add-ons chosen on Customer 14. Empty when none. */
  addOnIds?: string[];
  /** Units of the service — two bathrooms, three ACs. Defaults to one. */
  quantity?: number;
  startsAt: string;
  addressId: string;
  paymentMethod: string;
  couponCode: string | null;
  notes?: string | null;
  /**
   * A key identifying this booking attempt.
   *
   * Generate it **once** when the checkout screen mounts and send the same
   * value on every retry, so a double-tap on a slow connection is one booking
   * and a deliberate second booking is two.
   */
  idempotencyKey?: string;
  /**
   * The total the customer was shown.
   *
   * Sent to be **compared, not used**. If the price moved while they were
   * deciding, the server answers 409 so they see the new figure before being
   * charged rather than after.
   */
  expectedTotalPaise?: number;
}): Promise<{ reference: string; startsAt: string }> {
  if (isLive("createBooking")) {
    return fetchJson<{ reference: string; startsAt: string }>(
      "/consumer/bookings",
      {
        body: {
          ...draft,
          /**
           * A per-attempt key, so a double-tap on a slow connection is one
           * booking rather than two. Generated here because only the client
           * knows that two requests are the same user action.
           */
          // Supplied by the caller where it can be — a key held in the
          // checkout screen's state is the only thing that truly distinguishes
          // "they tapped twice" from "they booked again". Falls back to a
          // derived key for callers that have not been updated.
          idempotencyKey: draft.idempotencyKey ?? newIdempotencyKey(draft),
        },
      },
    );
  }
  await latency();
  const n = Math.floor(10_000_000 + Math.random() * 89_999_999);
  return applyScenario(
    { reference: `CFC${n}`, startsAt: draft.startsAt },
    { reference: "CFC00000000", startsAt: draft.startsAt },
  );
}

/**
 * A fallback key, for callers that do not supply one.
 *
 * **This has a real and now-demonstrated failure mode.** It buckets by the
 * minute, so two deliberate bookings of the same service, slot and address
 * inside one minute collapse into a single booking — the second request
 * silently returns the first one's reference and no second job exists. That
 * was written off as hypothetical and then happened within an hour of being
 * written, which is the usual way.
 *
 * It is kept only because it is strictly better than no key at all for a
 * caller that has not been updated. **Pass `idempotencyKey` from the checkout
 * screen** and this is never used.
 */
function newIdempotencyKey(draft: {
  serviceId: string;
  startsAt: string;
  addressId: string;
}): string {
  const minute = Math.floor(Date.now() / 60_000);
  return `${draft.serviceId}:${draft.addressId}:${draft.startsAt}:${minute}`;
}
