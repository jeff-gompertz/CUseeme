/* =========================================================
HUD.js v1.2 — Stable drag + restored button functionality
========================================================= */

// 🟢 Make HUD draggable (pure fixed, button-safe)
(function enableHUDDrag() {
  const hud = document.getElementById('hudShell');
  if (!hud) return;

  let dragging = false;
  let startX = 0, startY = 0;
  let origLeft = 0, origTop = 0;

  // Center HUD initially
  function centerHUD() {
    const rect = hud.getBoundingClientRect();
    hud.style.position = 'fixed';
    hud.style.left = `${(window.innerWidth - rect.width) / 2}px`;
    hud.style.top = `20px`;
  }
  window.addEventListener('load', centerHUD);
  window.addEventListener('resize', centerHUD);

  function startDrag(e) {
    // ✅ Ignore drag if a button or input is the target
    if (e.target.closest('button, input, .hud-btn')) return;

    dragging = true;
    const point = e.touches ? e.touches[0] : e;
    const rect = hud.getBoundingClientRect();
    startX = point.clientX;
    startY = point.clientY;
    origLeft = rect.left;
    origTop = rect.top;

    hud.style.transition = 'none';
    hud.classList.add('dragging');
    e.preventDefault();
  }

  function onDrag(e) {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    hud.style.left = `${origLeft + dx}px`;
    hud.style.top  = `${origTop + dy}px`;
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    hud.classList.remove('dragging');
    hud.style.transition = 'all 0.25s ease-out';

    // Soft snap to edges
    const rect = hud.getBoundingClientRect();
    const margin = 12;
    const snapLeft = margin;
    const snapRight = window.innerWidth - rect.width - margin;
    let newLeft = rect.left;
    if (rect.left < window.innerWidth * 0.25) newLeft = snapLeft;
    else if (rect.right > window.innerWidth * 0.75) newLeft = snapRight;

    hud.style.left = `${newLeft}px`;
    hud.style.top  = `${Math.min(Math.max(rect.top, margin), window.innerHeight - rect.height - margin)}px`;
  }

  // Unified pointer/touch events
  hud.addEventListener('pointerdown', startDrag);
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', endDrag);
})();


// 🟢 Make MiniWindows draggable (unchanged)
(function enableMiniWindowDrag() {
  function makeDraggable(el) {
    let dragging = false;
    let startX = 0, startY = 0, origX = 0, origY = 0;

    function start(e) {
      dragging = true;
      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      const rect = el.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      e.preventDefault();
    }

    function move(e) {
      if (!dragging) return;
      const point = e.touches ? e.touches[0] : e;
      const dx = point.clientX - startX;
      const dy = point.clientY - startY;
      el.style.left = origX + dx + 'px';
      el.style.top = origY + dy + 'px';
    }

    function end() { dragging = false; }

    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }

  document.querySelectorAll('.miniWin').forEach(makeDraggable);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.classList && node.classList.contains('miniWin')) {
          makeDraggable(node);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true });
})();

