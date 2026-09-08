import { canOpen, type Actor, type AdminSection } from "@cfc/types";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  BarChart3,
  CalendarCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Tags,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Admin navigation — one item per Section 4.3 heading in the doc (11 total),
 * not one item per screen (49). A nav item is a navigation decision; a screen
 * is content. Detail screens (Quotation Detail, Booking Detail, Pro Detail,
 * Customer Detail, Ticket Detail) are reached by clicking a row and opening as
 * a side panel — they never get a permanent sidebar slot. Add/Edit screens
 * open as dialogs from their list. Peer screens within one section (e.g. the
 * 5 Reports screens) live as tabs inside that section's single route.
 *
 * The eleven are grouped into four sections. A flat list of eleven is a list to
 * be read; four groups of two or three is a shape to be recognised, and an
 * operator who uses this daily stops reading the labels entirely.
 *
 * `badge` names a live count the shell resolves — pending quotes, pros awaiting
 * KYC, open tickets. Work waiting on someone was previously invisible until you
 * navigated to the screen holding it, which is precisely backwards: the queue
 * you are not looking at is the one that needs you.
 *
 * All 49 doc screens still exist as real, built content — see each route's
 * own file for the doc-screen-number comments. Only the *entry point* changed:
 * 49 flat, permanently-listed items became 11 sectioned ones, worked out
 * directly with the client screen by screen (see the approved plan).
 */

/** Counts the shell can render beside a nav item. */
export type NavBadge = "pendingQuotes" | "pendingPros" | "openTickets";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * The permission section this item belongs to.
   *
   * The shell hides an item the signed-in admin cannot open, so a sub admin
   * never sees Payments in the rail at all. Dashboard has none: it is the
   * landing page and every admin gets it.
   */
  section?: AdminSection;
  /** Extra terms that should match this item in the command palette. */
  keywords?: string;
  badge?: NavBadge;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        keywords: "home overview kpi today",
      },
      {
        label: "Quotations",
        href: "/quotations",
        section: "quotations",
        icon: FileText,
        keywords: "quotes approve reject sla material",
        badge: "pendingQuotes",
      },
      {
        label: "Bookings & jobs",
        href: "/bookings",
        section: "bookings",
        icon: CalendarCheck,
        keywords: "orders assign map live dispute status",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Pro management",
        href: "/pros",
        section: "pros",
        icon: Wrench,
        keywords: "technicians partners kyc documents payouts warnings wallet",
        badge: "pendingPros",
      },
      {
        label: "Customers",
        href: "/customers",
        section: "customers",
        icon: Users,
        keywords: "users block complaints no-show",
      },
    ],
  },
  {
    label: "Catalogue & money",
    items: [
      {
        label: "Service & pricing",
        href: "/services",
        section: "services",
        icon: Tags,
        keywords: "categories sub-categories commission rates variants",
      },
      {
        label: "Payments & finance",
        href: "/payments",
        section: "payments",
        icon: CreditCard,
        keywords: "transactions revenue settlement refunds gst tax",
      },
      {
        label: "Promotions",
        href: "/promotions",
        section: "promotions",
        icon: BadgePercent,
        keywords: "coupons promo codes banners offers discounts",
      },
    ],
  },
  {
    label: "Insight & admin",
    items: [
      {
        label: "Reports",
        href: "/reports",
        section: "reports",
        icon: BarChart3,
        keywords: "analytics revenue demand performance retention export",
      },
      {
        label: "Support",
        href: "/support",
        section: "support",
        icon: LifeBuoy,
        keywords: "tickets push notifications whatsapp sms alerts",
        badge: "openTickets",
      },
      {
        label: "Settings",
        href: "/settings",
        section: "settings",
        icon: Settings,
        keywords: "platform profile sub admins feature flags geofencing 2fa",
      },
    ],
  },
];

/** Flat list, for the command palette and for resolving the active route. */
export const NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

/**
 * The navigation as one particular admin sees it.
 *
 * Groups that end up empty are dropped rather than rendered as a heading with
 * nothing under it — an Area Admin has no Catalogue & money items at all, and
 * a bare heading would read as a loading failure.
 */
export function navFor(actor: Actor): NavGroup[] {
  return NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.section === undefined || canOpen(actor, item.section),
    ),
  })).filter((group) => group.items.length > 0);
}

/**
 * The group a route belongs to, for the breadcrumb trail.
 * Returns null for a route that is not a nav destination.
 */
export function navLocation(
  pathname: string,
): { group: string; item: NavItem } | null {
  for (const group of NAV) {
    for (const item of group.items) {
      const match =
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      if (match) return { group: group.label, item };
    }
  }
  return null;
}
