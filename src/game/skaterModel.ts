import * as THREE from 'three';

export class SkaterModel {
  public group: THREE.Group;
  public boardGroup: THREE.Group;
  public skaterGroup: THREE.Group;

  // Individual parts for animation
  private wheels: THREE.Mesh[] = [];
  private deckMesh!: THREE.Mesh;
  private torsoMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;

  // Pushing animation timer
  private pushTimer: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.boardGroup = new THREE.Group();
    this.skaterGroup = new THREE.Group();

    this.group.add(this.boardGroup);
    this.group.add(this.skaterGroup);

    this.buildBoard();
    this.buildSkater();
  }

  private buildBoard() {
    // 1. Deck
    // Deck dimensions: width 0.45m, thickness 0.04m, length 1.5m
    const deckLength = 1.5;
    const deckWidth = 0.45;
    const deckThickness = 0.04;

    const deckGeo = new THREE.BoxGeometry(deckWidth, deckThickness, deckLength, 4, 1, 8);
    // Warp the ends slightly for nose and tail kicks
    const posAttr = deckGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const z = posAttr.getZ(i);
      if (z > deckLength * 0.35) {
        // Kicktail
        const factor = (z - deckLength * 0.35) / (deckLength * 0.15);
        posAttr.setY(i, posAttr.getY(i) + factor * 0.06);
      } else if (z < -deckLength * 0.35) {
        // Nose
        const factor = (-z - deckLength * 0.35) / (deckLength * 0.15);
        posAttr.setY(i, posAttr.getY(i) + factor * 0.08);
      }
    }
    deckGeo.computeVertexNormals();

    // Canvas texture for graphic underside
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Sunset skate art gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#ff007f'); // Neon pink
      grad.addColorStop(0.5, '#ffaa00'); // Sunset amber
      grad.addColorStop(1, '#00d2ff'); // Cyan
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 512);

      // Skateboard skull/flame logo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VERCEL', 128, 160);
      ctx.fillText('SKATE', 128, 210);

      // Checkerboard stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      for (let y = 300; y < 450; y += 30) {
        for (let x = 0; x < 256; x += 30) {
          if ((x / 30 + y / 30) % 2 === 0) {
            ctx.fillRect(x, y, 30, 30);
          }
        }
      }
    }
    const deckTexture = new THREE.CanvasTexture(canvas);

    // Deck material: Grip tape on top (black), graphic on bottom
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x181818, // Grip tape dark charcoal
      roughness: 0.95,
      metalness: 0.0,
    });
    const graphicMat = new THREE.MeshStandardMaterial({
      map: deckTexture,
      roughness: 0.4,
      metalness: 0.1,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xb58d59, // 7-ply maple wood core
      roughness: 0.7,
    });

    const materials = [
      woodMat,    // Right
      woodMat,    // Left
      gripMat,    // Top (grip tape)
      graphicMat, // Bottom (graphic)
      woodMat,    // Front
      woodMat,    // Back
    ];

    this.deckMesh = new THREE.Mesh(deckGeo, materials);
    this.deckMesh.position.y = 0.14; // Height above ground
    this.deckMesh.castShadow = true;
    this.boardGroup.add(this.deckMesh);

    // 2. Trucks (Front and Back)
    const truckMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.85,
      roughness: 0.2,
    });

    [-0.45, 0.45].forEach((zPos) => {
      // Baseplate
      const baseplateGeo = new THREE.BoxGeometry(0.2, 0.04, 0.1);
      const baseplate = new THREE.Mesh(baseplateGeo, truckMat);
      baseplate.position.set(0, 0.11, zPos);
      this.boardGroup.add(baseplate);

      // Hanger axle
      const axleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8);
      const axle = new THREE.Mesh(axleGeo, truckMat);
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 0.07, zPos);
      this.boardGroup.add(axle);

      // 3. Wheels (Left and Right)
      [-0.2, 0.2].forEach((xPos) => {
        const wheelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12);
        const wheelMat = new THREE.MeshStandardMaterial({
          color: 0xffffff, // Urethane white
          roughness: 0.3,
        });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(xPos, 0.07, zPos);
        wheel.castShadow = true;

        this.wheels.push(wheel);
        this.boardGroup.add(wheel);
      });
    });
  }

  private buildSkater() {
    // Stylized Low-Poly Skater
    // Stance: Regular (left foot forward along -Z, right foot back along +Z, facing +X)
    const hoodieMat = new THREE.MeshStandardMaterial({
      color: 0xff3b5c, // Vibrant skate coral hoodie
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x242838, // Dark denim / cargo
      roughness: 0.8,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe0a97c, // Skin tone
      roughness: 0.6,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Black skate shoes
      roughness: 0.6,
    });
    const shoeSoleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff, // Neon cyan backward cap
      roughness: 0.5,
    });

    this.skaterGroup.position.y = 0.16;

    // 1. Torso / Hoodie
    const torsoGeo = new THREE.BoxGeometry(0.35, 0.6, 0.45);
    this.torsoMesh = new THREE.Mesh(torsoGeo, hoodieMat);
    this.torsoMesh.position.set(0, 0.8, 0);
    this.torsoMesh.castShadow = true;
    this.skaterGroup.add(this.torsoMesh);

    // 2. Head & Backward Cap
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.25, 0);

    const headGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.castShadow = true;
    headGroup.add(this.headMesh);

    // Cap crown
    const capCrownGeo = new THREE.BoxGeometry(0.26, 0.12, 0.26);
    const capCrown = new THREE.Mesh(capCrownGeo, capMat);
    capCrown.position.y = 0.08;
    headGroup.add(capCrown);

    // Cap bill pointing backward (-Z or +Z depending on skate stance)
    const capBillGeo = new THREE.BoxGeometry(0.22, 0.02, 0.15);
    const capBill = new THREE.Mesh(capBillGeo, capMat);
    capBill.position.set(0, 0.05, 0.18);
    headGroup.add(capBill);

    this.skaterGroup.add(headGroup);

    // 3. Legs
    // Left leg (Front foot, near nose)
    this.leftLeg = this.createLeg(pantsMat, shoeMat, shoeSoleMat);
    this.leftLeg.position.set(0, 0.5, -0.32);
    this.skaterGroup.add(this.leftLeg);

    // Right leg (Back foot, near tail)
    this.rightLeg = this.createLeg(pantsMat, shoeMat, shoeSoleMat);
    this.rightLeg.position.set(0, 0.5, 0.32);
    this.skaterGroup.add(this.rightLeg);

    // 4. Arms
    // Left arm
    this.leftArm = this.createArm(hoodieMat, skinMat);
    this.leftArm.position.set(0, 1.0, -0.28);
    this.leftArm.rotation.x = -0.4;
    this.skaterGroup.add(this.leftArm);

    // Right arm
    this.rightArm = this.createArm(hoodieMat, skinMat);
    this.rightArm.position.set(0, 1.0, 0.28);
    this.rightArm.rotation.x = 0.4;
    this.skaterGroup.add(this.rightArm);
  }

  private createLeg(pantsMat: THREE.Material, shoeMat: THREE.Material, soleMat: THREE.Material): THREE.Group {
    const leg = new THREE.Group();

    // Thigh
    const thighGeo = new THREE.BoxGeometry(0.14, 0.3, 0.14);
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.position.y = -0.15;
    thigh.castShadow = true;
    leg.add(thigh);

    // Shin
    const shinGeo = new THREE.BoxGeometry(0.12, 0.28, 0.12);
    const shin = new THREE.Mesh(shinGeo, pantsMat);
    shin.position.y = -0.38;
    shin.castShadow = true;
    leg.add(shin);

    // Shoe
    const shoeGeo = new THREE.BoxGeometry(0.22, 0.09, 0.13);
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0.04, -0.48, 0);
    shoe.castShadow = true;
    leg.add(shoe);

    // White sole
    const soleGeo = new THREE.BoxGeometry(0.23, 0.02, 0.14);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0.04, -0.525, 0);
    leg.add(sole);

    return leg;
  }

  private createArm(sleeveMat: THREE.Material, skinMat: THREE.Material): THREE.Group {
    const arm = new THREE.Group();

    // Upper arm
    const upperGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
    const upper = new THREE.Mesh(upperGeo, sleeveMat);
    upper.position.y = -0.12;
    upper.castShadow = true;
    arm.add(upper);

    // Forearm
    const lowerGeo = new THREE.BoxGeometry(0.1, 0.22, 0.1);
    const lower = new THREE.Mesh(lowerGeo, sleeveMat);
    lower.position.y = -0.3;
    lower.castShadow = true;
    arm.add(lower);

    // Hand
    const handGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.y = -0.43;
    arm.add(hand);

    return arm;
  }

  // Update animations based on state
  public updateAnimation(
    delta: number,
    speed: number,
    isGrounded: boolean,
    isPushing: boolean,
    isCrouching: boolean,
    isGrinding: boolean,
    isManualing: boolean,
    manualTilt: number,
    boardFlipAngle: { x: number; y: number; z: number },
    isGrabbing: boolean,
    isBailed: boolean
  ) {
    // 1. Wheel spin based on speed
    const wheelRot = (speed * delta) / 0.07;
    this.wheels.forEach((w) => {
      w.rotation.x += wheelRot;
    });

    if (isBailed) {
      // Bail Wipeout animation: skater separates & ragdoll rolls
      this.skaterGroup.position.y = 0.1;
      this.skaterGroup.rotation.z = Math.PI / 2.2;
      this.skaterGroup.rotation.x = Math.PI / 4;
      this.boardGroup.rotation.x = Math.PI / 3;
      this.boardGroup.rotation.z = Math.PI / 4;
      return;
    }

    // Reset default rotations
    this.skaterGroup.rotation.set(0, 0, 0);

    // 2. Board rotations from tricks (Kickflip, Heelflip, Shuvit)
    this.boardGroup.rotation.x = boardFlipAngle.x;
    this.boardGroup.rotation.y = boardFlipAngle.y;
    this.boardGroup.rotation.z = boardFlipAngle.z;

    // 3. Skater poses
    if (isGrinding) {
      // 50-50 / Grind pose: wide stance, arms balanced out wide
      this.leftArm.rotation.set(0, 0, -0.9);
      this.rightArm.rotation.set(0, 0, 0.9);
      this.leftLeg.position.y = 0.45;
      this.rightLeg.position.y = 0.45;
      this.torsoMesh.position.y = 0.75;
    } else if (isManualing) {
      // Manual wheelie pose: board pitched back (or forward), skater counter-balancing
      this.boardGroup.rotation.x = manualTilt;
      this.torsoMesh.position.y = 0.78;
      this.torsoMesh.rotation.x = -manualTilt * 0.8;
      this.leftArm.rotation.set(-0.6, 0, -0.4);
      this.rightArm.rotation.set(0.6, 0, 0.4);
    } else if (isGrabbing && !isGrounded) {
      // Grab pose: skater tucks knees, right arm reaches down to grab deck
      this.torsoMesh.position.y = 0.6;
      this.torsoMesh.rotation.z = 0.4;
      this.leftArm.rotation.set(0, 0, 0.8);
      this.rightArm.rotation.set(0, 0, -1.2); // Tucked down to board
    } else if (isCrouching) {
      // Crouch pose: charging Ollie pop
      this.torsoMesh.position.y = 0.62;
      this.leftLeg.position.y = 0.4;
      this.rightLeg.position.y = 0.4;
      this.leftArm.rotation.set(-0.3, 0, -0.3);
      this.rightArm.rotation.set(0.3, 0, 0.3);
    } else if (isPushing && isGrounded) {
      // Skateboard push kick animation
      this.pushTimer += delta * 6;
      const kickPhase = Math.sin(this.pushTimer);
      this.rightLeg.position.y = 0.5 - Math.max(0, kickPhase) * 0.15;
      this.rightLeg.position.z = 0.32 + kickPhase * 0.25;
      this.rightLeg.position.x = 0.15;
    } else {
      // Normal relaxed riding stance
      this.pushTimer = 0;
      this.rightLeg.position.set(0, 0.5, 0.32);
      this.leftLeg.position.set(0, 0.5, -0.32);
      this.torsoMesh.position.y = 0.8;
      this.torsoMesh.rotation.set(0, 0, 0);

      // Subtle breath / sway
      const idle = Math.sin(performance.now() * 0.005) * 0.05;
      this.leftArm.rotation.set(-0.4 + idle, 0, -0.2);
      this.rightArm.rotation.set(0.4 - idle, 0, 0.2);
    }
  }
}
