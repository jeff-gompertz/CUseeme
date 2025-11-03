// === PROMPT + RESPONSE ===
const form = document.getElementById("promptForm");
const input = document.getElementById("input");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const val = input.value.trim();
  if (!val) return;

  addTickerLine("> " + val);
  input.value = "";

  const responses = [
    `system echo: "${val}" acknowledged`,
    `field response latency: ${(Math.random() * 0.8 + 0.2).toFixed(2)} s`,
    `semantic drift detected in "${val}"`,
    `resonance pattern: ${Math.floor(Math.random() * 100)}% correlation`,
    `"${val}" logged in memory bank`,
  ];

  const reply = responses[Math.floor(Math.random() * responses.length)];
  addTickerLine("< " + reply);
  await speakLine(reply);

  fetchWPFeed(val);
});
