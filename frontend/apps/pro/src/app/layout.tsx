import type { Metadata, Viewport } from "next";
import { archivo } from "@/lib/fonts";
import { SURFACE } from "@cfc/tokens";
import "@cfc/ui/styles.css";

export const metadata: Metadata = {
  title: "CFC Pro",
  description: "Manage jobs, track earnings, get paid daily.",
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
