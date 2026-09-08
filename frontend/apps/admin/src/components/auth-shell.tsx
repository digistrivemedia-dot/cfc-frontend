"use client";

import * as React from "react";
import {
  ClipboardCheck,
  Lock,
  MapPin,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@cfc/ui";

/**
 * The frame around login and forgot-password.
 *
 * Brand panel on the left in the CFC cyan, form on white at the right.
 *
 * Navy carries the panel. It is the same structure colour as the console's rail,
 * so signing in previews the product rather than introducing a colour that
 * appears nowhere after this screen.
 *
 * A teal panel was tried and abandoned on contrast: the bright brand cyan puts
 * white text at 2.4:1, and the logo artwork is #03b2cd, so a cyan mark vanishes
 * into a cyan ground while a white one cannot clear even the 3:1 graphic floor.
 * On navy the white mark and white text both sit above 12:1.
 *
 * The panel earns its half through content, not decoration: the mark, the name,
 * one line on what the console does, and three facts drawn from the agreement.
 */

/** How the console works, in three words. */
const TRUST_MARKS = [
  { icon: Lock, label: "Secure" },
  { icon: Zap, label: "Real-time" },
  { icon: ShieldCheck, label: "Role-based" },
] as const;

export interface AuthRole {
  value: string;
  /** Short label for the segmented control. */
  short: string;
  /** Full name, used in the accessible label and the scope line. */
  label: string;
  /** One line on what the role covers. */
  hint: string;
  icon: LucideIcon;
}

/**
 * The default role. Declared separately from the list so the fallback below is
 * provably defined — an index into a readonly array is not, under
 * noUncheckedIndexedAccess.
 */
const SUPER_ADMIN: AuthRole = {
  value: "super",
  short: "Super",
  label: "Super Admin",
  hint: "Full platform control",
  icon: ShieldCheck,
};

/** The three admin roles the agreement defines. */
export const AUTH_ROLES: readonly AuthRole[] = [
  SUPER_ADMIN,
  {
    value: "sub",
    short: "Sub",
    label: "Sub Admin",
    hint: "Day-to-day operations",
    icon: ClipboardCheck,
  },
  {
    value: "area",
    short: "Area",
    label: "Area Admin",
    hint: "One assigned area",
    icon: MapPin,
  },
];

export function AuthShell({
  title,
  subtitle,
  children,
  aside,
  role,
  onRoleChange,
}: {
  title: string;
  subtitle?: string | undefined;
  children: React.ReactNode;
  /** Shown under the form — a link back, a note. */
  aside?: React.ReactNode | undefined;
  /** Omit the pair to render without a role selector. */
  role?: string | undefined;
  onRoleChange?: ((value: string) => void) | undefined;
}) {
  const withRoles = role !== undefined && onRoleChange !== undefined;
  const current = AUTH_ROLES.find((r) => r.value === role) ?? SUPER_ADMIN;
  const CurrentIcon = current.icon;

  return (
    <div className="min-h-screen bg-surface lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      {/* ------------------------------------------------------------------
          Brand panel.
          ------------------------------------------------------------------ */}
      <aside className="relative overflow-hidden bg-structure px-6 py-8 lg:flex lg:items-center lg:justify-center lg:p-12">
        <Backdrop />

        {/* Phone: a centred band. Centred rather than a left-aligned row so
            it reads as a header for the form below it rather than as a
            truncated corner logo. */}
        <div className="relative flex flex-col items-center gap-3 text-center lg:hidden">
          <Logo className="size-12 text-brand" />
          <div className="min-w-0">
            <p className="text-heading font-semibold leading-tight text-on-structure">
              City Family Care
            </p>
            <p className="mt-px text-caption text-on-structure-muted">
              Operations console
            </p>
          </div>
        </div>

        {/* Desktop: the centred composition. */}
        <div className="relative hidden w-full max-w-sm flex-col items-center text-center lg:flex">
          <Logo className="size-logo text-brand" />

          <h2 className="mt-8 text-display font-semibold leading-tight text-on-structure">
            City Family Care
          </h2>

          <div
            className="mt-5 h-px w-12 bg-on-structure-faint"
            aria-hidden="true"
          />

          <p className="mt-5 text-body leading-relaxed text-on-structure-muted">
            Operations console — manage quotations, bookings, pros and payouts
            in one place.
          </p>

          {/* Three facts, each straight from the agreement: RBAC across seven
              roles, the fifteen-minute quotation window, and the live-tracking
              board. Nothing here is a claim we cannot point at a clause for. */}
          <ul className="mt-8 flex flex-wrap items-start justify-center gap-x-8 gap-y-4">
            {TRUST_MARKS.map((t) => (
              <li key={t.label} className="flex flex-col items-center gap-2">
                <span
                  className="text-on-structure-muted [&_svg]:size-5"
                  aria-hidden="true"
                >
                  <t.icon />
                </span>
                <span className="text-caption text-on-structure-muted">
                  {t.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ------------------------------------------------------------------
          Form. Plain white — no card, nothing floating.
          ------------------------------------------------------------------ */}
      <main className="flex flex-1 flex-col justify-center px-6 py-8 lg:overflow-y-auto lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="space-y-1">
            <h1 className="text-title font-semibold text-ink">{title}</h1>
            {subtitle && (
              <p className="text-small leading-relaxed text-ink-muted">
                {subtitle}
              </p>
            )}
          </div>

          {withRoles && (
            <div className="mt-6">
              <div
                role="radiogroup"
                aria-label="Admin role"
                className="grid grid-cols-3 gap-1 rounded-control bg-neutral-subtle p-1"
              >
                {AUTH_ROLES.map((r) => {
                  const on = r.value === role;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => onRoleChange(r.value)}
                      className={cn(
                        "rounded-pill px-2 py-2 text-small transition-colors duration-fast",
                        on
                          ? "bg-action font-semibold text-on-action shadow-sm"
                          : "font-medium text-ink-muted hover:text-ink",
                      )}
                    >
                      <span className="sr-only">{r.label}</span>
                      <span aria-hidden="true">{r.short}</span>
                    </button>
                  );
                })}
              </div>

              {/* The selected role's scope, so three-letter labels are not the
                  only thing telling someone what they picked. */}
              <p className="mt-2 flex items-center gap-2 text-caption text-ink-muted">
                <CurrentIcon
                  className="size-4 shrink-0 text-action"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-medium text-ink">{current.label}</span>
                  {" — "}
                  {current.hint}
                </span>
              </p>
            </div>
          )}

          <div className="mt-6">{children}</div>

          {aside && (
            <div className="mt-8 text-center text-small text-ink-muted">
              {aside}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Two washes so the navy is not a flat slab: brand cyan lifting the lower left,
 * a raised navy warming the upper right. Both are already in the palette, and
 * both stay far enough from the ground to register without becoming a pattern.
 */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -bottom-wash -left-wash size-ring-lg rounded-full bg-brand opacity-20 blur-3xl" />
      <div className="absolute -right-wash -top-wash size-ring-lg rounded-full bg-structure-raised opacity-60 blur-3xl" />
    </div>
  );
}

/**
 * The mark: a shield holding a house.
 *
 * Drawn rather than loaded from the supplied PNG. The artwork bakes a wordmark
 * under the shield, so at any size that fits a layout the shield is about 40% of
 * the box and the type below it is unreadable — and the name is already set in
 * real text beside it here. Drawn also means it inherits colour from a token and
 * stays crisp at every size, which a raster cannot.
 *
 * The client artwork remains in /public for anywhere the full lockup is wanted.
 */
export function Logo({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      {/* Shield outline */}
      <path
        d="M24 3.5 6.5 10.2v13.2c0 10.6 7.2 18.9 17.5 21.6 10.3-2.7 17.5-11 17.5-21.6V10.2L24 3.5Z"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* House, filled so it reads as a solid mark at small sizes */}
      <path
        d="M24 14.5 33.5 22v10.5a1.5 1.5 0 0 1-1.5 1.5h-6v-7h-4v7h-6a1.5 1.5 0 0 1-1.5-1.5V22L24 14.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
