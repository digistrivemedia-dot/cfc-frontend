"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "../lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";

/**
 * The filter toolbar every list screen sits behind.
 *
 * Two things it fixes. First, a filter that is set now says so on its own
 * trigger — "Area: Srirangam", not a dropdown labelled "Area" that has to be
 * opened to find out. An operator scanning a list they did not configure can
 * see the shape of it. Second, "N filters · Clear all" is always present when
 * anything is applied, so nobody gets stranded in a view they cannot get out of.
 *
 * Before this, each screen built its own row of bare Selects and its own
 * conditional "Clear filters" button, and no two agreed.
 */

// -- Trigger shared by every filter control ---------------------------------

const triggerBase = [
  "inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-control border",
  "px-2 text-small transition-colors duration-fast",
].join(" ");

function triggerTone(set: boolean): string {
  return set
    ? "border-action bg-action-subtle font-medium text-action-press"
    : "border-border-strong bg-surface text-ink-muted hover:bg-canvas";
}

// -- Single select -----------------------------------------------------------

export interface FilterOption {
  value: string;
  label: string;
  /** Right-aligned count, e.g. how many records carry this value. */
  count?: number | undefined;
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  allLabel = "Any",
  className,
}: {
  label: string;
  options: FilterOption[];
  /** `null` means unset — the filter is not applied. */
  value: string | null;
  onChange: (value: string | null) => void;
  allLabel?: string;
  className?: string | undefined;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(triggerBase, triggerTone(selected !== null), className)}
        >
          {label}
          {selected && (
            <>
              <span aria-hidden="true">:</span>
              <span className="font-semibold">{selected.label}</span>
            </>
          )}
          <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-menu p-1">
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-control px-2 py-2",
            "text-left text-small text-ink transition-colors duration-fast hover:bg-canvas",
          )}
        >
          <Check
            className={cn("size-4 text-action", value !== null && "invisible")}
            aria-hidden="true"
          />
          {allLabel}
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-control px-2 py-2",
              "text-left text-small text-ink transition-colors duration-fast hover:bg-canvas",
            )}
          >
            <Check
              className={cn(
                "size-4 shrink-0 text-action",
                o.value !== value && "invisible",
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {o.count !== undefined && (
              <span className="tabular shrink-0 text-caption text-ink-faint">
                {o.count}
              </span>
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// -- Multi select ------------------------------------------------------------

/**
 * Several values at once — three booking statuses, two areas.
 *
 * Radix Select cannot do this at all, so before now a screen offering "pending
 * or in progress" simply could not exist.
 */
export function FilterMultiSelect({
  label,
  options,
  values,
  onChange,
  searchable = false,
  className,
}: {
  label: string;
  options: FilterOption[];
  values: readonly string[];
  onChange: (values: string[]) => void;
  /** Adds a search field. Worth it past roughly a dozen options. */
  searchable?: boolean;
  className?: string | undefined;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!searchable || query === "") return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const set = new Set(values);
  const toggle = (v: string) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange([...next]);
  };

  // One selection reads better as its own name than as "1 selected".
  const summary =
    values.length === 0
      ? null
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ?? "1")
        : `${values.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(triggerBase, triggerTone(values.length > 0), className)}
        >
          {label}
          {summary && (
            <>
              <span aria-hidden="true">:</span>
              <span className="font-semibold">{summary}</span>
            </>
          )}
          <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-menu-wide p-1">
        {searchable && (
          <div className="flex items-center gap-2 border-b border-border px-2 pb-1">
            <Search className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label={`Search ${label}`}
              className="h-8 w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        )}
        <div className="max-h-block-sm overflow-y-auto pt-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-small text-ink-muted">
              No matches
            </p>
          ) : (
            filtered.map((o) => {
              const on = set.has(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(o.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-control px-2 py-2",
                    "text-left text-small text-ink transition-colors duration-fast hover:bg-canvas",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-control border",
                      on
                        ? "border-action bg-action"
                        : "border-border-strong bg-surface",
                    )}
                    aria-hidden="true"
                  >
                    {on && (
                      <Check className="size-3 text-on-action" strokeWidth={3} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.count !== undefined && (
                    <span className="tabular shrink-0 text-caption text-ink-faint">
                      {o.count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
        {values.length > 0 && (
          <div className="border-t border-border pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onChange([])}
            >
              Clear {label.toLowerCase()}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// -- The bar itself ----------------------------------------------------------

export interface FilterBarProps {
  /** Search field value. Omit the pair to render no search field. */
  search?: string | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  searchPlaceholder?: string;
  searchLabel?: string;
  /** The filter controls — FilterSelect, FilterMultiSelect, DateRangePicker. */
  children?: React.ReactNode;
  /** How many filters are currently applied. Drives the clear affordance. */
  activeCount?: number | undefined;
  onClearAll?: (() => void) | undefined;
  /** Right-aligned result count, e.g. "8 of 12". */
  resultLabel?: React.ReactNode | undefined;
  /** Right-aligned actions — export, column visibility. */
  actions?: React.ReactNode | undefined;
  className?: string | undefined;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  searchLabel = "Search",
  children,
  activeCount = 0,
  onClearAll,
  resultLabel,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border p-3",
        className,
      )}
    >
      {onSearchChange && (
        <Input
          inputSize="sm"
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          icon={<Search />}
          className="min-w-search flex-1"
        />
      )}

      {children}

      {activeCount > 0 && onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
        </Button>
      )}

      {(resultLabel ?? actions) && (
        <div className="ml-auto flex items-center gap-2">
          {resultLabel && (
            <span className="tabular text-small text-ink-muted">
              {resultLabel}
            </span>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
