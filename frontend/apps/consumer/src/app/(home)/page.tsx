'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { initCFC } from './interactions';
import { useCatalogue, useRevealLateContent } from './use-catalogue';
import { useSession } from '@/lib/session';
import { SiteFooter } from './site-footer';
import { CfcSprite } from './cfc-sprite';
import SignedInHomePage from './home/page';

/**
 * The front door, for everyone.
 *
 * `/` used to be the signed-out marketing page unconditionally, and the
 * signed-in home sat at `/home` where nothing routed to it. A customer who
 * verified their OTP was returned to the brochure - same page, same "Log in"
 * button - and nothing about the app acknowledged that they had signed in.
 *
 * Sending them to `/home` instead fixed the landing, but not the address: the
 * logo, a bookmark and every "back to home" still led to the brochure. So the
 * decision belongs here, at the one URL both kinds of visitor arrive at.
 *
 * `/home` still exists and still renders the signed-in screen directly, so
 * nothing that already links there breaks.
 */
export default function HomeRoute() {
  const { signedIn } = useSession();

  // `signedIn` is null until localStorage has been read, which on the server
  // is always. Returning null there would make this - the public landing page
  // - render nothing at all server-side: no markup for a crawler, and a blank
  // first paint for everyone. So the marketing page IS the server render, and
  // a signed-in customer swaps to their own home on hydration.
  //
  // The trade is deliberate: a signed-in visitor may see the marketing hero
  // for one frame on a cold load. A signed-OUT visitor - every first-time
  // arrival, every search result - gets correct, complete HTML immediately,
  // and they are the ones this page exists for.
  return signedIn === true ? <SignedInHomePage /> : <MarketingHomePage />;
}

