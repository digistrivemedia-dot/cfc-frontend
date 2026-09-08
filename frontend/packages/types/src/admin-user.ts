import type { Id } from "./primitives";

/**
 * The sections of the admin panel a sub admin can be granted.
 *
 * Admin 49 says "assign permissions", and a permission has to name something
 * real to be assignable. These mirror the eleven nav sections, so granting one
 * maps to a sidebar item rather than to an abstraction nobody can picture.
 */
export const ADMIN_SECTIONS = [
  "bookings",
  "quotations",
  "pros",
  "customers",
  "services",
  "payments",
  "promotions",
  "reports",
  "support",
  "settings",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

/** Admin 49 — sub admins and area admins delegated by a Super Admin. */
export interface SubAdmin {
  id: Id;
  name: string;
  role: "sub_admin" | "area_admin";
  /** Set for area_admin. */
  area?: string | undefined;
  /** Sections this admin may open. Admin 49 — "assign permissions". */
  sections: AdminSection[];
  /** False once a Super Admin suspends them, without deleting the record. */
  active: boolean;
}
