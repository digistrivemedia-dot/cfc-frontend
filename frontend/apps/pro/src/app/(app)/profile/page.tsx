"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronRight,
  Copy,
  LifeBuoy,
  LogOut,
  PencilLine,
  ScrollText,
  Settings,
  ShieldAlert,
  Star,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { getPro, getProDayStats } from "@cfc/mocks";
import type { ProDayStats, ProDetail } from "@cfc/types";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  ErrorState,
  Skeleton,
  StarRating,
  cn,
  formatCurrency,
  initials,
  toast,
} from "@cfc/ui";
import { currentProId, signOut } from "@/lib/pro-session";

/**
 * Pro 26 — my profile.
 *
 * "Photo, name, rating badge, verified tag, CFC Pro ID, skill tags."
 *
 * ## The CFC Pro ID is the useful part
 *
 * It is what a pro quotes to support, what an admin searches by, and what a
 * customer is told to check. So it is copyable in one tap rather than something
 * to read off a screen and retype into a phone call — that is the difference
 * between a support call that starts with the right record open and one that
 * starts with three attempts at a number.
 *
 * ## The rating carries its consequence
 *
 * A rating on this screen is not a vanity figure: below **2.5** the platform
 * auto-blocks the pro. Showing 2.7 as a neutral number, with the threshold
 * invisible until the block lands, would be the platform hiding the one thing
 * about a pro's account that most needs saying. So the number is shown with the
 * threshold, and a rating approaching it gets a warning rather than a colour.
 *
 * ## This screen is also the mobile menu
 *
 * The desktop rail carries Notifications, Warnings and Support; a phone has
 * four bottom tabs and no room for them. Rather than a fifth "More" tab that
 * exists only to hold links, they live here — which is where a pro would look
 * for their own account anyway.
 */

