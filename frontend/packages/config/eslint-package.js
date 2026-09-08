/**
 * Shared ESLint config for the workspace packages — @cfc/ui above all.
 *
 * Why this exists separately from eslint-app.js:
 *
 * The token rules were only ever applied to the three apps, so the one place
 * the design system actually lives was the one place nothing checked it. That
 * is backwards. A dead `max-h-64` in a screen breaks that screen; the same
 * class in Combobox breaks every dropdown in all three apps at once — and it
 * had, silently: the scroll cap generated no CSS, so a long option list ran
 * down the page instead of scrolling.
 *
 * The rules are the same ones eslint-app.js enforces, minus the two that are
 * app-specific:
 *
 *   - `next/core-web-vitals`, which needs a Next.js app to lint.
 *   - The import-boundary rules, whose whole subject is apps importing apps.
 *
 * What stays is everything about tokens and Tailwind, because a component
 * library is held to those rules more strictly than a screen, not less.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint"],
  env: { browser: true, es2022: true },
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "Literal[value=/(?:^|[^a-zA-Z0-9_(])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z_-])/]",
        message:
          "No raw hex values. Add a token to @cfc/tokens and use it.",
      },
      {
        // Arbitrary VALUE, e.g. w-[437px]. Deliberately does not match an
        // arbitrary VARIANT such as has-[:checked]:border-action, which is a
        // real Tailwind feature: a variant is always followed by a `:`.
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)[a-z-]+-\\[[^\\]]+\\](?:\\s|$)/]",
        message:
          "No arbitrary Tailwind values. Add a named token to the preset in @cfc/config first.",
      },
      {
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|shadow|accent|caret|decoration|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b/]",
        message:
          "The default Tailwind palette is unavailable by design. Use a semantic token: ink, ink-muted, structure, action, canvas, surface, border, live, clock, critical.",
      },
      {
        // Fractional steps the closed scale does not define. `spacing` is
        // REPLACED rather than extended, so these silently generate no CSS.
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|size|w|h|top|right|bottom|left|inset)-(?:0\\.5|1\\.5|2\\.5|3\\.5|6\\.5|7\\.5)\\b/]",
        message:
          "This spacing/size value does not exist on the closed scale and silently generates no CSS. Use the nearest real step (1, 2, 3, 4, 5, 6, 8, 12) or size-4/5/6 for icons.",
      },
      {
        // The same failure for INTEGER steps the closed scale omits. This is
        // the rule that caught the dead max-h-64 in Combobox and FilterBar.
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|size|w|h|min-w|min-h|max-w|max-h)-(?:7|9|10|11|13|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)\\b/]",
        message:
          "This dimension is not on the closed scale and silently generates no CSS. Add a named value to the preset (w-rail, h-bar, max-h-block-sm) rather than reaching for a Tailwind default step.",
      },
      {
        // The same dead-dimension check, but for class strings that are NOT a
        // className attribute — cva() variants, cn() calls, class constants.
        // Most of this library's styling lives there, and a broken variant in
        // cva() breaks every use of that component rather than one screen.
        selector:
          "Literal[value=/(?:^|\\s)(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|size|w|h|min-w|min-h|max-w|max-h)-(?:7|9|10|11|13|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)(?:\\s|$)/]",
        message:
          "This dimension is not on the closed scale and silently generates no CSS. Add a named value to the preset (w-rail, h-bar, max-h-block-sm) rather than reaching for a Tailwind default step.",
      },
      {
        // Tokens are authored as hex, so Tailwind cannot apply an opacity
        // modifier — `bg-action/90` generates NOTHING and the state never
        // appears.
        selector:
          "Literal[value=/(?:^|\\s)(?:bg|text|border|ring|fill|stroke|outline|divide|shadow)-(?:ink|structure|action|brand|canvas|surface|border|neutral|live|clock|critical|success|warning|danger|gain|go)(?:-(?:muted|faint|raised|active|hover|press|subtle|soft|strong|line|ink|bright))?\\/\\d+/]",
        message:
          "Opacity modifiers do not work on these colours — the utility generates nothing. Add a dedicated token (e.g. action-hover) to @cfc/tokens and the preset.",
      },
    ],

    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
  },
  overrides: [
    {
      /**
       * Overlay primitives, where an arbitrary value is the correct answer.
       *
       * Two kinds live here and neither can be expressed as a fixed token:
       *
       *   Radix runtime variables — w-[--radix-popover-trigger-width],
       *   max-h-[--radix-popover-content-available-height]. The value is
       *   measured in the browser; a named px token would be a guess.
       *
       *   Viewport-relative sizing — w-[calc(100%-32px)], max-h-[85vh]. A
       *   dialog must fit the screen it opens on, which a fixed scale cannot
       *   express.
       *
       * Scoped to these five files rather than switched off library-wide, so
       * a stray w-[437px] in a component is still an error.
       */
      files: [
        "**/primitives/dialog.tsx",
        "**/primitives/alert-dialog.tsx",
        "**/primitives/popover.tsx",
        "**/components/command-palette.tsx",
        "**/components/combobox.tsx",
      ],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "JSXAttribute[name.name='className'] Literal[value=/(?:^|\s)(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|size|w|h|min-w|min-h|max-w|max-h)-(?:7|9|10|11|13|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/]",
            message:
              "This dimension is not on the closed scale and silently generates no CSS. Add a named value to the preset instead.",
          },
        ],
      },
    },
  ],
};
