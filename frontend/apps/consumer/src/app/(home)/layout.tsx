/**
 * Route group for the two approved home pages.
 *
 * These pages ship their own header, footer and mobile action bar, ported
 * whole from the design handoff. The `(app)` group's layout adds
 * `MarketingNav`, `ConsumerFooter` and `CartBar` on top of every screen in it,
 * so putting these pages there would render two headers and two footers.
 *
 * A route group with a passthrough layout is how the codebase already solves
 * this - `(auth)` does exactly the same thing for the login and onboarding
 * screens, and for the same reason.
 *
 * The stylesheet is imported HERE rather than in the root layout so it loads
 * only on these two routes. It is layered (see the file header), so even if a
 * future route imports it by accident the other screens stay intact.
 */
import * as React from "react";
import { CartBar } from "@/components/cart-bar";
import "./home-pages.css";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* The checkout bar was rendered only by the `(app)` layout, so adding a
          service from the HOME page - the screen most people add from - gave
          no way to reach the basket. The bar hides itself when the cart is
          empty and on /cart and /book/, so rendering it here is safe. */}
      <CartBar />
    </>
  );
}
