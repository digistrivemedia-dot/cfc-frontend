"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  ListChecks,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  RefreshCw,
  Satellite,
  TriangleAlert,
} from "lucide-react";
import { getProJob } from "@cfc/mocks";
import {
  PRO_JOB_STATUS_LABEL,
  type ProJob,
} from "@cfc/types";
import { startJob, startQuotedWork } from "@cfc/mocks";
import {
  Badge,
  Button,
  ErrorState,
  PinMap,
  OtpInput,
  PhotoGrid,
  QuotationStatusBadge,
  Skeleton,
  cn,
  formatCurrency,
  formatSchedule,
  toast,
} from "@cfc/ui";
import { ApiError } from "@cfc/types";
import { ProAction, ProActionLayout } from "@/components/pro-action-bar";
import { YouEarn } from "@/components/you-earn";
import { currentProId } from "@/lib/pro-session";
import {
  GPS_PROOF_RADIUS_M,
  LOCATION_ERROR_MESSAGE,
  useDistanceTo,
} from "@/lib/use-distance-to";

/**
 * Pro 13, 14 and 21 — the job, at every stage of its life.
 *
 * One route rather than three, because they are the same job and a pro should
 * not have to know which screen their job is "on". What changes with the status
 * is the docked action and how much of the record is filled in:
 *
 *   on the way   → Navigate / Call / Message, and I'm Here       (Pro 13, 14)
 *   in progress  → continue to the work screen
 *   completed    → the full record: checklist, photos, settlement (Pro 21)
 *
 * "Navigation Screen" in the inventory is a Google
 * Maps handoff, not a screen we render — nobody should rebuild turn-by-turn
 * inside a web app, and a pro already has a maps app they know how to use. So
 * the map here is the *preview* that tells them where they are going, and
 * Navigate hands off to the device (PRO-OPEN-ITEMS 2.3).
 *
 * ## What a pro needs while travelling
 *
 * Four actions: Navigate, Call, Message and **I'm Here**. The inventory named
 * the third as WhatsApp; the client asked for it to be a plain message
 * instead. The first three are how they arrive; the last is the one that moves
 * the job forward, so it is the docked action and the other three are a row of
 * buttons.
 *
 * ## Why "I'm Here" checks GPS
 *
 * The agreement requires a pro to be **within 100 m** to complete a job. That
 * check belongs at arrival rather than only at completion: a pro who discovers
 * at the end of an hour's work that the platform will not let them close the
 * job has a much worse problem than one told on arrival that their location
 * looks wrong. So the distance is live from here onward, and it is shown as a
 * figure rather than a pass/fail — a pro 140 m away wants to know which way to
 * walk, not merely that they have failed.
 */

