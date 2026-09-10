"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, Gift, Share2, Users } from "lucide-react";
import {
  REFERRAL_TERMS_ARE_PLACEHOLDER,
  getReferralProgramme,
} from "@cfc/mocks";
import type { ReferralProgramme } from "@cfc/types";
import {
  Button,
  ErrorState,
  InlineAlert,
  Skeleton,
  cn,
  formatCurrency,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";

/**
 * Customer 38 — Refer and earn.
 *
 * Inventory: "Referral code, share link, rewards tracker."
 *
 * The reward figures are placeholders and the screen says so.
 * `PLATFORM-FACTS.md` documents no referral programme — no reward, no minimum
 * spend, no cap — and a reward shown to a customer is a promise the business
 * then has to honour. Flipping `REFERRAL_TERMS_ARE_PLACEHOLDER` removes the
 * notice once the client sets real terms.
 */

function ReferPageInner() {
  const [programme, setProgramme] = React.useState<ReferralProgramme | null>(
    null,
  );
  const [error, setError] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    getReferralProgramme().then(setProgramme).catch(() => setError(true));
  }, []);

  React.useEffect(() => load(), [load]);

  const copy = (text: string, what: string) => {
    // `navigator.clipboard` needs a secure context. On plain HTTP it is
    // undefined, and calling it throws rather than failing quietly.
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Your browser will not let us copy. Select the code instead.");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${what} copied`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("We could not copy that."));
  };

  /**
   * The Web Share sheet, where it exists.
   *
   * `navigator.share` is the native share sheet on Android and iOS Safari and
   * absent on most desktops — so the button only appears where it works, and
   * copy is always available as the path that works everywhere.
   */
  const share = (p: ReferralProgramme) => {
    void navigator
      .share({
        title: "City Family Care",
        text: `Book verified home services with City Family Care. Use my code ${p.code}.`,
        url: p.shareUrl,
      })
      .catch(() => {
        // A cancelled share sheet rejects. That is not an error worth showing.
      });
  };

  const [canShare, setCanShare] = React.useState(false);
  React.useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not load this"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  if (programme === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="mt-3 h-block-sm rounded-card" />
      </div>
    );
  }

  const pending = programme.invited - programme.converted;

  return (
    <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12">
      <h1 className="text-title font-semibold text-ink">Refer and earn</h1>
      <p className="text-small text-ink-muted">
        Share your code. When a friend completes their first booking, you both
        benefit.
      </p>

      {REFERRAL_TERMS_ARE_PLACEHOLDER && (
        <div className="mt-3">
          <InlineAlert tone="clock" title="Sample terms">
            The reward amounts below are placeholders while the programme is
            being finalised.
          </InlineAlert>
        </div>
      )}

      {/* The code. The reason a customer opened this screen, so it leads. */}
      <section className="mt-4 rounded-card border border-action-line bg-action-subtle p-4 text-center">
        <p className="text-caption text-ink-muted">Your referral code</p>
        <p className="tabular mt-1 select-all text-display font-semibold tracking-wide text-ink">
          {programme.code}
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => copy(programme.code, "Code")}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy code"}
          </Button>

          {canShare ? (
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => share(programme)}
            >
              <Share2 />
              Share
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => copy(programme.shareUrl, "Link")}
            >
              <Copy />
              Copy link
            </Button>
          )}
        </div>
      </section>

      {/* How it works, in the order it happens. */}
      <section className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="text-small font-semibold text-ink">How it works</h2>
        <ol className="mt-3 space-y-3">
          <Step
            n={1}
            title="Share your code"
            body="Send it to anyone who books home services."
          />
          <Step
            n={2}
            title="They book"
            body={`Their first booking has to be ${formatCurrency(programme.minimumBookingPaise)} or more.`}
          />
          <Step
            n={3}
            title="You are credited"
            body={`${formatCurrency(programme.rewardPerReferralPaise)} goes straight into your wallet once the job is complete.`}
          />
        </ol>
      </section>

      {/* Customer 38 — the rewards tracker. */}
      <section className="mt-4 rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Your referrals
        </h2>

        <dl className="grid grid-cols-3 gap-px bg-border">
          <Tracker
            label="Invited"
            value={String(programme.invited)}
            icon={<Users />}
          />
          <Tracker
            label="Booked"
            value={String(programme.converted)}
            icon={<Check />}
          />
          <Tracker
            label="Earned"
            value={formatCurrency(programme.earnedPaise)}
            icon={<Gift />}
          />
        </dl>

        {/* The honest reading of the numbers. A tracker showing 4 invited and
            1 booked without explanation reads as three failures. */}
        {programme.invited > 0 && (
          <p className="px-4 py-3 text-caption text-ink-muted">
            {pending === 0
              ? "Everyone you invited has booked."
              : `${pending} ${pending === 1 ? "friend has" : "friends have"} used your code but not booked yet. You are credited when they do.`}
          </p>
        )}

        {programme.invited === 0 && (
          <p className="px-4 py-3 text-caption text-ink-muted">
            Nobody has used your code yet.
          </p>
        )}
      </section>

      {programme.earnedPaise > 0 && (
        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href="/wallet">See it in your wallet</Link>
        </Button>
      )}
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "tabular flex size-6 shrink-0 items-center justify-center rounded-full",
          "bg-action text-caption font-semibold text-on-action",
        )}
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-small font-medium text-ink">{title}</span>
        <span className="block text-caption text-ink-muted">{body}</span>
      </span>
    </li>
  );
}

function Tracker({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface p-3 text-center">
      <span
        className="mx-auto mb-1 flex size-4 items-center justify-center text-ink-faint [&>svg]:size-4"
        aria-hidden="true"
      >
        {icon}
      </span>
      <dd className="tabular text-small font-semibold text-ink">{value}</dd>
      <dt className="text-caption leading-tight text-ink-muted">{label}</dt>
    </div>
  );
}

/**
 * Everything on this screen is the signed-in customer's own. A visitor without
 * an account is offered one rather than being shown somebody else's.
 */
export default function ReferPage() {
  return (
    <RequireAccount
      title="Sign in to refer a friend"
      description="Your referral code and rewards are tied to your account."
    >
      <ReferPageInner />
    </RequireAccount>
  );
}
