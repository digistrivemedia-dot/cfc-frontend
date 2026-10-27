import type {
  Page,
  QuotationDetail,
  QuotationMaterialLine,
  QuotationStatus,
} from "@cfc/types";
import { ApiError } from "@cfc/types";
import { quotations } from "../fixtures/quotations";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

export interface QuotationQuery {
  status?: QuotationStatus | "all" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getQuotations(
  query: QuotationQuery = {},
): Promise<Page<QuotationDetail>> {
  if (isLive("getQuotations")) {
    // The live endpoint returns a plain list — the queue is short by design
    // (fifteen minutes each) and paginating it would hide the one about to
    // expire. Wrapped into the `Page` shape the screen already renders.
    const rows = await fetchJson<QuotationDetail[]>("/admin/quotations", {
      query: { status: query.status },
    });
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return {
      items: rows.slice(start, start + pageSize),
      total: rows.length,
      page,
      pageSize,
      hasMore: start + pageSize < rows.length,
    };
  }
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
  if (isLive("getQuotation")) {
    return fetchJson<QuotationDetail>(`/admin/quotations/${id}`);
  }
  await latency();
  const found = quotations.find((q) => q.id === id);
  return applyScenario(
    found ?? (() => { throw new ApiError(404, "Quotation not found."); })(),
  );
}

/**
 * Admin 5 — the three outcomes.
 *
 * **None of these existed.** `admin/(app)/quotations/page.tsx:159` was the
 * clearest example of the read-only admin panel — its `decide` handler called
 * `setState` and showed a toast, with a comment saying so and no API call. A
 * quotation "approved" that way stayed pending for the pro standing in the
 * customer's house.
 *
 * One function for all three, because they are one decision. Supplying
 * `materials`/`labourPaise` makes it "Edit & approve"; the server keeps the
 * pro's original figures either way.
 */
export async function decideQuotation(
  id: string,
  decision:
    | { outcome: "approved"; materials?: QuotationMaterialLine[]; labourPaise?: number }
    | { outcome: "rejected"; reason: string },
): Promise<QuotationDetail> {
  return fetchJson<QuotationDetail>(`/admin/quotations/${id}/decide`, {
    body: decision,
  });
}
