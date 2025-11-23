/* Minimal longpress-hud.js — non-invasive attach
   - Does NOT inject styles or move DOM nodes.
   - Attaches long-press behavior to #advanceBtn only.
   - Logs debug lines to #debugTicker and console.
   - Prefers centralized makeLongPressNav(btn, opts) when available (ring:false).
   - Safe fallback if helper not present.
*/
(function minimalLongpressHud(){
  'use strict';
  const BUTTON_ID = 'advanceBtn';
  const HOLD_MS = 1400;
  const MOVE_TOLERANCE = 12;

  function dbg(msg){
    try {
      console.log('longpress-hud:', msg);
      const dbgEl = document.getElementById('debugTicker') || document.getElementById('ticker');
      if(dbgEl){
        const d = document.createElement('div');
        d.className = 'tline';
        d.textContent = msg;
        dbgEl.prepend(d);
        while(dbgEl.children.length > 140) dbgEl.removeChild(dbgEl.lastChild);
      }
    } catch (e) { /* ignore */ }
  }

  function attachVisualProgressStub(btn){
    // Minimal visual feedback: add 'holding' class; don't inject styles here
    // This function just ensures we add/remove class; CSS (if any) will control appearance.
    let startX=0, startY=0, timer=null;
    function startHold(clientX, clientY){
      startX = clientX; startY = clientY;
      btn.classList.add('holding');
      // visual progress isn't injected here — this keeps behavior non-invasive
      timer = setTimeout(()=> {
        // triggered after HOLD_MS — no navigation here if makeLongPress handled it
        dbg('hold: timer completed (visual stub)');
      }, HOLD_MS);
    }
    function cancelHold(){
      btn.classList.remove('holding');
      if(timer){ clearTimeout(timer); timer = null; }
      dbg('hold: cancelled (visual stub)');
    }
    // Pointer handlers (non-passive so preventDefault works if needed)
    btn.addEventListener('pointerdown', function onDown(e){
      if(e.isPrimary === false) return;
      startHold(e.clientX, e.clientY);
    }, { passive: false });
    btn.addEventListener('pointermove', function(e){
      // optional movement cancellation
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if(Math.hypot(dx,dy) > MOVE_TOLERANCE) cancelHold();
    }, { passive: true });
    btn.addEventListener('pointerup', function(){ cancelHold(); }, { passive: true });
    btn.addEventListener('pointercancel', function(){ cancelHold(); }, { passive: true });

    // keyboard fallback
    let keyTimer = null;
    btn.addEventListener('keydown', function(e){
      if(e.key === ' ' || e.key === 'Enter'){
        if(keyTimer) return;
        btn.classList.add('holding');
        keyTimer = setTimeout(()=>{ dbg('hold: keyboard timer fired'); keyTimer = null; }, HOLD_MS);
        e.preventDefault();
      }
    });
    btn.addEventListener('keyup', function(e){
      if((e.key === ' ' || e.key === 'Enter') && keyTimer){
        clearTimeout(keyTimer); keyTimer = null;
        btn.classList.remove('holding');
      }
    });
  }

  function fallbackLongPressAttach(btn, url){
    // Non-invasive fallback that navigates after a proper hold (and uses pointer capture)
    let pointerId = null, startX = 0, startY = 0, timer = null;
    function cancel(){
      if(timer){ clearTimeout(timer); timer = null; }
      pointerId = null;
      btn.classList.remove('holding');
      dbg('fallback: cancelled');
    }
    function complete(){
      cancel();
      dbg('fallback: complete — navigating to ' + url);
      if(url) window.location.href = url;
    }
    btn.addEventListener('pointerdown', function(e){
      if(e.isPrimary === false) return;
      try{ btn.setPointerCapture && btn.setPointerCapture(e.pointerId); }catch(_){}
      pointerId = e.pointerId;
      startX = e.clientX; startY = e.clientY;
      btn.classList.add('holding');
      timer = setTimeout(complete, HOLD_MS);
      dbg('fallback: pointerdown started');
      e.preventDefault();
    }, { passive: false });
    btn.addEventListener('pointermove', function(e){
      if(pointerId === null || e.pointerId !== pointerId) return;
      const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
      if(Math.hypot(dx,dy) > MOVE_TOLERANCE) cancel();
    }, { passive: true });
    btn.addEventListener('pointerup', function(e){
      if(pointerId === null || e.pointerId !== pointerId) return;
      if(timer){ clearTimeout(timer); timer = null; }
      try{ btn.releasePointerCapture && btn.releasePointerCapture(e.pointerId); }catch(_){}
      btn.classList.remove('holding');
      dbg('fallback: pointerup');
    }, { passive: true });
  }

  function attachOnce(){
    const btn = document.getElementById(BUTTON_ID);
    if(!btn){
      dbg('attach: advanceBtn not found');
      return;
    }
    dbg('attach: advanceBtn found; data-longpress-url=' + (btn.getAttribute('data-longpress-url') || '<none>'));
    // minimal visual stub attach (non-invasive)
    attachVisualProgressStub(btn);

    const url = btn.getAttribute('data-longpress-url') || window.nextPage || '/';
    if(typeof window.makeLongPressNav === 'function'){
      dbg('attach: makeLongPressNav present — calling helper (ring:false)');
      try{
        // call helper but request ring:false (helper may implement its own visuals)
        window.makeLongPressNav(btn, { url: url, holdDuration: HOLD_MS, moveTolerance: MOVE_TOLERANCE, ring: false });
        dbg('attach: makeLongPressNav called successfully');
        return;
      }catch(err){
        dbg('attach: makeLongPressNav error: ' + (err && err.message));
      }
    }
    // fallback if helper not present or errored
    dbg('attach: using fallback longpress attach');
    fallbackLongPressAttach(btn, url);
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
