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
} as const;

export type BlockId = (typeof BLOCK)[keyof typeof BLOCK];

export type SoundMaterial = 'stone' | 'dirt' | 'grass' | 'wood' | 'sand' | 'glass' | 'nether' | 'metal' | 'liquid';
export type ToolKind = 'none' | 'pickaxe' | 'axe' | 'shovel' | 'sword';
export type CreativeCategory = 'building' | 'nether116' | 'ores' | 'tools' | 'armor_food';

export interface BlockDef {
  id: number;
  key: string; // Minecraft 1.16 block id
  nameVi: string;
  hardness: number; // seconds by hand (-1 = unbreakable)
  tool: ToolKind;
  minTier?: number; // 0 hand, 1 wood, 2 stone, 3 iron, 4 diamond, 5 netherite
  dropItem: string | null;
  dropCount?: number;
  transparent?: boolean;
  liquid?: boolean;
  nonSolid?: boolean;
  emissive?: boolean;
  damagePerSec?: number;
  sound: SoundMaterial;
  category: CreativeCategory;
  // Texture keys matching public/packs/mc116-nether-pack/assets/minecraft/textures/block/<key>.png
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
    id: BLOCK.BEDROCK, key: 'bedrock', nameVi: 'Đá Nền (Bedrock)', hardness: -1, tool: 'none', dropItem: null,
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
    id: BLOCK.TNT, key: 'tnt', nameVi: 'Thuốc Nổ TNT', hardness: 0.25, tool: 'none', dropItem: 'tnt',
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
    id: BLOCK.SMITHING_TABLE, key: 'smithing_table', nameVi: 'Bàn Rèn 1.16', hardness: 2.0, tool: 'axe', dropItem: 'smithing_table',
    sound: 'wood', category: 'nether116',
    textures: { top: 'smithing_table_top', bottom: 'crimson_planks', side: 'smithing_table_side' },
  },
  [BLOCK.OBSIDIAN]: {
    id: BLOCK.OBSIDIAN, key: 'obsidian', nameVi: 'Hắc Diện Thạch (Obsidian)', hardness: 8.5, tool: 'pickaxe', minTier: 4, dropItem: 'obsidian',
    sound: 'stone', category: 'nether116',
    textures: { top: 'obsidian', bottom: 'obsidian', side: 'obsidian' },
  },
  [BLOCK.CRYING_OBSIDIAN]: {
    id: BLOCK.CRYING_OBSIDIAN, key: 'crying_obsidian', nameVi: 'Obsidian Khóc (1.16)', hardness: 8.5, tool: 'pickaxe', minTier: 4, dropItem: 'crying_obsidian',
    emissive: true, sound: 'stone', category: 'nether116',
    textures: { top: 'crying_obsidian', bottom: 'crying_obsidian', side: 'crying_obsidian' },
  },
  [BLOCK.NETHER_PORTAL]: {
    id: BLOCK.NETHER_PORTAL, key: 'nether_portal', nameVi: 'Cổng Nether', hardness: -1, tool: 'none', dropItem: null,
    transparent: true, nonSolid: true, emissive: true, sound: 'glass', category: 'nether116',
    textures: { top: 'nether_portal', bottom: 'nether_portal', side: 'nether_portal' },
  },
  [BLOCK.NETHERRACK]: {
    id: BLOCK.NETHERRACK, key: 'netherrack', nameVi: 'Đá Địa Ngục (Netherrack)', hardness: 0.55, tool: 'pickaxe', dropItem: 'netherrack',
    sound: 'nether', category: 'nether116',
    textures: { top: 'netherrack', bottom: 'netherrack', side: 'netherrack' },
  },
  [BLOCK.NETHER_QUARTZ_ORE]: {
    id: BLOCK.NETHER_QUARTZ_ORE, key: 'nether_quartz_ore', nameVi: 'Quặng Thạch Anh Nether', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'quartz',
    sound: 'nether', category: 'ores',
    textures: { top: 'nether_quartz_ore', bottom: 'nether_quartz_ore', side: 'nether_quartz_ore' },
  },
  [BLOCK.NETHER_GOLD_ORE]: {
    id: BLOCK.NETHER_GOLD_ORE, key: 'nether_gold_ore', nameVi: 'Quặng Vàng Nether (1.16)', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'gold_ingot',
    sound: 'nether', category: 'ores',
    textures: { top: 'nether_gold_ore', bottom: 'nether_gold_ore', side: 'nether_gold_ore' },
  },
  [BLOCK.GLOWSTONE]: {
    id: BLOCK.GLOWSTONE, key: 'glowstone', nameVi: 'Đá Phát Sáng', hardness: 0.45, tool: 'none', dropItem: 'glowstone',
    emissive: true, sound: 'glass', category: 'nether116',
    textures: { top: 'glowstone', bottom: 'glowstone', side: 'glowstone' },
  },
  [BLOCK.CRIMSON_NYLIUM]: {
    id: BLOCK.CRIMSON_NYLIUM, key: 'crimson_nylium', nameVi: 'Nấm Đỏ Nylium (1.16)', hardness: 0.65, tool: 'pickaxe', dropItem: 'crimson_nylium',
    sound: 'nether', category: 'nether116',
    textures: { top: 'crimson_nylium', bottom: 'netherrack', side: 'crimson_nylium_side' },
  },
  [BLOCK.CRIMSON_STEM]: {
    id: BLOCK.CRIMSON_STEM, key: 'crimson_stem', nameVi: 'Thân Nấm Đỏ (1.16)', hardness: 1.8, tool: 'axe', dropItem: 'crimson_stem',
    sound: 'wood', category: 'nether116',
    textures: { top: 'crimson_stem_top', bottom: 'crimson_stem_top', side: 'crimson_stem' },
  },
  [BLOCK.CRIMSON_PLANKS]: {
    id: BLOCK.CRIMSON_PLANKS, key: 'crimson_planks', nameVi: 'Ván Nấm Đỏ (1.16)', hardness: 1.5, tool: 'axe', dropItem: 'crimson_planks',
    sound: 'wood', category: 'nether116',
    textures: { top: 'crimson_planks', bottom: 'crimson_planks', side: 'crimson_planks' },
  },
  [BLOCK.NETHER_WART_BLOCK]: {
    id: BLOCK.NETHER_WART_BLOCK, key: 'nether_wart_block', nameVi: 'Khối Bướu Địa Ngục', hardness: 0.8, tool: 'none', dropItem: 'nether_wart_block',
    sound: 'grass', category: 'nether116',
    textures: { top: 'nether_wart_block', bottom: 'nether_wart_block', side: 'nether_wart_block' },
  },
  [BLOCK.WARPED_NYLIUM]: {
    id: BLOCK.WARPED_NYLIUM, key: 'warped_nylium', nameVi: 'Nấm Xanh Warped (1.16)', hardness: 0.65, tool: 'pickaxe', dropItem: 'warped_nylium',
    sound: 'nether', category: 'nether116',
    textures: { top: 'warped_nylium', bottom: 'netherrack', side: 'warped_nylium_side' },
  },
  [BLOCK.WARPED_STEM]: {
    id: BLOCK.WARPED_STEM, key: 'warped_stem', nameVi: 'Thân Nấm Xanh (1.16)', hardness: 1.8, tool: 'axe', dropItem: 'warped_stem',
    sound: 'wood', category: 'nether116',
    textures: { top: 'warped_stem_top', bottom: 'warped_stem_top', side: 'warped_stem' },
  },
  [BLOCK.WARPED_PLANKS]: {
    id: BLOCK.WARPED_PLANKS, key: 'warped_planks', nameVi: 'Ván Nấm Xanh (1.16)', hardness: 1.5, tool: 'axe', dropItem: 'warped_planks',
    sound: 'wood', category: 'nether116',
    textures: { top: 'warped_planks', bottom: 'warped_planks', side: 'warped_planks' },
  },
  [BLOCK.WARPED_WART_BLOCK]: {
    id: BLOCK.WARPED_WART_BLOCK, key: 'warped_wart_block', nameVi: 'Khối Bướu Xanh (1.16)', hardness: 0.8, tool: 'none', dropItem: 'warped_wart_block',
    sound: 'grass', category: 'nether116',
    textures: { top: 'warped_wart_block', bottom: 'warped_wart_block', side: 'warped_wart_block' },
  },
  [BLOCK.SHROOMLIGHT]: {
    id: BLOCK.SHROOMLIGHT, key: 'shroomlight', nameVi: 'Đèn Nấm Shroomlight (1.16)', hardness: 0.7, tool: 'none', dropItem: 'shroomlight',
    emissive: true, sound: 'grass', category: 'nether116',
    textures: { top: 'shroomlight', bottom: 'shroomlight', side: 'shroomlight' },
  },
  [BLOCK.SOUL_SAND]: {
    id: BLOCK.SOUL_SAND, key: 'soul_sand', nameVi: 'Cát Linh Hồn', hardness: 0.55, tool: 'shovel', dropItem: 'soul_sand',
    sound: 'sand', category: 'nether116',
    textures: { top: 'soul_sand', bottom: 'soul_sand', side: 'soul_sand' },
  },
  [BLOCK.SOUL_SOIL]: {
    id: BLOCK.SOUL_SOIL, key: 'soul_soil', nameVi: 'Đất Linh Hồn (1.16)', hardness: 0.55, tool: 'shovel', dropItem: 'soul_soil',
    sound: 'dirt', category: 'nether116',
    textures: { top: 'soul_soil', bottom: 'soul_soil', side: 'soul_soil' },
  },
  [BLOCK.SOUL_FIRE]: {
    id: BLOCK.SOUL_FIRE, key: 'soul_fire', nameVi: 'Lửa Linh Hồn (1.16)', hardness: 0.1, tool: 'none', dropItem: null,
    transparent: true, nonSolid: true, emissive: true, damagePerSec: 3, sound: 'grass', category: 'nether116',
    textures: { top: 'soul_fire', bottom: 'soul_fire', side: 'soul_fire' },
  },
  [BLOCK.BASALT]: {
    id: BLOCK.BASALT, key: 'basalt', nameVi: 'Đá Bazan (1.16)', hardness: 1.8, tool: 'pickaxe', minTier: 1, dropItem: 'basalt',
    sound: 'stone', category: 'nether116',
    textures: { top: 'basalt_top', bottom: 'basalt_top', side: 'basalt_side' },
  },
  [BLOCK.BLACKSTONE]: {
    id: BLOCK.BLACKSTONE, key: 'blackstone', nameVi: 'Đá Đen Blackstone (1.16)', hardness: 2.0, tool: 'pickaxe', minTier: 1, dropItem: 'blackstone',
    sound: 'stone', category: 'nether116',
    textures: { top: 'blackstone', bottom: 'blackstone', side: 'blackstone' },
  },
  [BLOCK.POLISHED_BLACKSTONE]: {
    id: BLOCK.POLISHED_BLACKSTONE, key: 'polished_blackstone', nameVi: 'Đá Đen Mài Bóng (1.16)', hardness: 2.2, tool: 'pickaxe', minTier: 1, dropItem: 'polished_blackstone',
    sound: 'stone', category: 'nether116',
    textures: { top: 'polished_blackstone', bottom: 'polished_blackstone', side: 'polished_blackstone' },
  },
  [BLOCK.GILDED_BLACKSTONE]: {
    id: BLOCK.GILDED_BLACKSTONE, key: 'gilded_blackstone', nameVi: 'Đá Đen Dát Vàng (1.16)', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'gold_ingot',
    sound: 'stone', category: 'nether116',
    textures: { top: 'gilded_blackstone', bottom: 'gilded_blackstone', side: 'gilded_blackstone' },
  },
  [BLOCK.MAGMA]: {
    id: BLOCK.MAGMA, key: 'magma_block', nameVi: 'Khối Magma', hardness: 1.0, tool: 'pickaxe', dropItem: 'magma_block',
    emissive: true, damagePerSec: 2, sound: 'stone', category: 'nether116',
    textures: { top: 'magma', bottom: 'magma', side: 'magma' },
  },
  [BLOCK.BONE_BLOCK]: {
    id: BLOCK.BONE_BLOCK, key: 'bone_block', nameVi: 'Khối Xương Hóa Thạch', hardness: 1.8, tool: 'pickaxe', dropItem: 'bone_block',
    sound: 'stone', category: 'nether116',
    textures: { top: 'bone_block_top', bottom: 'bone_block_top', side: 'bone_block_side' },
  },
  [BLOCK.ANCIENT_DEBRIS]: {
    id: BLOCK.ANCIENT_DEBRIS, key: 'ancient_debris', nameVi: 'Mảnh Vỡ Cổ Đại (Ancient Debris)', hardness: 7.5, tool: 'pickaxe', minTier: 4, dropItem: 'ancient_debris',
    sound: 'metal', category: 'ores',
    textures: { top: 'ancient_debris_top', bottom: 'ancient_debris_top', side: 'ancient_debris_side' },
  },
  [BLOCK.NETHERITE_BLOCK]: {
    id: BLOCK.NETHERITE_BLOCK, key: 'netherite_block', nameVi: 'Khối Netherite (1.16)', hardness: 8.0, tool: 'pickaxe', minTier: 4, dropItem: 'netherite_block',
    sound: 'metal', category: 'ores',
    textures: { top: 'netherite_block', bottom: 'netherite_block', side: 'netherite_block' },
  },
  [BLOCK.RESPAWN_ANCHOR]: {
    id: BLOCK.RESPAWN_ANCHOR, key: 'respawn_anchor', nameVi: 'Neo Hồi Sinh (1.16)', hardness: 7.5, tool: 'pickaxe', minTier: 4, dropItem: 'respawn_anchor',
    emissive: true, sound: 'stone', category: 'nether116',
    textures: { top: 'respawn_anchor_top', bottom: 'obsidian', side: 'respawn_anchor_side' },
  },
  [BLOCK.SOUL_LANTERN]: {
    id: BLOCK.SOUL_LANTERN, key: 'soul_lantern', nameVi: 'Đèn Lồng Linh Hồn (1.16)', hardness: 1.5, tool: 'pickaxe', dropItem: 'soul_lantern',
    emissive: true, sound: 'metal', category: 'nether116',
    textures: { top: 'soul_lantern', bottom: 'soul_lantern', side: 'soul_lantern' },
  },
  [BLOCK.TORCH]: {
    id: BLOCK.TORCH, key: 'torch', nameVi: 'Đuốc', hardness: 0.1, tool: 'none', dropItem: 'torch',
    transparent: true, nonSolid: true, emissive: true, sound: 'wood', category: 'building',
    textures: { top: 'torch', bottom: 'torch', side: 'torch' },
  },
};

