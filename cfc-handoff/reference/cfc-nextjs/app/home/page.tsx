'use client';

import { useEffect } from 'react';
import { initCFCApp } from './interactions';

export default function SignedInHomePage() {
  // Cart, address capture, account menu, search and the services rail.
  useEffect(() => initCFCApp(), []);

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
        <symbol id="i-cart" viewBox="0 0 24 24"><path d="M2.5 4.5h2.4l2.4 10.8h9.6L19.5 7.5H6"/><circle cx="9.5" cy="19.6" r="1.5"/><circle cx="16.5" cy="19.6" r="1.5"/></symbol>
        <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6.5 10.5a5.5 5.5 0 0 1 11 0c0 4 1.6 5.8 1.6 5.8H4.9s1.6-1.8 1.6-5.8z"/><path d="M10 19a2 2 0 0 0 4 0"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5.5v13M5.5 12h13"/></symbol>
        <symbol id="i-minus" viewBox="0 0 24 24"><path d="M5.5 12h13"/></symbol>
        <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4.5 6.5h15M9.5 6.5V4.4h5v2.1"/><path d="M6.6 6.5l.9 13a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l.9-13"/></symbol>
        <symbol id="i-gift" viewBox="0 0 24 24"><rect x="3.5" y="8.5" width="17" height="4.2" rx="1.2"/><path d="M5.5 12.7v6.6a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6.6M12 8.5v12.3"/><path d="M12 8.5S9.2 8.5 8.2 7.6a2 2 0 1 1 3.8-1.3 2 2 0 1 1 3.8 1.3c-1 .9-3.8.9-3.8.9z"/></symbol>
        <symbol id="i-tag" viewBox="0 0 24 24"><path d="M11.4 3.5H20.5v9.1l-8.7 8.7a1.7 1.7 0 0 1-2.4 0l-6.7-6.7a1.7 1.7 0 0 1 0-2.4z"/><circle cx="16.4" cy="7.6" r="1.4"/></symbol>
        <symbol id="i-chat" viewBox="0 0 24 24"><path d="M20.5 16.2a1.6 1.6 0 0 1-1.6 1.6H9.2L4 21.5V5.4a1.6 1.6 0 0 1 1.6-1.6h13.3a1.6 1.6 0 0 1 1.6 1.6z"/><path d="M8.5 9.5h7M8.5 13h4.5"/></symbol>
        <symbol id="i-edit" viewBox="0 0 24 24"><path d="M16.4 4.6a2.1 2.1 0 0 1 3 3L8.6 18.4l-4 1 1-4z"/><path d="M14.3 6.7l3 3"/></symbol>
        <symbol id="i-logout" viewBox="0 0 24 24"><path d="M14.5 4.5h3.6a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-3.6"/><path d="M9.5 8.3 5.5 12l4 3.7M5.5 12h9"/></symbol>
        <symbol id="i-receipt" viewBox="0 0 24 24"><path d="M6 3.5h12v17.2l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><path d="M9 8.5h6M9 12.5h6"/></symbol>
        <symbol id="i-card" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M6.5 14.5h4"/></symbol>
        <symbol id="i-cog" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.2 14.2a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0V20a1.6 1.6 0 0 0-2.7-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 13.4H4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5.3 6.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V2.6a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 1 1 0 4H20a1.6 1.6 0 0 0-1.5 1z"/></symbol>
      </svg>

      <a className="skip" href="#main">Skip to content</a>

      <header className="appbar" id="appbar">
        <div className="wrap appbar-in">
          <a className="logo" href="#main" aria-label="CityFamilyCare home">
            <span className="logo-mark"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span>
            <span className="logo-text">CityFamilyCare<span>CFC</span></span>
          </a>

          <button className="addr-btn unset" type="button" id="addrBtn">
            <svg className="ic" aria-hidden="true"><use href="#i-pin"></use></svg>
            <span className="addr-text">
              <b id="addrTitle">Add your address</b>
              <span id="addrSub">Bengaluru</span>
            </span>
            <svg className="ic ic-dn" aria-hidden="true"><use href="#i-chev"></use></svg>
          </button>

          <div className="app-search" id="appSearch">
            <svg className="ic" aria-hidden="true"><use href="#i-search"></use></svg>
            <input id="askInput" type="text" autoComplete="off" role="combobox" aria-expanded="false" aria-controls="sug" aria-autoComplete="list" aria-label="Search for a home service" placeholder="Search for a service" />
            <button className="mic" type="button" id="micBtn" aria-label="Search by voice">
              <svg className="ic" aria-hidden="true"><use href="#i-mic"></use></svg>
            </button>
            <div className="sug" id="sug" role="listbox" aria-label="Service suggestions"></div>
          </div>

          <div className="appbar-actions">
            <button className="icon-btn" type="button" aria-label="Notifications">
              <svg className="ic" aria-hidden="true"><use href="#i-bell"></use></svg>
              <span className="pip dot" aria-hidden="true"></span>
            </button>
            <button className="icon-btn" type="button" id="cartBtn" aria-label="Open cart">
              <svg className="ic" aria-hidden="true"><use href="#i-cart"></use></svg>
              <span className="pip hide" id="cartPip">0</span>
            </button>
            <button className="acct-btn" type="button" id="acctBtn" aria-haspopup="menu" aria-expanded="false">
              <span className="avatar">AS</span>
              <svg className="ic" aria-hidden="true"><use href="#i-chev"></use></svg>
            </button>

            <div className="menu" id="acctMenu" role="menu">
              <div className="menu-id">
                <span className="avatar">AS</span>
                <div>
                  <b>Aarthi Subramanian</b>
                  <span>+91 98xxx xx190</span>
                </div>
              </div>
              <hr />
              <a href="#bookings" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-receipt"></use></svg>My bookings</a>
              <a href="#main" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-pin"></use></svg>Saved addresses<span className="tail">Add one</span></a>
              <a href="#main" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-card"></use></svg>Payment methods</a>
              <a href="#care" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-shield"></use></svg>CFC Care plan</a>
              <a href="#refer" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-gift"></use></svg>Refer and earn</a>
              <hr />
              <a href="#help" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-headset"></use></svg>Help centre</a>
              <a href="#main" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-cog"></use></svg>Settings</a>
              <button className="menu-item out" type="button" role="menuitem"><svg className="ic" aria-hidden="true"><use href="#i-logout"></use></svg>Log out</button>
            </div>
          </div>
        </div>

        <div className="mobile-search-row">
          <div className="app-search mobile-row">
            <svg className="ic" aria-hidden="true"><use href="#i-search"></use></svg>
            <input id="askInputM" type="text" autoComplete="off" aria-label="Search for a home service" placeholder="Search for a service" />
            <button className="mic" type="button" id="micBtnM" aria-label="Search by voice">
              <svg className="ic" aria-hidden="true"><use href="#i-mic"></use></svg>
            </button>
          </div>
        </div>
      </header>

      <main id="main">

        {/* Welcome + first-run setup */}
        <section className="welcome">
          <div className="wrap welcome-in">
            <div>
              <h1>Welcome to CFC, Aarthi.</h1>
              <p className="hello">You have not booked anything yet. Add the address we should come to, and the rest takes about a minute.</p>

              <div className="setup">
                <div className="setup-row done">
                  <span className="setup-mark"><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg></span>
                  <div><b>Account created</b><small>Signed in with +91 98xxx xx190</small></div>
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
                <h2>What do you need first?</h2>
                <p>Every job has a fixed price. Add as many as you like and book them in one go.</p>
              </div>
              <a className="sec-link" href="#services">See all 46 services</a>
            </div>
            <div className="cat-grid">
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-clean"></use></svg></span><h3>Home cleaning</h3><p>From &#8377;399</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-plumb"></use></svg></span><h3>Plumbing</h3><p>From &#8377;199</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-elec"></use></svg></span><h3>Electrician</h3><p>From &#8377;199</p></button>
              <button className="cat" type="button"><span className="cat-tag">Popular</span><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-ac"></use></svg></span><h3>AC repair</h3><p>From &#8377;499</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-appliance"></use></svg></span><h3>Appliance repair</h3><p>From &#8377;299</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-pest"></use></svg></span><h3>Pest control</h3><p>From &#8377;899</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-salon"></use></svg></span><h3>Salon for women</h3><p>From &#8377;249</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-paint"></use></svg></span><h3>Painting</h3><p>Free site visit</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-carpenter"></use></svg></span><h3>Carpentry</h3><p>From &#8377;249</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-laundry"></use></svg></span><h3>Laundry</h3><p>From &#8377;79 per kg</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-water"></use></svg></span><h3>Water purifier</h3><p>From &#8377;399</p></button>
              <button className="cat" type="button"><span className="cat-ic"><svg className="ic" aria-hidden="true"><use href="#i-move"></use></svg></span><h3>Packers and movers</h3><p>Free quote</p></button>
            </div>

          </div>
        </section>

        {/* Popular near them */}
        <section className="sec" id="popular" style={{ paddingTop: '0' }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
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
                <article className="bk" data-id="ac" data-name="AC service and gas refill" data-price="499" data-icon="i-ac">
                  <div className="bk-media"><span className="bk-rank">#1 this week</span><svg className="ic" aria-hidden="true"><use href="#i-ac"></use></svg></div>
                  <div className="bk-body">
                    <h3>AC service and gas refill</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.8</span><em></em><span>12.4k bookings</span><em></em><span>60 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;499</b><small>onwards, taxes included</small></div><div className="bk-add"></div></div>
                  </div>
                </article>

                <article className="bk" data-id="deep" data-name="Full home deep cleaning" data-price="2299" data-icon="i-clean">
                  <div className="bk-media"><span className="bk-rank">#2 this week</span><svg className="ic" aria-hidden="true"><use href="#i-clean"></use></svg></div>
                  <div className="bk-body">
                    <h3>Full home deep cleaning</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.9</span><em></em><span>8.1k bookings</span><em></em><span>4 hours</span></div>
                    <div className="bk-foot"><div><b>&#8377;2,299</b><small>2 BHK, 3 cleaners</small></div><div className="bk-add"></div></div>
                  </div>
                </article>

                <article className="bk" data-id="tap" data-name="Tap and mixer repair" data-price="199" data-icon="i-plumb">
                  <div className="bk-media"><span className="bk-rank">#3 this week</span><svg className="ic" aria-hidden="true"><use href="#i-plumb"></use></svg></div>
                  <div className="bk-body">
                    <h3>Tap and mixer repair</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.7</span><em></em><span>6.6k bookings</span><em></em><span>45 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;199</b><small>parts charged at MRP</small></div><div className="bk-add"></div></div>
                  </div>
                </article>

                <article className="bk" data-id="salon" data-name="Salon at home for women" data-price="249" data-icon="i-salon">
                  <div className="bk-media"><span className="bk-rank">#4 this week</span><svg className="ic" aria-hidden="true"><use href="#i-salon"></use></svg></div>
                  <div className="bk-body">
                    <h3>Salon at home for women</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.9</span><em></em><span>5.2k bookings</span><em></em><span>90 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;249</b><small>single use kit, sealed</small></div><div className="bk-add"></div></div>
                  </div>
                </article>

                <article className="bk" data-id="pest" data-name="Cockroach and ant control" data-price="899" data-icon="i-pest">
                  <div className="bk-media"><span className="bk-rank">#5 this week</span><svg className="ic" aria-hidden="true"><use href="#i-pest"></use></svg></div>
                  <div className="bk-body">
                    <h3>Cockroach and ant control</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.7</span><em></em><span>4.4k bookings</span><em></em><span>60 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;899</b><small>child and pet safe gel</small></div><div className="bk-add"></div></div>
                  </div>
                </article>

                <article className="bk" data-id="wash" data-name="Washing machine repair" data-price="299" data-icon="i-appliance">
                  <div className="bk-media"><span className="bk-rank">#6 this week</span><svg className="ic" aria-hidden="true"><use href="#i-appliance"></use></svg></div>
                  <div className="bk-body">
                    <h3>Washing machine repair</h3>
                    <div className="bk-meta"><span className="star"><svg className="ic ic-fill" aria-hidden="true"><use href="#i-star"></use></svg>4.6</span><em></em><span>3.9k bookings</span><em></em><span>60 min</span></div>
                    <div className="bk-foot"><div><b>&#8377;299</b><small>free diagnosis on repair</small></div><div className="bk-add"></div></div>
                  </div>
                </article>
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
                <h2>Your bookings</h2>
                <p>Everything you book lives here, from the slot you picked to the receipt afterwards.</p>
              </div>
            </div>

            <div className="two-col">
              <div className="empty">
                <svg className="empty-art" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                  <rect x="14" y="24" width="92" height="72" rx="12" fill="#fff" stroke="#e3eaf0" strokeWidth="2"/>
                  <rect x="14" y="24" width="92" height="20" rx="12" fill="#e8f7f5"/>
                  <rect x="14" y="36" width="92" height="8" fill="#e8f7f5"/>
                  <path d="M36 20v10M84 20v10" stroke="#0fb3a6" strokeWidth="3.4" strokeLinecap="round"/>
                  <rect x="28" y="56" width="30" height="6" rx="3" fill="#e3eaf0"/>
                  <rect x="28" y="70" width="52" height="6" rx="3" fill="#eef3f7"/>
                  <circle cx="86" cy="84" r="16" fill="#0fb3a6"/>
                  <path d="M86 77v14M79 84h14" stroke="#fff" strokeWidth="3.2" strokeLinecap="round"/>
                </svg>
                <div>
                  <h3>Nothing booked yet</h3>
                  <p>Once you book, this is where you will see who is coming, when they will reach and how far away they are. You can reschedule or cancel from here too.</p>
                  <button className="btn btn-primary" type="button" id="emptyCta">Browse services</button>
                </div>
              </div>

              <aside className="side-card" id="care">
                <span className="ic-box"><svg className="ic" aria-hidden="true"><use href="#i-shield"></use></svg></span>
                <h3>CFC Care, &#8377;2,499 a year</h3>
                <p>Worth it from about four bookings a year.</p>
                <ul>
                  <li><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>3 AC services and 2 plumbing visits</li>
                  <li><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>Unlimited electrical checks</li>
                  <li><svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>Priority slots, even on weekends</li>
                </ul>
                <button className="btn btn-ghost btn-sm" type="button">See what is covered</button>
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
                <button className="btn btn-clear" type="button">1800 XXX 4567</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a className="logo" href="#main">
                <span className="logo-mark"><svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg></span>
                <span className="logo-text">CityFamilyCare<span>CFC</span></span>
              </a>
              <p className="foot-about">Home services for Indian families, delivered by professionals we know by name. Verified, insured and warrantied.</p>
              <div className="foot-apps">
                <a className="app-btn" href="#main"><svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg>iOS app</a>
                <a className="app-btn" href="#main"><svg className="ic" aria-hidden="true"><use href="#i-phone"></use></svg>Android app</a>
              </div>
            </div>
            <div>
              <h4>Services</h4>
              <ul>
                <li><a href="#main">Home cleaning</a></li>
                <li><a href="#main">AC repair and service</a></li>
                <li><a href="#main">Plumbing</a></li>
                <li><a href="#main">Electrician</a></li>
                <li><a href="#main">Pest control</a></li>
                <li><a href="#main">Salon for women</a></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="#main">About CFC</a></li>
                <li><a href="#refer">Refer and earn</a></li>
                <li><a href="#main">CFC Care plans</a></li>
                <li><a href="#main">For apartments</a></li>
                <li><a href="#help">Contact us</a></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><a href="#main">Track a booking</a></li>
                <li><a href="#main">Cancellation policy</a></li>
                <li><a href="#main">Common questions</a></li>
                <li><a href="#main">Warranty and refunds</a></li>
                <li><a href="#main">1800 XXX 4567</a></li>
                <li><a href="#main">care@cityfamilycare.in</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-bar">
            <span>&#169; 2026 CityFamilyCare Services Pvt Ltd</span>
            <div className="links">
              <a href="#main">Privacy</a>
              <a href="#main">Terms</a>
              <a href="#main">Safety</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart */}
      <div className="scrim" id="scrim"></div>
      <aside className="cart" id="cart" aria-label="Your cart" aria-hidden="true">
        <div className="cart-top">
          <div>
            <h3>Your cart</h3>
            <span id="cartCount">Nothing added yet</span>
          </div>
          <button className="icon-btn" type="button" id="cartClose" aria-label="Close cart">
            <svg className="ic" aria-hidden="true"><use href="#i-x"></use></svg>
          </button>
        </div>
        <div className="cart-body" id="cartBody"></div>
        <div className="cart-foot" id="cartFoot" hidden>
          <div className="cart-line"><span>Item total</span><b id="sumItems">&#8377;0</b></div>
          <div className="cart-line save"><span>FIRST20 applied</span><b id="sumDisc">&#8377;0</b></div>
          <div className="cart-line"><span>Visit charge</span><b>Free</b></div>
          <div className="cart-line total"><span>To pay</span><b id="sumTotal">&#8377;0</b></div>
          <button className="btn btn-primary" type="button" id="checkoutBtn">Choose a slot</button>
          <p className="cart-note">You pay after the job is done. UPI, card or cash.</p>
        </div>
      </aside>

      <div className="toast" id="toast" role="status" aria-live="polite">
        <svg className="ic" aria-hidden="true"><use href="#i-check"></use></svg>
        <span id="toastText">Added to cart</span>
      </div>

      <button className="cartbar" type="button" id="cartBar">
        <span className="cartbar-left">
          <svg className="ic" aria-hidden="true"><use href="#i-cart"></use></svg>
          <span><b id="cartBarCount">0 services</b><small id="cartBarTotal">&#8377;0</small></span>
        </span>
        <span className="cartbar-cta">View cart<svg className="ic" aria-hidden="true"><use href="#i-arr-r"></use></svg></span>
      </button>

      <nav className="tabbar" aria-label="Main">
        <button className="tab" type="button" aria-current="page">
          <svg className="ic" aria-hidden="true"><use href="#i-home"></use></svg>Home
        </button>
        <button className="tab" type="button">
          <svg className="ic" aria-hidden="true"><use href="#i-receipt"></use></svg>Bookings
        </button>
        <button className="tab" type="button">
          <svg className="ic" aria-hidden="true"><use href="#i-headset"></use></svg>Help
        </button>
        <button className="tab" type="button">
          <svg className="ic" aria-hidden="true"><use href="#i-user"></use></svg>Account
        </button>
      </nav>

    </>
  );
}
