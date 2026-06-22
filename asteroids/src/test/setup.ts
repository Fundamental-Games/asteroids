import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "./mocks/three";

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockAudioNode {
  connect = vi.fn(() => this);
  disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = "sine";
  frequency = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class MockBufferSourceNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = "lowpass";
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}

class MockAudioContext {
  state: AudioContextState = "running";
  sampleRate = 44100;
  destination = new MockAudioNode() as unknown as AudioDestinationNode;
  audioWorklet = {
    addModule: vi.fn(() => Promise.resolve()),
  };

  createGain = vi.fn(() => new MockGainNode() as unknown as GainNode);
  createOscillator = vi.fn(() => new MockOscillatorNode() as unknown as OscillatorNode);
  createBufferSource = vi.fn(() => new MockBufferSourceNode() as unknown as AudioBufferSourceNode);
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode() as unknown as BiquadFilterNode);
  createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => ({
    length,
    duration: length / sampleRate,
    sampleRate,
    numberOfChannels: channels,
    getChannelData: () => new Float32Array(length),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  }) as unknown as AudioBuffer);
  resume = vi.fn(() => {
    this.state = "running";
    return Promise.resolve();
  });
  close = vi.fn(() => Promise.resolve());
}

globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;
globalThis.AudioWorkletNode = class MockAudioWorkletNode extends MockAudioNode {
  constructor() {
    super();
  }
} as unknown as typeof AudioWorkletNode;

// Cleanup after each test
afterEach(() => {
  cleanup();
});
