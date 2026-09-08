import type { Metadata, Viewport } from "next";
import { archivo } from "@/lib/fonts";
import { SURFACE } from "@cfc/tokens";
import { Toaster } from "@cfc/ui";
import "@cfc/ui/styles.css";

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
    <html lang="en" className={archivo.variable}>
      <body suppressHydrationWarning className="bg-canvas font-sans text-ink antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
