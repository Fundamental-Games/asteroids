import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { VectorGraphics } from "../graphics/VectorGraphics";
import { GameOverlay } from "./GameOverlay";
import { useGameWorld } from "../hooks/useGameWorld";
import { GameControls, useGameInput } from "../hooks/useGameInput";

interface GameProps {
  width: number;
  height: number;
}

export const Game: React.FC<GameProps> = ({ width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const graphicsRef = useRef<VectorGraphics | null>(null);
  const controlsRef = useRef<GameControls>({
    isThrusting: false,
    isRotatingLeft: false,
    isRotatingRight: false,
    isFiring: false,
  });

  // Calculate scale to fit screen while maintaining aspect ratio
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;

      const containerAspect = container.clientWidth / container.clientHeight;
      const gameAspect = width / height;

      let scale = 1;
      if (containerAspect > gameAspect) {
        // Container is wider - scale by height
        scale = container.clientHeight / height;
      } else {
        // Container is taller - scale by width
        scale = container.clientWidth / width;
      }

      // Apply scale
      canvas.style.width = `${width * scale}px`;
      canvas.style.height = `${height * scale}px`;
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width, height]);

  useGameInput(controlsRef);

  // Update to get effects from useGameWorld
  const { state, dispatch, update, entities, effects } = useGameWorld(controlsRef);

  // Initialize graphics first
  useEffect(() => {
    console.log("Setting up graphics");
    if (!canvasRef.current) return;

    rendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000);

    sceneRef.current = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-960, 960, 540, -540, 0.1, 1000);
    camera.position.z = 1;
    sceneRef.current.add(camera);

    const scene = sceneRef.current;
    if (!scene) return;
    graphicsRef.current = new VectorGraphics(scene);
    console.log("Graphics initialized");
  }, [width, height]);

  // Update animation loop to render effects
  useEffect(() => {
    if (!rendererRef.current || !graphicsRef.current || !sceneRef.current) {
      console.log("Missing dependencies for animation");
      return;
    }

    const scene = sceneRef.current;
    const camera = scene.children[0] as THREE.OrthographicCamera;
    let lastTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      update(deltaTime);

      // Render
      graphicsRef.current!.clear();
      entities.forEach((entity) => entity.draw(graphicsRef.current!));
      effects.forEach((effect) => effect.render(graphicsRef.current!));
      rendererRef.current!.render(scene, camera);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [graphicsRef.current, entities, effects]);

  // Handle space bar for state transitions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;

      switch (state.status) {
        case "attract":
          console.log("Dispatching START_GAME");
          dispatch({ type: "START_GAME" });
          break;
        case "stage-complete":
          dispatch({ type: "START_STAGE", stage: state.stage + 1 });
          break;
        case "game-over":
          console.log("Dispatching START_GAME");
          dispatch({ type: "START_GAME" });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.status, state.stage]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: "block",
          }}
        />
        <GameOverlay status={state.status} stage={state.stage} score={state.score} />
      </div>
    </div>
  );
};
