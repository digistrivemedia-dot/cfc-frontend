"use client";

import * as React from "react";
import type { Address } from "@cfc/types";
import { getAddresses, getToken } from "@cfc/mocks";
import { MATCH_RADIUS_M, metresBetween } from "./map-provider";

/**
 * Which saved address this booking is for.
 *
 * The header shows it, the booking flow uses it, and every screen that mentions
 * "where" reads it from here — so there is one answer to that question rather
 * than one per screen.
 *
 * ## Why the id, not the address
 *
 * `localStorage` holds the **id**. Storing the whole address would mean a copy
 * that goes stale the moment the customer edits it, and a stale address on a
 * booking is a professional sent to the wrong door.
 *
 * ## Auto-detect, and its one honest limitation
 *
 * On first load we read the device location and match it against the saved
 * addresses by distance, so someone standing in their own flat sees "Home"
 * without choosing it. Matching is by proximity because that is the only
 * signal a browser gives — there is no "which building is this" API — and
 * `MATCH_RADIUS_M` is the tuning knob for it.
 *
 * It never *overrides* a deliberate choice. Someone who picked their office
 * address and then walks home is still booking for the office until they say
 * otherwise; silently switching the destination of a booking in progress would
 * be the worst possible helpfulness.
 */

const KEY = "cfc.selectedAddressId";

interface SelectedAddress {
  addresses: Address[];
  selected: Address | null;
  /** False until storage and the first fetch have settled. */
  ready: boolean;
  select: (id: string) => void;
  /** Re-reads the list — after adding, editing or deleting one. */
  refresh: () => Promise<void>;
  /** Asks the device where it is and matches a saved address, if any. */
  detect: () => Promise<Address | null>;
}

const Context = React.createContext<SelectedAddress | null>(null);

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(id: string | null): void {
  try {
    if (id === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, id);
  } catch {
    // Private browsing. The choice lasts this page's lifetime instead.
  }
}

export function SelectedAddressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  const load = React.useCallback(async (): Promise<Address[]> => {
    // Signed out: no addresses to have, and the endpoint would 401. The header
    // shows "Add your address", which is the right prompt for a visitor too.
    if (!getToken()) {
      setAddresses([]);
      return [];
    }
    try {
      const list = await getAddresses();
      setAddresses(list);
      return list;
    } catch {
      setAddresses([]);
      return [];
    }
  }, []);

  const select = React.useCallback((id: string) => {
    setSelectedId(id);
    write(id);
  }, []);

  const detect = React.useCallback(async (): Promise<Address | null> => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return null;
    }
    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        // Denied, unavailable, or timed out. All three mean the same thing
        // here: fall back to the stored choice.
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
      );
    });
    if (!position) return null;

    const here = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    const list = addresses.length > 0 ? addresses : await load();

    // Nearest first, then the radius. Sorting before filtering means the
    // closest of two overlapping matches wins rather than whichever was saved
    // first.
    const nearest = list
      .map((a) => ({ a, m: metresBetween(here, a.point) }))
      .sort((x, y) => x.m - y.m)[0];

    if (nearest && nearest.m <= MATCH_RADIUS_M) {
      select(nearest.a.id);
      return nearest.a;
    }
    return null;
  }, [addresses, load, select]);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = read();
      const list = await load();
      if (cancelled) return;

      // A stored id that no longer exists — the address was deleted on another
      // device. Falls through to the default rather than selecting nothing.
      const kept = list.find((a) => a.id === stored);
      const fallback = list.find((a) => a.isDefault) ?? list[0];
      setSelectedId(kept?.id ?? fallback?.id ?? null);
      setReady(true);

      // Asked on first open, before anything is browsed — the behaviour of the
      // delivery apps this follows. Only when nothing was stored: a returning
      // customer's own choice is never second-guessed by a GPS reading.
      //
      // Runs even with no saved addresses. There is nothing to match then, but
      // the permission is granted while the customer is looking at a prompt
      // about their location rather than mid-way through a booking, and the
      // add-address map opens on where they actually are.
      if (!kept) void detect();
    })();

    return () => {
      cancelled = true;
    };
    // `detect` depends on `addresses`, which this sets — including it would
    // re-run the whole first-load sequence on every list change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const value = React.useMemo<SelectedAddress>(
    () => ({
      addresses,
      selected: addresses.find((a) => a.id === selectedId) ?? null,
      ready,
      select,
      refresh: async () => {
        const list = await load();
        // Keep the selection valid: if it vanished, fall back to the default.
        setSelectedId((current) =>
          list.some((a) => a.id === current)
            ? current
            : (list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null),
        );
      },
      detect,
    }),
    [addresses, selectedId, ready, select, load, detect],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSelectedAddress(): SelectedAddress {
  const ctx = React.useContext(Context);
  if (!ctx) {
    throw new Error(
      "useSelectedAddress needs <SelectedAddressProvider> above it.",
    );
  }
  return ctx;
}

/** "Home", "Office", or the customer's own name for an `other` address. */
export function addressLabel(a: Address): string {
  if (a.label === "home") return "Home";
  // Stored as `work`, shown as "Office" — see the note on the model.
  if (a.label === "work") return "Office";
  return a.labelName?.trim() || "Other";
}

/** The one-line form shown under the label in the header and the picker. */
export function addressSummary(a: Address): string {
  return [a.flatNumber, a.line1, a.area].filter(Boolean).join(", ");
}
