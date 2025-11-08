// controlstripinject.js — placeholder wiring for button logic
document.querySelectorAll('.ctrl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log(`Button pressed: ${btn.textContent.trim()}`);
  });
});