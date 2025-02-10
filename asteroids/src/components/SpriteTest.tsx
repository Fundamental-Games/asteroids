import React from "react";
import { Game } from "./Game";

export const SpriteTest: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Sprite Test</h2>
      <Game width={1920} height={1080} />
    </div>
  );
};
