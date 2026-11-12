import type {
  DayAvailability,
  DocumentType,
  ProApprovalStatus,
  ProAvailability,
  ProProfileEdit,
  ProService,
  AvailableProService,
  Weekday,
} from "@cfc/types";
import { WEEKDAYS } from "@cfc/types";
import { AREAS } from "../fixtures/seed";
import { pros } from "../fixtures/pros";
import { services } from "../fixtures/catalog";
import { pricingRules } from "../fixtures/catalog";
import { commissionFor } from "./pro-earnings";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

/**
 * Pro 26–29 — profile, services, availability.
 *
 * The pro's services come from the catalogue the admin owns, filtered to the
 * skills on the pro's own record. That is the honest model: a pro does not add
 * services to the platform, they are approved for existing ones — so this reads
 * the catalogue rather than storing a parallel list that could drift from it.
 */

/** One of the four KYC documents, as the pro's own screens see it. */
export interface ProOwnDocument {
  type: DocumentType;
  label: string;
  /** `missing` means not sent; `pending` means a human is looking at it. */
  status: "missing" | "pending" | "approved" | "rejected";
  uploaded: boolean;
  rejectionReason: string | null;
}

/** A warning on the pro's own discipline record. */
export interface ProOwnWarning {
  id: string;
  reason: string;
  /** Positive — the size of the deduction. 0 for a warning with no penalty. */
  penaltyPaise: number;
  /** Who in the office issued it. Shown on the pro's own card. */
  issuedBy: string;
  issuedAt: string;
}

/**
 * The signed-in pro's whole record.
 *
 * One shape for every pro screen that needs to know something about its own
 * user: the shell, the splash routing decision, the profile, the edit form, the
 * warnings screen and the job-completion screen. They each used to ask for a
 * different slice, from an admin endpoint, and got a 403.
 */
export interface ProOwnProfile {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  /** Catalogue names, not ids — the pro reads "AC service & repair". */
  services: string[];
  areas: string[];
  /** The first area. The screens show one line; dispatch matches all of them. */
  area: string;
  bio: string;
  experienceYears: number;
  joinedAt: string;

  approvalStatus: ProApprovalStatus;
  rejectionReason: string | null;
  /** Blocked is not the same as rejected — see the note on the Pro model. */
  blocked: boolean;
  blockedReason: string | null;
  online: boolean;
  rating: number;
  ratingCount: number;
  jobsCompleted: number;

  payments: {
    accountName: string | null;
    /** The last four only. The full number is never returned, even to its owner. */
    accountLast4: string | null;
    ifsc: string | null;
    upiId: string | null;
    availablePaise: number;
    /** Completed-job money still inside the 48-hour clearing window. */
    pendingPaise: number;
    minimumPaise: number;
    canWithdraw: boolean;
    requestInFlight: boolean;
  };

  performance: {
    grossPaise: number;
    cfcFeePaise: number;
    netPaise: number;
    jobCount: number;
    commissionFreeRemaining: number;
    warningCount: number;
  };

  documents: ProOwnDocument[];
  warnings: ProOwnWarning[];
}

/**
 * The pro's own profile — everything their own screens need, in one request.
 *
 * **Not `getPro`.** That one fetches `/admin/pros/:id`, and six screens in the
 * pro app were calling it with a pro's token. An admin route answers 403 to a
 * pro, every time: the profile screen reported it as a connection problem, the
 * shell quietly showed no name, and the splash screen treated the failure as
 * "not approved" and sent every pro to onboarding.
 *
 * Takes **no id**. The server reads it from the token, so there is nothing here
 * that could ask for someone else's record.
 */
export async function getMyProProfile(): Promise<ProOwnProfile> {
  if (isLive("getMyProProfile")) {
    return fetchJson<ProOwnProfile>("/pro/profile");
  }
  await latency();

  const pro = pros[0];
  if (pro === undefined) throw new Error("No pro in the fixtures.");
  const docTypes: DocumentType[] = [
    "aadhaar_front",
    "aadhaar_back",
    "pan",
    "selfie",
  ];
  return applyScenario<ProOwnProfile>({
    id: pro.id,
    name: pro.name,
    phone: pro.phone,
    photoUrl: pro.photoUrl ?? null,
    services: pro.services,
    areas: [pro.area],
    area: pro.area,
    bio: pro.bio,
    experienceYears: pro.experienceYears,
    joinedAt: pro.joinedAt,
    approvalStatus: pro.approvalStatus,
    rejectionReason: null,
    blocked: pro.blocked,
    blockedReason: null,
    online: pro.online && !pro.blocked,
    rating: pro.rating,
    ratingCount: 0,
    jobsCompleted: pro.jobsCompleted,
    payments: {
      accountName: pro.name,
      accountLast4: "0000",
      ifsc: "HDFC0001234",
      upiId: pro.upiId ?? null,
      availablePaise: 0,
      pendingPaise: 0,
      minimumPaise: 0,
      canWithdraw: false,
      requestInFlight: false,
    },
    performance: {
      grossPaise: 0,
      cfcFeePaise: 0,
      netPaise: 0,
      jobCount: pro.jobsCompleted,
      commissionFreeRemaining: 0,
      warningCount: 0,
    },
    documents: docTypes.map((type) => ({
      type,
      label: type,
      status: "pending" as const,
      uploaded: true,
      rejectionReason: null,
    })),
    warnings: [],
  });
}

