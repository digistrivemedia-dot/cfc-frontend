"use client";

/**
 * The CFC icon sprite.
 *
 * Every `<use href="#i-...">` in the approved markup resolves against these
 * symbols. It used to be declared inline on each of the two home pages, which
 * meant any OTHER screen rendering that markup got blank icons - the symbols
 * simply were not in the document.
 *
 * Rendered once per page by the shared shell. It draws nothing itself.
 */
export function CfcSprite() {
  return (
    // The size guard is inline, not from home-pages.css. That rule is
    // `.cfc-page .sprite`, and this renders OUTSIDE the .cfc-page wrapper so
    // the chrome styles cannot leak onto page content - which left the sprite
    // unstyled and occupying a full-size block at the top of every screen.
    <svg
      className="sprite"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
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
  );
}
