import * as THREE from "three";
import { calculateBoundingCircle, VectorGraphics } from "../graphics/VectorGraphics";
import { EntityType, GameEntity, Hull, wrapPosition } from "./GameEntity";

export enum AsteroidSize {
  Large = 45, // Base size (was 90)
  Medium = 22.5, // 1/2 of large
  Small = 11.25, // 1/4 of large
}

export class Asteroid implements GameEntity {
  private rotation = 0;
  private vertices: THREE.Vector2[] = [];
  public alive = true;

  constructor(public size: AsteroidSize, private rotationRate: number, private position: THREE.Vector2, private velocity: THREE.Vector2) {
    this.generateShape();
    if (position) this.position = position.clone();
    if (velocity) this.velocity = velocity.clone();
  }

  getType(): EntityType {
    return "asteroid";
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

  private generateShape(): void {
    // Generate 8-12 vertices as per spec
    const vertexCount = 8 + Math.floor(Math.random() * 5);
    const vertices: THREE.Vector2[] = [];

    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      // Radius varies by ±30% from base size
      const radius = this.size * (0.7 + Math.random() * 0.6);
      // Add ±15° jitter to angle
      const jitter = ((Math.random() - 0.5) * Math.PI) / 6;

      vertices.push(new THREE.Vector2(Math.cos(angle + jitter) * radius, Math.sin(angle + jitter) * radius));
    }

    this.vertices = vertices;
  }

  draw(graphics: VectorGraphics): void {
    if (!this.alive) return;

    // Let's verify the vertices are being generated for new asteroids
    if (!this.vertices.length) {
      console.log("Asteroid missing vertices:", { size: this.size });
      this.generateShape(); // Regenerate if missing
    }

    const points = this.vertices.map((p) => {
      const rotated = p.clone().rotateAround(new THREE.Vector2(0, 0), this.rotation);
      return rotated.add(this.position);
    });

    graphics.drawShape(points);
  }

  update(deltaTime: number): void {
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    wrapPosition(this.position);
    this.rotation += this.rotationRate * deltaTime;
  }

  setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }

  destroy(): Asteroid[] {
    this.alive = false;

    if (this.size === AsteroidSize.Small) {
      return [];
    }

    const newSize = this.size === AsteroidSize.Large ? AsteroidSize.Medium : AsteroidSize.Small;
    const angleOffset = this.size === AsteroidSize.Large ? Math.PI / 4 : Math.PI / 3; // 45° or 60°

    return [this.createSplitAsteroid(newSize, angleOffset), this.createSplitAsteroid(newSize, -angleOffset)];
  }

  private createSplitAsteroid(newSize: AsteroidSize, angleOffset: number): Asteroid {
    const newVelocity = this.velocity.clone().rotateAround(new THREE.Vector2(0, 0), angleOffset).multiplyScalar(1.5);
    return new Asteroid(newSize, this.rotationRate * 1.5, this.position.clone(), newVelocity);
  }

  getBoundingCircle() {
    const rotatedPoints = this.vertices.map((p) => {
      const rotated = p.clone().rotateAround(new THREE.Vector2(0, 0), this.rotation);
      return rotated.add(this.position);
    });

    return calculateBoundingCircle(rotatedPoints);
  }

  getHull(): Hull {
    const rotatedPoints = this.vertices.map((p) => {
      const rotated = p.clone().rotateAround(new THREE.Vector2(0, 0), this.rotation);
      return rotated.add(this.position.clone());
    });

    return {
      points: rotatedPoints,
      closed: true, // Asteroids are closed polygons
    };
  }
}
