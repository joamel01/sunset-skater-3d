import * as THREE from 'three';
import type { RailSpline, RampZone, CollectibleItem } from './types';

export class Skatepark {
  public group: THREE.Group;
  public rails: RailSpline[] = [];
  public ramps: RampZone[] = [];
  public collectibles: CollectibleItem[] = [];
  public collectibleMeshes: Map<string, THREE.Group> = new Map();

  constructor() {
    this.group = new THREE.Group();
    this.buildEnvironment();
    this.buildSkateparkObstacles();
    this.setupCollectibles();
  }

  private buildEnvironment() {
    // 1. Sky Dome with Sunset Gradient
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec3 point = normalize(vWorldPosition);
        float h = point.y;
        
        // Sunset color ramp: deep purple top, warm orange horizon, golden glow low
        vec3 skyTop = vec3(0.12, 0.08, 0.28);     // Twilight violet
        vec3 skyMid = vec3(0.85, 0.32, 0.25);     // Deep sunset orange
        vec3 skyHorizon = vec3(1.0, 0.72, 0.35); // Golden peach
        vec3 groundColor = vec3(0.15, 0.12, 0.2); // Dark ground
        
        vec3 color;
        if (h > 0.0) {
          float factor = clamp(h * 2.2, 0.0, 1.0);
          color = mix(skyHorizon, skyMid, clamp(h * 3.5, 0.0, 1.0));
          color = mix(color, skyTop, factor);
        } else {
          color = mix(skyHorizon, groundColor, clamp(-h * 5.0, 0.0, 1.0));
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const skyGeo = new THREE.SphereGeometry(300, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyDome);

    // 2. Glowing Sun on Horizon
    const sunGeo = new THREE.CircleGeometry(18, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffe07d,
      side: THREE.DoubleSide,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(-160, 28, -140);
    sunMesh.lookAt(0, 0, 0);
    this.group.add(sunMesh);

    // Sun Glow Halo
    const sunGlowGeo = new THREE.CircleGeometry(38, 32);
    const sunGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
    sunGlow.position.set(-159, 28, -139);
    sunGlow.lookAt(0, 0, 0);
    this.group.add(sunGlow);

    // 3. Ground / Concrete Skate Plaza Base
    // Main concrete park (160x160m)
    const parkFloorGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    const parkFloorMat = new THREE.MeshStandardMaterial({
      color: 0xd4ceca,
      roughness: 0.65,
      metalness: 0.05,
    });
    const parkFloor = new THREE.Mesh(parkFloorGeo, parkFloorMat);
    parkFloor.rotation.x = -Math.PI / 2;
    parkFloor.receiveShadow = true;
    this.group.add(parkFloor);

    // Outer landscape (grass/sand around the park)
    const landscapeGeo = new THREE.PlaneGeometry(500, 500);
    const landscapeMat = new THREE.MeshStandardMaterial({
      color: 0x3d354a,
      roughness: 0.9,
    });
    const landscape = new THREE.Mesh(landscapeGeo, landscapeMat);
    landscape.rotation.x = -Math.PI / 2;
    landscape.position.y = -0.05;
    landscape.receiveShadow = true;
    this.group.add(landscape);

    // Grid markings on concrete
    const gridHelper = new THREE.GridHelper(160, 32, 0xb8b0ab, 0xc7c0ba);
    gridHelper.position.y = 0.01;
    this.group.add(gridHelper);

    // Distant stylized skyline silhouettes
    this.buildSkyline();

    // Perimeter walls & palm trees
    this.buildPerimeterDecor();
  }

  private buildSkyline() {
    const buildingsGroup = new THREE.Group();
    const buildingMat = new THREE.MeshBasicMaterial({ color: 0x241d3b });

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const dist = 210 + Math.random() * 40;
      const width = 12 + Math.random() * 18;
      const height = 25 + Math.random() * 65;
      const depth = 12 + Math.random() * 18;

      const geo = new THREE.BoxGeometry(width, height, depth);
      const bldg = new THREE.Mesh(geo, buildingMat);
      bldg.position.set(Math.cos(angle) * dist, height / 2 - 5, Math.sin(angle) * dist);
      buildingsGroup.add(bldg);
    }
    this.group.add(buildingsGroup);
  }

  private buildPerimeterDecor() {
    // Palm trees along edges
    const palmPositions: [number, number][] = [
      [-70, -70], [-70, -20], [-70, 30], [-70, 70],
      [70, -70], [70, -20], [70, 30], [70, 70],
      [-30, -70], [20, -70], [-30, 70], [20, 70]
    ];

    palmPositions.forEach(([x, z]) => {
      this.createPalmTree(x, z);
    });

    // Park Fences / Coping curb around edge
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x8f2222, roughness: 0.5 });
    const wallGeoX = new THREE.BoxGeometry(160, 0.8, 0.8);
    const wallGeoZ = new THREE.BoxGeometry(0.8, 0.8, 160);

