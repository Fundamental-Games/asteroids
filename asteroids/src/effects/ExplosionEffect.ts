import * as THREE from "three";
import { VectorGraphics } from "../graphics/VectorGraphics";

interface ExplosionConfig {
  center: THREE.Vector2;
  type: "ship" | "asteroid" | "ufo";
}

export class ExplosionEffect {
  private lines: Array<{
    angle: number;
    length: number;
    speed: number;
    maxLength: number;
    rotationSpeed: number;
    currentRotation: number;
  }>;
  private startTime: number;
  private duration: number;
  private center: THREE.Vector2;
  private alive: boolean = true;

  constructor({ center, type }: ExplosionConfig) {
    this.center = center;
    this.startTime = Date.now();

    // Configure based on explosion type
    const config = {
      ship: {
        numLines: 12,
        maxLength: 70,
        speed: 400,
        duration: 0.5,
        pattern: "radial",
      },
      asteroid: {
        numLines: 8,
        maxLength: 50,
        speed: 400,
        duration: 0.375,
        pattern: "split",
      },
      ufo: {
        numLines: 10,
        maxLength: 50,
        speed: 400,
        duration: 0.4,
        pattern: "spiral",
      },
    }[type];

    this.duration = config.duration;

    // Generate explosion lines with more variation
    this.lines = Array.from({ length: config.numLines }, (_, i) => {
      let angle = (i / config.numLines) * Math.PI * 2;

      // Add variation based on pattern
      switch (config.pattern) {
        case "split":
          // Create pairs of lines that spread apart
          angle += (i % 2 === 0 ? 0.2 : -0.2) + Math.random() * 0.1;
          break;
        case "spiral":
          // Create a spiral pattern
          angle += (i / config.numLines) * Math.PI;
          break;
        case "radial":
          // Add random variation to radial pattern
          angle += Math.random() * 0.3 - 0.15;
          break;
      }

      return {
        angle,
        length: 20, // Initial length
        speed: config.speed * (0.8 + Math.random() * 0.4), // Vary speed
        maxLength: config.maxLength * (0.85 + Math.random() * 0.3), // Vary max length
        rotationSpeed: (Math.random() - 0.5) * Math.PI * 2, // Random rotation
        currentRotation: 0,
      };
    });
  }

  update(deltaTime: number): void {
    const elapsed = (Date.now() - this.startTime) / 1000;

    // Update rotation of lines
    this.lines.forEach((line) => {
      line.currentRotation += line.rotationSpeed * deltaTime;
    });

    if (elapsed > this.duration) {
      this.alive = false;
    }
  }

  render(graphics: VectorGraphics): void {
    if (!this.alive) return;

    const progress = (Date.now() - this.startTime) / 1000;
    // const fadeOut = Math.max(0, 1 - progress / this.duration); // Add fade out

    this.lines.forEach((line) => {
      // Use easing for more dynamic expansion
      const easeOutQuad = (t: number) => t * (2 - t);
      const expansionProgress = easeOutQuad(Math.min(1, progress * 2));

      const currentLength = Math.min(line.length + line.speed * expansionProgress, line.maxLength);

      // Apply rotation
      const finalAngle = line.angle + line.currentRotation;
      const endX = this.center.x + Math.cos(finalAngle) * currentLength;
      const endY = this.center.y + Math.sin(finalAngle) * currentLength;

      graphics.drawLine(this.center, new THREE.Vector2(endX, endY));
    });
  }

  isAlive(): boolean {
    return this.alive;
  }
}
