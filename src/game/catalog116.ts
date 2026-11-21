import type { BlockDef, CreativeCategory, ItemDef, SoundMaterial, ToolKind } from './blocks';
import type { CraftingRecipe } from './recipes';

// 16 standard Minecraft 1.16 colors
export const MC_COLORS: { id: string; nameVi: string; hex: string; accent: string }[] = [
  { id: 'white', nameVi: 'Trắng', hex: '#eceeef', accent: '#ffffff' },
  { id: 'orange', nameVi: 'Cam', hex: '#e8791e', accent: '#fb923c' },
  { id: 'magenta', nameVi: 'Đỏ Tím', hex: '#bf46b8', accent: '#e879f9' },
  { id: 'light_blue', nameVi: 'Xanh Nhạt', hex: '#4fb6e6', accent: '#7dd3fc' },
  { id: 'yellow', nameVi: 'Vàng', hex: '#e6c229', accent: '#fef08a' },
  { id: 'lime', nameVi: 'Xanh Chanh', hex: '#7ac72a', accent: '#bef264' },
  { id: 'pink', nameVi: 'Hồng', hex: '#eb8eab', accent: '#fbcfe8' },
  { id: 'gray', nameVi: 'Xám', hex: '#4a4e54', accent: '#71717a' },
  { id: 'light_gray', nameVi: 'Xám Nhạt', hex: '#9a9d9e', accent: '#d4d4d8' },
  { id: 'cyan', nameVi: 'Xanh Lơ', hex: '#1e8a9c', accent: '#22d3ee' },
  { id: 'purple', nameVi: 'Tím', hex: '#7c33a8', accent: '#c084fc' },
  { id: 'blue', nameVi: 'Xanh Dương', hex: '#3447a6', accent: '#60a5fa' },
  { id: 'brown', nameVi: 'Nâu', hex: '#734a28', accent: '#a16207' },
  { id: 'green', nameVi: 'Xanh Lá', hex: '#527328', accent: '#84cc16' },
  { id: 'red', nameVi: 'Đỏ', hex: '#a82825', accent: '#f87171' },
  { id: 'black', nameVi: 'Đen', hex: '#1c1c21', accent: '#52525b' },
];

export const MC_COLOR_MAP: Record<string, { nameVi: string; hex: string; accent: string }> =
  Object.fromEntries(MC_COLORS.map((c) => [c.id, c]));

// Procedural texture palette metadata for extended blocks (used by vanillaTextures.ts)
export interface ExtTextureSpec {
  style:
    | 'stone'
    | 'bricks'
    | 'planks'
    | 'log'
    | 'log_top'
    | 'wool'
    | 'glass'
    | 'terracotta'
    | 'concrete'
    | 'powder'
    | 'station'
    | 'redstone'
    | 'ore'
    | 'metal'
    | 'plant'
    | 'pillar'
    | 'flat';
  base: string;
  accent: string;
  trim?: string;
}

export const EXT_TEXTURE_SPECS: Record<string, ExtTextureSpec> = {};

// Build extended blocks starting at ID 94
let nextBlockId = 94;
export const EXT_BLOCK_IDS: Record<string, number> = {};
export const EXT_BLOCK_DEFS: Record<number, BlockDef> = {};

interface QuickBlockOpts {
  key: string;
  nameVi: string;
  category: CreativeCategory;
  hardness?: number;
  tool?: ToolKind;
  minTier?: number;
  dropItem?: string | null;
  dropCount?: number;
  transparent?: boolean;
  nonSolid?: boolean;
  emissive?: boolean;
  damagePerSec?: number;
  sound?: SoundMaterial;
  texStyle: ExtTextureSpec['style'];
  base: string;
  accent: string;
  trim?: string;
  topKey?: string;
  bottomKey?: string;
}

function addBlock(o: QuickBlockOpts): number {
  const id = nextBlockId++;
  const texKey = o.key;
  EXT_TEXTURE_SPECS[texKey] = {
    style: o.texStyle,
    base: o.base,
    accent: o.accent,
    trim: o.trim,
  };
  EXT_BLOCK_IDS[o.key.toUpperCase()] = id;
  EXT_BLOCK_DEFS[id] = {
    id,
    key: o.key,
    nameVi: o.nameVi,
    hardness: o.hardness ?? 1.8,
    tool: o.tool ?? 'pickaxe',
    minTier: o.minTier,
    dropItem: o.dropItem === undefined ? o.key : o.dropItem,
    dropCount: o.dropCount,
    transparent: o.transparent,
    nonSolid: o.nonSolid,
    emissive: o.emissive,
    damagePerSec: o.damagePerSec,
    sound: o.sound ?? 'stone',
    category: o.category,
    textures: {
      top: o.topKey || texKey,
      bottom: o.bottomKey || o.topKey || texKey,
      side: texKey,
    },
  };
  return id;
}

