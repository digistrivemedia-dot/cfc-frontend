"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getConsumerProfile } from "@cfc/mocks";
import type { ConsumerProfile } from "@cfc/types";
import { initials } from "@cfc/ui";
import { useSession } from "@/lib/session";
import { useArea } from "@/lib/area";
import { useCart } from "@/lib/cart";

/**
 * The signed-in app bar — one component, rendered by every screen behind a
 * sign-in.
 *
 * Before this there were two: this markup living inline on the signed-in home,
 * and a separate Tailwind-built `ConsumerTopBar` on the other forty screens.
 * They had the same job and looked different, so moving from the home screen
 * into a category visibly changed the product. The Tailwind one has been
 * deleted rather than left beside this, so there is nothing to drift from.
 *
 * Behaviour comes from `initCFCApp()` in `(home)/home/interactions.js`, which
 * binds by id — `#addrBtn`, `#askInput`, `#cartBtn`, `#acctBtn`. Any screen
 * rendering this header must call it, which `AppShell` does.
 *
 * Styled by `home-pages.css` under `.cfc-page`, so it must sit inside that
 * wrapper — again, `AppShell` handles it.
 */
export function AppHeader() {
  const router = useRouter();
  const { signedIn, signOut } = useSession();
  const { area, ready } = useArea();
  const { count } = useCart();

  /* The account control shows the REAL customer.

     Name, initials and phone were hardcoded to "Aarthi Subramanian" / "AS",
     while /profile read `getConsumerProfile()` and showed a different person
     entirely. Two parts of the same app naming the customer differently is
     the kind of thing a client notices immediately.

     Fetched here the way every other screen does it rather than through a new
     provider - the mock holds the profile as module state, so an edit on
     Customer 34 already propagates to this header on its next read. */
  const [profile, setProfile] = React.useState<ConsumerProfile | null>(null);
  React.useEffect(() => {
    if (signedIn !== true) {
      setProfile(null);
      return;
    }
    let live = true;
    getConsumerProfile()
      .then((p) => {
        if (live) setProfile(p);
      })
      .catch(() => {
        // The header must still render. It falls back to a neutral avatar.
      });
    return () => {
      live = false;
    };
  }, [signedIn]);

  const avatar = profile ? initials(profile.name) : "";

  return (
    <header className="appbar" id="appbar">
      <div className="wrap appbar-in">
        <Link className="logo" href="/" aria-label="CityFamilyCare home">
          <span className="logo-mark"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span>
          <span className="logo-text">
            <span className="logo-name">CityFamilyCare<sup>CFC</sup></span>
            {/* The tagline the marketing header carries (`.logo-tag`). Without
                it the same brand appeared two different ways depending on
                which side of sign-in you were on. */}
            <span className="logo-tag">Verified home services</span>
          </span>
        </Link>

        {/* The address follows the STORED area, not a hardcoded string.

            This read "Add your address / Bengaluru" for everyone, always -
            a prompt to add an address sitting directly above a city that
            looked like one had already been added. Whichever a customer
            believed, the other line contradicted it.

            `ready` guards the first paint: `area` is null until localStorage
            has been read, so rendering the prompt during that window would
            flash "Add your address" at someone who has one. */}
        <button className="addr-btn unset" type="button" id="addrBtn">
          <svg className="ic" aria-hidden="true"><use href="#i-pin"></use></svg>
          <span className="addr-text">
            {ready && area ? (
              <>
                <b id="addrTitle">{area}</b>
                <span id="addrSub">Deliver here</span>
              </>
            ) : (
              <>
                <b id="addrTitle">Add your address</b>
                <span id="addrSub">Set your location</span>
              </>
            )}
          </span>
          <svg className="ic ic-dn" aria-hidden="true"><use href="#i-chev"></use></svg>
        </button>

        <div className="app-search" id="appSearch">
          <svg className="ic" aria-hidden="true"><use href="#i-search"></use></svg>
          <input id="askInput" type="text" autoComplete="off" role="combobox" aria-expanded="false" aria-controls="sug" aria-autocomplete="list" aria-label="Search for a home service" placeholder="Search for a service" />
          <button className="mic" type="button" id="micBtn" aria-label="Search by voice">
            <svg className="ic" aria-hidden="true"><use href="#i-mic"></use></svg>
          </button>
          <div className="sug" id="sug" role="listbox" aria-label="Service suggestions"></div>
        </div>

        <div className="appbar-actions">
          {/* Notifications belong to an ACCOUNT.

              This rendered unconditionally, complete with the unread dot, and
              pointed a signed-out visitor at /notifications - a route behind
              `RequireAccount`, so the only thing the dot could lead to was a
              sign-in wall. It is the same fault as the hardcoded name: a
              personal control offered to somebody who has no account.

              Removing it also buys back width the header genuinely needs. The
              signed-out bar carries a 76px "Sign in" button where the
              signed-in one has a 40px avatar, and that 36px was coming out of
              the address label - "Add your address" needs 111px and had 78. */}
          {signedIn === true && (
            <Link className="icon-btn" href="/notifications" aria-label="Notifications">
              <svg className="ic" aria-hidden="true"><use href="#i-bell"></use></svg>
              <span className="pip dot" aria-hidden="true"></span>
            </Link>
          )}
          {/* A Link, not a button. This was `<button id="cartBtn">` bound by
              interactions.js to a slide-out drawer - and that drawer was
              removed, so nothing was listening: the cart icon did nothing on
              every screen in the app. `/cart` is the real basket route. */}
          <Link className="icon-btn" href="/cart" id="cartBtn" aria-label="Open cart">
            <svg className="ic" aria-hidden="true"><use href="#i-cart"></use></svg>
            {/* The real basket count. This was static markup - `0` with a
                `hide` class - and interactions.js never touched it, so the
                badge showed nothing however many services were added. */}
            {count > 0 && (
              <span className="pip" id="cartPip">
                {count}
              </span>
            )}
          </Link>
          {/* The account control follows the SESSION.

              This block used to render unconditionally: a signed-out visitor
              saw "Aarthi Subramanian" and a full account menu in the header
              while the page below them said "Sign in to book". Two parts of
              the same screen disagreeing about who you are.

              `signedIn` is null until localStorage has been read, which on the
              server is always. Rendering the signed-out button during that
              window would flash "Sign in" at a customer who IS signed in, so
              the control is held back until the answer is known. */}
          {signedIn === true && (
            <>
              <button
                className="acct-btn"
                type="button"
                id="acctBtn"
                aria-haspopup="menu"
                aria-expanded="false"
                aria-label={
                  profile ? `Account menu for ${profile.name}` : "Account menu"
                }
              >
                <span className="avatar">{avatar}</span>
                <svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg>
              </button>

              <div className="menu" id="acctMenu" role="menu">
                {/* The identity block doubles as the way INTO the profile.

                    There was no "My profile" entry anywhere in this menu, so
                    /profile - the screen carrying the customer's details,
                    their stats and the route to every sub-screen - could only
                    be reached by typing the URL. */}
                <Link className="menu-id" href="/profile" role="menuitem">
                  <span className="avatar">{avatar}</span>
                  <div>
                    <b>{profile ? profile.name : "My account"}</b>
                    <span>
                      {profile ? displayPhone(profile.phone) : "View profile"}
                    </span>
                  </div>
                </Link>
                <hr />
                <Link href="/profile" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-user"></use></svg>My profile</Link>
                <Link href="/bookings" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-receipt"></use></svg>My bookings</Link>
                <Link href="/addresses" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-pin"></use></svg>Saved addresses</Link>
                <Link href="/wallet" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-card"></use></svg>Wallet</Link>
                <Link href="/refer" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-gift"></use></svg>Refer and earn</Link>
                <hr />
                <Link href="/support" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-headset"></use></svg>Help centre</Link>
                <Link href="/settings" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-cog"></use></svg>Settings</Link>
                <button
                  className="menu-item out"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                >
                  <svg className="ic" aria-hidden="true"><use href="#i-logout"></use></svg>Log out
                </button>
              </div>
            </>
          )}

          {signedIn === false && (
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="mobile-search-row">
        <div className="app-search mobile-row">
          <svg className="ic" aria-hidden="true"><use href="#i-search"></use></svg>
          <input id="askInputM" type="text" autoComplete="off" aria-label="Search for a home service" placeholder="Search for a service" />
          <button className="mic" type="button" id="micBtnM" aria-label="Search by voice">
            <svg className="ic" aria-hidden="true"><use href="#i-mic"></use></svg>
          </button>
        </div>
      </div>
    </header>
  );
}

/** "+919876543210" reads as "+91 98765 43210" - the same masking /profile uses. */
function displayPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return e164;
}
