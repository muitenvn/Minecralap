import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import {
  BLOCK,
  BLOCK_DEFS,
  ITEM_DEFS,
  isBlockLiquid,
  isBlockSolid,
  isBlockTransparent,
} from './blocks';
import { buildSubChunkGeometry } from './chunkMesher';
import { executeCommand } from './commands';
import {
  buildMobMesh,
  disposeMobMesh,
  MOB_SPECS,
  MobEntity,
  MobType,
  updateMobAI,
} from './mobs';
import {
  animatePlayerRig,
  buildFirstPersonSkinArm,
  buildMinecraftPlayerRig,
  loadSavedSkinConfig,
  PlayerRig,
  updateRigArmorVisuals,
} from './playerSkin';
import { SMELTING_RECIPES } from './recipes';
import { CompiledResourcePack } from './resourcePack';
import { saveWorld } from './storage';
import {
  ActiveEffect,
  CameraMode,
  CHUNK_SIZE,
  ContainerType,
  DimensionId,
  EffectId,
  EnchantmentId,
  GameMode,
  HudSnapshot,
  ItemStack,
  PlayerSkinConfig,
  SUBCHUNK_COUNT,
  TargetBlockInfo,
  VideoSettings,
  WORLD_BORDER_DEFAULT,
  WORLD_HEIGHT_MAX,
  WorldSave,
} from './types';
import {
  AnyBiome,
  BIOME_LABELS,
  ChunkColumn,
  getChunkBlock,
  NETHER_LAVA_LEVEL,
  SEA_LEVEL,
  setChunkBlock,
  WorldGenerator,
} from './worldGen';

interface ChunkMeshEntry {
  col: ChunkColumn;
  group: THREE.Group;
  opaqueMeshes: (THREE.Mesh | null)[];
  transMeshes: (THREE.Mesh | null)[];
}

interface BreakParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onChatMessage: (text: string, tone: 'system' | 'chat' | 'success' | 'error' | 'gold') => void;
  onTitleBanner: (kind: 'title' | 'subtitle' | 'actionbar', text: string) => void;
  onOpenContainer: (type: ContainerType) => void;
  onPauseRequest: () => void;
  onToggleF3: () => void;
  onOpenChat: (prefill?: string) => void;
}

