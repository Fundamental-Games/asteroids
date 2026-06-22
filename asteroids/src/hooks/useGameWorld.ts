import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { GameWorld } from "../game/GameWorld";
import { GameAction, GameState } from "../game/types";
import { GameControls } from "../hooks/useGameInput";

export function useGameWorld(controlsRef: React.RefObject<GameControls>) {
  const [state, setState] = useState<GameState>(() => ({
    stage: 0,
    asteroidConfigs: [],
    lives: 3,
    score: 0,
    status: "attract",
  }));
  const stateRef = useRef(state);

  const worldRef = useMemo(() => ({ current: new GameWorld() }), []);

  const update = useCallback(
    (deltaTime: number) => {
      if (!controlsRef.current || !worldRef.current) return;

      worldRef.current.update(deltaTime, controlsRef.current);

      const newState = worldRef.current.getState();
      const previousState = stateRef.current;

      if (
        newState.status !== previousState.status ||
        newState.score !== previousState.score ||
        newState.stage !== previousState.stage ||
        newState.lives !== previousState.lives ||
        newState.respawnTime !== previousState.respawnTime
      ) {
        stateRef.current = newState;
        setState(newState);
      }
    },
    [controlsRef, worldRef]
  );

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!worldRef.current) return;
      worldRef.current.dispatch(action);
      const newState = worldRef.current.getState();
      stateRef.current = newState;
      setState(newState);
    },
    [worldRef]
  );

  const getEntities = useCallback(() => worldRef.current.getEntities(), [worldRef]);

  useEffect(() => {
    return () => {
      worldRef.current?.dispose();
    };
  }, [worldRef]);

  return {
    state,
    dispatch,
    update,
    getEntities,
  };
}
