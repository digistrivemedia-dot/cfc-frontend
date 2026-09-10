"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, Loader2, Mic, Search, TrendingUp, X } from "lucide-react";
import { getTrendingSearches, searchServices, suggestServices } from "@cfc/mocks";
import type { ServiceDetail, ServiceSuggestion } from "@cfc/types";
import {
  Button,
  ErrorState,
  NoResultsState,
  Skeleton,
  cn,
  toast,
} from "@cfc/ui";
import { ShopServiceCard } from "@/components/shop-service-card";

/**
 * Customer 8 and 9 — Search, and its results.
 *
 * One route, two states. A results screen that lives at its own URL means the
 * back button takes a customer to an empty search box rather than to what they
 * were doing, and a phone user hits back constantly. Typing narrows in place;
 * `?q=` keeps the result shareable and reloadable.
 *
 * Voice search is behind a capability check. The Web Speech API is
 * Chrome/Edge/Safari only and never Firefox, so the microphone is rendered
 * only where it can actually work — a dead mic button is a worse promise than
 * no mic button at all.
 */

const RECENT_KEY = "cfc_recent_searches";
const RECENT_LIMIT = 6;

/** Reads and writes the per-device search history. */
function useRecentSearches() {
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      // Private mode, or a corrupted value. An empty history is not an error.
    }
  }, []);

  const remember = React.useCallback((term: string) => {
    const value = term.trim();
    if (value === "") return;
    setRecent((current) => {
      const next = [value, ...current.filter((r) => r !== value)].slice(
        0,
        RECENT_LIMIT,
      );
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Non-fatal: the search still runs, it just is not remembered.
      }
      return next;
    });
  }, []);

  const clear = React.useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // Nothing stored to clear.
    }
  }, []);

  return { recent, remember, clear };
}

/**
 * Whether this browser can actually listen.
 *
 * Resolved after mount: the server has no `window`, and rendering a mic during
 * SSR then removing it on hydration is a visible flicker.
 */
function useSpeechSupported(): boolean {
  const [supported, setSupported] = React.useState(false);
  React.useEffect(() => {
    setSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    );
  }, []);
  return supported;
}

/**
 * Sort options.
 *
 * The inventory asks for "sort by rating/price/distance". Rating and price are
 * here; distance is deliberately absent, because a *service* has no location.
 * "Deep home cleaning" is a catalogue entry, not a place — distance belongs to
 * the professional, and one is not assigned until the job is offered at booking
 * time (three nearest pros, per PLATFORM-FACTS). Sorting a catalogue by
 * distance would mean inventing a number for every row.
 *
 * The customer's area is honoured instead, and honestly: it is chosen in the
 * header, applies across the site, and reflects where CFC actually operates.
 */
type SortKey = "relevance" | "rating" | "price-low" | "price-high";

function isSortKey(v: string | null): v is SortKey {
  return (
    v === "relevance" || v === "rating" || v === "price-low" || v === "price-high"
  );
}

