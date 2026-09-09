import * as React from "react";
import { Toaster } from "@cfc/ui";
import {
  ProBottomNav,
  ProMobileTopBar,
  ProRail,
} from "@/components/pro-shell";
import { OfferListener } from "@/components/offer-listener";

/**
 * The signed-in Pro app.
 *
 * Mobile: a top bar carrying the online state, and a bottom tab strip.
 * Desktop: a fixed 240px left rail; the content is offset by `md:pl-rail` to
 * clear it. The rail is `fixed` rather than a grid column so a long job list
 * scrolls without the rail moving — a pro scrolling forty jobs should not lose
 * the online toggle off the top of the screen.
 *
 * `pb-tab-bar` clears the fixed mobile strip. Screens that dock an action panel
 * add their own clearance on top of it via `ProActionLayout`.
 */
export default function ProAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <ProRail />
      <ProMobileTopBar />

      <div className="md:pl-rail">
        <main className="pb-tab-bar md:pb-0">{children}</main>
      </div>

      <ProBottomNav />

      {/* Job offers, mounted once so they can interrupt any screen. Silent
          while the pro is offline — see OfferListener. */}
      <OfferListener />

      <Toaster />
    </div>
  );
}
