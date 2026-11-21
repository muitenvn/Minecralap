import { EXT_BLOCK_DEFS, EXT_ITEMS } from './catalog116';
import { EffectId } from './types';

export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  BEDROCK: 5,
  SAND: 6,
  GRAVEL: 7,
  OAK_LOG: 8,
  OAK_PLANKS: 9,
  OAK_LEAVES: 10,
  WATER: 11,
  LAVA: 12,
  COAL_ORE: 13,
  IRON_ORE: 14,
  GOLD_ORE: 15,
  DIAMOND_ORE: 16,
  GLASS: 17,
  SNOW: 18,
  ICE: 19,
  BRICKS: 20,
  IRON_BLOCK: 21,
  GOLD_BLOCK: 22,
  DIAMOND_BLOCK: 23,
  TNT: 24,
  CRAFTING_TABLE: 25,
  FURNACE: 26,
  SMITHING_TABLE: 27,
  OBSIDIAN: 28,
  CRYING_OBSIDIAN: 29,
  NETHER_PORTAL: 30,
  NETHERRACK: 31,
  NETHER_QUARTZ_ORE: 32,
  NETHER_GOLD_ORE: 33,
  GLOWSTONE: 34,
  CRIMSON_NYLIUM: 35,
  CRIMSON_STEM: 36,
  CRIMSON_PLANKS: 37,
  NETHER_WART_BLOCK: 38,
  WARPED_NYLIUM: 39,
  WARPED_STEM: 40,
  WARPED_PLANKS: 41,
  WARPED_WART_BLOCK: 42,
  SHROOMLIGHT: 43,
  SOUL_SAND: 44,
  SOUL_SOIL: 45,
  SOUL_FIRE: 46,
  BASALT: 47,
  BLACKSTONE: 48,
  POLISHED_BLACKSTONE: 49,
  GILDED_BLACKSTONE: 50,
  MAGMA: 51,
  BONE_BLOCK: 52,
  ANCIENT_DEBRIS: 53,
  NETHERITE_BLOCK: 54,
  RESPAWN_ANCHOR: 55,
  SOUL_LANTERN: 56,
  TORCH: 57,
  // Expanded Minecraft 1.16 blocks
  SPRUCE_LOG: 58,
  SPRUCE_PLANKS: 59,
  BIRCH_LOG: 60,
  BIRCH_PLANKS: 61,
  STONE_BRICKS: 62,
  MOSSY_COBBLESTONE: 63,
  QUARTZ_BLOCK: 64,
  NETHER_BRICKS: 65,
  RED_NETHER_BRICKS: 66,
  REDSTONE_ORE: 67,
  REDSTONE_BLOCK: 68,
  EMERALD_ORE: 69,
  EMERALD_BLOCK: 70,
  LAPIS_ORE: 71,
  LAPIS_BLOCK: 72,
  COAL_BLOCK: 73,
  CHEST: 74,
  BOOKSHELF: 75,
  BED: 76,
  LANTERN: 77,
  SOUL_TORCH: 78,
  CAMPFIRE: 79,
  ENCHANTING_TABLE: 80,
  ANVIL: 81,
  HAY_BLOCK: 82,
  PUMPKIN: 83,
  JACK_O_LANTERN: 84,
  MELON: 85,
  WOOL_WHITE: 86,
  WOOL_RED: 87,
  WOOL_BLUE: 88,
  WOOL_YELLOW: 89,
  WOOL_GREEN: 90,
  WOOL_BLACK: 91,
  OAK_FENCE: 92,
  LADDER: 93,
} as const;

export type BlockId = (typeof BLOCK)[keyof typeof BLOCK];

export type SoundMaterial =
  | 'stone'
  | 'dirt'
  | 'grass'
  | 'wood'
  | 'sand'
  | 'glass'
  | 'nether'
  | 'metal'
  | 'liquid';
export type ToolKind = 'none' | 'pickaxe' | 'axe' | 'shovel' | 'sword' | 'hoe';
export type CreativeCategory =
  | 'building'
  | 'nether116'
  | 'ores'
  | 'tools'
  | 'armor_food'
  | 'redstone'
  | 'decor_brew';

export interface BlockDef {
  id: number;
  key: string;
  nameVi: string;
  hardness: number;
  tool: ToolKind;
  minTier?: number;
  dropItem: string | null;
  dropCount?: number;
  transparent?: boolean;
  liquid?: boolean;
  nonSolid?: boolean;
  emissive?: boolean;
  damagePerSec?: number;
  sound: SoundMaterial;
  category: CreativeCategory;
  textures: {
    top: string;
    bottom: string;
    side: string;
    front?: string;
  };
}

