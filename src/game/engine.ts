import * as THREE from 'three';
import { soundEngine } from './audio';
import {
  BLOCK,
  BLOCK_BY_KEY,
  BLOCK_DEFS,
  getBlockLightEmission,
  getBlockSelectionBounds,
  getBlockShape,
  ITEM_DEFS,
  isBlockLiquid,
  isBlockSolid,
  isBlockTransparent,
} from './blocks';
import { unlockAdvancement } from './advancements';
import {
  BEACON_EFFECT_LABELS_VI,
  checkWitherSummonPattern,
  evaluateBeaconPyramid,
} from './bossesAndBeacon';
import { stepBrewingStand } from './brewing';
import { buildSubChunkGeometry } from './chunkMesher';
import { computeJavaMeleeAttack, stepAttackCooldown } from './combat';
import { executeCommand } from './commands';
import {
  buildMobMesh,
  disposeMobMesh,
  MOB_SPECS,
  MobEntity,
  MobType,
  stepAllyGuardianCombat,
  updateMobAI,
} from './mobs';
import {
  isGravityBlock,
  settleFallingBlocks,
  stepFluidSpread,
  WorldBlockIO,
} from './physicsWorld';
import {
  animatePlayerRig,
  buildExtrudedItemGeometry,
  buildFirstPersonSkinArm,
  buildMinecraftPlayerRig,
  loadSavedSkinConfig,
  PlayerRig,
  updateRigArmorVisuals,
} from './playerSkin';
import {
  applyHeroOfTheVillageDiscount,
  createRaid,
  getRaidWaveMobTypes,
  RaidState,
  recordRaidKill,
} from './raid';
import { SMELTING_RECIPES } from './recipes';
import {
  activatePiston,
  makeCoordKey,
  playNoteBlock,
  RedstoneWorldAccessor,
  stepHopperTransfer,
  toggleLever,
  triggerObserverPulse,
  updateRedstoneNetworkAround,
} from './redstone';
import { CompiledResourcePack } from './resourcePack';
import {
  CAMPFIRE_COOK_MAP,
  getFurnaceSpeedMultiplier,
  interactCauldron,
  rollFishingLoot,
  stepComposter,
} from './stations';
import {
  createEmptyBrewingState,
  createEmptyChestSlots,
  migrateWorldSave,
  packShulkerBoxItem,
  saveWorld,
  unpackShulkerBoxItem,
} from './storage';
import {
  executeVillagerTrade,
  generateVillagerOffers,
  VILLAGER_PROFESSION_LABELS,
  VILLAGER_PROFESSIONS,
} from './trading';
import {
  ActiveEffect,
  BrewingStandState,
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
  emissiveMeshes: (THREE.Mesh | null)[];
}

interface BreakParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

type ProjectileKind =
  | 'xp_bottle'
  | 'ender_pearl'
  | 'snowball'
  | 'egg'
  | 'arrow'
  | 'trident'
  | 'fireball'
  | 'firework'
  | 'eye_of_ender'
  | 'splash_potion'
  | 'wind_charge';

interface ProjectileEntity {
  kind: ProjectileKind;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  life: number;
  colorHex: number;
  damage: number;
  itemId: string;
  trailTimer: number;
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

  // Materials driven by compiled Resource Pack atlas (Lambert for 3x faster FPS on mobile & desktop)
  private opaqueMat: THREE.MeshLambertMaterial;
  private transMat: THREE.MeshLambertMaterial;
  private emissiveMat: THREE.MeshBasicMaterial;

  // Dynamic real-time PointLight pool for placed torches/lanterns/glowstone/campfires/lava + handheld light
  private dynamicLights: THREE.PointLight[] = [];
  private heldPointLight: THREE.PointLight;
  private dynamicLightTick = 99;

  // Dedicated depth-cleared First-Person Hand overlay scene (zero wall clipping + fixed 70° FOV)
  private handScene: THREE.Scene;
  private handCamera: THREE.PerspectiveCamera;
  private handHemi: THREE.HemisphereLight;
  private handDir: THREE.DirectionalLight;
  private handRim: THREE.DirectionalLight;

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
  private panoramaMobsGroup = new THREE.Group();
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
  private spyglassZoom = false;
  private mountedMobId: string | null = null;
  private mountDashCooldown = 0;
  private wardenNoiseCooldown = 0;
  private enchantBookshelves = 0;
  private activeChestKey: string | null = null;
  private activeBrewingKey: string | null = null;
  private activeTradingMobId: string | null = null;
  private raidState: RaidState | null = null;
  private advancementToast: { id: string; titleVi: string; descVi: string; iconColor: string; at: number } | null = null;
  private activeBeacon: { x: number; y: number; z: number; effect: EffectId } | null = null;
  private beaconTick = 0;
  private redstoneTickAccum = 0;
  private randomTickAccum = 0;
  private playerAttackCooldown = 1.0;
  private lastPlateKey: string | null = null;

  // Touch-anywhere direct block break/tap + PC mouse free-look fallback
  private touchScreenBreakPos: { x: number; y: number } | null = null;
  private pcFreeLookActive = false;
  private lastMousePos: { x: number; y: number } | null = null;
  private screenRaycaster = new THREE.Raycaster();

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
  private equipProgress = 1;
  private lastHeldItemId = '';
  private playerSkinConfig: PlayerSkinConfig = loadSavedSkinConfig();
  private playerRig: PlayerRig | null = null;
  private cameraMode: CameraMode = 'first';
  private walkAnimPhase = 0;

