import { ITEM_DEFS } from './blocks';
import { EnchantmentId, ItemStack } from './types';

export type EnchantCategory =
  | 'sword'
  | 'axe'
  | 'pickaxe'
  | 'shovel'
  | 'hoe'
  | 'bow'
  | 'crossbow'
  | 'trident'
  | 'mace'
  | 'spear'
  | 'armor'
  | 'boots'
  | 'shield'
  | 'book'
  | 'fishing_rod';

export interface EnchantMeta {
  id: EnchantmentId;
  nameVi: string;
  maxLevel: number;
  categories: EnchantCategory[];
  incompatible?: EnchantmentId[];
}

export const ENCHANT_META: Record<EnchantmentId, EnchantMeta> = {
  sharpness: {
    id: 'sharpness',
    nameVi: 'Sắc Bén',
    maxLevel: 5,
    categories: ['sword', 'axe', 'spear', 'book'],
    incompatible: ['smite'],
  },
  smite: {
    id: 'smite',
    nameVi: 'Trừng Phạt',
    maxLevel: 5,
    categories: ['sword', 'axe', 'mace', 'book'],
    incompatible: ['sharpness'],
  },
  fire_aspect: {
    id: 'fire_aspect',
    nameVi: 'Chém Lửa',
    maxLevel: 2,
    categories: ['sword', 'mace', 'spear', 'book'],
  },
  knockback: {
    id: 'knockback',
    nameVi: 'Đánh Bật',
    maxLevel: 2,
    categories: ['sword', 'spear', 'book'],
  },
  looting: {
    id: 'looting',
    nameVi: 'Nhặt Đồ',
    maxLevel: 3,
    categories: ['sword', 'spear', 'book'],
  },
  efficiency: {
    id: 'efficiency',
    nameVi: 'Hiệu Suất',
    maxLevel: 5,
    categories: ['pickaxe', 'axe', 'shovel', 'hoe', 'book'],
  },
  fortune: {
    id: 'fortune',
    nameVi: 'Gia Tài',
    maxLevel: 3,
    categories: ['pickaxe', 'axe', 'shovel', 'hoe', 'book'],
    incompatible: ['silk_touch'],
  },
  silk_touch: {
    id: 'silk_touch',
    nameVi: 'Chạm Mềm',
    maxLevel: 1,
    categories: ['pickaxe', 'axe', 'shovel', 'hoe', 'book'],
    incompatible: ['fortune'],
  },
  unbreaking: {
    id: 'unbreaking',
    nameVi: 'Bền Bỉ',
    maxLevel: 3,
    categories: [
      'sword', 'axe', 'pickaxe', 'shovel', 'hoe',
      'bow', 'crossbow', 'trident', 'mace', 'spear',
      'armor', 'boots', 'shield', 'fishing_rod', 'book',
    ],
  },
  mending: {
    id: 'mending',
    nameVi: 'Sửa Chữa',
    maxLevel: 1,
    categories: [
      'sword', 'axe', 'pickaxe', 'shovel', 'hoe',
      'bow', 'crossbow', 'trident', 'mace', 'spear',
      'armor', 'boots', 'shield', 'fishing_rod', 'book',
    ],
  },
  protection: {
    id: 'protection',
    nameVi: 'Bảo Vệ',
    maxLevel: 4,
    categories: ['armor', 'boots', 'book'],
    incompatible: ['fire_protection'],
  },
  fire_protection: {
    id: 'fire_protection',
    nameVi: 'Chống Lửa',
    maxLevel: 4,
    categories: ['armor', 'boots', 'book'],
    incompatible: ['protection'],
  },
  feather_falling: {
    id: 'feather_falling',
    nameVi: 'Rơi Êm',
    maxLevel: 4,
    categories: ['boots', 'book'],
  },
  thorns: {
    id: 'thorns',
    nameVi: 'Gai Nhọn',
    maxLevel: 3,
    categories: ['armor', 'boots', 'book'],
  },
  power: {
    id: 'power',
    nameVi: 'Sức Mạnh',
    maxLevel: 5,
    categories: ['bow', 'book'],
  },
  flame: {
    id: 'flame',
    nameVi: 'Mũi Tên Lửa',
    maxLevel: 1,
    categories: ['bow', 'book'],
  },
  infinity: {
    id: 'infinity',
    nameVi: 'Vô Hạn',
    maxLevel: 1,
    categories: ['bow', 'book'],
    incompatible: ['mending'],
  },
  multishot: {
    id: 'multishot',
    nameVi: 'Đa Tiễn',
    maxLevel: 1,
    categories: ['crossbow', 'book'],
  },
  density: {
    id: 'density',
    nameVi: 'Mật Độ',
    maxLevel: 5,
    categories: ['mace', 'book'],
  },
  wind_burst: {
    id: 'wind_burst',
    nameVi: 'Bùng Nổ Gió',
    maxLevel: 3,
    categories: ['mace', 'book'],
  },
  loyalty: {
    id: 'loyalty',
    nameVi: 'Trung Thành',
    maxLevel: 3,
    categories: ['trident', 'book'],
  },
  channeling: {
    id: 'channeling',
    nameVi: 'Dẫn Sét',
    maxLevel: 1,
    categories: ['trident', 'book'],
  },
};

