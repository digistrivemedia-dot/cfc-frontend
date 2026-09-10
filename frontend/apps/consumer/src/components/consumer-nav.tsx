"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Home,
  LifeBuoy,
  LogOut,
  Search,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import { getConsumerProfile } from "@cfc/mocks";
import type { ConsumerProfile } from "@cfc/types";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
  initials,
} from "@cfc/ui";
import { Logo } from "@/components/logo";
import { useSession } from "@/lib/session";
import { CartButton } from "@/components/cart-button";
import { AreaPicker } from "@/components/area-picker";

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
 *  - **A "Help" button that dialled a phone.** It was never in the screen
 *    inventory — the doc specifies Customer 40, a Help & Support screen, with
 *    the helpline as a feature on it. What was here was a `tel:` link wearing
 *    the word "Help", so clicking it opened a dialler instead of the help
 *    screen. Support is now a menu item pointing at /support, and the number
 *    lives in the footer and on the support screen where it is labelled as one.
 */

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/**
 * The homepage is `/`, so it must match exactly — a `startsWith` test would
 * mark it active on every route in the app. The rest own their sub-routes.
 */
function useIsActive(href: string): boolean {
  const pathname = usePathname();
  if (href === "/") return pathname === href;
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
  const { signedIn } = useSession();

  return (
    <header className="sticky top-0 z-header hidden border-b border-border bg-surface md:block">
      <div className="mx-auto flex h-bar-lg max-w-screen-xl items-center gap-4 px-6 lg:px-8">
        <Link
          href="/"
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

        {/* Shown to everyone. "Do you operate where I live?" is the first
            question a stranger has, and they will not create an account to
            find out — so the area belongs to the visit, not to the account. */}
        <AreaPicker />

        <HeaderSearch />

        <div className="flex shrink-0 items-center gap-3">
          {/* No "Help" button here. It was not in the screen inventory — the
              doc specifies Customer 40, a Help & Support screen, with "call CFC
              helpline" as a feature inside it, not a header control. What was
              here was worse than redundant: a `tel:` link labelled "Help", so
              clicking it opened a phone dialler rather than the help screen a
              person expects. Support lives at /support, reachable from the
              account menu and the footer; the phone number is in the footer and
              on the support screen itself, where it is labelled as a number. */}

          {/* The basket is public. Browsing and collecting services needs no
              account — the sign-in is asked for at checkout. */}
          <CartButton />

          {signedIn ? (
            <>
              <NotificationBell />
              <AccountMenu profile={profile} />
            </>
          ) : (
            /* A guest gets the one control that matters to them. Notifications
               and an avatar with somebody's initials in it are meaningless
               before there is an account. */
            <Link
              href="/login"
              className={cn(
                "flex h-field shrink-0 items-center rounded-control bg-action px-5",
                "text-small font-semibold text-on-action",
                "transition-colors duration-fast hover:bg-action-hover",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              Log in
            </Link>
          )}
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
/**
 * The header search box.
 *
 * This used to be a live, typeable form that only navigated to `/search` on
 * Enter — a second, smaller search UI living in the header, separate from the
 * real one. Two problems followed from that: landing on `/search` after
 * submitting put an *identical* search box directly under this one (visibly
 * duplicated, confirmed in a screenshot), and clicking into the header box
 * showed nothing — no trending, no recent, no voice — because those only
 * exist on the actual search screen, which this box was not.
 *
 * It now behaves the way every marketplace search bar does: the moment you
 * click into it, you are taken straight to `/search`, which owns the real
 * input, the mic, recent searches and trending. This is a button styled as an
 * input, not a form — clicking anywhere in it, not just submitting, is what
 * moves you.
 */
function HeaderSearch() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/search")}
      aria-label="Search for a service"
      className={cn(
        "group flex h-field min-w-0 flex-1 items-center gap-2 rounded-control",
        "border border-border bg-canvas px-3 text-left",
        "transition-colors duration-fast",
        "hover:border-action-line",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <Search
        className="size-4 shrink-0 text-ink-faint transition-colors duration-fast group-hover:text-action"
        aria-hidden="true"
      />
      <span className="truncate text-small text-ink-faint">
        Search for a service — AC, cleaning, salon…
      </span>
    </button>
  );
}

/**
 * The account menu.
 *
 * Holds the four destinations that used to occupy a full nav row. A menu is
 * the right home for them: they are personal, visited occasionally, and none
 * of them is what a customer came to the site to do.
 *
 * Built on the shared `DropdownMenu` primitive rather than a hand-rolled
 * absolutely-positioned div, because the hand-rolled version could not paint
 * above the page.
 *
 * The reason is stacking contexts, not z-index values. This menu lives inside
 * a `sticky` header, and a positioned element with a z-index creates its own
 * stacking context — so the menu's `z-popover` (80) was only ever resolved
 * *within the header*, never against the page. Any page section that makes its
 * own stacking context therefore covered it, and four of them do exactly that
 * (`relative isolate`): the active-booking card, the hero, and two home-screen
 * bands. Raising the header's own z-index cannot fix this, because the menu is
 * still trapped inside it.
 *
 * `DropdownMenuContent` portals to `document.body`, so the menu escapes the
 * header entirely and its `z-popover` finally applies against the real page.
 * Radix also brings the outside-click, Escape, focus-trap and roving-focus
 * behaviour the hand-rolled version re-implemented by hand — and its
 * `aria-*` wiring, which is why the trigger no longer sets those itself.
 */
function AccountMenu({ profile }: { profile: ConsumerProfile | null }) {
  const router = useRouter();
  const { signOut } = useSession();

  const itemClass = cn(
    "flex cursor-pointer items-center gap-3 rounded-control px-3 py-2",
    "text-small text-ink",
    "transition-colors duration-fast focus:bg-action-subtle focus:text-action",
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
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
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-menu p-1">
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

        <div className="py-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild className={itemClass}>
              <Link href={href}>
                <Icon className="size-4 text-ink-muted" aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}

          {/* Customer 40. This is the route the inventory actually
              specifies — a Help & Support screen with the FAQ, ticket
              raising and the helpline number on it — rather than a header
              button that silently dialled a phone. */}
          <DropdownMenuItem asChild className={itemClass}>
            <Link href="/support">
              <LifeBuoy className="size-4 text-ink-muted" aria-hidden="true" />
              Help &amp; support
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={itemClass}>
            <Link href="/settings">
              <Settings className="size-4 text-ink-muted" aria-hidden="true" />
              Settings
            </Link>
          </DropdownMenuItem>
        </div>

        {/* Sign out is separated by a rule so it is not tapped while
            scanning the list above. It existed only on Profile and
            Settings before — which is not where anyone looks for it. */}
        <div className="border-t border-border pt-1">
          <DropdownMenuItem
            onSelect={() => {
              // Clear the session, then land on the public homepage. Sending
              // them to /login instead would be odd: signing out is not a
              // request to sign back in, and the site is browsable either way.
              signOut();
              router.push("/");
            }}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-control px-3 py-2",
              "text-small font-medium text-critical-ink",
              "transition-colors duration-fast focus:bg-critical-subtle",
              "[&_svg]:text-critical-ink",
            )}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// -- Mobile -------------------------------------------------------------------

export function ConsumerMobileTopBar() {
  const router = useRouter();
  const { signedIn } = useSession();
  const barRef = React.useRef<HTMLElement | null>(null);

  // Kept on the document so any sticky element below can offset by it without
  // being passed a prop through layouts it does not control.
  React.useEffect(() => {
    const el = barRef.current;
    if (el === null) return;

    const publish = () => {
      document.documentElement.style.setProperty(
        "--cfc-mobile-bar",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      /**
       * Publishes its own height as `--cfc-mobile-bar`.
       *
       * The category strip below sticks under this header, and this header is
       * not a fixed height — it is a 56px brand row plus a search-and-area row
       * whose height depends on the control sizes inside it. Both were pinned
       * at `top-0`, so on a phone the strip scrolled underneath the header and
       * vanished: the navigation spine of the home screen, invisible on the
       * device most customers arrive on.
       *
       * Measured rather than assumed, because a hardcoded offset silently goes
       * wrong the moment anything in either row changes.
       */
      ref={barRef}
      className="sticky top-0 z-header border-b border-border bg-surface md:hidden"
    >
      <div className="flex h-bar items-center justify-between gap-3 px-4">
        {/* The brand stays put — a phone header without one is disorienting —
            and the area moves to its own line below, where it has room to
            show the name and "Change" without truncating. */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-control"
        >
          <Logo className="size-mark shrink-0 text-action" />
          <span className="truncate text-body font-semibold tracking-tight text-ink">
            City Family Care
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          {/* The call-support shortcut was removed with its desktop
              counterpart. On a phone the bar is already carrying a location,
              a checkout icon, and either notifications or a log-in button; a
              fourth control made it crowded, and support has its own screen.

              `gap-3`, not `gap-1`: the checkout badge sits 4px outside the
              icon's own box (`-right-1` on a `size-4` badge), so a 4px gap
              next to the next control let the two visually touch. */}
          <CartButton />
          {signedIn ? (
            <NotificationBell />
          ) : (
            <Link
              href="/login"
              className={cn(
                "flex h-8 shrink-0 items-center rounded-control bg-action px-4",
                "text-small font-semibold text-on-action",
                "transition-colors duration-fast hover:bg-action-hover",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      {/* Search and the area share the line below the brand. Both are too
          important to lose on the device most visitors arrive on, and neither
          fits in the top row beside the logo and the account controls.

          The area comes second and shrinks: "do you serve me?" matters, but a
          customer who is already here mostly wants to search. */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          type="button"
          onClick={() => router.push("/search")}
          className={cn(
            "flex h-field min-w-0 flex-1 items-center gap-2 rounded-control",
            "border border-border bg-canvas px-3 text-small text-ink-faint",
            "transition-colors duration-fast hover:border-action-line",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search for a service</span>
        </button>

        <AreaPicker className="shrink-0" />
      </div>
    </header>
  );
}

export function ConsumerBottomNav() {
  const { signedIn } = useSession();

  // Three of the four tabs are personal. A visitor tapping "Bookings" before
  // they have an account reaches a screen that can only be empty, so the strip
  // does not appear at all until there is a customer behind it — the page keeps
  // that height instead.
  if (!signedIn) return null;

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
