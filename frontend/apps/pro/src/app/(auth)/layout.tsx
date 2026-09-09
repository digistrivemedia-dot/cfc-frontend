/**
 * Auth route group layout.
 *
 * Splash, login, register, OTP, profile setup, documents, bank details, terms
 * and approval-pending all render here. It does nothing structural — each of
 * those screens owns its own full-height composition — but the route group
 * keeps them clear of the app chrome (rail, tab strip, online toggle), none of
 * which makes sense before a pro is approved.
 */
export default function ProAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