const SORTS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Most booked" },
  { value: "rating", label: "Top rated" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  const [input, setInput] = React.useState(query);
  // Sort is a URL param, not component state. It used to reset to "Most
  // booked" on every new search, and a shared results link silently dropped
  // the ordering the sender was looking at.
  const rawSort = params.get("sort");
  const sort: SortKey = isSortKey(rawSort) ? rawSort : "relevance";
  const [results, setResults] = React.useState<ServiceDetail[] | null>(null);
  const [trending, setTrending] = React.useState<string[] | null>(null);
  const [error, setError] = React.useState(false);
  // Live type-ahead, separate from `results`. `results` only exists once a
  // search is committed (Enter, a suggestion, a chip); this is what shows
  // while a customer is still mid-word, before they have decided to search
  // at all.
  const [suggestions, setSuggestions] = React.useState<ServiceSuggestion[] | null>(
    null,
  );
  const [activeSuggestion, setActiveSuggestion] = React.useState(-1);

  const { recent, remember, clear } = useRecentSearches();
  const speechSupported = useSpeechSupported();
  // Whether the mic is actively capturing. Without this a click gave no
  // feedback at all: permission denied looked identical to permission
  // granted, and a customer who was not speaking into the mic yet had no way
  // to know the browser was already listening.
  const [listening, setListening] = React.useState(false);

  React.useEffect(() => setInput(query), [query]);

  React.useEffect(() => {
    getTrendingSearches().then(setTrending).catch(() => setTrending([]));
  }, []);

  // Suggestions while typing, debounced so every keystroke does not fire a
  // request. Keyed on `input` (what is in the box right now), never `query`
  // (what was last actually searched) — those diverge the instant a customer
  // types a second word, which is exactly when a suggestion is most useful.
  React.useEffect(() => {
    const value = input.trim();
    if (value === "" || value === query) {
      setSuggestions(null);
      setActiveSuggestion(-1);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      suggestServices(value)
        .then((rows) => {
          if (!cancelled) {
            setSuggestions(rows);
            setActiveSuggestion(-1);
          }
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [input, query]);

  // The URL is the source of truth, so a shared link and a typed search take
  // exactly the same path.
  React.useEffect(() => {
    if (query.trim() === "") {
      setResults(null);
      return;
    }
    let cancelled = false;
    setError(false);
    setResults(null);
    searchServices(query)
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const run = (term: string) => {
    const value = term.trim();
    if (value === "") return;
    remember(value);
    const qs = new URLSearchParams({ q: value });
    // Carry the ordering across a new search: someone sorted by price who
    // then refines their words still wants price order.
    if (sort !== "relevance") qs.set("sort", sort);
    router.push(`/search?${qs.toString()}`);
  };

  const setSort = (next: SortKey) => {
    const qs = new URLSearchParams({ q: query });
    if (next !== "relevance") qs.set("sort", next);
    router.replace(`/search?${qs.toString()}`);
  };

  const sorted = React.useMemo(() => {
    if (results === null) return null;
    const rows = [...results];
    switch (sort) {
      case "rating":
        return rows.sort((a, b) => b.rating - a.rating);
      case "price-low":
        return rows.sort((a, b) => a.basePricePaise - b.basePricePaise);
      case "price-high":
        return rows.sort((a, b) => b.basePricePaise - a.basePricePaise);
      default:
        return rows.sort((a, b) => b.bookingCount - a.bookingCount);
    }
  }, [results, sort]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 pb-12 md:px-6 lg:px-8">
      {/* The search field is present at every width. It used to be
          `md:hidden` on the reasoning that the desktop header carries one —
          but on the results page that left a desktop customer with no visible
          input to refine the query they were looking at, only a header field
          above the fold. The back button stays mobile-only. */}
      {/* `top-bar` (56px) was the brand row alone — but the mobile header is
          that row PLUS a search-and-area row, so this stuck underneath it and
          scrolled out of sight. `--cfc-mobile-bar` is the measured height of
          the real header; the token takes over from `md`, where the mobile
          header is not rendered at all. */}
      <div
        style={{ top: "var(--cfc-mobile-bar, 104px)" }}
        className="sticky z-sticky -mx-4 bg-canvas px-4 py-3 md:!top-bar-tall md:mx-0 md:px-0"
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
          className="flex items-center gap-2"
        >
          {/* Back is the mobile affordance: search is a full-screen takeover
              on a phone and a page on desktop. */}
          <Button
            type="button"
            variant="ghost"
            size="icon-md"
            className="shrink-0 md:hidden"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft />
          </Button>

          <div className="relative flex min-w-0 flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-3 size-4 text-ink-muted"
              aria-hidden="true"
            />
            <input
              // `type="text"`, not `type="search"`. A search input in Chrome
              // renders its OWN native clear button the moment it has text —
              // on top of the custom `X` button ten lines below, which does
              // the identical job. That produced two clear icons stacked next
              // to each other, one from the browser and one from this code.
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (suggestions === null || suggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveSuggestion((i) => Math.max(i - 1, -1));
                } else if (e.key === "Escape") {
                  setSuggestions(null);
                } else if (e.key === "Enter" && activeSuggestion >= 0) {
                  // A highlighted row wins over the raw typed text — the
                  // customer arrowed to it on purpose.
                  e.preventDefault();
                  const picked = suggestions[activeSuggestion];
                  if (picked) {
                    setSuggestions(null);
                    router.push(`/service/${picked.id}`);
                  }
                }
              }}
              placeholder="Search for a service"
              aria-label="Search for a service"
              autoComplete="off"
              role="combobox"
              aria-expanded={suggestions !== null && suggestions.length > 0}
              aria-controls="search-suggestions"
              aria-activedescendant={
                activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined
              }
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={query === ""}
              className={cn(
                "h-touch w-full rounded-control border border-border bg-surface",
                "pl-8 pr-8 text-body text-ink placeholder:text-ink-faint",
                // `ring-focus` generates no CSS — the preset defines
                // `outlineColor.focus`, never a ring colour — so this input's
                // focus ring was invisible. See CONSUMER-OPEN-ITEMS 7.18.
                "focus:border-action focus-visible:outline-focus",
              )}
            />
            {input !== "" && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setSuggestions(null);
                  router.push("/search");
                }}
                aria-label="Clear search"
                className="absolute right-2 flex size-6 items-center justify-center rounded-full text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Type-ahead dropdown. Shown only while `input` differs from the
                committed `query` — the moment a search runs, this is not what
                the customer is looking at any more, the results grid is. */}
            {suggestions !== null && suggestions.length > 0 && (
              <ul
                id="search-suggestions"
                role="listbox"
                className={cn(
                  "absolute left-0 right-0 top-full z-sticky mt-1 max-h-block-sm overflow-y-auto",
                  "rounded-card border border-border bg-surface py-1 shadow-lg",
                )}
              >
                {suggestions.map((s, i) => (
                  <li key={s.id} role="presentation">
                    <button
                      id={`search-suggestion-${i}`}
                      role="option"
                      aria-selected={i === activeSuggestion}
                      type="button"
                      // Mousedown, not click: click fires after the input's own
                      // blur, and blur was already closing the dropdown first —
                      // so a click landed on nothing. Mousedown runs before blur.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSuggestions(null);
                        router.push(`/service/${s.id}`);
                      }}
                      onMouseEnter={() => setActiveSuggestion(i)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-small",
                        i === activeSuggestion ? "bg-action-subtle text-action" : "text-ink",
                      )}
                    >
                      <Search className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      <span className="shrink-0 text-caption text-ink-faint">
                        {s.subCategoryName}
                      </span>
                    </button>
                  </li>
                ))}

                {/* "See all results" always closes the list with the full
                    search — arrowing past every suggestion should not be the
                    only way to run the broader query. */}
                <li role="presentation" className="mt-1 border-t border-border pt-1">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSuggestions(null);
                      run(input);
                    }}
                    className="w-full px-3 py-2 text-left text-caption font-medium text-action hover:underline"
                  >
                    See all results for “{input}”
                  </button>
                </li>
              </ul>
            )}
          </div>

          {speechSupported && (
            <Button
              type="button"
              variant={listening ? "primary" : "secondary"}
              size="icon-md"
              className="shrink-0"
              aria-label={listening ? "Listening…" : "Search by voice"}
              aria-pressed={listening}
              disabled={listening}
              onClick={() =>
                startVoiceSearch(setInput, run, setListening)
              }
            >
              {listening ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Mic aria-hidden="true" />
              )}
            </Button>
          )}
        </form>
      </div>

      {query.trim() === "" ? (
        <Discovery
          recent={recent}
          trending={trending}
          onPick={run}
          onClearRecent={clear}
        />
      ) : (
        <Results
          query={query}
          rows={sorted}
          error={error}
          sort={sort}
          onSortChange={setSort}
          trending={trending}
          onPickTrending={run}
          onClear={() => router.push("/search")}
        />
      )}
    </div>
  );
}

