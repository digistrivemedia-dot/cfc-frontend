/** @type {import('next').NextConfig} */

// Where the API lives. Server-side only — the browser never reads this one;
// `NEXT_PUBLIC_API_URL` is what @cfc/mocks uses.
const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@cfc/ui", "@cfc/tokens", "@cfc/types", "@cfc/mocks"],

  /**
   * Where the build output goes. `.next` unless told otherwise.
   *
   * Exists because `next build` and `next dev` write incompatible things into
   * the same directory: a build drops production manifests over the dev
   * server's, and the running dev server then answers HTML with 500s for its
   * own CSS and JS — a blank white page with no error on screen.
   *
   * So a build run only to verify something uses a throwaway directory:
   *
   *   NEXT_DIST_DIR=.next-verify npx next build
   *
   * A real deployment build sets nothing and behaves exactly as before.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  /**
   * Uploaded images are served by the API, not from `public/`.
   *
   * Proxied rather than linked absolutely so a stored path stays relative
   * (`/uploads/services/abc.jpg`) and no component has to know the API host.
   * That is what keeps the swap to object storage, or a move to a new VPS, a
   * configuration change instead of a data migration.
   */
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` }];
  },
};
