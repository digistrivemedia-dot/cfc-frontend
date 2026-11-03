"use client";

import * as React from "react";
import Link from "next/link";
import { Check, MapPin, Plus, TriangleAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, cn } from "@cfc/ui";
import {
  addressLabel,
  addressSummary,
  useSelectedAddress,
} from "@/lib/selected-address";

/**
 * The address control in the app bar.
 *
 * ## What it replaced
 *
 * A hand-written `<button id="addrBtn">` whose text came from the stored
 * **service area** — not from an address — and whose click handler, in
 * `interactions.js`, scrolled to a panel with one text box. "Saving" there
 * rewrote the button's own text and set a module-level `hasAddress = true`.
 * Nothing reached the server, the chosen address did not survive a reload, and
 * no other screen could read it.
 *
 * ## Three states
 *
 *   nothing saved    "Add your address" — an invitation, linking to the form
 *   one saved        that address, selected, with no list to open
 *   several saved    the selected one, and a list to switch between them
 *
 * The label on top and the street underneath, because the label is what a
 * customer recognises at a glance ("Home") and the street is what confirms it
 * is the *right* Home.
 *
 * Keeps the original `addr-btn` class names so it renders identically inside
 * the existing header CSS. The behaviour is React's; the look is unchanged.
 */
export function AddressMenu() {
  const { addresses, selected, ready, select } = useSelectedAddress();
  const [open, setOpen] = React.useState(false);

  // Nothing until storage and the first fetch settle, or a customer who has an
  // address sees "Add your address" flash before their own.
  if (!ready) return null;

  const title = selected ? addressLabel(selected) : "Add your address";
  const sub = selected ? addressSummary(selected) : "Set your location";

  const trigger = (
    <button
      className={cn("addr-btn", selected ? "" : "unset")}
      type="button"
      id="addrBtn"
      aria-label={
        selected
          ? `Booking for ${title}. Change address`
          : "Add your address"
      }
    >
      <svg className="ic" aria-hidden="true">
        <use href="#i-pin"></use>
      </svg>
      <span className="addr-text">
        <b id="addrTitle">{title}</b>
        <span id="addrSub">{sub}</span>
      </span>
      <svg className="ic ic-dn" aria-hidden="true">
        <use href="#i-chev"></use>
      </svg>
    </button>
  );

  // No addresses at all: the control is a link to the form, not a menu over an
  // empty list. One tap instead of two for the only thing it can do.
  if (addresses.length === 0) {
    return (
      <Link href="/addresses" className="contents">
        {trigger}
      </Link>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-line-2xl p-2">
        <p className="px-2 pb-1 pt-1 text-caption font-semibold text-ink-muted">
          Book for
        </p>

        <ul className="max-h-block-sm overflow-y-auto">
          {addresses.map((a) => {
            const active = a.id === selected?.id;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    select(a.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-control px-2 py-2 text-left",
                    "transition-colors duration-fast hover:bg-canvas",
                  )}
                >
                  <MapPin
                    className="mt-px size-4 shrink-0 text-ink-muted"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-small font-semibold text-ink">
                        {addressLabel(a)}
                      </span>
                      {/* Said here, not only at checkout. Choosing an address
                          we cannot serve and finding out two screens later is
                          the surprise this prevents. */}
                      {a.serviceable === false && (
                        <span className="flex shrink-0 items-center gap-1 text-caption text-clock-ink">
                          <TriangleAlert className="size-3" aria-hidden="true" />
                          Not served
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-caption text-ink-muted">
                      {addressSummary(a)}
                    </span>
                  </span>
                  {active && (
                    <Check
                      className="mt-px size-4 shrink-0 text-action"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <Link
          href="/addresses"
          onClick={() => setOpen(false)}
          className={cn(
            "mt-1 flex items-center gap-2 border-t border-border px-2 pb-1 pt-2",
            "text-small font-semibold text-action hover:underline",
          )}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add address
        </Link>
      </PopoverContent>
    </Popover>
  );
}
