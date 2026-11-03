/**
 * Shared primitives used across every domain object.
 *
 * These types are the contract the backend team builds against. Where a shape
 * here is wrong, it is wrong in the product — change it here first.
 */

/** ISO 8601 timestamp, always UTC. Never a Date object across the boundary. */
export type Timestamp = string;

/** ISO 8601 date with no time component: "2026-09-04". */
export type DateOnly = string;

/**
 * Money is integer paise, never a float.
 *
 * 45000 is ₹450.00. Floating point rupees produce settlement errors that only
 * appear once real money moves. The shared currency formatter in @cfc/ui is the
 * only thing that turns this into a string.
 */
export type Paise = number;

/**
 * A rate expressed in basis points. 900 is 9%, 1800 is 18%, 1500 is 15%.
 *
 * Every rate in this product is admin-editable, so no rate is ever a literal in
 * a component. GST, platform fee, and commission all arrive as data.
 */
export type BasisPoints = number;

export type Id = string;

/** Geographic point. Latitude first is a common bug — the field names prevent it. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  id: Id;
  /** `work` renders as "Office". Stored as `work` — see the note on the model. */
  label: "home" | "work" | "other";
  /** The customer's own name for an `other` address: "Mum's place", "Shop". */
  labelName?: string;
  /** House or flat number, kept apart from the geocoded street in `line1`. */
  flatNumber?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  /** Who the pro asks for at the door. Falls back to the account holder. */
  contactName?: string;
  contactPhone?: string;
  point: GeoPoint;
  /** True once the coordinates came from a real map pin or geocode. */
  locationVerified?: boolean;
  /**
   * Whether CFC currently operates in this address's area.
   *
   * Server-computed against the admin's service-area list, because the list
   * changes without the address changing. An address outside it still saves —
   * losing something a customer carefully typed is worse — but booking from it
   * is refused, with the reason named rather than an empty pro list.
   */
  serviceable?: boolean;
  isDefault: boolean;
}

/** A stored image. `blurhash` is optional so a skeleton can match its shape. */
export interface ImageRef {
  url: string;
  alt: string;
  width: number;
  height: number;
  blurhash?: string;
}

/**
 * The seven roles from the specification. Admin screens are gated on these
 * through the shared permission primitive, never through scattered conditionals.
 */
export type Role =
  | "customer"
  | "super_admin"
  | "sub_admin"
  | "area_admin"
  | "pro"
  | "associate_partner"
  | "major_partner";

/** Paged collection. Every list endpoint returns this shape. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Thrown by every mock api function on failure, and by the real client later.
 * Error states render from this, so they render the same shape in production.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
