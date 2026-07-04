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
