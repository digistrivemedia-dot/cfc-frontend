"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, Mic, Search, TrendingUp, X } from "lucide-react";
import { getTrendingSearches, searchServices } from "@cfc/mocks";
import type { ServiceDetail } from "@cfc/types";
import {
  Button,
  ErrorState,
  NoResultsState,
  ServiceCard,
  Skeleton,
  cn,
} from "@cfc/ui";

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

type SortKey = "relevance" | "rating" | "price-low" | "price-high";

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
  const [results, setResults] = React.useState<ServiceDetail[] | null>(null);
  const [trending, setTrending] = React.useState<string[] | null>(null);
  const [sort, setSort] = React.useState<SortKey>("relevance");
  const [error, setError] = React.useState(false);

  const { recent, remember, clear } = useRecentSearches();
  const speechSupported = useSpeechSupported();

  React.useEffect(() => setInput(query), [query]);

  React.useEffect(() => {
    getTrendingSearches().then(setTrending).catch(() => setTrending([]));
  }, []);

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
    router.push(`/search?q=${encodeURIComponent(value)}`);
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
      {/* Mobile only. The desktop header already carries a search field, and
          two boxes for one job is a worse screen than one. */}
      <div className="sticky top-bar z-sticky -mx-4 bg-canvas px-4 py-3 md:hidden">
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
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search for a service"
              aria-label="Search for a service"
              autoComplete="off"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={query === ""}
              className={cn(
                "h-touch w-full rounded-control border border-border bg-surface",
                "pl-8 pr-8 text-body text-ink placeholder:text-ink-faint",
                "focus:border-action focus:outline-none focus:ring-2 focus:ring-focus",
              )}
            />
            {input !== "" && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  router.push("/search");
                }}
                aria-label="Clear search"
                className="absolute right-2 flex size-6 items-center justify-center rounded-full text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {speechSupported && (
            <Button
              type="button"
              variant="secondary"
              size="icon-md"
              className="shrink-0"
              aria-label="Search by voice"
              onClick={() => startVoiceSearch(setInput, run)}
            >
              <Mic />
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
 */
function startVoiceSearch(
  setInput: (value: string) => void,
  run: (term: string) => void,
) {
  const Recognition =
    (window as unknown as Record<string, unknown>)["SpeechRecognition"] ??
    (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"];
  if (typeof Recognition !== "function") return;

  const recognition = new (Recognition as new () => {
    lang: string;
    interimResults: boolean;
    start: () => void;
    onresult: ((event: unknown) => void) | null;
  })();

  recognition.lang = "en-IN";
  recognition.interimResults = false;
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
}: {
  query: string;
  rows: ServiceDetail[] | null;
  error: boolean;
  sort: SortKey;
  onSortChange: (next: SortKey) => void;
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
          description="Try a shorter word, or browse by category instead."
          onClearFilters={() => router.push("/categories")}
        />
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
            <ServiceCard
              name={service.name}
              categoryName={service.categoryName}
              fromPricePaise={service.basePricePaise}
              rating={service.rating}
              reviewCount={service.reviewCount}
              imageUrl={service.imageUrls[0]}
              href={`/service/${service.id}`}
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
