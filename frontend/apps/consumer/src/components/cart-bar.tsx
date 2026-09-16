"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
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
   * Screens that already own the bottom of the viewport.
   *
   * `/cart` and the booking flow carry the same action on the page itself, and
   * a service page has its own fixed "Book now" bar below `lg` — two bars
   * stacked on a phone is a broken screen, and the service one is the stronger
   * action for someone reading that page.
   */
  const suppressed =
    pathname === "/cart" || pathname.startsWith("/book/");


  if (count === 0 || suppressed) return null;

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
      <Link
        href="/cart"
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
          "rounded-card border border-action-line bg-surface px-4 py-3 shadow-lg",
          "transition-colors duration-fast hover:bg-action-subtle",
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
          <span className="block text-small font-semibold text-ink">
            {count} {count === 1 ? "service" : "services"} added
          </span>
          <span className="tabular block text-caption text-ink-muted">
            {formatCurrency(subtotalPaise)} estimated
          </span>
        </span>

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
        <span
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 rounded-control px-6",
            "bg-action text-body font-bold text-on-action",
            "shadow-[0_8px_20px_-8px_rgba(2,186,188,.7)]",
            "transition-[background-color,box-shadow] duration-fast",
            "group-hover:bg-promo group-hover:shadow-[0_10px_24px_-8px_rgba(244,123,32,.75)]",
          )}
        >
          Checkout
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
