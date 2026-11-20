import { ItemStack } from './types';

export interface CraftingRecipe {
  id: string;
  nameVi: string;
  pattern?: (string | null)[][];
  shapeless?: string[];
  output: { itemId: string; count: number };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // --- PLANKS & STICKS ---
  { id: 'oak_planks', nameVi: 'Ván Gỗ Sồi', shapeless: ['oak_log'], output: { itemId: 'oak_planks', count: 4 } },
  { id: 'spruce_planks', nameVi: 'Ván Vân Sam', shapeless: ['spruce_log'], output: { itemId: 'spruce_planks', count: 4 } },
  { id: 'birch_planks', nameVi: 'Ván Bạch Dương', shapeless: ['birch_log'], output: { itemId: 'birch_planks', count: 4 } },
  { id: 'crimson_planks', nameVi: 'Ván Nấm Đỏ', shapeless: ['crimson_stem'], output: { itemId: 'crimson_planks', count: 4 } },
  { id: 'warped_planks', nameVi: 'Ván Nấm Xanh', shapeless: ['warped_stem'], output: { itemId: 'warped_planks', count: 4 } },
  { id: 'sticks_oak', nameVi: 'Que Gỗ', pattern: [['oak_planks'], ['oak_planks']], output: { itemId: 'stick', count: 4 } },
  { id: 'sticks_spruce', nameVi: 'Que Gỗ (Vân Sam)', pattern: [['spruce_planks'], ['spruce_planks']], output: { itemId: 'stick', count: 4 } },
  { id: 'sticks_birch', nameVi: 'Que Gỗ (Bạch Dương)', pattern: [['birch_planks'], ['birch_planks']], output: { itemId: 'stick', count: 4 } },
  { id: 'sticks_crimson', nameVi: 'Que Gỗ (Nấm Đỏ)', pattern: [['crimson_planks'], ['crimson_planks']], output: { itemId: 'stick', count: 4 } },
  { id: 'sticks_warped', nameVi: 'Que Gỗ (Nấm Xanh)', pattern: [['warped_planks'], ['warped_planks']], output: { itemId: 'stick', count: 4 } },

