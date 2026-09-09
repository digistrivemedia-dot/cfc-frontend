import type { QuotationDetail } from "@cfc/types";
import { quotations } from "../fixtures/quotations";
import { applyScenario, latency } from "../control";

/**
 * Customer 22, 23, 24 — the quotations waiting on this customer.
 *
 * The flow matters here. A pro raises a quotation, **the admin approves it**,
 * and only then does it reach the customer. So a customer never sees a
 * `pending` quotation: that status means "waiting on the admin", and showing
 * it would invite them to accept something CFC has not yet agreed to.
 *
 * What they see:
 *
 *   approved            waiting on them — the only actionable state
 *   customer_accepted   already accepted, showing the balance due
 *   customer_declined   declined, kept as a record
 *   rejected            CFC turned it down, so there is nothing to decide
 *
 * The **15-minute window is an admin rule** ("pro cannot wait longer",
 * Admin 4/5). No customer-side deadline is documented, so none is shown — a
 * countdown here would be a pressure tactic we invented.
 */

/** The customer's own quotations. Filtered to what has cleared admin review. */
export async function getMyQuotations() {
  await latency();
  const rows = quotations.filter((q) => q.status !== "pending");
  const sorted = [...rows].sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
  return applyScenario(sorted, []);
}

export async function getMyQuotation(id: string) {
  await latency();
  const found = quotations.find((q) => q.id === id || q.jobRef === id);
  // A `pending` quotation has not cleared admin review, so as far as the
  // customer is concerned it does not exist yet.
  if (found && found.status === "pending") return applyScenario(null, null);
  return applyScenario(found ?? null, null);
}

/**
 * The 50% advance, per the agreement.
 *
 * "Customer advance on quote accept: **50%**, balance on completion."
 *
 * Rounded to the nearest rupee, with the balance taking the remainder so the
 * two halves always sum to the total. Rounding both independently is how a
 * customer ends up owing one paisa more than the quotation said.
 */
export function splitQuotation(totalPaise: number): {
  advancePaise: number;
  balancePaise: number;
} {
  const advancePaise = Math.round(totalPaise / 200) * 100;
  return { advancePaise, balancePaise: totalPaise - advancePaise };
}

/** Customer 23 — accept, paying the advance. */
export async function acceptQuotation(id: string): Promise<void> {
  await latency();
  const found = quotations.find((q) => q.id === id);
  if (!found) return;
  found.status = "customer_accepted";
  found.minutesRemaining = null;
}

/** Customer 23 — decline. The visit is still chargeable; the work is not. */
export async function declineQuotation(id: string): Promise<void> {
  await latency();
  const found = quotations.find((q) => q.id === id);
  if (!found) return;
  found.status = "customer_declined";
  found.minutesRemaining = null;
}

/**
 * Customer 23 — "Ask a question".
 *
 * There is no message thread on a quotation in the data model, and inventing
 * one would imply a reply the platform cannot deliver. This records the
 * question and returns; the screen tells the customer support will call.
 */
export async function askQuotationQuestion(
  id: string,
  question: string,
): Promise<void> {
  await latency();
  void id;
  void question;
}

/** How many quotations are waiting on the customer. Drives a nav badge. */
export async function getPendingQuotationCount(): Promise<number> {
  await latency();
  const n = quotations.filter((q) => q.status === "approved").length;
  return applyScenario(n, 0);
}

export type { QuotationDetail };
