# Asteroids Game Recreation - Technical Requirements Document

## 1. Overview
This document outlines the technical requirements for creating a faithful recreation of the 1979 Atari arcade game Asteroids using modern web technologies.

## 2. Technical Stack
- Framework: React
- Graphics: WebGL (Three.js for vector rendering)
- State Management: Built-in React state management
- Build System: Vite
- Input Handling: Native browser APIs
- Audio: Web Audio API

## 3. Core Game Mechanics

### 3.1 Player Ship

#### 3.1.1 Physical Characteristics
- Vector-based rendering using line primitives
- Size: 0.5 asteroid units (nose to base)
- Collision radius: 0.3 asteroid units
- Mass: Used as base unit for momentum calculations

#### 3.1.2 Movement Physics
- Maximum Velocity: 1000 units per second
- Acceleration (while thrusting): 500 units per second²
- Deceleration (space friction): 60 units per second²
- Rotation Rate: 270 degrees per second
- Momentum preservation: Perfect (no loss on rotation)
- Dead stop threshold: 15 units per second

#### 3.1.3 Weapon Characteristics
- Projectile velocity: 1200 units per second
- Maximum projectiles: 4 on screen
- Projectile lifetime: 1.1 seconds
- Firing rate: 0.25 seconds between shots
- Projectile size: 13.33 units length

#### 3.1.4 Respawn Mechanics
- Invulnerability period: 3 seconds
- Respawn delay: 2 seconds after death
- Spawn protection radius: 266 units (two large asteroid diameters)
- Position: Center screen
- Initial velocity: Zero
- Initial rotation: Random

#### 3.1.5 Screen Wrapping
- Wrap threshold: When center point crosses boundary
- Transition: Instant position shift
- Velocity preservation: 100%
- Dual rendering when crossing boundary

### 3.2 Asteroids
#### 3.2.1 Vector Shape Generation
- Base size calibrated to screen units:
  - Large asteroid diameter: 1.0 asteroid units (baseline for all measurements)
  - Medium: 0.5 asteroid units
  - Small: 0.25 asteroid units
- Procedural generation using irregular polygon algorithm:
  - Vertex generation:
    - Number of vertices: 8-12 per asteroid
    - Each vertex positioned at randomized radius (±30% from base size)
    - Angles distributed evenly around 360° with jitter (±15°)
  - Shape constraints:
    - No concave angles greater than 135°
    - Minimum distance between vertices: 20% of base size
    - Maximum deviation from center of mass: 40% of base size

#### 3.2.2 Size Categories and Properties
- Large Asteroids:
  - Velocity range: 15-30 units per second
  - Rotation rate: ±15-45° per second
  - Hitbox: Circular, 90% of maximum radius
  
- Medium Asteroids:
  - Velocity range: 30-45 units per second
  - Rotation rate: ±30-60° per second
  - Hitbox: Circular, 90% of maximum radius
  
- Small Asteroids:
  - Velocity range: 45-60 units per second
  - Rotation rate: ±45-90° per second
  - Hitbox: Circular, 90% of maximum radius

#### 3.2.3 Movement and Physics
- Linear movement with constant velocity
- Screen wrapping with overlap buffer (10% of screen size)
- Spawn behavior:
  - Initial positions: Minimum 15% distance from player ship
  - Random initial velocity vector within size-specific range
  - Random initial rotation rate
  
#### 3.2.4 Split Mechanics
- Large to Medium conversion:
  - Two medium asteroids spawn at point of destruction
  - New velocity vectors: Parent velocity ±45° at 1.5× speed
  - Inherit parent rotation direction with increased rate
  
- Medium to Small conversion:
  - Two small asteroids spawn at point of destruction
  - New velocity vectors: Parent velocity ±60° at 1.5× speed
  - Inherit parent rotation direction with increased rate
  
- Small asteroid destruction:
  - Generate particle effect
  - No new asteroids spawned

### 3.2.5 Vector Storage and Rendering
- Store asteroid shapes as arrays of normalized vectors
- Transform stored vectors using:
  - Current position (translation)
  - Current rotation (rotation matrix)
  - Size scalar (scale)
- Render using WebGL LINE_LOOP primitive
- Maintain original vectors for collision detection

### 3.3 Weapons System
- Primary weapon: Single-direction projectile
- Characteristics:
  - Limited number of simultaneous shots
  - Fixed projectile velocity
  - Limited projectile lifespan
  - Screen wrapping for projectiles

### 3.4 UFOs

#### 3.4.1 Vector Shape Definition
- Large UFO:
  - Base width: 40 units
  - Height: 20 units
  - Vector points (relative to center):
    - Top: [(0, 10)]
    - Upper body: [(-20, 5), (20, 5)]
    - Lower body: [(-15, -5), (15, -5)]
    - Bottom points: [(-8, -10), (8, -10)]
    - Connector line: [(0, 10), (0, 5)]
  - Render as three separate LINE_STRIP primitives:
    - Upper hull: (-20, 5) → (-8, -10) → (8, -10) → (20, 5)
    - Top dome: (-15, 5) → (0, 10) → (15, 5)
    - Bottom detail: (-8, -10) → (8, -10)

