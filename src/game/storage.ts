import {
  BrewingStandState,
  CachedResourcePack,
  DEFAULT_GAMERULES,
  DEFAULT_VIDEO_SETTINGS,
  GameMode,
  ItemStack,
  VideoSettings,
  WORLD_BORDER_DEFAULT,
  WorldSave,
} from './types';

export const CURRENT_SAVE_SCHEMA_VERSION = 2;

export function createEmptyChestSlots(): (ItemStack | null)[] {
  return new Array(27).fill(null);
}

export function createEmptyBrewingState(): BrewingStandState {
  return {
    ingredient: null,
    fuel: null,
    bottles: [null, null, null],
    fuelCharges: 0,
    brewProgress: 0,
  };
}

function normalizeSlotArray(arr: unknown, length: number): (ItemStack | null)[] {
  const out: (ItemStack | null)[] = new Array(length).fill(null);
  if (Array.isArray(arr)) {
    for (let i = 0; i < Math.min(length, arr.length); i++) {
      const s = arr[i] as ItemStack | null;
      if (s && typeof s.itemId === 'string' && typeof s.count === 'number' && s.count > 0) {
        out[i] = { ...s, enchants: s.enchants ? { ...s.enchants } : undefined };
      }
    }
  }
  return out;
}

export function migrateWorldSave(raw: WorldSave): WorldSave {
  const chests: Record<string, (ItemStack | null)[]> = {};
  if (raw.chests && typeof raw.chests === 'object') {
    for (const [k, v] of Object.entries(raw.chests)) {
      chests[k] = normalizeSlotArray(v, 27);
    }
  }
  const brewingStands: Record<string, BrewingStandState> = {};
  if (raw.brewingStands && typeof raw.brewingStands === 'object') {
    for (const [k, v] of Object.entries(raw.brewingStands)) {
      if (v && typeof v === 'object') {
        brewingStands[k] = {
          ingredient: v.ingredient ? { ...v.ingredient } : null,
          fuel: v.fuel ? { ...v.fuel } : null,
          bottles: normalizeSlotArray(v.bottles, 3),
          fuelCharges: typeof v.fuelCharges === 'number' ? Math.max(0, v.fuelCharges) : 0,
          brewProgress: typeof v.brewProgress === 'number' ? Math.max(0, Math.min(1, v.brewProgress)) : 0,
        };
      }
    }
  }

  return {
    ...raw,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    gamerules: { ...DEFAULT_GAMERULES, ...(raw.gamerules || {}) },
    worldBorderSize: raw.worldBorderSize || WORLD_BORDER_DEFAULT,
    worldBorderCenter: raw.worldBorderCenter || [0, 0],
    player: {
      ...raw.player,
      inventory: normalizeSlotArray(raw.player?.inventory, 36),
      armor: normalizeSlotArray(raw.player?.armor, 4),
      offhand: raw.player?.offhand ? { ...raw.player.offhand } : null,
      effects: Array.isArray(raw.player?.effects) ? [...raw.player.effects] : [],
    },
    overworldMods: raw.overworldMods || {},
    netherMods: raw.netherMods || {},
    endMods: raw.endMods || {},
    chiseledBookshelves: raw.chiseledBookshelves || {},
    chests,
    enderChest: normalizeSlotArray(raw.enderChest, 27),
    brewingStands,
    redstoneStates: raw.redstoneStates || {},
  };
}