export default function ProProfilePage() {
  const proId = React.useMemo(() => currentProId(), []);

  const [pro, setPro] = React.useState<ProDetail | null>(null);
  const [stats, setStats] = React.useState<ProDayStats | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    let cancelled = false;
    void Promise.all([getPro(proId), getProDayStats(proId)])
      .then(([p, s]) => {
        if (cancelled) return;
        setPro(p);
        setStats(s);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  if (failed) {
    return (
      <div className="mx-auto max-w-detail px-4 py-12 md:px-6">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your profile"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  if (pro === null) {
    return (
      <div className="mx-auto max-w-detail px-4 py-4 md:px-6">
        <Skeleton className="h-block-sm w-full rounded-card" />
        <Skeleton className="mt-4 h-block-sm w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <IdentityCard pro={pro} />

      {pro.blocked && <BlockedNotice />}

      <RatingCard pro={pro} stats={stats} />

      <SkillTags pro={pro} />

      {/* Manage. */}
      <SectionLinks
        title="Manage"
        links={[
          {
            href: "/profile/edit",
            label: "Edit profile",
            body: "Bio, experience, service areas and contact details.",
            icon: <PencilLine className="size-5" aria-hidden="true" />,
          },
          {
            href: "/profile/services",
            label: "Your services",
            body: "Which services you are taking work for right now.",
            icon: <Wrench className="size-5" aria-hidden="true" />,
          },
          {
            href: "/profile/availability",
            label: "Availability",
            body: "Your working week, off days and holiday mode.",
            icon: <CalendarDays className="size-5" aria-hidden="true" />,
          },
          {
            href: "/reviews",
            label: "Ratings and reviews",
            body: "What customers said about your work.",
            icon: <Star className="size-5" aria-hidden="true" />,
          },
        ]}
      />

      {/* The rail's secondary destinations, which a phone has no room for. */}
      <SectionLinks
        title="Account"
        className="md:hidden"
        links={[
          {
            href: "/notifications",
            label: "Notifications",
            body: "Job alerts, payouts and announcements.",
            icon: <Bell className="size-5" aria-hidden="true" />,
          },
          {
            href: "/warnings",
            label: "Warnings and penalties",
            body: "Any active warnings on your account.",
            icon: <ShieldAlert className="size-5" aria-hidden="true" />,
          },
          {
            href: "/support",
            label: "Help and support",
            body: "Talk to the CFC team.",
            icon: <LifeBuoy className="size-5" aria-hidden="true" />,
          },
        ]}
      />

      <SectionLinks
        title="More"
        links={[
          {
            href: "/conduct",
            label: "Partner Code of Conduct",
            body: "The rules you agreed to, and the penalties behind them.",
            icon: <ScrollText className="size-5" aria-hidden="true" />,
          },
          {
            href: "/settings",
            label: "Settings",
            body: "Notifications, language and your account.",
            icon: <Settings className="size-5" aria-hidden="true" />,
          },
        ]}
      />

      <Button
        variant="ghost"
        className="mt-4 w-full text-critical-ink"
        onClick={() => {
          signOut();
          // A full navigation rather than a client push: signing out should
          // discard every piece of in-memory state, including the online
          // status, not carry it into the next session.
          window.location.href = "/login";
        }}
      >
        <LogOut />
        Sign out
      </Button>
    </div>
  );
}

// -- Identity ----------------------------------------------------------------

function IdentityCard({ pro }: { pro: ProDetail }) {
  const proId = pro.id.replace("pro_", "");

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(`CFC-${proId}`);
      toast.success("Pro ID copied.");
    } catch {
      // Clipboard needs a secure context and permission. The ID is on screen
      // regardless, so this is a convenience failing, not a broken screen.
      toast.error("Could not copy. Your Pro ID is CFC-" + proId);
    }
  };

  return (
    <section className="overflow-hidden rounded-card bg-structure">
      <div className="flex items-start gap-4 p-5">
        <Avatar className="size-tile-lg shrink-0">
          <AvatarFallback>{initials(pro.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title font-semibold text-on-structure">
            {pro.name}
          </h1>

          {/* Verified is a real state from the KYC flow, not decoration. */}
          {pro.approvalStatus === "approved" && !pro.blocked && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-pill bg-live-subtle px-2 py-px text-caption font-medium text-live-ink">
              <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
              Verified professional
            </p>
          )}

          <p className="mt-2 text-small text-on-structure-muted">
            {pro.experienceYears} years experience · {pro.area}
          </p>
        </div>
      </div>

      {/* The ID, copyable. What support and admin search by. */}
      <div className="flex items-center justify-between gap-3 border-t border-structure-line px-5 py-3">
        <span className="min-w-0">
          <span className="block text-caption text-on-structure-faint">
            Your CFC Pro ID
          </span>
          <span className="block tabular text-body font-semibold text-on-structure">
            CFC-{proId}
          </span>
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void copyId()}
        >
          <Copy />
          Copy
        </Button>
      </div>
    </section>
  );
}

/**
 * Blocked.
 *
 * The most consequential thing that can be true about a pro's account, so it
 * sits directly under their name and says what to do. A blocked pro receives no
 * job alerts at all — leaving them to work that out from an empty dashboard
 * would be cruel as well as useless.
 */
function BlockedNotice() {
  return (
    <section className="mt-4 rounded-card border border-critical-line bg-critical-subtle p-4">
      <p className="flex items-start gap-2 text-small font-semibold text-critical-ink">
        <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
        Your account is blocked
      </p>
      <p className="mt-1 text-caption text-critical-ink">
        You will not receive job alerts while your account is blocked. Contact
        the CFC office to find out why and what is needed to restore it.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/warnings">See your warnings</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/support">Contact support</Link>
        </Button>
      </div>
    </section>
  );
}

/**
 * The rating, with the rule attached.
 *
 * `AUTO_BLOCK_RATING` is from the agreement. A pro at 2.7 is one bad week from
 * losing their account, and a bare number does not convey that.
 */
const AUTO_BLOCK_RATING = 2.5;

/** How close to the threshold counts as worth warning about. */
const RATING_WARN_BAND = 0.5;

function RatingCard({
  pro,
  stats,
}: {
  pro: ProDetail;
  stats: ProDayStats | null;
}) {
  const atRisk =
    pro.rating > 0 && pro.rating < AUTO_BLOCK_RATING + RATING_WARN_BAND;

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
      <div className="grid grid-cols-2 divide-x divide-border-soft">
        <div className="p-4">
          <p className="text-caption text-ink-muted">Your rating</p>
          {pro.rating > 0 ? (
            <>
              <p className="mt-px tabular text-title font-semibold text-ink">
                {pro.rating.toFixed(1)}
              </p>
              <StarRating value={pro.rating} className="mt-1" />
            </>
          ) : (
            <p className="mt-px text-body text-ink-muted">Not rated yet</p>
          )}
        </div>

        <div className="p-4">
          <p className="text-caption text-ink-muted">Jobs completed</p>
          <p className="mt-px tabular text-title font-semibold text-ink">
            {pro.jobsCompleted}
          </p>
          {stats !== null && stats.totalEarnedNetPaise > 0 && (
            <p className="mt-1 text-caption text-ink-muted">
              {formatCurrency(stats.totalEarnedNetPaise, { compact: true })}{" "}
              earned
            </p>
          )}
        </div>
      </div>

      {/* The threshold. Shown as a plain fact when the rating is healthy, and
          as a warning when it is not — but never hidden, because a rule that
          can end a pro's account should not be a surprise. */}
      <p
        className={cn(
          "border-t px-4 py-2 text-caption",
          atRisk
            ? "border-critical-line bg-critical-subtle text-critical-ink"
            : "border-border text-ink-muted",
        )}
      >
        {atRisk
          ? `Your rating is close to the ${AUTO_BLOCK_RATING} minimum. Accounts below ${AUTO_BLOCK_RATING} are blocked automatically — talk to the office if you need support.`
          : `Accounts are blocked automatically if the rating falls below ${AUTO_BLOCK_RATING}.`}
      </p>
    </section>
  );
}

/**
 * Skill tags.
 *
 * Read-only, and the line underneath says why. A pro who taps a skill expecting
 * to add one and finds nothing happens will conclude the app is broken; told
 * that the office approves skills, they know who to ask.
 */
function SkillTags({ pro }: { pro: ProDetail }) {
  return (
    <section className="mt-4 rounded-card border border-border bg-surface p-4">
      <h2 className="text-small font-semibold text-ink">Your skills</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {pro.services.map((skill) => (
          <li key={skill}>
            <Badge tone="neutral">{skill}</Badge>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-ink-muted">
        Skills are approved by the CFC office. To add one, contact support with
        any certificate or proof of experience you have.
      </p>
    </section>
  );
}

// -- Link sections -----------------------------------------------------------

function SectionLinks({
  title,
  links,
  className,
}: {
  title: string;
  links: {
    href: string;
    label: string;
    body: string;
    icon: React.ReactNode;
  }[];
  className?: string | undefined;
}) {
  return (
    <section
      className={cn(
        "mt-4 overflow-hidden rounded-card border border-border bg-surface",
        className,
      )}
    >
      <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
        {title}
      </h2>
      <ul className="divide-y divide-border-soft">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-touch items-center gap-3 p-4 transition-colors duration-fast hover:bg-canvas"
            >
              <span className="shrink-0 text-ink-muted">{link.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-small font-medium text-ink">
                  {link.label}
                </span>
                <span className="block text-caption text-ink-muted">
                  {link.body}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-ink-faint"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
