import type { QuotationDetail, QuotationStatus } from "@cfc/types";
import { CUSTOMER_NAMES, PRO_NAMES, SERVICE_CATALOG, seeded, pickFrom } from "./seed";

const MATERIAL_SAMPLES = [
  ["1.5 ton compressor unit", 850000],
  ["Copper piping — 10ft", 120000],
  ["Gas refill R32", 220000],
  ["PVC pipe fittings", 45000],
  ["Wall putty — 5kg", 35000],
  ["Emulsion paint — 10L", 280000],
  ["Termite treatment chemical", 180000],
  ["Plywood sheet — 6mm", 95000],
] as const;

function build(): QuotationDetail[] {
  const rand = seeded(20260907);
  const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

  const rows: QuotationDetail[] = [];
  for (let i = 0; i < 24; i++) {
    const [, , serviceName, lo, hi] = pick(SERVICE_CATALOG);
    const laborPaise = Math.round((lo + rand() * (hi - lo)) / 100) * 100;
    const materialCount = 1 + Math.floor(rand() * 3);
    const materials = Array.from({ length: materialCount }, () => {
      const [description, cost] = pick(MATERIAL_SAMPLES);
      return { description, costPaise: cost };
    });
    const materialTotal = materials.reduce((s, m) => s + m.costPaise, 0);
    const totalPaise = laborPaise + materialTotal;

    const status: QuotationStatus = pick([
      "pending", "pending", "approved", "approved",
      "customer_accepted", "rejected", "customer_declined",
    ]);
    const submittedMinutesAgo = Math.floor(rand() * 4000);

    rows.push({
      id: `quo_${(i + 1).toString().padStart(4, "0")}`,
      jobRef: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
      proName: pick(PRO_NAMES),
      customerName: pick(CUSTOMER_NAMES),
      serviceName,
      totalPaise,
      status,
      submittedAt: new Date(
        Date.now() - submittedMinutesAgo * 60_000,
      ).toISOString(),
      minutesRemaining:
        status === "pending" ? Math.max(0, 15 - Math.floor(rand() * 15)) : null,
      proNotes: `Inspected the site. ${materialCount > 1 ? "Multiple parts need" : "One part needs"} replacement to complete the job safely.`,
      materials,
      laborPaise,
      beforePhotoUrls: [
        "/mock/photos/before-1.jpg",
        "/mock/photos/before-2.jpg",
      ],
      customerAreaHistory: Math.floor(rand() * 6),
      ...(status === "rejected"
        ? { rejectionReason: "Quoted amount exceeds the template rate for this service without justification." }
        : {}),
    });
  }

  return rows.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export const quotations: QuotationDetail[] = build();
