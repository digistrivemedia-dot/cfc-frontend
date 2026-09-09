"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  Camera,
  HelpCircle,
  House,
  LogOut,
  MapPin,
  Settings,
  Share2,
  Wallet,
} from "lucide-react";
import {
  deleteAddress,
  getAddresses,
  getConsumerProfile,
  updateConsumerProfile,
} from "@cfc/mocks";
import type { Address, ConsumerProfile } from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
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
  formatCount,
  formatCurrency,
  formatDate,
  initials,
  toast,
} from "@cfc/ui";

/**
 * Customer 33, 34, 35 — profile, editing it, and saved addresses.
 *
 * 33 is the page. 34 and 35 are Sheets over it, because both are short tasks
 * a customer returns from: editing a name is three fields, and managing
 * addresses is a list they expect to leave with the profile still behind them.
 * Pushing routes for either would make the back button the primary way out.
 *
 * The stats are the three real figures the profile carries — bookings, wallet
 * balance, and when they joined. No invented "money saved" or "hours
 * reclaimed": nothing computes those and nothing should imply it does.
 */

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<ConsumerProfile | null>(null);
  const [error, setError] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addressesOpen, setAddressesOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    getConsumerProfile().then(setProfile).catch(() => setError(true));
  }, []);

  React.useEffect(() => load(), [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not load your profile"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="mt-3 h-block-sm rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 pb-tab-bar pt-4 md:px-6 md:pb-12">
      <h1 className="sr-only">My profile</h1>

      {/* Identity. */}
      <section className="rounded-card border border-border bg-surface p-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-tile-lg shrink-0">
            <AvatarFallback className="text-heading">
              {initials(profile.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="text-heading font-semibold text-ink">
              {profile.name}
            </p>
            {/* Formatted for reading, not as stored. E.164 is right for a
                database and wrong for a person. */}
            <p className="tabular text-small text-ink-muted">
              {displayPhone(profile.phone)}
            </p>
            <p className="mt-1 flex items-center gap-1 text-caption text-ink-muted">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              {profile.area}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-control border border-border bg-border">
          <Stat
            label={profile.totalBookings === 1 ? "Booking" : "Bookings"}
            value={formatCount(profile.totalBookings)}
            icon={<Briefcase />}
          />
          <Stat
            label="Wallet"
            value={formatCurrency(profile.walletPaise)}
            icon={<Wallet />}
          />
          <Stat label="Member since" value={formatDate(profile.joinedAt, "monthYear")} />
        </dl>
      </section>

      {/* Everything else on the account, as one list. A customer looking for
          "my addresses" scans a list; they do not read six cards. */}
      <nav className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        <ul className="divide-y divide-border-soft">
          <li>
            <RowButton
              icon={<House />}
              label="My addresses"
              detail={
                profile.addresses.length === 0
                  ? "None saved"
                  : `${profile.addresses.length} saved`
              }
              onClick={() => setAddressesOpen(true)}
            />
          </li>
          <li>
            <RowLink icon={<Wallet />} label="Wallet and payments" href="/wallet" />
          </li>
          <li>
            <RowLink icon={<Share2 />} label="Refer and earn" href="/refer" />
          </li>
          <li>
            <RowLink icon={<HelpCircle />} label="Help and support" href="/support" />
          </li>
          <li>
            <RowLink icon={<Settings />} label="Settings" href="/settings" />
          </li>
        </ul>
      </nav>

      {/* Sign out is destructive-ish and sits apart from navigation, so it is
          not tapped while scanning the list above. */}
      <Button
        variant="ghost"
        className="mt-4 w-full text-critical-ink"
        asChild
      >
        <Link href="/login">
          <LogOut />
          Sign out
        </Link>
      </Button>

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        onSaved={(next) => {
          setProfile(next);
          setEditOpen(false);
        }}
      />

      <AddressesSheet
        open={addressesOpen}
        onOpenChange={setAddressesOpen}
        onChanged={load}
      />
    </div>
  );
}

/** "+919876543210" reads as "+91 98765 43210". */
function displayPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return e164;
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode | undefined;
}) {
  return (
    <div className="bg-surface p-3 text-center">
      {icon !== undefined && (
        <span
          className="mx-auto mb-1 flex size-4 items-center justify-center text-ink-faint [&>svg]:size-4"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <dd className="tabular text-small font-semibold text-ink">{value}</dd>
      <dt className="text-caption leading-tight text-ink-muted">{label}</dt>
    </div>
  );
}

function RowLink({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-touch items-center gap-3 px-4 py-3 transition-colors duration-fast hover:bg-canvas"
    >
      <RowBody icon={icon} label={label} />
    </Link>
  );
}

function RowButton({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-touch w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-fast hover:bg-canvas"
    >
      <RowBody icon={icon} label={label} detail={detail} />
    </button>
  );
}

function RowBody({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string | undefined;
}) {
  return (
    <>
      <span
        className="flex size-5 shrink-0 items-center justify-center text-ink-muted [&>svg]:size-4"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-small text-ink">{label}</span>
      {detail !== undefined && (
        <span className="shrink-0 text-caption text-ink-muted">{detail}</span>
      )}
      <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
    </>
  );
}

/**
 * Customer 34 — editing details.
 *
 * The phone number is shown but not editable. It is the login identity, so
 * changing it is an OTP flow of its own rather than a text field — and a field
 * that looks editable but silently is not is worse than one that says why.
 */
function EditProfileSheet({
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ConsumerProfile;
  onSaved: (next: ConsumerProfile) => void;
}) {
  const [name, setName] = React.useState(profile.name);
  const [area, setArea] = React.useState(profile.area);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(profile.name);
    setArea(profile.area);
  }, [open, profile]);

  const dirty = name.trim() !== profile.name || area.trim() !== profile.area;
  const valid = name.trim() !== "" && area.trim() !== "";

  const save = () => {
    if (!dirty || !valid) return;
    setBusy(true);
    updateConsumerProfile({ name, area })
      .then((next) => {
        toast.success("Profile updated");
        onSaved(next);
      })
      .catch(() => toast.error("We could not save that. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {/* Photo upload. Named in the inventory, and there is no file store
              behind it — so the control says what it will do rather than
              accepting a file and losing it. */}
          <div className="flex items-center gap-4">
            <Avatar className="size-tile-lg shrink-0">
              <AvatarFallback className="text-heading">
                {initials(name || profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Button variant="secondary" size="sm" disabled>
                <Camera />
                Change photo
              </Button>
              <p className="mt-1 text-caption text-ink-faint">
                Photo upload arrives with the media integration.
              </p>
            </div>
          </div>

          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </FormField>

          <FormField label="Area" required help="Where most of your bookings are.">
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              autoComplete="address-level2"
            />
          </FormField>

          <FormField
            label="Mobile number"
            help="This is how you sign in. Contact support to change it."
          >
            <Input value={displayPhone(profile.phone)} disabled className="tabular" />
          </FormField>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            disabled={!dirty || !valid}
            onClick={save}
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Customer 35 — saved addresses.
 *
 * Read and delete only. Adding and editing already exist inside the booking
 * flow, and duplicating that form here would give two implementations of the
 * same thing to keep in step. The link sends a customer there.
 */
function AddressesSheet({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = React.useState<Address[] | null>(null);
  const [removing, setRemoving] = React.useState<Address | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    getAddresses().then(setRows).catch(() => setRows([]));
  }, []);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  const remove = () => {
    if (removing === null) return;
    setBusy(true);
    deleteAddress(removing.id)
      .then(() => {
        toast.success("Address removed");
        setRemoving(null);
        load();
        onChanged();
      })
      .catch(() => toast.error("We could not remove that. Try again."))
      .finally(() => setBusy(false));
  };

  const LABEL_ICON = { home: House, work: Briefcase, other: MapPin } as const;
  const LABEL_TEXT = { home: "Home", work: "Work", other: "Other" } as const;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>My addresses</SheetTitle>
          </SheetHeader>

          <SheetBody>
            {rows === null ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }, (_, i) => (
                  <Skeleton key={i} className="h-block-xs rounded-control" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<House />}
                title="No saved addresses"
                description="You will be asked for one when you book."
              />
            ) : (
              <ul className="space-y-2">
                {rows.map((a) => {
                  const Icon = LABEL_ICON[a.label];
                  return (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 rounded-control border border-border p-3"
                    >
                      <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-neutral-subtle text-ink-muted">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-small font-medium text-ink">
                            {LABEL_TEXT[a.label]}
                          </span>
                          {a.isDefault && <Badge tone="neutral">Default</Badge>}
                        </span>
                        <span className="mt-px block text-caption text-ink-muted">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}, {a.area} —{" "}
                          <span className="tabular">{a.pincode}</span>
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-critical-ink"
                        onClick={() => setRemoving(a)}
                      >
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-4 text-caption text-ink-muted">
              Addresses are added while booking, so you can set one exactly
              where the professional needs to come.
            </p>
          </SheetBody>

          <SheetFooter>
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/categories">Book a service</Link>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(next) => {
          if (!next) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this address?</AlertDialogTitle>
            <AlertDialogDescription>
              Bookings already placed keep the address they were made with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="critical"
              onClick={remove}
              disabled={busy}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
