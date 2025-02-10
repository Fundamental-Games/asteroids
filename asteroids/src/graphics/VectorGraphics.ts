import * as THREE from "three";

interface ExplosionLine {
  angle: number;
  length: number;
  speed: number;
  maxLength: number;
}

export class VectorGraphics {
  private lineShader = {
    vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);  // Pure white, fully opaque
      }
    `,
  };

  private lineMaterial: THREE.ShaderMaterial;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.lineMaterial = new THREE.ShaderMaterial({
      vertexShader: this.lineShader.vertexShader,
      fragmentShader: this.lineShader.fragmentShader,
      transparent: true,
    });
  }

  drawLine(from: THREE.Vector2, to: THREE.Vector2): void {
    const points = [new THREE.Vector3(from.x, from.y, 0), new THREE.Vector3(to.x, to.y, 0)];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, this.lineMaterial);
    this.scene.add(line);
  }

  drawShape(points: THREE.Vector2[]): void {
    const vertices = points.map((p) => new THREE.Vector3(p.x, p.y, 0));
    // Close the shape by adding the first point again
    vertices.push(vertices[0].clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const line = new THREE.Line(geometry, this.lineMaterial);
    this.scene.add(line);
  }

  drawCircle(center: THREE.Vector2, radius: number): void {
    const segments = 32;
    const points: THREE.Vector2[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector2(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius));
    }
    this.drawShape(points);
  }

  drawExplosion(center: THREE.Vector2, progress: number, lines: ExplosionLine[]): void {
    lines.forEach((line) => {
      const currentLength = Math.min(line.length + line.speed * progress, line.maxLength);
      const endX = center.x + Math.cos(line.angle) * currentLength;
      const endY = center.y + Math.sin(line.angle) * currentLength;

      this.drawLine(center, new THREE.Vector2(endX, endY));
    });
  }

  clear(): void {
    // Remove all lines from the scene
    this.scene.children = this.scene.children.filter((child) => !(child instanceof THREE.Line));
  }
}

export interface BoundingCircle {
  center: THREE.Vector2;
  radius: number;
}

export function calculateBoundingCircle(points: THREE.Vector2[]): BoundingCircle {
  // Calculate center (average of all points)
  const center = points.reduce((sum, p) => sum.add(p), new THREE.Vector2()).divideScalar(points.length);

  // Find maximum distance from center to any point
  const radius = Math.max(...points.map((p) => p.distanceTo(center)));

  return { center, radius };
}