export default function ProJobPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const proId = React.useMemo(() => currentProId(), []);

  const [job, setJob] = React.useState<ProJob | null>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "missing" | "failed">(
    "loading",
  );

  const load = React.useCallback(() => {
    setState("loading");
    let cancelled = false;
    void getProJob(proId, jobId)
      .then((j) => {
        if (cancelled) return;
        if (j === null) {
          setState("missing");
          return;
        }
        setJob(j);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [proId, jobId]);

  React.useEffect(() => load(), [load]);

  if (state === "loading") return <JobSkeleton />;

  if (state === "missing" || state === "failed") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <div className="rounded-card border border-border bg-surface">
          {state === "missing" ? (
            <ErrorState
              title="Job not found"
              description="This job is no longer assigned to you. It may have been reassigned or cancelled."
              action={{ label: "Back to jobs", onClick: () => undefined }}
            />
          ) : (
            <ErrorState
              title="Could not load this job"
              description="Check your connection and try again."
              action={{ label: "Try again", onClick: load }}
            />
          )}
        </div>
        <div className="mt-4 text-center">
          <Button variant="ghost" asChild>
            <Link href="/jobs">
              <ArrowLeft />
              All jobs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (job === null) return null;

  return <JobView job={job} onChange={setJob} />;
}

function JobView({
  job,
  onChange,
}: {
  job: ProJob;
  onChange: (next: ProJob) => void;
}) {
  const router = useRouter();

  // Live from here to completion. `job.location` is null on an unaccepted job,
  // and the hook simply stays idle in that case.
  const distance = useDistanceTo(job.location);

  /**
   * A job the pro can turn up to and start.
   *
   * `upcoming` belongs here. Both of these are the same booking state —
   * `assigned` — and the server derives which one from a single question,
   * "is it scheduled today?" (`proStatus` in `routes/pro/jobs.ts`). That split
   * exists to sort the jobs *list*, so today's work is not buried under next
   * Friday's. On this screen it meant a perfectly healthy job booked for
   * tomorrow fell past both branches into `ClosedAction` and told the pro
   * "Job cancelled", with no code box and nothing to do.
   *
   * Starting early is the customer's call, not the calendar's: `startJob`
   * checks the code and the transition and never looks at the date, so a pro
   * who arrives at 07:55 for an 08:00 job can begin. The code is the gate —
   * the customer has to read it out — and that gate does not get stronger by
   * also refusing to draw the box.
   */
  const travelling = job.status === "on_the_way" || job.status === "upcoming";
  const working = job.status === "in_progress";

  const [starting, setStarting] = React.useState(false);
  const [wrongCode, setWrongCode] = React.useState(false);

  /**
   * Start the job, with the code the customer reads out.
   *
   * **This used to change nothing.** It set `status: "in_progress"` in local
   * state and toasted "Marked as arrived" — the server never heard about it,
   * so the job stayed `assigned`, the customer saw no progress, and a reload
   * put the screen back where it started.
   *
   * Now the server transitions it, gated on a four-digit code only the
   * customer holds. A wrong code marks the field rather than claiming the job
   * cannot be started, because those are different problems.
   */
  const start = (otp: string) => {
    setStarting(true);
    setWrongCode(false);
    void startJob(job.id, otp)
      .then((updated) => {
        onChange(updated);
        toast.success("Job started. The customer can see you have begun.");
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.code === "WRONG_OTP") {
          setWrongCode(true);
          return;
        }
        toast.error(
          e instanceof ApiError ? e.message : "Could not start the job.",
        );
      })
      .finally(() => setStarting(false));
  };

  return (
    <ProActionLayout
      action={
        <ProAction>
          {travelling ? (
            <ArrivalAction
              job={job}
              distance={distance}
              onStart={start}
              starting={starting}
              wrongCode={wrongCode}
              onCodeChange={() => setWrongCode(false)}
            />
          ) : working ? (
            <WorkAction job={job} onOpen={() => router.push(`/jobs/${job.id}/work`)} />
          ) : (
            <ClosedAction job={job} />
          )}
        </ProAction>
      }
    >
      <div className="py-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All jobs
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge
              tone={working ? "live" : "neutral"}
              dot={working}
            >
              {PRO_JOB_STATUS_LABEL[job.status]}
            </Badge>
            <h1 className="mt-2 text-title font-semibold text-ink">
              {job.serviceName}
            </h1>
            <p className="mt-px tabular text-caption text-ink-muted">
              {job.reference}
            </p>
          </div>
        </div>

        {/* Where. A preview at real coordinates; Navigate hands the route off
            to the device, which has the traffic and the turn-by-turn.

            This was `MapView` with the customer pinned at `(62, 40)` and the
            pro at `(22, 68)` — percentages on a drawn canvas, with a route line
            between two numbers that corresponded to nothing on earth. The
            customer pin is now `job.location`; the pro's own comes from the
            same geolocation watch that gates job completion, so it appears
            once there is a real fix and not before. */}
        {job.location !== null && (
          <PinMap
            className="mt-4 h-block-md rounded-card border border-border"
            markers={[
              {
                id: "customer",
                point: job.location,
                kind: "customer",
                label: job.customerName,
              },
              ...(distance.point
                ? [
                    {
                      id: "self",
                      point: distance.point,
                      kind: "self" as const,
                      label: "You",
                    },
                  ]
                : []),
            ]}
          />
        )}

        {/* Who and where, in full — released because this job is accepted. */}
        <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
            Customer
          </h2>
          <div className="p-4">
            <p className="text-body font-semibold text-ink">
              {job.customerName}
            </p>

            {job.address !== null ? (
              <p className="mt-2 flex items-start gap-2 text-small text-ink-muted">
                <MapPin className="mt-px size-4 shrink-0" aria-hidden="true" />
                <span>
                  {job.address}
                  {job.landmark !== null && (
                    <span className="block text-caption text-ink-faint">
                      {job.landmark}
                    </span>
                  )}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-small text-ink-faint">
                The address is shared once you accept the job.
              </p>
            )}

            <p className="mt-2 flex items-center gap-2 text-small text-ink-muted">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              {formatSchedule(job.scheduledAt)}
            </p>

            {job.notes !== null && (
              <p className="mt-3 rounded-control bg-canvas p-3 text-small text-ink-muted">
                “{job.notes}”
              </p>
            )}

            {/* The three ways to reach them. Only rendered once the job is
                accepted, because before that both fields are null. */}
            {job.customerPhone !== null && job.address !== null && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <ContactButton
                  href={mapsHref(job.address)}
                  external
                  icon={<Navigation className="size-5" aria-hidden="true" />}
                  label="Navigate"
                />
                <ContactButton
                  href={`tel:${job.customerPhone}`}
                  icon={<Phone className="size-5" aria-hidden="true" />}
                  label="Call"
                />
                {/* Message, not WhatsApp - the client asked for WhatsApp to
                    go. `sms:` opens the phone's own messaging app, which works
                    on every handset without a third party. If CFC later routes
                    messages through their own service or a masked number, only
                    this href changes. */}
                <ContactButton
                  href={smsHref(job.customerPhone)}
                  icon={<MessageCircle className="size-5" aria-hidden="true" />}
                  label="Message"
                />
              </div>
            )}
          </div>
        </section>

        {/* Pro 21 — the service checklist. What "done" means, from the
            admin's own definition, so the pro and the customer are working
            from the same list. */}
        {job.checklist.length > 0 && (
          <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
            <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 text-small font-semibold text-ink">
              <ListChecks className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              What this service includes
            </h2>
            <ul className="divide-y divide-border-soft">
              {job.checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 px-4 py-3">
                  <Check
                    className={cn(
                      "mt-px size-4 shrink-0",
                      job.status === "completed" ? "text-live-ink" : "text-ink-faint",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 text-small text-ink">{item}</span>
                </li>
              ))}
            </ul>
            <p className="border-t border-border bg-canvas px-4 py-2 text-caption text-ink-muted">
              The customer sees this same list. Anything beyond it needs a
              quotation or an agreed extra charge.
            </p>
          </section>
        )}

        {/**
         * Pro 17 — the quotation, if there is one.
         *
         * A pro who raised one and then navigated away had **no way back to
         * it**: this screen said nothing, the job read "In progress", and the
         * status screen was only reachable by submitting a new quotation. So
         * the obvious move was to raise a second one for work already quoted.
         *
         * Placed above the photos because while a quote is pending it is the
         * only thing on this screen that matters — the pro is standing in
         * someone's house waiting on the office.
         */}
        {/* Truthy, not `!== null`: a server that does not send the field at
            all leaves it **undefined**, which `!== null` waves through — and
            the card then reads `.status` off nothing and takes the whole job
            screen down with it. A pro mid-job loses the start code, the
            customer's number and the navigation button over a card that had
            nothing to show in the first place. */}
        {job.quotation && (
          <QuotationCard
            jobId={job.id}
            quote={job.quotation}
            // Merged rather than re-fetched: the start call returns the
            // updated quotation, so a second round trip would only risk
            // showing a staler one.
            onQuoteChange={(next) => onChange({ ...job, quotation: next })}
          />
        )}

        {/* Pro 21 — the evidence. Before and after kept separate: in a dispute
            they answer different questions, and merging them loses exactly the
            distinction that matters. */}
        {(job.beforePhotoUrls.length > 0 || job.afterPhotoUrls.length > 0) && (
          <section className="mt-4 rounded-card border border-border bg-surface p-4">
            <h2 className="text-small font-semibold text-ink">Job photos</h2>
            {job.beforePhotoUrls.length > 0 && (
              <div className="mt-3">
                <p className="text-caption font-medium text-ink-muted">Before</p>
                <PhotoGrid
                  urls={job.beforePhotoUrls}
                  label="Before photo"
                  className="mt-2"
                />
              </div>
            )}
            {job.afterPhotoUrls.length > 0 && (
              <div className="mt-3">
                <p className="text-caption font-medium text-ink-muted">After</p>
                <PhotoGrid
                  urls={job.afterPhotoUrls}
                  label="After photo"
                  className="mt-2"
                />
              </div>
            )}
          </section>
        )}

        {/* What they earn.
            A finished job gets the full settlement — gross, fee, net — because
            that is the record a pro checks against their bank. An unfinished
            one gets the net figure alone: quoting a fee that has not been
            charged yet reads as money already gone. */}
        {job.status === "completed" ? (
          <YouEarn
            className="mt-4"
            netPaise={job.netEarningPaise}
            commissionFree={job.grossEarningPaise === job.netEarningPaise}
            payoutNote="Credited to your bank or UPI within 48 hours of completing."
          />
        ) : (
          <section className="mt-4 rounded-card border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small text-ink-muted">You earn</span>
              <span className="tabular text-title font-semibold text-ink">
                {formatCurrency(job.netEarningPaise)}
              </span>
            </div>
            <p className="mt-1 text-caption text-ink-muted">
              After the CFC platform fee. Credited within 48 hours of completing
              the job.
            </p>
          </section>
        )}
      </div>
    </ProActionLayout>
  );
}

