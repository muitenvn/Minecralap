export type DimensionId = 'overworld' | 'nether' | 'end';
export type GameMode = 'survival' | 'creative' | 'adventure' | 'spectator';
export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';
export type WeatherType = 'clear' | 'rain' | 'thunder';
export type ContainerType =
  | 'none'
  | 'inventory'
  | 'crafting'
  | 'furnace'
  | 'smithing'
  | 'enchanting'
  | 'anvil'
  | 'chest'
  | 'ender_chest'
  | 'brewing'
  | 'trading'
  | 'stonecutter';

export type VillagerProfession =
  | 'farmer'
  | 'librarian'
  | 'weaponsmith'
  | 'armorer'
  | 'cleric'
  | 'toolsmith';

export interface VillagerTradeOffer {
  id: string;
  buyA: ItemStack;
  buyB?: ItemStack;
  sell: ItemStack;
  maxUses: number;
  uses: number;
  xpReward: number;
}

export interface BrewingStandState {
  ingredient: ItemStack | null;
  fuel: ItemStack | null;
  bottles: (ItemStack | null)[]; // 3 bottle slots
  fuelCharges: number; // 0..20 (1 blaze powder = 20 charges)
  brewProgress: number; // 0..1
}

export type EnchantmentId =
  | 'efficiency'
  | 'sharpness'
  | 'smite'
  | 'unbreaking'
  | 'protection'
  | 'fire_protection'
  | 'feather_falling'
  | 'thorns'
  | 'fortune'
  | 'silk_touch'
  | 'fire_aspect'
  | 'knockback'
  | 'looting'
  | 'mending'
  | 'power'
  | 'flame'
  | 'infinity'
  | 'multishot'
  | 'density'
  | 'wind_burst'
  | 'loyalty'
  | 'channeling';

export type EffectId =
  | 'speed'
  | 'slowness'
  | 'haste'
  | 'strength'
  | 'jump_boost'
  | 'regeneration'
  | 'resistance'
  | 'fire_resistance'
  | 'water_breathing'
  | 'night_vision'
  | 'levitation'
  | 'slow_falling'
  | 'darkness'
  | 'hero_of_the_village';

export interface ActiveEffect {
  id: EffectId;
  amplifier: number; // 0 = level I
  remainingSec: number;
}

export interface ItemStack {
  itemId: string;
  count: number;
  durability?: number;
  enchants?: Partial<Record<EnchantmentId, number>>;
  trim?: string;
}

export interface GameRules {
  keepInventory: boolean;
  doDaylightCycle: boolean;
  doWeatherCycle: boolean;
  doMobSpawning: boolean;
  fallDamage: boolean;
  fireDamage: boolean;
  drowningDamage: boolean;
  naturalRegeneration: boolean;
}

export type TexturePreset = 'hd_plus' | 'current' | 'original';
export type CameraMode = 'first' | 'third_back' | 'third_front';
export type SkinArmModel = 'classic' | 'slim';

export interface PlayerModelCode {
  scale: number;
  headScale: number;
  armWidth: number; // 4 for classic Steve, 3 for slim Alex
  limbLength: number;
  showOverlays: boolean;
  showCape: boolean;
  capeColor: string;
  swingSpeed: number;
  externalGlbUrl: string;
  externalScale: number;
  externalYOffset: number;
  externalRotY: number;
}

export const DEFAULT_MODEL_CODE: PlayerModelCode = {
  scale: 1.0,
  headScale: 1.0,
  armWidth: 4,
  limbLength: 1.0,
  showOverlays: true,
  showCape: false,
  capeColor: '#991b1b',
  swingSpeed: 1.0,
  externalGlbUrl: '',
  externalScale: 1.0,
  externalYOffset: 0,
  externalRotY: Math.PI,
};

export interface PlayerSkinConfig {
  id: string;
  name: string;
  source: 'builtin-steve' | 'builtin-alex' | 'builtin-netherite' | 'upload' | 'url' | 'username';
  armModel: SkinArmModel;
  skinDataUrl: string; // 64x64 PNG data URL
  sourceRef?: string; // username or URL
  modelCode: PlayerModelCode;
}

export type MinimapMode = 'compact' | 'expanded' | 'off';
export type TouchControlStyle = 'dpad_buttons' | 'touch_screen';

