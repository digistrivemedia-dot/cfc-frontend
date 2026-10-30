import type {
  CustomerBooking,
  CustomerComplaint,
  CustomerDetail,
  Page,
} from "@cfc/types";
import { ApiError } from "@cfc/types";
import {
  customerBookings,
  customerComplaints,
  customers,
} from "../fixtures/customers";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

export interface CustomerQuery {
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getCustomers(
  query: CustomerQuery = {},
): Promise<Page<CustomerDetail>> {
  if (isLive("getCustomers")) {
    return fetchJson<Page<CustomerDetail>>("/admin/customers", {
      query: {
        ...(query.search !== undefined ? { search: query.search } : {}),
        ...(query.page !== undefined ? { page: query.page } : {}),
        ...(query.pageSize !== undefined ? { pageSize: query.pageSize } : {}),
      },
    });
  }
  await latency();
  const { search, page = 1, pageSize = 20 } = query;

  let rows = customers;
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
    );
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return applyScenario<Page<CustomerDetail>>(
    { items, total, page, pageSize, hasMore: start + pageSize < total },
    { items: [], total: 0, page: 1, pageSize, hasMore: false },
  );
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  if (isLive("getCustomer")) {
    return fetchJson<CustomerDetail>(`/admin/customers/${id}`);
  }
  await latency();
  const found = customers.find((c) => c.id === id);
  return applyScenario(
    found ?? (() => { throw new ApiError(404, "Customer not found."); })(),
  );
}

/** A customer's bookings, newest first. Admin 20. */
export async function getCustomerBookings(
  id: string,
): Promise<CustomerBooking[]> {
  if (isLive("getCustomerBookings")) {
    return fetchJson<CustomerBooking[]>(`/admin/customers/${id}/bookings`);
  }
  await latency();
  return applyScenario(customerBookings[id] ?? [], []);
}

/** Complaints raised by a customer, newest first. Admin 20. */
export async function getCustomerComplaints(
  id: string,
): Promise<CustomerComplaint[]> {
  if (isLive("getCustomerComplaints")) {
    return fetchJson<CustomerComplaint[]>(`/admin/customers/${id}/complaints`);
  }
  await latency();
  return applyScenario(customerComplaints[id] ?? [], []);
}

/**
 * Admin 21 — block and unblock a customer.
 *
 * Live-only, like every other admin write: there is nothing for a block to
 * fall back to, and a toast over an unchanged database is the failure this
 * replaces. The block is enforced at sign-in, so it takes effect on their next
 * attempt rather than only on the screen.
 */
export async function blockCustomer(
  id: string,
  reason: string,
): Promise<{ id: string; blocked: boolean }> {
  return fetchJson(`/admin/customers/${id}/block`, {
    method: "POST",
    body: { reason },
  });
}

export async function unblockCustomer(
  id: string,
): Promise<{ id: string; blocked: boolean }> {
  return fetchJson(`/admin/customers/${id}/unblock`, { method: "POST" });
}