// -- The docked action, by stage ---------------------------------------------

/**
 * "I'm Here", gated on the GPS rule.
 *
 * The distance is shown as a number, always, because a pro who is too far away
 * needs to know how far — 110 m means walk to the right door, 4 km means they
 * are not there yet and the app just saved them from a mistake.
 *
 * If location cannot be read at all, the pro is **not blocked**. They can
 * confirm arrival with the failure recorded. Blocking real work because a
 * browser could not get a fix indoors makes the platform's rule into the pro's
 * problem, and they are the one person here who cannot fix it.
 */
function ArrivalAction({
  job,
  distance,
  onStart,
  starting,
  wrongCode,
  onCodeChange,
}: {
  job: ProJob;
  distance: ReturnType<typeof useDistanceTo>;
  onStart: (otp: string) => void;
  starting: boolean;
  wrongCode: boolean;
  onCodeChange: () => void;
}) {
  const { metres, accuracyM, loading, error, retry } = distance;
  const [code, setCode] = React.useState("");
  const within = metres !== null && metres <= GPS_PROOF_RADIUS_M;

  return (
    <>
      {/* The live distance. */}
      <div
        className={cn(
          "rounded-control border p-3",
          error !== null
            ? "border-clock-line bg-clock-subtle"
            : within
              ? "border-live-line bg-live-subtle"
              : "border-border bg-canvas",
        )}
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-ink-muted"
              aria-hidden="true"
            />
          ) : error !== null ? (
            <TriangleAlert
              className="size-4 shrink-0 text-clock-ink"
              aria-hidden="true"
            />
          ) : within ? (
            <CheckCircle2
              className="size-4 shrink-0 text-live-ink"
              aria-hidden="true"
            />
          ) : (
            <Satellite
              className="size-4 shrink-0 text-ink-muted"
              aria-hidden="true"
            />
          )}

          <span
            className={cn(
              "min-w-0 text-small font-medium",
              error !== null
                ? "text-clock-ink"
                : within
                  ? "text-live-ink"
                  : "text-ink",
            )}
          >
            {loading
              ? "Checking your location…"
              : error !== null
                ? "Location unavailable"
                : metres === null
                  ? "Location not checked"
                  : within
                    ? "You are at the customer’s location"
                    : `${formatMetres(metres)} from the customer`}
          </span>
        </div>

        {error !== null && (
          <>
            <p className="mt-1 text-caption text-clock-ink">
              {LOCATION_ERROR_MESSAGE[error]}
            </p>
            {error !== "unsupported" && error !== "denied" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-clock-ink"
                onClick={retry}
              >
                Check again
              </Button>
            )}
          </>
        )}

        {/* The rule, and the honest caveat about phone GPS. */}
        {error === null && metres !== null && (
          <p className="mt-1 text-caption text-ink-muted">
            You need to be within {GPS_PROOF_RADIUS_M} m to complete the job
            {accuracyM !== null && ` · accurate to about ${Math.round(accuracyM)} m`}
          </p>
        )}
      </div>

      {/* The start code.

          The job used to begin on this button alone, which meant nothing
          connected the clock starting to the customer being there and agreeing
          to it. Four digits, held only by the customer. */}
      {/* The code panel carries the brand tint and a lock, so at a glance it
          reads as the gate rather than as one more field on a form. */}
      <div className="mt-3 rounded-card border border-action-line bg-action-subtle p-4">
        <p className="flex items-center justify-center gap-2 text-caption font-semibold uppercase tracking-wide text-action">
          <KeyRound className="size-4 shrink-0" aria-hidden="true" />
          Start code
        </p>
        <p className="mt-2 text-center text-small font-medium text-ink">
          Ask {job.customerName} for their 4-digit code
        </p>
        <p className="mt-px text-center text-caption text-ink-muted">
          It is on their booking screen.
        </p>

        <div className="mt-3 flex justify-center">
          <OtpInput
            length={4}
            value={code}
            onChange={(next) => {
              setCode(next);
              if (wrongCode) onCodeChange();
            }}
            invalid={wrongCode}
            label="Start code"
          />
        </div>

        {wrongCode && (
          <p className="mt-2 text-center text-caption font-medium text-critical-ink">
            That code is not right. Ask them to read it again.
          </p>
        )}
      </div>

      <Button
        variant="go"
        size="pro"
        className="mt-3 w-full"
        disabled={code.length !== 4 || starting}
        loading={starting}
        onClick={() => onStart(code)}
      >
        {starting ? "Starting…" : "Start the job"}
      </Button>

      {/* Said plainly when the pro is far away. The code is the gate, not the
          distance — but a pro standing somewhere else should see that we know. */}
      {!within && error === null && metres !== null && (
        <p className="mt-2 text-caption text-ink-muted">
          You are still {formatMetres(metres)} away. Starting now will be
          recorded.
        </p>
      )}

      <p className="mt-3 border-t border-border pt-3 text-caption text-ink-muted">
        {job.customerName} is expecting you.
      </p>
    </>
  );
}

