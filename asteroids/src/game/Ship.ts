import * as THREE from "three";
import { calculateBoundingCircle, VectorGraphics } from "../graphics/VectorGraphics";
import { EntityType, GameEntity, Hull } from "./GameEntity";
import { GameControls } from "../hooks/useGameInput";
import { wrapPosition } from "./GameEntity";

export class Ship implements GameEntity {
  public alive = true;
  private position = new THREE.Vector2(0, 0);
  private velocity = new THREE.Vector2(0, 0);
  private rotation = 0;
  private readonly size = 22.5; // Ship size: 0.5 asteroid units (was 45)
  private isThrusting = false;
  private invulnerableUntil = 0;

  // Physics constants
  private readonly THRUST = 400; // units/sec²
  private readonly MAX_SPEED = 600; // units/sec
  private readonly DRAG = 0.7; // units/sec²

  private lastFireTime: number = 0;
  private static readonly FIRE_DELAY = 250; // 0.25 seconds in ms

  private onFire: ((position: THREE.Vector2, velocity: THREE.Vector2) => void) | null = null;

  private controls: GameControls | null = null;

  constructor(onFire: (position: THREE.Vector2, velocity: THREE.Vector2) => void) {
    this.onFire = onFire;
  }

  getType(): EntityType {
    return "ship";
  }

  draw(graphics: VectorGraphics): void {
    if (!this.alive) return;

    // Flash when invulnerable
    if (this.isInvulnerable() && Math.floor(performance.now() / 100) % 2 === 0) {
      return; // Skip drawing every other 100ms for flashing effect
    }

    // Main ship points (also used for collision)
    const shipPoints = [
      new THREE.Vector2(0, this.size), // nose
      new THREE.Vector2(-this.size * 0.75, -this.size), // left base
      new THREE.Vector2(this.size * 0.75, -this.size), // right base
    ];

    // Transform ship points
    const rotatedPoints = shipPoints.map((p) => {
      const rotated = p.clone().rotateAround(new THREE.Vector2(0, 0), this.rotation);
      return rotated.add(this.position);
    });

    // Draw ship
    graphics.drawShape(rotatedPoints);

    // Draw thrust flame (visual only)
    if (this.isThrusting) {
      const flamePoints = [
        new THREE.Vector2(-this.size * 0.4, -this.size),
        new THREE.Vector2(0, -this.size * 1.5),
        new THREE.Vector2(this.size * 0.4, -this.size),
      ];

      const rotatedFlame = flamePoints.map((p) => {
        const rotated = p.clone().rotateAround(new THREE.Vector2(0, 0), this.rotation);
        return rotated.add(this.position);
      });

      graphics.drawShape(rotatedFlame);
    }

    // Calculate and draw bounding circle using only ship points
    // const boundingCircle = calculateBoundingCircle(rotatedShipPoints);
    // this.graphics.drawCircle(boundingCircle.center, boundingCircle.radius);
  }

  isAlive(): boolean {
    return this.alive;
  }

  setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }

  setRotation(angle: number): void {
    this.rotation = angle;
  }

  getRotation(): number {
    return this.rotation;
  }

  setControls(controls: GameControls): void {
    this.controls = controls;
  }

  update(deltaTime: number): void {
    if (!this.alive) return;
    if (!this.controls) return;
    this.isThrusting = this.controls.isThrusting;

    const ROTATION_SPEED = 4;
    const rotationSpeed = this.controls.isRotatingLeft ? ROTATION_SPEED : this.controls.isRotatingRight ? -ROTATION_SPEED : 0;

    const currentRotation = this.getRotation();
    this.setRotation(currentRotation + rotationSpeed * deltaTime);

    if (this.controls.isFiring) {
      this.fire();
    }

    if (this.isThrusting) {
      // Apply thrust in direction ship is facing
      const thrustVector = new THREE.Vector2(-Math.sin(this.rotation), Math.cos(this.rotation)).multiplyScalar(this.THRUST * deltaTime);
      this.velocity.add(thrustVector);
    }

    // Apply drag only if moving
    if (this.velocity.length() > 0) {
      const dragVector = this.velocity
        .clone()
        .normalize()
        .multiplyScalar(-this.DRAG * deltaTime);
      this.velocity.add(dragVector);
    }

    // Clamp to max speed
    if (this.velocity.length() > this.MAX_SPEED) {
      this.velocity.setLength(this.MAX_SPEED);
    }

    // Update position with screen wrapping
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    wrapPosition(this.position);
  }

  getPosition(): THREE.Vector2 {
    return this.position.clone();
  }

  getVelocity(): THREE.Vector2 {
    return this.velocity.clone();
  }

  fire(): void {
    const now = Date.now();
    if (!this.onFire) return;
    if (now - this.lastFireTime < Ship.FIRE_DELAY) return;

    const spawnOffset = 30;
    const spawnPos = new THREE.Vector2(this.position.x - Math.sin(this.rotation) * spawnOffset, this.position.y + Math.cos(this.rotation) * spawnOffset);

    const velocity = new THREE.Vector2(-Math.sin(this.rotation), Math.cos(this.rotation)).multiplyScalar(1200); // Speed from requirements

    this.onFire(spawnPos, velocity);
    this.lastFireTime = now;
  }

  getBoundingCircle() {
    const shipPoints = [new THREE.Vector2(0, this.size), new THREE.Vector2(-this.size * 0.75, -this.size), new THREE.Vector2(this.size * 0.75, -this.size)];

    const rotatedPoints = shipPoints.map((p) => {
      const rotated = p.clone().rotateAround(new THREE.Vector2(0, 0), this.rotation);
      return rotated.add(this.position);
    });

    return calculateBoundingCircle(rotatedPoints);
  }

  destroy(): void {
    this.alive = false;
  }

  respawn(options: { position: THREE.Vector2; rotation: number; invulnerableDuration: number }) {
    this.position.copy(options.position);
    this.rotation = options.rotation;
    this.velocity.set(0, 0);
    this.alive = true;
    this.invulnerableUntil = performance.now() + options.invulnerableDuration;
  }

  isInvulnerable(): boolean {
    return performance.now() < this.invulnerableUntil;
  }

  getHull(): Hull {
    // Use same points as in draw method
    const shipPoints = [
      new THREE.Vector2(0, this.size), // nose
      new THREE.Vector2(-this.size * 0.75, -this.size), // left base
      new THREE.Vector2(this.size * 0.75, -this.size), // right base
    ];

    // Transform ship points
    const rotatedPoints = shipPoints.map((p) => {
      const rotated = p.clone().rotateAround(new THREE.Vector2(0, 0), this.rotation);
      return rotated.add(this.position.clone());
    });

    return {
      points: rotatedPoints,
      closed: true, // Ship is a closed triangle
    };
  }
}
