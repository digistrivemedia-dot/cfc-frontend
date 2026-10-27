import { Toaster, TooltipProvider } from "@cfc/ui";
import { AppShell } from "@/components/app-shell";
import { NavCountsProvider } from "@/lib/nav-counts";
import { RequireAdmin } from "@/lib/actor";

/**
 * Every screen except login and forgot-password sits behind the sidebar
 * shell. Split out as its own route group so an unauthenticated visitor at
 * /login never sees the full admin navigation.
 *
 * TooltipProvider is mounted here rather than per screen — Radix tooltips
 * silently do nothing without one, which is the kind of failure nobody notices
 * until a reviewer asks why a truncated cell has no title.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `RequireAdmin` is outermost so nothing below it renders without an actor.
    // `AppShell` calls `useActor()`, which now throws rather than defaulting to
    // a Super Admin preset — so mounting the shell before the session resolves
    // would be a crash, not a flash of the wrong sidebar.
    //
    // This is a convenience, not a security control. The data behind every
    // screen comes from endpoints that verify the token themselves.
    <RequireAdmin>
      <NavCountsProvider>
        <TooltipProvider delayDuration={300}>
          <AppShell>
            {children}
            <Toaster />
          </AppShell>
        </TooltipProvider>
      </NavCountsProvider>
    </RequireAdmin>
  );
}
