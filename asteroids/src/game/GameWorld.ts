import { Ship } from "./Ship";
import { Asteroid } from "./Asteroid";
import { GameState, GameAction, AsteroidSpawnConfig } from "./types";
import { gameReducer, generateAsteroidsForStage } from "./gameReducer";
import { GameControls } from "../hooks/useGameInput";
import * as THREE from "three";
import { EntityType, GameEntity, Hull } from "./GameEntity";
import { Projectile } from "./Projectile";
import { UFO, UFOSize } from "./UFO";
import { SoundSystem } from "../audio/SoundSystem";
import { ExplosionEffect } from "../effects/ExplosionEffect";

interface Line {
  start: THREE.Vector2;
  end: THREE.Vector2;
}

export class GameWorld {
  private ship: Ship | null = null;

  public state: GameState;

  private entities: GameEntity[] = [];
  // Track projectiles by owner
  private projectileCounts = new Map<string, number>();
  private readonly MAX_PROJECTILES: Record<EntityType, number> = {
    ship: 4,
    ufo: 2,
    asteroid: 0,
    projectile: 0,
  };

  private ufo: UFO | null = null;

  private ufoSpawnTime: number = 0; // Time to spawn next UFO

  private soundSystem: SoundSystem;

  private effects: ExplosionEffect[] = [];

  constructor() {
    this.soundSystem = new SoundSystem();
    this.state = {
      stage: 0,
      asteroidConfigs: [],
      lives: 3,
      score: 0,
      status: "attract",
    };
  }

  dispatch(action: GameAction) {
    const newState = gameReducer(this.state, action);

    if (newState.status !== this.state.status) {
      this.handleStateChange(newState);
    }

    this.state = newState;
  }

  update(deltaTime: number, controls: GameControls) {
    if (this.state.status === "playing" || this.state.status === "respawning") {
      if (this.ship?.alive) {
        this.ship.setControls(controls);
        // Handle thrust sound
        if (controls.isThrusting) {
          this.soundSystem.playSound("thrust");
        } else {
          this.soundSystem.stopSound("thrust");
        }
      }

      // Update all entities including ship
      this.entities.forEach((entity) => entity.update(deltaTime));

      // Remove dead entities (EXCEPT SHIP IF IT IS DEAD)
      this.entities = this.entities.filter((a) => a.isAlive() || a.getType() === "ship");

      this.checkCollisions();

      // Check if all non-ship entities are dead
      if (!this.entities.some((a) => a.isAlive() && a !== this.ship)) {
        this.dispatch({ type: "STAGE_COMPLETE" });
      }

      if (this.ufoSpawnTime && Date.now() >= this.ufoSpawnTime) {
        this.spawnUFO();
        this.ufoSpawnTime = Date.now() + 15000 + Math.random() * 15000; // Next UFO after 15-30 seconds
      }
    }

    if (this.state.status === "respawning" && this.state.respawnTime && Date.now() >= this.state.respawnTime) {
      this.respawnShip();
      this.dispatch({ type: "RESPAWN_COMPLETE" });
    }

    // Update effects
    this.effects = this.effects.filter((effect) => {
      effect.update(deltaTime);
      return effect.isAlive();
    });
  }

