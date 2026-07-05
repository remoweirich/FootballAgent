/* ============================================================
   ui-helpers.js — presentation-only enhancements, zero coupling
   to the router or the screen modules. Watches #app with a
   MutationObserver, so every re-render is picked up automatically.

   1. .tab-bar scroll affordance: toggles .can-scroll-l / .can-scroll-r
      (edge fades, see components.css) and centres the .is-active tab,
      so overflowing tab strips read as scrollable, not cut off.
   2. Keeps --app-bar-h in sync with the real sticky-bar height, so
      .standings th and .tab-bar--sticky pin exactly under the header.
   3. Toggles .is-scrolled on .app-bar / .push-bar once content has
      scrolled underneath (shows the hairline shadow).
   4. Swipe left/right anywhere on a screen to step to the next/previous
      .tab in whatever .tab-bar it contains — works on every tabbed
      screen (client detail, leagues, scouting, …) with no per-screen
      wiring, since it only ever simulates a click on the neighbouring
      .tab button and lets that screen's own click handler do the rest.

   Load AFTER shim.js and BEFORE the screen modules in index.html.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Tab bar: fades + active-tab centring ---------- */

  function updateFades(bar) {
    var max = bar.scrollWidth - bar.clientWidth;
    if (max <= 4) { // nothing to scroll
      bar.classList.remove('can-scroll-l', 'can-scroll-r');
      return;
    }
    bar.classList.toggle('can-scroll-l', bar.scrollLeft > 4);
    bar.classList.toggle('can-scroll-r', bar.scrollLeft < max - 4);
  }

  function centreActive(bar, smooth) {
    var active = bar.querySelector('.tab.is-active, .is-active');
    if (!active) return;
    var target = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
    target = Math.max(0, Math.min(target, bar.scrollWidth - bar.clientWidth));
    if (smooth && !reduceMotion && bar.scrollTo) {
      bar.scrollTo({ left: target, behavior: 'smooth' });
    } else {
      bar.scrollLeft = target;
    }
  }

  function enhanceTabBar(bar) {
    if (bar.__uiEnhanced) { updateFades(bar); return; }
    bar.__uiEnhanced = true;
    bar.addEventListener('scroll', function () { updateFades(bar); }, { passive: true });
    // first paint: jump (not smooth) so the active tab is simply "there"
    centreActive(bar, false);
    updateFades(bar);
  }

  // Tapping a tab: bring it towards the centre so the neighbours peek in.
  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.tab');
    if (!tab) return;
    var bar = tab.closest('.tab-bar');
    if (!bar) return;
    // let the router flip .is-active first, then centre
    requestAnimationFrame(function () { centreActive(bar, true); updateFades(bar); });
  });

  /* ---------- 2. Exact sticky offset (--app-bar-h) ---------- */

  function syncBarHeight() {
    var bar = document.querySelector('.app-bar, .push-bar');
    if (bar && bar.offsetHeight) {
      document.documentElement.style.setProperty('--app-bar-h', bar.offsetHeight + 'px');
    }
  }

  /* ---------- 3. Scrolled-header hairline ---------- */

  function enhanceScreen(screen) {
    if (screen.__uiEnhanced) return;
    screen.__uiEnhanced = true;
    screen.addEventListener('scroll', function () {
      var bar = screen.querySelector('.app-bar, .push-bar');
      if (bar) bar.classList.toggle('is-scrolled', screen.scrollTop > 4);
    }, { passive: true });
    wireTabSwipe(screen);
  }

  /* ---------- 4. Swipe left/right between tabs ---------- */

  // A drag starting inside something that already scrolls sideways (the tab strip
  // itself, a wide table, a chip row) should scroll that thing, not flip the page's
  // tab — walk up from the touch target looking for one before treating this as a
  // tab-swipe.
  function startsInHorizontalScroller(target, screen) {
    var node = target;
    while (node && node !== screen) {
      if (node.classList && (node.classList.contains('tab-bar') || node.classList.contains('chip-row'))) return true;
      if (node.scrollWidth > node.clientWidth + 2) {
        var cs = window.getComputedStyle(node);
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function stepTab(screen, dir) {
    var bar = screen.querySelector('.tab-bar');
    if (!bar) return;
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('.tab'));
    var i = tabs.findIndex(function (t) { return t.classList.contains('is-active'); });
    if (i === -1) return;
    var next = tabs[i + dir];
    if (next) next.click();
  }

  function wireTabSwipe(screen) {
    var sx = 0, sy = 0, tracking = false, decided = false, horizontal = false;
    screen.addEventListener('pointerdown', function (e) {
      // touch/pen only: a mouse-drag starting on a link or selectable text kicks off
      // the browser's native drag-link/select-text gesture instead of a plain drag,
      // which breaks a simple start/end threshold check. Real devices only ever swipe
      // with a finger, so there's nothing lost by leaving mouse-drag alone here.
      if (e.pointerType === 'mouse') return;
      if (startsInHorizontalScroller(e.target, screen)) return;
      tracking = true; decided = false; horizontal = false;
      sx = e.clientX; sy = e.clientY;
    }, { passive: true });
    // A real finger drag is rarely dead straight — if the very first few pixels have
    // any vertical component, the browser's native vertical scroll (the screen's own
    // overflow-y) can commit to handling the whole gesture before a plain pointerup
    // threshold check ever runs, so the "swipe" silently does nothing. Deciding the
    // direction early on a small move and calling preventDefault() the moment it looks
    // horizontal is what actually stops that — which needs a non-passive listener,
    // since a passive one can't preventDefault at all.
    screen.addEventListener('pointermove', function (e) {
      if (!tracking) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided = true;
        horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
        if (!horizontal) { tracking = false; return; } // let native vertical scroll proceed
      }
      if (horizontal && e.cancelable) e.preventDefault();
    }, { passive: false });
    screen.addEventListener('pointerup', function (e) {
      if (!tracking) return;
      tracking = false;
      if (!horizontal) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 40) stepTab(screen, dx < 0 ? 1 : -1);
    }, { passive: true });
    screen.addEventListener('pointercancel', function () { tracking = false; }, { passive: true });
  }

  /* ---------- Wiring: rescan on every render ---------- */

  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches) {
      if (root.matches('.tab-bar')) enhanceTabBar(root);
      if (root.matches('.screen')) enhanceScreen(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('.tab-bar').forEach(enhanceTabBar);
      root.querySelectorAll('.screen').forEach(enhanceScreen);
    }
    syncBarHeight();
  }

  function init() {
    var app = document.getElementById('app') || document.body;
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        mutations[i].addedNodes.forEach(scan);
      }
    }).observe(app, { childList: true, subtree: true });
    scan(app);
  }

  window.addEventListener('resize', function () {
    document.querySelectorAll('.tab-bar').forEach(updateFades);
    syncBarHeight();
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
