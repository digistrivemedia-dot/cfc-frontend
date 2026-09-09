const containerQueries = require("@tailwindcss/container-queries");
const plugin = require("tailwindcss/plugin");

/**
 * Archivo's variable width axis, as three utilities.
 *
 * Tailwind v3 has no font-stretch utilities, and claude.md pins exactly three
 * width values. Generating them here means a screen writes `width-condensed`
 * rather than an arbitrary `[font-stretch:87%]`, which keeps the
 * no-arbitrary-values lint rule enforceable.
 */
const fontWidth = plugin(({ addUtilities, theme }) => {
  const widths = theme("fontStretch") ?? {};
  addUtilities(
    Object.fromEntries(
      Object.entries(widths).map(([name, value]) => [
        `.width-${name}`,
        { "font-stretch": value },
      ]),
    ),
  );
});

/**
 * Hides a scrollbar without disabling the scrolling.
 *
 * A horizontally scrolling strip — a tab bar, a filter row — needs to scroll on
 * a phone but should not show a scrollbar cutting across the design. This is
 * not a stock Tailwind utility, so writing `scrollbar-none` without defining it
 * silently generates nothing, which is the failure the closed scale exists to
 * prevent. Defined here so it is real.
 */
/**
 * A `coarse:` variant for touch pointers.
 *
 * Tailwind v3 has no pointer-media variant (v4 added `pointer-coarse`), so
 * writing one without defining it generates nothing at all. This makes it
 * real: `coarse:h-touch` applies only where the primary input is a finger.
 *
 * It is a POINTER query, not a width one. A 390px browser window on a desktop
 * still has a mouse and keeps the tight hit areas; a tablet at 1024px gets the
 * large ones. That is the right axis for touch targets - width is a proxy for
 * it, and a poor one.
 */
const coarsePointer = plugin(({ addVariant }) => {
  addVariant("coarse", "@media (pointer: coarse) { & }");
});

const scrollbarNone = plugin(({ addUtilities }) => {
  addUtilities({
    ".scrollbar-none": {
      "scrollbar-width": "none",
      "-ms-overflow-style": "none",
      "&::-webkit-scrollbar": { display: "none" },
    },
  });
});

