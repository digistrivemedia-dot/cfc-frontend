import type { Page, QuotationDetail, QuotationStatus } from "@cfc/types";
import { ApiError } from "@cfc/types";
import { quotations } from "../fixtures/quotations";
import { applyScenario, latency } from "../control";

export interface QuotationQuery {
  status?: QuotationStatus | "all" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getQuotations(
  query: QuotationQuery = {},
): Promise<Page<QuotationDetail>> {
  await latency();
  const { status = "all", page = 1, pageSize = 20 } = query;

  let rows = quotations;
  if (status !== "all") rows = rows.filter((q) => q.status === status);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return applyScenario<Page<QuotationDetail>>(
    { items, total, page, pageSize, hasMore: start + pageSize < total },
    { items: [], total: 0, page: 1, pageSize, hasMore: false },
  );
}

export async function getQuotation(id: string): Promise<QuotationDetail> {
  await latency();
  const found = quotations.find((q) => q.id === id);
  return applyScenario(
    found ?? (() => { throw new ApiError(404, "Quotation not found."); })(),
  );
}
