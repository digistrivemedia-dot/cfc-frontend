import { fetchJson } from "../http";

/**
 * Pro 23, 24 — the pro's own payout history and wallet ledger.
 *
 * Live-only: there is no fixture for money that moved, and a plausible one
 * would be worse than an empty state.
 */

export interface ProPayoutRow {
  id: string;
  amountPaise: number;
  method: "bank" | "upi";
  /** Last four of the account, or the UPI handle. Never the full number. */
  destinationLast4: string;
  /**
   * `pending` → requested. `approved` → the office has committed to it.
   * `paid` → the transfer settled. **Never reported as paid until it has**:
   * claiming a completed transfer that was only initiated produces a support
   * call the moment the pro checks their bank.
   */
  status: "pending" | "approved" | "paid" | "failed";
  requestedAt: string;
  paidAt: string | null;
  failureReason: string | null;
}

export async function getProPayouts(): Promise<ProPayoutRow[]> {
  return fetchJson<ProPayoutRow[]>("/pro/earnings/payouts");
}

export interface ProLedgerRow {
  id: string;
  kind: "credit" | "penalty" | "adjustment" | "payout";
  label: string;
  /** Signed: positive credits, negative debits. */
  amountPaise: number;
  at: string;
  grossPaise?: number;
  /** Present on credits. A ₹0 fee is ₹0, never blank. */
  feePaise?: number;
  availableAt: string;
  /** False while inside the 48-hour window. */
  available: boolean;
}

/**
 * Every line, so a pro can reconcile their own statement rather than taking a
 * headline figure on trust.
 */
export async function getProLedger(): Promise<ProLedgerRow[]> {
  return fetchJson<ProLedgerRow[]>("/pro/earnings/ledger");
}
