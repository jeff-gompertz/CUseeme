/**
 * longpress-nav.js
 * A compact, dependency-free long-press navigation helper
 * Auto-attaches to elements with data-longpress-url on DOMContentLoaded
 * Also exposes window.makeLongPressNav(elementOrId, options) for manual attachment
 */
(function() {
  'use strict';

  // Default configuration
  const DEFAULTS = {
    holdDuration: 800, // milliseconds
    ringSize: 80,
    ringStrokeWidth: 4,
    ringColor: 'rgba(255, 255, 255, 0.9)',
    bgColor: 'rgba(0, 0, 0, 0.3)',
    vibrateOnStart: true,
    vibrateOnComplete: true,
    vibratePattern: [10],
    vibrateCompletePattern: [20, 10, 20],
    moveTolerancePx: 50,
    url: null,
    onStart: null,
    onProgress: null,
    onComplete: null,
    onCancel: null
  };

  // Inject minimal CSS for overlay
  function injectCSS() {
    if (document.getElementById('longpress-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'longpress-nav-styles';
    style.textContent = `
      .longpress-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .longpress-overlay svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
    `;
    document.head.appendChild(style);
  }

  // Create SVG progress ring
  function createProgressRing(size, strokeWidth, ringColor, bgColor) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', center);
    bgCircle.setAttribute('cy', center);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('fill', bgColor);
    bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
    bgCircle.setAttribute('stroke-width', strokeWidth / 2);

    // Progress circle
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('cx', center);
    progressCircle.setAttribute('cy', center);
    progressCircle.setAttribute('r', radius);
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke', ringColor);
    progressCircle.setAttribute('stroke-width', strokeWidth);
    progressCircle.setAttribute('stroke-dasharray', circumference);
    progressCircle.setAttribute('stroke-dashoffset', circumference);
    progressCircle.setAttribute('stroke-linecap', 'round');
    progressCircle.setAttribute('transform', `rotate(-90 ${center} ${center})`);

    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);

    return { svg, progressCircle, circumference };
  }

  // Vibrate helper
  function vibrate(pattern) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silent fail on vibrate errors
      }
    }
  }

  // Main long-press handler factory
  function makeLongPressNav(elementOrId, options = {}) {
    const config = { ...DEFAULTS, ...options };
    
    // Get element
    const element = typeof elementOrId === 'string' 
      ? document.getElementById(elementOrId) || document.querySelector(elementOrId)
      : elementOrId;
    
    if (!element) {
      console.warn('longpress-nav: element not found', elementOrId);
      return null;
    }

    // Ensure CSS is injected
    injectCSS();

    // State
    let isHolding = false;
    let startTime = 0;
    let animationFrame = null;
    let overlay = null;
    let progressCircle = null;
    let circumference = 0;
    let keyboardHold = false;
    let destroyed = false;

    // Create overlay
    function createOverlay(x, y) {
      if (overlay) return;

      overlay = document.createElement('div');
      overlay.className = 'longpress-overlay';
      
      const { svg, progressCircle: pc, circumference: circ } = createProgressRing(
        config.ringSize,
        config.ringStrokeWidth,
        config.ringColor,
        config.bgColor
      );

      progressCircle = pc;
      circumference = circ;
      overlay.appendChild(svg);

      // Position overlay
      if (x !== undefined && y !== undefined) {
        overlay.style.left = `${x - config.ringSize / 2}px`;
        overlay.style.top = `${y - config.ringSize / 2}px`;
        overlay.style.width = `${config.ringSize}px`;
        overlay.style.height = `${config.ringSize}px`;
        document.body.appendChild(overlay);
      } else {
        // Center on element
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        element.style.position = element.style.position || 'relative';
        element.appendChild(overlay);
      }
    }

    // Remove overlay
    function removeOverlay() {
      if (overlay) {
        overlay.remove();
        overlay = null;
        progressCircle = null;
      }
    }

    // Update progress
    function updateProgress() {
      if (!isHolding || !progressCircle) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / config.holdDuration, 1);
      const offset = circumference * (1 - progress);
      
      progressCircle.setAttribute('stroke-dashoffset', offset);

      if (config.onProgress) {
        config.onProgress(progress);
      }

      if (progress >= 1) {
        complete();
      } else {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    }

    // Start hold
    function start(x, y) {
      if (isHolding || destroyed) return;

      isHolding = true;
      startTime = Date.now();

      createOverlay(x, y);

      if (config.vibrateOnStart) {
        vibrate(config.vibratePattern);
      }

      if (config.onStart) {
        config.onStart();
      }

      animationFrame = requestAnimationFrame(updateProgress);
    }

    // Cancel hold
    function cancel() {
      if (!isHolding) return;

      isHolding = false;
      keyboardHold = false;

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      removeOverlay();

      if (config.onCancel) {
        config.onCancel();
      }
    }

    // Complete hold
    function complete() {
      if (!isHolding) return;

      isHolding = false;
      keyboardHold = false;

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      if (config.vibrateOnComplete) {
        vibrate(config.vibrateCompletePattern);
      }

      removeOverlay();

      if (config.onComplete) {
        config.onComplete();
      }

      // Navigate if URL is provided
      if (config.url) {
        window.location.href = config.url;
      }
    }

    // Pointer event handlers
    function onPointerDown(e) {
      if (destroyed) return;
      
      // Get position relative to viewport
      const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
      const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);
      
      start(x, y);
    }

    function onPointerMove(e) {
      if (!isHolding) return;
      
      // Check if pointer moved too far from element
      const rect = element.getBoundingClientRect();
      const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
      const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);
      const tolerance = config.moveTolerancePx;
      
      if (x < rect.left - tolerance || x > rect.right + tolerance || 
          y < rect.top - tolerance || y > rect.bottom + tolerance) {
        cancel();
      }
    }

    function onPointerUp(e) {
      cancel();
    }

    function onPointerCancel(e) {
      cancel();
    }

    // Keyboard event handlers
    function onKeyDown(e) {
      if (destroyed) return;
      if (e.repeat) return; // Ignore repeated keydown events
      if (e.key === ' ' || e.key === 'Enter') {
        if (!keyboardHold) {
          e.preventDefault();
          keyboardHold = true;
          start();
        }
      }
    }

    function onKeyUp(e) {
      if (e.key === ' ' || e.key === 'Enter') {
        if (keyboardHold) {
          e.preventDefault();
          cancel();
        }
      }
    }

    // Attach event listeners
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('touchstart', onPointerDown, { passive: true });
    
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: true });
    
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('touchend', onPointerUp);
    document.addEventListener('touchcancel', onPointerCancel);

    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('keyup', onKeyUp);

    // Public API
    return {
      cancel: cancel,
      destroy: function() {
        if (destroyed) return;
        destroyed = true;
        cancel();
        
        element.removeEventListener('pointerdown', onPointerDown);
        element.removeEventListener('touchstart', onPointerDown);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerCancel);
        document.removeEventListener('touchend', onPointerUp);
        document.removeEventListener('touchcancel', onPointerCancel);
        element.removeEventListener('keydown', onKeyDown);
        element.removeEventListener('keyup', onKeyUp);
      },
      setHoldDuration: function(duration) {
        config.holdDuration = duration;
      }
    };
  }

  // Auto-attach on DOMContentLoaded
  function autoAttach() {
    // Look for elements with data-longpress-url
    const elements = document.querySelectorAll('[data-longpress-url]');
    elements.forEach(element => {
      const url = element.getAttribute('data-longpress-url');
      const duration = element.getAttribute('data-longpress-duration');
      
      const options = { url };
      if (duration) {
        options.holdDuration = parseInt(duration, 10);
      }
      
      makeLongPressNav(element, options);
    });
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoAttach);
  } else {
    autoAttach();
  }

  // Expose to window
  window.makeLongPressNav = makeLongPressNav;

})();
