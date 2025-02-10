import * as THREE from "three";

export interface Collideable {
  getBoundingCircle(): { center: THREE.Vector2; radius: number };
  // We'll add getHull() later for precise polygon collision
}
