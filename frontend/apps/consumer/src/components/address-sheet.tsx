"use client";

import * as React from "react";
import {
  getConsumerProfile,
  reverseGeocode,
  saveAddress,
  type ReverseGeocode,
} from "@cfc/mocks";
import type { Address } from "@cfc/types";
import {
  Button,
  FormField,
  Input,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
  toast,
} from "@cfc/ui";
import { LocationPicker } from "@/components/location-picker";

/**
 * Add or edit an address. **The only one.**
 *
 * There were two: this form on `/addresses`, and a second copy inside the
 * booking flow's step 2. They drifted exactly as two copies do — the checkout
 * one had no map at all, its "Use current location" set a pin and toasted
 * *"Pin set. Please still type the address for the professional"*, and it
 * hardcoded `city: "Tiruchirappalli"`, `state: "Tamil Nadu"` and a fallback
 * coordinate for every address saved through it.
 *
 * One component now, rendered from both places, so a fix lands once.
 *
 * ## The map comes first
 *
 * Everything under it is filled in from where the pin lands, so asking for the
 * street before the location would be asking twice for the same thing. The
 * customer corrects what the geocoder got wrong rather than typing from blank.
 */

/** `work` renders as "Office"; the stored value stays `work`. */
const LABELS = [
  { value: "home", label: "Home" },
  { value: "work", label: "Office" },
  { value: "other", label: "Other" },
] as const;

type Draft = Omit<Address, "id"> & { id?: string | undefined };

function emptyDraft(): Draft {
  return {
    label: "home",
    line1: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    point: { lat: 0, lng: 0 },
    locationVerified: false,
    isDefault: false,
  };
}

