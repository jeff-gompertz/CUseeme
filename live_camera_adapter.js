// live_camera_adapter.js — LIVE CAM ONLY
(function () {
  async function getLiveVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      const v = document.createElement("video");
      v.srcObject = stream;
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.style.display = "none";
      document.body.appendChild(v);
      await v.play().catch(()=>{});
      return v;
    } catch (e) {
      console.warn("⚠️ Camera unavailable:", e);
      return null;
    }
  }

  // Public API (live only)
  window.LiveSource = {
    async get() {
      const v = await getLiveVideo();
      return v ? [v] : [];
    }
  };
})();
