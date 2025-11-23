/* longpress-hud.js
   Robust attach for HUD-styled hold-to-navigate behavior on #advanceBtn.
   - Waits for DOMContentLoaded, so it works wherever the <script> is placed.
   - Prefers centralized makeLongPressNav (ring disabled) and falls back to inline handler.
   - Writes simple debug messages to #debugTicker if present.
   - Adjustments: progress z-index and button overflow so progress is visible;
     pointerdown uses passive:false so preventDefault works reliably when needed.
*/
(function longpressHudModule(){
  const BUTTON_ID = 'advanceBtn';
  const HOLD_MS = 1400;
  const MOVE_TOLERANCE = 12;

  function dbg(msg){
    try {
      console.log('longpress-hud:', msg);
      const dbgEl = document.getElementById('debugTicker');
      if(dbgEl){
        const d = document.createElement('div'); d.className = 'tline'; d.textContent = msg;
        dbgEl.prepend(d);
        while(dbgEl.children.length > 120) dbgEl.removeChild(dbgEl.lastChild);
      }
    } catch(e){}
  }

  function ensureStyles(){
    if(document.getElementById('hud-longpress-styles')) return;
    const s = document.createElement('style');
    s.id = 'hud-longpress-styles';
    s.textContent = `
/* Ensure the button clips the progress and text remains readable */
#${BUTTON_ID} { position: relative; overflow: hidden; }

/* Holding visual */
#${BUTTON_ID}.holding { transform: scale(1.02); box-shadow: 0 10px 28px rgba(255,12,110,0.12) !important; }

/* Progress bar overlay (grows left->right) */
#${BUTTON_ID} .hud-holdProgress {
  position:absolute; left:0; top:0; height:100%; width:0%; border-radius:inherit;
  background: linear-gradient(90deg, rgba(255,12,110,0.28), rgba(255,60,160,0.16));
  pointer-events:none; z-index: 0; transition: width 0s linear;
}

/* Keep progress under the label visually but above the button background */
#${BUTTON_ID} .hud-label, #${BUTTON_ID} .hud-content { position: relative; z-index: 1; }
`;
    document.head.appendChild(s);
  }

  function createProgressIfMissing(btn){
    let progress = btn.querySelector('.hud-holdProgress');
    if(!progress){
      progress = document.createElement('div');
      progress.className = 'hud-holdProgress';
      btn.insertBefore(progress, btn.firstChild);
    }
    // Ensure there's a wrapper span for text so we can keep it above the progress.
    if(!btn.querySelector('.hud-content')){
      const wrap = document.createElement('span');
      wrap.className = 'hud-content';
      // Move existing text nodes into the wrapper
      while(btn.childNodes.length > 1){ // leave the progress we just inserted as first child
        const node = btn.childNodes[1];
        wrap.appendChild(node);
      }
      btn.appendChild(wrap);
    }
    return progress;
  }

  function attachVisualHandlers(el, progressEl, holdMs, moveTol){
    let startX=0, startY=0, startT=0;
    function resetVisual(){
      try{
        progressEl.style.transition = 'width 160ms linear';
        progressEl.style.width = '0%';
        el.classList.remove('holding');
        startT = 0;
      }catch(e){}
    }

    el.addEventListener('pointerdown', (e) => {
      if(e.isPrimary === false) return;
      startX = e.clientX; startY = e.clientY; startT = performance.now();
      el.classList.add('holding');
      progressEl.style.transition = 'width ' + holdMs + 'ms linear';
      setTimeout(()=> { progressEl.style.width = '100%'; }, 10);
    }, { passive: false });

    el.addEventListener('pointermove', (e) => {
      if(!startT) return;
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if(Math.hypot(dx,dy) > moveTol) resetVisual();
    }, { passive: true });

    el.addEventListener('pointerup', () => { resetVisual(); });
    el.addEventListener('pointercancel', () => { resetVisual(); });

    // keyboard
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

  function attachOnce(){
    const btn = document.getElementById(BUTTON_ID);
    if(!btn){
      dbg('advanceBtn not found in DOM yet.');
      return;
    }
    ensureStyles();
    const progress = createProgressIfMissing(btn);
    const target = btn.getAttribute('data-longpress-url') || window.nextPage || '/';
    // Prefer centralized helper if available (disable its ring)
    if(window.makeLongPressNav){
      try{
        window.makeLongPressNav(btn, { url: target, holdDuration: HOLD_MS, moveTolerance: MOVE_TOLERANCE, ring: false });
        attachVisualHandlers(btn, progress, HOLD_MS, MOVE_TOLERANCE);
        dbg('attached via makeLongPressNav to #' + BUTTON_ID);
        return;
      }catch(e){
        dbg('makeLongPressNav attach failed: ' + (e && e.message));
      }
    }
    // fallback
    fallbackLongPress(btn, progress, target, HOLD_MS, MOVE_TOLERANCE);
    dbg('attached fallback longpress to #' + BUTTON_ID);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function onDom(){
      document.removeEventListener('DOMContentLoaded', onDom);
      attachOnce();
    });
  } else {
    // DOM already ready
    setTimeout(attachOnce, 0);
  }

})();
