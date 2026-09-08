import type { Metadata, Viewport } from "next";
import { archivo } from "@/lib/fonts";
import { SURFACE } from "@cfc/tokens";
import { ActorProvider } from "@/lib/actor";
import "@cfc/ui/styles.css";

export const metadata: Metadata = {
  title: "CFC Admin",
  description: "Operations console for City Family Care.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Browser chrome colour. Mirrors --color-surface; the two are kept in step
  // by hand because a meta tag cannot read a CSS custom property.
  themeColor: SURFACE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={archivo.variable}>
      {/* Browser extensions (password managers, colour pickers, translation
          tools) inject attributes onto <body> before React hydrates, which
          makes the server and client markup differ by one attribute and throws
          a hydration warning that has nothing to do with this app. Scoped to
          the element extensions actually touch — component trees inside still
          report genuine mismatches. */}
      <body suppressHydrationWarning>
        <ActorProvider>{children}</ActorProvider>
      </body>
    </html>
  );
}