/** The job is under way; the work screen is where it continues. */
function WorkAction({ job, onOpen }: { job: ProJob; onOpen: () => void }) {
  return (
    <>
      <div className="rounded-control border border-live-line bg-live-subtle p-3">
        <p className="text-small font-medium text-live-ink">
          Work in progress
        </p>
        <p className="mt-px text-caption text-live-ink">
          Upload before photos, add any extra charges, then complete the job.
        </p>
      </div>
      <Button size="pro" className="mt-3 w-full" onClick={onOpen}>
        Continue work
      </Button>
      <p className="mt-3 border-t border-border pt-3 text-caption text-ink-muted">
        You earn {formatCurrency(job.netEarningPaise)} on completion.
      </p>
    </>
  );
}

/**
 * Who cancelled, in the pro's words.
 *
 * "office" rather than "admin": a pro deals with the CFC office, not with a
 * role name from the permission model.
 */
const CANCELLED_BY_LABEL: Record<
  NonNullable<ProJob["cancelledBy"]>,
  string
> = {
  customer: "Cancelled by the customer",
  office: "Cancelled by the CFC office",
  pro: "Cancelled by you",
};

/**
 * No action available on this screen, and an honest reason why.
 *
 * ## It used to call everything a cancellation
 *
 * This was `done = status === "completed"`, and **every other status rendered
 * "Job cancelled"** in critical red. That is the worst available answer for a
 * job that is merely waiting: it tells a pro their work has been taken away,
 * it is not true, and there is nothing on the screen to contradict it. A pro
 * reading it would stop turning up.
 *
 * So each state says its own name. Red is reserved for the one case that has
 * actually gone wrong, because a colour that means "bad news" everywhere means
 * nothing anywhere.
 */
