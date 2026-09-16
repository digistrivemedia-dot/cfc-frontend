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

  /* ---- toast ---- */
  var toast = $('toast');
  var toastText = $('toastText');
  var toastTimer = null;
  var say = function (msg) {
    if (!toast) return;
    if (toastText) toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
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
  on(document, 'keydown', function (e) { if (e.key === 'Escape') { toggleMenu(false); openCart(false); } });

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

  /* ---- cart ---- */
  var cart = [];
  var cartEl = $('cart');
  var scrim = $('scrim');
  var cartBody = $('cartBody');
  var cartFoot = $('cartFoot');

  var openCart = function (open) {
    if (!cartEl) return;
    cartEl.classList.toggle('open', open);
    if (scrim) scrim.classList.toggle('open', open);
    cartEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  on($('cartBtn'), 'click', function () { openCart(true); });
  on($('cartBar'), 'click', function () { openCart(true); });
  on($('cartClose'), 'click', function () { openCart(false); });
  on(scrim, 'click', function () { openCart(false); });

  var find = function (id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  };
  var count = function () {
    return cart.reduce(function (a, b) { return a + b.qty; }, 0);
  };
  var subtotal = function () {
    return cart.reduce(function (a, b) { return a + b.price * b.qty; }, 0);
  };
  var discount = function () {
    return Math.min(300, Math.round(subtotal() * 0.2));
  };

  var add = function (item) {
    var found = find(item.id);
    if (found) found.qty += 1;
    else cart.push({ id: item.id, name: item.name, price: item.price, icon: item.icon, qty: 1 });
    render();
    say(item.name + ' added');
  };
  var bump = function (id, delta) {
    var found = find(id);
    if (!found) return;
    found.qty += delta;
    if (found.qty < 1) cart = cart.filter(function (c) { return c.id !== id; });
    render();
  };

  var renderCartBody = function () {
    if (!cartBody) return;
    if (!cart.length) {
      cartBody.innerHTML = '<div class="cart-empty">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-cart"></use></svg>' +
        '<b>Your cart is empty</b>' +
        '<p>Add a service and it waits here. You can book several in one visit.</p></div>';
      if (cartFoot) cartFoot.hidden = true;
      return;
    }
    cartBody.innerHTML = cart.map(function (c) {
      return '<div class="cart-item">' +
        '<span class="sug-ic"><svg class="ic" aria-hidden="true"><use href="#' + c.icon + '"></use></svg></span>' +
        '<div class="ci-main"><b>' + esc(c.name) + '</b><small>' + rupee(c.price) + ' each</small>' +
        '<div class="ci-row">' +
        '<span class="qty" data-id="' + c.id + '">' +
        '<button type="button" data-act="dec" aria-label="Remove one ' + esc(c.name) + '">' +
        (c.qty > 1
          ? '<svg class="ic" aria-hidden="true"><use href="#i-minus"></use></svg>'
          : '<svg class="ic" aria-hidden="true"><use href="#i-trash"></use></svg>') +
        '</button><b>' + c.qty + '</b>' +
        '<button type="button" data-act="inc" aria-label="Add one ' + esc(c.name) + '">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-plus"></use></svg></button></span>' +
        '<b>' + rupee(c.price * c.qty) + '</b>' +
        '</div></div></div>';
    }).join('');

    Array.prototype.forEach.call(cartBody.querySelectorAll('.qty button'), function (b) {
      b.addEventListener('click', function () {
        bump(b.parentNode.dataset.id, b.dataset.act === 'inc' ? 1 : -1);
      });
    });
    if (cartFoot) cartFoot.hidden = false;
  };

  var renderRailButtons = function () {
    Array.prototype.forEach.call(document.querySelectorAll('.bk'), function (card) {
      var slot = card.querySelector('.bk-add');
      if (!slot) return;
      var id = card.dataset.id;
      var found = find(id);
      if (!found) {
        slot.innerHTML = '<button class="btn btn-ghost btn-sm" type="button" data-act="add">Add</button>';
      } else {
        slot.innerHTML = '<span class="qty">' +
          '<button type="button" data-act="dec" aria-label="Remove one">' +
          (found.qty > 1
            ? '<svg class="ic" aria-hidden="true"><use href="#i-minus"></use></svg>'
            : '<svg class="ic" aria-hidden="true"><use href="#i-trash"></use></svg>') +
          '</button><b>' + found.qty + '</b>' +
          '<button type="button" data-act="inc" aria-label="Add one">' +
          '<svg class="ic" aria-hidden="true"><use href="#i-plus"></use></svg></button></span>';
      }
      Array.prototype.forEach.call(slot.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var act = b.dataset.act;
          if (act === 'add' || act === 'inc') {
            if (act === 'add') {
              add({ id: id, name: card.dataset.name, price: Number(card.dataset.price), icon: card.dataset.icon });
            } else { bump(id, 1); }
          } else { bump(id, -1); }
        });
      });
    });
  };

  var render = function () {
    var n = count();
    var pip = $('cartPip');
    if (pip) { pip.textContent = n; pip.classList.toggle('hide', n === 0); }

    var label = $('cartCount');
    if (label) label.textContent = n ? (n + (n === 1 ? ' service added' : ' services added')) : 'Nothing added yet';

    var bar = $('cartBar');
    if (bar) {
      bar.classList.toggle('show', n > 0);
      var bc = $('cartBarCount'), bt = $('cartBarTotal');
      if (bc) bc.textContent = n + (n === 1 ? ' service' : ' services');
      if (bt) bt.textContent = rupee(subtotal() - discount()) + ' after FIRST20';
    }

    var si = $('sumItems'), sd = $('sumDisc'), st = $('sumTotal');
    if (si) si.textContent = rupee(subtotal());
    if (sd) sd.textContent = '\u2212 ' + rupee(discount());
    if (st) st.textContent = rupee(subtotal() - discount());

    var bookRow = $('setupBook');
    if (bookRow) {
      var sub = $('setupBookSub');
      if (n > 0 && sub) sub.textContent = n + (n === 1 ? ' service in your cart' : ' services in your cart') + '. Pick a slot to finish.';
      else if (sub) sub.textContent = 'FIRST20 comes off at checkout';
    }

    renderCartBody();
    renderRailButtons();
  };

  on($('checkoutBtn'), 'click', function () {
    if (!hasAddress) {
      openCart(false);
      say('Add your address first, then pick a slot');
      var el = $('setupAddr');
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      showAddr(true);
      return;
    }
    say('Next: slot picker. Not built yet.');
  });

  on($('emptyCta'), 'click', function () {
    var el = $('services');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });

  /* Actually copy, rather than only claiming to. This said "copied" without
     ever touching the clipboard, so a customer pasted nothing and lost the
     code. The code is read from the button itself, so it cannot drift from
     what is on screen. clipboard.writeText needs a secure context and can be
     refused, so the failure path tells the truth instead of lying twice. */
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

  /* ---- tab bar height drives where the cart bar sits ---- */
  var sizeTabbar = function () {
    var tb = document.querySelector('.tabbar');
    var h = tb && getComputedStyle(tb).display !== 'none' ? tb.offsetHeight : 0;
    document.documentElement.style.setProperty('--tabbar-h', h + 'px');
    document.body.style.paddingBottom = h ? (h + 64) + 'px' : '';
  };
  on(window, 'resize', sizeTabbar);
  sizeTabbar();

  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
    on(t, 'click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (o) {
        o.removeAttribute('aria-current');
      });
      t.setAttribute('aria-current', 'page');
    });
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

  render();

  var cleanup = function () {
    off.forEach(function (fn) { fn(); });
    off = [];
    clearTimeout(toastTimer);
    document.body.style.overflow = '';
    document.body.style.paddingBottom = '';
  };

  /* The rail is rendered from the catalogue, which resolves after this runs.
     `render()` is what paints the Add / quantity control into every `.bk-add`
     slot, so without a second call after the cards mount the whole rail would
     show prices with no way to add anything. Exposed rather than re-derived:
     it reparses `.bk` from the DOM and is safe to call any number of times. */
  cleanup.refresh = render;
  return cleanup;
}

