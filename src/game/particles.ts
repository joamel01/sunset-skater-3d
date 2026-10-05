import * as THREE from 'three';

interface SparkParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

interface DustParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  growth: number;
}

export class ParticleSystem {
  public group: THREE.Group;

  // Grind sparks
  private sparkPoints!: THREE.Points;
  private sparkGeo!: THREE.BufferGeometry;
  private sparkPositions!: Float32Array;
  private sparkColors!: Float32Array;
  private sparks: SparkParticle[] = [];
  private readonly maxSparks = 180;

  // Landing dust
  private dustPoints!: THREE.Points;
  private dustGeo!: THREE.BufferGeometry;
  private dustPositions!: Float32Array;
  private dustColors!: Float32Array;
  private dusts: DustParticle[] = [];
  private readonly maxDust = 80;

  constructor() {
    this.group = new THREE.Group();
    this.initSparks();
    this.initDust();
  }

  private initSparks() {
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);

    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, sparkMat);
    this.group.add(this.sparkPoints);
  }

  private initDust() {
    this.dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.maxDust * 3);
    this.dustColors = new Float32Array(this.maxDust * 3);

    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    this.dustGeo.setAttribute('color', new THREE.BufferAttribute(this.dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    this.dustPoints = new THREE.Points(this.dustGeo, dustMat);
    this.group.add(this.dustPoints);
  }

  public emitGrindSparks(pos: THREE.Vector3, dir: THREE.Vector3, count: number = 4) {
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) {
        this.sparks.shift();
      }

      // Shoot sparks backward and outwards with scatter
      const spread = 0.6;
      const velocity = new THREE.Vector3(
        -dir.x * 4 + (Math.random() - 0.5) * spread * 6,
        Math.random() * 3 + 1.2,
        -dir.z * 4 + (Math.random() - 0.5) * spread * 6
      );

      this.sparks.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.05, (Math.random() - 0.5) * 0.2)),
        velocity,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        size: 0.15 + Math.random() * 0.1,
      });
    }
  }

  public emitLandingDust(pos: THREE.Vector3, count: number = 10) {
    for (let i = 0; i < count; i++) {
      if (this.dusts.length >= this.maxDust) {
        this.dusts.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.3 + Math.random() * 0.5,
        Math.sin(angle) * speed
      );

      this.dusts.push({
        position: pos.clone().setY(0.08),
        velocity,
        life: 0.4 + Math.random() * 0.25,
        maxLife: 0.65,
        size: 0.25,
        growth: 0.8,
      });
    }
  }

  public emitCollectBurst(pos: THREE.Vector3) {
    // Burst of golden sparkles
    for (let i = 0; i < 25; i++) {
      if (this.sparks.length >= this.maxSparks) {
        this.sparks.shift();
      }
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 4 + Math.random() * 4;

      this.sparks.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        size: 0.25,
      });
    }
  }

  public update(delta: number) {
    // 1. Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= delta;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      // Gravity
      s.velocity.y -= 14 * delta;
      s.position.addScaledVector(s.velocity, delta);
    }

    // Write to buffer
    for (let i = 0; i < this.maxSparks; i++) {
      if (i < this.sparks.length) {
        const s = this.sparks[i];
        this.sparkPositions[i * 3] = s.position.x;
        this.sparkPositions[i * 3 + 1] = s.position.y;
        this.sparkPositions[i * 3 + 2] = s.position.z;

        const lifeRatio = s.life / s.maxLife;
        // Orange to yellow to red fade
        this.sparkColors[i * 3] = 1.0;
        this.sparkColors[i * 3 + 1] = 0.5 + lifeRatio * 0.5;
        this.sparkColors[i * 3 + 2] = 0.1;
      } else {
        this.sparkPositions[i * 3 + 1] = -999;
      }
    }
    this.sparkGeo.attributes.position.needsUpdate = true;
    this.sparkGeo.attributes.color.needsUpdate = true;

    // 2. Update dust
    for (let i = this.dusts.length - 1; i >= 0; i--) {
      const d = this.dusts[i];
      d.life -= delta;
      if (d.life <= 0) {
        this.dusts.splice(i, 1);
        continue;
      }
      d.velocity.multiplyScalar(0.92);
      d.position.addScaledVector(d.velocity, delta);
      d.size += d.growth * delta;
    }

    for (let i = 0; i < this.maxDust; i++) {
      if (i < this.dusts.length) {
        const d = this.dusts[i];
        this.dustPositions[i * 3] = d.position.x;
        this.dustPositions[i * 3 + 1] = d.position.y;
        this.dustPositions[i * 3 + 2] = d.position.z;

        const lifeRatio = d.life / d.maxLife;
        const c = 0.8 * lifeRatio;
        this.dustColors[i * 3] = c;
        this.dustColors[i * 3 + 1] = c;
        this.dustColors[i * 3 + 2] = c;
      } else {
        this.dustPositions[i * 3 + 1] = -999;
      }
    }
    this.dustGeo.attributes.position.needsUpdate = true;
    this.dustGeo.attributes.color.needsUpdate = true;
  }
}
