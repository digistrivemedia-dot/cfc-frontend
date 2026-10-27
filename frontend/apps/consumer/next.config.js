/** @type {import('next').NextConfig} */

// Where the API lives. Server-side only — the browser never reads this one;
// `NEXT_PUBLIC_API_URL` is what @cfc/mocks uses.
const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@cfc/ui", "@cfc/tokens", "@cfc/types", "@cfc/mocks"],

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
