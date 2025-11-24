/* advance-button.js
   Enhanced, styled long-press "Advance" button for insertion on every page.
   - Creates #advanceButtonGlobal if missing (id chosen to avoid collisions)
   - Reads data-longpress-url on the button or falls back to window.nextPage or "/"
   - Accessible (role=button, tabindex, aria-pressed)
   - Pointer + keyboard handling with movement tolerance and pointer capture
   - Visual progress overlay (linear fill) and focus ring
   - Dispatches custom event 'advanceActivated' on successful activation
   - Safe to include at the end of pages. No external CSS required.
*/
(function(){
  const ID = 'advanceButtonGlobal';
  const STYLE_ID = 'advance-button-styles';
  const HOLD_MS_DEFAULT = 900; // default hold time (ms) — tweak as desired
  const MOVE_TOLERANCE = 12;    // pixels allowed while holding

  // inject styles (one-time)
  if(!document.getElementById(STYLE_ID)){
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#${ID} {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 10020;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 36px;
  min-width: 84px;
  padding: 7px 22px;
  border-radius: 28px;
  background: var(--btn-bg, linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,250,240,0.92)));
  color: var(--btn-color, #132030);
  font-family: "VT323", monospace, system-ui;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.06);
  overflow: visible;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

/* compact mobile adjustments */
@media (max-width: 540px) {
  #${ID} { right: 8px; bottom: 8px; padding: 6px 12px; min-width: 64px; height: 30px; font-size: 12px; }
}

/* holding state */
#${ID}.holding { transform: translateY(-1px) scale(1.01); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }

/* progress overlay (grows left→right, sits behind label) */
#${ID} .ab-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(90deg, rgba(255,74,74,0.14), rgba(255,120,40,0.08));
  transition: width 0s linear;
}

/* label above progress */
#${ID} .ab-label { position: relative; z-index: 1; display:inline-block; padding:0 6px; }

/* focus ring (keyboard users) */
#${ID}:focus { outline: none; box-shadow: 0 0 0 4px rgba(0,208,255,0.12), 0 8px 22px rgba(0,0,0,0.18); }

