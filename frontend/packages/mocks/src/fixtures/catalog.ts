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

/**
 * Optional extras, per service. Customer 14 — "add-ons".
 *
 * `[name, description, pricePaise, durationMinutes]`.
 *
 * Each one is work a pro on that visit could plausibly also do, priced as a
 * separate job rather than a discount on a bundle. Services without a set get
 * none: an invented add-on promises labour nobody has agreed to perform, which
 * is worse than an empty section the screen already knows how to hide.
 */
const ADD_ON_SETS: Record<
  string,
  readonly [string, string, number, number][]
> = {
  "AC service & repair": [
    ["Anti-bacterial coil treatment", "Sprayed on the coil after cleaning.", 29_900, 15],
    ["Outdoor unit deep clean", "Jet wash of the condenser and fins.", 39_900, 25],
    ["Stabiliser check", "Voltage and earthing tested with the unit.", 14_900, 10],
  ],
  "Deep home cleaning": [
    ["Refrigerator interior", "Shelves out, wiped down and put back.", 34_900, 30],
    ["Balcony scrub", "Floor and railing, one balcony.", 29_900, 30],
    ["Inside cabinets", "Kitchen cupboards emptied, wiped and restocked.", 49_900, 45],
  ],
  "Bathroom cleaning": [
    ["Hard water stain removal", "Acid treatment on tiles and glass.", 39_900, 30],
    ["Exhaust fan clean", "Cover removed, blades degreased.", 19_900, 15],
  ],
  "Sofa & carpet cleaning": [
    ["Fabric protection spray", "Applied after the wash to resist stains.", 44_900, 20],
    ["Dining chairs — set of 4", "Shampooed alongside the sofa.", 59_900, 40],
  ],
  "Pest control": [
    ["Kitchen-only follow-up", "A second visit for the kitchen within 30 days.", 49_900, 45],
    ["Mosquito fogging", "Balconies and outdoor edges.", 39_900, 25],
  ],
  "Wall painting": [
    ["Ceiling included", "Same coats, same finish, one room.", 180_000, 240],
    ["Wood and metal enamel", "Doors, grilles and window frames.", 220_000, 300],
  ],
  "Salon at home — women": [
    ["Head massage", "Twenty minutes, oil of your choice.", 29_900, 20],
    ["Hair spa", "Wash, mask and blow-dry.", 69_900, 45],
  ],
  "Men's grooming": [
    ["Head massage", "Twenty minutes, oil of your choice.", 24_900, 20],
    ["Face clean-up", "Cleanse, scrub and pack.", 39_900, 30],
  ],
  "RO water purifier service": [
    ["Sediment pre-filter", "Replaced with a new cartridge.", 34_900, 15],
    ["TDS report", "Input and output readings, written down.", 9_900, 10],
  ],
  "Refrigerator repair": [
    ["Door gasket replacement", "New seal fitted and tested.", 59_900, 30],
    ["Deep clean interior", "Shelves out, wiped down and put back.", 34_900, 30],
  ],
  "Washing machine repair": [
    ["Drum descaling", "Descaler run through a full empty cycle.", 39_900, 45],
    ["Inlet hose replacement", "New hose, fitted and leak-tested.", 24_900, 15],
  ],
  "Carpentry work": [
    ["Door alignment", "One additional door planed and re-hung.", 44_900, 45],
    ["Hardware supply", "Hinges, handles or runners, fitted.", 29_900, 20],
  ],
};

/**
 * Per-service copy.
 *
 * Every service used to share one template — "Professional {name}, done right
 * the first time. Verified pros, transparent pricing, warranty included." —
 * repeated verbatim under all sixteen. On a grid of twenty cards that is not
 * description, it is noise: it distinguishes nothing and reads as filler.
 *
 * These say what the job actually is. They deliberately claim nothing the
 * platform does not already promise elsewhere (fixed price, warranty, verified
 * pros are all real, documented rules) and invent no new guarantees, timings,
 * chemicals, or brand affiliations. Where a real detail is needed but unknown,
 * the sentence stops rather than inventing one.
 */
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "AC service & repair":
    "Servicing, gas top-up and fault diagnosis for split and window units. The technician checks cooling performance and drainage before finishing.",
  "Deep home cleaning":
    "A full clean of every room — floors, fittings, kitchen surfaces and bathrooms — including the corners a weekly clean skips.",
  "Plumbing — tap & pipe":
    "Leaking taps, blocked pipes and running cisterns. Common washers and fittings are carried, so most jobs are finished in one visit.",
  "Electrical repair":
    "Switches, sockets, fans, wiring faults and tripping circuits, diagnosed and repaired to the point where the circuit is safe to use.",
  "Bathroom cleaning":
    "Tiles, grout, fittings and sanitaryware scrubbed and descaled, including the limescale that ordinary cleaning leaves behind.",
  "Sofa & carpet cleaning":
    "Upholstery and carpets cleaned in place, lifting embedded dust and surface stains. Drying time depends on the fabric.",
  "Pest control":
    "Treatment for cockroaches, ants and other household pests, applied room by room with advice on keeping them out.",
  "Refrigerator repair":
    "Cooling failures, leaks, noise and thermostat faults on single and double-door units, diagnosed before any part is replaced.",
  "Washing machine repair":
    "Drainage, spin, drum and error-code faults on front and top-load machines. The machine is run through a cycle before sign-off.",
  "Carpentry work":
    "Repairs and fitting for doors, drawers, hinges, shelves and furniture — from a sticking door to assembling a flat-pack wardrobe.",
  "Wall painting":
    "Interior walls prepared, primed and painted, with surfaces covered and the room put back as it was afterwards.",
  "RO water purifier service":
    "Filter and membrane replacement, servicing and leak checks, with the output tested before the technician leaves.",
  "Tap washer replacement":
    "A single dripping tap fixed in one short visit. The lowest-cost job on the platform, and priced as a fixed call-out.",
  "Salon at home — women":
    "Salon treatments in your own home at a time you choose, with equipment brought in and the space left clean.",
  "Men's grooming":
    "Haircut, beard trim and grooming at home, without the wait at a salon.",
  "Nurse home care — 12 hr":
    "A qualified nurse for a twelve-hour shift, for post-operative care, elderly care or recovery at home.",
};

