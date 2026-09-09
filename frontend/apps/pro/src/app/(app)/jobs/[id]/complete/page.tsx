"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  Loader2,
  Satellite,
  TriangleAlert,
} from "lucide-react";
import { completeJob, getPro, getProJob } from "@cfc/mocks";
import type { ProEarning, ProJob } from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  InlineAlert,
  MoneyBreakdown,
  OtpInput,
  PhotoCapture,
  Skeleton,
  cn,
  formatCurrency,
  toast,
  type CapturedPhoto,
} from "@cfc/ui";
import { ProAction, ProActionLayout } from "@/components/pro-action-bar";
import { currentProId, useOnlineState } from "@/lib/pro-session";
import {
  GPS_PROOF_RADIUS_M,
  LOCATION_ERROR_MESSAGE,
  useDistanceTo,
} from "@/lib/use-distance-to";

/**
 * Pro 18 and 19 — completing the job, and what it earned.
 *
 * One route, two states, because 19 is the *result* of 18 rather than a place a
 * pro navigates to. Splitting them would mean either a fake intermediate route
 * or a settlement screen reachable with no job behind it.
 *
 * ## The OTP belongs to the customer
 *
 * This is the whole mechanism: the code is on the customer's phone, and the pro
 * has to ask for it. That is what makes it proof of anything. Two consequences
 * for the UI, both easy to get wrong:
 *
 *   `autoComplete="off"` on the input — a browser offering to autofill the SMS
 *   code it received for the *pro's own* login would be filling in a guaranteed
 *   wrong answer. That is worse than no autofill.
 *
 *   The wording asks the pro to ask. "Enter OTP" reads as though the pro should
 *   already have it; "Ask the customer for their code" says where it comes from.
 *
 * ## Why completion confirms
 *
 * A mis-tapped Complete on a job that is not finished is a penalty problem for
 * the pro, not a UI annoyance — so it passes through a confirmation that states
 * what is about to happen.
 */

