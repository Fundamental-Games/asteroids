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

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (container.clientWidth <= 0 || container.clientHeight <= 0) {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        return;
      }

      const containerAspect = container.clientWidth / container.clientHeight;
      const gameAspect = width / height;
      const scale = containerAspect > gameAspect ? container.clientHeight / height : container.clientWidth / width;

      canvas.style.width = `${width * scale}px`;
      canvas.style.height = `${height * scale}px`;
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width, height]);

  useGameInput(controlsRef);

  const { state, dispatch, update, getEntities } = useGameWorld(controlsRef);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-960, 960, 540, -540, 0.1, 1000);
    camera.position.z = 1;
    scene.add(camera);
    sceneRef.current = scene;
    graphicsRef.current = new VectorGraphics(scene);

    return () => {
      graphicsRef.current?.dispose();
      graphicsRef.current = null;
      rendererRef.current?.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, [width, height]);

  useEffect(() => {
    if (!rendererRef.current || !graphicsRef.current || !sceneRef.current) return;

    const scene = sceneRef.current;
    const camera = scene.children[0] as THREE.OrthographicCamera;
    let lastTime = performance.now();
    let frameId: number;
    let running = true;

    const animate = (currentTime: number) => {
      if (!running) return;

      if (document.hidden) {
        lastTime = currentTime;
        frameId = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (deltaTime > 0) {
        update(deltaTime);

        const { entities, effects } = getEntities();
        const graphics = graphicsRef.current;
        const renderer = rendererRef.current;

        if (graphics && renderer) {
          graphics.clear();
          entities.forEach((entity) => entity.draw(graphics));
          effects.forEach((effect) => effect.render(graphics));
          graphics.flush();
          renderer.render(scene, camera);
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, [update, getEntities]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;

      switch (state.status) {
        case "attract":
          dispatch({ type: "START_GAME" });
          break;
        case "stage-complete":
          dispatch({ type: "START_STAGE", stage: state.stage + 1 });
          break;
        case "game-over":
          dispatch({ type: "START_GAME" });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, state.status, state.stage]);

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
