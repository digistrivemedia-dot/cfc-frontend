"use client";

import * as React from "react";
import { getToken, signOutConsumer } from "@cfc/mocks";

/**
 * Whether the visitor is signed in.
 *
 * Phase 5 replaced what this was. Previously it was a boolean in
 * `localStorage["cfc.consumer.signedIn"]` — `final/CONSUMER.md` §7.1 recorded
 * it plainly: *"Signed in is only a flag."* There was no token, no user id, and
 * no expiry, and `getConsumerProfile()` returned the same fixture customer
 * regardless of who had signed in.
 *
 * Now the signed-in state **is** the presence of a real token, so there is one
 * source rather than a flag that can disagree with one. `verifyOtp` stores it;
 * this reads it.
 *
 * What has not changed is the thing that matters most to the screens: the
 * three-state distinction. Null means "not yet known", and a screen that
 * treats it as false flashes the guest view on every load for a customer who is
 * perfectly well signed in.
 *
 * `localStorage`, not session: a customer who signs in and comes back tomorrow
 * expects to still be signed in. The admin panel chooses the opposite,
 * deliberately.
 */

interface SessionValue {
  /** Null while the stored token is being read — see the note above. */
  signedIn: boolean | null;
  /**
   * Marks the session live after a successful OTP.
   *
   * Takes no argument: `verifyOtp` has already stored the token, so this only
   * tells React to re-read. Passing the token in would give two places that
   * decide where it is kept.
   */
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
    setSignedIn(getToken() !== null);
  }, []);

  const signIn = React.useCallback(() => {
    setSignedIn(true);
  }, []);

  const signOut = React.useCallback(() => {
    signOutConsumer();
    setSignedIn(false);
  }, []);

  /**
   * Keeps two tabs in step.
   *
   * Without this, signing out in one tab leaves another showing a signed-in
   * shell whose every request 401s — which reads as the app being broken
   * rather than as a sign-out.
   */
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cfc.token" || e.key === null) {
        setSignedIn(getToken() !== null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
