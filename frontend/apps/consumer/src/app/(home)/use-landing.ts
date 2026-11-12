"use client";

import * as React from "react";

/**
 * The landing page's interactions, as React state.
 *
 * These replace `interactions.js`, which drove the same behaviours by reaching
 * into the DOM with `getElementById` and toggling classes. React assumes it
 * owns the DOM; a second system mutating the same elements is how you get bugs
 * that only appear sometimes and cannot be reproduced on demand.
 *
 * Each hook here owns one behaviour, returns state, and cleans up after
 * itself. Nothing outside React touches an element.
 */

/**
 * Page scroll position, as two booleans the header and mobile bar read.
 *
 * `passive: true` matters: a scroll listener that might call
 * `preventDefault()` forces the browser to wait for it before painting, which
 * is felt as jank on a long page.
 */
export function useScrollState() {
  const [stuck, setStuck] = React.useState(false);
  const [barVisible, setBarVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setStuck(y > 8);
      setBarVisible(y > 520);
    };
    onScroll(); // the page may load already scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { stuck, barVisible };
}

/**
 * The mobile menu sheet.
 *
 * Locks body scroll while open — without it the page behind the sheet scrolls
 * under the finger, which reads as the sheet itself being broken. The lock is
 * released on unmount as well as on close, so navigating away mid-open cannot
 * leave the page permanently unscrollable.
 */
export function useSheet() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen };
}

/**
 * Reveal-on-scroll for the two sections that use it.
 *
 * Returns a ref to attach and whether the element has been seen. Once seen it
 * stays seen — a section that faded out again on scroll-up would be a
 * distraction rather than an entrance.
 *
 * Without `IntersectionObserver` the content is shown immediately rather than
 * hidden forever, which is the only safe failure for a reveal effect.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, seen };
}

/**
 * Reveal-on-scroll for every `.rv` element on the page, including ones that
 * arrive later.
 *
 * There were two observers doing this: `interactions.js` collected `.rv` once
 * at startup, and `useRevealLateContent` was added afterwards to catch the
 * tiles that arrive with the catalogue — because the grids render from a fetch
 * that resolves after startup, and a tile the first observer never saw would
 * sit at `opacity: 0` forever. An invisible category grid is the kind of
 * failure that looks like nothing at all rather than like an error.
 *
 * The second observer existed only to avoid editing the transcribed
 * `interactions.js`. With that file gone there is no reason for two, so this
 * is one observer that re-scans when `ready` changes.
 *
 * `.in` is still set through `classList` rather than React state, deliberately:
 * the eight `.rv` elements sit in six different sections, and threading a flag
 * to each would mean restructuring markup this phase is committed to leaving
 * untouched. Phase 3 revisits it when the markup is in scope anyway.
 */
export function useRevealAll(ready: boolean): void {
  React.useEffect(() => {
    const pending = document.querySelectorAll<HTMLElement>(".cfc-page .rv:not(.in)");
    if (pending.length === 0) return;

    // Same fallback as the prototype: without IntersectionObserver everything
    // is simply shown rather than left hidden.
    if (!("IntersectionObserver" in window)) {
      pending.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }
      },
      // The original's margin and threshold, so a late tile reveals at the
      // same scroll position as one that was there from the start.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    pending.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ready]);
}

/**
 * A popover that closes on outside click and on Escape.
 *
 * Shared by the location picker and the search suggestion list, which had
 * near-identical open/close handling in the original.
 */
export function useDismissable<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} {
  const ref = React.useRef<T | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { ref, open, setOpen };
}

