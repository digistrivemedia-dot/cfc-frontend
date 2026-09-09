"use client";

import * as React from "react";
import { nextOffer } from "@cfc/mocks";
import type { ProJob } from "@cfc/types";
import { JobOfferDialog } from "@/components/job-offer-dialog";
import { currentProId, useOnlineState } from "@/lib/pro-session";

/**
 * Brings job offers to whatever screen the pro is on.
 *
 * Mounted once in the app layout, because an offer is not tied to a route —
 * it can arrive while the pro is reading their earnings or editing a service,
 * and it has to interrupt.
 *
 * ## Only when online
 *
 * The single rule this component enforces, and the reason the online state
 * exists: **an offline pro is not in the dispatch pool and must not be
 * offered work.** Going offline stops the listener; going online starts it.
 * That is also what makes the auto-offline-on-accept rule visible — accept a
 * job and the offers stop, which is exactly what should happen.
 *
 * ## Polling, and why the real app will not
 *
 * The mock layer has no push channel, so this polls. In production a job alert
 * arrives over FCM, which is a backend concern (PRO-OPEN-ITEMS 2.2) — and a
 * web app cannot wake a sleeping phone regardless. Polling here is a stand-in
 * for the *arrival* of an offer, not a design choice to carry forward.
 *
 * A deliberately unhurried interval: an offer every few seconds would make the
 * app unusable to demonstrate, and a real pro receives a handful a day. It also
 * never overlaps a live offer — a second dialog stacking on the first would
 * lose the pro a job they were in the middle of reading.
 */

/** How often to look for work. Slow on purpose — see above. */
const POLL_MS = 45_000;

/**
 * Not every check finds a job.
 *
 * A pro who goes online and is instantly handed a job every single time is
 * reading a demo, not an app. This is what makes the "no jobs right now" state
 * on the dashboard something they will actually see.
 */
const OFFER_CHANCE = 0.45;

export function OfferListener() {
  const { online } = useOnlineState();
  const [offer, setOffer] = React.useState<ProJob | null>(null);

  // Read once: the signed-in pro does not change without a reload.
  const proId = React.useMemo(() => currentProId(), []);

  // The live offer, in a ref as well, so the interval can check for one
  // without being re-created every time the offer changes.
  const offerRef = React.useRef<ProJob | null>(null);
  React.useEffect(() => {
    offerRef.current = offer;
  }, [offer]);

  React.useEffect(() => {
    if (!online) {
      // Going offline clears any offer on screen. An offer a pro can no longer
      // be assigned is not one they should still be able to accept.
      setOffer(null);
      return;
    }

    let cancelled = false;

    const look = async () => {
      // Never stack a second offer over one the pro is still deciding on.
      if (cancelled || offerRef.current !== null) return;
      if (Math.random() > OFFER_CHANCE) return;

      try {
        const job = await nextOffer(proId);
        if (!cancelled && job !== null && offerRef.current === null) {
          setOffer(job);
        }
      } catch {
        // A failed poll is not worth telling the pro about. The next one runs.
      }
    };

    // A first look shortly after going online, so the pro sees the connection
    // between the two rather than waiting a full interval with no feedback.
    const first = window.setTimeout(() => void look(), 4_000);
    const timer = window.setInterval(() => void look(), POLL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [online, proId]);

  /**
   * Summon an offer on demand.
   *
   * The interval above is deliberately unhurried, which is right for a pro and
   * useless for showing someone the screen. This exposes the same path as a
   * console call, following the convention the mock layer already set with
   * `__cfc.setScenario`:
   *
   *   __cfcOffer()
   *
   * It goes through `nextOffer` like the poller does, so what appears is a real
   * offer and not a special demonstration case.
   */
  React.useEffect(() => {
    const w = window as typeof window & {
      __cfcOffer?: () => Promise<void>;
    };
    w.__cfcOffer = async () => {
      const job = await nextOffer(proId);
      if (job !== null) setOffer(job);
    };
    return () => {
      delete w.__cfcOffer;
    };
  }, [proId]);

  return (
    <JobOfferDialog offer={offer} onClose={() => setOffer(null)} />
  );
}
