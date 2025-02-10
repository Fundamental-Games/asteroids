import { VectorGraphics } from "./VectorGraphics";

export interface Drawable {
  draw(graphics: VectorGraphics): void;
}
