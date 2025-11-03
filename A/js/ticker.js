// === TICKER CONSOLE ===
const ticker = document.getElementById("ticker");

export function addTickerLine(text) {
  const el = document.createElement("div");
  el.className = "tline";
  el.textContent = text;
  ticker.prepend(el);
  if (ticker.children.length > 50) ticker.removeChild(ticker.lastChild);
  setTimeout(() => (el.style.opacity = 0.15), 45000);
}