- Small UFO:
  - Base width: 20 units
  - Height: 10 units
  - Same proportions and point structure as large UFO
  - Scaled to 50% of large UFO dimensions

#### 3.4.2 Movement Patterns
- Large UFO:
  - Horizontal velocity: 30 units per second
  - Vertical position changes: Every 2-4 seconds
  - Vertical movement range: ±20% of screen height
  - Direction changes: Random intervals between 3-6 seconds
  
- Small UFO:
  - Horizontal velocity: 50 units per second
  - Vertical position changes: Every 1-2 seconds
  - Vertical movement range: ±30% of screen height
  - Direction changes: Random intervals between 2-4 seconds

#### 3.4.3 Shooting Behavior
- Large UFO:
  - Fire rate: Once every 2-4 seconds
  - Shot direction: Random within ±30° of player position
  - Shot velocity: 150 units per second
  
- Small UFO:
  - Fire rate: Once every 1-2 seconds
  - Shot direction: Aimed directly at predicted player position
  - Shot velocity: 200 units per second
  - Prediction algorithm:
    - Calculate player velocity vector
    - Project position based on shot travel time
    - Add random error (±5° at closest approach, ±15° at max distance)

#### 3.4.4 Spawn Behavior
- Initial spawn:
  - Random edge of screen
  - Minimum 20% screen distance from player
  - Appears with screen flash effect
- Respawn timing:
  - First appearance: After 20 seconds
  - Subsequent: Random intervals between 15-30 seconds
  - Type selection: Small UFO only appears above 40,000 points

## 4. Controls

### 4.1 Keyboard Input
- Left Arrow/A: Rotate counterclockwise
- Right Arrow/D: Rotate clockwise
- Up Arrow/W: Thrust
- Space: Fire
- Optional: Hyperspace (implementation TBD)

### 4.2 Input Requirements
- Support for simultaneous key presses
- Responsive input handling (no noticeable delay)
- Configurable key bindings

## 5. Graphics Requirements

### 5.1 Screen and Coordinate System
- Aspect Ratio: 3:4 (vertical orientation)
- Screen Space Coordinates:
  - Width: ±1000 units from center (2000 total)
  - Height: ±1333 units from center (2666 total)
  - Origin (0,0) at screen center
  - All velocities and positions specified in these coordinates
- Size Calibration:
  - Screen width = 15 large asteroids
  - Therefore, large asteroid diameter = 133.33 units (2000/15)
  - All other game object sizes derived from this base scale
- Screen Boundaries:
  - Objects wrap at ±1000 x-axis, ±1333 y-axis
  - Wrap buffer zone: 67 units (half asteroid) beyond visible area
  - Objects split across screen edges render on both sides simultaneously

### 5.2 Object Scale Reference
- Large Asteroid: 133.33 units diameter
- Medium Asteroid: 66.67 units diameter
- Small Asteroid: 33.33 units diameter
- Player Ship: 66.67 units (nose to base)
- UFO (large): 100 units width
- UFO (small): 50 units width
- Projectiles: 13.33 units length

