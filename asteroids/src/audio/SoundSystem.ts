import { SoundType } from "./types";

export class SoundSystem {
  // BPM range configuration
  private readonly MIN_BPM = 60;
  private readonly MAX_BPM = 120;
  private readonly BPM_RANGE = this.MAX_BPM - this.MIN_BPM;

  private audioContext: AudioContext;
  private gainNode: GainNode;
  private oscillators: Map<SoundType, OscillatorNode> = new Map();
  private noiseNodes: Map<SoundType, AudioWorkletNode> = new Map();
  private activeNodes: Map<SoundType, AudioNode[]> = new Map();

  private currentBPM = this.MIN_BPM;
  private beatCount = 0;
  private beatTimeout: number | null = null;
  private workletLoaded = false;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = 0.5; // Master volume at 50%

    // Load the worklet immediately
    this.initWorklet().catch((err) => {
      console.warn("Failed to initialize audio worklet:", err);
    });
  }

  private async initWorklet() {
    if (!this.audioContext.audioWorklet) {
      console.warn("AudioWorklet not supported");
      return;
    }
    await this.audioContext.audioWorklet.addModule("/src/audio/noise-worklet.js");
    this.workletLoaded = true;
  }

  playSound(soundType: SoundType) {
    switch (soundType) {
      case "fire":
        this.playFireSound();
        break;
      case "thrust":
        this.playThrustSound();
        break;
      case "largeUFO":
        this.playLargeUFOSound();
        break;
      case "smallUFO":
        this.playSmallUFOSound();
        break;
      case "explosion":
        this.playExplosionSound();
        break;
      case "beat":
        this.playBeatSound();
        break;
      case "extraLife":
        this.playExtraLifeSound();
        break;
    }
  }

  stopSound(soundType: SoundType) {
    // Handle oscillators
    const oscillator = this.oscillators.get(soundType);
    if (oscillator) {
      oscillator.stop();
      this.oscillators.delete(soundType);
    }

    // Handle noise nodes
    const noiseNode = this.noiseNodes.get(soundType);
    if (noiseNode) {
      const nodes = this.activeNodes.get(soundType) || [];
      nodes.forEach((node) => node.disconnect());
      this.noiseNodes.delete(soundType);
      this.activeNodes.delete(soundType);
    }
  }

  private playFireSound() {
    // Square wave sweep from 1200Hz to 300Hz over 80ms
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.08);
  }

  private async playThrustSound() {
    if (this.noiseNodes.has("thrust")) {
      return;
    }

    try {
      if (!this.workletLoaded) {
        console.warn("AudioWorklet not loaded yet");
        return;
      }

      const noiseNode = new AudioWorkletNode(this.audioContext, "noise-generator");
      const filter = this.audioContext.createBiquadFilter();
      const gainNode = this.audioContext.createGain();

      filter.type = "bandpass";
      filter.frequency.value = 440;
      filter.Q.value = 5.0;

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.gainNode);

      this.noiseNodes.set("thrust", noiseNode);
      this.activeNodes.set("thrust", [noiseNode, filter, gainNode]);
    } catch (err) {
      console.warn("Failed to create AudioWorklet for thrust sound:", err);
    }
  }

  private playExplosionSound() {
    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();

    // Create noise burst
    const bufferSize = 44100; // 1 second of audio
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Higher amplitude noise
      data[i] = (Math.random() * 2 - 1) * 2;
    }

    source.buffer = buffer;

    // More aggressive filter settings
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(100, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.15);
    filter.Q.value = 0.5; // Wider bandwidth for more noise

    // Louder initial volume with faster decay
    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.gainNode);

    source.start();
    source.stop(this.audioContext.currentTime + 0.15);
  }

  private playLargeUFOSound() {
    this.stopSound("largeUFO");

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = 500;

    // 2.5Hz alternation between 500Hz and 250Hz
    setInterval(() => {
      oscillator.frequency.value = oscillator.frequency.value === 500 ? 250 : 500;
    }, 400); // 2.5Hz = 400ms period

    gainNode.gain.value = 0.1;
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    oscillator.start();

    this.oscillators.set("largeUFO", oscillator);
  }

  private playSmallUFOSound() {
    this.stopSound("smallUFO");

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = 1000;

    // 5Hz alternation between 1000Hz and 500Hz
    setInterval(() => {
      oscillator.frequency.value = oscillator.frequency.value === 1000 ? 500 : 1000;
    }, 200); // 5Hz = 200ms period

    gainNode.gain.value = 0.08;
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    oscillator.start();

    this.oscillators.set("smallUFO", oscillator);
  }

  private playBeatSound() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "square";
    // Slightly lower frequencies: 90Hz for high note, 67Hz for low note
    oscillator.frequency.value = this.beatCount % 2 === 0 ? 90 : 67;
    this.beatCount++;

    // Increase volume and duration
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  private playExtraLifeSound() {
    // Three-tone sequence (440Hz, 660Hz, 880Hz)
    const frequencies = [440, 660, 880];
    const duration = 0.1; // 100ms per tone
    const gap = 0.05; // 50ms gap

    frequencies.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = freq;

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime + i * (duration + gap));
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * (duration + gap) + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.gainNode);

      oscillator.start(this.audioContext.currentTime + i * (duration + gap));
      oscillator.stop(this.audioContext.currentTime + i * (duration + gap) + duration);
    });
  }

  // Add weight for each asteroid size
  private getAsteroidWeight(size: number): number {
    if (size > 40) {
      // Large asteroid (45px)
      return 1;
    } else if (size > 20) {
      // Medium asteroid (22.5px)
      return 0.5;
    } else if (size > 10) {
      // Small asteroid (11.25px)
      return 0.25;
    } else {
      console.warn(`Unexpected asteroid size: ${size}`);
      return 0;
    }
  }

  private scheduleBeat() {
    const interval = (60 / this.currentBPM) * 1000;
    // console.log("Scheduling next beat:", { bpm: this.currentBPM, interval });
    this.beatTimeout = window.setTimeout(() => {
      this.playBeatSound();
      this.scheduleBeat(); // Schedule next beat
    }, interval);
  }

  playBackgroundBeat(asteroids: { size: number }[], stage: number) {
    // Calculate total weight of remaining asteroids
    const totalWeight = asteroids.reduce((sum, ast) => {
      const weight = this.getAsteroidWeight(ast.size);
      //   console.log("Processing asteroid:", { size: ast.size, weight });
      return sum + weight;
    }, 0);

    // Calculate initial stage weight (each large asteroid = 1 weight)
    const initialAsteroidCount = Math.min(4 + stage * 2, 12);
    const maxWeight = initialAsteroidCount * 1.0; // Convert asteroid count to weight (large asteroids)

    // console.log("Stage info:", { stage, initialAsteroidCount, maxWeight, totalWeight });

    // Lerp from MIN_BPM (max weight) to MAX_BPM (0 weight)
    const t = Math.max(0, Math.min(1, 1 - totalWeight / maxWeight));
    const newBPM = this.MIN_BPM + t * this.BPM_RANGE;

    // console.log("BPM calculation:", {
    //   maxWeight,
    //   totalWeight,
    //   t,
    //   oldBPM: this.currentBPM,
    //   newBPM,
    // });

    this.currentBPM = newBPM;

    // Only start if not already playing
    if (this.beatTimeout === null) {
      //      console.log("Starting new beat sequence");
      this.playBeatSound();
      this.scheduleBeat();
    }
  }

  stopBackgroundBeat() {
    if (this.beatTimeout !== null) {
      clearTimeout(this.beatTimeout);
      this.beatTimeout = null;
    }
  }

  resume() {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  dispose() {
    this.stopBackgroundBeat();
    // Clean up oscillators
    this.oscillators.forEach((osc) => osc.stop());
    this.oscillators.clear();

    // Clean up noise nodes
    this.noiseNodes.forEach((_, type) => this.stopSound(type));
    this.noiseNodes.clear();
    this.activeNodes.clear();

    this.audioContext.close();
  }

  stopAllSounds() {
    this.stopBackgroundBeat();
    // Get all unique sound types from active sounds
    const activeSounds = new Set([...this.oscillators.keys(), ...this.noiseNodes.keys()]);

    // Stop each sound
    activeSounds.forEach((soundType) => this.stopSound(soundType));
  }
}
