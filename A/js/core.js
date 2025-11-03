// === CAMERA BACKGROUND ===
(async () => {
  const cam = document.getElementById("camera");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    cam.srcObject = stream;
  } catch (e) {
    console.warn("Camera unavailable:", e);
  }
})();