export default function ProCompletePage() {
  const params = useParams<{ id: string }>();
  const proId = React.useMemo(() => currentProId(), []);

  const [job, setJob] = React.useState<ProJob | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [earning, setEarning] = React.useState<ProEarning | null>(null);
  // The pro's career job count, which decides whether the first-20-jobs offer
  // still waives their commission. It has to come from the pro record — a
  // placeholder here would silently charge 15% to someone still inside the
  // offer, on the very screen that tells them what they earned.
  const [jobsBefore, setJobsBefore] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([getProJob(proId, params.id), getPro(proId)])
      .then(([j, pro]) => {
        if (!cancelled) {
          setJob(j);
          setJobsBefore(pro.jobsCompleted);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [proId, params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-detail px-4 py-4 md:px-6">
        <Skeleton className="h-6 w-line-lg" />
        <Skeleton className="mt-4 h-block-md w-full rounded-card" />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="mx-auto max-w-detail px-4 py-12 text-center md:px-6">
        <p className="text-body text-ink-muted">This job is not available.</p>
        <Button variant="ghost" className="mt-3" asChild>
          <Link href="/jobs">
            <ArrowLeft />
            All jobs
          </Link>
        </Button>
      </div>
    );
  }

  // Pro 19 — the settlement, once the job is closed.
  if (earning !== null) {
    return <CompletedView job={job} earning={earning} />;
  }

  // Pro 18 — closing it.
  return (
    <CompleteForm
      job={job}
      jobsBefore={jobsBefore ?? 0}
      onDone={setEarning}
    />
  );
}

// -- Pro 18 ------------------------------------------------------------------

function CompleteForm({
  job,
  jobsBefore,
  onDone,
}: {
  job: ProJob;
  /** The pro's completed-job count, for the first-20-jobs offer. */
  jobsBefore: number;
  onDone: (earning: ProEarning) => void;
}) {
  const [otp, setOtp] = React.useState("");
  const [afterPhotos, setAfterPhotos] = React.useState<CapturedPhoto[]>([]);
  const [wrongOtp, setWrongOtp] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const distance = useDistanceTo(job.location);
  const within =
    distance.metres !== null && distance.metres <= GPS_PROOF_RADIUS_M;

  const ready = otp.length === 4 && afterPhotos.length > 0;

  const submit = async () => {
    setBusy(true);
    setWrongOtp(false);
    try {
      const result = await completeJob({
        jobId: job.id,
        otp,
        // In the real app the code is never sent to the pro's device — the
        // server compares it. The fixture carries it so the flow is testable.
        expectedOtp: job.completionOtp ?? "0000",
        grossPaise: job.grossEarningPaise,
        // From the pro's own record. Decides whether the first-20-jobs offer
        // waives the commission on this settlement.
        jobsCompletedBefore: jobsBefore,
        afterPhotoCount: afterPhotos.length,
        distanceM: distance.metres,
        gpsLimitM: GPS_PROOF_RADIUS_M,
      });

      if (!result.ok) {
        if (result.error.reason === "wrong-otp") {
          setWrongOtp(true);
          toast.error("That code does not match. Ask the customer to read it again.");
        } else if (result.error.reason === "too-far") {
          toast.error(
            `You are ${result.error.metres} m away. You need to be within ${result.error.limit} m to complete.`,
          );
        } else {
          toast.error("Add at least one photo of the finished work.");
        }
        return;
      }

      onDone(result.earning);
    } catch {
      toast.error("Could not complete the job. Check your connection.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <ProActionLayout
      action={
        <ProAction>
          <div className="border-b border-border pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small text-ink-muted">You earn</span>
              <span className="tabular text-title font-semibold text-ink">
                {formatCurrency(job.netEarningPaise)}
              </span>
            </div>
          </div>

          {/* GPS state, restated here because this is where it bites. */}
          <p
            className={cn(
              "mt-3 flex items-center gap-2 text-caption",
              distance.error !== null
                ? "text-clock-ink"
                : within
                  ? "text-live-ink"
                  : "text-ink-muted",
            )}
          >
            {distance.loading ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
            ) : distance.error !== null ? (
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            ) : within ? (
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Satellite className="size-4 shrink-0" aria-hidden="true" />
            )}
            {distance.loading
              ? "Checking your location…"
              : distance.error !== null
                ? "Location could not be checked"
                : distance.metres === null
                  ? "Location not checked"
                  : within
                    ? "GPS confirms you are on site"
                    : `${Math.round(distance.metres)} m away — too far to complete`}
          </p>

          <Button
            size="pro"
            className="mt-3 w-full"
            disabled={!ready || busy}
            onClick={() => setConfirming(true)}
          >
            {busy ? "Completing…" : "Mark complete"}
          </Button>

          {!ready && (
            <p className="mt-2 text-caption text-clock-ink">
              {otp.length < 4
                ? "Enter the customer’s 4-digit code."
                : "Add at least one photo of the finished work."}
            </p>
          )}
        </ProAction>
      }
    >
      <div className="py-4">
        <Link
          href={`/jobs/${job.id}/work`}
          className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the job
        </Link>

        <h1 className="mt-3 text-title font-semibold text-ink">
          Complete the job
        </h1>
        <p className="mt-1 text-small text-ink-muted">
          {job.serviceName} · {job.customerName}
        </p>

        {/* The code. First, because nothing else closes the job. */}
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-medium text-ink">
            Ask {job.customerName} for their code
          </h2>
          <p className="mt-px text-caption text-ink-muted">
            The customer has a 4-digit code in their app. It confirms to CFC
            that the work is done, and it is what releases your payment.
          </p>

          <OtpInput
            value={otp}
            onChange={(next) => {
              setOtp(next);
              setWrongOtp(false);
            }}
            length={4}
            // NOT "one-time-code": the browser would offer the pro's own login
            // SMS, which is a guaranteed wrong answer. See the file comment.
            autoComplete="off"
            invalid={wrongOtp}
            label="Customer’s completion code"
            className="mt-3 max-w-line-2xl"
          />

          {wrongOtp && (
            <p className="mt-2 text-caption text-critical-ink">
              That code does not match. Ask the customer to read it again from
              their booking screen.
            </p>
          )}
        </section>

        {/* After-photos. */}
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <PhotoCapture
            photos={afterPhotos}
            onChange={setAfterPhotos}
            label="After photos"
            minimum={1}
            hint="Photograph the finished work. The customer sees these on their invoice, and they are your evidence that the job was done properly."
          />
        </section>

        {/* GPS failure, explained in full rather than as a one-line status. */}
        {distance.error !== null && (
          <InlineAlert
            tone="clock"
            title="Your location could not be checked"
            className="mt-4"
          >
            {LOCATION_ERROR_MESSAGE[distance.error]} You can still complete the
            job — CFC will see that the location check did not run.
          </InlineAlert>
        )}
      </div>

      {/* A mis-tap here is a penalty problem, not an annoyance. */}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This tells CFC and {job.customerName} that the work is finished.
              You will earn {formatCurrency(job.netEarningPaise)}, credited
              within 48 hours. It cannot be undone from the app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit()}>
              Yes, complete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProActionLayout>
  );
}

// -- Pro 19 ------------------------------------------------------------------

/**
 * The settlement.
 *
 * The inventory asks for "gross + CFC fee deducted + net" and "credited in 24
 * hours". The first is `MoneyBreakdown`; the second is corrected to **48
 * hours**, which is what `PLATFORM-FACTS.md` actually says. A screen promising
 * 24 hours against a documented 48 generates a support ticket on day two.
 *
 * The auto-online rule fires here: completing a job puts the pro back in the
 * dispatch pool. Stated plainly, because a pro who does not know it will
 * wonder why alerts started again.
 */
function CompletedView({
  job,
  earning,
}: {
  job: ProJob;
  earning: ProEarning;
}) {
  const router = useRouter();
  const { finishJob } = useOnlineState();

  // The agreement's rule: online again on completion. Run once, on arrival at
  // this screen, because this is the moment the job actually closed.
  React.useEffect(() => {
    finishJob();
    // `finishJob` is stable, and this must not re-fire if it were not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-detail px-4 py-6 md:px-6">
      <div className="text-center">
        <span className="mx-auto flex size-emblem items-center justify-center rounded-full bg-live-subtle text-live-ink">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-title font-semibold text-ink">
          Job completed
        </h1>
        <p className="mx-auto mt-1 max-w-prose text-small text-ink-muted">
          {job.serviceName} for {job.customerName}
        </p>
      </div>

      {/* gross → fee → net, from the one function that computes it. */}
      <MoneyBreakdown
        className="mt-6"
        grossPaise={earning.grossPaise}
        cfcFeePaise={earning.cfcFeePaise}
        netPaise={earning.netPaise}
        cfcFeeBps={earning.cfcFeeBps}
        commissionFree={earning.commissionFree}
        payoutNote="Credited to your bank or UPI within 48 hours."
        gstNote
        emphasis
      />

      {/* The auto-online rule. */}
      <p className="mt-4 flex items-start gap-2 rounded-card border border-live-line bg-live-subtle p-3 text-caption text-live-ink">
        <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
        You are back online and can receive new jobs.
      </p>

      {/* The rating prompt the inventory asks for. */}
      <section className="mt-4 rounded-card border border-border bg-surface p-4">
        <p className="text-small font-medium text-ink">
          {job.customerName} can now rate this job
        </p>
        <p className="mt-px text-caption text-ink-muted">
          Ratings only open after the code is confirmed, so every review on your
          profile comes from a job you actually finished. Your rating decides
          which jobs you are offered first.
        </p>
      </section>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button
          size="pro"
          className="min-w-0 flex-1"
          onClick={() => router.push("/dashboard")}
        >
          Back to home
        </Button>
        <Button variant="secondary" className="min-w-0 flex-1" asChild>
          <Link href="/earnings">See earnings</Link>
        </Button>
      </div>
    </div>
  );
}
