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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop top nav */}
      <ConsumerTopBar />

      {/* Mobile top bar */}
      <ConsumerMobileTopBar />

      {/* Main content — bottom padding on mobile leaves room for the tab bar */}
      <main className="pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar */}
      <ConsumerBottomNav />
    </div>
  );
}
