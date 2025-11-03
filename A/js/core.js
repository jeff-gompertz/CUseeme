window.CUSeeMe = {
  version: "2.0.0",
  addTicker(msg) {
    const ticker = document.getElementById('ticker');
    const line = document.createElement('div');
    line.className = 'tline';
    line.textContent = msg;
    ticker.prepend(line);
    if (ticker.children.length > 80) ticker.removeChild(ticker.lastChild);
  },
  init() {
    this.addTicker(`CUSeeMe Modular v${this.version} ready`);
    if (window.initCamera) initCamera();
    if (window.initHUD) initHUD();
    if (window.initVoice) initVoice();
    if (window.initSemantic) initSemantic();
  }
};
window.addEventListener('DOMContentLoaded', () => CUSeeMe.init());