/**
 * Drag-to-scroll for the most-booked rail, plus arrow stepping.
 *
 * The rail is a horizontal scroller. On a phone it scrolls by touch; on a
 * desktop a mouse has no such gesture, so the arrows and a click-drag are what
 * make it usable.
 *
 * `scrollBy` with `behavior: "smooth"` is deliberate — a rail that jumps loses
 * the reader's place in a way an eased scroll does not.
 *
 * Three guards are carried over from `interactions.js` verbatim, because each
 * one exists to stop a real misbehaviour:
 *
 *   - **Touch is ignored.** A phone already scrolls the rail natively. Running
 *     drag logic as well would fight the browser's own momentum scrolling.
 *   - **A press that starts on a button or link is ignored.** The cards have
 *     controls inside them; hijacking that press would make them unclickable.
 *   - **The drag only engages after 4px of movement.** Capturing the pointer
 *     on `pointerdown` would swallow the click, so a steady press followed by
 *     a release must still reach the control underneath.
 *
 * `progress` and `atStart`/`atEnd` drive the progress bar and the arrows'
 * disabled state. They are returned rather than written to the DOM, so React
 * stays the only thing that renders.
 */
export function useRail<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  // `width` is how much of the rail is visible, as a percentage; `offset` is
  // how far along the bar that window sits. Both start at the values the
  // original's `syncRail()` produces for an unscrolled rail.
  const [progress, setProgress] = React.useState({ width: 100, offset: 0 });
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const step = React.useCallback(() => {
    const el = ref.current;
    if (!el) return 0;
    // 42% of the visible width: far enough to feel like progress, short
    // enough that a partially visible card still hints at what is next.
    return Math.max(260, el.clientWidth * 0.42);
  }, []);

  const scrollByStep = React.useCallback(
    (direction: 1 | -1) => {
      const el = ref.current;
      if (!el) return;
      el.scrollBy({ left: direction * step(), behavior: "smooth" });
    },
    [step],
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pct = max > 0 ? el.scrollLeft / max : 0;
      // A floor of 14% so the indicator stays visible on a very long rail.
      const visible = max > 0 ? Math.max(14, (el.clientWidth / el.scrollWidth) * 100) : 100;
      setProgress({ width: visible, offset: pct * (100 - visible) });
      // The 4px tolerance absorbs sub-pixel scroll positions, which otherwise
      // leave the arrow enabled at a position the user cannot scroll past.
      setAtStart(el.scrollLeft < 4);
      setAtEnd(el.scrollLeft > max - 4);
    };

    let drag: { x: number; left: number; moved: boolean; id: number } | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if ((e.target as HTMLElement | null)?.closest("button, a")) return;
      drag = { x: e.clientX, left: el.scrollLeft, moved: false, id: e.pointerId };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4 && !drag.moved) {
        drag.moved = true;
        el.classList.add("dragging");
        try {
          el.setPointerCapture(drag.id);
        } catch {
          // Capture is a refinement, not a requirement: without it the drag
          // still works, it just stops if the pointer leaves the rail.
        }
      }
      if (drag.moved) el.scrollLeft = drag.left - dx;
    };
    const onEnd = () => {
      if (!drag) return;
      drag = null;
      el.classList.remove("dragging");
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onEnd);
    el.addEventListener("pointercancel", onEnd);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onEnd);
      el.removeEventListener("pointercancel", onEnd);
    };
  }, []);

  return { ref, scrollByStep, progress, atStart, atEnd };
}

/**
 * Search suggestions, from the real catalogue.
 *
 * `interactions.js` matched against a hardcoded list of 24 services written
 * into that file. The catalogue is not 24 services and does not have those
 * prices, so the suggestion list could offer something the app does not sell —
 * and would drift further every time a service was added.
 *
 * `suggestServices()` searches the same fixtures every other screen reads,
 * ordered by booking count, so the list leads with what people actually book.
 */
export function useSuggestions(query: string) {
  const [items, setItems] = React.useState<
    { id: string; name: string; subCategoryName: string }[]
  >([]);
  const [active, setActive] = React.useState(-1);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      setActive(-1);
      return;
    }

    // Debounced: a request per keystroke is wasteful against a real backend
    // and arrives out of order often enough to show stale results.
    let live = true;
    const timer = window.setTimeout(() => {
      void import("@cfc/mocks").then(({ suggestServices }) =>
        suggestServices(q, 6)
          .then((rows) => {
            if (live) {
              setItems(rows);
              setActive(-1);
            }
          })
          .catch(() => {
            if (live) setItems([]);
          }),
      );
    }, 180);

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return { items, active, setActive };
}

