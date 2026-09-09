"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  LayoutDashboard,
  LifeBuoy,
  ShieldAlert,
  User,
  Wallet,
} from "lucide-react";
import { getPro, getUnreadNotificationCount } from "@cfc/mocks";
import type { ProDetail } from "@cfc/types";
import { Avatar, AvatarFallback, Switch, cn, initials } from "@cfc/ui";
import { Logo } from "@/components/logo";
import { currentProId, useOnlineState } from "@/lib/pro-session";

/**
 * The Pro app's navigation shell.
 *
 * **Deliberately not the consumer app's shell.** The consumer app uses a top
 * bar plus bottom tabs, which suits browsing. A pro's app is a working surface
 * they return to between jobs all day, and its primary control — whether they
 * are accepting work — needs a permanent home rather than a screen you navigate
 * to. So:
 *
 *   Mobile  — bottom tab strip (thumb reach), and the online state as a compact
 *             pill in the top bar so it is visible on every screen.
 *   Desktop — a fixed 240px left rail with the online toggle at the TOP of it.
 *             This is not decoration: an Associate or Major Partner runs their
 *             operation from a laptop, and a rail is what lets them keep the
 *             job list and a job detail on screen at once.
 *
 * One component renders both. Nothing else in the app decides its own chrome.
 */

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Rail-only destinations. Reachable on mobile from the Profile screen. */
const RAIL_SECONDARY = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/warnings", label: "Warnings", icon: ShieldAlert },
  { href: "/support", label: "Help & support", icon: LifeBuoy },
] as const;

