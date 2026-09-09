/**
 * Authenticated app route group layout.
 *
 * Desktop: sticky top nav bar + sub-nav links.
 * Mobile:  top bar with location + sticky bottom tab bar.
 * Content area is padded so it never hides behind either.
 */
import * as React from "react";
import {
  ConsumerTopBar,
  ConsumerMobileTopBar,
  ConsumerBottomNav,
} from "@/components/consumer-nav";
import { ConsumerFooter } from "@/components/consumer-footer";
import { ScenarioHook } from "@/components/scenario-hook";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Console helpers for reviewing empty / error / slow states.
          Development only; renders nothing. */}
      <ScenarioHook />

      {/* Desktop top nav */}
      <ConsumerTopBar />

      {/* Mobile top bar */}
      <ConsumerMobileTopBar />

      {/* Main content — bottom padding on mobile leaves room for the tab bar */}
      {/* `flex-1` so a short page still pushes the footer to the bottom of
          the viewport rather than leaving it floating mid-screen. */}
      <main className="flex-1 pb-tab-bar md:pb-0">{children}</main>

      <ConsumerFooter />

      {/* Mobile bottom tab bar */}
      <ConsumerBottomNav />
    </div>
  );
}
