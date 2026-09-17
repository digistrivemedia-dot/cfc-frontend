'use client';

import Link from 'next/link';
import type { CategoryTile } from './use-catalogue';
import { PRO_APP_URL } from '@/lib/links';

/**
 * The approved footer, extracted verbatim from the signed-out home page so
 * that every screen renders the SAME one.
 *
 * Before this there were three different footers: this markup on the marketing
 * home, a near-copy on the signed-in home in which twenty links pointed at
 * `href="#main"` and silently scrolled to the top, and the Tailwind-built
 * `ConsumerFooter` on the other forty screens. A customer moving from the home
 * page into a category saw the footer change shape under them.
 *
 * It is styled by `home-pages.css` (`.foot`, `.foot-grid`, `.foot-soc`), so any
 * route rendering it must sit inside a `.cfc-page` wrapper and import that
 * stylesheet - which the `(home)` group already does.
 *
 * `tiles` comes from the caller rather than being fetched here: both home
 * screens already hold the catalogue, and a second fetch would mean the footer
 * could list a service the page above it does not.
 */
export function SiteFooter({ tiles }: { tiles: CategoryTile[] }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a className="logo" href="#top">
              <span className="logo-mark"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span>
              <span className="logo-text"><span className="logo-name">CityFamilyCare<sup>CFC</sup></span></span>
            </a>
            <p className="foot-about">Home services for Indian families, delivered by professionals we know by name. Verified, insured and warrantied.</p>
            <div className="foot-soc">
              <a className="soc" href="#top" aria-label="Chat with support"><svg className="ic" aria-hidden="true"><use href="#i-headset"></use></svg></a>
              <a className="soc" href="#top" aria-label="Call CFC"><svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg></a>
              <a className="soc" href="#top" aria-label="Voice search"><svg className="ic" aria-hidden="true"><use href="#i-mic"></use></svg></a>
            </div>
          </div>
          <div>
            <h4>Services</h4>
            {/* The first six tiles, so the footer can never list a service the
                catalogue does not carry. */}
            <ul>
              {tiles.slice(0, 6).map((t) => (
                <li key={t.name}><Link href={t.href}>{t.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/">About CFC</Link></li>
              <li><a href={PRO_APP_URL}>Join as Pro</a></li>
              <li><Link href="/refer">Offers</Link></li>
              <li><Link href="/support">For apartments</Link></li>
              <li><Link href="/support">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/bookings">Track a booking</Link></li>
              <li><Link href="/legal/refunds">Cancellation policy</Link></li>
              <li><Link href="/support">Common questions</Link></li>
              <li><Link href="/legal/refunds">Warranty and refunds</Link></li>
              <li><a href="tel:1800XXX4567">1800 XXX 4567</a></li>
              <li><a href="mailto:care@cityfamilycare.in">care@cityfamilycare.in</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bar">
          <span>&#169; 2026 CityFamilyCare Services Pvt Ltd</span>
          <div className="links">
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            {/* No safety document is drafted yet - the conduct and safety
                clause lives inside the terms, so this points there rather than
                at a route that would 404. */}
            <Link href="/legal/terms">Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
