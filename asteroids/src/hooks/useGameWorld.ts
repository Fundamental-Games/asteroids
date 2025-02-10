import { useRef, useState, useCallback, useEffect } from "react";
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

  const worldRef = useRef<GameWorld | null>(null);
  if (!worldRef.current) {
    worldRef.current = new GameWorld();
    const initialState = worldRef.current!.getEntities();
    setWorldState(initialState);
  }

  const dispatch = useCallback((action: GameAction) => {
    if (!worldRef.current) return;
    worldRef.current.dispatch(action);
    setState(worldRef.current.getState());
    setWorldState(worldRef.current.getEntities());
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
    update: (deltaTime: number) => {
      if (!controlsRef.current) return;
      worldRef.current?.update(deltaTime, controlsRef.current);
      if (worldRef.current) {
        const currentState = worldRef.current.getState();
        setWorldState(worldRef.current.getEntities());
        setState(currentState);
      }
    },
  };
}
