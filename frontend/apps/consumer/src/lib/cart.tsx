"use client";

import * as React from "react";

/**
 * The cart.
 *
 * A home-services marketplace is a shop: a customer adds a deep clean and a
 * plumbing visit, then books both in one go with one address and one slot. The
 * app had no way to hold that intent — every service card was a link, so the
 * only path to a booking was one service at a time.
 *
 * Deliberately holds the *service*, not a booked job. Variant, date, slot and
 * address are chosen at checkout, because a customer adding a second service
 * has not yet decided any of those and asking twice is how a basket gets
 * abandoned.
 *
 * Kept in `localStorage`. Someone who fills a basket, gets distracted and comes
 * back an hour later expects it to still be there; losing it is the fastest way
 * to lose the booking. Cleared explicitly after checkout.
 */

const STORAGE_KEY = "cfc.consumer.cart";

export interface CartLine {
  serviceId: string;
  serviceName: string;
  /** The service's base price. The real total is priced at checkout. */
  fromPricePaise: number;
  imageUrl?: string | undefined;
  quantity: number;
}

interface CartValue {
  /** Null until the stored cart has been read — see the note in `session.tsx`. */
  lines: CartLine[] | null;
  count: number;
  subtotalPaise: number;
  add: (line: Omit<CartLine, "quantity">) => void;
  remove: (serviceId: string) => void;
  setQuantity: (serviceId: string, quantity: number) => void;
  has: (serviceId: string) => boolean;
  clear: () => void;
}

const CartContext = React.createContext<CartValue>({
  lines: null,
  count: 0,
  subtotalPaise: 0,
  add: () => {},
  remove: () => {},
  setQuantity: () => {},
  has: () => false,
  clear: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[] | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setLines(raw ? (JSON.parse(raw) as CartLine[]) : []);
    } catch {
      // Corrupt JSON or blocked storage. An empty cart is the safe answer;
      // throwing here would take the whole header down with it.
      setLines([]);
    }
  }, []);

  // Persist on every change rather than on unload: a customer who closes the
  // tab mid-browse still keeps what they added.
  React.useEffect(() => {
    if (lines === null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Non-fatal — the cart simply does not survive a reload.
    }
  }, [lines]);

  const add = React.useCallback((line: Omit<CartLine, "quantity">) => {
    setLines((current) => {
      const rows = current ?? [];
      const existing = rows.find((l) => l.serviceId === line.serviceId);
      // Adding something already in the basket raises its quantity rather than
      // creating a second identical row.
      if (existing) {
        return rows.map((l) =>
          l.serviceId === line.serviceId
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        );
      }
      return [...rows, { ...line, quantity: 1 }];
    });
  }, []);

  const remove = React.useCallback((serviceId: string) => {
    setLines((current) => (current ?? []).filter((l) => l.serviceId !== serviceId));
  }, []);

  const setQuantity = React.useCallback((serviceId: string, quantity: number) => {
    setLines((current) => {
      const rows = current ?? [];
      // Dropping to zero removes the line. A row showing "0" is a row that
      // should not be there.
      if (quantity <= 0) return rows.filter((l) => l.serviceId !== serviceId);
      return rows.map((l) =>
        l.serviceId === serviceId ? { ...l, quantity } : l,
      );
    });
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const has = React.useCallback(
    (serviceId: string) => (lines ?? []).some((l) => l.serviceId === serviceId),
    [lines],
  );

  const count = (lines ?? []).reduce((n, l) => n + l.quantity, 0);
  const subtotalPaise = (lines ?? []).reduce(
    (sum, l) => sum + l.fromPricePaise * l.quantity,
    0,
  );

  const value = React.useMemo(
    () => ({ lines, count, subtotalPaise, add, remove, setQuantity, has, clear }),
    [lines, count, subtotalPaise, add, remove, setQuantity, has, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  return React.useContext(CartContext);
}
