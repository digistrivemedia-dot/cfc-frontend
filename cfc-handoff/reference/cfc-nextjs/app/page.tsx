'use client';

import { useEffect } from 'react';
import { initCFC } from './interactions';

export default function HomePage() {
  // One place for every interaction on the page: sticky header, mobile menu,
  // scroll reveals, the services rail, voice search and the marquee.
  useEffect(() => initCFC(), []);

  return (
    <>
      <svg className="sprite" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M3.5 10.5 12 3.5l8.5 7v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M9.5 21v-6h5v6"/></symbol>
        <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21.5s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10.5" r="2.4"/></symbol>
        <symbol id="i-chev" viewBox="0 0 24 24"><path d="M6 9.5 12 15.5 18 9.5"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6 18 18M18 6 6 18"/></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7.2"/><path d="M16.3 16.3 20.5 20.5"/></symbol>
        <symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/></symbol>
        <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.8 6.7 19.6l1.1-5.9L3.5 9.6l5.9-.8z"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7.5 3v6.2c0 4.4-3.1 7.8-7.5 9.3-4.4-1.5-7.5-4.9-7.5-9.3V6z"/><path d="M9 12l2.2 2.2L15.4 10"/></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.2V12l3.3 2"/></symbol>
        <symbol id="i-wallet" viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="3"/><path d="M20.5 10.5h-4a1.5 1.5 0 0 0 0 3h4"/></symbol>
        <symbol id="i-headset" viewBox="0 0 24 24"><path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1"/><rect x="2.5" y="12.5" width="4" height="6" rx="2"/><rect x="17.5" y="12.5" width="4" height="6" rx="2"/><path d="M19.5 18.5v.5a3 3 0 0 1-3 3H13"/></symbol>
        <symbol id="i-arr-r" viewBox="0 0 24 24"><path d="M4.5 12h14M13 6.5 18.5 12 13 17.5"/></symbol>
        <symbol id="i-arr-l" viewBox="0 0 24 24"><path d="M19.5 12h-14M11 6.5 5.5 12 11 17.5"/></symbol>
        <symbol id="i-spark" viewBox="0 0 24 24"><path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z"/><path d="M17.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20.2a7.4 7.4 0 0 1 14.4 0"/></symbol>
        <symbol id="i-badge" viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5"/><path d="M8.2 13.6 7 21.5l5-2.6 5 2.6-1.2-7.9"/></symbol>
        <symbol id="i-phone" viewBox="0 0 24 24"><rect x="5.5" y="2.5" width="13" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></symbol>
        <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></symbol>
        <symbol id="i-growth" viewBox="0 0 24 24"><path d="M4 19.5h16"/><path d="M6.5 16V11M11 16V6.5M15.5 16v-7M20 16V4"/></symbol>
        <symbol id="i-clean" viewBox="0 0 24 24"><path d="M10 2.5h4V6h-4z"/><path d="M8.5 10a3.5 3.5 0 0 1 3.5-3.5A3.5 3.5 0 0 1 15.5 10v9a2.5 2.5 0 0 1-2.5 2.5h-2A2.5 2.5 0 0 1 8.5 19z"/><path d="M10 2.5H7.2L5 4.6M9 12.5h6"/></symbol>
        <symbol id="i-plumb" viewBox="0 0 24 24"><path d="M16.4 3.1a5.1 5.1 0 0 0-5.7 6.7l-6.6 6.6a2.5 2.5 0 0 0 3.5 3.5l6.6-6.6a5.1 5.1 0 0 0 6.7-5.7l-3 3-2.7-.8-.8-2.7z"/></symbol>
        <symbol id="i-elec" viewBox="0 0 24 24"><path d="M13.5 2.5 6 13.5h5L10.5 21.5 18 10.5h-5z"/></symbol>
        <symbol id="i-ac" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="7" rx="2"/><path d="M6.5 9h11"/><path d="M7 15.5c.9-1 1.8-1 2.7 0s1.8 1 2.7 0M12.6 19c.9-1 1.8-1 2.7 0s1.8 1 2.7 0"/></symbol>
        <symbol id="i-appliance" viewBox="0 0 24 24"><rect x="4" y="2.8" width="16" height="18.4" rx="3"/><path d="M4 8.2h16"/><circle cx="12" cy="14.8" r="3.8"/><path d="M7.2 5.5h1.6"/></symbol>
        <symbol id="i-pest" viewBox="0 0 24 24"><circle cx="12" cy="6.4" r="2.2"/><path d="M8 11.5a4 4 0 0 1 8 0v3.8a4 4 0 0 1-8 0z"/><path d="M12 11.5v8M8 12 5 10M8 15.6 5 17M16 12l3-2M16 15.6l3 1.4M10.3 4.6 8.8 2.5M13.7 4.6l1.5-2.1"/></symbol>
        <symbol id="i-salon" viewBox="0 0 24 24"><circle cx="6.5" cy="17.5" r="2.6"/><circle cx="17.5" cy="17.5" r="2.6"/><path d="M8.4 15.6 18.5 3.5M15.6 15.6 5.5 3.5"/></symbol>
        <symbol id="i-paint" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="13" height="5.5" rx="1.5"/><path d="M16.5 6.25h3a1.5 1.5 0 0 1 1.5 1.5v1.75a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 0-1.5 1.5V14"/><rect x="8.5" y="14" width="4" height="7" rx="1.5"/></symbol>
        <symbol id="i-carpenter" viewBox="0 0 24 24"><path d="M11.5 7.5 4.8 14.2a2 2 0 0 0 0 2.8l2.2 2.2a2 2 0 0 0 2.8 0l6.7-6.7"/><path d="M13.2 3.4 20.6 10.8l-2.2 2.2a1.4 1.4 0 0 1-2 0l-3.4-3.4a1.4 1.4 0 0 1 0-2z"/></symbol>
        <symbol id="i-laundry" viewBox="0 0 24 24"><path d="M8.5 3.5 5 5.2a1.5 1.5 0 0 0-.8 1.8l1 3.2 2.3-.7V20a1.5 1.5 0 0 0 1.5 1.5h6A1.5 1.5 0 0 0 16.5 20V9.5l2.3.7 1-3.2a1.5 1.5 0 0 0-.8-1.8L15.5 3.5a3.5 3.5 0 0 1-7 0z"/></symbol>
        <symbol id="i-water" viewBox="0 0 24 24"><path d="M12 2.8s6 6.5 6 10.4a6 6 0 0 1-12 0C6 9.3 12 2.8 12 2.8z"/><path d="M9 14h6"/></symbol>
        <symbol id="i-move" viewBox="0 0 24 24"><path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2z"/><path d="M3.5 8.2 12 12.4l8.5-4.2M12 12.4V20"/></symbol>
      </svg>

      <a className="skip" href="#top">Skip to content</a>

      <header className="hdr" id="hdr">
        <div className="wrap hdr-in">
          <a className="logo" href="#top" aria-label="CityFamilyCare home">
            <span className="logo-mark"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span>
            <span className="logo-text">CityFamilyCare<span>CFC</span></span>
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
            <a href="#care">CFC Care plans</a>
            <a href="#pro">Work with us</a>
          </nav>

          <div className="hdr-actions">
            <button className="btn btn-ghost btn-sm" type="button">Log in</button>
            <button className="btn btn-primary btn-sm" type="button">Book a service</button>
            <button className="burger" type="button" id="burger" aria-label="Open menu" aria-expanded="false">
              <svg className="ic" aria-hidden="true"><use href="#i-menu"></use></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="sheet" id="sheet" aria-hidden="true">
        <div className="sheet-top">
          <span className="logo-text">CityFamilyCare<span>CFC</span></span>
          <button className="burger" type="button" id="sheetClose" aria-label="Close menu">
            <svg className="ic" aria-hidden="true"><use href="#i-x"></use></svg>
          </button>
        </div>
        <a className="sheet-item" href="#services">Services <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#booked">Most booked <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#how">How it works <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#care">CFC Care plans <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#pro">Work with us <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <a className="sheet-item" href="#faq">Common questions <svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></a>
        <button className="btn btn-primary" type="button">Book a service</button>
        <button className="btn btn-ghost" type="button">Log in</button>
      </div>

      <main id="top">

        {/* Hero */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true"></div>
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker"><b>FIRST20</b> 20% off your first booking</span>
              <h1>Book a verified pro for anything your home needs.</h1>
              <p className="hero-sub">Cleaning, plumbing, electrical, appliances and 40 more services. Fixed prices before you book, background-checked professionals, and a 30-day warranty on every job.</p>

              <div className="ask">
                <div className="ask-field">
                <div className="ask-bar" id="askBar">
                  <svg className="ic ic-search" aria-hidden="true"><use href="#i-search"></use></svg>
                  <input id="askInput" type="text" autoComplete="off" role="combobox" aria-expanded="false" aria-controls="sug" aria-autoComplete="list" aria-label="Search for a home service" placeholder="Search or speak a service" />
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

              <div className="trust">
                <div><strong data-count="1.2" data-dec="1" data-suffix="L+">1.2L+</strong><span>homes served</span></div>
                <div><strong data-count="4.8" data-dec="1">4.8</strong><span>average from 28,000 reviews</span></div>
                <div><strong data-count="6400" data-sep="1">6,400</strong><span>verified professionals</span></div>
                <div><strong data-count="11">11</strong><span>cities across South India</span></div>
              </div>
            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="art-panel"></div>

              <div className="card-price">
                <h4>AC service and repair</h4>
                <div className="price-line"><b>&#8377;499</b><s>&#8377;699</s></div>
                <p className="price-note">Inclusive of taxes. No visit charge.</p>
                <p className="price-tick"><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>Price locked before you book</p>
              </div>

              <div className="card-pro">
                <div className="pro-row">
                  <span className="avatar">RK</span>
                  <div>
                    <h4>Rajesh Kumar</h4>
                    <p><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.8 &nbsp;|&nbsp; 612 jobs &nbsp;|&nbsp; ID verified</p>
                  </div>
                </div>
                <div className="pro-eta"><span id="etaLabel">On the way to your address</span><b id="etaValue">32 min</b></div>
                <div className="pro-steps" id="proSteps"><i className="done"></i><i className="done"></i><i className="now"></i><i></i></div>
                <p className="pro-cap" id="proCap">Assigned. Arriving in uniform with a CFC ID card.</p>
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

        {/* Categories */}
        <section className="sec cats" id="services">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>What does your home need today?</h2>
                <p>Every job inside a category has a fixed price you can see before booking.</p>
              </div>
              <a className="sec-link" href="#services">See all 46 services</a>
            </div>

            <div className="cat-grid">
              <button className="cat rv" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-clean"></use></svg></span><h3>Home cleaning</h3><p>From &#8377;399</p></button>
              <button className="cat rv rv-1" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-plumb"></use></svg></span><h3>Plumbing</h3><p>From &#8377;199</p></button>
              <button className="cat rv rv-2" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-elec"></use></svg></span><h3>Electrician</h3><p>From &#8377;199</p></button>
              <button className="cat rv rv-3" type="button"><span className="cat-tag">Popular</span><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-ac"></use></svg></span><h3>AC repair</h3><p>From &#8377;499</p></button>
              <button className="cat rv rv-4" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-appliance"></use></svg></span><h3>Appliance repair</h3><p>From &#8377;299</p></button>
              <button className="cat rv rv-5" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-pest"></use></svg></span><h3>Pest control</h3><p>From &#8377;899</p></button>
              <button className="cat rv" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-salon"></use></svg></span><h3>Salon for women</h3><p>From &#8377;249</p></button>
              <button className="cat rv rv-1" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-paint"></use></svg></span><h3>Painting</h3><p>Free site visit</p></button>
              <button className="cat rv rv-2" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-carpenter"></use></svg></span><h3>Carpentry</h3><p>From &#8377;249</p></button>
              <button className="cat rv rv-3" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-laundry"></use></svg></span><h3>Laundry</h3><p>From &#8377;79 per kg</p></button>
              <button className="cat rv rv-4" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-water"></use></svg></span><h3>Water purifier</h3><p>From &#8377;399</p></button>
              <button className="cat rv rv-5" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-move"></use></svg></span><h3>Packers and movers</h3><p>Free quote</p></button>
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

              <article className="promo promo-b">
                <svg className="ic ic-deco" aria-hidden="true"><use href="#i-shield"></use></svg>
                <div>
                  <h3>One plan for the whole year</h3>
                  <p>3 AC services, 2 plumbing visits and unlimited electrical checks.</p>
                </div>
                <button className="promo-code" type="button">&#8377;2,499 a year<svg className="ic" aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#i-arr-r"></use></svg></button>
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
                <h2>Most booked in <span data-city>Bengaluru</span> this week</h2>
                <p>Real prices, no surge, and the same rate whether you book at 8 AM or 8 PM.</p>
              </div>
              <div className="rail-nav">
                <button className="rail-btn" type="button" id="railPrev" aria-label="Previous services"><svg className="ic" aria-hidden="true"><use href="#i-arr-l"></use></svg></button>
                <button className="rail-btn" type="button" id="railNext" aria-label="More services"><svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></button>
              </div>
            </div>

            <div className="rail-wrap">
              <div className="rail" id="rail">
                <article className="bk">
                  <div className="bk-media"><span className="bk-rank">#1 this week</span><svg className="ic" aria-hidden="true"><use href="#i-ac"></use></svg></div>
                  <div className="bk-body">
                    <h3>AC service and gas refill</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.8</span><em></em><span>12.4k bookings</span><em></em><span>60 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;499</b><small>onwards, taxes included</small></div><button className="btn btn-ghost btn-sm" type="button">Book</button></div>
                  </div>
                </article>

                <article className="bk">
                  <div className="bk-media"><span className="bk-rank">#2 this week</span><svg className="ic" aria-hidden="true"><use href="#i-clean"></use></svg></div>
                  <div className="bk-body">
                    <h3>Full home deep cleaning</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.9</span><em></em><span>8.1k bookings</span><em></em><span>4 hours</span></div>
                    <div className="bk-foot"><div><b>&#8377;2,299</b><small>2 BHK, 3 cleaners</small></div><button className="btn btn-ghost btn-sm" type="button">Book</button></div>
                  </div>
                </article>

                <article className="bk">
                  <div className="bk-media"><span className="bk-rank">#3 this week</span><svg className="ic" aria-hidden="true"><use href="#i-plumb"></use></svg></div>
                  <div className="bk-body">
                    <h3>Tap and mixer repair</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.7</span><em></em><span>6.6k bookings</span><em></em><span>45 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;199</b><small>parts charged at MRP</small></div><button className="btn btn-ghost btn-sm" type="button">Book</button></div>
                  </div>
                </article>

                <article className="bk">
                  <div className="bk-media"><span className="bk-rank">#4 this week</span><svg className="ic" aria-hidden="true"><use href="#i-salon"></use></svg></div>
                  <div className="bk-body">
                    <h3>Salon at home for women</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.9</span><em></em><span>5.2k bookings</span><em></em><span>90 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;249</b><small>single use kit, sealed</small></div><button className="btn btn-ghost btn-sm" type="button">Book</button></div>
                  </div>
                </article>

                <article className="bk">
                  <div className="bk-media"><span className="bk-rank">#5 this week</span><svg className="ic" aria-hidden="true"><use href="#i-pest"></use></svg></div>
                  <div className="bk-body">
                    <h3>Cockroach and ant control</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.7</span><em></em><span>4.4k bookings</span><em></em><span>60 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;899</b><small>child and pet safe gel</small></div><button className="btn btn-ghost btn-sm" type="button">Book</button></div>
                  </div>
                </article>

                <article className="bk">
                  <div className="bk-media"><span className="bk-rank">#6 this week</span><svg className="ic" aria-hidden="true"><use href="#i-appliance"></use></svg></div>
                  <div className="bk-body">
                    <h3>Washing machine repair</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.6</span><em></em><span>3.9k bookings</span><em></em><span>60 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;299</b><small>free diagnosis on repair</small></div><button className="btn btn-ghost btn-sm" type="button">Book</button></div>
                  </div>
                </article>
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
        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
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
              <h2>Your skill. Your hours. Our customers.</h2>
              <p>Over 6,400 electricians, cleaners, plumbers and beauticians run their week on CFC. No commission for your first 30 days, payouts every Monday, and a free tool kit when you complete 20 jobs.</p>
              <div className="pro-cta">
                <button className="btn btn-primary" type="button">Join as a professional</button>
                <button className="btn btn-clear" type="button">See how earnings work</button>
              </div>
            </div>
            <div className="pro-stats">
              <div className="pstat rv"><svg className="ic" aria-hidden="true"><use href="#i-growth"></use></svg><strong data-count="38400" data-sep="1" data-prefix="&#8377;">&#8377;38,400</strong><span>average monthly earning, full-time pros</span></div>
              <div className="pstat rv rv-1"><svg className="ic" aria-hidden="true"><use href="#i-cal"></use></svg><strong>Weekly</strong><span>payouts, straight to your bank</span></div>
              <div className="pstat rv rv-2"><svg className="ic" aria-hidden="true"><use href="#i-user"></use></svg><strong data-count="6400" data-sep="1" data-suffix="+">6,400+</strong><span>professionals already on CFC</span></div>
              <div className="pstat rv rv-3"><svg className="ic" aria-hidden="true"><use href="#i-spark"></use></svg><strong>0%</strong><span>commission for your first 30 days</span></div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <h2>What people say after we leave</h2>
                <p>Reviews are collected after the job is closed, and we publish the bad ones too.</p>
              </div>
              <a className="sec-link" href="#top">Read all 28,000 reviews</a>
            </div>
          </div>
          <div className="marquee">
            <div className="marquee-track" id="track">
              <article className="quote">
                <div className="stars"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>Booked a deep clean at 11 PM for the next morning and three people turned up at 9 sharp. The kitchen chimney looks new. I have already booked them for my mother's flat.</p>
                <footer><span className="avatar">MS</span><div><b>Meera Sundaram</b><span>Indiranagar, Bengaluru</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>What sold me is that the amount on the app was the amount I paid. No extra visiting charge, no sudden parts bill. The technician showed me the old capacitor before replacing it.</p>
                <footer><span className="avatar">AR</span><div><b>Arvind Raghavan</b><span>Anna Nagar, Chennai</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>My parents are in their seventies and I book everything for them from Dubai. They get an SMS with the pro's photo, and I can see when he reaches. That peace of mind is worth a lot.</p>
                <footer><span className="avatar">FK</span><div><b>Farhan Khan</b><span>booking for Jayanagar</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>The leak came back after two weeks. I messaged support, they sent the same plumber the next morning and charged nothing. That is the only reason I am still with CFC.</p>
                <footer><span className="avatar">PN</span><div><b>Priya Nair</b><span>Kakkanad, Kochi</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>I used the voice search while cooking, just said the fridge is not cooling, and it pulled up the exact service. Booked in under a minute with one hand.</p>
                <footer><span className="avatar">SV</span><div><b>Sowmya Venkatesh</b><span>RS Puram, Coimbatore</span></div></footer>
              </article>
              <article className="quote">
                <div className="stars"><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg><svg className="ic ic-fill"><use href="#i-star"></use></svg></div>
                <p>Six months on the CFC Care plan and I have stopped thinking about AC servicing entirely. They call me before summer and fix a slot.</p>
                <footer><span className="avatar">DJ</span><div><b>Deepak Jain</b><span>Gachibowli, Hyderabad</span></div></footer>
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
          <div className="wrap">
            <h2>Where CFC works today</h2>
            <p className="sec-sub" style={{ color: 'var(--muted)', marginTop: '8px', maxWidth: '52ch' }}>Same prices, same warranty, same verification in every city. Tell us where you want us next.</p>
            <div className="city-list">
              <button className="city" type="button">Bengaluru</button>
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
              <button className="city more" type="button">Request your city</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a className="logo" href="#top">
                <span className="logo-mark"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span>
                <span className="logo-text">CityFamilyCare<span>CFC</span></span>
              </a>
              <p className="foot-about">Home services for Indian families, delivered by professionals we know by name. Verified, insured and warrantied.</p>
              <div className="foot-apps">
                <a className="app-btn" href="#top"><svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg>iOS app</a>
                <a className="app-btn" href="#top"><svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg>Android app</a>
              </div>
            </div>
            <div>
              <h4>Services</h4>
              <ul>
                <li><a href="#services">Home cleaning</a></li>
                <li><a href="#services">AC repair and service</a></li>
                <li><a href="#services">Plumbing</a></li>
                <li><a href="#services">Electrician</a></li>
                <li><a href="#services">Pest control</a></li>
                <li><a href="#services">Salon for women</a></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="#top">About CFC</a></li>
                <li><a href="#pro">Work with us</a></li>
                <li><a href="#care">CFC Care plans</a></li>
                <li><a href="#top">For apartments</a></li>
                <li><a href="#top">Press</a></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><a href="#top">Track a booking</a></li>
                <li><a href="#top">Cancellation policy</a></li>
                <li><a href="#faq">Common questions</a></li>
                <li><a href="#top">Warranty and refunds</a></li>
                <li><a href="#top">1800 XXX 4567</a></li>
                <li><a href="#top">care@cityfamilycare.in</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-bar">
            <span>&#169; 2026 CityFamilyCare Services Pvt Ltd</span>
            <div className="links">
              <a href="#top">Privacy</a>
              <a href="#top">Terms</a>
              <a href="#top">Safety</a>
            </div>
          </div>
        </div>
      </footer>

      <div className="mbar" id="mbar">
        <button className="btn btn-primary" type="button">Book a service</button>
        <button className="btn btn-ghost" type="button" aria-label="Call CFC support"><svg className="ic" aria-hidden="true"><use href="#i-headset"></use></svg></button>
      </div>

    </>
  );
}
