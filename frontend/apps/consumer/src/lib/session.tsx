"use client";

import * as React from "react";

/**
 * Whether the visitor is signed in.
 *
 * The consumer app had no concept of this at all. Every screen assumed an
 * account, so the homepage showed a stranger who had just arrived from a search
 * result somebody else's live pest-control booking, a "Book again" row, and an
 * avatar with initials in it. That is the single worst thing a marketplace can
 * do to a first-time visitor: it is not merely wrong, it is unreadable, because
 * none of it refers to them.
 *
 * Real authentication belongs to the backend team. What the frontend owes is
 * the distinction — signed out versus signed in — and the discipline of never
 * rendering personal content without it.
 *
 * Persisted in `localStorage` rather than `sessionStorage`: a customer who
 * signs in and comes back tomorrow expects to still be signed in, which is how
 * every marketplace behaves. Cleared on sign-out.
 *
 * Switch state while reviewing without going through the OTP flow:
 *   __cfcSession.signIn()
 *   __cfcSession.signOut()
 */

const STORAGE_KEY = "cfc.consumer.signedIn";

interface SessionValue {
  /** Null while the stored value is being read — see `SessionGate`. */
  signedIn: boolean | null;
  signIn: () => void;
  signOut: () => void;
}

const SessionContext = React.createContext<SessionValue>({
  signedIn: false,
  signIn: () => {},
  signOut: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Null, not false. The server has no localStorage, so rendering the
  // signed-out page and then swapping to the signed-in one would flash the
  // wrong content on every load for a signed-in customer. Consumers wait.
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      setSignedIn(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // Private browsing, or storage blocked. Treat as a guest.
      setSignedIn(false);
    }
  }, []);

  const signIn = React.useCallback(() => {
    setSignedIn(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Non-fatal: the session simply does not survive a reload.
    }
  }, []);

  const signOut = React.useCallback(() => {
    setSignedIn(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing stored to clear.
    }
  }, []);

  // Console helpers, so a reviewer can flip between the two views without
  // typing a phone number and an OTP each time.
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as Record<string, unknown>).__cfcSession = {
      signIn: () => {
        signIn();
        window.location.reload();
      },
      signOut: () => {
        signOut();
        window.location.reload();
      },
      state: () => signedIn,
    };
  }, [signIn, signOut, signedIn]);

  const value = React.useMemo(
    () => ({ signedIn, signIn, signOut }),
    [signedIn, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/**
 * `true` signed in, `false` signed out, `null` not yet known.
 *
 * Screens must handle the null case rather than treating it as false, or a
 * signed-in customer sees the guest view flash on every page load.
 */
export function useSession(): SessionValue {
  return React.useContext(SessionContext);
}
