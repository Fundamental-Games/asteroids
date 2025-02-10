import { AsteroidSize } from "./Asteroid";

export type GameStatus = "attract" | "playing" | "stage-complete" | "game-over" | "respawning";

export interface AsteroidSpawnConfig {
  size: AsteroidSize;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  rotationRate: number;
}

export interface GameState {
  stage: number;
  asteroidConfigs: AsteroidSpawnConfig[];
  lives: number;
  score: number;
  status: GameStatus;
  respawnTime?: number; // Track when to respawn
}

export type GameAction =
  | { type: "START_GAME" }
  | { type: "START_STAGE"; stage: number }
  | { type: "ASTEROID_DESTROYED"; size: AsteroidSize }
  | { type: "SHIP_DESTROYED" }
  | { type: "STAGE_COMPLETE" }
  | { type: "RESPAWN_COMPLETE" }
  | { type: "LARGE_UFO_DESTROYED" }
  | { type: "SMALL_UFO_DESTROYED" };
