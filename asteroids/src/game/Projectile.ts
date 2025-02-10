import * as THREE from "three";
import { EntityType, GameEntity, wrapPosition } from "./GameEntity";
import { VectorGraphics } from "../graphics/VectorGraphics";

export class Projectile implements GameEntity {
  public alive = true;
  private readonly length = 13.33; // From requirements
  private spawnTime: number;
  private static readonly LIFETIME = 2000; // 2 seconds in ms

  public owner: EntityType;

  constructor(public position: THREE.Vector2, private velocity: THREE.Vector2, owner: EntityType) {
    this.spawnTime = Date.now();
    this.owner = owner;
  }

  getType(): EntityType {
    return "projectile";
  }

  update(deltaTime: number): void {
    // Check lifetime
    if (Date.now() - this.spawnTime > Projectile.LIFETIME) {
      this.destroy();
      return;
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    wrapPosition(this.position);
  }

  draw(graphics: VectorGraphics): void {
    if (!this.alive) return;

    const direction = this.velocity.clone().normalize();
    const end = this.position.clone().add(direction.multiplyScalar(this.length));
    graphics.drawLine(this.position, end);
  }

  isAlive(): boolean {
    return this.alive;
  }

  getPosition(): THREE.Vector2 {
    return this.position.clone();
  }

  getVelocity(): THREE.Vector2 {
    return this.velocity.clone();
  }

  getBoundingCircle() {
    return {
      center: this.position.clone(),
      radius: this.length / 2,
    };
  }

  getHull() {
    const direction = this.velocity.clone().normalize();
    const end = this.position.clone().add(direction.multiplyScalar(this.length));
    return {
      points: [this.position.clone(), end.clone()],
      closed: false,
    };
  }

  destroy(): void {
    this.alive = false;
  }
}
