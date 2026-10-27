import type { Actor, AdminSection } from "@cfc/types";
import { clearToken, fetchJson, setToken } from "../http";

/**
 * Admin 1 — sign in. Admin 2 — password reset.
 *
 * **These have no fixture path, deliberately.** Every other function in this
 * package falls back to fixture data when its live flag is off, so a screen can
 * be reviewed without a server. Authentication must not: a fallback here is a
 * login that succeeds with no server, and that is precisely the class of thing
 * the plan's P0 list (§6, B1/B2) exists to keep out of a build. The admin app
 * requires the API to be running, which is what it will require in production.
 *
 * The signature the old screen implied is gone. `useSignIn()` took the role
 * chosen on the form, which meant **the client picked its own role** — a
 * sub-admin would simply choose "Super Admin". The role now comes from the
 * account, decided server-side and carried in a signed token.
 */

export interface AdminSession {
  token: string;
  actor: Actor;
  /**
   * Whether the 2FA step is required.
   *
   * Always false until TOTP is built (BACKEND-PLAN.md §0.2). The login screen's
   * code step is kept wired to this flag rather than deleted, so enrolment
   * later switches the step back on with no rebuild — and meanwhile the screen
   * does not show a code field that accepts anything, which is the lie §2.2
   * describes.
   */
  twoFactorRequired: boolean;
  /** Which sidebar sections to draw. Server-computed; never client-guessed. */
  sections: AdminSection[];
}

/**
 * Signs in and stores the token.
 *
 * `sessionStorage` — the admin panel's session ends when the tab closes, which
 * is the behaviour the old `actor.tsx` chose deliberately and is right for an
 * operations console on a shared machine.
 *
 * "Keep me signed in" on the form is honoured by storing in `localStorage`
 * instead. The token's own expiry is unaffected either way; the checkbox
 * decides whether closing the tab ends the session, not how long it lasts.
 * **No screen states a session length** — `PLATFORM-FACTS.md` lists that under
 * "do not claim".
 */
export async function adminLogin(
  email: string,
  password: string,
  options: { remember?: boolean } = {},
): Promise<AdminSession> {
  const session = await fetchJson<AdminSession>("/admin/auth/login", {
    body: { email, password },
  });
  setToken(session.token, options.remember ? "local" : "session");
  return session;
}

/**
 * The signed-in admin, from the stored token.
 *
 * This is what restores a session after a reload — the login response is gone
 * by then and only the token remains. A 401 from here is the signal to send
 * someone back to the login screen, so callers should let it propagate rather
 * than defaulting to a guest actor.
 */
export async function adminMe(): Promise<{
  actor: Actor;
  sections: AdminSection[];
}> {
  return fetchJson<{ actor: Actor; sections: AdminSection[] }>(
    "/admin/auth/me",
  );
}

/**
 * Signs out.
 *
 * Clears the token locally **whatever the server says**. A network failure must
 * not leave someone stuck signed in on a shared machine — the token is
 * stateless, so discarding it client-side is the part that actually ends the
 * session. The request exists so the audit log records when the session ended.
 */
export async function adminLogout(): Promise<void> {
  try {
    await fetchJson<void>("/admin/auth/logout", { method: "POST" });
  } catch {
    // Already expired, or the server is unreachable. Either way, sign out.
  } finally {
    clearToken();
  }
}
