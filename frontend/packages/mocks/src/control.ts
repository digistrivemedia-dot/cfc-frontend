import { ApiError } from "@cfc/types";

/**
 * Controls for the mock layer.
 *
 * Every api function awaits `latency()` and calls `applyScenario()` before
 * resolving. That is what makes loading, empty, and error states demonstrable
 * without editing a screen.
 */

export type Scenario = "normal" | "empty" | "error" | "slow" | "hang";

const STORAGE_KEY = "cfc.scenario";

const SCENARIOS: readonly Scenario[] = [
  "normal",
  "empty",
  "error",
  "slow",
  "hang",
];

function readStored(): Scenario {
  if (typeof window === "undefined") return "normal";
  try {
    const v = window.sessionStorage.getItem(STORAGE_KEY);
    return v && SCENARIOS.includes(v as Scenario) ? (v as Scenario) : "normal";
  } catch {
    // Private browsing, or storage disabled. Not worth failing over.
    return "normal";
  }
}

let scenario: Scenario = readStored();

/**
 * Force every subsequent api call into a state.
 *
 * Set it from the browser console while reviewing a screen:
 *   __cfc.setScenario("empty")
 *   __cfc.setScenario("error")
 *   __cfc.setScenario("normal")
 */
export function setScenario(next: Scenario): void {
  scenario = next;
  // Persisted for the tab so the choice survives a reload — reviewing an empty
  // or error state means looking at it on a fresh page, not only after a
  // client-side refetch.
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; the in-memory value still applies for this page.
    }
  }
}

export function getScenario(): Scenario {
  return scenario;
}

/**
 * Realistic delay. Never zero — a skeleton that never appears is a skeleton that
 * was never tested. The band is wide enough that a fast render and a slow one
 * both get exercised during ordinary development.
 */
export function latency(): Promise<void> {
  if (scenario === "hang") {
    return new Promise(() => {
      /* never resolves — for inspecting a loading state at leisure */
    });
  }
  const base = scenario === "slow" ? 1800 : 240;
  const spread = scenario === "slow" ? 1200 : 460;
  const ms = base + Math.random() * spread;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Applies the current scenario to a result.
 *
 * `empty` returns the supplied empty value rather than the data, so a list
 * screen renders its empty state and a detail screen still throws a 404 — which
 * is what the real API would do.
 */
export function applyScenario<T>(data: T, emptyValue?: T): T {
  if (scenario === "error") {
    throw new ApiError(500, "Something went wrong at our end.", "MOCK_ERROR");
  }
  if (scenario === "empty") {
    if (emptyValue === undefined) {
      throw new ApiError(404, "Not found.", "MOCK_EMPTY");
    }
    return emptyValue;
  }
  return data;
}

// Exposed on the window in development so a reviewer can switch states without
// a rebuild. Guarded so it never reaches a production bundle.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).__cfc = {
    setScenario,
    getScenario,
  };
}
