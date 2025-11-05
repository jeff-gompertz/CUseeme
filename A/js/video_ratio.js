/* =========================================================
   video_ratio.js — handles live video aspect logic
   Used in: all video HUD scenes
   ========================================================= */

function setVideoRatio(videoEl, mode = 'portrait') {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  let width, height;

  if (mode === 'portrait') {
    // Standard TikTok / Instagram 9:16
    height = vpH * 0.72;       // 72% of viewport height
    width = height * (9 / 16); // maintain ratio
  } else if (mode === 'landscape') {
    // Standard YouTube / film 16:9
    width = vpW * 0.85;
    height = width * (9 / 16);
  } else {
    // fallback to square
    width = height = Math.min(vpW, vpH) * 0.6;
  }

  videoEl.style.width = `${width}px`;
  videoEl.style.height = `${height}px`;
  videoEl.style.borderRadius = '20px';
  videoEl.style.objectFit = 'cover';
  videoEl.style.position = 'absolute';
  videoEl.style.top = '50%';
  videoEl.style.left = '50%';
  videoEl.style.transform = 'translate(-50%, -50%)';
}

// Auto-adjust on load + resize
window.addEventListener('load', () => {
  const vid = document.getElementById('videoFeed');
  if (vid) setVideoRatio(vid, 'portrait');
});
window.addEventListener('resize', () => {
  const vid = document.getElementById('videoFeed');
  if (vid) setVideoRatio(vid, 'portrait');
});
