import type {
  Category,
  CommissionRule,
  PricingRule,
  ServiceDetail,
  SubCategory,
} from "@cfc/types";
import { CATEGORY_ICON_BY_NAME, PRO_NAMES, SERVICE_CATALOG, seeded, pickFrom } from "./seed";

const CATEGORY_NAMES = [
  "Home & Maintenance",
  "Lifestyle & Personal",
  "Health & Care",
  "Event & Function",
  "Business & Others",
] as const;

const rand = seeded(20260908);
const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

export const categories: Category[] = CATEGORY_NAMES.map((name, i) => ({
  id: `cat_${(i + 1).toString().padStart(2, "0")}`,
  name,
  iconName: CATEGORY_ICON_BY_NAME[name] ?? "Circle",
  description: `Trusted, verified professionals for ${name.toLowerCase()} services.`,
  sortOrder: i + 1,
  active: true,
  serviceCount: SERVICE_CATALOG.filter(([cat]) => cat === name).length,
}));

const SUB_NAMES = [
  ...new Set(SERVICE_CATALOG.map(([, sub]) => sub)),
];

export const subCategories: SubCategory[] = SUB_NAMES.map((name, i) => {
  const parentEntry = SERVICE_CATALOG.find(([, sub]) => sub === name);
  const category = categories.find((c) => c.name === parentEntry?.[0]);
  return {
    id: `sub_${(i + 1).toString().padStart(2, "0")}`,
    categoryId: category?.id ?? "cat_01",
    categoryName: category?.name ?? "Home & Maintenance",
    name,
    iconName: "Circle",
    active: true,
  };
});

/**
 * Variant sets that make sense per kind of work. A cleaning job varies by home
 * size, an AC job by unit type — inventing generic "Small / Medium / Large" for
 * everything would read as filler on the customer app.
 */
const VARIANT_SETS: Record<string, readonly [string, number, number][]> = {
  "AC service & repair": [
    ["1 ton split", 0, 60],
    ["1.5 ton split", 20_000, 75],
    ["2 ton window", 35_000, 90],
  ],
  "Deep home cleaning": [
    ["1 BHK", 0, 180],
    ["2 BHK", 70_000, 240],
    ["3 BHK", 150_000, 330],
  ],
  "Bathroom cleaning": [
    ["One bathroom", 0, 60],
    ["Two bathrooms", 45_000, 105],
  ],
  "Sofa & carpet cleaning": [
    ["3-seater sofa", 0, 75],
    ["5-seater sofa", 60_000, 110],
    ["Sofa and carpet", 110_000, 150],
  ],
  "Pest control": [
    ["General — 1 BHK", 0, 90],
    ["General — 2 BHK", 50_000, 120],
    ["Termite treatment", 180_000, 180],
  ],
  "Wall painting": [
    ["One room", 0, 480],
    ["Full 2 BHK", 900_000, 1440],
  ],
  "Salon at home — women": [
    ["Basic grooming", 0, 60],
    ["Full package", 90_000, 120],
  ],
};

/** Default when a service has no set of its own: one standard visit. */
const STANDARD_VARIANT: readonly [string, number, number][] = [
  ["Standard visit", 0, 60],
];

export const services: ServiceDetail[] = SERVICE_CATALOG.map(
  ([categoryName, subName, name, lo], i) => ({
    id: `svc_${(i + 1).toString().padStart(2, "0")}`,
    name,
    categoryName,
    subCategoryName: subName,
    basePricePaise: lo,
    active: true,
    bookingCount: Math.floor(20 + rand() * 400),
    description: `Professional ${name.toLowerCase()}, done right the first time. Verified pros, transparent pricing, warranty included.`,
    imageUrls: [`/mock/services/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`],
    variants: (VARIANT_SETS[name] ?? STANDARD_VARIANT).map(
      ([vName, delta, mins], vi) => ({
        id: `svc_${(i + 1).toString().padStart(2, "0")}_v${vi + 1}`,
        name: vName,
        priceDeltaPaise: delta,
        durationMinutes: mins,
        // The cheapest option is what a customer sees pre-selected.
        isDefault: vi === 0,
        active: true,
      }),
    ),
    inclusions: ["Doorstep service", "Verified technician", "Spare parts extra as needed"],
    warrantyDays: pick([15, 30, 60]),
  }),
);

export const pricingRules: PricingRule[] = services.map((s) => ({
  serviceId: s.id,
  serviceName: s.name,
  basePricePaise: s.basePricePaise,
  // Rounded to the nearest whole rupee — a real admin sets a round fee, not
  // a fraction of a paisa left over from a percentage calculation.
  platformFeePaise: Math.round((s.basePricePaise * 0.08) / 100) * 100,
  visitChargePaise: pick([0, 4900, 9900]),
  nightSurchargePaise: pick([0, 9900, 14900]),
}));

export const commissionRules: CommissionRule[] = [
  ...categories.map((c) => ({
    id: `comm_cat_${c.id}`,
    scope: "category" as const,
    targetName: c.name,
    commissionBps: pick([1200, 1500, 1800]),
  })),
  ...PRO_NAMES.slice(0, 3).map((name, i) => ({
    id: `comm_pro_${i}`,
    scope: "pro" as const,
    targetName: name,
    commissionBps: 0,
    note: "First 20 jobs — onboarding offer",
  })),
  // SRS clause 29 — "special rates for partners". Associate and Major Partners
  // run teams and negotiate their own commission, which is lower than the 15%
  // platform default because they carry volume and their own coordination.
  {
    id: "comm_partner_1",
    scope: "partner" as const,
    targetName: "Sakthi Facility Services — Major Partner",
    commissionBps: 1000,
    note: "14 pros · negotiated at signing",
  },
  {
    id: "comm_partner_2",
    scope: "partner" as const,
    targetName: "Anbu Home Care — Major Partner",
    commissionBps: 1100,
    note: "9 pros · reviewed each quarter",
  },
  {
    id: "comm_partner_3",
    scope: "partner" as const,
    targetName: "Trichy Clean Co — Associate Partner",
    commissionBps: 1250,
    note: "4 pros · steps to 11% above 200 jobs a month",
  },
  {
    id: "comm_partner_4",
    scope: "partner" as const,
    targetName: "Vetri Electricals — Associate Partner",
    commissionBps: 1300,
    note: "3 pros",
  },
];
