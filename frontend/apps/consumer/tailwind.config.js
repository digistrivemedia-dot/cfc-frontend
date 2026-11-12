/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@cfc/config/tailwind-preset")],
  // packages/ui MUST be scanned or shared components ship unstyled.
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      /*
        Consumer-only breakpoints that match the approved home page's CSS.

        THE BUG THESE FIX
        The shared preset breaks at sm:640 md:768 lg:1024 xl:1280. The approved
        home page's stylesheet breaks at 620 / 900 / 1080. The two disagree,
        and the app shell is styled by the CSS while the screens inside it are
        styled by Tailwind — so between 769px and 900px the shell shows its
        MOBILE tab bar while the page inside is still laid out for desktop.
        That is a real, visible defect on tablets today.

        WHY EXTEND RATHER THAN OVERRIDE
        `screens` lives in packages/config, which is shared with Pro and Admin
        — both built by another team. Redefining sm/md/lg there would silently
        re-lay-out two apps we cannot test. `theme.extend.screens` is purely
        additive: it adds new names and changes nothing that already exists.

        USE THESE for anything that has to agree with the shell (a layout
        switching between the tab bar and the desktop header). Keep md:/lg: for
        ordinary content reflow, where a 130px difference is invisible.
      */
      screens: {
        "cfc-sm": "620px",
        "cfc-md": "900px",
        "cfc-lg": "1080px",

        /*
          MAX-WIDTH counterparts of the three above.

          The approved landing page's stylesheet is written max-width-first —
          97 of its rules are `@media (max-width: 620px)` or 900 or 1080 —
          because it was authored desktop-down. Tailwind is min-width-first.

          Both directions are expressible, but they are NOT interchangeable
          when rules overlap: inverting `max-width: 620px` by hand means
          restating the desktop value at `cfc-sm:` and hoping nothing else
          cascaded into that gap. Ninety-seven chances to get a breakpoint
          boundary off by one pixel.

          Declaring the max-width variants instead makes every one of those
          rules a direct translation with the same boundary the CSS already
          has. `max-cfc-sm:` IS `@media (max-width: 620px)`.

          These live in the CONSUMER config, not the shared preset, so Pro and
          Admin cannot see them and nothing there can change.

          Use the min-width names (`cfc-md:`) for new work. These exist to
          carry the approved page across without moving a pixel.
        */
        "max-cfc-sm": { max: "620px" },
        "max-cfc-md": { max: "900px" },
        "max-cfc-lg": { max: "1080px" },
      },
    },
  },
};
