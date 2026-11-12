import type { Metadata, Viewport } from "next";
import { archivo } from "@/lib/fonts";
import { SURFACE } from "@cfc/tokens";
import { Toaster } from "@cfc/ui";
import "@cfc/ui/styles.css";

export const metadata: Metadata = {
  title: "CFC Merchant",
  description: "Material supply portal for City Family Care partners.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Mirrors --color-surface. A meta tag cannot read a CSS custom property, so
  // the two are kept in step by hand.
  themeColor: SURFACE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={archivo.variable}>
      {/* Extensions inject attributes onto <body> before hydration, which
          differs the server and client markup by one attribute for reasons
          unrelated to this app. Scoped here so genuine mismatches inside the
          component tree are still reported. */}
      <body suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