/**
 * Web Speech, where it exists.
 *
 * Deliberately not a hook and not wrapped in a library: it is one API call
 * behind a capability check, and the button that reaches it is only rendered
 * where the API is present.
 *
 * Carries the full lifecycle, not just the happy path. The original only
 * wired `onresult` — a denied microphone permission or a recognition failure
 * produced no error, no toast, nothing: the button looked pressed and then
 * looked like it had done nothing, which is indistinguishable from broken.
 * `onstart`/`onend` drive the button's listening indicator so a customer
 * knows to actually speak, and `onerror` turns the two errors a person can
 * hit — no permission, or no speech heard — into a message that tells them
 * what to do next.
 */
function startVoiceSearch(
  setInput: (value: string) => void,
  run: (term: string) => void,
  setListening: (value: boolean) => void,
) {
  const Recognition =
    (window as unknown as Record<string, unknown>)["SpeechRecognition"] ??
    (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"];
  if (typeof Recognition !== "function") return;

  const recognition = new (Recognition as new () => {
    lang: string;
    interimResults: boolean;
    start: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: unknown) => void) | null;
    onresult: ((event: unknown) => void) | null;
  })();

  recognition.lang = "en-IN";
  recognition.interimResults = false;

  recognition.onstart = () => setListening(true);
  recognition.onend = () => setListening(false);

  recognition.onerror = (event: unknown) => {
    const error = (event as { error?: string }).error;
    if (error === "not-allowed" || error === "service-not-allowed") {
      toast.error("Microphone access is blocked. Allow it in your browser settings to search by voice.");
    } else if (error === "no-speech") {
      toast.error("Didn't catch that. Try again and speak after the mic turns on.");
    } else if (error !== "aborted") {
      // "aborted" fires when a customer starts a second recognition or
      // navigates away mid-listen — expected, not a failure worth a toast.
      toast.error("Voice search isn't working right now. Try typing instead.");
    }
  };

  recognition.onresult = (event: unknown) => {
    const results = (event as { results?: ArrayLike<ArrayLike<{ transcript?: string }>> })
      .results;
    const transcript = results?.[0]?.[0]?.transcript;
    if (typeof transcript === "string" && transcript.trim() !== "") {
      setInput(transcript);
      run(transcript);
    }
  };

  recognition.start();
}

