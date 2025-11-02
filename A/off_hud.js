// =========================================================
// HUD.js — self-contained Neumorphic HUD control module
// v1.0 (for CUSeeMe Modular v1.9.4)
// =========================================================

class HUD {
  constructor(selector) {
    this.hud = document.querySelector(selector);
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.startX = 0;
    this.startY = 0;
    this.snapMargin = 12;
    this.screenW = window.innerWidth;
    this.screenH = window.innerHeight;

    this.init();
  }

  init() {
    // 🟢 Unified pointer event model
    this.hud.addEventListener('pointerdown', e => this.startDrag(e));
    window.addEventListener('pointermove', e => this.onDrag(e));
    window.addEventListener('pointerup', () => this.endDrag());
    window.addEventListener('resize', () => this.onResize());
  }

  startDrag(e) {
    if (e.target.closest('button')) return; // let buttons work normally
    this.dragging = true;
    const rect = this.hud.getBoundingClientRect();
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.offsetX = rect.left;
    this.offsetY = rect.top;
    this.hud.style.transition = 'none';
    e.preventDefault();
  }

  onDrag(e) {
    if (!this.dragging) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    this.hud.style.position = 'fixed';
    this.hud.style.left = `${this.offsetX + dx}px`;
    this.hud.style.top = `${this.offsetY + dy}px`;
  }

  endDrag() {
    if (!this.dragging) return;
    this.dragging = false;

    // 🧲 Soft snap-to-edge logic
    const rect = this.hud.getBoundingClientRect();
    let snapX = rect.left;
    if (rect.left + rect.width / 2 > this.screenW / 2)
      snapX = this.screenW - rect.width - this.snapMargin;
    else
      snapX = this.snapMargin;

    const snapY = Math.min(
      Math.max(rect.top, this.snapMargin),
      this.screenH - rect.height - this.snapMargin
    );

    this.hud.style.transition = 'all 0.35s cubic-bezier(0.23,1,0.32,1)';
    this.hud.style.left = `${snapX}px`;
    this.hud.style.top = `${snapY}px`;
  }

  onResize() {
    this.screenW = window.innerWidth;
    this.screenH = window.innerHeight;
  }
}

// Auto-init when loaded
window.addEventListener('DOMContentLoaded', () => {
  const hudEl = document.querySelector('#hudShell');
  if (hudEl) new HUD('#hudShell');
});
