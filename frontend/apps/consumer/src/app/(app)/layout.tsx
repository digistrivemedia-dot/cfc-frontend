/**
 * Authenticated app route group layout.
 *
 * Every screen behind a sign-in renders the SAME chrome as the signed-in home:
 * the approved app bar, the icon sprite it depends on, and the approved
 * footer. `AppShell` carries all three.
 *
 * This used to assemble its own: `ConsumerTopBar`, `ConsumerMobileTopBar`,
 * `ConsumerBottomNav` and `ConsumerFooter`, all built in Tailwind and all
 * visibly different from the home screen's. Those components have been
 * deleted rather than left beside the shared ones, so there is no second
 * implementation to drift.
 */
import * as React from "react";
import { AppShell } from "@/app/(home)/app-shell";
import { ScenarioHook } from "@/components/scenario-hook";
import { CartBar } from "@/components/cart-bar";
import { AssistantWidget } from "@/components/assistant-widget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // The flex column is what keeps the footer at the bottom on a short page
    // instead of floating it up under the content. The old layout had this and
    // I dropped it when swapping in AppShell.
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Console helpers for reviewing empty / error / slow states.
          Development only; renders nothing. */}
      <ScenarioHook />

      <AppShell>{children}</AppShell>

      {/* Appears the moment the basket has something in it, on every screen
          except the basket and the booking flow. */}
      <CartBar />

      {/* Customer 42. A floating control rather than a tab on /support: the
          agreement asks the assistant for "service discovery and booking
          help", and neither of those questions is asked on the support
          screen. It suppresses itself there and through checkout. */}
      <AssistantWidget />
    </div>
  );
}