### 5.2 Rendering
- Pure vector graphics using WebGL lines
- Emissive line rendering:
  - Base color: White (#FFFFFF)
  - Bloom effect on lines:
    - 2-3 pixel soft glow
    - Additive blending
    - Slight blue tint (#CCDDFF) on outer glow
  - Implemented using multi-pass rendering:
    1. Main pass with anti-aliased lines
    2. Bloom pass for glow effect
    3. Final composite with original
- No textures or 3D models
- Maintain original arcade aesthetic:
  - Angular shapes
  - Simple geometric forms
  - Clean, sharp lines with authentic glow

### 5.2 Rendering
- Pure vector graphics using WebGL lines
- Emissive line rendering:
  - Base color: White (#FFFFFF)
  - Bloom effect on lines:
    - 4-6 pixel soft glow
    - Additive blending
    - Slight blue tint (#CCDDFF) on outer glow
  - Implemented using multi-pass rendering:
    1. Main pass with anti-aliased lines
    2. Bloom pass for glow effect
    3. Final composite with original
- Line thickness:
  - Ship: 2 pixels
  - Asteroids: 2 pixels
  - Projectiles: 1 pixel
  - UFOs: 2 pixels
  - Effects: 1 pixel
- Maintain original arcade aesthetic

### 5.3 Vector-Based Effects
- Ship thrust effect:
  - Randomized jagged lines behind thruster
  - 2-4 line segments
  - Length range: 40-80 units
  - Flicker effect via length variation
  - Updates at 15Hz to match original
- Explosion effects:
  - Expanding line segments from center point
  - 8-12 straight lines per explosion
  - Initial size: 20 units
  - Final size: 200 units for ship, 150 for asteroids
  - Expansion rate: 400 units per second
  - Different patterns for:
    - Ship explosion (slower expansion)
    - Asteroid splits (faster expansion)
    - UFO destruction (medium expansion)
- Screen flash for UFO:
  - Brief (2-3 frame) full-screen white flash
  - Quick fade out
  - Implemented via transparent white overlay

## 6. Audio Requirements

### 6.1.8 Sound System Implementation
- Abstract sound playback through a simple interface:
  ```typescript
  interface SoundPlayer {
    playSound(soundType: SoundType, params?: PlaybackParams): void;
    stopSound(soundType: SoundType): void;
    updateSound(soundType: SoundType, params?: PlaybackParams): void;
  }
  ```
- Implementation should be swappable between synthesis and samples
- Sound generation details encapsulated from game logic
- Support for simultaneous sound playback
- Priority system for sound mixing

#### 6.1.1 Fire Sound
- Base: Square wave oscillator
- Frequency sweep: 1200Hz to 300Hz
- Duration: 80ms
- Volume envelope: Sharp attack, quick decay

#### 6.1.2 Thrust Sound
- Base: White noise source
- Bandpass filter:
  - Center frequency: 440Hz
  - Q factor: 5.0
- Volume envelope: 
  - Attack: 50ms
  - Sustain while thrusting
  - Release: 100ms
- Modulation: Amplitude variation at 15Hz

#### 6.1.3 UFO Sounds
- Large UFO:
  - Dual oscillator (square waves)
  - Frequencies: 110Hz and 165Hz
  - LFO modulation at 4Hz
  - Continuous while UFO present

- Small UFO:
  - Dual oscillator (square waves)
  - Frequencies: 220Hz and 330Hz
  - LFO modulation at 8Hz
  - Continuous while UFO present

#### 6.1.4 UFO Fire Sound
- Base: Square wave oscillator
- Frequency sweep: 1500Hz to 500Hz
- Duration: 60ms
- Sharp attack, linear decay

#### 6.1.5 Explosion Sounds
- Large Explosion:
  - White noise source
  - Bandpass filter sweep:
    - Start: 1000Hz
    - End: 200Hz
    - Duration: 400ms
  - Volume envelope: Sharp attack, long decay

- Small Explosion:
  - White noise source
  - Bandpass filter sweep:
    - Start: 2000Hz
    - End: 400Hz
    - Duration: 200ms
  - Volume envelope: Sharp attack, medium decay

#### 6.1.6 Background Beat
- Base: Square wave
- Frequency: 50Hz
- Duration: 50ms
- Tempo ranges:
  - Start: 120 BPM
  - Maximum: 240 BPM
- Tempo increases as asteroid count decreases
- Linear tempo increase based on remaining asteroids

#### 6.1.7 Extra Life Sound
- Three-tone sequence
- Square wave oscillator
- Frequencies: 440Hz, 660Hz, 880Hz
- Duration: 100ms per tone
- 50ms gap between tones

## 7. Game Rules and Scoring

### 7.1 Game Initialization
- Starting lives: 3
- Initial asteroid count: 4 large asteroids
- Initial field layout: No asteroids within 3 units of center
- Extra life awarded: Every 10,000 points
- Maximum lives: 6

### 7.2 Scoring System
- Large Asteroid: 20 points
- Medium Asteroid: 50 points
- Small Asteroid: 100 points
- Large UFO: 200 points
- Small UFO: 1000 points

### 7.3 Level Progression
- Level clear: All asteroids destroyed
- New level starts: 2 second delay
- Asteroid count: Increases by 2 per level
- Maximum asteroids: 12 large asteroids
- UFO appearance:
  - First appearance: 20 seconds into level
  - Small UFO: Only above 40,000 points
  - Spawn frequency increases with score

## 8. Game States
- Attract Mode
- Game Start
- Playing
- Game Over
- High Score Entry

## 9. Technical Considerations

### 9.1 Performance Requirements
- Consistent 60 FPS
- Minimal input latency (<16ms)
- Efficient collision detection
- Optimized vector rendering

### 9.2 Browser Compatibility
- Support for modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful fallback for WebGL
- Mobile support (optional)

## 10. Development Phases

### Phase 1: Core Mechanics
- Basic ship movement and physics
- Simple asteroid generation and movement
- Collision detection framework
- Basic weapon system

### Phase 2: Game Elements
- Complete asteroid behavior
- UFO implementation
- Scoring system
- Sound effects

### Phase 3: Polish
- Visual effects
- Menu systems
- High score system
- Performance optimization

## 11. Success Criteria
- Gameplay feels identical to original Asteroids
- Visual aesthetic matches original
- Consistent performance
- Accurate collision detection
- Authentic sound reproduction

## 12. Future Considerations
- Arcade cabinet mode
- Custom vector shapes
- Additional game modes
- Mobile touch controls
- Multiplayer support