const ROMANS = ['', 'I', 'II', 'III', 'IV', 'V'];

export function toRoman(level: number): string {
  return ROMANS[Math.max(1, Math.min(5, Math.round(level)))] || String(level);
}

export function formatEnchantLabel(id: EnchantmentId, level: number): string {
  const meta = ENCHANT_META[id];
  if (!meta) return `${id} ${toRoman(level)}`;
  return meta.maxLevel === 1 ? meta.nameVi : `${meta.nameVi} ${toRoman(level)}`;
}

export function formatItemEnchants(enchants?: Partial<Record<EnchantmentId, number>>): string[] {
  if (!enchants) return [];
  return (Object.entries(enchants) as [EnchantmentId, number][])
    .filter(([, lv]) => lv > 0)
    .map(([id, lv]) => formatEnchantLabel(id, lv));
}

export function getItemEnchantCategories(itemId: string): EnchantCategory[] {
  const def = ITEM_DEFS[itemId];
  if (!def) return [];
  if (itemId === 'book' || itemId === 'enchanted_book') return ['book'];
  if (itemId === 'bow') return ['bow'];
  if (itemId === 'crossbow') return ['crossbow'];
  if (itemId === 'trident') return ['trident'];
  if (itemId === 'mace') return ['mace'];
  if (itemId.endsWith('_spear')) return ['spear'];
  if (itemId === 'shield' || itemId === 'elytra') return ['shield'];
  if (itemId === 'fishing_rod') return ['fishing_rod'];
  if (def.toolKind === 'sword') return ['sword'];
  if (def.toolKind === 'axe') return ['axe'];
  if (def.toolKind === 'pickaxe') return ['pickaxe'];
  if (def.toolKind === 'shovel') return ['shovel'];
  if (def.toolKind === 'hoe') return ['hoe'];
  if (def.armorSlot === 3) return ['armor', 'boots'];
  if (def.armorSlot !== undefined) return ['armor'];
  return [];
}

export function isEnchantableItem(itemId: string): boolean {
  return getItemEnchantCategories(itemId).length > 0;
}

export function getApplicableEnchants(itemId: string): EnchantMeta[] {
  const cats = getItemEnchantCategories(itemId);
  if (cats.length === 0) return [];
  return Object.values(ENCHANT_META).filter((m) =>
    m.categories.some((c) => cats.includes(c)),
  );
}

export interface EnchantOffer {
  tier: 0 | 1 | 2;
  minLevel: number;
  xpCost: number;
  lapisCost: number;
  primaryId: EnchantmentId;
  primaryLevel: number;
  bonus?: { id: EnchantmentId; level: number };
  runes: string;
}