/**
 * Shared Tailwind preset (v3). Every app extends this and adds nothing but its
 * own content paths.
 *
 * Colours resolve through CSS custom properties declared in @cfc/tokens, so a
 * palette change is a values-only edit to one file.
 *
 * Palette is "Cobalt": navy structure, teal action, white content. Two teals
 * exist and they are not interchangeable — `brand` is the identity colour and
 * fails contrast below 24px, `action` is the same hue at AA and is the only one
 * legal on text and small controls. See @cfc/tokens for the full rationale.
 *
 * The scales here are deliberately CLOSED. The default Tailwind palette is
 * replaced rather than extended, so `slate-500`, `gray-100` and `#888` are not
 * reachable from an app. Spacing has eight steps, type has six, radius has
 * three. If a value is genuinely needed it is added here as a named token first
 * — never as an arbitrary value in an app.
 *
 * `hsl(var(--x) / <alpha-value>)` is not used because the tokens are authored as
 * hex for legibility in review. Opacity utilities on these colours are therefore
 * unavailable by design — an opacity variant of a brand colour is a new token,
 * not a modifier.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",

      // Content -------------------------------------------------------------
      ink: {
        DEFAULT: "var(--color-ink)",
        muted: "var(--color-ink-muted)",
        faint: "var(--color-ink-faint)",
      },
      canvas: "var(--color-canvas)",
      surface: "var(--color-surface)",
      border: {
        DEFAULT: "var(--color-border)",
        soft: "var(--color-border-soft)",
        strong: "var(--color-border-strong)",
      },
      scrim: "var(--color-scrim)",

      // Structure — the navy rail. Never a button, link, or data mark.
      structure: {
        DEFAULT: "var(--color-structure)",
        raised: "var(--color-structure-raised)",
        active: "var(--color-structure-active)",
        muted: "var(--color-structure-muted)",
        line: "var(--color-structure-line)",
      },
      "on-structure": {
        DEFAULT: "var(--color-on-structure)",
        muted: "var(--color-on-structure-muted)",
        faint: "var(--color-on-structure-faint)",
      },

      // Brand — identity only. Legal as a fill on a surface 24px or larger:
      // the logo mark, a hero button, a category tile. Never text, never a
      // border, never a control below 24px. Use `action` for those.
      brand: {
        DEFAULT: "var(--color-brand)",
        bright: "var(--color-brand-bright)",
        deep: "var(--color-brand-deep)",
      },

      // Action — every button, link, icon and control. AA at 12px.
      action: {
        DEFAULT: "var(--color-action)",
        hover: "var(--color-action-hover)",
        press: "var(--color-action-press)",
        subtle: "var(--color-action-subtle)",
        line: "var(--color-action-line)",
      },

      // Foreground on a filled action or brand surface. Declared separately
      // from `surface` so a themed background can never invert a button label
      // into invisibility.
      "on-action": "var(--color-on-action)",

      // Status — neutral is the default. Colour is the exception. -----------
      neutral: {
        DEFAULT: "var(--color-neutral)",
        subtle: "var(--color-neutral-subtle)",
      },
      // Live — online, in progress, tracking. A state, not an outcome.
      live: {
        DEFAULT: "var(--color-live)",
        ink: "var(--color-live-ink)",
        subtle: "var(--color-live-subtle)",
        line: "var(--color-live-line)",
      },
      // Clock — a countdown is running. SLA windows, accept timers, expiry.
      clock: {
        DEFAULT: "var(--color-clock)",
        ink: "var(--color-clock-ink)",
        subtle: "var(--color-clock-subtle)",
        line: "var(--color-clock-line)",
      },
      // Critical — money lost, access revoked, a transfer that failed.
      critical: {
        DEFAULT: "var(--color-critical)",
        hover: "var(--color-critical-hover)",
        ink: "var(--color-critical-ink)",
        subtle: "var(--color-critical-subtle)",
        line: "var(--color-critical-line)",
      },
      star: "var(--color-star)",
      disabled: {
        DEFAULT: "var(--color-disabled-surface)",
        ink: "var(--color-disabled-ink)",
      },

      // Legacy status aliases.
      //
      // The consumer app and the unmigrated admin screens still write
      // `bg-success-subtle`, `text-danger`, `bg-go`. Each maps onto its Cobalt
      // equivalent so the rename lands screen by screen instead of as one
      // breaking change. Remove an alias once nothing references it.
      success: {
        DEFAULT: "var(--color-live-ink)",
        subtle: "var(--color-live-subtle)",
      },
      warning: {
        DEFAULT: "var(--color-clock-ink)",
        subtle: "var(--color-clock-subtle)",
      },
      danger: {
        DEFAULT: "var(--color-critical-ink)",
        hover: "var(--color-critical-hover)",
        subtle: "var(--color-critical-subtle)",
      },
      gain: {
        DEFAULT: "var(--color-clock)",
        subtle: "var(--color-clock-subtle)",
      },
      go: {
        DEFAULT: "var(--color-live)",
        hover: "var(--color-live-ink)",
        subtle: "var(--color-live-subtle)",
      },

      // Chart series. Action teal leads; navy follows.
      series: {
        1: "var(--color-series-1)",
        2: "var(--color-series-2)",
        3: "var(--color-series-3)",
        4: "var(--color-series-4)",
        5: "var(--color-series-5)",
        6: "var(--color-series-6)",
      },
    },

    // 4px base. Nothing between these steps.
    spacing: {
      0: "0px",
      px: "1px",
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      // 20px exists ONLY for the icon scale (16/20/24). It is not a spacing
      // step — padding and gaps go 16 → 24.
      5: "20px",
      6: "24px",
      8: "32px",
      12: "48px",
      touch: "44px", // minimum target on consumer and pro
      // The pro app's primary action — ACCEPT, I'M HERE, COMPLETE JOB. A pro
      // presses these one-handed, standing, often in daylight, and getting one
      // wrong costs them money. 56px is the smallest that is comfortably
      // thumb-safe without aiming; `touch` (44px) is a MINIMUM, not a target.
      "touch-lg": "56px",
      // Large fixed-height panels: the map surface, a full-height chart
      // panel. Not a spacing step — deliberately named so it cannot be
      // confused for one.
      panel: "min(640px, 70vh)",
    },

    borderRadius: {
      none: "0px",
      pill: "var(--radius-pill)",
      control: "var(--radius-control)",
      card: "var(--radius-card)",
      full: "9999px", // avatars only
    },

    fontSize: {
      display: ["32px", { lineHeight: "38px" }],
      title: ["22px", { lineHeight: "28px" }],
      heading: ["17px", { lineHeight: "24px" }],
      body: ["15px", { lineHeight: "22px" }],
      small: ["13px", { lineHeight: "18px" }],
      caption: ["12px", { lineHeight: "16px" }],
    },

    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
    },

    boxShadow: {
      none: "none",
      sm: "var(--shadow-sm)",
      md: "var(--shadow-md)",
      lg: "var(--shadow-lg)",
    },

    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },

    extend: {
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
      },
      // Archivo variable width axis. Three values, never interpolated between.
      // 87 admin tables · 100 default · 112 display moments.
      //
      // Exposed as utilities rather than raw font-stretch so a screen writes
      // `width-condensed` and the arbitrary-value lint rule stays enforceable.
      fontStretch: {
        condensed: "87%",
        normal: "100%",
        expanded: "112%",
      },
      // Active nav marker on the navy sidebar: 3px teal left bar.
      borderWidth: {
        nav: "3px",
      },
      outlineWidth: {
        focus: "var(--focus-ring-width)",
      },
      outlineOffset: {
        focus: "var(--focus-ring-offset)",
      },
      outlineColor: {
        focus: "var(--color-focus-ring)",
        "focus-on-structure": "var(--color-focus-ring-on-structure)",
      },

      // Elevation order. Every overlay previously hardcoded z-50, so a sheet
      // over a dialog, or a tooltip over a popover, resolved by DOM order
      // alone. Named steps make the intended stack explicit.
      zIndex: {
        sticky: "var(--z-sticky)",
        "drawer-scrim": "var(--z-drawer-scrim)",
        drawer: "var(--z-drawer)",
        "dialog-scrim": "var(--z-dialog-scrim)",
        dialog: "var(--z-dialog)",
        popover: "var(--z-popover)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)",
      },

      // Fixed component dimensions.
      //
      // `spacing` is REPLACED rather than extended, and width/height inherit
      // from it, so `w-56`, `h-14`, `size-9` and friends silently generated no
      // CSS at all. That had already shipped: the sidebar had no width, avatars
      // had no size, and several dropdowns had no minimum. These are the real
      // dimensions those places need, named so a reviewer can see what each one
      // is for and so the closed-scale rule still holds.
      width: {
        rail: "240px", // desktop sidebar
        "rail-drawer": "288px", // mobile drawer
        menu: "224px", // dropdown / filter popover
        "menu-wide": "240px",
        search: "224px", // command bar trigger
        // The switch track. Its width and the thumb's travel have to agree, so
        // both are named here rather than reaching for off-scale steps that
        // silently generate nothing.
        switch: "40px",
        prose: "320px", // empty-state copy
        // Fixed columns inside a list row, so a clock and an amount line up
        // down the queue instead of jittering with their content.
        clock: "64px",
        amount: "80px",
        // Skeleton runs, named by how much text they stand in for. A loading
        // column should suggest the shape of its content, and the closed
        // spacing scale has nothing between 48px and a full width.
        // Consumer cards in a snapping strip. Sized so the next card is
        // visibly clipped at 390px - that overhang is the affordance telling
        // a thumb there is more to the right.
        "card-service": "264px",
        "card-category": "104px",
        "line-xs": "80px",
        "line-sm": "96px",
        "line-md": "128px",
        "line-lg": "160px",
        "line-xl": "192px",
        "line-2xl": "256px",
        // The pro app's docked action panel. On mobile the primary decision is
        // a sticky bottom bar; at `lg:` it becomes this column beside the
        // content. One value, so all 35 screens dock identically.
        "action-panel": "320px",
      },
      height: {
        bar: "56px", // top bars and mobile header
        // The consumer desktop header carries a brand, a location, a search
        // field and an account block on one line, so it needs more room than
        // the admin bar, which carries only a breadcrumb.
        "bar-lg": "64px",
        field: "36px", // popover search field
        // Skeleton blocks standing in for a card that has not loaded.
        "block-xs": "64px",
        "block-sm": "128px",
        "block-md": "160px",
        "block-lg": "384px",
      },
      minWidth: {
        search: "224px",
        // A dropdown or select panel is never narrower than its trigger group.
        menu: "128px",
      },
      maxHeight: {
        // A dropdown list — combobox options, a filter's checkboxes. Scrolls
        // past this instead of running down the page.
        "block-sm": "256px",
        // A select list scrolls past this rather than filling the viewport.
        "block-lg": "384px",
      },

      aspectRatio: {
        // Service and category card artwork. Named so the ratio is a design
        // decision in one place rather than an arbitrary value per card.
        card: "4 / 3",
        banner: "5 / 2",
      },

      maxWidth: {
        prose: "320px",
        // Skeleton lines, and any label that should cap rather than fix its
        // width: the same length on a wide row, shrinking instead of
        // overflowing on a narrow one.
        //
        // These mirror the same names in `width`, but Tailwind does NOT share
        // width values with maxWidth - `max-w-line-sm` generated no CSS at all
        // until this line existed, so a capped field was silently full-width.
        "line-sm": "96px",
        "line-md": "128px",
        "line-xl": "192px",
        "line-2xl": "256px",
        // A drawer holding a conversation rather than a summary: a ticket
        // thread, a reply box. The default sheet (448px) wraps a sentence
        // every few words.
        detail: "640px",
      },
      size: {
        // A round icon tile - a category glyph, a trust mark, an avatar
        // stand-in. 40px is the smallest that reads as deliberate rather than
        // cramped, and it clears the 44px touch rule when it is a link.
        tile: "40px",
        "tile-lg": "80px",
        mark: "28px", // brand mark in the rail
        avatar: "36px",
        emblem: "80px", // auth panel roundel
        logo: "112px", // client logo on the auth panel
        "ring-sm": "256px", // auth panel backdrop rings
        "ring-md": "384px",
        "ring-lg": "560px",
      },
      // Backdrop washes sit outside their container on purpose. Positive
      // value; the utility carries the minus (-bottom-wash).
      padding: {
        // Clears the fixed mobile tab strip. The bar is 56px plus the iOS
        // safe-area inset, so content needs at least that much room beneath
        // it or the last row sits under the bar.
        "tab-bar": "80px",
        // The generous inner padding of an auth or marketing panel, where the
        // page has one job and room to breathe.
        panel: "40px",
        "panel-lg": "64px",
        // Clears the pro app's fixed 240px desktop rail. `width.rail` is the
        // rail itself; Tailwind does not share width values with padding, so
        // the same number is named here for the content beside it.
        rail: "240px",
        // Clears the pro app's mobile action bar — a 56px primary button plus
        // its 16px padding on both sides, plus the tab strip beneath it.
        "action-bar": "88px",
      },

      inset: {
        // Sticks an element directly below a top bar. `bar` and `bar-lg` are
        // heights, and Tailwind does not share those with inset, so the same
        // two values are named here as well.
        bar: "56px",
        // Named `bar-tall` rather than `bar-lg`: a utility ending in a
        // breakpoint name (`top-bar-lg`) is ambiguous to Tailwind's parser and
        // silently generates nothing at all.
        "bar-tall": "64px",
        wash: "128px",
        // The pro app's fixed desktop rail width, so a sticky element can be
        // positioned from the rail's inner edge rather than the viewport's.
        rail: "240px",
        // Sits an element directly ABOVE the mobile tab strip - the pro app's
        // action bar. `padding.tab-bar` is the same 80px, but Tailwind does not
        // share padding values with inset, so `bottom-tab-bar` generated no
        // CSS at all until this existed.
        "tab-bar": "80px",
      },

      // Named grid templates.
      //
      // Arbitrary values are banned by lint, so a layout used across many
      // screens is named here rather than written as `grid-cols-[...]` in each
      // one. `action` is the pro app's content-plus-docked-panel split: the
      // content column may shrink, the action panel never does.
      gridTemplateColumns: {
        action: "minmax(0, 1fr) 320px",
      },

      // Named so a progress bar or meter can animate its fill without an
      // arbitrary `transition-[width]`.
      transitionProperty: {
        size: "width, height",
      },

      // Switch thumb travel: track width, less the thumb and both insets.
      translate: {
        switch: "18px",
      },

      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
        carousel: "var(--duration-carousel)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },
    },
  },
  plugins: [containerQueries, fontWidth, scrollbarNone, coarsePointer],
};
