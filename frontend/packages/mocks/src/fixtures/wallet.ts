import type { WalletTransaction } from "@cfc/types";

/**
 * The customer's wallet ledger.
 *
 * The amounts are **solved**, not chosen. Three properties have to hold at
 * once, and getting them right by eye does not work:
 *
 *   The movements must sum to the balance the profile reports (₹249.00).
 *   The running balance must never go negative — a wallet cannot be overdrawn.
 *   The booking debits must match the amounts in the booking fixtures.
 *
 * My first attempt satisfied the first and failed the second, showing a
 * balance of −₹2 partway down the statement. The fix was ordering: the refund
 * for the cancelled booking has to land before the large debit, which is also
 * what actually happened chronologically.
 *
 * The mix is deliberate. A top-up, a cashback, two booking debits, a refund, a
 * referral credit, and one **failed** top-up — the failed line is the state
 * most likely to be built wrong, because a screen that folds it into the
 * balance is silently lying about the customer's money.
 */

/** Matches `walletPaise` on the profile in `api/consumer-auth.ts`. */
export const WALLET_BALANCE_PAISE = 24_900;

const daysAgo = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString();

/**
 * Oldest first, so the running balance can be accumulated forwards the way it
 * actually happened. The API reverses it for display.
 */
const MOVEMENTS: Omit<WalletTransaction, "balanceAfterPaise">[] = [
  {
    id: "wtx_01",
    kind: "topup",
    label: "Added money",
    amountPaise: 20_000,
    at: daysAgo(24),
    status: "completed",
  },
  {
    id: "wtx_02",
    kind: "cashback",
    label: "First booking cashback",
    amountPaise: 5_000,
    at: daysAgo(20),
    status: "completed",
  },
  {
    id: "wtx_03",
    kind: "booking",
    label: "Electrical repair",
    amountPaise: -12_900,
    at: daysAgo(12),
    bookingReference: "CFC47881003",
    status: "completed",
  },
  {
    id: "wtx_04",
    kind: "refund",
    label: "Cancelled booking refunded",
    amountPaise: 19_900,
    at: daysAgo(9),
    bookingReference: "CFC47770884",
    status: "completed",
  },
  {
    id: "wtx_05",
    kind: "topup",
    label: "Added money",
    amountPaise: 17_800,
    at: daysAgo(5),
    status: "completed",
  },
  {
    id: "wtx_06",
    kind: "booking",
    label: "Deep home cleaning",
    amountPaise: -34_900,
    at: daysAgo(4),
    bookingReference: "CFC47990112",
    status: "completed",
  },
  {
    id: "wtx_07",
    kind: "topup",
    label: "Added money",
    // Failed, so it moves nothing. The balance either side is identical.
    amountPaise: 50_000,
    at: daysAgo(3),
    status: "failed",
  },
  {
    id: "wtx_08",
    kind: "referral",
    label: "Referral reward — a friend joined",
    amountPaise: 10_000,
    at: daysAgo(2),
    status: "completed",
  },
];

/**
 * Accumulates forwards from zero, so `balanceAfterPaise` is derived from the
 * amounts rather than typed alongside them. The two cannot drift.
 */
export const walletTransactions: WalletTransaction[] = (() => {
  let running = 0;
  const out: WalletTransaction[] = [];

  for (const m of MOVEMENTS) {
    if (m.status === "completed") running += m.amountPaise;
    out.push({ ...m, balanceAfterPaise: running });
  }

  // Newest first for display. A statement is read from the top.
  return out.reverse();
})();
