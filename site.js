/* ============================================================
   directedbyhao.com — behaviour
   Plain JavaScript, no build step, loaded at the end of <body>.

   Each effect is one function, started from the list at the bottom of
   this block. To remove an effect, delete its line from that list. There
   are no on/off switches. Three motions do all the work: the font
   flicker (the name, on load and every so often after), the photo slide
   (the hero), and the reel (Films, Travel, the place viewer). Everything
   else arrives with one fade-and-settle owned by the stylesheet.

   Everything here is optional: without scripts the page still reads top
   to bottom, and no effect can trap the visitor — the curtain has a time
   limit, and reduced-motion settings turn every animation into its
   settled state.
   ============================================================ */
(function () {
  'use strict';

  // Pages cannot send frame-ancestors, and a frame may not navigate its
  // parent, so a framed copy hides itself instead.
  if (window.top !== window.self) { document.documentElement.hidden = true; return; }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the font flicker ----------
     EDIT ME: the faces a title cycles through, in order, before it
     settles on the site font. `googleFontsFamily` is the family= value
     for fonts.googleapis.com; null means index.html already loads it. */
  var FLICKER_FACES = [
    { family: 'Anton',            weight: 400, googleFontsFamily: 'Anton' },
    { family: 'Playfair Display', weight: 500, googleFontsFamily: 'Playfair+Display:wght@500' },
    { family: 'Unbounded',        weight: 500, googleFontsFamily: 'Unbounded:wght@500' },
    { family: 'Instrument Serif', weight: 400, googleFontsFamily: 'Instrument+Serif' },
    { family: 'Bebas Neue',       weight: 400, googleFontsFamily: 'Bebas+Neue' },
    { family: 'DM Mono',          weight: 400, googleFontsFamily: null }
  ];
  var FLICKER_STEPS = 12;
  var FLICKER_FIRST_MS = 60;    // gap between the first two faces
  var FLICKER_LAST_MS = 250;    // gap before the final landing
  var FLICKER_EVERY_MS = 15000; // how often the name flickers again while the hero is on screen

  var FONT_WAIT_CAP_MS = 2500;  // a stalled font download must not hold the curtain
  var SLIDE_MS = 5000;          // how long each hero photo stays
  var CYCLE_MS = 3500;          // how long each item holds in a Films or Travel reel

  /* ---------- footer year ---------- */

  function fillCopyrightYear() {
    document.querySelectorAll('.year').forEach(function (slot) {
      slot.textContent = new Date().getFullYear();
    });
  }

  /* ---------- photo slides: the hero ---------- */

  // Every SLIDE_MS the active frame moves off to the left and the next
  // arrives from the right. The stylesheet owns the motion; once it has
  // finished, the old frame is parked back on the right without animating.
  // One frame means nothing moves.
  function slidePhotos() {
    var frames = document.querySelectorAll('.hero-slides .slide');
    if (frames.length < 2) return;
    var activeIndex = 0;
    setInterval(function () {
      var leaving = frames[activeIndex];
      activeIndex = (activeIndex + 1) % frames.length;
      var entering = frames[activeIndex];
      leaving.classList.remove('is-active');
      leaving.classList.add('is-leaving');
      entering.classList.add('is-active');
      var moveMs = parseFloat(getComputedStyle(leaving).transitionDuration) * 1000 || 0;
      setTimeout(function () {
        leaving.style.transition = 'none';
        leaving.classList.remove('is-leaving');
        void leaving.offsetWidth;          // apply the jump before re-enabling motion
        leaving.style.transition = '';
      }, moveMs);
    }, SLIDE_MS);
  }

  // The footer shows the hero's first photo, held still. Copying it at
  // load keeps the hero markup the only place hero photos are listed.
  function mirrorFirstPhotoIntoFooter() {
    var first = document.querySelector('.hero-slides .slide');
    var footerSlides = document.querySelector('.footer-slides');
    if (!first || !footerSlides) return;
    var copy = first.cloneNode();
    copy.className = 'slide is-active';
    footerSlides.appendChild(copy);
  }

  function make(tag, className) {
    var node = document.createElement(tag);
    node.className = className;
    return node;
  }

  /* ---------- backdrop: the current picture, blurred, behind a screen ----------
     Two layers take turns so one fades in as the other fades out. */

  function makeBackdrop(host) {
    var backdrop = make('div', 'backdrop');
    var layers = [make('img', ''), make('img', '')];
    layers.forEach(function (layer) { layer.alt = ''; backdrop.appendChild(layer); });
    var front = 0;
    host.insertBefore(backdrop, host.firstChild);
    return {
      show: function (src) {
        if (layers[front].getAttribute('src') === src) return;
        front = 1 - front;
        layers[front].src = src;
        layers[front].classList.add('is-in');
        layers[1 - front].classList.remove('is-in');
      },
      remove: function () { backdrop.remove(); }
    };
  }

  /* ---------- the reel: Films, Travel and the place viewer ----------
     `root` holds a .reel-items list: one <li> per item with an
     <a class="clip"> or an <img>, then an optional .reel-title, .reel-when
     and .reel-line. The strip, arrows and caption are built in front of
     the list, which is then hidden; the current item's image goes into
     `host` as a blurred backdrop. The current item is centred with its
     neighbours peeking in from the sides; clicking a neighbour goes to
     it, clicking the current clip opens it; ← → step while focus is inside
     `host`. With `auto` the reel advances every CYCLE_MS and pauses while
     hovered; it opens on item `start`. Everything re-centres as images load
     and on resize. */

  function buildReel(root, host, auto, start) {
    function arrow(className, label, glyph) {
      var button = make('button', 'reel-arrow ' + className);
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.textContent = glyph;
      return button;
    }

    var list = root.querySelector('.reel-items');
    var entries = Array.prototype.slice.call(list.querySelectorAll(':scope > li'));
    if (!entries.length) return null;

    var backdrop = makeBackdrop(host);

    var stage = make('div', 'reel-stage');
    var strip = make('div', 'reel-strip');
    stage.appendChild(strip);
    var items = entries.map(function (entry, i) {
      var item = make('div', 'reel-item');
      item.appendChild(entry.firstElementChild.cloneNode(true));
      item.addEventListener('click', function (event) {
        if (item.classList.contains('is-active')) return;
        event.preventDefault();
        go(i);
      });
      strip.appendChild(item);
      return item;
    });
    var prev = arrow('reel-prev', 'Previous', '‹');
    var next = arrow('reel-next', 'Next', '›');
    stage.appendChild(prev); stage.appendChild(next);

    var caption = make('div', 'reel-caption');
    var text = make('div', 'reel-text');
    var side = make('div', 'reel-side');
    var count = make('span', 'reel-count mono');
    side.appendChild(count);
    var all = root.querySelector('.reel-all');
    if (all) side.appendChild(all);
    caption.appendChild(text); caption.appendChild(side);
    root.insertBefore(stage, list);
    root.insertBefore(caption, list);

    var index = 0, timer = null;

    function place() {
      var item = items[index];
      strip.style.transform = 'translateX(' + (-(item.offsetLeft + item.offsetWidth / 2)).toFixed(1) + 'px)';
      stage.style.setProperty('--edge', (item.offsetWidth / 2).toFixed(1) + 'px');
    }
    function show(i) {
      index = i;
      items.forEach(function (item, k) { item.classList.toggle('is-active', k === i); });
      place();
      text.replaceChildren();
      ['.reel-title', '.reel-when', '.reel-line'].forEach(function (selector) {
        var node = entries[i].querySelector(selector);
        if (node) text.appendChild(node.cloneNode(true));
      });
      count.textContent = (i + 1) + ' / ' + items.length;
      backdrop.show(entries[i].querySelector('img').src);
    }
    function stop() { clearInterval(timer); timer = null; }
    function startTimer() {
      stop();
      if (!auto || reducedMotion || items.length < 2) return;
      timer = setInterval(function () { show((index + 1) % items.length); }, CYCLE_MS);
    }
    function go(i) {
      show((i + items.length) % items.length);
      startTimer();
    }
    function onKey(event) {
      if (event.key === 'ArrowLeft') go(index - 1);
      if (event.key === 'ArrowRight') go(index + 1);
    }
    function destroy() {
      stop();
      window.removeEventListener('resize', place);
      host.removeEventListener('keydown', onKey);
      backdrop.remove();
    }

    prev.addEventListener('click', function () { go(index - 1); });
    next.addEventListener('click', function () { go(index + 1); });
    stage.addEventListener('pointerenter', stop);
    stage.addEventListener('pointerleave', startTimer);
    host.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    strip.querySelectorAll('img').forEach(function (img) { img.addEventListener('load', place); });

    prev.hidden = next.hidden = items.length < 2;
    root.classList.add('is-live');
    show(start || 0);
    startTimer();
    return { destroy: destroy };
  }

  function buildReels() {
    document.querySelectorAll('.screen .reel').forEach(function (reel) {
      buildReel(reel, reel.closest('.screen'), true);
    });
  }

  /* ---------- About: the map ----------
     The map image is the Robinson projection of the whole world, centred
     on 10°E (Wikimedia's BlankMap-World; measured from its straight
     borders at 49°N, 22°N, 25°E, 20°E and 141°E). A latitude and
     longitude convert to a position on it with the standard Robinson
     table. The result is a fraction of the image's width and height,
     which keeps pins in place at any display size. */

  var MAP_CENTRAL_MERIDIAN = 10;
  var ROBINSON_HEIGHT_TO_WIDTH = 1218 / 2400;   // the full map; the image may be cropped shorter (it is, above Antarctica)

  var ROBINSON_LENGTH = [1.0000, 0.9986, 0.9954, 0.9900, 0.9822, 0.9730, 0.9600, 0.9427, 0.9216,
                         0.8962, 0.8679, 0.8350, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.4958];
  var ROBINSON_HEIGHT = [0.0000, 0.0620, 0.1240, 0.1860, 0.2480, 0.3100, 0.3720, 0.4340, 0.4958,
                         0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1.0000];

  function robinsonPoint(latitude, longitude) {
    var north = Math.abs(latitude);
    var row = Math.min(Math.floor(north / 5), 17);
    var between = (north - row * 5) / 5;
    var length = ROBINSON_LENGTH[row] + (ROBINSON_LENGTH[row + 1] - ROBINSON_LENGTH[row]) * between;
    var height = ROBINSON_HEIGHT[row] + (ROBINSON_HEIGHT[row + 1] - ROBINSON_HEIGHT[row]) * between;
    var east = longitude - MAP_CENTRAL_MERIDIAN;
    if (east < -180) east += 360;          // the far Pacific wraps to the right edge
    return {
      x: 0.5 + (east / 180) * 0.5 * length,
      y: 0.5 - (latitude < 0 ? -height : height) * 0.5
    };
  }

  /* ---------- full-screen dialogs: the place viewer and the résumé ----------
     `open` shows the dialog and moves focus to its ×; `close` hides it
     after the fade and returns focus to whatever opened it. The ×, a click
     on the empty backdrop, or Esc close it; Tab stays inside while open. */

  function makeDialog(viewer, onHidden) {
    var box = viewer.querySelector('.viewer-box');
    var openedFrom = null;

    function open(from) {
      openedFrom = from;
      viewer.hidden = false;
      requestAnimationFrame(function () { viewer.classList.add('is-open'); });
      document.body.classList.add('modal-lock');
      viewer.querySelector('.viewer-close').focus();
    }
    function close() {
      viewer.classList.remove('is-open');
      document.body.classList.remove('modal-lock');
      setTimeout(function () {
        viewer.hidden = true;
        if (onHidden) onHidden();
        openedFrom.focus();
      }, 250);
    }

    viewer.querySelector('.viewer-close').addEventListener('click', close);
    viewer.addEventListener('click', function (event) {
      if (event.target === viewer || event.target === box) close();
    });
    document.addEventListener('keydown', function (event) {
      if (viewer.hidden) return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key !== 'Tab') return;
      var stops = Array.prototype.filter.call(
        box.querySelectorAll('button, a[href]'),
        function (el) { return el.offsetParent !== null; }
      );
      var first = stops[0], last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    return { open: open, close: close };
  }

  /* ---------- the media viewer: items in the full-screen reel ----------
     `items` are <li> nodes in the reel's item format; the reel opens on
     `start`, and `from` gets focus back when the viewer closes. */

  function makeMediaViewer(viewer) {
    var viewerName = viewer.querySelector('.viewer-name');
    var reelRoot = viewer.querySelector('.viewer-reel');
    var reel = null;
    var dialog = makeDialog(viewer, function () {
      if (reel) reel.destroy();
      reel = null;
    });
    return function open(name, items, start, from) {
      viewerName.textContent = name;
      var list = make('ul', 'reel-items');
      items.forEach(function (item) { list.appendChild(item.cloneNode(true)); });
      reelRoot.replaceChildren(list);
      viewer.hidden = false;                 // laid out before the reel measures itself
      reel = buildReel(reelRoot, viewer, false, start);
      dialog.open(from);
    };
  }

  // One viewer serves the map pins and the About timeline.
  var mediaViewer = document.getElementById('place-viewer') ? makeMediaViewer(document.getElementById('place-viewer')) : null;

  // The Résumé button opens the PDF in a dialog; without scripts it is a
  // plain link to the file.
  function openResumeOnClick() {
    var viewer = document.getElementById('resume-viewer');
    if (!viewer) return;
    var dialog = makeDialog(viewer);
    document.querySelectorAll('[data-resume-open]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        dialog.open(link);
      });
    });
  }

  // Reads the <li class="place"> list and draws a pin per place. Clicking a
  // pin opens the viewer — the place's media in a reel that fills the screen.
  function buildAtlas() {
    var atlas = document.querySelector('.atlas');
    if (!atlas || !mediaViewer) return;
    var places = atlas.querySelectorAll('.place');
    var pinLayer = atlas.querySelector('.atlas-pins');
    var hint = atlas.querySelector('.atlas-hint');
    if (!places.length || !pinLayer) return;
    var pins = [];

    function openViewer(place, pin) {
      pins.forEach(function (other) { other.classList.toggle('is-active', other === pin); });
      var media = Array.prototype.slice.call(place.querySelectorAll('.place-media > li'));
      mediaViewer(place.querySelector('.place-name').textContent, media, 0, pin);
    }

    // Labels are measured on screen, so pins are laid out again when the
    // window changes size.
    // How much of `a` is covered by `b`, with a little breathing room.
    function overlap(a, b) {
      var pad = 4;
      var w = Math.min(a.right, b.right) - Math.max(a.left, b.left) + pad;
      var h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) + pad;
      return w > 0 && h > 0 ? w * h : 0;
    }
    // Each label tries eight sides and keeps the first that covers no dot
    // and no label already placed — or, in a crowd, the one covering least.
    var LABEL_SIDES = ['top', 'bottom', 'right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'];
    function placeLabels() {
      var taken = pins.map(function (pin) { return pin.querySelector('.pin-dot').getBoundingClientRect(); });
      pins.forEach(function (pin) {
        var label = pin.querySelector('.pin-name');
        var best = null, least = Infinity;
        for (var k = 0; k < LABEL_SIDES.length && least > 0; k++) {
          label.dataset.side = LABEL_SIDES[k];
          var rect = label.getBoundingClientRect();
          var covered = taken.reduce(function (sum, other) { return sum + overlap(rect, other); }, 0);
          if (covered < least) { least = covered; best = LABEL_SIDES[k]; }
        }
        label.dataset.side = best;
        taken.push(label.getBoundingClientRect());
      });
    }
    function layoutPins() {
      var activePin = pins.filter(function (pin) { return pin.classList.contains('is-active'); })[0];
      var activeName = activePin ? activePin.getAttribute('aria-label') : null;
      pinLayer.replaceChildren();
      pins = [];
      var points = Array.prototype.map.call(places, function (place) {
        return robinsonPoint(parseFloat(place.dataset.lat), parseFloat(place.dataset.lon));
      });
      // Positions are fractions of the full map; the image's own width and
      // height say how much of it is there.
      var world = atlas.querySelector('.atlas-world');
      var yStretch = ROBINSON_HEIGHT_TO_WIDTH / (world.getAttribute('height') / world.getAttribute('width'));

      places.forEach(function (place, index) {
        var name = place.querySelector('.place-name').textContent;
        var pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'pin';
        pin.style.left = (points[index].x * 100).toFixed(2) + '%';
        pin.style.top = (points[index].y * yStretch * 100).toFixed(2) + '%';
        pin.style.setProperty('--i', index);           // the stagger when the map arrives
        pin.setAttribute('aria-label', name);
        var dot = make('span', 'pin-dot');
        var label = make('span', 'pin-name');
        label.dataset.side = 'top';
        label.textContent = name;
        pin.appendChild(dot); pin.appendChild(label);
        if (name === activeName) pin.classList.add('is-active');
        pinLayer.appendChild(pin);
        pins.push(pin);
      });
      placeLabels();
    }

    layoutPins();

    // Neighbouring cities overlap their 44px targets, so the pin whose dot
    // is nearest the pointer is the one meant: it rises to the top as the
    // pointer moves, and a click on any pin opens it. A keyboard click
    // (detail 0) has no pointer and opens the focused pin.
    function nearestPin(x, y) {
      var nearest = null;
      var nearestDistance = Infinity;
      pins.forEach(function (pin) {
        var dot = pin.querySelector('.pin-dot').getBoundingClientRect();
        var distance = Math.hypot(dot.left + dot.width / 2 - x, dot.top + dot.height / 2 - y);
        if (distance < nearestDistance) { nearest = pin; nearestDistance = distance; }
      });
      return nearest;
    }
    pinLayer.addEventListener('pointermove', function (event) {
      var nearest = nearestPin(event.clientX, event.clientY);
      pins.forEach(function (pin) { pin.classList.toggle('is-near', pin === nearest); });
    });
    pinLayer.addEventListener('click', function (event) {
      var clicked = event.target.closest('.pin');
      if (!clicked) return;
      var pin = event.detail === 0 ? clicked : nearestPin(event.clientX, event.clientY);
      openViewer(places[pins.indexOf(pin)], pin);
    });

    var relayoutTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(relayoutTimer);
      relayoutTimer = setTimeout(layoutPins, 150);
    });

    hint.textContent = places.length + (places.length === 1 ? ' place' : ' places') + ' · click a pin';
    atlas.classList.add('is-live');
  }

  // On a pointer device the map drifts a few pixels toward the cursor, so
  // the screen answers movement before a pin is touched. Never on touch.
  function driftMapWithPointer() {
    var screen = document.querySelector('.screen--map');
    var map = screen && screen.querySelector('.atlas-map');
    if (!map || reducedMotion || window.matchMedia('(hover: none)').matches) return;
    var DRIFT_PX = 14;
    screen.addEventListener('pointermove', function (event) {
      var box = screen.getBoundingClientRect();
      var dx = (event.clientX - box.left) / box.width - 0.5;
      var dy = (event.clientY - box.top) / box.height - 0.5;
      map.style.transform = 'translate3d(' + (dx * DRIFT_PX).toFixed(1) + 'px,' + (dy * DRIFT_PX).toFixed(1) + 'px,0)';
    });
    screen.addEventListener('pointerleave', function () { map.style.transform = ''; });
  }

  /* ---------- About: the editor's timeline ----------
     The photos in .timeline-clips, oldest first, as clips on one track
     under a ruler of months. A playhead scrubs across the track as the section scrolls
     through the viewport; the clip under it is the current one — bright,
     named above the playhead, and filling the screen behind as a blurred
     backdrop. Hovering a clip pulls the playhead to it; clicking opens the
     photos full screen at that clip. Clip lengths repeat a short pattern so
     the track reads as an edit, not a grid. */

  var CUT_LENGTHS = [3, 4, 2, 3, 3, 4, 2, 3, 3, 4];

  function dateOf(item) {
    var when = item.querySelector('.reel-when');
    return when ? Date.parse(when.textContent.split('·')[0]) : NaN;
  }

  function buildTimeline() {
    var section = document.getElementById('about');
    var timeline = section && section.querySelector('.timeline');
    var clips = timeline && timeline.querySelectorAll('.timeline-clips > li');
    if (!clips || !clips.length || !mediaViewer) return;

    var items = Array.prototype.slice.call(clips).sort(function (a, b) {
      var da = dateOf(a), db = dateOf(b);
      return (isNaN(da) ? Infinity : da) - (isNaN(db) ? Infinity : db) || 0;
    });
    var backdrop = makeBackdrop(section);
    var ruler = make('div', 'timeline-ruler');
    var track = make('div', 'timeline-track');
    var head = make('div', 'timeline-head');
    var now = make('p', 'timeline-now mono');
    timeline.appendChild(ruler); timeline.appendChild(track); timeline.appendChild(head); timeline.appendChild(now);

    var total = items.reduce(function (sum, _, i) { return sum + CUT_LENGTHS[i % CUT_LENGTHS.length]; }, 0);
    var starts = [];                        // each clip's left edge as a fraction of the track
    var edge = 0, lastMonth = '';
    var cuts = items.map(function (item, i) {
      var length = CUT_LENGTHS[i % CUT_LENGTHS.length];
      var title = item.querySelector('.reel-title').textContent;
      starts.push(edge / total);

      var tick = make('span', 'timeline-tick');
      tick.style.left = (edge / total * 100).toFixed(2) + '%';
      var stamp = dateOf(item);
      var month = isNaN(stamp) ? '' : new Date(stamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (month !== lastMonth) { tick.textContent = month; lastMonth = month; }
      ruler.appendChild(tick);

      var cut = make('button', 'timeline-cut');
      cut.type = 'button';
      cut.style.flexGrow = length;
      cut.style.setProperty('--i', i);
      cut.setAttribute('aria-label', title);
      var picture = item.querySelector('img').cloneNode();
      picture.removeAttribute('loading');
      picture.alt = '';
      cut.appendChild(picture);
      var name = make('span', 'timeline-name mono');
      name.textContent = title;
      cut.appendChild(name);
      cut.addEventListener('pointerenter', function () { scrubTo(starts[i] + length / total / 2); });
      cut.addEventListener('click', function () { mediaViewer('Travel', items, i, cut); });
      track.appendChild(cut);
      edge += length;
      return cut;
    });
    starts.push(1);

    var current = -1;
    function scrubTo(x) {
      head.style.left = (x * 100).toFixed(2) + '%';
      now.style.left = (Math.min(Math.max(x, 0.12), 0.88) * 100).toFixed(2) + '%';
      var i = 0;
      while (i + 1 < items.length && starts[i + 1] <= x) i++;
      if (i === current) return;
      current = i;
      cuts.forEach(function (cut, k) { cut.classList.toggle('is-current', k === i); });
      now.textContent = items[i].querySelector('.reel-title').textContent + ' · ' + items[i].querySelector('.reel-when').textContent;
      backdrop.show(items[i].querySelector('img').src);
    }
    // The playhead crosses the whole track while the section crosses the
    // viewport, sitting mid-track when the section is centred.
    function follow() {
      var box = section.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      var progress = (window.innerHeight - box.top) / (window.innerHeight + box.height);
      scrubTo(Math.min(0.999, Math.max(0, (progress - 0.15) / 0.7)));
    }
    // A month label that would run into the one before it is hidden.
    function spaceLabels() {
      var lastRight = -Infinity;
      Array.prototype.forEach.call(ruler.children, function (tick) {
        if (!tick.textContent) return;
        tick.classList.remove('is-crowded');
        var box = tick.getBoundingClientRect();
        if (box.left < lastRight + 8) { tick.classList.add('is-crowded'); return; }
        lastRight = box.right;
      });
    }
    window.addEventListener('scroll', follow, { passive: true });
    window.addEventListener('resize', function () { follow(); spaceLabels(); });
    track.addEventListener('pointerleave', follow);
    timeline.classList.add('is-live');
    follow();
    spaceLabels();
  }

  // About: the copy scrolls with the page while Hao sits on a slower plane
  // behind it. The figure's mask fades out above its bottom edge, so the
  // move never exposes a cut edge.
  function driftAboutOnScroll() {
    var section = document.getElementById('about');
    var figure = section && section.querySelector('.about-figure');
    if (!figure || reducedMotion) return;
    var DRIFT_PX = 60;
    function place() {
      var box = section.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      // 0 as the section enters from below, 1 as it leaves above; 0.5 is centred
      var progress = (window.innerHeight - box.top) / (window.innerHeight + box.height);
      figure.style.transform = 'translateY(' + ((0.5 - progress) * 2 * DRIFT_PX).toFixed(1) + 'px)';
    }
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    place();
  }

  /* ---------- arrivals: blocks lift in, titles settle in ---------- */

  function whenFirstSeen(elements, threshold, callback) {
    if (!elements.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        callback(entry.target);
      });
    }, { threshold: threshold });
    elements.forEach(function (element) { observer.observe(element); });
  }

  function revealOnArrival() {
    var blocks = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (reducedMotion) { blocks.forEach(function (block) { block.classList.add('is-in'); }); return; }
    whenFirstSeen(blocks, 0.15, function (block) { block.classList.add('is-in'); });
  }

  /* ---------- header: underline the section on screen ---------- */

  function underlineCurrentSection() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs a[href^="#"]'));
    if (!tabs.length) return;
    var sections = tabs.map(function (tab) { return document.querySelector(tab.getAttribute('href')); }).filter(Boolean);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tabs.forEach(function (tab) {
          if (tab.getAttribute('href') === '#' + entry.target.id) tab.setAttribute('aria-current', 'true');
          else tab.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });   // the section crossing the middle of the viewport
    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------- header bar: solid at the top, translucent once scrolled ---------- */

  function dimHeaderOnScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var queued = false;
    function update() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }, { passive: true });
    update();
  }

  /* ---------- curtain, then the name's font flicker, then the hero goes live ---------- */

  function loadFlickerFonts() {
    var queries = FLICKER_FACES.filter(function (face) { return face.googleFontsFamily; })
                               .map(function (face) { return 'family=' + face.googleFontsFamily; });
    if (queries.length) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?' + queries.join('&') + '&display=swap';
      document.head.appendChild(link);
    }
    // Declaring a face does not download it; asking for it does.
    var loads = FLICKER_FACES.map(function (face) {
      return document.fonts.load(face.weight + ' 100px "' + face.family + '"').catch(function () {});
    });
    return Promise.all([document.fonts.ready].concat(loads));
  }

  // Fades the curtain (0.4s in the stylesheet) and removes it once faded.
  function liftCurtain(curtain) {
    if (!curtain) return;
    curtain.classList.add('is-lifted');
    setTimeout(function () {
      if (curtain.parentNode) curtain.parentNode.removeChild(curtain);
    }, 450);
  }

  // Cycles an element's text through FLICKER_FACES with gaps that widen
  // from FLICKER_FIRST_MS to FLICKER_LAST_MS, then clears the inline style
  // so the stylesheet's display face takes over.
  function flickerName(heading) {
    return new Promise(function (resolve) {
      var step = 0;
      function next() {
        if (step >= FLICKER_STEPS) {
          heading.style.fontFamily = '';
          heading.style.fontWeight = '';
          resolve();
          return;
        }
        var face = FLICKER_FACES[step % FLICKER_FACES.length];
        heading.style.fontFamily = '"' + face.family + '"';
        heading.style.fontWeight = face.weight;
        var eased = Math.pow(step / (FLICKER_STEPS - 1), 2);
        var gap = FLICKER_FIRST_MS + (FLICKER_LAST_MS - FLICKER_FIRST_MS) * eased;
        step += 1;
        setTimeout(next, gap);
      }
      next();
    });
  }

  function revealHero() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var heading = hero.querySelector('.headline-text');
    var curtain = document.getElementById('curtain');
    // Whatever the font machinery does — resolve, reject, or throw — the
    // curtain lifts: the wait is a chain that always settles, raced against
    // a time limit.
    var fontsReady = Promise.resolve().then(loadFlickerFonts).catch(function () {});
    var timeLimit = new Promise(function (resolve) { setTimeout(resolve, FONT_WAIT_CAP_MS); });
    Promise.race([fontsReady, timeLimit])
      .then(function () {
        liftCurtain(curtain);
        if (reducedMotion || !heading) return null;
        return flickerName(heading);
      })
      .then(function () {
        hero.classList.add('is-live');
        if (reducedMotion || !heading) return;
        // Now and then the name flickers again — only while the name itself
        // is on screen below the bar, so it never runs unseen.
        var bar = document.querySelector('.site-header');
        setInterval(function () {
          var box = heading.getBoundingClientRect();
          var top = bar ? bar.offsetHeight : 0;
          if (document.hidden || box.bottom <= top || box.top >= window.innerHeight) return;
          flickerName(heading);
        }, FLICKER_EVERY_MS);
      });
  }

  /* ---------- start everything ----------
     revealHero goes first so nothing that follows can hold the curtain. */

  revealHero();
  fillCopyrightYear();
  mirrorFirstPhotoIntoFooter();
  slidePhotos();
  buildReels();
  buildAtlas();
  buildTimeline();
  openResumeOnClick();
  driftMapWithPointer();
  driftAboutOnScroll();
  revealOnArrival();
  underlineCurrentSection();
  dimHeaderOnScroll();
})();

