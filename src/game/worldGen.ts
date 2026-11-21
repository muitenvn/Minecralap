import { BLOCK } from './blocks';
import { SeededNoise } from './noise';
import { CHUNK_SIZE, DimensionId, SUBCHUNK_COUNT, WORLD_HEIGHT_MAX } from './types';

export const SEA_LEVEL = 62;
export const NETHER_LAVA_LEVEL = 31;

export type OverworldBiome = 'plains' | 'forest' | 'mountains' | 'desert' | 'snowy_tundra';
export type NetherBiome =
  | 'nether_wastes'
  | 'crimson_forest'
  | 'warped_forest'
  | 'soul_sand_valley'
  | 'basalt_deltas';

export type AnyBiome = OverworldBiome | NetherBiome;

export const BIOME_LABELS: Record<AnyBiome, string> = {
  plains: 'Đồng Bằng (Plains)',
  forest: 'Rừng Sồi (Forest)',
  mountains: 'Núi Đá (Mountains)',
  desert: 'Sa Mạc (Desert)',
  snowy_tundra: 'Đồng Tuyết (Snowy Tundra)',
  nether_wastes: 'Hoang Mạc Nether (Nether Wastes)',
  crimson_forest: 'Rừng Đỏ Crimson (1.16)',
  warped_forest: 'Rừng Xanh Warped (1.16)',
  soul_sand_valley: 'Thung Lũng Cát Linh Hồn (1.16)',
  basalt_deltas: 'Đồng Bằng Đá Bazan (1.16)',
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
    if (ridge > 0.38) return 'mountains';
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
    return dimension === 'overworld' ? this.getOverworldBiome(wx, wz) : this.getNetherBiome(wx, wz);
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
    const mountainW = this.smoothstep(0.24, 0.52, ridge);
    const desertW = this.smoothstep(0.22, 0.44, temp) * this.smoothstep(0.18, -0.02, moist);

    const baseH = SEA_LEVEL + 4 + cont * 15 + hill * 4;
    const desertH = SEA_LEVEL + 3 + cont * 8 + hill * 2.2;
    const blended = baseH * (1 - desertW) + desertH * desertW;
    const mountainLift = mountainW * (Math.max(0, cont + 0.38) * 30 + Math.abs(hill) * 12);

    return Math.max(20, Math.min(148, Math.floor(blended + mountainLift)));
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
    } else {
      this.fillNetherChunk(col);
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

          // Caves (Y = 8..surfY-4, safely below sea floor to avoid floating water pockets)
          const caveCeiling = surfY < SEA_LEVEL ? Math.min(surfY - 5, SEA_LEVEL - 6) : surfY - 4;
          if (y >= 8 && y < caveCeiling) {
            const c1 = this.noise.noise3D(wx * 0.055, y * 0.075, wz * 0.055);
            if (c1 > 0.6) {
              setChunkBlock(col, lx, y, lz, y <= 10 ? BLOCK.LAVA : BLOCK.AIR);
              continue;
            }
          }

          let blockId: number = BLOCK.STONE;
          if (y === surfY) {
            if (surfY < SEA_LEVEL - 1) blockId = BLOCK.SAND;
            else if (biome === 'desert') blockId = BLOCK.SAND;
            else if (biome === 'snowy_tundra') blockId = BLOCK.SNOW;
            else if (biome === 'mountains' && surfY > 94) blockId = BLOCK.SNOW;
            else if (biome === 'mountains' && surfY > 82) blockId = BLOCK.STONE;
            else blockId = BLOCK.GRASS;
          } else if (y >= surfY - 3) {
            blockId = biome === 'desert' || surfY < SEA_LEVEL ? BLOCK.SAND : BLOCK.DIRT;
          } else {
            // Minecraft 1.16 ore distribution
            const oreR = this.noise.rand3(wx, y, wz);
            if (y >= 5 && y <= 15 && oreR > 0.989) blockId = BLOCK.DIAMOND_ORE;
            else if (y >= 8 && y <= 32 && oreR > 0.985) blockId = BLOCK.GOLD_ORE;
            else if (y >= 6 && y <= 58 && oreR > 0.968) blockId = BLOCK.IRON_ORE;
            else if (y >= 10 && y <= 76 && oreR > 0.955) blockId = BLOCK.COAL_ORE;
            else if (y >= 20 && y <= 52 && oreR < 0.025) blockId = BLOCK.GRAVEL;
          }
          setChunkBlock(col, lx, y, lz, blockId);
        }

        // Fill sea up to Y = 62
        for (let y = surfY + 1; y <= SEA_LEVEL; y++) {
          setChunkBlock(col, lx, y, lz, biome === 'snowy_tundra' && y === SEA_LEVEL ? BLOCK.ICE : BLOCK.WATER);
        }

        // Trees (safe interior margin so canopy stays inside chunk cleanly)
        if (
          lx >= 2 && lx <= 13 && lz >= 2 && lz <= 13 &&
          surfY >= SEA_LEVEL + 1 &&
          (biome === 'forest' || biome === 'plains') &&
          getChunkBlock(col, lx, surfY, lz) === BLOCK.GRASS
        ) {
          const treeChance = biome === 'forest' ? 0.962 : 0.991;
          if (this.noise.rand2(wx, wz, 777) > treeChance) {
            const trunkH = 4 + Math.floor(this.noise.rand2(wx, wz, 778) * 3);
            for (let ty = 1; ty <= trunkH; ty++) {
              setChunkBlock(col, lx, surfY + ty, lz, BLOCK.OAK_LOG);
            }
            const topY = surfY + trunkH;
            // Authentic 4-layer Minecraft Oak Tree canopy (dy = -2, -1: 5x5; dy = 0: 3x3; dy = +1: + crown)
            for (let dy = -2; dy <= 1; dy++) {
              const rad = dy <= -1 ? 2 : 1;
              for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                  const isCorner = Math.abs(dx) === rad && Math.abs(dz) === rad;
                  if (dy === 1 && isCorner) continue; // Plus-shaped top crown
                  if (dy === 0 && isCorner && this.noise.rand2(wx + dx, wz + dz, 781) > 0.45) continue;
                  if (dy <= -1 && isCorner && this.noise.rand2(wx + dx, wz + dz, 782 + dy) > 0.62) continue;
                  if (dx === 0 && dz === 0 && dy <= 0) continue;
                  setChunkBlock(col, lx + dx, topY + dy, lz + dz, BLOCK.OAK_LEAVES);
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