function ClosedAction({ job }: { job: ProJob }) {
  const { tone, title, note } = closedCopy(job);

  return (
    <>
      <div
        className={cn(
          "rounded-control border p-3",
          tone === "critical" && "border-critical-line bg-critical-subtle",
          tone === "waiting" && "border-clock-line bg-clock-subtle",
          tone === "neutral" && "border-border bg-canvas",
        )}
      >
        <p
          className={cn(
            "text-small font-medium",
            tone === "critical" && "text-critical-ink",
            tone === "waiting" && "text-clock-ink",
            tone === "neutral" && "text-ink",
          )}
        >
          {title}
        </p>
        {note !== undefined && (
          <p className="mt-px text-caption text-ink-muted">{note}</p>
        )}

        {/* Who cancelled, and why. "Job cancelled" on its own leaves a pro
            assuming they caused it - which is wrong most of the time, and is
            the kind of silence that becomes a support call. Pro correction 7.

            Shown only when the backend sends it; a job without a reason falls
            back to the status alone rather than an empty line. */}
        {job.cancelledBy !== undefined && (
          <p className="mt-1 text-caption text-critical-ink">
            {CANCELLED_BY_LABEL[job.cancelledBy]}
            {job.cancelReason !== undefined ? ` — ${job.cancelReason}` : null}
          </p>
        )}
        {job.cancelledAt !== undefined && (
          <p className="mt-px text-caption text-ink-muted">
            {formatSchedule(job.cancelledAt)}
          </p>
        )}
      </div>
      <Button variant="secondary" className="mt-3 w-full" asChild>
        <Link href="/jobs">Back to jobs</Link>
      </Button>
    </>
  );
}