/* small subtle pressed state for pointerup animation */
#${ID}.pressed { transition: all 200ms ease; transform: translateY(0); }
`;
    document.head.appendChild(s);
  }

  // create button if not present
  function ensureButton(){
    let btn = document.getElementById(ID);
    if(btn) return btn;

    btn = document.createElement('button');
    btn.id = ID;
    btn.type = 'button';
    btn.setAttribute('role','button');
    btn.setAttribute('aria-pressed','false');
    btn.setAttribute('title','Hold to advance');
    btn.tabIndex = 0;
    btn.className = '';

    // progress overlay + label
    const prog = document.createElement('span');
    prog.className = 'ab-progress';
    btn.appendChild(prog);

    const label = document.createElement('span');
    label.className = 'ab-label';
    label.textContent = 'Advance';
    btn.appendChild(label);

    // minimal safe styles from page variables (if available)
    try{
      const computed = getComputedStyle(document.documentElement);
      const btnBg = computed.getPropertyValue('--btn-bg');
      if(btnBg) btn.style.background = btnBg.trim();
    }catch(e){}

    document.body.appendChild(btn);
    return btn;
  }

  // attach behavior
  function attachAdvance(btn, options){
    options = options || {};
    const holdDuration = Number(options.holdDuration || btn.getAttribute('data-hold-ms') || HOLD_MS_DEFAULT) || HOLD_MS_DEFAULT;
    const moveTol = Number(options.moveTolerance || MOVE_TOLERANCE) || MOVE_TOLERANCE;

    const progressEl = btn.querySelector('.ab-progress');

    let pointerId = null, startX=0, startY=0, timer=null, isHolding=false;

    function startHold(px, py, pid){
      if(isHolding) return;
      isHolding = true;
      pointerId = pid == null ? null : pid;
      startX = px; startY = py;
      btn.classList.add('holding');
      btn.setAttribute('aria-pressed','true');
      // animate progress
      progressEl.style.transition = 'width ' + holdDuration + 'ms linear';
      // small timeout to let transition apply
      setTimeout(()=>{ progressEl.style.width = '100%'; }, 10);
      // set timer to complete after holdDuration
      timer = setTimeout(()=>{
        completeHold();
      }, holdDuration);
      // optional vibration if available
      try{ if(navigator.vibrate) navigator.vibrate(8); }catch(e){}
    }

    function cancelHold(){
      if(!isHolding) return;
      isHolding = false;
      pointerId = null;
      clearTimeout(timer); timer = null;
      progressEl.style.transition = 'width 160ms linear';
      progressEl.style.width = '0%';
      btn.classList.remove('holding');
      btn.setAttribute('aria-pressed','false');
    }

    function completeHold(){
      cancelHold(); // reset visuals
      // determine url
      const url = btn.getAttribute('data-longpress-url') || window.nextPage || options.url || '/';
      // dispatch event so other code can intercept
      const ev = new CustomEvent('advanceActivated', { detail: { url: url, source: 'advance-button' }, bubbles: true, cancelable: true });
      const prevented = !btn.dispatchEvent(ev);
      if(prevented) {
        // caller canceled navigation
        return;
      }
      // navigate
      try{ window.location.href = url; }catch(e){ console.error('advance navigation failed', e); }
    }

    // pointer handlers (non-passive so preventDefault can stop e.g. dragscroll)
    btn.addEventListener('pointerdown', function(e){
      if(e.isPrimary === false) return;
      // ignore right-click / secondary buttons
      if(e.button && e.button !== 0) return;
      // capture pointer so move/up events still arrive
      try{ btn.setPointerCapture && btn.setPointerCapture(e.pointerId); }catch(_){}
      startHold(e.clientX, e.clientY, e.pointerId);
      e.preventDefault();
    }, { passive: false });

    btn.addEventListener('pointermove', function(e){
      if(!isHolding) return;
      // if pointer moved too far, cancel
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if(Math.hypot(dx,dy) > moveTol) cancelHold();
    }, { passive: true });

    btn.addEventListener('pointerup', function(e){
      if(!isHolding) return;
      // release
      try{ btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId); }catch(_){}
      // if timer still pending and not finished, cancel
      if(timer){ clearTimeout(timer); timer = null; }
      // but allow short completion if elapsed >= holdDuration handled by timer
      cancelHold();
    }, { passive: true });

    btn.addEventListener('pointercancel', function(){ cancelHold(); });

    // keyboard support (Space / Enter)
    let keyTimer = null, keyStart = 0;
    btn.addEventListener('keydown', function(e){
      if(e.code === 'Space' || e.key === ' ' || e.key === 'Enter'){
        if(keyTimer) return;
        e.preventDefault();
        btn.classList.add('holding');
        progressEl.style.transition = 'width ' + holdDuration + 'ms linear';
        setTimeout(()=> { progressEl.style.width = '100%'; }, 10);
        keyStart = performance.now();
        keyTimer = setTimeout(()=> {
          keyTimer = null;
          completeHold();
        }, holdDuration);
      }
    });
    btn.addEventListener('keyup', function(e){
      if((e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && keyTimer){
        clearTimeout(keyTimer); keyTimer = null;
        progressEl.style.transition = 'width 160ms linear';
        progressEl.style.width = '0%';
        btn.classList.remove('holding');
        e.preventDefault();
      }
    });

    // ensure clean state on page hide/unload
    window.addEventListener('pagehide', cancelHold);
    window.addEventListener('blur', cancelHold);
  }

  // init on DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function ondom(){
      document.removeEventListener('DOMContentLoaded', ondom);
      const btn = ensureButton();
      attachAdvance(btn, {});
    });
  } else {
    const btn = ensureButton();
    attachAdvance(btn, {});
  }

})();
