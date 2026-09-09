"use client";

import { cn } from "@cfc/ui";
import { useSession } from "@/lib/session";

/**
 * The content area.
 *
 * Exists only to know whether the mobile tab bar is there. That strip is fixed
 * to the bottom of the viewport and covers whatever is under it, so the page
 * reserves its height — but a signed-out visitor has no tab bar, and reserving
 * space for it leaves a band of dead canvas above the footer.
 *
 * The layout itself is a server component and cannot read the session, hence
 * this wrapper rather than a prop.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const { signedIn } = useSession();

  return (
    <main className={cn("flex-1", signedIn ? "pb-tab-bar md:pb-0" : "pb-0")}>
      {children}
    </main>
  );
}