/**
 * What to say for a job with no action on it.
 *
 * Separate from the markup so the wording for each state is readable as a
 * list — this is the part that was wrong, not the layout.
 */
function closedCopy(job: ProJob): {
  tone: "critical" | "waiting" | "neutral";
  title: string;
  note?: string;
} {
  switch (job.status) {
    case "completed":
      return {
        tone: "neutral",
        title: "Job completed",
        note: `You earned ${formatCurrency(job.netEarningPaise)}.`,
      };

    case "cancelled":
      return {
        tone: "critical",
        title: "Job cancelled",
        note: "Nothing more to do here.",
      };

    case "awaiting_quote":
      return {
        tone: "waiting",
        title: "Quote with the office",
        note: "You can start once it is approved. We will tell you.",
      };

    case "offered":
      // Reachable by opening a job straight from a notification: accepting
      // happens on the jobs list, where the countdown is.
      return {
        tone: "waiting",
        title: "Not accepted yet",
        note: "Accept it on your jobs list to take this one.",
      };

    default:
      // A status this screen has no stage for. Says so plainly rather than
      // inventing one — guessing is how "cancelled" got here.
      return {
        tone: "waiting",
        title: PRO_JOB_STATUS_LABEL[job.status],
        note: "There is nothing to do on this screen yet.",
      };
  }
}

// -- Pieces ------------------------------------------------------------------

/**
 * Pro 17 — the quotation on this job, summarised.
 *
 * Four states, and each one answers a different question:
 *
 *   pending   → how long is left, and should I wait on site
 *   approved  → what the customer owes now, so I can ask for the right amount
 *   rejected  → why, and how to revise it
 *   accepted  → the customer has agreed; get on with the work
 *
 * **Both figures when the office edited.** A pro who submitted ₹6,000 and was
 * approved at ₹5,000 must learn that here rather than from the customer at the
 * door — which is an argument they would lose with nothing to check.
 */
