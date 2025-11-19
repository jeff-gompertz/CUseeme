/* repo-nav-simple.js
   Lightweight, non-network nav sidebar widget.
   - No GitHub API calls (no rate limits)
   - Holds its own toggle + hold-to-open behavior
   - Simple API: simpleRepoNav.setLinks([...]); simpleRepoNav.open()/close()/toggle()
   - Hardened: handles 'class' safely, defers append if body missing, logs errors
*/

(function(){
  // top-level catch so runtime errors become visible (useful on mobile)
  try {
    const DEFAULT_LINKS = [
      { title: '🏠 Index', href: 'index.html', target: '_self' },
      { title: '📰 Spawn5', href: 'CUseeme_v1.7_dynamic_restyleBLACK.html', target: '_self' }
    ];

    // Ensure we only initialize once
    if (window.simpleRepoNav) return;

    // Helpers to create nodes (handle 'class' and 'className' reliably)
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

    // Defer appending to body if not present yet
    function whenBody(fn) {
      if (document.body) return fn();
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }

    // Create or reuse hud toggle button
    function ensureToggle() {
      let btn = document.getElementById('hudToggle_nav');
      if (!btn) {
        btn = createEl('div', { id: 'hudToggle_nav', role: 'button', 'aria-pressed': 'false', 'aria-label': 'Hold to open navigation' });
        btn.textContent = '⧉ NAV';
        whenBody(() => document.body.appendChild(btn));
      }
      // basic style if not styled by page
      btn.style.position = btn.style.position || 'fixed';
      btn.style.top = btn.style.top || '56px';
      btn.style.right = btn.style.right || '12px';
      btn.style.zIndex = btn.style.zIndex || 9999;
      btn.style.padding = btn.style.padding || '6px 10px';
      btn.style.borderRadius = btn.style.borderRadius || '6px';
      btn.style.background = btn.style.background || 'rgba(0,255,80,0.08)';
      btn.style.color = btn.style.color || '#0f0';
      btn.style.cursor = btn.style.cursor || 'pointer';
      btn.style.display = btn.style.display || 'inline-flex';
      btn.style.alignItems = btn.style.alignItems || 'center';
      btn.style.gap = btn.style.gap || '.5rem';
      // avoid selection/touch-callout on toggle
      btn.style.webkitUserSelect = 'none';
      btn.style.userSelect = 'none';
      btn.style.webkitTouchCallout = 'none';
      return btn;
    }

    // Create or reuse repo panel
    function ensurePanel() {
      let aside = document.getElementById('repoNav');
      if (!aside) {
        aside = createEl('aside', { id: 'repoNav', 'aria-hidden': 'true', class: 'repo-nav' });
        whenBody(() => document.body.appendChild(aside));
      }
      // basic panel style if page doesn't have it
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
      // inner structure
      if (!aside.querySelector('.repo-nav-inner')) {
        aside.innerHTML = '';
        const wrapper = createEl('div', { class: 'repo-nav-inner' });
        const header = createEl('div', { class: 'repo-nav-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderBottom: '1px dashed rgba(0,255,120,0.06)', paddingBottom: '8px', marginBottom: '6px' } });
        header.innerHTML = '<div><div style="font-weight:700">Repository navigation</div><div class="meta" id="repoMeta" style="font-size:11px;color:#7fffb0;opacity:.9">local</div></div>';
        const ctrls = createEl('div', { class: 'repo-nav-controls' });
        const refresh = createEl('button', { id: 'repoRefresh', title: 'Refresh' }, '⟳');
        const close = createEl('button', { id: 'repoClose', title: 'Close' }, '✕');
        ctrls.appendChild(refresh); ctrls.appendChild(close);
        header.appendChild(ctrls);
        const list = createEl('nav', { id: 'repoList', class: 'repo-list', role: 'navigation' });
        const footer = createEl('div', { style: { marginTop: 'auto', fontSize: '12px', color: '#9ffea0', opacity: .9, paddingTop: '10px' } }, 'Tip: click a link to open.');
        wrapper.appendChild(header); wrapper.appendChild(list); wrapper.appendChild(footer);
        aside.appendChild(wrapper);
        // wire close/refresh default
        refresh.addEventListener('click', () => { renderLinks(currentLinks); setRepoStatus('loaded'); });
        close.addEventListener('click', () => { simpleRepoNav.close(); });
      }
      return aside;
    }

    function setRepoStatus(msg) {
      const el = document.getElementById('repoStatus');
      if (el) el.textContent = 'nav: ' + msg;
    }

    // core open/close
    function openPanel() {
      const p = ensurePanel();
      p.setAttribute('aria-hidden', 'false');
      p.style.transform = 'translateX(0)';
      setRepoStatus('loaded');
      simpleRepoNav._open = true;
    }
    function closePanel() {
      const p = ensurePanel();
      p.setAttribute('aria-hidden', 'true');
      p.style.transform = 'translateX(110%)';
      setRepoStatus('idle');
      simpleRepoNav._open = false;
    }
    function togglePanel() { simpleRepoNav._open ? simpleRepoNav.close() : simpleRepoNav.open(); }

    // render links into panel list
    function renderLinks(links) {
      const list = document.getElementById('repoList') || ensurePanel().querySelector('#repoList');
      if (!list) return;
      list.innerHTML = '';
      if (!links || !links.length) {
        list.innerHTML = '<div style="opacity:.8">no links</div>';
        return;
      }
      links.forEach(item => {
        const a = createEl('a', { class: 'nav-item', href: item.href || '#', target: item.target || '_blank' });
        a.textContent = item.title || (item.href || 'link');
        a.style.display = 'block';
        a.style.padding = '6px 8px';
        a.style.color = '#9ffea0';
        a.style.textDecoration = 'none';
        a.style.borderRadius = '6px';
        a.addEventListener('click', (e) => {
          // let default navigation happen; also close panel for better UX on mobile
          setTimeout(() => simpleRepoNav.close(), 220);
        });
        list.appendChild(a);
      });
    }

    // hold-to-open wiring (pointer-first)
    function wireHoldToggle(btn) {
      let holdTimer = null;
      const HOLD_MS = 700;
      const startHold = (ev) => {
        if (holdTimer) clearTimeout(holdTimer);
        btn.classList.add('holding');
        holdTimer = setTimeout(() => { openPanel(); btn.classList.remove('holding'); holdTimer = null; }, HOLD_MS);
      };
      const cancelHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } btn.classList.remove('holding'); };
      btn.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; startHold(e); }, { passive: true });
      ['pointerup', 'pointercancel', 'pointerleave', 'pointerout'].forEach(ev => btn.addEventListener(ev, cancelHold));
      btn.addEventListener('click', (e) => {
        // simple tap toggles
        if (simpleRepoNav._open) closePanel(); else openPanel();
      });
      // keyboard support
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); } });
    }

    // state
    let currentLinks = DEFAULT_LINKS.slice();

    // API object
    const simpleRepoNav = {
      _open: false,
      setLinks(links) {
        if (!Array.isArray(links)) return;
        currentLinks = links.slice();
        renderLinks(currentLinks);
      },
      open: openPanel,
      close: closePanel,
      toggle: togglePanel,
      getLinks() { return currentLinks.slice(); }
    };

    // bootstrap: ensure toggle & panel and wire behaviors
    const btn = ensureToggle();
    ensurePanel();
    wireHoldToggle(btn);
    renderLinks(currentLinks);

    // Expose on window
    window.simpleRepoNav = simpleRepoNav;

    // If a script tag sets window.SIMPLE_REPO_NAV_LINKS before this loaded, honor it
    if (window.SIMPLE_REPO_NAV_LINKS && Array.isArray(window.SIMPLE_REPO_NAV_LINKS)) {
      simpleRepoNav.setLinks(window.SIMPLE_REPO_NAV_LINKS);
    }

    // Small CSS improvements injected for this widget (scoped global, safe)
    (function injectCSS() {
      if (document.getElementById('simple-repo-nav-style')) return;
      const s = createEl('style', { id: 'simple-repo-nav-style' });
      s.textContent = `
      #hudToggle_nav.holding { box-shadow: 0 0 36px rgba(255,12,110,0.9); transform: none; }
      aside#repoNav a.nav-item:hover { background: rgba(0,255,120,0.04); }
      aside#repoNav.open { transform: translateX(0) !important; }
      `;
      document.head.appendChild(s);
    })();

  } catch (err) {
    // surface errors in an obvious place so you can inspect on mobile/desktop
    console.error('repo-nav-simple error', err);
    window.__repoNavError = err && err.stack ? err.stack : String(err);
  }
})();
