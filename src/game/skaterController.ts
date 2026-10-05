import * as THREE from 'three';
import { Skatepark } from './skatepark';
import { SkaterModel } from './skaterModel';
import { ParticleSystem } from './particles';
import { audioEngine } from './audio';
import type { ComboItem, RailSpline } from './types';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  ollie: boolean;
  kickflip: boolean;
  heelflip: boolean;
  shuvit: boolean;
  grind: boolean;
  manual: boolean;
  grab: boolean;
}

export class SkaterController {
  public model: SkaterModel;
  public skatepark: Skatepark;
  public particles: ParticleSystem;

  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 30);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public heading: number = Math.PI; // Face North (-Z)
  public speed: number = 0;

  // State flags
  public isGrounded: boolean = true;
  public isCrouching: boolean = false;
  public isGrinding: boolean = false;
  public isManualing: boolean = false;
  public isGrabbing: boolean = false;
  public isBailed: boolean = false;

  // Balance meter (-1.0 to 1.0, 0 is centered)
  public balance: number = 0;
  public balanceDriftDir: number = 1;
  public balanceSpeed: number = 1.0;

  // Ollie charge
  public ollieCharge: number = 0;
  private readonly maxOllieCharge = 1.0;

  // Active rail being ground
  private activeRail: RailSpline | null = null;
  private railT: number = 0;
  private railDirection: number = 1;

  // Air tricks & rotation
  public airTime: number = 0;
  public boardRotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private targetBoardRotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  public currentTrickName: string = '';

  // Combos & Scoring
  public comboList: ComboItem[] = [];
  public currentComboBasePoints: number = 0;
  public comboMultiplier: number = 1;
  public grindDuration: number = 0;
  public manualDuration: number = 0;

  // Bail recovery timer
  private bailTimer: number = 0;

  // Manual tilt angle
  public manualTilt: number = 0;

  // Event callbacks for UI
  public onTrickLanded?: (trickName: string, points: number) => void;
  public onComboBanked?: (score: number, multiplier: number, tricks: string[]) => void;
  public onBail?: () => void;
  public onLetterCollected?: (letter: string, allCollected: boolean) => void;

  constructor(
    model: SkaterModel,
    skatepark: Skatepark,
    particles: ParticleSystem
  ) {
    this.model = model;
    this.skatepark = skatepark;
    this.particles = particles;
    this.model.group.position.copy(this.position);
    this.model.group.rotation.y = this.heading;
  }

  public update(delta: number, input: InputState) {
    if (this.isBailed) {
      this.updateBailState(delta);
      return;
    }

    if (this.isGrinding) {
      this.updateGrindState(delta, input);
    } else if (this.isGrounded) {
      this.updateGroundedState(delta, input);
    } else {
      this.updateAirState(delta, input);
    }

    // Check ramp transitions
    this.checkRampInteractions(delta);

    // Check collectible collisions
    this.checkCollectibles();

    // Smooth board flip rotations toward target
    this.boardRotation.x = THREE.MathUtils.lerp(this.boardRotation.x, this.targetBoardRotation.x, delta * 18);
    this.boardRotation.y = THREE.MathUtils.lerp(this.boardRotation.y, this.targetBoardRotation.y, delta * 18);
    this.boardRotation.z = THREE.MathUtils.lerp(this.boardRotation.z, this.targetBoardRotation.z, delta * 18);

    // Update Model position, rotation & animation
    this.model.group.position.copy(this.position);
    this.model.group.rotation.y = this.heading;

    // Lean model slightly when steering at speed
    const steerLean = this.isGrounded && Math.abs(this.speed) > 1 ? (input.left ? 0.18 : input.right ? -0.18 : 0) : 0;
    this.model.boardGroup.rotation.z = steerLean;

    this.model.updateAnimation(
      delta,
      this.speed,
      this.isGrounded,
      input.forward,
      this.isCrouching,
      this.isGrinding,
      this.isManualing,
      this.manualTilt,
      this.boardRotation,
      this.isGrabbing,
      this.isBailed
    );

    // Audio update for rolling rumble
    audioEngine.updateRollSound(this.speed, this.isGrounded && !this.isGrinding);
  }

  private updateGroundedState(delta: number, input: InputState) {
    // 1. Acceleration / Braking
    const maxSpeed = 24.0; // ~50 km/h
    const pushAccel = 18.0;
    const brakeDecel = 24.0;
    const friction = 2.5;

    if (input.forward) {
      this.speed = Math.min(this.speed + pushAccel * delta, maxSpeed);
    } else if (input.backward) {
      if (this.speed > 0.5) {
        this.speed = Math.max(this.speed - brakeDecel * delta, 0);
      } else {
        // Reverse slowly
        this.speed = Math.max(this.speed - pushAccel * 0.5 * delta, -6.0);
      }
    } else {
      // Natural rolling friction
      if (this.speed > 0) {
        this.speed = Math.max(this.speed - friction * delta, 0);
      } else if (this.speed < 0) {
        this.speed = Math.min(this.speed + friction * delta, 0);
      }
    }

    // 2. Steering (carving)
    const turnRate = 3.2;
    if (Math.abs(this.speed) > 0.2) {
      const turnDir = this.speed >= 0 ? 1 : -1;
      if (input.left) {
        this.heading += turnRate * turnDir * delta;
      }
      if (input.right) {
        this.heading -= turnRate * turnDir * delta;
      }
    }

    // 3. Movement vector
    const forwardX = -Math.sin(this.heading);
    const forwardZ = -Math.cos(this.heading);
    this.velocity.x = forwardX * this.speed;
    this.velocity.z = forwardZ * this.speed;

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Check boundaries (keep within skatepark perimeter: ±76m)
    const limit = 75.0;
    if (Math.abs(this.position.x) > limit) {
      this.position.x = Math.sign(this.position.x) * limit;
      this.speed *= -0.3;
    }
    if (Math.abs(this.position.z) > limit) {
      this.position.z = Math.sign(this.position.z) * limit;
      this.speed *= -0.3;
    }

    // 4. Manual Mechanics
    if (input.manual && this.speed > 1.5 && !this.isCrouching) {
      if (!this.isManualing) {
        this.startManual();
      }
    }

    if (this.isManualing) {
      this.updateManual(delta, input);
    } else {
      // If combo is active and we're just rolling without manual, bank it after a grace period!
      if (this.comboList.length > 0) {
        this.bankCombo();
      }
    }

    // 5. Ollie Jump Charging
    if (input.ollie) {
      this.isCrouching = true;
      this.ollieCharge = Math.min(this.ollieCharge + delta * 2.2, this.maxOllieCharge);
    } else if (this.isCrouching) {
      // Release Ollie pop!
      this.popOllie();
    }
  }

  private popOllie() {
    this.isCrouching = false;
    this.isGrounded = false;
    this.isManualing = false;

    // Base jump 8.5m/s up to 13.5m/s based on charge
    const jumpImpulse = 8.5 + this.ollieCharge * 5.0;
    this.velocity.y = jumpImpulse;

    audioEngine.playOllie();

    const trickName = this.ollieCharge > 0.6 ? 'HUGE OLLIE' : 'OLLIE';
    const points = this.ollieCharge > 0.6 ? 200 : 100;
    this.addTrickToCombo(trickName, points);

    this.ollieCharge = 0;
  }

  private updateAirState(delta: number, input: InputState) {
    this.airTime += delta;

    // Apply gravity
    const gravity = -26.0;
    this.velocity.y += gravity * delta;

    // Position integration
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Air steering (slight air control)
    if (input.left) this.heading += 1.8 * delta;
    if (input.right) this.heading -= 1.8 * delta;

    // Check rail grind latching
    if (input.grind || this.canSnapToRail()) {
      if (this.trySnapToRail()) {
        return;
      }
    }

    // Handle mid-air tricks
    this.handleAirTricks(input);

    // Ground collision check
    const groundLevel = this.getGroundHeight(this.position.x, this.position.z);
    if (this.position.y <= groundLevel) {
      this.position.y = groundLevel;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.isGrabbing = false;

      // Dust puff particles
      this.particles.emitLandingDust(this.position, 12);
      audioEngine.playLand(Math.abs(this.velocity.y));

      // Reset trick rotation
      this.targetBoardRotation = { x: 0, y: 0, z: 0 };
      this.boardRotation = { x: 0, y: 0, z: 0 };

      // Landed safely! If user immediately taps manual, enter manual seamlessly
      if (input.manual && this.speed > 1.5) {
        this.startManual();
      } else {
        // Will bank combo on next tick
      }
    }
  }

  private handleAirTricks(input: InputState) {
    // 1. Kickflip (A / J)
    if (input.kickflip && this.targetBoardRotation.z === 0) {
      this.targetBoardRotation.z = Math.PI * 2; // Full 360 roll
      audioEngine.playFlick();
      this.addTrickToCombo('KICKFLIP', 500);
      setTimeout(() => {
        this.targetBoardRotation.z = 0;
        this.boardRotation.z = 0;
      }, 350);
    }

    // 2. Heelflip (D / K)
    if (input.heelflip && this.targetBoardRotation.z === 0) {
      this.targetBoardRotation.z = -Math.PI * 2;
      audioEngine.playFlick();
      this.addTrickToCombo('HEELFLIP', 550);
      setTimeout(() => {
        this.targetBoardRotation.z = 0;
        this.boardRotation.z = 0;
      }, 350);
    }

    // 3. 360 Pop Shuvit (S / L)
    if (input.shuvit && this.targetBoardRotation.y === 0) {
      this.targetBoardRotation.y = Math.PI * 2;
      audioEngine.playFlick();
      this.addTrickToCombo('360 SHUVIT', 700);
      setTimeout(() => {
        this.targetBoardRotation.y = 0;
        this.boardRotation.y = 0;
      }, 400);
    }

    // 4. Grab Trick (I / Shift)
    if (input.grab && !this.isGrabbing) {
      this.isGrabbing = true;
      this.addTrickToCombo('MELON GRAB', 600);
    } else if (!input.grab && this.isGrabbing) {
      this.isGrabbing = false;
    }
  }

  // Grind System
  private canSnapToRail(): boolean {
    const snapDist = 2.0;
    for (const rail of this.skatepark.rails) {
      const p1 = new THREE.Vector3(...rail.start);
      const p2 = new THREE.Vector3(...rail.end);
      const closestPoint = new THREE.Vector3();
      const line = new THREE.Line3(p1, p2);
      line.closestPointToPoint(this.position, true, closestPoint);

      if (this.position.distanceTo(closestPoint) < snapDist && this.position.y >= closestPoint.y - 0.5) {
        return true;
      }
    }
    return false;
  }

  private trySnapToRail(): boolean {
    const snapDist = 2.2;
    for (const rail of this.skatepark.rails) {
      const p1 = new THREE.Vector3(...rail.start);
      const p2 = new THREE.Vector3(...rail.end);
      const line = new THREE.Line3(p1, p2);
      const closestPoint = new THREE.Vector3();
      line.closestPointToPoint(this.position, true, closestPoint);

      if (this.position.distanceTo(closestPoint) < snapDist && this.position.y >= closestPoint.y - 0.4) {
        // Latch onto rail!
        this.isGrinding = true;
        this.isGrounded = false;
        this.activeRail = rail;
        this.balance = (Math.random() - 0.5) * 0.2;
        this.balanceDriftDir = Math.random() > 0.5 ? 1 : -1;
        this.balanceSpeed = 1.2;
        this.grindDuration = 0;

        // Determine travel direction along rail
        const railDir = p2.clone().sub(p1).normalize();
        const moveDir = new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
        const dot = railDir.dot(moveDir);
        this.railDirection = dot >= 0 ? 1 : -1;

        const totalDist = p1.distanceTo(p2);
        this.railT = p1.distanceTo(closestPoint) / totalDist;

        // Position directly on rail
        this.position.copy(closestPoint);
        this.velocity.set(0, 0, 0);

        audioEngine.startGrind();

        const grindName = rail.type === 'ledge' ? 'BOARDSLIDE' : '50-50 GRIND';
        const points = rail.type === 'ledge' ? 550 : 400;
        this.addTrickToCombo(grindName, points, true);

        return true;
      }
    }
    return false;
  }

  private updateGrindState(delta: number, input: InputState) {
    if (!this.activeRail) {
      this.dismountGrind();
      return;
    }

    const p1 = new THREE.Vector3(...this.activeRail.start);
    const p2 = new THREE.Vector3(...this.activeRail.end);
    const railLength = p1.distanceTo(p2);
    const grindSpeed = Math.max(Math.abs(this.speed), 10.0);

    // Slide along rail
    const deltaT = (grindSpeed * delta * this.railDirection) / railLength;
    this.railT += deltaT;
    this.grindDuration += delta;

    // Add continuous grind bonus points
    this.currentComboBasePoints += Math.round(180 * delta);

    // Update position on rail
    this.position.lerpVectors(p1, p2, THREE.MathUtils.clamp(this.railT, 0, 1));

    // Emit sparks from rail contact
    const travelDir = p2.clone().sub(p1).normalize().multiplyScalar(this.railDirection);
    this.particles.emitGrindSparks(this.position, travelDir, 3);

    // 1. Balance Drift
    this.balanceSpeed += delta * 0.35; // Gets harder the longer you grind
    this.balance += this.balanceDriftDir * this.balanceSpeed * delta;

    // Player counter-steering
    if (input.left) {
      this.balance -= 3.2 * delta;
    }
    if (input.right) {
      this.balance += 3.2 * delta;
    }

    // Check balance failure -> BAIL!
    if (Math.abs(this.balance) >= 1.0) {
      this.bail();
      return;
    }

    // Jump off rail
    if (input.ollie) {
      this.dismountGrind(true);
      return;
    }

    // End of rail reached
    if (this.railT <= 0.0 || this.railT >= 1.0) {
      this.dismountGrind(false);
    }
  }

  private dismountGrind(jump: boolean = false) {
    this.isGrinding = false;
    audioEngine.stopGrind();

    const forwardX = -Math.sin(this.heading);
    const forwardZ = -Math.cos(this.heading);

    this.velocity.x = forwardX * this.speed;
    this.velocity.z = forwardZ * this.speed;

    if (jump) {
      this.velocity.y = 8.0;
      audioEngine.playOllie();
      this.addTrickToCombo('RAIL POP', 150);
    } else {
      this.velocity.y = 2.0;
    }

    this.activeRail = null;
    this.balance = 0;
  }

  // Manual Mechanics
  private startManual() {
    this.isManualing = true;
    this.balance = (Math.random() - 0.5) * 0.2;
    this.balanceDriftDir = Math.random() > 0.5 ? 1 : -1;
    this.balanceSpeed = 0.9;
    this.manualDuration = 0;
    this.manualTilt = 0.35; // Pop back on tail

    this.addTrickToCombo('MANUAL', 250, false, true);
  }

  private updateManual(delta: number, input: InputState) {
    this.manualDuration += delta;
    this.currentComboBasePoints += Math.round(140 * delta);

    // Decelerate slightly during manual
    this.speed = Math.max(this.speed - 3.5 * delta, 0);

    // Balance meter drift
    this.balanceSpeed += delta * 0.3;
    this.balance += this.balanceDriftDir * this.balanceSpeed * delta;

    if (input.left) this.balance -= 2.8 * delta;
    if (input.right) this.balance += 2.8 * delta;

    // Fail balance -> BAIL!
    if (Math.abs(this.balance) >= 1.0) {
      this.bail();
      return;
    }

    // End manual if stopped or jumped
    if (this.speed < 1.0 || input.ollie) {
      this.isManualing = false;
      this.manualTilt = 0;
      this.balance = 0;
    }
  }

  // Ramp Interaction (Quarterpipes & Halfpipes)
  private checkRampInteractions(_delta: number) {
    for (const ramp of this.skatepark.ramps) {
      const dx = this.position.x - ramp.center[0];
      const dz = this.position.z - ramp.center[1];
      const halfW = ramp.size[0] / 2;
      const halfD = ramp.size[2] / 2;

      if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
        if (ramp.type === 'quarterpipe' || ramp.type === 'halfpipe') {
          // Check if moving into the ramp face
          const rampNormal = new THREE.Vector2(...ramp.direction);
          const moveDir = new THREE.Vector2(-Math.sin(this.heading), -Math.cos(this.heading));
          const approach = rampNormal.dot(moveDir);

          // Launch upward if approaching ramp at speed!
          if (approach < -0.3 && this.isGrounded && this.speed > 5.0) {
            this.isGrounded = false;
            this.velocity.y = Math.min(this.speed * 1.1 + 6.0, 18.0);
            this.speed *= 0.4; // Transfer forward momentum to height

            // Reverse heading to drop back down cleanly into park
            this.heading += Math.PI;

            audioEngine.playOllie();
            this.addTrickToCombo('BIG AIR', 400);
          }
        }
      }
    }
  }

  private getGroundHeight(x: number, z: number): number {
    // Check Funbox table top
    if (Math.abs(x) < 7.0 && Math.abs(z) < 7.0) {
      return 1.4;
    }
    // Check Funbox banks
    if (Math.abs(x) < 7.0) {
      if (z > 7.0 && z < 13.0) {
        return (1.0 - (z - 7.0) / 6.0) * 1.4;
      }
      if (z < -7.0 && z > -13.0) {
        return (1.0 - (-z - 7.0) / 6.0) * 1.4;
      }
    }

    // Default flat concrete level
    return 0.0;
  }

  // Combos & Scoring
  private addTrickToCombo(trickName: string, points: number, isGrind: boolean = false, isManual: boolean = false) {
    this.comboList.push({ name: trickName, points, isGrind, isManual });
    this.currentComboBasePoints += points;
    this.comboMultiplier = this.comboList.length;
    this.currentTrickName = trickName;

    if (this.onTrickLanded) {
      this.onTrickLanded(trickName, points);
    }
  }

  public bankCombo() {
    if (this.comboList.length === 0) return;

    const totalScore = this.currentComboBasePoints * this.comboMultiplier;
    const trickNames = this.comboList.map((c) => c.name);

    audioEngine.playComboBank(this.comboMultiplier);

    if (this.onComboBanked) {
      this.onComboBanked(totalScore, this.comboMultiplier, trickNames);
    }

    // Reset combo state
    this.comboList = [];
    this.currentComboBasePoints = 0;
    this.comboMultiplier = 1;
    this.currentTrickName = '';
  }

  public bail() {
    this.isBailed = true;
    this.isGrinding = false;
    this.isManualing = false;
    this.isGrounded = true;
    this.speed = 0;
    this.velocity.set(0, 0, 0);

    audioEngine.stopGrind();
    audioEngine.playBail();

    // Lost combo!
    this.comboList = [];
    this.currentComboBasePoints = 0;
    this.comboMultiplier = 1;
    this.currentTrickName = 'WIPEOUT!';
    this.balance = 0;

    if (this.onBail) {
      this.onBail();
    }
  }

  private updateBailState(delta: number) {
    this.bailTimer += delta;
    if (this.bailTimer >= 1.6) {
      // Respawn skater ready to ride
      this.isBailed = false;
      this.bailTimer = 0;
      this.currentTrickName = '';
    }
  }

  // Collectibles check
  private checkCollectibles() {
    const pickupRadius = 2.4;
    this.skatepark.collectibles.forEach((item) => {
      if (item.collected) return;
      const pos = new THREE.Vector3(...item.position);
      if (this.position.distanceTo(pos) < pickupRadius) {
        item.collected = true;
        const mesh = this.skatepark.collectibleMeshes.get(item.id);
        if (mesh) {
          mesh.visible = false;
        }

        this.particles.emitCollectBurst(pos);

        if (item.type === 'letter' && item.letter) {
          audioEngine.playLetter();
          const allCollected = this.skatepark.collectibles.filter((c) => c.type === 'letter').every((c) => c.collected);
          if (this.onLetterCollected) {
            this.onLetterCollected(item.letter, allCollected);
          }
        }
      }
    });
  }
}
