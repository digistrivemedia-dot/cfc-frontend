import type { Address } from "@cfc/types";
import { AREAS } from "../fixtures/seed";
import { applyScenario, latency } from "../control";

/**
 * Customer 16 and 17 — saved addresses, and adding or editing one.
 *
 * Held in module state rather than returned fresh each call, so adding an
 * address on Screen 17 and then seeing it on Screen 16 works the way it will
 * once a backend exists. The list resets on reload, which is the honest
 * boundary of a mock — nothing here pretends to persist.
 *
 * Two addresses to start with, not one: "choose a saved address" is a
 * different screen from "you have one address", and the picker cannot be
 * judged against a list of one.
 */

const addresses: Address[] = [
  {
    id: "addr_01",
    label: "home",
    line1: "42, Kaveri Nagar",
    line2: "Near Temple Street",
    landmark: "Opposite Saravana Stores",
    area: AREAS[0],
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    pincode: "620006",
    point: { lat: 10.8505, lng: 78.6837 },
    isDefault: true,
  },
  {
    id: "addr_02",
    label: "work",
    line1: "Unit 7, Anna Complex",
    line2: "2nd Floor",
    landmark: "Above the pharmacy",
    area: AREAS[1] ?? AREAS[0],
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    pincode: "620018",
    point: { lat: 10.8231, lng: 78.6952 },
    isDefault: false,
  },
];

export async function getAddresses() {
  await latency();
  return applyScenario([...addresses], []);
}

/**
 * Adds or replaces an address.
 *
 * Takes the whole record minus its id, and returns the saved version with one.
 * A caller editing an existing address passes its id back.
 */
export async function saveAddress(
  draft: Omit<Address, "id"> & { id?: string | undefined },
): Promise<Address> {
  await latency();

  const saved: Address = {
    ...draft,
    id: draft.id ?? `addr_${Date.now().toString(36)}`,
  };

  // Exactly one address is the default. Promoting this one demotes the rest,
  // or a customer ends up with two defaults and a booking picks arbitrarily.
  if (saved.isDefault) {
    for (const a of addresses) a.isDefault = false;
  }

  const index = addresses.findIndex((a) => a.id === saved.id);
  if (index >= 0) addresses[index] = saved;
  else addresses.push(saved);

  // The first address a customer saves is their default whether they asked for
  // it or not — otherwise nothing is selected on the next booking.
  if (addresses.length === 1) {
    const only = addresses[0];
    if (only) only.isDefault = true;
  }

  return saved;
}

export async function deleteAddress(id: string): Promise<void> {
  await latency();
  const index = addresses.findIndex((a) => a.id === id);
  if (index < 0) return;

  const wasDefault = addresses[index]?.isDefault ?? false;
  addresses.splice(index, 1);

  // Removing the default leaves nothing selected, so the next one takes over.
  if (wasDefault && addresses.length > 0) {
    const first = addresses[0];
    if (first) first.isDefault = true;
  }
}