/**
 * Per-service inclusions.
 *
 * Every service used to list the identical three lines - "Doorstep service",
 * "Verified technician", "Spare parts extra as needed" - regardless of
 * whether it was AC repair or a salon appointment. Those three are real,
 * platform-wide promises (see TrustRow / PLATFORM-FACTS) and stay on every
 * service, but a customer reading "What is included" wants to know what
 * happens on THIS job, not a repeat of the badges already shown above it.
 *
 * The job-specific lines below describe only what the catalogue already
 * implies - the scope of the work itself - and invent no new guarantees,
 * chemicals, brands, or timings beyond what the description already states.
 */
const UNIVERSAL_INCLUSIONS = [
  "Doorstep service",
  "Verified technician",
  "Spare parts extra as needed",
];

const SERVICE_INCLUSIONS: Record<string, string[]> = {
  "AC service & repair": [
    "Filter and coil cleaning",
    "Gas pressure check and top-up if needed",
    "Cooling and drainage test before sign-off",
  ],
  "Deep home cleaning": [
    "Every room, including kitchen and bathrooms",
    "Floors, fittings and skirting",
    "Windows and glass surfaces reachable without external access",
  ],
  "Plumbing — tap & pipe": [
    "Diagnosis of the leak or blockage",
    "Common washers and fittings, carried on the visit",
    "Leak test after the fix",
  ],
  "Electrical repair": [
    "Fault diagnosis on the affected circuit",
    "Switch, socket or wiring repair",
    "Safety check before the technician leaves",
  ],
  "Bathroom cleaning": [
    "Tiles, grout and fittings scrubbed and descaled",
    "Sanitaryware cleaned and disinfected",
    "Mirrors and glass surfaces",
  ],
  "Sofa & carpet cleaning": [
    "Deep vacuum before treatment",
    "Stain and dust extraction in place",
    "Fabric-safe drying guidance",
  ],
  "Pest control": [
    "Room-by-room treatment",
    "Cockroach, ant and common pest coverage",
    "Advice on keeping them from returning",
  ],
  "Refrigerator repair": [
    "Cooling and thermostat diagnosis",
    "Leak and noise check",
    "Test run before sign-off",
  ],
  "Washing machine repair": [
    "Drain, spin and drum diagnosis",
    "Error-code troubleshooting",
    "Full cycle test before sign-off",
  ],
  "Carpentry work": [
    "On-site measurement and assessment",
    "Repair or fitting of doors, drawers, hinges or shelves",
    "Finish check before the technician leaves",
  ],
  "Wall painting": [
    "Surface preparation and minor crack filling",
    "Furniture and floor covering during the work",
    "Two coats, unless the job calls for more",
  ],
  "RO water purifier service": [
    "Filter and membrane check, replaced if due",
    "Leak inspection across the unit",
    "Output quality tested before sign-off",
  ],
  "Tap washer replacement": [
    "Washer replacement for one tap",
    "Leak test after the fix",
  ],
  "Salon at home — women": [
    "Equipment brought to your home",
    "Treatment performed at a time you choose",
    "Space left clean afterwards",
  ],
  "Men's grooming": [
    "Haircut and beard trim at home",
    "Equipment brought to your home",
  ],
  "Nurse home care — 12 hr": [
    "A qualified nurse for the full 12-hour shift",
    "Vitals monitoring and medication support",
    "Handover notes for the next shift or family",
  ],
};

export const services: ServiceDetail[] = SERVICE_CATALOG.map(
  ([categoryName, subName, name, lo], i) => ({
    id: `svc_${(i + 1).toString().padStart(2, "0")}`,
    name,
    categoryName,
    subCategoryName: subName,
    basePricePaise: lo,
    active: true,
    bookingCount: Math.floor(20 + rand() * 400),
    // Ratings cluster between 4.1 and 4.9 with a long tail: a catalogue where
    // everything is 4.8 reads as fabricated, and the UI has to handle a 3.9
    // without the layout shifting. A handful stay at 0 so "New" is a state
    // that actually gets exercised.
    ...(() => {
      const isNew = rand() < 0.12;
      if (isNew) return { rating: 0, reviewCount: 0 };
      const reviewCount = Math.floor(8 + rand() * 240);
      const rating = Math.round((3.9 + rand() * 1.0) * 10) / 10;
      return { rating: Math.min(5, rating), reviewCount };
    })(),
    description:
      SERVICE_DESCRIPTIONS[name] ??
      // A service added to the catalogue without copy gets a plain, honest
      // line rather than an invented description of work we know nothing about.
      `${name}, booked at a fixed price with a verified professional.`,
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
    addOns: (ADD_ON_SETS[name] ?? []).map(
      ([aName, aDesc, price, mins], ai) => ({
        id: `svc_${(i + 1).toString().padStart(2, "0")}_a${ai + 1}`,
        name: aName,
        description: aDesc,
        pricePaise: price,
        durationMinutes: mins,
        active: true,
      }),
    ),
    // The three universal promises always show; job-specific lines are
    // appended per service, falling back to nothing extra (rather than an
    // invented claim) for a service added without copy.
    inclusions: [...UNIVERSAL_INCLUSIONS, ...(SERVICE_INCLUSIONS[name] ?? [])],
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
