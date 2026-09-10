"use client";

import * as React from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { AREA_OPTIONS } from "@cfc/mocks";
import { Popover, PopoverContent, PopoverTrigger, cn } from "@cfc/ui";
import { useArea } from "@/lib/area";

/**
 * Where we are working today.
 *
 * Visible to everyone, signed in or not. A visitor arriving from a search
 * result needs to know the platform covers their area before anything else on
 * the page matters, and they will not create an account to find out.
 *
 * Two states, deliberately different in tone:
 *
 *   nothing chosen   an invitation — "Set your area" — because a guessed
 *                    location that is wrong is worse than an honest question
 *   chosen           the area, with "Change" beside it, so it reads as a
 *                    settled fact that can be corrected rather than as a
 *                    control demanding attention
 *
 * The list is the real service area from the fixtures, not a free-text field.
 * A customer typing "trichy" or a misspelling would match no pros at all, and
 * the resulting empty list looks like a broken site rather than a typo.
 *
 * Built on the shared `Popover` primitive so the list PORTALS to the body.
 * As a plain absolutely-positioned div it was trapped in the sticky header's
 * stacking context, so its `z-popover` was resolved inside the header rather
 * than against the page — and any page section with its own stacking context
 * (`relative isolate`: the active-booking card, the hero, two home bands)
 * painted straight over it. `Popover`, not `DropdownMenu`: these are options
 * in a single-select list, not menu commands.
 */
export function AreaPicker({ className }: { className?: string | undefined }) {
  const { area, setArea, ready } = useArea();
  // Radix owns open/close, outside-click, Escape and focus return, so the
  // hand-rolled listeners this used to carry are gone.
  const [open, setOpen] = React.useState(false);

  // Render nothing until the stored choice is known, so a customer who has
  // already picked an area never sees "Set your area" flash first.
  if (!ready) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          className={cn(
            "flex items-center gap-2 rounded-pill px-3 py-1",
            "text-small transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:outline-focus",
            area
              ? "border border-border bg-surface text-ink hover:border-action-line"
              : "border border-action-line bg-action-subtle text-action hover:bg-surface",
            className,
          )}
        >
          <MapPin className="size-4 shrink-0 text-action" aria-hidden="true" />
          {area ? (
            <>
              {/* "Serving" and "Change" are the desktop treatment. On a phone the
                  row is shared with the search field, so the area name alone
                  carries the meaning and the chevron says it can be changed. */}
              <span className="hidden font-medium sm:inline">Serving</span>
              <span className="max-w-line-md truncate font-medium">{area}</span>
              <span className="hidden font-semibold text-action sm:inline">
                Change
              </span>
            </>
          ) : (
            <span className="font-semibold">Set your area</span>
          )}
          <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        // `p-0`: the primitive pads for prose, but this is a list that needs
        // its own header rule and full-bleed rows.
        className="w-menu overflow-hidden p-0"
      >
        <p className="border-b border-border px-3 py-2 text-caption text-ink-muted">
          Choose where you need the work done
        </p>
        <ul role="listbox" aria-label="Service area" className="max-h-block-sm overflow-y-auto p-1">
          {AREA_OPTIONS.map((option) => {
            const selected = option === area;
            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setArea(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-control px-3 py-2",
                    "text-left text-small",
                    "transition-colors duration-fast hover:bg-action-subtle",
                    "focus-visible:outline-none focus-visible:outline-focus",
                    selected ? "font-semibold text-action" : "text-ink",
                  )}
                >
                  {option}
                  {selected && (
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
