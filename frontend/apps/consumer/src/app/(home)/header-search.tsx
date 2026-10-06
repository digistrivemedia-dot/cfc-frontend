"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSuggestions, useVoiceSearch } from "./use-landing";

/**
 * The signed-in header's search box.
 *
 * This replaces the search half of `home/interactions.js`, which had three
 * faults — one of them a crash on every signed-in screen:
 *
 * 1. **It threw.** `pick()` called `add({...})` to put the service in the
 *    cart, but `add` was removed with the old cart drawer and was defined
 *    nowhere in the file. The module is strict, so clicking any suggestion
 *    raised a ReferenceError and nothing happened. `AppShell` runs that script
 *    on all 21 `(app)` screens, so the header search was dead app-wide.
 *
 * 2. **It showed prices the app does not charge.** The suggestions came from
 *    18 services hardcoded in that file, with their own prices: bathroom
 *    cleaning at ₹549 against the catalogue's ₹799, deep cleaning at ₹2,299
 *    against ₹1,899. Two entries — "Bed bug treatment" and "Fridge not
 *    cooling" — are not in the catalogue at all. `suggestServices()` reads the
 *    same fixtures every other screen does.
 *
 * 3. **Picking a suggestion added to the cart.** Even once `add` existed, that
 *    is the wrong action for a search box: a customer searching for a service
 *    wants to see it, not to have it silently put in their basket at a price
 *    they have not read. `(app)/search/page.tsx` navigates to
 *    `/service/{id}`, and this now matches it.
 *
 * The markup, class names and ARIA are unchanged, because the stylesheet
 * (`styles/landing/`) is not being touched here.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const { items, active, setActive } = useSuggestions(query);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const { listening, toggle } = useVoiceSearch((text) => {
    setQuery(text);
    setOpen(true);
  });

  const pick = React.useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
      router.push(`/service/${id}`);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const hit = items[active];
      if (hit) pick(hit.id);
    }
  };

  const showList = open && query.trim().length >= 2;

  return (
    <div className="app-search" id="appSearch">
      <svg className="ic" aria-hidden="true">
        <use href="#i-search"></use>
      </svg>
      <input
        ref={inputRef}
        id="headerSearchInput"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls="headerSearchSug"
        aria-autocomplete="list"
        aria-label="Search for a home service"
        placeholder="Search for a service"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // A click on a suggestion fires `blur` first. The delay lets the click
        // land; `mousedown` with `preventDefault` on the item is the other
        // half of the same fix.
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      <button
        className={listening ? "mic on" : "mic"}
        type="button"
        id="headerMicBtn"
        aria-label="Search by voice"
        aria-pressed={listening}
        onClick={toggle}
      >
        <svg className="ic" aria-hidden="true">
          <use href="#i-mic"></use>
        </svg>
      </button>

      <div
        className={showList ? "sug open" : "sug"}
        id="headerSearchSug"
        role="listbox"
        aria-label="Service suggestions"
      >
        {showList && items.length === 0 ? (
          <div className="sug-empty">
            <b>Nothing matches that yet</b>
            Try plainer words, like &quot;fan noise&quot; or &quot;tap
            leaking&quot;, or ask us on chat.
          </div>
        ) : (
          items.length > 0 && (
            <>
              <div className="sug-label">
                {items.length +
                  (items.length === 1 ? " service matches" : " services match")}
              </div>
              {items.map((s, idx) => (
                <button
                  key={s.id}
                  className={idx === active ? "sug-item active" : "sug-item"}
                  type="button"
                  role="option"
                  aria-selected={idx === active}
                  // `mousedown`, not `click`: blur fires first and would close
                  // the list before a click could land.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s.id);
                  }}
                >
                  <span className="sug-ic">
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-search"></use>
                    </svg>
                  </span>
                  <span className="sug-main">
                    <b>
                      <Highlight text={s.name} needle={query.trim()} />
                    </b>
                    <span>{s.subCategoryName}</span>
                  </span>
                  {/* No `.sug-price` here, deliberately — the same decision as
                      `hero-search.tsx`. The old markup printed one from its own
                      hardcoded list, and those prices were not the
                      catalogue's. `suggestServices()` returns id, name and
                      subCategoryName only, so a price shown here would have to
                      be invented, and a wrong price in a suggestion is worse
                      than no price at all. The real price is on the service
                      page this navigates to. */}
                </button>
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}

/**
 * The matched substring, wrapped in `<mark>`.
 *
 * The original built this by string concatenation and escaped around the tag.
 * React escapes text by default, so this needs no escaping at all.
 */
function Highlight({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>;
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + needle.length)}</mark>
      {text.slice(i + needle.length)}
    </>
  );
}
