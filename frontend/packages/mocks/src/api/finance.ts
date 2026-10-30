import type {
  GstReportRow,
  Page,
  RefundRequest,
  Settlement,
  TransactionListItem,
  TransactionStatus,
} from "@cfc/types";
import { transactions, settlements, refunds, gstReport } from "../fixtures/finance";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

export async function getTransactions(query: {
  status?: TransactionStatus | "all" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
} = {}): Promise<Page<TransactionListItem>> {
  if (isLive("getTransactions")) {
    return fetchJson<Page<TransactionListItem>>("/admin/finance/transactions", {
      query: {
        status: query.status ?? "all",
        ...(query.page !== undefined ? { page: query.page } : {}),
        ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
      },
    });
  }
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
  if (isLive("getSettlements")) {
    return fetchJson<Settlement[]>("/admin/finance/settlements");
  }
  await latency();
  return applyScenario(settlements, []);
}

export async function getRefunds() {
  if (isLive("getRefunds")) {
    return fetchJson<RefundRequest[]>("/admin/finance/refunds");
  }
  await latency();
  return applyScenario(refunds, []);
}

export async function getGstReport() {
  if (isLive("getGstReport")) {
    return fetchJson<GstReportRow[]>("/admin/finance/gst");
  }
  await latency();
  return applyScenario(gstReport, []);
}
