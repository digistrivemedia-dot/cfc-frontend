"use client";

import * as React from "react";
import { getPros, getQuotations, getTickets } from "@cfc/mocks";
import type { NavBadge } from "@/config/nav";

/**
 * The counts shown on the sidebar.
 *
 * Work waiting on an operator should be visible from anywhere in the panel, not
 * only from the screen that holds it. Seven quotes past their SLA are the most
 * urgent thing on the platform and were previously invisible unless you
 * happened to be looking at the quotations screen.
 *
 * Fetched once and shared through context so eleven nav items do not each open
 * their own request. Failures are swallowed deliberately — a count that cannot
 * load renders as no badge, which is the correct fallback: an absent number is
 * honest, a zero would be a lie.
 *
 * The mock layer is read-only by design, so this reads the same functions every
 * screen reads. When the real backend arrives it replaces the three calls below
 * and nothing else changes.
 */

type Counts = Partial<Record<NavBadge, number>>;

const NavCountsContext = React.createContext<Counts>({});

export function NavCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = React.useState<Counts>({});

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [quotes, pros, tickets] = await Promise.allSettled([
        getQuotations({ status: "pending", pageSize: 1 }),
        getPros({ approvalStatus: "pending", pageSize: 1 }),
        getTickets("open"),
      ]);

      if (cancelled) return;

      const next: Counts = {};
      if (quotes.status === "fulfilled") next.pendingQuotes = quotes.value.total;
      if (pros.status === "fulfilled") next.pendingPros = pros.value.total;
      if (tickets.status === "fulfilled") next.openTickets = tickets.value.length;
      setCounts(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NavCountsContext.Provider value={counts}>
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts(): Counts {
  return React.useContext(NavCountsContext);
}