    const curbN = new THREE.Mesh(wallGeoX, curbMat);
    curbN.position.set(0, 0.4, -80);
    const curbS = new THREE.Mesh(wallGeoX, curbMat);
    curbS.position.set(0, 0.4, 80);
    const curbW = new THREE.Mesh(wallGeoZ, curbMat);
    curbW.position.set(-80, 0.4, 0);
    const curbE = new THREE.Mesh(wallGeoZ, curbMat);
    curbE.position.set(80, 0.4, 0);

    this.group.add(curbN, curbS, curbW, curbE);

    // Neon Park Sign
    this.createNeonSign(0, 7, -78, "SUNSET SKATER 3D", 0xff3366);
    this.createNeonSign(78, 6, 0, "OLLIE ALLEY", 0x00e5ff, Math.PI / 2);
  }

  private createNeonSign(x: number, y: number, z: number, text: string, color: number, rotY: number = 0) {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, y, z);
    signGroup.rotation.y = rotY;

    // Metal frame
    const frameGeo = new THREE.BoxGeometry(18, 2.5, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    signGroup.add(frame);

    // Glowing billboard panel
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#110b22';
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = 'bold 44px sans-serif';
      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 18;
      ctx.fillText(text, 256, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const panelGeo = new THREE.PlaneGeometry(17.6, 2.2);
    const panelMat = new THREE.MeshBasicMaterial({ map: texture });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.z = 0.22;
    signGroup.add(panel);

    // Support pillars
    const postMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8 });
    const postGeo = new THREE.CylinderGeometry(0.2, 0.2, y);
    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set(-8, -y / 2, 0);
    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(8, -y / 2, 0);
    signGroup.add(post1, post2);

    this.group.add(signGroup);
  }

  private createPalmTree(x: number, z: number) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    // Curved Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e5239, roughness: 0.9 });
    const trunkHeight = 10 + Math.random() * 3;
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    palm.add(trunk);

    // Fronds / Palm leaves
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e6b36, roughness: 0.6, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leafGeo = new THREE.PlaneGeometry(1.6, 6);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0, trunkHeight, 0);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.6;
      leaf.castShadow = true;
      palm.add(leaf);
    }

    this.group.add(palm);
  }

  private buildSkateparkObstacles() {
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xbfb8b2,
      roughness: 0.6,
      metalness: 0.1,
    });
    const rampCopingMat = new THREE.MeshStandardMaterial({
      color: 0x3366cc,
      metalness: 0.85,
      roughness: 0.2,
    });
    const railSteelMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00, // Vibrant yellow steel rail
      metalness: 0.9,
      roughness: 0.2,
    });

    // ==========================================
    // 1. NORTH QUARTERPIPE (High Vert Air Ramp)
    // ==========================================
    // Position: [0, 0, -50], width: 40m, height: 5m
    this.createQuarterPipe(0, 0, -50, 40, 5, 8, Math.PI, concreteMat, rampCopingMat);
    this.ramps.push({
      id: 'north-quarterpipe',
      center: [0, 2.5, -50],
      size: [40, 5, 8],
      type: 'quarterpipe',
      direction: [0, 1], // Launch back south (+Z)
      radius: 8,
    });

    // Coping rail on top of North QP
    this.rails.push({
      id: 'north-qp-coping',
      start: [-19, 5, -54],
      end: [19, 5, -54],
      radius: 0.15,
      type: 'flat',
    });

    // ==========================================
    // 2. SOUTH QUARTERPIPE
    // ==========================================
    this.createQuarterPipe(0, 0, 50, 40, 5, 8, 0, concreteMat, rampCopingMat);
    this.ramps.push({
      id: 'south-quarterpipe',
      center: [0, 2.5, 50],
      size: [40, 5, 8],
      type: 'quarterpipe',
      direction: [0, -1], // Launch back north (-Z)
      radius: 8,
    });

    this.rails.push({
      id: 'south-qp-coping',
      start: [-19, 5, 54],
      end: [19, 5, 54],
      radius: 0.15,
      type: 'flat',
    });

    // ==========================================
    // 3. WEST HALFPIPE (Mini-Ramp)
    // ==========================================
    // Halfpipe oriented along Z: x = -45, z from -20 to 20
    this.createHalfPipe(-45, 0, 0, 14, 4, 30, concreteMat, rampCopingMat);
    this.ramps.push({
      id: 'west-halfpipe-east-wall',
      center: [-38, 2, 0],
      size: [7, 4, 30],
      type: 'halfpipe',
      direction: [-1, 0],
    });
    this.ramps.push({
      id: 'west-halfpipe-west-wall',
      center: [-52, 2, 0],
      size: [7, 4, 30],
      type: 'halfpipe',
      direction: [1, 0],
    });

    // Halfpipe coping rails
    this.rails.push({
      id: 'halfpipe-coping-east',
      start: [-38, 4, -14],
      end: [-38, 4, 14],
      radius: 0.15,
      type: 'flat',
    });
    this.rails.push({
      id: 'halfpipe-coping-west',
      start: [-52, 4, -14],
      end: [-52, 4, 14],
      radius: 0.15,
      type: 'flat',
    });

    // ==========================================
    // 4. CENTRAL FUNBOX / PYRAMID PLAZA
    // ==========================================
    // Box at center [0, 0, 0]: table top 12x12 at y=1.4m, with 4 bank ramps leading up
    this.createFunbox(0, 0, 0, 14, 1.4, 14, concreteMat);
    this.ramps.push({
      id: 'funbox-north-bank',
      center: [0, 0.7, -9],
      size: [14, 1.4, 6],
      type: 'bank',
      direction: [0, 1],
    });
    this.ramps.push({
      id: 'funbox-south-bank',
      center: [0, 0.7, 9],
      size: [14, 1.4, 6],
      type: 'bank',
      direction: [0, -1],
    });

    // Ledge atop Funbox
    this.rails.push({
      id: 'funbox-ledge-east',
      start: [7, 1.4, -7],
      end: [7, 1.4, 7],
      radius: 0.18,
      type: 'ledge',
    });
    this.rails.push({
      id: 'funbox-ledge-west',
      start: [-7, 1.4, -7],
      end: [-7, 1.4, 7],
      radius: 0.18,
      type: 'ledge',
    });

    // Flat down-rail over funbox center
    this.createRoundRail(0, 1.9, -10, 0, 1.9, 10, railSteelMat);
    this.rails.push({
      id: 'funbox-spine-rail',
      start: [0, 1.9, -10],
      end: [0, 1.9, 10],
      radius: 0.12,
      type: 'flat',
    });

    // ==========================================
    // 5. EAST STAIR SET (6-Stairs with Handrails)
    // ==========================================
    // Centered around [35, 0, 0]
    this.createStairSet(35, 0, 0, 16, 1.6, 10, concreteMat, railSteelMat);
    this.rails.push({
      id: 'stair-handrail-center',
      start: [35, 2.3, -5],
      end: [35, 0.8, 5],
      radius: 0.12,
      type: 'down',
    });
    this.rails.push({
      id: 'stair-hubba-left',
      start: [27.5, 2.1, -5],
      end: [27.5, 0.6, 5],
      radius: 0.2,
      type: 'ledge',
    });
    this.rails.push({
      id: 'stair-hubba-right',
      start: [42.5, 2.1, -5],
      end: [42.5, 0.6, 5],
      radius: 0.2,
      type: 'ledge',
    });

    // ==========================================
    // 6. LONGER GROUND GRIND RAILS & RAINBOW RAIL
    // ==========================================
    // Long flat rail at [18, 0, -25] to [18, 0, 25]
    this.createRoundRail(18, 0.8, -22, 18, 0.8, 22, railSteelMat);
    this.rails.push({
      id: 'east-long-flat-rail',
      start: [18, 0.8, -22],
      end: [18, 0.8, 22],
      radius: 0.12,
      type: 'flat',
    });

    // Kinked rail at [-20, 0, -25]
    this.createKinkedRail(-20, 0, -25, railSteelMat);
    this.rails.push({
      id: 'west-kinked-rail-1',
      start: [-20, 1.2, -35],
      end: [-20, 1.2, -25],
      radius: 0.12,
      type: 'flat',
    });
    this.rails.push({
      id: 'west-kinked-rail-2',
      start: [-20, 1.2, -25],
      end: [-20, 0.6, -15],
      radius: 0.12,
      type: 'down',
    });

    // Rainbow Rail (arched rail) at [48, 0, -30]
    this.createRainbowRail(48, -30, 14, 2.5, railSteelMat);
    this.rails.push({
      id: 'rainbow-rail',
      start: [48, 0.6, -37],
      end: [48, 0.6, -23],
      radius: 0.15,
      type: 'rainbow',
    });

    // Flat skate curb benches
    this.createSkateBench(10, 0, -38, 8, 0.6, 1.2, concreteMat);
    this.rails.push({
      id: 'bench-coping-1',
      start: [6, 0.6, -38],
      end: [14, 0.6, -38],
      radius: 0.15,
      type: 'ledge',
    });

    this.createSkateBench(10, 0, 38, 8, 0.6, 1.2, concreteMat);
    this.rails.push({
      id: 'bench-coping-2',
      start: [6, 0.6, 38],
      end: [14, 0.6, 38],
      radius: 0.15,
      type: 'ledge',
    });
  }

  // Helper: Create Quarterpipe with smooth curved profile
  private createQuarterPipe(x: number, y: number, z: number, width: number, height: number, depth: number, rotationY: number, mat: THREE.Material, copingMat: THREE.Material) {
    const qpGroup = new THREE.Group();
    qpGroup.position.set(x, y, z);
    qpGroup.rotation.y = rotationY;

    // Curved ramp surface using Cylinder slice
    const radius = depth;
    const radialSegments = 16;
    const curveGeo = new THREE.CylinderGeometry(radius, radius, width, radialSegments, 1, true, 0, Math.PI / 2);
    const curveMesh = new THREE.Mesh(curveGeo, mat);
    curveMesh.rotation.z = Math.PI / 2;
    curveMesh.rotation.y = Math.PI;
    curveMesh.position.set(0, radius, 0);
    curveMesh.receiveShadow = true;
    qpGroup.add(curveMesh);

    // Flat platform top deck
    const deckDepth = 4;
    const deckGeo = new THREE.BoxGeometry(width, 0.4, deckDepth);
    const deckMesh = new THREE.Mesh(deckGeo, mat);
    deckMesh.position.set(0, height, -deckDepth / 2);
    deckMesh.receiveShadow = true;
    qpGroup.add(deckMesh);

    // Coping pipe along top edge
    const copingGeo = new THREE.CylinderGeometry(0.15, 0.15, width, 12);
    const coping = new THREE.Mesh(copingGeo, copingMat);
    coping.rotation.z = Math.PI / 2;
    coping.position.set(0, height, 0);
    coping.castShadow = true;
    qpGroup.add(coping);

    // Side walls
    const wallGeo = new THREE.BoxGeometry(0.4, height, depth + deckDepth);
    const wallL = new THREE.Mesh(wallGeo, mat);
    wallL.position.set(-width / 2, height / 2, -deckDepth / 2);
    const wallR = new THREE.Mesh(wallGeo, mat);
    wallR.position.set(width / 2, height / 2, -deckDepth / 2);
    qpGroup.add(wallL, wallR);

    this.group.add(qpGroup);
  }

  // Helper: Create Halfpipe
  private createHalfPipe(x: number, y: number, z: number, width: number, height: number, length: number, mat: THREE.Material, copingMat: THREE.Material) {
    const hpGroup = new THREE.Group();
    hpGroup.position.set(x, y, z);

    // Flat bottom flat between transitions
    const flatWidth = 6;
    const flatGeo = new THREE.PlaneGeometry(flatWidth, length);
    const flatMesh = new THREE.Mesh(flatGeo, mat);
    flatMesh.rotation.x = -Math.PI / 2;
    flatMesh.position.y = 0.02;
    flatMesh.receiveShadow = true;
    hpGroup.add(flatMesh);

    // East ramp curve
    const rEast = this.createHalfPipeSide(width / 2, height, length, false, mat, copingMat);
    rEast.position.set(flatWidth / 2 + 2, 0, 0);
    hpGroup.add(rEast);

    // West ramp curve
    const rWest = this.createHalfPipeSide(width / 2, height, length, true, mat, copingMat);
    rWest.position.set(-(flatWidth / 2 + 2), 0, 0);
    hpGroup.add(rWest);

    this.group.add(hpGroup);
  }

  private createHalfPipeSide(curveRadius: number, height: number, length: number, flip: boolean, mat: THREE.Material, copingMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const curveGeo = new THREE.CylinderGeometry(curveRadius, curveRadius, length, 14, 1, true, 0, Math.PI / 2.2);
    const curve = new THREE.Mesh(curveGeo, mat);
    curve.rotation.x = Math.PI / 2;
    curve.rotation.z = flip ? Math.PI : -Math.PI / 2;
    curve.position.set(flip ? -curveRadius : curveRadius, curveRadius, 0);
    group.add(curve);

    // Coping
    const copingGeo = new THREE.CylinderGeometry(0.15, 0.15, length, 12);
    const coping = new THREE.Mesh(copingGeo, copingMat);
    coping.rotation.x = Math.PI / 2;
    coping.position.set(flip ? -(curveRadius + 0.1) : (curveRadius + 0.1), height, 0);
    group.add(coping);

    // Deck
    const deckGeo = new THREE.BoxGeometry(3, 0.4, length);
    const deck = new THREE.Mesh(deckGeo, mat);
    deck.position.set(flip ? -(curveRadius + 1.5) : (curveRadius + 1.5), height, 0);
    group.add(deck);

    return group;
  }

  // Helper: Funbox Pyramid
  private createFunbox(x: number, y: number, z: number, width: number, height: number, depth: number, mat: THREE.Material) {
    const boxGroup = new THREE.Group();
    boxGroup.position.set(x, y, z);

    // Top table
    const tableGeo = new THREE.BoxGeometry(width, height, depth);
    const table = new THREE.Mesh(tableGeo, mat);
    table.position.y = height / 2;
    table.receiveShadow = true;
    table.castShadow = true;
    boxGroup.add(table);

    // North bank ramp
    const bankDepth = 6;
    const slopeHyp = Math.sqrt(bankDepth * bankDepth + height * height);
    const bankMeshGeo = new THREE.PlaneGeometry(width, slopeHyp);
    const bankNorth = new THREE.Mesh(bankMeshGeo, mat);
    bankNorth.rotation.x = -Math.atan2(height, bankDepth);
    bankNorth.position.set(0, height / 2, -(depth / 2 + bankDepth / 2));
    bankNorth.receiveShadow = true;
    boxGroup.add(bankNorth);

    // South bank ramp
    const bankSouth = new THREE.Mesh(bankMeshGeo, mat);
    bankSouth.rotation.x = Math.atan2(height, bankDepth);
    bankSouth.position.set(0, height / 2, depth / 2 + bankDepth / 2);
    bankSouth.receiveShadow = true;
    boxGroup.add(bankSouth);

    this.group.add(boxGroup);
  }

  // Helper: Round Steel Rail
  private createRoundRail(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, mat: THREE.Material) {
    const railGroup = new THREE.Group();
    const start = new THREE.Vector3(x1, y1, z1);
    const end = new THREE.Vector3(x2, y2, z2);
    const dist = start.distanceTo(end);

    const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, dist, 12);
    const pipe = new THREE.Mesh(pipeGeo, mat);
    pipe.castShadow = true;

    // Position & orient cylinder between start and end
    pipe.position.copy(start.clone().add(end).multiplyScalar(0.5));
    pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    railGroup.add(pipe);

    // Legs / support posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const postCount = Math.max(2, Math.floor(dist / 4));
    for (let i = 0; i <= postCount; i++) {
      const alpha = i / postCount;
      const pos = start.clone().lerp(end, alpha);
      const postHeight = pos.y;
      if (postHeight > 0.1) {
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, postHeight, 8);
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(pos.x, postHeight / 2, pos.z);
        post.castShadow = true;
        railGroup.add(post);

        // Base plate
        const plateGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 8);
        const plate = new THREE.Mesh(plateGeo, postMat);
        plate.position.set(pos.x, 0.02, pos.z);
        railGroup.add(plate);
      }
    }

    this.group.add(railGroup);
  }

  // Helper: Kinked Rail (flat then sloped down)
  private createKinkedRail(x: number, y: number, z: number, mat: THREE.Material) {
    this.createRoundRail(x, y + 1.2, z - 10, x, y + 1.2, z, mat);
    this.createRoundRail(x, y + 1.2, z, x, y + 0.6, z + 10, mat);
  }

  // Helper: Rainbow Rail (half circle arch)
  private createRainbowRail(centerX: number, centerZ: number, span: number, archHeight: number, mat: THREE.Material) {
    const rainbowGroup = new THREE.Group();
    const curvePoints: THREE.Vector3[] = [];
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = Math.PI * (1 - t);
      const pz = centerZ - (span / 2) + t * span;
      const py = 0.6 + Math.sin(angle) * archHeight;
      curvePoints.push(new THREE.Vector3(centerX, py, pz));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.12, 8, false);
    const tube = new THREE.Mesh(tubeGeo, mat);
    tube.castShadow = true;
    rainbowGroup.add(tube);

    // Support pillars
    const postMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    [0.15, 0.5, 0.85].forEach((t) => {
      const pt = curve.getPoint(t);
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, pt.y, 8);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pt.x, pt.y / 2, pt.z);
      post.castShadow = true;
      rainbowGroup.add(post);
    });

    this.group.add(rainbowGroup);
  }

  // Helper: Stair Set with Hubbas and Rails
  private createStairSet(x: number, y: number, z: number, width: number, height: number, depth: number, mat: THREE.Material, railMat: THREE.Material) {
    const stairGroup = new THREE.Group();
    stairGroup.position.set(x, y, z);

    // 6 stairs
    const numSteps = 6;
    const stepHeight = height / numSteps;
    const stepDepth = depth / numSteps;

    for (let i = 0; i < numSteps; i++) {
      const curH = height - (i * stepHeight);
      const stepGeo = new THREE.BoxGeometry(width, curH, stepDepth);
      const step = new THREE.Mesh(stepGeo, mat);
      step.position.set(0, curH / 2, -(depth / 2) + i * stepDepth + stepDepth / 2);
      step.receiveShadow = true;
      step.castShadow = true;
      stairGroup.add(step);
    }

    // Top landing platform
    const landingGeo = new THREE.BoxGeometry(width + 6, height, 10);
    const landing = new THREE.Mesh(landingGeo, mat);
    landing.position.set(0, height / 2, -(depth / 2 + 5));
    landing.receiveShadow = true;
    stairGroup.add(landing);

    // Hubbas (concrete slope ledges on left and right)
    const hubbaMat = new THREE.MeshStandardMaterial({ color: 0x999088, roughness: 0.4 });
    const hubbaWidth = 1.2;
    const hubbaL = new THREE.Mesh(new THREE.BoxGeometry(hubbaWidth, height + 0.4, depth + 4), hubbaMat);
    hubbaL.position.set(-(width / 2 + hubbaWidth / 2), (height + 0.4) / 2 - 0.2, 0);
    hubbaL.rotation.x = -Math.atan2(height, depth);
    const hubbaR = hubbaL.clone();
    hubbaR.position.x = width / 2 + hubbaWidth / 2;
    stairGroup.add(hubbaL, hubbaR);

    // Center down-rail
    this.createRoundRail(0, height + 0.8, -depth / 2, 0, 0.7, depth / 2, railMat);

    this.group.add(stairGroup);
  }

  // Helper: Skate Bench
  private createSkateBench(x: number, y: number, z: number, length: number, height: number, width: number, mat: THREE.Material) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(x, y, z);

    const slabGeo = new THREE.BoxGeometry(length, 0.2, width);
    const slab = new THREE.Mesh(slabGeo, mat);
    slab.position.y = height;
    slab.castShadow = true;
    benchGroup.add(slab);

    // Metal coping edge
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });
    const copingFront = new THREE.Mesh(new THREE.BoxGeometry(length, 0.06, 0.06), metalMat);
    copingFront.position.set(0, height + 0.08, width / 2);
    const copingBack = copingFront.clone();
    copingBack.position.z = -width / 2;
    benchGroup.add(copingFront, copingBack);

    // Concrete legs
    const legGeo = new THREE.BoxGeometry(0.5, height - 0.1, width - 0.2);
    const legL = new THREE.Mesh(legGeo, mat);
    legL.position.set(-(length / 2 - 0.8), (height - 0.1) / 2, 0);
    const legR = new THREE.Mesh(legGeo, mat);
    legR.position.set(length / 2 - 0.8, (height - 0.1) / 2, 0);
    benchGroup.add(legL, legR);

    this.group.add(benchGroup);
  }

  // Setup Collectible items (S, K, A, T, E letters + secret cassette)
  private setupCollectibles() {
    this.collectibles = [
      { id: 'letter-S', type: 'letter', letter: 'S', position: [0, 6.8, -50], collected: false }, // North QP high air
      { id: 'letter-K', type: 'letter', letter: 'K', position: [18, 2.2, 0], collected: false },    // Over East long rail
      { id: 'letter-A', type: 'letter', letter: 'A', position: [0, 3.4, 0], collected: false },     // Atop Funbox center
      { id: 'letter-T', type: 'letter', letter: 'T', position: [-45, 5.5, 0], collected: false },   // Over Halfpipe
      { id: 'letter-E', type: 'letter', letter: 'E', position: [35, 3.2, 2], collected: false },    // Over 6-stair rail
      { id: 'cassette-1', type: 'cassette', position: [48, 4.2, -30], collected: false },           // Top of Rainbow rail
    ];

    this.collectibles.forEach((item) => {
      const meshGroup = new THREE.Group();
      meshGroup.position.set(...item.position);

      if (item.type === 'letter' && item.letter) {
        // Glowing gold 3D Letter Badge
        const letterMesh = this.createLetterMesh(item.letter);
        meshGroup.add(letterMesh);

        // Rotating halo ring
        const ringGeo = new THREE.TorusGeometry(0.9, 0.06, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        meshGroup.add(ring);
      } else {
        // Neon Secret Cassette / Trophy
        const cassetteGeo = new THREE.BoxGeometry(0.8, 0.5, 0.15);
        const cassetteMat = new THREE.MeshStandardMaterial({
          color: 0xff00ff,
          emissive: 0xaa00aa,
          emissiveIntensity: 0.6,
          metalness: 0.5,
        });
        const cassette = new THREE.Mesh(cassetteGeo, cassetteMat);
        meshGroup.add(cassette);
      }

      this.collectibleMeshes.set(item.id, meshGroup);
      this.group.add(meshGroup);
    });
  }

  private createLetterMesh(letter: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(64, 64, 58, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.font = 'bold 72px Impact, sans-serif';
      ctx.fillStyle = '#220033';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 64, 66);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const badgeGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.15, 24);
    const badgeMat = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0xff9900,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.rotation.x = Math.PI / 2;
    return badge;
  }

  // Animate collectibles (hover & spin)
  public update(delta: number) {
    const time = performance.now() * 0.0025;
    this.collectibles.forEach((item) => {
      const mesh = this.collectibleMeshes.get(item.id);
      if (mesh && !item.collected) {
        mesh.rotation.y += delta * 2.2;
        mesh.position.y = item.position[1] + Math.sin(time * 3 + item.position[0]) * 0.2;
      }
    });
  }
}
