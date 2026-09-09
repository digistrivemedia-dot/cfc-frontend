"use client";

import * as React from "react";

/**
 * Who is signed in, and whether they are accepting jobs.
 *
 * Two pieces of state, deliberately in one place, because they are coupled by a
 * rule from the agreement: **a pro goes offline the moment they accept a job,
 * and back online when they complete it** (`PLATFORM-FACTS.md` — "Auto
 * offline"). That is not a UI preference, it is dispatch behaviour: an online
 * pro is in the pool that gets alerted, and a pro on a job must not be.
 *
 * Nothing here is security. It is a stand-in for the real session so the
 * screens can be built and demonstrated; the backend swap replaces this file
 * and nothing else. `sessionStorage` rather than `localStorage` so closing the
 * tab ends the session — the same choice the consumer app made.
 */

const PRO_KEY = "cfc_pro_id";
const ONLINE_KEY = "cfc_pro_online";

/**
 * The pro this session is signed in as.
 *
 * `pro_0002` — approved AND not blocked, which are two separate flags in the
 * fixtures. `pro_0001` is approved but `blocked: true`, so choosing it made the
 * whole app look broken: `nextOffer` correctly refuses a blocked pro, so no job
 * alert ever arrived and the guard looked like a bug in the offer stream.
 *
 * The other fixture states are how their screens get demonstrated:
 *   `pro_0001` blocked        → the warnings screen (Pro 34)
 *   `pro_0010` pending KYC    → approval pending (Pro 9)
 *   `pro_0011` rejected       → the rejection path
 */
const DEFAULT_PRO_ID = "pro_0002";

export function signIn(proId: string): void {
  try {
    sessionStorage.setItem(PRO_KEY, proId);
  } catch {
    // Private mode. The session lasts the page's lifetime instead.
  }
}

export function signOut(): void {
  try {
    sessionStorage.removeItem(PRO_KEY);
    sessionStorage.removeItem(ONLINE_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function currentProId(): string {
  try {
    return sessionStorage.getItem(PRO_KEY) ?? DEFAULT_PRO_ID;
  } catch {
    return DEFAULT_PRO_ID;
  }
}

/**
 * The online state, shared across every screen.
 *
 * A module-level store rather than React context because the value is written
 * from places that are not in the tree below a provider — accepting a job in a
 * full-screen dialog, completing one on the job screen. `useSyncExternalStore`
 * then gives every subscriber the same value with no prop drilling and no
 * stale render.
 */

let online: boolean | null = null;
const listeners = new Set<() => void>();

function read(): boolean {
  if (online !== null) return online;
  try {
    // Offline is the correct default. A pro who opens the app has not yet said
    // they are ready, and putting them in the dispatch pool without asking
    // means alerts for a job they cannot take — which costs them a penalty,
    // not just an annoyance.
    online = sessionStorage.getItem(ONLINE_KEY) === "1";
  } catch {
    online = false;
  }
  return online;
}

function write(next: boolean): void {
  if (read() === next) return;
  online = next;
  try {
    sessionStorage.setItem(ONLINE_KEY, next ? "1" : "0");
  } catch {
    // The value still holds in memory for this page.
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Read and set the online state.
 *
 * `setOnline` is the manual control (the GO ONLINE button, screens 10 and 11).
 * `goOnJob` and `finishJob` are the automatic transitions the agreement
 * mandates — named for the event rather than the resulting state, so a caller
 * cannot accidentally invert the rule.
 */
export function useOnlineState(): {
  online: boolean;
  setOnline: (next: boolean) => void;
  goOnJob: () => void;
  finishJob: () => void;
} {
  const value = React.useSyncExternalStore(
    subscribe,
    read,
    // Server render: always offline. The real value lives in sessionStorage,
    // which the server cannot see, so claiming "online" here would flash the
    // wrong state on every load.
    () => false,
  );

  return {
    online: value,
    setOnline: write,
    goOnJob: () => write(false),
    finishJob: () => write(true),
  };
}
