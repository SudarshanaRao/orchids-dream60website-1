// Generate notification sound WAV files
const fs = require('fs');
const path = require('path');

function generateWav(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }
  return buffer;
}

function envelope(t, attack, decay, sustain, release, duration) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < duration - release) return sustain;
  return sustain * ((duration - t) / release);
}

const SR = 44100;
const outDir = path.join(__dirname, '..', 'public', 'sounds');

// 1. Classic Alert - two ascending tones
function classicAlert() {
  const dur = 0.6;
  const samples = new Float64Array(Math.floor(SR * dur));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const freq = t < 0.3 ? 880 : 1100;
    const env = envelope(t < 0.3 ? t : t - 0.3, 0.01, 0.05, 0.7, 0.1, 0.3);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.6;
  }
  return samples;
}

// 2. Gentle Chime - soft bell-like
function gentleChime() {
  const dur = 1.0;
  const samples = new Float64Array(Math.floor(SR * dur));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const env = Math.exp(-3 * t);
    samples[i] = (
      Math.sin(2 * Math.PI * 523.25 * t) * 0.5 +
      Math.sin(2 * Math.PI * 659.25 * t) * 0.3 +
      Math.sin(2 * Math.PI * 783.99 * t) * 0.2
    ) * env * 0.5;
  }
  return samples;
}

// 3. Urgent Alarm - rapid beeping
function urgentAlarm() {
  const dur = 1.0;
  const samples = new Float64Array(Math.floor(SR * dur));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const beepOn = Math.floor(t * 8) % 2 === 0;
    const env = beepOn ? 0.7 : 0;
    samples[i] = Math.sin(2 * Math.PI * 1000 * t) * env;
  }
  return samples;
}

// 4. Success Fanfare - ascending arpeggio
function successFanfare() {
  const dur = 1.2;
  const samples = new Float64Array(Math.floor(SR * dur));
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const noteLen = dur / notes.length;
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const noteIdx = Math.min(Math.floor(t / noteLen), notes.length - 1);
    const noteT = t - noteIdx * noteLen;
    const env = Math.exp(-2 * noteT);
    samples[i] = Math.sin(2 * Math.PI * notes[noteIdx] * t) * env * 0.5;
  }
  return samples;
}

// 5. Soft Pop - bubble pop
function softPop() {
  const dur = 0.3;
  const samples = new Float64Array(Math.floor(SR * dur));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const freq = 800 - 400 * t / dur;
    const env = Math.exp(-8 * t);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.7;
  }
  return samples;
}

// 6. Digital Ring - phone-like ring
function digitalRing() {
  const dur = 1.5;
  const samples = new Float64Array(Math.floor(SR * dur));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const ringOn = Math.sin(2 * Math.PI * 20 * t) > 0;
    const env = ringOn ? 0.5 : 0;
    samples[i] = (
      Math.sin(2 * Math.PI * 440 * t) +
      Math.sin(2 * Math.PI * 480 * t)
    ) * env * 0.35;
  }
  return samples;
}

// 7. Warning Siren - rising pitch
function warningSiren() {
  const dur = 1.0;
  const samples = new Float64Array(Math.floor(SR * dur));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const freq = 600 + 400 * Math.sin(2 * Math.PI * 2 * t);
    const env = envelope(t, 0.05, 0.1, 0.8, 0.2, dur);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.5;
  }
  return samples;
}

// 8. Auction Bell - bell strike
function auctionBell() {
  const dur = 1.5;
  const samples = new Float64Array(Math.floor(SR * dur));
  for (let i = 0; i < samples.length; i++) {
    const t = i / SR;
    const env = Math.exp(-2 * t);
    samples[i] = (
      Math.sin(2 * Math.PI * 830 * t) * 0.5 +
      Math.sin(2 * Math.PI * 1245 * t) * 0.3 +
      Math.sin(2 * Math.PI * 1661 * t) * 0.15 +
      Math.sin(2 * Math.PI * 2489 * t) * 0.05
    ) * env * 0.6;
  }
  return samples;
}

const sounds = {
  'classic-alert': classicAlert(),
  'gentle-chime': gentleChime(),
  'urgent-alarm': urgentAlarm(),
  'success-fanfare': successFanfare(),
  'soft-pop': softPop(),
  'digital-ring': digitalRing(),
  'warning-siren': warningSiren(),
  'auction-bell': auctionBell(),
};

for (const [name, samples] of Object.entries(sounds)) {
  const wav = generateWav(samples);
  fs.writeFileSync(path.join(outDir, `${name}.wav`), wav);
  console.log(`Generated: ${name}.wav (${(wav.length / 1024).toFixed(1)} KB)`);
}

console.log('\nAll sound files generated!');
