"use client";

import * as React from "react";
import { Home, MapPin, MoreVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  deleteAddress,
  getAddresses,
  getConsumerProfile,
  saveAddress,
} from "@cfc/mocks";
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
  Skeleton,
  cn,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";
import { AddressSheet } from "@/components/address-sheet";

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

/**
 * `work` is shown as **"Office"**.
 *
 * The stored value stays `work`: every existing record, every frozen booking
 * copy and every admin view already contains it, so renaming it would be a
 * migration across all of them to change one word on screen.
 */
const LABELS = [
  { value: "home", label: "Home" },
  { value: "work", label: "Office" },
  { value: "other", label: "Other" },
] as const;

type Draft = Omit<Address, "id"> & { id?: string | undefined };

/**
 * A blank form, for "Add address".
 *
 * **Nothing is pre-filled from a guess.** This used to open with
 * `Bengaluru / Karnataka / 12.9716, 77.5946` — a hardcoded city and a hardcoded
 * coordinate, on a platform that operates in Trichy. Every address ever saved
 * carried the same point, which is why `locationVerified` existed and was
 * false for all of them. The map fills these in from where the customer
 * actually puts the pin.
 */
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
  const [pendingDelete, setPendingDelete] = React.useState<Address | null>(null);

  /**
   * The account holder, to pre-fill the contact fields.
   *
   * Usually the person at the door is the customer themselves, so typing their
   * own name and number again is friction for the common case. Still editable:
   * a booking for a parent's flat is exactly why the fields are per-address.
   */
  const [me, setMe] = React.useState<{ name: string; phone: string } | null>(
    null,
  );
  React.useEffect(() => {
    void getConsumerProfile()
      .then((p) => setMe({ name: p.name, phone: p.phone }))
      .catch(() => setMe(null));
  }, []);

  const newDraft = React.useCallback(
    (): Draft => ({
      ...emptyDraft(),
      ...(me
        ? {
            contactName: me.name,
            // Stored E.164; the field shows the 10 local digits.
            contactPhone: me.phone.replace(/\D/g, "").slice(-10),
          }
        : {}),
    }),
    [me],
  );

  const load = React.useCallback(() => {
    setError(false);
    getAddresses()
      .then(setAddresses)
      .catch(() => setError(true));
  }, []);

  /**
   * The map settled on a point: store it, then ask what is there.
   *
   * The coordinate is kept even if the lookup fails — it is what a professional
   * actually navigates to, and it came from the customer's own finger. Only the
   * text fields depend on the geocoder.
   *
   * Guarded against re-entry while a lookup is in flight: panning fires `idle`
   * freely and each call is a paid request.
   */
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
    <div className="cfc-band-wash min-h-screen px-4 pb-20 pt-6 md:px-6">
      <div className="mx-auto max-w-screen-md">
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
        <Button variant="primary" onClick={() => setDraft(newDraft())}>
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
              onClick: () => setDraft(newDraft()),
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

      {/* Screen 17 — the form, shared with the booking flow's step 2.

          Both used to have their own. The checkout's copy had no map, and its
          "Use current location" only set a pin and asked the customer to type
          the address anyway. One component now, so a fix lands in both. */}
      <AddressSheet
        open={draft !== null}
        address={draft?.id ? ((draft as Address) ?? null) : null}
        onOpenChange={(o) => {
          if (!o) setDraft(null);
        }}
        onSaved={() => {
          setDraft(null);
          load();
        }}
      />

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