/**
 * Voice search.
 *
 * The Web Speech API is Chrome, Edge and Safari only — never Firefox — so the
 * mic is offered only where it exists. Where it does not, a short scripted
 * sequence shows what the feature does rather than a dead button.
 *
 * `en-IN` matters: the same sentence recognised as en-US mangles Indian place
 * names and service words often enough to be useless.
 */
export function useVoiceSearch(onTranscript: (text: string) => void) {
  const [supported, setSupported] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const recognition = React.useRef<any>(null);
  const timers = React.useRef<number[]>([]);

  React.useEffect(() => {
    const w = window as any;
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      timers.current.forEach(window.clearTimeout);
      if (recognition.current) {
        try {
          recognition.current.stop();
        } catch {
          // Already stopped, or never started.
        }
      }
    };
  }, []);

  const clearTimers = React.useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  /** What the feature does, for browsers that cannot do it. */
  const runDemo = React.useCallback(() => {
    clearTimers();
    setListening(true);
    setStatus('Listening. Try saying "my tap is leaking"');
    timers.current.push(
      window.setTimeout(() => setStatus('Heard: "my tap is leaking"'), 2200),
    );
    timers.current.push(
      window.setTimeout(() => {
        onTranscript("Tap and mixer repair");
        setListening(false);
        setStatus("Found 3 plumbing services near you");
      }, 3400),
    );
    timers.current.push(window.setTimeout(() => setStatus(""), 6400));
  }, [clearTimers, onTranscript]);

  const toggle = React.useCallback(() => {
    if (listening) {
      clearTimers();
      if (recognition.current) {
        try {
          recognition.current.stop();
        } catch {
          // Already stopped.
        }
      }
      setListening(false);
      setStatus("");
      return;
    }

    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      runDemo();
      return;
    }

    try {
      const rec = new SR();
      recognition.current = rec;
      rec.lang = "en-IN";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onstart = () => {
        setListening(true);
        setStatus("Listening. Say the problem in your own words");
      };
      rec.onresult = (e: any) => {
        let text = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        onTranscript(text);
        setStatus("Heard: " + text);
      };
      rec.onerror = () => {
        setListening(false);
        runDemo();
      };
      rec.onend = () => setListening(false);
      rec.start();
    } catch {
      runDemo();
    }
  }, [listening, clearTimers, runDemo, onTranscript]);

  return { supported, listening, status, toggle };
}

/**
 * The four behaviours `use-landing.ts` does not yet cover.
 *
 * Found by auditing `interactions.js` section by section rather than trusting
 * the earlier hook list. Without these, Phase 1 would delete behaviour rather
 * than port it.
 */

/**
 * The seamless testimonial marquee.
 *
 * The original cloned every child once at runtime so the track could scroll
 * continuously without a visible jump at the seam. In React the duplicate is
 * rendered from the same data instead — no DOM mutation, and the clone can
 * never drift from the original because there is only one source.
 *
 * The copy is `aria-hidden`: a screen reader that read every testimonial twice
 * would be worse than one that read them once.
 */
export function useMarquee<T>(items: T[]): { items: T[]; duplicate: T[] } {
  return { items, duplicate: items };
}

