/**
 * longpress-nav.js - Compact long-press navigation helper
 * Minimal, dependency-free module for long-press navigation with visual feedback
 */
(function() {
  'use strict';

  const DEFAULT_HOLD_DURATION = 800; // milliseconds
  const RING_SIZE = 64;
  const RING_STROKE = 4;

  // Inject minimal CSS for the overlay
  function injectStyles() {
    if (document.getElementById('longpress-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'longpress-nav-styles';
    style.textContent = `
      .longpress-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 10000;
        width: ${RING_SIZE}px;
        height: ${RING_SIZE}px;
        transform: translate(-50%, -50%);
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .longpress-overlay.active {
        opacity: 1;
      }
      .longpress-overlay svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
      }
    `;
    document.head.appendChild(style);
  }

  // Create SVG progress ring overlay
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'longpress-overlay';
    const radius = (RING_SIZE - RING_STROKE) / 2;
    const circumference = 2 * Math.PI * radius;
    
    overlay.innerHTML = `
      <svg viewBox="0 0 ${RING_SIZE} ${RING_SIZE}">
        <circle
          cx="${RING_SIZE / 2}"
          cy="${RING_SIZE / 2}"
          r="${radius}"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          stroke-width="${RING_STROKE}"
        />
        <circle
          class="progress-ring"
          cx="${RING_SIZE / 2}"
          cy="${RING_SIZE / 2}"
          r="${radius}"
          fill="none"
          stroke="rgba(100,200,255,0.9)"
          stroke-width="${RING_STROKE}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          stroke-linecap="round"
          transform="rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})"
          style="transition: stroke-dashoffset 0.05s linear"
        />
      </svg>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  }

  // Vibrate if supported
  function vibrate(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // Main long-press navigation class
  class LongPressNav {
    constructor(element, options = {}) {
      this.element = typeof element === 'string' ? document.getElementById(element) : element;
      if (!this.element) {
        console.warn('LongPressNav: element not found');
        return;
      }

      this.url = options.url || this.element.getAttribute('data-longpress-url');
      if (!this.url) {
        console.warn('LongPressNav: no URL specified');
        return;
      }

      this.holdDuration = options.holdDuration || DEFAULT_HOLD_DURATION;
      this.onProgress = options.onProgress || null;
      this.onComplete = options.onComplete || null;
      this.onCancel = options.onCancel || null;

      this.pressing = false;
      this.startTime = 0;
      this.animFrame = null;
      this.holdTimer = null;
      this.overlay = null;
      this.progressRing = null;

      this._boundHandlers = {
        pointerDown: this._handlePointerDown.bind(this),
        pointerUp: this._handlePointerUp.bind(this),
        pointerCancel: this._handlePointerCancel.bind(this),
        keyDown: this._handleKeyDown.bind(this),
        keyUp: this._handleKeyUp.bind(this)
      };

      this._attach();
    }

    _attach() {
      // Pointer events
      this.element.addEventListener('pointerdown', this._boundHandlers.pointerDown);
      this.element.addEventListener('pointerup', this._boundHandlers.pointerUp);
      this.element.addEventListener('pointercancel', this._boundHandlers.pointerCancel);
      this.element.addEventListener('pointerleave', this._boundHandlers.pointerUp);

      // Keyboard events (Space or Enter)
      this.element.addEventListener('keydown', this._boundHandlers.keyDown);
      this.element.addEventListener('keyup', this._boundHandlers.keyUp);

      // Make element focusable if not already
      if (!this.element.hasAttribute('tabindex')) {
        this.element.setAttribute('tabindex', '0');
      }
    }

    _handlePointerDown(e) {
      if (this.pressing) return;
      
      e.preventDefault();
      this.pressing = true;
      this.startTime = performance.now();

      // Create and position overlay
      if (!this.overlay) {
        this.overlay = createOverlay();
        this.progressRing = this.overlay.querySelector('.progress-ring');
      }

      const rect = this.element.getBoundingClientRect();
      this.overlay.style.left = (rect.left + rect.width / 2) + 'px';
      this.overlay.style.top = (rect.top + rect.height / 2) + 'px';
      
      // Small delay before showing overlay for better UX
      setTimeout(() => {
        if (this.pressing) {
          this.overlay.classList.add('active');
        }
      }, 50);

      vibrate(10);
      this._startProgressAnimation();
    }

    _handlePointerUp(e) {
      if (!this.pressing) return;
      this._cancel();
    }

    _handlePointerCancel(e) {
      if (!this.pressing) return;
      this._cancel();
    }

    _handleKeyDown(e) {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!this.pressing) {
          e.preventDefault();
          this._handlePointerDown(e);
        }
      }
    }

    _handleKeyUp(e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (this.pressing) {
          this._handlePointerUp(e);
        }
      }
    }

    _startProgressAnimation() {
      const radius = (RING_SIZE - RING_STROKE) / 2;
      const circumference = 2 * Math.PI * radius;

      const animate = () => {
        if (!this.pressing) return;

        const elapsed = performance.now() - this.startTime;
        const progress = Math.min(elapsed / this.holdDuration, 1);

        // Update progress ring
        if (this.progressRing) {
          const offset = circumference * (1 - progress);
          this.progressRing.style.strokeDashoffset = offset;
        }

        // Call progress callback
        if (this.onProgress) {
          this.onProgress(progress);
        }

        if (progress >= 1) {
          this._complete();
        } else {
          this.animFrame = requestAnimationFrame(animate);
        }
      };

      this.animFrame = requestAnimationFrame(animate);
    }

    _complete() {
      this.pressing = false;
      
      if (this.animFrame) {
        cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
      }

      if (this.overlay) {
        this.overlay.classList.remove('active');
      }

      vibrate([20, 10, 20]);

      if (this.onComplete) {
        this.onComplete();
      }

      // Navigate to URL
      window.location.href = this.url;
    }

    _cancel() {
      this.pressing = false;

      if (this.animFrame) {
        cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
      }

      if (this.overlay) {
        this.overlay.classList.remove('active');
      }

      if (this.onCancel) {
        this.onCancel();
      }
    }

    setHoldDuration(duration) {
      this.holdDuration = Math.max(100, duration);
    }

    destroy() {
      this._cancel();

      // Remove event listeners
      this.element.removeEventListener('pointerdown', this._boundHandlers.pointerDown);
      this.element.removeEventListener('pointerup', this._boundHandlers.pointerUp);
      this.element.removeEventListener('pointercancel', this._boundHandlers.pointerCancel);
      this.element.removeEventListener('pointerleave', this._boundHandlers.pointerUp);
      this.element.removeEventListener('keydown', this._boundHandlers.keyDown);
      this.element.removeEventListener('keyup', this._boundHandlers.keyUp);

      // Remove overlay
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }

      this.element = null;
      this.overlay = null;
      this.progressRing = null;
    }
  }

  // Auto-attach to elements with data-longpress-url on DOMContentLoaded
  function autoAttach() {
    const elements = document.querySelectorAll('[data-longpress-url]');
    elements.forEach(element => {
      if (!element._longPressNav) {
        element._longPressNav = new LongPressNav(element);
      }
    });
  }

  // Initialize styles
  injectStyles();

  // Auto-attach on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoAttach);
  } else {
    autoAttach();
  }

  // Expose public API
  window.makeLongPressNav = function(elementOrId, options) {
    return new LongPressNav(elementOrId, options);
  };

  // Also expose for manual attachment after dynamic content
  window.LongPressNav = LongPressNav;
})();
