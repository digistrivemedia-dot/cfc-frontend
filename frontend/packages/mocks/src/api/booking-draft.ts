import type { Coupon, PriceBreakdown } from "@cfc/types";
import { CGST_BPS, SGST_BPS } from "@cfc/types";
import { coupons } from "../fixtures/promotions";
import { pricingRules } from "../fixtures/catalog";
import { applyScenario, latency } from "../control";

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
}: {
  code: string;
  subtotalPaise: number;
  serviceName: string;
  area: string;
}): Promise<CouponResult> {
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
}): Promise<{ reference: string; startsAt: string }> {
  await latency();
  const n = Math.floor(10_000_000 + Math.random() * 89_999_999);
  return applyScenario(
    { reference: `CFC${n}`, startsAt: draft.startsAt },
    { reference: "CFC00000000", startsAt: draft.startsAt },
  );
}
