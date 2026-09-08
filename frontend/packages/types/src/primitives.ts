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
  label: "home" | "work" | "other";
  line1: string;
  line2?: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  point: GeoPoint;
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