// =========================================================================
// 1. WORKSTATIONS & UTILITY BLOCKS (Sections A, D, H, L)
// =========================================================================
addBlock({ key: 'blast_furnace', nameVi: 'Lò Cao', category: 'building', hardness: 3.0, sound: 'stone', texStyle: 'station', base: '#57575c', accent: '#f97316', trim: '#27272a' });
addBlock({ key: 'smoker', nameVi: 'Lò Hun Khói', category: 'building', hardness: 3.0, sound: 'stone', texStyle: 'station', base: '#6e5236', accent: '#f59e0b', trim: '#3f3f46' });
addBlock({ key: 'grindstone', nameVi: 'Bàn Mài', category: 'building', hardness: 2.0, sound: 'stone', texStyle: 'station', base: '#8c8c90', accent: '#a2824e', trim: '#52525b' });
addBlock({ key: 'fletching_table', nameVi: 'Bàn Cung Tên', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#d6c696', accent: '#3f3f46', trim: '#a68c58' });
addBlock({ key: 'cartography_table', nameVi: 'Bàn Bản Đồ', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#5c3c24', accent: '#e7d5a8', trim: '#3b2414' });
addBlock({ key: 'loom', nameVi: 'Bàn Dệt', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#a68250', accent: '#e5e7eb', trim: '#6b4c28' });
addBlock({ key: 'stonecutter', nameVi: 'Bàn Cắt Đá', category: 'building', hardness: 3.0, sound: 'stone', texStyle: 'station', base: '#8a8a90', accent: '#d4d8dc', trim: '#52525b' });
addBlock({ key: 'barrel', nameVi: 'Thùng Gỗ', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#7d5a34', accent: '#4a4a50', trim: '#52381c' });
addBlock({ key: 'brewing_stand', nameVi: 'Giá Ủ Thuốc', category: 'decor_brew', hardness: 0.8, sound: 'metal', emissive: true, texStyle: 'station', base: '#5e5e64', accent: '#f59e0b', trim: '#b45309' });
addBlock({ key: 'cauldron', nameVi: 'Cái Vạc', category: 'decor_brew', hardness: 2.0, sound: 'metal', texStyle: 'metal', base: '#45454a', accent: '#626269', trim: '#27272a' });
addBlock({ key: 'composter', nameVi: 'Thùng Ủ Phân', category: 'building', hardness: 1.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#8a6238', accent: '#5c4022', trim: '#4f6b28' });
addBlock({ key: 'beehive', nameVi: 'Tổ Ong', category: 'building', hardness: 0.8, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#b89456', accent: '#eab308', trim: '#4a3519' });
addBlock({ key: 'lectern', nameVi: 'Bàn Đọc Sách', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#a2824e', accent: '#dc2626', trim: '#f4f4f5' });
addBlock({ key: 'ender_chest', nameVi: 'Rương Ender', category: 'decor_brew', hardness: 6.0, minTier: 3, sound: 'stone', emissive: true, texStyle: 'station', base: '#1e2c33', accent: '#2dd4bf', trim: '#0d151a' });
addBlock({ key: 'beacon', nameVi: 'Đèn Hiệu (Beacon)', category: 'decor_brew', hardness: 3.0, sound: 'glass', emissive: true, transparent: true, texStyle: 'station', base: '#7dd3fc', accent: '#ffffff', trim: '#1f1630' });
addBlock({ key: 'bell', nameVi: 'Chuông Vàng', category: 'decor_brew', hardness: 3.0, sound: 'metal', texStyle: 'metal', base: '#f5c531', accent: '#fef08a', trim: '#78350f' });
addBlock({ key: 'lodestone', nameVi: 'Đá Nam Châm (Lodestone)', category: 'nether116', hardness: 3.5, sound: 'stone', texStyle: 'bricks', base: '#7a7a82', accent: '#4c464f', trim: '#a1a1aa' });
addBlock({ key: 'note_block', nameVi: 'Đá Phát Nhạc', category: 'redstone', hardness: 1.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#6e472b', accent: '#a855f7', trim: '#422816' });
addBlock({ key: 'jukebox', nameVi: 'Máy Phát Nhạc', category: 'decor_brew', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#6b4228', accent: '#3ee0e8', trim: '#18181b' });
addBlock({ key: 'soul_campfire', nameVi: 'Lửa Trại Linh Hồn', category: 'nether116', hardness: 1.4, tool: 'axe', sound: 'wood', emissive: true, damagePerSec: 2, texStyle: 'station', base: '#593d24', accent: '#2dd4bf', trim: '#99f6e4' });
addBlock({ key: 'scaffolding', nameVi: 'Giàn Giáo', category: 'building', hardness: 0.2, tool: 'none', sound: 'wood', transparent: true, texStyle: 'plant', base: '#c9a65b', accent: '#80a832', trim: '#7c5d2a' });
addBlock({ key: 'chain', nameVi: 'Xích Sắt', category: 'nether116', hardness: 3.0, sound: 'metal', transparent: true, nonSolid: true, texStyle: 'flat', base: '#4a5059', accent: '#9ca3af' });
addBlock({ key: 'end_rod', nameVi: 'Thanh End', category: 'decor_brew', hardness: 0.2, tool: 'none', sound: 'glass', transparent: true, nonSolid: true, emissive: true, texStyle: 'flat', base: '#f5f0e6', accent: '#c084fc' });
addBlock({ key: 'cake', nameVi: 'Bánh Ngọt', category: 'armor_food', hardness: 0.5, tool: 'none', sound: 'grass', texStyle: 'station', base: '#f8fafc', accent: '#dc2626', trim: '#b4783c' });

// =========================================================================
// 2. REDSTONE & MACHINES (Section E)
// =========================================================================
addBlock({ key: 'redstone_torch', nameVi: 'Đuốc Redstone', category: 'redstone', hardness: 0.1, tool: 'none', sound: 'wood', transparent: true, nonSolid: true, emissive: true, texStyle: 'flat', base: '#8d6438', accent: '#ef4444' });
addBlock({ key: 'repeater', nameVi: 'Bộ Lặp Redstone', category: 'redstone', hardness: 0.3, tool: 'none', sound: 'stone', texStyle: 'redstone', base: '#9e9ea3', accent: '#ef4444', trim: '#52525b' });
addBlock({ key: 'comparator', nameVi: 'Bộ So Sánh Redstone', category: 'redstone', hardness: 0.3, tool: 'none', sound: 'stone', texStyle: 'redstone', base: '#9e9ea3', accent: '#ef4444', trim: '#eae3d5' });
addBlock({ key: 'piston', nameVi: 'Piston', category: 'redstone', hardness: 1.5, sound: 'stone', texStyle: 'station', base: '#78787d', accent: '#a2824e', trim: '#52525b' });
addBlock({ key: 'sticky_piston', nameVi: 'Piston Dính', category: 'redstone', hardness: 1.5, sound: 'stone', texStyle: 'station', base: '#78787d', accent: '#65c44b', trim: '#52525b' });
addBlock({ key: 'dispenser', nameVi: 'Máy Phân Phát', category: 'redstone', hardness: 2.5, sound: 'stone', texStyle: 'station', base: '#7a7a80', accent: '#18181b', trim: '#52525b' });
addBlock({ key: 'dropper', nameVi: 'Máy Bắn (Dropper)', category: 'redstone', hardness: 2.5, sound: 'stone', texStyle: 'station', base: '#828287', accent: '#27272a', trim: '#52525b' });
addBlock({ key: 'hopper', nameVi: 'Phễu (Hopper)', category: 'redstone', hardness: 2.5, sound: 'metal', texStyle: 'metal', base: '#505259', accent: '#71757f', trim: '#27272a' });
addBlock({ key: 'observer', nameVi: 'Máy Quan Sát', category: 'redstone', hardness: 2.5, sound: 'stone', texStyle: 'redstone', base: '#57575c', accent: '#ef4444', trim: '#d4d4d8' });
addBlock({ key: 'daylight_detector', nameVi: 'Cảm Biến Ánh Sáng', category: 'redstone', hardness: 0.5, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#6e5032', accent: '#93c5fd', trim: '#eae3d5' });
addBlock({ key: 'redstone_lamp', nameVi: 'Đèn Redstone', category: 'redstone', hardness: 0.6, tool: 'none', sound: 'glass', emissive: true, texStyle: 'station', base: '#9e6b38', accent: '#fde047', trim: '#4a2e16' });
addBlock({ key: 'lever', nameVi: 'Cần Gạt', category: 'redstone', hardness: 0.3, tool: 'none', sound: 'wood', transparent: true, nonSolid: true, texStyle: 'flat', base: '#7a7a80', accent: '#a2824e' });
addBlock({ key: 'target', nameVi: 'Khối Bia Bắn (Target)', category: 'redstone', hardness: 0.6, tool: 'hoe', sound: 'grass', texStyle: 'redstone', base: '#ede5d5', accent: '#dc2626', trim: '#d4a938' });
addBlock({ key: 'tripwire_hook', nameVi: 'Móc Dây', category: 'redstone', hardness: 0.2, tool: 'none', sound: 'wood', transparent: true, nonSolid: true, texStyle: 'flat', base: '#a2824e', accent: '#d4d8dc' });

// Rails
addBlock({ key: 'rail', nameVi: 'Đường Ray', category: 'redstone', hardness: 0.7, sound: 'metal', transparent: true, nonSolid: true, texStyle: 'flat', base: '#8b5e34', accent: '#d4d8dc' });
addBlock({ key: 'powered_rail', nameVi: 'Đường Ray Điện', category: 'redstone', hardness: 0.7, sound: 'metal', transparent: true, nonSolid: true, emissive: true, texStyle: 'flat', base: '#f5c531', accent: '#ef4444' });
addBlock({ key: 'detector_rail', nameVi: 'Đường Ray Cảm Biến', category: 'redstone', hardness: 0.7, sound: 'metal', transparent: true, nonSolid: true, texStyle: 'flat', base: '#7a7a80', accent: '#ef4444' });
addBlock({ key: 'activator_rail', nameVi: 'Đường Ray Kích Hoạt', category: 'redstone', hardness: 0.7, sound: 'metal', transparent: true, nonSolid: true, texStyle: 'flat', base: '#9ca3af', accent: '#dc2626' });

// =========================================================================
// 3. WOOD TYPES, STONES, BRICKS, NETHER, END & OCEAN (Sections A, F, H)
// =========================================================================
addBlock({ key: 'jungle_log', nameVi: 'Gỗ Rừng Rậm', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#634d2c', accent: '#4a381d' });
addBlock({ key: 'jungle_planks', nameVi: 'Ván Rừng Rậm', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#a87b56', accent: '#875f3e' });
addBlock({ key: 'acacia_log', nameVi: 'Gỗ Keo (Acacia)', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#6e6a62', accent: '#524e47' });
addBlock({ key: 'acacia_planks', nameVi: 'Ván Gỗ Keo', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#b86234', accent: '#944a22' });
addBlock({ key: 'dark_oak_log', nameVi: 'Gỗ Sồi Sẫm', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#3d2c1b', accent: '#291c0f' });
addBlock({ key: 'dark_oak_planks', nameVi: 'Ván Sồi Sẫm', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#4a311a', accent: '#362210' });

// Stones & Bricks
addBlock({ key: 'smooth_stone', nameVi: 'Đá Mịn', category: 'building', texStyle: 'stone', base: '#9e9ea4', accent: '#b8b8be' });
addBlock({ key: 'mossy_stone_bricks', nameVi: 'Gạch Đá Rêu', category: 'building', texStyle: 'bricks', base: '#7c8276', accent: '#4d7c2e' });
addBlock({ key: 'cracked_stone_bricks', nameVi: 'Gạch Đá Nứt', category: 'building', texStyle: 'bricks', base: '#78787d', accent: '#3d3d42' });
addBlock({ key: 'chiseled_stone_bricks', nameVi: 'Gạch Đá Đục', category: 'building', texStyle: 'bricks', base: '#828287', accent: '#4f4f54' });
addBlock({ key: 'andesite', nameVi: 'Đá Andesite', category: 'building', texStyle: 'stone', base: '#848689', accent: '#6d6f73' });
addBlock({ key: 'granite', nameVi: 'Đá Granite', category: 'building', texStyle: 'stone', base: '#9e6b58', accent: '#7d4f3f' });
addBlock({ key: 'diorite', nameVi: 'Đá Diorite', category: 'building', texStyle: 'stone', base: '#c4c4c7', accent: '#8c8c92' });

addBlock({ key: 'polished_blackstone_bricks', nameVi: 'Gạch Đá Đen Bóng', category: 'nether116', texStyle: 'bricks', base: '#312c38', accent: '#1d1924' });
addBlock({ key: 'cracked_polished_blackstone_bricks', nameVi: 'Gạch Đá Đen Nứt', category: 'nether116', texStyle: 'bricks', base: '#2b2631', accent: '#120f17' });
addBlock({ key: 'chiseled_polished_blackstone', nameVi: 'Đá Đen Đục', category: 'nether116', texStyle: 'bricks', base: '#383240', accent: '#554d61' });
addBlock({ key: 'polished_basalt', nameVi: 'Đá Bazan Mài Bóng', category: 'nether116', texStyle: 'pillar', base: '#595863', accent: '#3d3c45' });
addBlock({ key: 'chiseled_nether_bricks', nameVi: 'Gạch Nether Đục', category: 'nether116', sound: 'nether', texStyle: 'bricks', base: '#3d1c22', accent: '#592c34' });
addBlock({ key: 'cracked_nether_bricks', nameVi: 'Gạch Nether Nứt', category: 'nether116', sound: 'nether', texStyle: 'bricks', base: '#30151a', accent: '#1a0a0d' });

addBlock({ key: 'quartz_bricks', nameVi: 'Gạch Thạch Anh', category: 'building', texStyle: 'bricks', base: '#ece7df', accent: '#cfc8bc' });
addBlock({ key: 'quartz_pillar', nameVi: 'Trụ Thạch Anh', category: 'building', texStyle: 'pillar', base: '#ede9e1', accent: '#d1cac0' });
addBlock({ key: 'chiseled_quartz_block', nameVi: 'Thạch Anh Đục', category: 'building', texStyle: 'bricks', base: '#ebe6de', accent: '#c4bdb0' });
addBlock({ key: 'smooth_quartz', nameVi: 'Thạch Anh Mịn', category: 'building', texStyle: 'stone', base: '#f2eee7', accent: '#e3ddd2' });

addBlock({ key: 'sandstone', nameVi: 'Đá Cát', category: 'building', texStyle: 'stone', base: '#ded2a4', accent: '#c4b47e' });
addBlock({ key: 'cut_sandstone', nameVi: 'Đá Cát Cắt', category: 'building', texStyle: 'bricks', base: '#e2d7ac', accent: '#c9ba85' });
addBlock({ key: 'chiseled_sandstone', nameVi: 'Đá Cát Đục', category: 'building', texStyle: 'bricks', base: '#dfd3a6', accent: '#b8a56e' });
addBlock({ key: 'smooth_sandstone', nameVi: 'Đá Cát Mịn', category: 'building', texStyle: 'stone', base: '#e6dbb2', accent: '#d6c898' });
addBlock({ key: 'red_sand', nameVi: 'Cát Đỏ', category: 'building', tool: 'shovel', sound: 'sand', texStyle: 'powder', base: '#be6228', accent: '#9e4c1a' });
addBlock({ key: 'red_sandstone', nameVi: 'Đá Cát Đỏ', category: 'building', texStyle: 'stone', base: '#b85c24', accent: '#964617' });
addBlock({ key: 'smooth_red_sandstone', nameVi: 'Đá Cát Đỏ Mịn', category: 'building', texStyle: 'stone', base: '#c2652b', accent: '#a8511d' });

// Clay, Terracotta, Slime, Honey, Sponge, Ocean, End
addBlock({ key: 'clay', nameVi: 'Khối Đất Sét', category: 'building', tool: 'shovel', sound: 'dirt', dropItem: 'clay_ball', dropCount: 4, texStyle: 'stone', base: '#9ea5b3', accent: '#838a99' });
addBlock({ key: 'terracotta', nameVi: 'Đất Sét Nung', category: 'building', texStyle: 'terracotta', base: '#965d43', accent: '#7d4a33' });
addBlock({ key: 'slime_block', nameVi: 'Khối Slime', category: 'redstone', hardness: 0.2, tool: 'none', sound: 'grass', transparent: true, texStyle: 'glass', base: '#70c957', accent: '#9ae67e' });
addBlock({ key: 'honey_block', nameVi: 'Khối Mật Ong', category: 'redstone', hardness: 0.2, tool: 'none', sound: 'grass', transparent: true, texStyle: 'glass', base: '#f5a623', accent: '#fde047' });
addBlock({ key: 'honeycomb_block', nameVi: 'Khối Tổ Ong', category: 'building', hardness: 0.8, tool: 'none', sound: 'grass', texStyle: 'bricks', base: '#e89e24', accent: '#b56e12' });
addBlock({ key: 'sponge', nameVi: 'Bọt Biển', category: 'building', hardness: 0.6, tool: 'hoe', sound: 'grass', texStyle: 'stone', base: '#c9c242', accent: '#8f8824' });
addBlock({ key: 'wet_sponge', nameVi: 'Bọt Biển Ướt', category: 'building', hardness: 0.6, tool: 'hoe', sound: 'grass', texStyle: 'stone', base: '#9ea33c', accent: '#5a7828' });
addBlock({ key: 'blue_ice', nameVi: 'Băng Xanh', category: 'building', hardness: 1.5, sound: 'glass', texStyle: 'stone', base: '#74a8f7', accent: '#93c5fd' });
addBlock({ key: 'dried_kelp_block', nameVi: 'Khối Tảo Khô', category: 'building', hardness: 0.6, tool: 'hoe', sound: 'grass', texStyle: 'bricks', base: '#344028', accent: '#4e5e3d' });

addBlock({ key: 'prismarine', nameVi: 'Đá Prismarine', category: 'building', texStyle: 'stone', base: '#5ca39b', accent: '#3d7d76' });
addBlock({ key: 'prismarine_bricks', nameVi: 'Gạch Prismarine', category: 'building', texStyle: 'bricks', base: '#62b0a4', accent: '#3d8278' });
addBlock({ key: 'dark_prismarine', nameVi: 'Prismarine Sẫm', category: 'building', texStyle: 'bricks', base: '#345c50', accent: '#1f3d34' });
addBlock({ key: 'sea_lantern', nameVi: 'Đèn Biển', category: 'decor_brew', hardness: 0.5, tool: 'none', sound: 'glass', emissive: true, texStyle: 'metal', base: '#c7ece8', accent: '#e0f7f4', trim: '#78b8b0' });

addBlock({ key: 'end_stone', nameVi: 'Đá End', category: 'building', texStyle: 'stone', base: '#dbd89e', accent: '#b8b377' });
addBlock({ key: 'end_stone_bricks', nameVi: 'Gạch Đá End', category: 'building', texStyle: 'bricks', base: '#dedaa3', accent: '#b3ae74' });
addBlock({ key: 'purpur_block', nameVi: 'Khối Purpur', category: 'building', texStyle: 'bricks', base: '#aa7bab', accent: '#875a88' });
addBlock({ key: 'purpur_pillar', nameVi: 'Trụ Purpur', category: 'building', texStyle: 'pillar', base: '#b080b1', accent: '#8a5d8b' });
addBlock({ key: 'dragon_egg', nameVi: 'Trứng Rồng', category: 'decor_brew', hardness: 3.0, sound: 'stone', texStyle: 'stone', base: '#1a1221', accent: '#a855f7' });
addBlock({ key: 'end_portal_frame', nameVi: 'Khung Cổng End', category: 'decor_brew', hardness: -1, tool: 'none', sound: 'stone', texStyle: 'station', base: '#4f7a68', accent: '#dbd89e', trim: '#22c55e' });
addBlock({ key: 'spawner', nameVi: 'Lồng Sinh Quái', category: 'decor_brew', hardness: 5.0, sound: 'metal', transparent: true, texStyle: 'station', base: '#1e2c38', accent: '#f97316', trim: '#475569' });
addBlock({ key: 'command_block', nameVi: 'Khối Lệnh', category: 'redstone', hardness: -1, tool: 'none', sound: 'metal', texStyle: 'station', base: '#c47b54', accent: '#2dd4bf', trim: '#784226' });
addBlock({ key: 'barrier', nameVi: 'Khối Vô Hình (Barrier)', category: 'decor_brew', hardness: -1, tool: 'none', sound: 'glass', transparent: true, texStyle: 'glass', base: '#ef4444', accent: '#fca5a5' });

// Plants & Crops Blocks
addBlock({ key: 'vine', nameVi: 'Dây Leo', category: 'decor_brew', hardness: 0.2, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#3b6e24', accent: '#589436' });
addBlock({ key: 'cactus', nameVi: 'Xương Rồng', category: 'decor_brew', hardness: 0.4, tool: 'none', sound: 'grass', damagePerSec: 1, texStyle: 'pillar', base: '#4a852c', accent: '#2d5918' });
addBlock({ key: 'sugar_cane', nameVi: 'Cây Mía', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#7ec44e', accent: '#a7e378' });
addBlock({ key: 'bamboo', nameVi: 'Cây Tre', category: 'decor_brew', hardness: 0.4, tool: 'axe', sound: 'wood', transparent: true, nonSolid: true, texStyle: 'plant', base: '#6ca62e', accent: '#9cd154' });
addBlock({ key: 'carved_pumpkin', nameVi: 'Bí Ngô Khắc', category: 'decor_brew', hardness: 1.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#d97716', accent: '#1f160d', trim: '#9a4f0a' });

// Doors, Trapdoors, Slabs, Stairs, Walls, Gates, Buttons, Pressure Plates, Glass Pane
addBlock({ key: 'oak_slab', nameVi: 'Phiến Gỗ Sồi', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#a2824e', accent: '#7f6236' });
addBlock({ key: 'crimson_slab', nameVi: 'Phiến Nấm Đỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#75334f', accent: '#542136' });
addBlock({ key: 'warped_slab', nameVi: 'Phiến Nấm Xanh', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#2b706d', accent: '#1d4f4d' });
addBlock({ key: 'stone_slab', nameVi: 'Phiến Đá', category: 'building', texStyle: 'stone', base: '#828287', accent: '#69696e' });
addBlock({ key: 'smooth_stone_slab', nameVi: 'Phiến Đá Mịn', category: 'building', texStyle: 'stone', base: '#a3a3a8', accent: '#808087' });
addBlock({ key: 'stone_brick_slab', nameVi: 'Phiến Gạch Đá', category: 'building', texStyle: 'bricks', base: '#808085', accent: '#545459' });
addBlock({ key: 'nether_brick_slab', nameVi: 'Phiến Gạch Nether', category: 'nether116', sound: 'nether', texStyle: 'bricks', base: '#361b20', accent: '#200e11' });
addBlock({ key: 'quartz_slab', nameVi: 'Phiến Thạch Anh', category: 'building', texStyle: 'stone', base: '#ede9e1', accent: '#d6cfc4' });
addBlock({ key: 'polished_blackstone_slab', nameVi: 'Phiến Đá Đen', category: 'nether116', texStyle: 'stone', base: '#332e3b', accent: '#201c26' });
addBlock({ key: 'purpur_slab', nameVi: 'Phiến Purpur', category: 'building', texStyle: 'bricks', base: '#aa7bab', accent: '#855887' });
addBlock({ key: 'sandstone_slab', nameVi: 'Phiến Đá Cát', category: 'building', texStyle: 'stone', base: '#ded2a4', accent: '#c4b47e' });

addBlock({ key: 'oak_stairs', nameVi: 'Cầu Thang Gỗ Sồi', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#a88752', accent: '#7f6236' });
addBlock({ key: 'crimson_stairs', nameVi: 'Cầu Thang Nấm Đỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#75334f', accent: '#542136' });
addBlock({ key: 'warped_stairs', nameVi: 'Cầu Thang Nấm Xanh', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#2b706d', accent: '#1d4f4d' });
addBlock({ key: 'cobblestone_stairs', nameVi: 'Cầu Thang Đá Cuội', category: 'building', texStyle: 'stone', base: '#78787d', accent: '#57575c' });
addBlock({ key: 'stone_brick_stairs', nameVi: 'Cầu Thang Gạch Đá', category: 'building', texStyle: 'bricks', base: '#7f7f85', accent: '#545459' });
addBlock({ key: 'nether_brick_stairs', nameVi: 'Cầu Thang Nether', category: 'nether116', sound: 'nether', texStyle: 'bricks', base: '#361b20', accent: '#200e11' });
addBlock({ key: 'quartz_stairs', nameVi: 'Cầu Thang Thạch Anh', category: 'building', texStyle: 'stone', base: '#ede9e1', accent: '#d6cfc4' });
addBlock({ key: 'polished_blackstone_stairs', nameVi: 'Cầu Thang Đá Đen', category: 'nether116', texStyle: 'bricks', base: '#332e3b', accent: '#201c26' });
addBlock({ key: 'purpur_stairs', nameVi: 'Cầu Thang Purpur', category: 'building', texStyle: 'bricks', base: '#aa7bab', accent: '#855887' });

addBlock({ key: 'cobblestone_wall', nameVi: 'Tường Đá Cuội', category: 'building', texStyle: 'stone', base: '#737378', accent: '#525257' });
addBlock({ key: 'polished_blackstone_wall', nameVi: 'Tường Đá Đen', category: 'nether116', texStyle: 'bricks', base: '#302b38', accent: '#1c1824' });
addBlock({ key: 'nether_brick_fence', nameVi: 'Rào Gạch Nether', category: 'nether116', sound: 'nether', texStyle: 'bricks', base: '#381b21', accent: '#1e0c10' });
addBlock({ key: 'crimson_fence', nameVi: 'Hàng Rào Nấm Đỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#783350', accent: '#4d1c31' });
addBlock({ key: 'warped_fence', nameVi: 'Hàng Rào Nấm Xanh', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#2b7370', accent: '#1a4c4a' });
addBlock({ key: 'oak_fence_gate', nameVi: 'Cổng Rào Gỗ', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#9e7c48', accent: '#6e5229' });
addBlock({ key: 'crimson_fence_gate', nameVi: 'Cổng Rào Nấm Đỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#75334f', accent: '#4d1c31' });
addBlock({ key: 'warped_fence_gate', nameVi: 'Cổng Rào Nấm Xanh', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#2b706d', accent: '#1a4c4a' });

addBlock({ key: 'oak_door', nameVi: 'Cửa Gỗ Sồi', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'station', base: '#9c7a46', accent: '#5c4321', trim: '#d4d8dc' });
addBlock({ key: 'crimson_door', nameVi: 'Cửa Nấm Đỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'station', base: '#75334f', accent: '#4a1b30', trim: '#f5c531' });
addBlock({ key: 'warped_door', nameVi: 'Cửa Nấm Xanh', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'station', base: '#2b706d', accent: '#1a4a47', trim: '#5eead4' });
addBlock({ key: 'iron_door', nameVi: 'Cửa Sắt', category: 'redstone', sound: 'metal', texStyle: 'metal', base: '#d4d8dc', accent: '#ffffff', trim: '#71717a' });
addBlock({ key: 'oak_trapdoor', nameVi: 'Cửa Sập Gỗ', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'station', base: '#9e7c48', accent: '#5c4321' });
addBlock({ key: 'crimson_trapdoor', nameVi: 'Cửa Sập Nấm Đỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'station', base: '#75334f', accent: '#4a1b30' });
addBlock({ key: 'warped_trapdoor', nameVi: 'Cửa Sập Nấm Xanh', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'station', base: '#2b706d', accent: '#1a4a47' });
addBlock({ key: 'iron_trapdoor', nameVi: 'Cửa Sập Sắt', category: 'redstone', sound: 'metal', texStyle: 'metal', base: '#cfd4d9', accent: '#ffffff', trim: '#71717a' });

addBlock({ key: 'oak_pressure_plate', nameVi: 'Tấm Áp Lực Gỗ', category: 'redstone', hardness: 0.5, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#a2824e', accent: '#7f6236' });
addBlock({ key: 'stone_pressure_plate', nameVi: 'Tấm Áp Lực Đá', category: 'redstone', hardness: 0.5, sound: 'stone', nonSolid: true, texStyle: 'stone', base: '#808085', accent: '#626268' });
addBlock({ key: 'heavy_weighted_pressure_plate', nameVi: 'Tấm Áp Lực Sắt', category: 'redstone', hardness: 0.5, sound: 'metal', nonSolid: true, texStyle: 'metal', base: '#d4d8dc', accent: '#ffffff' });
addBlock({ key: 'light_weighted_pressure_plate', nameVi: 'Tấm Áp Lực Vàng', category: 'redstone', hardness: 0.5, sound: 'metal', nonSolid: true, texStyle: 'metal', base: '#f5c531', accent: '#fef08a' });
addBlock({ key: 'polished_blackstone_pressure_plate', nameVi: 'Tấm Áp Lực Đá Đen', category: 'redstone', hardness: 0.5, sound: 'stone', nonSolid: true, texStyle: 'stone', base: '#332e3b', accent: '#1f1b24' });
addBlock({ key: 'crimson_pressure_plate', nameVi: 'Tấm Áp Lực Nấm Đỏ', category: 'redstone', hardness: 0.5, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#75334f', accent: '#4d1c31' });
addBlock({ key: 'warped_pressure_plate', nameVi: 'Tấm Áp Lực Nấm Xanh', category: 'redstone', hardness: 0.5, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#2b706d', accent: '#1a4c4a' });

addBlock({ key: 'oak_button', nameVi: 'Nút Gỗ', category: 'redstone', hardness: 0.3, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#a2824e', accent: '#7f6236' });
addBlock({ key: 'stone_button', nameVi: 'Nút Đá', category: 'redstone', hardness: 0.3, sound: 'stone', nonSolid: true, texStyle: 'stone', base: '#808085', accent: '#626268' });
addBlock({ key: 'polished_blackstone_button', nameVi: 'Nút Đá Đen', category: 'redstone', hardness: 0.3, sound: 'stone', nonSolid: true, texStyle: 'stone', base: '#332e3b', accent: '#1f1b24' });
addBlock({ key: 'crimson_button', nameVi: 'Nút Nấm Đỏ', category: 'redstone', hardness: 0.3, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#75334f', accent: '#4d1c31' });
addBlock({ key: 'warped_button', nameVi: 'Nút Nấm Xanh', category: 'redstone', hardness: 0.3, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#2b706d', accent: '#1a4c4a' });

addBlock({ key: 'glass_pane', nameVi: 'Tấm Kính', category: 'decor_brew', hardness: 0.3, tool: 'none', sound: 'glass', transparent: true, texStyle: 'glass', base: '#d8f3ff', accent: '#ffffff' });
addBlock({ key: 'flower_pot', nameVi: 'Chậu Hoa', category: 'decor_brew', hardness: 0.2, tool: 'none', sound: 'stone', transparent: true, nonSolid: true, texStyle: 'flat', base: '#9e4d36', accent: '#5c3121' });
addBlock({ key: 'shulker_box', nameVi: 'Hòm Shulker', category: 'decor_brew', hardness: 2.0, sound: 'stone', texStyle: 'station', base: '#9b6ba8', accent: '#754682', trim: '#c084fc' });
addBlock({ key: 'oak_sign', nameVi: 'Biển Hiệu Gỗ', category: 'decor_brew', hardness: 0.8, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#a68550', accent: '#6e5229' });
addBlock({ key: 'crimson_sign', nameVi: 'Biển Hiệu Nấm Đỏ', category: 'nether116', hardness: 0.8, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#75334f', accent: '#4d1c31' });
addBlock({ key: 'warped_sign', nameVi: 'Biển Hiệu Nấm Xanh', category: 'nether116', hardness: 0.8, tool: 'axe', sound: 'wood', nonSolid: true, texStyle: 'planks', base: '#2b706d', accent: '#1a4c4a' });

// Essential missing Minecraft 1.16.5 blocks (building, nature, ocean, redstone, Nether 1.16)
addBlock({ key: 'packed_ice', nameVi: 'Băng Nén', category: 'building', hardness: 1.0, tool: 'pickaxe', sound: 'glass', texStyle: 'stone', base: '#8bb8f8', accent: '#b7d7ff' });
addBlock({ key: 'iron_bars', nameVi: 'Song Sắt', category: 'building', hardness: 3.5, tool: 'pickaxe', sound: 'metal', transparent: true, texStyle: 'flat', base: '#8d9299', accent: '#cbd5e1' });
addBlock({ key: 'cobweb', nameVi: 'Mạng Nhện', category: 'decor_brew', hardness: 2.0, tool: 'sword', sound: 'grass', transparent: true, nonSolid: true, dropItem: 'string', texStyle: 'flat', base: '#e5e7eb', accent: '#ffffff' });
addBlock({ key: 'conduit', nameVi: 'Lõi Dẫn Biển (Conduit)', category: 'decor_brew', hardness: 3.0, sound: 'glass', emissive: true, texStyle: 'station', base: '#9d8268', accent: '#38bdf8', trim: '#e0f2fe' });
addBlock({ key: 'coarse_dirt', nameVi: 'Đất Thô', category: 'building', hardness: 0.55, tool: 'shovel', sound: 'dirt', texStyle: 'powder', base: '#77553b', accent: '#593d28' });
addBlock({ key: 'podzol', nameVi: 'Đất Podzol', category: 'building', hardness: 0.6, tool: 'shovel', sound: 'dirt', texStyle: 'stone', base: '#6e4a25', accent: '#8c6239', trim: '#52341a' });
addBlock({ key: 'mycelium', nameVi: 'Đất Nấm Mycelium', category: 'building', hardness: 0.6, tool: 'shovel', sound: 'dirt', texStyle: 'stone', base: '#6f6269', accent: '#8c7e87', trim: '#77553b' });
addBlock({ key: 'farmland', nameVi: 'Đất Canh Tác', category: 'building', hardness: 0.6, tool: 'shovel', sound: 'dirt', texStyle: 'planks', base: '#59371e', accent: '#77553b' });
addBlock({ key: 'grass_path', nameVi: 'Đường Cỏ Mòn', category: 'building', hardness: 0.65, tool: 'shovel', sound: 'grass', texStyle: 'stone', base: '#9e8b52', accent: '#7c6a3a' });
addBlock({ key: 'polished_andesite', nameVi: 'Andesite Mài Bóng', category: 'building', texStyle: 'bricks', base: '#8b8d91', accent: '#707277' });
addBlock({ key: 'polished_granite', nameVi: 'Granite Mài Bóng', category: 'building', texStyle: 'bricks', base: '#a66e5b', accent: '#855342' });
addBlock({ key: 'polished_diorite', nameVi: 'Diorite Mài Bóng', category: 'building', texStyle: 'bricks', base: '#cccdcf', accent: '#9e9fa6' });
addBlock({ key: 'stripped_oak_log', nameVi: 'Gỗ Sồi Bóc Vỏ', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#b8945f', accent: '#997745' });
addBlock({ key: 'stripped_spruce_log', nameVi: 'Gỗ Vân Sam Bóc Vỏ', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#735432', accent: '#593f23' });
addBlock({ key: 'stripped_birch_log', nameVi: 'Gỗ Bạch Dương Bóc Vỏ', category: 'building', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#d4c385', accent: '#b8a567' });
addBlock({ key: 'stripped_crimson_stem', nameVi: 'Thân Nấm Đỏ Bóc Vỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#873353', accent: '#69223d' });
addBlock({ key: 'stripped_warped_stem', nameVi: 'Thân Nấm Xanh Bóc Vỏ', category: 'nether116', tool: 'axe', sound: 'wood', texStyle: 'log', base: '#348e8b', accent: '#236e6c' });
addBlock({ key: 'oak_sapling', nameVi: 'Chồi Cây Sồi', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#4f912a', accent: '#75b843' });
addBlock({ key: 'spruce_sapling', nameVi: 'Chồi Cây Vân Sam', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#2c5432', accent: '#44754b' });
addBlock({ key: 'birch_sapling', nameVi: 'Chồi Bạch Dương', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#6ca343', accent: '#93c965' });
addBlock({ key: 'jungle_sapling', nameVi: 'Chồi Rừng Rậm', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#388524', accent: '#5cb543' });
addBlock({ key: 'acacia_sapling', nameVi: 'Chồi Cây Keo', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#6b942b', accent: '#93bd48' });
addBlock({ key: 'dark_oak_sapling', nameVi: 'Chồi Sồi Sẫm', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#35661f', accent: '#508a34' });
addBlock({ key: 'lily_pad', nameVi: 'Lá Bèo', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'flat', base: '#3e8c27', accent: '#5eb342' });
addBlock({ key: 'sea_pickle', nameVi: 'Dưa Chuột Biển', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, emissive: true, texStyle: 'plant', base: '#58782d', accent: '#b7f582' });
addBlock({ key: 'bee_nest', nameVi: 'Tổ Ong Tự Nhiên', category: 'decor_brew', hardness: 0.6, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#d9a536', accent: '#f5c531', trim: '#784812' });
addBlock({ key: 'turtle_egg', nameVi: 'Trứng Rùa Biển', category: 'decor_brew', hardness: 0.5, tool: 'none', sound: 'glass', transparent: true, nonSolid: true, texStyle: 'flat', base: '#e6e3d3', accent: '#5ea89b' });
addBlock({ key: 'trapped_chest', nameVi: 'Rương Bẫy', category: 'redstone', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#a87431', accent: '#dc2626', trim: '#472c10' });
addBlock({ key: 'crimson_roots', nameVi: 'Rễ Nấm Đỏ', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#9e192b', accent: '#d93246' });
addBlock({ key: 'warped_roots', nameVi: 'Rễ Nấm Xanh', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#158a7b', accent: '#2dd4bf' });
addBlock({ key: 'weeping_vines', nameVi: 'Dây Leo Khóc (1.16)', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#87111e', accent: '#c41e30' });
addBlock({ key: 'twisting_vines', nameVi: 'Dây Leo Xoắn (1.16)', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#127a6c', accent: '#26b8a4' });
addBlock({ key: 'nether_sprouts', nameVi: 'Chồi Nether', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#168779', accent: '#36ccb8' });
addBlock({ key: 'mossy_stone_brick_wall', nameVi: 'Tường Gạch Đá Rêu', category: 'building', texStyle: 'bricks', base: '#767d70', accent: '#4d7c2e' });
addBlock({ key: 'nether_brick_wall', nameVi: 'Tường Gạch Nether', category: 'nether116', sound: 'nether', texStyle: 'bricks', base: '#361b20', accent: '#1e0c10' });
addBlock({ key: 'blackstone_stairs', nameVi: 'Cầu Thang Đá Đen Thô', category: 'nether116', texStyle: 'stone', base: '#2a2730', accent: '#18151c' });
addBlock({ key: 'blackstone_slab', nameVi: 'Phiến Đá Đen Thô', category: 'nether116', texStyle: 'stone', base: '#2a2730', accent: '#18151c' });
// Placeable 3D Flowers, Mushrooms, Nether Fungi & Crops
addBlock({ key: 'poppy', nameVi: 'Hoa Anh Túc', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#dc2626', accent: '#22c55e' });
addBlock({ key: 'dandelion', nameVi: 'Hoa Bồ Công Anh', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#facc15', accent: '#22c55e' });
addBlock({ key: 'cornflower', nameVi: 'Hoa Thanh Cúc', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#3b82f6', accent: '#22c55e' });
addBlock({ key: 'blue_orchid', nameVi: 'Hoa Phong Lan Xanh', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#38bdf8', accent: '#22c55e' });
addBlock({ key: 'allium', nameVi: 'Hoa Hành Tím', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#d946ef', accent: '#22c55e' });
addBlock({ key: 'oxeye_daisy', nameVi: 'Hoa Cúc Trắng', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#f8fafc', accent: '#facc15' });
addBlock({ key: 'lily_of_the_valley', nameVi: 'Hoa Linh Lan', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#f8fafc', accent: '#4ade80' });
addBlock({ key: 'wither_rose', nameVi: 'Hoa Hồng Wither', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#27272a', accent: '#52525b' });
addBlock({ key: 'sunflower', nameVi: 'Hoa Hướng Dương', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#facc15', accent: '#78350f' });
addBlock({ key: 'rose_bush', nameVi: 'Bụi Hoa Hồng', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#e11d48', accent: '#15803d' });
addBlock({ key: 'red_mushroom', nameVi: 'Nấm Đỏ', category: 'armor_food', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#dc2626', accent: '#ffffff' });
addBlock({ key: 'brown_mushroom', nameVi: 'Nấm Nâu', category: 'armor_food', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#9c7250', accent: '#d6b494' });
addBlock({ key: 'crimson_fungus', nameVi: 'Nấm Đỏ Crimson', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#b91c1c', accent: '#fca5a5' });
addBlock({ key: 'warped_fungus', nameVi: 'Nấm Xanh Warped', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#14b8a6', accent: '#f97316' });
addBlock({ key: 'tall_grass', nameVi: 'Cỏ Dại', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#59a633', accent: '#7bc950' });
addBlock({ key: 'dead_bush', nameVi: 'Bụi Cây Khô', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'wood', transparent: true, nonSolid: true, texStyle: 'plant', base: '#8c6239', accent: '#5e4022' });
addBlock({ key: 'wheat_crop', nameVi: 'Cây Lúa Mì', category: 'armor_food', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#d4a938', accent: '#65a30d' });
addBlock({ key: 'nether_wart_crop', nameVi: 'Bụi Bướu Địa Ngục', category: 'nether116', hardness: 0.1, tool: 'none', sound: 'nether', transparent: true, nonSolid: true, texStyle: 'plant', base: '#991b1b', accent: '#f87171' });
addBlock({ key: 'sweet_berry_bush', nameVi: 'Bụi Quả Mọng', category: 'armor_food', hardness: 0.2, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#2d6a2d', accent: '#dc2626' });

// =========================================================================
// 3.5 MINECRAFT 1.17 – 26.3 MODERN BLOCKS (Caves & Cliffs -> Wild -> Trails -> Tricky Trials -> Garden Awakens -> Copper Age)
// =========================================================================
// 1.17–1.18 Caves & Cliffs
addBlock({ key: 'deepslate', nameVi: 'Đá Phiến Sâu (Deepslate)', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, dropItem: 'cobbled_deepslate', sound: 'stone', texStyle: 'stone', base: '#4a4a52', accent: '#32323a' });
addBlock({ key: 'cobbled_deepslate', nameVi: 'Đá Phiến Sâu Cuội', category: 'building', hardness: 3.2, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'bricks', base: '#494950', accent: '#2f2f36' });
addBlock({ key: 'deepslate_bricks', nameVi: 'Gạch Đá Phiến Sâu', category: 'building', hardness: 3.2, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'bricks', base: '#46464d', accent: '#2c2c33' });
addBlock({ key: 'deepslate_iron_ore', nameVi: 'Quặng Sắt Đá Phiến Sâu', category: 'ores', hardness: 3.8, tool: 'pickaxe', minTier: 2, dropItem: 'raw_iron', sound: 'stone', texStyle: 'ore', base: '#4a4a52', accent: '#d8af93' });
addBlock({ key: 'deepslate_gold_ore', nameVi: 'Quặng Vàng Đá Phiến Sâu', category: 'ores', hardness: 3.8, tool: 'pickaxe', minTier: 3, dropItem: 'raw_gold', sound: 'stone', texStyle: 'ore', base: '#4a4a52', accent: '#facc15' });
addBlock({ key: 'deepslate_diamond_ore', nameVi: 'Quặng Kim Cương Đá Sâu', category: 'ores', hardness: 4.5, tool: 'pickaxe', minTier: 3, dropItem: 'diamond', sound: 'stone', texStyle: 'ore', base: '#4a4a52', accent: '#38bdf8' });
addBlock({ key: 'copper_ore', nameVi: 'Quặng Đồng (Copper Ore)', category: 'ores', hardness: 2.8, tool: 'pickaxe', minTier: 1, dropItem: 'raw_copper', dropCount: 2, sound: 'stone', texStyle: 'ore', base: '#7d7d7d', accent: '#e07a52', trim: '#4ea88a' });
addBlock({ key: 'copper_block', nameVi: 'Khối Đồng', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#c46c4a', accent: '#e08963' });
addBlock({ key: 'exposed_copper', nameVi: 'Khối Đồng Phơi Mưa', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#a17d67', accent: '#7c8f78' });
addBlock({ key: 'weathered_copper', nameVi: 'Khối Đồng Bị Phong Hóa', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#6c9972', accent: '#588766' });
addBlock({ key: 'oxidized_copper', nameVi: 'Khối Đồng Oxy Hóa', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#52a384', accent: '#3d826c' });
addBlock({ key: 'cut_copper', nameVi: 'Đồng Cắt Ô', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'bricks', base: '#c46c4a', accent: '#9e5033' });
addBlock({ key: 'copper_grate', nameVi: 'Lưới Đồng (1.21)', category: 'building', hardness: 2.8, tool: 'pickaxe', minTier: 1, transparent: true, sound: 'metal', texStyle: 'glass', base: '#c46c4a', accent: '#8c4429' });
addBlock({ key: 'amethyst_block', nameVi: 'Khối Thạch Anh Tím', category: 'decor_brew', hardness: 1.5, tool: 'pickaxe', dropItem: 'amethyst_shard', dropCount: 2, sound: 'glass', texStyle: 'metal', base: '#8b5cf6', accent: '#c4b5fd' });
addBlock({ key: 'budding_amethyst', nameVi: 'Thạch Anh Tím Nở Chồi', category: 'decor_brew', hardness: 1.5, tool: 'pickaxe', dropItem: 'amethyst_shard', dropCount: 4, sound: 'glass', texStyle: 'metal', base: '#7c3aed', accent: '#e9d5ff' });
addBlock({ key: 'calcite', nameVi: 'Đá Canxit (Calcite)', category: 'building', hardness: 1.0, tool: 'pickaxe', sound: 'stone', texStyle: 'stone', base: '#e5e7eb', accent: '#cbd5e1' });
addBlock({ key: 'tuff', nameVi: 'Đá Tuff', category: 'building', hardness: 1.6, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'stone', base: '#6b6d66', accent: '#52544d' });
addBlock({ key: 'tuff_bricks', nameVi: 'Gạch Đá Tuff (1.21)', category: 'building', hardness: 1.8, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'bricks', base: '#676962', accent: '#4d4f48' });
addBlock({ key: 'moss_block', nameVi: 'Khối Rêu Xanh', category: 'decor_brew', hardness: 0.3, tool: 'hoe', sound: 'grass', texStyle: 'stone', base: '#597d27', accent: '#749c38' });

// 1.19 The Wild Update
addBlock({ key: 'mud', nameVi: 'Bùn Đất', category: 'building', hardness: 0.5, tool: 'shovel', sound: 'dirt', texStyle: 'stone', base: '#3d3a3f', accent: '#2e2b30' });
addBlock({ key: 'mud_bricks', nameVi: 'Gạch Bùn', category: 'building', hardness: 1.6, tool: 'pickaxe', sound: 'stone', texStyle: 'bricks', base: '#8c6d56', accent: '#6e5340' });
addBlock({ key: 'mangrove_log', nameVi: 'Gỗ Đước (Mangrove)', category: 'building', hardness: 1.8, tool: 'axe', sound: 'wood', texStyle: 'log', base: '#544339', accent: '#753630' });
addBlock({ key: 'mangrove_planks', nameVi: 'Ván Gỗ Đước', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#783630', accent: '#5e2621' });
addBlock({ key: 'mangrove_leaves', nameVi: 'Lá Cây Đước', category: 'decor_brew', hardness: 0.25, tool: 'none', transparent: true, sound: 'grass', texStyle: 'stone', base: '#4d7a2d', accent: '#395e1f' });
addBlock({ key: 'sculk', nameVi: 'Khối Sculk (Deep Dark)', category: 'nether116', hardness: 0.8, tool: 'hoe', sound: 'grass', texStyle: 'stone', base: '#0c1f24', accent: '#0ea5a4' });
addBlock({ key: 'sculk_catalyst', nameVi: 'Xúc Tác Sculk', category: 'nether116', hardness: 2.5, tool: 'hoe', emissive: true, sound: 'stone', texStyle: 'station', base: '#0f2930', accent: '#2dd4bf', trim: '#e2e8f0' });
addBlock({ key: 'ochre_froglight', nameVi: 'Đèn Ếch Vàng Đất', category: 'decor_brew', hardness: 0.4, tool: 'none', emissive: true, sound: 'glass', texStyle: 'metal', base: '#fef08a', accent: '#eab308' });
addBlock({ key: 'verdant_froglight', nameVi: 'Đèn Ếch Xanh Ngọc', category: 'decor_brew', hardness: 0.4, tool: 'none', emissive: true, sound: 'glass', texStyle: 'metal', base: '#bbf7d0', accent: '#4ade80' });
addBlock({ key: 'pearlescent_froglight', nameVi: 'Đèn Ếch Tím Ngọc Trai', category: 'decor_brew', hardness: 0.4, tool: 'none', emissive: true, sound: 'glass', texStyle: 'metal', base: '#f5d0fe', accent: '#d946ef' });

// 1.20 Trails & Tales (Cherry Grove & Bamboo)
addBlock({ key: 'cherry_log', nameVi: 'Gỗ Anh Đào (Cherry)', category: 'building', hardness: 1.8, tool: 'axe', sound: 'wood', texStyle: 'log', base: '#3d2430', accent: '#e6a5b4' });
addBlock({ key: 'cherry_planks', nameVi: 'Ván Gỗ Anh Đào', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#e8b3be', accent: '#d494a2' });
addBlock({ key: 'cherry_leaves', nameVi: 'Lá Hoa Anh Đào', category: 'decor_brew', hardness: 0.2, tool: 'none', transparent: true, sound: 'grass', texStyle: 'stone', base: '#f7b2ca', accent: '#f472b6' });
addBlock({ key: 'cherry_sapling', nameVi: 'Chồi Cây Anh Đào', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#f472b6', accent: '#7c2d12' });
addBlock({ key: 'pink_petals', nameVi: 'Cánh Hoa Anh Đào', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'flat', base: '#f9a8d4', accent: '#4ade80' });
addBlock({ key: 'bamboo_block', nameVi: 'Khối Tre', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'log', base: '#84a635', accent: '#a3c944' });
addBlock({ key: 'bamboo_planks', nameVi: 'Ván Tre', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#d9be66', accent: '#bfa148' });
addBlock({ key: 'bamboo_mosaic', nameVi: 'Gạch Tre Khảm', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'bricks', base: '#d9be66', accent: '#b09138' });
addBlock({ key: 'chiseled_bookshelf', nameVi: 'Kệ Sách Đục Khắc', category: 'decor_brew', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'station', base: '#9c7848', accent: '#3b82f6', trim: '#ef4444' });

// 1.21 Tricky Trials
addBlock({ key: 'copper_bulb', nameVi: 'Bóng Đèn Đồng (1.21)', category: 'redstone', hardness: 3.0, tool: 'pickaxe', minTier: 1, emissive: true, sound: 'metal', texStyle: 'station', base: '#c46c4a', accent: '#fef08a', trim: '#f59e0b' });
addBlock({ key: 'trial_spawner', nameVi: 'Lồng Thử Thách (Trial Spawner)', category: 'nether116', hardness: 5.0, tool: 'pickaxe', minTier: 2, emissive: true, sound: 'metal', texStyle: 'station', base: '#3d4f59', accent: '#f97316', trim: '#c46c4a' });
addBlock({ key: 'vault', nameVi: 'Kho Báu Thử Thách (Vault)', category: 'nether116', hardness: 5.0, tool: 'pickaxe', minTier: 2, emissive: true, sound: 'metal', texStyle: 'station', base: '#32424a', accent: '#fb923c', trim: '#facc15' });
addBlock({ key: 'crafter', nameVi: 'Máy Chế Tạo Tự Động (Crafter)', category: 'redstone', hardness: 1.8, tool: 'pickaxe', sound: 'stone', texStyle: 'station', base: '#78716c', accent: '#ef4444', trim: '#c9a678' });
addBlock({ key: 'heavy_core', nameVi: 'Lõi Nặng (Heavy Core)', category: 'nether116', hardness: 5.0, tool: 'pickaxe', minTier: 2, sound: 'metal', texStyle: 'metal', base: '#475569', accent: '#94a3b8' });

// 1.21.4 The Garden Awakens + 1.21.5 Spring to Life + 1.21.8 Chase the Skies + 1.21.10 Copper Age
addBlock({ key: 'pale_oak_log', nameVi: 'Gỗ Sồi Nhợt (Pale Oak)', category: 'building', hardness: 1.8, tool: 'axe', sound: 'wood', texStyle: 'log', base: '#5e5a5c', accent: '#e2dcd8' });
addBlock({ key: 'pale_oak_planks', nameVi: 'Ván Gỗ Sồi Nhợt', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#e3ddd8', accent: '#c9c1bc' });
addBlock({ key: 'pale_oak_leaves', nameVi: 'Lá Sồi Nhợt', category: 'decor_brew', hardness: 0.2, tool: 'none', transparent: true, sound: 'grass', texStyle: 'stone', base: '#7c827b', accent: '#9da39c' });
addBlock({ key: 'pale_oak_sapling', nameVi: 'Chồi Sồi Nhợt', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#8c918b', accent: '#5c585a' });
addBlock({ key: 'pale_moss_block', nameVi: 'Khối Rêu Nhợt', category: 'decor_brew', hardness: 0.3, tool: 'hoe', sound: 'grass', texStyle: 'stone', base: '#72786e', accent: '#969c92' });
addBlock({ key: 'creaking_heart', nameVi: 'Trái Tim Creaking', category: 'nether116', hardness: 4.0, tool: 'axe', emissive: true, sound: 'wood', texStyle: 'log', base: '#4a4648', accent: '#f97316' });
addBlock({ key: 'resin_block', nameVi: 'Khối Nhựa Cây (Resin)', category: 'decor_brew', hardness: 0.5, tool: 'none', sound: 'grass', texStyle: 'stone', base: '#e06d22', accent: '#fb923c' });
addBlock({ key: 'resin_bricks', nameVi: 'Gạch Nhựa Cây', category: 'building', hardness: 1.8, tool: 'pickaxe', sound: 'stone', texStyle: 'bricks', base: '#d9641c', accent: '#9e410d' });
addBlock({ key: 'open_eyeblossom', nameVi: 'Hoa Mắt Mở (Phát Sáng)', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, emissive: true, sound: 'grass', texStyle: 'plant', base: '#fb923c', accent: '#5e5a5c' });
addBlock({ key: 'firefly_bush', nameVi: 'Bụi Đom Đóm (Spring to Life)', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, emissive: true, sound: 'grass', texStyle: 'plant', base: '#3d6b29', accent: '#fef08a' });
addBlock({ key: 'cactus_flower', nameVi: 'Hoa Xương Rồng', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#f472b6', accent: '#facc15' });
addBlock({ key: 'wildflowers', nameVi: 'Hoa Dại Đồng Cỏ', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'flat', base: '#facc15', accent: '#ffffff' });
addBlock({ key: 'dried_ghast', nameVi: 'Ghast Khô (Chase the Skies)', category: 'nether116', hardness: 0.6, tool: 'none', sound: 'stone', texStyle: 'station', base: '#d6d3d1', accent: '#78716c', trim: '#a8a29e' });
addBlock({ key: 'copper_lantern', nameVi: 'Đèn Lồng Đồng', category: 'decor_brew', hardness: 2.5, tool: 'pickaxe', transparent: true, emissive: true, sound: 'metal', texStyle: 'station', base: '#c46c4a', accent: '#4ade80' });
addBlock({ key: 'copper_torch', nameVi: 'Đuốc Đồng Xanh', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, emissive: true, sound: 'wood', texStyle: 'plant', base: '#4ade80', accent: '#c46c4a' });
addBlock({ key: 'copper_bars', nameVi: 'Song Đồng', category: 'building', hardness: 3.0, tool: 'pickaxe', transparent: true, sound: 'metal', texStyle: 'glass', base: '#c46c4a', accent: '#7c3f26' });
addBlock({ key: 'copper_chain', nameVi: 'Xích Đồng', category: 'building', hardness: 2.8, tool: 'pickaxe', transparent: true, sound: 'metal', texStyle: 'metal', base: '#c46c4a', accent: '#e08963' });
addBlock({ key: 'copper_door', nameVi: 'Cửa Đồng', category: 'redstone', hardness: 3.0, tool: 'pickaxe', transparent: true, sound: 'metal', texStyle: 'planks', base: '#c46c4a', accent: '#9e5033' });
addBlock({ key: 'copper_trapdoor', nameVi: 'Cửa Sập Đồng', category: 'redstone', hardness: 3.0, tool: 'pickaxe', transparent: true, sound: 'metal', texStyle: 'planks', base: '#c46c4a', accent: '#9e5033' });
addBlock({ key: 'lightning_rod', nameVi: 'Cột Thu Lôi (Lightning Rod)', category: 'redstone', hardness: 2.5, tool: 'pickaxe', transparent: true, sound: 'metal', texStyle: 'metal', base: '#c46c4a', accent: '#f97316' });
addBlock({ key: 'powder_snow', nameVi: 'Tuyết Bột (Powder Snow)', category: 'decor_brew', hardness: 0.25, tool: 'shovel', nonSolid: true, sound: 'grass', texStyle: 'stone', base: '#f8fafc', accent: '#e2e8f0' });
addBlock({ key: 'glow_lichen', nameVi: 'Địa Y Phát Sáng', category: 'decor_brew', hardness: 0.2, tool: 'none', transparent: true, nonSolid: true, emissive: true, sound: 'grass', texStyle: 'plant', base: '#86efac', accent: '#bbf7d0' });
addBlock({ key: 'moss_carpet', nameVi: 'Thảm Rêu Xanh', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'flat', base: '#597d27', accent: '#749c38' });
addBlock({ key: 'rooted_dirt', nameVi: 'Đất Rễ Cây', category: 'building', hardness: 0.55, tool: 'shovel', sound: 'dirt', texStyle: 'stone', base: '#866043', accent: '#6b472d' });
addBlock({ key: 'hanging_roots', nameVi: 'Rễ Treo', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#9c7853', accent: '#755638' });
addBlock({ key: 'dripstone_block', nameVi: 'Khối Đá Thạch Nhũ', category: 'building', hardness: 1.5, tool: 'pickaxe', sound: 'stone', texStyle: 'stone', base: '#856b5c', accent: '#6b5346' });
addBlock({ key: 'pointed_dripstone', nameVi: 'Thạch Nhũ Nhọn', category: 'decor_brew', hardness: 1.2, tool: 'pickaxe', transparent: true, sound: 'stone', texStyle: 'plant', base: '#856b5c', accent: '#6b5346' });
addBlock({ key: 'amethyst_cluster', nameVi: 'Cụm Tinh Thể Thạch Anh Tím', category: 'decor_brew', hardness: 1.5, tool: 'pickaxe', dropItem: 'amethyst_shard', dropCount: 4, transparent: true, emissive: true, sound: 'glass', texStyle: 'plant', base: '#a855f7', accent: '#e9d5ff' });
addBlock({ key: 'sculk_sensor', nameVi: 'Cảm Biến Sculk', category: 'redstone', hardness: 1.5, tool: 'hoe', emissive: true, sound: 'stone', texStyle: 'station', base: '#0c272e', accent: '#2dd4bf', trim: '#0ea5a4' });
addBlock({ key: 'sculk_shrieker', nameVi: 'Khối Thét Sculk', category: 'nether116', hardness: 3.0, tool: 'hoe', emissive: true, sound: 'stone', texStyle: 'station', base: '#0a1f24', accent: '#e2e8f0', trim: '#2dd4bf' });
addBlock({ key: 'candle', nameVi: 'Nến Sáp Ong', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, emissive: true, sound: 'wood', texStyle: 'plant', base: '#e5d4a1', accent: '#facc15' });
addBlock({ key: 'packed_mud', nameVi: 'Bùn Nén', category: 'building', hardness: 1.0, tool: 'pickaxe', sound: 'dirt', texStyle: 'stone', base: '#8c6d56', accent: '#705540' });
addBlock({ key: 'mangrove_roots', nameVi: 'Rễ Cây Đước', category: 'building', hardness: 0.7, tool: 'axe', transparent: true, sound: 'wood', texStyle: 'glass', base: '#4a3a2c', accent: '#36281c' });
addBlock({ key: 'mangrove_propagule', nameVi: 'Mầm Cây Đước', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#5a8f32', accent: '#3e691e' });
addBlock({ key: 'suspicious_sand', nameVi: 'Cát Khả Nghi (Khảo Cổ)', category: 'building', hardness: 0.4, tool: 'shovel', sound: 'sand', texStyle: 'stone', base: '#dfd4a8', accent: '#c4b582' });
addBlock({ key: 'suspicious_gravel', nameVi: 'Sỏi Khả Nghi (Khảo Cổ)', category: 'building', hardness: 0.5, tool: 'shovel', sound: 'sand', texStyle: 'stone', base: '#878383', accent: '#6b6767' });
addBlock({ key: 'torchflower', nameVi: 'Hoa Đuốc Cổ Đại (Torchflower)', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, emissive: true, sound: 'grass', texStyle: 'plant', base: '#f97316', accent: '#facc15' });
addBlock({ key: 'chiseled_tuff', nameVi: 'Đá Tuff Đục Khắc', category: 'building', hardness: 1.8, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'bricks', base: '#676962', accent: '#4d4f48' });
addBlock({ key: 'polished_tuff', nameVi: 'Đá Tuff Mài Bóng', category: 'building', hardness: 1.8, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'stone', base: '#6e7069', accent: '#555750' });
addBlock({ key: 'leaf_litter', nameVi: 'Lá Rụng Mùa Thu', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'flat', base: '#9c6838', accent: '#784c24' });
addBlock({ key: 'bush', nameVi: 'Bụi Cây Xanh', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#4a8529', accent: '#65a30d' });
addBlock({ key: 'short_dry_grass', nameVi: 'Cỏ Khô Thảo Nguyên', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#bfa358', accent: '#9e843f' });

// Complete 1.17–1.21 Missing Deepslate, Copper, Sculk, Trails & Tales, Tricky Trials & Copper Age Blocks
addBlock({ key: 'polished_deepslate', nameVi: 'Đá Phiến Sâu Mài Bóng', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'stone', base: '#48484f', accent: '#36363c' });
addBlock({ key: 'deepslate_tiles', nameVi: 'Ngói Đá Phiến Sâu', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'bricks', base: '#3d3d44', accent: '#27272c' });
addBlock({ key: 'chiseled_deepslate', nameVi: 'Đá Phiến Sâu Đục Khắc', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'stone', texStyle: 'bricks', base: '#44444b', accent: '#2b2b30' });
addBlock({ key: 'deepslate_coal_ore', nameVi: 'Quặng Than Đá Sâu', category: 'ores', hardness: 3.5, tool: 'pickaxe', minTier: 1, dropItem: 'coal', sound: 'stone', texStyle: 'ore', base: '#46464d', accent: '#18181b' });
addBlock({ key: 'deepslate_copper_ore', nameVi: 'Quặng Đồng Đá Sâu', category: 'ores', hardness: 3.5, tool: 'pickaxe', minTier: 1, dropItem: 'raw_copper', dropCount: 3, sound: 'stone', texStyle: 'ore', base: '#46464d', accent: '#d97757' });
addBlock({ key: 'deepslate_lapis_ore', nameVi: 'Quặng Ngọc Lưu Ly Sâu', category: 'ores', hardness: 3.8, tool: 'pickaxe', minTier: 2, dropItem: 'lapis_lazuli', dropCount: 5, sound: 'stone', texStyle: 'ore', base: '#46464d', accent: '#2563eb' });
addBlock({ key: 'deepslate_redstone_ore', nameVi: 'Quặng Đá Đỏ Sâu', category: 'ores', hardness: 3.8, tool: 'pickaxe', minTier: 2, dropItem: 'redstone', dropCount: 4, sound: 'stone', texStyle: 'ore', base: '#46464d', accent: '#dc2626' });
addBlock({ key: 'deepslate_emerald_ore', nameVi: 'Quặng Ngọc Lục Bảo Sâu', category: 'ores', hardness: 4.2, tool: 'pickaxe', minTier: 2, dropItem: 'emerald', sound: 'stone', texStyle: 'ore', base: '#46464d', accent: '#22c55e' });
addBlock({ key: 'cut_copper_stairs', nameVi: 'Cầu Thang Đồng Cắt', category: 'building', hardness: 2.8, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#c46c4a', accent: '#9e5033' });
addBlock({ key: 'cut_copper_slab', nameVi: 'Phiến Đồng Cắt', category: 'building', hardness: 2.8, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#c46c4a', accent: '#9e5033' });
addBlock({ key: 'waxed_copper_block', nameVi: 'Khối Đồng Phủ Sáp', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#c46c4a', accent: '#facc15' });
addBlock({ key: 'waxed_exposed_copper', nameVi: 'Đồng Lộ Khí Phủ Sáp', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#a17b63', accent: '#facc15' });
addBlock({ key: 'waxed_weathered_copper', nameVi: 'Đồng Phong Hóa Phủ Sáp', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#69997b', accent: '#facc15' });
addBlock({ key: 'waxed_oxidized_copper', nameVi: 'Đồng Oxy Hóa Phủ Sáp', category: 'building', hardness: 3.0, tool: 'pickaxe', minTier: 1, sound: 'metal', texStyle: 'metal', base: '#51a385', accent: '#facc15' });
addBlock({ key: 'sculk_vein', nameVi: 'Gân Sculk (Deep Dark)', category: 'nether116', hardness: 0.2, tool: 'hoe', transparent: true, nonSolid: true, emissive: true, sound: 'stone', texStyle: 'flat', base: '#0a252d', accent: '#2dd4bf' });
addBlock({ key: 'decorated_pot', nameVi: 'Bình Gốm Trang Trí', category: 'decor_brew', hardness: 0.3, tool: 'none', transparent: true, sound: 'stone', texStyle: 'station', base: '#9e533c', accent: '#753826', trim: '#c9785d' });
addBlock({ key: 'pitcher_plant', nameVi: 'Cây Nắp Ấm (Pitcher Plant)', category: 'decor_brew', hardness: 0.1, tool: 'none', transparent: true, nonSolid: true, sound: 'grass', texStyle: 'plant', base: '#38bdf8', accent: '#7c3aed' });
addBlock({ key: 'oak_hanging_sign', nameVi: 'Biển Treo Gỗ Sồi', category: 'decor_brew', hardness: 1.0, tool: 'axe', transparent: true, sound: 'wood', texStyle: 'planks', base: '#a2824e', accent: '#6b4c28' });
addBlock({ key: 'bamboo_stairs', nameVi: 'Cầu Thang Tre', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#c9b458', accent: '#9e8b38' });
addBlock({ key: 'bamboo_slab', nameVi: 'Phiến Tre', category: 'building', hardness: 1.5, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#c9b458', accent: '#9e8b38' });
addBlock({ key: 'ominous_vault', nameVi: 'Kho Báu Điềm Gở (Ominous Vault)', category: 'nether116', hardness: 8.0, tool: 'pickaxe', emissive: true, sound: 'metal', texStyle: 'station', base: '#1e293b', accent: '#22d3ee', trim: '#f43f5e' });
addBlock({ key: 'ominous_trial_spawner', nameVi: 'Lồng Thử Thách Điềm Gở', category: 'nether116', hardness: 8.0, tool: 'pickaxe', emissive: true, sound: 'metal', texStyle: 'station', base: '#1e293b', accent: '#38bdf8', trim: '#e11d48' });
addBlock({ key: 'copper_chest', nameVi: 'Rương Đồng (Copper Age)', category: 'decor_brew', hardness: 2.5, tool: 'pickaxe', sound: 'metal', texStyle: 'station', base: '#c46c4a', accent: '#4ea88a', trim: '#7c3f26' });
addBlock({ key: 'copper_shelf', nameVi: 'Kệ Đồng (Copper Age)', category: 'decor_brew', hardness: 2.0, tool: 'pickaxe', sound: 'metal', texStyle: 'station', base: '#c46c4a', accent: '#e89572', trim: '#7c3f26' });

// 2026 Chaos Cubed — Sulfur Caves & Cinnabar!
addBlock({ key: 'sulfur_block', nameVi: 'Khối Lưu Huỳnh (Chaos Cubed)', category: 'building', hardness: 1.4, tool: 'pickaxe', emissive: true, sound: 'stone', texStyle: 'stone', base: '#eab308', accent: '#fef08a' });
addBlock({ key: 'sulfur_ore', nameVi: 'Quặng Lưu Huỳnh', category: 'ores', hardness: 2.4, tool: 'pickaxe', minTier: 1, dropItem: 'sulfur_dust', dropCount: 3, sound: 'stone', texStyle: 'ore', base: '#6b685e', accent: '#facc15' });
addBlock({ key: 'cinnabar_ore', nameVi: 'Quặng Chu Sa (Cinnabar Ore)', category: 'ores', hardness: 3.2, tool: 'pickaxe', minTier: 2, dropItem: 'cinnabar_gem', dropCount: 2, emissive: true, sound: 'stone', texStyle: 'ore', base: '#4a4347', accent: '#ef4444' });
addBlock({ key: 'cinnabar_block', nameVi: 'Khối Chu Sa (Cinnabar Block)', category: 'ores', hardness: 3.8, tool: 'pickaxe', minTier: 2, emissive: true, sound: 'metal', texStyle: 'metal', base: '#dc2626', accent: '#fca5a5' });

// 26.4 Winter Drop (Experimental/Bonus) — Ice Caves, Ice Crystals, Icicles, Snow Bricks, Calcite Set!
addBlock({ key: 'ice_crystal', nameVi: 'Tinh Thể Băng (26.4)', category: 'decor_brew', hardness: 1.0, tool: 'pickaxe', transparent: true, emissive: true, sound: 'glass', texStyle: 'plant', base: '#7dd3fc', accent: '#e0f2fe' });
addBlock({ key: 'icicle', nameVi: 'Nhũ Băng (Icicle 26.4)', category: 'decor_brew', hardness: 0.6, tool: 'pickaxe', transparent: true, sound: 'glass', texStyle: 'plant', base: '#bae6fd', accent: '#f8fafc' });
addBlock({ key: 'snow_bricks', nameVi: 'Gạch Tuyết (26.4)', category: 'building', hardness: 0.8, tool: 'shovel', sound: 'grass', texStyle: 'bricks', base: '#f1f5f9', accent: '#cbd5e1' });
addBlock({ key: 'polished_calcite', nameVi: 'Đá Calcite Đánh Bóng (26.4)', category: 'building', hardness: 1.4, tool: 'pickaxe', sound: 'stone', texStyle: 'stone', base: '#ecece6', accent: '#d6d4cc' });
addBlock({ key: 'calcite_bricks', nameVi: 'Gạch Calcite (26.4)', category: 'building', hardness: 1.6, tool: 'pickaxe', sound: 'stone', texStyle: 'bricks', base: '#e5e5de', accent: '#c9c7be' });

// The End Dimension Portals!
addBlock({ key: 'end_portal', nameVi: 'Cổng The End', category: 'nether116', hardness: -1, tool: 'none', dropItem: null, transparent: true, nonSolid: true, emissive: true, sound: 'glass', texStyle: 'station', base: '#090914', accent: '#a855f7', trim: '#38bdf8' });
addBlock({ key: 'end_gateway', nameVi: 'Cổng Dịch Chuyển End Gateway', category: 'nether116', hardness: -1, tool: 'none', dropItem: null, transparent: true, nonSolid: true, emissive: true, sound: 'glass', texStyle: 'station', base: '#0d061a', accent: '#e879f9', trim: '#2dd4bf' });

// =========================================================================
// 4. ALL 16 COLORS: WOOL (remaining 10), STAINED GLASS (16), TERRACOTTA (16), CONCRETE (16), CONCRETE POWDER (16), CARPET (6 key)
// =========================================================================
const EXISTING_WOOL = new Set(['white', 'red', 'blue', 'yellow', 'green', 'black']);
for (const c of MC_COLORS) {
  if (!EXISTING_WOOL.has(c.id)) {
    addBlock({
      key: `${c.id}_wool`,
      nameVi: `Len ${c.nameVi}`,
      category: 'decor_brew',
      hardness: 0.6,
      tool: 'none',
      sound: 'grass',
      texStyle: 'wool',
      base: c.hex,
      accent: c.accent,
    });
  }
  addBlock({
    key: `${c.id}_stained_glass`,
    nameVi: `Kính ${c.nameVi}`,
    category: 'decor_brew',
    hardness: 0.4,
    tool: 'none',
    sound: 'glass',
    transparent: true,
    texStyle: 'glass',
    base: c.hex,
    accent: c.accent,
  });
  addBlock({
    key: `${c.id}_terracotta`,
    nameVi: `Đất Nung ${c.nameVi}`,
    category: 'building',
    hardness: 1.5,
    sound: 'stone',
    texStyle: 'terracotta',
    base: c.hex,
    accent: c.accent,
  });
  addBlock({
    key: `${c.id}_concrete`,
    nameVi: `Bê Tông ${c.nameVi}`,
    category: 'building',
    hardness: 1.8,
    sound: 'stone',
    texStyle: 'concrete',
    base: c.hex,
    accent: c.accent,
  });
  addBlock({
    key: `${c.id}_concrete_powder`,
    nameVi: `Bột Bê Tông ${c.nameVi}`,
    category: 'building',
    hardness: 0.5,
    tool: 'shovel',
    sound: 'sand',
    texStyle: 'powder',
    base: c.hex,
    accent: c.accent,
  });
  addBlock({
    key: `${c.id}_carpet`,
    nameVi: `Thảm ${c.nameVi}`,
    category: 'decor_brew',
    hardness: 0.2,
    tool: 'none',
    sound: 'grass',
    nonSolid: true,
    texStyle: 'wool',
    base: c.hex,
    accent: c.accent,
  });
}

// Wave 3 Redstone blocks (appended at end to preserve all saved block IDs)
addBlock({ key: 'redstone_wire', nameVi: 'Dây Redstone', category: 'redstone', hardness: 0.05, tool: 'none', dropItem: 'redstone', sound: 'stone', transparent: true, nonSolid: true, emissive: true, texStyle: 'flat', base: '#991b1b', accent: '#ef4444' });
addBlock({ key: 'redstone_lamp_on', nameVi: 'Đèn Redstone (Bật)', category: 'redstone', hardness: 0.6, tool: 'none', dropItem: 'redstone_lamp', sound: 'glass', emissive: true, texStyle: 'station', base: '#f59e0b', accent: '#fef08a', trim: '#b45309' });

// Wave 5 Official Java 26.1 (Tiny Takeover) & 26.3 (Wilderness Bound) Blocks (appended at end to preserve saved IDs)
addBlock({ key: 'golden_dandelion', nameVi: 'Bồ Công Anh Vàng (26.1)', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, emissive: true, texStyle: 'plant', base: '#facc15', accent: '#fef08a' });
addBlock({ key: 'poplar_log', nameVi: 'Gỗ Dương (Poplar 26.3)', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'log', base: '#b5a27e', accent: '#75664c' });
addBlock({ key: 'poplar_planks', nameVi: 'Ván Gỗ Dương (26.3)', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#d9c698', accent: '#b8a274' });
addBlock({ key: 'poplar_leaves', nameVi: 'Lá Dương Vàng Thu (26.3)', category: 'decor_brew', hardness: 0.25, tool: 'none', sound: 'grass', transparent: true, texStyle: 'stone', base: '#d9a432', accent: '#facc15' });
addBlock({ key: 'poplar_sapling', nameVi: 'Cây Non Gỗ Dương (26.3)', category: 'decor_brew', hardness: 0.1, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#d9a432', accent: '#9a7b4f' });
addBlock({ key: 'poplar_slab', nameVi: 'Phiến Gỗ Dương (26.3)', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#d9c698', accent: '#b8a274' });
addBlock({ key: 'poplar_stairs', nameVi: 'Cầu Thang Gỗ Dương (26.3)', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#d9c698', accent: '#b8a274' });
addBlock({ key: 'poplar_fence', nameVi: 'Hàng Rào Gỗ Dương (26.3)', category: 'building', hardness: 2.0, tool: 'axe', sound: 'wood', texStyle: 'planks', base: '#d9c698', accent: '#b8a274' });
addBlock({ key: 'shelf_mushroom', nameVi: 'Nấm Thân Cây (Shelf Mushroom 26.3)', category: 'decor_brew', hardness: 0.2, tool: 'none', sound: 'grass', transparent: true, nonSolid: true, texStyle: 'plant', base: '#d49a52', accent: '#f5e1b9' });
addBlock({ key: 'straw_bed', nameVi: 'Giường Rơm (Straw Bed 26.3)', category: 'decor_brew', hardness: 0.4, tool: 'none', sound: 'grass', texStyle: 'wool', base: '#d9b54a', accent: '#a8842a' });
addBlock({ key: 'cushion', nameVi: 'Đệm Ngồi Len (Cushion 26.3)', category: 'decor_brew', hardness: 0.4, tool: 'none', sound: 'grass', texStyle: 'wool', base: '#e26a5c', accent: '#f8fafc' });
addBlock({ key: 'white_wool_slab', nameVi: 'Phiến Len Trắng (26.3)', category: 'building', hardness: 0.6, tool: 'none', sound: 'grass', texStyle: 'wool', base: '#f4f4f5', accent: '#d4d4d8' });
addBlock({ key: 'red_wool_slab', nameVi: 'Phiến Len Đỏ (26.3)', category: 'building', hardness: 0.6, tool: 'none', sound: 'grass', texStyle: 'wool', base: '#c53030', accent: '#9b2c2c' });

// =========================================================================
// 5. ALL EXTENDED NON-BLOCK ITEMS (Sections A, B, C, D, G, H, J, K, L)
// =========================================================================
export const EXT_ITEMS: ItemDef[] = [
  // Basic materials & nuggets
  { id: 'charcoal', nameVi: 'Than Củi', maxStack: 64, category: 'ores', fuelTime: 80, iconShape: 'gem', iconColor: '#36322d', iconAccent: '#615a52' },
  { id: 'iron_nugget', nameVi: 'Hạt Sắt', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#cfd4d9', iconAccent: '#ffffff' },
  { id: 'gold_nugget', nameVi: 'Hạt Vàng', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#f5c531', iconAccent: '#fef08a' },
  { id: 'clay_ball', nameVi: 'Cục Đất Sét', maxStack: 64, category: 'ores', iconShape: 'pearl', iconColor: '#9ea5b3', iconAccent: '#cbd5e1' },
  { id: 'bone_meal', nameVi: 'Bột Xương', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#f4f4f0', iconAccent: '#ffffff' },
  { id: 'ink_sac', nameVi: 'Túi Mực', maxStack: 64, category: 'ores', iconShape: 'pearl', iconColor: '#1f1f26', iconAccent: '#52525b' },
  { id: 'prismarine_shard', nameVi: 'Mảnh Prismarine', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#5cb5a8', iconAccent: '#a7f3d0' },
  { id: 'prismarine_crystals', nameVi: 'Tinh Thể Prismarine', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#99f6e4', iconAccent: '#ffffff' },
  { id: 'scute', nameVi: 'Vảy Rùa', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#4d9c46', iconAccent: '#86efac' },
  { id: 'shulker_shell', nameVi: 'Vỏ Shulker', maxStack: 64, category: 'ores', iconShape: 'helmet', iconColor: '#9b6ba8', iconAccent: '#d8b4fe' },
  { id: 'nether_wart', nameVi: 'Bướu Địa Ngục', maxStack: 64, category: 'nether116', iconShape: 'dust', iconColor: '#991b1b', iconAccent: '#f87171' },
  { id: 'warped_fungus', nameVi: 'Nấm Xanh Warped', maxStack: 64, category: 'nether116', iconShape: 'apple', iconColor: '#14b8a6', iconAccent: '#f97316' },
  { id: 'crimson_fungus', nameVi: 'Nấm Đỏ Crimson', maxStack: 64, category: 'nether116', iconShape: 'apple', iconColor: '#b91c1c', iconAccent: '#fca5a5' },

  // All 16 Dyes (Section G)
  ...MC_COLORS.map<ItemDef>((c) => ({
    id: `${c.id}_dye`,
    nameVi: `Thuốc Nhuộm ${c.nameVi}`,
    maxStack: 64,
    category: 'decor_brew',
    iconShape: 'dust',
    iconColor: c.hex,
    iconAccent: c.accent,
  })),

  // Flowers (Dye sources)
  { id: 'poppy', nameVi: 'Hoa Anh Túc', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#dc2626', iconAccent: '#22c55e' },
  { id: 'dandelion', nameVi: 'Hoa Bồ Công Anh', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#facc15', iconAccent: '#22c55e' },
  { id: 'cornflower', nameVi: 'Hoa Thanh Cúc', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#3b82f6', iconAccent: '#22c55e' },

  // Armor & Combat (Section B & K)
  { id: 'chainmail_helmet', nameVi: 'Mũ Giáp Xích', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#9ca3af', iconAccent: '#e5e7eb' },
  { id: 'chainmail_chestplate', nameVi: 'Áo Giáp Xích', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 5, iconShape: 'chestplate', iconColor: '#9ca3af', iconAccent: '#e5e7eb' },
  { id: 'chainmail_leggings', nameVi: 'Quần Giáp Xích', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 4, iconShape: 'leggings', iconColor: '#9ca3af', iconAccent: '#e5e7eb' },
  { id: 'chainmail_boots', nameVi: 'Giày Giáp Xích', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 1, iconShape: 'boots', iconColor: '#9ca3af', iconAccent: '#e5e7eb' },
  { id: 'turtle_helmet', nameVi: 'Mũ Rùa', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 3, iconShape: 'helmet', iconColor: '#4d9c46', iconAccent: '#86efac' },
  { id: 'elytra', nameVi: 'Cánh Cứng (Elytra)', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 2, iconShape: 'elytra', iconColor: '#8d8b9e', iconAccent: '#d4d4d8' },
  { id: 'trident', nameVi: 'Đinh Ba (Trident)', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 4, attackDamage: 9, iconShape: 'trident', iconColor: '#2dd4bf', iconAccent: '#ccfbf1' },
  { id: 'crossbow', nameVi: 'Nỏ (Crossbow)', maxStack: 1, category: 'tools', attackDamage: 8, iconShape: 'bow', iconColor: '#7c522c', iconAccent: '#d4d8dc' },
  { id: 'spectral_arrow', nameVi: 'Mũi Tên Phổ', maxStack: 64, category: 'tools', iconShape: 'arrow', iconColor: '#eab308', iconAccent: '#fef08a' },
  { id: 'tipped_arrow', nameVi: 'Mũi Tên Thuốc', maxStack: 64, category: 'tools', iconShape: 'arrow', iconColor: '#ec4899', iconAccent: '#fbcfe8' },
  { id: 'fishing_rod', nameVi: 'Cần Câu', maxStack: 1, category: 'tools', iconShape: 'bow', iconColor: '#8d6438', iconAccent: '#ffffff' },
  { id: 'warped_fungus_on_a_stick', nameVi: 'Cần Câu Nấm Xanh', maxStack: 1, category: 'nether116', iconShape: 'rod', iconColor: '#8d6438', iconAccent: '#14b8a6' },
  { id: 'compass', nameVi: 'La Bàn', maxStack: 64, category: 'tools', iconShape: 'compass', iconColor: '#d4d8dc', iconAccent: '#ef4444' },
  { id: 'clock', nameVi: 'Đồng Hồ', maxStack: 64, category: 'tools', iconShape: 'clock', iconColor: '#f5c531', iconAccent: '#60a5fa' },

  // Food & Farming (Section C)
  { id: 'bowl', nameVi: 'Cái Bát', maxStack: 64, category: 'armor_food', iconShape: 'bowl', iconColor: '#8d6438', iconAccent: '#b88652' },
  { id: 'milk_bucket', nameVi: 'Xô Sữa', maxStack: 1, category: 'armor_food', foodRestore: 2, healRestore: 2, iconShape: 'bucket', iconColor: '#c4c9d0', iconAccent: '#ffffff' },
  { id: 'sugar', nameVi: 'Đường', maxStack: 64, category: 'armor_food', iconShape: 'dust', iconColor: '#f8fafc', iconAccent: '#ffffff' },
  { id: 'egg', nameVi: 'Trứng Gà', maxStack: 16, category: 'armor_food', iconShape: 'pearl', iconColor: '#e6d8b5', iconAccent: '#ffffff' },
  { id: 'cocoa_beans', nameVi: 'Hạt Cacao', maxStack: 64, category: 'armor_food', iconShape: 'pearl', iconColor: '#6b3e1e', iconAccent: '#9c5a2c' },
  { id: 'red_mushroom', nameVi: 'Nấm Đỏ', maxStack: 64, category: 'armor_food', iconShape: 'apple', iconColor: '#dc2626', iconAccent: '#ffffff' },
  { id: 'brown_mushroom', nameVi: 'Nấm Nâu', maxStack: 64, category: 'armor_food', iconShape: 'apple', iconColor: '#9c7250', iconAccent: '#d6b494' },
  { id: 'mushroom_stew', nameVi: 'Súp Nấm', maxStack: 1, category: 'armor_food', foodRestore: 6, healRestore: 2, iconShape: 'bowl', iconColor: '#8d6438', iconAccent: '#c46c50' },
  { id: 'beetroot', nameVi: 'Củ Dền', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'apple', iconColor: '#9f1239', iconAccent: '#4ade80' },
  { id: 'beetroot_soup', nameVi: 'Súp Củ Dền', maxStack: 1, category: 'armor_food', foodRestore: 6, healRestore: 2, iconShape: 'bowl', iconColor: '#8d6438', iconAccent: '#be123c' },
  { id: 'rabbit_stew', nameVi: 'Thỏ Hầm', maxStack: 1, category: 'armor_food', foodRestore: 10, healRestore: 4, iconShape: 'bowl', iconColor: '#8d6438', iconAccent: '#ea580c' },
  { id: 'wheat_seeds', nameVi: 'Hạt Lúa Mì', maxStack: 64, category: 'armor_food', iconShape: 'dust', iconColor: '#65a30d', iconAccent: '#bef264' },
  { id: 'melon_seeds', nameVi: 'Hạt Dưa Hấu', maxStack: 64, category: 'armor_food', iconShape: 'dust', iconColor: '#3f3f46', iconAccent: '#a1a1aa' },
  { id: 'pumpkin_seeds', nameVi: 'Hạt Bí Ngô', maxStack: 64, category: 'armor_food', iconShape: 'dust', iconColor: '#e5d4a1', iconAccent: '#ffffff' },
  { id: 'beetroot_seeds', nameVi: 'Hạt Củ Dền', maxStack: 64, category: 'armor_food', iconShape: 'dust', iconColor: '#9c7b5c', iconAccent: '#d6b494' },
  { id: 'potato', nameVi: 'Khoai Tây', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#c9a66b', iconAccent: '#e6ca96' },
  { id: 'raw_mutton', nameVi: 'Thịt Cừu Sống', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#e07a7a', iconAccent: '#fecaca' },
  { id: 'cooked_mutton', nameVi: 'Thịt Cừu Chín', maxStack: 64, category: 'armor_food', foodRestore: 6, healRestore: 2, iconShape: 'food', iconColor: '#9c5234', iconAccent: '#d48b63' },
  { id: 'raw_rabbit', nameVi: 'Thịt Thỏ Sống', maxStack: 64, category: 'armor_food', foodRestore: 3, iconShape: 'food', iconColor: '#f0b8a8', iconAccent: '#ffe4dc' },
  { id: 'cooked_rabbit', nameVi: 'Thịt Thỏ Chín', maxStack: 64, category: 'armor_food', foodRestore: 5, healRestore: 2, iconShape: 'food', iconColor: '#b57242', iconAccent: '#e0a575' },
  { id: 'raw_cod', nameVi: 'Cá Tuyết Sống', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#c4b89e', iconAccent: '#e8dfc9' },
  { id: 'cooked_cod', nameVi: 'Cá Tuyết Chín', maxStack: 64, category: 'armor_food', foodRestore: 5, healRestore: 2, iconShape: 'food', iconColor: '#b88a56', iconAccent: '#e3bb88' },
  { id: 'raw_salmon', nameVi: 'Cá Hồi Sống', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#c94c4c', iconAccent: '#6fa89e' },
  { id: 'cooked_salmon', nameVi: 'Cá Hồi Chín', maxStack: 64, category: 'armor_food', foodRestore: 6, healRestore: 2, iconShape: 'food', iconColor: '#d96f4a', iconAccent: '#f5b08e' },
  { id: 'pufferfish', nameVi: 'Cá Nóc', maxStack: 64, category: 'armor_food', foodRestore: 1, iconShape: 'pearl', iconColor: '#eab308', iconAccent: '#38bdf8' },
  { id: 'kelp', nameVi: 'Tảo Biển', maxStack: 64, category: 'armor_food', iconShape: 'rod', iconColor: '#3f7a2c', iconAccent: '#65a30d' },
  { id: 'dried_kelp', nameVi: 'Tảo Khô', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'paper', iconColor: '#2d3b22', iconAccent: '#4d613c' },
  { id: 'honey_bottle', nameVi: 'Chai Mật Ong', maxStack: 16, category: 'armor_food', foodRestore: 6, healRestore: 2, iconShape: 'potion', iconColor: '#f59e0b', iconAccent: '#fef08a' },
  { id: 'honeycomb', nameVi: 'Tổ Ong (Honeycomb)', maxStack: 64, category: 'decor_brew', iconShape: 'gem', iconColor: '#f59e0b', iconAccent: '#fde047' },
  { id: 'chorus_fruit', nameVi: 'Quả Chorus', maxStack: 64, category: 'armor_food', foodRestore: 4, iconShape: 'apple', iconColor: '#9b6ba8', iconAccent: '#e9d5ff' },
  { id: 'popped_chorus_fruit', nameVi: 'Quả Chorus Nổ', maxStack: 64, category: 'ores', iconShape: 'pearl', iconColor: '#b782c4', iconAccent: '#f3e8ff' },
  { id: 'glistering_melon_slice', nameVi: 'Dưa Hấu Lấp Lánh', maxStack: 64, category: 'decor_brew', iconShape: 'food', iconColor: '#ef4444', iconAccent: '#facc15' },

  // Utility, Transport, Banners, Decor (Sections D, G, K, L)
  { id: 'map', nameVi: 'Bản Đồ Trống', maxStack: 64, category: 'tools', iconShape: 'paper', iconColor: '#e6d8b5', iconAccent: '#a89468' },
  { id: 'writable_book', nameVi: 'Sách & Bút', maxStack: 1, category: 'decor_brew', iconShape: 'book', iconColor: '#7c4a26', iconAccent: '#facc15' },
  { id: 'enchanted_book', nameVi: 'Sách Phù Phép', maxStack: 1, category: 'decor_brew', iconShape: 'book', iconColor: '#9333ea', iconAccent: '#facc15' },
  { id: 'item_frame', nameVi: 'Khung Vật Phẩm', maxStack: 64, category: 'decor_brew', iconShape: 'shield', iconColor: '#9c5a32', iconAccent: '#c4965a' },
  { id: 'painting', nameVi: 'Tranh Treo Tường', maxStack: 64, category: 'decor_brew', iconShape: 'shield', iconColor: '#3b82f6', iconAccent: '#c4965a' },
  { id: 'armor_stand', nameVi: 'Giá Treo Giáp', maxStack: 16, category: 'decor_brew', iconShape: 'totem', iconColor: '#a68250', iconAccent: '#8c8c92' },
  { id: 'oak_boat', nameVi: 'Thuyền Gỗ Sồi', maxStack: 1, category: 'tools', iconShape: 'boat', iconColor: '#a2824e', iconAccent: '#70552c' },
  { id: 'crimson_boat', nameVi: 'Thuyền Nấm Đỏ', maxStack: 1, category: 'nether116', iconShape: 'boat', iconColor: '#75334f', iconAccent: '#4a1b30' },
  { id: 'warped_boat', nameVi: 'Thuyền Nấm Xanh', maxStack: 1, category: 'nether116', iconShape: 'boat', iconColor: '#2b706d', iconAccent: '#1a4a47' },
  { id: 'minecart', nameVi: 'Xe Mỏ', maxStack: 1, category: 'redstone', iconShape: 'boat', iconColor: '#9ca3af', iconAccent: '#4b5563' },
  { id: 'chest_minecart', nameVi: 'Xe Mỏ Rương', maxStack: 1, category: 'redstone', iconShape: 'boat', iconColor: '#9ca3af', iconAccent: '#b4783c' },
  { id: 'hopper_minecart', nameVi: 'Xe Mỏ Phễu', maxStack: 1, category: 'redstone', iconShape: 'boat', iconColor: '#9ca3af', iconAccent: '#3f3f46' },
  { id: 'tnt_minecart', nameVi: 'Xe Mỏ TNT', maxStack: 1, category: 'redstone', iconShape: 'boat', iconColor: '#9ca3af', iconAccent: '#dc2626' },
  { id: 'firework_rocket', nameVi: 'Tên Lửa Pháo Hoa', maxStack: 64, category: 'tools', iconShape: 'rod', iconColor: '#dc2626', iconAccent: '#f8fafc' },
  { id: 'firework_star', nameVi: 'Sao Pháo Hoa', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#3f3f46', iconAccent: '#facc15' },
  { id: 'fire_charge', nameVi: 'Cầu Lửa', maxStack: 64, category: 'nether116', isFlintAndSteel: true, iconShape: 'pearl', iconColor: '#f97316', iconAccent: '#fef08a' },
  { id: 'eye_of_ender', nameVi: 'Mắt Ender', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#10b981', iconAccent: '#bef264' },
  { id: 'end_crystal', nameVi: 'Pha Lê End', maxStack: 64, category: 'decor_brew', iconShape: 'gem', iconColor: '#e879f9', iconAccent: '#ffffff' },
  { id: 'white_banner', nameVi: 'Cờ Trắng (Banner)', maxStack: 16, category: 'decor_brew', iconShape: 'banner', iconColor: '#f4f4f5', iconAccent: '#8d6438' },
  { id: 'red_banner', nameVi: 'Cờ Đỏ', maxStack: 16, category: 'decor_brew', iconShape: 'banner', iconColor: '#dc2626', iconAccent: '#8d6438' },
  { id: 'blue_banner', nameVi: 'Cờ Xanh Dương', maxStack: 16, category: 'decor_brew', iconShape: 'banner', iconColor: '#2563eb', iconAccent: '#8d6438' },
  { id: 'black_banner', nameVi: 'Cờ Đen', maxStack: 16, category: 'decor_brew', iconShape: 'banner', iconColor: '#1f1f24', iconAccent: '#8d6438' },
  { id: 'creeper_banner_pattern', nameVi: 'Mẫu Cờ Creeper', maxStack: 1, category: 'decor_brew', iconShape: 'paper', iconColor: '#d4d4d8', iconAccent: '#22c55e' },
  { id: 'skull_banner_pattern', nameVi: 'Mẫu Cờ Đầu Lâu', maxStack: 1, category: 'decor_brew', iconShape: 'paper', iconColor: '#d4d4d8', iconAccent: '#27272a' },
  { id: 'flower_banner_pattern', nameVi: 'Mẫu Cờ Hoa', maxStack: 1, category: 'decor_brew', iconShape: 'paper', iconColor: '#d4d4d8', iconAccent: '#eab308' },
  { id: 'mojang_banner_pattern', nameVi: 'Mẫu Cờ Mojang', maxStack: 1, category: 'decor_brew', iconShape: 'paper', iconColor: '#d4d4d8', iconAccent: '#dc2626' },

  // Rare Non-Craftable 1.16 Items (Section K)
  { id: 'dragon_head', nameVi: 'Đầu Rồng Ender', maxStack: 64, category: 'decor_brew', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#1f1b24', iconAccent: '#a855f7' },
  { id: 'wither_skeleton_skull', nameVi: 'Đầu Wither Skeleton', maxStack: 64, category: 'nether116', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#2c2b30', iconAccent: '#71717a' },
  { id: 'heart_of_the_sea', nameVi: 'Trái Tim Biển Cả', maxStack: 64, category: 'ores', iconShape: 'pearl', iconColor: '#0ea5e9', iconAccent: '#e0f2fe' },
  { id: 'nautilus_shell', nameVi: 'Vỏ Ốc Anh Vũ', maxStack: 64, category: 'ores', iconShape: 'pearl', iconColor: '#e5d4c0', iconAccent: '#a16207' },
  { id: 'music_disc_pigstep', nameVi: 'Đĩa Nhạc Pigstep 1.16', maxStack: 1, category: 'nether116', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#f59e0b' },
  { id: 'music_disc_cat', nameVi: 'Đĩa Nhạc Cat', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#22c55e' },
  { id: 'name_tag', nameVi: 'Thẻ Tên', maxStack: 64, category: 'decor_brew', iconShape: 'paper', iconColor: '#d6c5a3', iconAccent: '#71717a' },
  { id: 'saddle', nameVi: 'Yên Cưỡi', maxStack: 1, category: 'tools', iconShape: 'chestplate', iconColor: '#9c5228', iconAccent: '#d4d8dc' },
  { id: 'iron_horse_armor', nameVi: 'Giáp Ngựa Sắt', maxStack: 1, category: 'armor_food', iconShape: 'chestplate', iconColor: '#d4d8dc', iconAccent: '#ffffff' },
  { id: 'golden_horse_armor', nameVi: 'Giáp Ngựa Vàng', maxStack: 1, category: 'armor_food', iconShape: 'chestplate', iconColor: '#f5c531', iconAccent: '#fef08a' },
  { id: 'diamond_horse_armor', nameVi: 'Giáp Ngựa Kim Cương', maxStack: 1, category: 'armor_food', iconShape: 'chestplate', iconColor: '#3ee0e8', iconAccent: '#c4fbff' },

  // Brewing Ingredients & ALL 1.16 Potions (Section J — drinkable!)
  { id: 'glass_bottle', nameVi: 'Chai Thủy Tinh', maxStack: 64, category: 'decor_brew', iconShape: 'potion', iconColor: '#cbd5e1', iconAccent: '#ffffff' },
  { id: 'water_bottle', nameVi: 'Chai Nước', maxStack: 1, category: 'decor_brew', iconShape: 'potion', iconColor: '#3b82f6', iconAccent: '#93c5fd' },
  { id: 'awkward_potion', nameVi: 'Thuốc Thô (Awkward)', maxStack: 1, category: 'decor_brew', iconShape: 'potion', iconColor: '#2563eb', iconAccent: '#93c5fd' },
  { id: 'spider_eye', nameVi: 'Mắt Nhện', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#991b1b', iconAccent: '#4ade80' },
  { id: 'fermented_spider_eye', nameVi: 'Mắt Nhện Lên Men', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#7f1d1d', iconAccent: '#c084fc' },
  { id: 'rabbit_foot', nameVi: 'Chân Thỏ', maxStack: 64, category: 'decor_brew', iconShape: 'feather', iconColor: '#c9a678', iconAccent: '#f5e6d3' },
  { id: 'phantom_membrane', nameVi: 'Màng Phantom', maxStack: 64, category: 'decor_brew', iconShape: 'paper', iconColor: '#cbd5e1', iconAccent: '#94a3b8' },
  { id: 'dragon_breath', nameVi: 'Hơi Thở Rồng', maxStack: 64, category: 'decor_brew', iconShape: 'potion', iconColor: '#d946ef', iconAccent: '#f5d0fe' },

  { id: 'potion_regeneration', nameVi: 'Thuốc Hồi Máu', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'regeneration', amplifier: 0, durationSec: 45 }, iconShape: 'potion', iconColor: '#f472b6', iconAccent: '#fbcfe8' },
  { id: 'potion_strength', nameVi: 'Thuốc Sức Mạnh', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'strength', amplifier: 0, durationSec: 180 }, iconShape: 'potion', iconColor: '#b91c1c', iconAccent: '#fca5a5' },
  { id: 'potion_swiftness', nameVi: 'Thuốc Tốc Độ', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'speed', amplifier: 0, durationSec: 180 }, iconShape: 'potion', iconColor: '#38bdf8', iconAccent: '#bae6fd' },
  { id: 'potion_leaping', nameVi: 'Thuốc Nhảy Cao', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'jump_boost', amplifier: 0, durationSec: 180 }, iconShape: 'potion', iconColor: '#4ade80', iconAccent: '#bbf7d0' },
  { id: 'potion_healing', nameVi: 'Thuốc Chữa Trị', maxStack: 1, category: 'decor_brew', healRestore: 8, foodRestore: 1, iconShape: 'potion', iconColor: '#ef4444', iconAccent: '#fecaca' },
  { id: 'potion_fire_resistance', nameVi: 'Thuốc Kháng Lửa', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'fire_resistance', amplifier: 0, durationSec: 180 }, iconShape: 'potion', iconColor: '#f97316', iconAccent: '#fed7aa' },
  { id: 'potion_water_breathing', nameVi: 'Thuốc Thở Dưới Nước', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'water_breathing', amplifier: 0, durationSec: 180 }, iconShape: 'potion', iconColor: '#0284c7', iconAccent: '#7dd3fc' },
  { id: 'potion_night_vision', nameVi: 'Thuốc Nhìn Đêm', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'night_vision', amplifier: 0, durationSec: 180 }, iconShape: 'potion', iconColor: '#4f46e5', iconAccent: '#a5b4fc' },
  { id: 'potion_slow_falling', nameVi: 'Thuốc Rơi Chậm', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'slow_falling', amplifier: 0, durationSec: 90 }, iconShape: 'potion', iconColor: '#e2e8f0', iconAccent: '#ffffff' },
  { id: 'potion_turtle_master', nameVi: 'Thuốc Bậc Thầy Rùa', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'resistance', amplifier: 2, durationSec: 25 }, iconShape: 'potion', iconColor: '#9333ea', iconAccent: '#d8b4fe' },
  { id: 'potion_invisibility', nameVi: 'Thuốc Tàng Hình', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'speed', amplifier: 0, durationSec: 180 }, iconShape: 'potion', iconColor: '#94a3b8', iconAccent: '#e2e8f0' },
  { id: 'potion_slowness', nameVi: 'Thuốc Làm Chậm', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'slowness', amplifier: 0, durationSec: 90 }, iconShape: 'potion', iconColor: '#64748b', iconAccent: '#cbd5e1' },
  { id: 'potion_weakness', nameVi: 'Thuốc Suy Yếu', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'slowness', amplifier: 0, durationSec: 90 }, iconShape: 'potion', iconColor: '#475569', iconAccent: '#94a3b8' },
  { id: 'potion_poison', nameVi: 'Thuốc Độc', maxStack: 1, category: 'decor_brew', iconShape: 'potion', iconColor: '#65a30d', iconAccent: '#bef264' },
  { id: 'potion_harming', nameVi: 'Thuốc Sát Thương', maxStack: 1, category: 'decor_brew', iconShape: 'potion', iconColor: '#7f1d1d', iconAccent: '#f87171' },
  { id: 'splash_potion_healing', nameVi: 'Thuốc Ném Hồi Máu', maxStack: 1, category: 'decor_brew', healRestore: 8, iconShape: 'potion', iconColor: '#f43f5e', iconAccent: '#ffe4e6' },
  { id: 'lingering_potion_healing', nameVi: 'Thuốc Đọng Hồi Máu', maxStack: 1, category: 'decor_brew', healRestore: 10, iconShape: 'potion', iconColor: '#ec4899', iconAccent: '#fce7f3' },

  // Additional Important Missing Minecraft 1.16.5 Items
  { id: 'filled_map', nameVi: 'Bản Đồ Đã Vẽ', maxStack: 64, category: 'tools', iconShape: 'paper', iconColor: '#d9c698', iconAccent: '#4f9e34' },
  { id: 'lead', nameVi: 'Dây Dắt (Lead)', maxStack: 64, category: 'tools', iconShape: 'string', iconColor: '#a67b4b', iconAccent: '#d4b183' },
  { id: 'carrot_on_a_stick', nameVi: 'Cần Câu Cà Rốt', maxStack: 1, category: 'tools', iconShape: 'rod', iconColor: '#8d6438', iconAccent: '#ea580c' },
  { id: 'snowball', nameVi: 'Bóng Tuyết', maxStack: 16, category: 'tools', iconShape: 'pearl', iconColor: '#f1f5f9', iconAccent: '#ffffff' },
  { id: 'experience_bottle', nameVi: 'Chai Kinh Nghiệm', maxStack: 64, category: 'decor_brew', iconShape: 'potion', iconColor: '#a3e635', iconAccent: '#fef08a' },
  { id: 'sweet_berries', nameVi: 'Quả Mọng Ngọt', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'apple', iconColor: '#b91c1c', iconAccent: '#fca5a5' },
  { id: 'rotten_flesh', nameVi: 'Thịt Thối', maxStack: 64, category: 'armor_food', foodRestore: 4, iconShape: 'food', iconColor: '#7c4a2d', iconAccent: '#4d7c2e' },
  { id: 'poisonous_potato', nameVi: 'Khoai Tây Độc', maxStack: 64, category: 'armor_food', foodRestore: 2, iconShape: 'food', iconColor: '#9ca341', iconAccent: '#65a30d' },
  { id: 'tropical_fish', nameVi: 'Cá Nhiệt Đới', maxStack: 64, category: 'armor_food', foodRestore: 1, iconShape: 'food', iconColor: '#f97316', iconAccent: '#ffffff' },
  { id: 'suspicious_stew', nameVi: 'Súp Đáng Ngờ', maxStack: 1, category: 'armor_food', foodRestore: 6, healRestore: 3, potionEffect: { id: 'regeneration', amplifier: 0, durationSec: 12 }, iconShape: 'bowl', iconColor: '#8d6438', iconAccent: '#84cc16' },
  { id: 'cod_bucket', nameVi: 'Xô Cá Tuyết', maxStack: 1, category: 'tools', iconShape: 'bucket_water', iconColor: '#c4c9d0', iconAccent: '#d6c69c' },
  { id: 'salmon_bucket', nameVi: 'Xô Cá Hồi', maxStack: 1, category: 'tools', iconShape: 'bucket_water', iconColor: '#c4c9d0', iconAccent: '#dc4c4c' },
  { id: 'pufferfish_bucket', nameVi: 'Xô Cá Nóc', maxStack: 1, category: 'tools', iconShape: 'bucket_water', iconColor: '#c4c9d0', iconAccent: '#facc15' },
  { id: 'tropical_fish_bucket', nameVi: 'Xô Cá Nhiệt Đới', maxStack: 1, category: 'tools', iconShape: 'bucket_water', iconColor: '#c4c9d0', iconAccent: '#f97316' },
  { id: 'rabbit_hide', nameVi: 'Da Thỏ', maxStack: 64, category: 'ores', iconShape: 'paper', iconColor: '#c9a678', iconAccent: '#e8cfa8' },
  { id: 'leather_horse_armor', nameVi: 'Giáp Ngựa Da', maxStack: 1, category: 'armor_food', iconShape: 'chestplate', iconColor: '#9c5a32', iconAccent: '#c98253' },
  { id: 'piglin_banner_pattern', nameVi: 'Mẫu Cờ Piglin (1.16)', maxStack: 1, category: 'nether116', iconShape: 'paper', iconColor: '#e5d4a1', iconAccent: '#eab308' },
  { id: 'written_book', nameVi: 'Sách Đã Viết', maxStack: 16, category: 'decor_brew', iconShape: 'book', iconColor: '#7c2d12', iconAccent: '#c084fc' },
  { id: 'furnace_minecart', nameVi: 'Xe Mỏ Lò Nung', maxStack: 1, category: 'redstone', iconShape: 'boat', iconColor: '#9ca3af', iconAccent: '#52525b' },
  { id: 'spruce_boat', nameVi: 'Thuyền Vân Sam', maxStack: 1, category: 'tools', iconShape: 'boat', iconColor: '#785634', iconAccent: '#4a331d' },
  { id: 'birch_boat', nameVi: 'Thuyền Bạch Dương', maxStack: 1, category: 'tools', iconShape: 'boat', iconColor: '#d9cc9e', iconAccent: '#a39368' },
  { id: 'jungle_boat', nameVi: 'Thuyền Rừng Rậm', maxStack: 1, category: 'tools', iconShape: 'boat', iconColor: '#a87b56', iconAccent: '#875f3e' },
  { id: 'acacia_boat', nameVi: 'Thuyền Gỗ Keo', maxStack: 1, category: 'tools', iconShape: 'boat', iconColor: '#b86234', iconAccent: '#944a22' },
  { id: 'dark_oak_boat', nameVi: 'Thuyền Sồi Sẫm', maxStack: 1, category: 'tools', iconShape: 'boat', iconColor: '#4a311a', iconAccent: '#362210' },
  { id: 'blue_orchid', nameVi: 'Hoa Phong Lan Xanh', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#38bdf8', iconAccent: '#22c55e' },
  { id: 'allium', nameVi: 'Hoa Hành Tím', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#d946ef', iconAccent: '#22c55e' },
  { id: 'oxeye_daisy', nameVi: 'Hoa Cúc Trắng', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#f8fafc', iconAccent: '#facc15' },
  { id: 'sunflower', nameVi: 'Hoa Hướng Dương', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#facc15', iconAccent: '#78350f' },
  { id: 'rose_bush', nameVi: 'Bụi Hoa Hồng', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#e11d48', iconAccent: '#15803d' },
  { id: 'wither_rose', nameVi: 'Hoa Hồng Wither', maxStack: 64, category: 'nether116', iconShape: 'rod', iconColor: '#27272a', iconAccent: '#52525b' },
  { id: 'lily_of_the_valley', nameVi: 'Hoa Linh Lan', maxStack: 64, category: 'decor_brew', iconShape: 'rod', iconColor: '#f8fafc', iconAccent: '#4ade80' },
  { id: 'music_disc_13', nameVi: 'Đĩa Nhạc 13', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#facc15' },
  { id: 'music_disc_blocks', nameVi: 'Đĩa Nhạc Blocks', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#fb923c' },
  { id: 'music_disc_chirp', nameVi: 'Đĩa Nhạc Chirp', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#ef4444' },
  { id: 'music_disc_stal', nameVi: 'Đĩa Nhạc Stal', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#18181b' },
  { id: 'music_disc_ward', nameVi: 'Đĩa Nhạc Ward', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#10b981' },
  { id: 'music_disc_wait', nameVi: 'Đĩa Nhạc Wait', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#60a5fa' },
  { id: 'music_disc_11', nameVi: 'Đĩa Nhạc 11', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#18181b', iconAccent: '#52525b' },
  { id: 'music_disc_far', nameVi: 'Đĩa Nhạc Far', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#84cc16' },
  { id: 'music_disc_mall', nameVi: 'Đĩa Nhạc Mall', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#a855f7' },
  { id: 'music_disc_mellohi', nameVi: 'Đĩa Nhạc Mellohi', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#f472b6' },
  { id: 'music_disc_strad', nameVi: 'Đĩa Nhạc Strad', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#f8fafc' },
  { id: 'lodestone_compass', nameVi: 'La Bàn Đá Dẫn Đường', maxStack: 1, category: 'nether116', iconShape: 'compass', iconColor: '#c084fc', iconAccent: '#ef4444' },

  // Throwable Splash Potions (100% functional 3D glass splash!)
  { id: 'splash_potion_regeneration', nameVi: 'Thuốc Ném Hồi Phục', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'regeneration', amplifier: 0, durationSec: 35 }, iconShape: 'potion', iconColor: '#f472b6', iconAccent: '#fbcfe8' },
  { id: 'splash_potion_swiftness', nameVi: 'Thuốc Ném Tốc Độ', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'speed', amplifier: 1, durationSec: 90 }, iconShape: 'potion', iconColor: '#38bdf8', iconAccent: '#bae6fd' },
  { id: 'splash_potion_strength', nameVi: 'Thuốc Ném Sức Mạnh', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'strength', amplifier: 0, durationSec: 120 }, iconShape: 'potion', iconColor: '#b91c1c', iconAccent: '#fca5a5' },
  { id: 'splash_potion_fire_resistance', nameVi: 'Thuốc Ném Kháng Lửa', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'fire_resistance', amplifier: 0, durationSec: 150 }, iconShape: 'potion', iconColor: '#f97316', iconAccent: '#fed7aa' },
  { id: 'splash_potion_night_vision', nameVi: 'Thuốc Ném Nhìn Đêm', maxStack: 1, category: 'decor_brew', potionEffect: { id: 'night_vision', amplifier: 0, durationSec: 150 }, iconShape: 'potion', iconColor: '#4f46e5', iconAccent: '#a5b4fc' },
  { id: 'splash_potion_poison', nameVi: 'Thuốc Ném Độc', maxStack: 1, category: 'decor_brew', iconShape: 'potion', iconColor: '#65a30d', iconAccent: '#bef264' },
  { id: 'splash_potion_harming', nameVi: 'Thuốc Ném Sát Thương', maxStack: 1, category: 'decor_brew', iconShape: 'potion', iconColor: '#7f1d1d', iconAccent: '#f87171' },

  // All 8 Functional Minecraft 1.16 Mob Spawn Eggs!
  { id: 'pig_spawn_egg', nameVi: 'Trứng Triệu Hồi Heo', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#f0a5a2', iconAccent: '#db635f' },
  { id: 'sheep_spawn_egg', nameVi: 'Trứng Triệu Hồi Cừu', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#e7e7e7', iconAccent: '#ffb5b5' },
  { id: 'zombie_spawn_egg', nameVi: 'Trứng Triệu Hồi Zombie', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#00afaf', iconAccent: '#799c65' },
  { id: 'creeper_spawn_egg', nameVi: 'Trứng Triệu Hồi Creeper', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#0da70b', iconAccent: '#18181b' },
  { id: 'piglin_spawn_egg', nameVi: 'Trứng Triệu Hồi Piglin', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#995f40', iconAccent: '#f9f3a4' },
  { id: 'zombified_piglin_spawn_egg', nameVi: 'Trứng Triệu Hồi Piglin Thây Ma', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#ea9393', iconAccent: '#4c7129' },
  { id: 'strider_spawn_egg', nameVi: 'Trứng Triệu Hồi Strider', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#9c3436', iconAccent: '#4d494d' },
  { id: 'ghast_spawn_egg', nameVi: 'Trứng Triệu Hồi Ghast', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#f9f9f9', iconAccent: '#bcbcbc' },
  { id: 'warden_spawn_egg', nameVi: 'Trứng Triệu Hồi Warden', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#0f4649', iconAccent: '#39d6e0' },
  { id: 'breeze_spawn_egg', nameVi: 'Trứng Triệu Hồi Breeze', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#af94df', iconAccent: '#9166df' },
  { id: 'creaking_spawn_egg', nameVi: 'Trứng Triệu Hồi Creaking', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#5f5f5f', iconAccent: '#fc7812' },
  { id: 'allay_spawn_egg', nameVi: 'Trứng Triệu Hồi Allay', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#00daff', iconAccent: '#00adff' },
  { id: 'frog_spawn_egg', nameVi: 'Trứng Triệu Hồi Ếch (Frog)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#d07444', iconAccent: '#ffc77c' },
  { id: 'bogged_spawn_egg', nameVi: 'Trứng Triệu Hồi Bogged', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#8a9c72', iconAccent: '#314d1b' },
  { id: 'happy_ghast_spawn_egg', nameVi: 'Trứng Triệu Hồi Happy Ghast', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#f8fafc', iconAccent: '#60a5fa' },
  { id: 'copper_golem_spawn_egg', nameVi: 'Trứng Triệu Hồi Copper Golem', maxStack: 64, category: 'tools', iconShape: 'pearl', iconColor: '#c46c4a', iconAccent: '#4ea88a' },
  // 17 Additional Modern & Boss Mob Spawn Eggs (Complete 33-Mob Roster!)
  { id: 'axolotl_spawn_egg', nameVi: 'Trứng Kỳ Nhông (Axolotl)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#fbcfe8', iconAccent: '#ec4899' },
  { id: 'goat_spawn_egg', nameVi: 'Trứng Dê Núi (Goat)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#e7e5e4', iconAccent: '#a8a29e' },
  { id: 'glow_squid_spawn_egg', nameVi: 'Trứng Mực Phát Sáng', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#0e7490', iconAccent: '#5eead4' },
  { id: 'tadpole_spawn_egg', nameVi: 'Trứng Nòng Nọc (Tadpole)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#5c4b37', iconAccent: '#3d3020' },
  { id: 'sniffer_spawn_egg', nameVi: 'Trứng Thú Sniffer', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#991b1b', iconAccent: '#2dd4bf' },
  { id: 'camel_spawn_egg', nameVi: 'Trứng Lạc Đà (Camel)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#e5b869', iconAccent: '#b4833e' },
  { id: 'armadillo_spawn_egg', nameVi: 'Trứng Tatu (Armadillo)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#b88470', iconAccent: '#8c5d4c' },
  { id: 'ghastling_spawn_egg', nameVi: 'Trứng Ghast Con (Ghastling)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#ffffff', iconAccent: '#93c5fd' },
  { id: 'nautilus_spawn_egg', nameVi: 'Trứng Ốc Anh Vũ (Nautilus)', maxStack: 64, category: 'tools', iconShape: 'pearl', iconColor: '#e7d7c1', iconAccent: '#ea580c' },
  { id: 'zombie_nautilus_spawn_egg', nameVi: 'Trứng Ốc Anh Vũ Thây Ma', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#4d7c2e', iconAccent: '#9a3412' },
  { id: 'camel_husk_spawn_egg', nameVi: 'Trứng Lạc Đà Xác Ướp', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#9c8a5e', iconAccent: '#57534e' },
  { id: 'parched_spawn_egg', nameVi: 'Trứng Khô Cằn (Parched)', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#d6c598', iconAccent: '#92400e' },
  { id: 'zombie_horse_spawn_egg', nameVi: 'Trứng Ngựa Thây Ma', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#3f7a2c', iconAccent: '#14532d' },
  { id: 'sulfur_cube_spawn_egg', nameVi: 'Trứng Khối Lưu Huỳnh Sống', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#facc15', iconAccent: '#ca8a04' },
  { id: 'cold_sulfur_cube_spawn_egg', nameVi: 'Trứng Khối Lưu Huỳnh Băng', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#7dd3fc', iconAccent: '#fde047' },
  { id: 'frostbite_spawn_egg', nameVi: 'Trứng Thây Ma Băng Giá', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#38bdf8', iconAccent: '#1e3a8a' },
  { id: 'ender_dragon_spawn_egg', nameVi: 'Trứng Rồng Ender (Boss)', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#18181b', iconAccent: '#c084fc' },
  { id: 'villager_spawn_egg', nameVi: 'Trứng Dân Làng (Villager)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#7c4a2d', iconAccent: '#16a34a' },
  { id: 'skeleton_spawn_egg', nameVi: 'Trứng Bộ Xương (Skeleton)', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#e5e7eb', iconAccent: '#6b7280' },
  { id: 'blaze_spawn_egg', nameVi: 'Trứng Quỷ Lửa (Blaze)', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#f59e0b', iconAccent: '#fef08a' },
  { id: 'wolf_spawn_egg', nameVi: 'Trứng Sói (Wolf)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#d6d3d1', iconAccent: '#78716c' },
  { id: 'iron_golem_spawn_egg', nameVi: 'Trứng Người Sắt (Iron Golem)', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#d6d3d1', iconAccent: '#4d7c0f' },
  { id: 'pillager_spawn_egg', nameVi: 'Trứng Kẻ Cướp (Pillager)', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#4b5563', iconAccent: '#7f1d1d' },
  { id: 'wither_spawn_egg', nameVi: 'Trứng Boss Wither', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#18181b', iconAccent: '#e0f2fe' },
  { id: 'enderman_spawn_egg', nameVi: 'Trứng Enderman', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#111113', iconAccent: '#e879f9' },
  { id: 'spider_spawn_egg', nameVi: 'Trứng Nhện (Spider)', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#27272a', iconAccent: '#ef4444' },
  { id: 'slime_spawn_egg', nameVi: 'Trứng Slime', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#84cc16', iconAccent: '#4d7c0f' },
  { id: 'wither_skeleton_spawn_egg', nameVi: 'Trứng Bộ Xương Wither', maxStack: 64, category: 'nether116', iconShape: 'pearl', iconColor: '#18181b', iconAccent: '#71717a' },
  { id: 'evoker_spawn_egg', nameVi: 'Trứng Pháp Sư Evoker', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#334155', iconAccent: '#eab308' },
  { id: 'vindicator_spawn_egg', nameVi: 'Trứng Vindicator', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#475569', iconAccent: '#cbd5e1' },
  { id: 'guardian_spawn_egg', nameVi: 'Trứng Vệ Binh Đại Dương', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#5ba39f', iconAccent: '#f97316' },
  { id: 'shulker_spawn_egg', nameVi: 'Trứng Shulker', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#9333ea', iconAccent: '#f3e8ff' },

  // =========================================================================
  // MINECRAFT 1.17 – 26.3 MODERN WEAPONS, TOOLS, ARMOR & ITEMS
  // =========================================================================
  // Tricky Trials (1.21) Iconic Weapons & Items
  { id: 'mace', nameVi: 'Chùy Chiến (Mace)', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 5, attackDamage: 9, iconShape: 'axe', iconColor: '#64748b', iconAccent: '#cbd5e1' },
  { id: 'wind_charge', nameVi: 'Cầu Gió (Wind Charge)', maxStack: 64, category: 'tools', iconShape: 'pearl', iconColor: '#e0f2fe', iconAccent: '#7dd3fc' },
  { id: 'breeze_rod', nameVi: 'Que Gió (Breeze Rod)', maxStack: 64, category: 'ores', iconShape: 'rod', iconColor: '#a78bfa', iconAccent: '#e0f2fe' },
  { id: 'trial_key', nameVi: 'Chìa Khóa Thử Thách', maxStack: 64, category: 'tools', iconShape: 'rod', iconColor: '#d97706', iconAccent: '#38bdf8' },
  { id: 'ominous_trial_key', nameVi: 'Chìa Khóa Điềm Gở', maxStack: 64, category: 'nether116', iconShape: 'rod', iconColor: '#0f766e', iconAccent: '#f97316' },
  { id: 'ominous_bottle', nameVi: 'Chai Điềm Gở (Ominous Bottle)', maxStack: 64, category: 'decor_brew', potionEffect: { id: 'strength', amplifier: 1, durationSec: 120 }, iconShape: 'potion', iconColor: '#1e293b', iconAccent: '#94a3b8' },
  { id: 'goat_horn', nameVi: 'Sừng Dê (Goat Horn)', maxStack: 1, category: 'tools', iconShape: 'rod', iconColor: '#d6cfc4', iconAccent: '#78716c' },
  { id: 'wolf_armor', nameVi: 'Giáp Sói (Wolf Armor)', maxStack: 1, category: 'armor_food', iconShape: 'chestplate', iconColor: '#b88470', iconAccent: '#e5c1b3' },
  { id: 'armadillo_scute', nameVi: 'Vảy Tatu (Armadillo Scute)', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#b88470', iconAccent: '#8c5d4c' },
  { id: 'netherite_upgrade_smithing_template', nameVi: 'Khuôn Nâng Cấp Netherite', maxStack: 64, category: 'nether116', iconShape: 'paper', iconColor: '#5c4b4e', iconAccent: '#9e8287' },
  { id: 'sniffer_egg', nameVi: 'Trứng Sniffer Cổ Đại', maxStack: 64, category: 'decor_brew', iconShape: 'pearl', iconColor: '#b84235', iconAccent: '#2dd4bf' },
  { id: 'copper_horse_armor', nameVi: 'Giáp Ngựa Đồng', maxStack: 1, category: 'armor_food', iconShape: 'chestplate', iconColor: '#c46c4a', iconAccent: '#e89572' },

  // Caves & Cliffs + Wild + Trails & Tales + Garden Awakens + Chase the Skies Utility & Ores
  { id: 'spyglass', nameVi: 'Ống Nhòm (Spyglass)', maxStack: 1, category: 'tools', iconShape: 'rod', iconColor: '#c46c4a', iconAccent: '#a855f7' },
  { id: 'brush', nameVi: 'Cọ Khảo Cổ (Brush)', maxStack: 1, category: 'tools', iconShape: 'shovel', iconColor: '#c46c4a', iconAccent: '#e5d4a1' },
  { id: 'bundle', nameVi: 'Túi Bọc Đồ (Bundle)', maxStack: 1, category: 'tools', iconShape: 'bucket', iconColor: '#9c5a32', iconAccent: '#e5b887' },
  { id: 'recovery_compass', nameVi: 'La Bàn Hồi Sinh (Deep Dark)', maxStack: 1, category: 'tools', iconShape: 'compass', iconColor: '#0f2930', iconAccent: '#2dd4bf' },
  { id: 'copper_ingot', nameVi: 'Thỏi Đồng', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_nugget', nameVi: 'Hạt Đồng', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'raw_copper', nameVi: 'Đồng Thô', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#c46c4a', iconAccent: '#4ea88a' },
  { id: 'raw_iron', nameVi: 'Sắt Thô', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#d8af93', iconAccent: '#a88369' },
  { id: 'raw_gold', nameVi: 'Vàng Thô', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#facc15', iconAccent: '#ca8a04' },
  { id: 'amethyst_shard', nameVi: 'Mảnh Thạch Anh Tím', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#a855f7', iconAccent: '#e9d5ff' },
  { id: 'echo_shard', nameVi: 'Mảnh Vang Vọng (Echo Shard)', maxStack: 64, category: 'nether116', iconShape: 'gem', iconColor: '#0e7490', iconAccent: '#2dd4bf' },
  { id: 'resin_clump', nameVi: 'Cục Nhựa Cây', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#ea580c', iconAccent: '#fdba74' },
  { id: 'resin_brick', nameVi: 'Viên Gạch Nhựa', maxStack: 64, category: 'ores', iconShape: 'ingot', iconColor: '#d9641c', iconAccent: '#fb923c' },
  { id: 'blue_harness', nameVi: 'Yên Cưỡi Ghast Xanh', maxStack: 1, category: 'tools', iconShape: 'chestplate', iconColor: '#2563eb', iconAccent: '#93c5fd' },
  { id: 'red_harness', nameVi: 'Yên Cưỡi Ghast Đỏ', maxStack: 1, category: 'tools', iconShape: 'chestplate', iconColor: '#dc2626', iconAccent: '#fca5a5' },

  // The Copper Age (1.21.10) — Complete Copper Tools & Armor!
  { id: 'copper_sword', nameVi: 'Kiếm Đồng', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 2, attackDamage: 6, iconShape: 'sword', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_pickaxe', nameVi: 'Cúp Đồng', maxStack: 1, category: 'tools', toolKind: 'pickaxe', toolTier: 2, miningSpeed: 5.2, attackDamage: 4, iconShape: 'pickaxe', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_axe', nameVi: 'Rìu Đồng', maxStack: 1, category: 'tools', toolKind: 'axe', toolTier: 2, miningSpeed: 5.2, attackDamage: 7, iconShape: 'axe', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_shovel', nameVi: 'Xẻng Đồng', maxStack: 1, category: 'tools', toolKind: 'shovel', toolTier: 2, miningSpeed: 5.2, attackDamage: 3, iconShape: 'shovel', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_hoe', nameVi: 'Cuốc Đồng', maxStack: 1, category: 'tools', toolKind: 'hoe', toolTier: 2, miningSpeed: 5.2, attackDamage: 2, iconShape: 'hoe', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_helmet', nameVi: 'Mũ Đồng', maxStack: 1, category: 'armor_food', armorSlot: 0, armorDefense: 2, iconShape: 'helmet', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_chestplate', nameVi: 'Áo Giáp Đồng', maxStack: 1, category: 'armor_food', armorSlot: 1, armorDefense: 5, iconShape: 'chestplate', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_leggings', nameVi: 'Quần Giáp Đồng', maxStack: 1, category: 'armor_food', armorSlot: 2, armorDefense: 4, iconShape: 'leggings', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'copper_boots', nameVi: 'Ủng Đồng', maxStack: 1, category: 'armor_food', armorSlot: 3, armorDefense: 1, iconShape: 'boots', iconColor: '#c46c4a', iconAccent: '#e89572' },

  // Mounts of Mayhem (1.21.11 / 26.3) — All 7 Spear Tiers (Extended Reach & Lunge!)
  { id: 'wooden_spear', nameVi: 'Giáo Gỗ', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 1, attackDamage: 5, iconShape: 'sword', iconColor: '#a67b4b', iconAccent: '#785634' },
  { id: 'stone_spear', nameVi: 'Giáo Đá', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 1, attackDamage: 6, iconShape: 'sword', iconColor: '#9ca3af', iconAccent: '#6b7280' },
  { id: 'copper_spear', nameVi: 'Giáo Đồng', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 2, attackDamage: 7, iconShape: 'sword', iconColor: '#c46c4a', iconAccent: '#e89572' },
  { id: 'iron_spear', nameVi: 'Giáo Sắt', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 2, attackDamage: 7.5, iconShape: 'sword', iconColor: '#d4d4d8', iconAccent: '#f4f4f5' },
  { id: 'golden_spear', nameVi: 'Giáo Vàng', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 2, attackDamage: 6.5, iconShape: 'sword', iconColor: '#facc15', iconAccent: '#fef08a' },
  { id: 'diamond_spear', nameVi: 'Giáo Kim Cương', maxStack: 1, category: 'tools', toolKind: 'sword', toolTier: 3, attackDamage: 9, iconShape: 'sword', iconColor: '#38bdf8', iconAccent: '#bae6fd' },
  { id: 'netherite_spear', nameVi: 'Giáo Netherite', maxStack: 1, category: 'nether116', toolKind: 'sword', toolTier: 4, attackDamage: 10.5, iconShape: 'sword', iconColor: '#4a4146', iconAccent: '#7c6f76' },

  // Modern 1.18–26.4 Music Discs, Pottery Sherds, Armor Trims, Harnesses, Chest Boat, Chaos Cubed Gems!
  { id: 'oak_chest_boat', nameVi: 'Thuyền Có Rương (Chest Boat)', maxStack: 1, category: 'tools', iconShape: 'boat', iconColor: '#a2824e', iconAccent: '#eab308' },
  { id: 'white_harness', nameVi: 'Yên Cưỡi Ghast Trắng', maxStack: 1, category: 'tools', iconShape: 'chestplate', iconColor: '#f8fafc', iconAccent: '#cbd5e1' },
  { id: 'yellow_harness', nameVi: 'Yên Cưỡi Ghast Vàng', maxStack: 1, category: 'tools', iconShape: 'chestplate', iconColor: '#facc15', iconAccent: '#fef08a' },
  { id: 'purple_harness', nameVi: 'Yên Cưỡi Ghast Tím', maxStack: 1, category: 'tools', iconShape: 'chestplate', iconColor: '#9333ea', iconAccent: '#d8b4fe' },
  // Pottery Sherds (1.20 Trails & Tales)
  { id: 'angler_pottery_sherd', nameVi: 'Mảnh Gốm Cần Thủ', maxStack: 64, category: 'decor_brew', iconShape: 'paper', iconColor: '#9e533c', iconAccent: '#e5b899' },
  { id: 'archer_pottery_sherd', nameVi: 'Mảnh Gốm Cung Thủ', maxStack: 64, category: 'decor_brew', iconShape: 'paper', iconColor: '#9e533c', iconAccent: '#e5b899' },
  { id: 'blade_pottery_sherd', nameVi: 'Mảnh Gốm Thanh Kiếm', maxStack: 64, category: 'decor_brew', iconShape: 'paper', iconColor: '#9e533c', iconAccent: '#e5b899' },
  { id: 'heart_pottery_sherd', nameVi: 'Mảnh Gốm Trái Tim', maxStack: 64, category: 'decor_brew', iconShape: 'paper', iconColor: '#9e533c', iconAccent: '#f43f5e' },
  { id: 'skull_pottery_sherd', nameVi: 'Mảnh Gốm Đầu Lâu', maxStack: 64, category: 'decor_brew', iconShape: 'paper', iconColor: '#9e533c', iconAccent: '#e5e7eb' },
  // Armor Trim Smithing Templates (1.20–1.21)
  { id: 'sentry_armor_trim_smithing_template', nameVi: 'Khuôn Viền Giáp Sentry', maxStack: 64, category: 'armor_food', iconShape: 'paper', iconColor: '#64748b', iconAccent: '#38bdf8' },
  { id: 'silence_armor_trim_smithing_template', nameVi: 'Khuôn Viền Giáp Silence (Ancient City)', maxStack: 64, category: 'nether116', iconShape: 'paper', iconColor: '#0f2930', iconAccent: '#2dd4bf' },
  { id: 'bolt_armor_trim_smithing_template', nameVi: 'Khuôn Viền Giáp Bolt (Trial)', maxStack: 64, category: 'tools', iconShape: 'paper', iconColor: '#c46c4a', iconAccent: '#facc15' },
  { id: 'flow_armor_trim_smithing_template', nameVi: 'Khuôn Viền Giáp Flow (Trial)', maxStack: 64, category: 'tools', iconShape: 'paper', iconColor: '#3b82f6', iconAccent: '#e0f2fe' },
  // 2026 Chaos Cubed Materials
  { id: 'sulfur_dust', nameVi: 'Bột Lưu Huỳnh (Chaos Cubed)', maxStack: 64, category: 'ores', iconShape: 'dust', iconColor: '#facc15', iconAccent: '#fef08a' },
  { id: 'cinnabar_gem', nameVi: 'Ngọc Chu Sa (Cinnabar)', maxStack: 64, category: 'ores', iconShape: 'gem', iconColor: '#ef4444', iconAccent: '#fecaca' },
  // Music Discs (1.18–26.4)
  { id: 'music_disc_otherside', nameVi: 'Đĩa Nhạc Otherside', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#27272a', iconAccent: '#38bdf8' },
  { id: 'music_disc_5', nameVi: 'Đĩa Nhạc 5 (Deep Dark)', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#0f2930', iconAccent: '#2dd4bf' },
  { id: 'music_disc_relic', nameVi: 'Đĩa Nhạc Relic', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#78350f', iconAccent: '#4ade80' },
  { id: 'music_disc_creator', nameVi: 'Đĩa Nhạc Creator (1.21)', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#c46c4a', iconAccent: '#2dd4bf' },
  { id: 'music_disc_precipice', nameVi: 'Đĩa Nhạc Precipice (1.21)', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#1e293b', iconAccent: '#fb923c' },
  { id: 'music_disc_flurry', nameVi: 'Đĩa Nhạc Flurry (26.4 Winter)', maxStack: 1, category: 'decor_brew', iconShape: 'disc', iconColor: '#1e3a8a', iconAccent: '#7dd3fc' },
];

// =========================================================================
// 6. COMPLETE MINECRAFT 1.16 CRAFTING & BREWING RECIPES (Sections A–L)
// =========================================================================
export const EXT_CRAFTING_RECIPES: CraftingRecipe[] = [
  // Planks for additional wood types
  { id: 'jungle_planks', nameVi: 'Ván Rừng Rậm', shapeless: ['jungle_log'], output: { itemId: 'jungle_planks', count: 4 } },
  { id: 'acacia_planks', nameVi: 'Ván Gỗ Keo', shapeless: ['acacia_log'], output: { itemId: 'acacia_planks', count: 4 } },
  { id: 'dark_oak_planks', nameVi: 'Ván Sồi Sẫm', shapeless: ['dark_oak_log'], output: { itemId: 'dark_oak_planks', count: 4 } },
  { id: 'bowl', nameVi: 'Cái Bát', pattern: [['oak_planks', null, 'oak_planks'], [null, 'oak_planks', null]], output: { itemId: 'bowl', count: 4 } },

  // Section A — All Workstations
  { id: 'blast_furnace', nameVi: 'Lò Cao', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'furnace', 'iron_ingot'], ['smooth_stone', 'smooth_stone', 'smooth_stone']], output: { itemId: 'blast_furnace', count: 1 } },
  { id: 'smoker', nameVi: 'Lò Hun Khói', pattern: [[null, 'oak_log', null], ['oak_log', 'furnace', 'oak_log'], [null, 'oak_log', null]], output: { itemId: 'smoker', count: 1 } },
  { id: 'grindstone', nameVi: 'Bàn Mài', pattern: [['stick', 'stone_slab', 'stick'], ['oak_planks', null, 'oak_planks']], output: { itemId: 'grindstone', count: 1 } },
  { id: 'fletching_table', nameVi: 'Bàn Cung Tên', pattern: [['flint', 'flint'], ['oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks']], output: { itemId: 'fletching_table', count: 1 } },
  { id: 'cartography_table', nameVi: 'Bàn Bản Đồ', pattern: [['paper', 'paper'], ['oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks']], output: { itemId: 'cartography_table', count: 1 } },
  { id: 'loom', nameVi: 'Bàn Dệt', pattern: [['string', 'string'], ['oak_planks', 'oak_planks']], output: { itemId: 'loom', count: 1 } },
  { id: 'stonecutter', nameVi: 'Bàn Cắt Đá', pattern: [[null, 'iron_ingot', null], ['stone', 'stone', 'stone']], output: { itemId: 'stonecutter', count: 1 } },
  { id: 'barrel', nameVi: 'Thùng Gỗ', pattern: [['oak_planks', 'oak_slab', 'oak_planks'], ['oak_planks', null, 'oak_planks'], ['oak_planks', 'oak_slab', 'oak_planks']], output: { itemId: 'barrel', count: 1 } },
  { id: 'brewing_stand', nameVi: 'Giá Ủ Thuốc', pattern: [[null, 'blaze_rod', null], ['cobblestone', 'cobblestone', 'cobblestone']], output: { itemId: 'brewing_stand', count: 1 } },
  { id: 'cauldron', nameVi: 'Cái Vạc', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], output: { itemId: 'cauldron', count: 1 } },
  { id: 'composter', nameVi: 'Thùng Ủ Phân', pattern: [['oak_slab', null, 'oak_slab'], ['oak_slab', null, 'oak_slab'], ['oak_slab', 'oak_slab', 'oak_slab']], output: { itemId: 'composter', count: 1 } },
  { id: 'beehive', nameVi: 'Tổ Ong', pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['honeycomb', 'honeycomb', 'honeycomb'], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'beehive', count: 1 } },
  { id: 'lectern', nameVi: 'Bàn Đọc Sách', pattern: [['oak_slab', 'oak_slab', 'oak_slab'], [null, 'bookshelf', null], [null, 'oak_slab', null]], output: { itemId: 'lectern', count: 1 } },
  { id: 'ender_chest', nameVi: 'Rương Ender', pattern: [['obsidian', 'obsidian', 'obsidian'], ['obsidian', 'eye_of_ender', 'obsidian'], ['obsidian', 'obsidian', 'obsidian']], output: { itemId: 'ender_chest', count: 1 } },
  { id: 'shulker_box', nameVi: 'Hòm Shulker', pattern: [['shulker_shell'], ['chest'], ['shulker_shell']], output: { itemId: 'shulker_box', count: 1 } },
  { id: 'beacon', nameVi: 'Đèn Hiệu (Beacon)', pattern: [['glass', 'glass', 'glass'], ['glass', 'nether_star', 'glass'], ['obsidian', 'obsidian', 'obsidian']], output: { itemId: 'beacon', count: 1 } },
  { id: 'lodestone', nameVi: 'Đá Nam Châm', pattern: [['chiseled_stone_bricks', 'chiseled_stone_bricks', 'chiseled_stone_bricks'], ['chiseled_stone_bricks', 'netherite_ingot', 'chiseled_stone_bricks'], ['chiseled_stone_bricks', 'chiseled_stone_bricks', 'chiseled_stone_bricks']], output: { itemId: 'lodestone', count: 1 } },
  { id: 'note_block', nameVi: 'Đá Phát Nhạc', pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['oak_planks', 'redstone', 'oak_planks'], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'note_block', count: 1 } },
  { id: 'jukebox', nameVi: 'Máy Phát Nhạc', pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['oak_planks', 'diamond', 'oak_planks'], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'jukebox', count: 1 } },
  { id: 'scaffolding', nameVi: 'Giàn Giáo', pattern: [['bamboo', 'string', 'bamboo'], ['bamboo', null, 'bamboo'], ['bamboo', null, 'bamboo']], output: { itemId: 'scaffolding', count: 6 } },
  { id: 'soul_campfire', nameVi: 'Lửa Trại Linh Hồn', pattern: [[null, 'stick', null], ['stick', 'soul_soil', 'stick'], ['oak_log', 'oak_log', 'oak_log']], output: { itemId: 'soul_campfire', count: 1 } },
  { id: 'chain', nameVi: 'Xích Sắt', pattern: [['iron_nugget'], ['iron_ingot'], ['iron_nugget']], output: { itemId: 'chain', count: 1 } },
  { id: 'end_rod', nameVi: 'Thanh End', pattern: [['blaze_rod'], ['popped_chorus_fruit']], output: { itemId: 'end_rod', count: 4 } },

  // Section A & F — Blocks, Stones, Nuggets, Bricks
  { id: 'iron_nuggets', nameVi: '9 Hạt Sắt', shapeless: ['iron_ingot'], output: { itemId: 'iron_nugget', count: 9 } },
  { id: 'iron_from_nuggets', nameVi: 'Thỏi Sắt (Hạt)', pattern: [['iron_nugget', 'iron_nugget', 'iron_nugget'], ['iron_nugget', 'iron_nugget', 'iron_nugget'], ['iron_nugget', 'iron_nugget', 'iron_nugget']], output: { itemId: 'iron_ingot', count: 1 } },
  { id: 'gold_nuggets', nameVi: '9 Hạt Vàng', shapeless: ['gold_ingot'], output: { itemId: 'gold_nugget', count: 9 } },
  { id: 'gold_from_nuggets', nameVi: 'Thỏi Vàng (Hạt)', pattern: [['gold_nugget', 'gold_nugget', 'gold_nugget'], ['gold_nugget', 'gold_nugget', 'gold_nugget'], ['gold_nugget', 'gold_nugget', 'gold_nugget']], output: { itemId: 'gold_ingot', count: 1 } },
  { id: 'bone_meal_from_bone', nameVi: 'Bột Xương', shapeless: ['bone'], output: { itemId: 'bone_meal', count: 3 } },
  { id: 'bone_block', nameVi: 'Khối Xương', pattern: [['bone_meal', 'bone_meal', 'bone_meal'], ['bone_meal', 'bone_meal', 'bone_meal'], ['bone_meal', 'bone_meal', 'bone_meal']], output: { itemId: 'bone_block', count: 1 } },
  { id: 'slime_block', nameVi: 'Khối Slime', pattern: [['slime_ball', 'slime_ball', 'slime_ball'], ['slime_ball', 'slime_ball', 'slime_ball'], ['slime_ball', 'slime_ball', 'slime_ball']], output: { itemId: 'slime_block', count: 1 } },
  { id: 'honey_block', nameVi: 'Khối Mật Ong', pattern: [['honey_bottle', 'honey_bottle'], ['honey_bottle', 'honey_bottle']], output: { itemId: 'honey_block', count: 1 } },
  { id: 'honeycomb_block', nameVi: 'Khối Tổ Ong', pattern: [['honeycomb', 'honeycomb'], ['honeycomb', 'honeycomb']], output: { itemId: 'honeycomb_block', count: 1 } },
  { id: 'magma_block', nameVi: 'Khối Magma', pattern: [['magma_cream', 'magma_cream'], ['magma_cream', 'magma_cream']], output: { itemId: 'magma_block', count: 1 } },
  { id: 'clay_block', nameVi: 'Khối Đất Sét', pattern: [['clay_ball', 'clay_ball'], ['clay_ball', 'clay_ball']], output: { itemId: 'clay', count: 1 } },
  { id: 'dried_kelp_block', nameVi: 'Khối Tảo Khô', pattern: [['dried_kelp', 'dried_kelp', 'dried_kelp'], ['dried_kelp', 'dried_kelp', 'dried_kelp'], ['dried_kelp', 'dried_kelp', 'dried_kelp']], output: { itemId: 'dried_kelp_block', count: 1 } },
  { id: 'mossy_cobblestone', nameVi: 'Đá Cuội Rêu', shapeless: ['cobblestone', 'vine'], output: { itemId: 'mossy_cobblestone', count: 1 } },
  { id: 'mossy_stone_bricks', nameVi: 'Gạch Đá Rêu', shapeless: ['stone_bricks', 'vine'], output: { itemId: 'mossy_stone_bricks', count: 1 } },
  { id: 'chiseled_stone_bricks', nameVi: 'Gạch Đá Đục', pattern: [['stone_brick_slab'], ['stone_brick_slab']], output: { itemId: 'chiseled_stone_bricks', count: 1 } },
  { id: 'diorite', nameVi: 'Đá Diorite', pattern: [['cobblestone', 'quartz'], ['quartz', 'cobblestone']], output: { itemId: 'diorite', count: 2 } },
  { id: 'andesite', nameVi: 'Đá Andesite', shapeless: ['diorite', 'cobblestone'], output: { itemId: 'andesite', count: 2 } },
  { id: 'granite', nameVi: 'Đá Granite', shapeless: ['diorite', 'quartz'], output: { itemId: 'granite', count: 1 } },
  { id: 'polished_blackstone_bricks', nameVi: 'Gạch Đá Đen Bóng', pattern: [['polished_blackstone', 'polished_blackstone'], ['polished_blackstone', 'polished_blackstone']], output: { itemId: 'polished_blackstone_bricks', count: 4 } },
  { id: 'chiseled_polished_blackstone', nameVi: 'Đá Đen Đục', pattern: [['polished_blackstone_slab'], ['polished_blackstone_slab']], output: { itemId: 'chiseled_polished_blackstone', count: 1 } },
  { id: 'polished_basalt', nameVi: 'Bazan Mài Bóng', pattern: [['basalt', 'basalt'], ['basalt', 'basalt']], output: { itemId: 'polished_basalt', count: 4 } },
  { id: 'red_nether_bricks', nameVi: 'Gạch Nether Đỏ', pattern: [['nether_wart', 'nether_brick'], ['nether_brick', 'nether_wart']], output: { itemId: 'red_nether_bricks', count: 1 } },
  { id: 'chiseled_nether_bricks', nameVi: 'Gạch Nether Đục', pattern: [['nether_brick_slab'], ['nether_brick_slab']], output: { itemId: 'chiseled_nether_bricks', count: 1 } },
  { id: 'quartz_bricks', nameVi: 'Gạch Thạch Anh', pattern: [['quartz_block', 'quartz_block'], ['quartz_block', 'quartz_block']], output: { itemId: 'quartz_bricks', count: 4 } },
  { id: 'quartz_pillar', nameVi: 'Trụ Thạch Anh', pattern: [['quartz_block'], ['quartz_block']], output: { itemId: 'quartz_pillar', count: 2 } },
  { id: 'chiseled_quartz_block', nameVi: 'Thạch Anh Đục', pattern: [['quartz_slab'], ['quartz_slab']], output: { itemId: 'chiseled_quartz_block', count: 1 } },
  { id: 'sandstone', nameVi: 'Đá Cát', pattern: [['sand', 'sand'], ['sand', 'sand']], output: { itemId: 'sandstone', count: 1 } },
  { id: 'red_sandstone', nameVi: 'Đá Cát Đỏ', pattern: [['red_sand', 'red_sand'], ['red_sand', 'red_sand']], output: { itemId: 'red_sandstone', count: 1 } },
  { id: 'cut_sandstone', nameVi: 'Đá Cát Cắt', pattern: [['sandstone', 'sandstone'], ['sandstone', 'sandstone']], output: { itemId: 'cut_sandstone', count: 4 } },
  { id: 'chiseled_sandstone', nameVi: 'Đá Cát Đục', pattern: [['sandstone_slab'], ['sandstone_slab']], output: { itemId: 'chiseled_sandstone', count: 1 } },
  { id: 'prismarine', nameVi: 'Đá Prismarine', pattern: [['prismarine_shard', 'prismarine_shard'], ['prismarine_shard', 'prismarine_shard']], output: { itemId: 'prismarine', count: 1 } },
  { id: 'prismarine_bricks', nameVi: 'Gạch Prismarine', pattern: [['prismarine_shard', 'prismarine_shard', 'prismarine_shard'], ['prismarine_shard', 'prismarine_shard', 'prismarine_shard'], ['prismarine_shard', 'prismarine_shard', 'prismarine_shard']], output: { itemId: 'prismarine_bricks', count: 1 } },
  { id: 'dark_prismarine', nameVi: 'Prismarine Sẫm', pattern: [['prismarine_shard', 'prismarine_shard', 'prismarine_shard'], ['prismarine_shard', 'black_dye', 'prismarine_shard'], ['prismarine_shard', 'prismarine_shard', 'prismarine_shard']], output: { itemId: 'dark_prismarine', count: 1 } },
  { id: 'end_stone_bricks', nameVi: 'Gạch Đá End', pattern: [['end_stone', 'end_stone'], ['end_stone', 'end_stone']], output: { itemId: 'end_stone_bricks', count: 4 } },
  { id: 'purpur_block', nameVi: 'Khối Purpur', pattern: [['popped_chorus_fruit', 'popped_chorus_fruit'], ['popped_chorus_fruit', 'popped_chorus_fruit']], output: { itemId: 'purpur_block', count: 4 } },
  { id: 'purpur_pillar', nameVi: 'Trụ Purpur', pattern: [['purpur_slab'], ['purpur_slab']], output: { itemId: 'purpur_pillar', count: 1 } },
  { id: 'flower_pot', nameVi: 'Chậu Hoa', pattern: [['brick', null, 'brick'], [null, 'brick', null]], output: { itemId: 'flower_pot', count: 1 } },
  { id: 'glass_pane', nameVi: 'Tấm Kính', pattern: [['glass', 'glass', 'glass'], ['glass', 'glass', 'glass']], output: { itemId: 'glass_pane', count: 16 } },

  // Slabs, Stairs, Walls, Doors, Trapdoors, Buttons, Pressure Plates
  { id: 'oak_slab', nameVi: 'Phiến Gỗ Sồi', pattern: [['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'oak_slab', count: 6 } },
  { id: 'crimson_slab', nameVi: 'Phiến Nấm Đỏ', pattern: [['crimson_planks', 'crimson_planks', 'crimson_planks']], output: { itemId: 'crimson_slab', count: 6 } },
  { id: 'warped_slab', nameVi: 'Phiến Nấm Xanh', pattern: [['warped_planks', 'warped_planks', 'warped_planks']], output: { itemId: 'warped_slab', count: 6 } },
  { id: 'stone_slab', nameVi: 'Phiến Đá', pattern: [['stone', 'stone', 'stone']], output: { itemId: 'stone_slab', count: 6 } },
  { id: 'smooth_stone_slab', nameVi: 'Phiến Đá Mịn', pattern: [['smooth_stone', 'smooth_stone', 'smooth_stone']], output: { itemId: 'smooth_stone_slab', count: 6 } },
  { id: 'stone_brick_slab', nameVi: 'Phiến Gạch Đá', pattern: [['stone_bricks', 'stone_bricks', 'stone_bricks']], output: { itemId: 'stone_brick_slab', count: 6 } },
  { id: 'nether_brick_slab', nameVi: 'Phiến Gạch Nether', pattern: [['nether_bricks', 'nether_bricks', 'nether_bricks']], output: { itemId: 'nether_brick_slab', count: 6 } },
  { id: 'quartz_slab', nameVi: 'Phiến Thạch Anh', pattern: [['quartz_block', 'quartz_block', 'quartz_block']], output: { itemId: 'quartz_slab', count: 6 } },
  { id: 'polished_blackstone_slab', nameVi: 'Phiến Đá Đen', pattern: [['polished_blackstone', 'polished_blackstone', 'polished_blackstone']], output: { itemId: 'polished_blackstone_slab', count: 6 } },
  { id: 'purpur_slab', nameVi: 'Phiến Purpur', pattern: [['purpur_block', 'purpur_block', 'purpur_block']], output: { itemId: 'purpur_slab', count: 6 } },
  { id: 'sandstone_slab', nameVi: 'Phiến Đá Cát', pattern: [['sandstone', 'sandstone', 'sandstone']], output: { itemId: 'sandstone_slab', count: 6 } },

  { id: 'oak_stairs', nameVi: 'Cầu Thang Gỗ', pattern: [['oak_planks', null, null], ['oak_planks', 'oak_planks', null], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'oak_stairs', count: 4 } },
  { id: 'crimson_stairs', nameVi: 'Cầu Thang Nấm Đỏ', pattern: [['crimson_planks', null, null], ['crimson_planks', 'crimson_planks', null], ['crimson_planks', 'crimson_planks', 'crimson_planks']], output: { itemId: 'crimson_stairs', count: 4 } },
  { id: 'warped_stairs', nameVi: 'Cầu Thang Nấm Xanh', pattern: [['warped_planks', null, null], ['warped_planks', 'warped_planks', null], ['warped_planks', 'warped_planks', 'warped_planks']], output: { itemId: 'warped_stairs', count: 4 } },
  { id: 'cobblestone_stairs', nameVi: 'Cầu Thang Đá Cuội', pattern: [['cobblestone', null, null], ['cobblestone', 'cobblestone', null], ['cobblestone', 'cobblestone', 'cobblestone']], output: { itemId: 'cobblestone_stairs', count: 4 } },
  { id: 'stone_brick_stairs', nameVi: 'Cầu Thang Gạch Đá', pattern: [['stone_bricks', null, null], ['stone_bricks', 'stone_bricks', null], ['stone_bricks', 'stone_bricks', 'stone_bricks']], output: { itemId: 'stone_brick_stairs', count: 4 } },
  { id: 'nether_brick_stairs', nameVi: 'Cầu Thang Nether', pattern: [['nether_bricks', null, null], ['nether_bricks', 'nether_bricks', null], ['nether_bricks', 'nether_bricks', 'nether_bricks']], output: { itemId: 'nether_brick_stairs', count: 4 } },
  { id: 'quartz_stairs', nameVi: 'Cầu Thang Thạch Anh', pattern: [['quartz_block', null, null], ['quartz_block', 'quartz_block', null], ['quartz_block', 'quartz_block', 'quartz_block']], output: { itemId: 'quartz_stairs', count: 4 } },
  { id: 'polished_blackstone_stairs', nameVi: 'Cầu Thang Đá Đen', pattern: [['polished_blackstone', null, null], ['polished_blackstone', 'polished_blackstone', null], ['polished_blackstone', 'polished_blackstone', 'polished_blackstone']], output: { itemId: 'polished_blackstone_stairs', count: 4 } },
  { id: 'purpur_stairs', nameVi: 'Cầu Thang Purpur', pattern: [['purpur_block', null, null], ['purpur_block', 'purpur_block', null], ['purpur_block', 'purpur_block', 'purpur_block']], output: { itemId: 'purpur_stairs', count: 4 } },

  { id: 'cobblestone_wall', nameVi: 'Tường Đá Cuội', pattern: [['cobblestone', 'cobblestone', 'cobblestone'], ['cobblestone', 'cobblestone', 'cobblestone']], output: { itemId: 'cobblestone_wall', count: 6 } },
  { id: 'polished_blackstone_wall', nameVi: 'Tường Đá Đen', pattern: [['polished_blackstone', 'polished_blackstone', 'polished_blackstone'], ['polished_blackstone', 'polished_blackstone', 'polished_blackstone']], output: { itemId: 'polished_blackstone_wall', count: 6 } },
  { id: 'nether_brick_fence', nameVi: 'Rào Gạch Nether', pattern: [['nether_bricks', 'nether_brick', 'nether_bricks'], ['nether_bricks', 'nether_brick', 'nether_bricks']], output: { itemId: 'nether_brick_fence', count: 6 } },
  { id: 'crimson_fence', nameVi: 'Rào Nấm Đỏ', pattern: [['crimson_planks', 'stick', 'crimson_planks'], ['crimson_planks', 'stick', 'crimson_planks']], output: { itemId: 'crimson_fence', count: 3 } },
  { id: 'warped_fence', nameVi: 'Rào Nấm Xanh', pattern: [['warped_planks', 'stick', 'warped_planks'], ['warped_planks', 'stick', 'warped_planks']], output: { itemId: 'warped_fence', count: 3 } },
  { id: 'oak_fence_gate', nameVi: 'Cổng Rào Gỗ', pattern: [['stick', 'oak_planks', 'stick'], ['stick', 'oak_planks', 'stick']], output: { itemId: 'oak_fence_gate', count: 1 } },
  { id: 'crimson_fence_gate', nameVi: 'Cổng Rào Nấm Đỏ', pattern: [['stick', 'crimson_planks', 'stick'], ['stick', 'crimson_planks', 'stick']], output: { itemId: 'crimson_fence_gate', count: 1 } },
  { id: 'warped_fence_gate', nameVi: 'Cổng Rào Nấm Xanh', pattern: [['stick', 'warped_planks', 'stick'], ['stick', 'warped_planks', 'stick']], output: { itemId: 'warped_fence_gate', count: 1 } },

  { id: 'oak_door', nameVi: 'Cửa Gỗ Sồi', pattern: [['oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks']], output: { itemId: 'oak_door', count: 3 } },
  { id: 'crimson_door', nameVi: 'Cửa Nấm Đỏ', pattern: [['crimson_planks', 'crimson_planks'], ['crimson_planks', 'crimson_planks'], ['crimson_planks', 'crimson_planks']], output: { itemId: 'crimson_door', count: 3 } },
  { id: 'warped_door', nameVi: 'Cửa Nấm Xanh', pattern: [['warped_planks', 'warped_planks'], ['warped_planks', 'warped_planks'], ['warped_planks', 'warped_planks']], output: { itemId: 'warped_door', count: 3 } },
  { id: 'iron_door', nameVi: 'Cửa Sắt', pattern: [['iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot']], output: { itemId: 'iron_door', count: 3 } },
  { id: 'oak_trapdoor', nameVi: 'Cửa Sập Gỗ', pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'oak_trapdoor', count: 2 } },
  { id: 'crimson_trapdoor', nameVi: 'Cửa Sập Nấm Đỏ', pattern: [['crimson_planks', 'crimson_planks', 'crimson_planks'], ['crimson_planks', 'crimson_planks', 'crimson_planks']], output: { itemId: 'crimson_trapdoor', count: 2 } },
  { id: 'warped_trapdoor', nameVi: 'Cửa Sập Nấm Xanh', pattern: [['warped_planks', 'warped_planks', 'warped_planks'], ['warped_planks', 'warped_planks', 'warped_planks']], output: { itemId: 'warped_trapdoor', count: 2 } },
  { id: 'iron_trapdoor', nameVi: 'Cửa Sập Sắt', pattern: [['iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot']], output: { itemId: 'iron_trapdoor', count: 1 } },

  { id: 'oak_pressure_plate', nameVi: 'Tấm Áp Lực Gỗ', pattern: [['oak_planks', 'oak_planks']], output: { itemId: 'oak_pressure_plate', count: 1 } },
  { id: 'stone_pressure_plate', nameVi: 'Tấm Áp Lực Đá', pattern: [['stone', 'stone']], output: { itemId: 'stone_pressure_plate', count: 1 } },
  { id: 'heavy_weighted_pressure_plate', nameVi: 'Tấm Áp Lực Sắt', pattern: [['iron_ingot', 'iron_ingot']], output: { itemId: 'heavy_weighted_pressure_plate', count: 1 } },
  { id: 'light_weighted_pressure_plate', nameVi: 'Tấm Áp Lực Vàng', pattern: [['gold_ingot', 'gold_ingot']], output: { itemId: 'light_weighted_pressure_plate', count: 1 } },
  { id: 'polished_blackstone_pressure_plate', nameVi: 'Tấm Áp Lực Đá Đen', pattern: [['polished_blackstone', 'polished_blackstone']], output: { itemId: 'polished_blackstone_pressure_plate', count: 1 } },
  { id: 'crimson_pressure_plate', nameVi: 'Tấm Áp Lực Nấm Đỏ', pattern: [['crimson_planks', 'crimson_planks']], output: { itemId: 'crimson_pressure_plate', count: 1 } },
  { id: 'warped_pressure_plate', nameVi: 'Tấm Áp Lực Nấm Xanh', pattern: [['warped_planks', 'warped_planks']], output: { itemId: 'warped_pressure_plate', count: 1 } },

  { id: 'oak_button', nameVi: 'Nút Gỗ', shapeless: ['oak_planks'], output: { itemId: 'oak_button', count: 1 } },
  { id: 'stone_button', nameVi: 'Nút Đá', shapeless: ['stone'], output: { itemId: 'stone_button', count: 1 } },
  { id: 'polished_blackstone_button', nameVi: 'Nút Đá Đen', shapeless: ['polished_blackstone'], output: { itemId: 'polished_blackstone_button', count: 1 } },
  { id: 'crimson_button', nameVi: 'Nút Nấm Đỏ', shapeless: ['crimson_planks'], output: { itemId: 'crimson_button', count: 1 } },
  { id: 'warped_button', nameVi: 'Nút Nấm Xanh', shapeless: ['warped_planks'], output: { itemId: 'warped_button', count: 1 } },

  // Section B — More Tools, Crossbow, Compass, Clock, Turtle Shell, Armor Stand
  { id: 'golden_hoe', nameVi: 'Cuốc Đất Vàng', pattern: [['gold_ingot', 'gold_ingot'], [null, 'stick'], [null, 'stick']], output: { itemId: 'golden_hoe', count: 1 } },
  { id: 'compass', nameVi: 'La Bàn', pattern: [[null, 'iron_ingot', null], ['iron_ingot', 'redstone', 'iron_ingot'], [null, 'iron_ingot', null]], output: { itemId: 'compass', count: 1 } },
  { id: 'clock', nameVi: 'Đồng Hồ', pattern: [[null, 'gold_ingot', null], ['gold_ingot', 'redstone', 'gold_ingot'], [null, 'gold_ingot', null]], output: { itemId: 'clock', count: 1 } },
  { id: 'fishing_rod', nameVi: 'Cần Câu', pattern: [[null, null, 'stick'], [null, 'stick', 'string'], ['stick', null, 'string']], output: { itemId: 'fishing_rod', count: 1 } },
  { id: 'warped_fungus_on_a_stick', nameVi: 'Cần Câu Nấm Xanh', shapeless: ['fishing_rod', 'warped_fungus'], output: { itemId: 'warped_fungus_on_a_stick', count: 1 } },
  { id: 'tripwire_hook', nameVi: 'Móc Dây', pattern: [['iron_ingot'], ['stick'], ['oak_planks']], output: { itemId: 'tripwire_hook', count: 2 } },
  { id: 'crossbow', nameVi: 'Nỏ', pattern: [['stick', 'iron_ingot', 'stick'], ['string', 'tripwire_hook', 'string'], [null, 'stick', null]], output: { itemId: 'crossbow', count: 1 } },
  { id: 'turtle_helmet', nameVi: 'Mũ Rùa', pattern: [['scute', 'scute', 'scute'], ['scute', null, 'scute']], output: { itemId: 'turtle_helmet', count: 1 } },
  { id: 'armor_stand', nameVi: 'Giá Treo Giáp', pattern: [['stick', 'stick', 'stick'], [null, 'stick', null], ['stick', 'smooth_stone_slab', 'stick']], output: { itemId: 'armor_stand', count: 1 } },
  { id: 'spectral_arrow', nameVi: 'Mũi Tên Phổ', pattern: [[null, 'glowstone_dust', null], ['glowstone_dust', 'arrow', 'glowstone_dust'], [null, 'glowstone_dust', null]], output: { itemId: 'spectral_arrow', count: 2 } },
  { id: 'tipped_arrow', nameVi: 'Mũi Tên Thuốc', pattern: [['arrow', 'arrow', 'arrow'], ['arrow', 'lingering_potion_healing', 'arrow'], ['arrow', 'arrow', 'arrow']], output: { itemId: 'tipped_arrow', count: 8 } },

  // Section C — Food & Farming
  { id: 'cookie', nameVi: 'Bánh Quy', pattern: [['wheat', 'cocoa_beans', 'wheat']], output: { itemId: 'cookie', count: 8 } },
  { id: 'cake', nameVi: 'Bánh Ngọt', pattern: [['milk_bucket', 'milk_bucket', 'milk_bucket'], ['sugar', 'egg', 'sugar'], ['wheat', 'wheat', 'wheat']], output: { itemId: 'cake', count: 1 } },
  { id: 'pumpkin_pie', nameVi: 'Bánh Bí Ngô', shapeless: ['pumpkin', 'sugar', 'egg'], output: { itemId: 'pumpkin_pie', count: 1 } },
  { id: 'mushroom_stew', nameVi: 'Súp Nấm', shapeless: ['red_mushroom', 'brown_mushroom', 'bowl'], output: { itemId: 'mushroom_stew', count: 1 } },
  { id: 'beetroot_soup', nameVi: 'Súp Củ Dền', shapeless: ['beetroot', 'beetroot', 'beetroot', 'beetroot', 'beetroot', 'beetroot', 'bowl'], output: { itemId: 'beetroot_soup', count: 1 } },
  { id: 'rabbit_stew', nameVi: 'Thỏ Hầm', shapeless: ['cooked_rabbit', 'carrot', 'baked_potato', 'brown_mushroom', 'bowl'], output: { itemId: 'rabbit_stew', count: 1 } },
  { id: 'sugar', nameVi: 'Đường', shapeless: ['sugar_cane'], output: { itemId: 'sugar', count: 1 } },
  { id: 'paper', nameVi: 'Giấy', pattern: [['sugar_cane', 'sugar_cane', 'sugar_cane']], output: { itemId: 'paper', count: 3 } },
  { id: 'melon_seeds', nameVi: 'Hạt Dưa Hấu', shapeless: ['melon_slice'], output: { itemId: 'melon_seeds', count: 1 } },
  { id: 'pumpkin_seeds', nameVi: 'Hạt Bí Ngô', shapeless: ['pumpkin'], output: { itemId: 'pumpkin_seeds', count: 4 } },
  { id: 'melon_block', nameVi: 'Khối Dưa Hấu', pattern: [['melon_slice', 'melon_slice', 'melon_slice'], ['melon_slice', 'melon_slice', 'melon_slice'], ['melon_slice', 'melon_slice', 'melon_slice']], output: { itemId: 'melon', count: 1 } },

  // Section D & L — Utility, Transport, End
  { id: 'map', nameVi: 'Bản Đồ Trống', pattern: [['paper', 'paper', 'paper'], ['paper', 'compass', 'paper'], ['paper', 'paper', 'paper']], output: { itemId: 'map', count: 1 } },
  { id: 'writable_book', nameVi: 'Sách & Bút', shapeless: ['book', 'feather', 'ink_sac'], output: { itemId: 'writable_book', count: 1 } },
  { id: 'item_frame', nameVi: 'Khung Vật Phẩm', pattern: [['stick', 'stick', 'stick'], ['stick', 'leather', 'stick'], ['stick', 'stick', 'stick']], output: { itemId: 'item_frame', count: 1 } },
  { id: 'painting', nameVi: 'Tranh', pattern: [['stick', 'stick', 'stick'], ['stick', 'white_wool', 'stick'], ['stick', 'stick', 'stick']], output: { itemId: 'painting', count: 1 } },
  { id: 'oak_sign', nameVi: 'Biển Hiệu Gỗ', pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['oak_planks', 'oak_planks', 'oak_planks'], [null, 'stick', null]], output: { itemId: 'oak_sign', count: 3 } },
  { id: 'crimson_sign', nameVi: 'Biển Hiệu Nấm Đỏ', pattern: [['crimson_planks', 'crimson_planks', 'crimson_planks'], ['crimson_planks', 'crimson_planks', 'crimson_planks'], [null, 'stick', null]], output: { itemId: 'crimson_sign', count: 3 } },
  { id: 'warped_sign', nameVi: 'Biển Hiệu Nấm Xanh', pattern: [['warped_planks', 'warped_planks', 'warped_planks'], ['warped_planks', 'warped_planks', 'warped_planks'], [null, 'stick', null]], output: { itemId: 'warped_sign', count: 3 } },
  { id: 'oak_boat', nameVi: 'Thuyền Gỗ', pattern: [['oak_planks', null, 'oak_planks'], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'oak_boat', count: 1 } },
  { id: 'crimson_boat', nameVi: 'Thuyền Nấm Đỏ', pattern: [['crimson_planks', null, 'crimson_planks'], ['crimson_planks', 'crimson_planks', 'crimson_planks']], output: { itemId: 'crimson_boat', count: 1 } },
  { id: 'warped_boat', nameVi: 'Thuyền Nấm Xanh', pattern: [['warped_planks', null, 'warped_planks'], ['warped_planks', 'warped_planks', 'warped_planks']], output: { itemId: 'warped_boat', count: 1 } },
  { id: 'minecart', nameVi: 'Xe Mỏ', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], output: { itemId: 'minecart', count: 1 } },
  { id: 'chest_minecart', nameVi: 'Xe Mỏ Rương', shapeless: ['minecart', 'chest'], output: { itemId: 'chest_minecart', count: 1 } },
  { id: 'hopper_minecart', nameVi: 'Xe Mỏ Phễu', shapeless: ['minecart', 'hopper'], output: { itemId: 'hopper_minecart', count: 1 } },
  { id: 'tnt_minecart', nameVi: 'Xe Mỏ TNT', shapeless: ['minecart', 'tnt'], output: { itemId: 'tnt_minecart', count: 1 } },
  { id: 'rail', nameVi: 'Đường Ray', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'stick', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { itemId: 'rail', count: 16 } },
  { id: 'powered_rail', nameVi: 'Đường Ray Điện', pattern: [['gold_ingot', null, 'gold_ingot'], ['gold_ingot', 'stick', 'gold_ingot'], ['gold_ingot', 'redstone', 'gold_ingot']], output: { itemId: 'powered_rail', count: 6 } },
  { id: 'detector_rail', nameVi: 'Đường Ray Cảm Biến', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'stone_pressure_plate', 'iron_ingot'], ['iron_ingot', 'redstone', 'iron_ingot']], output: { itemId: 'detector_rail', count: 6 } },
  { id: 'activator_rail', nameVi: 'Đường Ray Kích Hoạt', pattern: [['iron_ingot', 'stick', 'iron_ingot'], ['iron_ingot', 'redstone_torch', 'iron_ingot'], ['iron_ingot', 'stick', 'iron_ingot']], output: { itemId: 'activator_rail', count: 6 } },
  { id: 'firework_rocket', nameVi: 'Tên Lửa Pháo Hoa', shapeless: ['paper', 'gunpowder'], output: { itemId: 'firework_rocket', count: 3 } },
  { id: 'firework_star', nameVi: 'Sao Pháo Hoa', shapeless: ['gunpowder', 'red_dye'], output: { itemId: 'firework_star', count: 1 } },
  { id: 'fire_charge', nameVi: 'Cầu Lửa', shapeless: ['blaze_powder', 'coal', 'gunpowder'], output: { itemId: 'fire_charge', count: 3 } },
  { id: 'eye_of_ender', nameVi: 'Mắt Ender', shapeless: ['ender_pearl', 'blaze_powder'], output: { itemId: 'eye_of_ender', count: 1 } },
  { id: 'end_crystal', nameVi: 'Pha Lê End', pattern: [['glass', 'glass', 'glass'], ['glass', 'eye_of_ender', 'glass'], ['glass', 'ghast_tear', 'glass']], output: { itemId: 'end_crystal', count: 1 } },

  // Section E — Redstone Machines
  { id: 'redstone_torch', nameVi: 'Đuốc Redstone', pattern: [['redstone'], ['stick']], output: { itemId: 'redstone_torch', count: 1 } },
  { id: 'repeater', nameVi: 'Bộ Lặp Redstone', pattern: [['redstone_torch', 'redstone', 'redstone_torch'], ['stone', 'stone', 'stone']], output: { itemId: 'repeater', count: 1 } },
  { id: 'comparator', nameVi: 'Bộ So Sánh Redstone', pattern: [[null, 'redstone_torch', null], ['redstone_torch', 'quartz', 'redstone_torch'], ['stone', 'stone', 'stone']], output: { itemId: 'comparator', count: 1 } },
  { id: 'piston', nameVi: 'Piston', pattern: [['oak_planks', 'oak_planks', 'oak_planks'], ['cobblestone', 'iron_ingot', 'cobblestone'], ['cobblestone', 'redstone', 'cobblestone']], output: { itemId: 'piston', count: 1 } },
  { id: 'sticky_piston', nameVi: 'Piston Dính', pattern: [['slime_ball'], ['piston']], output: { itemId: 'sticky_piston', count: 1 } },
  { id: 'dispenser', nameVi: 'Máy Phân Phát', pattern: [['cobblestone', 'cobblestone', 'cobblestone'], ['cobblestone', 'bow', 'cobblestone'], ['cobblestone', 'redstone', 'cobblestone']], output: { itemId: 'dispenser', count: 1 } },
  { id: 'dropper', nameVi: 'Máy Bắn', pattern: [['cobblestone', 'cobblestone', 'cobblestone'], ['cobblestone', null, 'cobblestone'], ['cobblestone', 'redstone', 'cobblestone']], output: { itemId: 'dropper', count: 1 } },
  { id: 'hopper', nameVi: 'Phễu (Hopper)', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'chest', 'iron_ingot'], [null, 'iron_ingot', null]], output: { itemId: 'hopper', count: 1 } },
  { id: 'observer', nameVi: 'Máy Quan Sát', pattern: [['cobblestone', 'cobblestone', 'cobblestone'], ['redstone', 'redstone', 'quartz'], ['cobblestone', 'cobblestone', 'cobblestone']], output: { itemId: 'observer', count: 1 } },
  { id: 'daylight_detector', nameVi: 'Cảm Biến Ánh Sáng', pattern: [['glass', 'glass', 'glass'], ['quartz', 'quartz', 'quartz'], ['oak_slab', 'oak_slab', 'oak_slab']], output: { itemId: 'daylight_detector', count: 1 } },
  { id: 'redstone_lamp', nameVi: 'Đèn Redstone', pattern: [[null, 'redstone', null], ['redstone', 'glowstone', 'redstone'], [null, 'redstone', null]], output: { itemId: 'redstone_lamp', count: 1 } },
  { id: 'lever', nameVi: 'Cần Gạt', pattern: [['stick'], ['cobblestone']], output: { itemId: 'lever', count: 1 } },
  { id: 'target', nameVi: 'Khối Bia Bắn', pattern: [[null, 'redstone', null], ['redstone', 'hay_block', 'redstone'], [null, 'redstone', null]], output: { itemId: 'target', count: 1 } },

  // Section G — Dyes & Banners
  { id: 'red_dye_poppy', nameVi: 'Thuốc Nhuộm Đỏ', shapeless: ['poppy'], output: { itemId: 'red_dye', count: 1 } },
  { id: 'red_dye_beetroot', nameVi: 'Thuốc Nhuộm Đỏ (Củ Dền)', shapeless: ['beetroot'], output: { itemId: 'red_dye', count: 1 } },
  { id: 'yellow_dye', nameVi: 'Thuốc Nhuộm Vàng', shapeless: ['dandelion'], output: { itemId: 'yellow_dye', count: 1 } },
  { id: 'blue_dye_lapis', nameVi: 'Thuốc Nhuộm Xanh Dương', shapeless: ['lapis_lazuli'], output: { itemId: 'blue_dye', count: 1 } },
  { id: 'blue_dye_flower', nameVi: 'Thuốc Nhuộm Xanh (Hoa)', shapeless: ['cornflower'], output: { itemId: 'blue_dye', count: 1 } },
  { id: 'white_dye', nameVi: 'Thuốc Nhuộm Trắng', shapeless: ['bone_meal'], output: { itemId: 'white_dye', count: 1 } },
  { id: 'black_dye', nameVi: 'Thuốc Nhuộm Đen', shapeless: ['ink_sac'], output: { itemId: 'black_dye', count: 1 } },
  { id: 'brown_dye', nameVi: 'Thuốc Nhuộm Nâu', shapeless: ['cocoa_beans'], output: { itemId: 'brown_dye', count: 1 } },
  { id: 'orange_dye', nameVi: 'Thuốc Nhuộm Cam', shapeless: ['red_dye', 'yellow_dye'], output: { itemId: 'orange_dye', count: 2 } },
  { id: 'purple_dye', nameVi: 'Thuốc Nhuộm Tím', shapeless: ['red_dye', 'blue_dye'], output: { itemId: 'purple_dye', count: 2 } },
  { id: 'cyan_dye', nameVi: 'Thuốc Nhuộm Xanh Lơ', shapeless: ['blue_dye', 'green_dye'], output: { itemId: 'cyan_dye', count: 2 } },
  { id: 'light_blue_dye', nameVi: 'Thuốc Nhuộm Xanh Nhạt', shapeless: ['blue_dye', 'white_dye'], output: { itemId: 'light_blue_dye', count: 2 } },
  { id: 'lime_dye', nameVi: 'Thuốc Nhuộm Xanh Chanh', shapeless: ['green_dye', 'white_dye'], output: { itemId: 'lime_dye', count: 2 } },
  { id: 'pink_dye', nameVi: 'Thuốc Nhuộm Hồng', shapeless: ['red_dye', 'white_dye'], output: { itemId: 'pink_dye', count: 2 } },
  { id: 'gray_dye', nameVi: 'Thuốc Nhuộm Xám', shapeless: ['black_dye', 'white_dye'], output: { itemId: 'gray_dye', count: 2 } },
  { id: 'light_gray_dye', nameVi: 'Thuốc Nhuộm Xám Nhạt', shapeless: ['gray_dye', 'white_dye'], output: { itemId: 'light_gray_dye', count: 2 } },
  { id: 'magenta_dye', nameVi: 'Thuốc Nhuộm Đỏ Tím', shapeless: ['purple_dye', 'pink_dye'], output: { itemId: 'magenta_dye', count: 2 } },

  // Banners
  { id: 'white_banner', nameVi: 'Cờ Trắng', pattern: [['white_wool', 'white_wool', 'white_wool'], ['white_wool', 'white_wool', 'white_wool'], [null, 'stick', null]], output: { itemId: 'white_banner', count: 1 } },
  { id: 'red_banner', nameVi: 'Cờ Đỏ', pattern: [['red_wool', 'red_wool', 'red_wool'], ['red_wool', 'red_wool', 'red_wool'], [null, 'stick', null]], output: { itemId: 'red_banner', count: 1 } },
  { id: 'blue_banner', nameVi: 'Cờ Xanh Dương', pattern: [['blue_wool', 'blue_wool', 'blue_wool'], ['blue_wool', 'blue_wool', 'blue_wool'], [null, 'stick', null]], output: { itemId: 'blue_banner', count: 1 } },
  { id: 'black_banner', nameVi: 'Cờ Đen', pattern: [['black_wool', 'black_wool', 'black_wool'], ['black_wool', 'black_wool', 'black_wool'], [null, 'stick', null]], output: { itemId: 'black_banner', count: 1 } },
  { id: 'flower_banner_pattern', nameVi: 'Mẫu Cờ Hoa', shapeless: ['paper', 'dandelion'], output: { itemId: 'flower_banner_pattern', count: 1 } },
  { id: 'skull_banner_pattern', nameVi: 'Mẫu Cờ Đầu Lâu', shapeless: ['paper', 'wither_skeleton_skull'], output: { itemId: 'skull_banner_pattern', count: 1 } },
  { id: 'mojang_banner_pattern', nameVi: 'Mẫu Cờ Mojang', shapeless: ['paper', 'enchanted_golden_apple'], output: { itemId: 'mojang_banner_pattern', count: 1 } },

  // Dyeing Wool, Stained Glass, Terracotta, Concrete Powder, Carpet (for all 16 colors!)
  ...MC_COLORS.flatMap<CraftingRecipe>((c) => [
    ...(c.id !== 'white'
      ? [{ id: `${c.id}_wool_dye`, nameVi: `Len ${c.nameVi}`, shapeless: ['white_wool', `${c.id}_dye`], output: { itemId: `${c.id}_wool`, count: 1 } }]
      : []),
    { id: `${c.id}_carpet`, nameVi: `Thảm ${c.nameVi}`, pattern: [[`${c.id}_wool`, `${c.id}_wool`]], output: { itemId: `${c.id}_carpet`, count: 3 } },
    { id: `${c.id}_stained_glass`, nameVi: `Kính ${c.nameVi}`, pattern: [['glass', 'glass', 'glass'], ['glass', `${c.id}_dye`, 'glass'], ['glass', 'glass', 'glass']], output: { itemId: `${c.id}_stained_glass`, count: 8 } },
    { id: `${c.id}_terracotta`, nameVi: `Đất Nung ${c.nameVi}`, pattern: [['terracotta', 'terracotta', 'terracotta'], ['terracotta', `${c.id}_dye`, 'terracotta'], ['terracotta', 'terracotta', 'terracotta']], output: { itemId: `${c.id}_terracotta`, count: 8 } },
    { id: `${c.id}_concrete_powder`, nameVi: `Bột Bê Tông ${c.nameVi}`, shapeless: ['sand', 'sand', 'sand', 'sand', 'gravel', 'gravel', 'gravel', 'gravel', `${c.id}_dye`], output: { itemId: `${c.id}_concrete_powder`, count: 8 } },
    { id: `${c.id}_concrete_water`, nameVi: `Bê Tông ${c.nameVi}`, shapeless: [`${c.id}_concrete_powder`, 'water_bucket'], output: { itemId: `${c.id}_concrete`, count: 1 } },
  ]),

  // Section J — Brewing Ingredients & Potions (Craftable via Brewing Stand / Crafting Table)
  { id: 'glass_bottle', nameVi: 'Chai Thủy Tinh', pattern: [['glass', null, 'glass'], [null, 'glass', null]], output: { itemId: 'glass_bottle', count: 3 } },
  { id: 'water_bottle', nameVi: 'Chai Nước', shapeless: ['glass_bottle', 'water_bucket'], output: { itemId: 'water_bottle', count: 1 } },
  { id: 'fermented_spider_eye', nameVi: 'Mắt Nhện Lên Men', shapeless: ['spider_eye', 'brown_mushroom', 'sugar'], output: { itemId: 'fermented_spider_eye', count: 1 } },
  { id: 'glistering_melon_slice', nameVi: 'Dưa Hấu Lấp Lánh', pattern: [['gold_nugget', 'gold_nugget', 'gold_nugget'], ['gold_nugget', 'melon_slice', 'gold_nugget'], ['gold_nugget', 'gold_nugget', 'gold_nugget']], output: { itemId: 'glistering_melon_slice', count: 1 } },
  { id: 'magma_cream', nameVi: 'Kem Magma', shapeless: ['slime_ball', 'blaze_powder'], output: { itemId: 'magma_cream', count: 1 } },
  { id: 'awkward_potion', nameVi: 'Thuốc Thô (Awkward)', shapeless: ['water_bottle', 'nether_wart'], output: { itemId: 'awkward_potion', count: 1 } },
  { id: 'potion_weakness', nameVi: 'Thuốc Suy Yếu', shapeless: ['water_bottle', 'fermented_spider_eye'], output: { itemId: 'potion_weakness', count: 1 } },
  { id: 'potion_regeneration', nameVi: 'Thuốc Hồi Máu', shapeless: ['awkward_potion', 'ghast_tear'], output: { itemId: 'potion_regeneration', count: 1 } },
  { id: 'potion_strength', nameVi: 'Thuốc Sức Mạnh', shapeless: ['awkward_potion', 'blaze_powder'], output: { itemId: 'potion_strength', count: 1 } },
  { id: 'potion_swiftness', nameVi: 'Thuốc Tốc Độ', shapeless: ['awkward_potion', 'sugar'], output: { itemId: 'potion_swiftness', count: 1 } },
  { id: 'potion_leaping', nameVi: 'Thuốc Nhảy Cao', shapeless: ['awkward_potion', 'rabbit_foot'], output: { itemId: 'potion_leaping', count: 1 } },
  { id: 'potion_healing', nameVi: 'Thuốc Chữa Trị', shapeless: ['awkward_potion', 'glistering_melon_slice'], output: { itemId: 'potion_healing', count: 1 } },
  { id: 'potion_poison', nameVi: 'Thuốc Độc', shapeless: ['awkward_potion', 'spider_eye'], output: { itemId: 'potion_poison', count: 1 } },
  { id: 'potion_water_breathing', nameVi: 'Thuốc Thở Dưới Nước', shapeless: ['awkward_potion', 'pufferfish'], output: { itemId: 'potion_water_breathing', count: 1 } },
  { id: 'potion_fire_resistance', nameVi: 'Thuốc Kháng Lửa', shapeless: ['awkward_potion', 'magma_cream'], output: { itemId: 'potion_fire_resistance', count: 1 } },
  { id: 'potion_night_vision', nameVi: 'Thuốc Nhìn Đêm', shapeless: ['awkward_potion', 'golden_carrot'], output: { itemId: 'potion_night_vision', count: 1 } },
  { id: 'potion_turtle_master', nameVi: 'Thuốc Bậc Thầy Rùa', shapeless: ['awkward_potion', 'turtle_helmet'], output: { itemId: 'potion_turtle_master', count: 1 } },
  { id: 'potion_slow_falling', nameVi: 'Thuốc Rơi Chậm', shapeless: ['awkward_potion', 'phantom_membrane'], output: { itemId: 'potion_slow_falling', count: 1 } },
  { id: 'potion_invisibility', nameVi: 'Thuốc Tàng Hình', shapeless: ['potion_night_vision', 'fermented_spider_eye'], output: { itemId: 'potion_invisibility', count: 1 } },
  { id: 'potion_slowness', nameVi: 'Thuốc Làm Chậm', shapeless: ['potion_swiftness', 'fermented_spider_eye'], output: { itemId: 'potion_slowness', count: 1 } },
  { id: 'potion_harming', nameVi: 'Thuốc Sát Thương', shapeless: ['potion_healing', 'fermented_spider_eye'], output: { itemId: 'potion_harming', count: 1 } },
  { id: 'splash_potion_healing', nameVi: 'Thuốc Ném Hồi Máu', shapeless: ['potion_healing', 'gunpowder'], output: { itemId: 'splash_potion_healing', count: 1 } },
  { id: 'lingering_potion_healing', nameVi: 'Thuốc Đọng Hồi Máu', shapeless: ['splash_potion_healing', 'dragon_breath'], output: { itemId: 'lingering_potion_healing', count: 1 } },

  // Recipes for Newly Added Important Minecraft 1.16.5 Items & Blocks
  { id: 'packed_ice', nameVi: 'Băng Nén', pattern: [['ice', 'ice', 'ice'], ['ice', 'ice', 'ice'], ['ice', 'ice', 'ice']], output: { itemId: 'packed_ice', count: 1 } },
  { id: 'blue_ice', nameVi: 'Băng Xanh', pattern: [['packed_ice', 'packed_ice', 'packed_ice'], ['packed_ice', 'packed_ice', 'packed_ice'], ['packed_ice', 'packed_ice', 'packed_ice']], output: { itemId: 'blue_ice', count: 1 } },
  { id: 'iron_bars', nameVi: 'Song Sắt', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], output: { itemId: 'iron_bars', count: 16 } },
  { id: 'conduit', nameVi: 'Lõi Dẫn Biển (Conduit)', pattern: [['nautilus_shell', 'nautilus_shell', 'nautilus_shell'], ['nautilus_shell', 'heart_of_the_sea', 'nautilus_shell'], ['nautilus_shell', 'nautilus_shell', 'nautilus_shell']], output: { itemId: 'conduit', count: 1 } },
  { id: 'coarse_dirt', nameVi: 'Đất Thô', pattern: [['dirt', 'gravel'], ['gravel', 'dirt']], output: { itemId: 'coarse_dirt', count: 4 } },
  { id: 'polished_andesite', nameVi: 'Andesite Mài Bóng', pattern: [['andesite', 'andesite'], ['andesite', 'andesite']], output: { itemId: 'polished_andesite', count: 4 } },
  { id: 'polished_granite', nameVi: 'Granite Mài Bóng', pattern: [['granite', 'granite'], ['granite', 'granite']], output: { itemId: 'polished_granite', count: 4 } },
  { id: 'polished_diorite', nameVi: 'Diorite Mài Bóng', pattern: [['diorite', 'diorite'], ['diorite', 'diorite']], output: { itemId: 'polished_diorite', count: 4 } },
  { id: 'trapped_chest', nameVi: 'Rương Bẫy', shapeless: ['chest', 'tripwire_hook'], output: { itemId: 'trapped_chest', count: 1 } },
  { id: 'lead', nameVi: 'Dây Dắt (Lead)', pattern: [['string', 'string', null], ['string', 'slime_ball', null], [null, null, 'string']], output: { itemId: 'lead', count: 2 } },
  { id: 'carrot_on_a_stick', nameVi: 'Cần Câu Cà Rốt', shapeless: ['fishing_rod', 'carrot'], output: { itemId: 'carrot_on_a_stick', count: 1 } },
  { id: 'leather_from_rabbit', nameVi: 'Da Thuộc (Da Thỏ)', pattern: [['rabbit_hide', 'rabbit_hide'], ['rabbit_hide', 'rabbit_hide']], output: { itemId: 'leather', count: 1 } },
  { id: 'leather_horse_armor', nameVi: 'Giáp Ngựa Da', pattern: [['leather', null, 'leather'], ['leather', 'leather', 'leather'], ['leather', null, 'leather']], output: { itemId: 'leather_horse_armor', count: 1 } },
  { id: 'suspicious_stew', nameVi: 'Súp Đáng Ngờ', shapeless: ['red_mushroom', 'brown_mushroom', 'bowl', 'oxeye_daisy'], output: { itemId: 'suspicious_stew', count: 1 } },
  { id: 'furnace_minecart', nameVi: 'Xe Mỏ Lò Nung', shapeless: ['minecart', 'furnace'], output: { itemId: 'furnace_minecart', count: 1 } },
  { id: 'spruce_boat', nameVi: 'Thuyền Vân Sam', pattern: [['spruce_planks', null, 'spruce_planks'], ['spruce_planks', 'spruce_planks', 'spruce_planks']], output: { itemId: 'spruce_boat', count: 1 } },
  { id: 'birch_boat', nameVi: 'Thuyền Bạch Dương', pattern: [['birch_planks', null, 'birch_planks'], ['birch_planks', 'birch_planks', 'birch_planks']], output: { itemId: 'birch_boat', count: 1 } },
  { id: 'jungle_boat', nameVi: 'Thuyền Rừng Rậm', pattern: [['jungle_planks', null, 'jungle_planks'], ['jungle_planks', 'jungle_planks', 'jungle_planks']], output: { itemId: 'jungle_boat', count: 1 } },
  { id: 'acacia_boat', nameVi: 'Thuyền Gỗ Keo', pattern: [['acacia_planks', null, 'acacia_planks'], ['acacia_planks', 'acacia_planks', 'acacia_planks']], output: { itemId: 'acacia_boat', count: 1 } },
  { id: 'dark_oak_boat', nameVi: 'Thuyền Sồi Sẫm', pattern: [['dark_oak_planks', null, 'dark_oak_planks'], ['dark_oak_planks', 'dark_oak_planks', 'dark_oak_planks']], output: { itemId: 'dark_oak_boat', count: 1 } },
  { id: 'blackstone_stairs', nameVi: 'Cầu Thang Đá Đen Thô', pattern: [['blackstone', null, null], ['blackstone', 'blackstone', null], ['blackstone', 'blackstone', 'blackstone']], output: { itemId: 'blackstone_stairs', count: 4 } },
  { id: 'blackstone_slab', nameVi: 'Phiến Đá Đen Thô', pattern: [['blackstone', 'blackstone', 'blackstone']], output: { itemId: 'blackstone_slab', count: 6 } },
  { id: 'nether_brick_wall', nameVi: 'Tường Gạch Nether', pattern: [['nether_bricks', 'nether_bricks', 'nether_bricks'], ['nether_bricks', 'nether_bricks', 'nether_bricks']], output: { itemId: 'nether_brick_wall', count: 6 } },
  { id: 'mossy_stone_brick_wall', nameVi: 'Tường Gạch Đá Rêu', pattern: [['mossy_stone_bricks', 'mossy_stone_bricks', 'mossy_stone_bricks'], ['mossy_stone_bricks', 'mossy_stone_bricks', 'mossy_stone_bricks']], output: { itemId: 'mossy_stone_brick_wall', count: 6 } },
  { id: 'snow_block_craft', nameVi: 'Khối Tuyết', pattern: [['snowball', 'snowball'], ['snowball', 'snowball']], output: { itemId: 'snow_block', count: 1 } },
  { id: 'black_dye_wither', nameVi: 'Thuốc Nhuộm Đen (Hoa)', shapeless: ['wither_rose'], output: { itemId: 'black_dye', count: 1 } },
  { id: 'light_blue_dye_orchid', nameVi: 'Thuốc Nhuộm Xanh Nhạt (Hoa)', shapeless: ['blue_orchid'], output: { itemId: 'light_blue_dye', count: 1 } },
  { id: 'magenta_dye_allium', nameVi: 'Thuốc Nhuộm Đỏ Tím (Hoa)', shapeless: ['allium'], output: { itemId: 'magenta_dye', count: 1 } },
  { id: 'light_gray_dye_daisy', nameVi: 'Thuốc Nhuộm Xám Nhạt (Hoa)', shapeless: ['oxeye_daisy'], output: { itemId: 'light_gray_dye', count: 1 } },
  { id: 'white_dye_lily', nameVi: 'Thuốc Nhuộm Trắng (Hoa)', shapeless: ['lily_of_the_valley'], output: { itemId: 'white_dye', count: 1 } },
  { id: 'yellow_dye_sunflower', nameVi: 'Thuốc Nhuộm Vàng (Hướng Dương)', shapeless: ['sunflower'], output: { itemId: 'yellow_dye', count: 2 } },
  { id: 'red_dye_rose_bush', nameVi: 'Thuốc Nhuộm Đỏ (Hoa Hồng)', shapeless: ['rose_bush'], output: { itemId: 'red_dye', count: 2 } },

  // Modern 1.17 – 26.3 Crafting Recipes (Mace, Wind Charge, Spyglass, Copper Age, Spears, Cherry, Pale Oak, Trial!)
  { id: 'mace_craft', nameVi: 'Chùy Chiến (Mace)', pattern: [['heavy_core'], ['breeze_rod']], output: { itemId: 'mace', count: 1 } },
  { id: 'wind_charge_craft', nameVi: '4 Cầu Gió (Wind Charge)', shapeless: ['breeze_rod'], output: { itemId: 'wind_charge', count: 4 } },
  { id: 'spyglass_craft', nameVi: 'Ống Nhòm (Spyglass)', pattern: [['amethyst_shard'], ['copper_ingot'], ['copper_ingot']], output: { itemId: 'spyglass', count: 1 } },
  { id: 'brush_craft', nameVi: 'Cọ Khảo Cổ', pattern: [['feather'], ['copper_ingot'], ['stick']], output: { itemId: 'brush', count: 1 } },
  { id: 'bundle_craft', nameVi: 'Túi Bọc Đồ', pattern: [['string'], ['leather']], output: { itemId: 'bundle', count: 1 } },
  { id: 'recovery_compass_craft', nameVi: 'La Bàn Hồi Sinh', pattern: [['echo_shard', 'echo_shard', 'echo_shard'], ['echo_shard', 'compass', 'echo_shard'], ['echo_shard', 'echo_shard', 'echo_shard']], output: { itemId: 'recovery_compass', count: 1 } },
  { id: 'copper_block_craft', nameVi: 'Khối Đồng', pattern: [['copper_ingot', 'copper_ingot', 'copper_ingot'], ['copper_ingot', 'copper_ingot', 'copper_ingot'], ['copper_ingot', 'copper_ingot', 'copper_ingot']], output: { itemId: 'copper_block', count: 1 } },
  { id: 'copper_ingot_from_block', nameVi: '9 Thỏi Đồng', shapeless: ['copper_block'], output: { itemId: 'copper_ingot', count: 9 } },
  { id: 'cut_copper_craft', nameVi: 'Đồng Cắt Ô', pattern: [['copper_block', 'copper_block'], ['copper_block', 'copper_block']], output: { itemId: 'cut_copper', count: 4 } },
  { id: 'copper_bulb_craft', nameVi: 'Bóng Đèn Đồng', pattern: [[null, 'copper_block', null], ['copper_block', 'blaze_rod', 'copper_block'], [null, 'redstone', null]], output: { itemId: 'copper_bulb', count: 4 } },
  { id: 'copper_grate_craft', nameVi: 'Lưới Đồng', pattern: [[null, 'copper_block', null], ['copper_block', null, 'copper_block'], [null, 'copper_block', null]], output: { itemId: 'copper_grate', count: 4 } },
  { id: 'copper_torch_craft', nameVi: 'Đuốc Đồng Xanh', pattern: [['copper_nugget'], ['coal'], ['stick']], output: { itemId: 'copper_torch', count: 4 } },
  { id: 'copper_lantern_craft', nameVi: 'Đèn Lồng Đồng', pattern: [['copper_nugget', 'copper_nugget', 'copper_nugget'], ['copper_nugget', 'copper_torch', 'copper_nugget'], ['copper_nugget', 'copper_nugget', 'copper_nugget']], output: { itemId: 'copper_lantern', count: 1 } },
  { id: 'copper_nuggets', nameVi: '9 Hạt Đồng', shapeless: ['copper_ingot'], output: { itemId: 'copper_nugget', count: 9 } },
  { id: 'copper_sword_craft', nameVi: 'Kiếm Đồng', pattern: [['copper_ingot'], ['copper_ingot'], ['stick']], output: { itemId: 'copper_sword', count: 1 } },
  { id: 'copper_pickaxe_craft', nameVi: 'Cúp Đồng', pattern: [['copper_ingot', 'copper_ingot', 'copper_ingot'], [null, 'stick', null], [null, 'stick', null]], output: { itemId: 'copper_pickaxe', count: 1 } },
  { id: 'copper_axe_craft', nameVi: 'Rìu Đồng', pattern: [['copper_ingot', 'copper_ingot'], ['copper_ingot', 'stick'], [null, 'stick']], output: { itemId: 'copper_axe', count: 1 } },
  { id: 'copper_shovel_craft', nameVi: 'Xẻng Đồng', pattern: [['copper_ingot'], ['stick'], ['stick']], output: { itemId: 'copper_shovel', count: 1 } },
  { id: 'copper_hoe_craft', nameVi: 'Cuốc Đồng', pattern: [['copper_ingot', 'copper_ingot'], [null, 'stick'], [null, 'stick']], output: { itemId: 'copper_hoe', count: 1 } },
  { id: 'copper_helmet_craft', nameVi: 'Mũ Đồng', pattern: [['copper_ingot', 'copper_ingot', 'copper_ingot'], ['copper_ingot', null, 'copper_ingot']], output: { itemId: 'copper_helmet', count: 1 } },
  { id: 'copper_chestplate_craft', nameVi: 'Áo Giáp Đồng', pattern: [['copper_ingot', null, 'copper_ingot'], ['copper_ingot', 'copper_ingot', 'copper_ingot'], ['copper_ingot', 'copper_ingot', 'copper_ingot']], output: { itemId: 'copper_chestplate', count: 1 } },
  { id: 'copper_leggings_craft', nameVi: 'Quần Giáp Đồng', pattern: [['copper_ingot', 'copper_ingot', 'copper_ingot'], ['copper_ingot', null, 'copper_ingot'], ['copper_ingot', null, 'copper_ingot']], output: { itemId: 'copper_leggings', count: 1 } },
  { id: 'copper_boots_craft', nameVi: 'Ủng Đồng', pattern: [['copper_ingot', null, 'copper_ingot'], ['copper_ingot', null, 'copper_ingot']], output: { itemId: 'copper_boots', count: 1 } },
  { id: 'wooden_spear_craft', nameVi: 'Giáo Gỗ', pattern: [[null, null, 'oak_planks'], [null, 'stick', null], ['stick', null, null]], output: { itemId: 'wooden_spear', count: 1 } },
  { id: 'stone_spear_craft', nameVi: 'Giáo Đá', pattern: [[null, null, 'cobblestone'], [null, 'stick', null], ['stick', null, null]], output: { itemId: 'stone_spear', count: 1 } },
  { id: 'copper_spear_craft', nameVi: 'Giáo Đồng', pattern: [[null, null, 'copper_ingot'], [null, 'stick', null], ['stick', null, null]], output: { itemId: 'copper_spear', count: 1 } },
  { id: 'iron_spear_craft', nameVi: 'Giáo Sắt', pattern: [[null, null, 'iron_ingot'], [null, 'stick', null], ['stick', null, null]], output: { itemId: 'iron_spear', count: 1 } },
  { id: 'diamond_spear_craft', nameVi: 'Giáo Kim Cương', pattern: [[null, null, 'diamond'], [null, 'stick', null], ['stick', null, null]], output: { itemId: 'diamond_spear', count: 1 } },
  { id: 'netherite_spear_craft', nameVi: 'Giáo Netherite', shapeless: ['diamond_spear', 'netherite_ingot'], output: { itemId: 'netherite_spear', count: 1 } },
  { id: 'cherry_planks_craft', nameVi: 'Ván Gỗ Anh Đào', shapeless: ['cherry_log'], output: { itemId: 'cherry_planks', count: 4 } },
  { id: 'mangrove_planks_craft', nameVi: 'Ván Gỗ Đước', shapeless: ['mangrove_log'], output: { itemId: 'mangrove_planks', count: 4 } },
  { id: 'pale_oak_planks_craft', nameVi: 'Ván Gỗ Sồi Nhợt', shapeless: ['pale_oak_log'], output: { itemId: 'pale_oak_planks', count: 4 } },
  { id: 'bamboo_planks_craft', nameVi: 'Ván Tre', shapeless: ['bamboo_block'], output: { itemId: 'bamboo_planks', count: 2 } },
  { id: 'bamboo_block_craft', nameVi: 'Khối Tre', pattern: [['bamboo', 'bamboo', 'bamboo'], ['bamboo', 'bamboo', 'bamboo'], ['bamboo', 'bamboo', 'bamboo']], output: { itemId: 'bamboo_block', count: 1 } },
  { id: 'deepslate_bricks_craft', nameVi: 'Gạch Đá Phiến Sâu', pattern: [['cobbled_deepslate', 'cobbled_deepslate'], ['cobbled_deepslate', 'cobbled_deepslate']], output: { itemId: 'deepslate_bricks', count: 4 } },
  { id: 'tuff_bricks_craft', nameVi: 'Gạch Đá Tuff', pattern: [['tuff', 'tuff'], ['tuff', 'tuff']], output: { itemId: 'tuff_bricks', count: 4 } },
  { id: 'mud_bricks_craft', nameVi: 'Gạch Bùn', pattern: [['mud', 'mud'], ['mud', 'mud']], output: { itemId: 'mud_bricks', count: 4 } },
  { id: 'resin_block_craft', nameVi: 'Khối Nhựa Cây', pattern: [['resin_clump', 'resin_clump', 'resin_clump'], ['resin_clump', 'resin_clump', 'resin_clump'], ['resin_clump', 'resin_clump', 'resin_clump']], output: { itemId: 'resin_block', count: 1 } },
  { id: 'resin_bricks_craft', nameVi: 'Gạch Nhựa Cây', pattern: [['resin_brick', 'resin_brick'], ['resin_brick', 'resin_brick']], output: { itemId: 'resin_bricks', count: 4 } },
  { id: 'crafter_craft', nameVi: 'Máy Chế Tạo Tự Động', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'crafting_table', 'iron_ingot'], ['redstone', 'dropper', 'redstone']], output: { itemId: 'crafter', count: 1 } },
  { id: 'lightning_rod_craft', nameVi: 'Cột Thu Lôi', pattern: [['copper_ingot'], ['copper_ingot'], ['copper_ingot']], output: { itemId: 'lightning_rod', count: 1 } },
  { id: 'candle_craft', nameVi: 'Nến Sáp Ong', pattern: [['string'], ['honeycomb']], output: { itemId: 'candle', count: 1 } },
  { id: 'wolf_armor_craft', nameVi: 'Giáp Sói', pattern: [['armadillo_scute', null, null], ['armadillo_scute', 'armadillo_scute', 'armadillo_scute'], ['armadillo_scute', null, 'armadillo_scute']], output: { itemId: 'wolf_armor', count: 1 } },
  { id: 'copper_chain_craft', nameVi: 'Xích Đồng', pattern: [['copper_nugget'], ['copper_ingot'], ['copper_nugget']], output: { itemId: 'copper_chain', count: 1 } },
  { id: 'copper_door_craft', nameVi: 'Cửa Đồng', pattern: [['copper_ingot', 'copper_ingot'], ['copper_ingot', 'copper_ingot'], ['copper_ingot', 'copper_ingot']], output: { itemId: 'copper_door', count: 3 } },
  { id: 'copper_trapdoor_craft', nameVi: 'Cửa Sập Đồng', pattern: [['copper_ingot', 'copper_ingot'], ['copper_ingot', 'copper_ingot']], output: { itemId: 'copper_trapdoor', count: 2 } },
  { id: 'moss_carpet_craft', nameVi: 'Thảm Rêu Xanh', pattern: [['moss_block', 'moss_block']], output: { itemId: 'moss_carpet', count: 3 } },
  { id: 'packed_mud_craft', nameVi: 'Bùn Nén', shapeless: ['mud', 'wheat'], output: { itemId: 'packed_mud', count: 1 } },
  // Complete 1.17–26.4 Additional Recipes
  { id: 'polished_deepslate_craft', nameVi: 'Đá Phiến Sâu Bóng', pattern: [['cobbled_deepslate', 'cobbled_deepslate'], ['cobbled_deepslate', 'cobbled_deepslate']], output: { itemId: 'polished_deepslate', count: 4 } },
  { id: 'deepslate_tiles_craft', nameVi: 'Ngói Đá Phiến Sâu', pattern: [['deepslate_bricks', 'deepslate_bricks'], ['deepslate_bricks', 'deepslate_bricks']], output: { itemId: 'deepslate_tiles', count: 4 } },
  { id: 'cut_copper_slab_craft', nameVi: 'Phiến Đồng Cắt', pattern: [['cut_copper', 'cut_copper', 'cut_copper']], output: { itemId: 'cut_copper_slab', count: 6 } },
  { id: 'cut_copper_stairs_craft', nameVi: 'Cầu Thang Đồng Cắt', pattern: [['cut_copper', null, null], ['cut_copper', 'cut_copper', null], ['cut_copper', 'cut_copper', 'cut_copper']], output: { itemId: 'cut_copper_stairs', count: 4 } },
  { id: 'waxed_copper_craft', nameVi: 'Khối Đồng Phủ Sáp', shapeless: ['copper_block', 'honeycomb'], output: { itemId: 'waxed_copper_block', count: 1 } },
  { id: 'oak_chest_boat_craft', nameVi: 'Thuyền Có Rương', shapeless: ['oak_boat', 'chest'], output: { itemId: 'oak_chest_boat', count: 1 } },
  { id: 'decorated_pot_craft', nameVi: 'Bình Gốm Trang Trí', pattern: [[null, 'brick', null], ['brick', null, 'brick'], [null, 'brick', null]], output: { itemId: 'decorated_pot', count: 1 } },
  { id: 'oak_hanging_sign_craft', nameVi: 'Biển Treo Gỗ', pattern: [['chain', null, 'chain'], ['oak_log', 'oak_log', 'oak_log'], ['oak_log', 'oak_log', 'oak_log']], output: { itemId: 'oak_hanging_sign', count: 6 } },
  { id: 'bamboo_slab_craft', nameVi: 'Phiến Tre', pattern: [['bamboo_planks', 'bamboo_planks', 'bamboo_planks']], output: { itemId: 'bamboo_slab', count: 6 } },
  { id: 'bamboo_stairs_craft', nameVi: 'Cầu Thang Tre', pattern: [['bamboo_planks', null, null], ['bamboo_planks', 'bamboo_planks', null], ['bamboo_planks', 'bamboo_planks', 'bamboo_planks']], output: { itemId: 'bamboo_stairs', count: 4 } },
  { id: 'copper_chest_craft', nameVi: 'Rương Đồng', pattern: [['copper_ingot', 'copper_ingot', 'copper_ingot'], ['copper_ingot', 'chest', 'copper_ingot'], ['copper_ingot', 'copper_ingot', 'copper_ingot']], output: { itemId: 'copper_chest', count: 1 } },
  { id: 'copper_shelf_craft', nameVi: 'Kệ Đồng', pattern: [['copper_ingot', 'copper_ingot', 'copper_ingot'], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'copper_shelf', count: 3 } },
  { id: 'sulfur_block_craft', nameVi: 'Khối Lưu Huỳnh', pattern: [['sulfur_dust', 'sulfur_dust', 'sulfur_dust'], ['sulfur_dust', 'sulfur_dust', 'sulfur_dust'], ['sulfur_dust', 'sulfur_dust', 'sulfur_dust']], output: { itemId: 'sulfur_block', count: 1 } },
  { id: 'cinnabar_block_craft', nameVi: 'Khối Chu Sa', pattern: [['cinnabar_gem', 'cinnabar_gem', 'cinnabar_gem'], ['cinnabar_gem', 'cinnabar_gem', 'cinnabar_gem'], ['cinnabar_gem', 'cinnabar_gem', 'cinnabar_gem']], output: { itemId: 'cinnabar_block', count: 1 } },
  { id: 'snow_bricks_craft', nameVi: 'Gạch Tuyết', pattern: [['snow_block', 'snow_block'], ['snow_block', 'snow_block']], output: { itemId: 'snow_bricks', count: 4 } },
  { id: 'polished_calcite_craft', nameVi: 'Calcite Đánh Bóng', pattern: [['calcite', 'calcite'], ['calcite', 'calcite']], output: { itemId: 'polished_calcite', count: 4 } },
  { id: 'calcite_bricks_craft', nameVi: 'Gạch Calcite', pattern: [['polished_calcite', 'polished_calcite'], ['polished_calcite', 'polished_calcite']], output: { itemId: 'calcite_bricks', count: 4 } },
  { id: 'blue_harness_craft', nameVi: 'Yên Ghast Xanh', pattern: [['leather', 'leather', 'leather'], ['glass', 'blue_wool', 'glass']], output: { itemId: 'blue_harness', count: 1 } },
  { id: 'red_harness_craft', nameVi: 'Yên Ghast Đỏ', pattern: [['leather', 'leather', 'leather'], ['glass', 'red_wool', 'glass']], output: { itemId: 'red_harness', count: 1 } },
  // Wave 5 — Java Edition 26.1 Tiny Takeover & 26.3 Wilderness Bound Recipes!
  { id: 'name_tag_261_craft', nameVi: 'Thẻ Tên (26.1)', shapeless: ['paper', 'iron_nugget'], output: { itemId: 'name_tag', count: 1 } },
  { id: 'name_tag_gold_261_craft', nameVi: 'Thẻ Tên Vàng (26.1)', shapeless: ['paper', 'gold_nugget'], output: { itemId: 'name_tag', count: 1 } },
  { id: 'golden_dandelion_261_craft', nameVi: 'Bồ Công Anh Vàng (26.1)', pattern: [['gold_nugget', 'gold_nugget', 'gold_nugget'], ['gold_nugget', 'dandelion', 'gold_nugget'], ['gold_nugget', 'gold_nugget', 'gold_nugget']], output: { itemId: 'golden_dandelion', count: 1 } },
  { id: 'poplar_planks_263_craft', nameVi: 'Ván Gỗ Dương (26.3)', shapeless: ['poplar_log'], output: { itemId: 'poplar_planks', count: 4 } },
  { id: 'poplar_slab_263_craft', nameVi: 'Phiến Gỗ Dương (26.3)', pattern: [['poplar_planks', 'poplar_planks', 'poplar_planks']], output: { itemId: 'poplar_slab', count: 6 } },
  { id: 'poplar_stairs_263_craft', nameVi: 'Cầu Thang Gỗ Dương (26.3)', pattern: [['poplar_planks', null, null], ['poplar_planks', 'poplar_planks', null], ['poplar_planks', 'poplar_planks', 'poplar_planks']], output: { itemId: 'poplar_stairs', count: 4 } },
  { id: 'poplar_fence_263_craft', nameVi: 'Hàng Rào Gỗ Dương (26.3)', pattern: [['poplar_planks', 'stick', 'poplar_planks'], ['poplar_planks', 'stick', 'poplar_planks']], output: { itemId: 'poplar_fence', count: 3 } },
  { id: 'straw_bed_263_craft', nameVi: 'Giường Rơm (26.3)', pattern: [['wheat', 'wheat', 'wheat'], ['poplar_planks', 'poplar_planks', 'poplar_planks']], output: { itemId: 'straw_bed', count: 1 } },
  { id: 'straw_bed_oak_263_craft', nameVi: 'Giường Rơm Gỗ Sồi (26.3)', pattern: [['wheat', 'wheat', 'wheat'], ['oak_planks', 'oak_planks', 'oak_planks']], output: { itemId: 'straw_bed', count: 1 } },
  { id: 'cushion_263_craft', nameVi: 'Đệm Ngồi Len (26.3)', pattern: [['red_wool', 'feather', 'red_wool']], output: { itemId: 'cushion', count: 2 } },
  { id: 'white_wool_slab_263_craft', nameVi: 'Phiến Len Trắng (26.3)', pattern: [['white_wool', 'white_wool', 'white_wool']], output: { itemId: 'white_wool_slab', count: 6 } },
  { id: 'red_wool_slab_263_craft', nameVi: 'Phiến Len Đỏ (26.3)', pattern: [['red_wool', 'red_wool', 'red_wool']], output: { itemId: 'red_wool_slab', count: 6 } },
];

// =========================================================================
// 7. COMPLETE MINECRAFT SMELTING RECIPES (Including 1.17 – 26.3 Raw Ores & Resin!)
// =========================================================================
export const EXT_SMELTING_RECIPES: Record<string, string> = {
  raw_copper: 'copper_ingot',
  copper_ore: 'copper_ingot',
  deepslate_copper_ore: 'copper_ingot',
  sulfur_ore: 'sulfur_dust',
  cinnabar_ore: 'cinnabar_gem',
  raw_iron: 'iron_ingot',
  raw_gold: 'gold_ingot',
  deepslate_iron_ore: 'iron_ingot',
  deepslate_gold_ore: 'gold_ingot',
  cobbled_deepslate: 'deepslate',
  resin_clump: 'resin_brick',
  cherry_log: 'charcoal',
  mangrove_log: 'charcoal',
  pale_oak_log: 'charcoal',
  poplar_log: 'charcoal',
  stone: 'smooth_stone',
  sandstone: 'smooth_sandstone',
  red_sand: 'glass',
  red_sandstone: 'smooth_red_sandstone',
  clay_ball: 'brick',
  clay: 'terracotta',
  cactus: 'green_dye',
  kelp: 'dried_kelp',
  wet_sponge: 'sponge',
  chorus_fruit: 'popped_chorus_fruit',
  quartz_block: 'smooth_quartz',
  stone_bricks: 'cracked_stone_bricks',
  nether_bricks: 'cracked_nether_bricks',
  polished_blackstone_bricks: 'cracked_polished_blackstone_bricks',
  jungle_log: 'charcoal',
  acacia_log: 'charcoal',
  dark_oak_log: 'charcoal',
  potato: 'baked_potato',
  raw_mutton: 'cooked_mutton',
  raw_rabbit: 'cooked_rabbit',
  raw_cod: 'cooked_cod',
  raw_salmon: 'cooked_salmon',
  // Smelting metal tools/armor into nuggets (Blast Furnace / Furnace)
  iron_pickaxe: 'iron_nugget',
  iron_sword: 'iron_nugget',
  iron_axe: 'iron_nugget',
  iron_shovel: 'iron_nugget',
  iron_hoe: 'iron_nugget',
  iron_helmet: 'iron_nugget',
  iron_chestplate: 'iron_nugget',
  iron_leggings: 'iron_nugget',
  iron_boots: 'iron_nugget',
  copper_pickaxe: 'copper_nugget',
  copper_sword: 'copper_nugget',
  copper_axe: 'copper_nugget',
  copper_shovel: 'copper_nugget',
  copper_hoe: 'copper_nugget',
  copper_helmet: 'copper_nugget',
  copper_chestplate: 'copper_nugget',
  copper_leggings: 'copper_nugget',
  copper_boots: 'copper_nugget',
  chainmail_helmet: 'iron_nugget',
  chainmail_chestplate: 'iron_nugget',
  chainmail_leggings: 'iron_nugget',
  chainmail_boots: 'iron_nugget',
  golden_pickaxe: 'gold_nugget',
  golden_sword: 'gold_nugget',
  golden_axe: 'gold_nugget',
  golden_shovel: 'gold_nugget',
  golden_hoe: 'gold_nugget',
  gold_helmet: 'gold_nugget',
  gold_chestplate: 'gold_nugget',
  gold_leggings: 'gold_nugget',
  gold_boots: 'gold_nugget',
};
