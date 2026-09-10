"use client";

import { usePathname } from "next/navigation";
import { cn } from "@cfc/ui";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

/**
 * The content area.
 *
 * Exists to reserve room for whatever is fixed to the bottom of the viewport,
 * because anything fixed there covers the end of the page otherwise — the last
 * row of a list, or the final line of a footer.
 *
 * Two things can be down there, and neither is always present:
 *
 *   the mobile tab bar    signed-in customers only, and only below `md`
 *   the checkout bar      only once the basket has something in it, and not
 *                         on the basket or inside the booking flow
 *
 * The layout is a server component and cannot read either, hence this wrapper
 * rather than a prop.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const { signedIn } = useSession();
  const { count } = useCart();
  const pathname = usePathname();

  // Kept in step with `CartBar`'s own suppression list — a service page has
  // its own fixed bar, so the cart bar stands down there and no allowance is
  // needed for it.
  const cartBarHidden =
    count === 0 ||
    pathname === "/cart" ||
    pathname.startsWith("/book/") ||
    pathname.startsWith("/service/");

  // The two allowances have to STACK, and that is the whole difficulty.
  //
  // This was a `pb-tab-bar md:pb-0` class plus an inline
  // `paddingBottom: calc(72px + 1rem)`. An inline style always beats a class,
  // so the moment anything went into the basket the tab bar's 80px was
  // silently discarded and the page reserved 88px in total — for two bars that
  // need 168 between them. The end of every page then sat underneath them on a
  // phone, which is exactly what a checkout bar must never do: it covered the
  // content it was meant to sell.
  //
  // Expressed as one padding utility per case instead, so the breakpoint is
  // real and nothing overrides anything. Four states, because each bar appears
  // independently:
  //
  //   tab bar only      below `md`, signed in, empty basket        80px
  //   cart bar only     any width, signed out or `md`+, has items  88px
  //   both              below `md`, signed in, has items          168px
  //   neither           signed out, empty basket                    0
  //
  // `pb-tab-bar` (80) and `pb-action-bar` (88) are the existing tokens for the
  // two bars; `pb-bars` (168) is their sum, named in the preset because the
  // closed spacing scale has nothing between 48px and a full width and an
  // arbitrary value would not lint.
  const padding = cartBarHidden
    ? signedIn
      ? "pb-tab-bar md:pb-0"
      : "pb-0"
    : signedIn
      ? "pb-bars md:pb-action-bar"
      : "pb-action-bar";

  return <main className={cn("flex-1", padding)}>{children}</main>;
}
