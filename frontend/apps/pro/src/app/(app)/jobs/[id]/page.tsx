"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ListChecks,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Satellite,
  TriangleAlert,
} from "lucide-react";
import { getProJob } from "@cfc/mocks";
import {
  CFC_COMMISSION_BPS,
  PRO_JOB_STATUS_LABEL,
  type ProJob,
} from "@cfc/types";
import {
  Badge,
  Button,
  ErrorState,
  MapView,
  MoneyBreakdown,
  PhotoGrid,
  Skeleton,
  cn,
  formatCurrency,
  toast,
} from "@cfc/ui";
import { ProAction, ProActionLayout } from "@/components/pro-action-bar";
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
 *   on the way   → Navigate / Call / WhatsApp, and I'm Here      (Pro 13, 14)
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
 * Four actions, and the inventory names all four: Navigate, Call, WhatsApp,
 * and **I'm Here**. The first three are how they arrive; the last is the one
 * that moves the job forward, so it is the docked action and the other three
 * are a row of buttons.
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

  const travelling = job.status === "on_the_way";
  const working = job.status === "in_progress";

  const arrive = () => {
    // The status change is local: the mock layer has no mutation for it and the
    // real one is a backend call. What matters for the screen is that the pro
    // moves from travelling to working, which is what the UI needs to reflect.
    onChange({ ...job, status: "in_progress" });
    toast.success("Marked as arrived. You can start the work.");
  };

  return (
    <ProActionLayout
      action={
        <ProAction>
          {travelling ? (
            <ArrivalAction job={job} distance={distance} onArrive={arrive} />
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

        {/* Where. The map is a preview; Navigate hands off to the device. */}
        {job.location !== null && (
          <MapView
            className="mt-4 h-block-md"
            markers={[
              { id: "customer", x: 62, y: 40, kind: "customer", label: job.customerName },
              { id: "self", x: 22, y: 68, kind: "self", label: "You" },
            ]}
            route={["self", "customer"]}
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
              {new Date(job.scheduledAt).toLocaleString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
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
                <ContactButton
                  href={waHref(job.customerPhone)}
                  external
                  icon={<MessageCircle className="size-5" aria-hidden="true" />}
                  label="WhatsApp"
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
          <MoneyBreakdown
            className="mt-4"
            grossPaise={job.grossEarningPaise}
            cfcFeePaise={job.grossEarningPaise - job.netEarningPaise}
            netPaise={job.netEarningPaise}
            cfcFeeBps={
              job.grossEarningPaise === job.netEarningPaise
                ? 0
                : CFC_COMMISSION_BPS
            }
            commissionFree={job.grossEarningPaise === job.netEarningPaise}
            payoutNote="Credited to your bank or UPI within 48 hours of completing."
            gstNote
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
  onArrive,
}: {
  job: ProJob;
  distance: ReturnType<typeof useDistanceTo>;
  onArrive: () => void;
}) {
  const { metres, accuracyM, loading, error, retry } = distance;
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

      <Button
        variant={within || error !== null ? "go" : "secondary"}
        size="pro"
        className="mt-3 w-full"
        onClick={onArrive}
      >
        I’m here
      </Button>

      {/* Said plainly when the pro is far away — the button still works, and
          they should know what confirming means. */}
      {!within && error === null && metres !== null && (
        <p className="mt-2 text-caption text-ink-muted">
          You are still {formatMetres(metres)} away. Confirming now will be
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

/** Nothing left to do — completed or cancelled. */
function ClosedAction({ job }: { job: ProJob }) {
  const done = job.status === "completed";
  return (
    <>
      <div
        className={cn(
          "rounded-control border p-3",
          done ? "border-border bg-canvas" : "border-critical-line bg-critical-subtle",
        )}
      >
        <p
          className={cn(
            "text-small font-medium",
            done ? "text-ink" : "text-critical-ink",
          )}
        >
          {done ? "Job completed" : "Job cancelled"}
        </p>
        {done && (
          <p className="mt-px text-caption text-ink-muted">
            You earned {formatCurrency(job.netEarningPaise)}.
          </p>
        )}
      </div>
      <Button variant="secondary" className="mt-3 w-full" asChild>
        <Link href="/jobs">Back to jobs</Link>
      </Button>
    </>
  );
}

// -- Pieces ------------------------------------------------------------------

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
 * WhatsApp, which the inventory asks for and which genuinely works on the web.
 *
 * `wa.me` needs the number with no plus sign and no spaces.
 */
function waHref(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