export interface VideoSettings {
  renderDistance: number; // 2..8 chunks
  fov: number; // 50..110
  graphics: 'fast' | 'fancy';
  smoothLighting: boolean;
  brightness: number; // 0.3..1.3 (Moody..Bright)
  clouds: 'off' | 'fast' | 'fancy';
  particles: 'all' | 'decreased' | 'minimal';
  viewBobbing: boolean;
  shadows: boolean;
  guiScale: 'auto' | 'small' | 'medium' | 'large';
  sensitivity: number; // 0.3..2.5
  volume: number; // 0..1
  muted: boolean;
  touchMode: 'auto' | 'on' | 'off';
  touchControlStyle?: TouchControlStyle;
  texturePreset: TexturePreset;
  minimapMode: MinimapMode;
}

export const DEFAULT_GAMERULES: GameRules = {
  keepInventory: false,
  doDaylightCycle: true,
  doWeatherCycle: true,
  doMobSpawning: true,
  fallDamage: true,
  fireDamage: true,
  drowningDamage: true,
  naturalRegeneration: true,
};

const IS_COMPACT_VIEW = typeof window !== 'undefined' && window.innerWidth < 820;

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  renderDistance: IS_COMPACT_VIEW ? 3 : 4,
  fov: 75,
  graphics: IS_COMPACT_VIEW ? 'fast' : 'fancy',
  smoothLighting: true,
  brightness: 0.95,
  clouds: 'fast',
  particles: 'decreased',
  viewBobbing: true,
  shadows: false,
  guiScale: 'auto',
  sensitivity: 1.0,
  volume: 0.75,
  muted: false,
  touchMode: 'auto',
  touchControlStyle: 'dpad_buttons',
  texturePreset: 'hd_plus',
  minimapMode: 'compact',
};

export interface FurnaceState {
  input: ItemStack | null;
  fuel: ItemStack | null;
  output: ItemStack | null;
  burnTime: number;
  burnMax: number;
  cookProgress: number; // 0..1
  stationKind?: 'furnace' | 'blast_furnace' | 'smoker';
}

export interface WorldSave {
  schemaVersion?: number;
  id: string;
  name: string;
  seed: number;
  gameMode: GameMode;
  difficulty: Difficulty;
  cheatsEnabled: boolean;
  dimension: DimensionId;
  createdAt: number;
  updatedAt: number;
  timeOfDay: number; // 0..24000 ticks
  weather: WeatherType;
  worldBorderSize: number; // default 29999984 (radius)
  worldBorderCenter: [number, number];
  player: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    hp: number;
    maxHp: number;
    hunger: number;
    oxygen: number;
    xp: number;
    level: number;
    selectedSlot: number;
    spawnPoint: [number, number, number];
    spawnDimension: DimensionId;
    worldSpawn: [number, number, number];
    inventory: (ItemStack | null)[]; // 36 slots (0..8 hotbar, 9..35 main)
    armor: (ItemStack | null)[]; // 4 slots: helmet, chestplate, leggings, boots
    offhand?: ItemStack | null;
    effects: ActiveEffect[];
  };
  gamerules: GameRules;
  furnace: FurnaceState;
  // Sparse block modifications keyed by "x,y,z" -> blockId
  overworldMods: Record<string, number>;
  netherMods: Record<string, number>;
  endMods?: Record<string, number>;
  chiseledBookshelves?: Record<string, string[]>;
  // Persistent container states keyed by "dim:x,y,z"
  chests?: Record<string, (ItemStack | null)[]>;
  enderChest?: (ItemStack | null)[];
  brewingStands?: Record<string, BrewingStandState>;
  redstoneStates?: Record<string, number>;
  composterLevels?: Record<string, number>;
  cauldronLevels?: Record<string, number>;
  advancements?: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  text: string;
  tone: 'system' | 'chat' | 'success' | 'error' | 'gold';
  timestamp: number;
}

export interface TitleBanner {
  title: string;
  subtitle: string;
  actionbar: string;
  expiresAt: number;
}

export interface TargetBlockInfo {
  x: number;
  y: number;
  z: number;
  blockId: number;
  name: string;
  face: [number, number, number];
}

