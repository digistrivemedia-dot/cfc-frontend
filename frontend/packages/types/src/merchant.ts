import type { Id, Paise, Timestamp } from "./primitives";

/**
 * Merchant (material supplier) domain.
 *
 * A merchant is a third-party shop that supplies the materials a quotation
 * lists. They are not CFC staff and not a Pro: they see the material lines of
 * a job, confirm what they can supply, and mark it ready for the Pro to
 * collect. No money moves through the merchant app — payment is settled
 * between the customer and CFC, so a merchant never sees a customer's details
 * or a job's labour cost.
 *
 * Doc: consumer revision 13 — material bills are raised in the name of the
 * material provider, which requires the provider to exist as its own entity.
 */

/* -------------------------------------------------------------------------- */
/* Requests                                                                    */
/* -------------------------------------------------------------------------- */

export const MATERIAL_REQUEST_STATUSES = [
  "pending",
  "accepted",
  "partially_accepted",
  "rejected",
  "ready",
  "collected",
  "expired",
] as const;
export type MaterialRequestStatus =
  (typeof MATERIAL_REQUEST_STATUSES)[number];

export const MATERIAL_REQUEST_STATUS_LABEL: Record<
  MaterialRequestStatus,
  string
> = {
  pending: "Awaiting response",
  accepted: "Accepted",
  partially_accepted: "Partially accepted",
  rejected: "Declined",
  ready: "Ready for pickup",
  collected: "Collected",
  expired: "Expired",
};

/**
 * How this request reached the merchant.
 *
 * Both models are carried because the decision sits with the backend, not the
 * screens: `direct` is an admin choosing the shop, `broadcast` is the request
 * going to the nearest few and the first to accept taking it, mirroring the
 * Pro auto-assign rule (doc 3.3). A screen reads `expiresAt` to decide whether
 * to show a countdown and never branches on the model itself.
 */
export type MaterialRequestOrigin = "direct" | "broadcast";

/** One line of a material request, confirmed independently of the others. */
export interface MaterialRequestLine {
  id: Id;
  description: string;
  quantity: number;
  /** "m", "nos", "kg" — free text, as the Pro typed it. */
  unit: string;
  /**
   * Cost per unit as the approved quotation priced it — CFC's estimate, not a
   * figure the shop is bound by. Always shown, so the shop can see what it is
   * being asked to match.
   */
  costPaise: Paise;
  /**
   * The shop's own price per unit, entered when it accepts. Null until then,
   * and left null on a line the shop cannot supply.
   *
   * A shop prices against its own stock, so the quotation's figure is an
   * opening estimate rather than the settled amount. Where the two differ, the
   * difference goes back to CFC to approve before the pro collects — which is
   * why this is a separate field and never overwrites `costPaise`.
   */
  merchantCostPaise: Paise | null;
  /** False once the merchant marks the line unavailable. */
  available: boolean;
}

export interface MaterialRequestListItem {
  id: Id;
  /** The job these materials belong to, as shown to the Pro and admin. */
  jobRef: string;
  serviceName: string;
  /** Area only — a merchant has no reason to see the customer's full address. */
  area: string;
  proName: string;
  lineCount: number;
  status: MaterialRequestStatus;
  origin: MaterialRequestOrigin;
  receivedAt: Timestamp;
  /**
   * When an unanswered broadcast lapses to the next shop. Null for a direct
   * assignment, which does not expire.
   */
  expiresAt: Timestamp | null;
}

export interface MaterialRequestDetail extends MaterialRequestListItem {
  lines: MaterialRequestLine[];
  /** Free-text note the Pro left with the quotation. */
  proNotes: string;
  /** Set once the merchant declines, for the admin's record. */
  rejectionReason?: string | undefined;
  /** Set once the merchant marks the order ready to collect. */
  readyAt?: Timestamp | undefined;
  collectedAt?: Timestamp | undefined;
}

/* -------------------------------------------------------------------------- */
/* Shop                                                                        */
/* -------------------------------------------------------------------------- */

export const MERCHANT_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "suspended",
] as const;
export type MerchantApprovalStatus =
  (typeof MERCHANT_APPROVAL_STATUSES)[number];

export const MERCHANT_APPROVAL_STATUS_LABEL: Record<
  MerchantApprovalStatus,
  string
> = {
  pending: "Awaiting approval",
  approved: "Approved",
  suspended: "Suspended",
};

/** A material category a shop supplies; requests are matched against these. */
export interface MerchantCategory {
  id: Id;
  name: string;
}

export interface MerchantProfile {
  id: Id;
  shopName: string;
  ownerName: string;
  phone: string;
  /** Full address: the shop's own, which the Pro needs in order to collect. */
  addressLine: string;
  area: string;
  city: string;
  pincode: string;
  categories: MerchantCategory[];
  openTime: string;
  closeTime: string;
  status: MerchantApprovalStatus;
  /** Accepting new requests. A shop closes itself during stock-taking. */
  acceptingRequests: boolean;
}

/** Counts behind the dashboard tiles. */
export interface MerchantDashboardSummary {
  pending: number;
  preparing: number;
  ready: number;
  /** Requests collected by a Pro today. */
  collectedToday: number;
}

/* -------------------------------------------------------------------------- */
/* Registration                                                                */
/* -------------------------------------------------------------------------- */

/**
 * What a shop submits to join. Approval is an admin action, so a new account
 * lands on `pending` and can sign in but cannot receive requests.
 */
export interface MerchantRegistration {
  shopName: string;
  ownerName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  pincode: string;
  categoryIds: Id[];
}
