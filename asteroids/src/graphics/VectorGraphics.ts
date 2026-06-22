import * as THREE from "three";

interface ExplosionLine {
  angle: number;
  length: number;
  speed: number;
  maxLength: number;
}

const INITIAL_MAX_SEGMENTS = 2048;

export class VectorGraphics {
  private lineShader = {
    vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `,
  };

  private lineMaterial: THREE.ShaderMaterial;
  private lineGeometry: THREE.BufferGeometry;
  private lineMesh: THREE.LineSegments;
  private positions: Float32Array;
  private positionAttribute: THREE.BufferAttribute;
  private segmentCount = 0;
  private maxSegments = INITIAL_MAX_SEGMENTS;

  constructor(private scene: THREE.Scene) {
    this.lineMaterial = new THREE.ShaderMaterial({
      vertexShader: this.lineShader.vertexShader,
      fragmentShader: this.lineShader.fragmentShader,
      transparent: true,
    });

    this.positions = new Float32Array(this.maxSegments * 2 * 3);
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.positionAttribute.setUsage(THREE.DynamicDrawUsage);

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute("position", this.positionAttribute);
    this.lineGeometry.setDrawRange(0, 0);

    this.lineMesh = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.scene.add(this.lineMesh);
  }

  drawLine(from: THREE.Vector2, to: THREE.Vector2): void {
    this.addSegment(from.x, from.y, to.x, to.y);
  }

  drawShape(points: THREE.Vector2[]): void {
    if (points.length < 2) return;

    for (let i = 0; i < points.length; i++) {
      const from = points[i];
      const to = points[(i + 1) % points.length];
      this.addSegment(from.x, from.y, to.x, to.y);
    }
  }

  drawCircle(center: THREE.Vector2, radius: number): void {
    const segments = 32;
    let previousX = center.x + radius;
    let previousY = center.y;

    for (let i = 1; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextX = center.x + Math.cos(angle) * radius;
      const nextY = center.y + Math.sin(angle) * radius;
      this.addSegment(previousX, previousY, nextX, nextY);
      previousX = nextX;
      previousY = nextY;
    }
  }

  drawExplosion(center: THREE.Vector2, progress: number, lines: ExplosionLine[]): void {
    lines.forEach((line) => {
      const currentLength = Math.min(line.length + line.speed * progress, line.maxLength);
      const endX = center.x + Math.cos(line.angle) * currentLength;
      const endY = center.y + Math.sin(line.angle) * currentLength;
      this.addSegment(center.x, center.y, endX, endY);
    });
  }

  clear(): void {
    this.segmentCount = 0;
    this.lineGeometry.setDrawRange(0, 0);
  }

  flush(): void {
    const vertexCount = this.segmentCount * 2;
    this.positionAttribute.needsUpdate = true;
    this.lineGeometry.setDrawRange(0, vertexCount);
    this.lineGeometry.computeBoundingSphere();
  }

  dispose(): void {
    this.scene.remove(this.lineMesh);
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
  }

  private addSegment(fromX: number, fromY: number, toX: number, toY: number): void {
    this.ensureCapacity(this.segmentCount + 1);

    const offset = this.segmentCount * 2 * 3;
    this.positions[offset] = fromX;
    this.positions[offset + 1] = fromY;
    this.positions[offset + 2] = 0;
    this.positions[offset + 3] = toX;
    this.positions[offset + 4] = toY;
    this.positions[offset + 5] = 0;

    this.segmentCount++;
  }

  private ensureCapacity(requiredSegments: number): void {
    if (requiredSegments <= this.maxSegments) return;

    while (this.maxSegments < requiredSegments) {
      this.maxSegments *= 2;
    }

    const nextPositions = new Float32Array(this.maxSegments * 2 * 3);
    nextPositions.set(this.positions);
    this.positions = nextPositions;

    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.positionAttribute.setUsage(THREE.DynamicDrawUsage);
    this.lineGeometry.setAttribute("position", this.positionAttribute);
  }
}

export interface BoundingCircle {
  center: THREE.Vector2;
  radius: number;
}

export function calculateBoundingCircle(points: THREE.Vector2[]): BoundingCircle {
  const center = points.reduce((sum, p) => sum.add(p), new THREE.Vector2()).divideScalar(points.length);
  const radius = Math.max(...points.map((p) => p.distanceTo(center)));

  return { center, radius };
}
