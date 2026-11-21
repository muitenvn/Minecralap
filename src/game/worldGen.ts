import { BLOCK, BLOCK_BY_KEY } from './blocks';
import { SeededNoise } from './noise';
import { CHUNK_SIZE, DimensionId, SUBCHUNK_COUNT, WORLD_HEIGHT_MAX } from './types';

export const SEA_LEVEL = 62;
export const NETHER_LAVA_LEVEL = 31;

export type OverworldBiome =
  | 'plains'
  | 'forest'
  | 'cherry_grove'
  | 'pale_garden'
  | 'mangrove_swamp'
  | 'mountains'
  | 'meadow'
  | 'grove'
  | 'snowy_slopes'
  | 'jagged_peaks'
  | 'frozen_peaks'
  | 'stony_peaks'
  | 'desert'
  | 'snowy_tundra';
export type NetherBiome =
  | 'nether_wastes'
  | 'crimson_forest'
  | 'warped_forest'
  | 'soul_sand_valley'
  | 'basalt_deltas';
export type EndBiome = 'end_highlands';

export type AnyBiome = OverworldBiome | NetherBiome | EndBiome;

export const BIOME_LABELS: Record<AnyBiome, string> = {
  plains: 'Đồng Bằng (Plains)',
  forest: 'Rừng Sồi (Forest)',
  cherry_grove: 'Rừng Hoa Anh Đào (Cherry Grove)',
  pale_garden: 'Vườn Nhợt Nhạt (Pale Garden)',
  mangrove_swamp: 'Đầm Lầy Đước (Mangrove Swamp)',
  mountains: 'Núi Đá (Mountains)',
  meadow: 'Đồng Cỏ Cao Nguyên (Meadow)',
  grove: 'Rừng Thông Tuyết (Grove)',
  snowy_slopes: 'Sườn Tuyết (Snowy Slopes)',
  jagged_peaks: 'Đỉnh Núi Lởm Chởm (Jagged Peaks)',
  frozen_peaks: 'Đỉnh Núi Băng Giá (Frozen Peaks)',
  stony_peaks: 'Đỉnh Đá Vôi (Stony Peaks)',
  desert: 'Sa Mạc (Desert)',
  snowy_tundra: 'Đồng Tuyết (Snowy Tundra)',
  nether_wastes: 'Hoang Mạc Nether (Nether Wastes)',
  crimson_forest: 'Rừng Đỏ Crimson',
  warped_forest: 'Rừng Xanh Warped',
  soul_sand_valley: 'Thung Lũng Cát Linh Hồn',
  basalt_deltas: 'Đồng Bằng Đá Bazan',
  end_highlands: 'Cao Nguyên The End (End Highlands)',
};

export interface ChunkColumn {
  cx: number;
  cz: number;
  dimension: DimensionId;
  // 16 subchunks of 16x16x16 (Y = 0..255). Empty subchunks stay null (0 RAM!)
  sections: (Uint16Array | null)[];
  dirtySections: boolean[];
}

export function sectionIndex(lx: number, ly: number, lz: number): number {
  return (ly << 8) | (lz << 4) | lx;
}

export function getChunkBlock(col: ChunkColumn, lx: number, y: number, lz: number): number {
  if (y < 0 || y >= WORLD_HEIGHT_MAX) return BLOCK.AIR;
  const sec = col.sections[y >> 4];
  if (!sec) return BLOCK.AIR;
  return sec[sectionIndex(lx, y & 15, lz)];
}

export function setChunkBlock(col: ChunkColumn, lx: number, y: number, lz: number, id: number): void {
  if (y < 0 || y >= WORLD_HEIGHT_MAX) return;
  const sy = y >> 4;
  let sec = col.sections[sy];
  if (!sec) {
    if (id === BLOCK.AIR) return;
    sec = new Uint16Array(4096);
    col.sections[sy] = sec;
  }
  const idx = sectionIndex(lx, y & 15, lz);
  if (sec[idx] !== id) {
    sec[idx] = id;
    col.dirtySections[sy] = true;
  }
}

export class WorldGenerator {
  private noise: SeededNoise;
  private biomeNoise: SeededNoise;
  private detailNoise: SeededNoise;

  constructor(seed: number) {
    this.noise = new SeededNoise(seed);
    this.biomeNoise = new SeededNoise(seed ^ 0x5f3759df);
    this.detailNoise = new SeededNoise(seed ^ 0x27d4eb2d);
  }

  getOverworldBiome(wx: number, wz: number): OverworldBiome {
    const temp = this.biomeNoise.fbm2D(wx * 0.0028, wz * 0.0028, 3);
    const moist = this.detailNoise.fbm2D(wx * 0.0028 + 100, wz * 0.0028 - 100, 3);
    const ridge = this.noise.fbm2D(wx * 0.0045 + 31, wz * 0.0045 + 17, 2);
    // 1.18 Caves & Cliffs 6-tier Mountain Biomes
    if (ridge > 0.56) {
      if (temp < -0.15) return 'frozen_peaks';
      if (temp > 0.22) return 'stony_peaks';
      return 'jagged_peaks';
    }
    if (ridge > 0.42) {
      if (temp < -0.12) return moist > 0.08 ? 'grove' : 'snowy_slopes';
      return 'mountains';
    }
    if (ridge > 0.27 && moist > 0.05 && temp > -0.1) return 'cherry_grove';
    if (ridge > 0.24 && temp >= -0.1 && temp <= 0.25 && moist <= 0.05) return 'meadow';
    if (temp < -0.15 && moist > 0.24) return 'pale_garden';
    if (temp > 0.14 && moist > 0.32) return 'mangrove_swamp';
    if (temp > 0.34 && moist < 0.08) return 'desert';
    if (temp < -0.35) return 'snowy_tundra';
    if (moist > 0.12) return 'forest';
    return 'plains';
  }

  getNetherBiome(wx: number, wz: number): NetherBiome {
    const t = this.biomeNoise.fbm2D(wx * 0.0055, wz * 0.0055, 3);
    const h = this.detailNoise.fbm2D(wx * 0.0055 + 77, wz * 0.0055 - 53, 3);
    if (t > 0.22 && h > 0.05) return 'crimson_forest';
    if (t < -0.18 && h > 0.05) return 'warped_forest';
    if (t < -0.15 && h <= 0.05) return 'soul_sand_valley';
    if (t > 0.22 && h <= 0.05) return 'basalt_deltas';
    return 'nether_wastes';
  }