const _camDir = new THREE.Vector3();
const _skyColor = new THREE.Color();
const _fogTarget = new THREE.Color();
const _hemiSky = new THREE.Color();
const _hemiGround = new THREE.Color();

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class NetherCraftEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;

  private pack: CompiledResourcePack | null = null;
  private settings: VideoSettings;

  // Materials driven by compiled Resource Pack atlas
  private opaqueMat: THREE.MeshStandardMaterial;
  private transMat: THREE.MeshStandardMaterial;

  // World state
  private mode: 'panorama' | 'playing' = 'panorama';
  private paused = false;
  private world: WorldSave | null = null;
  private generator: WorldGenerator | null = null;
  private chunks = new Map<string, ChunkMeshEntry>();
  private worldGroup = new THREE.Group();
  private originCX = 0;
  private originCZ = 0;

  // Panorama showcase group (visible on Resource Gate & Title Screen)
  private panoramaGroup = new THREE.Group();
  private panoramaAngle = 0;

  // Player physics & interaction
  private px = 2.5;
  private py = 75;
  private pz = 2.5;
  private vx = 0;
  private vy = 0;
  private vz = 0;
  private yaw = 0;
  private pitch = 0;
  private onGround = false;
  private flying = false;
  private lastSpaceTap = 0;
  private fallPeakY = 75;
  private bobPhase = 0;
  private stepDist = 0;
  private portalProgress = 0;
  private portalCooldown = 0;
  private damageFlash = 0;
  private cameraShake = 0;
  private hurtImmunity = 0;
  private hitstopTimer = 0;
  private hungerTick = 0;
  private regenTick = 0;
  private autosaveTick = 0;
  private mobSpawnTick = 0;
  private weatherTick = 0;
  private lightningFlash = 0;
  private heldItemToast = '';
  private heldItemToastAt = 0;

  // Raycast & Mining
  private targetBlock: TargetBlockInfo | null = null;
  private highlightBox: THREE.LineSegments;
  private crackMesh: THREE.Mesh;
  private miningKey = '';
  private miningProgress = 0;
  private breakCooldown = 0;
  private placeCooldown = 0;

  // First-person held hand/tool + 3D Player Model Rig + F5 Camera Mode
  private handGroup: THREE.Group;
  private handDispose: (() => void) | null = null;
  private handSwing = 0;
  private playerSkinConfig: PlayerSkinConfig = loadSavedSkinConfig();
  private playerRig: PlayerRig | null = null;
  private cameraMode: CameraMode = 'first';
  private walkAnimPhase = 0;

  // Pooled break particles
  private particles: BreakParticle[] = [];
  private particleGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);

  // Clouds, Rain, Sun/Moon, World Border wall
  private cloudGroup = new THREE.Group();
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private rainPoints: THREE.Points;
  private borderWalls: THREE.Mesh[] = [];

  // Mobs
  private mobs: MobEntity[] = [];

  // Inputs (PC + Mobile)
  private keys = new Set<string>();
  private mouseLeft = false;
  private mouseRight = false;
  private pointerLocked = false;
  private touchMoveX = 0; // -1..1
  private touchMoveZ = 0; // -1..1
  private touchJump = false;
  private touchSneak = false;
  private touchBreak = false;

  // Loop
  private disposed = false;
  private frameId = 0;
  private lastTime = performance.now();
  private fpsAccum = 0;
  private fpsFrames = 0;
  private currentFps = 60;
  private hudEmitTick = 0;

  // Bound event listeners
  private onResizeBound: () => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseDownBound: (e: MouseEvent) => void;
  private onMouseUpBound: (e: MouseEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onPointerLockBound: () => void;
  private onBlurBound: () => void;
  private onContextMenuBound: (e: MouseEvent) => void;

  constructor(container: HTMLElement, settings: VideoSettings, callbacks: EngineCallbacks) {
    this.container = container;
    this.settings = { ...settings };
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x78a7ff);
    this.scene.fog = new THREE.Fog(0x78a7ff, 22, 72);

    this.camera = new THREE.PerspectiveCamera(
      settings.fov,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.08,
      360,
    );
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // Mandatory studio environment reflection map (RoomEnvironment) on all devices
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.25;
    pmrem.dispose();

    // Context loss safety
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
    });

    // Warm/Cool 3-point outdoor lighting rig
    this.hemiLight = new THREE.HemisphereLight(0x9ec5ff, 0x4b3f35, 0.72);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff4d6, 1.35);
    this.sunLight.position.set(42, 78, 32);
    this.sunLight.castShadow = !this.isSoftwareGl && settings.shadows;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 180;
    const sd = 48;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.28);
    this.rimLight.position.set(-40, 28, -40);
    this.scene.add(this.rimLight);

    // Voxel atlas materials
    this.opaqueMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.04,
    });
    this.transMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35,
      metalness: 0.06,
      transparent: true,
      opacity: 0.9,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    this.scene.add(this.worldGroup);
    this.scene.add(this.panoramaGroup);

    // Block highlight outline + progressive crack mesh
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.008, 1.008, 1.008));
    this.highlightBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.85 }),
    );
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);

    this.crackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.015, 1.015, 1.015),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0,
        wireframe: true,
        depthWrite: false,
      }),
    );
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);

    // First-person held hand/item attached to camera + 3D Player Skin Rig
    const builtArm = buildFirstPersonSkinArm(this.playerSkinConfig);
    this.handGroup = builtArm.group;
    this.handDispose = builtArm.dispose;
    this.handGroup.visible = false;
    this.camera.add(this.handGroup);
    this.scene.add(this.camera);

    this.playerRig = buildMinecraftPlayerRig(this.playerSkinConfig);
    this.playerRig.root.visible = false;
    this.scene.add(this.playerRig.root);

    // Sun & Moon billboards
    this.sunMesh = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }),
    );
    this.moonMesh = new THREE.Mesh(
      new THREE.BoxGeometry(7, 7, 7),
      new THREE.MeshBasicMaterial({ color: 0xdbeafe, fog: false }),
    );
    this.scene.add(this.sunMesh, this.moonMesh);

    // Clouds & Rain & World Border walls
    this.buildClouds();
    this.scene.add(this.cloudGroup);
    this.rainPoints = this.buildRainSystem();
    this.scene.add(this.rainPoints);
    this.buildWorldBorderWalls();

    // Build live 3D Panorama backdrop for Title Screen & Resource Gate
    this.buildPanoramaScene();

    // Listeners
    this.onResizeBound = this.handleResize.bind(this);
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    this.onMouseMoveBound = this.handleMouseMove.bind(this);
    this.onMouseDownBound = this.handleMouseDown.bind(this);
    this.onMouseUpBound = this.handleMouseUp.bind(this);
    this.onWheelBound = this.handleWheel.bind(this);
    this.onPointerLockBound = this.handlePointerLockChange.bind(this);
    this.onBlurBound = this.handleBlur.bind(this);
    this.onContextMenuBound = (e: MouseEvent) => {
      if (this.mode === 'playing') e.preventDefault();
    };

    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    window.addEventListener('wheel', this.onWheelBound, { passive: true });
    window.addEventListener('blur', this.onBlurBound);
    document.addEventListener('pointerlockchange', this.onPointerLockBound);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDownBound);
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenuBound);

    soundEngine.setSettings(settings.volume, settings.muted);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
    this.lastTime = performance.now();
    this.tick();
  }

  public setPlayerSkin(config: PlayerSkinConfig): void {
    this.playerSkinConfig = config;
    // Rebuild 1st-person skin arm
    this.camera.remove(this.handGroup);
    this.handDispose?.();
    const builtArm = buildFirstPersonSkinArm(config);
    this.handGroup = builtArm.group;
    this.handDispose = builtArm.dispose;
    this.handGroup.visible = this.mode === 'playing' && this.cameraMode === 'first';
    this.camera.add(this.handGroup);

    // Rebuild 3D Player Model Rig
    if (this.playerRig) {
      this.scene.remove(this.playerRig.root);
      this.playerRig.dispose();
    }
    this.playerRig = buildMinecraftPlayerRig(config);
    this.playerRig.root.visible = this.mode === 'playing' && this.cameraMode !== 'first';
    this.scene.add(this.playerRig.root);

    if (this.world) {
      updateRigArmorVisuals(this.playerRig, this.world.player.armor);
      this.updateFirstPersonHeldVisual();
    }
  }

  public cycleCameraMode(): void {
    const order: CameraMode[] = ['first', 'third_back', 'third_front'];
    this.cameraMode = order[(order.indexOf(this.cameraMode) + 1) % order.length];
    const label =
      this.cameraMode === 'first'
        ? 'Góc nhìn thứ 1'
        : this.cameraMode === 'third_back'
          ? 'Góc nhìn thứ 3 (Sau lưng)'
          : 'Góc nhìn thứ 3 (Trước mặt)';
    this.heldItemToast = `Camera: ${label}`;
    this.heldItemToastAt = performance.now();
    this.emitHud();
  }

  private updateFirstPersonHeldVisual(): void {
    if (!this.world) return;
    const stack = this.world.player.inventory[this.world.player.selectedSlot];
    const meshes: THREE.Mesh[] = [];
    const fpHeld = this.handGroup.getObjectByName('heldItemMesh') as THREE.Mesh | undefined;
    if (fpHeld) meshes.push(fpHeld);
    const tpHeld = this.playerRig?.heldSlotGroup.getObjectByName('playerHeldMesh') as THREE.Mesh | undefined;
    if (tpHeld) meshes.push(tpHeld);

    for (const held of meshes) {
      if (!stack) {
        held.visible = false;
        continue;
      }
      held.visible = true;
      const def = ITEM_DEFS[stack.itemId];
      const mat = held.material as THREE.MeshStandardMaterial;
      if (def?.toolKind && def.toolKind !== 'none') {
        held.scale.set(0.38, 1.45, 0.38);
        mat.color.set(def.iconColor || '#d4d8dc');
        mat.metalness = def.toolTier && def.toolTier >= 3 ? 0.72 : 0.15;
        mat.roughness = def.toolTier && def.toolTier >= 3 ? 0.22 : 0.75;
      } else if (def?.blockId) {
        held.scale.set(1.0, 1.0, 1.0);
        const bdef = BLOCK_DEFS[def.blockId];
        const colMap: Record<string, number> = {
          obsidian: 0x261a3b, crying_obsidian: 0x5b21b6, netherrack: 0x7c2d2d,
          crimson_nylium: 0x9f1239, warped_nylium: 0x0f766e, blackstone: 0x2e2a36,
          ancient_debris: 0x6b4b3e, shroomlight: 0xf59e0b, grass_block: 0x5ca63e,
          oak_planks: 0xa2824e, cobblestone: 0x747474,
        };
        mat.color.setHex(colMap[bdef.key] ?? 0x8b8b8b);
        mat.metalness = 0.05;
        mat.roughness = 0.85;
      } else {
        held.scale.set(0.65, 0.65, 0.65);
        mat.color.set(def?.iconColor || '#e5e7eb');
        mat.metalness = 0.35;
        mat.roughness = 0.45;
      }
    }
  }

  private buildClouds(): void {
    const geo = new THREE.BoxGeometry(10, 1.6, 10);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      transparent: true,
      opacity: 0.85,
    });
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(
        ((i * 37) % 160) - 80,
        126 + (i % 3) * 2,
        ((i * 53) % 160) - 80,
      );
      m.scale.set(1 + (i % 3) * 0.7, 1, 1 + ((i + 1) % 2) * 0.8);
      this.cloudGroup.add(m);
    }
  }

  private buildRainSystem(): THREE.Points {
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = Math.random() * 24 - 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.16,
      transparent: true,
      opacity: 0.72,
    });
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    return pts;
  }

  private buildWorldBorderWalls(): void {
    const wallGeo = new THREE.PlaneGeometry(160, 260);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(wallGeo, wallMat);
      m.visible = false;
      this.scene.add(m);
      this.borderWalls.push(m);
    }
  }

  // Dramatic 3D live Nether 1.16 Portal Panorama for Title Screen & Resource Gate
  private buildPanoramaScene(): void {
    const g = this.panoramaGroup;
    const addBox = (
      x: number, y: number, z: number,
      w: number, h: number, d: number,
      color: number, roughness = 0.86, metalness = 0.04, emissive = 0x000000, opacity = 1,
    ) => {
      const mat = new THREE.MeshStandardMaterial({
        color, roughness, metalness, emissive,
        emissiveIntensity: emissive ? 0.85 : 0,
        transparent: opacity < 1,
        opacity,
      });
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      m.castShadow = opacity === 1;
      g.add(m);
      return m;
    };

    // Split terrain: Overworld emerald grass on -X side, Crimson/Warped Nether 1.16 on +X side
    for (let ix = -9; ix <= 9; ix++) {
      for (let iz = -9; iz <= 9; iz++) {
        const dist = Math.hypot(ix, iz);
        if (dist > 10.2) continue;
        const h = Math.round(Math.sin(ix * 0.45) * 0.8 + Math.cos(iz * 0.4) * 0.7);
        const isNether = ix > 0;
        const topCol = isNether
          ? iz > 1 ? 0x16857d : iz < -2 ? 0x9f1c2e : 0x6e2a28
          : 0x5ca43e;
        addBox(ix, h - 1, iz, 1, 2.2, 1, topCol, 0.88);
      }
    }

    // Centerpiece 1.16 Nether Portal (Obsidian + Crying Obsidian + Glowing Swirling Core)
    for (let i = 0; i < 5; i++) {
      addBox(0, i + 0.5, -2, 1, 1, 1, i === 2 ? 0x4c1d95 : 0x1e1432, 0.65, 0.15, i === 2 ? 0x7e22ce : 0);
      addBox(0, i + 0.5, 2, 1, 1, 1, i === 3 ? 0x4c1d95 : 0x1e1432, 0.65, 0.15, i === 3 ? 0x7e22ce : 0);
    }
    for (let z = -1; z <= 1; z++) {
      addBox(0, 0.5, z, 1, 1, 1, 0x1e1432, 0.65, 0.15);
      addBox(0, 4.5, z, 1, 1, 1, 0x1e1432, 0.65, 0.15);
    }
    addBox(0, 2.5, 0, 0.25, 3, 3, 0xa855f7, 0.2, 0, 0x9333ea, 0.72);

    // Huge Crimson Fungus + Shroomlight (+X, -Z)
    for (let y = 0; y < 5; y++) addBox(5, y + 0.5, -4, 1, 1, 1, 0x6e233b, 0.85);
    addBox(5, 5.5, -4, 3.2, 1.4, 3.2, 0x881322, 0.9);
    addBox(4, 4.4, -3, 0.9, 0.9, 0.9, 0xfbbf24, 0.4, 0, 0xf59e0b);

    // Huge Warped Fungus (+X, +Z)
    for (let y = 0; y < 5; y++) addBox(5, y + 0.5, 4, 1, 1, 1, 0x266567, 0.85);
    addBox(5, 5.5, 4, 3.2, 1.4, 3.2, 0x0f766e, 0.9);
    addBox(6, 4.4, 3, 0.9, 0.9, 0.9, 0xfbbf24, 0.4, 0, 0xf59e0b);

    // Overworld Oak Tree (-X)
    for (let y = 0; y < 4; y++) addBox(-5, y + 0.5, -3, 1, 1, 1, 0x6b4f32, 0.9);
    addBox(-5, 4.6, -3, 3.2, 2.0, 3.2, 0x3f8430, 0.9);

    // Basalt pillars & Gold block accent
    addBox(3, 1.2, 0.5, 1, 2.4, 1, 0x454552, 0.8);
    addBox(-2, 0.7, 2.5, 1, 1, 1, 0xeab308, 0.22, 0.88);
    addBox(-2, 0.7, -2.5, 1, 1, 1, 0x6c4c40, 0.55, 0.45); // Ancient Debris showcase

    // Decorative composite Piglin & Strider in panorama
    const piglin = buildMobMesh('piglin').group;
    piglin.position.set(2.5, 0.2, -1.6);
    piglin.rotation.y = -0.8;
    g.add(piglin);

    const strider = buildMobMesh('strider').group;
    strider.position.set(3.2, 0.2, 2.2);
    strider.rotation.y = -2.2;
    g.add(strider);
  }

  public setResourcePack(pack: CompiledResourcePack): void {
    this.pack = pack;
    pack.atlasTexture.needsUpdate = true;
    this.opaqueMat.map = pack.atlasTexture;
    this.opaqueMat.needsUpdate = true;
    this.transMat.map = pack.atlasTexture;
    this.transMat.needsUpdate = true;
    // Rebuild all loaded chunks to display newly downloaded/swapped textures immediately
    for (const entry of this.chunks.values()) {
      for (let s = 0; s < SUBCHUNK_COUNT; s++) {
        if (entry.col.sections[s]) entry.col.dirtySections[s] = true;
      }
    }
    this.updateFirstPersonHeldVisual();
    if (this.world) {
      this.streamChunksAroundPlayer(true);
    }
  }

  public updateSettings(next: VideoSettings): void {
    const needRemesh =
      next.smoothLighting !== this.settings.smoothLighting ||
      next.graphics !== this.settings.graphics;
    this.settings = { ...next };
    this.camera.fov = next.fov;
    this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && next.shadows;
    this.sunLight.castShadow = !this.isSoftwareGl && next.shadows;
    this.cloudGroup.visible = next.clouds !== 'off' && this.world?.dimension === 'overworld';
    this.cloudGroup.scale.y = next.clouds === 'fancy' ? 1 : 0.12;
    soundEngine.setSettings(next.volume, next.muted);

    if (needRemesh) {
      for (const entry of this.chunks.values()) {
        for (let s = 0; s < SUBCHUNK_COUNT; s++) {
          if (entry.col.sections[s]) entry.col.dirtySections[s] = true;
        }
      }
    }
  }

  public enterPanoramaMode(): void {
    this.saveCurrentWorld();
    this.clearWorldScene();
    this.mode = 'panorama';
    this.paused = false;
    this.world = null;
    this.generator = null;
    this.panoramaGroup.visible = true;
    this.handGroup.visible = false;
    if (this.playerRig) this.playerRig.root.visible = false;
    this.highlightBox.visible = false;
    this.crackMesh.visible = false;
    this.rainPoints.visible = false;
    this.cloudGroup.visible = false;
    this.sunMesh.visible = false;
    this.moonMesh.visible = false;
    this.borderWalls.forEach((w) => (w.visible = false));
    this.exitPointerLock();
  }

  public loadWorld(world: WorldSave): void {
    this.clearWorldScene();
    this.world = structuredClone(world);
    this.generator = new WorldGenerator(this.world.seed);
    this.mode = 'playing';
    this.paused = false;
    this.panoramaGroup.visible = false;
    this.handGroup.visible = this.cameraMode === 'first';
    if (this.playerRig) {
      this.playerRig.root.visible = this.cameraMode !== 'first';
      updateRigArmorVisuals(this.playerRig, this.world.player.armor);
    }

    this.px = this.world.player.x;
    this.py = this.world.player.y;
    this.pz = this.world.player.z;
    this.yaw = this.world.player.yaw;
    this.pitch = this.world.player.pitch;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.flying = this.world.gameMode === 'creative' || this.world.gameMode === 'spectator';

    this.originCX = Math.floor(this.px / CHUNK_SIZE);
    this.originCZ = Math.floor(this.pz / CHUNK_SIZE);

    // Ensure spawn Y is safely above terrain if brand new world
    this.streamChunksAroundPlayer(true);
    if (this.world.dimension === 'overworld') {
      const groundY = this.findSafeGroundY(Math.floor(this.px), Math.floor(this.pz));
      if (Math.abs(this.py - 80) < 0.2 && this.world.updatedAt - this.world.createdAt < 5000) {
        this.py = groundY + 0.1;
        this.world.player.y = this.py;
        this.world.player.spawnPoint = [this.px, this.py, this.pz];
        this.world.player.worldSpawn = [this.px, this.py, this.pz];
      }
    }
    this.fallPeakY = this.py;
    this.updateFirstPersonHeldVisual();
    this.spawnInitialMobs();
    this.emitHud();
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.keys.clear();
      this.mouseLeft = false;
      this.mouseRight = false;
      this.touchBreak = false;
      this.touchMoveX = 0;
      this.touchMoveZ = 0;
      this.touchJump = false;
      this.exitPointerLock();
      this.saveCurrentWorld();
    }
  }

  public requestPointerLock(): void {
    if (this.mode !== 'playing' || this.paused) return;
    try {
      this.renderer.domElement.requestPointerLock?.();
    } catch {
      // mobile browsers don't support pointer lock
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  // --- Mobile Touch API ---
  public setTouchMovement(x: number, z: number): void {
    this.touchMoveX = Math.max(-1, Math.min(1, x));
    this.touchMoveZ = Math.max(-1, Math.min(1, z));
  }

  public addTouchLookDelta(dx: number, dy: number): void {
    if (this.mode !== 'playing' || this.paused) return;
    const sens = 0.0046 * this.settings.sensitivity;
    this.yaw -= dx * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * sens, -Math.PI * 0.495, Math.PI * 0.495);
  }

  public setTouchJump(active: boolean): void {
    if (active && !this.touchJump) {
      this.triggerJumpPress();
    }
    this.touchJump = active;
  }

  public setTouchSneak(active: boolean): void {
    this.touchSneak = active;
  }

  public setTouchBreak(active: boolean): void {
    this.touchBreak = active;
    if (active) this.tryAttackMob();
  }

  public triggerTouchUseOrPlace(): void {
    if (this.mode !== 'playing' || this.paused) return;
    this.performRightClickAction();
  }

  // --- UI / Inventory Mutations ---
  public selectHotbarSlot(index: number): void {
    if (!this.world) return;
    this.world.player.selectedSlot = ((index % 9) + 9) % 9;
    const stack = this.world.player.inventory[this.world.player.selectedSlot];
    this.heldItemToast = stack ? ITEM_DEFS[stack.itemId]?.nameVi || stack.itemId : '';
    this.heldItemToastAt = performance.now();
    this.updateFirstPersonHeldVisual();
    this.emitHud();
  }

  public getWorldSnapshot(): WorldSave | null {
    if (!this.world) return null;
    this.syncPlayerToWorldRecord();
    return structuredClone(this.world);
  }

  public applyInventoryUpdate(
    inventory: (ItemStack | null)[],
    armor?: (ItemStack | null)[],
    furnace?: WorldSave['furnace'],
  ): void {
    if (!this.world) return;
    this.world.player.inventory = inventory;
    if (armor) {
      this.world.player.armor = armor;
      if (this.playerRig) updateRigArmorVisuals(this.playerRig, armor);
    }
    if (furnace) this.world.furnace = furnace;
    this.updateFirstPersonHeldVisual();
    this.emitHud();
  }

  public respawnPlayer(): void {
    if (!this.world) return;
    this.world.player.hp = this.world.player.maxHp;
    this.world.player.hunger = 20;
    this.world.player.oxygen = 20;
    this.world.player.effects = [];
    const targetDim = this.world.player.spawnDimension;
    const [sx, sy, sz] = this.world.player.spawnPoint;
    if (targetDim !== this.world.dimension) {
      this.switchDimension(targetDim, sx, sy, sz, false);
    } else {
      this.teleportPlayer(sx, sy, sz);
    }
    this.emitHud();
  }

  public runCommand(raw: string): void {
    if (!this.world || !this.generator) return;
    executeCommand(raw, {
      playerPos: [this.px, this.py, this.pz],
      dimension: this.world.dimension,
      seed: this.world.seed,
      cheatsEnabled: this.world.cheatsEnabled,
      worldBorderRadius: this.world.worldBorderSize,
      gamerules: this.world.gamerules,
      teleport: (x, y, z) => this.teleportPlayer(x, y, z),
      setGameMode: (mode) => {
        if (!this.world) return;
        this.world.gameMode = mode;
        this.flying = mode === 'creative' || mode === 'spectator';
        this.emitHud();
      },
      setTime: (ticks) => {
        if (this.world) this.world.timeOfDay = ticks;
      },
      addTime: (ticks) => {
        if (this.world) this.world.timeOfDay = (this.world.timeOfDay + ticks) % 24000;
      },
      getTime: () => this.world?.timeOfDay ?? 0,
      setWeather: (w) => {
        if (!this.world) return;
        this.world.weather = w;
        if (w === 'thunder') soundEngine.playThunder();
        this.emitHud();
      },
      giveItem: (itemId, count) => {
        const ok = this.addItemToInventory(itemId, count);
        this.updateFirstPersonHeldVisual();
        this.emitHud();
        return ok;
      },
      clearInventory: (itemId) => {
        if (!this.world) return 0;
        let removed = 0;
        this.world.player.inventory = this.world.player.inventory.map((st) => {
          if (!st) return null;
          if (!itemId || st.itemId === itemId) {
            removed += st.count;
            return null;
          }
          return st;
        });
        this.updateFirstPersonHeldVisual();
        this.emitHud();
        return removed;
      },
      setBlock: (x, y, z, blockId) => this.setWorldBlock(x, y, z, blockId, true),
      getBlock: (x, y, z) => this.getWorldBlock(x, y, z),
      summonMob: (type, x, y, z) => {
        if (type === 'lightning_bolt') {
          this.lightningFlash = 1.0;
          soundEngine.playThunder();
          this.spawnBreakParticles(x, y, z, 0x93c5fd, 20);
          return;
        }
        this.spawnMob(type, x, y, z);
      },
      giveEffect: (id: EffectId, seconds: number, amplifier: number) => {
        if (!this.world) return;
        const idx = this.world.player.effects.findIndex((e) => e.id === id);
        const eff: ActiveEffect = { id, amplifier, remainingSec: seconds };
        if (idx >= 0) this.world.player.effects[idx] = eff;
        else this.world.player.effects.push(eff);
        this.emitHud();
      },
      clearEffects: () => {
        if (this.world) {
          this.world.player.effects = [];
          this.emitHud();
        }
      },
      enchantHeld: (ench: EnchantmentId, level: number) => {
        if (!this.world) return 'Chưa có thế giới.';
        const st = this.world.player.inventory[this.world.player.selectedSlot];
        if (!st) return 'Hãy cầm công cụ, vũ khí hoặc giáp trên tay trước khi phù phép.';
        st.enchants = { ...(st.enchants || {}), [ench]: level };
        soundEngine.playLevelUp();
        this.emitHud();
        return `Đã phù phép ${ench} ${level} lên ${ITEM_DEFS[st.itemId]?.nameVi || st.itemId}!`;
      },
      addXp: (amount, isLevels, setMode) => {
        if (!this.world) return '';
        if (amount === 0 && !setMode) {
          return `Kinh nghiệm hiện tại: Cấp ${this.world.player.level} (${Math.floor(this.world.player.xp * 100)}%)`;
        }
        if (isLevels) {
          this.world.player.level = Math.max(0, setMode ? amount : this.world.player.level + amount);
        } else {
          const total = setMode ? Math.max(0, amount) : Math.max(0, this.world.player.level * 10 + this.world.player.xp * 10 + amount);
          this.world.player.level = Math.floor(total / 10);
          this.world.player.xp = (total % 10) / 10;
        }
        soundEngine.playLevelUp();
        this.emitHud();
        return `Kinh nghiệm hiện tại: Cấp ${this.world.player.level}`;
      },
      setDifficulty: (d) => {
        if (!this.world) return;
        this.world.difficulty = d;
        if (d === 'peaceful') {
          this.mobs = this.mobs.filter((m) => {
            if (m.hostile) {
              this.worldGroup.remove(m.mesh);
              disposeMobMesh(m.mesh);
              return false;
            }
            return true;
          });
        }
        this.emitHud();
      },
      setGameRule: (rule, val) => {
        if (this.world) this.world.gamerules[rule] = val;
      },
      setSpawnPoint: (x, y, z, worldDefault) => {
        if (!this.world) return;
        if (worldDefault) this.world.player.worldSpawn = [x, y, z];
        else {
          this.world.player.spawnPoint = [x, y, z];
          this.world.player.spawnDimension = this.world.dimension;
        }
      },
      setWorldBorder: (radius, center) => {
        if (!this.world) return;
        this.world.worldBorderSize = radius;
        if (center) this.world.worldBorderCenter = center;
        this.emitHud();
      },
      locateBiome: (biome: AnyBiome) => {
        if (!this.world || !this.generator) return null;
        return this.generator.locateNearestBiome(this.world.dimension, biome, this.px, this.pz);
      },
      killTarget: (selector) => {
        if (!this.world) return '';
        if (selector === '@s' || selector === '@p') {
          this.damagePlayer(999, 'Lệnh /kill');
          return 'Đã tiêu diệt người chơi.';
        }
        const typeMatch = selector.match(/type=([a-z_]+)/);
        let killed = 0;
        this.mobs = this.mobs.filter((m) => {
          if (typeMatch && m.type !== typeMatch[1]) return true;
          this.worldGroup.remove(m.mesh);
          disposeMobMesh(m.mesh);
          killed++;
          return false;
        });
        return `Đã tiêu diệt ${killed} sinh vật.`;
      },
      showTitle: (kind, text) => this.callbacks.onTitleBanner(kind, text),
      playSound: (name) => soundEngine.playByName(name),
      reply: (text, tone = 'system') => this.callbacks.onChatMessage(text, tone),
    });
  }

  public saveCurrentWorld(): void {
    if (!this.world) return;
    this.syncPlayerToWorldRecord();
    saveWorld(this.world).catch(() => {});
  }

  private syncPlayerToWorldRecord(): void {
    if (!this.world) return;
    this.world.player.x = this.px;
    this.world.player.y = this.py;
    this.world.player.z = this.pz;
    this.world.player.yaw = this.yaw;
    this.world.player.pitch = this.pitch;
  }

  private chunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  private getWorldBlock(wx: number, wy: number, wz: number): number {
    if (wy < 0 || wy >= WORLD_HEIGHT_MAX) return BLOCK.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const entry = this.chunks.get(this.chunkKey(cx, cz));
    if (!entry) return BLOCK.AIR;
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    return getChunkBlock(entry.col, lx, wy, lz);
  }

  private setWorldBlock(wx: number, wy: number, wz: number, blockId: number, persist: boolean): void {
    if (!this.world || wy < 0 || wy >= WORLD_HEIGHT_MAX) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;

    if (persist) {
      const mods = this.world.dimension === 'overworld' ? this.world.overworldMods : this.world.netherMods;
      mods[`${wx},${wy},${wz}`] = blockId;
    }

    const entry = this.chunks.get(this.chunkKey(cx, cz));
    if (entry) {
      setChunkBlock(entry.col, lx, wy, lz, blockId);
      const sy = wy >> 4;
      entry.col.dirtySections[sy] = true;
      if ((wy & 15) === 0 && sy > 0) entry.col.dirtySections[sy - 1] = true;
      if ((wy & 15) === 15 && sy < SUBCHUNK_COUNT - 1) entry.col.dirtySections[sy + 1] = true;

      // Mark adjacent chunk borders dirty
      const markNeighbor = (ncx: number, ncz: number) => {
        const nb = this.chunks.get(this.chunkKey(ncx, ncz));
        if (nb) nb.col.dirtySections[sy] = true;
      };
      if (lx === 0) markNeighbor(cx - 1, cz);
      if (lx === CHUNK_SIZE - 1) markNeighbor(cx + 1, cz);
      if (lz === 0) markNeighbor(cx, cz - 1);
      if (lz === CHUNK_SIZE - 1) markNeighbor(cx, cz + 1);
    }
  }

  private findSafeGroundY(wx: number, wz: number): number {
    if (!this.world) return 70;
    const maxY = this.world.dimension === 'nether' ? 115 : 180;
    const minY = this.world.dimension === 'nether' ? NETHER_LAVA_LEVEL + 1 : 4;
    for (let y = maxY; y >= minY; y--) {
      const b = this.getWorldBlock(wx, y, wz);
      const up1 = this.getWorldBlock(wx, y + 1, wz);
      const up2 = this.getWorldBlock(wx, y + 2, wz);
      if (isBlockSolid(b) && !isBlockSolid(up1) && !isBlockSolid(up2) && !isBlockLiquid(up1)) {
        return y + 1;
      }
    }
    return this.world.dimension === 'nether' ? 54 : SEA_LEVEL + 4;
  }

  private teleportPlayer(x: number, y: number, z: number): void {
    this.px = x;
    this.py = y;
    this.pz = z;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.fallPeakY = y;
    this.recenterFloatingOrigin();
    this.streamChunksAroundPlayer(true);
    this.emitHud();
  }

  private recenterFloatingOrigin(): void {
    const curCX = Math.floor(this.px / CHUNK_SIZE);
    const curCZ = Math.floor(this.pz / CHUNK_SIZE);
    if (Math.abs(curCX - this.originCX) >= 4 || Math.abs(curCZ - this.originCZ) >= 4) {
      this.originCX = curCX;
      this.originCZ = curCZ;
      for (const entry of this.chunks.values()) {
        entry.group.position.set(
          (entry.col.cx - this.originCX) * CHUNK_SIZE,
          0,
          (entry.col.cz - this.originCZ) * CHUNK_SIZE,
        );
      }
    }
  }

  private streamChunksAroundPlayer(immediateAll = false): void {
    if (!this.world || !this.generator) return;
    const pcx = Math.floor(this.px / CHUNK_SIZE);
    const pcz = Math.floor(this.pz / CHUNK_SIZE);
    const radius = Math.max(2, Math.min(8, this.settings.renderDistance));
    const unloadRadius = radius + 2;

    // Unload distant chunks
    for (const [key, entry] of this.chunks) {
      if (Math.abs(entry.col.cx - pcx) > unloadRadius || Math.abs(entry.col.cz - pcz) > unloadRadius) {
        this.disposeChunkEntry(entry);
        this.chunks.delete(key);
      }
    }

    // Generate missing chunks near player (spiral order, budgeted per frame)
    const mods = this.world.dimension === 'overworld' ? this.world.overworldMods : this.world.netherMods;
    let genBudget = immediateAll ? 64 : 2;
    for (let r = 0; r <= radius && genBudget > 0; r++) {
      for (let dx = -r; dx <= r && genBudget > 0; dx++) {
        for (let dz = -r; dz <= r && genBudget > 0; dz++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const cx = pcx + dx;
          const cz = pcz + dz;
          const key = this.chunkKey(cx, cz);
          if (!this.chunks.has(key)) {
            const col = this.generator.generateChunk(this.world.dimension, cx, cz, mods);
            const group = new THREE.Group();
            group.position.set((cx - this.originCX) * CHUNK_SIZE, 0, (cz - this.originCZ) * CHUNK_SIZE);
            this.worldGroup.add(group);
            this.chunks.set(key, {
              col,
              group,
              opaqueMeshes: new Array(SUBCHUNK_COUNT).fill(null),
              transMeshes: new Array(SUBCHUNK_COUNT).fill(null),
            });
            genBudget--;
          }
        }
      }
    }

    // Rebuild dirty sub-chunk meshes (budgeted per frame to keep 60fps smooth)
    if (!this.pack) return;
    let meshBudget = immediateAll ? 80 : 6;
    const fancyLeaves = this.settings.graphics === 'fancy';
    const smoothAO = this.settings.smoothLighting;
    const getter = (x: number, y: number, z: number) => this.getWorldBlock(x, y, z);

    for (const entry of this.chunks.values()) {
      for (let sy = 0; sy < SUBCHUNK_COUNT; sy++) {
        if (!entry.col.dirtySections[sy]) continue;
        entry.col.dirtySections[sy] = false;

        // Dispose previous subchunk meshes
        if (entry.opaqueMeshes[sy]) {
          entry.group.remove(entry.opaqueMeshes[sy]!);
          entry.opaqueMeshes[sy]!.geometry.dispose();
          entry.opaqueMeshes[sy] = null;
        }
        if (entry.transMeshes[sy]) {
          entry.group.remove(entry.transMeshes[sy]!);
          entry.transMeshes[sy]!.geometry.dispose();
          entry.transMeshes[sy] = null;
        }

        const built = buildSubChunkGeometry(entry.col, sy, getter, this.pack.uvMap, smoothAO, fancyLeaves);
        if (built.opaque) {
          const m = new THREE.Mesh(built.opaque, this.opaqueMat);
          m.castShadow = !this.isSoftwareGl && this.settings.shadows;
          m.receiveShadow = !this.isSoftwareGl && this.settings.shadows;
          entry.group.add(m);
          entry.opaqueMeshes[sy] = m;
        }
        if (built.translucent) {
          const m = new THREE.Mesh(built.translucent, this.transMat);
          m.renderOrder = 2;
          entry.group.add(m);
          entry.transMeshes[sy] = m;
        }
        meshBudget--;
        if (meshBudget <= 0) return;
      }
    }
  }

  private disposeChunkEntry(entry: ChunkMeshEntry): void {
    for (let s = 0; s < SUBCHUNK_COUNT; s++) {
      if (entry.opaqueMeshes[s]) {
        entry.group.remove(entry.opaqueMeshes[s]!);
        entry.opaqueMeshes[s]!.geometry.dispose();
      }
      if (entry.transMeshes[s]) {
        entry.group.remove(entry.transMeshes[s]!);
        entry.transMeshes[s]!.geometry.dispose();
      }
    }
    this.worldGroup.remove(entry.group);
  }

  private clearWorldScene(): void {
    for (const entry of this.chunks.values()) this.disposeChunkEntry(entry);
    this.chunks.clear();
    for (const m of this.mobs) {
      this.worldGroup.remove(m.mesh);
      disposeMobMesh(m.mesh);
    }
    this.mobs = [];
    for (const p of this.particles) {
      this.worldGroup.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
  }

  // --- Nether Portal Detection & Dimension Switching (1:8 scale!) ---
  private tryIgniteNetherPortal(x: number, y: number, z: number): boolean {
    // Check both X-oriented and Z-oriented 4x5 Obsidian frames around (x, y, z)
    for (const axis of ['x', 'z'] as const) {
      for (let offA = -2; offA <= 0; offA++) {
        for (let offY = -3; offY <= 0; offY++) {
          const baseX = axis === 'x' ? x + offA : x;
          const baseY = y + offY;
          const baseZ = axis === 'z' ? z + offA : z;
          if (this.checkObsidianFrame(baseX, baseY, baseZ, axis)) {
            for (let a = 1; a <= 2; a++) {
              for (let h = 1; h <= 3; h++) {
                const px = axis === 'x' ? baseX + a : baseX;
                const pz = axis === 'z' ? baseZ + a : baseZ;
                this.setWorldBlock(px, baseY + h, pz, BLOCK.NETHER_PORTAL, true);
              }
            }
            soundEngine.playPortal();
            this.callbacks.onChatMessage('Cổng Nether 1.16 đã được kích hoạt! Bước vào màn sương tím để qua Nether.', 'gold');
            return true;
          }
        }
      }
    }
    return false;
  }

  private checkObsidianFrame(bx: number, by: number, bz: number, axis: 'x' | 'z'): boolean {
    const isObs = (x: number, y: number, z: number) => {
      const id = this.getWorldBlock(x, y, z);
      return id === BLOCK.OBSIDIAN;
    };
    // Bottom & Top 2 middle blocks must be Obsidian; Left & Right 3 vertical blocks must be Obsidian
    for (let a = 1; a <= 2; a++) {
      const gx = axis === 'x' ? bx + a : bx;
      const gz = axis === 'z' ? bz + a : bz;
      if (!isObs(gx, by, gz) || !isObs(gx, by + 4, gz)) return false;
      for (let h = 1; h <= 3; h++) {
        const inner = this.getWorldBlock(gx, by + h, gz);
        if (inner !== BLOCK.AIR && inner !== BLOCK.NETHER_PORTAL) return false;
      }
    }
    for (let h = 1; h <= 3; h++) {
      const lx = bx;
      const lz = bz;
      const rx = axis === 'x' ? bx + 3 : bx;
      const rz = axis === 'z' ? bz + 3 : bz;
      if (!isObs(lx, by + h, lz) || !isObs(rx, by + h, rz)) return false;
    }
    return true;
  }

  private switchDimension(
    targetDim: DimensionId,
    destX: number,
    destY: number | null,
    destZ: number,
    buildReturnPortal: boolean,
  ): void {
    if (!this.world || !this.generator) return;
    this.saveCurrentWorld();
    this.clearWorldScene();

    this.world.dimension = targetDim;
    this.px = destX;
    this.pz = destZ;
    this.originCX = Math.floor(destX / CHUNK_SIZE);
    this.originCZ = Math.floor(destZ / CHUNK_SIZE);

    this.streamChunksAroundPlayer(true);

    const safeY = destY !== null ? destY : this.findSafeGroundY(Math.floor(destX), Math.floor(destZ));
    this.py = safeY + 0.1;
    this.fallPeakY = this.py;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.portalProgress = 0;
    this.portalCooldown = 4.0;

    if (buildReturnPortal) {
      // Build safe obsidian return platform & active Nether Portal right beside arrival!
      const bx = Math.floor(destX) + 2;
      const by = Math.floor(safeY) - 1;
      const bz = Math.floor(destZ);
      for (let dx = -2; dx <= 4; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          this.setWorldBlock(bx + dx, by, bz + dz, targetDim === 'nether' ? BLOCK.BLACKSTONE : BLOCK.OBSIDIAN, true);
          for (let cy = 1; cy <= 5; cy++) {
            this.setWorldBlock(bx + dx, by + cy, bz + dz, BLOCK.AIR, true);
          }
        }
      }
      for (let a = 0; a <= 3; a++) {
        this.setWorldBlock(bx + a, by + 1, bz, BLOCK.OBSIDIAN, true);
        this.setWorldBlock(bx + a, by + 5, bz, BLOCK.OBSIDIAN, true);
      }
      for (let h = 2; h <= 4; h++) {
        this.setWorldBlock(bx, by + h, bz, BLOCK.OBSIDIAN, true);
        this.setWorldBlock(bx + 3, by + h, bz, BLOCK.OBSIDIAN, true);
        this.setWorldBlock(bx + 1, by + h, bz, BLOCK.NETHER_PORTAL, true);
        this.setWorldBlock(bx + 2, by + h, bz, BLOCK.NETHER_PORTAL, true);
      }
    }

    soundEngine.playPortal();
    this.spawnInitialMobs();
    this.callbacks.onTitleBanner(
      'title',
      targetDim === 'nether' ? 'THE NETHER 1.16' : 'OVERWORLD',
    );
    this.callbacks.onTitleBanner(
      'subtitle',
      targetDim === 'nether'
        ? 'Rừng Crimson · Rừng Warped · Ancient Debris ở tầng Y=8–22'
        : 'Trở về thế giới mặt đất',
    );
    this.emitHud();
  }

  // --- Inventory Helper ---
  private addItemToInventory(itemId: string, count: number): boolean {
    if (!this.world) return false;
    const def = ITEM_DEFS[itemId];
    if (!def) return false;
    let remaining = count;
    const inv = this.world.player.inventory;

    // Stack onto existing slots first
    for (let i = 0; i < inv.length && remaining > 0; i++) {
      const st = inv[i];
      if (st && st.itemId === itemId && !st.enchants && st.count < def.maxStack) {
        const add = Math.min(remaining, def.maxStack - st.count);
        st.count += add;
        remaining -= add;
      }
    }
    // Fill empty slots
    for (let i = 0; i < inv.length && remaining > 0; i++) {
      if (!inv[i]) {
        const add = Math.min(remaining, def.maxStack);
        inv[i] = { itemId, count: add };
        remaining -= add;
      }
    }
    return remaining < count;
  }

  private getArmorDefense(): number {
    if (!this.world) return 0;
    let pts = 0;
    for (const piece of this.world.player.armor) {
      if (!piece) continue;
      pts += ITEM_DEFS[piece.itemId]?.armorDefense || 0;
      pts += (piece.enchants?.protection || 0) * 1.5;
    }
    return Math.min(20, Math.floor(pts));
  }

  private isWearingGoldArmor(): boolean {
    if (!this.world) return false;
    return this.world.player.armor.some((a) => a?.itemId.startsWith('gold_'));
  }

  private getEffectLevel(id: EffectId): number {
    if (!this.world) return 0;
    const found = this.world.player.effects.find((e) => e.id === id);
    return found ? found.amplifier + 1 : 0;
  }

  private damagePlayer(rawAmount: number, reason: string, isFire = false): void {
    if (!this.world || this.world.player.hp <= 0) return;
    if (this.world.gameMode === 'creative' || this.world.gameMode === 'spectator') return;
    if (isFire && (!this.world.gamerules.fireDamage || this.getEffectLevel('fire_resistance') > 0)) return;
    if (this.hurtImmunity > 0 && rawAmount < 100) return;

    const armor = this.getArmorDefense();
    const resLvl = this.getEffectLevel('resistance');
    const reduction = Math.min(0.8, armor * 0.032 + resLvl * 0.16);
    const dmg = rawAmount >= 100 ? rawAmount : Math.max(1, Math.round(rawAmount * (1 - reduction)));

    this.world.player.hp = Math.max(0, this.world.player.hp - dmg);
    this.damageFlash = 1.0;
    this.cameraShake = 0.22;
    this.hurtImmunity = 0.45;
    this.hitstopTimer = 0.04;
    soundEngine.playHurt();

    if (this.world.player.hp <= 0) {
      if (!this.world.gamerules.keepInventory) {
        this.world.player.inventory = new Array(36).fill(null);
      }
      this.exitPointerLock();
      this.callbacks.onChatMessage(`Người chơi đã bị hạ gục (${reason}).`, 'error');
    }
    this.emitHud();
  }

  // --- Mobs ---
  private spawnInitialMobs(): void {
    if (!this.world || !this.world.gamerules.doMobSpawning) return;
    const types: MobType[] =
      this.world.dimension === 'overworld'
        ? ['pig', 'sheep', 'pig', 'zombie', 'creeper']
        : ['piglin', 'strider', 'zombified_piglin', 'piglin', 'ghast'];
    for (let i = 0; i < types.length; i++) {
      const ang = (i / types.length) * Math.PI * 2 + 0.5;
      const dist = 11 + (i % 3) * 5;
      const mx = this.px + Math.cos(ang) * dist;
      const mz = this.pz + Math.sin(ang) * dist;
      const my = types[i] === 'ghast' ? this.py + 12 : this.findSafeGroundY(Math.floor(mx), Math.floor(mz));
      this.spawnMob(types[i], mx, my, mz);
    }
  }

  private spawnMob(type: MobType, x: number, y: number, z: number): void {
    if (!this.world) return;
    const spec = MOB_SPECS[type];
    if (spec.hostile && this.world.difficulty === 'peaceful') return;
    const { group, limbs } = buildMobMesh(type);
    group.position.set(x - this.originCX * CHUNK_SIZE, y, z - this.originCZ * CHUNK_SIZE);
    this.worldGroup.add(group);
    this.mobs.push({
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      dimension: this.world.dimension,
      hostile: spec.hostile,
      x, y, z,
      vx: 0, vy: 0, vz: 0,
      yaw: Math.random() * Math.PI * 2,
      hp: spec.hp,
      maxHp: spec.hp,
      hurtTimer: 0,
      attackCooldown: 0.5,
      wanderTimer: 1 + Math.random() * 2,
      wanderAngle: Math.random() * Math.PI * 2,
      walkPhase: 0,
      fuseTimer: 0,
      mesh: group,
      limbs,
    });
  }

  private tryAttackMob(): boolean {
    if (!this.world) return false;
    this.camera.getWorldDirection(_camDir);
    const eyeY = this.py + 1.62;
    let hitMob: MobEntity | null = null;
    let bestDist = 4.2;

    for (const mob of this.mobs) {
      const dx = mob.x - this.px;
      const dy = mob.y + MOB_SPECS[mob.type].height * 0.55 - eyeY;
      const dz = mob.z - this.pz;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > bestDist) continue;
      const dot = (dx * _camDir.x + dy * _camDir.y + dz * _camDir.z) / dist;
      if (dot > 0.9) {
        bestDist = dist;
        hitMob = mob;
      }
    }
    if (!hitMob) return false;

    const held = this.world.player.inventory[this.world.player.selectedSlot];
    const def = held ? ITEM_DEFS[held.itemId] : null;
    let dmg = def?.attackDamage || 2;
    if (held?.enchants?.sharpness) dmg += held.enchants.sharpness * 1.5;
    if (held?.enchants?.fire_aspect) dmg += 2;
    dmg += this.getEffectLevel('strength') * 3;

    hitMob.hp -= dmg;
    hitMob.hurtTimer = 0.25;
    hitMob.vy = 5.2;
    hitMob.vx += _camDir.x * 7;
    hitMob.vz += _camDir.z * 7;
    if (hitMob.type === 'zombified_piglin') hitMob.hostile = true;
    this.handSwing = 1.0;
    this.hitstopTimer = 0.035;
    soundEngine.playHurt();
    this.spawnBreakParticles(hitMob.x, hitMob.y + 1, hitMob.z, 0xef4444, 6);

    if (hitMob.hp <= 0) {
      const spec = MOB_SPECS[hitMob.type];
      this.addItemToInventory(spec.drop, spec.dropCount);
      this.world.player.xp += 0.35;
      if (this.world.player.xp >= 1) {
        this.world.player.xp -= 1;
        this.world.player.level += 1;
        soundEngine.playLevelUp();
      }
      this.worldGroup.remove(hitMob.mesh);
      disposeMobMesh(hitMob.mesh);
      this.mobs = this.mobs.filter((m) => m !== hitMob);
      this.callbacks.onChatMessage(`Đã hạ ${spec.nameVi} (+${spec.dropCount} ${ITEM_DEFS[spec.drop]?.nameVi || spec.drop})`, 'system');
      this.emitHud();
    }
    return true;
  }

  private tryPiglinBarter(): boolean {
    if (!this.world) return false;
    const held = this.world.player.inventory[this.world.player.selectedSlot];
    if (!held || held.itemId !== 'gold_ingot') return false;

    this.camera.getWorldDirection(_camDir);
    const eyeY = this.py + 1.62;
    for (const mob of this.mobs) {
      if (mob.type !== 'piglin') continue;
      const dx = mob.x - this.px;
      const dy = mob.y + 1.1 - eyeY;
      const dz = mob.z - this.pz;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 4.5) continue;
      const dot = (dx * _camDir.x + dy * _camDir.y + dz * _camDir.z) / dist;
      if (dot > 0.88) {
        if (this.world.gameMode !== 'creative') {
          held.count -= 1;
          if (held.count <= 0) this.world.player.inventory[this.world.player.selectedSlot] = null;
        }
        const lootPool = ['obsidian', 'crying_obsidian', 'ender_pearl', 'soul_sand', 'blackstone', 'quartz', 'netherite_scrap'];
        const reward = lootPool[Math.floor(Math.random() * lootPool.length)];
        const qty = reward === 'netherite_scrap' ? 1 : 2 + Math.floor(Math.random() * 3);
        this.addItemToInventory(reward, qty);
        soundEngine.playLevelUp();
        this.callbacks.onChatMessage(
          `Trao đổi Piglin (1.16): Đổi 1 Thỏi Vàng lấy ${qty}x ${ITEM_DEFS[reward]?.nameVi || reward}!`,
          'gold',
        );
        this.emitHud();
        return true;
      }
    }
    return false;
  }

  // --- DDA Voxel Raycast ---
  private updateTargetBlock(): void {
    if (this.mode !== 'playing' || !this.world) {
      this.targetBlock = null;
      this.highlightBox.visible = false;
      return;
    }
    this.camera.getWorldDirection(_camDir);
    const ox = this.px;
    const oy = this.py + 1.62;
    const oz = this.pz;
    const maxDist = 5.4;
    const step = 0.05;

    let prevX = Math.floor(ox);
    let prevY = Math.floor(oy);
    let prevZ = Math.floor(oz);

    for (let d = 0.1; d <= maxDist; d += step) {
      const rx = ox + _camDir.x * d;
      const ry = oy + _camDir.y * d;
      const rz = oz + _camDir.z * d;
      const bx = Math.floor(rx);
      const by = Math.floor(ry);
      const bz = Math.floor(rz);

      if (bx !== prevX || by !== prevY || bz !== prevZ) {
        const id = this.getWorldBlock(bx, by, bz);
        if (id !== BLOCK.AIR && !isBlockLiquid(id)) {
          const def = BLOCK_DEFS[id];
          this.targetBlock = {
            x: bx,
            y: by,
            z: bz,
            blockId: id,
            name: def?.nameVi || 'Khối',
            face: [prevX - bx, prevY - by, prevZ - bz],
          };
          this.highlightBox.position.set(
            bx - this.originCX * CHUNK_SIZE + 0.5,
            by + 0.5,
            bz - this.originCZ * CHUNK_SIZE + 0.5,
          );
          this.highlightBox.visible = true;
          return;
        }
        prevX = bx;
        prevY = by;
        prevZ = bz;
      }
    }
    this.targetBlock = null;
    this.highlightBox.visible = false;
  }

  private spawnBreakParticles(wx: number, wy: number, wz: number, colorHex: number, count: number): void {
    const mult = this.settings.particles === 'all' ? 1 : this.settings.particles === 'decreased' ? 0.5 : 0.2;
    const n = Math.max(1, Math.round(count * mult));
    for (let i = 0; i < n; i++) {
      if (this.particles.length > 90) {
        const old = this.particles.shift()!;
        this.worldGroup.remove(old.mesh);
        (old.mesh.material as THREE.Material).dispose();
      }
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.set(
        wx - this.originCX * CHUNK_SIZE + 0.2 + Math.random() * 0.6,
        wy + 0.2 + Math.random() * 0.6,
        wz - this.originCZ * CHUNK_SIZE + 0.2 + Math.random() * 0.6,
      );
      this.worldGroup.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 4.5,
        vy: 1.5 + Math.random() * 3.5,
        vz: (Math.random() - 0.5) * 4.5,
        life: 0.45 + Math.random() * 0.35,
      });
    }
  }

  private updateMining(dt: number): void {
    if (!this.world || this.paused || this.world.player.hp <= 0) {
      this.crackMesh.visible = false;
      this.miningProgress = 0;
      return;
    }
    const breaking = this.mouseLeft || this.touchBreak;
    this.breakCooldown = Math.max(0, this.breakCooldown - dt);
    if (!breaking || !this.targetBlock || this.world.gameMode === 'spectator' || this.world.gameMode === 'adventure') {
      this.miningProgress = 0;
      this.miningKey = '';
      this.crackMesh.visible = false;
      return;
    }

    const tb = this.targetBlock;
    const def = BLOCK_DEFS[tb.blockId];
    if (!def) return;
    if (def.hardness < 0 && this.world.gameMode !== 'creative') return;

    this.handSwing = Math.max(this.handSwing, 0.4);
    const key = `${tb.x},${tb.y},${tb.z}`;
    if (key !== this.miningKey) {
      this.miningKey = key;
      this.miningProgress = 0;
    }

    if (this.world.gameMode === 'creative') {
      if (this.breakCooldown <= 0) {
        this.breakTargetBlock(tb);
        this.breakCooldown = 0.22;
      }
      return;
    }

    // Survival mining speed based on tool tier, efficiency enchant, and haste effect
    const held = this.world.player.inventory[this.world.player.selectedSlot];
    const itemDef = held ? ITEM_DEFS[held.itemId] : null;
    let speed = 1.0;
    if (itemDef && itemDef.toolKind === def.tool) {
      speed = itemDef.miningSpeed || 2.0;
      if (held?.enchants?.efficiency) speed += held.enchants.efficiency * 2.2;
    }
    speed *= 1 + this.getEffectLevel('haste') * 0.25;

    const reqTime = Math.max(0.12, def.hardness / speed);
    this.miningProgress += dt / reqTime;

    this.crackMesh.position.set(
      tb.x - this.originCX * CHUNK_SIZE + 0.5,
      tb.y + 0.5,
      tb.z - this.originCZ * CHUNK_SIZE + 0.5,
    );
    (this.crackMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.75, this.miningProgress * 0.75);
    this.crackMesh.visible = true;

    if (this.miningProgress >= 1) {
      this.breakTargetBlock(tb);
      this.miningProgress = 0;
      this.miningKey = '';
      this.crackMesh.visible = false;
      this.breakCooldown = 0.14;
    }
  }

  private breakTargetBlock(tb: TargetBlockInfo): void {
    if (!this.world) return;
    const def = BLOCK_DEFS[tb.blockId];
    if (!def) return;
    this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK.AIR, true);
    soundEngine.playBlock(def.sound, 'break');
    this.spawnBreakParticles(tb.x, tb.y, tb.z, tb.blockId >= 31 ? 0x9f1239 : 0x9ca3af, 9);
    this.handSwing = 1.0;

    if (this.world.gameMode === 'survival' && def.dropItem) {
      const held = this.world.player.inventory[this.world.player.selectedSlot];
      const itemDef = held ? ITEM_DEFS[held.itemId] : null;
      const tier = itemDef?.toolKind === def.tool ? itemDef.toolTier || 0 : 0;
      if (!def.minTier || tier >= def.minTier) {
        const fortuneBonus =
          held?.enchants?.fortune && (def.category === 'ores')
            ? Math.floor(Math.random() * (held.enchants.fortune + 1))
            : 0;
        this.addItemToInventory(def.dropItem, (def.dropCount || 1) + fortuneBonus);
        if (def.category === 'ores') {
          this.world.player.xp += 0.25;
          if (this.world.player.xp >= 1) {
            this.world.player.xp -= 1;
            this.world.player.level += 1;
            soundEngine.playLevelUp();
          }
        }
      }
    }
    this.emitHud();
  }

  private performRightClickAction(): void {
    if (!this.world || this.paused || this.world.player.hp <= 0) return;
    if (this.placeCooldown > 0) return;
    this.placeCooldown = 0.2;

    // 1. Try Piglin Gold Bartering first
    if (this.tryPiglinBarter()) return;

    const held = this.world.player.inventory[this.world.player.selectedSlot];
    const itemDef = held ? ITEM_DEFS[held.itemId] : null;

    // 2. Try eating food if hungry or hurt
    if (itemDef?.foodRestore && this.world.gameMode === 'survival' && (this.world.player.hunger < 20 || this.world.player.hp < 20)) {
      this.world.player.hunger = Math.min(20, this.world.player.hunger + itemDef.foodRestore);
      if (itemDef.healRestore) {
        this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + itemDef.healRestore);
      }
      held!.count -= 1;
      if (held!.count <= 0) this.world.player.inventory[this.world.player.selectedSlot] = null;
      soundEngine.playEat();
      this.updateFirstPersonHeldVisual();
      this.emitHud();
      return;
    }

    if (!this.targetBlock) return;
    const tb = this.targetBlock;

    // 3. Interact with functional 1.16 blocks (unless sneaking)
    const sneaking = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak;
    if (!sneaking) {
      if (tb.blockId === BLOCK.CRAFTING_TABLE) {
        this.exitPointerLock();
        this.callbacks.onOpenContainer('crafting');
        return;
      }
      if (tb.blockId === BLOCK.FURNACE) {
        this.exitPointerLock();
        this.callbacks.onOpenContainer('furnace');
        return;
      }
      if (tb.blockId === BLOCK.SMITHING_TABLE) {
        this.exitPointerLock();
        this.callbacks.onOpenContainer('smithing');
        return;
      }
      if (tb.blockId === BLOCK.RESPAWN_ANCHOR) {
        if (this.world.dimension === 'nether') {
          this.world.player.spawnPoint = [tb.x + 0.5, tb.y + 1.1, tb.z + 0.5];
          this.world.player.spawnDimension = 'nether';
          soundEngine.playLevelUp();
          this.callbacks.onChatMessage('Đã đặt điểm hồi sinh tại Neo Hồi Sinh Nether (1.16)!', 'gold');
          return;
        } else {
          // Authentic 1.16 mechanic: Respawn Anchor explodes in Overworld!
          this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK.AIR, true);
          soundEngine.playExplosion();
          this.spawnBreakParticles(tb.x, tb.y, tb.z, 0xa855f7, 24);
          this.damagePlayer(10, 'Neo Hồi Sinh phát nổ ở Overworld');
          return;
        }
      }
    }

    if (!held || !itemDef || this.world.gameMode === 'spectator' || this.world.gameMode === 'adventure') return;

    const placeX = tb.x + tb.face[0];
    const placeY = tb.y + tb.face[1];
    const placeZ = tb.z + tb.face[2];

    // 4. Flint & Steel -> Ignite Nether Portal or Soul Fire!
    if (itemDef.isFlintAndSteel) {
      if (this.tryIgniteNetherPortal(placeX, placeY, placeZ)) {
        this.handSwing = 1.0;
        return;
      }
      const under = this.getWorldBlock(placeX, placeY - 1, placeZ);
      if (under === BLOCK.SOUL_SAND || under === BLOCK.SOUL_SOIL) {
        this.setWorldBlock(placeX, placeY, placeZ, BLOCK.SOUL_FIRE, true);
        soundEngine.playBlock('grass', 'place');
        this.handSwing = 1.0;
      } else if (tb.blockId === BLOCK.TNT) {
        // Detonate TNT!
        this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK.AIR, true);
        soundEngine.playExplosion();
        this.cameraShake = 0.35;
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            for (let dz = -2; dz <= 2; dz++) {
              if (dx * dx + dy * dy + dz * dz <= 5) {
                const bid = this.getWorldBlock(tb.x + dx, tb.y + dy, tb.z + dz);
                if (bid !== BLOCK.BEDROCK && bid !== BLOCK.OBSIDIAN && bid !== BLOCK.ANCIENT_DEBRIS) {
                  this.setWorldBlock(tb.x + dx, tb.y + dy, tb.z + dz, BLOCK.AIR, true);
                }
              }
            }
          }
        }
        this.spawnBreakParticles(tb.x, tb.y, tb.z, 0xf97316, 24);
      }
      return;
    }

    // 5. Place block
    if (itemDef.blockId !== undefined) {
      // Prevent placing solid block inside player AABB
      const def = BLOCK_DEFS[itemDef.blockId];
      if (!def.nonSolid) {
        const overlapsPlayer =
          placeX + 1 > this.px - 0.3 &&
          placeX < this.px + 0.3 &&
          placeY + 1 > this.py &&
          placeY < this.py + 1.8 &&
          placeZ + 1 > this.pz - 0.3 &&
          placeZ < this.pz + 0.3;
        if (overlapsPlayer) return;
      }

      this.setWorldBlock(placeX, placeY, placeZ, itemDef.blockId, true);
      soundEngine.playBlock(def.sound, 'place');
      this.handSwing = 0.9;
      if (this.world.gameMode === 'survival') {
        held.count -= 1;
        if (held.count <= 0) this.world.player.inventory[this.world.player.selectedSlot] = null;
        this.updateFirstPersonHeldVisual();
      }
      this.emitHud();
    }
  }

  // --- Player Physics & Environment Tick ---
  private updatePlayerPhysics(dt: number): void {
    if (!this.world || this.paused || this.world.player.hp <= 0) return;

    const isSpectator = this.world.gameMode === 'spectator';
    const footBlock = this.getWorldBlock(Math.floor(this.px), Math.floor(this.py + 0.1), Math.floor(this.pz));
    const headBlock = this.getWorldBlock(Math.floor(this.px), Math.floor(this.py + 1.55), Math.floor(this.pz));
    const inWater = footBlock === BLOCK.WATER || headBlock === BLOCK.WATER;
    const inLava = footBlock === BLOCK.LAVA || headBlock === BLOCK.LAVA;
    const inPortal = footBlock === BLOCK.NETHER_PORTAL || headBlock === BLOCK.NETHER_PORTAL;

    // Input direction in XZ
    let forward = 0;
    let strafe = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;

    // Blend mobile touch joystick/D-pad
    forward += this.touchMoveZ;
    strafe += this.touchMoveX;
    const mag = Math.hypot(forward, strafe);
    if (mag > 1) {
      forward /= mag;
      strafe /= mag;
    }

    const sneaking = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak) && !this.flying;
    const sprinting =
      (this.keys.has('ControlLeft') || (forward > 0.7 && this.keys.has('KeyR'))) &&
      !sneaking &&
      (this.world.gameMode !== 'survival' || this.world.player.hunger > 6);

    const speedMult =
      1 +
      this.getEffectLevel('speed') * 0.22 -
      this.getEffectLevel('slowness') * 0.18;
    const baseSpeed = this.flying ? 11.5 : sneaking ? 2.4 : sprinting ? 6.6 : 4.55;
    const targetSpeed = baseSpeed * Math.max(0.35, speedMult) * (inWater ? 0.65 : inLava ? 0.45 : 1);

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);
    const wishX = (-sinY * forward + cosY * strafe) * targetSpeed;
    const wishZ = (-cosY * forward - sinY * strafe) * targetSpeed;

    const accel = this.onGround || this.flying ? 14 : 5;
    this.vx = THREE.MathUtils.lerp(this.vx, wishX, Math.min(1, dt * accel));
    this.vz = THREE.MathUtils.lerp(this.vz, wishZ, Math.min(1, dt * accel));

    // Smooth sprint FOV widening
    const targetFov = this.settings.fov + (sprinting && mag > 0.2 ? 9 : 0);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 10, dt);
      this.camera.updateProjectionMatrix();
    }

    // Vertical physics
    const jumpHeld = this.keys.has('Space') || this.touchJump;
    const descendHeld = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak;

    if (this.flying || isSpectator) {
      const targetVy = (jumpHeld ? 9.5 : 0) - (descendHeld ? 9.5 : 0);
      this.vy = THREE.MathUtils.lerp(this.vy, targetVy, Math.min(1, dt * 12));
    } else if (this.getEffectLevel('levitation') > 0) {
      this.vy = 2.4 * this.getEffectLevel('levitation');
    } else if (inWater || inLava) {
      this.vy = THREE.MathUtils.lerp(this.vy, jumpHeld ? 4.2 : -1.8, Math.min(1, dt * 8));
      this.fallPeakY = this.py;
    } else {
      const grav = this.getEffectLevel('slow_falling') > 0 ? 7.5 : 26.5;
      this.vy = Math.max(-42, this.vy - grav * dt);
      if (jumpHeld && this.onGround) {
        this.vy = 8.7 + this.getEffectLevel('jump_boost') * 1.65;
        this.onGround = false;
      }
    }

    // Move with AABB collision (skipped in Spectator mode)
    if (isSpectator) {
      this.px += this.vx * dt;
      this.py += this.vy * dt;
      this.pz += this.vz * dt;
      this.onGround = false;
    } else {
      this.moveWithCollision(this.vx * dt, this.vy * dt, this.vz * dt, sneaking);
    }

    // Enforce World Border (±worldBorderSize, up to ±29,999,984!)
    const [bcx, bcz] = this.world.worldBorderCenter;
    const br = this.world.worldBorderSize;
    this.px = THREE.MathUtils.clamp(this.px, bcx - br + 0.5, bcx + br - 0.5);
    this.pz = THREE.MathUtils.clamp(this.pz, bcz - br + 0.5, bcz + br - 0.5);
    this.py = THREE.MathUtils.clamp(this.py, -8, WORLD_HEIGHT_MAX + 24);
    if (this.py < -4) this.damagePlayer(4, 'Rơi xuống khoảng không');

    // View bobbing & Footstep sound
    const horizSpeed = Math.hypot(this.vx, this.vz);
    if (this.onGround && horizSpeed > 0.6 && !this.flying) {
      this.bobPhase += dt * horizSpeed * 2.2;
      this.stepDist += horizSpeed * dt;
      if (this.stepDist > 2.3) {
        this.stepDist = 0;
        const under = this.getWorldBlock(Math.floor(this.px), Math.floor(this.py - 0.2), Math.floor(this.pz));
        const bdef = BLOCK_DEFS[under];
        if (bdef) soundEngine.playBlock(bdef.sound, 'step');
      }
    }

    // Environmental hazards: Lava, Soul Fire, Magma, Drowning
    if (inLava || footBlock === BLOCK.SOUL_FIRE) {
      this.damagePlayer(inLava ? 4 : 2, inLava ? 'Dung nham' : 'Lửa Linh Hồn', true);
    } else if (!sneaking && this.onGround) {
      const under = this.getWorldBlock(Math.floor(this.px), Math.floor(this.py - 0.2), Math.floor(this.pz));
      if (under === BLOCK.MAGMA) this.damagePlayer(1, 'Khối Magma', true);
    }

    if (headBlock === BLOCK.WATER && this.getEffectLevel('water_breathing') === 0) {
      this.world.player.oxygen = Math.max(0, this.world.player.oxygen - dt * 2.2);
      if (this.world.player.oxygen <= 0 && this.world.gamerules.drowningDamage) {
        this.damagePlayer(2, 'Chết đuối');
      }
    } else {
      this.world.player.oxygen = Math.min(20, this.world.player.oxygen + dt * 8);
    }

    // Survival Hunger & Regeneration
    if (this.world.gameMode === 'survival') {
      this.hungerTick += dt * (sprinting ? 1.8 : 0.45);
      if (this.hungerTick > 28) {
        this.hungerTick = 0;
        this.world.player.hunger = Math.max(0, this.world.player.hunger - 1);
      }
      this.regenTick += dt;
      const regenLvl = this.getEffectLevel('regeneration');
      const regenInterval = regenLvl > 0 ? 1.2 : this.world.difficulty === 'peaceful' ? 1.5 : 4.0;
      if (this.regenTick >= regenInterval) {
        this.regenTick = 0;
        if (
          this.world.player.hp < this.world.player.maxHp &&
          (regenLvl > 0 || this.world.difficulty === 'peaceful' || (this.world.gamerules.naturalRegeneration && this.world.player.hunger >= 18))
        ) {
          this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + 1);
        } else if (this.world.player.hunger <= 0 && this.world.player.hp > 2) {
          this.damagePlayer(1, 'Đói kiệt sức');
        }
      }
    }

    // Nether Portal 2.5s warp trigger (1:8 coordinate ratio)
    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    if (inPortal && this.portalCooldown <= 0) {
      this.portalProgress = Math.min(1, this.portalProgress + dt / 2.4);
      if (this.portalProgress >= 1) {
        if (this.world.dimension === 'overworld') {
          this.switchDimension('nether', Math.floor(this.px / 8) + 0.5, null, Math.floor(this.pz / 8) + 0.5, true);
        } else {
          this.switchDimension('overworld', Math.floor(this.px * 8) + 0.5, null, Math.floor(this.pz * 8) + 0.5, true);
        }
        return;
      }
    } else {
      this.portalProgress = Math.max(0, this.portalProgress - dt * 1.8);
    }

    this.recenterFloatingOrigin();
  }

  private collidesAt(x: number, y: number, z: number): boolean {
    const r = 0.28;
    const h = 1.78;
    const minX = Math.floor(x - r), maxX = Math.floor(x + r);
    const minY = Math.floor(y), maxY = Math.floor(y + h);
    const minZ = Math.floor(z - r), maxZ = Math.floor(z + r);
    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (isBlockSolid(this.getWorldBlock(bx, by, bz))) return true;
        }
      }
    }
    return false;
  }

  private moveWithCollision(dx: number, dy: number, dz: number, sneakEdgeGuard: boolean): void {
    // X axis
    if (!this.collidesAt(this.px + dx, this.py, this.pz)) {
      if (!sneakEdgeGuard || !this.onGround || this.collidesAt(this.px + dx, this.py - 0.4, this.pz)) {
        this.px += dx;
      } else {
        this.vx = 0;
      }
    } else {
      this.vx = 0;
    }

    // Z axis
    if (!this.collidesAt(this.px, this.py, this.pz + dz)) {
      if (!sneakEdgeGuard || !this.onGround || this.collidesAt(this.px, this.py - 0.4, this.pz + dz)) {
        this.pz += dz;
      } else {
        this.vz = 0;
      }
    } else {
      this.vz = 0;
    }

    // Y axis
    const wasOnGround = this.onGround;
    if (!this.collidesAt(this.px, this.py + dy, this.pz)) {
      this.py += dy;
      this.onGround = false;
      if (this.py > this.fallPeakY) this.fallPeakY = this.py;
    } else {
      if (dy < 0) {
        const landedY = Math.floor(this.py + dy) + 1;
        this.py = landedY;
        this.onGround = true;
        if (!wasOnGround && this.world && this.world.gamerules.fallDamage && this.getEffectLevel('slow_falling') === 0) {
          const drop = this.fallPeakY - this.py;
          if (drop > 3.6) {
            this.damagePlayer(Math.floor(drop - 3), 'Ngã từ trên cao');
          }
        }
        this.fallPeakY = this.py;
      }
      this.vy = 0;
    }
  }

  // --- Furnace, Effects, Sky, Weather & World Border Tick ---
  private updateWorldSystems(dt: number): void {
    if (!this.world || !this.generator) return;

    // 1. Active Potion Effects countdown
    if (this.world.player.effects.length > 0) {
      this.world.player.effects = this.world.player.effects
        .map((e) => ({ ...e, remainingSec: e.remainingSec - dt }))
        .filter((e) => e.remainingSec > 0);
    }

    // 2. Live Furnace smelting tick
    const f = this.world.furnace;
    const outputItem = f.input ? SMELTING_RECIPES[f.input.itemId] : undefined;
    const canAcceptOutput =
      Boolean(outputItem) &&
      (!f.output || (f.output.itemId === outputItem && f.output.count < 64));

    if (f.burnTime > 0) {
      f.burnTime = Math.max(0, f.burnTime - dt);
    }
    if (f.burnTime <= 0 && canAcceptOutput && f.fuel) {
      const ft = ITEM_DEFS[f.fuel.itemId]?.fuelTime || 0;
      if (ft > 0) {
        f.burnTime = ft;
        f.burnMax = ft;
        f.fuel.count -= 1;
        if (f.fuel.count <= 0) f.fuel = null;
      }
    }
    if (f.burnTime > 0 && canAcceptOutput && f.input && outputItem) {
      f.cookProgress += dt / 5.0; // 5s crisp smelting per item
      if (f.cookProgress >= 1) {
        f.cookProgress = 0;
        f.input.count -= 1;
        if (f.input.count <= 0) f.input = null;
        if (f.output) f.output.count += 1;
        else f.output = { itemId: outputItem, count: 1 };
      }
    } else if (!canAcceptOutput) {
      f.cookProgress = 0;
    }

    // 3. Daylight & Weather
    if (this.world.gamerules.doDaylightCycle) {
      this.world.timeOfDay = (this.world.timeOfDay + dt * 20) % 24000;
    }
    if (this.world.gamerules.doWeatherCycle && this.world.dimension === 'overworld') {
      this.weatherTick += dt;
      if (this.weatherTick > 180) {
        this.weatherTick = 0;
        const r = Math.random();
        this.world.weather = r < 0.72 ? 'clear' : r < 0.92 ? 'rain' : 'thunder';
      }
    }

    const brightBoost = 0.65 + this.settings.brightness * 0.55 + (this.getEffectLevel('night_vision') > 0 ? 0.5 : 0);

    if (this.world.dimension === 'nether') {
      // Dynamic Nether 1.16 biome atmosphere!
      const biome = this.generator.getNetherBiome(Math.floor(this.px), Math.floor(this.pz));
      const fogColors: Record<string, number> = {
        nether_wastes: 0x3b1214,
        crimson_forest: 0x4b0f1b,
        warped_forest: 0x0f3b40,
        soul_sand_valley: 0x1c343d,
        basalt_deltas: 0x3a3742,
      };
      _fogTarget.setHex(fogColors[biome] ?? 0x3b1214);
      _skyColor.copy(this.scene.background as THREE.Color).lerp(_fogTarget, Math.min(1, dt * 2.5));
      (this.scene.background as THREE.Color).copy(_skyColor);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.copy(_skyColor);
        this.scene.fog.near = 10;
        this.scene.fog.far = Math.max(32, this.settings.renderDistance * 13);
      }
      this.sunMesh.visible = false;
      this.moonMesh.visible = false;
      this.cloudGroup.visible = false;
      this.rainPoints.visible = false;
      this.sunLight.color.setHex(0xff8c5a);
      this.sunLight.intensity = 0.85 * brightBoost;
      this.hemiLight.color.setHex(biome === 'warped_forest' ? 0x5eead4 : 0xd96b5c);
      this.hemiLight.groundColor.setHex(0x451a12);
      this.hemiLight.intensity = 0.92 * brightBoost;
    } else {
      // Overworld day/night sky, sun/moon arc, clouds, rain/thunder
      const angle = ((this.world.timeOfDay - 6000) / 24000) * Math.PI * 2;
      const sunH = Math.cos(angle);
      const dayFactor = THREE.MathUtils.clamp((sunH + 0.25) / 0.75, 0, 1);
      const rainy = this.world.weather !== 'clear';

      if (this.world.weather === 'thunder' && Math.random() < dt * 0.14) {
        this.lightningFlash = 1.0;
        soundEngine.playThunder();
      }
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.5);

      const daySky = rainy ? 0x5c6e85 : 0x7cb1ff;
      const nightSky = 0x0b1020;
      _fogTarget.setHex(nightSky).lerp(new THREE.Color(daySky), dayFactor);
      if (this.lightningFlash > 0.1) _fogTarget.lerp(new THREE.Color(0xe0f2fe), this.lightningFlash * 0.7);
      (this.scene.background as THREE.Color).copy(_fogTarget);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.copy(_fogTarget);
        this.scene.fog.near = rainy ? 14 : 26;
        this.scene.fog.far = Math.max(38, this.settings.renderDistance * 15);
      }

      const relX = this.px - this.originCX * CHUNK_SIZE;
      const relZ = this.pz - this.originCZ * CHUNK_SIZE;
      const orbitR = 140;
      this.sunMesh.visible = true;
      this.moonMesh.visible = true;
      this.sunMesh.position.set(relX + Math.sin(angle) * orbitR, this.py + Math.cos(angle) * orbitR, relZ - 30);
      this.moonMesh.position.set(relX - Math.sin(angle) * orbitR, this.py - Math.cos(angle) * orbitR, relZ - 30);

      this.sunLight.position.set(relX + Math.sin(angle) * 60, Math.max(12, Math.cos(angle) * 75), relZ + 25);
      this.sunLight.target.position.set(relX, this.py, relZ);
      this.sunLight.color.setHex(dayFactor > 0.35 ? 0xfff4d6 : 0x93c5fd);
      this.sunLight.intensity = (0.28 + dayFactor * (rainy ? 0.65 : 1.15) + this.lightningFlash) * brightBoost;

      _hemiSky.setHex(0x1e293b).lerp(new THREE.Color(rainy ? 0x7c8fa6 : 0xa5d2ff), dayFactor);
      _hemiGround.setHex(0x1f1d24).lerp(new THREE.Color(0x52483c), dayFactor);
      this.hemiLight.color.copy(_hemiSky);
      this.hemiLight.groundColor.copy(_hemiGround);
      this.hemiLight.intensity = (0.38 + dayFactor * 0.45) * brightBoost;

      // Clouds drift
      this.cloudGroup.visible = this.settings.clouds !== 'off';
      this.cloudGroup.position.set(relX + ((performance.now() * 0.0015) % 40) - 20, 0, relZ);

      // Rain particles
      this.rainPoints.visible = rainy;
      if (rainy) {
        this.rainPoints.position.set(relX, this.py, relZ);
        const posAttr = this.rainPoints.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
          let ry = posAttr.getY(i) - dt * 22;
          if (ry < -4) ry = 20;
          posAttr.setY(i, ry);
        }
        posAttr.needsUpdate = true;
      }
    }

    // 4. World Border visual barrier when within 45 blocks of border
    const [bcx, bcz] = this.world.worldBorderCenter;
    const br = this.world.worldBorderSize;
    const relX = this.px - this.originCX * CHUNK_SIZE;
    const relZ = this.pz - this.originCZ * CHUNK_SIZE;
    const showMaxX = Math.abs(this.px - (bcx + br)) < 45;
    const showMinX = Math.abs(this.px - (bcx - br)) < 45;
    const showMaxZ = Math.abs(this.pz - (bcz + br)) < 45;
    const showMinZ = Math.abs(this.pz - (bcz - br)) < 45;

    this.borderWalls[0].visible = showMaxX;
    if (showMaxX) {
      this.borderWalls[0].position.set(bcx + br - this.originCX * CHUNK_SIZE, this.py, relZ);
      this.borderWalls[0].rotation.y = Math.PI / 2;
    }
    this.borderWalls[1].visible = showMinX;
    if (showMinX) {
      this.borderWalls[1].position.set(bcx - br - this.originCX * CHUNK_SIZE, this.py, relZ);
      this.borderWalls[1].rotation.y = Math.PI / 2;
    }
    this.borderWalls[2].visible = showMaxZ;
    if (showMaxZ) {
      this.borderWalls[2].position.set(relX, this.py, bcz + br - this.originCZ * CHUNK_SIZE);
      this.borderWalls[2].rotation.y = 0;
    }
    this.borderWalls[3].visible = showMinZ;
    if (showMinZ) {
      this.borderWalls[3].position.set(relX, this.py, bcz - br - this.originCZ * CHUNK_SIZE);
      this.borderWalls[3].rotation.y = 0;
    }

    // 5. Update Mobs
    const wearingGold = this.isWearingGoldArmor();
    const survival = this.world.gameMode === 'survival' || this.world.gameMode === 'adventure';
    const blockGetter = (x: number, y: number, z: number) => this.getWorldBlock(x, y, z);

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i];
      if (Math.hypot(m.x - this.px, m.z - this.pz) > 68) {
        this.worldGroup.remove(m.mesh);
        disposeMobMesh(m.mesh);
        this.mobs.splice(i, 1);
        continue;
      }
      updateMobAI(
        m,
        dt,
        { x: this.px, y: this.py, z: this.pz },
        survival,
        wearingGold,
        this.world.difficulty,
        blockGetter,
        (dmg, mobName, explode) => {
          if (explode) {
            soundEngine.playExplosion();
            this.spawnBreakParticles(explode.x, explode.y + 1, explode.z, 0x4ade80, 18);
          }
          this.damagePlayer(dmg, mobName);
        },
      );
      if (m.hp <= 0) {
        this.worldGroup.remove(m.mesh);
        disposeMobMesh(m.mesh);
        this.mobs.splice(i, 1);
        continue;
      }
      m.mesh.position.set(m.x - this.originCX * CHUNK_SIZE, m.y, m.z - this.originCZ * CHUNK_SIZE);
      m.mesh.rotation.y = m.yaw;
    }

    // Occasional ambient mob spawn
    if (this.world.gamerules.doMobSpawning && this.mobs.length < 7) {
      this.mobSpawnTick += dt;
      if (this.mobSpawnTick > 14) {
        this.mobSpawnTick = 0;
        const pool: MobType[] =
          this.world.dimension === 'overworld'
            ? this.world.timeOfDay > 13000 ? ['zombie', 'creeper'] : ['pig', 'sheep']
            : ['piglin', 'strider', 'zombified_piglin'];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const ang = Math.random() * Math.PI * 2;
        const sx = this.px + Math.cos(ang) * 22;
        const sz = this.pz + Math.sin(ang) * 22;
        const sy = this.findSafeGroundY(Math.floor(sx), Math.floor(sz));
        this.spawnMob(pick, sx, sy, sz);
      }
    }

    // 6. Update Break Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.worldGroup.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= 14 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 4;
    }

    // 7. Auto-save every 15s
    this.autosaveTick += dt;
    if (this.autosaveTick > 15) {
      this.autosaveTick = 0;
      this.saveCurrentWorld();
    }
  }

  // --- Main Render Loop with Software WebGL afterDraw Pacing ---
  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.fpsAccum += rawDt;
    this.fpsFrames++;
    if (this.fpsAccum >= 0.5) {
      this.currentFps = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }

    if (this.mode === 'panorama') {
      // Smooth atmospheric 3D orbit for Resource Gate & Title Screen
      this.panoramaAngle += dt * 0.16;
      const radius = 12.5;
      this.camera.position.set(
        Math.cos(this.panoramaAngle) * radius,
        5.4 + Math.sin(this.panoramaAngle * 0.6) * 0.8,
        Math.sin(this.panoramaAngle) * radius,
      );
      this.camera.lookAt(0, 2.2, 0);
      (this.scene.background as THREE.Color).setHex(0x1f1429);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(0x1f1429);
        this.scene.fog.near = 14;
        this.scene.fog.far = 42;
      }
      this.sunLight.color.setHex(0xffc99e);
      this.sunLight.intensity = 1.25;
      this.sunLight.position.set(14, 20, 10);
      this.hemiLight.color.setHex(0x9f7aea);
      this.hemiLight.groundColor.setHex(0x2b1824);
      this.hemiLight.intensity = 0.8;
    } else if (this.world) {
      this.hurtImmunity = Math.max(0, this.hurtImmunity - dt);
      this.damageFlash = Math.max(0, this.damageFlash - dt * 2.5);
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.4);
      this.placeCooldown = Math.max(0, this.placeCooldown - dt);

      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      } else if (!this.paused) {
        this.updatePlayerPhysics(dt);
        this.streamChunksAroundPlayer(false);
        this.updateTargetBlock();
        this.updateMining(dt);
        this.updateWorldSystems(dt);
      }

      // Position camera relative to floating origin (supports F5 1st / 3rd-Back / 3rd-Front!)
      const bobY = this.settings.viewBobbing && !this.flying ? Math.sin(this.bobPhase * 2) * 0.045 : 0;
      const bobX = this.settings.viewBobbing && !this.flying ? Math.cos(this.bobPhase) * 0.03 : 0;
      const shakeX = this.cameraShake > 0 ? (Math.random() - 0.5) * this.cameraShake * 0.35 : 0;
      const shakeY = this.cameraShake > 0 ? (Math.random() - 0.5) * this.cameraShake * 0.35 : 0;

      const isSneaking = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak) && !this.flying;
      const sneakDrop = isSneaking ? -0.18 : 0;
      const relX = this.px - this.originCX * CHUNK_SIZE;
      const relZ = this.pz - this.originCZ * CHUNK_SIZE;
      const eyeY = this.py + 1.62 + sneakDrop;

      // Update 3D Player Skin Rig transform & animation
      const horizSpeed = Math.hypot(this.vx, this.vz);
      if (horizSpeed > 0.25) {
        this.walkAnimPhase += dt * horizSpeed * 2.1;
      }
      if (this.handSwing > 0) this.handSwing = Math.max(0, this.handSwing - dt * 5.2);

      if (this.playerRig) {
        this.playerRig.root.visible = this.cameraMode !== 'first';
        this.playerRig.root.position.set(relX, this.py, relZ);
        // Model faces +Z in local space; player looks down (-sin(yaw), -cos(yaw)) -> rotate Y by yaw + PI
        this.playerRig.root.rotation.y = this.yaw + Math.PI;
        animatePlayerRig(this.playerRig, now * 0.001, {
          walkPhase: this.walkAnimPhase,
          moveSpeed: horizSpeed,
          headPitch: this.pitch,
          sneaking: isSneaking,
          handSwing: this.handSwing,
          flying: this.flying,
        });
      }

      if (this.cameraMode === 'first') {
        this.handGroup.visible = true;
        this.camera.position.set(relX + bobX + shakeX, eyeY + bobY + shakeY, relZ);
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      } else {
        this.handGroup.visible = false;
        const dirSign = this.cameraMode === 'third_back' ? 1 : -1;
        const cosP = Math.cos(this.pitch);
        const backX = Math.sin(this.yaw) * cosP * dirSign;
        const backY = -Math.sin(this.pitch) * dirSign;
        const backZ = Math.cos(this.yaw) * cosP * dirSign;

        // Collision-safe boom distance (max 3.8 blocks) so camera never clips into terrain
        let dist = 3.8;
        for (let step = 0.5; step <= 3.8; step += 0.25) {
          const cx = this.px + backX * step;
          const cy = eyeY + backY * step;
          const cz = this.pz + backZ * step;
          if (isBlockSolid(this.getWorldBlock(Math.floor(cx), Math.floor(cy), Math.floor(cz)))) {
            dist = Math.max(0.65, step - 0.35);
            break;
          }
        }
        this.camera.position.set(
          relX + backX * dist + shakeX,
          eyeY + backY * dist + shakeY + 0.15,
          relZ + backZ * dist,
        );
        if (this.cameraMode === 'third_back') {
          this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        } else {
          this.camera.lookAt(relX, eyeY - 0.12, relZ);
        }
      }

      // First-person hand swing
      const swingAmt = Math.sin(this.handSwing * Math.PI);
      this.handGroup.position.set(bobX * 0.6, bobY * 0.6 - swingAmt * 0.14, -swingAmt * 0.18);
      this.handGroup.rotation.set(-swingAmt * 0.65, swingAmt * 0.25, 0);

      // Throttled HUD snapshot emit (12Hz keeps React completely off the 60fps hot path)
      this.hudEmitTick += dt;
      if (this.hudEmitTick >= 0.085) {
        this.hudEmitTick = 0;
        this.emitHud();
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private emitHud(): void {
    if (!this.world || !this.generator) return;
    const biome = this.generator.getBiomeAt(this.world.dimension, Math.floor(this.px), Math.floor(this.pz));
    const headBlock = this.getWorldBlock(Math.floor(this.px), Math.floor(this.py + 1.55), Math.floor(this.pz));
    this.callbacks.onHudUpdate({
      fps: this.currentFps,
      x: this.px,
      y: this.py,
      z: this.pz,
      yaw: this.yaw,
      pitch: this.pitch,
      dimension: this.world.dimension,
      biome: BIOME_LABELS[biome] || biome,
      gameMode: this.world.gameMode,
      difficulty: this.world.difficulty,
      weather: this.world.weather,
      timeOfDay: this.world.timeOfDay,
      hp: this.world.player.hp,
      maxHp: this.world.player.maxHp,
      armorPoints: this.getArmorDefense(),
      hunger: this.world.player.hunger,
      oxygen: this.world.player.oxygen,
      underwater: headBlock === BLOCK.WATER,
      xp: this.world.player.xp,
      level: this.world.player.level,
      selectedSlot: this.world.player.selectedSlot,
      cameraMode: this.cameraMode,
      flying: this.flying,
      sprinting: this.keys.has('ControlLeft'),
      sneaking: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak,
      portalProgress: this.portalProgress,
      damageFlash: this.damageFlash,
      dead: this.world.player.hp <= 0,
      pointerLocked: this.pointerLocked,
      loadedChunks: this.chunks.size,
      mobCount: this.mobs.length,
      worldBorderRadius: this.world.worldBorderSize,
      targetBlock: this.targetBlock,
      effects: [...this.world.player.effects],
      inventory: this.world.player.inventory.map((st) => (st ? { ...st } : null)),
      armor: this.world.player.armor.map((st) => (st ? { ...st } : null)),
      furnace: { ...this.world.furnace },
      heldItemToast: this.heldItemToast,
      heldItemToastAt: this.heldItemToastAt,
    });
  }

  // --- Input Handlers ---
  private triggerJumpPress(): void {
    if (!this.world) return;
    if (this.world.gameMode === 'creative') {
      const now = performance.now();
      if (now - this.lastSpaceTap < 280) {
        this.flying = !this.flying;
        this.vy = 0;
        this.lastSpaceTap = 0;
        this.emitHud();
        return;
      }
      this.lastSpaceTap = now;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.mode !== 'playing') return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.code === 'F3') {
      e.preventDefault();
      this.callbacks.onToggleF3();
      return;
    }
    if (e.code === 'F5') {
      e.preventDefault();
      this.cycleCameraMode();
      return;
    }
    if (e.code === 'Escape') {
      if (this.mode === 'playing') this.callbacks.onPauseRequest();
      return;
    }
    if (this.paused || !this.world || this.world.player.hp <= 0) return;

    if (e.code === 'KeyE') {
      e.preventDefault();
      this.exitPointerLock();
      this.callbacks.onOpenContainer('inventory');
      return;
    }
    if (e.code === 'KeyT' || e.key === '/') {
      e.preventDefault();
      this.exitPointerLock();
      this.callbacks.onOpenChat(e.key === '/' ? '/' : '');
      return;
    }
    if (e.code.startsWith('Digit')) {
      const idx = parseInt(e.code.slice(5), 10) - 1;
      if (idx >= 0 && idx < 9) this.selectHotbarSlot(idx);
      return;
    }
    if (e.code === 'Space' && !this.keys.has('Space')) {
      this.triggerJumpPress();
    }
    this.keys.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.mode !== 'playing' || this.paused || !this.pointerLocked) return;
    const sens = 0.0022 * this.settings.sensitivity;
    this.yaw -= e.movementX * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * sens, -Math.PI * 0.495, Math.PI * 0.495);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.mode !== 'playing' || this.paused) return;
    if (!this.pointerLocked) {
      this.requestPointerLock();
      return;
    }
    if (e.button === 0) {
      this.mouseLeft = true;
      this.tryAttackMob();
    } else if (e.button === 2) {
      this.mouseRight = true;
      this.performRightClickAction();
    } else if (e.button === 1 && this.targetBlock && this.world?.gameMode === 'creative') {
      // Middle-click Pick Block in Creative!
      const key = BLOCK_DEFS[this.targetBlock.blockId]?.key;
      if (key && ITEM_DEFS[key]) {
        this.world.player.inventory[this.world.player.selectedSlot] = { itemId: key, count: 64 };
        this.updateFirstPersonHeldVisual();
        this.emitHud();
      }
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) this.mouseLeft = false;
    if (e.button === 2) this.mouseRight = false;
  }

  private handleWheel(e: WheelEvent): void {
    if (this.mode !== 'playing' || this.paused || !this.world) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    this.selectHotbarSlot(this.world.player.selectedSlot + dir);
  }

  private handlePointerLockChange(): void {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    if (!this.pointerLocked) {
      this.mouseLeft = false;
      this.mouseRight = false;
    }
    this.emitHud();
  }

  private handleBlur(): void {
    this.keys.clear();
    this.mouseLeft = false;
    this.mouseRight = false;
    this.touchBreak = false;
    this.touchMoveX = 0;
    this.touchMoveZ = 0;
  }

  private handleResize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = Math.max(1, w) / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.saveCurrentWorld();

    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    window.removeEventListener('wheel', this.onWheelBound);
    window.removeEventListener('blur', this.onBlurBound);
    document.removeEventListener('pointerlockchange', this.onPointerLockBound);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownBound);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenuBound);

    this.clearWorldScene();
    this.handDispose?.();
    if (this.playerRig) {
      this.scene.remove(this.playerRig.root);
      this.playerRig.dispose();
      this.playerRig = null;
    }
    this.opaqueMat.dispose();
    this.transMat.dispose();
    this.particleGeo.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