function MarketingHomePage() {
  // One place for every interaction on the page: sticky header, mobile menu,
  // scroll reveals, the services rail, voice search and the marquee.
  useEffect(() => initCFC(), []);

  // The category grid and the most-booked rail come from the real catalogue
  // rather than from the prototype's hardcoded tiles - see use-catalogue.ts
  // for why every one of those twelve tiles had to go.
  const { tiles, booked, serviceCount, loading } = useCatalogue();
  useRevealLateContent(!loading);

  return (
    <div className="cfc-page">
      <CfcSprite />

      <a className="skip" href="#top">Skip to content</a>

      <header className="hdr" id="hdr">
        <div className="wrap hdr-in">
          <a className="logo" href="#top" aria-label="CityFamilyCare home">
            <span className="logo-mark"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span>
            {/* CFC as a true superscript tight to the wordmark, with the
                tagline on its own line beneath - the approved lockup. */}
            <span className="logo-text">
              <span className="logo-name">CityFamilyCare<sup>CFC</sup></span>
              <span className="logo-tag">Verified home services</span>
            </span>
          </a>

          <div className="loc-wrap">
            <button className="loc" type="button" id="locBtn" aria-haspopup="listbox" aria-expanded="false">
              <svg className="ic" aria-hidden="true"><use href="#i-pin"></use></svg>
              <span className="loc-city">Bengaluru</span>
              <svg className="ic ic-dn" aria-hidden="true"><use href="#i-chev"></use></svg>
            </button>
            <div className="loc-pop" id="locPop" role="listbox" aria-label="Choose your city">
              <h4>We are live in these cities</h4>
              <div id="locList"></div>
              <button className="loc-detect" type="button" id="locDetect">
                <svg className="ic" aria-hidden="true"><use href="#i-pin"></use></svg>Use my current location
              </button>
            </div>
          </div>

          <nav className="nav" aria-label="Main">
            <a href="#services">Services</a>
            <a href="#how">How it works</a>
            <a href="#care">Offers</a>
            {/* The Pro app is a separate Next app on 3001. Absolute URL and a
                plain <a>, not <Link>: it is a different origin in dev and will
                be a different domain in production, so client-side routing
                cannot carry it. Swap the host when the real domain exists. */}
            <a href="http://localhost:3001">Join as Pro</a>
          </nav>

          <div className="hdr-actions">
            <Link className="btn btn-ghost btn-sm" href="/login">Log in</Link>
            <Link className="btn btn-primary btn-sm" href="/categories">Book Now</Link>
            <button className="burger" type="button" id="burger" aria-label="Open menu" aria-expanded="false">
              <svg className="ic" aria-hidden="true"><use href="#i-menu"></use></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="sheet" id="sheet" aria-hidden="true">
        <div className="sheet-top">
          <span className="logo-text"><span className="logo-name">CityFamilyCare<sup>CFC</sup></span></span>
          <button className="burger" type="button" id="sheetClose" aria-label="Close menu">
            <svg className="ic" aria-hidden="true"><use href="#i-x"></use></svg>
          </button>
        </div>
        <a className="sheet-item" href="#services">Services <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#booked">Most booked <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#how">How it works <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#care">Offers <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="http://localhost:3001">Join as Pro <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#faq">Common questions <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <Link className="btn btn-primary" href="/categories">Book Now</Link>
        <Link className="btn btn-ghost" href="/login">Log in</Link>
      </div>

      <main id="top">

        {/* Hero */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true"></div>
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker"><b>20% OFF</b> on your first booking &middot; FIRST20</span>
              <h1>Book a <em>verified pro</em> for anything your home needs.</h1>
              <p className="hero-sub">Cleaning, plumbing, electrical, appliances and 40 more services. Fixed prices before you book, background-checked professionals, and a 30-day warranty on every job.</p>

              <div className="ask">
                <div className="ask-field">
                <div className="ask-bar" id="askBar">
                  <svg className="ic ic-search" aria-hidden="true"><use href="#i-search"></use></svg>
                  <input id="askInput" type="text" autoComplete="off" role="combobox" aria-expanded="false" aria-controls="sug" aria-autocomplete="list" aria-label="Search for a home service" placeholder="Search or speak a service" />
                  <button className="mic" type="button" id="micBtn" aria-label="Search by voice">
                    <svg className="ic" aria-hidden="true"><use href="#i-mic"></use></svg>
                  </button>
                  <button className="btn btn-primary ask-go" type="button" id="askGo"><span>Search</span><svg className="ic" aria-hidden="true" style={{ width: '18px', height: '18px' }}><use href="#i-search"></use></svg></button>
                </div>
                  <div className="sug" id="sug" role="listbox" aria-label="Service suggestions"></div>
                </div>
                <div className="ask-status" id="askStatus" role="status" aria-live="polite">
                  <span className="bars"><i></i><i></i><i></i><i></i><i></i></span>
                  <span id="askStatusText">Listening. Say something like "my tap is leaking"</span>
                </div>
                <div className="chips">
                  <span className="chip-label">Popular:</span>
                  <button className="chip" type="button">AC service</button>
                  <button className="chip" type="button">Deep cleaning</button>
                  <button className="chip" type="button">Sofa shampooing</button>
                  <button className="chip" type="button">Electrician</button>
                            </div>
              </div>

            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="art-panel">
                {/* The photograph was shot with the technician on the right and
                    clean wall on the left, so the three cards below sit over
                    that empty space. `fill` + `priority` because this is the
                    largest contentful paint on the page; Next serves it as
                    WebP/AVIF, which takes the 1.8MB source down by an order of
                    magnitude. `sizes` stops it shipping a desktop-width file to
                    a phone. */}
                <Image
                  src="/herosectionac.png"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 900px) 92vw, 46vw"
                  className="art-photo"
                />
                {/* Guarantees contrast for the white cards no matter how the
                    photo crops at a given width. */}
                <span className="art-scrim"></span>
              </div>

              {/* A glass rail, not a card. The empty wall in the photograph is
                  tall and narrow, so this hugs the panel edge and runs down it
                  rather than sitting on top as a floating box. Frosted instead
                  of solid white so the photograph still reads through it. */}
              {/* One white card floating over the photograph: who is coming,
                  what it costs, and how far away they are. The ids below are
                  driven live by interactions.js (etaLabel, etaValue, proSteps,
                  proCap) - they must stay, or the countdown, the "Arrived" flip
                  and the timeline states stop working. */}
              <div className="card-price">
                <div className="rail-pro">
                  <Image
                    src="/profile_pro_acservice_rajeshkumar.png"
                    alt="Rajesh Kumar"
                    width={44}
                    height={44}
                    className="rail-face"
                  />
                  <div className="rail-pro-id">
                    <h5>Rajesh Kumar</h5>
                    <p className="rail-verified">
                      <svg className="ic ic-fill" aria-hidden="true"><use href="#i-check"></use></svg>
                      Verified pro
                    </p>
                    <p className="rail-rating"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.8 &middot; 612 jobs</p>
                  </div>
                </div>

                <div className="price-lead">
                  <h4>AC service &amp; repair</h4>
                  {/* 49900 paise, straight from the catalogue fixture - the same
                      figure the "Most booked" rail renders. The ₹299 here before
                      was invented, and a strikethrough implies a discount no
                      fixture backs. */}
                  <div className="price-amt"><b>&#8377;499</b></div>
                </div>

                {/* A real tracker, not four loose bars. interactions.js sets
                    each child's className to 'done' | 'now' | '', so the dots
                    and the spine are driven by exactly the same states it
                    already writes - the markup shape is free to change. */}
                <div className="rail-track">
                  <div className="pro-steps" id="proSteps">
                    <i className="done"><em>Booked</em></i>
                    <i className="done"><em>Assigned</em></i>
                    <i className="now"><em id="etaLabel">On the way to your address</em><b id="etaValue">32 min</b></i>
                    <i><em>At your door</em></i>
                  </div>
                  <p className="pro-cap" id="proCap">Assigned. Arriving in uniform with a CFC ID card.</p>
                </div>
              </div>

              <div className="card-done">
                <span className="done-mark"><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg></span>
                <div>
                  <h4>Booking confirmed</h4>
                  <p>Tomorrow, 10:30 AM &nbsp;|&nbsp; 12th Main, Koramangala</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Offer strip. --ocean is the client's own banner blue, and spec 5 is
            explicit that it belongs on exactly one compact strip and nowhere
            else: on two full-width bands the page read as dark and was
            rejected. FIRST20 is the real coupon from promotions.ts. */}
        <section className="offer-strip">
          <div className="wrap offer-strip-in">
            <div>
              <h2>Up to 20% OFF on your first booking</h2>
              <p>Valid on every service in the catalogue. Applied automatically at checkout.</p>
            </div>
            <Link className="offer-strip-code" href="/categories">
              FIRST20
              <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg>
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="sec cats" id="services">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg>Browse categories</span>
                <h2>What does your home need today?</h2>
                <p>Every job inside a category has a fixed price you can see before booking.</p>
              </div>
              <Link className="sec-link" href="/categories">
                See all {serviceCount || ""} services
              </Link>
            </div>

            <div className="cat-grid">
              {/* Ten real sub-categories, ordered by demand, each priced from
                  the cheapest service actually inside it. The prototype's
                  twelve tiles were replaced wholesale: two named work we do
                  not offer, two pointed at the same sub-category, and every
                  price but one was below what a customer could book at. */}
              {/* Ten placeholders while the catalogue loads - the same count
                  and the same box metrics as the real tiles, so the sections
                  below never shift when the data lands. */}
              {loading &&
                Array.from({ length: 10 }, (_, i) => (
                  <div className="cat-sk" key={i} aria-hidden="true">
                    <i className="sk" /><b className="sk" /><s className="sk" />
                  </div>
                ))}
              {tiles.map((t, i) => (
                <Link
                  key={t.name}
                  className={`cat rv${i % 6 === 0 ? "" : ` rv-${i % 6}`}`}
                  href={t.href}
                >
                  {t.badge && (
                    <span className={`cat-tag cat-tag-${t.badge.tone}`}>{t.badge.label}</span>
                  )}
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

        {/* Promo banners */}
        <section className="sec" id="care">
          <div className="wrap">
            <div className="promo-row">
              <article className="promo promo-a">
                <svg className="ic ic-deco" aria-hidden="true"><use href="#i-spark"></use></svg>
                <div>
                  <h3>Your first booking is 20% off</h3>
                  <p>Up to &#8377;300 back on any service, for new CFC families.</p>
                </div>
                <button className="promo-code" type="button">FIRST20<svg className="ic" aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#i-arr-r"></use></svg></button>
              </article>

              {/* The referral programme, from packages/mocks/src/api/referral.ts:
                  rewardPerReferralPaise 10_000 and minimumBookingPaise 50_000.
                  What stood here was an invented "CFC Care" plan - "₹2,499 a
                  year, 3 AC services, 2 plumbing visits and unlimited
                  electrical checks" - with no fixture, no pricing and nothing
                  to click. Note the api file sets REFERRAL_TERMS_ARE_PLACEHOLDER
                  = true, so these two figures still need the client's sign-off,
                  but they are at least the figures the app itself uses. */}
              <article className="promo promo-b">
                <svg className="ic ic-deco" aria-hidden="true"><use href="#i-spark"></use></svg>
                <div>
                  <h3>Refer a friend, both of you gain</h3>
                  <p>&#8377;100 for every friend who books above &#8377;500.</p>
                </div>
                <Link className="promo-code" href="/refer">Invite a friend<svg className="ic" aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#i-arr-r"></use></svg></Link>
              </article>

              <article className="promo promo-c">
                <svg className="ic ic-deco" aria-hidden="true"><use href="#i-cal"></use></svg>
                <div>
                  <h3>Mornings cost less</h3>
                  <p>Book any cleaning service before noon and save 15%.</p>
                </div>
                <button className="promo-code" type="button">See morning slots<svg className="ic" aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#i-arr-r"></use></svg></button>
              </article>
            </div>
          </div>
        </section>

        {/* Most booked */}
        <section className="sec" id="booked" style={{ paddingTop: '0' }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow"><svg className="ic" aria-hidden="true"><use href="#i-spark"></use></svg>Top services near you</span>
                <h2>Most booked in <span data-city>Bengaluru</span> this week</h2>
                <p>Real prices, no surge. Same rate at 8 AM or 8 PM.</p>
              </div>
              <div className="rail-nav">
                <button className="rail-btn" type="button" id="railPrev" aria-label="Previous services"><svg className="ic" aria-hidden="true"><use href="#i-arr-l"></use></svg></button>
                <button className="rail-btn" type="button" id="railNext" aria-label="More services"><svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></button>
              </div>
            </div>

            <div className="rail-wrap">
              <div className="rail" id="rail">
                {/* The eight most-booked services, from the catalogue. The
                    prototype's six cards carried invented figures - `12.4k
                    bookings`, a `4.8` with nothing behind it - which is what
                    PLATFORM-FACTS.md forbids. Rank, rating, booking count,
                    price and duration are all read from the service now, and
                    a service with no ratings yet reads "New" rather than
                    borrowing someone else's score. */}
                {loading &&
                  Array.from({ length: 4 }, (_, i) => (
                    <div className="bk-sk" key={i} aria-hidden="true">
                      <i className="sk" />
                      <div><b className="sk" /><s className="sk" /></div>
                    </div>
                  ))}
                {booked.map((b, i) => (
                  <article className="bk" key={b.id}>
                    {/* Icon on a tinted panel, not a photograph. The approved
                        design uses icons here, and the placeholder photography
                        was miscast for an Indian marketplace. Only the first
                        card carries a badge - a rank pill on every card read as
                        noise rather than as a signal. */}
                    <div className="bk-media">
                      {i === 0 && <span className="bk-rank">MOST BOOKED</span>}
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
                        <Link className="btn btn-primary btn-sm" href={b.href}>Book Now</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="rail-prog"><i id="railProg"></i></div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="sec how" id="how">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow"><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>How it works</span>
                <h2>Three steps, about a minute</h2>
                <p>No calls, no haggling, no waiting at home all day for someone who may not turn up.</p>
              </div>
            </div>
            <div className="steps">
              <div className="step">
                <span className="step-n">1</span>
                <div>
                  <h3>Tell us what is wrong</h3>
                  <p>Type it or say it. "Fan is making noise" finds the right service just as well as "electrician".</p>
                </div>
              </div>
              <div className="step">
                <span className="step-n">2</span>
                <div>
                  <h3>Pick a slot and see the price</h3>
                  <p>Choose a two-hour window that suits you. The price you see is the price you pay.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-n">3</span>
                <div>
                  <h3>Track your pro to the door</h3>
                  <p>You get their name, photo, rating and live location. Pay by UPI after the job is done.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why CFC */}
        <section className="sec why-sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow"><svg className="ic" aria-hidden="true"><use href="#i-shield"></use></svg>Why CFC</span>
                <h2>Why families keep calling us back</h2>
                <p>Letting a stranger into your home is a big ask. Here is how we earn it, every single booking.</p>
              </div>
            </div>
            <div className="why-grid">
              <div className="why-cell rv"><span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-badge"></use></svg></span><h3>Every pro is verified</h3><p>Aadhaar check, police verification and an in-person skill test before anyone takes a CFC booking.</p></div>
              <div className="why-cell rv rv-1"><span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-wallet"></use></svg></span><h3>The price is fixed upfront</h3><p>You see the full cost before confirming. Spare parts are charged at MRP with the bill shown to you.</p></div>
              <div className="why-cell rv rv-2"><span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-shield"></use></svg></span><h3>30-day service warranty</h3><p>If the same problem comes back within a month, we send someone again at no cost.</p></div>
              <div className="why-cell rv rv-3"><span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-clock"></use></svg></span><h3>On time, or 100 off</h3><p>If your pro is more than 30 minutes late, we take &#8377;100 off the bill automatically.</p></div>
              <div className="why-cell rv rv-4"><span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span><h3>Damage cover up to 10,000</h3><p>Every job is insured. If something breaks while we work, we repair or replace it.</p></div>
              <div className="why-cell rv rv-5"><span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-headset"></use></svg></span><h3>A person answers the phone</h3><p>Support in English, Tamil, Kannada, Telugu and Hindi, from 7 AM to 11 PM every day.</p></div>
            </div>
          </div>
        </section>

        {/* Join as a pro */}
        <section className="pro-band" id="pro">
          <div className="wrap pro-in">
            <div className="pro-copy">
              <span className="eyebrow eyebrow-on-teal"><svg className="ic" aria-hidden="true"><use href="#i-badge"></use></svg>Join as a pro</span>
              <h2>Your skill. Your hours. Our customers.</h2>
              {/* Rewritten against PLATFORM-FACTS.md. The prototype said "over
                  6,400 pros" (nobody has signed up yet), "no commission for
                  your first 30 days" (the documented offer is the first 20
                  JOBS, not a time window - a pro reading the old line would
                  have been cut off mid-offer) and "payouts every Monday" (the
                  documented terms are within 48 hours of completion, which is
                  a better promise anyway). The free tool kit had no source at
                  all and is gone. */}
              <p>Electricians, cleaners, plumbers and beauticians run their week on CFC. Your first 20 jobs carry no commission, 15% after that, and your money reaches your bank or UPI within 48 hours of finishing a job.</p>
              <div className="pro-cta">
                {/* Both open the Pro app on :3001, the same target as the
                    "Join as Pro" nav item. Plain <a> with an absolute URL, not
                    <Link>: it is a separate origin in dev and a separate domain
                    in production, so client-side routing cannot carry it.
                    Swap the host in all three places when the domain exists. */}
                <a className="btn btn-primary" href="http://localhost:3001">Join as a professional</a>
                <a className="btn btn-clear" href="http://localhost:3001">See how earnings work</a>
              </div>
            </div>
            <div className="pro-stats">
              {/* Every figure here is now a documented term of the deal
                  rather than a claim about how well it is going. An average
                  monthly earning cannot exist before launch, and publishing
                  one sets an expectation nobody can be held to. */}
              <div className="pstat rv"><svg className="ic" aria-hidden="true"><use href="#i-spark"></use></svg><strong>0%</strong><span>commission on your first 20 jobs</span></div>
              <div className="pstat rv rv-1"><svg className="ic" aria-hidden="true"><use href="#i-cal"></use></svg><strong data-count="48">48</strong><span>hour payouts, to your bank or UPI</span></div>
              <div className="pstat rv rv-2"><svg className="ic" aria-hidden="true"><use href="#i-growth"></use></svg><strong data-count="15" data-suffix="%">15%</strong><span>flat commission after that. No hidden cuts.</span></div>
              <div className="pstat rv rv-3"><svg className="ic" aria-hidden="true"><use href="#i-wallet"></use></svg><strong>MRP</strong><span>on parts. You never fund a job yourself.</span></div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="sec tst-sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>Sample reviews</span>
                <h2>What people say after we leave</h2>
                {/* The six quotes below are written copy, not customer
                    reviews - CFC has not completed a job yet. The rest of the
                    app already labels this fixture honestly through
                    `REVIEWS_ARE_PLACEHOLDER`, and the same sentence is used
                    here so the two never disagree. The "Read all 28,000
                    reviews" link went with it: there are no reviews to read,
                    and it pointed at `#top` anyway. */}
                <p>Sample content &#8212; real reviews appear here once jobs are completed. Reviews are collected after the job is closed, and we publish the bad ones too.</p>
              </div>
            </div>
          </div>
          <div className="marquee">
            <div className="marquee-track" id="track">
              <article className="quote">
                <div className="stars" aria-label="5 out of 5"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>Booked a deep clean at 11 PM for the next morning and three people turned up at 9 sharp. The kitchen chimney looks new. I have already booked them for my mother's flat.</p>
                <footer><Image src="/images/testimonials/meera.png" alt="Meera Sundaram" width={38} height={38} className="avatar" style={{ objectFit: 'cover' }} /><div><b>Meera Sundaram</b><span>Indiranagar, Bengaluru</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars" aria-label="4 out of 5"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-empty"><use href="#i-star"></use></svg></div>
                <p>What sold me is that the amount on the app was the amount I paid. No extra visiting charge, no sudden parts bill. The technician showed me the old capacitor before replacing it.</p>
                <footer><Image src="/images/testimonials/arvind.png" alt="Arvind Raghavan" width={38} height={38} className="avatar" style={{ objectFit: 'cover' }} /><div><b>Arvind Raghavan</b><span>Anna Nagar, Chennai</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars" aria-label="5 out of 5"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>My parents are in their seventies and I book everything for them from Dubai. They get an SMS with the pro's photo, and I can see when he reaches. That peace of mind is worth a lot.</p>
                <footer><Image src="/images/testimonials/farhan.png" alt="Farhan Khan" width={38} height={38} className="avatar" style={{ objectFit: 'cover' }} /><div><b>Farhan Khan</b><span>booking for Jayanagar</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars" aria-label="4.5 out of 5"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star-half"></use></svg></div>
                <p>The leak came back after two weeks. I messaged support, they sent the same plumber the next morning and charged nothing. That is the only reason I am still with CFC.</p>
                <footer><Image src="/images/testimonials/priya.png" alt="Priya Nair" width={38} height={38} className="avatar" style={{ objectFit: 'cover' }} /><div><b>Priya Nair</b><span>Kakkanad, Kochi</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars" aria-label="5 out of 5"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>I used the voice search while cooking, just said the fridge is not cooling, and it pulled up the exact service. Booked in under a minute with one hand.</p>
                <footer><Image src="/images/testimonials/sowmya.png" alt="Sowmya Venkatesh" width={38} height={38} className="avatar" style={{ objectFit: 'cover' }} /><div><b>Sowmya Venkatesh</b><span>RS Puram, Coimbatore</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars" aria-label="4 out of 5"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-empty"><use href="#i-star"></use></svg></div>
                <p>Six months on the CFC Care plan and I have stopped thinking about AC servicing entirely. They call me before summer and fix a slot.</p>
                <footer><Image src="/images/testimonials/deepak.png" alt="Deepak Jain" width={38} height={38} className="avatar" style={{ objectFit: 'cover' }} /><div><b>Deepak Jain</b><span>Gachibowli, Hyderabad</span></div></footer>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="sec" id="faq" style={{ paddingBottom: '0' }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>Questions we get asked every day</h2>
                <p>If yours is not here, our team answers the phone between 7 AM and 11 PM.</p>
              </div>
            </div>
            <div className="faq">
              <details open>
                <summary>How do you check the people you send to my home?<svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg></summary>
                <p className="faq-a">Every professional goes through Aadhaar verification, a police background check and an in-person skill test before their first CFC job. You get their name, photo and rating in the app before they arrive, and they carry a CFC ID card in uniform. If anyone turns up without one, do not let them in and call us.</p>
              </details>
              <details>
                <summary>Is the price on the app the final price?<svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg></summary>
                <p className="faq-a">Yes, for the work you booked. There is no visiting charge and no separate labour fee. The only thing that can be added is a spare part, and that is charged at MRP with the bill shown to you before it is fitted. If extra work is needed, the pro raises it in the app and you approve the new price before anyone starts.</p>
              </details>
              <details>
                <summary>What if the problem comes back after a few days?<svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg></summary>
                <p className="faq-a">Every job carries a 30-day warranty. If the same issue returns within a month, message support and we send a professional again at no cost, usually the same one who did the original job.</p>
              </details>
              <details>
                <summary>Can I reschedule or cancel?<svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg></summary>
                <p className="faq-a">Reschedule any time up to two hours before your slot, free. Cancel more than two hours ahead and you pay nothing. Inside two hours there is a small fee, because a professional has already blocked the slot and travelled out for it.</p>
              </details>
              <details>
                <summary>Something got damaged during the job. What happens?<svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg></summary>
                <p className="faq-a">Every booking is insured up to &#8377;10,000. Report it within 48 hours with a photo and we repair or replace the item. You do not deal with the professional about it, you deal with us.</p>
              </details>
              <details>
                <summary>Do you work on Sundays and holidays?<svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg></summary>
                <p className="faq-a">Yes, seven days a week from 7 AM to 9 PM, including most public holidays. The price does not change on a Sunday. Weekday mornings are actually the cheapest slots for cleaning services.</p>
              </details>
            </div>
          </div>
        </section>

        {/* Cities */}
        <section className="sec cities">
          <div className="wrap app-panel">
            <div className="app-copy">
              <span className="eyebrow"><svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg>CFC on your phone</span>
              <h2>Book, track and pay from one app</h2>
              <p>Live tracking, saved addresses, wallet and instant rebooking. Works on the web too, no install needed.</p>
              {/* Inert by design: there is no published store listing yet, and a
                  guessed URL would be a dead link on a primary CTA. */}
              <div className="app-btns">
                <button className="btn btn-android" type="button">
                  <svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg>Get the Android app
                </button>
                <button className="btn btn-ghost" type="button">
                  <svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg>Get the iOS app
                </button>
              </div>
            </div>
            <div className="app-cities">
            <h2>Where CFC works today</h2>
            <p className="sec-sub">Same prices, same warranty, same verification in every city. Tell us where you want us next.</p>
            <div className="city-list">
              {/* the city in the header picker, marked per the reference */}
              <button className="city is-active" type="button">Bengaluru</button>
              <button className="city" type="button">Chennai</button>
              <button className="city" type="button">Hyderabad</button>
              <button className="city" type="button">Coimbatore</button>
              <button className="city" type="button">Madurai</button>
              <button className="city" type="button">Kochi</button>
              <button className="city" type="button">Mysuru</button>
              <button className="city" type="button">Trichy</button>
              <button className="city" type="button">Salem</button>
              <button className="city" type="button">Vijayawada</button>
              <button className="city" type="button">Mangaluru</button>
              <button className="city more" type="button">+ Request your city</button>
            </div>
            </div>
          </div>
        </section>
      </main>

      {/* Extracted to site-footer.tsx so the signed-in home renders the
          identical footer rather than a diverging copy of it. */}
      <SiteFooter tiles={tiles} />

      <div className="mbar" id="mbar">
        <Link className="btn btn-primary" href="/categories">Book Now</Link>
        <button className="btn btn-ghost" type="button" aria-label="Call CFC support"><svg className="ic" aria-hidden="true"><use href="#i-headset"></use></svg></button>
      </div>

    </div>
  );
}
