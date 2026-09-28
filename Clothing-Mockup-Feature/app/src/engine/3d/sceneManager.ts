import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import type { CameraPreset3D, LightingConfig3D } from '../../types/threeD';

export class SceneManager3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  private container: HTMLElement;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private shadowPlane: THREE.Mesh;
  private rgbeLoader: RGBELoader;

  private currentTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private currentDistance = 7.5;
  private targetCameraPos: THREE.Vector3 | null = null;
  private targetControlsTarget: THREE.Vector3 | null = null;

  private isTurntable = false;
  private turntableSpeed = 0.5; // rad/s

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    this.camera.position.set(0, 0, 7.5);

    // 3. WebGL Renderer
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || 'ontouchstart' in window);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, // Disable MSAA on mobile for 60fps performance
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      isMobile
        ? Math.min(window.devicePixelRatio || 1, 1.5)
        : Math.min(window.devicePixelRatio || 1, 2)
    );
    // ACESFilmic gives rich contrast and filmic response without clipping whites
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = 'none';

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 30.0;
    this.controls.maxPolarAngle = Math.PI * 0.85; // don't go below ground
    this.controls.minPolarAngle = Math.PI * 0.05; // don't go above top
    this.controls.target.set(0, 0, 0);

    // 5. Lighting — Balanced studio setup
    // ──────────────────────────────────────
    // Ambient: restrained so normal map shadows and fold crevices have depth
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(this.ambientLight);

    // Key Light (front-top-right, primary directional light & shadow caster)
    this.keyLight = new THREE.DirectionalLight(0xfff8f0, 0.95);
    this.keyLight.position.set(3, 7, 5);
    this.keyLight.castShadow = true;
    const shadowMapDim = isMobile ? 1024 : 2048;
    this.keyLight.shadow.mapSize.width = shadowMapDim;
    this.keyLight.shadow.mapSize.height = shadowMapDim;
    this.keyLight.shadow.camera.near = 1.0;
    this.keyLight.shadow.camera.far = 25;
    this.keyLight.shadow.camera.left = -4;
    this.keyLight.shadow.camera.right = 4;
    this.keyLight.shadow.camera.top = 5;
    this.keyLight.shadow.camera.bottom = -5;
    this.keyLight.shadow.radius = isMobile ? 1.5 : 3.0;
    this.keyLight.shadow.bias = -0.0001;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    // Fill Light (soft cool-tinted from left, provides gentle edge illumination)
    this.fillLight = new THREE.DirectionalLight(0xe8eeff, 0.35);
    this.fillLight.position.set(-5, 2, 3);
    this.scene.add(this.fillLight);

    // Rim / Back Light (illuminates the rear of the garment so back view and camera orbits
    // have clear, beautiful form definition rather than looking dark or unshaded)
    this.rimLight = new THREE.DirectionalLight(0xfff5e8, 0.45);
    this.rimLight.position.set(-3, 6, -5);
    this.scene.add(this.rimLight);

    // 6. Ground Shadow Plane with Radial Falloff
    // Generates a soft radial falloff so contact shadow has no sharp bounding box edges
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const radialAlphaMap = new THREE.CanvasTexture(shadowCanvas);
    radialAlphaMap.wrapS = THREE.ClampToEdgeWrapping;
    radialAlphaMap.wrapT = THREE.ClampToEdgeWrapping;

    // Directional shadow receiver plane
    const planeGeo = new THREE.PlaneGeometry(16, 16);
    const planeMat = new THREE.ShadowMaterial({
      opacity: 0.20,
      transparent: true,
    });
    this.shadowPlane = new THREE.Mesh(planeGeo, planeMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -3.45;
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.shadowPlane);

    // Subtle soft radial contact shadow directly grounded beneath the garment
    const contactMat = new THREE.MeshBasicMaterial({
      color: 0x050608,
      alphaMap: radialAlphaMap,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const contactPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), contactMat);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.set(0, -3.44, 0);
    this.scene.add(contactPlane);

    // 7. HDR Environment Map
    this.rgbeLoader = new RGBELoader();
    this.loadHDR('/3d-assets/environment.hdr');
  }

  public async loadHDR(hdrUrl: string): Promise<void> {
    try {
      const texture = await this.rgbeLoader.loadAsync(hdrUrl);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.environmentIntensity = 0.7;
    } catch (err) {
      console.warn('[SceneManager3D] Failed to load HDR environment map:', err);
      this.ambientLight.intensity = 0.5;
    }
  }

  public applyLighting(config: LightingConfig3D): void {
    this.ambientLight.intensity = config.ambientIntensity;
    this.keyLight.intensity = config.sunIntensity;

    if (this.scene.environment) {
      this.scene.environmentIntensity = config.hdrIntensity;
    }

    // Directional light angle from azimuth/elevation sliders
    const azRad = (config.sunAzimuth * Math.PI) / 180;
    const elRad = (config.sunElevation * Math.PI) / 180;
    const dist = 10;
    this.keyLight.position.set(
      Math.sin(azRad) * Math.cos(elRad) * dist,
      Math.sin(elRad) * dist,
      Math.cos(azRad) * Math.cos(elRad) * dist
    );

    // Rim light counter-balances opposite key light
    this.rimLight.position.set(
      -Math.sin(azRad) * Math.cos(elRad) * dist,
      Math.sin(elRad) * dist,
      -Math.cos(azRad) * Math.cos(elRad) * dist
    );
    this.rimLight.intensity = config.sunIntensity * 0.45;

    (this.shadowPlane.material as THREE.ShadowMaterial).opacity = config.shadowIntensity;

    if (config.isTransparentBg) {
      this.scene.background = null;
      this.renderer.setClearColor(0x000000, 0);
    } else {
      const bgColor = new THREE.Color(config.bgColor);
      this.scene.background = bgColor;
      this.renderer.setClearColor(bgColor, 1);
    }
  }

  public setCameraFraming(target: [number, number, number], distance: number, fov = 45, defaultPreset: CameraPreset3D = 'front'): void {
    this.currentTarget.set(...target);
    this.currentDistance = distance;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();

    // Position shadow plane just below the garment's bottom hem
    const garmentBottomEstimate = target[1] - 3.45;
    this.shadowPlane.position.y = garmentBottomEstimate;

    this.setCameraPreset(defaultPreset);
  }

  public setCameraPreset(preset: CameraPreset3D): void {
    const t = this.currentTarget;
    const d = this.currentDistance;

    const newPos = new THREE.Vector3();

    switch (preset) {
      case 'front':
        newPos.set(t.x, t.y, t.z + d);
        break;
      case 'back':
        newPos.set(t.x, t.y, t.z - d);
        break;
      case 'left':
        newPos.set(t.x - d, t.y, t.z);
        break;
      case 'right':
        newPos.set(t.x + d, t.y, t.z);
        break;
      case 'threeQuarter':
        newPos.set(t.x + d * 0.7, t.y + d * 0.25, t.z + d * 0.7);
        break;
      case 'top':
        newPos.set(t.x, t.y + d, t.z + 0.001);
        break;
      case 'custom':
      default:
        return;
    }

    this.targetCameraPos = newPos;
    this.targetControlsTarget = t.clone();
  }

  public setTurntable(enabled: boolean, speed = 0.5): void {
    this.isTurntable = enabled;
    this.turntableSpeed = speed;
  }

  public update(delta: number): void {
    // Smooth camera transition to preset
    if (this.targetCameraPos && this.targetControlsTarget) {
      const alpha = Math.min(delta * 6.0, 1.0);
      this.camera.position.lerp(this.targetCameraPos, alpha);
      this.controls.target.lerp(this.targetControlsTarget, alpha);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.02) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetControlsTarget);
        this.targetCameraPos = null;
        this.targetControlsTarget = null;
      }
    }

    // Turntable auto-rotate
    if (this.isTurntable) {
      const rotAngle = this.turntableSpeed * delta;
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotAngle);
      this.camera.position.copy(this.controls.target).add(offset);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.controls.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
