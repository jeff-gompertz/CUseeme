let mediaStream = null, facing = 'environment';
async function initCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false });
    document.getElementById('cameraMain').srcObject = mediaStream;
    CUSeeMe.addTicker(`Camera initialized (${facing})`);
  } catch (err) {
    CUSeeMe.addTicker('⚠ Camera access denied');
  }
}
function spawnMiniWindows(n = 5) {
  for (let i = 0; i < n; i++) makeMiniWindow({ x: 60 + i * 26, y: 120 + i * 18 });
  CUSeeMe.addTicker(`Spawned ${n} windows`);
}
function makeMiniWindow({ x = 80, y = 80 } = {}) {
  const el = document.createElement('div');
  el.className = 'miniWin';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.innerHTML = `<div class="miniBar">subject_${Date.now().toString().slice(-4)}</div>
    <video class="miniVideo" autoplay muted playsinline></video>`;
  document.body.appendChild(el);
  const vid = el.querySelector('video');
  if (mediaStream) vid.srcObject = mediaStream;
  makeDraggable(el);
}
function makeDraggable(el) {
  let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;
  el.addEventListener('pointerdown', e => {
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    const r = el.getBoundingClientRect();
    origX = r.left; origY = r.top;
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    el.style.left = origX + (e.clientX - startX) + 'px';
    el.style.top = origY + (e.clientY - startY) + 'px';
  });
  window.addEventListener('pointerup', () => dragging = false);
}
function reverseCamera() {
  facing = (facing === 'user') ? 'environment' : 'user';
  initCamera();
}
