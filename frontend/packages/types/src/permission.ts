import { ADMIN_SECTIONS, type AdminSection } from "./admin-user";
import type { Role } from "./primitives";

/**
 * Permissions.
 *
 * Admin screens are gated across seven roles. Conditional rendering is never
 * scattered through components — a screen asks `can(actor, "bookings.view_all")`
 * and the answer lives here.
 *
 * Two layers, because they answer different questions:
 *
 *   `canOpen(actor, section)` — may they reach this part of the panel at all?
 *   That drives the sidebar and the route guard, and it is what Admin 49
 *   assigns per person.
 *
 *   `can(actor, permission)` — may they do this particular thing once inside?
 *   Exporting, overriding a status, approving a payout. A sub admin who can
 *   open Payments still should not be able to approve one.
 *
 * Adding a screen means adding its permissions to this list, not adding a role
 * check to a component.
 */

export const PERMISSIONS = [
  "bookings.view_all",
  "bookings.view_own_area",
  "bookings.export",
  "bookings.override_status",
  /** Approving a quotation commits CFC to a price. */
  "quotations.approve",
  /** Verifying KYC, blocking a pro, issuing a warning. */
  "pros.approve_kyc",
  "pros.block",
  /** Money leaving the platform. */
  "payments.approve_payout",
  "payments.issue_refund",
  /** Changing what things cost, or what CFC takes. */
  "services.edit_pricing",
  "services.edit_commission",
  /** Sending to every device at once. */
  "support.send_broadcast",
  /** Platform configuration, and creating other admins. */
  "settings.edit_platform",
  "settings.manage_admins",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Which sections each role may open, taken from the agreement's own wording.
 *
 * Super Admin (there is only one) has "full platform control: pro onboarding,
 * service and pricing, quotation approvals, commission settings, dispute
 * resolution, reports, analytics, all configuration" — everything.
 *
 * Sub Admin "supports the Super Admin day to day: bookings, support tickets,
 * quotation queue, vendor approvals, as delegated". That list is four things,
 * and it is exhaustive: service and pricing, reports and analytics are named
 * under the Super Admin's control, not delegated here. Vendor approvals are
 * why Pros is on the list.
 *
 * Area Admin is "operations within one assigned geographic area... local pro
 * management and job oversight only", with "no external tool or third-party
 * access at this level". Job oversight is bookings and the quotation queue;
 * local pro management is Pros.
 */
const ROLE_SECTIONS: Record<Role, readonly AdminSection[]> = {
  super_admin: ADMIN_SECTIONS,
  sub_admin: ["bookings", "quotations", "pros", "support"],
  area_admin: ["bookings", "quotations", "pros"],
  customer: [],
  pro: [],
  associate_partner: [],
  major_partner: [],
};

/**
 * Who can do what.
 *
 * Area Admin sees only their assigned area — that is the whole reason this
 * primitive exists on the first screen rather than the fortieth.
 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: [
    "bookings.view_all",
    "bookings.export",
    "bookings.override_status",
    "quotations.approve",
    "pros.approve_kyc",
    "pros.block",
    "payments.approve_payout",
    "payments.issue_refund",
    "services.edit_pricing",
    "services.edit_commission",
    "support.send_broadcast",
    "settings.edit_platform",
    "settings.manage_admins",
  ],
  sub_admin: [
    "bookings.view_all",
    "bookings.export",
    "quotations.approve",
    // "Vendor approvals, as delegated" — onboarding a pro is delegated;
    // blocking one is not. Pricing and commission are named under the Super
    // Admin's control, so they are absent here by the doc, not by preference.
    "pros.approve_kyc",
    "support.send_broadcast",
  ],
  // No export: "no external tool or third-party access at this level".
  area_admin: ["bookings.view_own_area", "quotations.approve"],
  customer: [],
  pro: [],
  associate_partner: [],
  major_partner: [],
};

/** The signed-in user, as far as the UI is concerned. */
export interface Actor {
  id: string;
  name: string;
  role: Role;
  /** Set for area_admin. The area whose bookings they may see. */
  area?: string;
  /**
   * Sections granted to this specific person in Admin 49.
   *
   * Narrows the role's own list — it can never widen it, so a sub admin cannot
   * be granted Settings by editing a record. Undefined means "whatever the
   * role allows", which is how the Super Admin and the presets behave.
   */
  sections?: readonly AdminSection[] | undefined;
}

export function can(actor: Actor, permission: Permission): boolean {
  return ROLE_PERMISSIONS[actor.role].includes(permission);
}

/**
 * May this actor open this section at all?
 *
 * The per-person grant intersects the role's list rather than replacing it, so
 * a bad row in the admin table cannot hand out access the role never had.
 */
export function canOpen(actor: Actor, section: AdminSection): boolean {
  if (!ROLE_SECTIONS[actor.role].includes(section)) return false;
  return actor.sections ? actor.sections.includes(section) : true;
}

/** Every section this actor may open, in the order they are declared. */
export function openableSections(actor: Actor): AdminSection[] {
  return ADMIN_SECTIONS.filter((s) => canOpen(actor, s));
}

/** True if the actor may open the screen at all, in any form. */
export function canViewBookings(actor: Actor): boolean {
  return (
    can(actor, "bookings.view_all") || can(actor, "bookings.view_own_area")
  );
}

/**
 * The area filter the actor is locked to, or null for unrestricted.
 * A screen applies this to its query rather than filtering rows after fetch.
 */
export function areaScope(actor: Actor): string | null {
  if (can(actor, "bookings.view_all")) return null;
  return actor.area ?? null;
}
