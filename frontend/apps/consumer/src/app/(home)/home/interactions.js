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
  var rupee = function (v) { return '\u20B9' + Math.round(v).toLocaleString('en-IN'); };
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

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
  on($('addrLocate'), 'click', function () {
    if (addrInput) addrInput.value = '12th Main, 5th Block, Koramangala';
    say('Location found. Check it before saving.');
    if (addrInput) addrInput.focus();
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

  /* ---- search suggestions ---- */
  var SERVICES = [
    { n: 'AC service and gas refill', c: 'AC repair', p: 499, i: 'i-ac', id: 'ac' },
    { n: 'AC installation or uninstall', c: 'AC repair', p: 1200, i: 'i-ac', id: 'acinst' },
    { n: 'Full home deep cleaning', c: 'Home cleaning', p: 2299, i: 'i-clean', id: 'deep' },
    { n: 'Bathroom deep cleaning', c: 'Home cleaning', p: 549, i: 'i-clean', id: 'bath' },
    { n: 'Kitchen and chimney cleaning', c: 'Home cleaning', p: 1199, i: 'i-clean', id: 'kitchen' },
    { n: 'Sofa shampooing', c: 'Home cleaning', p: 899, i: 'i-clean', id: 'sofa' },
    { n: 'Tap and mixer repair', c: 'Plumbing', p: 199, i: 'i-plumb', id: 'tap' },
    { n: 'Leaking pipe or wall seepage', c: 'Plumbing', p: 299, i: 'i-plumb', id: 'leak' },
    { n: 'Blocked drain or toilet', c: 'Plumbing', p: 399, i: 'i-plumb', id: 'drain' },
    { n: 'Fan repair or replacement', c: 'Electrician', p: 199, i: 'i-elec', id: 'fan' },
    { n: 'Switchboard and socket repair', c: 'Electrician', p: 199, i: 'i-elec', id: 'switch' },
    { n: 'Washing machine repair', c: 'Appliance repair', p: 299, i: 'i-appliance', id: 'wash' },
    { n: 'Fridge not cooling', c: 'Appliance repair', p: 349, i: 'i-appliance', id: 'fridge' },
    { n: 'Cockroach and ant control', c: 'Pest control', p: 899, i: 'i-pest', id: 'pest' },
    { n: 'Bed bug treatment', c: 'Pest control', p: 1499, i: 'i-pest', id: 'bedbug' },
    { n: 'Salon at home for women', c: 'Salon', p: 249, i: 'i-salon', id: 'salon' },
    { n: 'Furniture repair', c: 'Carpentry', p: 249, i: 'i-carpenter', id: 'furniture' },
    { n: 'Water purifier service', c: 'Water purifier', p: 399, i: 'i-water', id: 'purifier' }
  ];
  var POPULAR = [0, 2, 6, 9, 15];

  var sug = $('sug');
  var input = $('askInput');
  var shown = [];
  var activeIdx = -1;

  var mark = function (text, q) {
    if (!q) return esc(text);
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  };

  var renderSug = function (q) {
    if (!sug) return;
    var list, label;
    if (!q) {
      list = POPULAR.map(function (i) { return SERVICES[i]; });
      label = 'Booked most often near you';
    } else {
      var needle = q.toLowerCase();
      list = SERVICES.filter(function (sv) {
        return sv.n.toLowerCase().indexOf(needle) > -1 || sv.c.toLowerCase().indexOf(needle) > -1;
      }).slice(0, 6);
      label = list.length + (list.length === 1 ? ' service matches' : ' services match');
    }
    shown = list;
    activeIdx = -1;
    if (!list.length) {
      sug.innerHTML = '<div class="sug-empty"><b>Nothing matches that yet</b>' +
        'Try plainer words, like "fan noise" or "tap leaking", or ask us on chat.</div>';
      return;
    }
    sug.innerHTML = '<div class="sug-label">' + label + '</div>' + list.map(function (sv, idx) {
      return '<button class="sug-item" type="button" role="option" data-idx="' + idx + '">' +
        '<span class="sug-ic"><svg class="ic" aria-hidden="true"><use href="#' + sv.i + '"></use></svg></span>' +
        '<span class="sug-main"><b>' + mark(sv.n, q) + '</b><span>' + esc(sv.c) + '</span></span>' +
        '<span class="sug-price">' + rupee(sv.p) + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(sug.querySelectorAll('.sug-item'), function (el) {
      el.addEventListener('mousedown', function (ev) { ev.preventDefault(); pick(parseInt(el.dataset.idx, 10)); });
    });
  };

  var openSug = function (open) {
    if (!sug) return;
    sug.classList.toggle('open', open);
    if (input) input.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  var setActive = function (i) {
    var items = sug ? sug.querySelectorAll('.sug-item') : [];
    if (!items.length) return;
    activeIdx = (i + items.length) % items.length;
    Array.prototype.forEach.call(items, function (el, idx) { el.classList.toggle('active', idx === activeIdx); });
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  };
  var pick = function (i) {
    var sv = shown[i];
    if (!sv) return;
    add({ id: sv.id, name: sv.n, price: sv.p, icon: sv.i });
    if (input) { input.value = ''; input.blur(); }
    openSug(false);
  };

  if (input) {
    on(input, 'focus', function () { renderSug(input.value.trim()); openSug(true); });
    on(input, 'input', function () { renderSug(input.value.trim()); openSug(true); });
    on(input, 'blur', function () { setTimeout(function () { openSug(false); }, 120); });
    on(input, 'keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === 'Enter' && activeIdx > -1) { e.preventDefault(); pick(activeIdx); }
      else if (e.key === 'Escape') { openSug(false); }
    });
  }

  /* ---- voice ---- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  Array.prototype.forEach.call(document.querySelectorAll('.mic'), function (mic) {
    on(mic, 'click', function () {
      var target = mic.parentNode.querySelector('input');
      if (!SR) {
        mic.classList.add('on');
        setTimeout(function () {
          mic.classList.remove('on');
          if (target) { target.value = 'tap leaking'; target.focus(); target.dispatchEvent(new Event('input')); }
        }, 1800);
        say('Heard: "tap leaking"');
        return;
      }
      try {
        var rec = new SR();
        rec.lang = 'en-IN';
        rec.interimResults = true;
        rec.onstart = function () { mic.classList.add('on'); };
        rec.onresult = function (e) {
          var t = '';
          for (var i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
          if (target) { target.value = t; target.dispatchEvent(new Event('input')); }
        };
        rec.onend = function () { mic.classList.remove('on'); if (target) target.focus(); };
        rec.onerror = function () { mic.classList.remove('on'); };
        rec.start();
      } catch (err) { mic.classList.remove('on'); }
    });
  });

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

