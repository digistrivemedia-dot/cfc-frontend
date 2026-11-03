"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Info, MapPin } from "lucide-react";
import { getProPincodes, saveProPincodes } from "@cfc/mocks";
import {
  Button,
  Checkbox,
  EmptyState,
  InlineAlert,
  Skeleton,
  cn,
  toast,
} from "@cfc/ui";
import { ApiError } from "@cfc/types";

/**
 * Pro 28 — the pincodes this professional will travel to.
 *
 * ## Why pincodes and not areas
 *
 * Dispatch used to match on area *names*, and that broke the moment a real
 * geocoder was involved: OpenStreetMap returns the area CFC calls "Thillai
 * Nagar" as "Trichy Zone IV", so a booking there matched no professional and
 * sat unassigned with nothing explaining it. A pincode is official, fixed, and
 * comes back identically from every provider and every customer.
 *
 * ## A list to tick, not a box to type in
 *
 * The choices are the pincodes **CFC serves**, fetched with the pro's own
 * selection in one call. A free-text field would let someone claim a pincode
 * the platform does not operate in, and the screen would then be promising
 * work that cannot arrive — the server refuses those anyway, but a form that
 * cannot express the mistake is better than one that explains it afterwards.
 *
 * ## Why this matters to the pro, stated on the screen
 *
 * Nothing about "coverage" tells a professional why they should care. "You are
 * only offered jobs in the pincodes you tick" does, and it is the literal
 * behaviour of the dispatch query.
 */
export default function ProPincodesPage() {
  const [available, setAvailable] = React.useState<string[] | null>(null);
  const [mine, setMine] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    void getProPincodes()
      .then((r) => {
        setAvailable(r.available);
        setMine(r.mine);
        setSaved(r.mine);
      })
      .catch(() => setFailed(true));
  }, []);

  React.useEffect(() => load(), [load]);

  // Compared as sets, not arrays: ticking a box and unticking it leaves the
  // same selection in a different order, and that is not a change to save.
  const dirty =
    mine.length !== saved.length || mine.some((p) => !saved.includes(p));

  const toggle = (pincode: string) =>
    setMine((current) =>
      current.includes(pincode)
        ? current.filter((p) => p !== pincode)
        : [...current, pincode],
    );

  const save = () => {
    setBusy(true);
    saveProPincodes(mine)
      .then((r) => {
        setMine(r.mine);
        setSaved(r.mine);
        setAvailable(r.available);
        toast.success("Your work areas are updated.");
      })
      .catch((e: unknown) =>
        toast.error(
          e instanceof ApiError ? e.message : "Could not save. Try again.",
        ),
      )
      .finally(() => setBusy(false));
  };

  return (
    <div className="mx-auto max-w-detail px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Back to profile"
          className={cn(
            "flex size-touch shrink-0 items-center justify-center rounded-control",
            "text-ink-muted transition-colors duration-fast hover:bg-canvas hover:text-ink",
          )}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-title font-semibold text-ink">Where you work</h1>
      </div>

      <InlineAlert tone="info" title="Why this matters" className="mt-4">
        You are only offered jobs in the pincodes you tick here. Tick more to
        see more work; untick one to stop being called out there.
      </InlineAlert>

      {failed ? (
        <div className="mt-4">
          <InlineAlert tone="critical" title="Could not load your work areas">
            <Button variant="secondary" size="sm" className="mt-2" onClick={load}>
              Try again
            </Button>
          </InlineAlert>
        </div>
      ) : available === null ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-touch w-full rounded-control" />
          <Skeleton className="h-touch w-full rounded-control" />
          <Skeleton className="h-touch w-full rounded-control" />
        </div>
      ) : available.length === 0 ? (
        // Not the pro's problem to solve, so it does not read like their fault.
        <div className="mt-4">
          <EmptyState
            icon={<MapPin className="size-6" aria-hidden="true" />}
            title="No pincodes are open yet"
            description="The CFC office has not added any serviced pincodes. Contact support if you think this is wrong."
          />
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {available.map((pincode) => {
              const checked = mine.includes(pincode);
              return (
                <li key={pincode}>
                  <label
                    className={cn(
                      "flex min-h-touch cursor-pointer items-center gap-3 rounded-control border px-3",
                      "transition-colors duration-fast",
                      checked
                        ? "border-action bg-action-subtle"
                        : "border-border bg-surface hover:border-action",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(pincode)}
                    />
                    <span className="tabular text-body font-medium text-ink">
                      {pincode}
                    </span>
                    {checked && (
                      <Check
                        className="ml-auto size-4 shrink-0 text-action"
                        aria-hidden="true"
                      />
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          {/* Said plainly, because an empty selection means no work at all and
              a professional should not discover that from silence. */}
          {mine.length === 0 && (
            <p className="mt-3 flex items-start gap-2 text-caption text-clock-ink">
              <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
              With none ticked you will not be offered any jobs.
            </p>
          )}

          <div className="sticky bottom-4 mt-6">
            <Button
              size="pro"
              className="w-full"
              onClick={save}
              disabled={!dirty || busy}
            >
              {busy ? "Saving…" : dirty ? "Save work areas" : "Saved"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
