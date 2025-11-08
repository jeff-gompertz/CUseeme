// control_strip_inject.js
// Placeholder: connects to existing CUSeeMe functions when injected.

document.querySelectorAll('.cs-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log(`Control pressed: ${btn.textContent.trim()}`);
    // Later: connect with HUD or camera controls here.
  });
});
