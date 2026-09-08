"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "../lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";

/**
 * Searchable single-select.
 *
 * Radix Select cannot filter, so any list longer than a screenful becomes a
 * scroll hunt. Assigning a booking to one of several hundred pros through a
 * plain Select is not a usable interaction, and that is exactly what Admin 10
 * asks for.
 */

export interface ComboboxOption {
  value: string;
  label: string;
  /** Second line — an area, a phone number, a service list. */
  description?: string | undefined;
  /** Right-aligned context. */
  meta?: React.ReactNode | undefined;
  disabled?: boolean | undefined;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Allows clearing back to no selection. */
  clearable?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  "aria-label"?: string | undefined;
  className?: string | undefined;
  size?: "sm" | "md" | undefined;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Type to search",
  emptyLabel = "No matches",
  clearable = false,
  disabled = false,
  id,
  className,
  size = "md",
  ...rest
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (query === "") return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  React.useEffect(() => setActiveIndex(0), [query]);

  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const selected = options.find((o) => o.value === value) ?? null;

  const pick = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    onChange(clearable && opt.value === value ? null : opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) pick(opt);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-label={rest["aria-label"]}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-control border",
            "border-border-strong bg-surface text-left text-ink",
            "transition-colors duration-fast",
            "aria-[invalid=true]:border-critical",
            "disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled disabled:text-disabled-ink",
            size === "sm" ? "h-8 px-2 text-small" : "h-touch px-3 text-body",
            className,
          )}
        >
          <span
            className={cn("truncate", selected === null && "text-ink-faint")}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0 text-ink-faint"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-field w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <div
          ref={listRef}
          role="listbox"
          className="max-h-block-sm overflow-y-auto p-1"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-small text-ink-muted">
              {emptyLabel}
            </p>
          ) : (
            filtered.map((opt, i) => {
              const active = i === activeIndex;
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-active={active}
                  disabled={opt.disabled}
                  onMouseMove={() => setActiveIndex(i)}
                  onClick={() => pick(opt)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-control px-2 py-2 text-left",
                    "text-small transition-colors duration-fast",
                    "disabled:cursor-not-allowed disabled:text-disabled-ink",
                    active && "bg-action-subtle",
                  )}
                >
                  <Check
                    className={cn(
                      "mt-px size-4 shrink-0 text-action",
                      !isSelected && "invisible",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink">{opt.label}</span>
                    {opt.description && (
                      <span className="block truncate text-caption text-ink-muted">
                        {opt.description}
                      </span>
                    )}
                  </span>
                  {opt.meta && (
                    <span className="shrink-0 text-caption text-ink-muted">
                      {opt.meta}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
