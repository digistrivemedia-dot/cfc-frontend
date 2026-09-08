import type { SubAdmin } from "@cfc/types";
import { applyScenario, latency } from "../control";

const subAdmins: SubAdmin[] = [
  {
    id: "adm_0002",
    name: "Meenakshi S.",
    role: "area_admin",
    area: "Srirangam",
    // "Local pro management and job oversight only" — the work queues in one
    // area, nothing platform-wide.
    sections: ["bookings", "quotations", "pros"],
    active: true,
  },
  {
    id: "adm_0003",
    name: "Vignesh T.",
    role: "sub_admin",
    // "Bookings, support tickets, quotation queue, vendor approvals."
    sections: ["bookings", "quotations", "pros", "support"],
    active: true,
  },
];

export async function getSubAdmins(): Promise<SubAdmin[]> {
  await latency();
  return applyScenario(subAdmins, []);
}
