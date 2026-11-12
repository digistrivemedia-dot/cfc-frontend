"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldOff } from "lucide-react";
import { ADMIN_SECTIONS, can, type AdminSection, type Role } from "@cfc/types";
import { Button, ErrorState, PageHeader, Switch, toast } from "@cfc/ui";
import { useActor } from "@/lib/actor";
import { PrintButton, PrintHeader } from "@/components/printable";

/**
 * Admin 49b — what each role may open.
 *
 * Roles down the side, sections across the top, a toggle at each crossing.
 * Set it once for a role and every admin holding that role follows, including
 * the next one added — which is the point of doing this per role rather than
 * per person.
 *
 * Every cell is editable. The Super Admin decides; this screen does not refuse
 * a combination or warn about one.
 *
 * The Super Admin itself is not listed: it holds everything, permanently.
 */

const SECTION_LABEL: Record<AdminSection, string> = {
  bookings: "Bookings",
  quotations: "Quotations",
  pros: "Pros",
  customers: "Customers",
  services: "Services",
  payments: "Payments",
  promotions: "Promotions",
  reports: "Reports",
  support: "Support",
  settings: "Settings",
};

type ManagedRole = Extract<
  Role,
  "sub_admin" | "area_admin" | "associate_partner" | "major_partner" | "pro"
>;

const ROLES: { id: ManagedRole; label: string }[] = [
  { id: "sub_admin", label: "Sub Admin" },
  { id: "area_admin", label: "Area Admin" },
  { id: "associate_partner", label: "Associate Partner" },
  { id: "major_partner", label: "Major Partner" },
  { id: "pro", label: "Pro" },
];

type Grid = Record<ManagedRole, AdminSection[]>;

/** Where each role starts. Everything is editable from here. */
const INITIAL: Grid = {
  sub_admin: ["bookings", "quotations", "pros", "support"],
  area_admin: ["bookings", "quotations", "pros"],
  associate_partner: [],
  major_partner: [],
  pro: [],
};

const clone = (g: Grid): Grid => ({
  sub_admin: [...g.sub_admin],
  area_admin: [...g.area_admin],
  associate_partner: [...g.associate_partner],
  major_partner: [...g.major_partner],
  pro: [...g.pro],
});

export default function PermissionsPage() {
  const actor = useActor();
  const allowed = can(actor, "settings.manage_admins");

  const [saved, setSaved] = React.useState<Grid>(() => clone(INITIAL));
  const [draft, setDraft] = React.useState<Grid>(() => clone(INITIAL));

  const has = (r: ManagedRole, s: AdminSection) => draft[r].includes(s);

  const toggle = (r: ManagedRole, s: AdminSection) =>
    setDraft((d) => ({
      ...d,
      [r]: d[r].includes(s) ? d[r].filter((x) => x !== s) : [...d[r], s],
    }));

  /** Every section for one role, on or off. */
  const toggleRole = (r: ManagedRole) =>
    setDraft((d) => ({
      ...d,
      [r]: d[r].length === ADMIN_SECTIONS.length ? [] : [...ADMIN_SECTIONS],
    }));

  /** One section for every role, on or off. */
  const toggleSection = (s: AdminSection) =>
    setDraft((d) => {
      const all = ROLES.every((r) => d[r.id].includes(s));
      const next = { ...d };
      for (const r of ROLES) {
        next[r.id] = all
          ? next[r.id].filter((x) => x !== s)
          : next[r.id].includes(s)
            ? next[r.id]
            : [...next[r.id], s];
      }
      return next;
    });

  const changed = ROLES.filter(
    (r) =>
      [...saved[r.id]].sort().join(",") !== [...draft[r.id]].sort().join(","),
  );

  const save = () => {
    if (changed.length === 0) return;
    setSaved(clone(draft));
    toast.success("Permissions saved");
  };

  if (!allowed) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <ErrorState
          icon={<ShieldOff />}
          title="You do not have access to role permissions"
          description="Only a super admin can change what a role may open."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Role permissions"
        description="What each role can open. Changing a role applies to everyone with it."
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings?tab=sub-admins">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <PrintButton />
          </>
        }
      />

      <PrintHeader title="Role permissions" rowCount={ROLES.length} />

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-sticky border-b border-r border-border bg-canvas p-3 text-left text-small font-semibold text-ink"
                >
                  Role
                </th>
                {ADMIN_SECTIONS.map((s) => (
                  <th
                    key={s}
                    scope="col"
                    className="border-b border-border bg-canvas p-3 text-center"
                  >
                    {/* Clicking a heading sets that section for every role. */}
                    <button
                      type="button"
                      onClick={() => toggleSection(s)}
                      className="whitespace-nowrap text-small font-medium text-ink hover:text-action-press print:hover:text-ink"
                    >
                      {SECTION_LABEL[s]}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-sticky border-b border-r border-border bg-surface p-3 text-left"
                  >
                    {/* Clicking a role name sets every section for it. */}
                    <button
                      type="button"
                      onClick={() => toggleRole(r.id)}
                      className="whitespace-nowrap text-small font-medium text-ink hover:text-action-press print:hover:text-ink"
                    >
                      {r.label}
                    </button>
                  </th>
                  {ADMIN_SECTIONS.map((s) => (
                    <td
                      key={s}
                      className="border-b border-border p-3 text-center"
                    >
                      <Switch
                        checked={has(r.id, s)}
                        onCheckedChange={() => toggle(r.id, s)}
                        aria-label={`${SECTION_LABEL[s]} for ${r.label}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDraft(clone(saved))}
          disabled={changed.length === 0}
        >
          Discard
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={save}
          disabled={changed.length === 0}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
