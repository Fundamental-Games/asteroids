import * as THREE from "three";
import { calculateBoundingCircle, VectorGraphics } from "../graphics/VectorGraphics";
import { EntityType, GameEntity, Hull, wrapPosition } from "./GameEntity";

export enum UFOSize {
  Large = 33.75, // 75% of large asteroid (was 67.5)
  Small = 16.875, // 50% of large UFO (was 33.75)
}

const UFOShotVelocity = {
  [UFOSize.Small]: 2000,
  [UFOSize.Large]: 1200,
};

// Define a callback that returns the target position and velocity
type onTargetCallback = () => { position: THREE.Vector2; velocity: THREE.Vector2 };

export class UFO implements GameEntity {
  public alive = true;

  private position = new THREE.Vector2(0, 0);
  private velocity = new THREE.Vector2(0, 0);
  private readonly points: THREE.Vector2[];
  private lastFireTime = 0;
  private readonly FIRE_DELAY: number;
  private onFire: ((position: THREE.Vector2, velocity: THREE.Vector2) => void) | null = null;
  public size: UFOSize;
  private onTarget: onTargetCallback | null = null;

  constructor(size: UFOSize, velocity: THREE.Vector2, onFire: (position: THREE.Vector2, velocity: THREE.Vector2) => void, onTarget: onTargetCallback) {
    this.size = size;
    this.velocity = velocity;
    this.onFire = onFire;
    this.FIRE_DELAY = size === UFOSize.Small ? 1000 : 2000; // Small UFO fires faster
    this.onTarget = onTarget;

    // Generate UFO shape points according to spec
    const width = this.size;
    const height = this.size * 0.5; // Height is half of width

    this.points = [
      // Upper hull
      new THREE.Vector2(-width / 2, height / 4), // Left
      new THREE.Vector2(-width / 4, -height / 2), // Bottom left
      new THREE.Vector2(width / 4, -height / 2), // Bottom right
      new THREE.Vector2(width / 2, height / 4), // Right

      // Top dome (separate line)
      new THREE.Vector2(-width * 0.375, height / 4), // Dome left
      new THREE.Vector2(0, height / 2), // Dome top
      new THREE.Vector2(width * 0.375, height / 4), // Dome right

      // Bottom detail (separate line)
      new THREE.Vector2(-width / 4, -height / 2),
      new THREE.Vector2(width / 4, -height / 2),
    ];

    this.lastFireTime = Date.now();
  }

  getType(): EntityType {
    return "ufo";
  }

  isAlive(): boolean {
    return this.alive;
  }

  getPosition(): THREE.Vector2 {
    return this.position;
  }

  getVelocity(): THREE.Vector2 {
    return this.velocity;
  }

  draw(graphics: VectorGraphics): void {
    if (!this.alive) return;

    const transformedPoints = this.points.map((p) => p.clone().add(this.position));

    // Draw upper hull
    graphics.drawShape(transformedPoints.slice(0, 4));

    // Draw top dome
    graphics.drawShape(transformedPoints.slice(4, 7));

    // Draw bottom line
    graphics.drawLine(transformedPoints[7], transformedPoints[8]);
  }

  setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }

  getBoundingCircle() {
    const transformedPoints = this.points.map((p) => p.clone().add(this.position));
    return calculateBoundingCircle(transformedPoints);
  }

  update(deltaTime: number): void {
    if (!this.alive || !this.onFire) return;

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    wrapPosition(this.position);

    // Fire logic
    const now = Date.now();
    if (now - this.lastFireTime >= this.FIRE_DELAY) {
      this.fire();
      this.lastFireTime = now;
    }
  }

  fire(): void {
    if (!this.onTarget) return;
    if (!this.onFire) return;

    const { position } = this.onTarget();

    //TODO: Intercept shot at target

    // Fire at target
    const shotDirection = position.clone().sub(this.position).normalize();
    const shotVelocity = shotDirection.clone().multiplyScalar(UFOShotVelocity[this.size]);
    this.onFire(this.position.clone(), shotVelocity);
    this.lastFireTime = Date.now();
  }

  destroy(): void {
    this.alive = false;
  }

  getHull(): Hull {
    const transformedPoints = this.points.slice(0, 4).map((p) => p.clone().add(this.position));

    return {
      points: transformedPoints,
      closed: true, // UFO upper hull is a closed shape
    };
  }
}
