/* =========================================================
HUD Logic — CUSeeMe Modular
Universal HUD controls
========================================================= */

// voice toggle state
let voiceEnabled = true;

// safely attach handlers after HUD loads
window.addEventListener("DOMContentLoaded", () => {

  const micBtn = document.getElementById("btnMic");
  const voiceBtn = document.getElementById("btnVoice");
  const nextBtn = document.getElementById("btnNext");
  const input = document.getElementById("hudInput");

  // 🟢 Mic button
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      console.log("🎙 Mic toggle pressed");
      micBtn.classList.toggle("active");
    });
  }

  // 🟣 Voice button
  if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;
      voiceBtn.textContent = voiceEnabled ? "🎧 Voice On" : "🔇 Voice Off";
      voiceBtn.classList.toggle("active", voiceEnabled);
    });
  }

  // 🔵 Next button → loads next scene
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      console.log("➡ Mode Shift → Loading next scene...");
      window.location.href = "video_scene2_.html"; // adjust as needed
    });
  }

  // 🟡 Input field feedback
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        console.log("User typed:", input.value);
        input.value = "";
      }
    });
  }

});
