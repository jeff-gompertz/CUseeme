/* =========================================================
HUD CORE — Unified Control Layer
Version: v1.0
Dependencies: core.js (optional), voice.js (optional), hud.js (optional)
Author: Jeff Gompertz x ChatGPT system design
========================================================= */

console.log("HUD Core initialized v1.0");

// -------------------------------
// GLOBAL STATE
// -------------------------------
let currentScene = 1;
let totalScenes = 5;
let rearCamera = true;
let localStream = null;
let speakEnabled = true;

// -------------------------------
// ELEMENTS
// -------------------------------
const videoEl = document.getElementById("videoLive");
const micBtn = document.getElementById("btnMic");
const voiceBtn = document.getElementById("btnVoice");
const flipBtn = document.getElementById("btnFlip");
const nextBtn = document.getElementById("btnNext");
const hudHeader = document.getElementById("hudHeader");
const hudIndex = document.getElementById("hudIndex");
const logEl = document.getElementById("log");

// -------------------------------
// BASIC UTILITIES
// -------------------------------
function logLine(msg, type = "note") {
  if (!logEl) return console.log(msg);
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.color = type === "error" ? "#ff3a2f" : "#444";
  el.style.fontSize = "14px";
  el.style.marginBottom = "2px";
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
  console.log(msg);
}

function speak(text) {
  if (!speakEnabled || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  u.rate = 1.02; u.pitch = 0.95; u.volume = 0.9;
  speechSynthesis.speak(u);
}

// -------------------------------
// CAMERA SETUP
// -------------------------------
async function initCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    logLine("⚠ camera not supported", "error");
    return;
  }

  const constraints = {
    video: {
      facingMode: rearCamera ? { exact: "environment" } : "user"
    },
    audio: false
  };

  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoEl) {
      videoEl.srcObject = localStream;
      videoEl.play();
      videoEl.style.position = "fixed";
      videoEl.style.inset = "0";
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
      videoEl.style.objectFit = "cover";
      videoEl.style.zIndex = "1";
    }
    logLine(`🎥 camera active (${rearCamera ? "rear" : "front"})`);
  } catch (err) {
    logLine("⚠ camera error: " + err.message, "error");
  }
}

// -------------------------------
// CAMERA TOGGLE
// -------------------------------
async function toggleCamera() {
  rearCamera = !rearCamera;
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }
  await initCamera();
}

// -------------------------------
// VOICE CONTROL
// -------------------------------
function toggleVoice() {
  speakEnabled = !speakEnabled;
  if (voiceBtn) {
    voiceBtn.textContent = speakEnabled ? "🔊 Voice On" : "🔇 Voice Off";
    voiceBtn.classList.toggle("on", speakEnabled);
  }
  logLine(`Spoken replies ${speakEnabled ? "enabled" : "disabled"}`);
  if (speakEnabled) speak("Voice enabled");
}

// -------------------------------
// NAVIGATION (Next Scene)
// -------------------------------
function goNextScene() {
  currentScene++;
  if (currentScene > totalScenes) currentScene = 1;
  const nextURL = `video_scene${currentScene}_.html`;
  logLine(`➡ Switching to ${nextURL}`);
  speak("Switching mode");
  setTimeout(() => {
    window.location.href = nextURL;
  }, 800);
}

// -------------------------------
// EVENT BINDINGS
// -------------------------------
if (micBtn) {
  micBtn.addEventListener("click", () => {
    logLine("🎙️ mic pressed");
    speak("Mic input ready");
  });
}
if (voiceBtn) voiceBtn.addEventListener("click", toggleVoice);
if (flipBtn) flipBtn.addEventListener("click", toggleCamera);
if (nextBtn) nextBtn.addEventListener("click", goNextScene);

// -------------------------------
// INIT
// -------------------------------
window.addEventListener("DOMContentLoaded", () => {
  if (hudHeader) hudHeader.textContent = "HUD — Video Scene " + currentScene;
  if (hudIndex) hudIndex.textContent = `${currentScene} / ${totalScenes}`;
  initCamera();
  logLine("index: hud_core.js loaded");
  logLine("retro4.4 aqua glass active");
  logLine("rear camera default");
});
