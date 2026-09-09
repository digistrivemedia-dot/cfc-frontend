"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Info, Power, X } from "lucide-react";
import { Button, cn, toast } from "@cfc/ui";
import { useOnlineState } from "@/lib/pro-session";

/**
 * Pro 11 — GO ONLINE / OFFLINE.
 *
 * The inventory asks for a "full-screen status change", and on a phone that is
 * right: this is the one setting that decides whether a pro earns today, and a
 * mis-tapped switch in a top bar removing them from the dispatch pool is a
 * silent failure they might not notice for hours. A screen makes the change
 * deliberate and shows the consequence.
 *
 * On desktop the same change is a switch in the rail, always visible, which is
 * why this route is reached from the *mobile* bar. A pro on a laptop never
 * needs to leave what they are doing to toggle it.
 *
 * ## The two automatic transitions
 *
 * The agreement mandates them: **offline on accept, online on completion.**
 * They are stated here rather than left to be discovered, because a pro who
 * finds themselves offline after accepting a job — and does not know why —
 * concludes the app dropped them. The rule is sound (a pro on a job must not be
 * alerted for another) but it is invisible unless something says so.
 */

export default function ProStatusPage() {
  const router = useRouter();
  const { online, setOnline } = useOnlineState();

  const change = (next: boolean) => {
    setOnline(next);
    toast.success(
      next
        ? "You are online. New jobs will be sent to you."
        : "You are offline. No new job alerts.",
    );
    router.back();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-sm flex-col px-4 py-4 md:px-6">
      {/* On mobile this screen replaces the view, so it needs its own way out.
          `router.back()` rather than a link to the dashboard: a pro may have
          arrived here from the jobs list and should return there. */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-touch w-touch items-center justify-center rounded-control text-ink-muted transition-colors duration-fast hover:bg-canvas hover:text-ink md:hidden"
        aria-label="Go back"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>

      <div className="flex flex-1 flex-col justify-center py-8">
        {/* The current state, large and unambiguous. Colour AND a label AND an
            icon — this is not a screen to make anyone guess on. */}
        <div className="text-center">
          <span
            className={cn(
              "mx-auto flex size-emblem items-center justify-center rounded-full",
              online
                ? "bg-live-subtle text-live-ink"
                : "bg-neutral-subtle text-ink-muted",
            )}
          >
            <Power className="size-8" aria-hidden="true" />
          </span>

          <h1 className="mt-4 text-title font-semibold text-ink">
            {online ? "You are online" : "You are offline"}
          </h1>
          <p className="mx-auto mt-2 max-w-prose text-body text-ink-muted">
            {online
              ? "You are in the queue for jobs near you. New job alerts will come through with 30 seconds to accept."
              : "You will not receive any job alerts while you are offline."}
          </p>
        </div>

        {/* The change. `pro` size because this is the app's most consequential
            press, and it is the only button on the screen. */}
        <div className="mt-8">
          {online ? (
            <Button
              variant="critical"
              size="pro"
              className="w-full"
              onClick={() => change(false)}
            >
              <X />
              Go offline
            </Button>
          ) : (
            <Button
              variant="go"
              size="pro"
              className="w-full"
              onClick={() => change(true)}
            >
              <Check />
              Go online
            </Button>
          )}
        </div>

        {/* The rules that move this state without the pro touching it. */}
        <section className="mt-8 rounded-card border border-border bg-surface p-4">
          <h2 className="flex items-center gap-2 text-small font-semibold text-ink">
            <Info className="size-4 shrink-0 text-action" aria-hidden="true" />
            Your status changes on its own
          </h2>
          <ul className="mt-3 space-y-3">
            <AutoRule
              label="When you accept a job"
              body="You go offline, so you are not alerted about another job while you are working."
            />
            <AutoRule
              label="When you complete a job"
              body="You go back online automatically and start receiving alerts again."
            />
          </ul>
        </section>
      </div>
    </div>
  );
}

function AutoRule({ label, body }: { label: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span
        className="mt-1 size-2 shrink-0 rounded-full bg-action"
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="block text-small font-medium text-ink">{label}</span>
        <span className="block text-caption text-ink-muted">{body}</span>
      </span>
    </li>
  );
}
