"use client";

import * as React from "react";
import Link from "next/link";
import { Globe, LogOut } from "lucide-react";
import {
  Badge,
  Button,
  InlineAlert,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  cn,
} from "@cfc/ui";
import { signOut } from "@/lib/pro-session";

/**
 * Pro 33 — settings.
 *
 * "Notification preferences, language, account deactivation."
 *
 * ## The notification switches were removed
 *
 * The client asked for them to go: the office operates notifications from the
 * admin panel, and a pro does not switch their own on and off. The rows stay,
 * so a pro can still read what they receive - removing the list as well would
 * leave them guessing.
 *
 * Job alerts were already locked on, for a reason that still holds: a pro who
 * turned those off would stop receiving work and conclude the platform had
 * stopped sending it. The correct control for "stop sending me work" is going
 * offline or holiday mode, which the row still points at.
 *
 * ## Language is parked, and labelled honestly
 *
 * Clause 4.6 names five languages for **customer** screens; the pro app is not
 * in that clause at all. So this is not even a deferred commitment — it is a
 * reasonable expectation with no contractual backing, and the screen says the
 * app is English for now rather than offering four options that do nothing.
 *
 * ## There is no "deactivate my account"
 *
 * It was a request to the office, built that way because whether a pro may
 * self-deactivate is not stated in the agreement (PRO-OPEN-ITEMS 1.6). The
 * client asked for the option to be removed, so a pro who wants to leave
 * contacts the office - which the line at the foot of this screen already says.
 */

/**
 * The notification types a pro receives.
 *
 * There is no stored preference behind these any more. The client asked for
 * the pro's toggles to be removed and the CFC office to operate them, so this
 * is a list of what arrives rather than a set of controls - and a stored value
 * nothing can change is a value that will drift out of step with whatever the
 * office has set.
 */
type NotifyKey = "payouts" | "quotations" | "announcements";

const ROWS: { key: NotifyKey; label: string; body: string }[] = [
  {
    key: "payouts",
    label: "Payment updates",
    body: "When earnings clear and when a payout reaches your account.",
  },
  {
    key: "quotations",
    label: "Quotation decisions",
    body: "When an admin approves or rejects a quotation you submitted.",
  },
  {
    key: "announcements",
    label: "Announcements from CFC",
    body: "Policy changes, new services and platform notices.",
  },
];

const LANGUAGES = [
  { code: "en", label: "English", available: true },
  { code: "ta", label: "தமிழ் · Tamil", available: false },
  { code: "hi", label: "हिन्दी · Hindi", available: false },
];

export default function ProSettingsPage() {
  const [langOpen, setLangOpen] = React.useState(false);


  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <h1 className="text-title font-semibold text-ink">Settings</h1>

      {/* Notifications. */}
      <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Notifications
        </h2>

        {/* Job alerts, locked on with the reason. */}
        <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-canvas p-4">
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-small font-medium text-ink">
                New job alerts
              </span>
              <Badge tone="live">Always on</Badge>
            </span>
            <span className="mt-px block text-caption text-ink-muted">
              To stop receiving jobs, go offline or turn on holiday mode.
            </span>
          </span>
        </div>

        <ul className="divide-y divide-border-soft">
          {ROWS.map((row) => (
            <li
              key={row.key}
              className="flex items-start justify-between gap-4 p-4"
            >
              <span className="min-w-0">
                <span className="block text-small font-medium text-ink">
                  {row.label}
                </span>
                <span className="block text-caption text-ink-muted">
                  {row.body}
                </span>
              </span>

            </li>
          ))}
        </ul>

        {/* Set by the CFC office, not here - the client asked for the pro's
            toggles to be removed and the admin to operate them. The list stays
            so a pro can still see what they receive. */}
        <p className="border-t border-border px-4 py-2 text-caption text-ink-muted">
          Set by the CFC office.
        </p>
      </section>

      {/* Language. */}
      <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Language
        </h2>
        <button
          type="button"
          onClick={() => setLangOpen(true)}
          className="flex min-h-touch w-full items-center gap-3 p-4 text-left transition-colors duration-fast hover:bg-canvas"
        >
          <Globe className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-small font-medium text-ink">
              App language
            </span>
            <span className="block text-caption text-ink-muted">English</span>
          </span>
          <Badge tone="neutral">Coming soon</Badge>
        </button>
      </section>

      {/* The Account section held only "Deactivate my account", which the
          client asked to be removed - a pro who wants to leave contacts the
          office, which the line at the foot of this screen already says. The
          section went with it rather than leaving an empty card. */}

      <Button
        variant="ghost"
        className="mt-4 w-full text-critical-ink"
        onClick={() => {
          signOut();
          window.location.href = "/login";
        }}
      >
        <LogOut />
        Sign out
      </Button>

      {/* Language sheet. */}
      <Sheet open={langOpen} onOpenChange={setLangOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>App language</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            <InlineAlert tone="info" title="English only for now">
              The CFC Pro app is in English. More languages are being added to
              the customer app first.
            </InlineAlert>

            <ul className="divide-y divide-border-soft overflow-hidden rounded-control border border-border">
              {LANGUAGES.map((l) => (
                <li
                  key={l.code}
                  className={cn(
                    "flex items-center justify-between gap-3 p-3",
                    !l.available && "bg-canvas",
                  )}
                >
                  <span
                    className={cn(
                      "text-small",
                      l.available ? "font-medium text-ink" : "text-ink-muted",
                    )}
                  >
                    {l.label}
                  </span>
                  {l.available ? (
                    <Badge tone="live" dot>
                      Selected
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Soon</Badge>
                  )}
                </li>
              ))}
            </ul>
          </SheetBody>
        </SheetContent>
      </Sheet>


      <p className="mt-6 text-center text-caption text-ink-faint">
        Need something changed on your account?{" "}
        <Link href="/support" className="font-medium text-action hover:underline">
          Contact the office
        </Link>
      </p>
    </div>
  );
}
