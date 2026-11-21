import { EnchantmentId, ItemStack } from './types';

// =========================================================================
// 1. JAVA EDITION FISHING LOOT TABLE (Fish / Treasure / Junk + Luck & Lure)
// =========================================================================

export type FishingCategory = 'fish' | 'treasure' | 'junk';

export interface FishingCatchResult {
  category: FishingCategory;
  item: ItemStack;
  xp: number;
}

const TREASURE_ENCHANTS: readonly Partial<Record<EnchantmentId, number>>[] = [
  { mending: 1 },
  { unbreaking: 3 },
  { sharpness: 4 },
  { efficiency: 4 },
  { fortune: 3 },
  { looting: 3 },
  { protection: 4 },
  { power: 4 },
  { infinity: 1 },
];

export function getFishingWaitSeconds(lureLevel = 0, rng: () => number = Math.random): number {
  const base = 4.5 + rng() * 5.0; // 4.5..9.5s snappy gameplay wait
  return Math.max(1.2, base - Math.max(0, lureLevel) * 1.4);
}

/**
 * Official Minecraft: Java Edition fishing probability curve:
 * - Fish:     85% - 2% * luck
 * - Treasure:  5% + 2% * luck
 * - Junk:     10% - 2% * luck (clamped >= 0)
 */
export function rollFishingLoot(
  luckOfTheSeaLevel = 0,
  rng: () => number = Math.random,
): FishingCatchResult {
  const luck = Math.max(0, Math.min(3, luckOfTheSeaLevel));
  const treasureChance = 0.05 + 0.02 * luck;
  const junkChance = Math.max(0.02, 0.1 - 0.02 * luck);
  const roll = rng();

  if (roll < treasureChance) {
    const tRoll = rng();
    if (tRoll < 0.28) {
      const ench = TREASURE_ENCHANTS[Math.floor(rng() * TREASURE_ENCHANTS.length)];
      return {
        category: 'treasure',
        item: { itemId: 'enchanted_book', count: 1, enchants: { ...ench } },
        xp: 7,
      };
    }
    if (tRoll < 0.45) {
      return {
        category: 'treasure',
        item: { itemId: 'bow', count: 1, enchants: { power: 2 + Math.floor(rng() * 2), unbreaking: 2 } },
        xp: 6,
      };
    }
    if (tRoll < 0.62) return { category: 'treasure', item: { itemId: 'name_tag', count: 1 }, xp: 5 };
    if (tRoll < 0.78) return { category: 'treasure', item: { itemId: 'saddle', count: 1 }, xp: 5 };
    return { category: 'treasure', item: { itemId: 'nautilus_shell', count: 1 }, xp: 6 };
  }

  if (roll < treasureChance + junkChance) {
    const junkPool = ['leather', 'string', 'stick', 'bone', 'lily_pad', 'kelp', 'rotten_flesh'];
    const picked = junkPool[Math.floor(rng() * junkPool.length)];
    return { category: 'junk', item: { itemId: picked, count: 1 }, xp: 2 };
  }

  // Fish table (60% Cod, 25% Salmon, 13% Pufferfish, 2% Tropical Fish)
  const fRoll = rng();
  const fishId =
    fRoll < 0.6
      ? 'raw_cod'
      : fRoll < 0.85
        ? 'raw_salmon'
        : fRoll < 0.98
          ? 'pufferfish'
          : 'tropical_fish';
  return { category: 'fish', item: { itemId: fishId, count: 1 }, xp: 3 };
}

// =========================================================================
// 2. COMPOSTER (0..7 fill tiers -> Bone Meal)
// =========================================================================

export const COMPOSTABLE_CHANCES: Record<string, number> = {
  wheat_seeds: 0.3,
  oak_sapling: 0.3,
  cherry_sapling: 0.3,
  poplar_sapling: 0.3,
  oak_leaves: 0.3,
  cherry_leaves: 0.3,
  poplar_leaves: 0.3,
  kelp: 0.3,
  sweet_berries: 0.3,
  sugar_cane: 0.5,
  melon_slice: 0.5,
  wheat: 0.65,
  carrot: 0.65,
  potato: 0.65,
  apple: 0.65,
  dandelion: 0.65,
  poppy: 0.65,
  shelf_mushroom: 0.65,
  bread: 0.85,
  baked_potato: 0.85,
  cake: 1.0,
};

export interface CompostResult {
  accepted: boolean;
  level: number; // 0..7
  producedBoneMeal: boolean;
  increased: boolean;
}

export function stepComposter(
  currentLevel: number,
  itemId: string | null,
  rng: () => number = Math.random,
): CompostResult {
  // Clicking full composter harvests Bone Meal
  if (currentLevel >= 7) {
    return { accepted: true, level: 0, producedBoneMeal: true, increased: false };
  }
  if (!itemId) {
    return { accepted: false, level: currentLevel, producedBoneMeal: false, increased: false };
  }
  const chance = COMPOSTABLE_CHANCES[itemId];
  if (!chance) {
    return { accepted: false, level: currentLevel, producedBoneMeal: false, increased: false };
  }
  const increased = rng() < chance;
  const nextLevel = increased ? Math.min(7, currentLevel + 1) : currentLevel;
  return {
    accepted: true,
    level: nextLevel,
    producedBoneMeal: false,
    increased,
  };
}

// =========================================================================
// 3. CAULDRON (0..3 water levels, Water Bucket & Glass Bottle cycle)
// =========================================================================

export interface CauldronResult {
  changed: boolean;
  waterLevel: number; // 0..3
  giveItem?: string;
  consumeHeld?: boolean;
  messageVi?: string;
}

