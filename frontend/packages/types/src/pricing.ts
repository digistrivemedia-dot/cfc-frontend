import type { Paise } from "./primitives";

/**
 * What a customer actually pays, itemised.
 *
 * One shape, computed in one place, so the summary screen, the payment screen
 * and the invoice cannot disagree about a number. A booking total assembled
 * separately on three screens is a booking total that will eventually be
 * assembled three different ways.
 *
 * The rule that matters, from the agreement: **GST is charged on the platform
 * fee only, never on the professional's fee.** CGST 9% + SGST 9% of the
 * platform fee — not of the subtotal. Getting this wrong overcharges every
 * customer and is the kind of error that surfaces in an audit rather than in
 * testing.
 */
export interface PriceBreakdown {
  /** The service and its chosen variant. */
  servicePaise: Paise;
  /** Every selected add-on, summed. Zero when none were chosen. */
  addOnsPaise: Paise;
  /** Charged for the visit itself. Often zero. */
  visitChargePaise: Paise;
  /** CFC's fee, admin-editable per service. GST applies to this alone. */
  platformFeePaise: Paise;
  /** Applied to the service before fees. Negative is not possible. */
  discountPaise: Paise;
  /** 9% of the platform fee. */
  cgstPaise: Paise;
  /** 9% of the platform fee. */
  sgstPaise: Paise;
  /** What the customer pays. */
  totalPaise: Paise;
}

/** CGST and SGST are 9% each, per the agreement. */
export const CGST_BPS = 900;
export const SGST_BPS = 900;