export interface HudSnapshot {
  fps: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  dimension: DimensionId;
  biome: string;
  gameMode: GameMode;
  difficulty: Difficulty;
  weather: WeatherType;
  timeOfDay: number;
  hp: number;
  maxHp: number;
  armorPoints: number;
  hunger: number;
  oxygen: number;
  underwater: boolean;
  xp: number;
  level: number;
  selectedSlot: number;
  cameraMode: CameraMode;
  flying: boolean;
  sprinting: boolean;
  sneaking: boolean;
  portalProgress: number; // 0..1
  damageFlash: number; // 0..1
  dead: boolean;
  pointerLocked: boolean;
  loadedChunks: number;
  mobCount: number;
  worldBorderRadius: number;
  targetBlock: TargetBlockInfo | null;
  effects: ActiveEffect[];
  inventory: (ItemStack | null)[];
  armor: (ItemStack | null)[];
  furnace: FurnaceState;
  heldItemToast: string;
  heldItemToastAt: number;
  mountedMob?: {
    type: string;
    nameVi: string;
    hp: number;
    maxHp: number;
    canFly: boolean;
    canDash: boolean;
    underwater: boolean;
  } | null;
  bossBar?: {
    name: string;
    hp: number;
    maxHp: number;
    color: 'purple' | 'teal';
  } | null;
  locatorMarkers?: {
    label: string;
    relAngle: number; // -PI..PI relative to player facing
    dist: number;
    color: string;
  }[];
  darknessIntensity?: number; // 0..1
  enchantBookshelves?: number; // 0..15 bookshelves around last opened Enchanting Table
  spyglassZoom?: boolean;
  touchBreakCircle?: { x: number; y: number; progress: number } | null;
  offhand?: ItemStack | null;
  attackCooldown?: number; // 0..1 Java Edition weapon cooldown readiness
  activeChestKey?: string | null;
  activeChestSlots?: (ItemStack | null)[] | null;
  enderChestSlots?: (ItemStack | null)[];
  activeBrewingKey?: string | null;
  activeBrewingState?: BrewingStandState | null;
  activeTradingVillager?: {
    mobId: string;
    profession: VillagerProfession;
    nameVi: string;
    level: number;
    xp: number;
    offers: VillagerTradeOffer[];
  } | null;
  raidState?: {
    active: boolean;
    wave: number;
    maxWaves: number;
    remaining: number;
    total: number;
  } | null;
  advancementToast?: {
    id: string;
    titleVi: string;
    descVi: string;
    iconColor: string;
    at: number;
  } | null;
  unlockedAdvancements?: Record<string, number>;
}

export interface PackManifestFile {
  key: string;
  category: 'block' | 'gui';
  path: string;
  bytes: number;
  sha256: string;
}

export interface PackManifest {
  id: string;
  name: string;
  version: string;
  pack_format: number;
  description: string;
  totalBytes: number;
  fileCount: number;
  files: PackManifestFile[];
}

export interface CachedResourcePack {
  id: string;
  name: string;
  version: string;
  sourceLabel: string;
  sourceType: 'faithful-32x' | 'hd-32' | 'github-default' | 'original-classic' | 'github-raw' | 'zip-upload';
  sourceUrl?: string;
  downloadedAt: number;
  totalBytes: number;
  blockBlobs: Record<string, Blob>; // textureKey -> PNG Blob
  itemBlobs?: Record<string, Blob>; // itemId -> PNG Blob
  entityBlobs?: Record<string, Blob>; // mob entity key -> PNG Blob
  guiBlobs: Record<string, Blob>; // widgets, icons, options_background, container_*, map_background, map_icons
  soundBlobs?: Record<string, Blob>; // relative sound path without ext (e.g. "dig/stone1", "random/click_stereo") -> audio Blob
  soundsRootUrl?: string; // optional GitHub raw sounds root for custom GitHub resource packs
}

export const WORLD_BORDER_DEFAULT = 29_999_984;
export const WORLD_HEIGHT_OVERWORLD = 256;
export const WORLD_HEIGHT_NETHER_ROOF = 127;
export const WORLD_HEIGHT_MAX = 256;
export const CHUNK_SIZE = 16;
export const SUBCHUNK_COUNT = 16;
