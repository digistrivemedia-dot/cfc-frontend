"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Home,
  MapPin,
  Search,
  User,
  Wallet,
} from "lucide-react";
import { getConsumerProfile } from "@cfc/mocks";
import type { ConsumerProfile } from "@cfc/types";
import { Avatar, AvatarFallback, cn, initials } from "@cfc/ui";
import { Logo } from "@/components/logo";

/**
 * The navigation shell for the signed-in app.
 *
 * Two bars, one job. Above `md` a sticky header carries the brand, location,
 * search and account; below it, a compact top bar plus a bottom tab strip —
 * which is where a thumb actually reaches on a phone.
 *
 * Rebuilt in Phase 0. The previous version had the right shape and a broken
 * implementation: `bg-surface/95` generated no CSS at all (opacity modifiers
 * do not work on hex tokens), so the `backdrop-blur` beside it was blurring an
 * opaque bar; `size-9` and `py-2.5` are off the closed scale, so every avatar
 * and icon button in the nav had no size; the area was hardcoded to one
 * neighbourhood; and every link was a bare `<a>`, which reloads the whole
 * document on each tab press instead of navigating client-side.
 */

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** `/home` must match exactly; the rest own their sub-routes. */
function useIsActive(href: string): boolean {
  const pathname = usePathname();
  if (href === "/home") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The signed-in customer.
 *
 * Fetched once here rather than passed down, because both bars need it and the
 * area is not something a caller should have to know. Null until it arrives —
 * every consumer renders a real fallback rather than a guess.
 */
function useProfile(): ConsumerProfile | null {
  const [profile, setProfile] = React.useState<ConsumerProfile | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getConsumerProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        // A failed profile fetch must not take the navigation down with it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}

// -- Desktop ------------------------------------------------------------------

export function ConsumerTopBar() {
  const profile = useProfile();

  return (
    <header className="sticky top-0 z-sticky hidden border-b border-border bg-surface md:block">
      <div className="mx-auto flex h-bar-lg max-w-screen-xl items-center gap-4 px-6 lg:px-8">
        <Link
          href="/home"
          className="flex shrink-0 items-center gap-2 rounded-control transition-opacity duration-fast hover:opacity-80"
        >
          <Logo className="size-mark text-action" />
          <span className="text-heading font-semibold tracking-tight text-ink">
            City Family Care
          </span>
        </Link>

        <LocationButton area={profile?.area} />

        {/* A button rather than an input: search is its own screen with recent
            and trending, so tapping here navigates rather than typing in place. */}
        <Link
          href="/search"
          className={cn(
            "group flex h-field min-w-0 flex-1 items-center gap-3 rounded-control",
            "border border-border bg-canvas px-4 text-small text-ink-muted",
            "transition-colors duration-fast hover:border-action-line hover:bg-action-subtle",
          )}
        >
          <Search
            className="size-4 shrink-0 transition-colors duration-fast group-hover:text-action"
            aria-hidden="true"
          />
          <span className="truncate">Search for a service</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="rounded-full transition-opacity duration-fast hover:opacity-80"
          >
            <Avatar className="size-avatar">
              <AvatarFallback>
                {profile ? initials(profile.name) : ""}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <nav
          aria-label="Sections"
          className="mx-auto flex max-w-screen-xl items-center gap-1 overflow-x-auto px-6 scrollbar-none lg:px-8"
        >
          {NAV_ITEMS.map((item) => (
            <DesktopNavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </header>
  );
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const isActive = useIsActive(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative whitespace-nowrap px-4 py-3 text-small font-medium",
        "transition-colors duration-fast",
        isActive ? "text-action" : "text-ink-muted hover:text-ink",
      )}
    >
      {label}
      {isActive && (
        <span
          className="absolute inset-x-4 bottom-0 h-px rounded-pill bg-action"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

// -- Mobile -------------------------------------------------------------------

export function ConsumerMobileTopBar() {
  const profile = useProfile();

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-surface md:hidden">
      <div className="flex h-bar items-center justify-between gap-3 px-4">
        <LocationButton area={profile?.area} stacked />

        <div className="flex shrink-0 items-center gap-1">
          <NotificationBell />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="rounded-full"
          >
            <Avatar className="size-8">
              <AvatarFallback>
                {profile ? initials(profile.name) : ""}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ConsumerBottomNav() {
  return (
    <nav
      aria-label="Main"
      // `env(safe-area-inset-bottom)` keeps the strip clear of the iOS home
      // indicator. It is a device value, not a design one, so it is inline
      // rather than a token.
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
        "flex h-touch flex-col items-center justify-center gap-1 py-2",
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

// -- Shared -------------------------------------------------------------------

/**
 * Where the customer is booking for.
 *
 * `stacked` gives the mobile bar its two-line treatment; the desktop bar has
 * room for one line. Both read from the profile — the area used to be a
 * hardcoded default parameter, so every customer appeared to live in the same
 * neighbourhood.
 */
function LocationButton({
  area,
  stacked = false,
}: {
  area: string | undefined;
  stacked?: boolean;
}) {
  const label = area ?? "Set your area";

  if (stacked) {
    return (
      <button
        type="button"
        className="flex min-w-0 items-center gap-2 rounded-control text-left"
      >
        <MapPin className="size-4 shrink-0 text-action" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-caption leading-none text-ink-muted">
            Booking for
          </span>
          <span className="mt-px flex items-center gap-1 text-small font-semibold text-ink">
            <span className="truncate">{label}</span>
            <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex h-field shrink-0 items-center gap-2 rounded-control",
        "border border-border bg-canvas px-3 text-small text-ink-muted",
        "transition-colors duration-fast hover:border-action-line hover:text-ink",
      )}
    >
      <MapPin className="size-4 shrink-0 text-action" aria-hidden="true" />
      <span className="max-w-line-md truncate font-medium">{label}</span>
      <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
    </button>
  );
}

/**
 * Notifications.
 *
 * The dot is decorative — the count itself lives on the notifications screen
 * (Customer 39). No badge number here, because a number nothing has fetched is
 * a number that will be wrong.
 */
function NotificationBell() {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full",
        "text-ink-muted transition-colors duration-fast",
        "hover:bg-action-subtle hover:text-action",
      )}
    >
      <Bell className="size-4" aria-hidden="true" />
    </Link>
  );
}