export const BLOCK_BY_KEY: Record<string, BlockDef> = {};
for (const def of Object.values(BLOCK_DEFS)) {
  BLOCK_BY_KEY[def.key] = def;
}

export interface ItemDef {
  id: string;
  nameVi: string;
  maxStack: number;
  blockId?: number;
  category: CreativeCategory;
  toolKind?: ToolKind;
  toolTier?: number; // 1 wood, 2 stone, 3 iron, 4 diamond, 5 netherite, 2.5 gold
  miningSpeed?: number;
  attackDamage?: number;
  armorSlot?: 0 | 1 | 2 | 3; // 0 helmet, 1 chest, 2 legs, 3 boots
  armorDefense?: number;
  foodRestore?: number;
  healRestore?: number;
  fuelTime?: number; // seconds
  isFlintAndSteel?: boolean;
  iconColor?: string;
  iconAccent?: string;
  iconShape?: 'pickaxe' | 'sword' | 'axe' | 'shovel' | 'ingot' | 'gem' | 'stick' | 'flint_steel' | 'food' | 'helmet' | 'chestplate' | 'leggings' | 'boots' | 'dust';
}

export const ITEM_DEFS: Record<string, ItemDef> = {};

// Register all placeable blocks as items
for (const def of Object.values(BLOCK_DEFS)) {
  if (def.id === BLOCK.AIR || def.id === BLOCK.WATER || def.id === BLOCK.LAVA || def.id === BLOCK.NETHER_PORTAL || def.id === BLOCK.SOUL_FIRE) {
    continue;
  }
  ITEM_DEFS[def.key] = {
    id: def.key,
    nameVi: def.nameVi,
    maxStack: 64,
    blockId: def.id,
    category: def.category,
    fuelTime: def.key.includes('log') || def.key.includes('planks') ? 15 : undefined,
  };
}

