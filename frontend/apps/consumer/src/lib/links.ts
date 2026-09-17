/**
 * External destinations, in one place.
 *
 * The Pro app is a separate Next application on its own domain, so every link
 * to it is a plain `<a>` with an absolute URL — client-side routing cannot
 * carry a customer across origins.
 *
 * These were hardcoded as `http://localhost:3001` in six places. That works on
 * a developer's machine and nowhere else: in production every "Join as Pro"
 * pointed at a port on the visitor's own computer, so the links were dead for
 * everyone who was not running the Pro app locally.
 *
 * Keeping the URL here means the next domain change is one edit rather than a
 * grep across the app.
 */

/**
 * The Pro app. Override with `NEXT_PUBLIC_PRO_APP_URL` so a local build can
 * still point at `http://localhost:3001` without editing source.
 */
export const PRO_APP_URL =
  process.env.NEXT_PUBLIC_PRO_APP_URL ?? "https://cfc-pro-theta.vercel.app";
