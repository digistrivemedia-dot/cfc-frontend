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

export interface CustomerQuery {
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getCustomers(
  query: CustomerQuery = {},
): Promise<Page<CustomerDetail>> {
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
  await latency();
  return applyScenario(customerBookings[id] ?? [], []);
}

/** Complaints raised by a customer, newest first. Admin 20. */
export async function getCustomerComplaints(
  id: string,
): Promise<CustomerComplaint[]> {
  await latency();
  return applyScenario(customerComplaints[id] ?? [], []);
}
