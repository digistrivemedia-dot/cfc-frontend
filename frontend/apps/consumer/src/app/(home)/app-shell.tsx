"use client";

import * as React from "react";
import { getServices } from "@cfc/mocks";
import type { ServiceDetail } from "@cfc/types";
import { initCFCApp, type CFCAppHandle } from "./home/interactions";
import { AppHeader } from "./app-header";
import { CfcSprite } from "./cfc-sprite";
import { SiteFooter } from "./site-footer";
import type { CategoryTile } from "./use-catalogue";
import "./home-pages.css";

/**
 * The signed-in shell: sprite, header, page, footer.
 *
 * One component so every screen behind a sign-in renders the SAME chrome. The
 * three pieces have to travel together:
 *
 *  - `CfcSprite` defines the symbols every `<use href="#i-...">` resolves
 *    against. Without it the header and footer icons render blank.
 *  - `.cfc-page` is what `home-pages.css` scopes all of its rules under, so
 *    the wrapper is required for any of this to be styled at all.
 *  - `initCFCApp()` binds the header's behaviour by id (address picker,
 *    search, cart, account menu). Rendering the markup without it gives a
 *    header that looks right and does nothing.
 *
 * `home-pages.css` is imported here rather than in the layout so it arrives
 * with the markup that needs it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const handle = React.useRef<CFCAppHandle | null>(null);
  const [tiles, setTiles] = React.useState<CategoryTile[]>([]);

  React.useEffect(() => {
    const h = initCFCApp();
    handle.current = h;
    return () => {
      handle.current = null;
      h();
    };
  }, []);

  // The footer lists the first six sub-categories. Read once here so every
  // screen in the group shows the same six without fetching its own.
  React.useEffect(() => {
    let cancelled = false;
    getServices()
      .then((rows: ServiceDetail[]) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const out: CategoryTile[] = [];
        for (const s of rows) {
          if (!s.active || seen.has(s.subCategoryName)) continue;
          seen.add(s.subCategoryName);
          out.push({
            name: s.subCategoryName,
            label: s.subCategoryName,
            icon: "i-home",
            priceLabel: "",
            href: `/categories?sub=${encodeURIComponent(s.subCategoryName)}`,
            serviceCount: 0,
            badge: null,
          });
          if (out.length === 6) break;
        }
        setTiles(out);
      })
      .catch(() => {
        // A failed catalogue read must not take the chrome down. The footer's
        // Services column renders empty; every other link is static.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <CfcSprite />

      {/* `cfc-chrome`, not `cfc-page`.
 
          Two things have to be true at once here, and they pull against each
          other:
 
          1. The header and footer need home-pages.css, which scopes every rule
             under `.cfc-page`.
          2. That class ALSO carries bare element rules - `h1` at a 60px clamp,
             `h2` at 36px, `a` stripped of colour, `ul` stripped of bullets - so
             putting it around the page rewrote the typography of all forty
             Tailwind screens.
 
          Wrapping each piece in its own short `.cfc-page` div solved (2) and
          broke the header instead: `position: sticky` resolves against its
          nearest scrolling ancestor, and a div sized to the header has no room
          for it to stick inside, so the bar scrolled away.
 
          `cfc-chrome` is declared in home-pages.css as an alias that pulls in
          the tokens and component rules WITHOUT the element resets, and it is
          applied to the header and footer themselves rather than to a box
          around them - so nothing new sits between the sticky bar and the
          page. */}
      <div className="cfc-page cfc-chrome">
        <AppHeader />
      </div>

      {/* flex-1 works because AppShell returns a fragment: these are direct
          children of the layout's flex column, not of a wrapper. */}
      <main id="main" className="flex-1">{children}</main>

      <div className="cfc-page cfc-chrome">
        <SiteFooter tiles={tiles} />
      </div>
    </>
  );
}
