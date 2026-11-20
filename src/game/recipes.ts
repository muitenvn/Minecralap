import { ItemStack } from './types';

export interface CraftingRecipe {
  id: string;
  nameVi: string;
  // 2x2 or 3x3 pattern (compact trimmed grid), null = empty
  pattern?: (string | null)[][];
  // Or shapeless ingredients list
  shapeless?: string[];
  output: { itemId: string; count: number };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Planks & Sticks
  { id: 'oak_planks', nameVi: 'Ván Gỗ Sồi', shapeless: ['oak_log'], output: { itemId: 'oak_planks', count: 4 } },
  { id: 'crimson_planks', nameVi: 'Ván Nấm Đỏ', shapeless: ['crimson_stem'], output: { itemId: 'crimson_planks', count: 4 } },
  { id: 'warped_planks', nameVi: 'Ván Nấm Xanh', shapeless: ['warped_stem'], output: { itemId: 'warped_planks', count: 4 } },
  { id: 'sticks_oak', nameVi: 'Que Gỗ', pattern: [['oak_planks'], ['oak_planks']], output: { itemId: 'stick', count: 4 } },
  { id: 'sticks_crimson', nameVi: 'Que Gỗ (Nấm Đỏ)', pattern: [['crimson_planks'], ['crimson_planks']], output: { itemId: 'stick', count: 4 } },
  { id: 'sticks_warped', nameVi: 'Que Gỗ (Nấm Xanh)', pattern: [['warped_planks'], ['warped_planks']], output: { itemId: 'stick', count: 4 } },
  { id: 'torch', nameVi: 'Đuốc', pattern: [['coal'], ['stick']], output: { itemId: 'torch', count: 4 } },

  // Stations
  {
    id: 'crafting_table', nameVi: 'Bàn Chế Tạo',
    pattern: [['oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks']],
    output: { itemId: 'crafting_table', count: 1 },
  },
  {
    id: 'furnace', nameVi: 'Lò Nung',
    pattern: [
      ['cobblestone', 'cobblestone', 'cobblestone'],
      ['cobblestone', null, 'cobblestone'],
      ['cobblestone', 'cobblestone', 'cobblestone'],
    ],
    output: { itemId: 'furnace', count: 1 },
  },
  {
    id: 'furnace_blackstone', nameVi: 'Lò Nung (Đá Đen 1.16)',
    pattern: [
      ['blackstone', 'blackstone', 'blackstone'],
      ['blackstone', null, 'blackstone'],
      ['blackstone', 'blackstone', 'blackstone'],
    ],
    output: { itemId: 'furnace', count: 1 },
  },
  {
    id: 'smithing_table', nameVi: 'Bàn Rèn 1.16',
    pattern: [
      ['iron_ingot', 'iron_ingot'],
      ['oak_planks', 'oak_planks'],
      ['oak_planks', 'oak_planks'],
    ],
    output: { itemId: 'smithing_table', count: 1 },
  },
  {
    id: 'flint_and_steel', nameVi: 'Bật Lửa',
    shapeless: ['iron_ingot', 'flint'],
    output: { itemId: 'flint_and_steel', count: 1 },
  },

  // 1.16 Netherite & Nether Blocks
  {
    id: 'netherite_ingot', nameVi: 'Thỏi Netherite (1.16)',
    shapeless: ['netherite_scrap', 'netherite_scrap', 'netherite_scrap', 'netherite_scrap', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot'],
    output: { itemId: 'netherite_ingot', count: 1 },
  },
  {
    id: 'netherite_block', nameVi: 'Khối Netherite',
    pattern: [
      ['netherite_ingot', 'netherite_ingot', 'netherite_ingot'],
      ['netherite_ingot', 'netherite_ingot', 'netherite_ingot'],
      ['netherite_ingot', 'netherite_ingot', 'netherite_ingot'],
    ],
    output: { itemId: 'netherite_block', count: 1 },
  },
  {
    id: 'respawn_anchor', nameVi: 'Neo Hồi Sinh 1.16',
    pattern: [
      ['crying_obsidian', 'crying_obsidian', 'crying_obsidian'],
      ['glowstone', 'glowstone', 'glowstone'],
      ['crying_obsidian', 'crying_obsidian', 'crying_obsidian'],
    ],
    output: { itemId: 'respawn_anchor', count: 1 },
  },
  {
    id: 'polished_blackstone', nameVi: 'Đá Đen Mài Bóng',
    pattern: [['blackstone', 'blackstone'], ['blackstone', 'blackstone']],
    output: { itemId: 'polished_blackstone', count: 4 },
  },
  {
    id: 'soul_lantern', nameVi: 'Đèn Lồng Linh Hồn 1.16',
    pattern: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      ['iron_ingot', 'torch', 'iron_ingot'],
      ['iron_ingot', 'soul_soil', 'iron_ingot'],
    ],
    output: { itemId: 'soul_lantern', count: 1 },
  },

