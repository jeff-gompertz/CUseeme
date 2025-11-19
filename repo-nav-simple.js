(function () {
  function safe(v, fallback) { return (typeof v === 'string' && v) ? v : fallback; }

  function injectStyles() {
    if (document.head.querySelector('[data-repo-nav-styles]')) return;
    const css = `
      /* scoped repo nav styles */
      #repoNav { position: fixed; top: 18px; right: 18px; z-index: 12050; display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
      #repoNavBtn { background:#0b6d2b; color:#e9ffe9; border:none; padding:8px 10px; border-radius:8px; font-family:inherit; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.35); -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
      #repoNavPanel { display:none; min-width:220px; padding:10px 12px; background:rgba(10,10,12,0.92); color:#bfffbf; border-radius:10px; border:1px solid rgba(0,160,60,0.10); box-shadow:0 12px 30px rgba(0,0,0,0.55); text-align:left; -webkit-touch-callout:none; user-select:none; }
      #repoNavPanel .repoNavBtn { display:block; width:100%; text-align:left; color:inherit; background:transparent; border:none; padding:8px 6px; font-size:14px; font-family:inherit; cursor:pointer; -webkit-user-select:none; user-select:none; }
      #repoNavPanel .repoNavBtn:hover { color:#fff; background:rgba(255,255,255,0.02); }
      #repoNavPanel small { display:block; margin-top:6px; opacity:0.7; font-size:12px; }
      /* keyboard focus */
      #repoNavPanel .repoNavBtn:focus { outline:2px solid rgba(255,255,255,0.12); outline-offset:2px; }

      /* Prevent selection/touch callouts and keep small hover styles */
      #hudToggle_nav.holding { box-shadow: 0 0 36px rgba(255,12,110,0.9); transform: none; }
      aside#repoNav .nav-item:hover, aside#repoNav .repoNavBtn:hover { background: rgba(0,255,120,0.04); }
      aside#repoNav.open { transform: translateX(0) !important; }
      /* Disable text selection / iOS touch callout on nav controls */
      aside#repoNav, #hudToggle_nav, aside#repoNav * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }
      /* Keep focus styles accessible when keyboard/tabbing */
      aside#repoNav button:focus { outline: 2px solid rgba(255,255,255,0.08); outline-offset: 2px; }
    `;
    const s = document.createElement('style');
    s.setAttribute('data-repo-nav-styles', '1');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function buildNav(links) {
    if (!links || !links.length) return null;

    // avoid duplicate injection
    if (document.getElementById('repoNav')) return document.getElementById('repoNav');

    const root = document.createElement('div');
    root.id = 'repoNav';
    root.setAttribute('aria-hidden', 'false');

    const btn = document.createElement('button');
    btn.id = 'repoNavBtn';
    btn.type = 'button';
    btn.title = 'Repository NAV';
    btn.textContent = 'NAV';
    btn.setAttribute('aria-expanded', 'false');

    const panel = document.createElement('div');
    panel.id = 'repoNavPanel';
    panel.setAttribute('role', 'menu');
    panel.setAttribute('aria-hidden', 'true');

    // build buttons (not anchor tags)
    links.forEach(link => {
      const t = safe(link.title, '(link)');
      const href = safe(link.href, '');
      const target = safe(link.target, '_self');

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'repoNavBtn';
      item.innerHTML = t;
      // store href as dataset to avoid making it an <a>
      if (href) item.dataset.href = href;
      if (target) item.dataset.target = target;

      item.addEventListener('click', (e) => {
        e.preventDefault();

        // special-case buttons that should call existing on-page controls:
        // if data-href looks like an element id (starts with '#') or looks like btnName
        const hrefVal = item.dataset.href || '';  
        if (hrefVal.startsWith('#')) {
          const id = hrefVal.slice(1);
          const existing = document.getElementById(id);
          if (existing) { existing.click(); return; }
        }

        // as a heuristic: if href refers to an on-page button name (btnSpawn5 etc.), try to find it by id
        if (/^btn/i.test(hrefVal)) {
          const existing = document.getElementById(hrefVal);
          if (existing) { existing.click(); return; }
        }

        // otherwise navigate programmatically so the browser treats it as a script nav (not a long-press anchor)
        if (hrefVal) {
          if (item.dataset.target === '_blank') {
            window.open(hrefVal, '_blank', 'noopener');
          } else {
            window.location.href = hrefVal;
          }
        }
      });

      // block context menu on the button itself
      item.addEventListener('contextmenu', (ev) => ev.preventDefault());

      panel.appendChild(item);
    });

    const tip = document.createElement('small');
    tip.textContent = 'Tip: tap a button to run';
    panel.appendChild(tip);

    root.appendChild(btn);
    root.appendChild(panel);

    // interactions
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const showing = panel.style.display === 'block';
      panel.style.display = showing ? 'none' : 'block';
      panel.setAttribute('aria-hidden', String(!showing));
      btn.setAttribute('aria-expanded', String(!showing));
    });

    // hide when clicking/tapping outside
    document.addEventListener('pointerdown', (ev) => {
      if (!root.contains(ev.target)) {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Prevent system context menu on nav area
    root.addEventListener('contextmenu', (ev) => ev.preventDefault());

    return root;
  }

  // Wait until DOM ready if not already
  function init() {
    try {
      const links = window.SIMPLE_REPO_NAV_LINKS || [];
      if (!links || !links.length) return;

      injectStyles();

      // Build and append nav
      const nav = buildNav(links);
      if (nav) {
        // prefer prepending so it's visually above most content
        document.body.appendChild(nav);
      }

      // post-insert hardening: disable touchcallout etc (already handled in CSS but this helps)
      const repoRoot = document.getElementById('repoNav');
      if (repoRoot) {
        repoRoot.style.webkitTouchCallout = 'none';
        repoRoot.style.userSelect = 'none';
        // ensure repositioning occurs if needed
        setTimeout(() => { if (typeof window.repositionMiniWins === 'function') window.repositionMiniWins(); }, 80);
      }
    } catch (err) {
      console.warn('repo-nav-simple init error', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
