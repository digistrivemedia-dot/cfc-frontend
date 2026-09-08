import { ApiError } from "@cfc/types";
import { coupons, banners, tickets } from "../fixtures/promotions";
import { applyScenario, latency } from "../control";

export async function getCoupons() {
  await latency();
  return applyScenario(coupons, []);
}

export async function getBanners() {
  await latency();
  return applyScenario(banners, []);
}

export async function getTickets(status?: string) {
  await latency();
  const rows = status && status !== "all" ? tickets.filter((t) => t.status === status) : tickets;
  return applyScenario(rows, []);
}

export async function getTicket(id: string) {
  await latency();
  const found = tickets.find((t) => t.id === id);
  return applyScenario(
    found ?? (() => { throw new ApiError(404, "Ticket not found."); })(),
  );
}
