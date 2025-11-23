/*!
 * longpress-nav.js
 * Reusable long-press navigation helper.
 *
 * Features:
 * - Exposes window.makeLongPressNav(elementOrId, options)
 * - Auto-attaches to elements with data-longpress-url on DOMContentLoaded
 * - Falls back to element with id="advanceBtn" when no data attributes found
 * - Minimal CSS injection for the SVG progress ring overlay
 * - Pointer event handling (pointerdown/move/up/cancel) and keyboard hold (Space/Enter)
 * - Small vibration feedback when available
 * - Returns an API object for cancel/destroy/setHoldDuration
 *
 * Installation:
 * 1) Save this file as /js/longpress-nav.js in your site repo.
 * 2) Include it on pages that need the behavior:
 *      <script src="/CUseeme/js/longpress-nav.js"></script>
 * 3) Add data-longpress-url="https://example.com" to any existing button to auto-attach:
 *      <button id="advanceBtn" data-longpress-url="https://...">Hold to advance</button>
 *    Or call from JS:
 *      makeLongPressNav('advanceBtn', { url: 'https://...', holdDuration: 800 });
 */

(function globalLongPressNav(){
  if (window.makeLongPressNav) return; // already loaded

  // Inject minimal styles for the ring overlay (isolated)
  const STYLE_ID = 'longpress-nav-styles';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.lp-ring { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; border-radius:inherit; }
.lp-ring svg { width:36px; height:36px; transform:rotate(-90deg); display:block; }
.long-press-active { transition: box-shadow .12s ease, transform .12s ease !important; }
`;
    document.head.appendChild(style);
  }

  function ensureEl(el) {
    if (!el) return null;
    if (typeof el === 'string') return document.getElementById(el);
    return el instanceof Element ? el : null;
  }

  function createRingOverlay(size = 36, stroke = 3, color = 'rgba(0,208,255,1)') {
    const container = document.createElement('div');
    container.className = 'lp-ring';
    container.style.pointerEvents = 'none';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));

    const r = 44;
    const circumference = 2 * Math.PI * (r / 2);

    const bg = document.createElementNS(svgNS, 'circle');
    bg.setAttribute('cx', '50'); bg.setAttribute('cy', '50'); bg.setAttribute('r', String(r / 2));
    bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    bg.setAttribute('stroke-width', String(stroke));
    svg.appendChild(bg);

    const prog = document.createElementNS(svgNS, 'circle');
    prog.setAttribute('cx', '50'); prog.setAttribute('cy', '50'); prog.setAttribute('r', String(r / 2));
    prog.setAttribute('fill', 'none'); prog.setAttribute('stroke', color);
    prog.setAttribute('stroke-width', String(Math.max(2, stroke - 1)));
    prog.setAttribute('stroke-linecap', 'round');
    prog.setAttribute('stroke-dasharray', String(circumference));
    prog.setAttribute('stroke-dashoffset', String(circumference));
    prog.style.transition = 'stroke-dashoffset .06s linear';
    svg.appendChild(prog);

    container.appendChild(svg);

    return {
      container,
      setProgress: function (t) {
        t = Math.max(0, Math.min(1, t));
        const offset = circumference * (1 - t);
        prog.setAttribute('stroke-dashoffset', String(offset));
      }
    };
  }

  function makeLongPressNav(buttonOrId, options) {
    const el = ensureEl(buttonOrId);
    if (!el) throw new Error('makeLongPressNav: target element not found');

    if (el._longPressNav) return el._longPressNav; // already wrapped

    const opts = Object.assign({
      url: (typeof window.nextPage === 'string') ? window.nextPage : '',
      callback: null,
      holdDuration: 800,
      moveTolerance: 12,
      vibrate: true,
      ring: true,
      ringColor: 'rgba(0,208,255,1)'
    }, options || {});

    // ensure element has non-static position so overlay fits
    const comp = window.getComputedStyle(el);
    if (comp.position === 'static' || !comp.position) el.style.position = 'relative';

    // create ring overlay only if requested
    let ring = null;
    if (opts.ring) {
      ring = createRingOverlay(36, 3, opts.ringColor);
      el.appendChild(ring.container);
    }

    // accessibility defaults
    el.setAttribute('role', el.getAttribute('role') || 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');

    let pointerId = null;
    let startX = 0, startY = 0;
    let startT = 0;
    let raf = null;
    let canceled = false;
    let triggered = false;

    function vibrate(ms) {
      if (opts.vibrate && navigator.vibrate) navigator.vibrate(ms || 8);
    }
    function setProgress(t) {
      if (ring) ring.setProgress(t);
    }

    function startHold(px, py, id) {
      if (pointerId !== null) return;
      pointerId = id;
      startX = px; startY = py;
      startT = performance.now();
      canceled = false;
      triggered = false;
      el.classList && el.classList.add('long-press-active');
      el.setAttribute('aria-pressed', 'true');
      vibrate(8);
      tick();
    }

    function cancelHold() {
      if (pointerId === null && !raf) return;
      pointerId = null;
      canceled = true;
      el.classList && el.classList.remove('long-press-active');
      el.setAttribute('aria-pressed', 'false');
      setProgress(0);
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    function completeHold() {
      triggered = true;
      pointerId = null;
      el.classList && el.classList.remove('long-press-active');
      el.setAttribute('aria-pressed', 'false');
      setProgress(1);
      vibrate([20, 40, 10]);
      try {
        if (typeof opts.callback === 'function') {
          opts.callback.call(el);
        } else if (typeof opts.url === 'string' && opts.url.length) {
          // small delay for UX so ring reaches 100%
          setTimeout(() => { window.location.href = opts.url; }, 120);
        } else {
          console.warn('makeLongPressNav: no url or callback provided');
        }
      } catch (err) {
        console.error('longpress callback error', err);
      }
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      setTimeout(() => setProgress(0), 300);
    }

    function tick() {
      const elapsed = performance.now() - startT;
      const t = Math.max(0, Math.min(1, elapsed / opts.holdDuration));
      setProgress(t);
      if (elapsed >= opts.holdDuration) { completeHold(); return; }
      raf = requestAnimationFrame(tick);
    }

    // Pointer events
    function onPointerDown(e) {
      if (e.isPrimary === false) return;
      if (e.button && e.button !== 0) return;
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      startHold(e.clientX, e.clientY, e.pointerId);
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (pointerId === null || e.pointerId !== pointerId || canceled) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > opts.moveTolerance) cancelHold();
    }
    function onPointerUp(e) {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const elapsed = performance.now() - startT;
      if (elapsed >= opts.holdDuration) {
        if (!triggered) completeHold();
      } else {
        cancelHold();
      }
      el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
    }
    function onPointerCancel() { cancelHold(); }

    // Keyboard support (Space / Enter)
    let keyHeld = false, keyStart = 0;
    function onKeyDown(e) {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        if (keyHeld) return;
        keyHeld = true;
        keyStart = performance.now();
        el.classList && el.classList.add('long-press-active');
        setProgress(0);
        (function keyTick() {
          if (!keyHeld) return;
          const t = (performance.now() - keyStart) / opts.holdDuration;
          setProgress(t);
          if (t >= 1) { completeHold(); keyHeld = false; return; }
          requestAnimationFrame(keyTick);
        })();
        e.preventDefault();
      }
    }
    function onKeyUp(e) {
      if ((e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && keyHeld) {
        const elapsed = performance.now() - keyStart;
        keyHeld = false;
        if (elapsed >= opts.holdDuration) completeHold(); else cancelHold();
        e.preventDefault();
      }
    }

    // attach listeners
    el.addEventListener('pointerdown', onPointerDown, { passive: false });
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('keyup', onKeyUp);

    // public api
    const api = {
      element: el,
      cancel: cancelHold,
      destroy: function () {
        el.removeEventListener('pointerdown', onPointerDown);
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', onPointerUp);
        el.removeEventListener('pointercancel', onPointerCancel);
        el.removeEventListener('keydown', onKeyDown);
        el.removeEventListener('keyup', onKeyUp);
        if (ring && ring.container && ring.container.parentNode) ring.container.parentNode.removeChild(ring.container);
        delete el._longPressNav;
      },
      setHoldDuration: function (ms) { opts.holdDuration = Number(ms) || opts.holdDuration; }
    };

    el._longPressNav = api;
    return api;
  }

  // Auto-attach on DOMContentLoaded
  function autoAttach() {
    try {
      const nodes = document.querySelectorAll('[data-longpress-url]');
      if (nodes && nodes.length) {
        nodes.forEach(n => {
          try {
            const url = n.getAttribute('data-longpress-url') || '';
            const dur = parseInt(n.getAttribute('data-longpress-duration')) || 800;
            makeLongPressNav(n, { url: url, holdDuration: dur });
          } catch (e) {
            console.warn('longpress auto-attach failed for node', n, e);
          }
        });
        return;
      }
      // fallback: attach to advanceBtn if present
      const adv = document.getElementById('advanceBtn');
      if (adv) {
        const defaultUrl = (typeof window.nextPage === 'string') ? window.nextPage : '';
        makeLongPressNav(adv, { url: defaultUrl, holdDuration: 800 });
      }
    } catch (err) {
      console.warn('longpress autoAttach error', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoAttach);
  } else {
    setTimeout(autoAttach, 0);
  }

  // expose
  window.makeLongPressNav = makeLongPressNav;
})();