export function interactCauldron(waterLevel: number, heldItemId: string | null): CauldronResult {
  const lvl = Math.max(0, Math.min(3, waterLevel));
  if (heldItemId === 'water_bucket' && lvl < 3) {
    return {
      changed: true,
      waterLevel: 3,
      giveItem: 'bucket',
      consumeHeld: true,
      messageVi: 'Đã đổ đầy nước vào Vạc (3/3)!',
    };
  }
  if (heldItemId === 'bucket' && lvl === 3) {
    return {
      changed: true,
      waterLevel: 0,
      giveItem: 'water_bucket',
      consumeHeld: true,
      messageVi: 'Đã múc đầy Xô Nước từ Vạc!',
    };
  }
  if (heldItemId === 'glass_bottle' && lvl > 0) {
    return {
      changed: true,
      waterLevel: lvl - 1,
      giveItem: 'water_bottle',
      consumeHeld: true,
      messageVi: `Đã múc Chai Nước từ Vạc (còn ${lvl - 1}/3)!`,
    };
  }
  if (heldItemId === 'water_bottle' && lvl < 3) {
    return {
      changed: true,
      waterLevel: lvl + 1,
      giveItem: 'glass_bottle',
      consumeHeld: true,
      messageVi: `Đã đổ thêm nước vào Vạc (${lvl + 1}/3)!`,
    };
  }
  return { changed: false, waterLevel: lvl };
}

// =========================================================================
// 4. CAMPFIRE COOKING & BLAST FURNACE / SMOKER 2x SPEED
// =========================================================================

export const CAMPFIRE_COOK_MAP: Record<string, string> = {
  raw_porkchop: 'cooked_porkchop',
  raw_mutton: 'cooked_mutton',
  raw_rabbit: 'cooked_rabbit',
  raw_cod: 'cooked_cod',
  raw_salmon: 'cooked_salmon',
  potato: 'baked_potato',
  kelp: 'dried_kelp',
};

const BLAST_ORES = new Set<string>([
  'iron_ore',
  'gold_ore',
  'copper_ore',
  'raw_iron',
  'raw_gold',
  'raw_copper',
  'deepslate_iron_ore',
  'deepslate_gold_ore',
  'deepslate_copper_ore',
  'ancient_debris',
  'sulfur_ore',
  'cinnabar_ore',
]);

const SMOKER_FOODS = new Set<string>(Object.keys(CAMPFIRE_COOK_MAP));

export function getFurnaceSpeedMultiplier(
  stationKind: 'furnace' | 'blast_furnace' | 'smoker' | undefined,
  inputItemId: string | undefined,
): number {
  if (!inputItemId || !stationKind || stationKind === 'furnace') return 1.0;
  if (stationKind === 'blast_furnace') {
    if (BLAST_ORES.has(inputItemId) || inputItemId.startsWith('iron_') || inputItemId.startsWith('gold_') || inputItemId.startsWith('copper_')) {
      return 2.0;
    }
    return 0.75; // non-ore items smelt slower in specialized Blast Furnace
  }
  if (stationKind === 'smoker') {
    if (SMOKER_FOODS.has(inputItemId)) return 2.0;
    return 0.75;
  }
  return 1.0;
}

// =========================================================================
// 5. STONECUTTER DIRECT RECIPES (1 input -> N cut outputs)
// =========================================================================

export interface StonecutterOutput {
  itemId: string;
  count: number;
}

export const STONECUTTER_RECIPES: Record<string, StonecutterOutput[]> = {
  stone: [
    { itemId: 'stone_bricks', count: 1 },
    { itemId: 'chiseled_stone_bricks', count: 1 },
    { itemId: 'smooth_stone', count: 1 },
    { itemId: 'stone_slab', count: 2 },
    { itemId: 'stone_stairs', count: 1 },
  ],
  cobblestone: [
    { itemId: 'cobblestone_slab', count: 2 },
    { itemId: 'cobblestone_stairs', count: 1 },
    { itemId: 'cobblestone_wall', count: 1 },
  ],
  deepslate: [
    { itemId: 'polished_deepslate', count: 1 },
    { itemId: 'deepslate_bricks', count: 1 },
    { itemId: 'deepslate_tiles', count: 1 },
    { itemId: 'chiseled_deepslate', count: 1 },
  ],
  cobbled_deepslate: [
    { itemId: 'polished_deepslate', count: 1 },
    { itemId: 'deepslate_bricks', count: 1 },
    { itemId: 'deepslate_tiles', count: 1 },
  ],
  copper_block: [
    { itemId: 'cut_copper', count: 4 },
    { itemId: 'cut_copper_slab', count: 8 },
    { itemId: 'cut_copper_stairs', count: 4 },
    { itemId: 'copper_grate', count: 4 },
  ],
  blackstone: [
    { itemId: 'polished_blackstone', count: 1 },
    { itemId: 'polished_blackstone_bricks', count: 1 },
    { itemId: 'chiseled_polished_blackstone', count: 1 },
  ],
  quartz_block: [
    { itemId: 'quartz_pillar', count: 1 },
    { itemId: 'chiseled_quartz_block', count: 1 },
    { itemId: 'smooth_quartz', count: 1 },
  ],
  calcite: [
    { itemId: 'polished_calcite', count: 1 },
    { itemId: 'calcite_bricks', count: 1 },
  ],
};

export function getStonecutterOutputs(inputItemId: string | null | undefined): StonecutterOutput[] {
  if (!inputItemId) return [];
  return STONECUTTER_RECIPES[inputItemId] ?? [];
}
