import type { ReferralProgramme } from "@cfc/types";
import { applyScenario, latency } from "../control";

/**
 * Customer 38 — refer and earn.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THE REWARD AMOUNTS ARE PLACEHOLDERS
 *
 * `PLATFORM-FACTS.md` documents no referral programme: no reward, no minimum
 * spend, no cap. ₹100 per referral above a ₹500 booking is a plausible shape,
 * not a commitment — and a referral reward shown on screen is a promise the
 * business has to honour.
 *
 * `REFERRAL_TERMS_ARE_PLACEHOLDER` is what the screen reads to label it. Set
 * the real terms and flip the flag; nothing else changes.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const REFERRAL_TERMS_ARE_PLACEHOLDER = true;

export async function getReferralProgramme(): Promise<ReferralProgramme> {
  await latency();

  const programme: ReferralProgramme = {
    code: "AARTHI250",
    shareUrl: "https://cityfamilycare.in/join?ref=AARTHI250",
    rewardPerReferralPaise: 10_000,
    minimumBookingPaise: 50_000,
    invited: 4,
    // One of the four has booked, so the tracker shows real progress rather
    // than a row of zeroes or a suspiciously perfect record.
    converted: 1,
    earnedPaise: 10_000,
  };

  return applyScenario(programme, {
    code: programme.code,
    shareUrl: programme.shareUrl,
    rewardPerReferralPaise: programme.rewardPerReferralPaise,
    minimumBookingPaise: programme.minimumBookingPaise,
    invited: 0,
    converted: 0,
    earnedPaise: 0,
  });
}
