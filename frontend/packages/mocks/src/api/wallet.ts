import type { WalletTransaction } from "@cfc/types";
import {
  WALLET_BALANCE_PAISE,
  walletTransactions,
} from "../fixtures/wallet";
import { applyScenario, latency } from "../control";

/**
 * Customer 36, 37 — the wallet and its statement.
 *
 * The balance is read from the ledger rather than stored separately: the
 * newest completed line already carries it, and two sources for one number is
 * how a wallet screen ends up disagreeing with itself.
 */

export type WalletFilter = "all" | "topup" | "booking" | "refund";

const FILTER_KINDS: Record<WalletFilter, WalletTransaction["kind"][]> = {
  all: ["topup", "booking", "refund", "cashback", "referral"],
  topup: ["topup"],
  booking: ["booking"],
  // Refunds and the credits that behave like them, which is what a customer
  // means when they look for "money back".
  refund: ["refund", "cashback", "referral"],
};

export async function getWalletBalance(): Promise<number> {
  await latency();
  return applyScenario(WALLET_BALANCE_PAISE, 0);
}

export async function getWalletTransactions(filter: WalletFilter = "all") {
  await latency();
  const kinds = FILTER_KINDS[filter];
  const rows = walletTransactions.filter((t) => kinds.includes(t.kind));
  return applyScenario(rows, []);
}

/**
 * Customer 36 — "add money".
 *
 * No payment gateway, so this does not pretend to take money. It returns the
 * shape the real endpoint will, and the screen is explicit that the gateway
 * arrives with the payment integration.
 */
export async function addMoney(
  amountPaise: number,
): Promise<{ ok: boolean; amountPaise: number }> {
  await latency();
  return applyScenario(
    { ok: true, amountPaise },
    { ok: false, amountPaise: 0 },
  );
}
