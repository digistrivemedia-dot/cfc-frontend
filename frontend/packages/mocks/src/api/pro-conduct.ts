import { applyScenario, latency } from "../control";

/**
 * Pro 35 — the Partner Code of Conduct.
 *
 * ## The problem this file is solving honestly
 *
 * The inventory asks for "CFC 3 Golden Rules, penalty structure, sign-off
 * confirmation". **The agreement names neither the three rules nor a single
 * penalty amount.** `PLATFORM-FACTS.md` carries the penalty *mechanism* —
 * warnings, deductions, auto-block below 2.5 — and no schedule of offences.
 *
 * Inventing three rules and a rupee table would be putting words in the
 * client's mouth on a screen a professional signs. So the three rules here are
 * **derived from what the platform already enforces in code**, and every one
 * cites the mechanism behind it:
 *
 *   1. Turn up   — the 30-second accept window, the auto-reject on timeout, and
 *                  the existing warning reason "arrived more than 30 minutes
 *                  late without notifying customer".
 *   2. Prove it  — the 100 m GPS gate, the customer's completion OTP, and
 *                  before/after photos. The warning reason "job marked complete
 *                  without GPS proof" exists already.
 *   3. Conduct   — the rating that gates dispatch and auto-blocks below 2.5,
 *                  and the warning reason "customer reported unprofessional
 *                  conduct".
 *
 * Penalty amounts are **not** stated. Each rule says the office sets the
 * deduction, and the real amounts a pro has been charged come from their own
 * warnings, which are real data. See PRO-OPEN-ITEMS 1.1 — this is the first
 * client question.
 */

export interface GoldenRule {
  number: 1 | 2 | 3;
  title: string;
  /** What the rule asks of the pro, in their own terms. */
  body: string;
  /** The specific things the platform checks. Each is a documented rule. */
  commitments: string[];
  /**
   * What happens if it is broken.
   *
   * Deliberately no rupee figures: the agreement gives none, and a screen
   * naming an amount the client never agreed to is a commitment made by a
   * developer.
   */
  consequence: string;
}

const GOLDEN_RULES: GoldenRule[] = [
  {
    number: 1,
    title: "Turn up, on time, every time",
    body: "A customer has arranged their day around you. Accepting a job is a promise, and the platform treats it as one.",
    commitments: [
      "Accept or decline within the 30 seconds you are given — an unanswered alert is treated as a decline and goes to another professional.",
      "Arrive inside the scheduled window. If you are running late, call the customer before the time, not after it.",
      "Do not cancel an accepted job unless something genuinely prevents you. Tell the office when it happens.",
    ],
    consequence:
      "Arriving late without telling the customer, or cancelling an accepted job without reason, is recorded as a warning. The office decides any deduction.",
  },
  {
    number: 2,
    title: "Prove the work",
    body: "Photos, the customer's code and your location are what protect you in a dispute. They are not paperwork — they are the reason CFC can take your side.",
    commitments: [
      "Take photos before you start and after you finish. Before-photos are what show damage was already there.",
      "Be within 100 metres of the customer's address when you mark a job complete. The app checks this.",
      "Close every job with the customer's own 4-digit code. Never ask for it before the work is done.",
      "A quotation needs at least two before-photos, a material list and your labour charge. Fewer than two photos and it is rejected automatically.",
    ],
    consequence:
      "Marking a job complete without proof of attendance is recorded as a warning, and the settlement can be held while the office reviews it.",
  },
  {
    number: 3,
    title: "Behave as a guest in someone's home",
    body: "Most of your work happens in a family's house, often with children or elderly relatives present. Your rating is how customers say whether that went well — and it decides which jobs you are offered.",
    commitments: [
      "Be clean, be polite, and keep to the work you were booked for.",
      "Never quote a price directly to a customer or take cash outside the app. Rates are set by the office and payment goes through CFC.",
      "Leave the work area as clean as you found it.",
      "Raise a complaint with the office rather than arguing on site.",
    ],
    consequence:
      "An upheld complaint is recorded as a warning. Accounts are blocked automatically if the rating falls below 2.5.",
  },
];

export async function getGoldenRules(): Promise<GoldenRule[]> {
  await latency();
  return applyScenario(GOLDEN_RULES, []);
}

/**
 * How the penalty system works, without inventing amounts.
 *
 * Every line here is a mechanism from `PLATFORM-FACTS.md`. The one number is
 * 2.5, which is documented. Where an amount would go, it says the office sets
 * it — because it does, and because the alternative is fiction.
 */
export interface PenaltyStep {
  stage: string;
  what: string;
}

const PENALTY_STRUCTURE: PenaltyStep[] = [
  {
    stage: "A warning",
    what: "Recorded on your account with the reason and the admin who issued it. You can see every one on the Warnings screen.",
  },
  {
    stage: "A deduction",
    what: "Set by the CFC office for the specific incident, and taken from your wallet. It appears on your transaction history with its reason, never as an unexplained amount.",
  },
  {
    stage: "Fewer jobs",
    what: "Your rating decides which professionals are alerted first. At the same distance, the higher-rated one gets the job.",
  },
  {
    stage: "Account blocked",
    what: "Automatic below a 2.5 rating, or by the office after repeated warnings. A blocked account receives no job alerts at all.",
  },
];

export async function getPenaltyStructure(): Promise<PenaltyStep[]> {
  await latency();
  return applyScenario(PENALTY_STRUCTURE, []);
}

/**
 * The penalty schedule is a client answer.
 *
 * Exported as a flag so the screen can say so in plain words rather than
 * leaving a professional to assume the amounts are hidden somewhere. Clearing
 * it is a one-line change once the client provides the table.
 */
export const PENALTY_AMOUNTS_NOT_SET = true;

/** Recorded when a pro signs off. Pro 8 and 35. */
export async function acceptConduct(
  _proId: string,
): Promise<{ acceptedAt: string }> {
  await latency();
  return { acceptedAt: new Date().toISOString() };
}
