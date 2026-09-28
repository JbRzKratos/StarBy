import * as THREE from 'three';
import type {
  ArtworkLayer3D,
  Garment3DConfig,
  PrintableRegion3D,
  SurfaceProjectorConfig,
} from '../../types/threeD';
import type { GarmentPanel3D } from './garmentPanels';

export class TextureCompositor3D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private diffuseImage: HTMLImageElement | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private resolution: number;
  private highlightPanel: GarmentPanel3D | null = null;

  // Offscreen scratch canvases for isolated artwork compositing & fold masking
  private artworkCanvas: HTMLCanvasElement;
  private artworkCtx: CanvasRenderingContext2D;
  private diffuseMaskCanvas: HTMLCanvasElement;
  private diffuseMaskCtx: CanvasRenderingContext2D;

  // WebGL 3D Surface Projector Subsystem
  private renderer: THREE.WebGLRenderer | null = null;
  private garmentMesh: THREE.Mesh | THREE.SkinnedMesh | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private projScene: THREE.Scene | null = null;
  private projCamera: THREE.OrthographicCamera | null = null;
  private projMaterial: THREE.ShaderMaterial | null = null;
  private projMesh: THREE.Mesh | null = null;
  private projCanvas: HTMLCanvasElement | null = null;
  private projCtx: CanvasRenderingContext2D | null = null;
  private pixelBuffer: Uint8Array | null = null;
  private projMeshCenter: THREE.Vector3 = new THREE.Vector3();
  private threeTextureCache: Map<string, THREE.CanvasTexture | THREE.Texture> = new Map();

  constructor(resolution = 2048) {
    this.resolution = resolution;
    this.canvas = document.createElement('canvas');
    this.canvas.width = resolution;
    this.canvas.height = resolution;

    const ctx = this.canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) {
      throw new Error('Failed to create 2D canvas context for TextureCompositor3D');
    }
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Offscreen artwork canvas
    this.artworkCanvas = document.createElement('canvas');
    this.artworkCanvas.width = resolution;
    this.artworkCanvas.height = resolution;
    const artCtx = this.artworkCanvas.getContext('2d', { willReadFrequently: false });
    if (!artCtx) throw new Error('Failed to create artwork scratch context');
    this.artworkCtx = artCtx;
    this.artworkCtx.imageSmoothingEnabled = true;
    this.artworkCtx.imageSmoothingQuality = 'high';

    // Offscreen diffuse mask canvas
    this.diffuseMaskCanvas = document.createElement('canvas');
    this.diffuseMaskCanvas.width = resolution;
    this.diffuseMaskCanvas.height = resolution;
    const maskCtx = this.diffuseMaskCanvas.getContext('2d', { willReadFrequently: false });
    if (!maskCtx) throw new Error('Failed to create diffuse mask scratch context');
    this.diffuseMaskCtx = maskCtx;
    this.diffuseMaskCtx.imageSmoothingEnabled = true;
    this.diffuseMaskCtx.imageSmoothingQuality = 'high';

    // GlTF textures are NOT Y-flipped in Verge3D/Three.js when using standard coordinates
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.flipY = false;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.initProjectorSubsystem();
  }

  private initProjectorSubsystem(): void {
    const res = this.resolution;
    this.renderTarget = new THREE.WebGLRenderTarget(res, res, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      generateMipmaps: false,
    });

    this.projScene = new THREE.Scene();
    this.projCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);

    this.projMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform mat4 uProjectorMatrix;
        uniform vec3 uMeshCenter;
        uniform vec3 uProjectorDir;
        uniform float uFacingThreshold;

        varying vec2 vProjCoord;
        varying float vFacing;
        varying float vInBounds;

        void main() {
          // Render directly into UV coordinate space NDC [-1, 1]
          gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 0.0, 1.0);

          // Center the garment geometry so all models share the exact same origin
          vec3 centeredPos = position - uMeshCenter;
          vec4 clip = uProjectorMatrix * vec4(centeredPos, 1.0);
          vProjCoord = vec2(clip.x * 0.5 + 0.5, clip.y * 0.5 + 0.5);

          vFacing = dot(normalize(normal), -uProjectorDir);
          vInBounds = (vFacing > uFacingThreshold) ? 1.0 : 0.0;
        }
      `,
      fragmentShader: `
        uniform sampler2D uArtworkTexture;
        uniform float uOpacity;
        uniform float uFacingThreshold;
        uniform vec2 uFlip;

        varying vec2 vProjCoord;
        varying float vFacing;
        varying float vInBounds;

        void main() {
          if (vInBounds < 0.5) discard;
          vec2 coord = vProjCoord;
          if (uFlip.x < 0.0) coord.x = 1.0 - coord.x;
          if (uFlip.y < 0.0) coord.y = 1.0 - coord.y;

          if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) discard;

          vec4 texColor = texture2D(uArtworkTexture, coord);
          if (texColor.a < 0.005) discard;

          // Smooth edge falloff near glancing angles to eliminate jagged polygon clipping
          float edgeAlpha = smoothstep(uFacingThreshold, uFacingThreshold + 0.12, vFacing);
          gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity * edgeAlpha);
        }
      `,
      uniforms: {
        uProjectorMatrix: { value: new THREE.Matrix4() },
        uMeshCenter: { value: this.projMeshCenter },
        uProjectorDir: { value: new THREE.Vector3(0, 0, -1) },
        uFacingThreshold: { value: 0.05 },
        uArtworkTexture: { value: null },
        uOpacity: { value: 1.0 },
        uFlip: { value: new THREE.Vector2(1.0, 1.0) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.projCanvas = document.createElement('canvas');
    this.projCanvas.width = res;
    this.projCanvas.height = res;
    this.projCtx = this.projCanvas.getContext('2d');
    this.pixelBuffer = new Uint8Array(res * res * 4);
  }

  public setRenderer(renderer: THREE.WebGLRenderer | null): void {
    this.renderer = renderer;
  }

  public setGarmentMesh(mesh: THREE.Mesh | THREE.SkinnedMesh | null): void {
    this.garmentMesh = mesh;
    if (this.projScene && mesh && mesh.geometry) {
      if (this.projMesh) {
        this.projScene.remove(this.projMesh);
      }
      mesh.geometry.computeBoundingBox();
      if (mesh.geometry.boundingBox) {
        mesh.geometry.boundingBox.getCenter(this.projMeshCenter);
      }
      this.projMesh = new THREE.Mesh(mesh.geometry, this.projMaterial!);
      this.projMesh.frustumCulled = false;
      this.projScene.add(this.projMesh);
    }
  }

  public getGarmentMesh(): THREE.Mesh | THREE.SkinnedMesh | null {
    return this.garmentMesh;
  }

  public getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getResolution(): number {
    return this.resolution;
  }

  public async setDiffuseTexture(url: string): Promise<void> {
    const img = await this.loadImage(url);
    this.diffuseImage = img;
  }

  public async preloadArtwork(url: string): Promise<HTMLImageElement> {
    const img = await this.loadImage(url);
    if (!this.threeTextureCache.has(url)) {
      const tex = new THREE.CanvasTexture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      this.threeTextureCache.set(url, tex);
    }
    return img;
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = (err) => {
        console.warn(`[TextureCompositor3D] Failed to load image: ${url}`, err);
        reject(err);
      };
      img.src = url;
    });
  }

  /**
   * Re-renders the UV canvas to produce the garment base-color texture.
   *
   * 1. Base Garment Shading:
   *    - Fills garment base color.
   *    - Blends photographic diffuse fold map into fabric with 'multiply'.
   *
   * 2. Artwork Placement & Layering:
   *    - Supports 'atlas' mode: Unrestricted positioning anywhere on full UV atlas.
   *    - Supports 'surface' mode: Continuous 3D surface projection across adjoining panels (e.g. torso to sleeve).
   *    - Supports 'region' mode: Constrained print region for quick standard chest placement.
   *
   * 3. Photometric Ink Integration:
   *    - Screen-print fold modulation ensures ink shares fabric folds and micro-texture
   *      without losing white ink brightness or black ink contrast.
   */
  public composite(
    garmentColor: string,
    artworkLayers: ArtworkLayer3D[],
    garmentConfig: Garment3DConfig,
    _activeRegionId?: string,
    includeHighlight = true
  ): void {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // ── Step 1: Clear & fill garment base color ──────────────────────────────
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = garmentColor;
    ctx.fillRect(0, 0, width, height);

    // ── Step 2: Realistic Garment Shading Pass (Multiply) ────────────────────
    if (this.diffuseImage) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 1.0;
      ctx.drawImage(this.diffuseImage, 0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // ── Step 3: Isolated Artwork Pass ────────────────────────────────────────
    const activeLayers = artworkLayers.filter((l) => l.opacity > 0);

    if (activeLayers.length > 0) {
      const artCtx = this.artworkCtx;
      artCtx.clearRect(0, 0, width, height);
      artCtx.globalCompositeOperation = 'source-over';
      artCtx.globalAlpha = 1.0;

      const regionsMap = new Map<string, PrintableRegion3D>();
      garmentConfig.regions.forEach((r) => regionsMap.set(r.id, r));

      for (const layer of activeLayers) {
        const img = this.imageCache.get(layer.imageUrl);
        if (!img || !img.complete || img.naturalWidth === 0) continue;

        const placementMode = layer.placementMode || 'atlas';

        if (placementMode === 'surface') {
          // ── Mode A: 3D Surface Projection across adjoining panels ──────────
          this.renderSurfaceProjection(layer, img, artCtx);
        } else if (placementMode === 'atlas') {
          // ── Mode B: Full UV Atlas Editing (unrestricted) ───────────────────
          this.renderAtlasLayer(layer, img, artCtx, width, height);
        } else {
          // ── Mode C: Region-Safe Placement ──────────────────────────────────
          this.renderRegionLayer(layer, img, artCtx, garmentConfig, regionsMap, width, height);
        }
      }

      // ── Step 3b: Modulate ink by fabric folds (Photometric Screen-Print) ─────
      // Diffuse map fold creases darken ink subtly while preserving source PNG alpha
      if (this.diffuseImage) {
        const maskCtx = this.diffuseMaskCtx;
        maskCtx.clearRect(0, 0, width, height);
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.globalAlpha = 1.0;
        maskCtx.drawImage(this.diffuseImage, 0, 0, width, height);

        // Keep diffuse only where artwork pixels exist
        maskCtx.globalCompositeOperation = 'destination-in';
        maskCtx.drawImage(this.artworkCanvas, 0, 0, width, height);

        // Multiply masked fold shadows onto the artwork
        artCtx.save();
        artCtx.globalCompositeOperation = 'multiply';
        artCtx.globalAlpha = 0.42;
        artCtx.drawImage(this.diffuseMaskCanvas, 0, 0, width, height);
        artCtx.restore();
      }

      // ── Step 3c: Stamp finished artwork onto garment surface ───────────────
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.drawImage(this.artworkCanvas, 0, 0, width, height);
    }

    // ── Step 4: Temporary 3D Panel Selection Highlight ────────────────────────
    // If a UV panel or 3D surface is selected, draw a subtle translucent highlight
    // and pulsing outline so the user can verify the exact 3D surface correspondence.
    if (includeHighlight && this.highlightPanel) {
      this.renderPanelHighlight(this.highlightPanel, width, height);
    }

    this.texture.needsUpdate = true;
  }

  public setHighlightPanel(panel: GarmentPanel3D | null): void {
    this.highlightPanel = panel;
  }

  public getHighlightPanel(): GarmentPanel3D | null {
    return this.highlightPanel;
  }

  private renderPanelHighlight(panel: GarmentPanel3D, width: number, height: number): void {
    const ctx = this.ctx;
    const minX = panel.minU * width;
    const minY = panel.minV * height;
    const w = (panel.maxU - panel.minU) * width;
    const h = (panel.maxV - panel.minV) * height;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Translucent glowing fill over the panel island
    ctx.fillStyle = `${panel.color}25`;
    ctx.fillRect(minX, minY, w, h);

    // Glowing border
    ctx.strokeStyle = panel.color;
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 10]);
    ctx.strokeRect(minX, minY, w, h);

    // Inner subtle border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(minX + 3, minY + 3, w - 6, h - 6);

    ctx.restore();
  }

  /**
   * Full UV Atlas Placement:
   * Direct normalized coordinates across the entire atlas (0.0 to 1.0, or beyond for edge bleed).
   * Unrestricted movement onto sleeves, back, collar, or spanning panels.
   */
  private renderAtlasLayer(
    layer: ArtworkLayer3D,
    img: HTMLImageElement,
    artCtx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // If explicit U, V are provided, use them; else fallback to mapped offsets
    const u = layer.u !== undefined ? layer.u : 0.5 + layer.offsetX * 0.5;
    const v = layer.v !== undefined ? layer.v : 0.5 + layer.offsetY * 0.5;

    const posX = u * width;
    const posY = v * height;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const baseSpan = 0.35 * layer.scale;

    let drawW: number;
    let drawH: number;

    if (layer.uvWidth !== undefined && layer.uvHeight !== undefined && !layer.lockAspectRatio) {
      drawW = layer.uvWidth * width;
      drawH = layer.uvHeight * height;
    } else if (layer.uvWidth !== undefined) {
      drawW = layer.uvWidth * width;
      drawH = drawW / imgAspect;
    } else {
      drawW = baseSpan * width;
      drawH = drawW / imgAspect;
    }

    artCtx.save();
    artCtx.translate(posX, posY);
    artCtx.rotate((layer.rotation * Math.PI) / 180);
    artCtx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
    artCtx.globalCompositeOperation = 'source-over';

    const flipX = layer.flipHorizontal ? -1 : 1;
    const flipY = layer.flipVertical ? -1 : 1;
    artCtx.scale(flipX, flipY);

    artCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    artCtx.restore();
  }

  /**
   * 3D Surface Projection:
   * Projects artwork from a 3D projector camera through the garment's rest-pose geometry,
   * baking continuously across torso, shoulder, and sleeve UV islands simultaneously.
   */
  private renderSurfaceProjection(
    layer: ArtworkLayer3D,
    img: HTMLImageElement,
    artCtx: CanvasRenderingContext2D
  ): void {
    const proj = layer.surfaceProjector || this.getDefaultProjector('chest_to_sleeve');
    const width = this.resolution;
    const height = this.resolution;

    if (
      this.renderer &&
      this.projScene &&
      this.projMesh &&
      this.renderTarget &&
      this.projCanvas &&
      this.projCtx &&
      this.pixelBuffer &&
      this.projMaterial
    ) {
      // 1. Get or create Three.js texture for artwork
      let threeTex = this.threeTextureCache.get(layer.imageUrl);
      if (!threeTex) {
        threeTex = new THREE.CanvasTexture(img);
        threeTex.colorSpace = THREE.SRGBColorSpace;
        this.threeTextureCache.set(layer.imageUrl, threeTex);
      }

      // 2. Setup Projector Camera & Matrix
      const pCam = new THREE.OrthographicCamera(
        -proj.sizeX / 2,
        proj.sizeX / 2,
        proj.sizeY / 2,
        -proj.sizeY / 2,
        0.1,
        proj.depth || 10.0
      );

      pCam.position.set(proj.posX, proj.posY, proj.posZ);
      const target = new THREE.Vector3(
        proj.posX + proj.dirX,
        proj.posY + proj.dirY,
        proj.posZ + proj.dirZ
      );
      pCam.lookAt(target);
      pCam.rotation.z += (layer.rotation * Math.PI) / 180;
      pCam.updateMatrixWorld(true);
      pCam.updateProjectionMatrix();

      const projMatrix = new THREE.Matrix4().multiplyMatrices(
        pCam.projectionMatrix,
        pCam.matrixWorldInverse
      );

      // 3. Update Projection Material Uniforms
      this.projMaterial.uniforms.uMeshCenter.value.copy(this.projMeshCenter);
      this.projMaterial.uniforms.uProjectorMatrix.value.copy(projMatrix);
      this.projMaterial.uniforms.uProjectorDir.value.set(proj.dirX, proj.dirY, proj.dirZ).normalize();
      this.projMaterial.uniforms.uFacingThreshold.value = proj.facingAngle ?? 0.05;
      this.projMaterial.uniforms.uArtworkTexture.value = threeTex;
      this.projMaterial.uniforms.uOpacity.value = Math.max(0, Math.min(1, layer.opacity));
      this.projMaterial.uniforms.uFlip.value.set(
        layer.flipHorizontal ? -1.0 : 1.0,
        layer.flipVertical ? -1.0 : 1.0
      );

      // 4. Render to offscreen render target
      const prevTarget = this.renderer.getRenderTarget();
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.setClearColor(0x000000, 0.0);
      this.renderer.clear();
      this.renderer.render(this.projScene, this.projCamera!);
      this.renderer.readRenderTargetPixels(
        this.renderTarget,
        0,
        0,
        width,
        height,
        this.pixelBuffer
      );
      this.renderer.setRenderTarget(prevTarget);

      let nonZero = 0;
      for (let i = 3; i < this.pixelBuffer.length; i += 64) {
        if (this.pixelBuffer[i] > 0) nonZero++;
      }
      console.log('[ProjectorRender]', layer.name, 'nonZeroPixelsSample:', nonZero, 'meshCenter:', this.projMeshCenter.toArray());

      // 5. Transfer to 2D Canvas
      const imgData = this.projCtx.createImageData(width, height);
      imgData.data.set(this.pixelBuffer);
      this.projCtx.putImageData(imgData, 0, 0);

      // 6. Draw projected islands onto artwork canvas
      artCtx.save();
      artCtx.globalCompositeOperation = 'source-over';
      artCtx.drawImage(this.projCanvas, 0, 0);
      artCtx.restore();
    } else {
      // Fallback: If 3D mesh is still loading, approximate on upper torso
      const posX = 0.25 * width;
      const posY = 0.65 * height;
      const drawW = 0.45 * width * layer.scale;
      const drawH = (drawW / (img.naturalWidth / img.naturalHeight));

      artCtx.save();
      artCtx.translate(posX, posY);
      artCtx.rotate((layer.rotation * Math.PI) / 180);
      artCtx.globalAlpha = layer.opacity;
      artCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      artCtx.restore();
    }
  }

  /**
   * Standard Region-Safe Placement (Legacy Chest / Back zone)
   */
  private renderRegionLayer(
    layer: ArtworkLayer3D,
    img: HTMLImageElement,
    artCtx: CanvasRenderingContext2D,
    garmentConfig: Garment3DConfig,
    regionsMap: Map<string, PrintableRegion3D>,
    width: number,
    height: number
  ): void {
    const region = regionsMap.get(layer.regionId) || garmentConfig.regions[0];
    if (!region) return;

    const uvCenterX = region.uvCenter[0];
    const uvCenterY = region.uvCenter[1];
    const spanW = region.uvSpan[0];
    const spanH = region.uvSpan[1];

    const posX = (uvCenterX + layer.offsetX * spanW * 0.5) * width;
    const posY = (uvCenterY + layer.offsetY * spanH * 0.5) * height;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const regionPxW = spanW * width;
    const regionPxH = spanH * height;
    const regionAspect = regionPxW / regionPxH;

    let drawW: number;
    let drawH: number;
    if (imgAspect >= regionAspect) {
      drawW = regionPxW * layer.scale;
      drawH = drawW / imgAspect;
    } else {
      drawH = regionPxH * layer.scale;
      drawW = drawH * imgAspect;
    }

    artCtx.save();
    artCtx.translate(posX, posY);
    artCtx.rotate((layer.rotation * Math.PI) / 180);
    artCtx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
    artCtx.globalCompositeOperation = 'source-over';

    if (layer.flipHorizontal) artCtx.scale(-1, 1);
    if (layer.flipVertical) artCtx.scale(1, -1);

    artCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    artCtx.restore();
  }

  public getDefaultProjector(preset: SurfaceProjectorConfig['preset']): SurfaceProjectorConfig {
    switch (preset) {
      case 'chest_to_sleeve':
        // Centered between right chest and right sleeve, crosses the shoulder seam
        return {
          preset: 'chest_to_sleeve',
          posX: 0.85,
          posY: 1.60,
          posZ: 3.2,
          dirX: 0.0,
          dirY: 0.0,
          dirZ: -1.0,
          sizeX: 4.4,
          sizeY: 3.4,
          facingAngle: 0.05,
          depth: 8.0,
        };
      case 'chest_to_left_sleeve':
        return {
          preset: 'chest_to_left_sleeve',
          posX: -0.85,
          posY: 1.60,
          posZ: 3.2,
          dirX: 0.0,
          dirY: 0.0,
          dirZ: -1.0,
          sizeX: 4.4,
          sizeY: 3.4,
          facingAngle: 0.05,
          depth: 8.0,
        };
      case 'torso_front':
        return {
          preset: 'torso_front',
          posX: 0.0,
          posY: 1.20,
          posZ: 3.2,
          dirX: 0.0,
          dirY: 0.0,
          dirZ: -1.0,
          sizeX: 3.8,
          sizeY: 4.4,
          facingAngle: 0.05,
          depth: 8.0,
        };
      case 'torso_back':
        return {
          preset: 'torso_back',
          posX: 0.0,
          posY: 1.20,
          posZ: -3.2,
          dirX: 0.0,
          dirY: 0.0,
          dirZ: 1.0,
          sizeX: 3.8,
          sizeY: 4.4,
          facingAngle: 0.05,
          depth: 8.0,
        };
      case 'sleeve_right':
        return {
          preset: 'sleeve_right',
          posX: 3.0,
          posY: 1.65,
          posZ: 0.0,
          dirX: -1.0,
          dirY: 0.0,
          dirZ: 0.0,
          sizeX: 3.0,
          sizeY: 3.2,
          facingAngle: 0.05,
          depth: 8.0,
        };
      case 'sleeve_left':
        return {
          preset: 'sleeve_left',
          posX: -3.0,
          posY: 1.65,
          posZ: 0.0,
          dirX: 1.0,
          dirY: 0.0,
          dirZ: 0.0,
          sizeX: 3.0,
          sizeY: 3.2,
          facingAngle: 0.05,
          depth: 8.0,
        };
      default:
        return {
          preset: 'custom',
          posX: 0.0,
          posY: 1.20,
          posZ: 3.2,
          dirX: 0.0,
          dirY: 0.0,
          dirZ: -1.0,
          sizeX: 3.8,
          sizeY: 4.0,
          facingAngle: 0.05,
          depth: 8.0,
        };
    }
  }

  public dispose(): void {
    this.texture.dispose();
    this.imageCache.clear();
    this.threeTextureCache.forEach((t) => t.dispose());
    this.threeTextureCache.clear();
    this.diffuseImage = null;
    if (this.renderTarget) this.renderTarget.dispose();
    if (this.projMaterial) this.projMaterial.dispose();
  }
}
