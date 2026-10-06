"use client";

import * as React from "react";
import { FilterSelect } from "@cfc/ui";
import {
  type GeoSelection,
  NO_GEO,
  STATE_NAMES,
  areasIn,
  citiesIn,
} from "@/lib/geography";

/**
 * State → City → Area, as three cascading dropdowns.
 *
 * The client asked for geographic filtering on every admin menu. This is that
 * filter, built once: it goes inside the `FilterBar` each screen already has,
 * beside that screen's own filters, using the same `FilterSelect` so it looks
 * like the controls next to it rather than like a bolted-on addition.
 *
 * ## Cascading, in both directions
 *
 * Picking a state narrows the city list; picking a city narrows the area list.
 * The harder half is **clearing**: changing the state has to drop a city that is
 * no longer in it, and that city's area with it. Without that, an admin who
 * picks Karnataka → Bengaluru → Indiranagar and then switches to Tamil Nadu is
 * left filtering on a Bengaluru area inside Tamil Nadu, and the list goes
 * silently empty with three filters that each look reasonable.
 *
 * So `setState` and `setCity` clear their descendants. That is the whole reason
 * this is one component holding one `GeoSelection` rather than three loose
 * `FilterSelect`s on each screen.
 *
 * ## Each dropdown is independently usable
 *
 * City can be set without a state, and area without a city — `citiesIn(null)`
 * and `areasIn(null, null)` return everything. An admin who knows the area but
 * not which state it is in should not have to work it out first.
 */
export function GeoFilter({
  value,
  onChange,
}: {
  value: GeoSelection;
  onChange: (next: GeoSelection) => void;
}) {
  const cities = React.useMemo(() => citiesIn(value.state), [value.state]);
  const areas = React.useMemo(
    () => areasIn(value.state, value.city),
    [value.state, value.city],
  );

  return (
    <>
      <FilterSelect
        label="State"
        value={value.state}
        allLabel="All states"
        options={STATE_NAMES.map((s) => ({ value: s, label: s }))}
        // Changing the state drops a city and area that no longer belong to it.
        onChange={(state) => onChange({ state, city: null, area: null })}
      />
      <FilterSelect
        label="City"
        value={value.city}
        allLabel="All cities"
        options={cities.map((c) => ({ value: c, label: c }))}
        onChange={(city) => onChange({ ...value, city, area: null })}
      />
      <FilterSelect
        label="Area"
        value={value.area}
        allLabel="All areas"
        options={areas.map((a) => ({ value: a, label: a }))}
        onChange={(area) => onChange({ ...value, area })}
      />
    </>
  );
}

/**
 * The selection, plus how many of its three parts are set.
 *
 * `FilterBar` shows an active-filter count and a "clear all", and both need to
 * include geography or the bar reports two filters while four are applied.
 */
export function useGeoFilter(): {
  geo: GeoSelection;
  setGeo: (next: GeoSelection) => void;
  /** How many of state/city/area are set — add to a screen's own count. */
  activeCount: number;
  clear: () => void;
} {
  const [geo, setGeo] = React.useState<GeoSelection>(NO_GEO);

  const activeCount =
    (geo.state === null ? 0 : 1) +
    (geo.city === null ? 0 : 1) +
    (geo.area === null ? 0 : 1);

  const clear = React.useCallback(() => setGeo(NO_GEO), []);

  return { geo, setGeo, activeCount, clear };
}