  private checkCollisions() {
    if (!this.ship || !this.ship.alive || this.ship.isInvulnerable()) return;

    const asteroids: Asteroid[] = this.entities.filter((a) => a.isAlive() && a.getType() === "asteroid") as Asteroid[];
    const projectiles = this.entities.filter((e) => e.isAlive() && e.getType() === "projectile") as Projectile[];

    const shipBounds = this.ship.getBoundingCircle();
    const shipHull = this.ship.getHull();

    // Ship-Asteroid collisions
    for (const asteroid of asteroids) {
      const asteroidBounds = asteroid.getBoundingCircle();
      // Phase 1: Broad phase using bounding circles
      if (this.circleCollision(shipBounds, asteroidBounds)) {
        const asteroidHull = asteroid.getHull();
        // Phase 2: Narrow phase using line segments
        if (shipHull && asteroidHull && this.hullCollision(shipHull, asteroidHull)) {
          this.handleShipDestruction();
          break;
        }
      }
    }

    // UFO-Asteroid collisions
    if (this.ufo) {
      const ufoBounds = this.ufo.getBoundingCircle();
      for (const asteroid of asteroids) {
        if (!asteroid.isAlive()) continue;

        const asteroidBounds = asteroid.getBoundingCircle();
        if (this.circleCollision({ center: ufoBounds.center, radius: ufoBounds.radius }, asteroidBounds)) {
          this.destroyUFO();
          break;
        }
      }
    }

    // Projectile-Asteroid collisions
    for (const projectile of projectiles) {
      for (const asteroid of asteroids) {
        if (!asteroid.isAlive() || !projectile.isAlive()) continue;

        const asteroidBounds = asteroid.getBoundingCircle();
        if (this.circleCollision({ center: projectile.position, radius: 0 }, asteroidBounds)) {
          const asteroidHull = asteroid.getHull();
          if (this.pointInHull(projectile.position, asteroidHull)) {
            projectile.destroy();
            this.handleAsteroidDestruction(asteroid);
            break;
          }
        }
      }
    }

    // Projectile-Ship collisions
    for (const projectile of projectiles) {
      if (projectile.owner === "ship") continue;
      const shipBounds = this.ship.getBoundingCircle();
      if (this.circleCollision({ center: projectile.position, radius: 0 }, shipBounds)) {
        const shipHull = this.ship.getHull();
        if (shipHull && this.pointInHull(projectile.position, shipHull)) {
          projectile.destroy();
          this.handleShipDestruction();
          break;
        }
      }
    }

    // Projectile-UFO collisions
    for (const projectile of projectiles) {
      if (!this.ufo?.alive) continue;

      // Only check collisions if the projectile owner isn't a UFO
      if (projectile.owner === "ufo") continue;
      const ufoBounds = this.ufo.getBoundingCircle();
      if (this.circleCollision({ center: projectile.position, radius: 0 }, ufoBounds)) {
        projectile.destroy();
        this.destroyUFO();
        break;
      }
    }
  }

  private circleCollision(a: { center: THREE.Vector2; radius: number }, b: { center: THREE.Vector2; radius: number }): boolean {
    const distance = a.center.distanceTo(b.center);
    return distance < a.radius + b.radius;
  }

  private hullCollision(hullA: Hull, hullB: Hull): boolean {
    const linesA = this.getHullLines(hullA);
    const linesB = this.getHullLines(hullB);

    // Check each line segment pair for intersection
    for (const lineA of linesA) {
      for (const lineB of linesB) {
        if (this.lineIntersection(lineA, lineB)) {
          return true;
        }
      }
    }

    return false;
  }

  private getHullLines(hull: Hull): Line[] {
    const lines: Line[] = [];
    for (let i = 0; i < hull.points.length - 1; i++) {
      lines.push({
        start: hull.points[i],
        end: hull.points[i + 1],
      });
    }
    if (hull.closed && hull.points.length > 0) {
      lines.push({
        start: hull.points[hull.points.length - 1],
        end: hull.points[0],
      });
    }
    return lines;
  }

