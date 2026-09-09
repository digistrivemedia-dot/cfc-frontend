"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * A list of questions, one answer open at a time.
 *
 * Built on buttons and `aria-expanded` rather than a Radix package: the
 * behaviour is a boolean and a region, and the library already avoids
 * dependencies it does not need. `DetailCard`'s collapsible mode works the
 * same way, so the two stay consistent.
 *
 * Single-open by default. FAQs are scanned, not read end to end, and letting
 * every panel stay open turns a short list into a wall a customer has to
 * scroll past to reach the thing they actually came for.
 */
export function Accordion({
  items,
  /** Allows several panels open at once. Rare — long reference lists only. */
  multiple = false,
  className,
}: {
  items: readonly { id: string; question: string; answer: React.ReactNode }[];
  multiple?: boolean | undefined;
  className?: string | undefined;
}) {
  const [open, setOpen] = React.useState<readonly string[]>([]);

  const toggle = (id: string) =>
    setOpen((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return multiple ? [...current, id] : [id];
    });

  return (
    <div
      className={cn(
        "divide-y divide-border overflow-hidden rounded-card border border-border bg-surface",
        className,
      )}
    >
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          open={open.includes(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  );
}

function AccordionRow({
  item,
  open,
  onToggle,
}: {
  item: { id: string; question: string; answer: React.ReactNode };
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = React.useId();

  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            // `h-touch` as a minimum rather than a fixed height: a long
            // question wraps to two lines and the row grows with it.
            "flex min-h-touch w-full items-center justify-between gap-3 px-4 py-3 text-left",
            "text-small font-medium text-ink transition-colors duration-fast",
            "hover:bg-canvas",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          )}
        >
          <span className="min-w-0">{item.question}</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-ink-muted transition-transform duration-fast",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </h3>

      {open && (
        <div
          id={panelId}
          className="px-4 pb-3 text-small leading-relaxed text-ink-muted"
        >
          {item.answer}
        </div>
      )}
    </div>
  );
}
