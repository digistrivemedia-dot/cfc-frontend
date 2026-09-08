import type { BasisPoints, Id, Paise, Timestamp } from "./primitives";

/** Admin 30–34 — transactions, revenue, settlement, refunds, GST. */

export const TRANSACTION_METHODS = ["upi", "card", "wallet", "cash"] as const;
export type TransactionMethod = (typeof TRANSACTION_METHODS)[number];

export const TRANSACTION_METHOD_LABEL: Record<TransactionMethod, string> = {
  upi: "UPI",
  card: "Card",
  wallet: "Wallet",
  cash: "Cash",
};

export const TRANSACTION_STATUSES = [
  "success",
  "pending",
  "failed",
  "refunded",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface TransactionListItem {
  id: Id;
  bookingRef: string;
  customerName: string;
  amountPaise: Paise;
  method: TransactionMethod;
  status: TransactionStatus;
  createdAt: Timestamp;
}

/**
 * Per-booking internal settlement: what the customer paid, the pro's share,
 * the platform fee, and the GST breakdown. GST is admin-editable and is never
 * a literal in a component — it arrives as basis points on the record.
 */
export interface Settlement {
  id: Id;
  bookingRef: string;
  customerName: string;
  proName: string;
  customerPaidPaise: Paise;
  proSharePaise: Paise;
  platformFeePaise: Paise;
  cgstBps: BasisPoints;
  sgstBps: BasisPoints;
  gstPaise: Paise;
  netToProPaise: Paise;
  settledAt: Timestamp;
}

export const REFUND_STATUSES = ["requested", "approved", "rejected", "paid"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export interface RefundRequest {
  id: Id;
  bookingRef: string;
  customerName: string;
  amountPaise: Paise;
  reason: string;
  status: RefundStatus;
  requestedAt: Timestamp;
}

export interface GstReportRow {
  month: string;
  cgstPaise: Paise;
  sgstPaise: Paise;
  totalPaise: Paise;
  bookingCount: number;
}
