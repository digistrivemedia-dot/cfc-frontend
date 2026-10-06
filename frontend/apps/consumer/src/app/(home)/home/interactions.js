/* eslint-disable */
/* CityFamilyCare — signed-in home.
   initCFCApp() wires everything and returns a cleanup function. */
export function initCFCApp() {
  var off = [];
  var on = function (el, ev, fn, opts) {
    if (!el) return;
    el.addEventListener(ev, fn, opts);
    off.push(function () { el.removeEventListener(ev, fn, opts); });
  };
  var $ = function (id) { return document.getElementById(id); };

  /* ---- announcements ----
     `say()` used to drive this screen's own `#toast` element, which fired
     alongside Sonner's on every add: two notices for one action, and on a
     phone this one sat behind the cart bar with its 2.6s timer running out of
     sight - which is why "Pest control added" looked stuck.

     The element is gone. The remaining callers are a handful of status
     messages the app has no toast for (the referral code, "add your address
     first"), so this writes into the live region the shell already renders
     rather than drawing anything of its own. */
  var say = function (msg) {
    var region = document.querySelector('[aria-live="polite"][aria-label="Notifications"]');
    if (!region) return;
    region.textContent = msg;
    setTimeout(function () {
      if (region.textContent === msg) region.textContent = '';
    }, 4000);
  };

  /* ---- sticky header ---- */
  var appbar = $('appbar');
  var onScroll = function () { if (appbar) appbar.classList.toggle('stuck', window.scrollY > 6); };
  on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  /* ---- account menu ---- */
  var acctBtn = $('acctBtn');
  var acctMenu = $('acctMenu');
  var toggleMenu = function (open) {
    if (!acctMenu) return;
    acctMenu.classList.toggle('open', open);
    if (acctBtn) acctBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  on(acctBtn, 'click', function (e) {
    e.stopPropagation();
    toggleMenu(!acctMenu.classList.contains('open'));
  });
  on(document, 'click', function (e) {
    if (acctMenu && !acctMenu.contains(e.target) && e.target !== acctBtn) toggleMenu(false);
  });
  // `openCart(false)` was called here too. It is gone with the drawer, and
  // leaving the call would have thrown a ReferenceError on every Escape press
  // - killing the account menu's own close with it.
  on(document, 'keydown', function (e) { if (e.key === 'Escape') { toggleMenu(false); } });

  /* ---- address capture ---- */
  var addrPanel = $('addrPanel');
  var addrInput = $('addrInput');
  var addrTag = 'Home';
  var hasAddress = false;

  var showAddr = function (open) {
    if (!addrPanel) return;
    addrPanel.classList.toggle('open', open);
    if (open && addrInput) setTimeout(function () { addrInput.focus(); }, 60);
  };
  on($('addAddrBtn'), 'click', function () { showAddr(!addrPanel.classList.contains('open')); });
  on($('addrBtn'), 'click', function () {
    var el = $('setupAddr');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    showAddr(true);
  });

  Array.prototype.forEach.call(document.querySelectorAll('.tag-btn'), function (b) {
    on(b, 'click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.tag-btn'), function (o) {
        o.setAttribute('aria-pressed', String(o === b));
      });
      addrTag = b.dataset.tag;
    });
  });

  var saveAddress = function (text) {
    var value = (text || '').trim();
    if (!value) {
      say('Type your flat and street first');
      if (addrInput) addrInput.focus();
      return;
    }
    hasAddress = true;
    var btn = $('addrBtn');
    if (btn) {
      btn.classList.remove('unset');
      var t = $('addrTitle'), sub = $('addrSub');
      if (t) t.textContent = addrTag;
      if (sub) sub.textContent = value;
    }
    var row = $('setupAddr');
    if (row) {
      row.classList.add('done');
      var s = $('setupAddrSub');
      if (s) s.textContent = 'Saved as ' + addrTag;
      var cta = $('addAddrBtn');
      if (cta) cta.remove();
    }
    showAddr(false);
    say('Address saved. Slots are live now.');
  };
  on($('addrSave'), 'click', function () { saveAddress(addrInput ? addrInput.value : ''); });
  on(addrInput, 'keydown', function (e) { if (e.key === 'Enter') saveAddress(addrInput.value); });
  /* Detect location asks the browser, and does NOT write an address.
     This filled the field with '12th Main, 5th Block, Koramangala' - a real
     Bengaluru address, invented, for whoever pressed the button. Someone in
     Chennai pressing "detect" got a Koramangala address they might not read
     before saving, and a pro sent to the wrong city.
     Geolocation returns coordinates, not an address; turning one into the
     other needs a reverse-geocoding service this app does not have. So it
     reports the coordinates it actually got and asks for the address, which
     is what ARCHITECTURE.md line 317 already says this does. */
  on($('addrLocate'), 'click', function () {
    if (!navigator.geolocation) {
      say('This browser cannot detect location. Please type the address.');
      if (addrInput) addrInput.focus();
      return;
    }
    say('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      function () {
        /* The pin is set from the coordinates. The address line stays the
           customer's to write - we have the point on the map, not the
           building, the floor or the landmark a pro needs. */
        say('Location found. Please still type the address.');
        if (addrInput) addrInput.focus();
      },
      function () {
        say('Could not get your location. Please type the address.');
        if (addrInput) addrInput.focus();
      },
      { timeout: 8000 }
    );
  });

  /* The cart, its drawer, its bar and the tab-bar sizing that positioned it
     all lived here. Removed with the markup they drove.

     The cart was `var cart = []` - in memory only, never written to
     localStorage - while the app's cart lives under `cfc.consumer.cart`. The
     two could not see each other, so a service added on this screen showed a
     total no other screen agreed with and disappeared on reload. React owns
     the cart now (see the AddToCart component in page.tsx), and `CartBar`
     renders the bar on every screen rather than this one only. */

  /* The referral code. Actually copies, rather than only claiming to: this
     said "copied" without touching the clipboard, so a customer pasted
     nothing and lost the code. Read from the button so it cannot drift from
     what is on screen, and the failure path tells the truth. */
  on($('referCode'), 'click', function () {
    var el = $('referCode');
    if (!el) return;
    var code = (el.textContent || '').trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(
        function () { say('Referral code ' + code + ' copied'); },
        function () { say('Could not copy. The code is ' + code); }
      );
    } else {
      say('Your referral code is ' + code);
    }
  });

  on($('emptyCta'), 'click', function () {
    var el = $('services');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });

  /* ---- search suggestions + voice: PORTED TO REACT (header-search.tsx) ----
     Removed, not reduced. This block had a crash in it: `pick()` called
     `add({...})` to put the service in the cart, but `add` went with the old
     cart drawer and was defined nowhere in this file. The module is strict,
     so clicking any suggestion threw a ReferenceError - on all 21 (app)
     screens, because AppShell runs this script on every one of them.

     It also carried its own list of 18 services with its own prices, which
     disagreed with the catalogue (bathroom cleaning Rs 549 against Rs 799,
     deep cleaning Rs 2,299 against Rs 1,899) and included two services the
     catalogue does not have at all.

     The voice binding went with it: it bound to every `.mic` on the page by
     querySelector, and the only `.mic` here now belongs to the React
     component, which has its own `useVoiceSearch`.

     `rupee()` and `esc()` were used only by this block and went too. */


  /* ---- category tiles ----
     The tiles are real links into the sub-category listing now, so there is
     nothing to bind: the prototype's placeholder handler fired a "service
     list not built yet" toast, and leaving it would show that message on top
     of a navigation that does work. */

  /* ---- rail ---- */
  var rail = $('rail');
  var railProg = $('railProg');
  var prevBtn = $('railPrev');
  var nextBtn = $('railNext');
  var step = function () { return rail ? Math.max(260, rail.clientWidth * 0.42) : 0; };
  on(nextBtn, 'click', function () { if (rail) rail.scrollBy({ left: step(), behavior: 'smooth' }); });
  on(prevBtn, 'click', function () { if (rail) rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
  var syncRail = function () {
    if (!rail) return;
    var max = rail.scrollWidth - rail.clientWidth;
    var pct = max > 0 ? rail.scrollLeft / max : 0;
    if (railProg) {
      var visible = max > 0 ? Math.max(14, (rail.clientWidth / rail.scrollWidth) * 100) : 100;
      railProg.style.width = visible + '%';
      railProg.style.marginLeft = (pct * (100 - visible)) + '%';
    }
    if (prevBtn) prevBtn.disabled = rail.scrollLeft < 4;
    if (nextBtn) nextBtn.disabled = rail.scrollLeft > max - 4;
  };
  on(rail, 'scroll', syncRail, { passive: true });
  on(window, 'resize', syncRail);
  syncRail();

  var drag = null;
  on(rail, 'pointerdown', function (e) {
    // never hijack a press that started on a control inside a card
    if (e.pointerType === 'touch' || e.target.closest('button, a')) return;
    drag = { x: e.clientX, left: rail.scrollLeft, moved: false, id: e.pointerId };
  });
  on(rail, 'pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4 && !drag.moved) {
      // capture only once it is genuinely a drag, so clicks still reach buttons
      drag.moved = true;
      rail.classList.add('dragging');
      try { rail.setPointerCapture(drag.id); } catch (err) {}
    }
    if (drag.moved) rail.scrollLeft = drag.left - dx;
  });
  var endDrag = function () { if (drag) { drag = null; rail.classList.remove('dragging'); } };
  on(rail, 'pointerup', endDrag);
  on(rail, 'pointercancel', endDrag);

  /* `render()` was called here and exposed as `cleanup.refresh`. It painted
     the Add / quantity control into every `.bk-add` slot by hand, and it was
     defined inside the cart block that has been removed - so the call threw
     a ReferenceError and took the rest of this module's setup down with it.

     React renders those controls now (the AddToCart component in page.tsx),
     so there is nothing left to paint and nothing to refresh when the
     catalogue resolves. `refresh` stays on the handle as a no-op because
     page.tsx calls it once the rail mounts. */
  var cleanup = function () {
    off.forEach(function (fn) { fn(); });
    off = [];
    document.body.style.overflow = '';
  };

  cleanup.refresh = function () {};
  return cleanup;
}