function QuotationCard({
  jobId,
  quote,
  onQuoteChange,
}: {
  jobId: string;
  quote: NonNullable<ProJob["quotation"]>;
  onQuoteChange: (next: NonNullable<ProJob["quotation"]>) => void;
}) {
  const pending = quote.status === "pending";
  const rejected = quote.status === "rejected";
  const declined = quote.status === "customer_declined";

  /**
   * The customer has confirmed and the work has not started.
   *
   * This is the one state on this screen with something for the pro to *do*:
   * ask for the code. Until it is entered the job cannot be completed, because
   * the quoted money is already in the settlement.
   */
  const needsCode = quote.status === "customer_accepted" && !quote.workStarted;
  const underway = quote.status === "customer_accepted" && quote.workStarted;

  const tone = pending
    ? "clock"
    : rejected || declined
      ? "critical"
      : "live";

  return (
    <section
      className={cn(
        "mt-4 overflow-hidden rounded-card border bg-surface",
        tone === "clock" && "border-clock-line",
        tone === "critical" && "border-critical-line",
        tone === "live" && "border-live-line",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3",
          tone === "clock" && "border-clock-line bg-clock-subtle",
          tone === "critical" && "border-critical-line bg-critical-subtle",
          tone === "live" && "border-live-line bg-live-subtle",
        )}
      >
        <h2 className="flex items-center gap-2 text-small font-semibold text-ink">
          <FileText className="size-4 shrink-0" aria-hidden="true" />
          Your quotation
        </h2>
        {/* The canonical mapping, not a tone picked here: `badge.tsx` is firm
            that a status must not be coloured two ways on two screens, and the
            admin queue already renders this one. */}
        <QuotationStatusBadge status={quote.status} />
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-small text-ink-muted">
            {quote.edited ? "Approved amount" : "You quoted"}
          </span>
          <span className="tabular text-body font-semibold text-ink">
            {formatCurrency(quote.totalPaise)}
          </span>
        </div>

        {/* The office changed the figure. Said plainly, with what they asked
            for, because the pro will be quoting a number out loud. */}
        {quote.edited && (
          <p className="mt-1 text-caption text-clock-ink">
            The office edited this. You submitted{" "}
            <span className="tabular font-medium">
              {formatCurrency(quote.submittedTotalPaise)}
            </span>
            .
          </p>
        )}

        {/* With the customer, and possibly still editable by the office. */}
        {pending && (
          <p className="mt-3 flex items-start gap-2 text-caption text-ink-muted">
            <Clock className="mt-px size-4 shrink-0" aria-hidden="true" />
            {quote.minutesRemaining !== null && quote.minutesRemaining > 0
              ? `With the customer now. The office can still adjust it for ${quote.minutesRemaining} min.`
              : "With the customer now. The amount is final — the office's window has closed."}
          </p>
        )}

        {/* Legacy rows only: nothing produces `approved` any more. */}
        {quote.status === "approved" && (
          <p className="mt-3 text-caption text-ink-muted">
            With the customer for approval.
          </p>
        )}

        {underway && (
          <p className="mt-3 text-caption text-live-ink">
            The customer approved and the quoted work is under way. They pay{" "}
            {formatCurrency(quote.totalPaise)} when the job is finished.
          </p>
        )}

        {/* The code box. Inline rather than on another screen: the pro is
            standing next to the person reading it out. */}
        {needsCode && (
          <QuoteStartCode
            quotationId={quote.id}
            onStarted={onQuoteChange}
          />
        )}

        {/* The reason, prominently. A rejection with no reason is the most
            demoralising thing this platform can show a pro. */}
        {rejected && quote.rejectionReason !== null && (
          <div className="mt-3">
            <p className="text-caption font-medium text-ink">Office’s reason</p>
            <p className="mt-1 rounded-control bg-canvas p-3 text-small text-ink-muted">
              “{quote.rejectionReason}”
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="min-w-0 flex-1" asChild>
            <Link href={`/jobs/${jobId}/quote/status`}>
              {pending ? "Watch the clock" : "Open the quotation"}
            </Link>
          </Button>
          {/* Only once there is nothing live to wait on. Offering "revise"
              beside a pending quote invites a second one for the same work. */}
          {(rejected || declined) && (
            <Button className="min-w-0 flex-1" asChild>
              <Link href={`/jobs/${jobId}/quote`}>
                <RefreshCw />
                Revise it
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Pro 17 — the customer's code for the quoted work.
 *
 * A second code box on a screen that already has one, and the distinction is
 * the point: the job's own start code proved the customer let the pro in to do
 * **what they booked**. This one proves they agreed, in person, to a different
 * and usually much larger piece of work — on real data here, a ₹350 booking
 * becoming ₹3,700.
 *
 * It says what it unlocks and what it blocks, because a pro who ignores it
 * discovers at the end of the job that they cannot close it.
 */
function QuoteStartCode({
  quotationId,
  onStarted,
}: {
  quotationId: string;
  onStarted: (next: NonNullable<ProJob["quotation"]>) => void;
}) {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [wrong, setWrong] = React.useState(false);

  const submit = (otp: string) => {
    setBusy(true);
    setWrong(false);
    void startQuotedWork(quotationId, otp)
      .then((next) => {
        onStarted(next);
        toast.success("Quoted work started. The customer has been told.");
      })
      .catch((e: unknown) => {
        // A wrong code marks the field; anything else is the server's own
        // words, which say more than "could not start" ever would.
        if (e instanceof ApiError && e.code === "WRONG_OTP") {
          setWrong(true);
          return;
        }
        toast.error(
          e instanceof ApiError ? e.message : "Could not start the quoted work.",
        );
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="mt-3 rounded-control border border-action-line bg-action-subtle p-3">
      <p className="flex items-center gap-2 text-small font-semibold text-action">
        <KeyRound className="size-4 shrink-0" aria-hidden="true" />
        Ask the customer for their code
      </p>
      <p className="mt-px text-caption text-action">
        They have a 4-digit code on their screen. The quoted work — and
        completing this job — needs it. Nothing is collected now; the customer
        pays for everything when the job is finished.
      </p>

      <div className="mt-3">
        <OtpInput
          value={code}
          onChange={(next) => {
            setCode(next);
            // Clears the error as soon as they start correcting it, rather
            // than leaving red boxes under digits they have already fixed.
            if (wrong) setWrong(false);
          }}
          length={4}
          // The code is read aloud by the customer, not texted to this phone,
          // so the keyboard must not offer to autofill an SMS code.
          autoComplete="off"
          onComplete={submit}
          disabled={busy}
          invalid={wrong}
          label="Customer's code for the quoted work"
        />
      </div>

      {wrong && (
        <p className="mt-2 text-caption font-medium text-critical-ink">
          That code is not right. Ask them to read it again.
        </p>
      )}
      {busy && (
        <p className="mt-2 flex items-center gap-2 text-caption text-ink-muted">
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          Checking…
        </p>
      )}
    </div>
  );
}

function ContactButton({
  href,
  icon,
  label,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "flex min-h-touch flex-col items-center justify-center gap-1 rounded-control",
        "border border-border bg-surface py-2 text-caption font-medium text-ink",
        "transition-colors duration-fast hover:border-action-line hover:text-action",
      )}
    >
      <span className="text-action">{icon}</span>
      {label}
    </a>
  );
}

function JobSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 lg:px-8">
      <Skeleton className="h-4 w-line-sm" />
      <Skeleton className="mt-4 h-6 w-line-lg" />
      <Skeleton className="mt-4 h-block-md w-full rounded-card" />
      <Skeleton className="mt-4 h-block-sm w-full rounded-card" />
    </div>
  );
}

// -- Helpers -----------------------------------------------------------------

/** Metres under a kilometre, then kilometres. */
function formatMetres(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/**
 * Navigation, handed to the device.
 *
 * The right answer in production too — this opens whatever maps app the pro
 * already has and knows.
 */
function mapsHref(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address,
  )}`;
}

/**
 * The phone's own messaging app.
 *
 * This replaced a `wa.me` WhatsApp link, which the client asked to be removed.
 * `sms:` is handled by every handset and needs no third-party app installed.
 *
 * The number is stripped to digits and a leading plus is kept, because an
 * Indian number stored as "+91 98765 43210" has to reach the dialler as
 * "+919876543210" or the message goes nowhere.
 */
function smsHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `sms:${digits}`;
}