const EXTRA_ITEMS: ItemDef[] = [
  // Materials
  { id: 'stick', nameVi: 'Que Gỗ', maxStack: 64, category: 'ores', fuelTime: 5, iconShape: 'stick', iconColor: '#8d6438', iconAccent: '#c4965a' },
  { id: 'coal', nameVi: 'Than Đá', maxStack: 64, category: 'ores', fuelTime: 80, iconShape: 'gem', iconColor: '#2a2a2e', iconAccent: '#52525b' },
  { id: 'flint', nameVi: 'Đá Lửa (Flint)', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#3f3f46', iconAccent: '#9ca3af' },
  { id: 'iron_ingot', nameVi: 'Thỏi Sắt', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'gold_ingot', nameVi: 'Thỏi Vàng', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond', nameVi: 'Kim Cương', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'quartz', nameVi: 'Thạch Anh Nether', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#eae3d5', iconAccent: '#ffffff' },
  { id: 'netherite_scrap', nameVi: 'Mảnh Netherite (1.16)', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#6d4b40', iconAccent: '#9e7464' },
  { id: 'netherite_ingot', nameVi: 'Thỏi Netherite (1.16)', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#4c464f', iconAccent: '#867a8c' },
  { id: 'ender_pearl', nameVi: 'Ngọc Ender', maxStack: 16, category: 'ores', iconShape: 'gem', iconColor: '#0e6961', iconAccent: '#34d399' },
  { id: 'flint_and_steel', nameVi: 'Bật Lửa (Mở Cổng Nether)', maxStack: 1, category: 'tools', isFlintAndSteel: true, iconShape: 'flint_steel', iconColor: '#d1d5db', iconAccent: '#f97316' },

  // Pickaxes
  { id: 'wooden_pickaxe', nameVi: 'Cuốc Gỗ', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 1, miningSpeed: 2.2, attackDamage: 2, iconShape: 'pickaxe', iconColor: '#a67c46', iconAccent: '#d6ab6d' },
  { id: 'stone_pickaxe', nameVi: 'Cuốc Đá', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 2, miningSpeed: 4.0, attackDamage: 3, iconShape: 'pickaxe', iconColor: '#8d8d94', iconAccent: '#c5c5cc' },
  { id: 'iron_pickaxe', nameVi: 'Cuốc Sắt', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 3, miningSpeed: 6.0, attackDamage: 4, iconShape: 'pickaxe', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'diamond_pickaxe', nameVi: 'Cuốc Kim Cương', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 4, miningSpeed: 8.5, attackDamage: 5, iconShape: 'pickaxe', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_pickaxe', nameVi: 'Cuốc Netherite (1.16)', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 5, miningSpeed: 11.5, attackDamage: 6, iconShape: 'pickaxe', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // Swords
  { id: 'wooden_sword', nameVi: 'Kiếm Gỗ', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 1, miningSpeed: 1.5, attackDamage: 4, iconShape: 'sword', iconColor: '#a67c46', iconAccent: '#d6ab6d' },
  { id: 'stone_sword', nameVi: 'Kiếm Đá', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 2, miningSpeed: 1.5, attackDamage: 5, iconShape: 'sword', iconColor: '#8d8d94', iconAccent: '#c5c5cc' },
  { id: 'iron_sword', nameVi: 'Kiếm Sắt', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 3, miningSpeed: 1.5, attackDamage: 6, iconShape: 'sword', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'diamond_sword', nameVi: 'Kiếm Kim Cương', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 4, miningSpeed: 1.5, attackDamage: 7, iconShape: 'sword', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_sword', nameVi: 'Kiếm Netherite (1.16)', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 5, miningSpeed: 1.5, attackDamage: 9, iconShape: 'sword', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // Axes & Shovels
  { id: 'iron_axe', nameVi: 'Rìu Sắt', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 3, miningSpeed: 6.0, attackDamage: 7, iconShape: 'axe', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'diamond_axe', nameVi: 'Rìu Kim Cương', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 4, miningSpeed: 8.0, attackDamage: 8, iconShape: 'axe', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_axe', nameVi: 'Rìu Netherite (1.16)', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 5, miningSpeed: 10.5, attackDamage: 10, iconShape: 'axe', iconColor: '#4c464f', iconAccent: '#a78bfa' },
  { id: 'diamond_shovel', nameVi: 'Xẻng Kim Cương', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 4, miningSpeed: 8.5, attackDamage: 4, iconShape: 'shovel', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_shovel', nameVi: 'Xẻng Netherite (1.16)', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 5, miningSpeed: 11.0, attackDamage: 5, iconShape: 'shovel', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // Armor (Iron / Gold / Diamond / Netherite)
  { id: 'iron_helmet', nameVi: 'Mũ Sắt', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'iron_chestplate', nameVi: 'Áo Giáp Sắt', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 6, iconShape: 'chestplate', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'gold_helmet', nameVi: 'Mũ Vàng (An toàn Piglin)', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#f5c531', iconAccent: '#fff2a6' },
  { id: 'diamond_helmet', nameVi: 'Mũ Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 3, iconShape: 'helmet', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'diamond_chestplate', nameVi: 'Áo Giáp Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 8, iconShape: 'chestplate', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'diamond_leggings', nameVi: 'Quần Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 6, iconShape: 'leggings', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'diamond_boots', nameVi: 'Giày Kim Cương', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 3, iconShape: 'boots', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },
  { id: 'netherite_helmet', nameVi: 'Mũ Netherite (1.16)', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 4, iconShape: 'helmet', iconColor: '#4c464f', iconAccent: '#a78bfa' },
  { id: 'netherite_chestplate', nameVi: 'Áo Giáp Netherite (1.16)', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 8, iconShape: 'chestplate', iconColor: '#4c464f', iconAccent: '#a78bfa' },
  { id: 'netherite_leggings', nameVi: 'Quần Netherite (1.16)', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 6, iconShape: 'leggings', iconColor: '#4c464f', iconAccent: '#a78bfa' },
  { id: 'netherite_boots', nameVi: 'Giày Netherite (1.16)', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 4, iconShape: 'boots', iconColor: '#4c464f', iconAccent: '#a78bfa' },

  // Food
  { id: 'raw_porkchop', nameVi: 'Thịt Heo Sống', maxStack: 64, category: 'armor_food', foodRestore: 3, iconShape: 'food', iconColor: '#f29b9b', iconAccent: '#ffd4d4' },
  { id: 'cooked_porkchop', nameVi: 'Thịt Heo Chín', maxStack: 64, category: 'armor_food', foodRestore: 8, healRestore: 2, iconShape: 'food', iconColor: '#b56c3b', iconAccent: '#e2a36b' },
  { id: 'golden_apple', nameVi: 'Táo Vàng', maxStack: 64, category: 'armor_food', foodRestore: 6, healRestore: 8, iconShape: 'food', iconColor: '#f5c531', iconAccent: '#fff6b0' },
];

for (const item of EXTRA_ITEMS) {
  ITEM_DEFS[item.id] = item;
}

export const ALL_TEXTURE_KEYS = Array.from(
  new Set(
    Object.values(BLOCK_DEFS)
      .filter((b) => b.id !== BLOCK.AIR)
      .flatMap((b) => [b.textures.top, b.textures.bottom, b.textures.side, ...(b.textures.front ? [b.textures.front] : [])]),
  ),
);

export function isBlockSolid(id: number): boolean {
  const def = BLOCK_DEFS[id];
  return Boolean(def && !def.nonSolid);
}

export function isBlockTransparent(id: number): boolean {
  const def = BLOCK_DEFS[id];
  return !def || Boolean(def.transparent);
}

export function isBlockLiquid(id: number): boolean {
  const def = BLOCK_DEFS[id];
  return Boolean(def && def.liquid);
}
