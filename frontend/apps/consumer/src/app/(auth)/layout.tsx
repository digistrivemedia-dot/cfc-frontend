/**
 * Auth route group layout.
 *
 * All unauthenticated screens (splash, onboarding, login, register, otp,
 * forgot-password) render inside this. The layout does nothing structural —
 * each screen controls its own full-height composition — but the route group
 * isolates auth chrome from the authenticated app layout (bottom tab bar,
 * app header) that will be built in Batch 2.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
