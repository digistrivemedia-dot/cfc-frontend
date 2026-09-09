import type { Metadata, Viewport } from "next";
import { archivo } from "@/lib/fonts";
import { STRUCTURE } from "@cfc/tokens";
import "@cfc/ui/styles.css";

export const metadata: Metadata = {
  title: "CFC Pro",
  description: "Manage jobs, track earnings, get paid daily.",
  // The agreement names a Pro app; on the web that means installable. Next
  // emits the link tag from here and the manifest itself lives in /public.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CFC Pro",
    // Navy chrome, so the iOS status bar text has to be light. The consumer
    // app is "default" because its chrome is white — the two are not the same
    // app wearing different colours.
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Browser chrome colour. Navy, mirroring --color-structure, because the pro
  // app's own top bar and rail are navy — a white browser bar above a navy
  // header reads as two separate applications stacked. Kept in step by hand
  // because a meta tag cannot read a CSS custom property.
  themeColor: STRUCTURE,
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