/** Customer 8 — what to show before anything is typed. */
function Discovery({
  recent,
  trending,
  onPick,
  onClearRecent,
}: {
  recent: string[];
  trending: string[] | null;
  onPick: (term: string) => void;
  onClearRecent: () => void;
}) {
  return (
    <div className="mt-4 space-y-6">
      {recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-small font-semibold text-ink">Recent</h2>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-caption text-action hover:underline"
            >
              Clear
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {recent.map((term) => (
              <li key={term}>
                <TermChip icon={<Clock />} label={term} onClick={() => onPick(term)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* An empty trending list rendered a heading with nothing beneath it.
          If there is nothing to suggest, the section does not appear. */}
      {(trending === null || trending.length > 0) && (
      <section>
        <h2 className="mb-2 text-small font-semibold text-ink">
          Trending right now
        </h2>
        {trending === null ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-line-md rounded-pill" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {trending.map((term) => (
              <li key={term}>
                <TermChip
                  icon={<TrendingUp />}
                  label={term}
                  onClick={() => onPick(term)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      {/* Nothing recent and nothing trending: send them to the catalogue
          rather than showing an empty screen. */}
      {recent.length === 0 && trending !== null && trending.length === 0 && (
        <p className="text-small text-ink-muted">
          Search for a service by name, or{" "}
          <Link href="/categories" className="font-medium text-action hover:underline">
            browse every category
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function TermChip({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-touch items-center gap-2 rounded-pill border border-border bg-surface px-3",
        "text-small text-ink transition-colors duration-fast",
        "hover:border-action-line hover:bg-action-subtle",
        "[&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-ink-muted",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Customer 9 — the filtered list. */
function Results({
  query,
  rows,
  error,
  sort,
  onSortChange,
  trending,
  onPickTrending,
  onClear,
}: {
  query: string;
  rows: ServiceDetail[] | null;
  error: boolean;
  sort: SortKey;
  onSortChange: (next: SortKey) => void;
  trending: string[] | null;
  onPickTrending: (term: string) => void;
  onClear: () => void;
}) {
  const router = useRouter();

  if (error) {
    return (
      <div className="mt-6">
        <ErrorState
          title="Search is unavailable"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => router.refresh() }}
        />
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-block-md rounded-card" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-6">
        <NoResultsState
          title={`Nothing matches “${query}”`}
          // "Browse by category" used to be the only way out, and pointed at
          // `onClearFilters={() => router.push("/categories")}` — clicking it
          // left search entirely rather than clearing the query, so a typo
          // meant abandoning search rather than trying again. It now clears
          // the box and drops back to this same screen's Discovery state,
          // where trending is right there below.
          description="Try a shorter word, or pick something trending below."
          onClearFilters={onClear}
        />

        {trending !== null && trending.length > 0 && (
          <div className="mx-auto mt-8 max-w-screen-sm">
            <h2 className="mb-2 text-center text-small font-semibold text-ink">
              Trending right now
            </h2>
            <ul className="flex flex-wrap justify-center gap-2">
              {trending.map((term) => (
                <li key={term}>
                  <TermChip
                    icon={<TrendingUp />}
                    label={term}
                    onClick={() => onPickTrending(term)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="tabular text-small text-ink-muted">
          {rows.length} {rows.length === 1 ? "service" : "services"}
        </p>

        {/* A native select on purpose: on a phone this opens the OS picker,
            which is faster and more familiar than a custom sheet. */}
        <label className="flex items-center gap-2 text-small text-ink-muted">
          <span className="shrink-0">Sort</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className={cn(
              "h-field rounded-control border border-border bg-surface px-2",
              "text-small text-ink focus:border-action focus:outline-none",
            )}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {rows.map((service) => (
          <li key={service.id}>
            {/* Results carry an Add button like every other list of services.
                Someone who searched "deep clean" and found it should not have
                to open the service and come back to collect it. */}
            <ShopServiceCard
              id={service.id}
              name={service.name}
              subCategoryName={service.subCategoryName}
              fromPricePaise={service.basePricePaise}
              rating={service.rating}
              reviewCount={service.reviewCount}
              imageUrl={service.imageUrls[0]}
              description={service.description}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 lg:px-8">
          <Skeleton className="h-touch rounded-control" />
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
