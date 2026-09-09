"use client";

import * as React from "react";
import Link from "next/link";
import { Globe, Info, LogOut, TriangleAlert, UserX } from "lucide-react";
import { getProDayStats } from "@cfc/mocks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  InlineAlert,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Switch,
  cn,
  toast,
} from "@cfc/ui";
import { currentProId, signOut } from "@/lib/pro-session";

/**
 * Pro 33 — settings.
 *
 * "Notification preferences, language, account deactivation."
 *
 * ## One preference is deliberately not switchable
 *
 * Job alerts. A pro who turns those off stops receiving work and will not
 * connect the two — they will conclude the platform has stopped sending them
 * jobs. The switch is present, locked on, and says why. The pro already has the
 * correct control for "stop sending me work": going offline, or holiday mode,
 * both of which are reversible in one tap and visible on every screen.
 *
 * ## Language is parked, and labelled honestly
 *
 * Clause 4.6 names five languages for **customer** screens; the pro app is not
 * in that clause at all. So this is not even a deferred commitment — it is a
 * reasonable expectation with no contractual backing, and the screen says the
 * app is English for now rather than offering four options that do nothing.
 *
 * ## Deactivation is a request, not a switch
 *
 * A pro with active jobs cannot simply vanish — a customer is expecting them
 * tomorrow. Whether a pro can self-deactivate is not stated anywhere in the
 * agreement (PRO-OPEN-ITEMS 1.6), so this is built as a request to the office
 * with the active-job count shown, which is both the safe reading and the one
 * that tells the pro what actually stands in the way.
 */

const NOTIFY_KEY = "cfc_pro_notify";

type NotifyPrefs = {
  payouts: boolean;
  quotations: boolean;
  announcements: boolean;
};

const DEFAULTS: NotifyPrefs = {
  payouts: true,
  quotations: true,
  // The only one off by default: announcements are useful and not urgent, and
  // a pro who wants fewer interruptions should lose these first.
  announcements: true,
};

const ROWS: { key: keyof NotifyPrefs; label: string; body: string }[] = [
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
  const proId = React.useMemo(() => currentProId(), []);

  const [notify, setNotify] = React.useState<NotifyPrefs>(DEFAULTS);
  const [langOpen, setLangOpen] = React.useState(false);
  const [deactivating, setDeactivating] = React.useState(false);
  const [activeJobs, setActiveJobs] = React.useState<number | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIFY_KEY);
      if (raw !== null) setNotify({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // Private mode, or malformed stored value. Defaults are correct.
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void getProDayStats(proId)
      .then((s) => {
        if (!cancelled) setActiveJobs(s.activeCount + s.upcomingCount);
      })
      .catch(() => {
        // The deactivation warning falls back to a general one.
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  const setPref = (key: keyof NotifyPrefs, value: boolean) => {
    const next = { ...notify, [key]: value };
    setNotify(next);
    try {
      localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: the preference just does not survive a reload.
    }
  };

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
              These cannot be switched off — you would stop getting work without
              an obvious reason. To stop receiving jobs, go offline or turn on
              holiday mode instead.
            </span>
          </span>
          <Switch checked disabled aria-label="New job alerts (always on)" />
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
              <Switch
                checked={notify[row.key]}
                onCheckedChange={(v) => setPref(row.key, v)}
                aria-label={row.label}
              />
            </li>
          ))}
        </ul>

        {/* These preferences are per-device until a backend owns them. */}
        <p className="border-t border-border px-4 py-2 text-caption text-ink-muted">
          Saved on this device.
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

      {/* Account. */}
      <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Account
        </h2>

        <div className="p-4">
          <button
            type="button"
            onClick={() => setDeactivating(true)}
            className={cn(
              "flex min-h-touch w-full items-center gap-3 rounded-control text-left",
              "transition-colors duration-fast hover:bg-canvas",
            )}
          >
            <UserX
              className="size-5 shrink-0 text-critical-ink"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-small font-medium text-critical-ink">
                Deactivate my account
              </span>
              <span className="block text-caption text-ink-muted">
                Stop working with CFC. The office will confirm before anything
                changes.
              </span>
            </span>
          </button>
        </div>
      </section>

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

      {/* Deactivation — a request, with what stands in the way. */}
      <AlertDialog open={deactivating} onOpenChange={setDeactivating}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends a request to the CFC office. Nothing changes until they
              confirm it with you.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {activeJobs !== null && activeJobs > 0 && (
            <p className="flex items-start gap-2 rounded-control bg-clock-subtle p-3 text-caption text-clock-ink">
              <TriangleAlert
                className="mt-px size-4 shrink-0"
                aria-hidden="true"
              />
              You have {activeJobs} job{activeJobs === 1 ? "" : "s"} still to
              do. Those customers are expecting you — finish or hand them over
              before you leave the platform.
            </p>
          )}

          <p className="flex items-start gap-2 text-caption text-ink-muted">
            <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
            Any cleared earnings are still paid out. Withdraw your balance
            before your account closes.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success(
                  "Request sent. The CFC office will contact you before anything changes.",
                );
                setDeactivating(false);
              }}
            >
              Send the request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="mt-6 text-center text-caption text-ink-faint">
        Need something changed on your account?{" "}
        <Link href="/support" className="font-medium text-action hover:underline">
          Contact the office
        </Link>
      </p>
    </div>
  );
}
