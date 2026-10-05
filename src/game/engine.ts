import * as THREE from 'three';
import { Skatepark } from './skatepark';
import { SkaterModel } from './skaterModel';
import { ParticleSystem } from './particles';
import { SkaterController } from './skaterController';
import type { InputState } from './skaterController';
import { audioEngine } from './audio';

export type CameraMode = 'follow' | 'close' | 'overview';

export class GameEngine {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public skatepark: Skatepark;
  public skaterModel: SkaterModel;
  public particles: ParticleSystem;
  public controller: SkaterController;

  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  public cameraMode: CameraMode = 'follow';

  // Input states
  public input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    ollie: false,
    kickflip: false,
    heelflip: false,
    shuvit: false,
    grind: false,
    manual: false,
    grab: false,
  };

  constructor(container: HTMLElement) {
    this.container = container;
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x8a4332, 0.0045); // Warm sunset atmospheric fog

    // 2. Camera setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLights();

    // 5. Game Objects
    this.skatepark = new Skatepark();
    this.scene.add(this.skatepark.group);

    this.skaterModel = new SkaterModel();
    this.scene.add(this.skaterModel.group);

    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    this.controller = new SkaterController(this.skaterModel, this.skatepark, this.particles);

    // 6. System
    this.clock = new THREE.Clock();

    // Event listeners
    this.setupKeyboardListeners();
    window.addEventListener('resize', this.onResize);
  }

  private setupLights() {
    // Ambient light - twilight purple/violet
    const ambientLight = new THREE.AmbientLight(0x7c5a88, 0.85);
    this.scene.add(ambientLight);

    // Hemisphere light - Sky sunset peach, ground dark purple
    const hemiLight = new THREE.HemisphereLight(0xffa570, 0x221a30, 0.9);
    this.scene.add(hemiLight);

    // Main Golden Hour Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xffb86c, 2.4);
    sunLight.position.set(-140, 55, -120);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    const d = 90;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Park floodlight accents
    const flood1 = new THREE.PointLight(0x00f0ff, 1.2, 50);
    flood1.position.set(0, 12, -40);
    this.scene.add(flood1);

    const flood2 = new THREE.PointLight(0xff007f, 1.2, 50);
    flood2.position.set(0, 12, 40);
    this.scene.add(flood2);
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      audioEngine.init();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          break;
        case 'Space':
          this.input.ollie = true;
          e.preventDefault();
          break;
        case 'KeyJ':
        case 'Digit1':
          this.input.kickflip = true;
          break;
        case 'KeyK':
        case 'Digit2':
          this.input.heelflip = true;
          break;
        case 'KeyL':
        case 'Digit3':
          this.input.shuvit = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyG':
          this.input.grind = true;
          break;
        case 'KeyM':
          this.input.manual = true;
          break;
        case 'KeyI':
          this.input.grab = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'Space':
          this.input.ollie = false;
          break;
        case 'KeyJ':
        case 'Digit1':
          this.input.kickflip = false;
          break;
        case 'KeyK':
        case 'Digit2':
          this.input.heelflip = false;
          break;
        case 'KeyL':
        case 'Digit3':
          this.input.shuvit = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyG':
          this.input.grind = false;
          break;
        case 'KeyM':
          this.input.manual = false;
          break;
        case 'KeyI':
          this.input.grab = false;
          break;
      }
    });
  }

  // Poll Gamepad API
  private updateGamepadInput() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    // Left Stick / D-Pad
    const stickX = gp.axes[0] || 0;
    const stickY = gp.axes[1] || 0;

    if (Math.abs(stickX) > 0.25) {
      this.input.left = stickX < -0.25;
      this.input.right = stickX > 0.25;
    }
    if (Math.abs(stickY) > 0.25) {
      this.input.forward = stickY < -0.25;
      this.input.backward = stickY > 0.25;
    }

    // Buttons
    this.input.ollie = gp.buttons[0]?.pressed || this.input.ollie;
    this.input.manual = gp.buttons[1]?.pressed || this.input.manual;
    this.input.kickflip = gp.buttons[2]?.pressed || this.input.kickflip;
    this.input.grind = (gp.buttons[3]?.pressed || gp.buttons[5]?.pressed) || this.input.grind;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.updateGamepadInput();

    // 1. Update Skater Controller
    this.controller.update(delta, this.input);

    // 2. Update Skatepark (collectibles spin)
    this.skatepark.update(delta);

    // 3. Update Particles
    this.particles.update(delta);

    // 4. Update Camera position & orientation
    this.updateCamera(delta);

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private updateCamera(delta: number) {
    const skaterPos = this.controller.position;
    const heading = this.controller.heading;
    const speed = this.controller.speed;

    // Follow distance & height
    let targetDist = 7.5;
    let targetHeight = 3.6;

    if (this.cameraMode === 'close') {
      targetDist = 4.2;
      targetHeight = 2.0;
    } else if (this.cameraMode === 'overview') {
      targetDist = 26.0;
      targetHeight = 18.0;
    }

    // Widen FOV with speed for thrill
    const targetFOV = 62 + Math.min(Math.abs(speed) / 25, 1.0) * 16;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 3);
    this.camera.updateProjectionMatrix();

    // Calculate position behind skater based on heading
    const behindX = skaterPos.x + Math.sin(heading) * targetDist;
    const behindZ = skaterPos.z + Math.cos(heading) * targetDist;
    const targetCamPos = new THREE.Vector3(behindX, Math.max(skaterPos.y + targetHeight, 1.5), behindZ);

    // Smooth lerp
    this.camera.position.lerp(targetCamPos, delta * 7.5);

    // Look at point slightly in front of and above skater
    const lookAtTarget = skaterPos.clone().add(new THREE.Vector3(-Math.sin(heading) * 2, 1.2, -Math.cos(heading) * 2));
    this.camera.lookAt(lookAtTarget);
  }

  public resetPark() {
    this.controller.position.set(0, 0, 30);
    this.controller.velocity.set(0, 0, 0);
    this.controller.speed = 0;
    this.controller.heading = Math.PI;
    this.controller.isGrounded = true;
    this.controller.isGrinding = false;
    this.controller.isManualing = false;
    this.controller.isBailed = false;
    this.controller.comboList = [];
    this.controller.currentComboBasePoints = 0;

    // Reset collectibles
    this.skatepark.collectibles.forEach((item) => {
      item.collected = false;
      const mesh = this.skatepark.collectibleMeshes.get(item.id);
      if (mesh) mesh.visible = true;
    });
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