  // Pickaxes
  {
    id: 'wooden_pickaxe', nameVi: 'Cuốc Gỗ',
    pattern: [['oak_planks', 'oak_planks', 'oak_planks'], [null, 'stick', null], [null, 'stick', null]],
    output: { itemId: 'wooden_pickaxe', count: 1 },
  },
  {
    id: 'stone_pickaxe', nameVi: 'Cuốc Đá',
    pattern: [['cobblestone', 'cobblestone', 'cobblestone'], [null, 'stick', null], [null, 'stick', null]],
    output: { itemId: 'stone_pickaxe', count: 1 },
  },
  {
    id: 'blackstone_pickaxe', nameVi: 'Cuốc Đá Đen (1.16)',
    pattern: [['blackstone', 'blackstone', 'blackstone'], [null, 'stick', null], [null, 'stick', null]],
    output: { itemId: 'stone_pickaxe', count: 1 },
  },
  {
    id: 'iron_pickaxe', nameVi: 'Cuốc Sắt',
    pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], [null, 'stick', null], [null, 'stick', null]],
    output: { itemId: 'iron_pickaxe', count: 1 },
  },
  {
    id: 'diamond_pickaxe', nameVi: 'Cuốc Kim Cương',
    pattern: [['diamond', 'diamond', 'diamond'], [null, 'stick', null], [null, 'stick', null]],
    output: { itemId: 'diamond_pickaxe', count: 1 },
  },

  // Swords
  { id: 'wooden_sword', nameVi: 'Kiếm Gỗ', pattern: [['oak_planks'], ['oak_planks'], ['stick']], output: { itemId: 'wooden_sword', count: 1 } },
  { id: 'stone_sword', nameVi: 'Kiếm Đá', pattern: [['cobblestone'], ['cobblestone'], ['stick']], output: { itemId: 'stone_sword', count: 1 } },
  { id: 'iron_sword', nameVi: 'Kiếm Sắt', pattern: [['iron_ingot'], ['iron_ingot'], ['stick']], output: { itemId: 'iron_sword', count: 1 } },
  { id: 'diamond_sword', nameVi: 'Kiếm Kim Cương', pattern: [['diamond'], ['diamond'], ['stick']], output: { itemId: 'diamond_sword', count: 1 } },

  // Axes & Shovels
  { id: 'iron_axe', nameVi: 'Rìu Sắt', pattern: [['iron_ingot', 'iron_ingot'], ['iron_ingot', 'stick'], [null, 'stick']], output: { itemId: 'iron_axe', count: 1 } },
  { id: 'diamond_axe', nameVi: 'Rìu Kim Cương', pattern: [['diamond', 'diamond'], ['diamond', 'stick'], [null, 'stick']], output: { itemId: 'diamond_axe', count: 1 } },
  { id: 'diamond_shovel', nameVi: 'Xẻng Kim Cương', pattern: [['diamond'], ['stick'], ['stick']], output: { itemId: 'diamond_shovel', count: 1 } },

  // Armor
  { id: 'gold_helmet', nameVi: 'Mũ Vàng', pattern: [['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', null, 'gold_ingot']], output: { itemId: 'gold_helmet', count: 1 } },
  { id: 'iron_helmet', nameVi: 'Mũ Sắt', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { itemId: 'iron_helmet', count: 1 } },
  { id: 'iron_chestplate', nameVi: 'Áo Giáp Sắt', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], output: { itemId: 'iron_chestplate', count: 1 } },
  { id: 'diamond_helmet', nameVi: 'Mũ Kim Cương', pattern: [['diamond', 'diamond', 'diamond'], ['diamond', null, 'diamond']], output: { itemId: 'diamond_helmet', count: 1 } },
  { id: 'diamond_chestplate', nameVi: 'Áo Giáp Kim Cương', pattern: [['diamond', null, 'diamond'], ['diamond', 'diamond', 'diamond'], ['diamond', 'diamond', 'diamond']], output: { itemId: 'diamond_chestplate', count: 1 } },
  { id: 'diamond_leggings', nameVi: 'Quần Kim Cương', pattern: [['diamond', 'diamond', 'diamond'], ['diamond', null, 'diamond'], ['diamond', null, 'diamond']], output: { itemId: 'diamond_leggings', count: 1 } },
  { id: 'diamond_boots', nameVi: 'Giày Kim Cương', pattern: [['diamond', null, 'diamond'], ['diamond', null, 'diamond']], output: { itemId: 'diamond_boots', count: 1 } },
];

