"use client";

import * as React from "react";
import { Clock, MapPin, Phone, Store } from "lucide-react";
import type { MerchantProfile } from "@cfc/types";
import { MERCHANT_APPROVAL_STATUS_LABEL } from "@cfc/types";
import { Badge, Skeleton, Switch, toast } from "@cfc/ui";
import { getMerchantProfile, updateMerchantProfile } from "@cfc/mocks";

/**
 * Shop profile (screen 1 of the pair; registration is the other).
 *
 * Read-mostly: the shop's details are set at registration and verified by CFC,
 * so changing them is an admin action. The two switches are the exceptions —
 * both are operational, used daily, and safe for the shop to change itself.
 */

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<MerchantProfile | null>(null);
  const [isBusy, setBusy] = React.useState(false);

  React.useEffect(() => {
    void getMerchantProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const patch = async (next: Partial<MerchantProfile>, message: string) => {
    setBusy(true);
    try {
      setProfile(await updateMerchantProfile(next));
      toast.success(message);
    } catch {
      toast.error("Could not save that change.");
    } finally {
      setBusy(false);
    }
  };

  if (!profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-line-md" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Shop Profile
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Verified by CFC. Contact support to change your shop details.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-action-subtle text-action">
            <Store className="size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink">
                {profile.shopName}
              </h2>
              <Badge tone={profile.status === "approved" ? "live" : "clock"}>
                {MERCHANT_APPROVAL_STATUS_LABEL[profile.status]}
              </Badge>
            </div>
            <p className="mt-px text-sm text-ink-muted">{profile.ownerName}</p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <Row icon={Phone} label="Phone">
            +91 {profile.phone}
          </Row>
          <Row icon={MapPin} label="Address">
            {profile.addressLine}, {profile.area}, {profile.city} —{" "}
            {profile.pincode}
          </Row>
          <Row icon={Clock} label="Hours">
            {profile.openTime} – {profile.closeTime}
          </Row>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">
          Materials you supply
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Requests are matched against these categories.
        </p>

        <ul className="mt-3 flex flex-wrap gap-2">
          {profile.categories.map((category) => (
            <li key={category.id}>
              <Badge tone="neutral">{category.name}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        <ToggleRow
          label="Accepting requests"
          caption="Turn off while stock-taking. You stop receiving new requests."
          checked={profile.acceptingRequests}
          disabled={isBusy}
          onChange={(value) =>
            void patch(
              { acceptingRequests: value },
              value ? "Accepting requests." : "Paused new requests.",
            )
          }
        />
        <ToggleRow
          label="Show indicative prices"
          caption="Displays the cost CFC quoted against each item. Nothing is paid through this app."
          checked={profile.showsPricing}
          disabled={isBusy}
          onChange={(value) =>
            void patch(
              { showsPricing: value },
              value ? "Prices shown." : "Prices hidden.",
            )
          }
        />
      </section>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-px size-4 shrink-0 text-ink-faint"
        aria-hidden="true"
      />
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 text-ink-muted">{children}</dd>
    </div>
  );
}

function ToggleRow({
  label,
  caption,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  caption: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-px text-sm text-ink-muted">{caption}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}
