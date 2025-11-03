function initSemantic() {
  const input = document.getElementById('input');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const text = input.value.trim();
      input.value = '';
      if (!text) return;
      CUSeeMe.addTicker('> ' + text);
      handleSemantic(text);
    }
  });
}
function handleSemantic(text) {
  const lower = text.toLowerCase();
  if (lower.includes('hello')) {
    CUSeeMe.addTicker('Hello, human.');
    if (window.speak) speak('Hello human.');
  } else if (lower.includes('spawn')) {
    spawnMiniWindows(3);
  } else if (lower.includes('reverse')) {
    reverseCamera();
  } else {
    CUSeeMe.addTicker('Unknown command.');
  }
}
