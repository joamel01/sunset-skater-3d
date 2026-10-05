// Web Audio API Sound Engine for Sunset Skater 3D
// Fully synthesized sound effects and lo-fi skatepark background groove.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Rolling sound nodes
  private rollNoiseNode: AudioBufferSourceNode | null = null;
  private rollFilter: BiquadFilterNode | null = null;
  private rollGain: GainNode | null = null;

  // Grind sound nodes
  private grindNoiseNode: AudioBufferSourceNode | null = null;
  private grindGain: GainNode | null = null;

  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupRollSound();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupRollSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Create 2-second white noise buffer for continuous wheel rumble
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.rollNoiseNode = this.ctx.createBufferSource();
    this.rollNoiseNode.buffer = noiseBuffer;
    this.rollNoiseNode.loop = true;

    this.rollFilter = this.ctx.createBiquadFilter();
    this.rollFilter.type = 'lowpass';
    this.rollFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    this.rollGain = this.ctx.createGain();
    this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.rollNoiseNode.connect(this.rollFilter);
    this.rollFilter.connect(this.rollGain);
    this.rollGain.connect(this.sfxGain);

    try {
      this.rollNoiseNode.start(0);
    } catch {
      // Ignore start issues
    }
  }

  // Update rolling volume and pitch based on speed
  public updateRollSound(speed: number, isGrounded: boolean) {
    if (!this.ctx || !this.rollGain || !this.rollFilter || this.isMuted) return;

    const t = this.ctx.currentTime;
    if (!isGrounded || speed < 0.2) {
      this.rollGain.gain.setTargetAtTime(0.0001, t, 0.05);
    } else {
      const normalizedSpeed = Math.min(speed / 25, 1.2);
      const targetGain = Math.min(0.25 * normalizedSpeed, 0.28);
      const targetFreq = 220 + normalizedSpeed * 500;

      this.rollGain.gain.setTargetAtTime(targetGain, t, 0.05);
      this.rollFilter.frequency.setTargetAtTime(targetFreq, t, 0.05);
    }
  }

  // Ollie pop sound (sharp wooden pop)
  public playOllie() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);

    // Wood snap click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(750, t);
    click.frequency.exponentialRampToValueAtTime(120, t + 0.03);

    clickGain.gain.setValueAtTime(0.3, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    click.connect(clickGain);
    clickGain.connect(this.sfxGain);

    click.start(t);
    click.stop(t + 0.04);
  }

  // Trick flick / whoosh (Kickflip, Heelflip, Shuvit)
  public playFlick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // White noise swoosh through bandpass filter
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.1);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.13);
  }

  // Solid concrete landing sound
  public playLand(impactSpeed: number = 10) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const intensity = Math.min(Math.max(impactSpeed / 12, 0.4), 1.0);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

    gain.gain.setValueAtTime(0.7 * intensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);

    // Deck slap clap
    const slap = this.ctx.createOscillator();
    const slapGain = this.ctx.createGain();
    slap.type = 'triangle';
    slap.frequency.setValueAtTime(450, t);
    slap.frequency.exponentialRampToValueAtTime(90, t + 0.06);

    slapGain.gain.setValueAtTime(0.4 * intensity, t);
    slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    slap.connect(slapGain);
    slapGain.connect(this.sfxGain);

    slap.start(t);
    slap.stop(t + 0.07);
  }

  // Grind scraping metal sound
  public startGrind() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    if (!this.grindGain) {
      const bufferSize = this.ctx.sampleRate * 1.5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (0.8 + 0.2 * Math.sin(i * 0.05));
      }

      this.grindNoiseNode = this.ctx.createBufferSource();
      this.grindNoiseNode.buffer = noiseBuffer;
      this.grindNoiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, this.ctx.currentTime);
      filter.Q.value = 4;

      this.grindGain = this.ctx.createGain();
      this.grindGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      this.grindNoiseNode.connect(filter);
      filter.connect(this.grindGain);
      this.grindGain.connect(this.sfxGain);

      this.grindNoiseNode.start(0);
    } else {
      this.grindGain.gain.setTargetAtTime(0.25, this.ctx.currentTime, 0.03);
    }
  }

  public stopGrind() {
    if (this.ctx && this.grindGain) {
      this.grindGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    }
  }

  // Bail crash sound
  public playBail() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);

    // Metallic board tumble clatter
    setTimeout(() => {
      if (this.ctx && this.sfxGain && !this.isMuted) {
        const ct = this.ctx.currentTime;
        const clatter = this.ctx.createOscillator();
        const clatterGain = this.ctx.createGain();
        clatter.type = 'triangle';
        clatter.frequency.setValueAtTime(260, ct);
        clatter.frequency.exponentialRampToValueAtTime(80, ct + 0.1);
        clatterGain.gain.setValueAtTime(0.3, ct);
        clatterGain.gain.exponentialRampToValueAtTime(0.001, ct + 0.1);
        clatter.connect(clatterGain);
        clatterGain.connect(this.sfxGain);
        clatter.start(ct);
        clatter.stop(ct + 0.11);
      }
    }, 120);
  }

  // S-K-A-T-E letter bell chime
  public playLetter(index: number = 0) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    const freq = notes[Math.min(index, notes.length - 1)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  // Combo bank fanfare (rewarding ascending arpeggio)
  public playComboBank(multiplier: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const pitches = [440, 554.37, 659.25, 880];
    const baseT = this.ctx.currentTime;

    const count = Math.min(Math.max(multiplier, 2), 4);
    for (let i = 0; i < count; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitches[i % pitches.length], baseT + i * 0.07);

      gain.gain.setValueAtTime(0.25, baseT + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, baseT + i * 0.07 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(baseT + i * 0.07);
      osc.stop(baseT + i * 0.07 + 0.2);
    }
  }

  // Built-in Chill Lo-Fi / Synthwave Skate Beat Generator
  public toggleMusic(enable?: boolean): boolean {
    this.init();
    this.resume();

    if (enable !== undefined) {
      this.isMusicPlaying = enable;
    } else {
      this.isMusicPlaying = !this.isMusicPlaying;
    }

    if (this.isMusicPlaying) {
      this.startMusicLoop();
    } else {
      this.stopMusicLoop();
    }

    return this.isMusicPlaying;
  }

  private startMusicLoop() {
    this.stopMusicLoop();
    if (!this.ctx || !this.musicGain) return;

    // 85 BPM Lo-fi Skate Groove
    // 16th notes interval: (60 / 85) / 4 = ~0.176s
    const stepDuration = 0.176;

    // Chord progression: Am7 -> Fmaj7 -> Cmaj7 -> G
    const chords = [
      [220, 261.63, 329.63, 392],    // Am7 (A3, C4, E4, G4)
      [174.61, 220, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [130.81, 164.81, 196, 246.94], // Cmaj7 (C3, E3, G3, B3)
      [196, 246.94, 293.66, 392]     // G (G3, B3, D4, G4)
    ];

    const bassNotes = [110, 87.31, 65.41, 98]; // A2, F2, C2, G2

    this.musicStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const t = this.ctx.currentTime;
      const beat16 = this.musicStep % 16;
      const bar = Math.floor(this.musicStep / 16) % 4;
      const chord = chords[bar];
      const bass = bassNotes[bar];

      // 1. Kick Drum (beat 0 and 10)
      if (beat16 === 0 || beat16 === 10) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
        kickGain.gain.setValueAtTime(0.5, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.13);
      }

      // 2. Snare / Rimshot (beat 4 and 12)
      if (beat16 === 4 || beat16 === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(200, t);
        snareOsc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
        snareGain.gain.setValueAtTime(0.2, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);
        snareOsc.start(t);
        snareOsc.stop(t + 0.09);
      }

      // 3. Hi-Hat (every even 16th note, chill)
      if (beat16 % 2 === 0) {
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(7000 + Math.random() * 800, t);
        hatGain.gain.setValueAtTime(0.03, t);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        hatOsc.connect(hatGain);
        hatGain.connect(this.musicGain);
        hatOsc.start(t);
        hatOsc.stop(t + 0.035);
      }

      // 4. Bass note (syncopated on beat 0, 3, 6, 10, 14)
      if (beat16 === 0 || beat16 === 3 || beat16 === 6 || beat16 === 10) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bass, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, t);

        bassGain.gain.setValueAtTime(0.22, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.3);
      }

      // 5. Synth Rhodes / Pad chords on beat 0 and 8
      if (beat16 === 0 || beat16 === 8) {
        chord.forEach((freq) => {
          if (!this.ctx || !this.musicGain) return;
          const padOsc = this.ctx.createOscillator();
          const padGain = this.ctx.createGain();
          padOsc.type = 'sine';
          padOsc.frequency.setValueAtTime(freq, t);

          padGain.gain.setValueAtTime(0.06, t);
          padGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

          padOsc.connect(padGain);
          padGain.connect(this.musicGain);

          padOsc.start(t);
          padOsc.stop(t + 0.9);
        });
      }

      this.musicStep++;
    }, stepDuration * 1000);
  }

  private stopMusicLoop() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }
}

export const audioEngine = new AudioEngine();
