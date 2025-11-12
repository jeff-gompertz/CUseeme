// live_camera_adapter.js
// Universal auto-switch for WordPress-video pages → Live Camera override

(async () => {
  // Check if camera mode is explicitly requested in HTML
  const useLiveCam = document.body.dataset.livecam === "true";

  if (!useLiveCam) {
    console.log("📡 Live camera adapter loaded but inactive (data-livecam=false)");
    return;
  }

  console.log("🎥 Live camera adapter active — requesting stream...");

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    const vids = document.querySelectorAll("video");
    vids.forEach(v => {
      v.srcObject = stream;
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.play().catch(()=>{});
    });

    console.log("✅ Live camera connected to all <video> elements");

  } catch (err) {
    console.error("⚠️ Camera permission denied or unavailable:", err);
  }

  // iOS / Safari unlock gesture
  const unlock = () => {
    document.querySelectorAll("video").forEach(v => v.play().catch(()=>{}));
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchend", unlock);
  };
  window.addEventListener("click", unlock, { once:true });
  window.addEventListener("touchend", unlock, { once:true });
})();
