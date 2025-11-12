// live_camera_adapter.js
// Replaces ALL <video> elements on the page with a live camera stream
// after a first user interaction (tap/click). Works on iOS Safari.

(function () {
  let started = false;
  let stream = null;

  async function startCamera() {
    if (started) return;
    started = true;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      const vids = document.querySelectorAll("video");
      vids.forEach(v => {
        // Keep any sizing/styles already on the <video>
        v.muted = true;
        v.playsInline = true;
        v.autoplay = true;
        v.srcObject = stream;
        v.play().catch(() => {});
      });

      console.log("🎥 Live camera attached to all <video> elements.");
    } catch (err) {
      console.error("⚠️ Camera access failed:", err);
      alert("Camera permission was denied or unavailable.");
    }
  }

  // iOS/Android: require a user gesture to start
  const unlock = () => {
    startCamera();
    window.removeEventListener("touchend", unlock);
    window.removeEventListener("click", unlock);
  };

  window.addEventListener("touchend", unlock, { once: true });
  window.addEventListener("click", unlock, { once: true });
})();