export const SMELTING_RECIPES: Record<string, string> = {
  iron_ore: 'iron_ingot',
  gold_ore: 'gold_ingot',
  nether_gold_ore: 'gold_ingot',
  ancient_debris: 'netherite_scrap',
  cobblestone: 'stone',
  sand: 'glass',
  raw_porkchop: 'cooked_porkchop',
  oak_log: 'coal',
};

export const SMITHING_UPGRADES: Record<string, string> = {
  diamond_pickaxe: 'netherite_pickaxe',
  diamond_sword: 'netherite_sword',
  diamond_axe: 'netherite_axe',
  diamond_shovel: 'netherite_shovel',
  diamond_helmet: 'netherite_helmet',
  diamond_chestplate: 'netherite_chestplate',
  diamond_leggings: 'netherite_leggings',
  diamond_boots: 'netherite_boots',
};

function trimGrid(grid: (string | null)[][]): (string | null)[][] {
  let minR = grid.length, maxR = -1, minC = grid[0].length, maxC = -1;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR < minR) return [];
  const res: (string | null)[][] = [];
  for (let r = minR; r <= maxR; r++) {
    res.push(grid[r].slice(minC, maxC + 1));
  }
  return res;
}

export function matchCraftingGrid(slots: (ItemStack | null)[], size: 2 | 3): CraftingRecipe | null {
  const grid: (string | null)[][] = [];
  const flatItems: string[] = [];
  for (let r = 0; r < size; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < size; c++) {
      const st = slots[r * size + c];
      row.push(st ? st.itemId : null);
      if (st) flatItems.push(st.itemId);
    }
    grid.push(row);
  }
  if (flatItems.length === 0) return null;
  const trimmed = trimGrid(grid);
  const sortedFlat = [...flatItems].sort();

  for (const recipe of CRAFTING_RECIPES) {
    if (recipe.shapeless) {
      if (recipe.shapeless.length !== sortedFlat.length) continue;
      const target = [...recipe.shapeless].sort();
      if (target.every((item, i) => item === sortedFlat[i])) return recipe;
    } else if (recipe.pattern) {
      if (recipe.pattern.length !== trimmed.length) continue;
      if (recipe.pattern[0].length !== trimmed[0].length) continue;
      let match = true;
      for (let r = 0; r < trimmed.length && match; r++) {
        for (let c = 0; c < trimmed[r].length; c++) {
          if (recipe.pattern[r][c] !== trimmed[r][c]) {
            match = false;
            break;
          }
        }
      }
      if (match) return recipe;
    }
  }
  return null;
}

export function matchSmithing(base: ItemStack | null, addition: ItemStack | null): ItemStack | null {
  if (!base || !addition) return null;
  if (addition.itemId !== 'netherite_ingot') return null;
  const upgraded = SMITHING_UPGRADES[base.itemId];
  if (!upgraded) return null;
  return {
    itemId: upgraded,
    count: 1,
    enchants: base.enchants ? { ...base.enchants } : undefined,
  };
}