/** `/dashboard` matches exactly; everything else owns its sub-routes. */
function useIsActive(href: string): boolean {
  const pathname = usePathname();
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The signed-in pro.
 *
 * Fetched here rather than passed down: both the rail and the mobile bar need
 * the name, photo and rating, and no caller should have to know which pro is
 * signed in. Null until it arrives, and every consumer of it renders a real
 * fallback rather than a guess at the shape.
 */
function usePro(): ProDetail | null {
  const [pro, setPro] = React.useState<ProDetail | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getPro(currentProId())
      .then((p) => {
        if (!cancelled) setPro(p);
      })
      .catch(() => {
        // A failed profile fetch must not take the navigation down with it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return pro;
}

// -- Desktop rail -------------------------------------------------------------

export function ProRail() {
  const pro = usePro();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-sticky hidden w-rail flex-col md:flex",
        "border-r border-structure-line bg-structure",
      )}
    >
      <div className="flex h-bar-lg shrink-0 items-center gap-2 border-b border-structure-line px-4">
        <Logo className="size-mark text-brand" />
        <span className="text-heading font-semibold tracking-tight text-on-structure">
          CFC Pro
        </span>
      </div>

      {/* The online toggle, at the top of the rail rather than buried in a
          settings screen. It is the single most consequential control in the
          app: online means in the dispatch pool. */}
      <div className="shrink-0 border-b border-structure-line p-4">
        <OnlineToggle />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <RailLink {...item} />
            </li>
          ))}
        </ul>

        <p className="mt-6 px-3 text-caption font-medium uppercase tracking-wide text-on-structure-faint">
          More
        </p>
        <ul className="mt-2 space-y-1">
          {RAIL_SECONDARY.map((item) => (
            <li key={item.href}>
              <RailLink {...item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Who is signed in. At the foot of the rail because it is identity, not
          navigation — a pro checks it once and then ignores it. */}
      <Link
        href="/profile"
        className={cn(
          "flex shrink-0 items-center gap-3 border-t border-structure-line p-4",
          "transition-colors duration-fast hover:bg-structure-raised",
        )}
      >
        <Avatar className="size-avatar">
          <AvatarFallback>{pro ? initials(pro.name) : ""}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-medium text-on-structure">
            {pro?.name ?? " "}
          </span>
          <span className="block truncate text-caption text-on-structure-muted">
            {pro ? `CFC Pro · ${pro.id.replace("pro_", "#")}` : " "}
          </span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-on-structure-faint"
          aria-hidden="true"
        />
      </Link>
    </aside>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isActive = useIsActive(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-touch items-center gap-3 rounded-control px-3",
        "text-small font-medium transition-colors duration-fast",
        isActive
          ? "bg-structure-active text-on-structure"
          : "text-on-structure-muted hover:bg-structure-raised hover:text-on-structure",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

// -- Mobile -------------------------------------------------------------------

export function ProMobileTopBar() {
  const pro = usePro();

  return (
    <header className="sticky top-0 z-sticky border-b border-structure-line bg-structure md:hidden">
      <div className="flex h-bar items-center justify-between gap-3 px-4">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <Logo className="size-6 shrink-0 text-brand" />
          <span className="truncate text-heading font-semibold tracking-tight text-on-structure">
            CFC Pro
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {/* The online state, on every screen. A pro who cannot see whether
              they are in the dispatch pool cannot trust the app. */}
          <OnlinePill />
          <NotificationBell />
          <Link href="/profile" aria-label="Your profile">
            <Avatar className="size-8">
              <AvatarFallback>{pro ? initials(pro.name) : ""}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ProBottomNav() {
  return (
    <nav
      aria-label="Main"
      // A device value, not a design one, so it stays inline: it keeps the
      // strip clear of the iOS home indicator.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      className="fixed inset-x-0 bottom-0 z-sticky border-t border-border bg-surface md:hidden"
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => (
          <BottomNavLink key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}

function BottomNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isActive = useIsActive(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-touch flex-col items-center justify-center gap-1",
        "transition-colors duration-fast",
        isActive ? "text-action" : "text-ink-muted",
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-pill",
          isActive && "bg-action-subtle",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-caption font-medium leading-none">{label}</span>
    </Link>
  );
}

// -- The online control -------------------------------------------------------

/**
 * The rail's online switch.
 *
 * A `Switch` with a label and an explanation, not a bare toggle. The
 * explanation matters because the state has a consequence a pro cannot see:
 * online means job alerts arrive. Going offline by accident and wondering why
 * work dried up is the single most likely support ticket this app can generate.
 */
function OnlineToggle() {
  const { online, setOnline } = useOnlineState();

  return (
    <div
      className={cn(
        "rounded-control border p-3 transition-colors duration-base",
        online
          ? "border-live-line bg-live-subtle"
          : "border-structure-line bg-structure-raised",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              online ? "bg-live" : "bg-neutral",
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              "truncate text-small font-semibold",
              online ? "text-live-ink" : "text-on-structure-muted",
            )}
          >
            {online ? "Online" : "Offline"}
          </span>
        </span>
        <Switch
          checked={online}
          onCheckedChange={setOnline}
          aria-label="Accept jobs"
        />
      </div>
      <p
        className={cn(
          "mt-2 text-caption",
          online ? "text-live-ink" : "text-on-structure-faint",
        )}
      >
        {online
          ? "You are in the queue for new jobs."
          : "You will not receive job alerts."}
      </p>
    </div>
  );
}

/**
 * The mobile bar's online indicator.
 *
 * A link to the full-screen toggle (screen 11) rather than a switch. A
 * mis-tapped switch in a cramped top bar silently removes a pro from the
 * dispatch pool; a link costs one tap and cannot go wrong by accident.
 */
function OnlinePill() {
  const { online } = useOnlineState();

  return (
    <Link
      href="/status"
      aria-label={
        online
          ? "You are online. Change your status."
          : "You are offline. Change your status."
      }
      className={cn(
        "flex h-8 items-center gap-2 rounded-pill px-3",
        "text-caption font-semibold transition-colors duration-fast",
        online
          ? "bg-live-subtle text-live-ink"
          : "bg-structure-raised text-on-structure-muted",
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          online ? "bg-live" : "bg-neutral",
        )}
        aria-hidden="true"
      />
      {online ? "Online" : "Offline"}
    </Link>
  );
}

/**
 * Notifications.
 *
 * A dot, not a count. The exact number belongs on the notifications screen;
 * here the only question is whether there is anything to look at, and a number
 * that nothing keeps current is a number that will be wrong.
 */
function NotificationBell() {
  const [unread, setUnread] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    getUnreadNotificationCount()
      .then((n) => {
        if (!cancelled) setUnread(n);
      })
      .catch(() => {
        // A failed count must not take the navigation down with it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={
        unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
      }
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full",
        "text-on-structure-muted transition-colors duration-fast",
        "hover:bg-structure-raised hover:text-on-structure",
      )}
    >
      <Bell className="size-4" aria-hidden="true" />
      {unread > 0 && (
        <span
          className="absolute right-1 top-1 size-2 rounded-full bg-critical"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
