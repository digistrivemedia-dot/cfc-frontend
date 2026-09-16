/* eslint-disable */
/* CityFamilyCare — home page interactions.
   initCFC() wires everything up and returns a cleanup function,
   so the same file works in plain HTML and inside a React effect. */
export function initCFC() {
  var off = [];
  var on = function (el, ev, fn, opts) {
    if (!el) return;
    el.addEventListener(ev, fn, opts);
    off.push(function () { el.removeEventListener(ev, fn, opts); });
  };
  var $ = function (id) { return document.getElementById(id); };

  /* ---- header shadow + mobile action bar ---- */
  var hdr = $('hdr');
  var mbar = $('mbar');
  var onScroll = function () {
    var y = window.scrollY;
    if (hdr) hdr.classList.toggle('stuck', y > 8);
    if (mbar) mbar.classList.toggle('show', y > 520);
  };
  on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  var sheet = $('sheet');
  var burger = $('burger');
  var setSheet = function (open) {
    if (!sheet) return;
    sheet.classList.toggle('open', open);
    sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  on(burger, 'click', function () { setSheet(true); });
  on($('sheetClose'), 'click', function () { setSheet(false); });
  if (sheet) {
    Array.prototype.forEach.call(sheet.querySelectorAll('a, .btn'), function (el) {
      on(el, 'click', function () { setSheet(false); });
    });
  }
  on(document, 'keydown', function (e) { if (e.key === 'Escape') setSheet(false); });

  /* ---- reveal on scroll (used on two sections only) ---- */
  var io = null;
  var targets = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
  } else {
    Array.prototype.forEach.call(targets, function (t) { t.classList.add('in'); });
  }

  /* ---- most booked rail ---- */
  var rail = $('rail');
  var step = function () { return rail ? Math.max(260, rail.clientWidth * 0.42) : 0; };
  on($('railNext'), 'click', function () { if (rail) rail.scrollBy({ left: step(), behavior: 'smooth' }); });
  on($('railPrev'), 'click', function () { if (rail) rail.scrollBy({ left: -step(), behavior: 'smooth' }); });

  /* ---- seamless testimonial marquee ---- */
  var track = $('track');
  if (track && !track.dataset.cloned) {
    track.dataset.cloned = '1';
    var kids = Array.prototype.slice.call(track.children);
    kids.forEach(function (k) {
      var c = k.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
  }

  /* ---- search: chips fill the box ---- */
  var input = $('askInput');
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    on(chip, 'click', function () {
      if (!input) return;
      input.value = chip.textContent;
      input.focus();
    });
  });

  /* ---- voice search ---- */
  var micBtn = $('micBtn');
  var askBar = $('askBar');
  var status = $('askStatus');
  var statusText = $('askStatusText');
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null;
  var listening = false;
  var demoTimers = [];

  var setListening = function (state, message) {
    listening = state;
    if (micBtn) micBtn.classList.toggle('on', state);
    if (askBar) askBar.classList.toggle('listening', state);
    if (status) status.classList.toggle('show', state || !!message);
    if (statusText && message) statusText.textContent = message;
  };

  var stopDemo = function () { demoTimers.forEach(clearTimeout); demoTimers = []; };

  var runDemo = function () {
    stopDemo();
    setListening(true, 'Listening. Try saying "my tap is leaking"');
    demoTimers.push(setTimeout(function () {
      setListening(true, 'Heard: "my tap is leaking"');
    }, 2200));
    demoTimers.push(setTimeout(function () {
      if (input) input.value = 'Tap and mixer repair';
      setListening(false, 'Found 3 plumbing services near you');
      if (status) status.classList.add('show');
    }, 3400));
    demoTimers.push(setTimeout(function () {
      if (status) status.classList.remove('show');
    }, 6400));
  };

  on(micBtn, 'click', function () {
    if (listening) {
      if (rec) { try { rec.stop(); } catch (e) {} }
      stopDemo();
      setListening(false);
      return;
    }
    if (!SR) { runDemo(); return; }
    try {
      rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = true;
      rec.continuous = false;
      rec.onstart = function () { setListening(true, 'Listening. Say the problem in your own words'); };
      rec.onresult = function (e) {
        var text = '';
        for (var i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
        if (input) input.value = text;
        if (statusText) statusText.textContent = 'Heard: ' + text;
      };
      rec.onerror = function () { setListening(false, ''); runDemo(); };
      rec.onend = function () { setListening(false); };
      rec.start();
    } catch (err) { runDemo(); }
  });

  var locBtn = $('locBtn');

  /* ---- service catalogue powering the suggestion list ---- */
  var SERVICES = [
    { n: 'AC service and gas refill', c: 'AC repair', p: 499, i: 'i-ac' },
    { n: 'AC installation or uninstall', c: 'AC repair', p: 1200, i: 'i-ac' },
    { n: 'AC not cooling', c: 'AC repair', p: 499, i: 'i-ac' },
    { n: 'Full home deep cleaning', c: 'Home cleaning', p: 2299, i: 'i-clean' },
    { n: 'Bathroom deep cleaning', c: 'Home cleaning', p: 549, i: 'i-clean' },
    { n: 'Kitchen and chimney cleaning', c: 'Home cleaning', p: 1199, i: 'i-clean' },
    { n: 'Sofa shampooing', c: 'Home cleaning', p: 899, i: 'i-clean' },
    { n: 'Tap and mixer repair', c: 'Plumbing', p: 199, i: 'i-plumb' },
    { n: 'Leaking pipe or wall seepage', c: 'Plumbing', p: 299, i: 'i-plumb' },
    { n: 'Blocked drain or toilet', c: 'Plumbing', p: 399, i: 'i-plumb' },
    { n: 'Fan repair or replacement', c: 'Electrician', p: 199, i: 'i-elec' },
    { n: 'Switchboard and socket repair', c: 'Electrician', p: 199, i: 'i-elec' },
    { n: 'Inverter or stabiliser check', c: 'Electrician', p: 349, i: 'i-elec' },
    { n: 'Washing machine repair', c: 'Appliance repair', p: 299, i: 'i-appliance' },
    { n: 'Fridge not cooling', c: 'Appliance repair', p: 349, i: 'i-appliance' },
    { n: 'Microwave repair', c: 'Appliance repair', p: 299, i: 'i-appliance' },
    { n: 'Cockroach and ant control', c: 'Pest control', p: 899, i: 'i-pest' },
    { n: 'Bed bug treatment', c: 'Pest control', p: 1499, i: 'i-pest' },
    { n: 'Salon at home for women', c: 'Salon', p: 249, i: 'i-salon' },
    { n: 'Waxing and threading', c: 'Salon', p: 349, i: 'i-salon' },
    { n: 'Wall painting site visit', c: 'Painting', p: 0, i: 'i-paint' },
    { n: 'Furniture repair', c: 'Carpentry', p: 249, i: 'i-carpenter' },
    { n: 'Door lock or hinge fix', c: 'Carpentry', p: 249, i: 'i-carpenter' },
    { n: 'Wash and fold laundry', c: 'Laundry', p: 79, i: 'i-laundry' },
    { n: 'Water purifier service', c: 'Water purifier', p: 399, i: 'i-water' },
    { n: 'House shifting quote', c: 'Packers and movers', p: 0, i: 'i-move' }
  ];
  var POPULAR = [0, 3, 7, 10, 18];

  var sug = $('sug');
  var askBarEl = $('askBar');
  var activeIdx = -1;
  var shown = [];

  var rupee = function (v) {
    if (!v) return 'Free visit';
    return '\u20B9' + v.toLocaleString('en-IN');
  };
  var esc = function (t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
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
        'Try a plainer description, like "fan noise" or "tap leaking". ' +
        'Our team can also take it on call at 1800 XXX 4567.</div>';
      return;
    }
    sug.innerHTML = '<div class="sug-label">' + label + '</div>' +
      list.map(function (sv, idx) {
        return '<button class="sug-item" type="button" role="option" data-idx="' + idx + '">' +
          '<span class="sug-ic"><svg class="ic" aria-hidden="true"><use href="#' + sv.i + '"></use></svg></span>' +
          '<span class="sug-main"><b>' + mark(sv.n, q) + '</b><span>' + esc(sv.c) + '</span></span>' +
          '<span class="sug-price">' + rupee(sv.p) + '</span>' +
        '</button>';
      }).join('');

    Array.prototype.forEach.call(sug.querySelectorAll('.sug-item'), function (el) {
      el.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        pickSug(parseInt(el.dataset.idx, 10));
      });
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
    Array.prototype.forEach.call(items, function (el, idx) {
      el.classList.toggle('active', idx === activeIdx);
    });
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  };

  var pickSug = function (i) {
    var sv = shown[i];
    if (!sv || !input) return;
    input.value = sv.n;
    openSug(false);
    input.focus();
  };

  if (input) {
    on(input, 'focus', function () { renderSug(input.value.trim()); openSug(true); });
    on(input, 'input', function () { renderSug(input.value.trim()); openSug(true); });
    on(input, 'blur', function () { setTimeout(function () { openSug(false); }, 120); });
    on(input, 'keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === 'Enter') { if (activeIdx > -1) { e.preventDefault(); pickSug(activeIdx); } }
      else if (e.key === 'Escape') { openSug(false); }
    });
  }
  on($('askGo'), 'click', function () { if (input) input.focus(); });

  /* ---- city picker ---- */
  var CITIES = ['Bengaluru', 'Chennai', 'Hyderabad', 'Coimbatore', 'Madurai',
                'Kochi', 'Mysuru', 'Trichy', 'Salem', 'Vijayawada', 'Mangaluru'];
  var locPop = $('locPop');
  var locList = $('locList');
  var current = 'Bengaluru';

  var paintCities = function () {
    if (!locList) return;
    locList.innerHTML = CITIES.map(function (c) {
      return '<button class="loc-opt" type="button" role="option" aria-selected="' +
        (c === current) + '">' + c +
        '<svg class="ic" aria-hidden="true"><use href="#i-check"></use></svg></button>';
    }).join('');
    Array.prototype.forEach.call(locList.querySelectorAll('.loc-opt'), function (el) {
      el.addEventListener('click', function () {
        current = el.firstChild.textContent.trim();
        var label = locBtn && locBtn.querySelector('.loc-city');
        if (label) label.textContent = current;
        Array.prototype.forEach.call(document.querySelectorAll('[data-city]'), function (n) {
          n.textContent = current;
        });
        paintCities();
        toggleLoc(false);
      });
    });
  };
  var toggleLoc = function (open) {
    if (!locPop) return;
    locPop.classList.toggle('open', open);
    if (locBtn) locBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  paintCities();
  on(locBtn, 'click', function (e) {
    e.stopPropagation();
    toggleLoc(!(locPop && locPop.classList.contains('open')));
  });
  on($('locDetect'), 'click', function () { toggleLoc(false); });
  on(document, 'click', function (e) {
    if (locPop && !locPop.contains(e.target) && e.target !== locBtn) toggleLoc(false);
  });

  /* ---- counters ---- */
  var animateCount = function (el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || '0', 10);
    var sep = el.dataset.sep === '1';
    var pre = el.dataset.prefix || '';
    var suf = el.dataset.suffix || '';
    var dur = 1100;
    var t0 = null;
    var frame = function (t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      var v = target * eased;
      var out = dec ? v.toFixed(dec) : Math.round(v).toString();
      if (sep) out = Number(out).toLocaleString('en-IN');
      el.textContent = pre + out + suf;
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  var counters = document.querySelectorAll('[data-count]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cio = null;
  if ('IntersectionObserver' in window && !reduce) {
    cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (c) { cio.observe(c); });
  }

  /* ---- the hero card runs the booking it is describing ---- */
  var etaValue = $('etaValue');
  var etaLabel = $('etaLabel');
  var proCap = $('proCap');
  var proSteps = $('proSteps');
  var liveTimers = [];
  var stopLive = function () { liveTimers.forEach(clearTimeout); liveTimers = []; };

  var runLive = function () {
    if (!etaValue || reduce) return;
    stopLive();
    var mins = 32;
    var tick = function () {
      if (document.hidden) { liveTimers.push(setTimeout(tick, 2000)); return; }
      mins -= 1;
      if (mins > 27) {
        etaValue.textContent = mins + ' min';
        liveTimers.push(setTimeout(tick, 2000));
      } else {
        etaLabel.textContent = 'Rajesh is at your door';
        etaValue.textContent = 'Arrived';
        if (proSteps) {
          Array.prototype.forEach.call(proSteps.children, function (b) {
            b.className = 'done';
          });
        }
        if (proCap) proCap.textContent = 'Work started at 10:34 AM. Pay by UPI when it is done.';
        liveTimers.push(setTimeout(function () {
          mins = 32;
          etaLabel.textContent = 'On the way to your address';
          etaValue.textContent = '32 min';
          if (proSteps) {
            var cls = ['done', 'done', 'now', ''];
            Array.prototype.forEach.call(proSteps.children, function (b, idx) { b.className = cls[idx]; });
          }
          if (proCap) proCap.textContent = 'Assigned. Arriving in uniform with a CFC ID card.';
          liveTimers.push(setTimeout(tick, 2600));
        }, 5200));
      }
    };
    liveTimers.push(setTimeout(tick, 3000));
  };
  runLive();

  /* ---- rail progress, drag to scroll, arrow states ---- */
  var railProg = $('railProg');
  var prevBtn = $('railPrev');
  var nextBtn = $('railNext');
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
  var endDrag = function () {
    if (!drag) return;
    drag = null;
    rail.classList.remove('dragging');
  };
  on(rail, 'pointerup', endDrag);
  on(rail, 'pointercancel', endDrag);

  /* ---- keep focus inside the mobile sheet while it is open ---- */
  on(sheet, 'keydown', function (e) {
    if (e.key !== 'Tab' || !sheet.classList.contains('open')) return;
    var f = sheet.querySelectorAll('a, button');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---- cleanup ---- */
  return function cleanup() {
    off.forEach(function (fn) { fn(); });
    off = [];
    stopDemo();
    stopLive();
    if (io) io.disconnect();
    if (cio) cio.disconnect();
    if (rec) { try { rec.abort(); } catch (e) {} }
    document.body.style.overflow = '';
  };
}

