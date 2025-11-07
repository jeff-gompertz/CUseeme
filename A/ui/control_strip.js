// Placeholder: wire actions later via data-action or postMessage
document.querySelectorAll('.hud-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log('Clicked:', btn.textContent.trim());
    // future: send status to parent page via postMessage or call data-action
  });
});
