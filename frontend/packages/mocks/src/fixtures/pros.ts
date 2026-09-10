import type {
  DocumentType,
  ProApprovalStatus,
  ProDetail,
  ProListItem,
  WalletEntry,
} from "@cfc/types";
import { AREAS, PRO_NAMES, seeded, pickFrom } from "./seed";

const SERVICE_SKILLS = [
  ["AC service & repair"],
  ["Electrical repair", "Appliance repair"],
  ["Plumbing — tap & pipe"],
  ["Deep home cleaning", "Bathroom cleaning"],
  ["Carpentry work"],
  ["Wall painting"],
  ["Pest control"],
  ["Salon at home — women", "Men's grooming"],
] as const;

const DOC_TYPES: DocumentType[] = [
  "aadhaar_front",
  "aadhaar_back",
  "pan",
  "selfie",
];

/**
 * Per-professional bios.
 *
 * Every pro used to share one generated sentence - "{N} years of experience in
 * {service}. Trained and verified by City Family Care." - so two pros with the
 * same skill group and the same years had byte-identical bios. On a profile
 * screen whose whole job is to answer "who is coming to my house?", that is
 * not a bio, it is a field that happens to contain words.
 *
 * These are written per person and say only what the fixture already asserts
 * elsewhere: the trade they work in and roughly how they work. They invent no
 * certifications, employers, awards or specialisms the platform cannot stand
 * behind, and they deliberately do NOT repeat "verified by City Family Care" -
 * the Verified badge above the bio already makes that claim, and the old
 * template asserted it even for pros whose KYC had not cleared.
 */
const PRO_BIOS: Record<string, string> = {
  "Murugan Velayudham":
    "Air-conditioning specialist. Handles servicing, gas top-ups and cooling faults across split and window units, and prefers to diagnose before quoting.",
  "Senthil Kumar":
    "Plumber working on taps, pipes and cisterns. Carries the common washers and fittings on every visit, so most jobs are finished without a second trip.",
  "Ravi Shankar":
    "Carpenter. Door and drawer repairs, hinges, shelving and flat-pack assembly - the small fixes that make a house work properly again.",
  "Prabhakaran Natarajan":
    "AC technician. Comfortable with older units other technicians turn down, and explains what failed rather than only that it failed.",
  "Dinesh Arumugam":
    "Air-conditioning and cooling work. Checks drainage and airflow as a matter of course, not only the fault that was reported.",
  "Vijayakumar Rathinam":
    "AC servicing and repair. Works methodically through a fault list and tests cooling performance before calling a job done.",
  "Sathish Perumal":
    "Senior AC technician. Long experience with split-unit installation and repair, and a steady hand with diagnostics on intermittent faults.",
  "Manikandan Duraisamy":
    "Electrical repairs - switches, sockets, fans and tripping circuits - finished only once the circuit is safe to put back into use.",
  "Ashokan Pandian":
    "Home salon and grooming professional. Brings equipment to you, works to the time you have booked, and leaves the space as it was found.",
  "Jeyaraman Kaliyappan":
    "Pest control technician. Treats room by room and explains what to do afterwards to keep the problem from returning.",
  "Kannan Subbiah":
    "Painter and decorator. Prepares and covers properly before any paint is opened, which is most of what makes a finish last.",
  "Elango Ramaswamy":
    "Deep cleaning professional. Works through kitchens and bathrooms in a fixed order so nothing is skipped on a long job.",
};

function build(): ProDetail[] {
  const rand = seeded(20260905);
  const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

  return PRO_NAMES.map((name, i) => {
    const approvalStatus: ProApprovalStatus =
      i < 9 ? "approved" : i === 9 ? "pending" : "rejected";
    const jobsCompleted =
      approvalStatus === "approved" ? Math.floor(20 + rand() * 380) : 0;
    const rating =
      approvalStatus === "approved"
        ? Math.round((3.4 + rand() * 1.6) * 10) / 10
        : 0;
    const totalEarnedPaise =
      jobsCompleted * Math.floor(60000 + rand() * 40000);

    const services = pick(SERVICE_SKILLS) as unknown as string[];
    const experienceYears = Math.floor(2 + rand() * 8);

    // A rejection ALWAYS carries its reason, and an approval never does.
    //
    // This previously drew two independent `rand()` values — one deciding the
    // status, another deciding whether a reason attached — so the two
    // disagreed about half the time. That produced documents rejected with no
    // reason at all, which on the pro's approval screen is a demoralising dead
    // end, and documents marked approved that carried a rejection reason,
    // which is simply nonsense.
    //
    // One draw per document, and the reason is derived from the status.
    const documents = DOC_TYPES.map((type) => {
      const failed = approvalStatus === "rejected" && rand() < 0.5;
      const status = failed
        ? ("rejected" as const)
        : approvalStatus === "pending"
          ? ("pending" as const)
          : ("approved" as const);

      // Reasons vary by document, because "blurred" is unhelpful for a PAN
      // card whose number could not be read, and a pro re-uploading needs to
      // know what specifically to do differently.
      const reasons: Record<DocumentType, string> = {
        aadhaar_front:
          "The Aadhaar number is not readable. Photograph it in better light with all four corners in frame.",
        aadhaar_back:
          "The address side is cut off. Include the whole card in the photo.",
        pan: "The PAN number could not be read. Photograph the card flat, without glare.",
        selfie:
          "Your face is not clearly visible. Take the photo facing a window, without a cap or sunglasses.",
      };

      return {
        type,
        imageUrl: `/mock/docs/${name.split(" ")[0]?.toLowerCase()}-${type}.jpg`,
        status,
        ...(status === "rejected" ? { rejectionReason: reasons[type] } : {}),
      };
    });

    return {
      id: `pro_${(i + 1).toString().padStart(4, "0")}`,
      name,
      photoUrl: null,
      phone: `+91 ${9_000_000_000 + Math.floor(rand() * 999_999_999)}`,
      services,
      area: pick(AREAS),
      online: approvalStatus === "approved" && rand() < 0.45,
      rating,
      jobsCompleted,
      approvalStatus,
      blocked: approvalStatus === "approved" && rand() < 0.05,
      joinedAt: new Date(
        Date.now() - Math.floor(rand() * 400) * 86_400_000,
      ).toISOString(),
      // A pro added without copy gets a plain, factual line rather than an
      // invented description of how they work.
      bio:
        PRO_BIOS[name] ??
        `${experienceYears} years of experience in ${services[0]?.toLowerCase()}.`,
      experienceYears,
      bankAccountLast4: String(1000 + Math.floor(rand() * 8999)),
      ifsc: `HDFC000${1000 + Math.floor(rand() * 8999)}`,
      upiId: rand() < 0.7 ? `${name.split(" ")[0]?.toLowerCase()}@okhdfcbank` : null,
      documents,
      totalEarnedPaise,
      pendingPayoutPaise:
        approvalStatus === "approved" ? Math.floor(rand() * 500000) : 0,
      warningCount: approvalStatus === "approved" ? Math.floor(rand() * 3) : 0,
    };
  });
}

