"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Lock } from "lucide-react";
import { getPro, getServiceAreas, updateProProfile } from "@cfc/mocks";
import type { ProDetail } from "@cfc/types";
import {
  Badge,
  Button,
  Checkbox,
  FormField,
  Input,
  InlineAlert,
  Skeleton,
  Textarea,
  cn,
  toast,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 27 — edit profile.
 *
 * "Bio, skills, service area, experience, contact info."
 *
 * ## Skills are not editable, and the screen says who owns them
 *
 * The inventory lists skills here, but a pro cannot grant themselves a skill —
 * the office approves them, and `PLATFORM-FACTS.md` puts pro onboarding under
 * the Super Admin. So skills appear as a read-only row with a route to support.
 *
 * That is a deliberate choice over the alternative of showing an editable field
 * that silently fails to save, which is the worse outcome by a distance: a pro
 * would add "Electrical repair", see it accepted, wait for work that never
 * comes, and have no way to discover why.
 *
 * ## Service areas are a multi-select, not one area
 *
 * The pro record carries a single `area`, but a pro who will travel to three
 * neighbourhoods is being under-served by a field that holds one. The form
 * collects several and the first is written back as their primary — so the
 * screen is honest about intent while the current data shape is respected.
 * Flagged for the backend rather than pretended away.
 *
 * ## The phone number is the account
 *
 * A pro signs in with an OTP to this number. Changing it is therefore an
 * account change, not a contact detail, and it needs verification the mock
 * layer has no path for — so it is editable with that stated, and the real
 * implementation must re-verify.
 */

export default function ProEditProfilePage() {
  const router = useRouter();
  const proId = React.useMemo(() => currentProId(), []);

  const [pro, setPro] = React.useState<ProDetail | null>(null);
  const [bio, setBio] = React.useState("");
  const [years, setYears] = React.useState("");
  const [areas, setAreas] = React.useState<string[]>([]);
  const [phone, setPhone] = React.useState("");
  const [upi, setUpi] = React.useState("");
  const [allAreas, setAllAreas] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([getPro(proId), getServiceAreas()])
      .then(([p, list]) => {
        if (cancelled) return;
        setPro(p);
        setBio(p.bio);
        setYears(String(p.experienceYears));
        setAreas([p.area]);
        setPhone(p.phone);
        setUpi(p.upiId ?? "");
        setAllAreas(list);
      })
      .catch(() => {
        toast.error("Could not load your profile.");
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  const yearsNum = Number(years);
  const yearsValid =
    years !== "" && Number.isInteger(yearsNum) && yearsNum >= 0 && yearsNum <= 60;
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 10 || phoneDigits.length === 12;
  const valid = yearsValid && phoneValid && areas.length > 0;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await updateProProfile(proId, {
        bio: bio.trim(),
        experienceYears: yearsNum,
        areas,
        phone,
        upiId: upi.trim() === "" ? null : upi.trim(),
      });
      toast.success("Profile updated.");
      router.push("/profile");
    } catch {
      toast.error("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (pro === null) {
    return (
      <div className="mx-auto max-w-detail px-4 py-4 md:px-6">
        <Skeleton className="h-6 w-line-lg" />
        <Skeleton className="mt-4 h-block-md w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Profile
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">Edit profile</h1>

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {/* What the pro owns. */}
        <section className="rounded-card border border-border bg-surface p-4">
          <FormField
            label="About you"
            htmlFor="bio"
            help="Customers see this on your profile. Say what you do and how long you have done it."
          >
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={400}
            />
          </FormField>
          <p className="mt-1 text-right text-caption text-ink-faint">
            {bio.length} / 400
          </p>

          <FormField
            label="Years of experience"
            htmlFor="years"
            required
            className="mt-4"
            {...(years !== "" && !yearsValid
              ? { error: "Enter a whole number of years, up to 60." }
              : {})}
          >
            <Input
              id="years"
              value={years}
              onChange={(e) => setYears(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="max-w-line-sm tabular"
            />
          </FormField>
        </section>

        {/* Where they will travel. */}
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-medium text-ink">Service areas</h2>
          <p className="mt-px text-caption text-ink-muted">
            Where you will take jobs. You are alerted about work in these areas
            first — the nearest professionals are notified for each job.
          </p>

          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {allAreas.map((area) => {
              const checked = areas.includes(area);
              return (
                <li key={area}>
                  <label
                    className={cn(
                      "flex min-h-touch cursor-pointer items-center gap-3 rounded-control px-3",
                      "transition-colors duration-fast hover:bg-canvas",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        setAreas((current) =>
                          next === true
                            ? [...current, area]
                            : current.filter((a) => a !== area),
                        )
                      }
                    />
                    <span className="min-w-0 truncate text-small text-ink">
                      {area}
                    </span>
                    {areas[0] === area && (
                      <Badge tone="neutral">Primary</Badge>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          {areas.length === 0 && (
            <p className="mt-2 text-caption text-critical-ink">
              Choose at least one area, or you will not be sent any jobs.
            </p>
          )}
        </section>

        {/* Contact. */}
        <section className="rounded-card border border-border bg-surface p-4">
          <FormField
            label="Mobile number"
            htmlFor="phone"
            required
            help="You sign in with this number. Changing it means verifying the new one."
            {...(phone !== "" && !phoneValid
              ? { error: "Enter a 10-digit mobile number." }
              : {})}
          >
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              className="max-w-line-2xl tabular"
            />
          </FormField>

          <FormField
            label="UPI ID"
            htmlFor="upi"
            help="For daily payouts. Leave empty to be paid to your bank account only."
            className="mt-4"
          >
            <Input
              id="upi"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              inputMode="email"
              placeholder="name@bank"
              className="max-w-line-2xl"
            />
          </FormField>

          <p className="mt-3 flex items-start gap-2 rounded-control bg-canvas p-3 text-caption text-ink-muted">
            <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
            Bank account details are changed by the CFC office, so a payout
            cannot be redirected without a verified request.
          </p>
        </section>

        {/* What the pro does not own. Stated, not hidden. */}
        <section className="rounded-card border border-border bg-canvas p-4">
          <h2 className="flex items-center gap-2 text-small font-medium text-ink">
            <Lock className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            Set by the CFC office
          </h2>
          <dl className="mt-3 space-y-3">
            <Locked
              label="Your name"
              value={pro.name}
              why="Matches your Aadhaar and PAN, so it cannot be changed here."
            />
            <Locked
              label="Skills"
              value={pro.services.join(", ")}
              why="The office approves skills. Contact support with a certificate or proof of experience to add one."
            />
            <Locked
              label="Service rates"
              value="Set per service by the admin"
              why="Rates are managed centrally so every professional charges the same for the same work."
            />
          </dl>
          <Button variant="secondary" className="mt-3 w-full" asChild>
            <Link href="/support">Ask the office to change something</Link>
          </Button>
        </section>

        <InlineAlert tone="info" title="Your rating and job history stay">
          Nothing you change here affects your rating, your completed jobs or
          your earnings.
        </InlineAlert>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="submit"
            size="pro"
            className="min-w-0 flex-1"
            disabled={!valid || saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-w-0 flex-1"
            onClick={() => router.push("/profile")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function Locked({
  label,
  value,
  why,
}: {
  label: string;
  value: string;
  why: string;
}) {
  return (
    <div>
      <dt className="text-caption text-ink-muted">{label}</dt>
      <dd className="text-small font-medium text-ink">{value}</dd>
      <dd className="mt-px text-caption text-ink-faint">{why}</dd>
    </div>
  );
}
