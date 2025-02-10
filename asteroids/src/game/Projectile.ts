import * as THREE from "three";
import { BoundingCircle, VectorGraphics } from "../graphics/VectorGraphics";
import { EntityType, GameEntity, Hull } from "./GameEntity";

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

    // Screen wrapping
    if (this.position.x > 1000) this.position.x -= 2000;
    if (this.position.x < -1000) this.position.x += 2000;
    if (this.position.y > 1333) this.position.y -= 2666;
    if (this.position.y < -1333) this.position.y += 2666;
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

  destroy(): void {
    this.alive = false;
  }

  getPosition(): THREE.Vector2 {
    return this.position;
  }

  getVelocity(): THREE.Vector2 {
    return this.velocity;
  }

  getBoundingCircle(): BoundingCircle {
    return { center: this.position, radius: 1 };
  }

  getHull(): Hull {
    return { points: [this.position], closed: false };
  }
}
