/* repo-nav-simple.js
   Lightweight, non-network nav sidebar widget.
   - Uses buttons (not anchors) so iOS/Safari won't show link long-press menus
   - Disables selection/touch-callout inside the nav and prevents contextmenu/selectionstart
   - Simple API: simpleRepoNav.setLinks([...]); simpleRepoNav.open()/close()/toggle()
*/

(function(){
  const DEFAULT_LINKS = [
    { title: '📰 Spawn 5', href: 'CUseeme_v1.7_dynamic_restyleBLACK.html', target: '_self' },
    { title: '📰 Spawn 5', href: 'CUseeme_v1.7_dynamic_restyleBLACK.html', target: '_self' },
    { title: '📰 a Half Half', href: 'a_half_half.html', target: '_self' },
    { title: '📰 Semantic Voice', href: '/CUseeme/A/A_semantic_voice.html', target: '_self' },
    { title: '📰 Floating Feed', href: 'cuseeme_modular_v1.2_floatingfeed.html', target: '_self' },
    { title: '📰 MultiFilter', href: 's_6cards_video_wpmedia_multiFilter_LIVEchatgpt2.html', target: '_self' },
    { title: '📰 Load Random', href: 'c_centerpush_loadrandom.html', target: '_self' }
     
     
  ];
  
  if (window.simpleRepoNav) return;

  function createEl(tag, attrs = {}, html = '') {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'style') Object.assign(el.style, attrs[k]);
      else if (k === 'class' || k === 'className') el.className = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (html) el.innerHTML = html;
    return el;
  }

  function whenBody(fn){
    if (document.body) return fn();
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  function ensureToggle(){
    let btn = document.getElementById('hudToggle_nav');
    if(!btn){
      btn = createEl('div', { id:'hudToggle_nav', role:'button', 'aria-pressed':'false', 'aria-label':'Hold to open navigation' });
      btn.textContent = '⧉ NAV';
      whenBody(()=>document.body.appendChild(btn));
    }
    btn.style.position = btn.style.position || 'fixed';
    btn.style.top = btn.style.top || '56px';
    btn.style.right = btn.style.right || '12px';
    btn.style.zIndex = btn.style.zIndex || 9999;
    btn.style.padding = btn.style.padding || '6px 10px';
    btn.style.borderRadius = btn.style.borderRadius || '6px';
    btn.style.background = btn.style.background || 'rgba(0,255,80,0.08)';
    btn.style.color = btn.style.color || '#0f0';
    btn.style.cursor = 'pointer';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '.5rem';
    // disable selection/callout on the toggle itself
    btn.style.webkitUserSelect = 'none';
    btn.style.userSelect = 'none';
    btn.style.webkitTouchCallout = 'none';
    return btn;
  }

  function ensurePanel(){
    let aside = document.getElementById('repoNav');
    if(!aside){
      aside = createEl('aside', { id:'repoNav', 'aria-hidden':'true', class:'repo-nav' });
      whenBody(()=>document.body.appendChild(aside));
    }
    aside.style.position = aside.style.position || 'fixed';
    aside.style.top = aside.style.top || '0';
    aside.style.right = aside.style.right || '0';
    aside.style.height = aside.style.height || '100%';
    aside.style.width = aside.style.width || '320px';
    aside.style.maxWidth = aside.style.maxWidth || '92%';
    aside.style.background = aside.style.background || 'linear-gradient(180deg, rgba(0,0,0,0.95), rgba(0,0,0,0.85))';
    aside.style.padding = aside.style.padding || '12px';
    aside.style.boxSizing = aside.style.boxSizing || 'border-box';
    aside.style.transform = aside.style.transform || 'translateX(110%)';
    aside.style.transition = aside.style.transition || 'transform .28s ease, opacity .2s';
    aside.style.zIndex = aside.style.zIndex || 9998;
    aside.style.overflow = aside.style.overflow || 'auto';

    if(!aside.querySelector('.repo-nav-inner')){
      aside.innerHTML = '';
      const wrapper = createEl('div', { class: 'repo-nav-inner' });
      const header = createEl('div', { class: 'repo-nav-header', style: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px', borderBottom:'1px dashed rgba(0,255,120,0.06)', paddingBottom:'8px', marginBottom:'6px' }});
      header.innerHTML = '<div><div style="font-weight:700">Repository navigation</div><div class="meta" id="repoMeta" style="font-size:11px;color:#7fffb0;opacity:.9">local</div></div>';
      const ctrls = createEl('div', { class: 'repo-nav-controls' });
      const refresh = createEl('button', { id:'repoRefresh', title:'Refresh' }, '⟳');
      const close = createEl('button', { id:'repoClose', title:'Close' }, '✕');
      ctrls.appendChild(refresh); ctrls.appendChild(close);
      header.appendChild(ctrls);
      const list = createEl('nav', { id:'repoList', class:'repo-list', role:'navigation' });
      const footer = createEl('div', { style: { marginTop:'auto', fontSize:'12px', color:'#9ffea0', opacity:.9, paddingTop:'10px' } }, 'Tip: tap a button to run.');
      wrapper.appendChild(header); wrapper.appendChild(list); wrapper.appendChild(footer);
      aside.appendChild(wrapper);
      refresh.addEventListener('click', ()=> { renderLinks(currentLinks); setRepoStatus('loaded'); });
      close.addEventListener('click', ()=> { simpleRepoNav.close(); });
      // defensive: prevent context menu/selection inside panel
      list.addEventListener('contextmenu', e=>e.preventDefault());
      list.addEventListener('selectstart', e=>e.preventDefault());
      aside.addEventListener('contextmenu', e=>e.preventDefault());
      aside.addEventListener('selectstart', e=>e.preventDefault());
    }
    return aside;
  }

  function setRepoStatus(msg){
    const el = document.getElementById('repoStatus');
    if(el) el.textContent = 'nav: ' + msg;
  }

  function openPanel(){
    const p = ensurePanel();
    p.setAttribute('aria-hidden', 'false');
    p.style.transform = 'translateX(0)';
    setRepoStatus('loaded');
    simpleRepoNav._open = true;
  }
  function closePanel(){
    const p = ensurePanel();
    p.setAttribute('aria-hidden', 'true');
    p.style.transform = 'translateX(110%)';
    setRepoStatus('idle');
    simpleRepoNav._open = false;
  }
  function togglePanel(){ simpleRepoNav._open ? simpleRepoNav.close() : simpleRepoNav.open(); }

  // Use buttons instead of anchors to avoid iOS link long-press menu
  function renderLinks(links){
    const list = document.getElementById('repoList') || ensurePanel().querySelector('#repoList');
    if(!list) return;
    list.innerHTML = '';
    if(!links || !links.length){
      list.innerHTML = '<div style="opacity:.8">no links</div>';
      return;
    }
    links.forEach(item => {
      const title = item.title || (item.href || 'link');
      const btn = createEl('button', { class:'nav-item repoNavBtn', type:'button' }, title);
      btn.style.display = 'block';
      btn.style.padding = '6px 8px';
      btn.style.color = '#9ffea0';
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.textAlign = 'left';
      btn.style.width = '100%';
      btn.style.borderRadius = '6px';
      if (item.href) btn.dataset.href = item.href;
      if (item.target) btn.dataset.target = item.target;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const href = (btn.dataset.href || '').toString();
        if (href.startsWith('#')) {
          const el = document.getElementById(href.slice(1));
          if (el) { el.click(); simpleRepoNav.close(); return; }
        }
        if (/^btn/i.test(href)) {
          const el = document.getElementById(href);
          if (el) { el.click(); simpleRepoNav.close(); return; }
        }
        if (href) {
          if (btn.dataset.target === '_blank') window.open(href, '_blank', 'noopener');
          else window.location.href = href;
          return;
        }
        simpleRepoNav.close();
      });

      // defensive: prevent context menu / selection on the button
      btn.addEventListener('contextmenu', ev => ev.preventDefault());
      btn.addEventListener('selectstart', ev => ev.preventDefault());
      btn.style.webkitUserSelect = 'none';
      btn.style.userSelect = 'none';
      btn.style.webkitTouchCallout = 'none';

      list.appendChild(btn);
    });
  }

  function wireHoldToggle(btn){
    let holdTimer = null;
    const HOLD_MS = 700;
    const startHold = (ev) => {
      if(holdTimer) clearTimeout(holdTimer);
      btn.classList.add('holding');
      holdTimer = setTimeout(()=> { openPanel(); btn.classList.remove('holding'); holdTimer = null; }, HOLD_MS);
    };
    const cancelHold = () => { if(holdTimer){ clearTimeout(holdTimer); holdTimer = null; } btn.classList.remove('holding'); };
    btn.addEventListener('pointerdown', (e)=> { if(e.button !== 0) return; startHold(e); }, { passive: true });
    ['pointerup','pointercancel','pointerleave','pointerout'].forEach(ev => btn.addEventListener(ev, cancelHold));
    btn.addEventListener('click', (e) => { if(simpleRepoNav._open) closePanel(); else openPanel(); });
    btn.addEventListener('keydown', (e)=> { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); }});
  }

  let currentLinks = DEFAULT_LINKS.slice();

  const simpleRepoNav = {
    _open: false,
    setLinks(links){ if(!Array.isArray(links)) return; currentLinks = links.slice(); renderLinks(currentLinks); },
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    getLinks(){ return currentLinks.slice(); }
  };

  const btn = ensureToggle();
  ensurePanel();
  wireHoldToggle(btn);
  renderLinks(currentLinks);
  window.simpleRepoNav = simpleRepoNav;

  // honor inline list if present, or poll briefly for late assignment
  if (Array.isArray(window.SIMPLE_REPO_NAV_LINKS) && window.SIMPLE_REPO_NAV_LINKS.length) {
    simpleRepoNav.setLinks(window.SIMPLE_REPO_NAV_LINKS);
  } else {
    let poll = 0;
    const pollMax = 20;
    const pi = setInterval(()=> {
      poll++;
      if (Array.isArray(window.SIMPLE_REPO_NAV_LINKS) && window.SIMPLE_REPO_NAV_LINKS.length) {
        simpleRepoNav.setLinks(window.SIMPLE_REPO_NAV_LINKS);
        clearInterval(pi);
      } else if (poll >= pollMax) clearInterval(pi);
    }, 100);
  }

  // inject small scoped CSS
  (function injectCSS(){
    if (document.getElementById('simple-repo-nav-style')) return;
    const s = createEl('style', { id:'simple-repo-nav-style' });
    s.textContent = `
      #hudToggle_nav.holding { box-shadow: 0 0 36px rgba(255,12,110,0.9); transform: none; }
      #repoNav { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }
      #repoNav .repoNavBtn:hover, #repoNav .nav-item:hover { background: rgba(0,255,120,0.04); }
      #repoNav { transform: translateX(110%); transition: transform .28s ease; }
      #repoNav[aria-hidden="false"] { transform: translateX(0); }
      #repoList button { font-family: inherit; font-size: 14px; }
      #repoNav button:focus { outline: 2px solid rgba(255,255,255,0.08); outline-offset: 2px; }
    `;
    document.head.appendChild(s);
  })();

})();
