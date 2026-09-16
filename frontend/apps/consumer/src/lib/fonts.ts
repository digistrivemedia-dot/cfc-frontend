import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";

/**
 * Archivo, self-hosted, carrying BOTH variable axes in one file:
 *   wght 100–900   weights 400 / 500 / 600 are the only ones used
 *   wdth  62–125   widths  87 / 100 / 112 are the only ones used
 *
 * Fontsource publishes these axes as separate files — one carrying weight, one
 * carrying width, never both. This is the Google Fonts build, downloaded once
 * and committed, which is why the .woff2 files are in the repo rather than a
 * dependency. Self-hosted so no third-party request is made on page load and no
 * external party can alter the typography.
 *
 * Source:
 *   fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900
 *
 * The files live in the app rather than in @cfc/ui because next/font must be
 * called from within a Next.js app to be bundled and preloaded.
 *
 * `display: swap` paints fallback text immediately and swaps when the font
 * arrives — the screen is readable on a slow connection either way.
 */
export const archivo = localFont({
  src: [
    { path: "../fonts/archivo-latin.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/archivo-latin-ext.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/**
 * Plus Jakarta Sans - the consumer app's face.
 *
 * Archivo above stays the platform face and is what Pro and Admin use. The
 * consumer app moved to Jakarta because it is what the client approved in the
 * handoff prototype, and it is the better fit for a shopfront: geometric,
 * high contrast at display sizes, and it ships a real 800 weight, which is
 * what lets a hero headline read as a headline rather than a large heading.
 *
 * `next/font/google` downloads and self-hosts at BUILD time - no runtime
 * request to fonts.googleapis.com. That matters because the Archivo note
 * above is explicit that no third party should be able to alter this app's
 * typography at page load, and the prototype's `@import` of a Google
 * stylesheet would give up exactly that property.
 */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
