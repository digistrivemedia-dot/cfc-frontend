"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart, X } from "lucide-react";
import { cn, formatCurrency } from "@cfc/ui";
import { useCart } from "@/lib/cart";

/**
 * The checkout bar.
 *
 * Adding a service used to be silent: the row turned into a stepper, the
 * header count went up by one, and that was the whole of the feedback. A
 * customer had to notice a number change in the corner and then work out that
 * the small icon was the way forward. Most would not, and a checkout nobody
 * reaches is the same as no checkout.
 *
 * So the moment anything is in it, a bar pins itself to the bottom of every
 * screen with the count, the running total and one way on. It is the standard
 * marketplace pattern for a reason — the next step is always visible, and it
 * costs a customer nothing to ignore.
 *
 * Hidden on `/cart` and inside the booking flow: on those screens the page
 * itself already carries the action, and a second one at the foot would be two
 * buttons competing to do the same job.
 */
export function CartBar() {
  const { count, subtotalPaise } = useCart();
  const pathname = usePathname();

  /**
   * Dismissed for this basket only.
   *
   * The bar covers the foot of every screen, and on a phone that is a real
   * amount of the page - a customer part-way through browsing could not read
   * what was underneath it. Dismissing hides it without touching the basket:
   * the header cart icon still carries the count, and /cart is still one tap
   * away, so nothing is lost by closing it.
   *
   * Keyed to the count rather than a flag, so adding ANOTHER service brings
   * the bar back. That is the moment the customer has acted again and the
   * running total has changed, which is exactly when it is worth showing.
   */
  const [dismissedAt, setDismissedAt] = React.useState<number | null>(null);
  const dismissed = dismissedAt === count;

  /**
   * Screens that already own the bottom of the viewport.
   *
   * `/cart` and the booking flow carry the same action on the page itself, and
   * a service page has its own fixed "Book now" bar below `lg` — two bars
   * stacked on a phone is a broken screen, and the service one is the stronger
   * action for someone reading that page.
   */
  const suppressed =
    pathname === "/cart" || pathname.startsWith("/book/");


  if (count === 0 || suppressed || dismissed) return null;

  return (
    <div
      // Padding rather than an offset, so the iOS home indicator is cleared
      // without competing with the `bottom-*` class that positions the bar.
      // When the tab bar is present it already carries this inset itself, and
      // `bottom-tab-bar` accounts for it — so this only has to do the work in
      // the case where the bar sits on the bottom edge on its own.
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      className={cn(
        "fixed inset-x-0 z-sticky px-4 md:px-6 lg:px-8",
        // Clearing the mobile tab bar is a BREAKPOINT decision, not an account
        // one, and it used to be neither: the offset was an inline style keyed
        // on `signedIn` alone, so a signed-in customer on a desktop — where the
        // tab bar is `md:hidden` and therefore not there — got a bar hovering
        // 56px above the bottom of the window with a strip of page showing
        // underneath it. An inline style cannot express a media query, so this
        // could only ever be right at one width.
        //
        // `bottom-tab-bar` is the existing 80px token for exactly this job (the
        // 56px bar plus its safe-area inset). It applies only while the tab bar
        // is actually rendered: below `md`, and only for a signed-in customer.
        // Everywhere else the bar sits on the bottom edge.
        // Same correction as the service page's bar: the mobile tab bar is
        // rendered only by the signed-in home page, never by `AppShell`, so
        // offsetting for it on every other screen floated this bar 80px above
        // nothing.
        "bottom-0",
        // No background of its own: the bar is a floating pill, so a page
        // scrolling underneath stays visible rather than being cut off by a
        // full-width band.
        "pointer-events-none",
      )}
    >
      {/* The card is a plain container, not the link.

          It used to be one big <Link> wrapping everything, which left nowhere
          to put a dismiss control: a <button> inside an <a> is invalid HTML
          and the two clicks compete. The Link now wraps only the part that
          should navigate, and the close button is its sibling. */}
      <div
        className={cn(
          // Matches the page container (`max-w-screen-xl`) rather than the
          // 768px it used before, which left the pill visibly narrower than —
          // and out of step with — the content it belongs to on any wide
          // screen. It aligns with the grid now at every width.
          "group pointer-events-auto mx-auto flex max-w-screen-xl items-center gap-3",
          // A white card with a teal edge, not a dark navy band. The navy
          // version put a teal icon chip and teal link text directly on top
          // of `bg-structure` (#0e1f3d) — three unrelated colours stacked in
          // one small bar, which read as muddy rather than branded. Every
          // other action surface in the app (buttons, the Add stepper, the
          // selected-tab state) is teal-on-white; this now matches that
          // language instead of introducing a fourth colour scheme of its own.
          "relative rounded-card border border-action-line bg-surface px-4 py-3 shadow-lg",
        )}
      >
        <Link
          href="/cart"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-control",
            "transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
        <span className="relative flex size-tile shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
          <ShoppingCart className="size-4" aria-hidden="true" />
          <span
            className="tabular absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-action text-caption font-semibold leading-none text-on-action"
            aria-hidden="true"
          >
            {count > 9 ? "9+" : count}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          {/* `truncate` matters here: the row now carries an icon, two lines
              of text, Checkout and a close button, and on a 360px screen
              "2 services added" is what gives way rather than pushing the
              buttons off the edge. */}
          <span className="block truncate text-small font-semibold text-ink">
            {count} {count === 1 ? "service" : "services"} added
          </span>
          <span className="tabular block text-caption text-ink-muted">
            {formatCurrency(subtotalPaise)} estimated
          </span>
        </span>
        </Link>

        {/* Teal at rest, orange on hover.

            Blue was tried here and sat awkwardly: it is the app's TINT colour
            (every third icon plate, the verified chip), not an action colour,
            so a blue button in a teal app reads as belonging to something
            else. Teal is the action colour everywhere else, so the primary
            action of this bar should be teal too.

            What makes it the loudest thing on the bar is not hue but
            treatment - it is the only saturated fill on a white card, at full
            button height, with a coloured glow beneath it.

            Hover goes to orange rather than a lighter teal. The client's spec
            says a coloured control lightens and gains a coloured glow on
            hover, never darkens; orange satisfies that and does something more
            useful besides - it is the app's "this is the thing" colour, so the
            button confirms itself under the cursor at the moment of decision. */}
        <Link
          href="/cart"
          className={cn(
            // Full size again at every width. The px-4/text-small shrink here
            // was compensating for a close button sitting in this row; with it
            // moved to the card corner the width is no longer contested.
            "flex h-12 shrink-0 items-center gap-2 rounded-control px-6",
            "bg-action text-body font-bold text-on-action",
            "shadow-md",
            "transition duration-fast",
            "group-hover:bg-promo group-hover:shadow-[0_10px_24px_-8px_rgba(244,123,32,.75)]",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          Checkout
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>

        {/* Dismiss — DESKTOP ONLY, and exactly as it was before: a quiet
            44px icon in the row, beside Checkout. There is room for it at this
            width and it has never been in the way here.

            Hidden below `md`. On a phone the row is too tight to carry it, and
            the corner ✕ that replaced it read as a stray dot floating off the
            card. The mobile dismiss is the strip beneath the bar instead. */}
        <button
          type="button"
          onClick={() => setDismissedAt(count)}
          aria-label="Hide the basket bar"
          className={cn(
            "hidden size-touch shrink-0 items-center justify-center rounded-control md:flex",
            "text-ink-muted",
            "transition-colors duration-fast hover:bg-neutral-subtle hover:text-ink",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {/* Dismiss — MOBILE ONLY, in the card's top-right corner.

            A ✕ in the row cost width the 360px layout did not have, and the
            "Hide" strip beneath the bar added a second row of chrome to the one
            screen with the least space. The corner circle takes neither: it
            overlaps the card edge, so it reads as "close this" without occupying
            any of the bar.

            The button is size-touch (44px) so the tap target stays honest; the
            visible mark is the 24px circle inside it.

            `pointer-events-auto` because the wrapper is `pointer-events-none`,
            so the page still scrolls behind the floating bar. */}
        <button
          type="button"
          onClick={() => setDismissedAt(count)}
          aria-label="Hide the basket bar"
          className={cn(
            "pointer-events-auto absolute -right-1 -top-3 z-sticky md:hidden",
            "flex size-touch items-center justify-center",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full",
              "border border-border bg-surface text-ink-muted shadow-md",
            )}
          >
            <X className="size-3" aria-hidden="true" />
          </span>
        </button>
      </div>

    </div>
  );
}