/**
 * The services this pro is approved for, with the admin's rate.
 *
 * `ratePaise` is the catalogue's own base price. `netPaise` applies the
 * commission rule, so a pro comparing two services sees what they actually
 * keep rather than having to work it out from a percentage.
 */
export async function getProServices(proId: string): Promise<ProService[]> {
  if (isLive("getProServices")) {
    return fetchJson<ProService[]>("/pro/profile/services");
  }
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

/**
 * Services the pro could ask to add - the catalogue, less what they already
 * hold.
 *
 * Sorted by category then name so the list reads like the catalogue rather
 * than in whatever order the fixtures happen to sit in.
 */
export async function getAvailableProServices(
  proId: string,
): Promise<AvailableProService[]> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  if (!pro) return applyScenario([], []);

  const rows: AvailableProService[] = services
    .filter((s) => s.active && !pro.services.includes(s.name))
    .map((s) => {
      const rule = pricingRules.find((r) => r.serviceId === s.id);
      return {
        serviceId: s.id,
        serviceName: s.name,
        categoryName: s.categoryName,
        ratePaise: rule?.basePricePaise ?? s.basePricePaise,
      };
    })
    .sort(
      (a, b) =>
        a.categoryName.localeCompare(b.categoryName) ||
        a.serviceName.localeCompare(b.serviceName),
    );

  return applyScenario(rows, []);
}

/**
 * Ask the CFC office to add a service.
 *
 * A REQUEST, not a grant. The agreement has CFC approving what a pro is
 * onboarded for, so a pro cannot give themselves a new trade and start taking
 * that work - they ask, and the office decides.
 *
 * The backend owns the approval step. This records the request and returns the
 * rows as the pro should now see them: listed, and marked as waiting.
 */
export async function requestProServices(
  _proId: string,
  serviceIds: string[],
): Promise<{ requested: number }> {
  await latency();
  return { requested: serviceIds.length };
}

/** The pro's own switch. Admin-set rates are untouched by this. */
export async function setProServiceEnabled(
  _proId: string,
  _serviceId: string,
  enabled: boolean,
): Promise<{ enabled: boolean }> {
  if (isLive("setProServiceEnabled")) {
    return fetchJson(`/pro/profile/services/${_serviceId}`, {
      method: "PUT",
      body: { enabled },
    });
  }
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
  if (isLive("getProAvailability")) {
    return fetchJson<ProAvailability>("/pro/profile/availability");
  }
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
  if (isLive("saveProAvailability")) {
    return fetchJson<ProAvailability>("/pro/profile/availability", {
      method: "PUT",
      body: next,
    });
  }
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
  if (isLive("updateProProfile")) {
    /**
     * Only what the server lets a pro change about themselves.
     *
     * **`phone` is deliberately absent.** It is the login identity, so changing
     * it is an OTP flow of its own — the same reason the customer's profile
     * patch excludes it. Sending it here would have the screen report success
     * over a field the server ignores.
     *
     * This whole function had no live path at all before: it mutated a fixture
     * object and resolved, so a pro edited their bio, saw "Profile updated",
     * and nothing reached the database.
     */
    await fetchJson("/pro/profile", {
      method: "PATCH",
      body: {
        bio: edit.bio,
        experienceYears: edit.experienceYears,
        areas: edit.areas,
        ...(edit.upiId !== null ? { upiId: edit.upiId } : {}),
      },
    });
    return edit;
  }
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

/** The pincodes a pro covers, and the ones the platform offers. */
export interface ProPincodes {
  /** This pro's own selection. */
  mine: string[];
  /** Every pincode CFC serves — the only valid choices. */
  available: string[];
}

/**
 * Pro 28 — the pincodes this pro will travel to.
 *
 * What dispatch matches a booking against. Area names were the test before
 * this and proved fragile: a geocoder returning "Trichy Zone IV" for the area
 * CFC calls "Thillai Nagar" meant a booking there reached nobody.
 */
export async function getProPincodes(): Promise<ProPincodes> {
  if (isLive("getProPincodes")) {
    return fetchJson<ProPincodes>("/pro/profile/pincodes");
  }
  await latency();
  return applyScenario<ProPincodes>({ mine: [], available: [] });
}

/** Refused by the server for any pincode the platform does not serve. */
export async function saveProPincodes(
  pincodes: string[],
): Promise<ProPincodes> {
  if (isLive("saveProPincodes")) {
    return fetchJson<ProPincodes>("/pro/profile/pincodes", {
      method: "PUT",
      body: { pincodes },
    });
  }
  await latency();
  return { mine: pincodes, available: pincodes };
}

/**
 * The areas a pro can choose to serve. Pro 5 and 27.
 *
 * An api function rather than an exported constant, because the serviceable
 * areas are admin-owned in production — the admin panel sets the auto-assign
 * radius and assigns Area Admins to them. A screen reading a fixture array
 * directly would also break the rule that screens import api functions only.
 */
/**
 * Every pincode CFC accepts a booking from. Public.
 *
 * The authority on coverage: the address form checks an address against this,
 * not against an area name a geocoder may render differently.
 */
export async function getServicePincodes(): Promise<string[]> {
  if (isLive("getServicePincodes")) {
    return fetchJson<string[]>("/public/service-pincodes");
  }
  await latency();
  return applyScenario<string[]>([]);
}

export async function getServiceAreas(): Promise<string[]> {
  if (isLive("getServiceAreas")) {
    return fetchJson<string[]>("/public/service-areas");
  }
  await latency();
  return applyScenario([...AREAS], []);
}
