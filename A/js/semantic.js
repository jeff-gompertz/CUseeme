/* =========================================================
semantic.js v2.0 — Bloople RSS → Ticker + Speech Synthesis
========================================================= */

console.log("semantic.js loaded — initializing semantic voice feed");

const RSS_CONTAINER_ID = "rssSource";  // must match <div id="rssSource"></div> in HTML
const TICKER_ID = "ticker";            // where we'll display headlines
const VOICE_LANG = "en-GB";            // British voice tone

let voiceReady = false;
let feedIndex = 0;
let headlines = [];

/* ---- Prime SpeechSynthesis ---- */
function initVoices() {
  return new Promise(resolve => {
    const check = setInterval(() => {
      const v = speechSynthesis.getVoices();
      if (v.length > 0) {
        clearInterval(check);
        voiceReady = true;
        resolve(v);
      }
    }, 100);
  });
}

/* ---- Speak One Line ---- */
async function speakLine(text) {
  if (!voiceReady) await initVoices();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = VOICE_LANG;
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 0.9;
  const voices = speechSynthesis.getVoices();
  utter.voice = voices.find(v => /UK|English|British/i.test(v.name)) || voices[0];
  speechSynthesis.speak(utter);
}

/* ---- Extract and Clean RSS Lines ---- */
function parseRSSFeed() {
  const rssContainer = document.getElementById(RSS_CONTAINER_ID);
  if (!rssContainer) {
    console.warn("RSS container not found");
    return;
  }
  const text = rssContainer.innerText.trim();
  if (!text) {
    console.warn("No RSS text found yet");
    return;
  }
  // split into individual items (Bloople outputs <p> elements)
  headlines = text.split(/\n+/).map(line =>
    line.replace(/(<([^>]+)>)/gi, "").trim()
  ).filter(Boolean);
  console.log("Parsed headlines:", headlines);
}

/* ---- Display + Speak Loop ---- */
function runSemanticLoop() {
  const ticker = document.getElementById(TICKER_ID);
  if (!ticker || headlines.length === 0) return;

  const line = headlines[feedIndex % headlines.length];
  ticker.textContent = line;
  speakLine(line);

  feedIndex++;
  setTimeout(runSemanticLoop, 8000); // change every 8 seconds
}

/* ---- Initialize System ---- */
window.addEventListener("load", () => {
  console.log("Semantic system booting...");
  setTimeout(() => {
    parseRSSFeed();
    runSemanticLoop();
  }, 3000); // delay to allow Bloople feed to load
});
