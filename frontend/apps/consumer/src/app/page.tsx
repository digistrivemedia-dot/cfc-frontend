import { redirect } from "next/navigation";

/**
 * Root entry point — the public front door.
 *
 * This used to redirect to `/splash`, which after 1.8 s sent a first-time
 * visitor through three onboarding slides and then to `/login`. So a person who
 * searched for "AC repair Trichy" and clicked through to the site was shown a
 * splash screen, a walkthrough and a login form before a single service, price
 * or reason to trust the business. On a website that is a bounce, not an
 * onboarding flow.
 *
 * A website's homepage is its sales pitch. Browsing is public; an account is
 * asked for at the point of booking, not at the door.
 *
 * `/home` holds the homepage itself because it lives inside the `(app)` route
 * group, which supplies the header, footer and mobile tab bar. Redirecting is
 * how `/` gets that shell without duplicating it — and unlike the old splash
 * hop this is a server redirect with no animation, no delay and no gate: the
 * visitor sees services immediately.
 *
 * Splash (Customer 1) and Onboarding (Customer 2) still exist and are still
 * reachable at `/splash` and `/onboarding`. They belong to the mobile app
 * shell, where a launch screen is a real thing. They no longer stand between a
 * web visitor and the product.
 */
export default function Root() {
  redirect("/home");
}