/**
 * A number that counts up when it scrolls into view.
 *
 * 1100ms, eased with a cubic ease-out — the same curve and duration the
 * original used, so the motion is identical.
 *
 * Honours `prefers-reduced-motion` by showing the final value immediately.
 * That is not a nicety: the original checked it too, and a count-up is exactly
 * the kind of motion people turn off.
 *
 * **It starts at the final value, not at zero.** The original left the number
 * in the HTML alone until the element scrolled into view, so someone who never
 * scrolled that far — or who had JavaScript fail — still read "48 hour
 * payouts". Starting at 0 would instead replace the server-rendered number
 * with a zero on hydration and leave it there, which is both a visible flash
 * and, for a stat about payout speed, briefly wrong.
 *
 * The animation overwrites this the moment it begins, so the motion is
 * unchanged; only the state before it differs, and it differs by matching what
 * the server already sent.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  target: number,
  // No thousands separator option, deliberately. The original had one, but
  // nothing on this page uses it - both counters are plain (48, 15%) - and
  // formatting a number for display is the shared formatters' job in
  // `@cfc/ui`, which the lint rule enforces. A second way to format a number,
  // reachable from a marketing counter, is how "one formatter everywhere"
  // stops being true.
  options: { decimals?: number; prefix?: string; suffix?: string } = {},
) {
  const { decimals = 0, prefix = "", suffix = "" } = options;
  const ref = React.useRef<T | null>(null);
  const [value, setValue] = React.useState(target);
  const [done, setDone] = React.useState(false);

  const format = React.useCallback(
    (v: number) => {
      const out = decimals ? v.toFixed(decimals) : Math.round(v).toString();
      return prefix + out + suffix;
    },
    [decimals, prefix, suffix],
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el || done) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      setValue(target);
      setDone(true);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setDone(true);
        let start: number | null = null;
        const DURATION = 1100;
        const frame = (t: number) => {
          if (start === null) start = t;
          const k = Math.min(1, (t - start) / DURATION);
          // Cubic ease-out — the original curve, unchanged.
          setValue(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) raf = requestAnimationFrame(frame);
        };
        // The first frame is what takes it from the server-rendered final
        // value down to 0; `requestAnimationFrame` runs before paint, so the
        // zero is computed and replaced within the same frame and is never
        // drawn.
        raf = requestAnimationFrame(frame);
      },
      // 0.6 — the original's threshold. A lower one starts the count while
      // the number is still near the fold, so most of the animation plays
      // before it is properly in view.
      { threshold: 0.6 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, done]);

  return { ref, text: format(value) };
}

/**
 * The hero's live booking tracker.
 *
 * A loop: an ETA counts 32 → 28 minutes at 2s a step, flips to "Arrived" with
 * every step marked done, holds for 5.2s, then resets. It is a demonstration
 * of the product, running on the marketing page.
 *
 * Two details carried over deliberately:
 *
 *   - `document.hidden` pauses it. A background tab burning timers for an
 *     animation nobody is watching is wasted battery.
 *   - `prefers-reduced-motion` stops it starting at all, showing the initial
 *     state. The original did this, and it is also what makes the page
 *     testable — a looping animation cannot be verified frame by frame.
 */
export interface TrackerState {
  label: string;
  value: string;
  steps: ("done" | "now" | "")[];
  caption: string;
}

const TRACKER_START: TrackerState = {
  label: "On the way to your address",
  value: "32 min",
  steps: ["done", "done", "now", ""],
  caption: "Assigned. Arriving in uniform with a CFC ID card.",
};

const TRACKER_ARRIVED: TrackerState = {
  label: "Rajesh is at your door",
  value: "Arrived",
  steps: ["done", "done", "done", "done"],
  caption: "Work started at 10:34 AM. Pay by UPI when it is done.",
};

export function useLiveTracker(): TrackerState {
  const [state, setState] = React.useState<TrackerState>(TRACKER_START);

  React.useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let mins = 32;
    const timers: number[] = [];

    const tick = () => {
      // Paused in a background tab, as the original was.
      if (document.hidden) {
        timers.push(window.setTimeout(tick, 2000));
        return;
      }
      mins -= 1;
      if (mins > 27) {
        setState((s) => ({ ...s, value: mins + " min" }));
        timers.push(window.setTimeout(tick, 2000));
      } else {
        setState(TRACKER_ARRIVED);
        timers.push(
          window.setTimeout(() => {
            mins = 32;
            setState(TRACKER_START);
            timers.push(window.setTimeout(tick, 2600));
          }, 5200),
        );
      }
    };

    timers.push(window.setTimeout(tick, 3000));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return state;
}

/**
 * Keep Tab inside the mobile sheet while it is open.
 *
 * Without this, tabbing past the last link moves focus to the page behind the
 * overlay — which is still there, just visually covered. A keyboard user then
 * appears to lose focus entirely.
 *
 * Attach the returned ref to the sheet element.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = React.useRef<T | null>(null);

  React.useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = el.querySelectorAll<HTMLElement>("a, button");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [active]);

  return ref;
}
