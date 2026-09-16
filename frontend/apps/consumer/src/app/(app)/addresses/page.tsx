"use client";

import * as React from "react";
import { Home, MapPin, MoreVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { deleteAddress, getAddresses, saveAddress } from "@cfc/mocks";
import type { Address } from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  cn,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";

/**
 * Consumer Screen 35 - My Addresses, with Screen 17 (Add / Edit Address) as
 * the sheet it opens.
 *
 * Inventory 35: "Saved addresses, add/edit/delete."
 * Inventory 17: "Address form with landmark, type (Home/Work/Other)."
 *
 * The two are one route deliberately. A separate page for the form would mean
 * a full navigation to change a pincode, and the customer loses the list they
 * were looking at. The form carries every field the agreement names, and
 * nothing it does not.
 *
 * "Detect location" (inventory 16) is NOT here: it needs the browser
 * geolocation API wired to a real reverse-geocoder, which is backend work.
 * The manual form is complete and does not pretend to have it.
 */

const LABELS = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
] as const;

type Draft = Omit<Address, "id"> & { id?: string | undefined };

/** A blank form, for "Add address". */
function emptyDraft(): Draft {
  return {
    label: "home",
    line1: "",
    area: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    point: { lat: 12.9716, lng: 77.5946 },
    isDefault: false,
  };
}

export default function AddressesPage() {
  return (
    <RequireAccount
      title="Sign in to manage your addresses"
      description="Your saved addresses are tied to your account, so we know where to send a professional."
    >
      <AddressesInner />
    </RequireAccount>
  );
}