/* ============================================================
   CONTACT MODAL — behaviour
   Unchanged from the original. The guard is outside the block, the block
   is intact.
   ============================================================ */
if (document.getElementById('contact-modal'))

  (function () {
    // Formspree relays each submission to the address configured on the
    // form's account, so changing where mail lands is done there, not here.
    var ENDPOINT = "https://formspree.io/f/moeqrdyp"; // EDIT ME

    var modal   = document.getElementById('contact-modal');
    var box     = modal.querySelector('.modal-box');
    var head    = document.getElementById('contact-modal-head');
    var form    = document.getElementById('contact-form');
    var success = document.getElementById('contact-success');
    var submit  = document.getElementById('cf-submit');
    var closeButton = modal.querySelector('.modal-close');
    var formError = document.getElementById('cf-error');
    var lastFocused = null;

    // A send holds the modal open so the request cannot be orphaned midway.
    // The timeout is what guarantees that hold always ends: without it a
    // stalled network would trap the visitor in a box they cannot dismiss.
    var SEND_TIMEOUT_MS = 15000;
    var AUTO_CLOSE_MS = 2500;
    var sending = false;
    var autoClose = null;

    /* ---------- open / close ---------- */

    function openModal(event) {
      event.preventDefault();
      lastFocused = document.activeElement;
      modal.hidden = false;
      // The transition only runs if the browser paints the closed state first.
      requestAnimationFrame(function () { modal.classList.add('is-open'); });
      document.body.classList.add('modal-lock');
      document.getElementById('cf-name').focus();
    }

    function closeModal() {
      if (sending) return;
      clearTimeout(autoClose);
      modal.classList.remove('is-open');
      document.body.classList.remove('modal-lock');
      // Stays in the layout until the fade-out finishes, then resets so the
      // next open starts from the empty form rather than the success panel.
      setTimeout(function () {
        modal.hidden = true;
        head.hidden = false;
        form.hidden = false;
        success.hidden = true;
        box.setAttribute('aria-labelledby', 'contact-modal-title');
        form.reset();
        clearErrors();
        setSending(false);
        if (lastFocused) lastFocused.focus();
      }, 200);
    }

    document.querySelectorAll('[data-contact-open]').forEach(function (el) {
      el.addEventListener('click', openModal);
    });
    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    /* ---------- keyboard: Esc closes, Tab stays inside ---------- */

    document.addEventListener('keydown', function (event) {
      if (modal.hidden) return;

      if (event.key === 'Escape') {
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;

      var stops = Array.prototype.filter.call(
        box.querySelectorAll('button, input, select, textarea, a[href]'),
        function (el) { return el.offsetParent !== null && !el.disabled; }
      );
      if (!stops.length) return;

      var first = stops[0];
      var last  = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* ---------- validation ---------- */

    var CHECKED = ['cf-name', 'cf-email', 'cf-message'];

    function showError(id, message) {
      document.getElementById(id).setAttribute('aria-invalid', 'true');
      document.getElementById(id + '-error').textContent = message;
    }

    function clearErrors() {
      formError.textContent = '';
      CHECKED.forEach(function (id) {
        document.getElementById(id).removeAttribute('aria-invalid');
        document.getElementById(id + '-error').textContent = '';
      });
    }

    function validate(entry) {
      clearErrors();
      if (!entry.name) {
        showError('cf-name', 'Please add your name.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
        showError('cf-email', 'That email doesn\u2019t look right.');
      }
      if (entry.message.length < 10) {
        showError('cf-message', 'A sentence or two, please.');
      }
      var firstBad = box.querySelector('[aria-invalid]');
      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    /* ---------- send ---------- */

    function setSending(value) {
      sending = value;
      submit.disabled = value;
      submit.textContent = value ? 'Sending\u2026' : 'Send message';
      closeButton.disabled = value;
    }

    function showSuccess() {
      head.hidden = true;
      form.hidden = true;
      success.hidden = false;
      box.setAttribute('aria-labelledby', 'contact-success-title');
      // Release the hold before scheduling the close, or closeModal bails.
      setSending(false);
      success.querySelector('button').focus();
      autoClose = setTimeout(closeModal, AUTO_CLOSE_MS);
    }

    function showFailure() {
      // Nothing was delivered, so keep the typed message on screen and
      // point at the email link already sitting below the button.
      setSending(false);
      formError.textContent =
        'That didn\u2019t go through. Please try again, or use the email link below.';
      submit.focus();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var entry = {
        name:    document.getElementById('cf-name').value.trim(),
        email:   document.getElementById('cf-email').value.trim(),
        topic:   document.getElementById('cf-topic').value,
        message: document.getElementById('cf-message').value.trim()
      };
      if (!validate(entry)) return;

      entry._subject = entry.topic + ' \u2014 ' + entry.name;
      entry._gotcha  = form.querySelector('.hp').value;

      setSending(true);

      var abort = new AbortController();
      var expiry = setTimeout(function () { abort.abort(); }, SEND_TIMEOUT_MS);

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        signal: abort.signal,
        // Lets the request finish even if the visitor closes the tab first.
        keepalive: true
      })
        .then(function (response) {
          clearTimeout(expiry);
          if (!response.ok) throw new Error(response.status);
          showSuccess();
        })
        .catch(function () {
          clearTimeout(expiry);
          showFailure();
        });
    });
  })();
  