  // Pooled break particles & 3D projectiles
  private particles: BreakParticle[] = [];
  private particleGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  private projectiles: ProjectileEntity[] = [];
  private projectileGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);

  // Clouds, Rain, Sun/Moon, Stars, World Border wall
  private cloudGroup = new THREE.Group();
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private starField: THREE.Points;
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

    const isCompactOrTouch =
      window.innerWidth < 820 || (navigator.maxTouchPoints || 0) > 0;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && !isCompactOrTouch,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    const maxDpr = this.isSoftwareGl ? 1 : isCompactOrTouch ? 1.25 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.shadows;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // Context loss safety
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
    });

    // Classic crisp outdoor lighting rig (lightweight for high FPS)
    this.hemiLight = new THREE.HemisphereLight(0xb8d4ff, 0x5c534a, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff6e0, 1.15);
    this.sunLight.position.set(42, 78, 32);
    this.sunLight.castShadow = !this.isSoftwareGl && settings.shadows;
    this.sunLight.shadow.mapSize.set(512, 512);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 140;
    const sd = 40;
    this.sunLight.shadow.camera.left = -sd;
    this.sunLight.shadow.camera.right = sd;
    this.sunLight.shadow.camera.top = sd;
    this.sunLight.shadow.camera.bottom = -sd;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 0.22);
    this.rimLight.position.set(-40, 28, -40);
    this.scene.add(this.rimLight);

    // Fast Lambert voxel atlas materials + self-illuminated emissive material for glowing light blocks
    this.opaqueMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
    });
    this.transMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
    });
    this.emissiveMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    // Pooled dynamic PointLights (6 nearby world light blocks + 1 handheld light when holding torch/lantern)
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.PointLight(0xffcf87, 0, 16, 1.5);
      pl.visible = false;
      this.scene.add(pl);
      this.dynamicLights.push(pl);
    }
    this.heldPointLight = new THREE.PointLight(0xffcf87, 0, 13, 1.5);
    this.heldPointLight.visible = false;
    this.scene.add(this.heldPointLight);

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

    // Dedicated depth-cleared First-Person Hand overlay scene (prevents hand/tool clipping into walls!)
    this.handScene = new THREE.Scene();
    this.handCamera = new THREE.PerspectiveCamera(
      70,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.05,
      10,
    );
    this.handHemi = new THREE.HemisphereLight(0xffffff, 0x7b7570, 1.35);
    this.handDir = new THREE.DirectionalLight(0xfff7e6, 1.05);
    this.handDir.position.set(-0.9, 1.8, 2.0);
    this.handRim = new THREE.DirectionalLight(0xa5c8ff, 0.45);
    this.handRim.position.set(1.4, 0.9, -0.6);
    this.handScene.add(this.handHemi, this.handDir, this.handRim);

    const builtArm = buildFirstPersonSkinArm(this.playerSkinConfig);
    this.handGroup = builtArm.group;
    this.handDispose = builtArm.dispose;
    this.handGroup.visible = false;
    this.handScene.add(this.handGroup);
    this.scene.add(this.camera);

    this.playerRig = buildMinecraftPlayerRig(this.playerSkinConfig);
    this.playerRig.root.visible = false;
    this.scene.add(this.playerRig.root);

    // Authentic Minecraft Pixel Sun, Cratered Moon & Starry Night Sky
    this.sunMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshBasicMaterial({
        map: this.createSunTexture(),
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
      }),
    );
    this.moonMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(19, 19),
      new THREE.MeshBasicMaterial({
        map: this.createMoonTexture(),
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
      }),
    );
    this.starField = this.buildStarField();
    this.scene.add(this.starField, this.sunMesh, this.moonMesh);

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
    window.addEventListener('orientationchange', this.onResizeBound);
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
    // Rebuild 1st-person skin arm inside dedicated depth-cleared handScene
    this.handScene.remove(this.handGroup);
    this.handDispose?.();
    const builtArm = buildFirstPersonSkinArm(config);
    this.handGroup = builtArm.group;
    this.handDispose = builtArm.dispose;
    this.handGroup.visible = this.mode === 'playing' && this.cameraMode === 'first';
    this.handScene.add(this.handGroup);

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

  private heldTexCache = new Map<string, THREE.Texture>();
  private heldItemGeoCache = new Map<string, THREE.BufferGeometry>();

  private createSunTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 16, 16);
    // Soft outer golden glow + crisp square Minecraft sun core
    ctx.fillStyle = 'rgba(255, 224, 122, 0.28)';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = 'rgba(255, 238, 158, 0.65)';
    ctx.fillRect(3, 3, 10, 10);
    ctx.fillStyle = '#fff5bd';
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 5, 6, 6);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  private createMoonTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 16, 16);
    // Soft pale-blue lunar halo + iconic blocky Minecraft full moon with pixel craters
    ctx.fillStyle = 'rgba(186, 214, 255, 0.22)';
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillStyle = '#e5eefc';
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 5, 6, 6);
    // Pixel craters
    ctx.fillStyle = '#b6c5dc';
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillRect(9, 6, 2, 2);
    ctx.fillRect(6, 9, 3, 2);
    ctx.fillStyle = '#9aaac4';
    ctx.fillRect(5, 6, 1, 1);
    ctx.fillRect(10, 7, 1, 1);
    ctx.fillRect(7, 10, 1, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  private buildStarField(): THREE.Points {
    const count = 480;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const radius = 158;
    for (let i = 0; i < count; i++) {
      // Distribute across upper celestial sphere + horizon band
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const bright = 0.65 + Math.random() * 0.35;
      const tint = Math.random();
      col[i * 3] = bright * (tint > 0.8 ? 1.0 : 0.88);
      col[i * 3 + 1] = bright * 0.94;
      col[i * 3 + 2] = bright * (tint < 0.3 ? 1.0 : 0.92);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.85,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.visible = false;
    return pts;
  }

  private getAtlasTileCanvas(texKey: string): HTMLCanvasElement | null {
    if (!this.pack) return null;
    const uv = this.pack.uvMap[texKey] || this.pack.uvMap.stone;
    if (!uv) return null;
    const atlas = this.pack.atlasCanvas;
    const sx = Math.round(uv.u0 * atlas.width);
    const sy = Math.round((1 - uv.v1) * atlas.height);
    const sw = Math.max(1, Math.round((uv.u1 - uv.u0) * atlas.width));
    const sh = Math.max(1, Math.round((uv.v1 - uv.v0) * atlas.height));
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas, sx, sy, sw, sh, 0, 0, 32, 32);
    return c;
  }

  private getAtlasTileTexture(texKey: string): THREE.Texture | null {
    if (!this.pack) return null;
    const cacheKey = `tile:${texKey}`;
    const cached = this.heldTexCache.get(cacheKey);
    if (cached) return cached;

    const c = this.getAtlasTileCanvas(texKey);
    if (!c) return null;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    this.heldTexCache.set(cacheKey, tex);
    return tex;
  }

  private getHeldItemSpriteTexture(itemId: string): THREE.Texture | null {
    if (!this.pack) return null;
    const cacheKey = `item:${itemId}`;
    const cached = this.heldTexCache.get(cacheKey);
    if (cached) return cached;

    const dataUrl = this.pack.itemIcons[itemId];
    if (!dataUrl) return null;
    const img = new Image();
    const tex = new THREE.Texture(img);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    img.onload = () => {
      tex.needsUpdate = true;
    };
    img.src = dataUrl;
    this.heldTexCache.set(cacheKey, tex);
    return tex;
  }

  private applyExtrudedItemGeometry(itemId: string, mesh: THREE.Mesh, fallbackTexKey?: string): void {
    const cached = this.heldItemGeoCache.get(itemId);
    if (cached) {
      mesh.geometry = cached;
      mesh.visible = true;
      return;
    }
    if (!this.pack) return;
    const dataUrl = this.pack.itemIcons[itemId];
    if (dataUrl) {
      mesh.visible = false;
      const img = new Image();
      img.onload = () => {
        if (this.disposed) return;
        const geo = buildExtrudedItemGeometry(img, 32);
        this.heldItemGeoCache.set(itemId, geo);
        // If player is still holding this item, swap geometry in immediately
        const curStack = this.world?.player.inventory[this.world.player.selectedSlot];
        if (curStack?.itemId === itemId) {
          const fpHeldItem = this.handGroup.getObjectByName('fpHeldItem') as THREE.Mesh | undefined;
          if (fpHeldItem) {
            fpHeldItem.geometry = geo;
            fpHeldItem.visible = true;
          }
        }
      };
      img.src = dataUrl;
      return;
    }
    if (fallbackTexKey) {
      const tileCanvas = this.getAtlasTileCanvas(fallbackTexKey);
      if (tileCanvas) {
        const geo = buildExtrudedItemGeometry(tileCanvas, 32);
        this.heldItemGeoCache.set(itemId, geo);
        mesh.geometry = geo;
        mesh.visible = true;
      }
    }
  }

  private getHeldTexture(itemId: string): THREE.Texture | null {
    const def = ITEM_DEFS[itemId];
    if (!def) return null;
    if (def.blockId !== undefined && getBlockShape(def.blockId) === 'cube') {
      const bdef = BLOCK_DEFS[def.blockId];
      return this.getAtlasTileTexture(bdef.textures.front || bdef.textures.side);
    }
    return this.getHeldItemSpriteTexture(itemId);
  }

  private updateFirstPersonHeldVisual(): void {
    if (!this.world) return;
    const stack = this.world.player.inventory[this.world.player.selectedSlot];
    const nextItemKey = stack ? `${this.world.player.selectedSlot}:${stack.itemId}` : `${this.world.player.selectedSlot}:empty`;
    if (nextItemKey !== this.lastHeldItemId) {
      this.lastHeldItemId = nextItemKey;
      this.equipProgress = 0; // Authentic Minecraft slot-switch raise animation
    }

    const fpBareArm = this.handGroup.getObjectByName('fpBareArm');
    const fpHeldBlock = this.handGroup.getObjectByName('fpHeldBlock') as THREE.Mesh | undefined;
    const fpHeldItem = this.handGroup.getObjectByName('fpHeldItem') as THREE.Mesh | undefined;

    if (!stack) {
      if (fpBareArm) fpBareArm.visible = true;
      if (fpHeldBlock) fpHeldBlock.visible = false;
      if (fpHeldItem) fpHeldItem.visible = false;
    } else {
      const def = ITEM_DEFS[stack.itemId];
      const bdef = def?.blockId !== undefined ? BLOCK_DEFS[def.blockId] : undefined;
      const shape = def?.blockId !== undefined ? getBlockShape(def.blockId) : null;
      const is3DBlock = Boolean(
        bdef &&
          (shape === 'cube' ||
            shape === 'slab' ||
            shape === 'stairs' ||
            shape === 'chest' ||
            shape === 'enchanting_table' ||
            shape === 'farmland' ||
            shape === 'cactus'),
      );

      if (fpBareArm) fpBareArm.visible = false;

      if (is3DBlock && bdef && fpHeldBlock) {
        fpHeldBlock.visible = true;
        if (fpHeldItem) fpHeldItem.visible = false;

        // Scale non-full 3D block previews (slabs, chests, enchanting table) accurately in hand!
        if (shape === 'slab') fpHeldBlock.scale.set(1.0, 0.5, 1.0);
        else if (shape === 'enchanting_table') fpHeldBlock.scale.set(1.0, 0.75, 1.0);
        else if (shape === 'chest') fpHeldBlock.scale.set(0.88, 0.88, 0.88);
        else fpHeldBlock.scale.set(1.0, 1.0, 1.0);

        // Apply all 6 authentic block faces (+X, -X, +Y, -Y, +Z, -Z)
        const sideTex = this.getAtlasTileTexture(bdef.textures.side);
        const topTex = this.getAtlasTileTexture(bdef.textures.top);
        const botTex = this.getAtlasTileTexture(bdef.textures.bottom);
        const frontTex = this.getAtlasTileTexture(bdef.textures.front || bdef.textures.side);
        const faceTexes = [sideTex, sideTex, topTex, botTex, frontTex, sideTex];
        const em = getBlockLightEmission(bdef.id);
        const isTrans = Boolean(bdef.transparent);
        const mats = fpHeldBlock.material as THREE.MeshStandardMaterial[];
        for (let i = 0; i < 6; i++) {
          const m = mats[i];
          if (!m) continue;
          m.map = faceTexes[i];
          m.color.setHex(faceTexes[i] ? 0xffffff : 0x8b8b8b);
          m.transparent = isTrans;
          m.alphaTest = isTrans ? 0.35 : 0;
          m.emissive.setRGB(
            em.level >= 10 ? em.r * 0.45 : 0,
            em.level >= 10 ? em.g * 0.45 : 0,
            em.level >= 10 ? em.b * 0.45 : 0,
          );
          m.needsUpdate = true;
        }
      } else if (fpHeldItem) {
        if (fpHeldBlock) fpHeldBlock.visible = false;
        fpHeldItem.visible = true;
        this.applyExtrudedItemGeometry(stack.itemId, fpHeldItem, bdef?.textures.side);

        const mat = fpHeldItem.material as THREE.MeshStandardMaterial;

        // Classify item orientation exactly like Minecraft 1.16 firstperson_righthand models:
        // 1. Diagonal Handheld Weapons/Tools (handle bottom-left -> blade/head top-right)
        //    -> Rz(+64°) then Ry(-71°) puts handle bottom-right and blade/cutting-edge pointing UP & FORWARD!
        const isHandheldDiagonal = Boolean(
          (def?.toolKind && def.toolKind !== 'none') ||
            stack.itemId === 'trident' ||
            stack.itemId === 'fishing_rod' ||
            stack.itemId === 'warped_fungus_on_a_stick' ||
            stack.itemId === 'carrot_on_a_stick' ||
            stack.itemId === 'stick' ||
            stack.itemId === 'blaze_rod' ||
            stack.itemId === 'bone' ||
            stack.itemId === 'spyglass',
        );
        const isBowLike = stack.itemId === 'bow' || stack.itemId === 'crossbow';
        const isLightFixture = shape === 'torch' || shape === 'lantern' || shape === 'end_rod';

        fpHeldItem.rotation.order = 'YXZ';
        if (isHandheldDiagonal) {
          // Authentic Minecraft handheld sword/pickaxe/axe/shovel/hoe pose:
          // Handle tucked bottom-right, blade pointing UP and FORWARD into the world!
          fpHeldItem.position.set(0.50, -0.28, -0.76);
          fpHeldItem.rotation.set(0.02, -1.24, 1.12);
          fpHeldItem.scale.setScalar(0.64);
        } else if (isBowLike) {
          fpHeldItem.position.set(0.48, -0.30, -0.74);
          fpHeldItem.rotation.set(0.05, -0.82, 0.24);
          fpHeldItem.scale.setScalar(0.56);
        } else if (isLightFixture) {
          // Upright Torch / Soul Torch / Lantern / End Rod
          fpHeldItem.position.set(0.48, -0.30, -0.72);
          fpHeldItem.rotation.set(0.06, -0.42, 0.03);
          fpHeldItem.scale.setScalar(0.52);
        } else {
          // Standard Minecraft generated items (food, potions, flint & steel, buckets, pearls, ingots...)
          fpHeldItem.position.set(0.48, -0.34, -0.74);
          fpHeldItem.rotation.set(0.06, -0.44, 0.04);
          fpHeldItem.scale.setScalar(0.50);
        }

        const em = bdef ? getBlockLightEmission(bdef.id) : null;
        const glow = (em && em.level >= 8) || stack.itemId === 'lava_bucket' || stack.itemId === 'blaze_rod';
        if (glow) {
          const gr = em && em.level >= 8 ? em.r : 1.0;
          const gg = em && em.level >= 8 ? em.g : 0.82;
          const gb = em && em.level >= 8 ? em.b : 0.45;
          mat.emissive.setRGB(gr * 0.42, gg * 0.42, gb * 0.42);
        } else {
          mat.emissive.setRGB(0, 0, 0);
        }
        mat.needsUpdate = true;
      }
    }

    // Also update 3rd-person playerRig held mesh
    const tpHeld = this.playerRig?.heldSlotGroup.getObjectByName('playerHeldMesh') as THREE.Mesh | undefined;
    if (tpHeld) {
      if (!stack) {
        tpHeld.visible = false;
      } else {
        tpHeld.visible = true;
        const def = ITEM_DEFS[stack.itemId];
        const mat = tpHeld.material as THREE.MeshStandardMaterial;
        const tex = this.getHeldTexture(stack.itemId);
        const isCube = def?.blockId !== undefined && getBlockShape(def.blockId) === 'cube';
        tpHeld.scale.set(isCube ? 1.0 : 1.15, isCube ? 1.0 : 1.15, isCube ? 1.0 : 0.14);
        mat.map = tex;
        mat.color.setHex(tex ? 0xffffff : 0xd4d8dc);
        mat.transparent = !isCube || Boolean(def?.blockId && BLOCK_DEFS[def.blockId]?.transparent);
        mat.alphaTest = mat.transparent ? 0.4 : 0;
        mat.needsUpdate = true;
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

    // Decorative Piglin & Strider in panorama (rebuilt automatically with active resource pack entity textures)
    g.add(this.panoramaMobsGroup);
    this.rebuildPanoramaMobs();
  }

  private rebuildPanoramaMobs(): void {
    while (this.panoramaMobsGroup.children.length > 0) {
      const child = this.panoramaMobsGroup.children[0];
      this.panoramaMobsGroup.remove(child);
      if (child instanceof THREE.Group) disposeMobMesh(child);
    }
    const entityTex = this.pack?.entityTextures;
    const piglin = buildMobMesh('piglin', entityTex).group;
    piglin.position.set(2.5, 0.2, -1.6);
    piglin.rotation.y = -0.8;
    this.panoramaMobsGroup.add(piglin);

    const strider = buildMobMesh('strider', entityTex).group;
    strider.position.set(3.2, 0.2, 2.2);
    strider.rotation.y = -2.2;
    this.panoramaMobsGroup.add(strider);
  }

  public setResourcePack(pack: CompiledResourcePack): void {
    this.pack = pack;
    for (const tex of this.heldTexCache.values()) tex.dispose();
    this.heldTexCache.clear();
    for (const geo of this.heldItemGeoCache.values()) geo.dispose();
    this.heldItemGeoCache.clear();
    this.lastHeldItemId = '';
    pack.atlasTexture.needsUpdate = true;
    this.opaqueMat.map = pack.atlasTexture;
    this.opaqueMat.needsUpdate = true;
    this.transMat.map = pack.atlasTexture;
    this.transMat.needsUpdate = true;
    this.emissiveMat.map = pack.atlasTexture;
    this.emissiveMat.needsUpdate = true;
    // Rebuild all loaded chunks to display newly downloaded/swapped textures immediately
    for (const entry of this.chunks.values()) {
      for (let s = 0; s < SUBCHUNK_COUNT; s++) {
        if (entry.col.sections[s]) entry.col.dirtySections[s] = true;
      }
    }
    // Hot-swap textures on panorama mobs & all active spawned mobs immediately
    this.rebuildPanoramaMobs();
    for (const mob of this.mobs) {
      const oldMesh = mob.mesh;
      const { group, limbs } = buildMobMesh(mob.type, pack.entityTextures);
      group.position.copy(oldMesh.position);
      group.rotation.y = mob.yaw;
      group.scale.copy(oldMesh.scale);
      this.worldGroup.remove(oldMesh);
      disposeMobMesh(oldMesh);
      this.worldGroup.add(group);
      mob.mesh = group;
      mob.limbs = limbs;
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
    this.starField.visible = false;
    this.borderWalls.forEach((w) => (w.visible = false));
    soundEngine.stopMusic();
    this.exitPointerLock();
  }

  public loadWorld(world: WorldSave): void {
    this.clearWorldScene();
    this.world = migrateWorldSave(structuredClone(world));
    this.activeChestKey = null;
    this.activeBrewingKey = null;
    this.activeTradingMobId = null;
    this.raidState = null;
    this.advancementToast = null;
    this.activeBeacon = null;
    this.beaconTick = 0;
    this.generator = new WorldGenerator(this.world.seed);
    this.mode = 'playing';
    this.paused = false;
    soundEngine.preloadCoreSounds();
    soundEngine.setDimensionMusic(this.world.dimension);
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
    if (!active) this.touchScreenBreakPos = null;
    if (active) this.tryAttackMob();
  }

  private getScreenRayDirection(clientX: number, clientY: number): THREE.Vector3 {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    this.screenRaycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    return this.screenRaycaster.ray.direction.clone().normalize();
  }

  public setTouchScreenBreak(active: boolean, clientX?: number, clientY?: number): void {
    if (!active || clientX === undefined || clientY === undefined) {
      this.touchBreak = false;
      this.touchScreenBreakPos = null;
      this.miningProgress = 0;
      this.miningKey = '';
      this.crackMesh.visible = false;
      this.emitHud();
      return;
    }
    const wasBreaking = this.touchBreak;
    this.touchBreak = true;
    this.touchScreenBreakPos = { x: clientX, y: clientY };
    const dir = this.getScreenRayDirection(clientX, clientY);
    const hit = this.raycastVoxelAlong(dir);
    if (hit) {
      this.targetBlock = hit;
      this.positionHighlightBox(hit);
    }
    if (!wasBreaking) {
      this.tryAttackMob(dir);
    }
  }

  public triggerTouchScreenTap(clientX: number, clientY: number): void {
    if (this.mode !== 'playing' || this.paused) return;
    const dir = this.getScreenRayDirection(clientX, clientY);
    if (this.tryAttackMob(dir)) return;
    const hit = this.raycastVoxelAlong(dir);
    if (hit) {
      this.targetBlock = hit;
      this.positionHighlightBox(hit);
    }
    this.performRightClickAction();
  }

  public triggerTouchUseOrPlace(): void {
    if (this.mode !== 'playing' || this.paused) return;
    this.performRightClickAction();
  }

  public spendPlayerLevels(levels: number): void {
    if (!this.world || levels <= 0) return;
    if (this.world.gameMode !== 'creative') {
      this.world.player.level = Math.max(0, this.world.player.level - levels);
    }
    this.unlockPlayerAdvancement('enchant_item');
    this.emitHud();
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
    offhand?: ItemStack | null,
  ): void {
    if (!this.world) return;
    this.world.player.inventory = inventory;
    if (armor) {
      this.world.player.armor = armor;
      if (this.playerRig) updateRigArmorVisuals(this.playerRig, armor);
    }
    if (furnace) this.world.furnace = furnace;
    if (offhand !== undefined) this.world.player.offhand = offhand;
    this.updateFirstPersonHeldVisual();
    this.emitHud();
  }

  public applyChestUpdate(slots: (ItemStack | null)[], isEnderChest = false): void {
    if (!this.world) return;
    if (isEnderChest) {
      this.world.enderChest = slots;
    } else if (this.activeChestKey) {
      if (!this.world.chests) this.world.chests = {};
      this.world.chests[this.activeChestKey] = slots;
    }
    this.emitHud();
  }

  public applyBrewingUpdate(nextState: BrewingStandState): void {
    if (!this.world || !this.activeBrewingKey) return;
    if (!this.world.brewingStands) this.world.brewingStands = {};
    this.world.brewingStands[this.activeBrewingKey] = nextState;
    this.emitHud();
  }

  public executeActiveVillagerTrade(offerId: string): void {
    if (!this.world || !this.activeTradingMobId) return;
    const villager = this.mobs.find((m) => m.id === this.activeTradingMobId && m.type === 'villager');
    if (!villager || !villager.tradeOffers || !villager.profession) return;
    const idx = villager.tradeOffers.findIndex((o) => o.id === offerId);
    if (idx === -1) return;

    const hasHero = this.getEffectLevel('hero_of_the_village') > 0;
    const effectiveOffer = hasHero
      ? applyHeroOfTheVillageDiscount([villager.tradeOffers[idx]], true)[0]
      : villager.tradeOffers[idx];

    const res = executeVillagerTrade(
      this.world.player.inventory,
      effectiveOffer,
      villager.tradeXp ?? 0,
      villager.tradeLevel ?? 1,
    );
    if (!res.ok) {
      this.showItemToast(res.error || 'Không thể giao dịch!');
      this.emitHud();
      return;
    }

    this.world.player.inventory = res.inventory;
    villager.tradeOffers[idx] = { ...villager.tradeOffers[idx], uses: res.offer.uses };
    villager.tradeXp = res.villagerXp;
    if (res.leveledUp) {
      villager.tradeLevel = res.villagerLevel;
      const expanded = generateVillagerOffers(
        villager.profession,
        villager.tradeSeed ?? 1,
        villager.tradeLevel,
      );
      // Preserve existing uses for previously unlocked offers
      const prevById = new Map(villager.tradeOffers.map((o) => [o.id, o]));
      villager.tradeOffers = expanded.map((o) => prevById.get(o.id) ?? o);
      soundEngine.playLevelUp();
      this.showItemToast(`Dân Làng thăng cấp ${villager.tradeLevel}! Mở khóa thêm hàng mới!`);
    } else {
      soundEngine.playXpOrb();
      this.showItemToast(`Giao dịch thành công với ${VILLAGER_PROFESSION_LABELS[villager.profession]}!`);
    }
    this.grantPlayerXp(3);
    this.unlockPlayerAdvancement('trade_villager');
    this.updateFirstPersonHeldVisual();
    this.emitHud();
  }

  public swapOffhand(): void {
    if (!this.world || this.paused) return;
    const slot = this.world.player.selectedSlot;
    const main = this.world.player.inventory[slot];
    const off = this.world.player.offhand ?? null;
    this.world.player.inventory[slot] = off;
    this.world.player.offhand = main;
    soundEngine.playClick();
    this.showItemToast(
      this.world.player.offhand
        ? `Tay trái: ${ITEM_DEFS[this.world.player.offhand.itemId]?.nameVi || this.world.player.offhand.itemId}`
        : 'Đã đổi tay trái (F)',
    );
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
      switchDimension: (dim: DimensionId) => {
        if (dim === 'end') {
          this.switchDimension('end', 0.5, 64, 12.5, false);
        } else if (dim === 'nether') {
          this.switchDimension('nether', Math.floor(this.px / 8) + 0.5, null, Math.floor(this.pz / 8) + 0.5, true);
        } else {
          const [sx, sy, sz] = this.world?.player.worldSpawn || [2.5, 72, 2.5];
          this.switchDimension('overworld', sx, sy, sz, false);
        }
      },
      startRaid: () => this.startVillageRaid(),
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
      const mods = this.getDimensionMods(this.world.dimension);
      mods[`${wx},${wy},${wz}`] = blockId;
    }

    const entry = this.chunks.get(this.chunkKey(cx, cz));
    if (entry) {
      const prevId = getChunkBlock(entry.col, lx, wy, lz);
      const lightChanged =
        getBlockLightEmission(prevId).level > 0 || getBlockLightEmission(blockId).level > 0;

      setChunkBlock(entry.col, lx, wy, lz, blockId);
      const sy = wy >> 4;
      entry.col.dirtySections[sy] = true;
      if (((wy & 15) === 0 || (lightChanged && (wy & 15) <= 6)) && sy > 0) {
        entry.col.dirtySections[sy - 1] = true;
      }
      if (((wy & 15) === 15 || (lightChanged && (wy & 15) >= 10)) && sy < SUBCHUNK_COUNT - 1) {
        entry.col.dirtySections[sy + 1] = true;
      }

      // Mark adjacent chunk borders dirty (expanded 6-block margin when placing/breaking lights)
      const borderMargin = lightChanged ? 6 : 0;
      const markNeighbor = (ncx: number, ncz: number) => {
        const nb = this.chunks.get(this.chunkKey(ncx, ncz));
        if (!nb) return;
        nb.col.dirtySections[sy] = true;
        if (lightChanged && sy > 0) nb.col.dirtySections[sy - 1] = true;
        if (lightChanged && sy < SUBCHUNK_COUNT - 1) nb.col.dirtySections[sy + 1] = true;
      };
      if (lx <= borderMargin) markNeighbor(cx - 1, cz);
      if (lx >= CHUNK_SIZE - 1 - borderMargin) markNeighbor(cx + 1, cz);
      if (lz <= borderMargin) markNeighbor(cx, cz - 1);
      if (lz >= CHUNK_SIZE - 1 - borderMargin) markNeighbor(cx, cz + 1);
      if (lightChanged) {
        this.dynamicLightTick = 99; // Snap real-time PointLights immediately
      }
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
      this.dynamicLightTick = 99;
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

    // Generate missing chunks near player (spiral order, budgeted per frame to prevent stutter)
    const mods = this.getDimensionMods(this.world.dimension);
    let genBudget = immediateAll ? 24 : 1;
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
              emissiveMeshes: new Array(SUBCHUNK_COUNT).fill(null),
            });
            // Mark already-loaded neighbor chunks dirty so chunk-edge seam walls are seamlessly re-culled
            for (const [ndx, ndz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nb = this.chunks.get(this.chunkKey(cx + ndx, cz + ndz));
              if (nb) {
                for (let s = 0; s < SUBCHUNK_COUNT; s++) {
                  if (nb.col.sections[s]) nb.col.dirtySections[s] = true;
                }
              }
            }
            genBudget--;
          }
        }
      }
    }

    // Rebuild dirty sub-chunk meshes (budgeted per frame to keep 60fps smooth)
    if (!this.pack) return;
    let meshBudget = immediateAll ? 32 : 3;
    const fancyLeaves = this.settings.graphics === 'fancy';
    const smoothAO = this.settings.smoothLighting;
    const castShadows = !this.isSoftwareGl && this.settings.shadows;
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
        if (entry.emissiveMeshes[sy]) {
          entry.group.remove(entry.emissiveMeshes[sy]!);
          entry.emissiveMeshes[sy]!.geometry.dispose();
          entry.emissiveMeshes[sy] = null;
        }

        const built = buildSubChunkGeometry(entry.col, sy, getter, this.pack.uvMap, smoothAO, fancyLeaves);
        if (built.opaque) {
          const m = new THREE.Mesh(built.opaque, this.opaqueMat);
          m.castShadow = castShadows;
          m.receiveShadow = castShadows;
          m.updateMatrix();
          m.matrixAutoUpdate = false;
          entry.group.add(m);
          entry.opaqueMeshes[sy] = m;
        }
        if (built.translucent) {
          const m = new THREE.Mesh(built.translucent, this.transMat);
          m.renderOrder = 2;
          m.updateMatrix();
          m.matrixAutoUpdate = false;
          entry.group.add(m);
          entry.transMeshes[sy] = m;
        }
        if (built.emissive) {
          const m = new THREE.Mesh(built.emissive, this.emissiveMat);
          m.renderOrder = 1;
          m.updateMatrix();
          m.matrixAutoUpdate = false;
          entry.group.add(m);
          entry.emissiveMeshes[sy] = m;
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
      if (entry.emissiveMeshes[s]) {
        entry.group.remove(entry.emissiveMeshes[s]!);
        entry.emissiveMeshes[s]!.geometry.dispose();
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
    this.mountedMobId = null;
    for (const p of this.particles) {
      this.worldGroup.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
    for (const pr of this.projectiles) {
      this.worldGroup.remove(pr.mesh);
      (pr.mesh.material as THREE.Material).dispose();
    }
    this.projectiles = [];
    for (const pl of this.dynamicLights) {
      pl.visible = false;
      pl.intensity = 0;
    }
    this.heldPointLight.visible = false;
    this.heldPointLight.intensity = 0;
    this.dynamicLightTick = 99;
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

  private getDimensionMods(dim: DimensionId): Record<string, number> {
    if (!this.world) return {};
    if (dim === 'overworld') return this.world.overworldMods;
    if (dim === 'nether') return this.world.netherMods;
    if (!this.world.endMods) this.world.endMods = {};
    return this.world.endMods;
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

    const safeY =
      destY !== null
        ? destY
        : targetDim === 'end'
          ? Math.max(62, this.findSafeGroundY(Math.floor(destX), Math.floor(destZ)))
          : this.findSafeGroundY(Math.floor(destX), Math.floor(destZ));
    this.py = safeY + 0.1;
    this.fallPeakY = this.py;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.portalProgress = 0;
    this.portalCooldown = 4.0;

    if (buildReturnPortal && targetDim !== 'end') {
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

    if (targetDim === 'end') {
      soundEngine.playEndPortal();
      soundEngine.playDragonRoar();
      this.unlockPlayerAdvancement('enter_end');
    } else {
      soundEngine.playPortal();
      if (targetDim === 'nether') {
        this.unlockPlayerAdvancement('enter_nether');
      }
    }
    soundEngine.setDimensionMusic(targetDim);
    this.spawnInitialMobs();
    this.callbacks.onTitleBanner(
      'title',
      targetDim === 'end' ? 'THE END' : targetDim === 'nether' ? 'THE NETHER' : 'OVERWORLD',
    );
    this.callbacks.onTitleBanner(
      'subtitle',
      targetDim === 'end'
        ? 'Đảo Trung Tâm · 8 Trụ Hắc Diện Thạch · Rồng Ender đang tuần tra!'
        : targetDim === 'nether'
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

    // Shield block while holding Shield (mainhand OR offhand!) and sneaking
    const held = this.world.player.inventory[this.world.player.selectedSlot];
    const offhand = this.world.player.offhand ?? null;
    const sneaking = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak;
    if (!isFire && rawAmount < 100 && (held?.itemId === 'shield' || offhand?.itemId === 'shield') && sneaking) {
      soundEngine.playShieldBlock();
      this.hurtImmunity = 0.4;
      this.showItemToast('Khiên đã đỡ đòn!');
      return;
    }

    const armor = this.getArmorDefense();
    const resLvl = this.getEffectLevel('resistance');
    let extraReduce = 0;
    if (isFire) {
      const fp = this.world.player.armor.reduce((s, a) => s + (a?.enchants?.fire_protection || 0), 0);
      extraReduce += Math.min(0.6, fp * 0.08);
    }
    if (reason.toLowerCase().includes('rơi')) {
      const ff = this.world.player.armor[3]?.enchants?.feather_falling || 0;
      extraReduce += Math.min(0.65, ff * 0.14);
    }
    const reduction = Math.min(0.86, armor * 0.032 + resLvl * 0.16 + extraReduce);
    const dmg = rawAmount >= 100 ? rawAmount : Math.max(1, Math.round(rawAmount * (1 - reduction)));

    // Thorns enchantment reflects damage to nearest attacking mob
    const thornsLv = this.world.player.armor.reduce((s, a) => s + (a?.enchants?.thorns || 0), 0);
    if (thornsLv > 0 && !isFire && rawAmount < 100) {
      const attacker = this.mobs.find(
        (m) => m.hostile && Math.hypot(m.x - this.px, m.y - this.py, m.z - this.pz) < 4.0,
      );
      if (attacker) {
        this.damageMobDirect(attacker, Math.min(6, thornsLv * 1.5), 0, 0);
      }
    }

    this.world.player.hp = Math.max(0, this.world.player.hp - dmg);
    this.damageFlash = 1.0;
    this.cameraShake = 0.22;
    this.hurtImmunity = 0.45;
    this.hitstopTimer = 0.04;
    soundEngine.playHurt();

    if (this.world.player.hp <= 0) {
      // Totem of Undying saves the player from death (Offhand OR Hotbar)!
      const offhandTotem = this.world.player.offhand?.itemId === 'totem_of_undying';
      const totemSlot = offhandTotem
        ? -2
        : this.world.player.inventory.findIndex(
            (st, idx) => idx < 9 && st?.itemId === 'totem_of_undying',
          );
      if (offhandTotem || totemSlot >= 0) {
        if (offhandTotem && this.world.player.offhand) {
          this.world.player.offhand.count -= 1;
          if (this.world.player.offhand.count <= 0) this.world.player.offhand = null;
        } else if (totemSlot >= 0) {
          const st = this.world.player.inventory[totemSlot]!;
          st.count -= 1;
          if (st.count <= 0) this.world.player.inventory[totemSlot] = null;
        }
        this.world.player.hp = 8;
        this.world.player.effects = [
          ...this.world.player.effects.filter((e) => e.id !== 'regeneration' && e.id !== 'fire_resistance'),
          { id: 'regeneration', amplifier: 1, remainingSec: 20 },
          { id: 'fire_resistance', amplifier: 0, remainingSec: 30 },
        ];
        soundEngine.playTotem();
        this.unlockPlayerAdvancement('evoker_totem');
        this.heldItemToast = 'Vật Tổ Bất Tử đã cứu bạn!';
        this.heldItemToastAt = performance.now();
        this.callbacks.onChatMessage('Vật Tổ Bất Tử đã kích hoạt và cứu sống bạn!', 'gold');
        this.updateFirstPersonHeldVisual();
        this.emitHud();
        return;
      }

      if (!this.world.gamerules.keepInventory) {
        this.world.player.inventory = new Array(36).fill(null);
        this.world.player.offhand = null;
      }
      this.exitPointerLock();
      this.callbacks.onChatMessage(`Người chơi đã bị hạ gục (${reason}).`, 'error');
    }
    this.emitHud();
  }

  private unlockPlayerAdvancement(id: string): void {
    if (!this.world) return;
    const res = unlockAdvancement(this.world.advancements, id);
    if (!res.newlyUnlocked || !res.def) return;
    this.world.advancements = res.nextMap;
    this.advancementToast = {
      id: res.def.id,
      titleVi: res.def.titleVi,
      descVi: res.def.descVi,
      iconColor: res.def.iconColor,
      at: performance.now(),
    };
    this.grantPlayerXp(res.def.xpReward);
    soundEngine.playLevelUp();
    this.callbacks.onChatMessage(
      `★ Thành tựu mở khóa: [${res.def.titleVi}] (+${res.def.xpReward} XP)`,
      'gold',
    );
  }

  public startVillageRaid(): void {
    if (!this.world) return;
    if (this.world.difficulty === 'peaceful') {
      this.callbacks.onChatMessage('Không thể bắt đầu Đột Kích ở độ khó Hòa Bình (Peaceful)!', 'error');
      return;
    }
    this.raidState = createRaid(3);
    this.spawnRaidWave(getRaidWaveMobTypes(1));
    soundEngine.playNoteBlockSound(4, 'trumpet');
    this.callbacks.onTitleBanner('title', 'ĐỘT KÍCH LÀNG!');
    this.callbacks.onTitleBanner('subtitle', 'Đợt 1/3 — Hãy bảo vệ Dân Làng khỏi Kẻ Cướp (Pillager)!');
    this.callbacks.onChatMessage('Tiếng tù và vang lên! Cuộc Đột Kích Làng (3 đợt) đã bắt đầu!', 'gold');
    this.emitHud();
  }

  private spawnRaidWave(types: MobType[]): void {
    for (let i = 0; i < types.length; i++) {
      const ang = (i / Math.max(1, types.length)) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 13 + (i % 3) * 3;
      const mx = this.px + Math.cos(ang) * dist;
      const mz = this.pz + Math.sin(ang) * dist;
      const my = this.findSafeGroundY(Math.floor(mx), Math.floor(mz));
      this.spawnMob(types[i], mx, my, mz, { isRaidMob: true });
    }
  }

  private handleRaidMobDefeated(mob: MobEntity): void {
    if (!mob.isRaidMob || !this.raidState || !this.raidState.active) return;
    const outcome = recordRaidKill(this.raidState);
    this.raidState = outcome.state;
    if (outcome.spawnNextWave && outcome.spawnNextWave.length > 0) {
      this.spawnRaidWave(outcome.spawnNextWave);
      soundEngine.playNoteBlockSound(6, 'trumpet');
      this.callbacks.onTitleBanner('title', `ĐỘT KÍCH — ĐỢT ${this.raidState.wave}/${this.raidState.maxWaves}!`);
      this.callbacks.onTitleBanner('subtitle', 'Quân tiếp viện Pillager & Skeleton đang tiến tới!');
    } else if (outcome.victoryTriggered) {
      this.applyPlayerEffect('hero_of_the_village', 300, 0);
      this.addItemToInventory('emerald', 8);
      this.grantPlayerXp(30);
      this.unlockPlayerAdvancement('win_raid');
      soundEngine.playLevelUp();
      this.callbacks.onTitleBanner('title', 'CHIẾN THẮNG ĐỘT KÍCH!');
      this.callbacks.onTitleBanner('subtitle', 'Hiệu ứng Anh Hùng Của Làng (-30% giá Ngọc Lục Bảo) +8 Ngọc Lục Bảo!');
      this.callbacks.onChatMessage('Chúc mừng! Bạn đã nhận hiệu ứng Anh Hùng Của Làng trong 5 phút!', 'gold');
    }
  }

  // --- Mobs ---
  private spawnInitialMobs(): void {
    if (!this.world || !this.world.gamerules.doMobSpawning) return;
    if (this.world.dimension === 'end') {
      // Spawn the iconic Ender Dragon Boss + Endermen + Shulker on the island!
      this.spawnMob('ender_dragon', 0, 76, -18);
      this.spawnMob('enderman', 10, this.findSafeGroundY(10, 6), 6);
      this.spawnMob('enderman', -10, this.findSafeGroundY(-10, -6), -6);
      this.spawnMob('shulker', 14, this.findSafeGroundY(14, -8), -8);
      return;
    }
    const types: MobType[] =
      this.world.dimension === 'overworld'
        ? ['pig', 'sheep', 'villager', 'villager', 'iron_golem', 'wolf', 'camel', 'allay', 'copper_golem', 'zombie', 'skeleton', 'spider', 'enderman', 'slime', 'creeper']
        : ['piglin', 'strider', 'zombified_piglin', 'wither_skeleton', 'blaze', 'ghast', 'ghastling'];
    for (let i = 0; i < types.length; i++) {
      const ang = (i / types.length) * Math.PI * 2 + 0.5;
      const dist = 11 + (i % 3) * 5;
      const mx = this.px + Math.cos(ang) * dist;
      const mz = this.pz + Math.sin(ang) * dist;
      const spec = MOB_SPECS[types[i]];
      const my = spec.flying ? this.py + 8 : this.findSafeGroundY(Math.floor(mx), Math.floor(mz));
      this.spawnMob(types[i], mx, my, mz);
    }
  }

  private spawnMob(
    type: MobType,
    x: number,
    y: number,
    z: number,
    options?: { isBaby?: boolean; isRaidMob?: boolean },
  ): void {
    if (!this.world) return;
    const spec = MOB_SPECS[type];
    if (spec.hostile && this.world.difficulty === 'peaceful') return;
    const { group, limbs } = buildMobMesh(type, this.pack?.entityTextures);
    if (options?.isBaby) {
      group.scale.setScalar(0.55);
    }
    group.position.set(x - this.originCX * CHUNK_SIZE, y, z - this.originCZ * CHUNK_SIZE);
    this.worldGroup.add(group);
    const seed = Math.abs(Math.floor(x * 73 + z * 139 + this.mobs.length * 31));
    const profession =
      type === 'villager'
        ? VILLAGER_PROFESSIONS[seed % VILLAGER_PROFESSIONS.length]
        : undefined;
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
      isBaby: options?.isBaby,
      isRaidMob: options?.isRaidMob,
      babyAgeSec: 0,
      profession,
      tradeSeed: seed,
      tradeLevel: 1,
      tradeXp: 0,
      tradeOffers: profession ? generateVillagerOffers(profession, seed, 1) : undefined,
      mesh: group,
      limbs,
    });
  }

  private tryAttackMob(customDir?: THREE.Vector3): boolean {
    if (!this.world) return false;
    if (customDir) {
      _camDir.copy(customDir);
    } else {
      this.camera.getWorldDirection(_camDir);
    }
    const held = this.world.player.inventory[this.world.player.selectedSlot];
    const isSpear = Boolean(held?.itemId.endsWith('_spear'));
    const eyeY = this.py + 1.62;
    let hitMob: MobEntity | null = null;
    let bestDist = isSpear ? 5.8 : 4.4;

    for (const mob of this.mobs) {
      const dx = mob.x - this.px;
      const dy = mob.y + MOB_SPECS[mob.type].height * 0.55 - eyeY;
      const dz = mob.z - this.pz;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > bestDist) continue;
      const dot = (dx * _camDir.x + dy * _camDir.y + dz * _camDir.z) / dist;
      if (dot > (isSpear ? 0.87 : 0.89)) {
        bestDist = dist;
        hitMob = mob;
      }
    }
    if (!hitMob) return false;

    const def = held ? ITEM_DEFS[held.itemId] : null;
    let dmg = def?.attackDamage || 2;
    if (held?.enchants?.sharpness) dmg += held.enchants.sharpness * 1.5;
    if (held?.enchants?.smite) {
      const undead = ['zombie', 'skeleton', 'zombified_piglin', 'bogged', 'parched', 'zombie_horse', 'zombie_nautilus', 'camel_husk', 'frostbite'];
      if (undead.includes(hitMob.type)) dmg += held.enchants.smite * 2.5;
    }
    if (held?.enchants?.fire_aspect) {
      dmg += held.enchants.fire_aspect * 2.5;
      this.spawnBreakParticles(hitMob.x, hitMob.y + 1, hitMob.z, 0xf97316, 8);
    }
    dmg += this.getEffectLevel('strength') * 3;

    // Authentic Minecraft 1.21 Mace Smash Attack + Density & Wind Burst enchantments!
    let isMaceSmash = false;
    if (held?.itemId === 'mace' && !this.onGround && (this.vy < -2.0 || this.fallPeakY - this.py > 1.5)) {
      const fallBlocks = Math.max(1.5, this.fallPeakY - this.py);
      const densityBonus = (held.enchants?.density || 0) * 1.4;
      const smashBonus = Math.min(60, Math.round(fallBlocks * (5 + densityBonus)));
      dmg += smashBonus;
      isMaceSmash = true;
      this.fallPeakY = this.py;
      const windBurstLv = held.enchants?.wind_burst || 0;
      this.vy = Math.max(this.vy, windBurstLv > 0 ? 9.5 + windBurstLv * 2.5 : 3.2);
      soundEngine.playMaceSmash();
      if (windBurstLv > 0) soundEngine.playWindBurst();
      this.cameraShake = 0.25;
      this.spawnBreakParticles(hitMob.x, hitMob.y + 0.4, hitMob.z, 0xe0f2fe, 18);
      this.spawnBreakParticles(hitMob.x, hitMob.y + 0.8, hitMob.z, 0xfacc15, 10);
      this.showItemToast(`ĐẬP CHÙY MACE! (+${smashBonus} sát thương)`);
      this.unlockPlayerAdvancement('mace_smash');
      for (const other of this.mobs) {
        if (other === hitMob) continue;
        const odx = other.x - hitMob.x;
        const odz = other.z - hitMob.z;
        const odist = Math.hypot(odx, other.y - hitMob.y, odz);
        if (odist <= 4.2 && odist > 0.01) {
          other.vx += (odx / odist) * 10;
          other.vz += (odz / odist) * 10;
          other.vy = Math.max(other.vy, 7.2);
          other.hurtTimer = 0.25;
        }
      }
    }

    const kbMult = 1 + (held?.enchants?.knockback || 0) * 0.65;
    const inLiquid =
      this.getWorldBlock(Math.floor(this.px), Math.floor(this.py + 0.1), Math.floor(this.pz)) === BLOCK.WATER;
    const sprinting = this.keys.has('ControlLeft');
    const melee = computeJavaMeleeAttack({
      baseDamage: dmg,
      cooldown: this.playerAttackCooldown,
      onGround: this.onGround,
      vy: this.vy,
      sprinting,
      inLiquid,
      itemId: held?.itemId,
      sweepingLevel: held?.enchants?.sharpness ? 1 : 0,
    });
    // Reset Java attack cooldown after swing!
    this.playerAttackCooldown = 0;
    const finalDmg = isMaceSmash ? dmg : melee.damage;
    const isCrit = !isMaceSmash && melee.isCritical;

    hitMob.hp -= finalDmg;
    hitMob.hurtTimer = 0.25;
    hitMob.vy = isMaceSmash ? 8.2 : 5.2 + (held?.enchants?.knockback || 0) * 1.1;
    hitMob.vx += _camDir.x * (isMaceSmash ? 11 : isSpear ? 8.5 : 7) * kbMult;
    hitMob.vz += _camDir.z * (isMaceSmash ? 11 : isSpear ? 8.5 : 7) * kbMult;
    if (hitMob.type === 'zombified_piglin') hitMob.hostile = true;
    // Iconic Enderman short-range teleport when struck while still alive!
    if (hitMob.type === 'enderman' && hitMob.hp > 0 && Math.random() < 0.45) {
      const ang = Math.random() * Math.PI * 2;
      const distTp = 3.5 + Math.random() * 3.0;
      const tx = hitMob.x + Math.cos(ang) * distTp;
      const tz = hitMob.z + Math.sin(ang) * distTp;
      const ty = this.findSafeGroundY(Math.floor(tx), Math.floor(tz));
      this.spawnBreakParticles(hitMob.x, hitMob.y + 1.5, hitMob.z, 0xe879f9, 10);
      hitMob.x = tx;
      hitMob.y = ty;
      hitMob.z = tz;
      soundEngine.playPortal();
      this.spawnBreakParticles(tx, ty + 1.5, tz, 0xe879f9, 10);
    }

    // Sword Sweeping Attack: splash damage to nearby mobs within 2.5m!
    if (melee.isSweep && melee.sweepDamage > 0) {
      for (const other of this.mobs) {
        if (other === hitMob || other.type === 'villager') continue;
        const odist = Math.hypot(other.x - hitMob.x, other.y - hitMob.y, other.z - hitMob.z);
        if (odist <= 2.5) {
          other.hp -= melee.sweepDamage;
          other.hurtTimer = 0.25;
          other.vy = Math.max(other.vy, 3.5);
          this.spawnBreakParticles(other.x, other.y + 0.9, other.z, 0xf8fafc, 5);
        }
      }
    }

    if (isCrit) {
      this.showItemToast(`Đòn Chí Mạng! (${finalDmg.toFixed(1)} sát thương)`);
    }
    this.handSwing = 1.0;
    this.hitstopTimer = isMaceSmash ? 0.07 : isCrit ? 0.045 : 0.03;
    soundEngine.playAttack(isCrit);
    soundEngine.playHurt();
    this.spawnBreakParticles(
      hitMob.x,
      hitMob.y + 1,
      hitMob.z,
      isMaceSmash || isCrit ? 0xfacc15 : 0xef4444,
      isMaceSmash ? 12 : isCrit ? 10 : 6,
    );

    if (hitMob.hp <= 0) {
      const spec = MOB_SPECS[hitMob.type];
      if (this.mountedMobId === hitMob.id) this.mountedMobId = null;
      const lootingBonus = held?.enchants?.looting ? Math.floor(Math.random() * (held.enchants.looting + 1)) : 0;
      const totalDrops = spec.dropCount + lootingBonus;
      this.addItemToInventory(spec.drop, totalDrops);
      if (hitMob.type === 'ender_dragon') {
        this.addItemToInventory('dragon_breath', 4);
        this.addItemToInventory('dragon_head', 1);
        this.grantPlayerXp(120);
        this.unlockPlayerAdvancement('slay_dragon');
        soundEngine.playDragonDeath();
        this.callbacks.onTitleBanner('title', 'CHIẾN THẮNG! ĐÃ HẠ RỒNG ENDER!');
        this.callbacks.onTitleBanner('subtitle', 'Nhận Trứng Rồng, Đầu Rồng & Hơi Thở Rồng! Bước vào cổng giữa đảo để về nhà.');
      } else if (hitMob.type === 'wither') {
        this.grantPlayerXp(60);
        this.unlockPlayerAdvancement('summon_wither');
        soundEngine.playLevelUp();
        this.callbacks.onTitleBanner('title', 'ĐÃ TIÊU DIỆT BOSS WITHER!');
        this.callbacks.onTitleBanner('subtitle', 'Nhận Ngôi Sao Địa Ngục (Nether Star) để chế tạo Đèn Hiệu Beacon!');
      } else if (hitMob.type === 'evoker') {
        this.grantPlayerXp(15);
        this.unlockPlayerAdvancement('evoker_totem');
      } else if (hitMob.type === 'sulfur_cube') {
        this.addItemToInventory('cinnabar_gem', 1);
      }
      this.grantPlayerXp(hitMob.type === 'warden' ? 25 : 4);
      this.worldGroup.remove(hitMob.mesh);
      disposeMobMesh(hitMob.mesh);
      this.mobs = this.mobs.filter((m) => m !== hitMob);
      this.handleRaidMobDefeated(hitMob);
      this.callbacks.onChatMessage(`Đã hạ ${spec.nameVi} (+${totalDrops} ${ITEM_DEFS[spec.drop]?.nameVi || spec.drop})`, 'system');
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
        this.unlockPlayerAdvancement('piglin_barter');
        this.emitHud();
        return true;
      }
    }
    return false;
  }

  // --- DDA Voxel Raycast (supports both Crosshair & Touch-Anywhere screen coordinates) ---
  private positionHighlightBox(tb: TargetBlockInfo): void {
    const [minX, minY, minZ, maxX, maxY, maxZ] = getBlockSelectionBounds(tb.blockId);
    this.highlightBox.scale.set(maxX - minX, maxY - minY, maxZ - minZ);
    this.highlightBox.position.set(
      tb.x - this.originCX * CHUNK_SIZE + (minX + maxX) * 0.5,
      tb.y + (minY + maxY) * 0.5,
      tb.z - this.originCZ * CHUNK_SIZE + (minZ + maxZ) * 0.5,
    );
    this.highlightBox.visible = true;
  }

  private raycastVoxelAlong(dir: THREE.Vector3): TargetBlockInfo | null {
    const ox = this.px;
    const oy = this.py + 1.62;
    const oz = this.pz;
    const maxDist = 5.6;
    const step = 0.05;

    let prevX = Math.floor(ox);
    let prevY = Math.floor(oy);
    let prevZ = Math.floor(oz);

    for (let d = 0.1; d <= maxDist; d += step) {
      const rx = ox + dir.x * d;
      const ry = oy + dir.y * d;
      const rz = oz + dir.z * d;
      const bx = Math.floor(rx);
      const by = Math.floor(ry);
      const bz = Math.floor(rz);

      if (bx !== prevX || by !== prevY || bz !== prevZ) {
        const id = this.getWorldBlock(bx, by, bz);
        if (id !== BLOCK.AIR && !isBlockLiquid(id)) {
          const def = BLOCK_DEFS[id];
          return {
            x: bx,
            y: by,
            z: bz,
            blockId: id,
            name: def?.nameVi || 'Khối',
            face: [prevX - bx, prevY - by, prevZ - bz],
          };
        }
        prevX = bx;
        prevY = by;
        prevZ = bz;
      }
    }
    return null;
  }

  private updateTargetBlock(): void {
    if (this.mode !== 'playing' || !this.world) {
      this.targetBlock = null;
      this.highlightBox.visible = false;
      return;
    }
    let dir: THREE.Vector3;
    if (this.touchBreak && this.touchScreenBreakPos) {
      dir = this.getScreenRayDirection(this.touchScreenBreakPos.x, this.touchScreenBreakPos.y);
    } else {
      this.camera.getWorldDirection(_camDir);
      dir = _camDir;
    }
    const hit = this.raycastVoxelAlong(dir);
    if (hit) {
      this.targetBlock = hit;
      this.positionHighlightBox(hit);
    } else {
      this.targetBlock = null;
      this.highlightBox.visible = false;
    }
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

    if (this.world.gameMode === 'survival' && (def.dropItem || BLOCK_DEFS[tb.blockId]?.key)) {
      const held = this.world.player.inventory[this.world.player.selectedSlot];
      const itemDef = held ? ITEM_DEFS[held.itemId] : null;
      const tier = itemDef?.toolKind === def.tool ? itemDef.toolTier || 0 : 0;
      const hasSilk = Boolean(held?.enchants?.silk_touch);
      if (def.key === 'shulker_box') {
        // Authentic Java Shulker Box: breaking preserves all 27 slots inside the carried item!
        const sKey = `${this.world.dimension}:${tb.x},${tb.y},${tb.z}`;
        const storedSlots = this.world.chests?.[sKey];
        const packed = packShulkerBoxItem(storedSlots);
        if (this.world.chests && storedSlots) {
          delete this.world.chests[sKey];
        }
        const emptyIdx = this.world.player.inventory.findIndex((s) => !s);
        if (emptyIdx >= 0) {
          this.world.player.inventory[emptyIdx] = packed;
        } else {
          this.addItemToInventory('shulker_box', 1);
        }
        this.unlockPlayerAdvancement('shulker_box_pack');
      } else if (!def.minTier || tier >= def.minTier || hasSilk) {
        if (hasSilk && ITEM_DEFS[def.key]) {
          this.addItemToInventory(def.key, 1);
        } else if (def.dropItem) {
          const fortuneBonus =
            held?.enchants?.fortune && (def.category === 'ores' || def.key === 'gravel')
              ? Math.floor(Math.random() * (held.enchants.fortune + 1))
              : 0;
          this.addItemToInventory(def.dropItem, (def.dropCount || 1) + fortuneBonus);
          if (def.category === 'ores') {
            this.grantPlayerXp(3);
          }
        }
      }
      // Durability wear with Unbreaking enchantment
      if (held && itemDef?.maxDurability) {
        const unbreaking = held.enchants?.unbreaking || 0;
        if (Math.random() < 1 / (unbreaking + 1)) {
          const curDur = held.durability ?? itemDef.maxDurability;
          if (curDur <= 1) {
            this.world.player.inventory[this.world.player.selectedSlot] = null;
            soundEngine.playAnvil();
            this.showItemToast(`${itemDef.nameVi} đã bị hỏng!`);
            this.updateFirstPersonHeldVisual();
          } else {
            held.durability = curDur - 1;
          }
        }
      }
    }
    // Advancement hooks for mining milestones
    if (def.key.endsWith('_log') || def.key.endsWith('_stem')) {
      this.unlockPlayerAdvancement('mine_wood');
      if (def.key === 'poplar_log') this.unlockPlayerAdvancement('wilderness_263');
    } else if (def.key === 'iron_ore' || def.key === 'deepslate_iron_ore') {
      this.unlockPlayerAdvancement('mine_iron');
    } else if (def.key === 'diamond_ore' || def.key === 'deepslate_diamond_ore') {
      this.unlockPlayerAdvancement('mine_diamond');
    }
    // Observer pulse on adjacent block break
    triggerObserverPulse(this.createRedstoneAccessor(), tb.x, tb.y, tb.z);
    // Wave 11: Gravity blocks above collapse & adjacent Water/Lava flows into vacated block (Cobblestone Generator!)
    const blockIO = this.createWorldBlockIO();
    settleFallingBlocks(blockIO, tb.x, tb.y + 1, tb.z);
    const fluidRes = stepFluidSpread(blockIO, tb.x, tb.y, tb.z);
    if (fluidRes.createdCobblestone > 0) {
      soundEngine.playSplash();
    }
    this.emitHud();
  }

  private grantPlayerXp(points: number): void {
    if (!this.world || points <= 0) return;
    // Mending enchantment automatically repairs damaged held/equipped gear on XP pickup!
    const repairable: (ItemStack | null)[] = [
      this.world.player.inventory[this.world.player.selectedSlot],
      this.world.player.offhand ?? null,
      ...this.world.player.armor,
    ];
    for (const st of repairable) {
      if (!st?.enchants?.mending) continue;
      const maxD = ITEM_DEFS[st.itemId]?.maxDurability;
      if (maxD && st.durability !== undefined && st.durability < maxD) {
        st.durability = Math.min(maxD, st.durability + points * 3);
      }
    }
    const prevLevel = this.world.player.level;
    const total = this.world.player.level * 10 + this.world.player.xp * 10 + points;
    this.world.player.level = Math.floor(total / 10);
    this.world.player.xp = (total % 10) / 10;
    soundEngine.playXpOrb();
    if (this.world.player.level > prevLevel) {
      soundEngine.playLevelUp();
    }
    this.emitHud();
  }

  private applyPlayerEffect(id: EffectId, durationSec: number, amplifier = 0): void {
    if (!this.world) return;
    const idx = this.world.player.effects.findIndex((e) => e.id === id);
    const nextEff: ActiveEffect = { id, amplifier, remainingSec: durationSec };
    if (idx >= 0) this.world.player.effects[idx] = nextEff;
    else this.world.player.effects.push(nextEff);
  }

  private showItemToast(msg: string): void {
    this.heldItemToast = msg;
    this.heldItemToastAt = performance.now();
  }

  private consumeHeldItem(replaceWithId?: string): void {
    if (!this.world || this.world.gameMode !== 'survival') return;
    const slot = this.world.player.selectedSlot;
    const held = this.world.player.inventory[slot];
    if (!held) return;
    if (held.count > 1) {
      held.count -= 1;
      if (replaceWithId) this.addItemToInventory(replaceWithId, 1);
    } else {
      this.world.player.inventory[slot] = replaceWithId ? { itemId: replaceWithId, count: 1 } : null;
    }
    this.updateFirstPersonHeldVisual();
  }

  private damageMobDirect(mob: MobEntity, dmg: number, knockX: number, knockZ: number): void {
    if (!this.world) return;
    mob.hp -= dmg;
    mob.hurtTimer = 0.25;
    mob.vy = Math.max(mob.vy, 4.8);
    mob.vx += knockX;
    mob.vz += knockZ;
    if (mob.type === 'zombified_piglin') mob.hostile = true;
    soundEngine.playHurt();
    this.spawnBreakParticles(mob.x, mob.y + 1, mob.z, 0xef4444, 6);
    if (mob.hp <= 0) {
      const spec = MOB_SPECS[mob.type];
      this.addItemToInventory(spec.drop, spec.dropCount);
      this.grantPlayerXp(4);
      this.worldGroup.remove(mob.mesh);
      disposeMobMesh(mob.mesh);
      this.mobs = this.mobs.filter((m) => m !== mob);
      this.callbacks.onChatMessage(
        `Đã hạ ${spec.nameVi} (+${spec.dropCount} ${ITEM_DEFS[spec.drop]?.nameVi || spec.drop})`,
        'system',
      );
      this.emitHud();
    }
  }

  private findSafeTeleportY(wx: number, wy: number, wz: number): number {
    const bx = Math.floor(wx);
    const bz = Math.floor(wz);
    const startY = Math.max(2, Math.min(WORLD_HEIGHT_MAX - 4, Math.floor(wy)));
    for (let dy = 0; dy <= 14; dy++) {
      const cy = startY + dy;
      if (cy >= WORLD_HEIGHT_MAX - 2) break;
      const b0 = this.getWorldBlock(bx, cy, bz);
      const b1 = this.getWorldBlock(bx, cy + 1, bz);
      if (!isBlockSolid(b0) && !isBlockSolid(b1)) {
        return cy + 0.05;
      }
    }
    return this.findSafeGroundY(bx, bz);
  }

  private detonateExplosion(cx: number, cy: number, cz: number, radius: number, colorHex: number, mobDamage: number): void {
    soundEngine.playExplosion();
    this.cameraShake = Math.max(this.cameraShake, 0.35);
    const bx = Math.floor(cx);
    const by = Math.floor(cy);
    const bz = Math.floor(cz);
    const r2 = radius * radius + 1;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx * dx + dy * dy + dz * dz <= r2) {
            const bid = this.getWorldBlock(bx + dx, by + dy, bz + dz);
            if (bid !== BLOCK.AIR && bid !== BLOCK.BEDROCK && bid !== BLOCK.OBSIDIAN && bid !== BLOCK.ANCIENT_DEBRIS) {
              this.setWorldBlock(bx + dx, by + dy, bz + dz, BLOCK.AIR, true);
            }
          }
        }
      }
    }
    this.spawnBreakParticles(cx, cy, cz, colorHex, 24);
    if (mobDamage > 0) {
      const blastRange = radius + 2.5;
      for (const mob of [...this.mobs]) {
        const d = Math.hypot(mob.x - cx, mob.y + 0.8 - cy, mob.z - cz);
        if (d <= blastRange) {
          const factor = 1 - d / (blastRange + 0.5);
          const nx = d > 0.01 ? ((mob.x - cx) / d) * 10 : 0;
          const nz = d > 0.01 ? ((mob.z - cz) / d) * 10 : 0;
          this.damageMobDirect(mob, Math.max(2, Math.round(mobDamage * factor)), nx, nz);
        }
      }
    }
  }

  private spawnProjectile(
    kind: ProjectileKind,
    itemId: string,
    speed: number,
    colorHex: number,
    damage: number,
    gravity: number,
    extraUp = 0.08,
  ): void {
    this.camera.getWorldDirection(_camDir);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(this.projectileGeo, mat);
    if (kind === 'arrow' || kind === 'trident') {
      mesh.scale.set(0.32, 0.32, kind === 'trident' ? 2.9 : 2.1);
    } else if (kind === 'firework') {
      mesh.scale.set(0.55, 1.35, 0.55);
    } else if (kind === 'fireball') {
      mesh.scale.set(1.45, 1.45, 1.45);
    } else if (kind === 'wind_charge') {
      mesh.scale.set(1.3, 1.3, 1.3);
    } else if (kind === 'xp_bottle' || kind === 'splash_potion') {
      mesh.scale.set(0.95, 1.15, 0.95);
    }

    const startX = this.px + _camDir.x * 0.7;
    const startY = this.py + 1.48 + _camDir.y * 0.5;
    const startZ = this.pz + _camDir.z * 0.7;

    let vx = _camDir.x * speed;
    let vy = (_camDir.y + extraUp) * speed;
    let vz = _camDir.z * speed;

    if (kind === 'firework') {
      vx = _camDir.x * 4;
      vy = 16;
      vz = _camDir.z * 4;
    } else if (kind === 'eye_of_ender') {
      // Float smoothly toward world origin (0, 0) where the Overworld fortress/portal hub lies
      const toX = -this.px;
      const toZ = -this.pz;
      const horiz = Math.hypot(toX, toZ) || 1;
      vx = (toX / horiz) * 7.5;
      vy = 4.2;
      vz = (toZ / horiz) * 7.5;
    }

    mesh.position.set(
      startX - this.originCX * CHUNK_SIZE,
      startY,
      startZ - this.originCZ * CHUNK_SIZE,
    );
    this.worldGroup.add(mesh);

    this.projectiles.push({
      kind,
      mesh,
      x: startX,
      y: startY,
      z: startZ,
      vx,
      vy,
      vz,
      gravity,
      life: kind === 'firework' ? 1.15 : kind === 'eye_of_ender' ? 2.2 : 6.0,
      colorHex,
      damage,
      itemId,
      trailTimer: 0,
    });
  }

  private handleProjectileImpact(pr: ProjectileEntity, hitMob: MobEntity | null): void {
    const { x, y, z, kind, colorHex, itemId } = pr;
    if (kind === 'xp_bottle') {
      const gained = 5 + Math.floor(Math.random() * 8); // 5-12 XP points (0.5 - 1.2 levels!)
      this.spawnBreakParticles(x, y + 0.15, z, 0xa3e635, 14);
      this.spawnBreakParticles(x, y + 0.25, z, 0xfacc15, 8);
      this.grantPlayerXp(gained);
      this.showItemToast(`+${gained} XP (Cấp ${this.world?.player.level || 0})`);
      return;
    }

    if (kind === 'ender_pearl') {
      const safeY = this.findSafeTeleportY(x, y, z);
      this.px = x;
      this.py = safeY;
      this.pz = z;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.fallPeakY = safeY;
      this.spawnBreakParticles(x, safeY + 0.8, z, 0xa855f7, 20);
      soundEngine.playPortal();
      if (this.world?.gameMode === 'survival') {
        this.damagePlayer(4, 'Ngọc Ender');
      }
      this.showItemToast('Đã dịch chuyển bằng Ngọc Ender!');
      this.emitHud();
      return;
    }

    if (kind === 'snowball') {
      this.spawnBreakParticles(x, y, z, 0xf8fafc, 10);
      soundEngine.playBlock('sand', 'break');
      if (hitMob) {
        const isNether =
          hitMob.type === 'ghast' ||
          hitMob.type === 'piglin' ||
          hitMob.type === 'zombified_piglin' ||
          hitMob.type === 'strider';
        this.damageMobDirect(hitMob, isNether ? 3 : 0.5, pr.vx * 0.25, pr.vz * 0.25);
      }
      return;
    }

    if (kind === 'egg') {
      this.spawnBreakParticles(x, y, z, 0xfef3c7, 10);
      soundEngine.playClick();
      if (hitMob) {
        this.damageMobDirect(hitMob, 0.5, pr.vx * 0.22, pr.vz * 0.22);
      }
      if (Math.random() < 0.25 && this.mobs.length < 24) {
        const hatchType: MobType = Math.random() < 0.5 ? 'pig' : 'sheep';
        this.spawnMob(hatchType, x, Math.max(2, y + 0.2), z);
        this.showItemToast(`Trứng nở ra ${MOB_SPECS[hatchType].nameVi}!`);
      }
      return;
    }

    if (kind === 'arrow' || kind === 'trident') {
      const burstColor = kind === 'trident' ? 0x38bdf8 : itemId === 'spectral_arrow' ? 0xfacc15 : itemId === 'tipped_arrow' ? 0x22c55e : 0xe2e8f0;
      this.spawnBreakParticles(x, y, z, burstColor, kind === 'trident' ? 12 : 7);
      soundEngine.playBlock('wood', 'break');
      if (hitMob) {
        const bonus = itemId === 'tipped_arrow' ? 3 : 0;
        this.damageMobDirect(hitMob, pr.damage + bonus, pr.vx * 0.18, pr.vz * 0.18);
      }
      return;
    }

    if (kind === 'fireball') {
      this.detonateExplosion(x, y, z, 2, 0xf97316, 9);
      return;
    }

    if (kind === 'firework') {
      soundEngine.playFirework();
      const palette = [0xef4444, 0xfacc15, 0x38bdf8, 0xc084fc, 0x4ade80];
      for (const col of palette) {
        this.spawnBreakParticles(x, y, z, col, 8);
      }
      return;
    }

    if (kind === 'eye_of_ender') {
      this.spawnBreakParticles(x, y, z, 0x10b981, 14);
      this.spawnBreakParticles(x, y, z, 0xa855f7, 8);
      soundEngine.playXpOrb();
      const distOrigin = Math.round(Math.hypot(this.px, this.pz));
      this.showItemToast(`Mắt Ender chỉ về Tâm (0, 0) • cách ${distOrigin}m`);
      return;
    }

    if (kind === 'wind_charge') {
      soundEngine.playWindBurst();
      this.spawnBreakParticles(x, y + 0.15, z, 0xe0f2fe, 18);
      this.spawnBreakParticles(x, y + 0.25, z, 0x7dd3fc, 12);
      const blastRadius = 4.6;
      const pdx = this.px - x;
      const pdy = this.py + 0.9 - y;
      const pdz = this.pz - z;
      const pDist = Math.hypot(pdx, pdy, pdz);
      if (pDist <= 4.4) {
        // Authentic Wind-Charge Jump for Mace Smash combos!
        const horiz = Math.hypot(pdx, pdz) || 1;
        this.vx += (pdx / horiz) * 6.5;
        this.vz += (pdz / horiz) * 6.5;
        this.vy = Math.max(this.vy, 14.5);
        this.onGround = false;
        this.fallPeakY = this.py;
        this.showItemToast('Bật nhảy Cầu Gió (Wind Charge)!');
      }
      for (const mob of [...this.mobs]) {
        const mdx = mob.x - x;
        const mdy = mob.y + 0.8 - y;
        const mdz = mob.z - z;
        const mDist = Math.hypot(mdx, mdy, mdz);
        if (mDist <= blastRadius) {
          const h = Math.hypot(mdx, mdz) || 1;
          mob.vy = Math.max(mob.vy, 10.5);
          this.damageMobDirect(mob, 2, (mdx / h) * 12, (mdz / h) * 12);
        }
      }
      return;
    }

    if (kind === 'splash_potion') {
      soundEngine.playSplash();
      this.spawnBreakParticles(x, y + 0.2, z, colorHex, 20);
      const radius = 4.6;
      const distPlayer = Math.hypot(this.px - x, this.py + 0.9 - y, this.pz - z);
      const isHarmful =
        itemId.includes('harming') || itemId.includes('poison');

      if (distPlayer <= radius && this.world) {
        if (itemId === 'splash_potion' || itemId.includes('regeneration') || itemId.includes('lingering')) {
          this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + 6);
          this.applyPlayerEffect('regeneration', 20, 0);
        } else if (itemId.includes('swiftness')) {
          this.applyPlayerEffect('speed', 90, 0);
        } else if (itemId.includes('strength')) {
          this.applyPlayerEffect('strength', 90, 0);
        } else if (itemId.includes('fire_resistance')) {
          this.applyPlayerEffect('fire_resistance', 120, 0);
        } else if (itemId.includes('night_vision')) {
          this.applyPlayerEffect('night_vision', 120, 0);
        } else if (isHarmful && this.world.gameMode === 'survival') {
          this.damagePlayer(4, 'Thuốc Ném');
        }
        this.emitHud();
      }

      for (const mob of [...this.mobs]) {
        const dm = Math.hypot(mob.x - x, mob.y + 0.8 - y, mob.z - z);
        if (dm <= radius) {
          if (isHarmful) {
            this.damageMobDirect(mob, itemId.includes('harming') ? 8 : 5, (mob.x - x) * 1.5, (mob.z - z) * 1.5);
          } else {
            mob.hp = Math.min(mob.maxHp, mob.hp + 4);
            this.spawnBreakParticles(mob.x, mob.y + 1, mob.z, colorHex, 6);
          }
        }
      }
      return;
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.vy -= pr.gravity * dt;

      const nextX = pr.x + pr.vx * dt;
      const nextY = pr.y + pr.vy * dt;
      const nextZ = pr.z + pr.vz * dt;

      // Trail sparkles for iconic projectiles
      pr.trailTimer += dt;
      if (pr.trailTimer >= 0.055) {
        pr.trailTimer = 0;
        if (
          pr.kind === 'xp_bottle' ||
          pr.kind === 'ender_pearl' ||
          pr.kind === 'firework' ||
          pr.kind === 'fireball' ||
          pr.kind === 'eye_of_ender' ||
          pr.kind === 'splash_potion' ||
          pr.kind === 'wind_charge'
        ) {
          this.spawnBreakParticles(pr.x, pr.y, pr.z, pr.colorHex, 1);
        }
      }

      // Check Mob collision (skip for eye_of_ender & firework)
      let hitMob: MobEntity | null = null;
      if (pr.kind !== 'eye_of_ender' && pr.kind !== 'firework') {
        for (const mob of this.mobs) {
          const spec = MOB_SPECS[mob.type];
          const dx = nextX - mob.x;
          const dz = nextZ - mob.z;
          if (
            Math.hypot(dx, dz) < spec.width * 0.65 + 0.3 &&
            nextY >= mob.y - 0.1 &&
            nextY <= mob.y + spec.height + 0.2
          ) {
            hitMob = mob;
            break;
          }
        }
      }

      const hitSolid =
        pr.kind !== 'eye_of_ender' &&
        isBlockSolid(this.getWorldBlock(Math.floor(nextX), Math.floor(nextY), Math.floor(nextZ)));

      pr.x = nextX;
      pr.y = nextY;
      pr.z = nextZ;
      pr.mesh.position.set(
        pr.x - this.originCX * CHUNK_SIZE,
        pr.y,
        pr.z - this.originCZ * CHUNK_SIZE,
      );

      if (pr.kind === 'arrow' || pr.kind === 'trident') {
        pr.mesh.lookAt(
          pr.mesh.position.x + pr.vx,
          pr.mesh.position.y + pr.vy,
          pr.mesh.position.z + pr.vz,
        );
      } else {
        pr.mesh.rotation.x += dt * 9;
        pr.mesh.rotation.y += dt * 7;
      }

      if (hitMob || hitSolid || pr.life <= 0 || pr.y < 1) {
        this.worldGroup.remove(pr.mesh);
        (pr.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
        this.handleProjectileImpact(pr, hitMob);
      }
    }
  }

  private growBoneMealAt(x: number, y: number, z: number): boolean {
    const bid = this.getWorldBlock(x, y, z);
    const key = BLOCK_DEFS[bid]?.key || '';

    // 1. Grow 4-layer Tree from any sapling or mangrove propagule (Oak, Cherry, Pale Oak + Creaking Heart, Mangrove)!
    if (key.endsWith('_sapling') || key === 'mangrove_propagule') {
      const isCherry = key === 'cherry_sapling';
      const isPale = key === 'pale_oak_sapling';
      const isMangrove = key === 'mangrove_propagule';
      const logId = isCherry
        ? BLOCK_BY_KEY['cherry_log']?.id ?? BLOCK.OAK_LOG
        : isPale
          ? BLOCK_BY_KEY['pale_oak_log']?.id ?? BLOCK.OAK_LOG
          : isMangrove
            ? BLOCK_BY_KEY['mangrove_log']?.id ?? BLOCK.OAK_LOG
            : BLOCK.OAK_LOG;
      const leafId = isCherry
        ? BLOCK_BY_KEY['cherry_leaves']?.id ?? BLOCK.OAK_LEAVES
        : isPale
          ? BLOCK_BY_KEY['pale_oak_leaves']?.id ?? BLOCK.OAK_LEAVES
          : isMangrove
            ? BLOCK_BY_KEY['mangrove_leaves']?.id ?? BLOCK.OAK_LEAVES
            : BLOCK.OAK_LEAVES;
      const heartId = BLOCK_BY_KEY['creaking_heart']?.id ?? logId;
      const rootsId = BLOCK_BY_KEY['mangrove_roots']?.id ?? logId;

      if (isMangrove) {
        if (this.getWorldBlock(x + 1, y, z) === BLOCK.AIR) this.setWorldBlock(x + 1, y, z, rootsId, true);
        if (this.getWorldBlock(x - 1, y, z) === BLOCK.AIR) this.setWorldBlock(x - 1, y, z, rootsId, true);
        if (this.getWorldBlock(x, y, z + 1) === BLOCK.AIR) this.setWorldBlock(x, y, z + 1, rootsId, true);
        if (this.getWorldBlock(x, y, z - 1) === BLOCK.AIR) this.setWorldBlock(x, y, z - 1, rootsId, true);
      }

      const trunkH = 4 + Math.floor(Math.random() * 2);
      for (let ty = 0; ty < trunkH; ty++) {
        const useHeart = isPale && ty === 1;
        this.setWorldBlock(x, y + ty, z, useHeart ? heartId : logId, true);
      }
      const topY = y + trunkH - 1;
      for (let ly = topY - 2; ly <= topY + 1; ly++) {
        const radius = ly >= topY ? 1 : 2;
        for (let lx = -radius; lx <= radius; lx++) {
          for (let lz = -radius; lz <= radius; lz++) {
            if (lx === 0 && lz === 0 && ly <= topY) continue;
            if (radius === 2 && Math.abs(lx) === 2 && Math.abs(lz) === 2 && (ly === topY - 1 || Math.random() < 0.5)) continue;
            if (radius === 1 && ly === topY + 1 && Math.abs(lx) === 1 && Math.abs(lz) === 1) continue;
            if (this.getWorldBlock(x + lx, ly, z + lz) === BLOCK.AIR) {
              this.setWorldBlock(x + lx, ly, z + lz, leafId, true);
            }
          }
        }
      }
      this.spawnBreakParticles(x + 0.5, y + 1, z + 0.5, isCherry ? 0xf9a8d4 : isPale ? 0xe2e8f0 : 0x4ade80, 14);
      soundEngine.playLevelUp();
      this.showItemToast(
        isCherry
          ? 'Cây Hoa Anh Đào đã nở rộ!'
          : isPale
            ? 'Cây Sồi Nhợt (kèm Trái Tim Creaking) đã lớn!'
            : isMangrove
              ? 'Cây Đước đã mọc rễ!'
              : 'Cây đã lớn bằng Bột Xương!',
      );
      return true;
    }

    // 2. Grow Giant Crimson / Warped Nether Fungus!
    if (key === 'crimson_fungus' || key === 'warped_fungus') {
      const isCrimson = key === 'crimson_fungus';
      const stemId = isCrimson ? BLOCK.CRIMSON_STEM : BLOCK.WARPED_STEM;
      const capId = isCrimson ? BLOCK.NETHER_WART_BLOCK : BLOCK.WARPED_WART_BLOCK;
      const h = 5 + Math.floor(Math.random() * 2);
      for (let ty = 0; ty < h; ty++) {
        this.setWorldBlock(x, y + ty, z, stemId, true);
      }
      for (let ly = y + h - 2; ly <= y + h; ly++) {
        const r = ly === y + h ? 1 : 2;
        for (let lx = -r; lx <= r; lx++) {
          for (let lz = -r; lz <= r; lz++) {
            if (lx === 0 && lz === 0 && ly < y + h) continue;
            if (this.getWorldBlock(x + lx, ly, z + lz) === BLOCK.AIR) {
              this.setWorldBlock(x + lx, ly, z + lz, capId, true);
            }
          }
        }
      }
      this.spawnBreakParticles(x + 0.5, y + 1, z + 0.5, isCrimson ? 0xe11d48 : 0x14b8a6, 14);
      soundEngine.playLevelUp();
      this.showItemToast(isCrimson ? 'Nấm Đỏ Khổng Lồ đã mọc!' : 'Nấm Cong Khổng Lồ đã mọc!');
      return true;
    }

    // 3. Sprout wildflowers & tall grass on Grass Block!
    if (bid === BLOCK.GRASS) {
      const floraKeys = ['tall_grass', 'tall_grass', 'poppy', 'dandelion', 'cornflower', 'oxeye_daisy', 'blue_orchid'];
      let sprouted = 0;
      for (let i = 0; i < 9; i++) {
        const dx = Math.floor(Math.random() * 5) - 2;
        const dz = Math.floor(Math.random() * 5) - 2;
        if (this.getWorldBlock(x + dx, y, z + dz) === BLOCK.GRASS && this.getWorldBlock(x + dx, y + 1, z + dz) === BLOCK.AIR) {
          const pickKey = floraKeys[Math.floor(Math.random() * floraKeys.length)];
          const fDef = BLOCK_BY_KEY[pickKey];
          if (fDef) {
            this.setWorldBlock(x + dx, y + 1, z + dz, fDef.id, true);
            sprouted++;
          }
        }
      }
      if (sprouted > 0) {
        this.spawnBreakParticles(x + 0.5, y + 1.2, z + 0.5, 0x4ade80, 12);
        soundEngine.playBlock('grass', 'place');
        this.showItemToast(`Bột Xương mọc thêm ${sprouted} hoa & cỏ!`);
        return true;
      }
    }
    return false;
  }

  private performRightClickAction(): void {
    if (!this.world || this.paused || this.world.player.hp <= 0) return;
    if (this.placeCooldown > 0) return;
    this.placeCooldown = 0.2;

    // 1. Try Piglin Gold Bartering first
    if (this.tryPiglinBarter()) return;

    const held = this.world.player.inventory[this.world.player.selectedSlot];
    const itemDef = held ? ITEM_DEFS[held.itemId] : null;

    // 1.1 Villager Trading, Animal Breeding, 26.1 Golden Dandelion Age-Lock & Name Tag!
    {
      this.camera.getWorldDirection(_camDir);
      const eyeY = this.py + 1.62;
      let aimedMob: MobEntity | null = null;
      let bestMobDist = 4.6;
      for (const mob of this.mobs) {
        const mSpec = MOB_SPECS[mob.type];
        const dx = mob.x - this.px;
        const dy = mob.y + mSpec.height * 0.5 - eyeY;
        const dz = mob.z - this.pz;
        const dist = Math.hypot(dx, dy, dz);
        if (dist > bestMobDist) continue;
        const dot = (dx * _camDir.x + dy * _camDir.y + dz * _camDir.z) / dist;
        if (dot > 0.86) {
          bestMobDist = dist;
          aimedMob = mob;
        }
      }

      if (aimedMob) {
        // Name Tag naming
        if (held?.itemId === 'name_tag') {
          aimedMob.customName = `${MOB_SPECS[aimedMob.type].nameVi} ★`;
          this.spawnBreakParticles(aimedMob.x, aimedMob.y + 1.2, aimedMob.z, 0xfacc15, 10);
          soundEngine.playXpOrb();
          this.consumeHeldItem();
          this.showItemToast(`Đã gắn Thẻ Tên cho ${aimedMob.customName}!`);
          this.emitHud();
          return;
        }
        // Java 26.1 Golden Dandelion: freeze baby mob growth forever!
        if (held?.itemId === 'golden_dandelion' && aimedMob.isBaby) {
          aimedMob.ageLocked = true;
          this.spawnBreakParticles(aimedMob.x, aimedMob.y + 0.8, aimedMob.z, 0xfde047, 14);
          soundEngine.playLevelUp();
          this.consumeHeldItem();
          this.unlockPlayerAdvancement('golden_dandelion_261');
          this.showItemToast('Bồ Công Anh Vàng (26.1): Đã khóa tuổi thú non!');
          this.emitHud();
          return;
        }
        // Wolf Taming (Bone), Wolf Armor (1.20.5+), Healing (Meat), and Sit/Follow Toggle!
        if (aimedMob.type === 'wolf') {
          if (!aimedMob.tamed && held?.itemId === 'bone') {
            aimedMob.tamed = true;
            aimedMob.sitting = false;
            aimedMob.maxHp = 20;
            aimedMob.hp = 20;
            const collar = aimedMob.mesh.getObjectByName('wolfCollar');
            if (collar) collar.visible = true;
            this.consumeHeldItem();
            this.spawnBreakParticles(aimedMob.x, aimedMob.y + 0.8, aimedMob.z, 0xf43f5e, 14);
            soundEngine.playLevelUp();
            this.unlockPlayerAdvancement('tame_wolf');
            this.showItemToast('Đã thuần hóa Sói! Sói sẽ đi theo & bảo vệ bạn!');
            this.emitHud();
            return;
          }
          if (aimedMob.tamed) {
            if (held?.itemId === 'wolf_armor' && !aimedMob.armored) {
              aimedMob.armored = true;
              aimedMob.maxHp = 40;
              aimedMob.hp = 40;
              this.consumeHeldItem();
              this.spawnBreakParticles(aimedMob.x, aimedMob.y + 0.7, aimedMob.z, 0xd6d3d1, 12);
              soundEngine.playAnvil();
              this.showItemToast('Đã trang bị Giáp Sói (+20 máu tối đa)!');
              this.emitHud();
              return;
            }
            const isMeat =
              held?.itemId === 'raw_porkchop' ||
              held?.itemId === 'cooked_porkchop' ||
              held?.itemId === 'beef' ||
              held?.itemId === 'cooked_beef' ||
              held?.itemId === 'mutton' ||
              held?.itemId === 'cooked_mutton';
            if (isMeat && aimedMob.hp < aimedMob.maxHp) {
              aimedMob.hp = Math.min(aimedMob.maxHp, aimedMob.hp + 6);
              this.consumeHeldItem();
              this.spawnBreakParticles(aimedMob.x, aimedMob.y + 0.8, aimedMob.z, 0x4ade80, 10);
              soundEngine.playEat();
              this.showItemToast(`Đã cho Sói ăn hồi máu (${Math.ceil(aimedMob.hp)}/${aimedMob.maxHp})!`);
              this.emitHud();
              return;
            }
            aimedMob.sitting = !aimedMob.sitting;
            soundEngine.playClick();
            this.showItemToast(aimedMob.sitting ? 'Sói đã ngồi yên chờ bạn.' : 'Sói đứng dậy đi theo bảo vệ bạn!');
            this.emitHud();
            return;
          }
        }
        // Villager Trading UI!
        if (aimedMob.type === 'villager') {
          if (!aimedMob.profession) {
            aimedMob.profession = VILLAGER_PROFESSIONS[0];
            aimedMob.tradeSeed = 17;
            aimedMob.tradeLevel = 1;
            aimedMob.tradeXp = 0;
            aimedMob.tradeOffers = generateVillagerOffers(aimedMob.profession, 17, 1);
          }
          this.activeTradingMobId = aimedMob.id;
          this.exitPointerLock();
          this.callbacks.onOpenContainer('trading');
          this.emitHud();
          return;
        }
        // Animal Breeding -> spawns a Baby Mob!
        const breedable =
          (aimedMob.type === 'sheep' && held?.itemId === 'wheat') ||
          (aimedMob.type === 'pig' && (held?.itemId === 'carrot' || held?.itemId === 'potato' || held?.itemId === 'wheat')) ||
          (aimedMob.type === 'camel' && held?.itemId === 'cactus') ||
          (aimedMob.type === 'goat' && held?.itemId === 'wheat');
        if (breedable && !aimedMob.isBaby) {
          if (aimedMob.breedCooldownSec && aimedMob.breedCooldownSec > 0) {
            this.showItemToast(`Thú cần nghỉ ${Math.ceil(aimedMob.breedCooldownSec)}s trước khi sinh sản lại!`);
            this.emitHud();
            return;
          }
          aimedMob.breedCooldownSec = 60;
          this.spawnMob(aimedMob.type, aimedMob.x + 0.7, aimedMob.y + 0.1, aimedMob.z + 0.7, { isBaby: true });
          this.spawnBreakParticles(aimedMob.x, aimedMob.y + 1.0, aimedMob.z, 0xf43f5e, 14);
          soundEngine.playXpOrb();
          this.grantPlayerXp(5);
          this.consumeHeldItem();
          this.showItemToast(`Đã nhân giống! Một bé ${MOB_SPECS[aimedMob.type].nameVi} con vừa chào đời!`);
          this.emitHud();
          return;
        }
      }
    }

    // 1.2 Mount Rideable Mobs (Happy Ghast, Camel, Nautilus, Zombie Horse, Strider!)
    if (!this.mountedMobId && (!held || held.itemId === 'saddle' || held.itemId.endsWith('_harness'))) {
      this.camera.getWorldDirection(_camDir);
      const eyeY = this.py + 1.62;
      for (const mob of this.mobs) {
        const mSpec = MOB_SPECS[mob.type];
        if (!mSpec.rideable) continue;
        const dx = mob.x - this.px;
        const dy = mob.y + mSpec.height * 0.5 - eyeY;
        const dz = mob.z - this.pz;
        const dist = Math.hypot(dx, dy, dz);
        if (dist > 4.6) continue;
        const dot = (dx * _camDir.x + dy * _camDir.y + dz * _camDir.z) / dist;
        if (dot > 0.85) {
          this.mountedMobId = mob.id;
          mob.riddenByPlayer = true;
          this.flying = Boolean(mSpec.flying);
          soundEngine.playClick();
          this.showItemToast(
            `Đã cưỡi ${mSpec.nameVi}! ${mSpec.flying ? '(Space bay lên / Shift xuống thú)' : mob.type === 'camel' ? '(Space để Lướt Dash / Shift xuống thú)' : '(Shift để xuống thú)'}`,
          );
          this.emitHud();
          return;
        }
      }
    }

    // 1.5 Direct Armor Equip on Right-Click / Tap Đặt!
    if (held && itemDef?.armorSlot !== undefined) {
      const slotIdx = itemDef.armorSlot;
      const previous = this.world.player.armor[slotIdx];
      this.world.player.armor[slotIdx] = { ...held, count: 1 };
      if (this.world.gameMode === 'creative') {
        if (previous) {
          this.world.player.inventory[this.world.player.selectedSlot] = previous;
        }
      } else {
        if (held.count > 1) {
          held.count -= 1;
          if (previous) this.addItemToInventory(previous.itemId, previous.count);
        } else {
          this.world.player.inventory[this.world.player.selectedSlot] = previous;
        }
      }
      if (this.playerRig) updateRigArmorVisuals(this.playerRig, this.world.player.armor);
      soundEngine.playClick();
      this.handSwing = 0.85;
      this.showItemToast(`Đã mặc: ${itemDef.nameVi}`);
      this.updateFirstPersonHeldVisual();
      this.emitHud();
      return;
    }

    // 1.6 Throwable & Ranged 3D Projectiles (Works in BOTH Creative & Survival!)
    if (held && itemDef && this.world.gameMode !== 'spectator') {
      const id = held.itemId;

      // Bottle o' Enchanting -> throws glowing XP flask!
      if (id === 'experience_bottle') {
        this.spawnProjectile('xp_bottle', id, 15, 0xa3e635, 0, 20, 0.14);
        soundEngine.playThrow();
        this.handSwing = 0.95;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Splash & Lingering Potions -> throws colored glass flask!
      if (id.startsWith('splash_potion') || id.startsWith('lingering_potion')) {
        const hex = parseInt((itemDef.iconColor || '#ec4899').replace('#', ''), 16) || 0xec4899;
        this.spawnProjectile('splash_potion', id, 15.5, hex, 0, 20, 0.14);
        soundEngine.playThrow();
        this.handSwing = 0.95;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Ender Pearl -> throws teleport pearl!
      if (id === 'ender_pearl') {
        this.spawnProjectile('ender_pearl', id, 22, 0x0d9488, 0, 18, 0.1);
        soundEngine.playThrow();
        this.handSwing = 0.95;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Snowball -> throws knocking snowball!
      if (id === 'snowball') {
        this.spawnProjectile('snowball', id, 21, 0xf8fafc, 0, 17, 0.08);
        soundEngine.playThrow();
        this.handSwing = 0.9;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Egg -> throws egg with 25% hatch chance!
      if (id === 'egg') {
        this.spawnProjectile('egg', id, 20, 0xfef3c7, 0, 18, 0.09);
        soundEngine.playThrow();
        this.handSwing = 0.9;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Bow & Crossbow -> fires 3D arrow (with Power, Flame, Infinity & Multishot enchantments!)
      if (id === 'bow' || id === 'crossbow') {
        let arrowId = 'arrow';
        const hasInfinity = Boolean(held.enchants?.infinity);
        if (this.world.gameMode === 'survival') {
          const arrowSlot = this.world.player.inventory.findIndex(
            (s) => s && (s.itemId === 'arrow' || s.itemId === 'spectral_arrow' || s.itemId === 'tipped_arrow'),
          );
          if (arrowSlot < 0) {
            this.showItemToast('Cần có Mũi Tên trong túi đồ để bắn!');
            this.emitHud();
            return;
          }
          const st = this.world.player.inventory[arrowSlot]!;
          arrowId = st.itemId;
          if (!hasInfinity) {
            st.count -= 1;
            if (st.count <= 0) this.world.player.inventory[arrowSlot] = null;
          }
        }
        const isCrossbow = id === 'crossbow';
        const powerBonus = (held.enchants?.power || 0) * 2.5;
        const hasFlame = Boolean(held.enchants?.flame);
        const dmg = (isCrossbow ? 9 : 7) + powerBonus + (hasFlame ? 3 : 0);
        const arrowColor = hasFlame
          ? 0xf97316
          : arrowId === 'spectral_arrow'
            ? 0xfacc15
            : arrowId === 'tipped_arrow'
              ? 0x22c55e
              : 0xd6d3d1;
        this.spawnProjectile('arrow', arrowId, isCrossbow ? 38 : 32, arrowColor, dmg, 11, 0.03);
        if (isCrossbow && held.enchants?.multishot) {
          this.spawnProjectile('arrow', arrowId, 37, arrowColor, dmg, 11, 0.16);
          this.spawnProjectile('arrow', arrowId, 37, arrowColor, dmg, 11, 0.16);
        }
        soundEngine.playBowShoot();
        this.handSwing = 0.85;
        this.emitHud();
        return;
      }

      // Trident -> throws cyan 3D spear (with Loyalty & Channeling lightning!)
      if (id === 'trident') {
        const hasChanneling = Boolean(held.enchants?.channeling);
        this.spawnProjectile('trident', id, 29, hasChanneling ? 0x7dd3fc : 0x38bdf8, hasChanneling ? 15 : 10, 13, 0.05);
        if (hasChanneling) {
          this.lightningFlash = 0.85;
          soundEngine.playThunder();
          this.showItemToast('Đinh Ba Dẫn Sét triệu hồi sấm sét!');
        } else {
          soundEngine.playThrow();
        }
        this.handSwing = 1.0;
        this.emitHud();
        return;
      }

      // Firework Rocket -> Elytra/Flight boost OR sky firework launch!
      if (id === 'firework_rocket') {
        const wearingElytra = this.world.player.armor[1]?.itemId === 'elytra';
        if (this.flying || wearingElytra) {
          this.camera.getWorldDirection(_camDir);
          this.vx = _camDir.x * 24;
          this.vy = Math.max(4, _camDir.y * 18 + 3);
          this.vz = _camDir.z * 24;
          soundEngine.playFirework();
          this.spawnBreakParticles(this.px, this.py + 0.8, this.pz, 0xfef08a, 14);
          this.showItemToast('Tăng tốc bằng Pháo Hoa!');
        } else {
          this.spawnProjectile('firework', id, 16, 0xf43f5e, 0, -4, 0.6);
          soundEngine.playFirework();
          this.showItemToast('Đã bắn Pháo Hoa!');
        }
        this.handSwing = 0.85;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Eye of Ender -> Activate End Portal Frame into live End Portal OR float toward Stronghold!
      if (id === 'eye_of_ender') {
        const tbKey = this.targetBlock ? BLOCK_DEFS[this.targetBlock.blockId]?.key : '';
        if (this.targetBlock && tbKey === 'end_portal_frame') {
          const epId = BLOCK_BY_KEY['end_portal']?.id;
          if (epId) {
            for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = this.targetBlock.x + dx;
              const nz = this.targetBlock.z + dz;
              if (this.getWorldBlock(nx, this.targetBlock.y, nz) === BLOCK.AIR) {
                this.setWorldBlock(nx, this.targetBlock.y, nz, epId, true);
              }
            }
          }
          this.spawnBreakParticles(this.targetBlock.x + 0.5, this.targetBlock.y + 1, this.targetBlock.z + 0.5, 0x10b981, 18);
          soundEngine.playPortal();
          this.showItemToast('Đã kích hoạt Cổng The End! Bước vào để gặp Rồng Ender!');
        } else {
          this.spawnProjectile('eye_of_ender', id, 8, 0x10b981, 0, 0, 0);
          soundEngine.playThrow();
        }
        this.handSwing = 0.9;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Wind Charge (1.21+) -> throws swirling Breeze orb that rocket-jumps & knocks back!
      if (id === 'wind_charge') {
        this.spawnProjectile('wind_charge', id, 28, 0xe0f2fe, 2, 0.5, 0.02);
        soundEngine.playThrow();
        this.handSwing = 0.95;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }

      // Fire Charge -> shoots Fireball when not lighting TNT/Obsidian/Soul Sand
      if (id === 'fire_charge') {
        const tBid = this.targetBlock?.blockId;
        const canIgniteTarget =
          this.targetBlock &&
          (tBid === BLOCK.TNT || tBid === BLOCK.OBSIDIAN || tBid === BLOCK.SOUL_SAND || tBid === BLOCK.SOUL_SOIL);
        if (!canIgniteTarget) {
          this.spawnProjectile('fireball', id, 24, 0xf97316, 8, 1.5, 0.01);
          soundEngine.playFirework();
          this.handSwing = 0.95;
          this.consumeHeldItem();
          this.emitHud();
          return;
        }
      }
    }

    // 1.7 Special Foods (Golden Apple, Enchanted Golden Apple, Chorus Fruit) - usable anytime!
    if (held && itemDef) {
      if (held.itemId === 'golden_apple') {
        this.world.player.hunger = Math.min(20, this.world.player.hunger + 4);
        this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + 8);
        this.applyPlayerEffect('regeneration', 10, 0);
        this.applyPlayerEffect('resistance', 30, 0);
        soundEngine.playEat();
        soundEngine.playLevelUp();
        this.spawnBreakParticles(this.px, this.py + 1.2, this.pz, 0xfacc15, 10);
        this.handSwing = 0.85;
        this.consumeHeldItem();
        this.showItemToast('Táo Vàng: Hồi Máu + Kháng Sát Thương!');
        this.emitHud();
        return;
      }
      if (held.itemId === 'enchanted_golden_apple') {
        this.world.player.hunger = 20;
        this.world.player.hp = this.world.player.maxHp;
        this.applyPlayerEffect('regeneration', 25, 1);
        this.applyPlayerEffect('resistance', 120, 1);
        this.applyPlayerEffect('fire_resistance', 180, 0);
        soundEngine.playEat();
        soundEngine.playLevelUp();
        this.spawnBreakParticles(this.px, this.py + 1.2, this.pz, 0xc084fc, 16);
        this.handSwing = 0.85;
        this.consumeHeldItem();
        this.showItemToast('Táo Vàng Phù Phép: Bất Tử + Kháng Lửa!');
        this.emitHud();
        return;
      }
      if (held.itemId === 'chorus_fruit') {
        this.world.player.hunger = Math.min(20, this.world.player.hunger + 4);
        const ang = Math.random() * Math.PI * 2;
        const dist = 4 + Math.random() * 5;
        const tx = this.px + Math.cos(ang) * dist;
        const tz = this.pz + Math.sin(ang) * dist;
        const ty = this.findSafeTeleportY(tx, this.py, tz);
        this.px = tx;
        this.py = ty;
        this.pz = tz;
        this.fallPeakY = ty;
        soundEngine.playEat();
        soundEngine.playPortal();
        this.spawnBreakParticles(tx, ty + 0.9, tz, 0xc084fc, 16);
        this.handSwing = 0.85;
        this.consumeHeldItem();
        this.showItemToast('Trái Điệp Khúc: Dịch chuyển tức thời!');
        this.emitHud();
        return;
      }
    }

    // 1.75 Drink Potions, Water Bottle, Awkward Potion, Milk Bucket & Honey Bottle
    if (
      held &&
      itemDef &&
      (itemDef.potionEffect ||
        held.itemId === 'milk_bucket' ||
        held.itemId === 'potion_healing' ||
        held.itemId === 'potion_poison' ||
        held.itemId === 'potion_harming' ||
        held.itemId === 'water_bottle' ||
        held.itemId === 'awkward_potion' ||
        held.itemId === 'honey_bottle')
    ) {
      if (held.itemId === 'milk_bucket') {
        this.world.player.effects = [];
        this.consumeHeldItem('bucket');
      } else {
        if (itemDef.potionEffect) {
          this.applyPlayerEffect(itemDef.potionEffect.id, itemDef.potionEffect.durationSec, itemDef.potionEffect.amplifier);
        }
        if (itemDef.healRestore) {
          this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + itemDef.healRestore);
        }
        if (itemDef.foodRestore) {
          this.world.player.hunger = Math.min(20, this.world.player.hunger + itemDef.foodRestore);
        }
        if (held.itemId === 'potion_harming' && this.world.gameMode === 'survival') {
          this.damagePlayer(6, 'Thuốc Gây Hại');
        } else if (held.itemId === 'potion_poison') {
          this.applyPlayerEffect('slowness', 12, 0);
        }
        this.consumeHeldItem('glass_bottle');
      }
      soundEngine.playLevelUp();
      this.handSwing = 0.85;
      this.showItemToast(`Đã uống: ${itemDef.nameVi}`);
      this.emitHud();
      return;
    }

    // 1.8 Utility, Musical, Exploration & Combat Support Items (usable in air!)
    if (held && itemDef) {
      const id = held.itemId;
      if (id === 'clock') {
        const mcTicks = ((this.world.timeOfDay % 24000) + 24000) % 24000;
        const totalMin = Math.floor(((mcTicks + 6000) % 24000) / (24000 / 1440));
        const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const mm = String(totalMin % 60).padStart(2, '0');
        const phase = mcTicks < 1000 ? 'Bình minh' : mcTicks < 12000 ? 'Ban ngày' : mcTicks < 13500 ? 'Hoàng hôn' : 'Ban đêm';
        soundEngine.playClick();
        this.showItemToast(`Đồng Hồ: ${hh}:${mm} (${phase})`);
        this.emitHud();
        return;
      }
      if (id === 'compass' || id === 'lodestone_compass' || id === 'recovery_compass') {
        const [sx, , sz] = this.world.player.spawnPoint;
        const dx = sx - this.px;
        const dz = sz - this.pz;
        const dist = Math.round(Math.hypot(dx, dz));
        const dir =
          Math.abs(dx) > Math.abs(dz)
            ? dx > 0 ? 'Đông' : 'Tây'
            : dz > 0 ? 'Nam' : 'Bắc';
        const label = id === 'recovery_compass' ? 'La Bàn Phục Hồi' : 'La Bàn';
        soundEngine.playClick();
        this.showItemToast(
          dist <= 3
            ? `${label}: Bạn đang ở ngay Điểm Hồi Sinh!`
            : `${label} chỉ hướng ${dir} • cách điểm lưu ${dist}m`,
        );
        this.emitHud();
        return;
      }
      if (id === 'spyglass') {
        this.spyglassZoom = !this.spyglassZoom;
        soundEngine.playClick();
        this.showItemToast(this.spyglassZoom ? 'Ống Nhòm: Phóng to 3× (bấm lại để tắt)' : 'Đã tắt Ống Nhòm');
        this.emitHud();
        return;
      }
      if (id === 'goat_horn') {
        soundEngine.playPortal();
        soundEngine.playLevelUp();
        this.applyPlayerEffect('speed', 10, 0);
        this.spawnBreakParticles(this.px, this.py + 1.5, this.pz, 0xfef08a, 10);
        this.handSwing = 0.85;
        this.showItemToast('Thổi Sừng Dê vang vọng núi rừng! (+Tốc độ 10s)');
        this.emitHud();
        return;
      }
      if (id === 'ominous_bottle') {
        this.applyPlayerEffect('strength', 120, 1);
        this.applyPlayerEffect('resistance', 60, 0);
        soundEngine.playPortal();
        soundEngine.playLevelUp();
        this.spawnBreakParticles(this.px, this.py + 1.2, this.pz, 0x1e293b, 14);
        this.handSwing = 0.85;
        this.consumeHeldItem('glass_bottle');
        this.showItemToast('Điềm Gở Thử Thách (Trial Omen): Sức Mạnh II + Kháng Đòn!');
        this.emitHud();
        return;
      }
      if (
        id === 'blue_harness' ||
        id === 'red_harness' ||
        id === 'white_harness' ||
        id === 'yellow_harness' ||
        id === 'purple_harness'
      ) {
        this.applyPlayerEffect('jump_boost', 20, 1);
        this.applyPlayerEffect('slow_falling', 20, 0);
        this.applyPlayerEffect('speed', 20, 0);
        soundEngine.playLevelUp();
        this.spawnBreakParticles(this.px, this.py + 1.1, this.pz, id === 'blue_harness' ? 0x38bdf8 : id === 'red_harness' ? 0xf43f5e : 0xa855f7, 14);
        this.handSwing = 0.85;
        this.showItemToast('Yên Cưỡi Happy Ghast: Lướt nhẹ trên bầu trời 20s!');
        this.emitHud();
        return;
      }
      if (id.endsWith('_armor_trim_smithing_template')) {
        const trimName = id.replace('_armor_trim_smithing_template', '');
        const armSlot = this.world.player.armor.find((a) => Boolean(a));
        if (armSlot) {
          armSlot.trim = trimName;
          armSlot.enchants = { ...(armSlot.enchants || {}), protection: Math.min(5, (armSlot.enchants?.protection || 0) + 1) };
          soundEngine.playLevelUp();
          this.spawnBreakParticles(this.px, this.py + 1.2, this.pz, 0x2dd4bf, 18);
          this.consumeHeldItem();
          this.showItemToast(`Đã khảm Hoa Văn Giáp "${trimName.toUpperCase()}" (+1 Bảo Vệ)!`);
        } else {
          this.showItemToast('Hãy mặc ít nhất 1 món Giáp để khảm Hoa Văn Giáp (Armor Trim)!');
        }
        this.emitHud();
        return;
      }
      if (id === 'wolf_armor') {
        const nearFriendly = this.mobs.find((m) => !m.hostile && Math.hypot(m.x - this.px, m.y - this.py, m.z - this.pz) <= 5);
        if (nearFriendly) {
          nearFriendly.armored = true;
          nearFriendly.maxHp += 20;
          nearFriendly.hp = nearFriendly.maxHp;
          soundEngine.playLevelUp();
          this.spawnBreakParticles(nearFriendly.x, nearFriendly.y + 0.8, nearFriendly.z, 0xd6a593, 14);
          this.consumeHeldItem();
          this.showItemToast(`Đã trang bị Giáp Sói (+20 HP) cho ${MOB_SPECS[nearFriendly.type].nameVi}!`);
        } else {
          this.applyPlayerEffect('resistance', 20, 0);
          soundEngine.playShieldBlock();
          this.showItemToast('Giáp Sói: Kích hoạt Kháng Sát Thương 20s!');
        }
        this.emitHud();
        return;
      }
      if (id === 'bundle') {
        const used = this.world.player.inventory.filter(Boolean).length;
        soundEngine.playClick();
        this.showItemToast(`Túi Vải (Bundle): Túi đồ đang chứa ${used}/36 ô vật phẩm`);
        this.emitHud();
        return;
      }
      if (id.endsWith('_spear')) {
        // Authentic Mounts of Mayhem Spear Lunge Thrust!
        this.camera.getWorldDirection(_camDir);
        this.vx += _camDir.x * 12.5;
        this.vz += _camDir.z * 12.5;
        this.vy = Math.max(this.vy, 2.2);
        this.handSwing = 1.0;
        soundEngine.playThrow();
        const hit = this.tryAttackMob();
        this.showItemToast(hit ? 'Đâm Giáo Xung Phong trúng đích!' : 'Xung Phong bằng Giáo!');
        this.emitHud();
        return;
      }
      if (id === 'map' || id === 'filled_map') {
        if (id === 'map' && this.world.gameMode === 'survival') {
          this.consumeHeldItem('filled_map');
        }
        const biome: AnyBiome =
          this.generator?.getBiomeAt(this.world.dimension, Math.floor(this.px), Math.floor(this.pz)) || 'plains';
        soundEngine.playClick();
        this.showItemToast(
          `Bản Đồ: ${BIOME_LABELS[biome] || biome} (${Math.floor(this.px)}, ${Math.floor(this.py)}, ${Math.floor(this.pz)})`,
        );
        this.emitHud();
        return;
      }
      if (id === 'shield') {
        this.applyPlayerEffect('resistance', 3.5, 1);
        soundEngine.playShieldBlock();
        this.handSwing = 0.7;
        this.showItemToast('Giơ Khiên Phòng Thủ (Kháng sát thương 3.5s)');
        this.emitHud();
        return;
      }
      if (id === 'enchanted_book') {
        const targetIdx = this.world.player.inventory.findIndex((st, idx) => {
          if (!st || idx === this.world!.player.selectedSlot || idx >= 9) return false;
          const d = ITEM_DEFS[st.itemId];
          return Boolean(d?.toolKind || d?.armorSlot !== undefined || st.itemId.endsWith('_sword') || st.itemId === 'bow' || st.itemId === 'trident');
        });
        if (targetIdx >= 0) {
          const targetStack = this.world.player.inventory[targetIdx]!;
          const tDef = ITEM_DEFS[targetStack.itemId];
          const enchId: EnchantmentId =
            tDef?.armorSlot !== undefined
              ? 'protection'
              : tDef?.toolKind === 'sword' || targetStack.itemId === 'trident' || targetStack.itemId === 'bow'
                ? 'sharpness'
                : 'efficiency';
          const nextLvl = Math.min(5, (targetStack.enchants?.[enchId] || 0) + 1);
          targetStack.enchants = { ...(targetStack.enchants || {}), [enchId]: nextLvl };
          soundEngine.playLevelUp();
          this.spawnBreakParticles(this.px, this.py + 1.2, this.pz, 0xc084fc, 14);
          this.consumeHeldItem();
          this.showItemToast(`Đã phù phép ${tDef?.nameVi || targetStack.itemId} (+${enchId} ${nextLvl})!`);
        } else {
          this.showItemToast('Hãy đặt Vũ Khí, Công Cụ hoặc Giáp trên thanh phím tắt để phù phép!');
        }
        this.emitHud();
        return;
      }
      if (id.startsWith('music_disc_')) {
        soundEngine.playMusicDisc(id);
        this.spawnBreakParticles(this.px, this.py + 1.4, this.pz, 0x38bdf8, 8);
        this.handSwing = 0.75;
        this.showItemToast(`Đang phát: ${itemDef.nameVi} ♪`);
        this.emitHud();
        return;
      }
      if (id === 'fishing_rod') {
        this.handSwing = 0.95;
        let nearWater =
          this.getWorldBlock(Math.floor(this.px), Math.floor(this.py), Math.floor(this.pz)) === BLOCK.WATER ||
          this.getWorldBlock(Math.floor(this.px), Math.floor(this.py - 1), Math.floor(this.pz)) === BLOCK.WATER;
        if (!nearWater) {
          this.camera.getWorldDirection(_camDir);
          for (let d = 1; d <= 8; d += 0.5) {
            const wx = Math.floor(this.px + _camDir.x * d);
            const wy = Math.floor(this.py + 1.5 + _camDir.y * d);
            const wz = Math.floor(this.pz + _camDir.z * d);
            if (this.getWorldBlock(wx, wy, wz) === BLOCK.WATER || this.getWorldBlock(wx, wy - 1, wz) === BLOCK.WATER) {
              nearWater = true;
              this.spawnBreakParticles(wx + 0.5, wy + 0.5, wz + 0.5, 0x38bdf8, 14);
              break;
            }
          }
        }
        if (nearWater) {
          const luckLv = held.enchants?.looting || held.enchants?.fortune || 0;
          const res = rollFishingLoot(luckLv);
          // Preserve real enchantments when catching Enchanted Books / Enchanted Bows!
          if (res.item.enchants && Object.keys(res.item.enchants).length > 0) {
            const emptyIdx = this.world.player.inventory.findIndex((s) => s === null);
            if (emptyIdx !== -1) {
              this.world.player.inventory[emptyIdx] = { ...res.item, enchants: { ...res.item.enchants } };
            } else {
              this.addItemToInventory(res.item.itemId, res.item.count);
            }
          } else {
            this.addItemToInventory(res.item.itemId, res.item.count);
          }
          this.grantPlayerXp(res.xp);
          this.unlockPlayerAdvancement('catch_fish');
          soundEngine.playSplash();
          const tag = res.category === 'treasure' ? '★ KHO BÁU! ' : res.category === 'junk' ? '(Rác) ' : '';
          this.showItemToast(`${tag}Câu được: ${ITEM_DEFS[res.item.itemId]?.nameVi || res.item.itemId} (+${res.xp} XP)`);
        } else {
          soundEngine.playThrow();
          this.showItemToast('Hãy hướng Cần Câu về phía mặt nước để câu cá!');
        }
        this.emitHud();
        return;
      }
      if (id === 'shears') {
        let sheared = false;
        for (const mob of this.mobs) {
          if (mob.type === 'sheep' && Math.hypot(mob.x - this.px, mob.y - this.py, mob.z - this.pz) <= 5) {
            const woolCount = 1 + Math.floor(Math.random() * 3);
            this.addItemToInventory('white_wool', woolCount);
            soundEngine.playClick();
            this.spawnBreakParticles(mob.x, mob.y + 0.8, mob.z, 0xf8fafc, 12);
            this.handSwing = 0.9;
            this.showItemToast(`Đã xén lông Cừu (+${woolCount} Len Trắng)!`);
            sheared = true;
            break;
          }
        }
        if (sheared) {
          this.emitHud();
          return;
        }
      }
      if (id === 'saddle' || id === 'name_tag' || id === 'lead' || id === 'warped_fungus_on_a_stick' || id === 'carrot_on_a_stick') {
        const nearest = this.mobs.find((m) => Math.hypot(m.x - this.px, m.y - this.py, m.z - this.pz) <= 5.5);
        if (nearest) {
          nearest.hp = nearest.maxHp;
          this.spawnBreakParticles(nearest.x, nearest.y + 1, nearest.z, 0xf43f5e, 10);
          soundEngine.playLevelUp();
          this.handSwing = 0.85;
          if (id === 'warped_fungus_on_a_stick' || id === 'carrot_on_a_stick') {
            this.applyPlayerEffect('speed', 8, 0);
            this.showItemToast(`Dẫn dụ ${MOB_SPECS[nearest.type].nameVi} (+Tăng Tốc 8s)!`);
          } else {
            this.showItemToast(`Đã tương tác ${itemDef.nameVi} với ${MOB_SPECS[nearest.type].nameVi}!`);
          }
          this.emitHud();
          return;
        } else if (id === 'warped_fungus_on_a_stick' || id === 'carrot_on_a_stick') {
          this.applyPlayerEffect('speed', 5, 0);
          soundEngine.playClick();
          this.showItemToast(`${itemDef.nameVi}: Tăng tốc di chuyển 5s!`);
          this.emitHud();
          return;
        }
      }
      if (id === 'book' || id === 'writable_book' || id === 'written_book') {
        const tips = [
          'Mẹo 1.16: Nung Mảnh Cổ Đại trong Lò để tạo Phế Liệu Netherite!',
          'Mẹo 1.16: Cầm Thỏi Vàng bấm chuột phải vào Piglin để trao đổi đồ quý!',
          'Mẹo 1.16: Mặc 1 món Giáp Vàng để Piglin không tấn công bạn ở Nether!',
          'Mẹo 1.16: Dùng Bàn Rèn (Smithing Table) nâng cấp đồ Kim Cương lên Netherite!',
          'Mẹo 1.16: Đừng bấm Giường ở Nether hoặc Neo Hồi Sinh ở Overworld — sẽ nổ tung!',
        ];
        soundEngine.playClick();
        this.showItemToast(tips[Math.floor(Math.random() * tips.length)]);
        this.emitHud();
        return;
      }
      if (id.endsWith('_boat') || id.endsWith('minecart')) {
        this.camera.getWorldDirection(_camDir);
        this.vx = _camDir.x * 16;
        this.vz = _camDir.z * 16;
        this.applyPlayerEffect('speed', 6, 1);
        soundEngine.playBlock('wood', 'place');
        this.handSwing = 0.85;
        this.showItemToast(`Lướt nhanh với ${itemDef.nameVi}!`);
        this.emitHud();
        return;
      }
    }

    // 2. Try eating regular food (works in Survival when hungry/hurt, AND tastable in Creative!)
    if (
      held &&
      itemDef?.foodRestore &&
      (this.world.gameMode === 'creative' || this.world.player.hunger < 20 || this.world.player.hp < 20)
    ) {
      this.world.player.hunger = Math.min(20, this.world.player.hunger + itemDef.foodRestore);
      if (itemDef.healRestore) {
        this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + itemDef.healRestore);
      }
      if (held.itemId === 'rotten_flesh' || held.itemId === 'poisonous_potato' || held.itemId === 'pufferfish') {
        this.applyPlayerEffect('slowness', 6, 0);
      }
      const isStew =
        held.itemId === 'mushroom_stew' ||
        held.itemId === 'rabbit_stew' ||
        held.itemId === 'beetroot_soup' ||
        held.itemId === 'suspicious_stew';
      this.consumeHeldItem(isStew ? 'bowl' : undefined);
      soundEngine.playEat();
      this.handSwing = 0.85;
      this.showItemToast(`Đã ăn: ${itemDef.nameVi} (+${itemDef.foodRestore} đói)`);
      this.emitHud();
      return;
    }

    if (!this.targetBlock) return;
    const tb = this.targetBlock;

    // 3. Interact with functional 1.16 blocks (unless sneaking)
    const sneaking = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak;
    if (!sneaking) {
      const targetKey = BLOCK_DEFS[tb.blockId]?.key || '';
      if (targetKey === 'enchanting_table') {
        // Count surrounding bookshelves in a 5x2x5 ring around the Enchanting Table (max 15)
        let shelves = 0;
        const shelfId = BLOCK_BY_KEY['bookshelf']?.id;
        if (shelfId !== undefined) {
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              if (Math.abs(dx) !== 2 && Math.abs(dz) !== 2) continue;
              for (let dy = 0; dy <= 1; dy++) {
                if (this.getWorldBlock(tb.x + dx, tb.y + dy, tb.z + dz) === shelfId) {
                  shelves++;
                }
              }
            }
          }
        }
        this.enchantBookshelves = Math.min(15, shelves);
        this.exitPointerLock();
        soundEngine.playClick();
        this.emitHud();
        this.callbacks.onOpenContainer('enchanting');
        return;
      }
      if (targetKey === 'anvil' || targetKey === 'chipped_anvil' || targetKey === 'damaged_anvil') {
        this.exitPointerLock();
        soundEngine.playAnvil();
        this.callbacks.onOpenContainer('anvil');
        return;
      }
      if (targetKey === 'grindstone') {
        if (held?.enchants && Object.keys(held.enchants).length > 0) {
          const totalLevels = Object.values(held.enchants).reduce((s, v) => s + (v || 0), 0);
          delete held.enchants;
          if (held.itemId === 'enchanted_book') held.itemId = 'book';
          this.grantPlayerXp(totalLevels * 5);
          soundEngine.playAnvil();
          this.showItemToast(`Đá Mài: Đã gỡ phù phép & hoàn lại +${totalLevels * 5} XP!`);
          this.emitHud();
        } else {
          soundEngine.playClick();
          this.showItemToast('Cầm vật phẩm đã phù phép bấm chuột phải vào Đá Mài để gỡ & lấy XP!');
          this.emitHud();
        }
        return;
      }
      if (
        targetKey === 'chest' ||
        targetKey === 'trapped_chest' ||
        targetKey === 'barrel' ||
        targetKey === 'copper_chest' ||
        targetKey === 'shulker_box' ||
        targetKey === 'dispenser' ||
        targetKey === 'dropper'
      ) {
        if (!this.world.chests) this.world.chests = {};
        const key = `${this.world.dimension}:${tb.x},${tb.y},${tb.z}`;
        if (!this.world.chests[key]) {
          const fresh = createEmptyChestSlots();
          if (targetKey === 'copper_chest') {
            fresh[0] = { itemId: 'copper_ingot', count: 6 };
            fresh[1] = { itemId: 'copper_lantern', count: 2 };
            fresh[2] = { itemId: 'honeycomb', count: 3 };
          }
          this.world.chests[key] = fresh;
        }
        if (targetKey === 'shulker_box') {
          this.unlockPlayerAdvancement('shulker_box_pack');
        }
        this.activeChestKey = key;
        this.exitPointerLock();
        soundEngine.playBlock(targetKey === 'shulker_box' ? 'stone' : 'wood', 'place');
        this.emitHud();
        this.callbacks.onOpenContainer('chest');
        return;
      }
      if (targetKey === 'ender_chest') {
        if (!this.world.enderChest) this.world.enderChest = createEmptyChestSlots();
        this.exitPointerLock();
        soundEngine.playPortal();
        this.emitHud();
        this.callbacks.onOpenContainer('ender_chest');
        return;
      }
      if (targetKey === 'brewing_stand') {
        if (!this.world.brewingStands) this.world.brewingStands = {};
        const key = `${this.world.dimension}:${tb.x},${tb.y},${tb.z}`;
        if (!this.world.brewingStands[key]) {
          this.world.brewingStands[key] = createEmptyBrewingState();
        }
        this.activeBrewingKey = key;
        this.exitPointerLock();
        soundEngine.playClick();
        this.emitHud();
        this.callbacks.onOpenContainer('brewing');
        return;
      }
      if (targetKey === 'stonecutter') {
        this.exitPointerLock();
        soundEngine.playClick();
        this.callbacks.onOpenContainer('stonecutter');
        return;
      }
      if (targetKey === 'composter') {
        if (!this.world.composterLevels) this.world.composterLevels = {};
        const key = `${this.world.dimension}:${tb.x},${tb.y},${tb.z}`;
        const cur = this.world.composterLevels[key] ?? 0;
        const res = stepComposter(cur, held?.itemId ?? null);
        if (res.producedBoneMeal) {
          this.world.composterLevels[key] = 0;
          this.addItemToInventory('bone_meal', 1);
          this.spawnBreakParticles(tb.x + 0.5, tb.y + 1.0, tb.z + 0.5, 0x4ade80, 14);
          soundEngine.playXpOrb();
          this.showItemToast('Thùng Ủ Phân đầy! Thu hoạch +1 Bột Xương!');
        } else if (res.accepted) {
          this.world.composterLevels[key] = res.level;
          this.consumeHeldItem();
          this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.9, tb.z + 0.5, res.increased ? 0x22c55e : 0xa16207, 8);
          soundEngine.playBlock('grass', 'place');
          this.showItemToast(`Thùng Ủ Phân: Mức ${res.level}/7 ${res.level >= 7 ? '(Bấm lại để lấy Bột Xương!)' : ''}`);
        } else {
          this.showItemToast(`Thùng Ủ Phân (${cur}/7): Bỏ hạt giống, lá, lúa mì, hoa quả để ủ Bột Xương!`);
        }
        this.emitHud();
        return;
      }
      if (targetKey === 'cauldron') {
        if (!this.world.cauldronLevels) this.world.cauldronLevels = {};
        const key = `${this.world.dimension}:${tb.x},${tb.y},${tb.z}`;
        const cur = this.world.cauldronLevels[key] ?? 0;
        const res = interactCauldron(cur, held?.itemId ?? null);
        if (res.changed) {
          this.world.cauldronLevels[key] = res.waterLevel;
          if (res.consumeHeld) {
            this.consumeHeldItem(res.giveItem);
          } else if (res.giveItem) {
            this.addItemToInventory(res.giveItem, 1);
          }
          soundEngine.playSplash();
          this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.8, tb.z + 0.5, 0x38bdf8, 10);
          this.showItemToast(res.messageVi || `Cái Vạc: ${res.waterLevel}/3 nước`);
        } else {
          this.showItemToast(`Cái Vạc (${cur}/3 nước): Dùng Xô Nước để đổ đầy hoặc Chai Thủy Tinh để múc!`);
        }
        this.emitHud();
        return;
      }
      if (
        tb.blockId === BLOCK.CRAFTING_TABLE ||
        targetKey === 'crafter' ||
        targetKey === 'loom' ||
        targetKey === 'cartography_table' ||
        targetKey === 'fletching_table'
      ) {
        this.unlockPlayerAdvancement('craft_table');
        this.exitPointerLock();
        this.callbacks.onOpenContainer('crafting');
        return;
      }
      if (targetKey === 'lightning_rod') {
        this.lightningFlash = 1.0;
        soundEngine.playThunder();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 1.2, tb.z + 0.5, 0x38bdf8, 16);
        this.showItemToast('Cột Thu Lôi dẫn sét!');
        this.emitHud();
        return;
      }
      if (targetKey === 'sculk_sensor' || targetKey === 'sculk_shrieker') {
        soundEngine.playSculkVibration();
        if (targetKey === 'sculk_shrieker') {
          soundEngine.playWardenHeartbeat();
          this.applyPlayerEffect('darkness', 10, 0);
        }
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.8, tb.z + 0.5, 0x06b6d4, 16);
        this.showItemToast(targetKey === 'sculk_shrieker' ? 'Sculk Shrieker gầm vang Deep Dark! (Bóng Tối 10s)' : 'Cảm Biến Sculk bắt sóng rung động!');
        this.emitHud();
        return;
      }
      if (targetKey === 'chiseled_bookshelf') {
        if (!this.world.chiseledBookshelves) this.world.chiseledBookshelves = {};
        const key = `${tb.x},${tb.y},${tb.z}`;
        const shelf = this.world.chiseledBookshelves[key] || [];
        const isBook = held && (held.itemId === 'book' || held.itemId === 'enchanted_book' || held.itemId === 'writable_book' || held.itemId === 'written_book');
        if (isBook && shelf.length < 6) {
          shelf.push(held.itemId);
          this.world.chiseledBookshelves[key] = shelf;
          this.consumeHeldItem();
          soundEngine.playBlock('wood', 'place');
          this.showItemToast(`Kệ Sách Chạm Khắc: Đã cất sách (${shelf.length}/6 ô)`);
        } else if (shelf.length > 0) {
          const popped = shelf.pop()!;
          this.world.chiseledBookshelves[key] = shelf;
          this.addItemToInventory(popped, 1);
          soundEngine.playBlock('wood', 'break');
          this.showItemToast(`Đã lấy ${ITEM_DEFS[popped]?.nameVi || popped} từ Kệ Sách (${shelf.length}/6 ô)`);
        } else {
          this.showItemToast('Kệ Sách Chạm Khắc trống (cầm Sách bấm chuột phải để cất, tối đa 6 quyển)');
        }
        this.emitHud();
        return;
      }
      if (targetKey === 'decorated_pot') {
        const sherds = ['angler_pottery_sherd', 'archer_pottery_sherd', 'blade_pottery_sherd', 'heart_pottery_sherd', 'skull_pottery_sherd', 'emerald'];
        const pick = sherds[Math.floor(Math.random() * sherds.length)];
        this.addItemToInventory(pick, 1);
        soundEngine.playClick();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.8, tb.z + 0.5, 0xb45309, 10);
        this.showItemToast(`Bình Gốm Trang Trí: Tìm thấy ${ITEM_DEFS[pick]?.nameVi || pick}!`);
        this.emitHud();
        return;
      }
      if (targetKey === 'dried_ghast' && held?.itemId === 'water_bucket') {
        this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK.AIR, true);
        this.spawnMob('happy_ghast', tb.x + 0.5, tb.y + 1.2, tb.z + 0.5);
        this.consumeHeldItem('bucket');
        soundEngine.playSplash();
        soundEngine.playLevelUp();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 1, tb.z + 0.5, 0x38bdf8, 18);
        this.showItemToast('Đã tưới nước hồi sinh Happy Ghast! Bấm chuột phải để cưỡi bay!');
        this.emitHud();
        return;
      }
      if (targetKey === 'vault' || targetKey === 'ominous_vault' || targetKey === 'trial_spawner' || targetKey === 'ominous_trial_spawner') {
        const isOminousBlock = targetKey === 'ominous_vault' || targetKey === 'ominous_trial_spawner';
        const isOminousKey = held?.itemId === 'ominous_trial_key';
        const isKey = held?.itemId === 'trial_key' || isOminousKey;
        if (targetKey === 'trial_spawner' || targetKey === 'ominous_trial_spawner') {
          this.spawnMob(isOminousBlock ? 'breeze' : 'bogged', tb.x + 1.5, tb.y + 1.2, tb.z + 0.5);
          this.addItemToInventory(isOminousBlock ? 'ominous_trial_key' : 'trial_key', 1);
          soundEngine.playPortal();
          this.spawnBreakParticles(tb.x + 0.5, tb.y + 1.1, tb.z + 0.5, isOminousBlock ? 0x22d3ee : 0xf97316, 18);
          this.showItemToast(`Trial Spawner kích hoạt! Rơi ${isOminousBlock ? 'Chìa Khóa Điềm Gở' : 'Chìa Khóa Thử Thách'}!`);
          this.emitHud();
          return;
        }
        if (isKey) {
          const useOminousLoot = isOminousKey || isOminousBlock;
          const vaultPool = useOminousLoot
            ? ['heavy_core', 'enchanted_golden_apple', 'silence_armor_trim_smithing_template', 'bolt_armor_trim_smithing_template', 'flow_armor_trim_smithing_template', 'music_disc_flurry', 'diamond']
            : ['wind_charge', 'breeze_rod', 'emerald', 'diamond', 'golden_apple', 'music_disc_precipice'];
          const loot = vaultPool[Math.floor(Math.random() * vaultPool.length)];
          const qty = loot === 'wind_charge' ? 8 : loot === 'emerald' || loot === 'breeze_rod' ? 4 : loot === 'diamond' ? 2 : 1;
          this.addItemToInventory(loot, qty);
          this.grantPlayerXp(10);
          this.consumeHeldItem();
          soundEngine.playLevelUp();
          this.spawnBreakParticles(tb.x + 0.5, tb.y + 1.1, tb.z + 0.5, useOminousLoot ? 0x22d3ee : 0xf97316, 20);
          this.showItemToast(`Mở Kho Báu Trial! Nhận ${qty}x ${ITEM_DEFS[loot]?.nameVi || loot} (+10 XP)`);
          this.emitHud();
          return;
        } else {
          soundEngine.playClick();
          this.showItemToast('Hãy cầm Chìa Khóa Thử Thách (Trial Key / Ominous Key) để mở Kho Báu Vault!');
          this.emitHud();
          return;
        }
      }
      if (targetKey === 'campfire' || targetKey === 'soul_campfire') {
        const cookedId = held ? CAMPFIRE_COOK_MAP[held.itemId] : undefined;
        if (cookedId) {
          this.consumeHeldItem();
          this.addItemToInventory(cookedId, 1);
          this.grantPlayerXp(2);
          soundEngine.playEat();
          this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.8, tb.z + 0.5, 0xf97316, 10);
          this.showItemToast(`Lửa Trại đã nướng chín: ${ITEM_DEFS[cookedId]?.nameVi || cookedId} (miễn nhiên liệu)!`);
          this.emitHud();
          return;
        }
        this.showItemToast('Cầm thịt/cá sống hoặc khoai tây bấm vào Lửa Trại để nướng không cần than!');
        this.emitHud();
        return;
      }
      if (
        tb.blockId === BLOCK.FURNACE ||
        targetKey === 'blast_furnace' ||
        targetKey === 'smoker'
      ) {
        this.world.furnace.stationKind =
          targetKey === 'blast_furnace'
            ? 'blast_furnace'
            : targetKey === 'smoker'
              ? 'smoker'
              : 'furnace';
        this.exitPointerLock();
        this.emitHud();
        this.callbacks.onOpenContainer('furnace');
        return;
      }
      if (tb.blockId === BLOCK.SMITHING_TABLE) {
        this.exitPointerLock();
        this.callbacks.onOpenContainer('smithing');
        return;
      }
      if (targetKey === 'jukebox') {
        const discId = held?.itemId?.startsWith('music_disc_') ? held.itemId : 'music_disc_pigstep';
        const discName = ITEM_DEFS[discId]?.nameVi ?? 'Đĩa Nhạc Pigstep';
        soundEngine.playMusicDisc(discId);
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 1.1, tb.z + 0.5, 0xf59e0b, 10);
        this.showItemToast(`Máy Hát đang phát: ${discName} ♪`);
        this.emitHud();
        return;
      }
      if (targetKey === 'note_block') {
        const res = playNoteBlock(this.createRedstoneAccessor(), tb.x, tb.y, tb.z, true);
        if (res.instrument === 'trumpet') {
          this.unlockPlayerAdvancement('copper_trumpet_261');
        }
        this.spawnBreakParticles(
          tb.x + 0.5,
          tb.y + 1.1,
          tb.z + 0.5,
          res.instrument === 'trumpet' ? 0xf97316 : 0x4ade80,
          8,
        );
        this.showItemToast(`Đá Nhạc: ${res.labelVi} (Nốt #${res.pitch})`);
        this.emitHud();
        return;
      }
      if (targetKey === 'lever') {
        const res = toggleLever(this.createRedstoneAccessor(), tb.x, tb.y, tb.z);
        this.unlockPlayerAdvancement('redstone_engineer');
        soundEngine.playClick();
        this.handSwing = 0.7;
        this.showItemToast(res.active ? 'Cần Gạt: BẬT (Tín hiệu 15)' : 'Cần Gạt: TẮT');
        this.emitHud();
        return;
      }
      if (targetKey === 'piston' || targetKey === 'sticky_piston') {
        // Push away from clicked face
        const dx = -tb.face[0];
        const dy = -tb.face[1];
        const dz = -tb.face[2];
        const ok = activatePiston(
          this.createRedstoneAccessor(),
          tb.x,
          tb.y,
          tb.z,
          dx,
          dy,
          dz,
          targetKey === 'sticky_piston',
          false,
        );
        if (ok) this.unlockPlayerAdvancement('redstone_engineer');
        soundEngine.playClick();
        this.handSwing = 0.8;
        this.showItemToast(ok ? 'Piston đã đẩy khối!' : 'Piston bị chặn hoặc không có khối đẩy');
        this.emitHud();
        return;
      }
      if (targetKey === 'bell') {
        soundEngine.playLevelUp();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.8, tb.z + 0.5, 0xfacc15, 8);
        this.showItemToast('Chuông Làng vang lên!');
        this.emitHud();
        return;
      }
      if (targetKey === 'beacon') {
        const evalRes = evaluateBeaconPyramid((x, y, z) => this.getWorldBlock(x, y, z), tb.x, tb.y, tb.z);
        if (evalRes.tier === 0) {
          soundEngine.playClick();
          this.showItemToast('Đèn Hiệu chưa kích hoạt! Hãy xây đế 3×3 Khối Sắt/Vàng/Kim Cương ngay bên dưới.');
          this.emitHud();
          return;
        }
        const curIdx =
          this.activeBeacon &&
          this.activeBeacon.x === tb.x &&
          this.activeBeacon.y === tb.y &&
          this.activeBeacon.z === tb.z
            ? evalRes.unlockedEffects.indexOf(this.activeBeacon.effect)
            : -1;
        const nextEffect = evalRes.unlockedEffects[(curIdx + 1) % evalRes.unlockedEffects.length];
        this.activeBeacon = { x: tb.x, y: tb.y, z: tb.z, effect: nextEffect };
        this.applyPlayerEffect(nextEffect, 14, evalRes.maxAmplifier);
        this.unlockPlayerAdvancement('activate_beacon');
        soundEngine.playLevelUp();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 1.2, tb.z + 0.5, 0x38bdf8, 16);
        this.showItemToast(
          `Đèn Hiệu Cấp ${evalRes.tier} (R=${evalRes.radius}m): ${BEACON_EFFECT_LABELS_VI[nextEffect] || nextEffect}${evalRes.maxAmplifier > 0 ? ' II' : ''}!`,
        );
        this.emitHud();
        return;
      }
      if (targetKey === 'cake') {
        this.world.player.hunger = Math.min(20, this.world.player.hunger + 3);
        this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + 1);
        soundEngine.playEat();
        this.showItemToast('Đã ăn Bánh Kem (+3 đói)');
        this.emitHud();
        return;
      }
      if (tb.blockId === BLOCK.BED || targetKey === 'straw_bed') {
        if (this.world.dimension === 'overworld') {
          this.world.player.spawnPoint = [tb.x + 0.5, tb.y + 1.1, tb.z + 0.5];
          this.world.player.spawnDimension = 'overworld';
          this.world.timeOfDay = 1000;
          this.world.weather = 'clear';
          this.world.player.hp = Math.min(this.world.player.maxHp, this.world.player.hp + 4);
          if (targetKey === 'straw_bed') {
            this.unlockPlayerAdvancement('sleep_straw_bed');
          }
          soundEngine.playLevelUp();
          this.callbacks.onChatMessage(
            targetKey === 'straw_bed'
              ? 'Đã ngủ qua đêm & đặt điểm hồi sinh tại Giường Rơm (26.3)!'
              : 'Đã ngủ qua đêm & đặt điểm hồi sinh tại Giường!',
            'success',
          );
          this.emitHud();
          return;
        } else {
          this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK.AIR, true);
          this.detonateExplosion(tb.x + 0.5, tb.y + 0.5, tb.z + 0.5, 2, 0xf97316, 10);
          this.damagePlayer(12, 'Giường phát nổ ở Nether');
          return;
        }
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
          this.detonateExplosion(tb.x + 0.5, tb.y + 0.5, tb.z + 0.5, 2, 0xa855f7, 10);
          this.damagePlayer(10, 'Neo Hồi Sinh phát nổ ở Overworld');
          return;
        }
      }
    }

    if (!held || !itemDef || this.world.gameMode === 'spectator' || this.world.gameMode === 'adventure') return;

    const placeX = tb.x + tb.face[0];
    const placeY = tb.y + tb.face[1];
    const placeZ = tb.z + tb.face[2];

    // 3.1 Mob Spawn Eggs (8 authentic 3D mobs!)
    if (held.itemId.endsWith('_spawn_egg')) {
      const mobType = held.itemId.replace('_spawn_egg', '') as MobType;
      if (MOB_SPECS[mobType]) {
        this.spawnMob(mobType, placeX + 0.5, placeY + 0.05, placeZ + 0.5);
        this.spawnBreakParticles(placeX + 0.5, placeY + 0.8, placeZ + 0.5, 0xf8fafc, 12);
        soundEngine.playClick();
        this.handSwing = 0.9;
        this.consumeHeldItem();
        this.showItemToast(`Đã triệu hồi: ${MOB_SPECS[mobType].nameVi}!`);
        this.emitHud();
        return;
      }
    }

    // 3.25 Archaeology Brush (1.20+) -> excavate Suspicious Sand / Suspicious Gravel (or Sand/Gravel)!
    if (held.itemId === 'brush') {
      const bKey = BLOCK_DEFS[tb.blockId]?.key || '';
      if (bKey === 'suspicious_sand' || bKey === 'suspicious_gravel' || tb.blockId === BLOCK.SAND || tb.blockId === BLOCK.GRAVEL) {
        const isSusp = bKey === 'suspicious_sand' || bKey === 'suspicious_gravel';
        const archPool = ['emerald', 'amethyst_shard', 'diamond', 'echo_shard', 'armadillo_scute', 'sniffer_egg', 'music_disc_relic', 'gold_ingot'];
        const found = archPool[Math.floor(Math.random() * archPool.length)];
        if (isSusp) {
          this.setWorldBlock(tb.x, tb.y, tb.z, bKey === 'suspicious_sand' ? BLOCK.SAND : BLOCK.GRAVEL, true);
        }
        this.addItemToInventory(found, 1);
        this.grantPlayerXp(4);
        soundEngine.playBlock('sand', 'break');
        soundEngine.playXpOrb();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.9, tb.z + 0.5, 0xfde68a, 14);
        this.handSwing = 0.9;
        this.showItemToast(`Khảo Cổ: Quét tìm được ${ITEM_DEFS[found]?.nameVi || found}!`);
        this.emitHud();
        return;
      }
    }

    // 3.2 Bone Meal -> grow trees, giant Nether fungi, or wildflowers!
    if (held.itemId === 'bone_meal') {
      if (this.growBoneMealAt(tb.x, tb.y, tb.z)) {
        this.handSwing = 0.9;
        this.consumeHeldItem();
        this.emitHud();
        return;
      }
    }

    // 3.3 Tools interacting with terrain: Hoe -> Farmland, Shovel -> Grass Path, Axe -> Strip Log!
    if (itemDef.toolKind === 'hoe' && (tb.blockId === BLOCK.GRASS || tb.blockId === BLOCK.DIRT)) {
      const farm = BLOCK_BY_KEY['farmland'];
      if (farm) {
        this.setWorldBlock(tb.x, tb.y, tb.z, farm.id, true);
        soundEngine.playBlock('grass', 'place');
        this.handSwing = 0.9;
        this.showItemToast('Đã cuốc thành Đất Trồng Trọt!');
        this.emitHud();
        return;
      }
    }
    if (itemDef.toolKind === 'shovel' && tb.blockId === BLOCK.GRASS) {
      const path = BLOCK_BY_KEY['grass_path'];
      if (path) {
        this.setWorldBlock(tb.x, tb.y, tb.z, path.id, true);
        soundEngine.playBlock('grass', 'break');
        this.handSwing = 0.9;
        this.showItemToast('Đã tạo Đường Cỏ!');
        this.emitHud();
        return;
      }
    }
    // 3.28 Copper Waxing (Honeycomb -> Waxed Copper!)
    if (held.itemId === 'honeycomb') {
      const tKey = BLOCK_DEFS[tb.blockId]?.key || '';
      const waxMap: Record<string, string> = {
        copper_block: 'waxed_copper_block',
        exposed_copper: 'waxed_exposed_copper',
        weathered_copper: 'waxed_weathered_copper',
        oxidized_copper: 'waxed_oxidized_copper',
      };
      if (waxMap[tKey] && BLOCK_BY_KEY[waxMap[tKey]]) {
        this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK_BY_KEY[waxMap[tKey]].id, true);
        soundEngine.playWaxOn();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.8, tb.z + 0.5, 0xfacc15, 14);
        this.consumeHeldItem();
        this.showItemToast('Đã Phủ Sáp Ong chống Oxy hóa cho khối Đồng!');
        this.emitHud();
        return;
      }
    }

    if (itemDef.toolKind === 'axe') {
      const tKey = BLOCK_DEFS[tb.blockId]?.key || '';
      // Scrape Wax OR Oxidation off Copper blocks with Axe!
      const scrapeMap: Record<string, string> = {
        waxed_copper_block: 'copper_block',
        waxed_exposed_copper: 'exposed_copper',
        waxed_weathered_copper: 'weathered_copper',
        waxed_oxidized_copper: 'oxidized_copper',
        oxidized_copper: 'weathered_copper',
        weathered_copper: 'exposed_copper',
        exposed_copper: 'copper_block',
      };
      if (scrapeMap[tKey] && BLOCK_BY_KEY[scrapeMap[tKey]]) {
        this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK_BY_KEY[scrapeMap[tKey]].id, true);
        soundEngine.playCopperScrape();
        this.spawnBreakParticles(tb.x + 0.5, tb.y + 0.8, tb.z + 0.5, 0x5eead4, 12);
        this.handSwing = 0.9;
        this.showItemToast(tKey.startsWith('waxed_') ? 'Đã cạo lớp Sáp Ong trên Đồng!' : 'Đã cạo lớp Gỉ Oxy Hóa trên Đồng!');
        this.emitHud();
        return;
      }
      if (tKey === 'oak_log' || tKey === 'crimson_stem' || tKey === 'warped_stem' || tKey.endsWith('_log')) {
        const stripped =
          BLOCK_BY_KEY[`stripped_${tKey}`] ||
          (tKey === 'crimson_stem' ? BLOCK_BY_KEY['crimson_planks'] : tKey === 'warped_stem' ? BLOCK_BY_KEY['warped_planks'] : BLOCK_BY_KEY['oak_planks']);
        if (stripped) {
          this.setWorldBlock(tb.x, tb.y, tb.z, stripped.id, true);
          soundEngine.playBlock('wood', 'break');
          this.handSwing = 0.9;
          this.showItemToast('Đã bóc vỏ gỗ!');
          this.emitHud();
          return;
        }
      }
    }

    // 3.4 Plant Seeds, Nether Wart & Sweet Berries into 3D Crop Blocks!
    const seedCropMap: Record<string, string> = {
      wheat_seeds: 'wheat_crop',
      melon_seeds: 'wheat_crop',
      pumpkin_seeds: 'wheat_crop',
      beetroot_seeds: 'wheat_crop',
      nether_wart: 'nether_wart_crop',
      sweet_berries: 'sweet_berry_bush',
      kelp: 'tall_grass',
    };
    const plantKey = seedCropMap[held.itemId];
    if (plantKey && tb.face[1] === 1) {
      const cropDef = BLOCK_BY_KEY[plantKey];
      const groundKey = BLOCK_DEFS[tb.blockId]?.key || '';
      const validGround =
        plantKey === 'nether_wart_crop'
          ? tb.blockId === BLOCK.SOUL_SAND || tb.blockId === BLOCK.SOUL_SOIL || tb.blockId === BLOCK.NETHERRACK
          : tb.blockId === BLOCK.GRASS || tb.blockId === BLOCK.DIRT || groundKey === 'farmland' || groundKey === 'podzol';
      if (cropDef && validGround && this.getWorldBlock(placeX, placeY, placeZ) === BLOCK.AIR) {
        this.setWorldBlock(placeX, placeY, placeZ, cropDef.id, true);
        soundEngine.playBlock('grass', 'place');
        this.handSwing = 0.9;
        this.consumeHeldItem();
        this.showItemToast(`Đã gieo trồng: ${itemDef.nameVi}`);
        this.emitHud();
        return;
      }
    }

    // 3.5 Buckets (Water / Lava / Fish Buckets / Empty Bucket) & Glass Bottle Water Scoop
    if (
      held.itemId === 'water_bucket' ||
      held.itemId === 'lava_bucket' ||
      held.itemId === 'cod_bucket' ||
      held.itemId === 'salmon_bucket' ||
      held.itemId === 'pufferfish_bucket' ||
      held.itemId === 'tropical_fish_bucket'
    ) {
      const liquidId = held.itemId === 'lava_bucket' ? BLOCK.LAVA : BLOCK.WATER;
      this.setWorldBlock(placeX, placeY, placeZ, liquidId, true);
      const spread = stepFluidSpread(this.createWorldBlockIO(), placeX, placeY, placeZ);
      soundEngine.playSplash();
      this.handSwing = 0.9;
      if (spread.createdObsidian > 0) {
        this.spawnBreakParticles(placeX + 0.5, placeY + 0.5, placeZ + 0.5, 0x7e22ce, 12);
        this.showItemToast('Nước gặp Dung Nham -> Tạo Hắc Diện Thạch (Obsidian)!');
      } else if (spread.createdCobblestone > 0) {
        this.spawnBreakParticles(placeX + 0.5, placeY + 0.5, placeZ + 0.5, 0x9ca3af, 10);
        this.showItemToast('Nước gặp Dung Nham -> Tạo Đá Cuội (Cobblestone)!');
      } else if (held.itemId.endsWith('_bucket') && held.itemId !== 'water_bucket' && held.itemId !== 'lava_bucket') {
        this.spawnBreakParticles(placeX + 0.5, placeY + 0.5, placeZ + 0.5, 0x38bdf8, 12);
        this.showItemToast(`Đã thả ${itemDef.nameVi} xuống nước!`);
      }
      this.consumeHeldItem('bucket');
      this.emitHud();
      return;
    }
    if (held.itemId === 'bucket') {
      const frontBlock = this.getWorldBlock(placeX, placeY, placeZ);
      if (frontBlock === BLOCK.WATER || frontBlock === BLOCK.LAVA) {
        const filledId = frontBlock === BLOCK.WATER ? 'water_bucket' : 'lava_bucket';
        this.setWorldBlock(placeX, placeY, placeZ, BLOCK.AIR, true);
        soundEngine.playSplash();
        this.handSwing = 0.9;
        this.consumeHeldItem(filledId);
        this.emitHud();
        return;
      }
    }
    if (held.itemId === 'glass_bottle') {
      const frontBlock = this.getWorldBlock(placeX, placeY, placeZ);
      if (frontBlock === BLOCK.WATER || tb.blockId === BLOCK.WATER) {
        soundEngine.playSplash();
        this.handSwing = 0.85;
        this.consumeHeldItem('water_bottle');
        this.showItemToast('Đã múc Chai Nước!');
        this.emitHud();
        return;
      }
    }

    // 3.6 End Crystal on Obsidian/Bedrock -> explosive End Crystal!
    if (held.itemId === 'end_crystal' && (tb.blockId === BLOCK.OBSIDIAN || tb.blockId === BLOCK.BEDROCK)) {
      this.detonateExplosion(placeX + 0.5, placeY + 0.5, placeZ + 0.5, 3, 0xe879f9, 14);
      this.handSwing = 1.0;
      this.consumeHeldItem();
      this.showItemToast('Pha Lê End phát nổ!');
      this.emitHud();
      return;
    }

    // 4. Flint & Steel (and Fire Charge on ignitable blocks) -> Ignite Nether Portal, Soul Fire or TNT!
    if (itemDef.isFlintAndSteel || held.itemId === 'fire_charge') {
      if (this.tryIgniteNetherPortal(placeX, placeY, placeZ)) {
        this.handSwing = 1.0;
        if (held.itemId === 'fire_charge') this.consumeHeldItem();
        return;
      }
      const under = this.getWorldBlock(placeX, placeY - 1, placeZ);
      if (under === BLOCK.SOUL_SAND || under === BLOCK.SOUL_SOIL) {
        this.setWorldBlock(placeX, placeY, placeZ, BLOCK.SOUL_FIRE, true);
        soundEngine.playBlock('grass', 'place');
        this.handSwing = 1.0;
        if (held.itemId === 'fire_charge') this.consumeHeldItem();
      } else if (tb.blockId === BLOCK.TNT) {
        this.setWorldBlock(tb.x, tb.y, tb.z, BLOCK.AIR, true);
        this.detonateExplosion(tb.x + 0.5, tb.y + 0.5, tb.z + 0.5, 2, 0xf97316, 12);
        if (held.itemId === 'fire_charge') this.consumeHeldItem();
      }
      return;
    }

    // 4.5 Place Redstone Dust as Redstone Wire!
    if (held.itemId === 'redstone') {
      const wireDef = BLOCK_BY_KEY['redstone_wire'];
      if (wireDef && this.getWorldBlock(placeX, placeY, placeZ) === BLOCK.AIR) {
        this.setWorldBlock(placeX, placeY, placeZ, wireDef.id, true);
        soundEngine.playBlock('stone', 'place');
        this.handSwing = 0.8;
        this.consumeHeldItem();
        updateRedstoneNetworkAround(this.createRedstoneAccessor(), placeX, placeY, placeZ);
        this.emitHud();
        return;
      }
    }

    // 4.6 Wither Skeleton Skull on Soul Sand/Soil T-Altar -> Summon Boss Wither!
    if (held.itemId === 'wither_skeleton_skull') {
      const altarBlocks = checkWitherSummonPattern(
        (x, y, z) => this.getWorldBlock(x, y, z),
        placeX,
        placeY,
        placeZ,
      );
      if (altarBlocks) {
        for (const [ax, ay, az] of altarBlocks) {
          this.setWorldBlock(ax, ay, az, BLOCK.AIR, true);
        }
        this.consumeHeldItem();
        this.spawnMob('wither', placeX + 0.5, placeY + 1.5, placeZ + 0.5);
        this.detonateExplosion(placeX + 0.5, placeY + 1.0, placeZ + 0.5, 2, 0x18181b, 0);
        soundEngine.playThunder();
        this.unlockPlayerAdvancement('summon_wither');
        this.callbacks.onTitleBanner('title', 'BOSS WITHER ĐÃ XUẤT HIỆN!');
        this.callbacks.onTitleBanner('subtitle', '300 Máu · Bắn Đầu Lâu Khô Héo · Hạ gục để lấy Ngôi Sao Địa Ngục!');
        this.emitHud();
        return;
      }
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
      if (def.key === 'shulker_box' && held.shulkerItems) {
        if (!this.world.chests) this.world.chests = {};
        const sKey = `${this.world.dimension}:${placeX},${placeY},${placeZ}`;
        this.world.chests[sKey] = unpackShulkerBoxItem(held);
        this.showItemToast('Đã đặt Hòm Shulker — giữ nguyên toàn bộ vật phẩm bên trong!');
      }
      soundEngine.playBlock(def.sound, 'place');
      this.handSwing = 0.9;
      if (this.world.gameMode === 'survival') {
        held.count -= 1;
        if (held.count <= 0) this.world.player.inventory[this.world.player.selectedSlot] = null;
        this.updateFirstPersonHeldVisual();
      }
      const pk = def.key;
      if (
        pk === 'redstone_block' ||
        pk === 'redstone_torch' ||
        pk === 'redstone_wire' ||
        pk === 'repeater' ||
        pk === 'lever' ||
        pk === 'daylight_detector' ||
        pk === 'redstone_lamp' ||
        pk === 'tnt' ||
        pk === 'piston' ||
        pk === 'sticky_piston' ||
        pk === 'note_block' ||
        pk === 'iron_door' ||
        pk === 'iron_trapdoor' ||
        pk === 'copper_bulb' ||
        pk === 'dispenser' ||
        pk === 'dropper' ||
        pk === 'observer'
      ) {
        updateRedstoneNetworkAround(this.createRedstoneAccessor(), placeX, placeY, placeZ);
      }
      // Wave 11: Gravity-affected blocks (Sand/Gravel/Anvil/Concrete Powder) fall immediately if unsupported
      if (isGravityBlock(itemDef.blockId)) {
        const fall = settleFallingBlocks(this.createWorldBlockIO(), placeX, placeY, placeZ);
        if (fall.hardenedConcrete > 0) {
          soundEngine.playSplash();
          this.showItemToast('Bột Bê Tông chạm nước đã đông cứng thành Bê Tông!');
        }
      }
      // Notify any adjacent Observer blocks on block placement!
      const obsRes = triggerObserverPulse(this.createRedstoneAccessor(), placeX, placeY, placeZ);
      if (obsRes.triggeredObservers > 0) {
        this.unlockPlayerAdvancement('redstone_engineer');
      }
      this.emitHud();
    }
  }

  private createWorldBlockIO(): WorldBlockIO {
    return {
      getBlock: (x, y, z) => this.getWorldBlock(x, y, z),
      setBlock: (x, y, z, blockId) => this.setWorldBlock(x, y, z, blockId, true),
    };
  }

  private createRedstoneAccessor(): RedstoneWorldAccessor {
    return {
      getBlock: (x, y, z) => this.getWorldBlock(x, y, z),
      setBlock: (x, y, z, blockId) => this.setWorldBlock(x, y, z, blockId, true),
      getState: (key) => this.world?.redstoneStates?.[key] ?? 0,
      setState: (key, value) => {
        if (!this.world) return;
        if (!this.world.redstoneStates) this.world.redstoneStates = {};
        if (value === 0) delete this.world.redstoneStates[key];
        else this.world.redstoneStates[key] = value;
      },
      getTimeOfDay: () => this.world?.timeOfDay ?? 6000,
      igniteTnt: (x, y, z) => {
        this.detonateExplosion(x + 0.5, y + 0.5, z + 0.5, 2, 0xf97316, 12);
      },
      playNote: (_x, _y, _z, pitch, instrument) => {
        soundEngine.playNoteBlockSound(pitch, instrument);
      },
      getChestSlots: (key) => {
        if (!this.world) return null;
        return this.world.chests?.[key] ?? this.world.chests?.[`${this.world.dimension}:${key}`] ?? null;
      },
      setChestSlots: (key, slots) => {
        if (!this.world) return;
        if (!this.world.chests) this.world.chests = {};
        const dimKey = `${this.world.dimension}:${key}`;
        if (this.world.chests[dimKey]) this.world.chests[dimKey] = slots;
        else this.world.chests[key] = slots;
      },
      onDispense: (x, y, z, itemId, dir) => {
        soundEngine.playBowShoot();
        this.spawnBreakParticles(x + 0.5 + dir[0] * 0.6, y + 0.5 + dir[1] * 0.6, z + 0.5 + dir[2] * 0.6, 0xf8fafc, 8);
        if (itemId === 'arrow') {
          for (const mob of this.mobs) {
            if (Math.hypot(mob.x - (x + 0.5), mob.z - (z + 0.5)) < 8) {
              mob.hp -= 5;
              mob.hurtTimer = 0.25;
              break;
            }
          }
        }
      },
    };
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

    // Recharge Java Edition melee attack cooldown (0..1)
    const heldForCd = this.world.player.inventory[this.world.player.selectedSlot];
    if (this.playerAttackCooldown < 1) {
      this.playerAttackCooldown = stepAttackCooldown(this.playerAttackCooldown, dt, heldForCd?.itemId);
    }

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

    // Smooth Spyglass 3x Zoom OR Sprint FOV widening
    const curHeld = this.world.player.inventory[this.world.player.selectedSlot];
    if (this.spyglassZoom && curHeld?.itemId !== 'spyglass') {
      this.spyglassZoom = false;
    }
    const targetFov = this.spyglassZoom ? 22 : this.settings.fov + (sprinting && mag > 0.2 ? 9 : 0);
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
      const wearingElytra = this.world.player.armor[1]?.itemId === 'elytra';
      if (wearingElytra && !this.onGround && this.vy < -1.2 && jumpHeld) {
        // Authentic Elytra gliding in mid-air!
        this.vy = Math.max(-2.6, this.vy - 4.5 * dt);
        this.vx += -sinY * 9.5 * dt;
        this.vz += -cosY * 9.5 * dt;
        this.fallPeakY = Math.min(this.fallPeakY, this.py + 2.0);
      } else {
        const grav = this.getEffectLevel('slow_falling') > 0 ? 7.5 : 26.5;
        this.vy = Math.max(-42, this.vy - grav * dt);
      }
      if (jumpHeld && this.onGround) {
        this.vy = 8.7 + this.getEffectLevel('jump_boost') * 1.65;
        this.onGround = false;
      }
    }

    // Mounted Mob Ride & Dismount System (Happy Ghast flight, Camel dash, Nautilus underwater swim, Zombie Horse gallop!)
    this.mountDashCooldown = Math.max(0, this.mountDashCooldown - dt);
    const mountedMob = this.mountedMobId ? this.mobs.find((m) => m.id === this.mountedMobId) : null;
    if (this.mountedMobId && !mountedMob) {
      this.mountedMobId = null;
    }
    if (mountedMob) {
      const mSpec = MOB_SPECS[mountedMob.type];
      if ((this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSneak) && !mSpec.flying) {
        mountedMob.riddenByPlayer = false;
        this.mountedMobId = null;
        this.touchSneak = false;
        this.showItemToast(`Đã xuống khỏi ${mSpec.nameVi}`);
        this.emitHud();
      } else {
        if (mountedMob.type === 'nautilus') {
          this.applyPlayerEffect('water_breathing', 4, 0);
        }
        const mountSpeed = mSpec.flying ? 9.5 : mountedMob.type === 'zombie_horse' ? 9.2 : mountedMob.type === 'nautilus' ? 8.8 : 7.6;
        const mWishX = (-sinY * forward + cosY * strafe) * mountSpeed;
        const mWishZ = (-cosY * forward - sinY * strafe) * mountSpeed;
        this.vx = THREE.MathUtils.lerp(this.vx, mWishX, Math.min(1, dt * 8));
        this.vz = THREE.MathUtils.lerp(this.vz, mWishZ, Math.min(1, dt * 8));
        mountedMob.yaw = Math.atan2(this.vx, this.vz) || -this.yaw;
        mountedMob.vx = this.vx;
        mountedMob.vz = this.vz;
        if (mSpec.flying) {
          this.flying = true;
          const up = this.keys.has('Space') || this.touchJump ? 6.5 : 0;
          const down = this.keys.has('ControlLeft') ? 6.5 : 0;
          this.vy = THREE.MathUtils.lerp(this.vy, up - down, Math.min(1, dt * 8));
          if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) {
            mountedMob.riddenByPlayer = false;
            this.mountedMobId = null;
            this.flying = this.world.gameMode === 'creative';
            this.showItemToast(`Đã xuống khỏi ${mSpec.nameVi}`);
          }
        }
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

    if (mountedMob && this.mountedMobId === mountedMob.id) {
      mountedMob.x = this.px;
      mountedMob.y = Math.max(1, this.py - (mountedMob.type === 'happy_ghast' ? 2.4 : 0.75));
      mountedMob.z = this.pz;
    }

    // Enforce World Border (±worldBorderSize, up to ±29,999,984!)
    const [bcx, bcz] = this.world.worldBorderCenter;
    const br = this.world.worldBorderSize;
    this.px = THREE.MathUtils.clamp(this.px, bcx - br + 0.5, bcx + br - 0.5);
    this.pz = THREE.MathUtils.clamp(this.pz, bcz - br + 0.5, bcz + br - 0.5);
    this.py = THREE.MathUtils.clamp(this.py, -8, WORLD_HEIGHT_MAX + 24);
    if (this.py < -4) this.damagePlayer(4, 'Rơi xuống khoảng không');

    // View bobbing & Footstep sound (+ Warden / Sculk vibration detection when not sneaking!)
    const horizSpeed = Math.hypot(this.vx, this.vz);
    this.wardenNoiseCooldown = Math.max(0, this.wardenNoiseCooldown - dt);
    if (this.onGround && horizSpeed > 0.6 && !this.flying) {
      this.bobPhase += dt * horizSpeed * 2.2;
      this.stepDist += horizSpeed * dt;
      if (this.stepDist > 2.3) {
        this.stepDist = 0;
        const under = this.getWorldBlock(Math.floor(this.px), Math.floor(this.py - 0.2), Math.floor(this.pz));
        const bdef = BLOCK_DEFS[under];
        if (bdef) soundEngine.playBlock(bdef.sound, 'step');
        if (!sneaking && this.wardenNoiseCooldown <= 0) {
          const nearWarden = this.mobs.find((m) => m.type === 'warden' && Math.hypot(m.x - this.px, m.y - this.py, m.z - this.pz) < 16);
          if (nearWarden) {
            this.wardenNoiseCooldown = 4.5;
            soundEngine.playWardenHeartbeat();
            this.applyPlayerEffect('darkness', 10, 0);
            this.showItemToast('Warden nghe thấy tiếng bước chân! (Hãy cúi Shift đi khẽ!)');
          }
        }
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

    // Portals: Nether Portal (2.4s), End Portal (instant Overworld <-> The End), End Gateway (Outer End City Islands!)
    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    const endPortalId = BLOCK_BY_KEY['end_portal']?.id ?? -1;
    const endGatewayId = BLOCK_BY_KEY['end_gateway']?.id ?? -1;
    const inEndPortal =
      endPortalId > 0 &&
      (footBlock === endPortalId || headBlock === endPortalId || this.getWorldBlock(Math.floor(this.px), Math.floor(this.py - 0.15), Math.floor(this.pz)) === endPortalId);
    const inEndGateway =
      endGatewayId > 0 &&
      (footBlock === endGatewayId || headBlock === endGatewayId);

    if (inEndGateway && this.portalCooldown <= 0 && this.world.dimension === 'end') {
      this.portalCooldown = 3.5;
      soundEngine.playPortal();
      this.teleportPlayer(103.5, 64, 4.5);
      this.showItemToast('Cổng Dịch Chuyển End Gateway: Đã tới Thành Phố End City!');
      return;
    }

    if (inEndPortal && this.portalCooldown <= 0) {
      if (this.world.dimension === 'end') {
        const [sx, sy, sz] = this.world.player.spawnPoint;
        this.switchDimension('overworld', sx, sy, sz, false);
      } else {
        this.switchDimension('end', 0.5, 64, 12.5, false);
      }
      return;
    }

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

    // 1. Active Potion Effects countdown + Active Beacon Pyramid Aura
    if (this.world.player.effects.length > 0) {
      this.world.player.effects = this.world.player.effects
        .map((e) => ({ ...e, remainingSec: e.remainingSec - dt }))
        .filter((e) => e.remainingSec > 0);
    }
    if (this.activeBeacon) {
      this.beaconTick += dt;
      if (this.beaconTick >= 3.0) {
        this.beaconTick = 0;
        const b = this.activeBeacon;
        const bKey = BLOCK_DEFS[this.getWorldBlock(b.x, b.y, b.z)]?.key;
        if (bKey !== 'beacon') {
          this.activeBeacon = null;
        } else {
          const evalRes = evaluateBeaconPyramid((x, y, z) => this.getWorldBlock(x, y, z), b.x, b.y, b.z);
          if (evalRes.tier > 0 && Math.hypot(this.px - b.x, this.pz - b.z) <= evalRes.radius) {
            this.applyPlayerEffect(b.effect, 12, evalRes.maxAmplifier);
          }
        }
      }
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
      const speedMult = getFurnaceSpeedMultiplier(f.stationKind, f.input.itemId);
      f.cookProgress += (dt / 5.0) * speedMult; // 5s standard, 2.5s in Blast Furnace / Smoker!
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

    // 2.5 Live Brewing Stands tick (Java Edition potion matrix)
    if (this.world.brewingStands) {
      let activeBrewChanged = false;
      for (const [bKey, st] of Object.entries(this.world.brewingStands)) {
        if (!st) continue;
        const res = stepBrewingStand(st, dt);
        if (res.changed) {
          this.world.brewingStands[bKey] = res.state;
          if (bKey === this.activeBrewingKey) {
            activeBrewChanged = true;
          }
          if (res.completed) {
            soundEngine.playSplash();
            this.unlockPlayerAdvancement('brew_potion');
            if (bKey === this.activeBrewingKey) {
              this.showItemToast('Ủ thuốc hoàn tất!');
            }
          }
        }
      }
      if (activeBrewChanged) {
        this.emitHud();
      }
    }

    // 2.6 Redstone Pressure Plates & Lockable Hopper Transfer tick
    const fx = Math.floor(this.px);
    const fy = Math.floor(this.py + 0.1);
    const fz = Math.floor(this.pz);
    const footKey = BLOCK_DEFS[this.getWorldBlock(fx, fy, fz)]?.key;
    const standingPlateKey =
      footKey === 'oak_pressure_plate' || footKey === 'stone_pressure_plate'
        ? makeCoordKey(fx, fy, fz)
        : null;
    if (standingPlateKey !== this.lastPlateKey) {
      const acc = this.createRedstoneAccessor();
      if (this.lastPlateKey) {
        acc.setState(this.lastPlateKey, 0);
        const [ox, oy, oz] = this.lastPlateKey.split(',').map(Number);
        updateRedstoneNetworkAround(acc, ox, oy, oz);
      }
      if (standingPlateKey) {
        acc.setState(standingPlateKey, 1);
        soundEngine.playClick();
        updateRedstoneNetworkAround(acc, fx, fy, fz);
      }
      this.lastPlateKey = standingPlateKey;
    }

    this.redstoneTickAccum += dt;
    if (this.redstoneTickAccum >= 0.4) {
      this.redstoneTickAccum = 0;
      const hopperId = BLOCK_BY_KEY['hopper']?.id;
      if (hopperId !== undefined && this.world.chests) {
        const acc = this.createRedstoneAccessor();
        const checkedHoppers = new Set<string>();
        for (const cKey of Object.keys(this.world.chests)) {
          const [cx, cy, cz] = cKey.split(',').map(Number);
          // Check hopper right below this chest
          const hx = cx;
          const hy = cy - 1;
          const hz = cz;
          const hKey = makeCoordKey(hx, hy, hz);
          if (!checkedHoppers.has(hKey) && this.getWorldBlock(hx, hy, hz) === hopperId) {
            checkedHoppers.add(hKey);
            if (stepHopperTransfer(acc, hx, hy, hz) && this.activeChestKey) {
              this.emitHud();
            }
          }
        }
      }
    }

    // 2.7 Natural Random-Tick Crop & Sapling Growth (Overworld)
    this.randomTickAccum += dt;
    if (this.randomTickAccum >= 0.65 && this.world.dimension === 'overworld') {
      this.randomTickAccum = 0;
      const caneId = BLOCK_BY_KEY['sugar_cane']?.id;
      const oakSapId = BLOCK_BY_KEY['oak_sapling']?.id;
      const cherrySapId = BLOCK_BY_KEY['cherry_sapling']?.id;
      const poplarSapId = BLOCK_BY_KEY['poplar_sapling']?.id;
      const poplarLogId = BLOCK_BY_KEY['poplar_log']?.id ?? BLOCK.OAK_LOG;
      const poplarLeafId = BLOCK_BY_KEY['poplar_leaves']?.id ?? BLOCK.OAK_LEAVES;

      // Sample 10 random blocks within 14m around the player
      for (let s = 0; s < 10; s++) {
        const rx = Math.floor(this.px + (Math.random() - 0.5) * 28);
        const ry = Math.max(2, Math.min(WORLD_HEIGHT_MAX - 8, Math.floor(this.py + (Math.random() - 0.5) * 8)));
        const rz = Math.floor(this.pz + (Math.random() - 0.5) * 28);
        const b = this.getWorldBlock(rx, ry, rz);

        if (caneId !== undefined && b === caneId) {
          // Grow Sugar Cane naturally up to 3 blocks tall
          if (
            this.getWorldBlock(rx, ry + 1, rz) === BLOCK.AIR &&
            !(this.getWorldBlock(rx, ry - 1, rz) === caneId && this.getWorldBlock(rx, ry - 2, rz) === caneId)
          ) {
            this.setWorldBlock(rx, ry + 1, rz, caneId, true);
          }
        } else if (
          (oakSapId !== undefined && b === oakSapId) ||
          (cherrySapId !== undefined && b === cherrySapId) ||
          (poplarSapId !== undefined && b === poplarSapId)
        ) {
          // Natural sapling tree growth (15% per hit sample)
          if (Math.random() < 0.15 && this.getWorldBlock(rx, ry + 4, rz) === BLOCK.AIR) {
            const logId =
              b === poplarSapId
                ? poplarLogId
                : b === cherrySapId
                  ? (BLOCK_BY_KEY['cherry_log']?.id ?? BLOCK.OAK_LOG)
                  : BLOCK.OAK_LOG;
            const leafId =
              b === poplarSapId
                ? poplarLeafId
                : b === cherrySapId
                  ? (BLOCK_BY_KEY['cherry_leaves']?.id ?? BLOCK.OAK_LEAVES)
                  : BLOCK.OAK_LEAVES;
            const h = b === poplarSapId ? 6 : 5;
            for (let ty = 0; ty < h; ty++) {
              this.setWorldBlock(rx, ry + ty, rz, logId, true);
            }
            for (let dy = -2; dy <= 1; dy++) {
              const rad = dy <= -1 ? 2 : 1;
              for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                  if (dx === 0 && dz === 0 && dy <= 0) continue;
                  if (Math.abs(dx) === rad && Math.abs(dz) === rad && dy === 1) continue;
                  if (this.getWorldBlock(rx + dx, ry + h - 1 + dy, rz + dz) === BLOCK.AIR) {
                    this.setWorldBlock(rx + dx, ry + h - 1 + dy, rz + dz, leafId, true);
                  }
                }
              }
            }
          }
        }
      }
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

    if (this.world.dimension === 'end') {
      // Deep Void Indigo-Purple Starry Atmosphere of The End
      _fogTarget.setHex(0x0c0618);
      (this.scene.background as THREE.Color).copy(_fogTarget);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.copy(_fogTarget);
        this.scene.fog.near = 24;
        this.scene.fog.far = Math.max(54, this.settings.renderDistance * 16);
      }
      const relX = this.px - this.originCX * CHUNK_SIZE;
      const relZ = this.pz - this.originCZ * CHUNK_SIZE;
      this.sunMesh.visible = false;
      this.moonMesh.visible = false;
      this.starField.visible = true;
      this.starField.position.set(relX, this.py, relZ);
      (this.starField.material as THREE.PointsMaterial).opacity = 0.85;
      this.cloudGroup.visible = false;
      this.rainPoints.visible = false;
      this.sunLight.color.setHex(0xe9d5ff);
      this.sunLight.intensity = 0.95 * brightBoost;
      this.hemiLight.color.setHex(0xc084fc);
      this.hemiLight.groundColor.setHex(0x2e1065);
      this.hemiLight.intensity = 0.95 * brightBoost;
      this.handHemi.intensity = 1.25;
      this.handDir.intensity = 0.95;
    } else if (this.world.dimension === 'nether') {
      // Dynamic Nether biome atmosphere!
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
      this.starField.visible = false;
      this.cloudGroup.visible = false;
      this.rainPoints.visible = false;
      this.sunLight.color.setHex(0xff8c5a);
      this.sunLight.intensity = 0.88 * brightBoost;
      this.hemiLight.color.setHex(biome === 'warped_forest' ? 0x5eead4 : 0xd96b5c);
      this.hemiLight.groundColor.setHex(0x451a12);
      this.hemiLight.intensity = 0.94 * brightBoost;
      this.handHemi.intensity = 1.25;
      this.handDir.intensity = 0.95;
    } else {
      // Overworld day/night sky, sun/moon arc, twinkling stars, twilight, clouds, rain/thunder
      const angle = ((this.world.timeOfDay - 6000) / 24000) * Math.PI * 2;
      const sunH = Math.cos(angle);
      const dayFactor = THREE.MathUtils.clamp((sunH + 0.25) / 0.75, 0, 1);
      const twilightFactor = Math.max(0, 1 - Math.abs(sunH + 0.04) * 3.6);
      const rainy = this.world.weather !== 'clear';

      if (this.world.weather === 'thunder' && Math.random() < dt * 0.14) {
        this.lightningFlash = 1.0;
        soundEngine.playThunder();
      }
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.5);

      const daySky = rainy ? 0x5c6e85 : 0x7cb1ff;
      const nightSky = 0x0a1024;
      _fogTarget.setHex(nightSky).lerp(new THREE.Color(daySky), dayFactor);
      if (!rainy && twilightFactor > 0.02) {
        _fogTarget.lerp(new THREE.Color(0xd97559), twilightFactor * 0.42);
      }
      if (this.lightningFlash > 0.1) _fogTarget.lerp(new THREE.Color(0xe0f2fe), this.lightningFlash * 0.7);
      (this.scene.background as THREE.Color).copy(_fogTarget);
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.copy(_fogTarget);
        this.scene.fog.near = rainy ? 14 : 26;
        this.scene.fog.far = Math.max(40, this.settings.renderDistance * 15);
      }

      const relX = this.px - this.originCX * CHUNK_SIZE;
      const relZ = this.pz - this.originCZ * CHUNK_SIZE;
      const orbitR = 148;
      this.sunMesh.visible = !rainy;
      this.moonMesh.visible = !rainy;
      this.sunMesh.position.set(relX + Math.sin(angle) * orbitR, this.py + Math.cos(angle) * orbitR, relZ);
      this.moonMesh.position.set(relX - Math.sin(angle) * orbitR, this.py - Math.cos(angle) * orbitR, relZ);
      this.sunMesh.lookAt(this.camera.position);
      this.moonMesh.lookAt(this.camera.position);

      // Authentic Minecraft Night Stars (rotate gently with celestial sky, fade in at sunset)
      const starOpacity = rainy ? 0 : THREE.MathUtils.clamp((0.42 - dayFactor) / 0.34, 0, 0.94);
      this.starField.visible = starOpacity > 0.02;
      if (this.starField.visible) {
        this.starField.position.set(relX, this.py, relZ);
        this.starField.rotation.z = -angle;
        (this.starField.material as THREE.PointsMaterial).opacity = starOpacity;
      }

      this.sunLight.position.set(relX + Math.sin(angle) * 60, Math.max(14, Math.abs(Math.cos(angle)) * 72 + 12), relZ + 22);
      this.sunLight.target.position.set(relX, this.py, relZ);
      this.sunLight.color.setHex(dayFactor > 0.35 ? 0xfff4d6 : 0x9ec5fe);
      // Authentic Minecraft moonlight floor so night terrain, trees & water stay crisp and readable!
      this.sunLight.intensity = (0.36 + dayFactor * (rainy ? 0.62 : 1.08) + this.lightningFlash) * brightBoost;

      _hemiSky.setHex(0x344a72).lerp(new THREE.Color(rainy ? 0x7c8fa6 : 0xa8d4ff), dayFactor);
      _hemiGround.setHex(0x222736).lerp(new THREE.Color(0x544a3e), dayFactor);
      this.hemiLight.color.copy(_hemiSky);
      this.hemiLight.groundColor.copy(_hemiGround);
      this.hemiLight.intensity = (0.54 + dayFactor * 0.38) * brightBoost;

      // Keep First-Person Hand & Sword well-lit and crisp even at night (never silhouettes!)
      const handLightBoost = Math.max(0.84, 0.84 + dayFactor * 0.42);
      this.handHemi.intensity = 1.22 * handLightBoost;
      this.handDir.intensity = 0.92 * handLightBoost;

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

    // 3b. Dynamic real-time PointLights for placed torches/lanterns/glowstone/campfires/lava + handheld glow
    this.updateDynamicBlockLights(dt);

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
      const maxRange = m.type === 'ender_dragon' || m.type === 'wither' ? 140 : 68;
      if (!m.riddenByPlayer && Math.hypot(m.x - this.px, m.z - this.pz) > maxRange) {
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
        (dmg, mobName, explode, inflictEffect) => {
          if (explode) {
            soundEngine.playExplosion();
            this.spawnBreakParticles(explode.x, explode.y + 1, explode.z, 0x4ade80, 18);
          }
          if (inflictEffect === 'slowness') {
            this.applyPlayerEffect('slowness', 6, 1);
          } else if (inflictEffect === 'darkness') {
            soundEngine.playWardenHeartbeat();
            this.applyPlayerEffect('darkness', 12, 0);
          } else if (inflictEffect === 'levitation') {
            this.applyPlayerEffect('levitation', 5, 0);
          }
          this.damagePlayer(dmg, mobName);
        },
      );
      // Living Special Mob Interactions (Allay gifts, Sniffer digs ancient flowers, Frog drops froglights, Copper Golem sparks)
      m.specialTick = (m.specialTick || 0) + dt;
      if (m.specialTick > 22 && Math.hypot(m.x - this.px, m.z - this.pz) < 12) {
        m.specialTick = 0;
        if (m.type === 'allay') {
          this.addItemToInventory('amethyst_shard', 1);
          this.spawnBreakParticles(m.x, m.y + 1.1, m.z, 0x38bdf8, 8);
          this.showItemToast('Allay nhặt tặng bạn 1 Mảnh Thạch Anh Tím!');
        } else if (m.type === 'sniffer') {
          const flower = Math.random() > 0.5 ? 'torchflower' : 'pitcher_plant';
          this.addItemToInventory(flower, 1);
          this.spawnBreakParticles(m.x, m.y + 0.6, m.z, 0xf97316, 8);
          this.showItemToast(`Sniffer đánh hơi đào được ${ITEM_DEFS[flower]?.nameVi || flower}!`);
        } else if (m.type === 'copper_golem') {
          this.spawnBreakParticles(m.x, m.y + 1.2, m.z, 0xf59e0b, 6);
        }
      }

      if (m.hp <= 0) {
        if (this.mountedMobId === m.id) this.mountedMobId = null;
        this.worldGroup.remove(m.mesh);
        disposeMobMesh(m.mesh);
        this.mobs.splice(i, 1);
        this.handleRaidMobDefeated(m);
        continue;
      }
      m.mesh.position.set(m.x - this.originCX * CHUNK_SIZE, m.y, m.z - this.originCZ * CHUNK_SIZE);
      m.mesh.rotation.y = m.yaw;
    }

    // Iron Golem & Tamed Wolf ally guardian combat against nearby hostile mobs
    const allyEvents = stepAllyGuardianCombat(this.mobs, dt);
    if (allyEvents.length > 0) {
      for (const ev of allyEvents) {
        this.spawnBreakParticles(ev.target.x, ev.target.y + 1.0, ev.target.z, 0xef4444, 6);
        if (ev.killed) {
          const spec = MOB_SPECS[ev.target.type];
          this.addItemToInventory(spec.drop, spec.dropCount);
          this.callbacks.onChatMessage(
            `${MOB_SPECS[ev.attacker.type].nameVi} đã hạ ${spec.nameVi}!`,
            'system',
          );
        }
      }
    }

    // Occasional ambient mob spawn (complete 1.17–26.4 biome ecosystem!)
    if (this.world.gamerules.doMobSpawning && this.mobs.length < 9 && this.world.dimension !== 'end') {
      this.mobSpawnTick += dt;
      if (this.mobSpawnTick > 14) {
        this.mobSpawnTick = 0;
        const curBiome = this.generator.getBiomeAt(this.world.dimension, Math.floor(this.px), Math.floor(this.pz));
        const isNight = this.world.timeOfDay > 13000;
        let pool: MobType[];
        if (this.world.dimension === 'nether') {
          pool = ['piglin', 'strider', 'zombified_piglin', 'ghast', 'ghastling'];
        } else if (this.py < 42) {
          pool = ['sulfur_cube', 'cold_sulfur_cube', 'axolotl', 'glow_squid', 'breeze'];
        } else if (curBiome === 'pale_garden') {
          pool = isNight ? ['creaking', 'creaking', 'zombie'] : ['creaking', 'sheep'];
        } else if (curBiome === 'mangrove_swamp') {
          pool = isNight ? ['bogged', 'zombie', 'frog'] : ['frog', 'tadpole', 'nautilus'];
        } else if (curBiome === 'cherry_grove' || curBiome === 'meadow') {
          pool = isNight ? ['breeze', 'creeper'] : ['allay', 'sniffer', 'sheep'];
        } else if (curBiome === 'desert') {
          pool = isNight ? ['camel_husk', 'parched', 'zombie'] : ['camel', 'armadillo', 'camel'];
        } else if (
          curBiome === 'snowy_tundra' ||
          curBiome === 'snowy_slopes' ||
          curBiome === 'frozen_peaks' ||
          curBiome === 'jagged_peaks' ||
          curBiome === 'grove'
        ) {
          pool = isNight ? ['frostbite', 'cold_sulfur_cube', 'goat'] : ['goat', 'goat', 'sheep'];
        } else {
          pool = isNight ? ['zombie', 'creeper', 'bogged', 'zombie_horse', 'sulfur_cube'] : ['pig', 'sheep', 'copper_golem', 'armadillo', 'zombie_horse'];
        }
        const pCx = Math.floor(this.px / CHUNK_SIZE);
        const pCz = Math.floor(this.pz / CHUNK_SIZE);
        if (this.world.dimension === 'overworld') {
          if ((pCx === 3 && pCz === -3) || (pCx === -3 && pCz === 2)) {
            this.unlockPlayerAdvancement('mansion_explorer');
          }
          if (Math.hypot(pCx - 3, pCz + 3) <= 1.5) {
            pool = ['evoker', 'vindicator', 'vindicator'];
          } else if (Math.hypot(pCx + 3, pCz + 3) <= 1.5) {
            pool = ['guardian', 'guardian', 'glow_squid'];
          }
        }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const ang = Math.random() * Math.PI * 2;
        const sx = this.px + Math.cos(ang) * 22;
        const sz = this.pz + Math.sin(ang) * 22;
        const sy = MOB_SPECS[pick].flying ? this.py + 8 : this.findSafeGroundY(Math.floor(sx), Math.floor(sz));
        this.spawnMob(pick, sx, sy, sz);
      }
    }

    // 6. Update 3D Projectiles & Break Particles
    if (this.projectiles.length > 0) {
      this.updateProjectiles(dt);
    }

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

  private updateDynamicBlockLights(dt: number): void {
    if (!this.world) return;
    const relX = this.px - this.originCX * CHUNK_SIZE;
    const relZ = this.pz - this.originCZ * CHUNK_SIZE;

    // Handheld light when holding Torch, Lantern, Glowstone, Campfire, Lava Bucket, etc.
    const heldStack = this.world.player.inventory[this.world.player.selectedSlot];
    const heldDef = heldStack ? ITEM_DEFS[heldStack.itemId] : undefined;
    const heldBlockEm = heldDef?.blockId !== undefined ? getBlockLightEmission(heldDef.blockId) : null;
    if (
      (heldBlockEm && heldBlockEm.level >= 8) ||
      heldStack?.itemId === 'lava_bucket' ||
      heldStack?.itemId === 'blaze_rod'
    ) {
      const r = heldBlockEm && heldBlockEm.level >= 8 ? heldBlockEm.r : 1.0;
      const g = heldBlockEm && heldBlockEm.level >= 8 ? heldBlockEm.g : 0.78;
      const b = heldBlockEm && heldBlockEm.level >= 8 ? heldBlockEm.b : 0.42;
      const lvl = heldBlockEm && heldBlockEm.level >= 8 ? heldBlockEm.level : 13;
      this.heldPointLight.visible = true;
      this.heldPointLight.color.setRGB(r, g, b);
      this.heldPointLight.intensity = 1.45 * (lvl / 15);
      this.heldPointLight.position.set(relX, this.py + 1.45, relZ);
    } else {
      this.heldPointLight.visible = false;
      this.heldPointLight.intensity = 0;
    }

    // Sync hand overlay lighting with current sky brightness + handheld light
    const handDayBoost = Math.max(0.55, Math.min(1.25, this.sunLight.intensity * 0.75 + 0.45));
    this.handHemi.intensity = this.heldPointLight.visible ? 1.25 : handDayBoost;
    this.handDir.intensity = this.heldPointLight.visible ? 0.95 : handDayBoost * 0.72;

    this.dynamicLightTick += dt;
    if (this.dynamicLightTick < 0.35) return;
    this.dynamicLightTick = 0;

    // Gather closest light-emitting blocks within 14 blocks of player
    const pxI = Math.floor(this.px);
    const pyI = Math.floor(this.py + 1);
    const pzI = Math.floor(this.pz);
    const R = 14;
    const minCX = Math.floor((pxI - R) / CHUNK_SIZE);
    const maxCX = Math.floor((pxI + R) / CHUNK_SIZE);
    const minCZ = Math.floor((pzI - R) / CHUNK_SIZE);
    const maxCZ = Math.floor((pzI + R) / CHUNK_SIZE);
    const minSY = Math.max(0, (pyI - R) >> 4);
    const maxSY = Math.min(SUBCHUNK_COUNT - 1, (pyI + R) >> 4);

    const found: { d2: number; wx: number; wy: number; wz: number; r: number; g: number; b: number; lvl: number }[] = [];

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const entry = this.chunks.get(this.chunkKey(cx, cz));
        if (!entry) continue;
        const xOff = cx * CHUNK_SIZE;
        const zOff = cz * CHUNK_SIZE;
        for (let sy = minSY; sy <= maxSY; sy++) {
          const sec = entry.col.sections[sy];
          if (!sec) continue;
          const yOff = sy * 16;
          for (let ly = 0; ly < 16; ly++) {
            const wy = yOff + ly;
            const dy = wy - pyI;
            if (dy < -R || dy > R) continue;
            const yBaseIdx = ly << 8;
            for (let lz = 0; lz < 16; lz++) {
              const wz = zOff + lz;
              const dz = wz - pzI;
              if (dz < -R || dz > R) continue;
              const zBaseIdx = yBaseIdx | (lz << 4);
              for (let lx = 0; lx < 16; lx++) {
                const bid = sec[zBaseIdx | lx];
                if (bid === BLOCK.AIR) continue;
                const em = getBlockLightEmission(bid);
                if (em.level < 8) continue;
                const wx = xOff + lx;
                const dx = wx - pxI;
                if (dx < -R || dx > R) continue;
                const d2 = dx * dx + dy * dy + dz * dz;
                if (d2 > R * R) continue;
                found.push({ d2, wx, wy, wz, r: em.r, g: em.g, b: em.b, lvl: em.level });
              }
            }
          }
        }
      }
    }

    found.sort((a, b) => a.d2 - b.d2);

    // Pick up to 6 well-spaced nearby light sources (avoid stacking 6 lights on the same lava lake)
    const picked: typeof found = [];
    for (const c of found) {
      if (picked.length >= this.dynamicLights.length) break;
      let tooClose = false;
      for (const p of picked) {
        const ddx = c.wx - p.wx;
        const ddy = c.wy - p.wy;
        const ddz = c.wz - p.wz;
        if (ddx * ddx + ddy * ddy + ddz * ddz < 9) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) picked.push(c);
    }

    for (let i = 0; i < this.dynamicLights.length; i++) {
      const pl = this.dynamicLights[i];
      const src = picked[i];
      if (src) {
        pl.visible = true;
        pl.color.setRGB(src.r, src.g, src.b);
        pl.intensity = 2.4 * (src.lvl / 15);
        pl.distance = 8 + src.lvl * 0.75;
        pl.position.set(
          src.wx - this.originCX * CHUNK_SIZE + 0.5,
          src.wy + 0.65,
          src.wz - this.originCZ * CHUNK_SIZE + 0.5,
        );
      } else {
        pl.visible = false;
        pl.intensity = 0;
      }
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

      // Authentic Minecraft first-person equip-raise, walking figure-8 bob & diagonal chop swing!
      if (this.equipProgress < 1) {
        this.equipProgress = Math.min(1, this.equipProgress + dt * 5.8);
      }
      const equipEase = 1 - (1 - this.equipProgress) * (1 - this.equipProgress);
      const equipDrop = -(1 - equipEase) * 0.34;
      const p = 1 - this.handSwing; // 0 -> 1 during active swing
      const swingCurve = this.handSwing > 0 ? Math.sin(Math.sqrt(p) * Math.PI) : 0;
      const swingDip = this.handSwing > 0 ? Math.sin(p * p * Math.PI) : 0;
      this.handGroup.position.set(
        bobX * 0.65 - swingCurve * 0.24,
        bobY * 0.55 + equipDrop - swingDip * 0.16,
        -swingCurve * 0.18,
      );
      this.handGroup.rotation.set(
        -swingCurve * 0.85,
        swingCurve * 0.36,
        swingCurve * 0.32,
      );

      // Throttled HUD snapshot emit (~9Hz keeps React completely off the 60fps hot path)
      this.hudEmitTick += dt;
      if (this.hudEmitTick >= 0.11) {
        this.hudEmitTick = 0;
        this.emitHud();
      }
    }

    // Main 3D world render + dedicated depth-cleared First-Person Hand overlay (zero wall clipping!)
    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);
    if (this.mode === 'playing' && this.cameraMode === 'first' && this.handGroup.visible) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.handScene, this.handCamera);
      this.renderer.autoClear = true;
    }

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
    const mountedMob = this.mountedMobId ? this.mobs.find((m) => m.id === this.mountedMobId) : null;
    const bossMob = this.mobs.find((m) => MOB_SPECS[m.type].boss && Math.hypot(m.x - this.px, m.z - this.pz) < 76);

    // 2025 Chase the Skies Player Locator Bar markers (relative yaw in radians)
    const rawLandmarks: { label: string; x: number; z: number; color: string }[] =
      this.world.dimension === 'overworld'
        ? [
            { label: 'Cổng Nether', x: 11, z: 10, color: '#c084fc' },
            { label: 'Làng Dân Làng', x: 39, z: 23, color: '#4ade80' },
            { label: 'Trại Bỏ Hoang 26.3', x: -24, z: 40, color: '#fbbf24' },
            { label: 'Trial Chamber', x: 39, z: 7, color: '#f97316' },
            { label: 'Ancient City', x: -25, z: 7, color: '#2dd4bf' },
            { label: 'Trail Ruins', x: 7, z: 39, color: '#facc15' },
            { label: 'Stronghold End', x: 7, z: -25, color: '#10b981' },
          ]
        : this.world.dimension === 'end'
          ? [
              { label: 'Cổng Về', x: 0, z: 0, color: '#facc15' },
              { label: 'Gateway', x: 32, z: 0, color: '#c084fc' },
              { label: 'End City', x: 103, z: 7, color: '#e879f9' },
            ]
          : [
              { label: 'Điểm Đến', x: 0, z: 0, color: '#ef4444' },
              { label: 'Pháo Đài Nether', x: 24, z: 24, color: '#fb923c' },
            ];

    if (bossMob) {
      rawLandmarks.push({ label: MOB_SPECS[bossMob.type].nameVi.split(' ')[0], x: bossMob.x, z: bossMob.z, color: '#f43f5e' });
    }

    const locatorMarkers = rawLandmarks.map((lm) => {
      const dx = lm.x - this.px;
      const dz = lm.z - this.pz;
      const dist = Math.hypot(dx, dz);
      // Camera forward vector is (-sin(yaw), -cos(yaw))
      const targetAngle = Math.atan2(-dx, -dz);
      let rel = targetAngle - this.yaw;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      return { label: lm.label, relAngle: rel, color: lm.color, dist: Math.round(dist) };
    });

    const darknessEff = this.world.player.effects.find((e) => e.id === 'darkness');
    const darknessIntensity = darknessEff ? Math.min(1, 0.55 + Math.sin(performance.now() * 0.004) * 0.25) : 0;

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
      mountedMob: mountedMob
        ? {
            type: mountedMob.type,
            nameVi: MOB_SPECS[mountedMob.type].nameVi,
            hp: mountedMob.hp,
            maxHp: mountedMob.maxHp,
            canFly: Boolean(MOB_SPECS[mountedMob.type].flying),
            canDash: mountedMob.type === 'camel',
            underwater: Boolean(MOB_SPECS[mountedMob.type].aquatic),
          }
        : null,
      bossBar: bossMob
        ? {
            name: MOB_SPECS[bossMob.type].nameVi,
            hp: Math.max(0, bossMob.hp),
            maxHp: bossMob.maxHp,
            color: bossMob.type === 'ender_dragon' || bossMob.type === 'wither' ? 'purple' : 'teal',
          }
        : null,
      locatorMarkers,
      darknessIntensity,
      enchantBookshelves: this.enchantBookshelves,
      spyglassZoom: this.spyglassZoom,
      touchBreakCircle:
        this.touchBreak && this.touchScreenBreakPos
          ? {
              x: this.touchScreenBreakPos.x,
              y: this.touchScreenBreakPos.y,
              progress: Math.max(0, Math.min(1, this.miningProgress)),
            }
          : null,
      offhand: this.world.player.offhand ? { ...this.world.player.offhand } : null,
      attackCooldown: this.playerAttackCooldown,
      activeChestKey: this.activeChestKey,
      activeChestSlots:
        this.activeChestKey && this.world.chests?.[this.activeChestKey]
          ? this.world.chests[this.activeChestKey].map((s) => (s ? { ...s } : null))
          : null,
      enderChestSlots: (this.world.enderChest || createEmptyChestSlots()).map((s) => (s ? { ...s } : null)),
      activeBrewingKey: this.activeBrewingKey,
      activeBrewingState:
        this.activeBrewingKey && this.world.brewingStands?.[this.activeBrewingKey]
          ? {
              ...this.world.brewingStands[this.activeBrewingKey],
              bottles: this.world.brewingStands[this.activeBrewingKey].bottles.map((b) =>
                b ? { ...b } : null,
              ),
            }
          : null,
      activeTradingVillager: (() => {
        if (!this.activeTradingMobId) return null;
        const v = this.mobs.find((m) => m.id === this.activeTradingMobId && m.type === 'villager');
        if (!v || !v.profession || !v.tradeOffers) return null;
        const hasHero = this.getEffectLevel('hero_of_the_village') > 0;
        return {
          mobId: v.id,
          profession: v.profession,
          nameVi: VILLAGER_PROFESSION_LABELS[v.profession],
          level: v.tradeLevel ?? 1,
          xp: v.tradeXp ?? 0,
          offers: applyHeroOfTheVillageDiscount(v.tradeOffers, hasHero),
        };
      })(),
      raidState: this.raidState
        ? {
            active: this.raidState.active,
            wave: this.raidState.wave,
            maxWaves: this.raidState.maxWaves,
            remaining: this.raidState.remainingInWave,
            total: this.raidState.totalInWave,
          }
        : null,
      advancementToast: this.advancementToast ? { ...this.advancementToast } : null,
      unlockedAdvancements: { ...(this.world.advancements || {}) },
    });
  }

  // --- Input Handlers ---
  private triggerJumpPress(): void {
    if (!this.world) return;
    // Camel Dash on Spacebar when mounted!
    if (this.mountedMobId && this.mountDashCooldown <= 0) {
      const m = this.mobs.find((x) => x.id === this.mountedMobId);
      if (m && m.type === 'camel') {
        this.camera.getWorldDirection(_camDir);
        this.vx = _camDir.x * 19;
        this.vz = _camDir.z * 19;
        this.vy = 6.2;
        this.mountDashCooldown = 2.5;
        soundEngine.playDash();
        this.spawnBreakParticles(this.px, this.py + 0.5, this.pz, 0xfde68a, 10);
        this.showItemToast('Lạc Đà Lướt Xung Phong (Dash)!');
        return;
      }
    }
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

  private normalizeKeyCode(e: KeyboardEvent): string {
    if (e.code) return e.code;
    const k = (e.key || '').toLowerCase();
    if (k === 'w' || k === 'ư') return 'KeyW';
    if (k === 'a' || k === 'ă' || k === 'â') return 'KeyA';
    if (k === 's') return 'KeyS';
    if (k === 'd' || k === 'đ') return 'KeyD';
    if (k === 'e' || k === 'ê') return 'KeyE';
    if (k === 't') return 'KeyT';
    if (k === 'r') return 'KeyR';
    if (k === ' ') return 'Space';
    if (k === 'shift') return 'ShiftLeft';
    if (k === 'control') return 'ControlLeft';
    return e.key || '';
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.mode !== 'playing') return;
    const activeEl = document.activeElement as HTMLElement | null;
    const tag = activeEl?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    // If a HUD button kept focus after click, blur it so Space/Enter move/jump instead of re-clicking the button!
    if (tag === 'BUTTON' && activeEl) {
      activeEl.blur();
    }

    const code = this.normalizeKeyCode(e);

    if (code === 'F3') {
      e.preventDefault();
      this.callbacks.onToggleF3();
      return;
    }
    if (code === 'F5') {
      e.preventDefault();
      this.cycleCameraMode();
      return;
    }
    if (code === 'Escape') {
      this.pcFreeLookActive = false;
      this.lastMousePos = null;
      if (this.mode === 'playing') this.callbacks.onPauseRequest();
      return;
    }
    if (this.paused || !this.world || this.world.player.hp <= 0) return;

    if (code === 'KeyF') {
      e.preventDefault();
      this.swapOffhand();
      return;
    }
    if (code === 'KeyE') {
      e.preventDefault();
      this.pcFreeLookActive = false;
      this.exitPointerLock();
      this.callbacks.onOpenContainer('inventory');
      return;
    }
    if (code === 'KeyT' || e.key === '/') {
      e.preventDefault();
      this.pcFreeLookActive = false;
      this.exitPointerLock();
      this.callbacks.onOpenChat(e.key === '/' ? '/' : '');
      return;
    }
    if (code.startsWith('Digit')) {
      const idx = parseInt(code.slice(5), 10) - 1;
      if (idx >= 0 && idx < 9) this.selectHotbarSlot(idx);
      return;
    }
    if (
      code === 'Space' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight'
    ) {
      e.preventDefault();
    }
    if (code === 'Space' && !this.keys.has('Space')) {
      this.triggerJumpPress();
    }
    this.keys.add(code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const code = this.normalizeKeyCode(e);
    this.keys.delete(code);
    if (e.code) this.keys.delete(e.code);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.mode !== 'playing' || this.paused) return;
    const sens = 0.0024 * this.settings.sensitivity;
    if (this.pointerLocked) {
      this.yaw -= e.movementX * sens;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * sens, -Math.PI * 0.495, Math.PI * 0.495);
      return;
    }
    // Seamless PC mouse-look fallback if Pointer Lock is blocked by browser/iframe or while dragging
    if (this.pcFreeLookActive || (e.buttons & 1) !== 0 || (e.buttons & 2) !== 0) {
      let dx = e.movementX;
      let dy = e.movementY;
      if (dx === 0 && dy === 0 && this.lastMousePos) {
        dx = e.clientX - this.lastMousePos.x;
        dy = e.clientY - this.lastMousePos.y;
      }
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      if (Math.abs(dx) < 180 && Math.abs(dy) < 180) {
        this.yaw -= dx * sens * 1.25;
        this.pitch = THREE.MathUtils.clamp(
          this.pitch - dy * sens * 1.25,
          -Math.PI * 0.495,
          Math.PI * 0.495,
        );
      }
    } else {
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.mode !== 'playing' || this.paused) return;
    if (document.activeElement instanceof HTMLElement && document.activeElement.tagName === 'BUTTON') {
      document.activeElement.blur();
    }
    this.lastMousePos = { x: e.clientX, y: e.clientY };
    if (!this.pointerLocked) {
      this.requestPointerLock();
      this.pcFreeLookActive = true;
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
      this.pcFreeLookActive = false;
    }
    this.emitHud();
  }

  private handleBlur(): void {
    this.keys.clear();
    this.mouseLeft = false;
    this.mouseRight = false;
    this.pcFreeLookActive = false;
    this.lastMousePos = null;
    this.touchBreak = false;
    this.touchScreenBreakPos = null;
    this.touchMoveX = 0;
    this.touchMoveZ = 0;
  }

  private handleResize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const aspect = Math.max(1, w) / Math.max(1, h);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.handCamera.aspect = aspect;
    this.handCamera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private getMapBlockRgb(blockId: number): [number, number, number] {
    switch (blockId) {
      case BLOCK.GRASS:
        return [125, 178, 56];
      case BLOCK.OAK_LEAVES:
        return [48, 126, 44];
      case BLOCK.WATER:
        return [60, 114, 224];
      case BLOCK.SAND:
        return [227, 214, 158];
      case BLOCK.SNOW:
        return [242, 246, 250];
      case BLOCK.ICE:
        return [148, 194, 252];
      case BLOCK.STONE:
      case BLOCK.COBBLESTONE:
      case BLOCK.GRAVEL:
      case BLOCK.BEDROCK:
        return [132, 132, 138];
      case BLOCK.DIRT:
      case BLOCK.OAK_LOG:
      case BLOCK.OAK_PLANKS:
      case BLOCK.SPRUCE_LOG:
      case BLOCK.SPRUCE_PLANKS:
        return [146, 108, 70];
      case BLOCK.BIRCH_LOG:
      case BLOCK.BIRCH_PLANKS:
        return [214, 200, 154];
      case BLOCK.LAVA:
      case BLOCK.MAGMA:
        return [238, 96, 26];
      case BLOCK.NETHERRACK:
      case BLOCK.NETHER_QUARTZ_ORE:
      case BLOCK.NETHER_GOLD_ORE:
      case BLOCK.NETHER_BRICKS:
        return [118, 42, 42];
      case BLOCK.CRIMSON_NYLIUM:
      case BLOCK.CRIMSON_STEM:
      case BLOCK.NETHER_WART_BLOCK:
      case BLOCK.CRIMSON_PLANKS:
        return [156, 36, 56];
      case BLOCK.WARPED_NYLIUM:
      case BLOCK.WARPED_STEM:
      case BLOCK.WARPED_WART_BLOCK:
      case BLOCK.WARPED_PLANKS:
        return [28, 138, 126];
      case BLOCK.SOUL_SAND:
      case BLOCK.SOUL_SOIL:
        return [92, 69, 54];
      case BLOCK.BASALT:
      case BLOCK.BLACKSTONE:
      case BLOCK.POLISHED_BLACKSTONE:
      case BLOCK.GILDED_BLACKSTONE:
      case BLOCK.OBSIDIAN:
      case BLOCK.CRYING_OBSIDIAN:
        return [58, 54, 68];
      case BLOCK.GLOWSTONE:
      case BLOCK.SHROOMLIGHT:
      case BLOCK.GOLD_BLOCK:
        return [236, 186, 60];
      case BLOCK.BRICKS:
      case BLOCK.TNT:
        return [168, 72, 56];
      case BLOCK.NETHER_PORTAL:
        return [148, 54, 224];
      default: {
        const def = BLOCK_DEFS[blockId];
        if (!def) return [134, 128, 118];
        if (def.key.includes('water') || def.key.includes('ice')) return [130, 178, 240];
        if (def.key.includes('sand')) return [224, 208, 152];
        if (def.key.includes('wood') || def.key.includes('plank') || def.key.includes('log')) {
          return [150, 112, 72];
        }
        if (def.key.includes('crimson') || def.key.includes('red_')) return [158, 46, 52];
        if (def.key.includes('warped') || def.key.includes('prismarine')) return [38, 140, 128];
        if (def.key.includes('leaf') || def.key.includes('grass') || def.key.includes('sapling')) {
          return [74, 146, 52];
        }
        if (def.key.includes('blackstone') || def.key.includes('netherite')) return [56, 52, 66];
        return [154, 148, 138];
      }
    }
  }

  public renderMinimap(canvas: HTMLCanvasElement, scaleBlocksPerPx = 2): void {
    if (!this.world || !this.generator) return;
    const size = 64;
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = ctx.createImageData(size, size);
    const data = img.data;
    const half = size >> 1;
    const centerX = Math.floor(this.px);
    const centerZ = Math.floor(this.pz);
    const dim = this.world.dimension;
    const prevRowH = new Int16Array(size);
    prevRowH.fill(dim === 'nether' ? 40 : SEA_LEVEL);

    for (let pz = 0; pz < size; pz++) {
      const wz = centerZ + (pz - half) * scaleBlocksPerPx;
      const cz = Math.floor(wz / CHUNK_SIZE);
      const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

      for (let px = 0; px < size; px++) {
        const wx = centerX + (px - half) * scaleBlocksPerPx;
        const cx = Math.floor(wx / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const entry = this.chunks.get(`${cx},${cz}`);

        let blockId: number = BLOCK.AIR;
        let topY = dim === 'nether' ? 32 : SEA_LEVEL;

        if (entry) {
          const col = entry.col;
          const startSec = dim === 'nether' ? 5 : SUBCHUNK_COUNT - 1;
          const startY = dim === 'nether' ? 86 : WORLD_HEIGHT_MAX - 1;
          for (let s = startSec; s >= 0; s--) {
            const sec = col.sections[s];
            if (!sec) continue;
            const yHi = Math.min((s << 4) + 15, startY);
            const yLo = s << 4;
            for (let y = yHi; y >= yLo; y--) {
              const id = sec[((y & 15) << 8) | (lz << 4) | lx];
              if (id !== BLOCK.AIR) {
                blockId = id;
                topY = y;
                break;
              }
            }
            if (blockId !== BLOCK.AIR) break;
          }
        } else if (dim === 'overworld') {
          topY = this.generator.getOverworldSurfaceY(wx, wz);
          const biome = this.generator.getOverworldBiome(wx, wz);
          if (topY < SEA_LEVEL) {
            blockId = BLOCK.WATER;
            topY = SEA_LEVEL;
          } else if (biome === 'desert') {
            blockId = BLOCK.SAND;
          } else if (biome === 'snowy_tundra') {
            blockId = BLOCK.SNOW;
          } else if (biome === 'mountains' && topY > 86) {
            blockId = BLOCK.STONE;
          } else if (biome === 'forest') {
            blockId = ((wx * 13 + wz * 7) & 3) === 0 ? BLOCK.OAK_LEAVES : BLOCK.GRASS;
          } else {
            blockId = BLOCK.GRASS;
          }
        } else if (dim === 'end') {
          const dist = Math.hypot(wx, wz);
          if (dist < 40) {
            blockId = BLOCK_BY_KEY['end_stone']?.id ?? BLOCK.SAND;
            topY = 60;
          } else {
            blockId = BLOCK.AIR;
            topY = 0;
          }
        } else {
          const biome = this.generator.getNetherBiome(wx, wz);
          topY = 44;
          if (biome === 'crimson_forest') blockId = BLOCK.CRIMSON_NYLIUM;
          else if (biome === 'warped_forest') blockId = BLOCK.WARPED_NYLIUM;
          else if (biome === 'soul_sand_valley') blockId = BLOCK.SOUL_SAND;
          else if (biome === 'basalt_deltas') blockId = BLOCK.BASALT;
          else blockId = BLOCK.NETHERRACK;
        }

        const [br, bg, bb] = this.getMapBlockRgb(blockId);
        // Authentic Minecraft filled-map 3-level height slope shading
        const dh = topY - prevRowH[px];
        prevRowH[px] = topY;
        const shade =
          blockId === BLOCK.WATER || blockId === BLOCK.LAVA
            ? (px + pz) % 2 === 0
              ? 1.0
              : 0.94
            : dh > 0
              ? 1.13
              : dh < 0
                ? 0.85
                : 1.0;

        // Subtle warm parchment tint blend for Minecraft map feel
        const idx = (pz * size + px) * 4;
        data[idx] = Math.min(255, Math.max(0, Math.round(br * shade)));
        data[idx + 1] = Math.min(255, Math.max(0, Math.round(bg * shade)));
        data[idx + 2] = Math.min(255, Math.max(0, Math.round(bb * shade)));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);

    // Draw nearby mobs as tiny crisp blips
    for (const mob of this.mobs) {
      const mx = Math.round(half + (mob.x - this.px) / scaleBlocksPerPx);
      const mz = Math.round(half + (mob.z - this.pz) / scaleBlocksPerPx);
      if (mx < 1 || mx >= size - 1 || mz < 1 || mz >= size - 1) continue;
      const spec = MOB_SPECS[mob.type];
      ctx.fillStyle = spec?.hostile ? '#ef4444' : '#fef08a';
      ctx.fillRect(mx - 1, mz - 1, 2, 2);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.saveCurrentWorld();

    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('orientationchange', this.onResizeBound);
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
    for (const tex of this.heldTexCache.values()) tex.dispose();
    this.heldTexCache.clear();
    for (const geo of this.heldItemGeoCache.values()) geo.dispose();
    this.heldItemGeoCache.clear();
    this.handDispose?.();
    if (this.playerRig) {
      this.scene.remove(this.playerRig.root);
      this.playerRig.dispose();
      this.playerRig = null;
    }
    this.starField.geometry.dispose();
    (this.starField.material as THREE.Material).dispose();
    this.sunMesh.geometry.dispose();
    (this.sunMesh.material as THREE.Material).dispose();
    this.moonMesh.geometry.dispose();
    (this.moonMesh.material as THREE.Material).dispose();
    this.opaqueMat.dispose();
    this.transMat.dispose();
    this.emissiveMat.dispose();
    this.particleGeo.dispose();
    this.projectileGeo.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
