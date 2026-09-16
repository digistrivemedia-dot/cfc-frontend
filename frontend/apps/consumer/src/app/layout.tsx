import type { Metadata, Viewport } from "next";
import { archivo, jakarta } from "@/lib/fonts";
import { SURFACE } from "@cfc/tokens";
import { Toaster } from "@cfc/ui";
import { SessionProvider } from "@/lib/session";
import { CartProvider } from "@/lib/cart";
import { AreaProvider } from "@/lib/area";
import "@cfc/ui/styles.css";
// AFTER the shared stylesheet, so the consumer's Figma teal wins the cascade.
// Scoped to this app; Pro and Admin keep the shared palette. See brand.css.
import "./brand.css";

// The band / tile / chip / row vocabulary the 43 Tailwind screens are being
// rebuilt on. Loads AFTER brand.css so its tokens resolve, and defines only
// plain `.cfc-*` classes - no element resets - so adding it cannot change the
// typography of a screen that has not opted in.
import "../styles/patterns.css";

export const metadata: Metadata = {
  title: "City Family Care",
  description: "Book trusted home services near you.",
  // The agreement calls for a PWA, so the app has to be installable. Next
  // emits the link tag from here; the manifest itself is in /public.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "City Family Care",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The layout is built to work at 360px; zoom stays available to the user.
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
    <html lang="en" className={`${archivo.variable} ${jakarta.variable}`}>
      <body suppressHydrationWarning className="bg-canvas font-sans text-ink antialiased">
        {/* Signed-in state wraps everything: the header, the homepage and every
            screen need it, and a visitor who has not signed in must never be
            shown another customer's bookings. */}
        <SessionProvider>
          <CartProvider>
            <AreaProvider>{children}</AreaProvider>
          </CartProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
