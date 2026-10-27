"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Actor, AdminSection } from "@cfc/types";
import { adminLogout, adminMe, getToken } from "@cfc/mocks";

/**
 * The signed-in admin.
 *
 * Phase 2 replaced what this used to be. Previously the login screen handed it
 * a role string and it looked up one of three hardcoded presets — so **the
 * client chose its own role**, which is the entire RBAC hole in one function.
 * There was no token, no user id, and no server that could disagree.
 *
 * Now the actor comes from the server, derived from a signed token, and this
 * file is a cache of that answer rather than the answer itself. The security
 * boundary is the API: these values decide what to *draw*, and the server
 * decides what is *allowed*. A tampered actor here changes the sidebar and
 * nothing else — every endpoint re-checks.
 *
 * `sections` is server-computed too (`openableSections`), so the sidebar cannot
 * offer a section the server would refuse.
 */

interface ActorState {
  /** Null while the session is being restored, and after sign-out. */
  actor: Actor | null;
  sections: AdminSection[];
  /**
   * True until the first `/me` resolves.
   *
   * Screens must distinguish this from "signed out", or every reload flashes
   * the login screen at an admin who is perfectly well signed in. The route
   * guard below waits on it rather than redirecting.
   */
  loading: boolean;
}

interface ActorContextValue extends ActorState {
  /** Re-reads the session from the server. Called after signing in. */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ActorContext = React.createContext<ActorContextValue>({
  actor: null,
  sections: [],
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ActorState>({
    actor: null,
    sections: [],
    loading: true,
  });

  const refresh = React.useCallback(async () => {
    // No token means signed out — and asking the server would be a guaranteed
    // 401 and a pointless round trip on every visit to the login page.
    if (!getToken()) {
      setState({ actor: null, sections: [], loading: false });
      return;
    }

    try {
      const { actor, sections } = await adminMe();
      setState({ actor, sections, loading: false });
    } catch {
      // An expired or rejected token is signed out. Not an error state: there
      // is nothing for the admin to retry, they simply need to sign in again.
      setState({ actor: null, sections: [], loading: false });
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = React.useCallback(async () => {
    await adminLogout();
    setState({ actor: null, sections: [], loading: false });
  }, []);

  const value = React.useMemo(
    () => ({ ...state, refresh, signOut }),
    [state, refresh, signOut],
  );

  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

/** The full session, including the loading distinction. */
export function useSession(): ActorContextValue {
  return React.useContext(ActorContext);
}

/**
 * The signed-in admin.
 *
 * Throws if called outside the authenticated route group. That is deliberate:
 * the previous version returned a Super Admin preset as its default, so a
 * screen rendered outside a session silently got full permissions. A loud
 * failure in development beats that quiet one in production.
 *
 * Every caller of this sits under `RequireAdmin`, which does not render its
 * children until there is an actor.
 */
export function useActor(): Actor {
  const { actor } = React.useContext(ActorContext);
  if (!actor) {
    throw new Error(
      "useActor() outside an authenticated screen. Wrap it in RequireAdmin, " +
        "or use useSession() if the signed-out case is expected.",
    );
  }
  return actor;
}

/** Sections the server says this admin may open. Drives the sidebar. */
export function useSections(): AdminSection[] {
  return React.useContext(ActorContext).sections;
}

export function useSignOut(): () => Promise<void> {
  return React.useContext(ActorContext).signOut;
}

/**
 * The route guard for the authenticated group.
 *
 * Renders nothing until the session is known, then either the screen or a
 * redirect to login. **This is a convenience, not a security control** — the
 * data behind every screen comes from endpoints that check the token
 * themselves, so a determined visitor who bypassed this would see an empty
 * shell and a row of 401s.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { actor, loading } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !actor) router.replace("/login");
  }, [loading, actor, router]);

  // Deliberately blank rather than a spinner: the session resolves in one
  // request and a flash of loading UI is more jarring than a brief blank.
  if (loading || !actor) return null;

  return <>{children}</>;
}
