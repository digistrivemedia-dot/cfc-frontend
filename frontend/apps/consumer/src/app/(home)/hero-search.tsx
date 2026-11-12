"use client";

import * as React from "react";
import { useSuggestions, useVoiceSearch } from "./use-landing";

/**
 * The hero search bar: input, suggestion list, voice control.
 *
 * Ported from `interactions.js`, which built this list with `innerHTML` and
 * re-bound every handler on each keystroke. Two things change with the port:
 *
 * 1. **The suggestions come from the real catalogue.** The old version matched
 *    against a hardcoded list of 24 services with their own prices, written
 *    into that file. The catalogue is not those 24 services and does not have
 *    those prices, so the page could offer something the app does not sell —
 *    and would drift further every time a service was added. `suggestServices()`
 *    reads the same fixtures every other screen does.
 *
 * 2. **The matched text is highlighted with JSX, not a string.** The old
 *    `mark()` built `<mark>` tags by concatenation and escaped around them;
 *    React escapes by default, so the same result needs no escaping at all.
 *
 * The markup, class names and ARIA are otherwise unchanged, because the
 * stylesheet is not being touched in this phase.
 */
/** The popular searches, as they appear in the approved design. */
const CHIPS = ["AC service", "Deep cleaning", "Sofa shampooing", "Electrician"] as const;

export function HeroSearch() {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const { items, active, setActive } = useSuggestions(query);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // `supported` is deliberately unread: the button always renders, and the
  // hook falls back to a scripted sequence where the Speech API is absent.
  const { listening, status, toggle } = useVoiceSearch((text) => setQuery(text));

  const pick = React.useCallback((name: string) => {
    setQuery(name);
    setOpen(false);
    inputRef.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      if (hit) pick(hit.name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const label =
    query.trim().length === 0
      ? "Booked most often near you"
      : items.length + (items.length === 1 ? " service matches" : " services match");

  return (
    <div className="ask">
      <div className="ask-field">
        <div className={listening ? "ask-bar listening" : "ask-bar"} id="askBar">
          <svg className="ic ic-search" aria-hidden="true">
            <use href="#i-search"></use>
          </svg>
          <input
            ref={inputRef}
            id="askInput"
            type="text"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="sug"
            aria-autocomplete="list"
            aria-label="Search for a home service"
            placeholder="Search or speak a service"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            // A click on a suggestion fires `blur` first. The delay lets the
            // click land before the list is removed; `mousedown` on the item
            // with `preventDefault` was the original fix for the same race.
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
          />
          {/* Always rendered, as the original was.
              `useVoiceSearch` already handles the absence of the Web Speech
              API by running a short scripted sequence instead — that was the
              original's `if (!SR) { runDemo(); return; }`. Hiding the button
              where the API is missing would remove a control the approved
              design has, and change the layout on Firefox and in any headless
              browser. */}
          <button
            className={listening ? "mic on" : "mic"}
            type="button"
            id="micBtn"
            aria-label="Search by voice"
            aria-pressed={listening}
            onClick={toggle}
          >
            <svg className="ic" aria-hidden="true">
              <use href="#i-mic"></use>
            </svg>
          </button>
          <button className="btn btn-primary ask-go" type="button" id="askGo">
            <span>Search</span>
            <svg className="ic" aria-hidden="true" style={{ width: "18px", height: "18px" }}>
              <use href="#i-search"></use>
            </svg>
          </button>
        </div>

        <div
          className={open && query.trim().length >= 2 ? "sug open" : "sug"}
          id="sug"
          role="listbox"
          aria-label="Service suggestions"
        >
          {query.trim().length >= 2 && items.length === 0 ? (
            <div className="sug-empty">
              <b>Nothing matches that yet</b>
              Try a plainer description, like &quot;fan noise&quot; or &quot;tap
              leaking&quot;. Our team can also take it on call at 1800 XXX 4567.
            </div>
          ) : (
            items.length > 0 && (
              <>
                <div className="sug-label">{label}</div>
                {items.map((s, idx) => (
                  <button
                    key={s.id}
                    className={idx === active ? "sug-item active" : "sug-item"}
                    type="button"
                    role="option"
                    aria-selected={idx === active}
                    // `mousedown`, not `click`: blur fires first and would
                    // close the list before a click could land.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(s.name);
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
                    {/* No `.sug-price` here, deliberately.
                        The original printed one from its own hardcoded list,
                        which is the bug this port removes: those prices were
                        not the catalogue's. `suggestServices()` returns id,
                        name and subCategoryName only — so a price shown here
                        would have to be invented, and a wrong price in a
                        suggestion is worse than no price at all. */}
                  </button>
                ))}
              </>
            )
          )}
        </div>
      </div>

      <div
        className={listening || status ? "ask-status show" : "ask-status"}
        id="askStatus"
        role="status"
        aria-live="polite"
      >
        <span className="bars">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </span>
        <span id="askStatusText">
          {status || 'Listening. Say something like "my tap is leaking"'}
        </span>
      </div>

      <div className="chips">
        <span className="chip-label">Popular:</span>
        {CHIPS.map((c) => (
          <button
            key={c}
            className="chip"
            type="button"
            onClick={() => {
              setQuery(c);
              inputRef.current?.focus();
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The matched substring, wrapped in `<mark>`.
 *
 * The original concatenated HTML and escaped around the tag. React escapes
 * text by default, so this renders the same result with nothing to get wrong.
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
