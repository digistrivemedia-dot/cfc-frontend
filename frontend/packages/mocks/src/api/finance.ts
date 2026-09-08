import type { Page, TransactionListItem, TransactionStatus } from "@cfc/types";
import { transactions, settlements, refunds, gstReport } from "../fixtures/finance";
import { applyScenario, latency } from "../control";

export async function getTransactions(query: {
  status?: TransactionStatus | "all" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
} = {}): Promise<Page<TransactionListItem>> {
  await latency();
  const { status = "all", page = 1, pageSize = 20 } = query;
  let rows = transactions;
  if (status !== "all") rows = rows.filter((t) => t.status === status);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return applyScenario<Page<TransactionListItem>>(
    { items, total, page, pageSize, hasMore: start + pageSize < total },
    { items: [], total: 0, page: 1, pageSize, hasMore: false },
  );
}

export async function getSettlements() {
  await latency();
  return applyScenario(settlements, []);
}

export async function getRefunds() {
  await latency();
  return applyScenario(refunds, []);
}

export async function getGstReport() {
  await latency();
  return applyScenario(gstReport, []);
}
