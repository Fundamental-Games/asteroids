export type SoundType =
  | "fire"
  | "thrust"
  | "largeUFO"
  | "smallUFO"
  | "explosion"
  | "beat"
  | "extraLife"
  | "largeUFO2"
  | "largeUFOLFO"
  | "smallUFO2"
  | "smallUFOLFO";

export interface PlaybackParams {
  volume?: number;
  pitch?: number;
  duration?: number;
}
