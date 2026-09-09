"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Home,
  MapPin,
  Phone,
  Search,
  User,
  Wallet,
} from "lucide-react";
import { SUPPORT_PHONE, getConsumerProfile } from "@cfc/mocks";
import type { ConsumerProfile } from "@cfc/types";
import { Avatar, AvatarFallback, cn, initials } from "@cfc/ui";
import { Logo } from "@/components/logo";

/**
 * The navigation shell for the signed-in app.
 *
 * Rebuilt for the home redesign. What was wrong with the previous version:
 *
 *  - **Search was a lie.** It looked like a search field and behaved like a
 *    link — clicking it navigated to /search where you then had to type. On a
 *    marketplace the search box is the single most-used control on the page;
 *    it types where it stands.
 *
 *  - **A whole row for four links.** Home / Bookings / Wallet / Profile sat in
 *    a second full-width bar, duplicating destinations the avatar and the
 *    mobile tab strip already own. It cost 48px of every screen and earned
 *    none of it. Those four now live in the account menu and the tab bar;
 *    the freed row goes to the page.
 *
 *  - **No way to reach a person.** A marketplace taking an address and a card
 *    needs a phone number in reach. It is in the header now, not only buried
 *    in the footer.
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
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-control",
            "transition-opacity duration-fast hover:opacity-80",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          <Logo className="size-mark text-action" />
          <span className="text-heading font-semibold tracking-tight text-ink">
            City Family Care
          </span>
        </Link>

        <LocationButton area={profile?.area} />

        <HeaderSearch />

        <div className="flex shrink-0 items-center gap-1">
          {/* A real phone number, one click from every screen. */}
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className={cn(
              "hidden items-center gap-2 rounded-control px-3 py-2 lg:flex",
              "text-small font-medium text-ink-muted",
              "transition-colors duration-fast hover:bg-action-subtle hover:text-action",
              "focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            <Phone className="size-4" aria-hidden="true" />
            Help
          </a>

          <NotificationBell />
          <AccountMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}

/**
 * The header search.
 *
 * Submits to /search with the query, so the results screen owns the results
 * and this owns the intent. Typing here and pressing Enter is the fastest path
 * to a booking that exists in the product.
 */
function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className="min-w-0 flex-1"
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a service — AC, cleaning, salon…"
          aria-label="Search for a service"
          className={cn(
            "h-field w-full rounded-control border border-border bg-canvas pl-8 pr-3",
            "text-small text-ink placeholder:text-ink-faint",
            "transition-colors duration-fast",
            "hover:border-action-line",
            "focus:border-action-line focus:bg-surface",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        />
      </div>
    </form>
  );
}

/**
 * The account menu.
 *
 * Holds the four destinations that used to occupy a full nav row. A menu is
 * the right home for them: they are personal, visited occasionally, and none
 * of them is what a customer came to the site to do.
 */
function AccountMenu({ profile }: { profile: ConsumerProfile | null }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, the two ways a person expects to
  // dismiss a menu they opened by accident.
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your account"
        className={cn(
          "flex items-center gap-1 rounded-pill p-1",
          "transition-colors duration-fast hover:bg-action-subtle",
          "focus-visible:outline-none focus-visible:outline-focus",
        )}
      >
        <Avatar className="size-avatar">
          <AvatarFallback>
            {profile ? initials(profile.name) : ""}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="size-4 text-ink-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-popover mt-2 w-menu",
            "rounded-card border border-border bg-surface p-1 shadow-lg",
          )}
        >
          {profile && (
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-small font-semibold text-ink">
                {profile.name}
              </p>
              <p className="truncate text-caption text-ink-muted">
                {profile.phone}
              </p>
            </div>
          )}
          <ul className="py-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-control px-3 py-2",
                    "text-small text-ink",
                    "transition-colors duration-fast hover:bg-action-subtle hover:text-action",
                    "focus-visible:outline-none focus-visible:outline-focus",
                  )}
                >
                  <Icon className="size-4 text-ink-muted" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// -- Mobile -------------------------------------------------------------------

export function ConsumerMobileTopBar() {
  const profile = useProfile();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-surface md:hidden">
      <div className="flex h-bar items-center justify-between gap-3 px-4">
        <LocationButton area={profile?.area} stacked />

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            aria-label="Call support"
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              "text-ink-muted transition-colors duration-fast",
              "hover:bg-action-subtle hover:text-action",
            )}
          >
            <Phone className="size-4" aria-hidden="true" />
          </a>
          <NotificationBell />
        </div>
      </div>

      {/* Search gets its own line on a phone. It is the primary action, and
          sharing the bar with the location and two icons would leave it too
          narrow to show a real placeholder. */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => router.push("/search")}
          className={cn(
            "flex h-field w-full items-center gap-2 rounded-control",
            "border border-border bg-canvas px-3 text-small text-ink-faint",
            "transition-colors duration-fast hover:border-action-line",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search for a service</span>
        </button>
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
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-control text-left",
          "focus-visible:outline-none focus-visible:outline-focus",
        )}
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
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <MapPin className="size-4 shrink-0 text-action" aria-hidden="true" />
      <span className="max-w-line-md truncate font-medium">{label}</span>
      <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
    </button>
  );
}

function NotificationBell() {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full",
        "text-ink-muted transition-colors duration-fast",
        "hover:bg-action-subtle hover:text-action",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <Bell className="size-4" aria-hidden="true" />
    </Link>
  );
}
