// Web Audio API sound effects — all tones generated procedurally.

let _ctx = null;
function ctx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function tone(type, freq, endFreq, duration, volume, startDelay = 0) {
  const ac   = ctx();
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  const t    = ac.currentTime + startDelay;

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== freq) osc.frequency.linearRampToValueAtTime(endFreq, t + duration);

  gain.gain.setValueAtTime(volume, t);
  gain.gain.linearRampToValueAtTime(0, t + duration);

  osc.start(t);
  osc.stop(t + duration);
}

window.sounds = {
  jump() {
    tone('square', 280, 560, 0.12, 0.15);
  },

  coin() {
    tone('square', 660, 660, 0.08, 0.12, 0.00);
    tone('square', 990, 990, 0.12, 0.10, 0.09);
  },

  stomp() {
    tone('square', 220, 80, 0.09, 0.20);
  },

  die() {
    // Three descending steps
    tone('square', 440, 440, 0.10, 0.15, 0.00);
    tone('square', 330, 330, 0.10, 0.15, 0.12);
    tone('square', 220, 110, 0.25, 0.15, 0.24);
  },

  win() {
    // Short ascending fanfare: C E G C
    const notes = [262, 330, 392, 524];
    notes.forEach((freq, i) => tone('square', freq, freq, 0.12, 0.13, i * 0.13));
  },
};
