/* longpress-hud.js
   Attach HUD-styled hold-to-navigate behavior to #advanceBtn.
   Place this file at /js/longpress-hud.js and include it AFTER longpress-nav.js.
*/
(function attachHudStyleLongPress(){
  const BUTTON_ID = 'advanceBtn';
  const HOLD_MS = 1400;
  const MOVE_TOLERANCE = 12;

  const btn = document.getElementById(BUTTON_ID);
  if(!btn){ console.warn('longpress-hud: button not found:', BUTTON_ID); return; }

  // Ensure relative positioning so progress overlay fits
  const cs = window.getComputedStyle(btn);
  if(cs.position === 'static' || !cs.position) btn.style.position = 'relative';

  // Inject HUD-like CSS once
  if(!document.getElementById('hud-longpress-styles')){
    const s = document.createElement('style');
    s.id = 'hud-longpress-styles';
    s.textContent = `
#${BUTTON_ID}.holding { transform: scale(1.02); box-shadow: 0 10px 28px rgba(255,12,110,0.12) !important; }
#${BUTTON_ID} .hud-holdProgress {
  position:absolute; left:0; top:0; height:100%; width:0%; border-radius:inherit;
  background: linear-gradient(90deg, rgba(255,12,110,0.28), rgba(255,60,160,0.16));
  pointer-events:none; z-index: -1; transition: width 0s linear;
}
#${BUTTON_ID}.holding .hud-holdProgress { z-index: 0; }
`;
    document.head.appendChild(s);
  }

  // Create progress element if missing
  let progress = btn.querySelector('.hud-holdProgress');
  if(!progress){
    progress = document.createElement('div');
    progress.className = 'hud-holdProgress';
    btn.insertBefore(progress, btn.firstChild);
  }

  // Target URL resolution
  const TARGET_URL = btn.getAttribute('data-longpress-url') || window.nextPage || '/';

  // Prefer centralized helper if available — but disable its ring (ring:false)
  if(window.makeLongPressNav){
    try {
      window.makeLongPressNav(btn, { url: TARGET_URL, holdDuration: HOLD_MS, moveTolerance: MOVE_TOLERANCE, ring: false });
      attachVisualHandlers(btn, progress, HOLD_MS, MOVE_TOLERANCE);
      console.log('longpress-hud: attached via makeLongPressNav');
      return;
    } catch(e){
      console.warn('longpress-hud: makeLongPressNav attach failed — falling back', e);
    }
  }

  // Fallback inline if helper not available
  fallbackLongPress(btn, progress, TARGET_URL, HOLD_MS, MOVE_TOLERANCE);

  // -- helpers --
  function attachVisualHandlers(el, progressEl, holdMs, moveTol){
    let startX=0, startY=0, startT=0;
    function resetVisual(){
      progressEl.style.transition = 'width 160ms linear';
      progressEl.style.width = '0%';
      el.classList.remove('holding');
      startT = 0;
    }

    el.addEventListener('pointerdown', (e) => {
      if(e.isPrimary === false) return;
      startX = e.clientX; startY = e.clientY; startT = performance.now();
      el.classList.add('holding');
      progressEl.style.transition = 'width ' + holdMs + 'ms linear';
      setTimeout(()=> { progressEl.style.width = '100%'; }, 10);
    }, { passive: true });

    el.addEventListener('pointermove', (e) => {
      if(!startT) return;
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if(Math.hypot(dx,dy) > moveTol) resetVisual();
    }, { passive: true });

    el.addEventListener('pointerup', () => { resetVisual(); });
    el.addEventListener('pointercancel', () => { resetVisual(); });

    // keyboard (Space/Enter)
    let keyHeld=false;
    el.addEventListener('keydown', function(e){
      if(e.code==='Space' || e.key===' ' || e.key==='Enter'){
        if(keyHeld) return;
        keyHeld = true;
        el.classList.add('holding');
        progressEl.style.transition = 'width ' + holdMs + 'ms linear';
        setTimeout(()=> { progressEl.style.width = '100%'; }, 10);
        e.preventDefault();
      }
    });
    el.addEventListener('keyup', function(e){
      if((e.code==='Space' || e.key===' ' || e.key==='Enter') && keyHeld){
        keyHeld = false;
        progressEl.style.transition = 'width 160ms linear';
        progressEl.style.width = '0%';
        el.classList.remove('holding');
        e.preventDefault();
      }
    });
  }

  function fallbackLongPress(el, progressEl, url, holdMs, moveTol){
    let pointerId = null, startX=0, startY=0, timer=null;
    function cancel(){
      if(timer){ clearTimeout(timer); timer=null; }
      pointerId = null;
      progressEl.style.transition = 'width 160ms linear';
      progressEl.style.width = '0%';
      el.classList.remove('holding');
    }
    function complete(){
      cancel();
      if(url) window.location.href = url;
    }

    el.addEventListener('pointerdown', function(e){
      if(e.isPrimary === false) return;
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      pointerId = e.pointerId;
      startX = e.clientX; startY = e.clientY;
      el.classList.add('holding');
      progressEl.style.transition = 'width ' + holdMs + 'ms linear';
      setTimeout(()=> { progressEl.style.width = '100%'; }, 10);
      timer = setTimeout(()=> { complete(); }, holdMs);
      e.preventDefault();
    }, { passive:false });

    el.addEventListener('pointermove', function(e){
      if(pointerId === null || e.pointerId !== pointerId) return;
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if(Math.hypot(dx,dy) > moveTol) cancel();
    });

    el.addEventListener('pointerup', function(e){
      if(pointerId === null || e.pointerId !== pointerId) return;
      if(timer){ clearTimeout(timer); timer=null; }
      el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
      progressEl.style.transition = 'width 160ms linear';
      progressEl.style.width = '0%';
      el.classList.remove('holding');
    });

    el.addEventListener('pointercancel', cancel);

    // keyboard fallback
    let keyTimer = null;
    el.addEventListener('keydown', function(e){
      if(e.code==='Space' || e.key===' ' || e.key==='Enter'){
        if(keyTimer) return;
        el.classList.add('holding');
        progressEl.style.transition = 'width ' + holdMs + 'ms linear';
        setTimeout(()=> { progressEl.style.width = '100%'; }, 10);
        keyTimer = setTimeout(()=> { complete(); keyTimer=null; }, holdMs);
        e.preventDefault();
      }
    });
    el.addEventListener('keyup', function(e){
      if((e.code==='Space' || e.key===' ' || e.key==='Enter') && keyTimer){
        clearTimeout(keyTimer); keyTimer = null;
        progressEl.style.transition = 'width 160ms linear';
        progressEl.style.width = '0%';
        el.classList.remove('holding');
        e.preventDefault();
      }
    });
  }

})();
