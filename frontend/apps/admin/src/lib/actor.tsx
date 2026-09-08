"use client";

import * as React from "react";
import type { Actor } from "@cfc/types";

/**
 * The signed-in admin.
 *
 * Authentication is another team's work and out of scope here, so the actor is
 * supplied rather than derived from a session. Screens read it through
 * `useActor()` and ask the permission helpers what it may do — they never check
 * `role === "..."` inline.
 *
 * The login screen calls `useSignIn()` with the role picked there, so signing
 * in as an Area Admin actually produces an Area Admin: the picker was
 * previously cosmetic and every session landed as Super Admin regardless.
 *
 * The choice is kept in sessionStorage because the sign-in redirect is a real
 * navigation — React state does not survive it. Session rather than local
 * storage so closing the tab ends the session, which is the closest honest
 * approximation of one without a backend.
 *
 * Switch roles while reviewing without signing in again:
 *   __cfcActor("area_admin")
 *   __cfcActor("super_admin")
 */

const STORAGE_KEY = "cfc.admin.actor";

const DEFAULT_ACTOR: Actor = {
  id: "adm_0001",
  name: "Chandrasekar R.",
  role: "super_admin",
};

// The two presets mirror the seeded rows in Admin 49, so switching role here
// shows exactly what that record grants.
const AREA_ADMIN: Actor = {
  id: "adm_0002",
  name: "Meenakshi S.",
  role: "area_admin",
  area: "Srirangam",
  sections: ["bookings", "quotations", "pros"],
};

const SUB_ADMIN: Actor = {
  id: "adm_0003",
  name: "Vignesh T.",
  role: "sub_admin",
  sections: ["bookings", "quotations", "pros", "support"],
};

const PRESETS: Record<string, Actor> = {
  super_admin: DEFAULT_ACTOR,
  area_admin: AREA_ADMIN,
  sub_admin: SUB_ADMIN,
  // A role with no admin permissions at all, to exercise the denied state.
  pro: { id: "pro_0001", name: "Murugan V.", role: "pro" },
};

/** The login screen's role values, which are shorter than the actor keys. */
const LOGIN_ROLE_TO_ACTOR: Record<string, keyof typeof PRESETS> = {
  super: "super_admin",
  sub: "sub_admin",
  area: "area_admin",
};

interface ActorContextValue {
  actor: Actor;
  signIn: (loginRole: string, area?: string | undefined) => void;
  signOut: () => void;
}

const ActorContext = React.createContext<ActorContextValue>({
  actor: DEFAULT_ACTOR,
  signIn: () => {},
  signOut: () => {},
});

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = React.useState<Actor>(DEFAULT_ACTOR);

  // Restore after mount, never during render: the server has no
  // sessionStorage, and reading it while rendering would mismatch hydration.
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setActor(JSON.parse(saved) as Actor);
    } catch {
      // A private window or blocked storage just means the default actor.
    }
  }, []);

  const signIn = React.useCallback(
    (loginRole: string, area?: string | undefined) => {
      const key = LOGIN_ROLE_TO_ACTOR[loginRole] ?? "super_admin";
      const preset = PRESETS[key] ?? DEFAULT_ACTOR;
      // An Area Admin is scoped to the area chosen on the form, not to
      // whichever one the preset happens to carry.
      const next: Actor =
        preset.role === "area_admin" && area
          ? { ...preset, area }
          : preset;

      setActor(next);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Non-fatal: the session simply does not survive a reload.
      }
    },
    [],
  );

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as Record<string, unknown>).__cfcActor = (
      key: keyof typeof PRESETS,
    ) => {
      const next = PRESETS[key];
      if (!next) {
        console.warn(`Unknown actor: ${String(key)}`);
        return;
      }
      setActor(next);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignored — the switch still applies for this render.
      }
    };
  }, []);

  const signOut = React.useCallback(() => {
    setActor(DEFAULT_ACTOR);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Non-fatal: nothing was stored to clear.
    }
  }, []);

  const value = React.useMemo(
    () => ({ actor, signIn, signOut }),
    [actor, signIn, signOut],
  );

  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

export function useActor(): Actor {
  return React.useContext(ActorContext).actor;
}

/** Sets the signed-in admin from the role chosen on the login form. */
export function useSignIn(): (role: string, area?: string | undefined) => void {
  return React.useContext(ActorContext).signIn;
}

/**
 * Ends the session.
 *
 * Without clearing the stored actor, signing out and back in as a different
 * role would silently restore the previous one.
 */
export function useSignOut(): () => void {
  return React.useContext(ActorContext).signOut;
}