const RUNE_WORDS = [
  'ᛟᚱᛒ ᚦᛖ ᛖᚾᛞ',
  'ᛊᛏᛟᚾᛖ ᚠᛁᚱᛖ',
  'ᚹᛁᚾᛞ ᛊᚺᚨᚱᛈ',
  'ᛞᛖᛖᛈ ᛊᚲᚢᛚᚲ',
  'ᚺᛖᚨᚹᛖᚾ ᛒᛚᚨᛞᛖ',
  'ᛊᛈᛁᚱᛁᛏ ᛚᛁᚷᚺᛏ',
];

function seededHash(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}

export function generateEnchantOffers(
  itemId: string,
  bookshelves: number,
  seed: number,
): EnchantOffer[] {
  const pool = getApplicableEnchants(itemId);
  if (pool.length === 0) return [];

  const shelves = Math.max(0, Math.min(15, bookshelves));
  const tierReq = [
    Math.max(1, Math.round(1 + shelves * 0.45)),
    Math.max(3, Math.round(4 + shelves * 0.95)),
    Math.max(6, Math.round(8 + shelves * 1.48)), // reaches 30 at 15 bookshelves!
  ];

  const offers: EnchantOffer[] = [];
  for (let t = 0 as 0 | 1 | 2; t < 3; t = (t + 1) as 0 | 1 | 2) {
    const r1 = seededHash(seed * 31 + t * 97 + itemId.length * 13);
    const r2 = seededHash(seed * 53 + t * 131 + itemId.charCodeAt(0) * 7);
    const primary = pool[Math.floor(r1 * pool.length) % pool.length];
    const powerRatio = (tierReq[t] / 30) * 0.78 + r2 * 0.35;
    const primaryLevel = Math.max(
      1,
      Math.min(primary.maxLevel, Math.ceil(primary.maxLevel * powerRatio)),
    );

    let bonus: { id: EnchantmentId; level: number } | undefined;
    if (t >= 1 && pool.length > 1) {
      const compatible = pool.filter(
        (m) =>
          m.id !== primary.id &&
          !(primary.incompatible?.includes(m.id)) &&
          !(m.incompatible?.includes(primary.id)),
      );
      if (compatible.length > 0 && (t === 2 || r2 > 0.45)) {
        const sec = compatible[Math.floor(r2 * compatible.length) % compatible.length];
        const secLv = Math.max(
          1,
          Math.min(sec.maxLevel, Math.ceil(sec.maxLevel * (t === 2 ? 0.75 : 0.45))),
        );
        bonus = { id: sec.id, level: secLv };
      }
    }

    offers.push({
      tier: t,
      minLevel: tierReq[t],
      xpCost: t + 1,
      lapisCost: t + 1,
      primaryId: primary.id,
      primaryLevel,
      bonus,
      runes: RUNE_WORDS[(seed + t * 2) % RUNE_WORDS.length],
    });
  }
  return offers;
}

export function applyEnchantOffer(stack: ItemStack, offer: EnchantOffer): ItemStack {
  const nextEnchants: Partial<Record<EnchantmentId, number>> = {
    ...(stack.enchants || {}),
    [offer.primaryId]: Math.max(
      stack.enchants?.[offer.primaryId] || 0,
      offer.primaryLevel,
    ),
  };
  if (offer.bonus) {
    nextEnchants[offer.bonus.id] = Math.max(
      nextEnchants[offer.bonus.id] || 0,
      offer.bonus.level,
    );
  }
  return {
    ...stack,
    itemId: stack.itemId === 'book' ? 'enchanted_book' : stack.itemId,
    count: 1,
    enchants: nextEnchants,
  };
}