export const pros: ProDetail[] = build();

export const proListItems: ProListItem[] = pros.map(
  ({
    id, name, photoUrl, phone, services, area, online, rating,
    jobsCompleted, approvalStatus, blocked, joinedAt, pendingPayoutPaise,
  }) => ({
    id, name, photoUrl, phone, services, area, online, rating,
    jobsCompleted, approvalStatus, blocked, joinedAt, pendingPayoutPaise,
  }),
);

/**
 * Wallet ledgers. Admin 16 — "job-wise credits".
 *
 * Each pro's entries are generated so they SUM to the pending balance already
 * on their record. A ledger whose lines do not add up to the headline figure is
 * the first thing a finance person checks and the first thing that destroys
 * trust in the screen, so the closing credit is derived rather than random.
 *
 * The CFC fee on each credit follows the agreement: 15% commission, deducted
 * from the pro's earning.
 */

const COMMISSION_RATE = 0.15;

const PENALTY_LABELS = [
  "Penalty — no-show on an accepted job",
  "Penalty — arrived outside the window",
  "Penalty — customer complaint upheld",
];

const ADJUSTMENT_LABELS = [
  "Correction — duplicate settlement reversed",
  "Correction — fee miscalculated on a job",
];

function walletFor(pro: ProDetail, rand: () => number): WalletEntry[] {
  if (pro.approvalStatus !== "approved" || pro.pendingPayoutPaise === 0) {
    return [];
  }

  const entries: WalletEntry[] = [];
  const now = Date.now();
  let running = 0;

  // Three to six completed jobs, oldest first.
  const jobCount = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < jobCount; i++) {
    const gross = 30_000 + Math.floor(rand() * 250_000);
    const fee = Math.round(gross * COMMISSION_RATE);
    const net = gross - fee;
    running += net;
    entries.push({
      id: `wl_${pro.id}_c${i}`,
      proId: pro.id,
      kind: "credit",
      label: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
      amountPaise: net,
      at: new Date(now - (jobCount - i) * 26 * 3_600_000).toISOString(),
      grossPaise: gross,
      feePaise: fee,
    });
  }

  // A penalty on roughly a third of ledgers, so the screen shows the case.
  if (rand() < 0.35) {
    const penalty = 5_000 + Math.floor(rand() * 20_000);
    running -= penalty;
    entries.push({
      id: `wl_${pro.id}_p`,
      proId: pro.id,
      kind: "penalty",
      label: pickFrom(rand, PENALTY_LABELS),
      amountPaise: -penalty,
      at: new Date(now - 20 * 3_600_000).toISOString(),
    });
  }

  // An occasional manual correction.
  if (rand() < 0.2) {
    const adj = 2_000 + Math.floor(rand() * 15_000);
    running += adj;
    entries.push({
      id: `wl_${pro.id}_a`,
      proId: pro.id,
      kind: "adjustment",
      label: pickFrom(rand, ADJUSTMENT_LABELS),
      amountPaise: adj,
      at: new Date(now - 14 * 3_600_000).toISOString(),
    });
  }

  // Close the gap so the ledger sums to the balance the list already shows.
  const gap = pro.pendingPayoutPaise - running;
  if (gap !== 0) {
    const gross = Math.round(Math.abs(gap) / (1 - COMMISSION_RATE));
    entries.push({
      id: `wl_${pro.id}_final`,
      proId: pro.id,
      kind: gap > 0 ? "credit" : "adjustment",
      label:
        gap > 0
          ? `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`
          : "Correction — settlement rounding",
      amountPaise: gap,
      at: new Date(now - 3 * 3_600_000).toISOString(),
      ...(gap > 0
        ? { grossPaise: gross, feePaise: gross - gap }
        : {}),
    });
  }

  // Newest first, the way a statement reads.
  return entries.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export const walletEntries: Record<string, WalletEntry[]> = (() => {
  const rand = seeded(20260906);
  return Object.fromEntries(pros.map((p) => [p.id, walletFor(p, rand)]));
})();
