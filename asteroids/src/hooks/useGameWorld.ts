import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { GameWorld } from "../game/GameWorld";
import { GameAction } from "../game/types";
import { GameControls } from "../hooks/useGameInput";
import { GameState } from "../game/types";
import { GameEntity } from "../game/GameEntity";
import { ExplosionEffect } from "../effects/ExplosionEffect";

interface GameWorldState {
  entities: GameEntity[];
  effects: ExplosionEffect[];
}

export function useGameWorld(controlsRef: React.RefObject<GameControls>) {
  const [state, setState] = useState<GameState>(() => ({
    stage: 0,
    asteroidConfigs: [],
    lives: 3,
    score: 0,
    status: "attract",
  }));

  const [worldState, setWorldState] = useState<GameWorldState>({ entities: [], effects: [] });

  // Move world initialization to useMemo
  const worldRef = useMemo(() => {
    const world = new GameWorld();
    return { current: world };
  }, []);

  // Memoize the update function to prevent recreation
  const update = useCallback(
    (deltaTime: number) => {
      if (!controlsRef.current || !worldRef.current) return;

      worldRef.current.update(deltaTime, controlsRef.current);

      // Use a single update for both state changes to ensure they stay in sync
      const newState = worldRef.current.getState();
      const newEntities = worldRef.current.getEntities();

      // Only update if something has actually changed
      if (
        newState.status !== state.status ||
        newState.score !== state.score ||
        newState.stage !== state.stage ||
        newState.lives !== state.lives ||
        newEntities.entities !== worldState.entities ||
        newEntities.effects !== worldState.effects
      ) {
        setState(newState);
        setWorldState(newEntities);
      }
    },
    [controlsRef, state.status, state.score, state.stage, state.lives, worldState.entities, worldState.effects]
  );

  const dispatch = useCallback((action: GameAction) => {
    if (!worldRef.current) return;
    worldRef.current.dispatch(action);
    const newState = worldRef.current.getState();
    const newEntities = worldRef.current.getEntities();
    setState(newState);
    setWorldState(newEntities);
  }, []);

  // Add cleanup
  useEffect(() => {
    return () => {
      worldRef.current?.dispose();
    };
  }, []);

  return {
    entities: worldState.entities,
    effects: worldState.effects,
    state,
    dispatch,
    update,
  };
}