function getRepairMaterialForItem(itemId: string): string | null {
  if (itemId.startsWith('netherite_')) return 'netherite_ingot';
  if (itemId.startsWith('diamond_')) return 'diamond';
  if (itemId.startsWith('iron_') || itemId === 'shield' || itemId === 'shears') return 'iron_ingot';
  if (itemId.startsWith('gold_')) return 'gold_ingot';
  if (itemId.startsWith('copper_')) return 'copper_ingot';
  if (itemId.startsWith('stone_')) return 'cobblestone';
  if (itemId.startsWith('wooden_')) return 'oak_planks';
  if (itemId.startsWith('leather_')) return 'leather';
  if (itemId === 'mace') return 'breeze_rod';
  if (itemId === 'elytra') return 'phantom_membrane';
  return null;
}

export interface AnvilResult {
  output: ItemStack;
  xpCost: number;
  label: string;
}

export function combineAnvilItems(
  left: ItemStack | null,
  right: ItemStack | null,
): AnvilResult | null {
  if (!left || !right) return null;
  const leftDef = ITEM_DEFS[left.itemId];
  if (!leftDef) return null;

  // Case 1: Repair durability using raw material (e.g. Diamond Pickaxe + Diamond)
  const repairMat = getRepairMaterialForItem(left.itemId);
  if (repairMat && right.itemId === repairMat && leftDef.maxDurability) {
    const curDur = left.durability ?? leftDef.maxDurability;
    if (curDur < leftDef.maxDurability) {
      const nextDur = Math.min(
        leftDef.maxDurability,
        curDur + Math.ceil(leftDef.maxDurability * 0.35),
      );
      return {
        output: {
          ...left,
          count: 1,
          durability: nextDur,
          enchants: left.enchants ? { ...left.enchants } : undefined,
        },
        xpCost: 2,
        label: 'Sửa độ bền',
      };
    }
  }

  // Case 2: Combine Enchanted Book onto Gear OR Combine Two Identical Gear/Books
  const isBookApply = right.itemId === 'enchanted_book' && Boolean(right.enchants);
  const isSameItem = left.itemId === right.itemId && isEnchantableItem(left.itemId);
  if (!isBookApply && !isSameItem) return null;

  const allowedIds = new Set(getApplicableEnchants(left.itemId).map((m) => m.id));
  const merged: Partial<Record<EnchantmentId, number>> = { ...(left.enchants || {}) };
  let addedAny = false;
  let xpCost = 0;

  if (right.enchants) {
    for (const [rawId, rightLv] of Object.entries(right.enchants) as [EnchantmentId, number][]) {
      if (!rightLv || !allowedIds.has(rawId)) continue;
      const meta = ENCHANT_META[rawId];
      // Skip if incompatible with an existing enchant on left item
      const conflict = Object.keys(merged).some((existingId) =>
        meta.incompatible?.includes(existingId as EnchantmentId),
      );
      if (conflict) continue;

      const leftLv = merged[rawId] || 0;
      let nextLv = Math.max(leftLv, rightLv);
      if (leftLv === rightLv && leftLv < meta.maxLevel) {
        nextLv = leftLv + 1;
      }
      if (nextLv > leftLv) {
        merged[rawId] = nextLv;
        addedAny = true;
        xpCost += nextLv * 2;
      }
    }
  }

  // Also restore durability when combining two identical tools/armor
  let nextDur = left.durability;
  let repaired = false;
  if (isSameItem && leftDef.maxDurability) {
    const d1 = left.durability ?? leftDef.maxDurability;
    const d2 = right.durability ?? leftDef.maxDurability;
    const combined = Math.min(
      leftDef.maxDurability,
      d1 + d2 + Math.floor(leftDef.maxDurability * 0.12),
    );
    if (combined > d1) {
      nextDur = combined;
      repaired = true;
      xpCost += 2;
    }
  }

  if (!addedAny && !repaired) return null;

  return {
    output: {
      ...left,
      count: 1,
      durability: nextDur,
      enchants: Object.keys(merged).length > 0 ? merged : undefined,
    },
    xpCost: Math.max(1, Math.min(35, xpCost)),
    label: addedAny ? 'Ghép phù phép' : 'Ghép & sửa chữa',
  };
}
