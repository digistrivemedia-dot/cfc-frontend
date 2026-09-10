"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Globe, LogOut, Moon, Star } from "lucide-react";
import {
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
import { useSession } from "@/lib/session";

/**
 * Customer 43 and 44 — settings, and the legal pages.
 *
 * Both on one route: 44 is three documents and a version number, which is a
 * section rather than a screen a customer navigates to on purpose.
 *
 * Two controls here are deliberately **disabled with a reason on screen**:
 *
 *   Language — the agreement names five languages (clause 4.6) and the
 *   translation bundle is another team's scope. A switcher offering four
 *   options that do nothing is worse than one that says it is coming.
 *
 *   Dark mode — `darkMode` is declared in the Tailwind preset but
 *   `tokens.css` has no dark block, so `data-theme="dark"` currently changes
 *   nothing. The toggle is wired and persists; it says plainly that the theme
 *   itself has not landed. See CONSUMER-OPEN-ITEMS 3.2.
 *
 * Notification preferences are real: they are per-device and stored locally,
 * which is honest given nothing server-side receives them yet.
 */

const NOTIFY_KEY = "cfc_notify_prefs";
const THEME_KEY = "cfc_theme";

type NotifyPrefs = {
  bookings: boolean;
  offers: boolean;
  reminders: boolean;
};

const NOTIFY_DEFAULTS: NotifyPrefs = {
  bookings: true,
  // Marketing is opt-in by default off, which is both the decent choice and
  // what most jurisdictions expect.
  offers: false,
  reminders: true,
};

const NOTIFY_ROWS: { key: keyof NotifyPrefs; label: string; body: string }[] = [
  {
    key: "bookings",
    label: "Booking updates",
    body: "When a professional accepts, arrives, or finishes a job.",
  },
  {
    key: "reminders",
    label: "Reminders",
    body: "Upcoming bookings, and a nudge to rate a finished one.",
  },
  {
    key: "offers",
    label: "Offers and promotions",
    body: "Discounts and seasonal offers. Off by default.",
  },
];

/** The five languages named in clause 4.6, for customer screens. */
const LANGUAGES = [
  { code: "en", label: "English", available: true },
  { code: "ta", label: "தமிழ் · Tamil", available: false },
  { code: "kn", label: "ಕನ್ನಡ · Kannada", available: false },
  { code: "hi", label: "हिन्दी · Hindi", available: false },
  { code: "te", label: "తెలుగు · Telugu", available: false },
];

const APP_VERSION = "0.1.0";

export default function SettingsPage() {
  const router = useRouter();
  const { signedIn, signOut } = useSession();
  const [notify, setNotify] = React.useState<NotifyPrefs>(NOTIFY_DEFAULTS);
  const [dark, setDark] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIFY_KEY);
      if (raw) setNotify({ ...NOTIFY_DEFAULTS, ...JSON.parse(raw) });
      setDark(localStorage.getItem(THEME_KEY) === "dark");
    } catch {
      // Private mode. Defaults are correct.
    }
  }, []);

  const setPref = (key: keyof NotifyPrefs, value: boolean) => {
    const next = { ...notify, [key]: value };
    setNotify(next);
    try {
      localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: the preference just does not survive a reload.
    }
  };

  const setTheme = (value: boolean) => {
    setDark(value);
    try {
      localStorage.setItem(THEME_KEY, value ? "dark" : "light");
      // Set regardless, so the moment the dark tokens land this already works.
      document.documentElement.dataset["theme"] = value ? "dark" : "light";
    } catch {
      // Ignored.
    }
    toast.success(
      value
        ? "Saved. Dark mode appears once the theme is released."
        : "Back to the light theme.",
    );
  };

  return (
    <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12">
      <h1 className="text-title font-semibold text-ink">Settings</h1>

      {/* Notifications — genuinely functional. */}
      <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Notifications
        </h2>
        <ul className="divide-y divide-border-soft">
          {NOTIFY_ROWS.map((row) => (
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
      </section>

      {/* Appearance and language — both pending, both saying so. */}
      <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Appearance and language
        </h2>

        <div className="flex items-start justify-between gap-4 border-b border-border-soft p-4">
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <Moon className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="text-small font-medium text-ink">Dark mode</span>
              <Badge tone="clock">Coming soon</Badge>
            </span>
            <span className="mt-px block text-caption text-ink-muted">
              Your choice is saved and applies as soon as the dark theme is
              released.
            </span>
          </span>
          <Switch
            checked={dark}
            onCheckedChange={setTheme}
            aria-label="Dark mode"
          />
        </div>

        <button
          type="button"
          onClick={() => setLangOpen(true)}
          className="flex min-h-touch w-full items-center gap-3 p-4 text-left transition-colors duration-fast hover:bg-canvas"
        >
          <Globe className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-small font-medium text-ink">
              Language
            </span>
            <span className="block text-caption text-ink-muted">English</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </button>
      </section>

      {/* Customer 44 — legal, version, and the rating CTA. */}
      <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          About
        </h2>
        <ul className="divide-y divide-border-soft">
          <li>
            <LegalRow label="Terms of service" href="/legal/terms" />
          </li>
          <li>
            <LegalRow label="Privacy policy" href="/legal/privacy" />
          </li>
          <li>
            <LegalRow label="Refund and cancellation" href="/legal/refunds" />
          </li>
          <li className="flex items-center justify-between gap-4 p-4">
            <span className="text-small text-ink">App version</span>
            <span className="tabular text-caption text-ink-muted">
              {APP_VERSION}
            </span>
          </li>
        </ul>
      </section>

      {/* The rating CTA. A web app has no store listing, so this points at the
          in-app review flow rather than a Play Store URL that does not exist
          yet. */}
      <section className="mt-4 rounded-card border border-border bg-canvas p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-clock-subtle text-clock-ink">
            <Star className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-medium text-ink">
              Enjoying City Family Care?
            </p>
            <p className="text-caption text-ink-muted">
              Rate a completed booking — it helps the professionals who did the
              work.
            </p>
          </div>
        </div>
        <Button variant="secondary" className="mt-3 w-full" asChild>
          <Link href="/bookings?tab=completed">Rate a booking</Link>
        </Button>
      </section>

      {/* Sign out actually ends the session. It used to be a link to /login,
          which navigated but left the customer signed in — the same defect the
          header menu had. It is also hidden from a visitor who has no session
          to end: "Sign out" offered to someone who never signed in reads as a
          broken screen.

          Settings itself stays public, because language, dark mode and
          notification preferences are per-device and mean something before
          there is an account. */}
      {signedIn && (
        <Button
          variant="ghost"
          className="mt-4 w-full text-critical-ink"
          onClick={() => {
            signOut();
            router.push("/");
          }}
        >
          <LogOut />
          Sign out
        </Button>
      )}

      <Sheet open={langOpen} onOpenChange={setLangOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Language</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            <InlineAlert tone="info" title="More languages coming">
              The app will be available in Tamil, Kannada, Hindi and Telugu.
              Only English is ready today.
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
    </div>
  );
}

function LegalRow({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-touch items-center gap-3 p-4 transition-colors duration-fast hover:bg-canvas"
    >
      <span className="min-w-0 flex-1 text-small text-ink">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
    </Link>
  );
}