export const BLOCK_DEFS: Record<number, BlockDef> = {
  [BLOCK.AIR]: {
    id: BLOCK.AIR, key: 'air', nameVi: 'Không khí', hardness: 0, tool: 'none', dropItem: null,
    transparent: true, nonSolid: true, sound: 'stone', category: 'building',
    textures: { top: 'stone', bottom: 'stone', side: 'stone' },
  },
  [BLOCK.GRASS]: {
    id: BLOCK.GRASS, key: 'grass_block', nameVi: 'Khối Cỏ', hardness: 0.65, tool: 'shovel', dropItem: 'dirt',
    sound: 'grass', category: 'building',
    textures: { top: 'grass_block_top', bottom: 'dirt', side: 'grass_block_side' },
  },
  [BLOCK.DIRT]: {
    id: BLOCK.DIRT, key: 'dirt', nameVi: 'Đất', hardness: 0.55, tool: 'shovel', dropItem: 'dirt',
    sound: 'dirt', category: 'building',
    textures: { top: 'dirt', bottom: 'dirt', side: 'dirt' },
  },
  [BLOCK.STONE]: {
    id: BLOCK.STONE, key: 'stone', nameVi: 'Đá', hardness: 2.0, tool: 'pickaxe', minTier: 1, dropItem: 'cobblestone',
    sound: 'stone', category: 'building',
    textures: { top: 'stone', bottom: 'stone', side: 'stone' },
  },
  [BLOCK.COBBLESTONE]: {
    id: BLOCK.COBBLESTONE, key: 'cobblestone', nameVi: 'Đá Cuội', hardness: 2.2, tool: 'pickaxe', minTier: 1, dropItem: 'cobblestone',
    sound: 'stone', category: 'building',
    textures: { top: 'cobblestone', bottom: 'cobblestone', side: 'cobblestone' },
  },
  [BLOCK.BEDROCK]: {
    id: BLOCK.BEDROCK, key: 'bedrock', nameVi: 'Đá Nền', hardness: -1, tool: 'none', dropItem: null,
    sound: 'stone', category: 'building',
    textures: { top: 'bedrock', bottom: 'bedrock', side: 'bedrock' },
  },
  [BLOCK.SAND]: {
    id: BLOCK.SAND, key: 'sand', nameVi: 'Cát', hardness: 0.5, tool: 'shovel', dropItem: 'sand',
    sound: 'sand', category: 'building',
    textures: { top: 'sand', bottom: 'sand', side: 'sand' },
  },
  [BLOCK.GRAVEL]: {
    id: BLOCK.GRAVEL, key: 'gravel', nameVi: 'Sỏi', hardness: 0.6, tool: 'shovel', dropItem: 'flint',
    sound: 'sand', category: 'building',
    textures: { top: 'gravel', bottom: 'gravel', side: 'gravel' },
  },
  [BLOCK.OAK_LOG]: {
    id: BLOCK.OAK_LOG, key: 'oak_log', nameVi: 'Gỗ Sồi', hardness: 1.8, tool: 'axe', dropItem: 'oak_log',
    sound: 'wood', category: 'building',
    textures: { top: 'oak_log_top', bottom: 'oak_log_top', side: 'oak_log' },
  },
  [BLOCK.OAK_PLANKS]: {
    id: BLOCK.OAK_PLANKS, key: 'oak_planks', nameVi: 'Ván Gỗ Sồi', hardness: 1.5, tool: 'axe', dropItem: 'oak_planks',
    sound: 'wood', category: 'building',
    textures: { top: 'oak_planks', bottom: 'oak_planks', side: 'oak_planks' },
  },
  [BLOCK.OAK_LEAVES]: {
    id: BLOCK.OAK_LEAVES, key: 'oak_leaves', nameVi: 'Lá Sồi', hardness: 0.25, tool: 'none', dropItem: 'oak_leaves',
    transparent: true, sound: 'grass', category: 'building',
    textures: { top: 'oak_leaves', bottom: 'oak_leaves', side: 'oak_leaves' },
  },
  [BLOCK.WATER]: {
    id: BLOCK.WATER, key: 'water', nameVi: 'Nước', hardness: -1, tool: 'none', dropItem: null,
    transparent: true, liquid: true, nonSolid: true, sound: 'liquid', category: 'building',
    textures: { top: 'water_still', bottom: 'water_still', side: 'water_still' },
  },
  [BLOCK.LAVA]: {
    id: BLOCK.LAVA, key: 'lava', nameVi: 'Dung Nham', hardness: -1, tool: 'none', dropItem: null,
    transparent: false, liquid: true, nonSolid: true, emissive: true, damagePerSec: 6, sound: 'liquid', category: 'nether116',
    textures: { top: 'lava_still', bottom: 'lava_still', side: 'lava_still' },
  },
  [BLOCK.COAL_ORE]: {
    id: BLOCK.COAL_ORE, key: 'coal_ore', nameVi: 'Quặng Than', hardness: 2.6, tool: 'pickaxe', minTier: 1, dropItem: 'coal',
    sound: 'stone', category: 'ores',
    textures: { top: 'coal_ore', bottom: 'coal_ore', side: 'coal_ore' },
  },
  [BLOCK.IRON_ORE]: {
    id: BLOCK.IRON_ORE, key: 'iron_ore', nameVi: 'Quặng Sắt', hardness: 3.0, tool: 'pickaxe', minTier: 2, dropItem: 'iron_ore',
    sound: 'stone', category: 'ores',
    textures: { top: 'iron_ore', bottom: 'iron_ore', side: 'iron_ore' },
  },
  [BLOCK.GOLD_ORE]: {
    id: BLOCK.GOLD_ORE, key: 'gold_ore', nameVi: 'Quặng Vàng', hardness: 3.2, tool: 'pickaxe', minTier: 3, dropItem: 'gold_ore',
    sound: 'stone', category: 'ores',
    textures: { top: 'gold_ore', bottom: 'gold_ore', side: 'gold_ore' },
  },
  [BLOCK.DIAMOND_ORE]: {
    id: BLOCK.DIAMOND_ORE, key: 'diamond_ore', nameVi: 'Quặng Kim Cương', hardness: 4.0, tool: 'pickaxe', minTier: 3, dropItem: 'diamond',
    sound: 'stone', category: 'ores',
    textures: { top: 'diamond_ore', bottom: 'diamond_ore', side: 'diamond_ore' },
  },
  [BLOCK.GLASS]: {
    id: BLOCK.GLASS, key: 'glass', nameVi: 'Kính', hardness: 0.4, tool: 'none', dropItem: 'glass',
    transparent: true, sound: 'glass', category: 'building',
    textures: { top: 'glass', bottom: 'glass', side: 'glass' },
  },
  [BLOCK.SNOW]: {
    id: BLOCK.SNOW, key: 'snow_block', nameVi: 'Khối Tuyết', hardness: 0.35, tool: 'shovel', dropItem: 'snow_block',
    sound: 'grass', category: 'building',
    textures: { top: 'snow', bottom: 'snow', side: 'snow' },
  },
  [BLOCK.ICE]: {
    id: BLOCK.ICE, key: 'ice', nameVi: 'Băng', hardness: 0.5, tool: 'pickaxe', dropItem: 'ice',
    transparent: true, sound: 'glass', category: 'building',
    textures: { top: 'ice', bottom: 'ice', side: 'ice' },
  },
  [BLOCK.BRICKS]: {
    id: BLOCK.BRICKS, key: 'bricks', nameVi: 'Gạch Đỏ', hardness: 2.2, tool: 'pickaxe', dropItem: 'bricks',
    sound: 'stone', category: 'building',
    textures: { top: 'bricks', bottom: 'bricks', side: 'bricks' },
  },
  [BLOCK.IRON_BLOCK]: {
    id: BLOCK.IRON_BLOCK, key: 'iron_block', nameVi: 'Khối Sắt', hardness: 3.5, tool: 'pickaxe', minTier: 2, dropItem: 'iron_block',
    sound: 'metal', category: 'ores',
    textures: { top: 'iron_block', bottom: 'iron_block', side: 'iron_block' },
  },
  [BLOCK.GOLD_BLOCK]: {
    id: BLOCK.GOLD_BLOCK, key: 'gold_block', nameVi: 'Khối Vàng', hardness: 3.0, tool: 'pickaxe', minTier: 3, dropItem: 'gold_block',
    sound: 'metal', category: 'ores',
    textures: { top: 'gold_block', bottom: 'gold_block', side: 'gold_block' },
  },
  [BLOCK.DIAMOND_BLOCK]: {
    id: BLOCK.DIAMOND_BLOCK, key: 'diamond_block', nameVi: 'Khối Kim Cương', hardness: 4.2, tool: 'pickaxe', minTier: 3, dropItem: 'diamond_block',
    sound: 'metal', category: 'ores',
    textures: { top: 'diamond_block', bottom: 'diamond_block', side: 'diamond_block' },
  },
  [BLOCK.TNT]: {
    id: BLOCK.TNT, key: 'tnt', nameVi: 'TNT', hardness: 0.25, tool: 'none', dropItem: 'tnt',
    sound: 'grass', category: 'building',
    textures: { top: 'tnt_top', bottom: 'tnt_top', side: 'tnt_side' },
  },
  [BLOCK.CRAFTING_TABLE]: {
    id: BLOCK.CRAFTING_TABLE, key: 'crafting_table', nameVi: 'Bàn Chế Tạo', hardness: 1.8, tool: 'axe', dropItem: 'crafting_table',
    sound: 'wood', category: 'building',
    textures: { top: 'crafting_table_top', bottom: 'oak_planks', side: 'crafting_table_side' },
  },
  [BLOCK.FURNACE]: {
    id: BLOCK.FURNACE, key: 'furnace', nameVi: 'Lò Nung', hardness: 2.5, tool: 'pickaxe', minTier: 1, dropItem: 'furnace',
    sound: 'stone', category: 'building',
    textures: { top: 'furnace_top', bottom: 'furnace_top', side: 'furnace_side', front: 'furnace_front' },
  },
  [BLOCK.SMITHING_TABLE]: {
    id: BLOCK.SMITHING_TABLE, key: 'smithing_table', nameVi: 'Bàn Rèn', hardness: 2.0, tool: 'axe', dropItem: 'smithing_table',
    sound: 'wood', category: 'nether116',
    textures: { top: 'smithing_table_top', bottom: 'crimson_planks', side: 'smithing_table_side' },
  },
  [BLOCK.OBSIDIAN]: {
    id: BLOCK.OBSIDIAN, key: 'obsidian', nameVi: 'Hắc Diện Thạch', hardness: 8.5, tool: 'pickaxe', minTier: 4, dropItem: 'obsidian',
    sound: 'stone', category: 'nether116',
    textures: { top: 'obsidian', bottom: 'obsidian', side: 'obsidian' },
  },
  [BLOCK.CRYING_OBSIDIAN]: {
    id: BLOCK.CRYING_OBSIDIAN, key: 'crying_obsidian', nameVi: 'Obsidian Khóc', hardness: 8.5, tool: 'pickaxe', minTier: 4, dropItem: 'crying_obsidian',
    emissive: true, sound: 'stone', category: 'nether116',
    textures: { top: 'crying_obsidian', bottom: 'crying_obsidian', side: 'crying_obsidian' },
  },
  [BLOCK.NETHER_PORTAL]: {
    id: BLOCK.NETHER_PORTAL, key: 'nether_portal', nameVi: 'Cổng Nether', hardness: -1, tool: 'none', dropItem: null,
    transparent: true, nonSolid: true, emissive: true, sound: 'glass', category: 'nether116',
    textures: { top: 'nether_portal', bottom: 'nether_portal', side: 'nether_portal' },
  },
  [BLOCK.NETHERRACK]: {
    id: BLOCK.NETHERRACK, key: 'netherrack', nameVi: 'Đá Địa Ngục', hardness: 0.55, tool: 'pickaxe', dropItem: 'netherrack',
    sound: 'nether', category: 'nether116',
    textures: { top: 'netherrack', bottom: 'netherrack', side: 'netherrack' },
  },
  [BLOCK.NETHER_QUARTZ_ORE]: {
    id: BLOCK.NETHER_QUARTZ_ORE, key: 'nether_quartz_ore', nameVi: 'Quặng Thạch Anh', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'quartz',
    sound: 'nether', category: 'ores',
    textures: { top: 'nether_quartz_ore', bottom: 'nether_quartz_ore', side: 'nether_quartz_ore' },
  },
  [BLOCK.NETHER_GOLD_ORE]: {
    id: BLOCK.NETHER_GOLD_ORE, key: 'nether_gold_ore', nameVi: 'Quặng Vàng Nether', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'gold_ingot',
    sound: 'nether', category: 'ores',
    textures: { top: 'nether_gold_ore', bottom: 'nether_gold_ore', side: 'nether_gold_ore' },
  },
  [BLOCK.GLOWSTONE]: {
    id: BLOCK.GLOWSTONE, key: 'glowstone', nameVi: 'Đá Phát Sáng', hardness: 0.45, tool: 'none', dropItem: 'glowstone',
    emissive: true, sound: 'glass', category: 'nether116',
    textures: { top: 'glowstone', bottom: 'glowstone', side: 'glowstone' },
  },
  [BLOCK.CRIMSON_NYLIUM]: {
    id: BLOCK.CRIMSON_NYLIUM, key: 'crimson_nylium', nameVi: 'Nấm Đỏ Nylium', hardness: 0.65, tool: 'pickaxe', dropItem: 'crimson_nylium',
    sound: 'nether', category: 'nether116',
    textures: { top: 'crimson_nylium', bottom: 'netherrack', side: 'crimson_nylium_side' },
  },
  [BLOCK.CRIMSON_STEM]: {
    id: BLOCK.CRIMSON_STEM, key: 'crimson_stem', nameVi: 'Thân Nấm Đỏ', hardness: 1.8, tool: 'axe', dropItem: 'crimson_stem',
    sound: 'wood', category: 'nether116',
    textures: { top: 'crimson_stem_top', bottom: 'crimson_stem_top', side: 'crimson_stem' },
  },
  [BLOCK.CRIMSON_PLANKS]: {
    id: BLOCK.CRIMSON_PLANKS, key: 'crimson_planks', nameVi: 'Ván Nấm Đỏ', hardness: 1.5, tool: 'axe', dropItem: 'crimson_planks',
    sound: 'wood', category: 'nether116',
    textures: { top: 'crimson_planks', bottom: 'crimson_planks', side: 'crimson_planks' },
  },
  [BLOCK.NETHER_WART_BLOCK]: {
    id: BLOCK.NETHER_WART_BLOCK, key: 'nether_wart_block', nameVi: 'Khối Bướu Địa Ngục', hardness: 0.8, tool: 'none', dropItem: 'nether_wart_block',
    sound: 'grass', category: 'nether116',
    textures: { top: 'nether_wart_block', bottom: 'nether_wart_block', side: 'nether_wart_block' },
  },
  [BLOCK.WARPED_NYLIUM]: {
    id: BLOCK.WARPED_NYLIUM, key: 'warped_nylium', nameVi: 'Nấm Xanh Warped', hardness: 0.65, tool: 'pickaxe', dropItem: 'warped_nylium',
    sound: 'nether', category: 'nether116',
    textures: { top: 'warped_nylium', bottom: 'netherrack', side: 'warped_nylium_side' },
  },
  [BLOCK.WARPED_STEM]: {
    id: BLOCK.WARPED_STEM, key: 'warped_stem', nameVi: 'Thân Nấm Xanh', hardness: 1.8, tool: 'axe', dropItem: 'warped_stem',
    sound: 'wood', category: 'nether116',
    textures: { top: 'warped_stem_top', bottom: 'warped_stem_top', side: 'warped_stem' },
  },
  [BLOCK.WARPED_PLANKS]: {
    id: BLOCK.WARPED_PLANKS, key: 'warped_planks', nameVi: 'Ván Nấm Xanh', hardness: 1.5, tool: 'axe', dropItem: 'warped_planks',
    sound: 'wood', category: 'nether116',
    textures: { top: 'warped_planks', bottom: 'warped_planks', side: 'warped_planks' },
  },
  [BLOCK.WARPED_WART_BLOCK]: {
    id: BLOCK.WARPED_WART_BLOCK, key: 'warped_wart_block', nameVi: 'Khối Bướu Xanh', hardness: 0.8, tool: 'none', dropItem: 'warped_wart_block',
    sound: 'grass', category: 'nether116',
    textures: { top: 'warped_wart_block', bottom: 'warped_wart_block', side: 'warped_wart_block' },
  },
  [BLOCK.SHROOMLIGHT]: {
    id: BLOCK.SHROOMLIGHT, key: 'shroomlight', nameVi: 'Đèn Nấm Shroomlight', hardness: 0.7, tool: 'none', dropItem: 'shroomlight',
    emissive: true, sound: 'grass', category: 'nether116',
    textures: { top: 'shroomlight', bottom: 'shroomlight', side: 'shroomlight' },
  },
  [BLOCK.SOUL_SAND]: {
    id: BLOCK.SOUL_SAND, key: 'soul_sand', nameVi: 'Cát Linh Hồn', hardness: 0.55, tool: 'shovel', dropItem: 'soul_sand',
    sound: 'sand', category: 'nether116',
    textures: { top: 'soul_sand', bottom: 'soul_sand', side: 'soul_sand' },
  },
  [BLOCK.SOUL_SOIL]: {
    id: BLOCK.SOUL_SOIL, key: 'soul_soil', nameVi: 'Đất Linh Hồn', hardness: 0.55, tool: 'shovel', dropItem: 'soul_soil',
    sound: 'dirt', category: 'nether116',
    textures: { top: 'soul_soil', bottom: 'soul_soil', side: 'soul_soil' },
  },
  [BLOCK.SOUL_FIRE]: {
    id: BLOCK.SOUL_FIRE, key: 'soul_fire', nameVi: 'Lửa Linh Hồn', hardness: 0.1, tool: 'none', dropItem: null,
    transparent: true, nonSolid: true, emissive: true, damagePerSec: 3, sound: 'grass', category: 'nether116',
    textures: { top: 'soul_fire', bottom: 'soul_fire', side: 'soul_fire' },
  },
  [BLOCK.BASALT]: {
    id: BLOCK.BASALT, key: 'basalt', nameVi: 'Đá Bazan', hardness: 1.8, tool: 'pickaxe', minTier: 1, dropItem: 'basalt',
    sound: 'stone', category: 'nether116',
    textures: { top: 'basalt_top', bottom: 'basalt_top', side: 'basalt_side' },
  },
  [BLOCK.BLACKSTONE]: {
    id: BLOCK.BLACKSTONE, key: 'blackstone', nameVi: 'Đá Đen Blackstone', hardness: 2.0, tool: 'pickaxe', minTier: 1, dropItem: 'blackstone',
    sound: 'stone', category: 'nether116',
    textures: { top: 'blackstone', bottom: 'blackstone', side: 'blackstone' },
  },
  [BLOCK.POLISHED_BLACKSTONE]: {
    id: BLOCK.POLISHED_BLACKSTONE, key: 'polished_blackstone', nameVi: 'Đá Đen Mài Bóng', hardness: 2.2, tool: 'pickaxe', minTier: 1, dropItem: 'polished_blackstone',
    sound: 'stone', category: 'nether116',
    textures: { top: 'polished_blackstone', bottom: 'polished_blackstone', side: 'polished_blackstone' },
  },
  [BLOCK.GILDED_BLACKSTONE]: {
    id: BLOCK.GILDED_BLACKSTONE, key: 'gilded_blackstone', nameVi: 'Đá Đen Dát Vàng', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'gold_ingot',
    sound: 'stone', category: 'nether116',
    textures: { top: 'gilded_blackstone', bottom: 'gilded_blackstone', side: 'gilded_blackstone' },
  },
  [BLOCK.MAGMA]: {
    id: BLOCK.MAGMA, key: 'magma_block', nameVi: 'Khối Magma', hardness: 1.0, tool: 'pickaxe', dropItem: 'magma_block',
    emissive: true, damagePerSec: 2, sound: 'stone', category: 'nether116',
    textures: { top: 'magma', bottom: 'magma', side: 'magma' },
  },
  [BLOCK.BONE_BLOCK]: {
    id: BLOCK.BONE_BLOCK, key: 'bone_block', nameVi: 'Khối Xương', hardness: 1.8, tool: 'pickaxe', dropItem: 'bone_block',
    sound: 'stone', category: 'nether116',
    textures: { top: 'bone_block_top', bottom: 'bone_block_top', side: 'bone_block_side' },
  },
  [BLOCK.ANCIENT_DEBRIS]: {
    id: BLOCK.ANCIENT_DEBRIS, key: 'ancient_debris', nameVi: 'Mảnh Vỡ Cổ Đại', hardness: 7.5, tool: 'pickaxe', minTier: 4, dropItem: 'ancient_debris',
    sound: 'metal', category: 'ores',
    textures: { top: 'ancient_debris_top', bottom: 'ancient_debris_top', side: 'ancient_debris_side' },
  },
  [BLOCK.NETHERITE_BLOCK]: {
    id: BLOCK.NETHERITE_BLOCK, key: 'netherite_block', nameVi: 'Khối Netherite', hardness: 8.0, tool: 'pickaxe', minTier: 4, dropItem: 'netherite_block',
    sound: 'metal', category: 'ores',
    textures: { top: 'netherite_block', bottom: 'netherite_block', side: 'netherite_block' },
  },
  [BLOCK.RESPAWN_ANCHOR]: {
    id: BLOCK.RESPAWN_ANCHOR, key: 'respawn_anchor', nameVi: 'Neo Hồi Sinh', hardness: 7.5, tool: 'pickaxe', minTier: 4, dropItem: 'respawn_anchor',
    emissive: true, sound: 'stone', category: 'nether116',
    textures: { top: 'respawn_anchor_top', bottom: 'obsidian', side: 'respawn_anchor_side' },
  },
  [BLOCK.SOUL_LANTERN]: {
    id: BLOCK.SOUL_LANTERN, key: 'soul_lantern', nameVi: 'Đèn Linh Hồn', hardness: 1.5, tool: 'pickaxe', dropItem: 'soul_lantern',
    emissive: true, sound: 'metal', category: 'nether116',
    textures: { top: 'soul_lantern', bottom: 'soul_lantern', side: 'soul_lantern' },
  },
  [BLOCK.TORCH]: {
    id: BLOCK.TORCH, key: 'torch', nameVi: 'Đuốc', hardness: 0.1, tool: 'none', dropItem: 'torch',
    transparent: true, nonSolid: true, emissive: true, sound: 'wood', category: 'building',
    textures: { top: 'torch', bottom: 'torch', side: 'torch' },
  },
  // --- EXPANDED MINECRAFT 1.16 BLOCKS ---
  [BLOCK.SPRUCE_LOG]: {
    id: BLOCK.SPRUCE_LOG, key: 'spruce_log', nameVi: 'Gỗ Vân Sam', hardness: 1.8, tool: 'axe', dropItem: 'spruce_log',
    sound: 'wood', category: 'building',
    textures: { top: 'spruce_log_top', bottom: 'spruce_log_top', side: 'spruce_log' },
  },
  [BLOCK.SPRUCE_PLANKS]: {
    id: BLOCK.SPRUCE_PLANKS, key: 'spruce_planks', nameVi: 'Ván Gỗ Vân Sam', hardness: 1.5, tool: 'axe', dropItem: 'spruce_planks',
    sound: 'wood', category: 'building',
    textures: { top: 'spruce_planks', bottom: 'spruce_planks', side: 'spruce_planks' },
  },
  [BLOCK.BIRCH_LOG]: {
    id: BLOCK.BIRCH_LOG, key: 'birch_log', nameVi: 'Gỗ Bạch Dương', hardness: 1.8, tool: 'axe', dropItem: 'birch_log',
    sound: 'wood', category: 'building',
    textures: { top: 'birch_log_top', bottom: 'birch_log_top', side: 'birch_log' },
  },
  [BLOCK.BIRCH_PLANKS]: {
    id: BLOCK.BIRCH_PLANKS, key: 'birch_planks', nameVi: 'Ván Bạch Dương', hardness: 1.5, tool: 'axe', dropItem: 'birch_planks',
    sound: 'wood', category: 'building',
    textures: { top: 'birch_planks', bottom: 'birch_planks', side: 'birch_planks' },
  },
  [BLOCK.STONE_BRICKS]: {
    id: BLOCK.STONE_BRICKS, key: 'stone_bricks', nameVi: 'Gạch Đá', hardness: 2.2, tool: 'pickaxe', minTier: 1, dropItem: 'stone_bricks',
    sound: 'stone', category: 'building',
    textures: { top: 'stone_bricks', bottom: 'stone_bricks', side: 'stone_bricks' },
  },
  [BLOCK.MOSSY_COBBLESTONE]: {
    id: BLOCK.MOSSY_COBBLESTONE, key: 'mossy_cobblestone', nameVi: 'Đá Cuội Rêu', hardness: 2.2, tool: 'pickaxe', minTier: 1, dropItem: 'mossy_cobblestone',
    sound: 'stone', category: 'building',
    textures: { top: 'mossy_cobblestone', bottom: 'mossy_cobblestone', side: 'mossy_cobblestone' },
  },
  [BLOCK.QUARTZ_BLOCK]: {
    id: BLOCK.QUARTZ_BLOCK, key: 'quartz_block', nameVi: 'Khối Thạch Anh', hardness: 1.6, tool: 'pickaxe', minTier: 1, dropItem: 'quartz_block',
    sound: 'stone', category: 'building',
    textures: { top: 'quartz_block', bottom: 'quartz_block', side: 'quartz_block' },
  },
  [BLOCK.NETHER_BRICKS]: {
    id: BLOCK.NETHER_BRICKS, key: 'nether_bricks', nameVi: 'Gạch Địa Ngục', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'nether_bricks',
    sound: 'nether', category: 'nether116',
    textures: { top: 'nether_bricks', bottom: 'nether_bricks', side: 'nether_bricks' },
  },
  [BLOCK.RED_NETHER_BRICKS]: {
    id: BLOCK.RED_NETHER_BRICKS, key: 'red_nether_bricks', nameVi: 'Gạch Địa Ngục Đỏ', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'red_nether_bricks',
    sound: 'nether', category: 'nether116',
    textures: { top: 'red_nether_bricks', bottom: 'red_nether_bricks', side: 'red_nether_bricks' },
  },
  [BLOCK.REDSTONE_ORE]: {
    id: BLOCK.REDSTONE_ORE, key: 'redstone_ore', nameVi: 'Quặng Redstone', hardness: 3.2, tool: 'pickaxe', minTier: 3, dropItem: 'redstone', dropCount: 4,
    sound: 'stone', category: 'ores',
    textures: { top: 'redstone_ore', bottom: 'redstone_ore', side: 'redstone_ore' },
  },
  [BLOCK.REDSTONE_BLOCK]: {
    id: BLOCK.REDSTONE_BLOCK, key: 'redstone_block', nameVi: 'Khối Redstone', hardness: 3.2, tool: 'pickaxe', minTier: 1, dropItem: 'redstone_block',
    emissive: true, sound: 'metal', category: 'ores',
    textures: { top: 'redstone_block', bottom: 'redstone_block', side: 'redstone_block' },
  },
  [BLOCK.EMERALD_ORE]: {
    id: BLOCK.EMERALD_ORE, key: 'emerald_ore', nameVi: 'Quặng Ngọc Lục Bảo', hardness: 3.6, tool: 'pickaxe', minTier: 3, dropItem: 'emerald',
    sound: 'stone', category: 'ores',
    textures: { top: 'emerald_ore', bottom: 'emerald_ore', side: 'emerald_ore' },
  },
  [BLOCK.EMERALD_BLOCK]: {
    id: BLOCK.EMERALD_BLOCK, key: 'emerald_block', nameVi: 'Khối Ngọc Lục Bảo', hardness: 4.0, tool: 'pickaxe', minTier: 3, dropItem: 'emerald_block',
    sound: 'metal', category: 'ores',
    textures: { top: 'emerald_block', bottom: 'emerald_block', side: 'emerald_block' },
  },
  [BLOCK.LAPIS_ORE]: {
    id: BLOCK.LAPIS_ORE, key: 'lapis_ore', nameVi: 'Quặng Lưu Ly', hardness: 3.0, tool: 'pickaxe', minTier: 2, dropItem: 'lapis_lazuli', dropCount: 4,
    sound: 'stone', category: 'ores',
    textures: { top: 'lapis_ore', bottom: 'lapis_ore', side: 'lapis_ore' },
  },
  [BLOCK.LAPIS_BLOCK]: {
    id: BLOCK.LAPIS_BLOCK, key: 'lapis_block', nameVi: 'Khối Lưu Ly', hardness: 3.2, tool: 'pickaxe', minTier: 2, dropItem: 'lapis_block',
    sound: 'metal', category: 'ores',
    textures: { top: 'lapis_block', bottom: 'lapis_block', side: 'lapis_block' },
  },
  [BLOCK.COAL_BLOCK]: {
    id: BLOCK.COAL_BLOCK, key: 'coal_block', nameVi: 'Khối Than Đá', hardness: 3.0, tool: 'pickaxe', minTier: 1, dropItem: 'coal_block',
    sound: 'stone', category: 'ores',
    textures: { top: 'coal_block', bottom: 'coal_block', side: 'coal_block' },
  },
  [BLOCK.CHEST]: {
    id: BLOCK.CHEST, key: 'chest', nameVi: 'Rương Gỗ', hardness: 2.0, tool: 'axe', dropItem: 'chest',
    sound: 'wood', category: 'building',
    textures: { top: 'chest_top', bottom: 'chest_top', side: 'chest_side', front: 'chest_front' },
  },
  [BLOCK.BOOKSHELF]: {
    id: BLOCK.BOOKSHELF, key: 'bookshelf', nameVi: 'Kệ Sách', hardness: 1.5, tool: 'axe', dropItem: 'bookshelf',
    sound: 'wood', category: 'building',
    textures: { top: 'oak_planks', bottom: 'oak_planks', side: 'bookshelf' },
  },
  [BLOCK.BED]: {
    id: BLOCK.BED, key: 'red_bed', nameVi: 'Giường Đỏ', hardness: 0.4, tool: 'none', dropItem: 'red_bed',
    sound: 'wood', category: 'building',
    textures: { top: 'bed_top', bottom: 'oak_planks', side: 'bed_side' },
  },
  [BLOCK.LANTERN]: {
    id: BLOCK.LANTERN, key: 'lantern', nameVi: 'Đèn Lồng', hardness: 1.5, tool: 'pickaxe', dropItem: 'lantern',
    emissive: true, sound: 'metal', category: 'building',
    textures: { top: 'lantern', bottom: 'lantern', side: 'lantern' },
  },
  [BLOCK.SOUL_TORCH]: {
    id: BLOCK.SOUL_TORCH, key: 'soul_torch', nameVi: 'Đuốc Linh Hồn', hardness: 0.1, tool: 'none', dropItem: 'soul_torch',
    transparent: true, nonSolid: true, emissive: true, sound: 'wood', category: 'nether116',
    textures: { top: 'soul_torch', bottom: 'soul_torch', side: 'soul_torch' },
  },
  [BLOCK.CAMPFIRE]: {
    id: BLOCK.CAMPFIRE, key: 'campfire', nameVi: 'Lửa Trại', hardness: 1.4, tool: 'axe', dropItem: 'campfire',
    emissive: true, damagePerSec: 1, sound: 'wood', category: 'building',
    textures: { top: 'campfire_top', bottom: 'oak_log_top', side: 'campfire_side' },
  },
  [BLOCK.ENCHANTING_TABLE]: {
    id: BLOCK.ENCHANTING_TABLE, key: 'enchanting_table', nameVi: 'Bàn Phù Phép', hardness: 5.0, tool: 'pickaxe', minTier: 3, dropItem: 'enchanting_table',
    emissive: true, sound: 'stone', category: 'building',
    textures: { top: 'enchanting_table_top', bottom: 'obsidian', side: 'enchanting_table_side' },
  },
  [BLOCK.ANVIL]: {
    id: BLOCK.ANVIL, key: 'anvil', nameVi: 'Cái Đe', hardness: 4.5, tool: 'pickaxe', minTier: 1, dropItem: 'anvil',
    sound: 'metal', category: 'building',
    textures: { top: 'anvil_top', bottom: 'anvil_top', side: 'anvil_side' },
  },
  [BLOCK.HAY_BLOCK]: {
    id: BLOCK.HAY_BLOCK, key: 'hay_block', nameVi: 'Khối Rơm', hardness: 0.6, tool: 'hoe', dropItem: 'hay_block',
    sound: 'grass', category: 'building',
    textures: { top: 'hay_block_top', bottom: 'hay_block_top', side: 'hay_block_side' },
  },
  [BLOCK.PUMPKIN]: {
    id: BLOCK.PUMPKIN, key: 'pumpkin', nameVi: 'Bí Ngô', hardness: 1.0, tool: 'axe', dropItem: 'pumpkin',
    sound: 'wood', category: 'building',
    textures: { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side', front: 'pumpkin_front' },
  },
  [BLOCK.JACK_O_LANTERN]: {
    id: BLOCK.JACK_O_LANTERN, key: 'jack_o_lantern', nameVi: 'Đèn Bí Ngô', hardness: 1.0, tool: 'axe', dropItem: 'jack_o_lantern',
    emissive: true, sound: 'wood', category: 'building',
    textures: { top: 'pumpkin_top', bottom: 'pumpkin_top', side: 'pumpkin_side', front: 'jack_o_lantern_front' },
  },
  [BLOCK.MELON]: {
    id: BLOCK.MELON, key: 'melon', nameVi: 'Dưa Hấu', hardness: 1.0, tool: 'axe', dropItem: 'melon_slice', dropCount: 4,
    sound: 'wood', category: 'building',
    textures: { top: 'melon_top', bottom: 'melon_top', side: 'melon_side' },
  },
  [BLOCK.WOOL_WHITE]: {
    id: BLOCK.WOOL_WHITE, key: 'white_wool', nameVi: 'Len Trắng', hardness: 0.6, tool: 'none', dropItem: 'white_wool',
    sound: 'grass', category: 'building',
    textures: { top: 'wool_white', bottom: 'wool_white', side: 'wool_white' },
  },
  [BLOCK.WOOL_RED]: {
    id: BLOCK.WOOL_RED, key: 'red_wool', nameVi: 'Len Đỏ', hardness: 0.6, tool: 'none', dropItem: 'red_wool',
    sound: 'grass', category: 'building',
    textures: { top: 'wool_red', bottom: 'wool_red', side: 'wool_red' },
  },
  [BLOCK.WOOL_BLUE]: {
    id: BLOCK.WOOL_BLUE, key: 'blue_wool', nameVi: 'Len Xanh Dương', hardness: 0.6, tool: 'none', dropItem: 'blue_wool',
    sound: 'grass', category: 'building',
    textures: { top: 'wool_blue', bottom: 'wool_blue', side: 'wool_blue' },
  },
  [BLOCK.WOOL_YELLOW]: {
    id: BLOCK.WOOL_YELLOW, key: 'yellow_wool', nameVi: 'Len Vàng', hardness: 0.6, tool: 'none', dropItem: 'yellow_wool',
    sound: 'grass', category: 'building',
    textures: { top: 'wool_yellow', bottom: 'wool_yellow', side: 'wool_yellow' },
  },
  [BLOCK.WOOL_GREEN]: {
    id: BLOCK.WOOL_GREEN, key: 'green_wool', nameVi: 'Len Xanh Lá', hardness: 0.6, tool: 'none', dropItem: 'green_wool',
    sound: 'grass', category: 'building',
    textures: { top: 'wool_green', bottom: 'wool_green', side: 'wool_green' },
  },
  [BLOCK.WOOL_BLACK]: {
    id: BLOCK.WOOL_BLACK, key: 'black_wool', nameVi: 'Len Đen', hardness: 0.6, tool: 'none', dropItem: 'black_wool',
    sound: 'grass', category: 'building',
    textures: { top: 'wool_black', bottom: 'wool_black', side: 'wool_black' },
  },
  [BLOCK.OAK_FENCE]: {
    id: BLOCK.OAK_FENCE, key: 'oak_fence', nameVi: 'Hàng Rào Gỗ', hardness: 1.5, tool: 'axe', dropItem: 'oak_fence',
    sound: 'wood', category: 'building',
    textures: { top: 'oak_planks', bottom: 'oak_planks', side: 'oak_fence' },
  },
  [BLOCK.LADDER]: {
    id: BLOCK.LADDER, key: 'ladder', nameVi: 'Thang Gỗ', hardness: 0.5, tool: 'axe', dropItem: 'ladder',
    transparent: true, nonSolid: true, sound: 'wood', category: 'building',
    textures: { top: 'ladder', bottom: 'ladder', side: 'ladder' },
  },
};

// Merge all extended Minecraft 1.16 blocks (IDs 94+)
Object.assign(BLOCK_DEFS, EXT_BLOCK_DEFS);

export const BLOCK_BY_KEY: Record<string, BlockDef> = {};
for (const def of Object.values(BLOCK_DEFS)) {
  BLOCK_BY_KEY[def.key] = def;
}

export type ItemIconShape =
  | 'pickaxe'
  | 'sword'
  | 'axe'
  | 'shovel'
  | 'hoe'
  | 'ingot'
  | 'gem'
  | 'stick'
  | 'flint_steel'
  | 'food'
  | 'apple'
  | 'bread'
  | 'helmet'
  | 'chestplate'
  | 'leggings'
  | 'boots'
  | 'dust'
  | 'bucket'
  | 'bucket_water'
  | 'bucket_lava'
  | 'bow'
  | 'arrow'
  | 'shield'
  | 'shears'
  | 'book'
  | 'paper'
  | 'bone'
  | 'string'
  | 'totem'
  | 'rod'
  | 'pearl'
  | 'feather'
  | 'potion'
  | 'elytra'
  | 'trident'
  | 'compass'
  | 'clock'
  | 'bowl'
  | 'boat'
  | 'banner'
  | 'disc';

export interface ItemDef {
  id: string;
  nameVi: string;
  maxStack: number;
  blockId?: number;
  category: CreativeCategory;
  toolKind?: ToolKind;
  toolTier?: number;
  miningSpeed?: number;
  attackDamage?: number;
  armorSlot?: 0 | 1 | 2 | 3; // 0 helmet, 1 chest, 2 legs, 3 boots
  armorDefense?: number;
  foodRestore?: number;
  healRestore?: number;
  potionEffect?: { id: EffectId; amplifier: number; durationSec: number };
  fuelTime?: number;
  isFlintAndSteel?: boolean;
  bucketKind?: 'empty' | 'water' | 'lava';
  isTotem?: boolean;
  iconColor?: string;
  iconAccent?: string;
  iconShape?: ItemIconShape;
}

export const ITEM_DEFS: Record<string, ItemDef> = {};

// Register all placeable blocks as items
for (const def of Object.values(BLOCK_DEFS)) {
  if (
    def.id === BLOCK.AIR ||
    def.id === BLOCK.WATER ||
    def.id === BLOCK.LAVA ||
    def.id === BLOCK.NETHER_PORTAL ||
    def.id === BLOCK.SOUL_FIRE
  ) {
    continue;
  }
  ITEM_DEFS[def.key] = {
    id: def.key,
    nameVi: def.nameVi,
    maxStack: def.id === BLOCK.BED ? 1 : 64,
    blockId: def.id,
    category: def.category,
    fuelTime:
      def.key === 'coal_block'
        ? 800
        : def.key === 'dried_kelp_block'
          ? 200
          : def.key === 'bamboo' || def.key === 'scaffolding'
            ? 4
            : def.key.includes('log') ||
                def.key.includes('planks') ||
                def.key.includes('fence') ||
                def.key.includes('oak_') ||
                def.key === 'barrel' ||
                def.key === 'loom' ||
                def.key === 'cartography_table' ||
                def.key === 'fletching_table' ||
                def.key === 'lectern' ||
                def.key === 'composter' ||
                def.key === 'note_block' ||
                def.key === 'jukebox'
              ? 15
              : undefined,
  };
}

const EXTRA_ITEMS: ItemDef[] = [
  // --- MATERIALS & MOB DROPS ---
  { id: 'stick', nameVi: 'Que Gỗ', maxStack: 64, category: 'ores', fuelTime: 5, iconShape: 'stick', iconColor: '#8d6438', iconAccent: '#c4965a' },
  { id: 'coal', nameVi: 'Than Đá', maxStack: 64, category: 'ores', fuelTime: 80, iconShape: 'gem', iconColor: '#2a2a2e', iconAccent: '#52525b' },
  { id: 'flint', nameVi: 'Đá Lửa', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#3f3f46', iconAccent: '#9ca3af' },
  { id: 'iron_ingot', nameVi: 'Thỏi Sắt', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'gold_ingot', nameVi: 'Thỏi Vàng', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond', nameVi: 'Kim Cương', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'emerald', nameVi: 'Ngọc Lục Bảo', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#17dd62', iconAccent: '#a7f3d0' },
  { id: 'lapis_lazuli', nameVi: 'Ngọc Lưu Ly', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#2452bd', iconAccent: '#60a5fa' },
  { id: 'redstone', nameVi: 'Bột Redstone', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#dc2626', iconAccent: '#fca5a5' },
  { id: 'quartz', nameVi: 'Thạch Anh Nether', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#eae3d5', iconAccent: '#ffffff' },
  { id: 'netherite_scrap', nameVi: 'Mảnh Netherite', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#6d4b40', iconAccent: '#9e7464' },
  { id: 'netherite_ingot', nameVi: 'Thỏi Netherite', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#4c464f', iconAccent: '#867a8c' },
  { id: 'glowstone_dust', nameVi: 'Bụi Phát Sáng', maxStack: 64, category: 'nether116', iconShape: 'dust', iconColor: '#eab308', iconAccent: '#fef08a' },
  { id: 'blaze_rod', nameVi: 'Que Quỷ Lửa', maxStack: 64, category: 'nether116', fuelTime: 120, iconShape: 'rod', iconColor: '#f59e0b', iconAccent: '#fef08a' },
  { id: 'blaze_powder', nameVi: 'Bột Quỷ Lửa', maxStack: 64, category: 'nether116', iconShape: 'dust', iconColor: '#f97316', iconAccent: '#fde047' },
  { id: 'magma_cream', nameVi: 'Kem Magma', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#ea580c', iconAccent: '#fde047' },
  { id: 'ghast_tear', nameVi: 'Nước Mắt Ghast', maxStack: 16, category: 'nether116', iconShape: 'pearl', iconColor: '#e2e8f0', iconAccent: '#ffffff' },
  { id: 'nether_star', nameVi: 'Sao Địa Ngục', maxStack: 64, category: 'nether116', iconShape: 'gem', iconColor: '#fef9c3', iconAccent: '#ffffff' },
  { id: 'ender_pearl', nameVi: 'Ngọc Ender', maxStack: 16, category: 'ores', iconShape: 'pearl', iconColor: '#0e6961', iconAccent: '#34d399' },
  { id: 'leather', nameVi: 'Da Thuộc', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#9c5a32', iconAccent: '#c98253' },
  { id: 'string', nameVi: 'Tơ Nhện', maxStack: 64, category: 'ores', iconShape: 'string', iconColor: '#e4e4e7', iconAccent: '#ffffff' },
  { id: 'feather', nameVi: 'Lông Vũ', maxStack: 64, category: 'ores', iconShape: 'feather', iconColor: '#f4f4f5', iconAccent: '#d4d4d8' },
  { id: 'bone', nameVi: 'Xương', maxStack: 64, category: 'ores', iconShape: 'bone', iconColor: '#ece8d9', iconAccent: '#ffffff' },
  { id: 'gunpowder', nameVi: 'Thuốc Súng', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#52525b', iconAccent: '#a1a1aa' },
  { id: 'brick', nameVi: 'Viên Gạch', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#9e4736', iconAccent: '#c46552' },
  { id: 'nether_brick', nameVi: 'Gạch Nether', maxStack: 64, category: 'nether116', iconShape: 'ingot', iconColor: '#3b1d23', iconAccent: '#61323b' },
  { id: 'paper', nameVi: 'Giấy', maxStack: 64, category: 'ores', iconShape: 'paper', iconColor: '#f4f4f5', iconAccent: '#d4d4d8' },
  { id: 'book', nameVi: 'Sách', maxStack: 64, category: 'ores', iconShape: 'book', iconColor: '#7c4a26', iconAccent: '#f5f5f4' },
  { id: 'wheat', nameVi: 'Lúa Mì', maxStack: 64, category: 'armor_food', iconShape: 'rod', iconColor: '#d4a938', iconAccent: '#f5dc7a' },
  { id: 'slime_ball', nameVi: 'Bóng Slime', maxStack: 64, category: 'ores', iconShape: 'pearl', iconColor: '#65c44b', iconAccent: '#bef264' },

  // --- UTILITY TOOLS ---
  { id: 'flint_and_steel', nameVi: 'Bật Lửa', maxStack: 1, category: 'tools', isFlintAndSteel: true, iconShape: 'flint_steel', iconColor: '#d1d5db', iconAccent: '#f97316' },
  { id: 'bucket', nameVi: 'Xô Sắt', maxStack: 16, category: 'tools', bucketKind: 'empty', iconShape: 'bucket', iconColor: '#c4c9d0', iconAccent: '#ffffff' },
  { id: 'water_bucket', nameVi: 'Xô Nước', maxStack: 1, category: 'tools', bucketKind: 'water', iconShape: 'bucket_water', iconColor: '#c4c9d0', iconAccent: '#3b82f6' },
  { id: 'lava_bucket', nameVi: 'Xô Dung Nham', maxStack: 1, category: 'tools', bucketKind: 'lava', fuelTime: 1000, iconShape: 'bucket_lava', iconColor: '#c4c9d0', iconAccent: '#f97316' },
  { id: 'shears', nameVi: 'Kéo Cắt', maxStack: 1, category: 'tools', toolKind: 'none', miningSpeed: 5.0, iconShape: 'shears', iconColor: '#d4d8dc', iconAccent: '#ef4444' },
  { id: 'bow', nameVi: 'Cung Tên', maxStack: 1, category: 'tools', attackDamage: 6, iconShape: 'bow', iconColor: '#8d6438', iconAccent: '#e4e4e7' },
  { id: 'arrow', nameVi: 'Mũi Tên', maxStack: 64, category: 'tools', iconShape: 'arrow', iconColor: '#9ca3af', iconAccent: '#f4f4f5' },
  { id: 'shield', nameVi: 'Khiên', maxStack: 1, category: 'tools', attackDamage: 2, iconShape: 'shield', iconColor: '#9c7244', iconAccent: '#cbd5e1' },
  { id: 'totem_of_undying', nameVi: 'Vật Tổ Bất Tử', maxStack: 1, category: 'armor_food', isTotem: true, iconShape: 'totem', iconColor: '#f5c531', iconAccent: '#22c55e' },

  // --- PICKAXES (ALL 6 TIERS) ---
  { id: 'wooden_pickaxe', nameVi: 'Cuốc Gỗ', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 1, miningSpeed: 2.2, attackDamage: 2, iconShape: 'pickaxe', iconColor: '#a67c46', iconAccent: '#d6ab6d' },
  { id: 'stone_pickaxe', nameVi: 'Cuốc Đá', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 2, miningSpeed: 4.0, attackDamage: 3, iconShape: 'pickaxe', iconColor: '#8d8d94', iconAccent: '#c5c5cc' },
  { id: 'iron_pickaxe', nameVi: 'Cuốc Sắt', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 3, miningSpeed: 6.0, attackDamage: 4, iconShape: 'pickaxe', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'golden_pickaxe', nameVi: 'Cuốc Vàng', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 2.5, miningSpeed: 9.0, attackDamage: 3, iconShape: 'pickaxe', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond_pickaxe', nameVi: 'Cuốc Kim Cương', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 4, miningSpeed: 8.5, attackDamage: 5, iconShape: 'pickaxe', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_pickaxe', nameVi: 'Cuốc Netherite', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 5, miningSpeed: 11.5, attackDamage: 6, iconShape: 'pickaxe', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // --- SWORDS (ALL 6 TIERS) ---
  { id: 'wooden_sword', nameVi: 'Kiếm Gỗ', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 1, miningSpeed: 1.5, attackDamage: 4, iconShape: 'sword', iconColor: '#a67c46', iconAccent: '#d6ab6d' },
  { id: 'stone_sword', nameVi: 'Kiếm Đá', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 2, miningSpeed: 1.5, attackDamage: 5, iconShape: 'sword', iconColor: '#8d8d94', iconAccent: '#c5c5cc' },
  { id: 'iron_sword', nameVi: 'Kiếm Sắt', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 3, miningSpeed: 1.5, attackDamage: 6, iconShape: 'sword', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'golden_sword', nameVi: 'Kiếm Vàng', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 2.5, miningSpeed: 1.5, attackDamage: 5, iconShape: 'sword', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond_sword', nameVi: 'Kiếm Kim Cương', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 4, miningSpeed: 1.5, attackDamage: 7, iconShape: 'sword', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_sword', nameVi: 'Kiếm Netherite', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 5, miningSpeed: 1.5, attackDamage: 9, iconShape: 'sword', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // --- AXES (ALL 6 TIERS) ---
  { id: 'wooden_axe', nameVi: 'Rìu Gỗ', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 1, miningSpeed: 2.2, attackDamage: 5, iconShape: 'axe', iconColor: '#a67c46', iconAccent: '#d6ab6d' },
  { id: 'stone_axe', nameVi: 'Rìu Đá', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 2, miningSpeed: 4.0, attackDamage: 6, iconShape: 'axe', iconColor: '#8d8d94', iconAccent: '#c5c5cc' },
  { id: 'iron_axe', nameVi: 'Rìu Sắt', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 3, miningSpeed: 6.0, attackDamage: 7, iconShape: 'axe', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'golden_axe', nameVi: 'Rìu Vàng', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 2.5, miningSpeed: 9.0, attackDamage: 6, iconShape: 'axe', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond_axe', nameVi: 'Rìu Kim Cương', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 4, miningSpeed: 8.0, attackDamage: 8, iconShape: 'axe', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_axe', nameVi: 'Rìu Netherite', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 5, miningSpeed: 10.5, attackDamage: 10, iconShape: 'axe', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // --- SHOVELS (ALL 6 TIERS) ---
  { id: 'wooden_shovel', nameVi: 'Xẻng Gỗ', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 1, miningSpeed: 2.4, attackDamage: 2, iconShape: 'shovel', iconColor: '#a67c46', iconAccent: '#d6ab6d' },
  { id: 'stone_shovel', nameVi: 'Xẻng Đá', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 2, miningSpeed: 4.2, attackDamage: 3, iconShape: 'shovel', iconColor: '#8d8d94', iconAccent: '#c5c5cc' },
  { id: 'iron_shovel', nameVi: 'Xẻng Sắt', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 3, miningSpeed: 6.2, attackDamage: 3, iconShape: 'shovel', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'golden_shovel', nameVi: 'Xẻng Vàng', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 2.5, miningSpeed: 9.5, attackDamage: 3, iconShape: 'shovel', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond_shovel', nameVi: 'Xẻng Kim Cương', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 4, miningSpeed: 8.5, attackDamage: 4, iconShape: 'shovel', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_shovel', nameVi: 'Xẻng Netherite', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 5, miningSpeed: 11.0, attackDamage: 5, iconShape: 'shovel', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // --- HOES (ALL 6 TIERS) ---
  { id: 'wooden_hoe', nameVi: 'Cuốc Đất Gỗ', maxStack: 1, category: 'tools', toolKind: 'hoe', toolTier: 1, miningSpeed: 2.5, attackDamage: 1, iconShape: 'hoe', iconColor: '#a67c46', iconAccent: '#d6ab6d' },
  { id: 'stone_hoe', nameVi: 'Cuốc Đất Đá', maxStack: 1, category: 'tools', toolKind: 'hoe', toolTier: 2, miningSpeed: 4.0, attackDamage: 1, iconShape: 'hoe', iconColor: '#8d8d94', iconAccent: '#c5c5cc' },
  { id: 'iron_hoe', nameVi: 'Cuốc Đất Sắt', maxStack: 1, category: 'tools', toolKind: 'hoe', toolTier: 3, miningSpeed: 6.0, attackDamage: 2, iconShape: 'hoe', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'golden_hoe', nameVi: 'Cuốc Đất Vàng', maxStack: 1, category: 'tools', toolKind: 'hoe', toolTier: 2.5, miningSpeed: 8.0, attackDamage: 1, iconShape: 'hoe', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond_hoe', nameVi: 'Cuốc Đất Kim Cương', maxStack: 1, category: 'tools', toolKind: 'hoe', toolTier: 4, miningSpeed: 8.5, attackDamage: 2, iconShape: 'hoe', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_hoe', nameVi: 'Cuốc Đất Netherite', maxStack: 1, category: 'tools', toolKind: 'hoe', toolTier: 5, miningSpeed: 10.5, attackDamage: 3, iconShape: 'hoe', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // --- FULL ARMOR SETS (LEATHER, IRON, GOLD, DIAMOND, NETHERITE = 20 PIECES) ---
  { id: 'leather_helmet', nameVi: 'Mũ Da', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 1, iconShape: 'helmet', iconColor: '#9c5a32', iconAccent: '#c98253' },
  { id: 'leather_chestplate', nameVi: 'Áo Giáp Da', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 3, iconShape: 'chestplate', iconColor: '#9c5a32', iconAccent: '#c98253' },
  { id: 'leather_leggings', nameVi: 'Quần Da', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 2, iconShape: 'leggings', iconColor: '#9c5a32', iconAccent: '#c98253' },
  { id: 'leather_boots', nameVi: 'Giày Da', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 1, iconShape: 'boots', iconColor: '#9c5a32', iconAccent: '#c98253' },

  { id: 'iron_helmet', nameVi: 'Mũ Sắt', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'iron_chestplate', nameVi: 'Áo Giáp Sắt', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 6, iconShape: 'chestplate', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'iron_leggings', nameVi: 'Quần Sắt', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 5, iconShape: 'leggings', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'iron_boots', nameVi: 'Giày Sắt', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 2, iconShape: 'boots', iconColor: '#d4d8dc', iconAccent: '#ffffff' },

  { id: 'gold_helmet', nameVi: 'Mũ Vàng', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'gold_chestplate', nameVi: 'Áo Giáp Vàng', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 5, iconShape: 'chestplate', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'gold_leggings', nameVi: 'Quần Vàng', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 3, iconShape: 'leggings', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'gold_boots', nameVi: 'Giày Vàng', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 1, iconShape: 'boots', iconColor: '#f5c531', iconAccent: '#fff2a6' },

  { id: 'diamond_helmet', nameVi: 'Mũ Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 3, iconShape: 'helmet', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'diamond_chestplate', nameVi: 'Áo Giáp Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 8, iconShape: 'chestplate', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'diamond_leggings', nameVi: 'Quần Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 6, iconShape: 'leggings', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'diamond_boots', nameVi: 'Giày Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 3, iconShape: 'boots', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },

  { id: 'netherite_helmet', nameVi: 'Mũ Netherite', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 4, iconShape: 'helmet', iconColor: '#4c464f', iconAccent: '#a78bfa' },
  { id: 'netherite_chestplate', nameVi: 'Áo Giáp Netherite', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 8, iconShape: 'chestplate', iconColor: '#4c464f', iconAccent: '#a78bfa' },
  { id: 'netherite_leggings', nameVi: 'Quần Netherite', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 6, iconShape: 'leggings', iconColor: '#4c464f', iconAccent: '#a78bfa' },
  { id: 'netherite_boots', nameVi: 'Giày Netherite', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 4, iconShape: 'boots', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // --- FOODS ---
  { id: 'apple', nameVi: 'Táo Đỏ', maxStack: 64, category: 'armor_food', foodRestore: 4, healRestore: 1, iconShape: 'apple', iconColor: '#dc2626', iconAccent: '#fca5a5' },
  { id: 'golden_apple', nameVi: 'Táo Vàng', maxStack: 64, category: 'armor_food', foodRestore: 6, healRestore: 8, iconShape: 'apple', iconColor: '#f5c531', iconAccent: '#fff6b0' },
  { id: 'enchanted_golden_apple', nameVi: 'Táo Vàng Phù Phép', maxStack: 64, category: 'armor_food', foodRestore: 10, healRestore: 16, iconShape: 'apple', iconColor: '#eab308', iconAccent: '#d8b4fe' },
  { id: 'bread', nameVi: 'Bánh Mì', maxStack: 64, category: 'armor_food', foodRestore: 5, healRestore: 1, iconShape: 'bread', iconColor: '#c98a3a', iconAccent: '#f2cb79' },
  { id: 'raw_porkchop', nameVi: 'Thịt Heo Sống', maxStack: 64, category: 'armor_food', foodRestore: 3, iconShape: 'food', iconColor: '#f29b9b', iconAccent: '#ffd4d4' },
  { id: 'cooked_porkchop', nameVi: 'Thịt Heo Chín', maxStack: 64, category: 'armor_food', foodRestore: 8, healRestore: 2, iconShape: 'food', iconColor: '#b56c3b', iconAccent: '#e2a36b' },
  { id: 'raw_beef', nameVi: 'Thịt Bò Sống', maxStack: 64, category: 'armor_food', foodRestore: 3, iconShape: 'food', iconColor: '#dc4c4c', iconAccent: '#fca5a5' },
  { id: 'steak', nameVi: 'Bít Tết Bò', maxStack: 64, category: 'armor_food', foodRestore: 8, healRestore: 3, iconShape: 'food', iconColor: '#783c24', iconAccent: '#b56845' },
  { id: 'raw_chicken', nameVi: 'Thịt Gà Sống', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#f5c9b8', iconAccent: '#fff0e8' },
  { id: 'cooked_chicken', nameVi: 'Gà Quay', maxStack: 64, category: 'armor_food', foodRestore: 6, healRestore: 2, iconShape: 'food', iconColor: '#c47b3b', iconAccent: '#f0b86e' },
  { id: 'carrot', nameVi: 'Cà Rốt', maxStack: 64, category: 'armor_food', foodRestore: 3, iconShape: 'rod', iconColor: '#ea580c', iconAccent: '#4ade80' },
  { id: 'golden_carrot', nameVi: 'Cà Rốt Vàng', maxStack: 64, category: 'armor_food', foodRestore: 7, healRestore: 3, iconShape: 'rod', iconColor: '#f5c531', iconAccent: '#fef08a' },
  { id: 'baked_potato', nameVi: 'Khoai Tây Nướng', maxStack: 64, category: 'armor_food', foodRestore: 5, healRestore: 1, iconShape: 'food', iconColor: '#c99848', iconAccent: '#f3d893' },
  { id: 'melon_slice', nameVi: 'Miếng Dưa Hấu', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#ef4444', iconAccent: '#22c55e' },
  { id: 'cookie', nameVi: 'Bánh Quy', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#c2833e', iconAccent: '#45240e' },
  { id: 'pumpkin_pie', nameVi: 'Bánh Bí Ngô', maxStack: 64, category: 'armor_food', foodRestore: 8, healRestore: 2, iconShape: 'food', iconColor: '#d97706', iconAccent: '#fde68a' },
];

for (const item of EXTRA_ITEMS) {
  ITEM_DEFS[item.id] = item;
}
for (const item of EXT_ITEMS) {
  if (!ITEM_DEFS[item.id]) {
    ITEM_DEFS[item.id] = item;
  }
}

export const ALL_TEXTURE_KEYS = Array.from(
  new Set(
    Object.values(BLOCK_DEFS)
      .filter((b) => b.id !== BLOCK.AIR)
      .flatMap((b) => [
        b.textures.top,
        b.textures.bottom,
        b.textures.side,
        ...(b.textures.front ? [b.textures.front] : []),
      ]),
  ),
);

export type BlockShape =
  | 'cube'
  | 'liquid'
  | 'torch'
  | 'lantern'
  | 'cross'
  | 'chain'
  | 'end_rod'
  | 'slab'
  | 'stairs'
  | 'fence'
  | 'wall'
  | 'fence_gate'
  | 'pane'
  | 'carpet'
  | 'pressure_plate'
  | 'button'
  | 'rail'
  | 'ladder'
  | 'trapdoor'
  | 'door'
  | 'campfire'
  | 'bed'
  | 'anvil'
  | 'enchanting_table'
  | 'cake'
  | 'chest'
  | 'bell'
  | 'flower_pot'
  | 'lever'
  | 'sign'
  | 'bamboo'
  | 'cactus'
  | 'repeater'
  | 'daylight_detector'
  | 'stonecutter'
  | 'grindstone'
  | 'lectern'
  | 'cauldron'
  | 'hopper'
  | 'end_portal_frame'
  | 'conduit'
  | 'dragon_egg'
  | 'turtle_egg'
  | 'farmland';

export interface LightEmission {
  level: number; // 0..15
  r: number;
  g: number;
  b: number;
}

const NO_LIGHT: LightEmission = { level: 0, r: 0, g: 0, b: 0 };

function classifyBlockShape(def: BlockDef): BlockShape {
  if (def.liquid) return 'liquid';
  const k = def.key;
  if (k === 'torch' || k === 'soul_torch' || k === 'redstone_torch') return 'torch';
  if (k === 'lantern' || k === 'soul_lantern') return 'lantern';
  if (k === 'chain') return 'chain';
  if (k === 'end_rod') return 'end_rod';
  if (
    k === 'soul_fire' ||
    k.endsWith('_sapling') ||
    k === 'sugar_cane' ||
    k === 'cobweb' ||
    k === 'crimson_roots' ||
    k === 'warped_roots' ||
    k === 'weeping_vines' ||
    k === 'twisting_vines' ||
    k === 'nether_sprouts' ||
    k === 'vine' ||
    k === 'sea_pickle' ||
    k === 'brewing_stand' ||
    k === 'poppy' ||
    k === 'dandelion' ||
    k === 'cornflower' ||
    k === 'blue_orchid' ||
    k === 'allium' ||
    k === 'oxeye_daisy' ||
    k === 'lily_of_the_valley' ||
    k === 'wither_rose' ||
    k === 'sunflower' ||
    k === 'rose_bush' ||
    k === 'red_mushroom' ||
    k === 'brown_mushroom' ||
    k === 'crimson_fungus' ||
    k === 'warped_fungus' ||
    k === 'tall_grass' ||
    k === 'dead_bush' ||
    k === 'wheat_crop' ||
    k === 'nether_wart_crop' ||
    k === 'sweet_berry_bush' ||
    k === 'open_eyeblossom' ||
    k === 'firefly_bush' ||
    k === 'cactus_flower' ||
    k === 'glow_lichen' ||
    k === 'hanging_roots' ||
    k === 'pointed_dripstone' ||
    k === 'amethyst_cluster' ||
    k === 'mangrove_propagule' ||
    k === 'torchflower' ||
    k === 'pitcher_plant' ||
    k === 'ice_crystal' ||
    k === 'icicle' ||
    k === 'bush' ||
    k === 'short_dry_grass'
  ) {
    return 'cross';
  }
  if (k === 'copper_torch' || k === 'candle') return 'torch';
  if (k === 'copper_lantern') return 'lantern';
  if (k === 'copper_chain' || k === 'lightning_rod') return 'chain';
  if (k === 'heavy_core') return 'conduit';
  if (k === 'sculk_sensor' || k === 'sculk_shrieker') return 'slab';
  if (k.endsWith('_slab')) return 'slab';
  if (k.endsWith('_stairs')) return 'stairs';
  if (k.endsWith('_fence_gate')) return 'fence_gate';
  if (k.endsWith('_fence')) return 'fence';
  if (k.endsWith('_wall')) return 'wall';
  if (k === 'glass_pane' || k === 'iron_bars' || k === 'copper_bars') return 'pane';
  if (
    k.endsWith('_carpet') ||
    k === 'lily_pad' ||
    k === 'pink_petals' ||
    k === 'wildflowers' ||
    k === 'leaf_litter' ||
    k === 'sculk_vein' ||
    k === 'end_portal'
  ) {
    return 'carpet';
  }
  if (k.endsWith('_pressure_plate')) return 'pressure_plate';
  if (k.endsWith('_button')) return 'button';
  if (k === 'rail' || k.endsWith('_rail')) return 'rail';
  if (k === 'ladder') return 'ladder';
  if (k.endsWith('_trapdoor')) return 'trapdoor';
  if (k.endsWith('_door')) return 'door';
  if (k === 'campfire' || k === 'soul_campfire') return 'campfire';
  if (k === 'red_bed' || k.endsWith('_bed')) return 'bed';
  if (k === 'anvil') return 'anvil';
  if (k === 'enchanting_table') return 'enchanting_table';
  if (k === 'cake') return 'cake';
  if (k === 'chest' || k === 'ender_chest' || k === 'trapped_chest' || k === 'copper_chest') return 'chest';
  if (k === 'bell') return 'bell';
  if (k === 'flower_pot' || k === 'decorated_pot') return 'flower_pot';
  if (k === 'lever' || k === 'tripwire_hook') return 'lever';
  if (k.endsWith('_sign')) return 'sign';
  if (k === 'bamboo') return 'bamboo';
  if (k === 'cactus') return 'cactus';
  if (k === 'repeater' || k === 'comparator') return 'repeater';
  if (k === 'daylight_detector') return 'daylight_detector';
  if (k === 'stonecutter') return 'stonecutter';
  if (k === 'grindstone') return 'grindstone';
  if (k === 'lectern') return 'lectern';
  if (k === 'cauldron') return 'cauldron';
  if (k === 'hopper') return 'hopper';
  if (k === 'end_portal_frame') return 'end_portal_frame';
  if (k === 'conduit') return 'conduit';
  if (k === 'dragon_egg') return 'dragon_egg';
  if (k === 'turtle_egg') return 'turtle_egg';
  if (k === 'farmland' || k === 'grass_path') return 'farmland';
  return 'cube';
}

function classifyLightEmission(def: BlockDef): LightEmission {
  const k = def.key;
  if (
    k === 'glowstone' ||
    k === 'shroomlight' ||
    k === 'jack_o_lantern' ||
    k === 'lantern' ||
    k === 'campfire' ||
    k === 'redstone_lamp' ||
    k === 'lava' ||
    k === 'ochre_froglight' ||
    k === 'copper_bulb'
  ) {
    return { level: 15, r: 1.0, g: 0.85, b: 0.56 };
  }
  if (k === 'verdant_froglight' || k === 'copper_lantern') {
    return { level: 15, r: 0.55, g: 1.0, b: 0.78 };
  }
  if (k === 'pearlescent_froglight') {
    return { level: 15, r: 0.96, g: 0.78, b: 1.0 };
  }
  if (k === 'sea_lantern' || k === 'beacon' || k === 'conduit') {
    return { level: 15, r: 0.78, g: 0.96, b: 1.0 };
  }
  if (k === 'torch' || k === 'candle') {
    return { level: 14, r: 1.0, g: 0.84, b: 0.52 };
  }
  if (k === 'copper_torch') {
    return { level: 14, r: 0.45, g: 1.0, b: 0.72 };
  }
  if (k === 'end_rod') {
    return { level: 14, r: 0.96, g: 0.9, b: 1.0 };
  }
  if (
    k === 'respawn_anchor' ||
    k === 'nether_portal' ||
    k === 'end_portal' ||
    k === 'end_gateway' ||
    k === 'crying_obsidian' ||
    k === 'amethyst_cluster'
  ) {
    return { level: 13, r: 0.78, g: 0.42, b: 1.0 };
  }
  if (
    k === 'soul_lantern' ||
    k === 'soul_torch' ||
    k === 'soul_fire' ||
    k === 'soul_campfire' ||
    k === 'sculk_catalyst' ||
    k === 'sculk_sensor' ||
    k === 'sculk_shrieker' ||
    k === 'sculk_vein' ||
    k === 'ominous_vault' ||
    k === 'ominous_trial_spawner' ||
    k === 'ice_crystal'
  ) {
    return { level: 11, r: 0.36, g: 0.92, b: 1.0 };
  }
  if (
    k === 'creaking_heart' ||
    k === 'open_eyeblossom' ||
    k === 'trial_spawner' ||
    k === 'vault' ||
    k === 'torchflower' ||
    k === 'cinnabar_ore' ||
    k === 'cinnabar_block'
  ) {
    return { level: 10, r: 1.0, g: 0.52, b: 0.16 };
  }
  if (k === 'firefly_bush' || k === 'glow_lichen' || k === 'sulfur_block') {
    return { level: 9, r: 0.92, g: 0.96, b: 0.52 };
  }
  if (k === 'redstone_torch' || k === 'redstone_block' || k === 'powered_rail') {
    return { level: 8, r: 1.0, g: 0.35, b: 0.28 };
  }
  if (k === 'ender_chest' || k === 'enchanting_table') {
    return { level: 8, r: 0.45, g: 0.88, b: 0.85 };
  }
  if (k === 'magma_block' || k === 'brewing_stand' || k === 'sea_pickle') {
    return { level: 7, r: 1.0, g: 0.74, b: 0.42 };
  }
  if (def.emissive) {
    return { level: 12, r: 1.0, g: 0.88, b: 0.65 };
  }
  return NO_LIGHT;
}

const BLOCK_SHAPE_TABLE: Record<number, BlockShape> = {};
const BLOCK_FULL_OPAQUE_TABLE: Record<number, boolean> = {};
const BLOCK_LIGHT_TABLE: Record<number, LightEmission> = {};

for (const def of Object.values(BLOCK_DEFS)) {
  const shape = classifyBlockShape(def);
  BLOCK_SHAPE_TABLE[def.id] = shape;
  BLOCK_FULL_OPAQUE_TABLE[def.id] = def.id !== BLOCK.AIR && shape === 'cube' && !def.transparent;
  BLOCK_LIGHT_TABLE[def.id] = classifyLightEmission(def);
}

export function getBlockShape(id: number): BlockShape {
  return BLOCK_SHAPE_TABLE[id] || 'cube';
}

export function isFullOpaqueCube(id: number): boolean {
  return Boolean(BLOCK_FULL_OPAQUE_TABLE[id]);
}

export function getBlockLightEmission(id: number): LightEmission {
  return BLOCK_LIGHT_TABLE[id] || NO_LIGHT;
}

// Selection wireframe bounds [minX, minY, minZ, maxX, maxY, maxZ] in 0..1 block coordinates
export function getBlockSelectionBounds(id: number): [number, number, number, number, number, number] {
  const s = getBlockShape(id);
  switch (s) {
    case 'torch':
      return [0.36, 0, 0.36, 0.64, 0.66, 0.64];
    case 'lantern':
      return [0.28, 0, 0.28, 0.72, 0.62, 0.72];
    case 'chain':
    case 'end_rod':
      return [0.36, 0, 0.36, 0.64, 1, 0.64];
    case 'slab':
      return [0, 0, 0, 1, 0.5, 1];
    case 'carpet':
    case 'pressure_plate':
    case 'rail':
      return [0, 0, 0, 1, 0.1, 1];
    case 'button':
      return [0.3, 0, 0.35, 0.7, 0.15, 0.65];
    case 'trapdoor':
    case 'repeater':
      return [0, 0, 0, 1, 0.2, 1];
    case 'daylight_detector':
      return [0, 0, 0, 1, 0.38, 1];
    case 'campfire':
      return [0, 0, 0, 1, 0.45, 1];
    case 'bed':
      return [0, 0, 0, 1, 0.56, 1];
    case 'cake':
      return [0.06, 0, 0.06, 0.94, 0.5, 0.94];
    case 'chest':
      return [0.06, 0, 0.06, 0.94, 0.88, 0.94];
    case 'enchanting_table':
      return [0, 0, 0, 1, 0.75, 1];
    case 'stonecutter':
      return [0, 0, 0, 1, 0.58, 1];
    case 'flower_pot':
      return [0.3, 0, 0.3, 0.7, 0.4, 0.7];
    case 'lever':
      return [0.28, 0, 0.24, 0.72, 0.65, 0.76];
    case 'bell':
      return [0.18, 0.06, 0.18, 0.82, 0.95, 0.82];
    case 'conduit':
      return [0.3, 0.3, 0.3, 0.7, 0.7, 0.7];
    case 'bamboo':
      return [0.34, 0, 0.34, 0.66, 1, 0.66];
    case 'turtle_egg':
      return [0.28, 0, 0.28, 0.72, 0.46, 0.72];
    case 'cross':
      return [0.15, 0, 0.15, 0.85, 0.85, 0.85];
    case 'fence':
    case 'wall':
      return [0.22, 0, 0.22, 0.78, 1, 0.78];
    default:
      return [0, 0, 0, 1, 1, 1];
  }
}

export function isBlockSolid(id: number): boolean {
  const def = BLOCK_DEFS[id];
  return Boolean(def && !def.nonSolid);
}

export function isBlockTransparent(id: number): boolean {
  const def = BLOCK_DEFS[id];
  if (!def) return true;
  if (def.transparent) return true;
  return getBlockShape(id) !== 'cube';
}

export function isBlockLiquid(id: number): boolean {
  const def = BLOCK_DEFS[id];
  return Boolean(def && def.liquid);
}
