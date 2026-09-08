/**
 * Shared ESLint config for the three apps.
 *
 * This file exists to make the hard rules in claude.md self-enforcing rather
 * than remembered. Three devs working in parallel across 128 screens will not
 * hold a style guide in their heads; the ones that matter are checked here.
 *
 * Rules enforced:
 *   1. Apps never import from other apps
 *   2. shadcn primitives are never generated or imported inside an app
 *   3. No raw hex values in app code
 *   4. No arbitrary Tailwind values (w-[437px])
 *   5. No Tailwind default palette colours (bg-slate-500, text-gray-100)
 *   6. Screens never import mock fixtures directly — only the api functions
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    // 1 + 2 + 6 — import boundaries.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/apps/*", "@cfc/consumer/*", "@cfc/pro/*", "@cfc/admin/*"],
            message:
              "Apps never import from other apps. Move the shared code into packages/ui.",
          },
          {
            group: ["@cfc/ui/src/primitives/*"],
            message:
              "Import from '@cfc/ui', not from its internals. Primitives are re-exported deliberately.",
          },
          {
            group: ["@cfc/mocks/src/fixtures/*", "@cfc/mocks/fixtures/*"],
            message:
              "Screens call the api functions in @cfc/mocks, never the fixtures directly. See 'The mock layer' in claude.md.",
          },
          // Icons are imported directly from lucide-react. The 16/20/24 size
          // rule is enforced by the `size-*` utility scale, not by the import
          // path — the spacing scale has no value between 16 and 20, so an
          // off-scale icon cannot be written without an arbitrary value, which
          // the rule below already rejects.
        ],
      },
    ],

    // 3 + 4 + 5 — no raw values, no arbitrary values, no default palette.
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "Literal[value=/(?:^|[^a-zA-Z0-9_(])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z_-])/]",
        message:
          "No raw hex values in app code. Add a token to @cfc/tokens and use it.",
      },
      {
        // Arbitrary VALUE, e.g. w-[437px], top-[13px] — the thing this rule
        // exists to catch. Deliberately does not match an arbitrary VARIANT
        // such as has-[:checked]:border-action or [&>svg]:size-4, which is a
        // real, permitted Tailwind feature: a variant selector is always
        // followed by a `:` before the utility it styles, so the bracket is
        // never the last thing before a class boundary or string end.
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)[a-z-]+-\\[[^\\]]+\\](?:\\s|$)/]",
        message:
          "No arbitrary Tailwind values. Add a named token to the preset in @cfc/config first.",
      },
      {
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|shadow|accent|caret|decoration|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b/]",
        message:
          "The default Tailwind palette is unavailable by design. Use a semantic token: ink, ink-muted, structure, action, canvas, surface, border, success, warning, danger, gain, go.",
      },
      {
        selector: "CallExpression[callee.property.name='toLocaleString']",
        message:
          "Use the shared currency and date formatters from @cfc/ui. One formatter, used everywhere.",
      },
      {
        // Tailwind's default spacing scale has fractional steps (0.5, 1.5,
        // 2.5, 3.5...) that our closed scale — 0/1/2/3/4/5/6/8/12/touch —
        // does not define. Because `spacing` is REPLACED rather than
        // extended, a fractional utility silently generates no CSS: the
        // element just doesn't get the size or gap, with no error anywhere.
        // This has already happened twice during development. Round to the
        // nearest real step instead.
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|size|w|h|top|right|bottom|left|inset)-(?:0\\.5|1\\.5|2\\.5|3\\.5|6\\.5|7\\.5)\\b/]",
        message:
          "This spacing/size value does not exist on the closed scale and silently generates no CSS. Use the nearest real step (1, 2, 3, 4, 5, 6, 8, 12) or size-4/5/6 for icons.",
      },
      {
        // The same failure, but for INTEGER steps the closed scale omits.
        // `spacing` is replaced and width/height inherit from it, so w-56,
        // h-14, size-9 and friends also generate nothing. That had already
        // shipped: the sidebar had no width and every avatar had no size,
        // because those utilities resolved to no CSS at all. Fixed dimensions
        // belong in the preset as NAMED values (w-rail, h-bar, size-avatar)
        // where a reviewer can see what each one is for.
        selector:
          "JSXAttribute[name.name='className'] Literal[value=/(?:^|\s)(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|size|w|h|min-w|min-h|max-w|max-h)-(?:7|9|10|11|13|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)\b/]",
        message:
          "This dimension is not on the closed scale and silently generates no CSS. Add a named value to the preset (w-rail, h-bar, size-avatar) rather than reaching for a Tailwind default step.",
      },
      {
        // Tokens are authored as hex, not as bare HSL channels, so Tailwind
        // cannot apply an opacity modifier to them — `bg-action/90` silently
        // generates NOTHING and the hover state simply never appears.
        // Use a dedicated token (action-hover, danger-hover, go-hover) instead.
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
      // The design-system kitchen sink demonstrates every variant and state, so
      // it is allowed to reach for values a screen may not.
      files: ["**/app/_ds/**"],
      rules: { "no-restricted-syntax": "off" },
    },
  ],
};
