// Layout Skeleton v2.1 — HUD animation + toggle
console.log("Layout skeleton v2.1 active.");
const hudBox = document.getElementById("hud-value");
let t = 0;
setInterval(() => {
  t += 0.05;
  hudBox.textContent = "HUD value: " + (Math.sin(t) * 50).toFixed(2);
}, 100);
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h") {
    document.getElementById("hud").classList.toggle("hidden");
  }
});
