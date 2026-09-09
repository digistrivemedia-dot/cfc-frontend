"use client";

import * as React from "react";
import { getScenario, setScenario, type Scenario } from "@cfc/mocks";

/**
 * The mock-scenario console hook, for review only.
 *
 * The mock layer can force every API call into a state, but there was no way
 * to trigger it from the consumer app — so states that only appear for a
 * particular kind of customer were unreachable while reviewing. The home
 * screen's first-time-customer view is the clearest example: the booking
 * fixture always contains bookings, so the "never booked anything" path could
 * not be seen at all without editing fixtures.
 *
 * From the browser console:
 *
 *   __cfc.empty()    a customer with no bookings and no history
 *   __cfc.normal()   the seeded customer, with a live job and past bookings
 *   __cfc.error()    every request fails
 *   __cfc.slow()     slow responses, for checking loading states
 *   __cfc.which()    what is currently set
 *
 * Each one reloads the page, because the screens fetch on mount and a change
 * that only applied to the next refetch would look like it had not worked.
 *
 * Development only — the effect returns early in production, so nothing is
 * attached to `window` in a real build.
 */
export function ScenarioHook() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const apply = (s: Scenario) => {
      setScenario(s);
      window.location.reload();
    };

    (window as unknown as Record<string, unknown>).__cfc = {
      empty: () => apply("empty"),
      normal: () => apply("normal"),
      error: () => apply("error"),
      slow: () => apply("slow"),
      which: () => getScenario(),
    };
  }, []);

  return null;
}
