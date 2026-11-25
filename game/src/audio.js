// audio.js — semua suara disintesis WebAudio, tanpa file eksternal.
// SFX: potong, masak (desis), plating, lonceng saji, gagal, koin.
// Musik: loop pentatonik pelan khas warung senja, tempo naik saat rush.

export function createAudio() {
  let ctx = null;
  let musicTimer = null;
  let step = 0;
  const MELODY = [392, 440, 523, 587, 659, 587, 523, 440, 392, 330, 392, 440];
  const BASS = [131, 131, 175, 196, 175, 131];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, gain, filterFreq) {
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const len = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t);
  }

  const api = {
    unlock() { ensure(); },
    chop() { noise(0.08, 0.5, 2400); tone(180, 0.07, 'square', 0.12); },
    sizzle() { noise(0.5, 0.18, 5200); },
    pickup() { tone(520, 0.09, 'sine', 0.18, 0, 760); },
    place() { tone(330, 0.1, 'triangle', 0.2); tone(495, 0.12, 'triangle', 0.15, 0.06); },
    bell() { tone(880, 0.5, 'sine', 0.25); tone(1318, 0.6, 'sine', 0.15, 0.05); },
    coin() { tone(988, 0.1, 'square', 0.12); tone(1319, 0.22, 'square', 0.12, 0.09); },
    fail() { tone(220, 0.3, 'sawtooth', 0.15, 0, 110); },
    startMusic(rush) {
      api.stopMusic();
      const beat = rush ? 0.26 : 0.42;
      musicTimer = window.setInterval(() => {
        if (api.muted) return;
        const note = MELODY[step % MELODY.length];
        const bass = BASS[Math.floor(step / 2) % BASS.length];
        tone(note, 0.3, 'triangle', 0.07);
        if (step % 2 === 0) tone(bass, 0.4, 'sine', 0.09);
        step += 1;
      }, beat * 1000);
    },
    stopMusic() {
      if (musicTimer !== null) { window.clearInterval(musicTimer); musicTimer = null; }
    },
    muted: false,
  };
  return api;
}