export function AddressSheet({
  open,
  address,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  /** An existing address to edit, or null to add a new one. */
  address: Address | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: Address) => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [geo, setGeo] = React.useState<ReverseGeocode | null>(null);
  const [geoBusy, setGeoBusy] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [me, setMe] = React.useState<{ name: string; phone: string } | null>(
    null,
  );

  React.useEffect(() => {
    void getConsumerProfile()
      .then((p) => setMe({ name: p.name, phone: p.phone }))
      .catch(() => setMe(null));
  }, []);

  // Reset whenever the sheet opens, so a cancelled edit does not leak into the
  // next one. Contact details pre-fill from the account for a new address.
  React.useEffect(() => {
    if (!open) return;
    setGeo(null);
    setDraft(
      address
        ? { ...address }
        : {
            ...emptyDraft(),
            ...(me
              ? {
                  contactName: me.name,
                  // Stored E.164; the field shows the 10 local digits.
                  contactPhone: me.phone.replace(/\D/g, "").slice(-10),
                }
              : {}),
          },
    );
  }, [open, address, me]);

  /**
   * The map settled on a point: store it, then ask what is there.
   *
   * The coordinate is kept even if the lookup fails — it came from the
   * customer's own finger and is what a professional navigates to. Only the
   * text fields depend on the geocoder.
   */
  const handleSettle = React.useCallback(
    (point: { lat: number; lng: number }) => {
      setDraft((c) => ({ ...c, point, locationVerified: true }));
      setGeoBusy(true);
      void reverseGeocode(point.lat, point.lng)
        .then((found) => {
          setGeo(found);
          // Only fills what the customer has not typed over. Overwriting a
          // corrected street on every small pan would undo their edit.
          setDraft((c) => ({
            ...c,
            line1: c.line1.trim() === "" ? found.line1 : c.line1,
            area: c.area.trim() === "" ? found.area : c.area,
            city: c.city.trim() === "" ? found.city : c.city,
            state: c.state.trim() === "" ? found.state : c.state,
            pincode: c.pincode.trim() === "" ? found.pincode : c.pincode,
          }));
        })
        // No provider, no network, or a point with no address. The pin stands
        // and the customer types the rest.
        .catch(() => setGeo(null))
        .finally(() => setGeoBusy(false));
    },
    [],
  );

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((c) => ({ ...c, [key]: value }));

  /**
   * The fields the map is supposed to supply.
   *
   * The server needs all five. Normally the geocoder fills them and the
   * customer never sees them — they confirm the pin and type the three things
   * no map can know.
   */
  const detected =
    draft.line1.trim() !== "" &&
    draft.area.trim() !== "" &&
    draft.city.trim() !== "" &&
    draft.state.trim() !== "" &&
    /^\d{6}$/.test(draft.pincode.trim());

  /**
   * Whether to show the geocoded fields as inputs.
   *
   * **Only when something is actually missing**, or the customer asks. OSM's
   * Indian coverage is uneven — a pin on an unmapped lane comes back with no
   * street and sometimes no pincode — and a form that silently refuses to save
   * with no visible empty field is the worst version of this. So the fields
   * appear exactly when they need attention.
   */
  const [editingDetails, setEditingDetails] = React.useState(false);
  const showDetails = editingDetails || (!detected && !geoBusy && geo !== null);

  /**
   * The account holder's name, used when the customer has not set a different
   * one. Only asked for when the account itself has none.
   */
  const contactName = (draft.contactName ?? "").trim();
  const needsContactName = me === null || me.name.trim() === "";

  const valid =
    (draft.flatNumber ?? "").trim() !== "" &&
    detected &&
    (!needsContactName || contactName.length >= 2) &&
    /^[6-9]\d{9}$/.test((draft.contactPhone ?? "").replace(/\D/g, "")) &&
    (draft.label !== "other" || (draft.labelName ?? "").trim() !== "") &&
    draft.point.lat !== 0 &&
    draft.point.lng !== 0;

  const submit = () => {
    if (!valid || busy) return;
    setBusy(true);
    saveAddress({
      ...draft,
      line1: draft.line1.trim(),
      area: draft.area.trim(),
      city: draft.city.trim(),
      state: draft.state.trim(),
      pincode: draft.pincode.trim(),
      flatNumber: (draft.flatNumber ?? "").trim(),
      contactName: (draft.contactName ?? "").trim(),
      contactPhone: (draft.contactPhone ?? "").replace(/\D/g, ""),
      // The key is omitted for Home and Office rather than set to undefined, so
      // a re-labelled address loses the name it was carrying.
      ...(draft.label === "other"
        ? { labelName: (draft.labelName ?? "").trim() }
        : {}),
    })
      .then((saved) => {
        toast.success(draft.id ? "Address updated" : "Address saved");
        onSaved(saved);
      })
      .catch(() => toast.error("We could not save that. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{draft.id ? "Edit address" : "Add an address"}</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-5">
          <LocationPicker
            value={
              draft.point.lat !== 0 || draft.point.lng !== 0 ? draft.point : null
            }
            onSettle={handleSettle}
            caption={geo?.formatted}
            busy={geoBusy}
            {...(geo && !geo.serviceable
              ? {
                  warning:
                    `We are not working in ${geo.area || "this area"} yet. ` +
                    `You can still save this address — we cover ` +
                    `${geo.serviceAreas.join(", ")}.`,
                }
              : {})}
          />

          {/* What the map found. Read-only, because the customer confirmed
              it by placing the pin — re-typing it would be asking twice. The
              fields only appear if something is missing or they ask. */}
          {(detected || geoBusy) && !showDetails && (
            <div className="rounded-card border border-border bg-canvas p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-ink-muted">
                    Detected address
                  </p>
                  <p className="mt-1 text-small text-ink">
                    {geoBusy
                      ? "Finding this place…"
                      : [draft.line1, draft.area, draft.city, draft.state]
                          .filter(Boolean)
                          .join(", ")}
                  </p>
                  {!geoBusy && draft.pincode !== "" && (
                    <p className="tabular text-caption text-ink-muted">
                      {draft.pincode}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDetails(true)}
                  className="shrink-0 text-caption font-semibold text-action hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Shown when the geocoder could not fill everything the server
              needs. OSM's Indian coverage is uneven — an unmapped lane comes
              back with no street, sometimes no pincode — and a Save button
              that refuses with no visible empty field is the worst version of
              that. */}
          {showDetails && (
            <div className="space-y-4 rounded-card border border-border bg-canvas p-3">
              <p className="text-caption text-ink-muted">
                {detected
                  ? "Correct anything the map got wrong."
                  : "The map could not fill all of this. Please complete it."}
              </p>

              <FormField label="Street / area" required>
                <Input
                  value={draft.line1}
                  onChange={(e) => set("line1", e.target.value)}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Area" required>
                  <Input
                    value={draft.area}
                    onChange={(e) => set("area", e.target.value)}
                  />
                </FormField>
                <FormField label="Pincode" required>
                  <Input
                    value={draft.pincode}
                    onChange={(e) =>
                      set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    className="tabular"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="City" required>
                  <Input
                    value={draft.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </FormField>
                <FormField label="State" required>
                  <Input
                    value={draft.state}
                    onChange={(e) => set("state", e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* The three things no map can know. */}
          <FormField
            label="House / flat number"
            required
            help="This is what gets a professional to your door."
          >
            <Input
              value={draft.flatNumber ?? ""}
              onChange={(e) => set("flatNumber", e.target.value)}
              placeholder="3B, Kaveri Apartments"
              autoFocus
            />
          </FormField>

          <FormField
            label="Contact number"
            required
            help="The professional calls this when they arrive."
          >
            <Input
              value={draft.contactPhone ?? ""}
              onChange={(e) =>
                set("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              inputMode="numeric"
              autoComplete="tel"
              className="tabular"
              placeholder="90000 12345"
            />
          </FormField>

          {/* Only asked for when the account itself has no name to borrow. */}
          {needsContactName && (
            <FormField label="Contact name" required>
              <Input
                value={draft.contactName ?? ""}
                onChange={(e) => set("contactName", e.target.value)}
                autoComplete="name"
              />
            </FormField>
          )}

          <FormField label="Landmark" help="Optional, but it saves a phone call.">
            <Input
              value={draft.landmark ?? ""}
              onChange={(e) => set("landmark", e.target.value)}
              placeholder="Opposite the school"
            />
          </FormField>

          <FormField label="Save as" required>
            <div className="flex gap-2">
              {LABELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("label", value)}
                  className={cn(
                    "flex-1 rounded-control border-2 px-3 py-2 text-small font-bold",
                    "transition-all duration-fast",
                    draft.label === value
                      ? "border-action bg-action-subtle text-action shadow-sm"
                      : "border-border bg-surface text-ink hover:border-action",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </FormField>

          {draft.label === "other" && (
            <FormField
              label="Name this address"
              required
              help="So you can tell it apart — “Mum's place”, “Shop”."
            >
              <Input
                value={draft.labelName ?? ""}
                onChange={(e) => set("labelName", e.target.value)}
                placeholder="Mum's place"
                maxLength={24}
              />
            </FormField>
          )}

          <label className="flex cursor-pointer items-center gap-3 rounded-control border border-border bg-surface p-3">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="sr-only"
            />
            <span className="cfc-check" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-small font-bold text-ink">
                Make this my default
              </span>
              <span className="block text-caption text-ink-muted">
                Picked automatically when you book
              </span>
            </span>
          </label>
        </SheetBody>

        <SheetFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || busy}>
            {busy ? "Saving…" : "Save address"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