function AddressesInner() {
  const [addresses, setAddresses] = React.useState<Address[] | null>(null);
  const [error, setError] = React.useState(false);

  // The sheet holds the draft. Null means closed; a draft without an id is a
  // new address, one with an id is an edit.
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Address | null>(null);

  const load = React.useCallback(() => {
    setError(false);
    getAddresses()
      .then(setAddresses)
      .catch(() => setError(true));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const isValid =
    draft !== null &&
    draft.line1.trim().length >= 3 &&
    draft.area.trim().length >= 2 &&
    /^\d{6}$/.test(draft.pincode.trim());

  async function handleSave() {
    if (draft === null || !isValid || saving) return;
    setSaving(true);
    try {
      await saveAddress({
        ...draft,
        line1: draft.line1.trim(),
        area: draft.area.trim(),
        pincode: draft.pincode.trim(),
      });
      toast.success(draft.id ? "Address updated" : "Address saved");
      setDraft(null);
      load();
    } catch {
      toast.error("Could not save that address. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(address: Address) {
    setPendingDelete(null);
    try {
      await deleteAddress(address.id);
      toast.success("Address removed");
      load();
    } catch {
      toast.error("Could not remove that address.");
    }
  }

  /** Promoting one address demotes the rest - the mock layer handles that. */
  async function handleMakeDefault(address: Address) {
    try {
      await saveAddress({ ...address, isDefault: true });
      toast.success(address.area + " is now your default");
      load();
    } catch {
      toast.error("Could not update that address.");
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6">
        <ErrorState
          title="Could not load your addresses"
          description="Something went wrong on our side."
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title font-extrabold tracking-tight text-ink md:text-title-lg">
            Your addresses
          </h1>
          <p className="mt-1 text-small text-ink-muted">
            Where we send a professional. The default is picked automatically at
            checkout.
          </p>
        </div>
        <Button variant="primary" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-4" />
          Add address
        </Button>
      </div>

      {addresses === null ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-block-sm rounded-card" />
          <Skeleton className="h-block-sm rounded-card" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<MapPin />}
            title="No addresses yet"
            description="Add the address we should come to. It takes about a minute, and you will not have to type it again."
            action={{
              label: "Add your first address",
              onClick: () => setDraft(emptyDraft()),
            }}
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {addresses.map((a) => (
            <li key={a.id}>
              <AddressCard
                address={a}
                onEdit={() => setDraft({ ...a })}
                onDelete={() => setPendingDelete(a)}
                onMakeDefault={() => handleMakeDefault(a)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Screen 17 - the form. */}
      <Sheet open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{draft?.id ? "Edit address" : "Add address"}</SheetTitle>
          </SheetHeader>

          {draft && (
            <>
              <SheetBody className="space-y-5">
                {/* Type, as chips rather than a select: three options that fit
                    on one row read faster than a dropdown that hides two. */}
                <FormField label="Address type" required>
                  <div className="flex gap-2">
                    {LABELS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDraft({ ...draft, label: value })}
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

                <FormField label="Flat, house number, building" required>
                  <Input
                    value={draft.line1}
                    onChange={(e) => setDraft({ ...draft, line1: e.target.value })}
                    placeholder="e.g. 12B, Sunrise Apartments"
                    autoComplete="address-line1"
                  />
                </FormField>

                <FormField label="Street, sector" help="Optional">
                  <Input
                    value={draft.line2 ?? ""}
                    onChange={(e) => setDraft({ ...draft, line2: e.target.value })}
                    placeholder="e.g. 4th Cross Road"
                    autoComplete="address-line2"
                  />
                </FormField>

                <FormField
                  label="Landmark"
                  help="Helps the professional find you faster"
                >
                  <Input
                    value={draft.landmark ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, landmark: e.target.value })
                    }
                    placeholder="e.g. Opposite the temple"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Area" required>
                    <Input
                      value={draft.area}
                      onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                      placeholder="e.g. Indiranagar"
                      autoComplete="address-level3"
                    />
                  </FormField>
                  <FormField label="Pincode" required>
                    <Input
                      value={draft.pincode}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        })
                      }
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="560038"
                      className="tabular"
                      autoComplete="postal-code"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="City" required>
                    <Input
                      value={draft.city}
                      onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                      autoComplete="address-level2"
                    />
                  </FormField>
                  <FormField label="State" required>
                    <Input
                      value={draft.state}
                      onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                      autoComplete="address-level1"
                    />
                  </FormField>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-control border border-border bg-surface p-3">
                  <input
                    type="checkbox"
                    checked={draft.isDefault}
                    onChange={(e) =>
                      setDraft({ ...draft, isDefault: e.target.checked })
                    }
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
                <Button variant="secondary" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!isValid || saving}
                >
                  {saving
                    ? "Saving…"
                    : draft.id
                      ? "Save changes"
                      : "Save address"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this address?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? pendingDelete.line1 +
                  ", " +
                  pendingDelete.area +
                  ". You can add it again later."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** One saved address. */
function AddressCard({
  address,
  onEdit,
  onDelete,
  onMakeDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
}) {
  const label = LABELS.find((l) => l.value === address.label)?.label ?? "Other";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border bg-surface p-4 shadow-sm",
        "transition-all duration-fast hover:-translate-y-1 hover:border-action hover:shadow-md",
        address.isDefault ? "border-action" : "border-border",
      )}
    >
      <span
        className={cn(
          "grid size-tile shrink-0 place-items-center rounded-control text-on-action",
          address.isDefault ? "bg-action" : "bg-clock",
        )}
      >
        <Home className="size-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-body font-bold text-ink">{label}</span>
          {address.isDefault && (
            <span className="rounded-pill bg-action-subtle px-2 py-1 text-caption font-bold text-action">
              Default
            </span>
          )}
        </p>
        <p className="mt-1 text-small leading-relaxed text-ink-muted">
          {address.line1}
          {address.line2 ? ", " + address.line2 : ""}, {address.area}
        </p>
        {address.landmark && (
          <p className="mt-px text-caption text-ink-faint">
            Landmark: {address.landmark}
          </p>
        )}
        <p className="tabular mt-px text-caption text-ink-faint">
          {address.city}, {address.state} {address.pincode}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Address options">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          {!address.isDefault && (
            <DropdownMenuItem onSelect={onMakeDefault}>
              <Star className="size-4" />
              Make default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={onDelete} className="text-critical-ink">
            <Trash2 className="size-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
