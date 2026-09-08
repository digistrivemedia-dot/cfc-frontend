"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Date picker, styled to the system.
 *
 * Selected days use action-subtle with a blue edge — never indigo, which reads
 * as disabled. Range middles are a flat action-subtle fill so the span is
 * legible without a gradient.
 */
export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center items-center h-8 relative",
        caption_label: "text-body font-medium text-ink",
        nav: "flex items-center gap-1 absolute right-3 top-3 z-10",
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-control",
          "text-ink-muted hover:bg-action-subtle hover:text-ink",
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-control",
          "text-ink-muted hover:bg-action-subtle hover:text-ink",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-ink-muted w-8 text-caption font-medium",
        week: "flex w-full mt-1",
        day: cn(
          "relative size-8 p-0 text-center text-small",
          "first:[&:has([aria-selected])]:rounded-l-control",
          "last:[&:has([aria-selected])]:rounded-r-control",
        ),
        day_button: cn(
          "inline-flex size-8 items-center justify-center rounded-control",
          "text-ink tabular hover:bg-action-subtle",
        ),
        selected: "bg-action-subtle",
        range_start:
          "rounded-l-control [&>button]:bg-action [&>button]:text-on-action",
        range_end:
          "rounded-r-control [&>button]:bg-action [&>button]:text-on-action",
        range_middle: "bg-action-subtle",
        today: "[&>button]:border [&>button]:border-action",
        outside: "[&>button]:text-ink-muted [&>button]:opacity-50",
        disabled: "[&>button]:opacity-30 [&>button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" {...rest} />
          ) : (
            <ChevronRight className="size-4" {...rest} />
          ),
      }}
      {...props}
    />
  );
}
