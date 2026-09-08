import type { Payout, ProWarning } from "@cfc/types";
import { pros } from "./pros";
import { seeded, pickFrom } from "./seed";

const rand = seeded(20260912);
const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

const REASONS = [
  "Arrived more than 30 minutes late without notifying customer.",
  "Job marked complete without GPS proof at customer location.",
  "Customer reported unprofessional conduct.",
  "Cancelled an accepted job with no valid reason.",
];

const admins = ["Chandrasekar R.", "Meenakshi S.", "Vignesh T."];

export const proWarnings: ProWarning[] = pros
  .filter((p) => p.warningCount > 0)
  .flatMap((p) =>
    Array.from({ length: p.warningCount }, (_, i) => ({
      id: `warn_${p.id}_${i}`,
      proId: p.id,
      proName: p.name,
      reason: pick(REASONS),
      penaltyPaise: pick([0, 5000, 10000]),
      issuedAt: new Date(
        Date.now() - Math.floor(rand() * 60) * 86_400_000,
      ).toISOString(),
      issuedBy: pick(admins),
    })),
  );

export const payouts: Payout[] = pros
  .filter((p) => p.approvalStatus === "approved" && p.pendingPayoutPaise > 0)
  .map((p, i) => ({
    id: `pay_${(i + 1).toString().padStart(3, "0")}`,
    proId: p.id,
    proName: p.name,
    amountPaise: p.pendingPayoutPaise,
    method: p.upiId ? "upi" : "bank",
    destinationLast4: p.upiId ? p.upiId.slice(-4) : p.bankAccountLast4,
    requestedAt: new Date(
      Date.now() - Math.floor(rand() * 5) * 86_400_000,
    ).toISOString(),
    status: pick(["pending", "pending", "approved", "paid"]),
  }));
