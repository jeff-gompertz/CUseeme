function initHUD() {
  const hudHeader = document.getElementById('hudHeader');
  hudHeader.addEventListener('click', () => CUSeeMe.addTicker('Mode Shift clicked'));
  document.getElementById('btnSpawn5').onclick = () => {
    if (window.spawnMiniWindows) spawnMiniWindows(5);
  };
  document.getElementById('btnCloseAll').onclick = () => {
    document.querySelectorAll('.miniWin').forEach(n => n.remove());
    CUSeeMe.addTicker('All mini windows closed');
  };
  document.getElementById('btnReverseCam').onclick = () => {
    if (window.reverseCamera) reverseCamera();
  };
}
