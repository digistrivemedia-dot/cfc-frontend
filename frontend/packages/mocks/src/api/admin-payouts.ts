import type { Payout, WalletEntry } from "@cfc/types";
import { fetchJson } from "../http";

/**
 * Admin 16, 18 — the payout queue and a pro's wallet.
 *
 * The write side did not exist: `ADMIN-SUMMARY.md` recorded the panel as 100%
 * read-only, so `approvePayout`, `rejectPayout` and `adjustProWallet` were all
 * listed in BACKEND-PLAN.md §2.1 as having no function and no contract.
 */

export interface AdminPayoutRow extends Payout {
  /**
   * How long the pro has been waiting.
   *
   * On the row because the agreement commits to 48 hours, and past that the
   * pro is owed money against a stated promise — the platform's failure, not a
   * queue detail.
   */
  waitingHours: number;
}

export async function getPayoutQueue(
  status: "all" | "pending" | "approved" | "paid" | "failed" = "pending",
): Promise<AdminPayoutRow[]> {
  return fetchJson<AdminPayoutRow[]>("/admin/payouts", { query: { status } });
}

/**
 * Admin 18 — approve, individually or in a **batch**.
 *
 * Takes a list, because approving fourteen payouts one request at a time is how
 * an operator ends up with seven approved and seven not after a dropped
 * connection. `skipped` reports any that were already decided, so a partial
 * result is visible rather than silently half-applied.
 */
export async function approvePayouts(
  payoutIds: string[],
): Promise<{ approved: string[]; skipped: string[] }> {
  return fetchJson("/admin/payouts/approve", { body: { payoutIds } });
}

/** A reason is required — the pro reads it, and their money has been sent back. */
export async function rejectPayout(
  payoutId: string,
  reason: string,
): Promise<{ ok: boolean }> {
  return fetchJson(`/admin/payouts/${payoutId}/reject`, { body: { reason } });
}

export interface ProWallet {
  proId: string;
  proName: string;
  /** Settled and withdrawable now. */
  availablePaise: number;
  /** Completed but still inside the 48-hour window. Never summed with the above. */
  pendingPaise: number;
  entries: WalletEntry[];
}

export async function getProWallet(proId: string): Promise<ProWallet> {
  return fetchJson<ProWallet>(`/admin/payouts/wallet/${proId}`);
}

/**
 * Admin 16 — a manual wallet adjustment.
 *
 * Negative applies a penalty, positive credits a correction. **A new ledger
 * row, never an edit**: the ledger is append-only, so the original stays
 * visible beside the correction.
 *
 * The reason is required and audited. An unexplained adjustment to someone's
 * pay is the single most questionable row in this system.
 */
export async function adjustProWallet(
  proId: string,
  amountPaise: number,
  reason: string,
): Promise<{ availablePaise: number; pendingPaise: number }> {
  return fetchJson(`/admin/payouts/wallet/${proId}/adjust`, {
    body: { amountPaise, reason },
  });
}