  getBiomeAt(dimension: DimensionId, wx: number, wz: number): AnyBiome {
    if (dimension === 'overworld') return this.getOverworldBiome(wx, wz);
    if (dimension === 'nether') return this.getNetherBiome(wx, wz);
    return 'end_highlands';
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  getOverworldSurfaceY(wx: number, wz: number): number {
    const temp = this.biomeNoise.fbm2D(wx * 0.0028, wz * 0.0028, 3);
    const moist = this.detailNoise.fbm2D(wx * 0.0028 + 100, wz * 0.0028 - 100, 3);
    const ridge = this.noise.fbm2D(wx * 0.0045 + 31, wz * 0.0045 + 17, 2);

    const cont = this.noise.fbm2D(wx * 0.006, wz * 0.006, 4);
    const hill = this.detailNoise.fbm2D(wx * 0.022, wz * 0.022, 2);

    // Smooth continuous biome weights so terrain NEVER forms artificial vertical cliff walls
    const mountainW = this.smoothstep(0.24, 0.56, ridge);
    const desertW = this.smoothstep(0.22, 0.44, temp) * this.smoothstep(0.18, -0.02, moist);

    const baseH = SEA_LEVEL + 4 + cont * 15 + hill * 4;
    const desertH = SEA_LEVEL + 3 + cont * 8 + hill * 2.2;
    const blended = baseH * (1 - desertW) + desertH * desertW;
    const mountainLift = mountainW * (Math.max(0, cont + 0.42) * 38 + Math.abs(hill) * 14);

    return Math.max(20, Math.min(168, Math.floor(blended + mountainLift)));
  }

  generateChunk(
    dimension: DimensionId,
    cx: number,
    cz: number,
    mods: Record<string, number>,
  ): ChunkColumn {
    const col: ChunkColumn = {
      cx,
      cz,
      dimension,
      sections: new Array(SUBCHUNK_COUNT).fill(null),
      dirtySections: new Array(SUBCHUNK_COUNT).fill(false),
    };

    if (dimension === 'overworld') {
      this.fillOverworldChunk(col);
    } else if (dimension === 'nether') {
      this.fillNetherChunk(col);
    } else {
      this.fillEndChunk(col);
    }

    // Apply sparse saved modifications belonging to this chunk
    const xMin = cx * CHUNK_SIZE;
    const zMin = cz * CHUNK_SIZE;
    for (const key in mods) {
      const parts = key.split(',');
      const wx = Number(parts[0]);
      const wy = Number(parts[1]);
      const wz = Number(parts[2]);
      if (wx >= xMin && wx < xMin + CHUNK_SIZE && wz >= zMin && wz < zMin + CHUNK_SIZE) {
        setChunkBlock(col, wx - xMin, wy, wz - zMin, mods[key]);
      }
    }

    for (let s = 0; s < SUBCHUNK_COUNT; s++) {
      if (col.sections[s]) col.dirtySections[s] = true;
    }
    return col;
  }

  private fillOverworldChunk(col: ChunkColumn): void {
    const xBase = col.cx * CHUNK_SIZE;
    const zBase = col.cz * CHUNK_SIZE;

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = xBase + lx;
        const wz = zBase + lz;
        const biome = this.getOverworldBiome(wx, wz);
        const surfY = this.getOverworldSurfaceY(wx, wz);

        // Bedrock Y=0..2
        setChunkBlock(col, lx, 0, lz, BLOCK.BEDROCK);
        if (this.noise.rand2(wx, wz, 1) > 0.5) setChunkBlock(col, lx, 1, lz, BLOCK.BEDROCK);

        for (let y = 1; y <= surfY; y++) {
          if (y === 1 && getChunkBlock(col, lx, 1, lz) === BLOCK.BEDROCK) continue;

          // 3D Caves, Aquifers, Sulfur Springs (26.3), and Ice Caves (26.4)
          const caveCeiling = surfY < SEA_LEVEL ? Math.min(surfY - 5, SEA_LEVEL - 6) : surfY - 4;
          const caveBiomeVal = this.detailNoise.fbm2D(wx * 0.008 + 19, wz * 0.008 - 41, 2);
          const isSulfurCaveZone = caveBiomeVal > 0.34;
          const isIceCaveZone = caveBiomeVal < -0.34;

          if (y >= 8 && y < caveCeiling) {
            const c1 = this.noise.noise3D(wx * 0.055, y * 0.075, wz * 0.055);
            if (c1 > 0.56) {
              if (y <= 10) {
                setChunkBlock(col, lx, y, lz, BLOCK.LAVA);
              } else if (y <= 26 && c1 > 0.72 && !isSulfurCaveZone) {
                // Flooded 1.18 Aquifer pocket!
                setChunkBlock(col, lx, y, lz, BLOCK.WATER);
              } else if (isSulfurCaveZone && y <= 22 && c1 > 0.68) {
                // 2026 Chaos Cubed Sulfur Spring!
                setChunkBlock(col, lx, y, lz, BLOCK.WATER);
              } else {
                setChunkBlock(col, lx, y, lz, BLOCK.AIR);
              }
              continue;
            }
          }

          const deepslateId = BLOCK_BY_KEY['deepslate']?.id ?? BLOCK.STONE;
          const dsCoalId = BLOCK_BY_KEY['deepslate_coal_ore']?.id ?? BLOCK.COAL_ORE;
          const dsCopperId = BLOCK_BY_KEY['deepslate_copper_ore']?.id ?? BLOCK.IRON_ORE;
          const dsIronId = BLOCK_BY_KEY['deepslate_iron_ore']?.id ?? BLOCK.IRON_ORE;
          const dsGoldId = BLOCK_BY_KEY['deepslate_gold_ore']?.id ?? BLOCK.GOLD_ORE;
          const dsLapisId = BLOCK_BY_KEY['deepslate_lapis_ore']?.id ?? BLOCK.LAPIS_ORE;
          const dsRedstoneId = BLOCK_BY_KEY['deepslate_redstone_ore']?.id ?? BLOCK.REDSTONE_ORE;
          const dsEmeraldId = BLOCK_BY_KEY['deepslate_emerald_ore']?.id ?? BLOCK.EMERALD_ORE;
          const dsDiamondId = BLOCK_BY_KEY['deepslate_diamond_ore']?.id ?? BLOCK.DIAMOND_ORE;
          const copperOreId = BLOCK_BY_KEY['copper_ore']?.id ?? BLOCK.IRON_ORE;
          const tuffId = BLOCK_BY_KEY['tuff']?.id ?? BLOCK.STONE;
          const amethystId = BLOCK_BY_KEY['amethyst_block']?.id ?? BLOCK.STONE;
          const calciteId = BLOCK_BY_KEY['calcite']?.id ?? BLOCK.STONE;
          const paleMossId = BLOCK_BY_KEY['pale_moss_block']?.id ?? BLOCK.GRASS;
          const mudId = BLOCK_BY_KEY['mud']?.id ?? BLOCK.DIRT;
          const sculkId = BLOCK_BY_KEY['sculk']?.id ?? deepslateId;
          const sculkSensorId = BLOCK_BY_KEY['sculk_sensor']?.id ?? sculkId;
          const dripstoneId = BLOCK_BY_KEY['dripstone_block']?.id ?? BLOCK.STONE;
          const mossId = BLOCK_BY_KEY['moss_block']?.id ?? BLOCK.GRASS;
          const suspSandId = BLOCK_BY_KEY['suspicious_sand']?.id ?? BLOCK.SAND;
          const suspGravelId = BLOCK_BY_KEY['suspicious_gravel']?.id ?? BLOCK.GRAVEL;
          const sulfurBlockId = BLOCK_BY_KEY['sulfur_block']?.id ?? BLOCK.STONE;
          const sulfurOreId = BLOCK_BY_KEY['sulfur_ore']?.id ?? BLOCK.GOLD_ORE;
          const cinnabarOreId = BLOCK_BY_KEY['cinnabar_ore']?.id ?? BLOCK.REDSTONE_ORE;
          const packedIceId = BLOCK_BY_KEY['packed_ice']?.id ?? BLOCK.ICE;
          const snowBricksId = BLOCK_BY_KEY['snow_bricks']?.id ?? BLOCK.SNOW;
          const polCalciteId = BLOCK_BY_KEY['polished_calcite']?.id ?? calciteId;

          const isDeepLayer = y <= 20 || (y <= 24 && this.noise.rand3(wx, y, wz) > (y - 20) * 0.25);
          let blockId: number = isDeepLayer ? deepslateId : BLOCK.STONE;
          if (y === surfY) {
            if (surfY < SEA_LEVEL - 1) {
              blockId = this.noise.rand2(wx, wz, 515) > 0.96 ? suspSandId : BLOCK.SAND;
            } else if (biome === 'desert') {
              blockId = this.noise.rand2(wx, wz, 516) > 0.975 ? suspSandId : BLOCK.SAND;
            } else if (biome === 'mangrove_swamp') {
              blockId = this.noise.rand2(wx, wz, 517) > 0.22 ? mudId : BLOCK.GRASS;
            } else if (biome === 'snowy_tundra' || biome === 'snowy_slopes' || biome === 'grove') {
              blockId = BLOCK.SNOW;
            } else if (biome === 'frozen_peaks') {
              blockId = this.noise.rand2(wx, wz, 518) > 0.45 ? packedIceId : BLOCK.SNOW;
            } else if (biome === 'stony_peaks') {
              blockId = this.noise.rand2(wx, wz, 519) > 0.65 ? calciteId : BLOCK.STONE;
            } else if (biome === 'jagged_peaks') {
              blockId = surfY > 98 ? BLOCK.SNOW : BLOCK.STONE;
            } else if (biome === 'pale_garden' && this.noise.rand2(wx, wz, 404) > 0.35) {
              blockId = paleMossId;
            } else if (biome === 'mountains' && surfY > 94) blockId = BLOCK.SNOW;
            else if (biome === 'mountains' && surfY > 82) blockId = BLOCK.STONE;
            else blockId = BLOCK.GRASS;
          } else if (y >= surfY - 3) {
            blockId =
              biome === 'desert' || surfY < SEA_LEVEL
                ? BLOCK.SAND
                : biome === 'mangrove_swamp'
                  ? mudId
                  : biome === 'frozen_peaks'
                    ? packedIceId
                    : biome === 'stony_peaks'
                      ? BLOCK.STONE
                      : BLOCK.DIRT;
          } else {
            // Modern Minecraft (1.18–26.4) ore, deepslate, Deep Dark, Sulfur Caves (26.3), Ice Caves (26.4)
            const oreR = this.noise.rand3(wx, y, wz);
            if (isSulfurCaveZone && y >= 12 && y <= 40) {
              if (oreR > 0.978) blockId = cinnabarOreId;
              else if (oreR > 0.935) blockId = sulfurOreId;
              else if (oreR < 0.24) blockId = sulfurBlockId;
            } else if (isIceCaveZone && y >= 14 && y <= 44) {
              if (oreR < 0.26) blockId = packedIceId;
              else if (oreR < 0.36) blockId = snowBricksId;
              else if (oreR < 0.42) blockId = polCalciteId;
            }

            if (blockId === BLOCK.STONE || blockId === deepslateId) {
              if (y >= 4 && y <= 16 && oreR > 0.988) blockId = isDeepLayer ? dsDiamondId : BLOCK.DIAMOND_ORE;
              else if (y >= 4 && y <= 24 && oreR > 0.983 && oreR <= 0.988) blockId = isDeepLayer ? dsEmeraldId : BLOCK.EMERALD_ORE;
              else if (y >= 6 && y <= 28 && oreR > 0.978 && oreR <= 0.983) blockId = isDeepLayer ? dsRedstoneId : BLOCK.REDSTONE_ORE;
              else if (y >= 8 && y <= 32 && oreR > 0.973 && oreR <= 0.978) blockId = isDeepLayer ? dsLapisId : BLOCK.LAPIS_ORE;
              else if (y >= 8 && y <= 34 && oreR > 0.968 && oreR <= 0.973) blockId = isDeepLayer ? dsGoldId : BLOCK.GOLD_ORE;
              else if (y >= 6 && y <= 58 && oreR > 0.955 && oreR <= 0.968) blockId = isDeepLayer ? dsIronId : BLOCK.IRON_ORE;
              else if (y >= 12 && y <= 70 && oreR > 0.942 && oreR <= 0.955) blockId = isDeepLayer ? dsCopperId : copperOreId;
              else if (y >= 16 && y <= 78 && oreR > 0.93 && oreR <= 0.942) blockId = isDeepLayer ? dsCoalId : BLOCK.COAL_ORE;
              else if (isDeepLayer && y <= 15 && oreR < 0.032) blockId = oreR < 0.004 ? sculkSensorId : sculkId;
              else if (isDeepLayer && oreR >= 0.032 && oreR < 0.075) blockId = tuffId;
              else if (!isDeepLayer && y >= 22 && y <= 46 && oreR < 0.016) blockId = dripstoneId;
              else if (!isDeepLayer && y >= 28 && y <= 50 && oreR >= 0.016 && oreR < 0.028) blockId = mossId;
              else if (y >= 14 && y <= 38 && oreR > 0.002 && oreR < 0.006) blockId = amethystId;
              else if (y >= 14 && y <= 38 && oreR >= 0.006 && oreR < 0.011) blockId = calciteId;
              else if (!isDeepLayer && y >= 25 && y <= 52 && oreR >= 0.028 && oreR < 0.044) {
                blockId = oreR < 0.031 ? suspGravelId : BLOCK.GRAVEL;
              }
            }
          }
          setChunkBlock(col, lx, y, lz, blockId);
        }

        // Fill sea up to Y = 62
        for (let y = surfY + 1; y <= SEA_LEVEL; y++) {
          setChunkBlock(col, lx, y, lz, (biome === 'snowy_tundra' || biome === 'frozen_peaks') && y === SEA_LEVEL ? BLOCK.ICE : BLOCK.WATER);
        }

        // Modern Surface Flora (Pink Petals, Wildflowers, Leaf Litter, Bush, Dry Grass, Eyeblossom, Firefly Bush, Cactus Flower, Pitcher Plant)
        const surfBlock = getChunkBlock(col, lx, surfY, lz);
        if (surfY >= SEA_LEVEL + 1 && getChunkBlock(col, lx, surfY + 1, lz) === BLOCK.AIR) {
          const floraR = this.noise.rand2(wx, wz, 912);
          if (biome === 'cherry_grove' && surfBlock === BLOCK.GRASS && floraR > 0.8) {
            const pId = BLOCK_BY_KEY['pink_petals']?.id;
            if (pId) setChunkBlock(col, lx, surfY + 1, lz, pId);
          } else if (biome === 'meadow' && surfBlock === BLOCK.GRASS && floraR > 0.84) {
            const wId = floraR > 0.94 ? BLOCK_BY_KEY['pitcher_plant']?.id : BLOCK_BY_KEY['wildflowers']?.id;
            if (wId) setChunkBlock(col, lx, surfY + 1, lz, wId);
          } else if (biome === 'pale_garden' && floraR > 0.93) {
            const eId = BLOCK_BY_KEY['open_eyeblossom']?.id;
            if (eId) setChunkBlock(col, lx, surfY + 1, lz, eId);
          } else if (biome === 'mangrove_swamp' && floraR > 0.93) {
            const mpId = BLOCK_BY_KEY['mangrove_propagule']?.id || BLOCK_BY_KEY['firefly_bush']?.id;
            if (mpId) setChunkBlock(col, lx, surfY + 1, lz, mpId);
          } else if (biome === 'plains' && surfBlock === BLOCK.GRASS && floraR > 0.94) {
            const wId = floraR > 0.97 ? BLOCK_BY_KEY['bush']?.id : BLOCK_BY_KEY['wildflowers']?.id;
            if (wId) setChunkBlock(col, lx, surfY + 1, lz, wId);
          } else if (biome === 'forest' && surfBlock === BLOCK.GRASS && floraR > 0.94) {
            const fId = floraR > 0.975 ? BLOCK_BY_KEY['firefly_bush']?.id : BLOCK_BY_KEY['leaf_litter']?.id;
            if (fId) setChunkBlock(col, lx, surfY + 1, lz, fId);
          } else if (biome === 'desert' && surfBlock === BLOCK.SAND && floraR > 0.97) {
            const cId = floraR > 0.985 ? BLOCK_BY_KEY['cactus_flower']?.id : BLOCK_BY_KEY['short_dry_grass']?.id;
            if (cId) setChunkBlock(col, lx, surfY + 1, lz, cId);
          }
        }

        // Trees (Oak, Cherry Grove, Pale Garden + Creaking Heart, and Mangrove Swamp + Roots!)
        const validTreeGround =
          surfBlock === BLOCK.GRASS ||
          surfBlock === (BLOCK_BY_KEY['pale_moss_block']?.id ?? -1) ||
          surfBlock === (BLOCK_BY_KEY['mud']?.id ?? -1);
        if (
          lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13 &&
          surfY >= SEA_LEVEL + 1 &&
          (biome === 'forest' ||
            biome === 'plains' ||
            biome === 'cherry_grove' ||
            biome === 'pale_garden' ||
            biome === 'mangrove_swamp') &&
          validTreeGround
        ) {
          const treeChance =
            biome === 'pale_garden'
              ? 0.948
              : biome === 'mangrove_swamp'
                ? 0.954
                : biome === 'forest'
                  ? 0.962
                  : biome === 'cherry_grove'
                    ? 0.968
                    : 0.991;
          if (this.noise.rand2(wx, wz, 777) > treeChance) {
            const logId =
              biome === 'cherry_grove'
                ? BLOCK_BY_KEY['cherry_log']?.id ?? BLOCK.OAK_LOG
                : biome === 'pale_garden'
                  ? BLOCK_BY_KEY['pale_oak_log']?.id ?? BLOCK.OAK_LOG
                  : biome === 'mangrove_swamp'
                    ? BLOCK_BY_KEY['mangrove_log']?.id ?? BLOCK.OAK_LOG
                    : BLOCK.OAK_LOG;
            const leafId =
              biome === 'cherry_grove'
                ? BLOCK_BY_KEY['cherry_leaves']?.id ?? BLOCK.OAK_LEAVES
                : biome === 'pale_garden'
                  ? BLOCK_BY_KEY['pale_oak_leaves']?.id ?? BLOCK.OAK_LEAVES
                  : biome === 'mangrove_swamp'
                    ? BLOCK_BY_KEY['mangrove_leaves']?.id ?? BLOCK.OAK_LEAVES
                    : BLOCK.OAK_LEAVES;
            const heartId = BLOCK_BY_KEY['creaking_heart']?.id ?? logId;
            const rootsId = BLOCK_BY_KEY['mangrove_roots']?.id ?? logId;

            const trunkH = 4 + Math.floor(this.noise.rand2(wx, wz, 778) * 3);
            if (biome === 'mangrove_swamp') {
              // Stilt mangrove roots around base!
              setChunkBlock(col, lx + 1, surfY + 1, lz, rootsId);
              setChunkBlock(col, lx - 1, surfY + 1, lz, rootsId);
              setChunkBlock(col, lx, surfY + 1, lz + 1, rootsId);
              setChunkBlock(col, lx, surfY + 1, lz - 1, rootsId);
            }
            for (let ty = 1; ty <= trunkH; ty++) {
              const isHeart = biome === 'pale_garden' && ty === 2 && this.noise.rand2(wx, wz, 808) > 0.65;
              setChunkBlock(col, lx, surfY + ty, lz, isHeart ? heartId : logId);
            }
            const topY = surfY + trunkH;
            // Authentic 4-layer Minecraft Tree canopy
            for (let dy = -2; dy <= 1; dy++) {
              const rad = dy <= -1 ? 2 : 1;
              for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                  const isCorner = Math.abs(dx) === rad && Math.abs(dz) === rad;
                  if (dy === 1 && isCorner) continue;
                  if (dy === 0 && isCorner && this.noise.rand2(wx + dx, wz + dz, 781) > 0.45) continue;
                  if (dy <= -1 && isCorner && this.noise.rand2(wx + dx, wz + dz, 782 + dy) > 0.62) continue;
                  if (dx === 0 && dz === 0 && dy <= 0) continue;
                  setChunkBlock(col, lx + dx, topY + dy, lz + dz, leafId);
                }
              }
            }
          }
        }
      }
    }

    // Place a 1.16 Ruined Nether Portal landmark in chunk (0, 0) at local (10..13, surfY, 10)
    // so players immediately spot a dramatic 1.16 portal frame near spawn and can light it with Flint & Steel!
    if (col.cx === 0 && col.cz === 0) {
      const px = 10;
      const pz = 10;
      const base = Math.max(SEA_LEVEL + 1, this.getOverworldSurfaceY(px + 1, pz));
      // Clear platform, ground foundation down to solid earth, and build Ruined Portal
      for (let dx = -1; dx <= 4; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const bx = px + dx;
          const bz = pz + dz;
          if (bx < 0 || bx >= 16 || bz < 0 || bz >= 16) continue;
          const patch = (dx + dz) % 3 === 0 ? BLOCK.MAGMA : BLOCK.NETHERRACK;
          setChunkBlock(col, bx, base, bz, patch);
          // Fill downward foundation so the portal platform never floats above sloped ground
          for (let fy = base - 1; fy >= Math.max(1, base - 10); fy--) {
            const existing = getChunkBlock(col, bx, fy, bz);
            if (existing !== BLOCK.AIR && existing !== BLOCK.WATER) break;
            setChunkBlock(col, bx, fy, bz, BLOCK.NETHERRACK);
          }
          for (let cy = 1; cy <= 6; cy++) setChunkBlock(col, bx, base + cy, bz, BLOCK.AIR);
        }
      }
      // 4x5 Obsidian frame (ready to ignite with starter Flint & Steel!)
      for (let i = 0; i < 4; i++) {
        setChunkBlock(col, px + i, base + 1, pz, BLOCK.OBSIDIAN);
        setChunkBlock(col, px + i, base + 5, pz, i === 1 ? BLOCK.OBSIDIAN : BLOCK.OBSIDIAN);
      }
      for (let j = 2; j <= 4; j++) {
        setChunkBlock(col, px, base + j, pz, BLOCK.OBSIDIAN);
        setChunkBlock(col, px + 3, base + j, pz, BLOCK.OBSIDIAN);
      }
      // Crying Obsidian & Gold Block accents around ruined portal
      setChunkBlock(col, px - 1, base + 1, pz, BLOCK.CRYING_OBSIDIAN);
      setChunkBlock(col, px + 4, base + 1, pz, BLOCK.GOLD_BLOCK);
      setChunkBlock(col, px + 1, base + 6, pz, BLOCK.GOLD_BLOCK);
    }

    // --- STRUCTURE 1 (1.21): TRIAL CHAMBER at chunk (2, 0) [X=32..47, Z=0..15] ---
    if (col.cx === 2 && col.cz === 0) {
      const tuffBrick = BLOCK_BY_KEY['tuff_bricks']?.id ?? BLOCK.STONE;
      const polTuff = BLOCK_BY_KEY['polished_tuff']?.id ?? BLOCK.STONE;
      const copperBlock = BLOCK_BY_KEY['copper_block']?.id ?? BLOCK.GOLD_BLOCK;
      const copperGrate = BLOCK_BY_KEY['copper_grate']?.id ?? copperBlock;
      const copperBulb = BLOCK_BY_KEY['copper_bulb']?.id ?? BLOCK.GLOWSTONE;
      const trialSp = BLOCK_BY_KEY['trial_spawner']?.id ?? BLOCK.OBSIDIAN;
      const ominSp = BLOCK_BY_KEY['ominous_trial_spawner']?.id ?? trialSp;
      const vault = BLOCK_BY_KEY['vault']?.id ?? BLOCK.CHEST;
      const ominVault = BLOCK_BY_KEY['ominous_vault']?.id ?? vault;
      const crafter = BLOCK_BY_KEY['crafter']?.id ?? BLOCK.CRAFTING_TABLE;
      const copperChest = BLOCK_BY_KEY['copper_chest']?.id ?? BLOCK.CHEST;
      const ladder = BLOCK_BY_KEY['ladder']?.id ?? BLOCK.AIR;

      const y0 = 28;
      const y1 = 36;
      for (let x = 1; x <= 14; x++) {
        for (let z = 1; z <= 14; z++) {
          for (let y = y0; y <= y1; y++) {
            const wall = x === 1 || x === 14 || z === 1 || z === 14 || y === y0 || y === y1;
            if (!wall) {
              setChunkBlock(col, x, y, z, BLOCK.AIR);
            } else if (y === y0) {
              setChunkBlock(col, x, y, z, (x + z) % 3 === 0 ? polTuff : tuffBrick);
            } else if (y === y1) {
              setChunkBlock(col, x, y, z, (x === 4 || x === 11) && (z === 4 || z === 11) ? copperBulb : copperBlock);
            } else {
              setChunkBlock(col, x, y, z, y === y0 + 3 ? copperGrate : tuffBrick);
            }
          }
        }
      }
      // Interior Trial Spawners, Vaults, Ominous Vault, Crafter & Copper Chest
      setChunkBlock(col, 5, y0 + 1, 5, trialSp);
      setChunkBlock(col, 10, y0 + 1, 10, ominSp);
      setChunkBlock(col, 7, y0 + 1, 13, vault);
      setChunkBlock(col, 8, y0 + 1, 13, ominVault);
      setChunkBlock(col, 2, y0 + 1, 7, crafter);
      setChunkBlock(col, 2, y0 + 1, 8, copperChest);
      // Surface Copper Entry Shaft at local (7, surfY, 2)
      const surf = Math.max(SEA_LEVEL + 1, this.getOverworldSurfaceY(39, 2));
      for (let y = y0 + 1; y <= surf + 4; y++) {
        setChunkBlock(col, 7, y, 2, BLOCK.AIR);
        setChunkBlock(col, 8, y, 2, BLOCK.AIR);
        if (y <= surf + 1) setChunkBlock(col, 7, y, 1, tuffBrick);
        if (ladder) setChunkBlock(col, 7, y, 2, ladder);
      }
      setChunkBlock(col, 6, surf + 1, 2, copperBlock);
      setChunkBlock(col, 9, surf + 1, 2, copperBlock);
      setChunkBlock(col, 6, surf + 2, 2, copperBulb);
      setChunkBlock(col, 9, surf + 2, 2, copperBulb);
    }

    // --- STRUCTURE 2 (1.19): ANCIENT CITY DEEP DARK SHRINE at chunk (-2, 0) [X=-32..-17, Z=0..15] ---
    if (col.cx === -2 && col.cz === 0) {
      const dsBrick = BLOCK_BY_KEY['deepslate_bricks']?.id ?? BLOCK.STONE;
      const dsTiles = BLOCK_BY_KEY['deepslate_tiles']?.id ?? dsBrick;
      const sculk = BLOCK_BY_KEY['sculk']?.id ?? dsBrick;
      const sculkCat = BLOCK_BY_KEY['sculk_catalyst']?.id ?? sculk;
      const sculkSens = BLOCK_BY_KEY['sculk_sensor']?.id ?? sculk;
      const sculkShr = BLOCK_BY_KEY['sculk_shrieker']?.id ?? sculk;
      const soulLantern = BLOCK_BY_KEY['soul_lantern']?.id ?? BLOCK.GLOWSTONE;
      const ladder = BLOCK_BY_KEY['ladder']?.id ?? BLOCK.AIR;

      const y0 = 14;
      const y1 = 23;
      for (let x = 1; x <= 14; x++) {
        for (let z = 1; z <= 14; z++) {
          for (let y = y0; y <= y1; y++) {
            const wall = x === 1 || x === 14 || z === 1 || z === 14 || y === y0 || y === y1;
            if (!wall) setChunkBlock(col, x, y, z, BLOCK.AIR);
            else if (y === y0) setChunkBlock(col, x, y, z, (x + z) % 2 === 0 ? sculk : dsTiles);
            else setChunkBlock(col, x, y, z, dsBrick);
          }
        }
      }
      setChunkBlock(col, 7, y0 + 1, 7, sculkCat);
      setChunkBlock(col, 5, y0 + 1, 7, sculkSens);
      setChunkBlock(col, 9, y0 + 1, 7, sculkShr);
      setChunkBlock(col, 7, y0 + 1, 12, BLOCK.CHEST);
      setChunkBlock(col, 3, y0 + 4, 3, soulLantern);
      setChunkBlock(col, 12, y0 + 4, 12, soulLantern);
      // Surface Soul-Lantern Entry Shaft at local (7, surfY, 2)
      const surf = Math.max(SEA_LEVEL + 1, this.getOverworldSurfaceY(-25, 2));
      for (let y = y0 + 1; y <= surf + 3; y++) {
        setChunkBlock(col, 7, y, 2, BLOCK.AIR);
        if (ladder) setChunkBlock(col, 7, y, 2, ladder);
      }
      setChunkBlock(col, 6, surf + 1, 2, dsBrick);
      setChunkBlock(col, 8, surf + 1, 2, dsBrick);
      setChunkBlock(col, 6, surf + 2, 2, soulLantern);
      setChunkBlock(col, 8, surf + 2, 2, soulLantern);
    }

    // --- STRUCTURE 3 (1.20): TRAIL RUINS ARCHAEOLOGY SITE at chunk (0, 2) [X=0..15, Z=32..47] ---
    if (col.cx === 0 && col.cz === 2) {
      const terra = BLOCK_BY_KEY['terracotta']?.id ?? BLOCK.DIRT;
      const mudBricks = BLOCK_BY_KEY['mud_bricks']?.id ?? BLOCK.BRICKS;
      const suspSand = BLOCK_BY_KEY['suspicious_sand']?.id ?? BLOCK.SAND;
      const suspGravel = BLOCK_BY_KEY['suspicious_gravel']?.id ?? BLOCK.GRAVEL;
      const decPot = BLOCK_BY_KEY['decorated_pot']?.id ?? BLOCK.BRICKS;
      const chiseledShelf = BLOCK_BY_KEY['chiseled_bookshelf']?.id ?? BLOCK.BOOKSHELF;
      const hangSign = BLOCK_BY_KEY['oak_hanging_sign']?.id ?? BLOCK.OAK_PLANKS;

      const base = Math.max(SEA_LEVEL + 1, this.getOverworldSurfaceY(7, 39));
      for (let x = 3; x <= 12; x++) {
        for (let z = 3; z <= 12; z++) {
          setChunkBlock(col, x, base, z, (x + z) % 3 === 0 ? suspGravel : (x + z) % 2 === 0 ? suspSand : mudBricks);
          for (let y = 1; y <= 5; y++) setChunkBlock(col, x, base + y, z, BLOCK.AIR);
        }
      }
      for (let y = 1; y <= 4; y++) {
        setChunkBlock(col, 4, base + y, 4, terra);
        setChunkBlock(col, 11, base + y, 4, terra);
        setChunkBlock(col, 4, base + y, 11, mudBricks);
        setChunkBlock(col, 11, base + y, 11, mudBricks);
      }
      setChunkBlock(col, 5, base + 1, 5, decPot);
      setChunkBlock(col, 10, base + 1, 5, decPot);
      setChunkBlock(col, 7, base + 1, 10, chiseledShelf);
      setChunkBlock(col, 8, base + 1, 10, chiseledShelf);
      setChunkBlock(col, 7, base + 3, 4, hangSign);
    }

    // --- STRUCTURE 4 (THE END): STRONGHOLD END PORTAL ROOM at chunk (0, -2) [X=0..15, Z=-32..-17] ---
    if (col.cx === 0 && col.cz === -2) {
      const stoneBrick = BLOCK_BY_KEY['stone_bricks']?.id ?? BLOCK.STONE;
      const mossyBrick = BLOCK_BY_KEY['mossy_stone_bricks']?.id ?? stoneBrick;
      const endFrame = BLOCK_BY_KEY['end_portal_frame']?.id ?? BLOCK.OBSIDIAN;
      const endPortal = BLOCK_BY_KEY['end_portal']?.id ?? BLOCK.NETHER_PORTAL;
      const ladder = BLOCK_BY_KEY['ladder']?.id ?? BLOCK.AIR;

      const y0 = 24;
      const y1 = 31;
      for (let x = 2; x <= 13; x++) {
        for (let z = 2; z <= 13; z++) {
          for (let y = y0; y <= y1; y++) {
            const wall = x === 2 || x === 13 || z === 2 || z === 13 || y === y0 || y === y1;
            if (!wall) setChunkBlock(col, x, y, z, BLOCK.AIR);
            else setChunkBlock(col, x, y, z, (x * 3 + z) % 5 === 0 ? mossyBrick : stoneBrick);
          }
        }
      }
      // 3x3 Live End Portal framed by 12 End Portal Frames at center (6..8, y0+2, 6..8)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          setChunkBlock(col, 7 + dx, y0 + 1, 7 + dz, BLOCK.LAVA);
          setChunkBlock(col, 7 + dx, y0 + 2, 7 + dz, endPortal);
        }
        setChunkBlock(col, 7 + dx, y0 + 2, 5, endFrame);
        setChunkBlock(col, 7 + dx, y0 + 2, 9, endFrame);
        setChunkBlock(col, 5, y0 + 2, 7 + dx, endFrame);
        setChunkBlock(col, 9, y0 + 2, 7 + dx, endFrame);
      }
      // Surface Ruin Entrance Shaft at local (7, surfY, 3)
      const surf = Math.max(SEA_LEVEL + 1, this.getOverworldSurfaceY(7, -29));
      for (let y = y0 + 1; y <= surf + 3; y++) {
        setChunkBlock(col, 7, y, 3, BLOCK.AIR);
        if (ladder) setChunkBlock(col, 7, y, 3, ladder);
      }
      setChunkBlock(col, 6, surf + 1, 3, stoneBrick);
      setChunkBlock(col, 8, surf + 1, 3, stoneBrick);
      setChunkBlock(col, 6, surf + 2, 3, BLOCK.TORCH);
      setChunkBlock(col, 8, surf + 2, 3, BLOCK.TORCH);
    }
  }

  private fillNetherChunk(col: ChunkColumn): void {
    const xBase = col.cx * CHUNK_SIZE;
    const zBase = col.cz * CHUNK_SIZE;

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = xBase + lx;
        const wz = zBase + lz;
        const biome = this.getNetherBiome(wx, wz);

        // Floor & Ceiling profiles (exact Minecraft 1.16 Nether height Y = 0..127)
        const floorN = this.noise.fbm2D(wx * 0.022, wz * 0.022, 3);
        const ceilN = this.detailNoise.fbm2D(wx * 0.024 + 41, wz * 0.024 - 19, 3);
        let floorY = Math.floor(42 + floorN * 20);
        if (biome === 'basalt_deltas') floorY += Math.floor(Math.abs(this.detailNoise.noise2D(wx * 0.14, wz * 0.14)) * 6);
        floorY = Math.max(24, Math.min(72, floorY));

        let ceilY = Math.floor(96 + ceilN * 16);
        ceilY = Math.max(floorY + 14, Math.min(118, ceilY));

        // Bottom Bedrock (Y=0..2) and Nether Roof Bedrock (Y=125..127)
        setChunkBlock(col, lx, 0, lz, BLOCK.BEDROCK);
        setChunkBlock(col, lx, 127, lz, BLOCK.BEDROCK);
        if (this.noise.rand2(wx, wz, 2) > 0.45) setChunkBlock(col, lx, 1, lz, BLOCK.BEDROCK);
        if (this.noise.rand2(wx, wz, 3) > 0.45) setChunkBlock(col, lx, 126, lz, BLOCK.BEDROCK);

        // Fill floor mass
        for (let y = 1; y <= floorY; y++) {
          if (y === 1 && getChunkBlock(col, lx, 1, lz) === BLOCK.BEDROCK) continue;

          let id: number = biome === 'basalt_deltas' ? BLOCK.BLACKSTONE : BLOCK.NETHERRACK;
          if (y === floorY && floorY >= NETHER_LAVA_LEVEL) {
            if (biome === 'crimson_forest') id = BLOCK.CRIMSON_NYLIUM;
            else if (biome === 'warped_forest') id = BLOCK.WARPED_NYLIUM;
            else if (biome === 'soul_sand_valley') id = this.noise.rand2(wx, wz, 40) > 0.45 ? BLOCK.SOUL_SAND : BLOCK.SOUL_SOIL;
            else if (biome === 'basalt_deltas') id = this.noise.rand2(wx, wz, 41) > 0.78 ? BLOCK.MAGMA : BLOCK.BASALT;
          } else if (biome === 'soul_sand_valley' && y >= floorY - 3) {
            id = BLOCK.SOUL_SOIL;
          } else {
            // 1.16 Nether Ores: Ancient Debris (Y = 8..22!), Nether Quartz, Nether Gold, Gilded Blackstone
            const r = this.noise.rand3(wx, y, wz);
            if (y >= 8 && y <= 22 && r > 0.986) id = BLOCK.ANCIENT_DEBRIS;
            else if (biome === 'basalt_deltas' && r > 0.968) id = BLOCK.GILDED_BLACKSTONE;
            else if (r > 0.965) id = BLOCK.NETHER_GOLD_ORE;
            else if (r > 0.945) id = BLOCK.NETHER_QUARTZ_ORE;
          }
          setChunkBlock(col, lx, y, lz, id);
        }

        // Lava sea up to Y = 31
        for (let y = floorY + 1; y <= NETHER_LAVA_LEVEL; y++) {
          setChunkBlock(col, lx, y, lz, BLOCK.LAVA);
        }

        // Ceiling mass (ceilY..126)
        for (let y = ceilY; y <= 126; y++) {
          if (y === 126 && getChunkBlock(col, lx, 126, lz) === BLOCK.BEDROCK) continue;
          const r = this.noise.rand3(wx, y, wz);
          let id: number = biome === 'basalt_deltas' ? BLOCK.BLACKSTONE : BLOCK.NETHERRACK;
          if (y === ceilY && r > 0.96) id = BLOCK.GLOWSTONE;
          else if (r > 0.975) id = BLOCK.NETHER_QUARTZ_ORE;
          setChunkBlock(col, lx, y, lz, id);
        }

        // Biome surface features (interior margin)
        if (lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13 && floorY > NETHER_LAVA_LEVEL + 1 && floorY < ceilY - 9) {
          const featR = this.noise.rand2(wx, wz, 555);
          if ((biome === 'crimson_forest' || biome === 'warped_forest') && featR > 0.964) {
            // Huge Crimson / Warped Fungus with Shroomlight!
            const stemBlock = biome === 'crimson_forest' ? BLOCK.CRIMSON_STEM : BLOCK.WARPED_STEM;
            const wartBlock = biome === 'crimson_forest' ? BLOCK.NETHER_WART_BLOCK : BLOCK.WARPED_WART_BLOCK;
            const h = 5 + Math.floor(this.noise.rand2(wx, wz, 556) * 3);
            for (let ty = 1; ty <= h; ty++) setChunkBlock(col, lx, floorY + ty, lz, stemBlock);
            const capY = floorY + h;
            for (let dy = -1; dy <= 1; dy++) {
              const rad = dy === 1 ? 1 : 2;
              for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                  if (dx === 0 && dz === 0 && dy <= 0) continue;
                  const isLight = dy === -1 && Math.abs(dx) === 1 && dz === 0;
                  setChunkBlock(col, lx + dx, capY + dy, lz + dz, isLight ? BLOCK.SHROOMLIGHT : wartBlock);
                }
              }
            }
          } else if (biome === 'soul_sand_valley' && featR > 0.968) {
            // Soul Fire patch or Bone Block fossil rib
            if (featR > 0.985) {
              for (let by = 1; by <= 4; by++) setChunkBlock(col, lx, floorY + by, lz, BLOCK.BONE_BLOCK);
              setChunkBlock(col, lx + 1, floorY + 4, lz, BLOCK.BONE_BLOCK);
              setChunkBlock(col, lx - 1, floorY + 4, lz, BLOCK.BONE_BLOCK);
            } else {
              setChunkBlock(col, lx, floorY + 1, lz, BLOCK.SOUL_FIRE);
            }
          } else if (biome === 'basalt_deltas' && featR > 0.955) {
            // Tall Basalt pillar
            const ph = 3 + Math.floor(this.noise.rand2(wx, wz, 559) * 6);
            for (let py = 1; py <= ph; py++) setChunkBlock(col, lx, floorY + py, lz, BLOCK.BASALT);
          }
        }
      }
    }
  }

  private fillEndChunk(col: ChunkColumn): void {
    const xBase = col.cx * CHUNK_SIZE;
    const zBase = col.cz * CHUNK_SIZE;
    const endStone = BLOCK_BY_KEY['end_stone']?.id ?? BLOCK.SAND;
    const endPortal = BLOCK_BY_KEY['end_portal']?.id ?? BLOCK.NETHER_PORTAL;
    const endGateway = BLOCK_BY_KEY['end_gateway']?.id ?? endPortal;
    const purpur = BLOCK_BY_KEY['purpur_block']?.id ?? BLOCK.OBSIDIAN;
    const purpurPillar = BLOCK_BY_KEY['purpur_pillar']?.id ?? purpur;
    const endRod = BLOCK_BY_KEY['end_rod']?.id ?? BLOCK.TORCH;
    const seaLantern = BLOCK_BY_KEY['sea_lantern']?.id ?? BLOCK.GLOWSTONE;

    // 8 Obsidian Pillars ring around (0, 0) at radius 22
    const pillars: { x: number; z: number; h: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      pillars.push({
        x: Math.round(Math.cos(ang) * 22),
        z: Math.round(Math.sin(ang) * 22),
        h: 18 + (i % 4) * 3,
      });
    }

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = xBase + lx;
        const wz = zBase + lz;
        const dist = Math.hypot(wx, wz);

        // 1. Central End Main Island (radius 40)
        if (dist < 40) {
          const edge = 1 - dist / 40;
          const hill = this.noise.fbm2D(wx * 0.04, wz * 0.04, 2) * 3.5;
          const topY = Math.floor(58 + edge * 4 + hill);
          const botY = Math.floor(56 - edge * 14);
          for (let y = botY; y <= topY; y++) {
            setChunkBlock(col, lx, y, lz, endStone);
          }

          // Central Exit Bedrock Portal Fountain at (0, 62, 0)
          if (Math.abs(wx) <= 2 && Math.abs(wz) <= 2) {
            const isRim = Math.abs(wx) === 2 || Math.abs(wz) === 2;
            const isCenter = wx === 0 && wz === 0;
            setChunkBlock(col, lx, 61, lz, BLOCK.BEDROCK);
            setChunkBlock(col, lx, 62, lz, isRim || isCenter ? BLOCK.BEDROCK : endPortal);
            if (isCenter) {
              setChunkBlock(col, lx, 63, lz, BLOCK.BEDROCK);
              setChunkBlock(col, lx, 64, lz, BLOCK.BEDROCK);
              setChunkBlock(col, lx, 65, lz, BLOCK.TORCH);
            }
          }

          // Obsidian Pillars with glowing End Crystal beacons
          for (const p of pillars) {
            if (Math.abs(wx - p.x) <= 1 && Math.abs(wz - p.z) <= 1) {
              for (let y = topY; y <= topY + p.h; y++) {
                setChunkBlock(col, lx, y, lz, BLOCK.OBSIDIAN);
              }
              if (wx === p.x && wz === p.z) {
                setChunkBlock(col, lx, topY + p.h + 1, lz, BLOCK.BEDROCK);
                setChunkBlock(col, lx, topY + p.h + 2, lz, BLOCK.CRYING_OBSIDIAN);
                setChunkBlock(col, lx, topY + p.h + 3, lz, seaLantern);
              }
            }
          }

          // Floating End Gateway Portal at (32, 66, 0) -> teleports to Outer End City Islands!
          if (wx === 32 && wz === 0) {
            setChunkBlock(col, lx, 65, lz, BLOCK.BEDROCK);
            setChunkBlock(col, lx, 66, lz, endGateway);
            setChunkBlock(col, lx, 67, lz, BLOCK.BEDROCK);
          }
        } else if (dist > 72) {
          // 2. Outer End Islands
          const islandN = this.noise.fbm2D(wx * 0.025, wz * 0.025, 3);
          if (islandN > 0.16) {
            const thick = Math.floor((islandN - 0.16) * 26);
            const topY = 60 + Math.floor(thick * 0.4);
            const botY = Math.max(46, 58 - thick);
            for (let y = botY; y <= topY; y++) {
              setChunkBlock(col, lx, y, lz, endStone);
            }
          }
        }
      }
    }

    // 3. Outer End City Purpur Tower at chunk (6, 0) [X=96..111, Z=0..15]
    if (col.cx === 6 && col.cz === 0) {
      for (let x = 2; x <= 13; x++) {
        for (let z = 2; z <= 13; z++) {
          for (let y = 56; y <= 60; y++) setChunkBlock(col, x, y, z, endStone);
        }
      }
      for (let y = 61; y <= 76; y++) {
        for (let x = 4; x <= 11; x++) {
          for (let z = 4; z <= 11; z++) {
            const wall = x === 4 || x === 11 || z === 4 || z === 11 || y === 61 || y === 76;
            if (!wall) setChunkBlock(col, x, y, z, BLOCK.AIR);
            else {
              const corner = (x === 4 || x === 11) && (z === 4 || z === 11);
              setChunkBlock(col, x, y, z, corner ? purpurPillar : purpur);
            }
          }
        }
      }
      // Doorway, End Rods & Treasure Chest
      setChunkBlock(col, 7, 62, 4, BLOCK.AIR);
      setChunkBlock(col, 8, 62, 4, BLOCK.AIR);
      setChunkBlock(col, 7, 63, 4, BLOCK.AIR);
      setChunkBlock(col, 8, 63, 4, BLOCK.AIR);
      setChunkBlock(col, 6, 63, 3, endRod);
      setChunkBlock(col, 9, 63, 3, endRod);
      setChunkBlock(col, 7, 62, 9, BLOCK.CHEST);
      setChunkBlock(col, 8, 62, 9, BLOCK_BY_KEY['shulker_box']?.id ?? BLOCK.CHEST);
    }
  }

  locateNearestBiome(
    dimension: DimensionId,
    targetBiome: AnyBiome,
    startX: number,
    startZ: number,
  ): [number, number] | null {
    const step = 32;
    for (let r = 0; r <= 64; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const x = Math.floor(startX) + dx * step;
          const z = Math.floor(startZ) + dz * step;
          if (this.getBiomeAt(dimension, x, z) === targetBiome) {
            return [x, z];
          }
        }
      }
    }
    return null;
  }
}
