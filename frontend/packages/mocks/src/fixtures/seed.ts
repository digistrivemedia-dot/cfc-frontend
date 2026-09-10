/**
 * Deterministic pseudo-random generator, shared by every fixture.
 *
 * Rows must be stable across reloads — a table that reshuffles on every render
 * cannot be reviewed against a screenshot, and a client comparing two visits to
 * the same screen will notice immediately if the data changed for no reason.
 */
export function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function pickFrom<T>(rand: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rand() * xs.length)] as T;
}

export const AREAS = [
  "Srirangam",
  "Thillai Nagar",
  "K.K. Nagar",
  "Woraiyur",
  "Cantonment",
  "Golden Rock",
  "Ariyamangalam",
  "Thiruverumbur",
  "Manachanallur",
  "Marungapuri",
] as const;

export const CUSTOMER_NAMES = [
  "Ramasamy Chandrasekar", "Lakshmi Narayanan", "Priya Venkatesh",
  "Karthik Subramanian", "Meenakshi Sundaram", "Anitha Raghavan",
  "Suresh Balakrishnan", "Divya Krishnamurthy", "Rajesh Palanisamy",
  "Kavitha Manoharan", "Vignesh Thirumalai", "Saranya Elangovan",
  "Muthukumar Selvam", "Deepa Ravichandran", "Arun Prakash",
  "Revathi Shanmugam", "Gopalakrishnan Iyer", "Nithya Rajendran",
  "Balaji Chidambaram", "Hemalatha Ganesan",
] as const;

export const PRO_NAMES = [
  "Murugan Velayudham", "Senthil Kumar", "Ravi Shankar",
  "Prabhakaran Natarajan", "Dinesh Arumugam", "Vijayakumar Rathinam",
  "Sathish Perumal", "Manikandan Duraisamy", "Ashokan Pandian",
  "Jeyaraman Kaliyappan", "Kannan Subbiah", "Elango Ramaswamy",
] as const;

export const SERVICE_CATALOG: readonly [string, string, string, number, number][] = [
  ["Home & Maintenance", "Electrical & AC", "AC service & repair", 49900, 129900],
  ["Home & Maintenance", "Cleaning", "Deep home cleaning", 189900, 449900],
  ["Home & Maintenance", "Plumbing", "Plumbing — tap & pipe", 29900, 89900],
  ["Home & Maintenance", "Electrical & AC", "Electrical repair", 34900, 99900],
  ["Home & Maintenance", "Cleaning", "Bathroom cleaning", 79900, 149900],
  ["Home & Maintenance", "Cleaning", "Sofa & carpet cleaning", 99900, 259900],
  ["Home & Maintenance", "Pest control", "Pest control", 129900, 349900],
  ["Home & Maintenance", "Appliance", "Refrigerator repair", 44900, 179900],
  ["Home & Maintenance", "Appliance", "Washing machine repair", 44900, 169900],
  ["Home & Maintenance", "Carpentry", "Carpentry work", 39900, 199900],
  ["Home & Maintenance", "Painting", "Wall painting", 449900, 1899900],
  ["Home & Maintenance", "Water", "RO water purifier service", 39900, 119900],
  // The cheapest thing on the platform, and the figure the home screen quotes
  // as its "from" price. A small fixed-fee call-out exists so that number is
  // computed from a service a customer can actually book rather than being a
  // marketing figure with nothing behind it.
  ["Home & Maintenance", "Plumbing", "Tap washer replacement", 4900, 14900],
  ["Lifestyle & Personal", "Beauty", "Salon at home — women", 59900, 249900],
  ["Lifestyle & Personal", "Beauty", "Men's grooming", 29900, 99900],
  ["Health & Care", "Nursing", "Nurse home care — 12 hr", 129900, 199900],
];

/** Every service name, for the filters that offer one. */
export const SERVICE_NAMES: readonly string[] = SERVICE_CATALOG.map(
  ([, , name]) => name,
);

export const CATEGORY_ICON_BY_NAME: Record<string, string> = {
  "Home & Maintenance": "Wrench",
  "Lifestyle & Personal": "Sparkles",
  "Health & Care": "HeartPulse",
  "Event & Function": "PartyPopper",
  "Business & Others": "Briefcase",
};
