import { VectorGraphics, BoundingCircle } from "../graphics/VectorGraphics";
import * as THREE from "three";

export interface Hull {
  // Array of points forming line segments (pairs of points)
  points: THREE.Vector2[];
  // Whether the hull is closed (last point connects to first)
  closed: boolean;
}

export type EntityType = "ship" | "asteroid" | "projectile" | "ufo";

export interface GameEntity {
  getType(): EntityType;
  update(deltaTime: number): void;
  draw(graphics: VectorGraphics): void;
  getPosition(): THREE.Vector2;
  getVelocity(): THREE.Vector2;
  getBoundingCircle(): BoundingCircle;
  // New method to get precise collision hull
  getHull(): Hull | null;
  isAlive(): boolean;
  destroy(): void;
}

export const SCREEN_BOUNDS = {
  width: 1920,
  height: 1080,
  left: -960,
  right: 960,
  top: 540,
  bottom: -540,
};

export function wrapPosition(position: THREE.Vector2): THREE.Vector2 {
  if (position.x < SCREEN_BOUNDS.left) position.x = SCREEN_BOUNDS.right;
  if (position.x > SCREEN_BOUNDS.right) position.x = SCREEN_BOUNDS.left;
  if (position.y > SCREEN_BOUNDS.top) position.y = SCREEN_BOUNDS.bottom;
  if (position.y < SCREEN_BOUNDS.bottom) position.y = SCREEN_BOUNDS.top;
  return position;
}
