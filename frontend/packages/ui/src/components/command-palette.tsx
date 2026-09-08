"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * ⌘K — the way to reach anything without navigating.
 *
 * Forty-nine screens behind eleven sidebar entries means most destinations are
 * two or three clicks and a scan away. An operator who knows where they are
 * going should not have to look for it. This is the difference between a panel
 * that is complete and one that is fast.
 *
 * Built on Radix Dialog rather than a command library: the whole behaviour is a
 * filtered list with roving focus, and adding a dependency for that would be
 * more code to reason about, not less.
 */

export interface CommandItem {
  id: string;
  label: string;
  /** Section the item appears under, e.g. "Go to", "Pros". */
  group: string;
  /** Extra text that should match a query but is not displayed as the label. */
  keywords?: string | undefined;
  /** Right-aligned context — an area, an amount, a status. */
  meta?: string | undefined;
  icon?: React.ReactNode | undefined;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  /**
   * Called as the query changes, so a host can fetch matching records. The
   * palette does no fetching of its own — it renders whatever `items` holds.
   */
  onQueryChange?: ((query: string) => void) | undefined;
  /** Shows a subtle busy hint while `onQueryChange` work is in flight. */
  loading?: boolean | undefined;
  emptyLabel?: string;
}

/**
 * Subsequence match, the same rule every command palette uses: the query's
 * characters must appear in order, but not necessarily adjacently, so "prman"
 * finds "Pro management".
 */
function matches(haystack: string, needle: string): boolean {
  if (needle === "") return true;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let i = 0;
  for (const ch of h) {
    if (ch === n[i]) i += 1;
    if (i === n.length) return true;
  }
  return false;
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Search screens, bookings, pros, customers…",
  onQueryChange,
  loading = false,
  emptyLabel = "No matches. Try a booking ID, a pro's name, or a screen.",
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // A palette that remembers last time's query is a palette that has to be
  // cleared before it can be used.
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  React.useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  const filtered = React.useMemo(
    () =>
      items.filter(
        (it) =>
          matches(it.label, query) ||
          (it.keywords !== undefined && matches(it.keywords, query)),
      ),
    [items, query],
  );

  // Grouped for display, but the keyboard walks one flat list — arrow keys must
  // cross a group boundary without the operator noticing there was one.
  const groups = React.useMemo(() => {
    const out = new Map<string, CommandItem[]>();
    for (const it of filtered) {
      const bucket = out.get(it.group);
      if (bucket) bucket.push(it);
      else out.set(it.group, [it]);
    }
    return [...out.entries()];
  }, [filtered]);

  const flat = React.useMemo(() => groups.flatMap(([, its]) => its), [groups]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keep the highlighted row inside the scroll viewport.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const run = (item: CommandItem) => {
    onOpenChange(false);
    item.onSelect();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item) run(item);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(Math.max(0, flat.length - 1));
    }
  };

  let cursor = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-dialog-scrim bg-scrim" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[12vh] z-dialog w-[min(38rem,92vw)] -translate-x-1/2",
            "overflow-hidden rounded-card border border-border bg-surface shadow-lg",
          )}
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">
            Search and commands
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Type to filter. Use the arrow keys to move and Enter to open.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label="Search"
              aria-controls="command-results"
              aria-activedescendant={
                flat[activeIndex] ? `cmd-${flat[activeIndex].id}` : undefined
              }
              className={cn(
                "h-12 w-full bg-transparent text-body text-ink outline-none",
                "placeholder:text-ink-faint",
              )}
            />
            {loading && (
              <span className="shrink-0 text-caption text-ink-faint">
                Searching…
              </span>
            )}
          </div>

          <div
            ref={listRef}
            id="command-results"
            role="listbox"
            aria-label="Results"
            className="max-h-[min(24rem,60vh)] overflow-y-auto p-2"
          >
            {flat.length === 0 ? (
              <p className="px-3 py-8 text-center text-small text-ink-muted">
                {emptyLabel}
              </p>
            ) : (
              groups.map(([group, its]) => (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-3 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide text-ink-faint">
                    {group}
                  </p>
                  {its.map((it) => {
                    cursor += 1;
                    const active = cursor === activeIndex;
                    const myIndex = cursor;
                    return (
                      <button
                        key={it.id}
                        id={`cmd-${it.id}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-active={active}
                        onMouseMove={() => setActiveIndex(myIndex)}
                        onClick={() => run(it)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-control px-3 py-2 text-left",
                          "text-small transition-colors duration-fast",
                          active ? "bg-action-subtle text-ink" : "text-ink",
                        )}
                      >
                        {it.icon && (
                          <span
                            className="shrink-0 text-ink-faint [&_svg]:size-4"
                            aria-hidden="true"
                          >
                            {it.icon}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">{it.label}</span>
                        {it.meta && (
                          <span className="shrink-0 text-caption text-ink-muted">
                            {it.meta}
                          </span>
                        )}
                        {active && (
                          <CornerDownLeft
                            className="size-3 shrink-0 text-ink-faint"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border bg-canvas px-4 py-2 text-caption text-ink-muted">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>to move</span>
            <Kbd>Enter</Kbd>
            <span>to open</span>
            <Kbd>Esc</Kbd>
            <span>to close</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-pill border border-border-strong bg-surface px-2 py-px font-sans text-caption font-medium text-ink-muted">
      {children}
    </kbd>
  );
}

/**
 * Binds ⌘K / Ctrl-K.
 *
 * Deliberately ignores the shortcut while a text field has focus, so typing
 * into a search box never gets hijacked.
 */
export function useCommandPalette(): {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}
