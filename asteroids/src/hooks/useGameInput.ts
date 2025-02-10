import { useEffect, useCallback, MutableRefObject } from "react";

export interface GameControls {
  isThrusting: boolean;
  isRotatingLeft: boolean;
  isRotatingRight: boolean;
  isFiring: boolean;
}

// Default controls
const keyMap = {
  ArrowLeft: "isRotatingLeft",
  ArrowRight: "isRotatingRight",
  ArrowUp: "isThrusting",
  Space: "isFiring",
  // WASD alternatives
  KeyA: "isRotatingLeft",
  KeyD: "isRotatingRight",
  KeyW: "isThrusting",
};

export function useGameInput(controlsRef: MutableRefObject<GameControls>) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const control = keyMap[event.code as keyof typeof keyMap];
      if (control) {
        controlsRef.current = { ...controlsRef.current, [control]: true };
      }
    },
    [controlsRef]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const control = keyMap[event.code as keyof typeof keyMap];
      if (control) {
        controlsRef.current = { ...controlsRef.current, [control]: false };
      }
    },
    [controlsRef]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Reset controls when unmounting
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      controlsRef.current = {
        isThrusting: false,
        isRotatingLeft: false,
        isRotatingRight: false,
        isFiring: false,
      };
    };
  }, [handleKeyDown, handleKeyUp]);

  return controlsRef;
}
