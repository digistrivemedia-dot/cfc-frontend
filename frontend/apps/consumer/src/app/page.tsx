import { redirect } from "next/navigation";

/**
 * Root entry point.
 *
 * Always redirects to /splash. The splash screen decides whether to advance
 * to onboarding (first-time user) or straight to /home (returning user).
 * Nothing lives at "/" — it is a pure routing node.
 */
export default function Root() {
  redirect("/splash");
}
