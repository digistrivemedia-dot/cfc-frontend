'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getConsumerProfile } from '@cfc/mocks';
import type { ConsumerProfile } from '@cfc/types';
import { initCFCApp, type CFCAppHandle } from './interactions';
import { useCatalogue, useRevealLateContent } from '../use-catalogue';
import { SiteFooter } from '../site-footer';
import { AppHeader } from '../app-header';
import { CfcSprite } from '../cfc-sprite';
import { useCart } from '@/lib/cart';

export default function SignedInHomePage() {
  // The header, its sprite and the footer are shared components now - see
  // (home)/app-header.tsx. Logout lives there, so this screen no longer holds
  // a session handle of its own.
  // Cart, address capture, account menu, search and the services rail.
  const handle = useRef<CFCAppHandle | null>(null);
  useEffect(() => {
    const h = initCFCApp();
    handle.current = h;
    return () => {
      handle.current = null;
      h();
    };
  }, []);

  // Same real catalogue the signed-out home reads, so the two screens can
  // never quote different prices for the same work.
  const { tiles, booked, serviceCount, loading } = useCatalogue(6);

  // The greeting and the "signed in with" line named a customer who does not
  // exist in the data - /profile reads `getConsumerProfile()` and showed a
  // different person. Both now read the one source of truth.
  const [profile, setProfile] = useState<ConsumerProfile | null>(null);
  useEffect(() => {
    let live = true;
    getConsumerProfile()
      .then((p) => {
        if (live) setProfile(p);
      })
      .catch(() => {
        // The greeting falls back to a name-free welcome.
      });
    return () => {
      live = false;
    };
  }, []);

  // "Ramasamy Chandrasekar" greets as "Ramasamy" - a full legal name in a
  // welcome line reads like a bank letter, not a greeting.
  const firstName = profile ? (profile.name.split(" ")[0] ?? "") : "";
  useRevealLateContent(!loading);

  // The rail cards arrive after `initCFCApp` has already run, and it is
  // `render()` that puts an Add button inside each one. Without this the rail
  // would show six services and no way to add any of them.
  useEffect(() => {
    if (booked.length > 0) handle.current?.refresh();
  }, [booked]);

  return (
    <div className="cfc-page">
      <CfcSprite />

      <a className="skip" href="#main">Skip to content</a>

      <AppHeader />

      <main id="main">

        {/* Welcome + first-run setup */}
        <section className="welcome">
          <div className="wrap welcome-in">
            <div>
              {/* The name carries the accent, exactly as the marketing hero
                  sets "verified pro" in orange. A flat navy line was the
                  dullest possible greeting on a screen that is meant to feel
                  personal. */}
              <h1>
                {firstName ? (
                  <>Welcome to CFC, <em>{firstName}</em>.</>
                ) : (
                  <>Welcome to CFC.</>
                )}
              </h1>
              <p className="hello">You have not booked anything yet. Add the address we should come to, and the rest takes about a minute.</p>

              <div className="setup">
                <div className="setup-row done">
                  <span className="setup-mark"><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg></span>
                  <div><b>Account created</b><small>{profile ? `Signed in with ${maskPhone(profile.phone)}` : "Signed in"}</small></div>
                </div>

                <div className="setup-row" id="setupAddr">
                  <span className="setup-mark"><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg></span>
                  <div><b>Add your address</b><small id="setupAddrSub">We need it to show you slots and travel time</small></div>
                  <button className="btn btn-primary btn-sm" type="button" id="addAddrBtn">Add address</button>
                </div>

                <div className="setup-row" id="setupBook">
                  <span className="setup-mark"><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg></span>
                  <div><b>Book your first service</b><small id="setupBookSub">FIRST20 comes off at checkout</small></div>
                </div>
              </div>

              <div className="addr-panel" id="addrPanel">
                <h4>Where should we come?</h4>
                <div className="addr-input">
                  <svg className="ic" aria-hidden="true" style={{ width: '18px', height: '18px', color: 'var(--muted)' }}><use href="#i-pin"></use></svg>
                  <input id="addrInput" type="text" placeholder="Flat and building, street, landmark" />
                </div>
                <div className="addr-tags">
                  <span>Save as</span>
                  <button className="tag-btn" type="button" aria-pressed="true" data-tag="Home">Home</button>
                  <button className="tag-btn" type="button" aria-pressed="false" data-tag="Work">Work</button>
                  <button className="tag-btn" type="button" aria-pressed="false" data-tag="Other">Other</button>
                </div>
                <div className="addr-actions">
                  <button className="btn btn-primary" type="button" id="addrSave">Save address</button>
                  <button className="btn btn-ghost" type="button" id="addrLocate">
                    <svg className="ic" aria-hidden="true" style={{ width: '16px', height: '16px' }}><use href="#i-pin"></use></svg>Use current location
                  </button>
                </div>
              </div>
            </div>

            <aside className="offer-card">
              <svg className="ic ic-deco" aria-hidden="true"><use href="#i-tag"></use></svg>
              <h3>Your welcome offer is waiting</h3>
              <p>20% off your first booking, up to &#8377;300 back. It applies to anything in the catalogue.</p>
              <span className="offer-code">FIRST20<svg className="ic" aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#i-check"></use></svg></span>
              <p className="offer-note"><svg className="ic" aria-hidden="true"><use href="#i-clock"></use></svg>Valid for 30 days from today</p>
            </aside>
          </div>
        </section>

        {/* Categories: the primary navigation now */}
        <section className="sec" id="services" style={{ paddingTop: '44px' }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                {/* The eyebrow pills the marketing page puts above every
                    section heading. The signed-in home had none at all, which
                    is a large part of why it read flat beside it. */}
                <span className="eyebrow"><svg className="ic" aria-hidden="true"><use href="#i-spark"></use></svg>Browse by category</span>
                <h2>What do you need first?</h2>
                <p>Every job has a fixed price. Add as many as you like and book them in one go.</p>
              </div>
              <Link className="sec-link" href="/categories">
                See all {serviceCount || ""} services
              </Link>
            </div>
            <div className="cat-grid">
              {/* The real sub-categories, identical to the signed-out home.
                  These navigate now - the prototype's tiles only fired a
                  "service list not built yet" toast. */}
              {loading &&
                Array.from({ length: 10 }, (_, i) => (
                  <div className="cat-sk" key={i} aria-hidden="true">
                    <i className="sk" /><b className="sk" /><s className="sk" />
                  </div>
                ))}
              {tiles.map((t) => (
                <Link className="cat" key={t.name} href={t.href}>
                  <span className="cat-ic">
                    <svg className="ic" aria-hidden="true"><use href={`#${t.icon}`}></use></svg>
                  </span>
                  <h3>{t.label}</h3>
                  <p>{t.priceLabel}</p>
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* Popular near them */}
        <section className="sec" id="popular" style={{ paddingTop: '0' }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow eyebrow-on-teal"><svg className="ic" aria-hidden="true"><use href="#i-growth"></use></svg>Trending near you</span>
                <h2>Popular in <span data-city>Bengaluru</span> this week</h2>
                <p>What your neighbours booked most in the last seven days.</p>
              </div>
              <div className="rail-nav">
                <button className="rail-btn" type="button" id="railPrev" aria-label="Previous services"><svg className="ic" aria-hidden="true"><use href="#i-arr-l"></use></svg></button>
                <button className="rail-btn" type="button" id="railNext" aria-label="More services"><svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></button>
              </div>
            </div>

            <div className="rail-wrap">
              <div className="rail" id="rail">
                {/* Real services, with the `data-*` attributes the cart
                    engine in interactions.js reads. `data-price` stays in
                    RUPEES, not paise - that is the unit the prototype's cart
                    arithmetic and its rupee() formatter both assume, and
                    changing it here would silently inflate every total by
                    a hundred. */}
                {loading &&
                  Array.from({ length: 4 }, (_, i) => (
                    <div className="bk-sk" key={i} aria-hidden="true">
                      <i className="sk" />
                      <div><b className="sk" /><s className="sk" /></div>
                    </div>
                  ))}
                {booked.map((b, i) => (
                  <article
                    className="bk"
                    key={b.id}
                    data-id={b.id}
                    data-name={b.name}
                    data-price={b.pricePaise / 100}
                    data-icon={b.icon}
                  >
                    <div className="bk-media">
                      <span className="bk-rank">#{i + 1} this week</span>
                      <svg className="ic" aria-hidden="true"><use href={`#${b.icon}`}></use></svg>
                    </div>
                    <div className="bk-body">
                      <h3>{b.name}</h3>
                      <div className="bk-meta">
                        {b.rating === null ? (
                          <span>New</span>
                        ) : (
                          <span className="star">
                            <svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>
                            {b.rating.toFixed(1)}
                          </span>
                        )}
                        <em></em><span>{b.bookingLabel}</span>
                        {b.durationLabel && (<><em></em><span>{b.durationLabel}</span></>)}
                      </div>
                      <div className="bk-foot">
                        <div><b>{b.priceLabel}</b><small>onwards, taxes included</small></div>
                        {/* A real control on the real cart.
                            `.bk-add` was an empty div that `interactions.js`
                            injected a button into, wired to its own in-memory
                            array. */}
                        <div className="bk-add">
                          <AddToCart
                            id={b.id}
                            name={b.name}
                            pricePaise={b.pricePaise}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="rail-prog"><i id="railProg"></i></div>
            </div>
          </div>
        </section>

        {/* Bookings (empty) + Care plan */}
        <section className="sec" id="bookings" style={{ paddingTop: '0' }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow"><svg className="ic" aria-hidden="true"><use href="#i-cal"></use></svg>Your activity</span>
                <h2>Your bookings</h2>
                <p>Everything you book lives here, from the slot you picked to the receipt afterwards.</p>
              </div>
            </div>

            <div className="two-col">
              <div className="empty">
                <svg className="empty-art" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                  {/* Repainted to the approved palette (2026-09-15). Every hex
                      here was from the superseded prototype teal: #0fb3a6 teal,
                      #e8f7f5 wash, #e3eaf0/#eef3f7 borders. With brand.css now
                      on #02BABC this illustration was the one thing on the
                      signed-in home still rendering the old brand colour. */}
                  <rect x="14" y="24" width="92" height="72" rx="12" fill="#fff" stroke="#E3ECF4" strokeWidth="2"/>
                  <rect x="14" y="24" width="92" height="20" rx="12" fill="#E2F7F7"/>
                  <rect x="14" y="36" width="92" height="8" fill="#E2F7F7"/>
                  <path d="M36 20v10M84 20v10" stroke="#02BABC" strokeWidth="3.4" strokeLinecap="round"/>
                  <rect x="28" y="56" width="30" height="6" rx="3" fill="#E3ECF4"/>
                  <rect x="28" y="70" width="52" height="6" rx="3" fill="#F0F5FB"/>
                  <circle cx="86" cy="84" r="16" fill="#02BABC"/>
                  <path d="M86 77v14M79 84h14" stroke="#fff" strokeWidth="3.2" strokeLinecap="round"/>
                </svg>
                <div>
                  <h3>Nothing booked yet</h3>
                  <p>Once you book, this is where you will see who is coming, when they will reach and how far away they are. You can reschedule or cancel from here too.</p>
                  <button className="btn btn-primary" type="button" id="emptyCta">Browse services</button>
                </div>
              </div>

              {/* "CFC Care, Rs2,499 a year" stood here with three invented
                  benefits. No such product exists: it was removed from the
                  marketing home for having no source at all, and is recorded
                  in final/DECISIONS-PENDING-CLIENT.md. Selling a subscription
                  nobody can buy is the worst version of that mistake, so this
                  is the real, documented promise instead - every term below is
                  in PLATFORM-FACTS.md. */}
              <aside className="side-card" id="care">
                <span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-shield"></use></svg></span>
                <h3>Every job is covered</h3>
                <p>The same promise on all 16 services, with nothing to join.</p>
                <ul>
                  <li><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>30-day warranty on the work</li>
                  <li><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>Fixed price agreed before anyone arrives</li>
                  <li><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>Background-checked, ID-carrying professionals</li>
                </ul>
                <a className="btn btn-ghost btn-sm" href="#faq">How it works</a>
              </aside>
            </div>

            <div className="refer" id="refer">
              <span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-gift"></use></svg></span>
              <div>
                <h3>Give &#8377;200, get &#8377;200</h3>
                <p>Your friend gets &#8377;200 off their first booking. You get &#8377;200 in CFC Cash once they use it.</p>
              </div>
              <button className="code-pill" type="button" id="referCode">AARTHI200<svg className="ic" aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#i-arr-r"></use></svg></button>
            </div>
          </div>
        </section>

        {/* Help */}
        <section className="sec" id="help" style={{ paddingTop: '0' }}>
          <div className="wrap">
            <div className="help-strip">
              <div>
                <h3>Not sure which service you need?</h3>
                <p>Describe the problem and we will pick the right one for you. A person answers, 7 AM to 11 PM.</p>
              </div>
              <div className="help-cta">
                <button className="btn btn-primary" type="button"><svg className="ic" aria-hidden="true" style={{ width: '17px', height: '17px' }}><use href="#i-chat"></use></svg>Chat with us</button>
                {/* btn-clear is translucent-white-on-dark and would be
                    invisible now the strip is pale */}
                <button className="btn btn-ghost" type="button">1800 XXX 4567</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* The approved footer, shared with the signed-out home. This screen
          used to carry its own copy in which twenty links pointed at
          `href="#main"` and silently scrolled to the top. */}
      <SiteFooter tiles={tiles} />

      {/* FOUR PROTOTYPE DUPLICATES REMOVED FROM HERE.
          ---------------------------------------------
          This screen was ported from a standalone HTML prototype and brought
          that prototype's own furniture with it: a cart drawer (`#cart` plus
          its scrim), a toast (`#toast`), a cart bar (`#cartBar`) and a mobile
          tab bar (`.tabbar`). The app already provides all but the last, on
          every screen, through `AppShell` and the root layout.

          The cart data was the real problem. `interactions.js` held its cart
          in `var cart = []` - an in-memory array that never touched
          localStorage - while the app's cart lives under `cfc.consumer.cart`.
          So adding a service here updated a counter no other screen could
          see, showed a total unrelated to the real basket, and vanished on
          reload. The "5 services · ₹5,495 · View cart" bar was reporting a
          cart that did not exist.

          Two toasts also fired on every add: Sonner's, and this one with its
          own 2.6s timer sitting behind the cart bar on a phone - which is why
          "Pest control added" appeared stuck.

          The tab bar was this screen's alone. No other route in the app has
          one, which is why both mobile action bars offset 80px to clear a bar
          that was not there.

          Replaced by: `CartBar`, `Toaster`, `/cart`, and the header. */}

    </div>
  );
}

/**
 * Add-to-cart for a most-booked card, on the REAL cart.
 *
 * Styled with the prototype's own `.btn` classes so it sits in `.bk-foot`
 * exactly as the injected button did — the difference is entirely in what it
 * writes to. Once a service is in the basket this becomes a stepper, matching
 * every other service card in the app, rather than a dead "Added" label.
 */
function AddToCart({
  id,
  name,
  pricePaise,
}: {
  id: string;
  name: string;
  pricePaise: number;
}) {
  const { has, add, setQuantity, lines } = useCart();
  const quantity = (lines ?? []).find((l) => l.serviceId === id)?.quantity ?? 0;

  if (!has(id)) {
    return (
      <button
        className="btn btn-primary btn-sm"
        type="button"
        onClick={() =>
          add({ serviceId: id, serviceName: name, fromPricePaise: pricePaise })
        }
      >
        Add
      </button>
    );
  }

  return (
    <span className="qty">
      <button
        type="button"
        aria-label={`Remove one ${name}`}
        onClick={() => setQuantity(id, quantity - 1)}
      >
        &minus;
      </button>
      <b aria-live="polite">{quantity}</b>
      <button
        type="button"
        aria-label={`Add another ${name}`}
        onClick={() => setQuantity(id, quantity + 1)}
      >
        +
      </button>
    </span>
  );
}

/** "+919876543210" masks to "+91 98xxx xx210" for a screen anyone may glance at. */
function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 2)}xxx xx${local.slice(-3)}`;
  }
  return e164;
}
