let voiceEnabled = false;
async function initVoice() {
  CUSeeMe.addTicker('Voice system ready');
}
function speak(text) {
  if (!voiceEnabled) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-GB';
  utter.rate = 1.05;
  utter.pitch = 1.0;
  utter.voice = speechSynthesis.getVoices().find(v => /UK|en-GB|Angela/i.test(v.name)) || null;
  speechSynthesis.speak(utter);
}
document.getElementById('btnVoice').onclick = () => {
  voiceEnabled = !voiceEnabled;
  CUSeeMe.addTicker(`Voice ${voiceEnabled ? 'enabled' : 'disabled'}`);
  if (voiceEnabled) speak('Voice system online.');
};
