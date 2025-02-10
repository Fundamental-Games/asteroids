import { GameState, GameAction, AsteroidSpawnConfig, GameStatus } from "./types";
import { AsteroidSize } from "./Asteroid";

const INITIAL_STATE: GameState = {
  stage: 0,
  asteroidConfigs: [],
  lives: 3,
  score: 0,
  status: "attract",
};

export function generateAsteroidsForStage(stage: number): AsteroidSpawnConfig[] {
  const count = Math.min(4 + stage * 2, 12); // Start with 4, add 2 per stage, max 12
  const configs: AsteroidSpawnConfig[] = [];

  // Screen boundaries (with buffer)
  const BOUNDS = {
    minX: -860,
    maxX: 860,
    minY: -440,
    maxY: 440,
  };

  // Keep track of positions to avoid clumping
  const positions: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < count; i++) {
    let position: { x: number; y: number } = { x: 0, y: 0 };
    let attempts = 0;
    const MIN_DISTANCE = 200; // Minimum distance between asteroids

    // Keep trying positions until we find one far enough from others
    do {
      // Randomly choose a quadrant (0-3)
      const quadrant = Math.floor(Math.random() * 4);

      // Generate position based on quadrant to ensure spread
      switch (quadrant) {
        case 0: // Top right
          position = {
            x: Math.random() * (BOUNDS.maxX - 400) + 400,
            y: Math.random() * (BOUNDS.maxY - 400) + 400,
          };
          break;
        case 1: // Top left
          position = {
            x: Math.random() * (BOUNDS.minX + 400) - 400,
            y: Math.random() * (BOUNDS.maxY - 400) + 400,
          };
          break;
        case 2: // Bottom left
          position = {
            x: Math.random() * (BOUNDS.minX + 400) - 400,
            y: Math.random() * (BOUNDS.minY + 400) - 400,
          };
          break;
        case 3: // Bottom right
          position = {
            x: Math.random() * (BOUNDS.maxX - 400) + 400,
            y: Math.random() * (BOUNDS.minY + 400) - 400,
          };
          break;
      }

      // Check if position is far enough from other asteroids
      const isFarEnough = positions.every((p) => Math.hypot(p.x - position.x, p.y - position.y) >= MIN_DISTANCE);

      if (isFarEnough || attempts > 10) {
        positions.push(position);
        break;
      }

      attempts++;
    } while (attempts <= 10);

    // Generate velocity pointing roughly toward center for more interesting patterns
    const angleToCenter = Math.atan2(-position.y, -position.x);
    const angleVariation = (Math.random() - 0.5) * Math.PI; // ±90 degrees
    const speed = 30 + Math.random() * 30; // 30-60 units/sec

    configs.push({
      size: AsteroidSize.Large,
      position: position,
      velocity: {
        x: Math.cos(angleToCenter + angleVariation) * speed,
        y: Math.sin(angleToCenter + angleVariation) * speed,
      },
      rotationRate: (Math.random() - 0.5) * 2, // ±1 radian/sec
    });
  }

  return configs;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  console.log(`Game reducer: ${action.type}`, {
    prevState: { status: state.status, lives: state.lives },
    action,
  });

  const newState = ((): GameState => {
    switch (action.type) {
      case "START_GAME":
        return {
          ...INITIAL_STATE,
          status: "playing",
          stage: 1,
          asteroidConfigs: generateAsteroidsForStage(1),
        };

      case "START_STAGE":
        return {
          ...state,
          status: "playing",
          stage: action.stage,
          asteroidConfigs: generateAsteroidsForStage(action.stage),
        };

      case "ASTEROID_DESTROYED":
        const scoreValues = {
          [AsteroidSize.Large]: 20,
          [AsteroidSize.Medium]: 50,
          [AsteroidSize.Small]: 100,
        };

        const newScore = state.score + scoreValues[action.size];
        return { ...state, score: newScore };

      case "LARGE_UFO_DESTROYED":
        return { ...state, score: state.score + 200 };

      case "SMALL_UFO_DESTROYED":
        return { ...state, score: state.score + 100 };

      case "SHIP_DESTROYED":
        const newLives = state.lives - 1;
        if (newLives <= 0) {
          return {
            ...state,
            lives: 0,
            status: "game-over",
          };
        }
        return {
          ...state,
          lives: newLives,
          status: "respawning",
          respawnTime: Date.now() + 2000, // 2 second delay
        };

      case "RESPAWN_COMPLETE":
        return {
          ...state,
          status: "playing",
          respawnTime: undefined,
        };

      case "STAGE_COMPLETE":
        return {
          ...state,
          stage: state.stage + 1,
          asteroidConfigs: generateAsteroidsForStage(state.stage + 1),
        };

      default:
        return state;
    }
  })();

  console.log("New state:", {
    status: newState.status as GameStatus,
    lives: newState.lives,
    respawnTime: newState.respawnTime,
  });

  return newState;
}
