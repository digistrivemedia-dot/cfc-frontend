"use client";

import * as React from "react";

/**
 * Where the visitor wants work done.
 *
 * This existed only as a field on the signed-in customer's profile, so the
 * header showed it after login and showed nothing before. That is backwards
 * for a services marketplace: the first question a stranger arriving from a
 * search result has is "do you even operate where I live?", and they will not
 * create an account to find out. A plumber who might not come is not worth
 * signing up for.
 *
 * So the area is a property of the *visit*, not of the account. A guest picks
 * one and it sticks; signing in later can adopt it or replace it with the
 * address on file.
 *
 * `null` means "not chosen yet", which the header shows as an invitation
 * rather than as a guess. Guessing a city from an IP address and being wrong
 * is worse than asking.
 */

const STORAGE_KEY = "cfc.consumer.area";

interface AreaValue {
  /** Null while unknown or unread — see the note in `session.tsx`. */
  area: string | null;
  setArea: (next: string) => void;
  /** True once the stored value has been read, so the UI can wait. */
  ready: boolean;
}

const AreaContext = React.createContext<AreaValue>({
  area: null,
  setArea: () => {},
  ready: false,
});

export function AreaProvider({ children }: { children: React.ReactNode }) {
  const [area, setAreaState] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      setAreaState(localStorage.getItem(STORAGE_KEY));
    } catch {
      // Private browsing or blocked storage: treat as not chosen.
    }
    setReady(true);
  }, []);

  const setArea = React.useCallback((next: string) => {
    setAreaState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the choice simply does not survive a reload.
    }
  }, []);

  const value = React.useMemo(
    () => ({ area, setArea, ready }),
    [area, setArea, ready],
  );

  return <AreaContext.Provider value={value}>{children}</AreaContext.Provider>;
}

export function useArea(): AreaValue {
  return React.useContext(AreaContext);
}
