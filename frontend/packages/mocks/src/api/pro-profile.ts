import type {
  DayAvailability,
  ProAvailability,
  ProProfileEdit,
  ProService,
  Weekday,
} from "@cfc/types";
import { WEEKDAYS } from "@cfc/types";
import { AREAS } from "../fixtures/seed";
import { pros } from "../fixtures/pros";
import { services } from "../fixtures/catalog";
import { pricingRules } from "../fixtures/catalog";
import { commissionFor } from "./pro-earnings";
import { applyScenario, latency } from "../control";

/**
 * Pro 26–29 — profile, services, availability.
 *
 * The pro's services come from the catalogue the admin owns, filtered to the
 * skills on the pro's own record. That is the honest model: a pro does not add
 * services to the platform, they are approved for existing ones — so this reads
 * the catalogue rather than storing a parallel list that could drift from it.
 */

/**
 * The services this pro is approved for, with the admin's rate.
 *
 * `ratePaise` is the catalogue's own base price. `netPaise` applies the
 * commission rule, so a pro comparing two services sees what they actually
 * keep rather than having to work it out from a percentage.
 */
export async function getProServices(proId: string): Promise<ProService[]> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  if (!pro) return applyScenario([], []);

  const rows: ProService[] = services
    .filter((s) => pro.services.includes(s.name))
    .map((s) => {
      const rule = pricingRules.find((r) => r.serviceId === s.id);
      const ratePaise = rule?.basePricePaise ?? s.basePricePaise;
      const { cfcFeePaise } = commissionFor(ratePaise, pro.jobsCompleted);
      return {
        serviceId: s.id,
        serviceName: s.name,
        categoryName: s.categoryName,
        ratePaise,
        netPaise: ratePaise - cfcFeePaise,
        // Every approved service starts on. The pro switches off what they are
        // not currently taking, which is the less surprising default: a pro who
        // was approved for a skill expects to receive that work.
        enabled: true,
        // Spread across their history rather than all on one service.
        jobsCompleted: Math.floor(
          pro.jobsCompleted / Math.max(1, pro.services.length),
        ),
      };
    });

  return applyScenario(rows, []);
}

/** The pro's own switch. Admin-set rates are untouched by this. */
export async function setProServiceEnabled(
  _proId: string,
  _serviceId: string,
  enabled: boolean,
): Promise<{ enabled: boolean }> {
  await latency();
  return { enabled };
}

/**
 * A default working week.
 *
 * Six days, 09:00–19:00, Sunday off. Chosen because it matches how most
 * independent tradespeople in this market actually work, so a pro who never
 * touches this screen still has a schedule that is roughly true — which is
 * better than an empty week that would take them out of dispatch entirely, or
 * a full week that promises Sundays they do not work.
 */
function defaultWeek(): DayAvailability[] {
  return WEEKDAYS.map((day: Weekday) => ({
    day,
    working: day !== "sun",
    from: "09:00",
    to: "19:00",
  }));
}

/** Per-pro, so a change persists for the session. */
const availabilityStore = new Map<string, ProAvailability>();

export async function getProAvailability(
  proId: string,
): Promise<ProAvailability> {
  await latency();

  let current = availabilityStore.get(proId);
  if (current === undefined) {
    current = { days: defaultWeek(), holidayMode: false, holidayUntil: null };
    availabilityStore.set(proId, current);
  }

  return applyScenario(current, {
    days: defaultWeek(),
    holidayMode: false,
    holidayUntil: null,
  });
}

export async function saveProAvailability(
  proId: string,
  next: ProAvailability,
): Promise<ProAvailability> {
  await latency();
  availabilityStore.set(proId, next);
  return next;
}

/**
 * Pro 27 — save the editable fields.
 *
 * Only the fields a pro owns. Their name, services, rating and approval status
 * are all admin-controlled or earned, and none of them is accepted here — a
 * mutation that silently ignored half its input would be worse than one that
 * never offered those fields.
 */
export async function updateProProfile(
  proId: string,
  edit: ProProfileEdit,
): Promise<ProProfileEdit> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  if (pro !== undefined) {
    // Written back to the fixture so the profile screen reflects the change
    // for the rest of the session.
    pro.bio = edit.bio;
    pro.experienceYears = edit.experienceYears;
    pro.phone = edit.phone;
    pro.upiId = edit.upiId;
    const first = edit.areas[0];
    if (first !== undefined) pro.area = first;
  }

  return edit;
}

/**
 * The areas a pro can choose to serve. Pro 5 and 27.
 *
 * An api function rather than an exported constant, because the serviceable
 * areas are admin-owned in production — the admin panel sets the auto-assign
 * radius and assigns Area Admins to them. A screen reading a fixture array
 * directly would also break the rule that screens import api functions only.
 */
export async function getServiceAreas(): Promise<string[]> {
  await latency();
  return applyScenario([...AREAS], []);
}