  // --- LIGHTING & STATIONS ---
  { id: 'torch', nameVi: 'Đuốc', pattern: [['coal'], ['stick']], output: { itemId: 'torch', count: 4 } },
  { id: 'soul_torch', nameVi: 'Đuốc Linh Hồn', pattern: [['coal'], ['stick'], ['soul_soil']], output: { itemId: 'soul_torch', count: 4 } },
  {
    id: 'lantern', nameVi: 'Đèn Lồng',
    pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'torch', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']],
    output: { itemId: 'lantern', count: 1 },
  },
  {
    id: 'soul_lantern', nameVi: 'Đèn Linh Hồn',
    pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'soul_torch', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']],
    output: { itemId: 'soul_lantern', count: 1 },
  },
  {
    id: 'campfire', nameVi: 'Lửa Trại',
    pattern: [[null, 'stick', null], ['stick', 'coal', 'stick'], ['oak_log', 'oak_log', 'oak_log']],
    output: { itemId: 'campfire', count: 1 },
  },
  {
    id: 'crafting_table', nameVi: 'Bàn Chế Tạo',
    pattern: [['oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks']],
    output: { itemId: 'crafting_table', count: 1 },
  },
  {
    id: 'chest', nameVi: 'Rương Gỗ',
    pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['oak_planks', null, 'oak_planks'], ['oak_planks', 'oak_planks', 'oak_planks']],
    output: { itemId: 'chest', count: 1 },
  },
  {
    id: 'furnace', nameVi: 'Lò Nung',
    pattern: [['cobblestone', 'cobblestone', 'cobblestone'], ['cobblestone', null, 'cobblestone'], ['cobblestone', 'cobblestone', 'cobblestone']],
    output: { itemId: 'furnace', count: 1 },
  },
  {
    id: 'furnace_blackstone', nameVi: 'Lò Nung (Đá Đen)',
    pattern: [['blackstone', 'blackstone', 'blackstone'], ['blackstone', null, 'blackstone'], ['blackstone', 'blackstone', 'blackstone']],
    output: { itemId: 'furnace', count: 1 },
  },
  {
    id: 'smithing_table', nameVi: 'Bàn Rèn',
    pattern: [['iron_ingot', 'iron_ingot'], ['oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks']],
    output: { itemId: 'smithing_table', count: 1 },
  },
  {
    id: 'enchanting_table', nameVi: 'Bàn Phù Phép',
    pattern: [[null, 'book', null], ['diamond', 'obsidian', 'diamond'], ['obsidian', 'obsidian', 'obsidian']],
    output: { itemId: 'enchanting_table', count: 1 },
  },
  {
    id: 'anvil', nameVi: 'Cái Đe',
    pattern: [['iron_block', 'iron_block', 'iron_block'], [null, 'iron_ingot', null], ['iron_ingot', 'iron_ingot', 'iron_ingot']],
    output: { itemId: 'anvil', count: 1 },
  },
  {
    id: 'red_bed', nameVi: 'Giường Đỏ',
    pattern: [['red_wool', 'red_wool', 'red_wool'], ['oak_planks', 'oak_planks', 'oak_planks']],
    output: { itemId: 'red_bed', count: 1 },
  },
  {
    id: 'red_bed_white', nameVi: 'Giường (Len Trắng)',
    pattern: [['white_wool', 'white_wool', 'white_wool'], ['oak_planks', 'oak_planks', 'oak_planks']],
    output: { itemId: 'red_bed', count: 1 },
  },
  {
    id: 'bookshelf', nameVi: 'Kệ Sách',
    pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['book', 'book', 'book'], ['oak_planks', 'oak_planks', 'oak_planks']],
    output: { itemId: 'bookshelf', count: 1 },
  },
  { id: 'book', nameVi: 'Sách', shapeless: ['paper', 'paper', 'paper', 'leather'], output: { itemId: 'book', count: 1 } },
  {
    id: 'ladder', nameVi: 'Thang Gỗ',
    pattern: [['stick', null, 'stick'], ['stick', 'stick', 'stick'], ['stick', null, 'stick']],
    output: { itemId: 'ladder', count: 3 },
  },
  {
    id: 'oak_fence', nameVi: 'Hàng Rào Gỗ',
    pattern: [['oak_planks', 'stick', 'oak_planks'], ['oak_planks', 'stick', 'oak_planks']],
    output: { itemId: 'oak_fence', count: 3 },
  },

  // --- BUILDING & MINERAL BLOCKS ---
  { id: 'stone_bricks', nameVi: 'Gạch Đá', pattern: [['stone', 'stone'], ['stone', 'stone']], output: { itemId: 'stone_bricks', count: 4 } },
  { id: 'bricks', nameVi: 'Gạch Đỏ', pattern: [['brick', 'brick'], ['brick', 'brick']], output: { itemId: 'bricks', count: 1 } },
  { id: 'nether_bricks', nameVi: 'Gạch Địa Ngục', pattern: [['nether_brick', 'nether_brick'], ['nether_brick', 'nether_brick']], output: { itemId: 'nether_bricks', count: 1 } },
  { id: 'quartz_block', nameVi: 'Khối Thạch Anh', pattern: [['quartz', 'quartz'], ['quartz', 'quartz']], output: { itemId: 'quartz_block', count: 1 } },
  { id: 'glowstone', nameVi: 'Đá Phát Sáng', pattern: [['glowstone_dust', 'glowstone_dust'], ['glowstone_dust', 'glowstone_dust']], output: { itemId: 'glowstone', count: 1 } },
  { id: 'polished_blackstone', nameVi: 'Đá Đen Mài Bóng', pattern: [['blackstone', 'blackstone'], ['blackstone', 'blackstone']], output: { itemId: 'polished_blackstone', count: 4 } },
  { id: 'white_wool', nameVi: 'Len Trắng', pattern: [['string', 'string'], ['string', 'string']], output: { itemId: 'white_wool', count: 1 } },
  { id: 'jack_o_lantern', nameVi: 'Đèn Bí Ngô', pattern: [['pumpkin'], ['torch']], output: { itemId: 'jack_o_lantern', count: 1 } },
  { id: 'hay_block', nameVi: 'Khối Rơm', pattern: [['wheat', 'wheat', 'wheat'], ['wheat', 'wheat', 'wheat'], ['wheat', 'wheat', 'wheat']], output: { itemId: 'hay_block', count: 1 } },
  { id: 'wheat_from_hay', nameVi: 'Lúa Mì', shapeless: ['hay_block'], output: { itemId: 'wheat', count: 9 } },
  { id: 'tnt', nameVi: 'TNT', pattern: [['gunpowder', 'sand', 'gunpowder'], ['sand', 'gunpowder', 'sand'], ['gunpowder', 'sand', 'gunpowder']], output: { itemId: 'tnt', count: 1 } },

  // Mineral Blocks <-> Ingots/Gems
  { id: 'coal_block', nameVi: 'Khối Than', pattern: [['coal', 'coal', 'coal'], ['coal', 'coal', 'coal'], ['coal', 'coal', 'coal']], output: { itemId: 'coal_block', count: 1 } },
  { id: 'iron_block', nameVi: 'Khối Sắt', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], output: { itemId: 'iron_block', count: 1 } },
  { id: 'gold_block', nameVi: 'Khối Vàng', pattern: [['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', 'gold_ingot', 'gold_ingot']], output: { itemId: 'gold_block', count: 1 } },
  { id: 'diamond_block', nameVi: 'Khối Kim Cương', pattern: [['diamond', 'diamond', 'diamond'], ['diamond', 'diamond', 'diamond'], ['diamond', 'diamond', 'diamond']], output: { itemId: 'diamond_block', count: 1 } },
  { id: 'emerald_block', nameVi: 'Khối Ngọc Lục Bảo', pattern: [['emerald', 'emerald', 'emerald'], ['emerald', 'emerald', 'emerald'], ['emerald', 'emerald', 'emerald']], output: { itemId: 'emerald_block', count: 1 } },
  { id: 'redstone_block', nameVi: 'Khối Redstone', pattern: [['redstone', 'redstone', 'redstone'], ['redstone', 'redstone', 'redstone'], ['redstone', 'redstone', 'redstone']], output: { itemId: 'redstone_block', count: 1 } },
  { id: 'lapis_block', nameVi: 'Khối Lưu Ly', pattern: [['lapis_lazuli', 'lapis_lazuli', 'lapis_lazuli'], ['lapis_lazuli', 'lapis_lazuli', 'lapis_lazuli'], ['lapis_lazuli', 'lapis_lazuli', 'lapis_lazuli']], output: { itemId: 'lapis_block', count: 1 } },
  { id: 'netherite_ingot', nameVi: 'Thỏi Netherite', shapeless: ['netherite_scrap', 'netherite_scrap', 'netherite_scrap', 'netherite_scrap', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot'], output: { itemId: 'netherite_ingot', count: 1 } },
  { id: 'netherite_block', nameVi: 'Khối Netherite', pattern: [['netherite_ingot', 'netherite_ingot', 'netherite_ingot'], ['netherite_ingot', 'netherite_ingot', 'netherite_ingot'], ['netherite_ingot', 'netherite_ingot', 'netherite_ingot']], output: { itemId: 'netherite_block', count: 1 } },
  { id: 'respawn_anchor', nameVi: 'Neo Hồi Sinh', pattern: [['crying_obsidian', 'crying_obsidian', 'crying_obsidian'], ['glowstone', 'glowstone', 'glowstone'], ['crying_obsidian', 'crying_obsidian', 'crying_obsidian']], output: { itemId: 'respawn_anchor', count: 1 } },
  { id: 'iron_from_block', nameVi: '9 Thỏi Sắt', shapeless: ['iron_block'], output: { itemId: 'iron_ingot', count: 9 } },
  { id: 'gold_from_block', nameVi: '9 Thỏi Vàng', shapeless: ['gold_block'], output: { itemId: 'gold_ingot', count: 9 } },
  { id: 'diamond_from_block', nameVi: '9 Kim Cương', shapeless: ['diamond_block'], output: { itemId: 'diamond', count: 9 } },
  { id: 'netherite_from_block', nameVi: '9 Thỏi Netherite', shapeless: ['netherite_block'], output: { itemId: 'netherite_ingot', count: 9 } },

  // --- UTILITY & FOOD ---
  { id: 'flint_and_steel', nameVi: 'Bật Lửa', shapeless: ['iron_ingot', 'flint'], output: { itemId: 'flint_and_steel', count: 1 } },
  { id: 'bucket', nameVi: 'Xô Sắt', pattern: [['iron_ingot', null, 'iron_ingot'], [null, 'iron_ingot', null]], output: { itemId: 'bucket', count: 1 } },
  { id: 'shears', nameVi: 'Kéo Cắt', pattern: [[null, 'iron_ingot'], ['iron_ingot', null]], output: { itemId: 'shears', count: 1 } },
  { id: 'shield', nameVi: 'Khiên', pattern: [['oak_planks', 'iron_ingot', 'oak_planks'], ['oak_planks', 'oak_planks', 'oak_planks'], [null, 'oak_planks', null]], output: { itemId: 'shield', count: 1 } },
  { id: 'bow', nameVi: 'Cung Tên', pattern: [[null, 'stick', 'string'], ['stick', null, 'string'], [null, 'stick', 'string']], output: { itemId: 'bow', count: 1 } },
  { id: 'arrow', nameVi: 'Mũi Tên', pattern: [['flint'], ['stick'], ['feather']], output: { itemId: 'arrow', count: 4 } },
  { id: 'bread', nameVi: 'Bánh Mì', pattern: [['wheat', 'wheat', 'wheat']], output: { itemId: 'bread', count: 1 } },
  { id: 'golden_apple', nameVi: 'Táo Vàng', pattern: [['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', 'apple', 'gold_ingot'], ['gold_ingot', 'gold_ingot', 'gold_ingot']], output: { itemId: 'golden_apple', count: 1 } },
  { id: 'golden_carrot', nameVi: 'Cà Rốt Vàng', pattern: [['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', 'carrot', 'gold_ingot'], ['gold_ingot', 'gold_ingot', 'gold_ingot']], output: { itemId: 'golden_carrot', count: 1 } },
  { id: 'blaze_powder', nameVi: 'Bột Quỷ Lửa', shapeless: ['blaze_rod'], output: { itemId: 'blaze_powder', count: 2 } },

  // --- PICKAXES ---
  { id: 'wooden_pickaxe', nameVi: 'Cuốc Gỗ', pattern: [['oak_planks', 'oak_planks', 'oak_planks'], [null, 'stick', null], [null, 'stick', null]], output: { itemId: 'wooden_pickaxe', count: 1 } },
  { id: 'stone_pickaxe', nameVi: 'Cuốc Đá', pattern: [['cobblestone', 'cobblestone', 'cobblestone'], [null, 'stick', null], [null, 'stick', null]], output: { itemId: 'stone_pickaxe', count: 1 } },
  { id: 'blackstone_pickaxe', nameVi: 'Cuốc Đá Đen', pattern: [['blackstone', 'blackstone', 'blackstone'], [null, 'stick', null], [null, 'stick', null]], output: { itemId: 'stone_pickaxe', count: 1 } },
  { id: 'iron_pickaxe', nameVi: 'Cuốc Sắt', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], [null, 'stick', null], [null, 'stick', null]], output: { itemId: 'iron_pickaxe', count: 1 } },
  { id: 'golden_pickaxe', nameVi: 'Cuốc Vàng', pattern: [['gold_ingot', 'gold_ingot', 'gold_ingot'], [null, 'stick', null], [null, 'stick', null]], output: { itemId: 'golden_pickaxe', count: 1 } },
  { id: 'diamond_pickaxe', nameVi: 'Cuốc Kim Cương', pattern: [['diamond', 'diamond', 'diamond'], [null, 'stick', null], [null, 'stick', null]], output: { itemId: 'diamond_pickaxe', count: 1 } },

  // --- SWORDS ---
  { id: 'wooden_sword', nameVi: 'Kiếm Gỗ', pattern: [['oak_planks'], ['oak_planks'], ['stick']], output: { itemId: 'wooden_sword', count: 1 } },
  { id: 'stone_sword', nameVi: 'Kiếm Đá', pattern: [['cobblestone'], ['cobblestone'], ['stick']], output: { itemId: 'stone_sword', count: 1 } },
  { id: 'iron_sword', nameVi: 'Kiếm Sắt', pattern: [['iron_ingot'], ['iron_ingot'], ['stick']], output: { itemId: 'iron_sword', count: 1 } },
  { id: 'golden_sword', nameVi: 'Kiếm Vàng', pattern: [['gold_ingot'], ['gold_ingot'], ['stick']], output: { itemId: 'golden_sword', count: 1 } },
  { id: 'diamond_sword', nameVi: 'Kiếm Kim Cương', pattern: [['diamond'], ['diamond'], ['stick']], output: { itemId: 'diamond_sword', count: 1 } },

  // --- AXES ---
  { id: 'wooden_axe', nameVi: 'Rìu Gỗ', pattern: [['oak_planks', 'oak_planks'], ['oak_planks', 'stick'], [null, 'stick']], output: { itemId: 'wooden_axe', count: 1 } },
  { id: 'stone_axe', nameVi: 'Rìu Đá', pattern: [['cobblestone', 'cobblestone'], ['cobblestone', 'stick'], [null, 'stick']], output: { itemId: 'stone_axe', count: 1 } },
  { id: 'iron_axe', nameVi: 'Rìu Sắt', pattern: [['iron_ingot', 'iron_ingot'], ['iron_ingot', 'stick'], [null, 'stick']], output: { itemId: 'iron_axe', count: 1 } },
  { id: 'golden_axe', nameVi: 'Rìu Vàng', pattern: [['gold_ingot', 'gold_ingot'], ['gold_ingot', 'stick'], [null, 'stick']], output: { itemId: 'golden_axe', count: 1 } },
  { id: 'diamond_axe', nameVi: 'Rìu Kim Cương', pattern: [['diamond', 'diamond'], ['diamond', 'stick'], [null, 'stick']], output: { itemId: 'diamond_axe', count: 1 } },

  // --- SHOVELS ---
  { id: 'wooden_shovel', nameVi: 'Xẻng Gỗ', pattern: [['oak_planks'], ['stick'], ['stick']], output: { itemId: 'wooden_shovel', count: 1 } },
  { id: 'stone_shovel', nameVi: 'Xẻng Đá', pattern: [['cobblestone'], ['stick'], ['stick']], output: { itemId: 'stone_shovel', count: 1 } },
  { id: 'iron_shovel', nameVi: 'Xẻng Sắt', pattern: [['iron_ingot'], ['stick'], ['stick']], output: { itemId: 'iron_shovel', count: 1 } },
  { id: 'golden_shovel', nameVi: 'Xẻng Vàng', pattern: [['gold_ingot'], ['stick'], ['stick']], output: { itemId: 'golden_shovel', count: 1 } },
  { id: 'diamond_shovel', nameVi: 'Xẻng Kim Cương', pattern: [['diamond'], ['stick'], ['stick']], output: { itemId: 'diamond_shovel', count: 1 } },

  // --- HOES ---
  { id: 'wooden_hoe', nameVi: 'Cuốc Đất Gỗ', pattern: [['oak_planks', 'oak_planks'], [null, 'stick'], [null, 'stick']], output: { itemId: 'wooden_hoe', count: 1 } },
  { id: 'stone_hoe', nameVi: 'Cuốc Đất Đá', pattern: [['cobblestone', 'cobblestone'], [null, 'stick'], [null, 'stick']], output: { itemId: 'stone_hoe', count: 1 } },
  { id: 'iron_hoe', nameVi: 'Cuốc Đất Sắt', pattern: [['iron_ingot', 'iron_ingot'], [null, 'stick'], [null, 'stick']], output: { itemId: 'iron_hoe', count: 1 } },
  { id: 'diamond_hoe', nameVi: 'Cuốc Đất Kim Cương', pattern: [['diamond', 'diamond'], [null, 'stick'], [null, 'stick']], output: { itemId: 'diamond_hoe', count: 1 } },

  // --- COMPLETE ARMOR SETS (LEATHER / IRON / GOLD / DIAMOND) ---
  { id: 'leather_helmet', nameVi: 'Mũ Da', pattern: [['leather', 'leather', 'leather'], ['leather', null, 'leather']], output: { itemId: 'leather_helmet', count: 1 } },
  { id: 'leather_chestplate', nameVi: 'Áo Giáp Da', pattern: [['leather', null, 'leather'], ['leather', 'leather', 'leather'], ['leather', 'leather', 'leather']], output: { itemId: 'leather_chestplate', count: 1 } },
  { id: 'leather_leggings', nameVi: 'Quần Da', pattern: [['leather', 'leather', 'leather'], ['leather', null, 'leather'], ['leather', null, 'leather']], output: { itemId: 'leather_leggings', count: 1 } },
  { id: 'leather_boots', nameVi: 'Giày Da', pattern: [['leather', null, 'leather'], ['leather', null, 'leather']], output: { itemId: 'leather_boots', count: 1 } },

  { id: 'iron_helmet', nameVi: 'Mũ Sắt', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { itemId: 'iron_helmet', count: 1 } },
  { id: 'iron_chestplate', nameVi: 'Áo Giáp Sắt', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], output: { itemId: 'iron_chestplate', count: 1 } },
  { id: 'iron_leggings', nameVi: 'Quần Sắt', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { itemId: 'iron_leggings', count: 1 } },
  { id: 'iron_boots', nameVi: 'Giày Sắt', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { itemId: 'iron_boots', count: 1 } },

  { id: 'gold_helmet', nameVi: 'Mũ Vàng', pattern: [['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', null, 'gold_ingot']], output: { itemId: 'gold_helmet', count: 1 } },
  { id: 'gold_chestplate', nameVi: 'Áo Giáp Vàng', pattern: [['gold_ingot', null, 'gold_ingot'], ['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', 'gold_ingot', 'gold_ingot']], output: { itemId: 'gold_chestplate', count: 1 } },
  { id: 'gold_leggings', nameVi: 'Quần Vàng', pattern: [['gold_ingot', 'gold_ingot', 'gold_ingot'], ['gold_ingot', null, 'gold_ingot'], ['gold_ingot', null, 'gold_ingot']], output: { itemId: 'gold_leggings', count: 1 } },
  { id: 'gold_boots', nameVi: 'Giày Vàng', pattern: [['gold_ingot', null, 'gold_ingot'], ['gold_ingot', null, 'gold_ingot']], output: { itemId: 'gold_boots', count: 1 } },

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
  netherrack: 'nether_brick',
  raw_porkchop: 'cooked_porkchop',
  raw_beef: 'steak',
  raw_chicken: 'cooked_chicken',
  oak_log: 'coal',
  spruce_log: 'coal',
  birch_log: 'coal',
};

export const SMITHING_UPGRADES: Record<string, string> = {
  diamond_pickaxe: 'netherite_pickaxe',
  diamond_sword: 'netherite_sword',
  diamond_axe: 'netherite_axe',
  diamond_shovel: 'netherite_shovel',
  diamond_hoe: 'netherite_hoe',
  diamond_helmet: 'netherite_helmet',
  diamond_chestplate: 'netherite_chestplate',
  diamond_leggings: 'netherite_leggings',
  diamond_boots: 'netherite_boots',
};

function trimGrid(grid: (string | null)[][]): (string | null)[][] {
  let minR = grid.length;
  let maxR = -1;
  let minC = grid[0].length;
  let maxC = -1;
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