const DB_NAME = 'nethercraft_116_db';
const DB_VERSION = 1;
const STORE_PACKS = 'resource_packs';
const STORE_WORLDS = 'worlds';
const SETTINGS_KEY = 'nethercraft_116_video_settings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PACKS)) {
        db.createObjectStore(STORE_PACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_WORLDS)) {
        db.createObjectStore(STORE_WORLDS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveResourcePack(pack: CachedResourcePack): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PACKS, 'readwrite');
    tx.objectStore(STORE_PACKS).put(pack);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadResourcePackById(id: string): Promise<CachedResourcePack | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PACKS, 'readonly');
      const req = tx.objectStore(STORE_PACKS).get(id);
      req.onsuccess = () => resolve((req.result as CachedResourcePack) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function loadActiveResourcePack(): Promise<CachedResourcePack | null> {
  return loadResourcePackById('active_pack');
}

export async function clearResourcePackCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PACKS, 'readwrite');
    tx.objectStore(STORE_PACKS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listWorlds(): Promise<WorldSave[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_WORLDS, 'readonly');
      const req = tx.objectStore(STORE_WORLDS).getAll();
      req.onsuccess = () => {
        const list = ((req.result as WorldSave[]) || []).map(migrateWorldSave);
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveWorld(world: WorldSave): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_WORLDS, 'readwrite');
    tx.objectStore(STORE_WORLDS).put({ ...world, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteWorld(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_WORLDS, 'readwrite');
    tx.objectStore(STORE_WORLDS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function createStarterInventory(mode: GameMode): (ItemStack | null)[] {
  const inv: (ItemStack | null)[] = new Array(36).fill(null);
  if (mode === 'creative') {
    inv[0] = { itemId: 'netherite_pickaxe', count: 1 };
    inv[1] = { itemId: 'netherite_sword', count: 1 };
    inv[2] = { itemId: 'obsidian', count: 64 };
    inv[3] = { itemId: 'flint_and_steel', count: 1 };
    inv[4] = { itemId: 'crimson_planks', count: 64 };
    inv[5] = { itemId: 'warped_planks', count: 64 };
    inv[6] = { itemId: 'blackstone', count: 64 };
    inv[7] = { itemId: 'shroomlight', count: 64 };
    inv[8] = { itemId: 'smithing_table', count: 1 };
  } else {
    // Practical 1.16 survival starter kit so players can build, craft & explore Nether quickly
    inv[0] = { itemId: 'iron_pickaxe', count: 1 };
    inv[1] = { itemId: 'iron_sword', count: 1 };
    inv[2] = { itemId: 'oak_planks', count: 16 };
    inv[3] = { itemId: 'cobblestone', count: 16 };
    inv[4] = { itemId: 'torch', count: 16 };
    inv[5] = { itemId: 'cooked_porkchop', count: 8 };
    inv[6] = { itemId: 'flint_and_steel', count: 1 };
    inv[7] = { itemId: 'obsidian', count: 4 };
    inv[8] = { itemId: 'crafting_table', count: 1 };
  }
  return inv;
}

export function createNewWorldRecord(opts: {
  name: string;
  seed?: number;
  gameMode: GameMode;
  cheatsEnabled: boolean;
}): WorldSave {
  const seed = opts.seed !== undefined && Number.isFinite(opts.seed)
    ? Math.floor(opts.seed)
    : Math.floor(Math.random() * 2_000_000_000) - 1_000_000_000;
  const now = Date.now();
  return {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    id: `w_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: opts.name.trim() || 'Thế Giới Minecraft 26.3',
    seed,
    gameMode: opts.gameMode,
    difficulty: 'normal',
    cheatsEnabled: opts.cheatsEnabled,
    dimension: 'overworld',
    createdAt: now,
    updatedAt: now,
    timeOfDay: 1200, // Bright morning
    weather: 'clear',
    worldBorderSize: WORLD_BORDER_DEFAULT,
    worldBorderCenter: [0, 0],
    player: {
      x: 2.5,
      y: 80,
      z: 2.5,
      yaw: 0,
      pitch: 0,
      hp: 20,
      maxHp: 20,
      hunger: 20,
      oxygen: 20,
      xp: 0,
      level: 0,
      selectedSlot: 0,
      spawnPoint: [2.5, 80, 2.5],
      spawnDimension: 'overworld',
      worldSpawn: [2.5, 80, 2.5],
      inventory: createStarterInventory(opts.gameMode),
      armor: [null, null, null, null],
      offhand: null,
      effects: [],
    },
    gamerules: { ...DEFAULT_GAMERULES },
    furnace: {
      input: null,
      fuel: null,
      output: null,
      burnTime: 0,
      burnMax: 0,
      cookProgress: 0,
    },
    overworldMods: {},
    netherMods: {},
    endMods: {},
    chiseledBookshelves: {},
    chests: {},
    enderChest: createEmptyChestSlots(),
    brewingStands: {},
    redstoneStates: {},
  };
}

export function exportWorldToFile(world: WorldSave): void {
  const payload = JSON.stringify(
    { format: 'nethercraft-26.3-world', version: CURRENT_SAVE_SCHEMA_VERSION, world: migrateWorldSave(world) },
    null,
    2,
  );
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = world.name.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 32) || 'world_263';
  a.href = url;
  a.download = `${safeName}.mc263.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function parseImportedWorldFile(file: File): Promise<WorldSave> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const w: WorldSave = parsed?.world ?? parsed;
  if (!w || typeof w.seed !== 'number' || !w.player || !Array.isArray(w.player.inventory)) {
    throw new Error('File không đúng định dạng thế giới Minecraft (.json)');
  }
  const now = Date.now();
  return migrateWorldSave({
    ...w,
    id: `w_imp_${now}_${Math.random().toString(36).slice(2, 6)}`,
    updatedAt: now,
  });
}

export function loadVideoSettings(): VideoSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_VIDEO_SETTINGS };
    return { ...DEFAULT_VIDEO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_VIDEO_SETTINGS };
  }
}

export function saveVideoSettings(settings: VideoSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}
