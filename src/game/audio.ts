import { SoundMaterial } from './blocks';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private volume = 0.75;
  private muted = false;

  setSettings(volume: number, muted: boolean): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
  }

  private ensureCtx(): AudioContext | null {
    if (this.muted || this.volume <= 0.001) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private noiseBurst(duration: number, freq: number, q: number, gainPeak: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.45));

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
  }

  private tone(type: OscillatorType, f0: number, f1: number, duration: number, gainPeak: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playClick(): void {
    this.tone('square', 680, 420, 0.05, 0.09);
  }

  playBlock(material: SoundMaterial, kind: 'break' | 'place' | 'step'): void {
    const pitchJitter = 0.88 + Math.random() * 0.24;
    const amp = kind === 'step' ? 0.08 : kind === 'place' ? 0.17 : 0.22;
    switch (material) {
      case 'stone':
        this.noiseBurst(0.09, 540 * pitchJitter, 1.4, amp);
        this.tone('triangle', 140 * pitchJitter, 70, 0.07, amp * 0.6);
        break;
      case 'nether':
        this.noiseBurst(0.1, 410 * pitchJitter, 1.1, amp);
        this.tone('sawtooth', 120 * pitchJitter, 58, 0.08, amp * 0.4);
        break;
      case 'wood':
        this.tone('triangle', 220 * pitchJitter, 110, 0.08, amp * 0.9);
        this.noiseBurst(0.06, 860 * pitchJitter, 2.0, amp * 0.5);
        break;
      case 'grass':
      case 'dirt':
        this.noiseBurst(0.08, 720 * pitchJitter, 0.9, amp * 0.95);
        break;
      case 'sand':
        this.noiseBurst(0.11, 1450 * pitchJitter, 0.7, amp * 0.85);
        break;
      case 'glass':
        this.tone('sine', 1600 * pitchJitter, 980, 0.09, amp * 0.65);
        this.noiseBurst(0.08, 3200 * pitchJitter, 3.0, amp * 0.7);
        break;
      case 'metal':
        this.tone('square', 520 * pitchJitter, 260, 0.12, amp * 0.55);
        this.noiseBurst(0.08, 1200 * pitchJitter, 2.2, amp * 0.6);
        break;
      case 'liquid':
        this.noiseBurst(0.14, 380 * pitchJitter, 2.5, amp * 0.75);
        break;
    }
  }

  playHurt(): void {
    this.tone('sawtooth', 180, 65, 0.16, 0.22);
    this.noiseBurst(0.12, 520, 1.0, 0.18);
  }

  playPortal(): void {
    this.tone('sine', 110, 320, 0.7, 0.18);
    this.tone('triangle', 165, 82, 0.75, 0.14);
  }

  playThunder(): void {
    this.noiseBurst(0.85, 130, 0.6, 0.35);
    this.tone('sawtooth', 92, 32, 0.65, 0.16);
  }

  playExplosion(): void {
    this.noiseBurst(0.55, 170, 0.55, 0.38);
    this.tone('sine', 95, 28, 0.45, 0.28);
  }

  playAnvil(): void {
    this.tone('triangle', 740, 410, 0.24, 0.22);
    this.tone('square', 1120, 620, 0.16, 0.12);
  }

  playLevelUp(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    [523, 659, 784, 1046].forEach((freq, idx) => {
      setTimeout(() => this.tone('triangle', freq, freq * 1.02, 0.14, 0.15), idx * 75);
    });
  }

  playEat(): void {
    this.noiseBurst(0.09, 1100, 1.3, 0.18);
  }

  playByName(name: string): void {
    switch (name) {
      case 'portal': this.playPortal(); break;
      case 'anvil': this.playAnvil(); break;
      case 'explosion': this.playExplosion(); break;
      case 'levelup': this.playLevelUp(); break;
      case 'thunder': this.playThunder(); break;
      case 'hurt': this.playHurt(); break;
      default: this.playClick(); break;
    }
  }
}

export const soundEngine = new SoundEngine();