  private lineIntersection(lineA: Line, lineB: Line): boolean {
    // Get vector components
    const a = lineA.end.clone().sub(lineA.start);
    const b = lineB.end.clone().sub(lineB.start);
    const c = lineB.start.clone().sub(lineA.start);

    // Calculate cross products
    const cross1 = a.cross(b);
    if (Math.abs(cross1) < 1e-10) return false; // Lines are parallel

    // Calculate intersection parameters
    const t = c.cross(b) / cross1;
    const u = c.cross(a) / cross1;

    // Check if intersection occurs within line segments
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  private handleStateChange(newState: GameState) {
    console.log("State change:", this.state.status, "->", newState.status);
    switch (newState.status) {
      case "playing":
        if (this.state.status === "attract" || this.state.status === "game-over") {
          console.log("Initializing new game");
          // Pass owner type with the callback
          this.ship = new Ship((pos, vel) => this.spawnProjectile(pos, vel, "ship"));
          this.ship.setPosition(0, 0);
          this.entities = [this.ship];
          this.projectileCounts.clear(); // Reset all counts
          this.spawnAsteroids(newState.asteroidConfigs);
          this.ufoSpawnTime = Date.now() + 20000;
          this.soundSystem.resume();
          this.startBackgroundBeat(); // Start beat when game starts
        }
        break;

      case "stage-complete":
        this.updateBackgroundBeat(); // Update beat when stage completes
        break;

      case "respawning":
        this.updateBackgroundBeat(); // Update beat when respawning
        break;

      case "attract":
        this.ship = null;
        this.entities = [];
        this.projectileCounts.clear();
        this.spawnAsteroids(generateAsteroidsForStage(1));
        this.soundSystem.stopBackgroundBeat();
        break;

      case "game-over":
        this.soundSystem.stopAllSounds();
        break;
    }
  }

  private spawnAsteroids(configs: AsteroidSpawnConfig[]) {
    this.entities = [
      ...this.entities,
      ...configs.map(
        (config) =>
          new Asteroid(
            config.size,
            config.rotationRate,
            new THREE.Vector2(config.position.x, config.position.y),
            new THREE.Vector2(config.velocity.x, config.velocity.y)
          )
      ),
    ];
  }

  private respawnShip() {
    if (!this.ship) return;
    console.log("Respawning ship");
    this.ship.respawn({
      position: new THREE.Vector2(0, 0),
      rotation: Math.random() * Math.PI * 2,
      invulnerableDuration: 3000,
    });
  }

  private spawnUFO() {
    // Determine UFO size based on score
    const isSmall = this.state.score >= 40000;

    // Calculate spawn position on random screen edge
    const position = new THREE.Vector2();
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

    switch (side) {
      case 0: // top
        position.set(Math.random() * 1920 - 960, 540);
        break;
      case 1: // right
        position.set(960, Math.random() * 1080 - 540);
        break;
      case 2: // bottom
        position.set(Math.random() * 1920 - 960, -540);
        break;
      case 3: // left
        position.set(-960, Math.random() * 1080 - 540);
        break;
    }

    // Check minimum distance from player if ship exists
    if (this.ship?.isAlive()) {
      const shipPos = this.ship.getPosition();
      const minDistance = Math.max(1920, 1080) * 0.2; // 20% of larger screen dimension

      if (position.distanceTo(shipPos) < minDistance) {
        // Try opposite side instead
        position.multiplyScalar(-1);
      }
    }

    // Set velocity based on UFO size
    const speed = isSmall ? 200 : 200; // units per second
    const velocity = new THREE.Vector2();

    // Move towards center with slight randomization
    velocity.subVectors(new THREE.Vector2(0, 0), position).normalize().multiplyScalar(speed);

    // Create and add UFO
    this.ufo = new UFO(
      isSmall ? UFOSize.Small : UFOSize.Large,
      velocity,
      (pos, vel) => this.spawnProjectile(pos, vel, "ufo"),
      () => ({
        position: this.ship?.getPosition() || new THREE.Vector2(0, 0),
        velocity: this.ship?.getVelocity() || new THREE.Vector2(0, 0),
      })
    );
    this.ufo.setPosition(position.x, position.y);
    this.entities.push(this.ufo);

    // Schedule next spawn (15-30 seconds)
    this.ufoSpawnTime = Date.now() + 15000 + Math.random() * 15000;

    this.soundSystem.playSound(isSmall ? "smallUFO" : "largeUFO");

    // TODO: Add screen flash effect
    // We should probably create a separate effects system for this
  }

  private destroyUFO() {
    if (!this.ufo) return;
    const position = this.ufo.getPosition();
    this.effects.push(
      new ExplosionEffect({
        center: position,
        type: "ufo",
      })
    );
    this.dispatch({ type: this.ufo.size === UFOSize.Small ? "SMALL_UFO_DESTROYED" : "LARGE_UFO_DESTROYED" });
    this.ufo.destroy();
    this.soundSystem.stopSound(this.ufo.size === UFOSize.Small ? "smallUFO" : "largeUFO");
    this.entities = this.entities.filter((a) => a !== this.ufo);
    this.ufo = null;
  }

  getEntities(): { entities: GameEntity[]; effects: ExplosionEffect[] } {
    return {
      entities: this.entities,
      effects: this.effects,
    };
  }

  getState() {
    return this.state;
  }

  // Add new helper method for point-in-hull collision
  private pointInHull(point: THREE.Vector2, hull: Hull): boolean {
    if (!hull.closed) return false;

    let inside = false;
    const points = hull.points;

    // Ray casting algorithm
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const pi = points[i];
      const pj = points[j];

      if (pi.y > point.y !== pj.y > point.y && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x) {
        inside = !inside;
      }
    }

    return inside;
  }

