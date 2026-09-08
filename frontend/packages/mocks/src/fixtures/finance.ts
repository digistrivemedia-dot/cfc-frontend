import type {
  GstReportRow,
  RefundRequest,
  Settlement,
  TransactionListItem,
  TransactionMethod,
  TransactionStatus,
} from "@cfc/types";
import { CUSTOMER_NAMES, PRO_NAMES, seeded, pickFrom } from "./seed";

const rand = seeded(20260909);
const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);
const METHODS: TransactionMethod[] = ["upi", "card", "wallet", "cash"];

export const transactions: TransactionListItem[] = Array.from(
  { length: 50 },
  (_, i) => {
    const amountPaise = Math.floor(50000 + rand() * 300000);
    const status: TransactionStatus = pick([
      "success", "success", "success", "pending", "failed", "refunded",
    ]);
    return {
      id: `txn_${(i + 1).toString().padStart(4, "0")}`,
      bookingRef: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
      customerName: pick(CUSTOMER_NAMES),
      amountPaise,
      method: pick(METHODS),
      status,
      createdAt: new Date(
        Date.now() - Math.floor(rand() * 30) * 86_400_000,
      ).toISOString(),
    };
  },
);

export const settlements: Settlement[] = Array.from({ length: 40 }, (_, i) => {
  const customerPaidPaise = Math.floor(80000 + rand() * 250000);
  const platformFeePaise = Math.round(customerPaidPaise * 0.08);
  const cgstBps = 900;
  const sgstBps = 900;
  const gstPaise = Math.round((platformFeePaise * (cgstBps + sgstBps)) / 10000);
  const proSharePaise = customerPaidPaise - platformFeePaise - gstPaise;

  return {
    id: `stl_${(i + 1).toString().padStart(4, "0")}`,
    bookingRef: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
    customerName: pick(CUSTOMER_NAMES),
    proName: pick(PRO_NAMES),
    customerPaidPaise,
    proSharePaise,
    platformFeePaise,
    cgstBps,
    sgstBps,
    gstPaise,
    netToProPaise: proSharePaise,
    settledAt: new Date(
      Date.now() - Math.floor(rand() * 30) * 86_400_000,
    ).toISOString(),
  };
});

export const refunds: RefundRequest[] = Array.from({ length: 12 }, (_, i) => ({
  id: `ref_${(i + 1).toString().padStart(3, "0")}`,
  bookingRef: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
  customerName: pick(CUSTOMER_NAMES),
  amountPaise: Math.floor(50000 + rand() * 200000),
  reason: pick([
    "Pro did not arrive within the scheduled window.",
    "Service quality did not match what was described.",
    "Customer cancelled before pro was assigned.",
    "Duplicate booking made in error.",
  ]),
  status: pick(["requested", "requested", "approved", "rejected", "paid"]),
  requestedAt: new Date(
    Date.now() - Math.floor(rand() * 14) * 86_400_000,
  ).toISOString(),
}));

const MONTHS = ["Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"];
export const gstReport: GstReportRow[] = MONTHS.map((month) => {
  const bookingCount = Math.floor(180 + rand() * 220);
  const cgstPaise = Math.floor(bookingCount * (2000 + rand() * 3000));
  return {
    month,
    cgstPaise,
    sgstPaise: cgstPaise,
    totalPaise: cgstPaise * 2,
    bookingCount,
  };
});
