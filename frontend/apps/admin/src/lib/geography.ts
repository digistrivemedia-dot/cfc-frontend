/**
 * Where CFC operates — state, city, area.
 *
 * ## This is placeholder data, and it is deliberately in ONE file
 *
 * The client asked for state / city / area filtering on every admin menu. The
 * data model does not carry it: `ProListItem` and `CustomerListItem` have an
 * `area: string` and nothing else — no city, no state, no district. Every area
 * in the fixtures (`packages/mocks/src/fixtures/seed.ts`) is a Tiruchirappalli
 * locality, with no city recorded against it.
 *
 * So the hierarchy lives here instead of in the fixtures. That choice is the
 * point: when the backend starts sending a real city and state per record, this
 * file is what gets deleted, and the filter components keep working because
 * they read the hierarchy through the functions below rather than reaching into
 * the arrays. Nothing else needs rewriting.
 *
 * The states and cities are the real ones the consumer app already names, and
 * the areas are real localities, so a reviewer sees plausible geography rather
 * than `City A / City B`. **The ten Tiruchirappalli areas are the live ones** —
 * they come from the fixtures, so filtering by them genuinely narrows a list.
 * Every other city's areas are placeholders for a list that is currently empty.
 *
 * `district` is deliberately absent. The client asked for it, but inventing a
 * district for each of these cities would be inventing data, and
 * PLATFORM-FACTS.md forbids that. The backend owns it. Adding it later means one
 * more level in this file and one more `FilterSelect` in the bar.
 */

/** A city and the areas CFC serves inside it. */
export interface City {
  readonly name: string;
  readonly areas: readonly string[];
}

/** A state and its cities. */
export interface State {
  readonly name: string;
  readonly cities: readonly City[];
}

/**
 * The operating map.
 *
 * Tiruchirappalli's areas are the ten in `fixtures/seed.ts` — the only areas
 * any record actually carries today, which is why filtering by them works and
 * filtering by any other city returns nothing. That is correct behaviour for
 * placeholder data, not a bug: it reflects where the fixtures say the business
 * is.
 */
export const GEOGRAPHY: readonly State[] = [
  {
    name: "Tamil Nadu",
    cities: [
      {
        // The live one — these ten are in the fixtures.
        name: "Tiruchirappalli",
        areas: [
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
        ],
      },
      {
        name: "Chennai",
        areas: ["Anna Nagar", "T. Nagar", "Adyar", "Velachery", "Tambaram"],
      },
      {
        name: "Coimbatore",
        areas: ["RS Puram", "Gandhipuram", "Peelamedu", "Saibaba Colony"],
      },
      { name: "Madurai", areas: ["Anna Nagar", "KK Nagar", "Villapuram"] },
      { name: "Salem", areas: ["Fairlands", "Hasthampatti", "Suramangalam"] },
    ],
  },
  {
    name: "Karnataka",
    cities: [
      {
        name: "Bengaluru",
        areas: [
          "Indiranagar",
          "Koramangala",
          "Jayanagar",
          "Whitefield",
          "HSR Layout",
        ],
      },
      { name: "Mysuru", areas: ["Vijayanagar", "Kuvempunagar", "Saraswathipuram"] },
      { name: "Mangaluru", areas: ["Kadri", "Bejai", "Surathkal"] },
    ],
  },
  {
    name: "Telangana",
    cities: [
      {
        name: "Hyderabad",
        areas: ["Gachibowli", "Banjara Hills", "Kukatpally", "Madhapur"],
      },
    ],
  },
  {
    name: "Kerala",
    cities: [{ name: "Kochi", areas: ["Kakkanad", "Fort Kochi", "Edappally"] }],
  },
  {
    name: "Andhra Pradesh",
    cities: [
      { name: "Vijayawada", areas: ["Benz Circle", "Gunadala", "Patamata"] },
    ],
  },
];

/** Every state name, for the first dropdown. */
export const STATE_NAMES: readonly string[] = GEOGRAPHY.map((s) => s.name);

/**
 * The cities in a state, or every city when no state is chosen.
 *
 * Returning all cities for `null` is what lets someone filter by city without
 * first picking a state — the common case when an admin knows the city and does
 * not think in states.
 */
export function citiesIn(state: string | null): readonly string[] {
  if (state === null) {
    return [...new Set(GEOGRAPHY.flatMap((s) => s.cities.map((c) => c.name)))];
  }
  const hit = GEOGRAPHY.find((s) => s.name === state);
  return hit ? hit.cities.map((c) => c.name) : [];
}

/**
 * The areas in a city, narrowed by state when one is chosen.
 *
 * Two cities share an area name ("Anna Nagar" is in both Chennai and Madurai),
 * so the list is de-duplicated. A record only stores the area string, so those
 * two are indistinguishable until the backend sends a city — noted here rather
 * than silently de-duplicated as though it did not matter.
 */
export function areasIn(
  state: string | null,
  city: string | null,
): readonly string[] {
  const states =
    state === null ? GEOGRAPHY : GEOGRAPHY.filter((s) => s.name === state);
  const cities = states.flatMap((s) =>
    city === null ? s.cities : s.cities.filter((c) => c.name === city),
  );
  return [...new Set(cities.flatMap((c) => c.areas))];
}

/**
 * The city an area belongs to, or `null` if it is not on the map.
 *
 * This is the bridge that makes state and city filtering work at all: a record
 * carries only its area, so its city has to be looked up. When the backend
 * sends a real city per record, callers read that field instead and this
 * function goes.
 *
 * The first match wins where an area name is shared, which is why the duplicate
 * above matters.
 */
export function cityOfArea(area: string): string | null {
  for (const s of GEOGRAPHY) {
    for (const c of s.cities) {
      if (c.areas.includes(area)) return c.name;
    }
  }
  return null;
}

/** The state an area belongs to, or `null` if it is not on the map. */
export function stateOfArea(area: string): string | null {
  for (const s of GEOGRAPHY) {
    for (const c of s.cities) {
      if (c.areas.includes(area)) return s.name;
    }
  }
  return null;
}

/** What the three dropdowns hold together. */
export interface GeoSelection {
  state: string | null;
  city: string | null;
  area: string | null;
}

/** Nothing selected. */
export const NO_GEO: GeoSelection = { state: null, city: null, area: null };

/**
 * Does a record's area pass the current selection?
 *
 * The one place the matching rule lives, so every screen filters identically.
 *
 * A record whose area is not on the map fails any active filter rather than
 * passing it. The alternative — letting unknown areas through — means a filtered
 * list quietly includes rows that do not match, which is worse than showing
 * fewer rows than expected.
 */
export function matchesGeo(area: string | null, geo: GeoSelection): boolean {
  if (geo.area === null && geo.city === null && geo.state === null) return true;
  if (area === null) return false;
  if (geo.area !== null && area !== geo.area) return false;
  if (geo.city !== null && cityOfArea(area) !== geo.city) return false;
  if (geo.state !== null && stateOfArea(area) !== geo.state) return false;
  return true;
}

/** A one-line description of the active filter, for a printed page's header. */
export function describeGeo(geo: GeoSelection): string {
  const parts = [geo.area, geo.city, geo.state].filter(
    (p): p is string => p !== null,
  );
  return parts.length === 0 ? "All locations" : parts.join(", ");
}
