let audioCtx: AudioContext | null = null;
let soundOn = true;
let hapticsOn = true;

export function setSfxEnabled(sound: boolean, haptics: boolean) {
  soundOn = sound;
  hapticsOn = haptics;
}

function ctx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(freq: number, startOffset: number, dur: number, opts: { type?: OscillatorType; peak?: number } = {}) {
  const c = ctx();
  if (!c || !soundOn) return;
  const { type = 'sine', peak = 0.2 } = opts;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.02, dur / 4));
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** 軽いタップ音。ボタン押下すべてに使う短いクリック */
export function playTap() {
  tone(1500, 0, 0.045, { type: 'sine', peak: 0.06 });
}

/** タイマー開始・予定を決めた時など「種をまく」印象の音 */
export function playStart() {
  tone(660, 0, 0.12, { peak: 0.16 });
  tone(880, 0.09, 0.16, { peak: 0.18 });
}

/** ポモドーロの作業/休憩切り替え */
export function playPhaseChange() {
  tone(880, 0, 0.16, { peak: 0.2 });
  tone(1108, 0.18, 0.2, { peak: 0.2 });
}

/** 集中モード完走時の収穫ファンファーレ */
export function playComplete() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.3, { peak: 0.2 }));
}

/** 装飾・住人の解禁 */
export function playUnlock() {
  [880, 1174.66, 1567.98].forEach((f, i) => tone(f, i * 0.06, 0.2, { type: 'triangle', peak: 0.16 }));
}

/** 集中が途切れた時のしおれる音 */
export function playWither() {
  tone(392, 0, 0.26, { type: 'sine', peak: 0.14 });
  tone(311.13, 0.16, 0.38, { type: 'sine', peak: 0.12 });
}

/** 離席の警告(戻ってきた瞬間、まだ猶予内で使う軽い注意音) */
export function playWarn() {
  tone(220, 0, 0.14, { type: 'square', peak: 0.05 });
}

export function vibrate(pattern: number | number[]) {
  if (!hapticsOn) return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // 無視
    }
  }
}

export const haptics = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  success: () => vibrate([15, 40, 15]),
  warn: () => vibrate([80, 40, 80]),
};

export function notifyPhaseChange() {
  playPhaseChange();
  haptics.medium();
}

// --- 集中中だけの環境音(誘惑バンドリング) ---
// 著作権のある音源は使わず、フィルタしたノイズで波音風の環境音を合成する
let ambient: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

export function startAmbient() {
  const c = ctx();
  if (!c || ambient) return;
  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;

  const gain = c.createGain();
  gain.gain.value = 0;

  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
  gain.gain.linearRampToValueAtTime(soundOn ? 0.05 : 0, c.currentTime + 1.5);
  ambient = { src, gain };
}

export function stopAmbient() {
  if (!ambient) return;
  const c = ctx();
  const { src, gain } = ambient;
  if (c) gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
  setTimeout(() => {
    try {
      src.stop();
    } catch {
      // 既に停止済み
    }
  }, 700);
  ambient = null;
}