  private spawnProjectile = (position: THREE.Vector2, velocity: THREE.Vector2, owner: EntityType) => {
    // Get current count for this owner
    const currentCount = this.projectileCounts.get(owner) || 0;
    const maxProjectiles = this.MAX_PROJECTILES[owner];

    // Check limit for this owner
    if (currentCount >= maxProjectiles) return;

    const projectile = new Projectile(position, velocity, owner);
    this.entities.push(projectile);
    this.projectileCounts.set(owner, currentCount + 1);

    // Decrease count for specific owner when projectile is destroyed
    const originalDestroy = projectile.destroy.bind(projectile);
    projectile.destroy = () => {
      originalDestroy();
      const count = this.projectileCounts.get(owner) || 0;
      this.projectileCounts.set(owner, count - 1);
    };

    // Play fire sound
    this.soundSystem.playSound("fire");
  };

  // Add cleanup method
  dispose() {
    this.soundSystem.dispose();
  }

  // Here to call at the start
  private startBackgroundBeat() {
    const asteroids = this.entities.filter((e): e is Asteroid => e.getType() === "asteroid").map((ast) => ({ size: ast.size }));
    this.soundSystem.playBackgroundBeat(asteroids, this.state.stage);
  }

  private updateBackgroundBeat() {
    if (this.state.status === "playing") {
      const asteroids = this.entities
        .filter((e): e is Asteroid => e.getType() === "asteroid")
        .map((ast) => {
          console.log("Asteroid size:", ast.size);
          return { size: ast.size };
        });
      this.soundSystem.playBackgroundBeat(asteroids, this.state.stage);
    } else {
      this.soundSystem.stopBackgroundBeat();
    }
  }

  private handleShipDestruction() {
    if (!this.ship) return;
    const position = this.ship.getPosition();
    this.effects.push(
      new ExplosionEffect({
        center: position,
        type: "ship",
      })
    );
    this.ship.destroy();
    this.soundSystem.playSound("explosion");
    this.dispatch({ type: "SHIP_DESTROYED" });
  }

  private handleAsteroidDestruction(asteroid: Asteroid) {
    const position = asteroid.getPosition();
    this.effects.push(
      new ExplosionEffect({
        center: position,
        type: "asteroid",
      })
    );
    const newAsteroids = asteroid.destroy();
    this.soundSystem.playSound("explosion");

    const remainingEntities = this.entities.filter((a) => a.isAlive());
    this.entities = [...remainingEntities, ...newAsteroids];
    this.dispatch({ type: "ASTEROID_DESTROYED", size: asteroid.size });
    this.updateBackgroundBeat();
  }
}
