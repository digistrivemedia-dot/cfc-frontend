"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button, cn } from "@cfc/ui";
import { AuthDialog } from "@/components/auth-dialog";
import { useSession } from "@/lib/session";

/**
 * Wraps a screen that only means something once there is an account.
 *
 * Seven screens were fetching personal data with no session check at all —
 * bookings, wallet, profile, referrals, tickets, notifications and the booking
 * flow. A signed-out visitor was shown a stranger's wallet balance and booking
 * history, which is the same defect the home screen had before it was gated,
 * and worse here because these screens are *entirely* personal.
 *
 * Rather than each screen inventing its own check, they wrap their content in
 * this. It renders nothing until the stored session is known — a flash of
 * "sign in" for a customer who is already signed in reads as being logged out —
 * and otherwise offers the sign-in modal in place, so a customer arriving from
 * a link lands on the screen they asked for once they are through.
 *
 * `title` and `description` are per screen because "Sign in to see your
 * bookings" and "Sign in to see your wallet" are different promises, and a
 * generic wall tells a customer nothing about what they are about to get.
 */
export function RequireAccount({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { signedIn } = useSession();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  // Unknown yet. Render nothing rather than guessing — either guess is wrong
  // half the time and both look broken.
  if (signedIn === null) return null;

  if (signedIn) return <>{children}</>;

  return (
    <div className="mx-auto max-w-screen-md px-4 py-panel md:px-6 lg:px-8">
      <div
        className={cn(
          "mx-auto flex max-w-detail flex-col items-center rounded-card",
          "border border-border bg-surface p-6 text-center md:p-8",
        )}
      >
        <span className="flex size-tile-lg items-center justify-center rounded-full bg-action-subtle text-action">
          <LogIn className="size-6" aria-hidden="true" />
        </span>

        <h1 className="mt-4 text-title font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-screen-sm text-body leading-relaxed text-ink-muted">
          {description}
        </p>

        <Button
          variant="primary"
          size="lg"
          className="mt-6 w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          Sign in
        </Button>

        <button
          type="button"
          onClick={() => router.push("/categories")}
          className={cn(
            "mt-4 rounded-control text-small font-medium text-action",
            "transition-colors duration-fast hover:text-action-hover",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          Browse services instead
        </button>
      </div>

      {/* Signing in returns the customer to this screen with the content
          revealed, rather than bouncing them to /login and back. */}
      <AuthDialog
        open={open}
        onOpenChange={setOpen}
        onDone={() => {
          /* The session flips, and the guard re-renders with the content. */
        }}
        reason={title}
      />
    </div>
  );
}
