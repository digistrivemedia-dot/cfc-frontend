import type {
  ExtraCharge,
  Paise,
  ProEarning,
  QuotationMaterialLine,
} from "@cfc/types";
import { settleJob } from "./pro-earnings";
import { latency } from "../control";

/**
 * Pro 15, 16, 17, 18, 19 — doing the work and closing the job.
 *
 * The rules from the agreement that this file enforces rather than merely
 * documents, because each one has a real consequence for the pro:
 *
 *   **Minimum 2 before-photos on a quotation.** Fewer means the quote is
 *   auto-rejected. Enforced here as well as in the UI: a pro should not be able
 *   to submit something the platform will throw away.
 *
 *   **Quotes above ₹5,000 need phone confirmation with the customer.** Not a
 *   block — a warning the pro should see before submitting, so they are not
 *   surprised when the admin calls.
 *
 *   **The admin decides within 15 minutes.** Surfaced as a real deadline on the
 *   status screen, since it is how long the pro is standing there waiting.
 *
 *   **Completion needs the customer's OTP.** The code belongs to the customer,
 *   not the pro, which is the whole point of it.
 */

/** Minimum before-photos on a quotation. Below this it is auto-rejected. */
export const QUOTATION_MIN_BEFORE_PHOTOS = 2;

/** Above this, the admin phones the customer to confirm. */
export const PHONE_CONFIRM_THRESHOLD_PAISE = 500_000;

/** The admin's decision window on a submitted quote. */
export const QUOTATION_WINDOW_MINUTES = 15;

/** Why a quotation could not be submitted. */
export type QuoteRejection =
  | { reason: "too-few-photos"; needed: number }
  | { reason: "no-description" }
  | { reason: "no-amount" };

export type QuoteSubmission =
  | {
      ok: true;
      quotationId: string;
      totalPaise: Paise;
      /** True when the total crosses the phone-confirmation threshold. */
      needsPhoneConfirmation: boolean;
      /** When the admin's 15 minutes run out. */
      decisionBy: string;
    }
  | { ok: false; error: QuoteRejection };

export interface QuoteDraft {
  jobId: string;
  description: string;
  materials: QuotationMaterialLine[];
  labourPaise: Paise;
  beforePhotoCount: number;
}

/** The quote's total. One function, so the form and the submission agree. */
export function quoteTotal(draft: {
  materials: QuotationMaterialLine[];
  labourPaise: Paise;
}): Paise {
  return (
    draft.materials.reduce((t, m) => t + m.costPaise, 0) + draft.labourPaise
  );
}

/**
 * Pro 16 — submit a quotation for admin approval.
 *
 * Validation failures come back as named reasons rather than a boolean, so the
 * screen can say which rule was missed. "Submission failed" tells a pro
 * standing in a customer's house nothing about what to fix.
 */
export async function submitQuotation(
  draft: QuoteDraft,
): Promise<QuoteSubmission> {
  await latency();

  if (draft.beforePhotoCount < QUOTATION_MIN_BEFORE_PHOTOS) {
    return {
      ok: false,
      error: {
        reason: "too-few-photos",
        needed: QUOTATION_MIN_BEFORE_PHOTOS - draft.beforePhotoCount,
      },
    };
  }
  if (draft.description.trim() === "") {
    return { ok: false, error: { reason: "no-description" } };
  }

  const totalPaise = quoteTotal(draft);
  if (totalPaise <= 0) {
    return { ok: false, error: { reason: "no-amount" } };
  }

  return {
    ok: true,
    quotationId: `qt_${draft.jobId}_${Date.now()}`,
    totalPaise,
    needsPhoneConfirmation: totalPaise > PHONE_CONFIRM_THRESHOLD_PAISE,
    decisionBy: new Date(
      Date.now() + QUOTATION_WINDOW_MINUTES * 60_000,
    ).toISOString(),
  };
}

/** Why a job could not be completed. */
export type CompletionRejection =
  | { reason: "wrong-otp" }
  | { reason: "no-after-photos" }
  | { reason: "too-far"; metres: number; limit: number };

export type CompletionResult =
  | { ok: true; earning: ProEarning }
  | { ok: false; error: CompletionRejection };

/**
 * Pro 18 → 19 — close the job.
 *
 * Returns the settlement rather than a bare success, because the very next
 * screen the pro sees is what they earned, and computing it there from separate
 * inputs is how the completion screen and the earnings screen come to disagree.
 *
 * `distanceM` is passed in from the device's own GPS. Null means no fix was
 * obtainable — and that does **not** block completion. A pro who has done the
 * work must be able to close the job; the failure is recorded for admin review
 * instead. Blocking on a weak indoor GPS signal would make the platform's proof
 * requirement into the pro's problem, and they are the one party who cannot fix
 * it. See PRO-OPEN-ITEMS 2.4.
 */
export async function completeJob(input: {
  jobId: string;
  otp: string;
  expectedOtp: string;
  grossPaise: Paise;
  jobsCompletedBefore: number;
  afterPhotoCount: number;
  distanceM: number | null;
  gpsLimitM: number;
}): Promise<CompletionResult> {
  await latency();

  // The OTP first: it is the customer's own confirmation that the work is done,
  // and no other check matters without it.
  if (input.otp !== input.expectedOtp) {
    return { ok: false, error: { reason: "wrong-otp" } };
  }

  if (input.afterPhotoCount < 1) {
    return { ok: false, error: { reason: "no-after-photos" } };
  }

  // A known distance beyond the limit blocks. An unknown one does not.
  if (input.distanceM !== null && input.distanceM > input.gpsLimitM) {
    return {
      ok: false,
      error: {
        reason: "too-far",
        metres: Math.round(input.distanceM),
        limit: input.gpsLimitM,
      },
    };
  }

  return {
    ok: true,
    earning: settleJob(
      input.jobId,
      input.grossPaise,
      input.jobsCompletedBefore,
      new Date().toISOString(),
    ),
  };
}

/**
 * Pro 15 — extra charges added on site.
 *
 * Separate from a quotation: a quotation is a priced proposal the customer
 * accepts before work begins, while this is an addition to a job already under
 * way. The agreement routes anything substantial through the quotation flow, so
 * this exists for the small, explainable additions — a part, a second visit
 * charge — and every one carries a reason the customer will read.
 */
export async function addExtraCharge(
  jobId: string,
  label: string,
  amountPaise: Paise,
): Promise<ExtraCharge> {
  await latency();
  return { id: `xc_${jobId}_${Date.now()}`, label, amountPaise };
}
