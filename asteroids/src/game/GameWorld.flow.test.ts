import { describe, expect, it } from "vitest";
import { GameWorld } from "./GameWorld";
import { GameControls } from "../hooks/useGameInput";

const idleControls: GameControls = {
  isThrusting: false,
  isRotatingLeft: false,
  isRotatingRight: false,
  isFiring: false,
};

function destroyNonShipEntities(world: GameWorld) {
  world
    .getEntities()
    .entities.filter((entity) => entity.getType() !== "ship")
    .forEach((entity) => entity.destroy());
}

describe("GameWorld flow", () => {
  it("can clear stage 1 and start stage 2", () => {
    const world = new GameWorld();

    world.dispatch({ type: "START_GAME" });
    expect(world.getState()).toMatchObject({ status: "playing", stage: 1 });
    expect(world.getEntities().entities.filter((entity) => entity.getType() === "asteroid")).toHaveLength(6);

    destroyNonShipEntities(world);
    world.update(1 / 60, idleControls);

    expect(world.getState()).toMatchObject({ status: "stage-complete", stage: 1 });

    world.dispatch({ type: "START_STAGE", stage: 2 });
    expect(world.getState()).toMatchObject({ status: "playing", stage: 2 });
    expect(world.getEntities().entities.filter((entity) => entity.getType() === "asteroid")).toHaveLength(8);

    world.dispose();
  });

  it("reaches game over after three ship deaths", () => {
    const world = new GameWorld();

    world.dispatch({ type: "START_GAME" });
    world.dispatch({ type: "SHIP_DESTROYED" });
    expect(world.getState()).toMatchObject({ status: "respawning", lives: 2 });

    world.dispatch({ type: "SHIP_DESTROYED" });
    expect(world.getState()).toMatchObject({ status: "respawning", lives: 1 });

    world.dispatch({ type: "SHIP_DESTROYED" });
    expect(world.getState()).toMatchObject({ status: "game-over", lives: 0 });

    world.dispose();
  });
});
