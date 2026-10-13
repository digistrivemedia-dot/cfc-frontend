import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  PackageCheck,
  Store,
} from "lucide-react";

/**
 * Merchant navigation.
 *
 * Five items, ordered the way a shop works a day: what has just come in, what
 * is being picked, what is waiting on the counter, what has gone. The profile
 * sits last because it is read once at setup and rarely after.
 *
 * `badge` names a live count the shell resolves. A request that nobody has
 * answered is the only thing in this product that is time-critical, so it is
 * the one number carried in the nav rather than left on a screen.
 */

export type MerchantNavBadge = "pending" | "ready";

export interface MerchantNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: MerchantNavBadge;
}

export const MERCHANT_NAV: MerchantNavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/requests",
    label: "New Requests",
    icon: ClipboardList,
    badge: "pending",
  },
  { href: "/preparing", label: "Preparing", icon: PackageCheck },
  { href: "/ready", label: "Ready", icon: CheckCircle2, badge: "ready" },
  { href: "/profile", label: "Shop Profile", icon: Store },
];
