import { getBlockLightEmission, isFullOpaqueCube } from './blocks';

export type LightBlockGetter = (wx: number, wy: number, wz: number) => number;

// Padded local 16 + 2*PAD = 32^3 volume for true 15-level Java-style block-light & skylight BFS
export const LIGHT_PAD = 8;
export const LIGHT_DIM = 16 + LIGHT_PAD * 2; // 32
const LIGHT_VOL = LIGHT_DIM * LIGHT_DIM * LIGHT_DIM;

// Reusable typed scratch buffers (zero GC pressure during chunk meshing)
const blockLvlGrid = new Uint8Array(LIGHT_VOL);
const skyLvlGrid = new Uint8Array(LIGHT_VOL);
const lightRGrid = new Float32Array(LIGHT_VOL);
const lightGGrid = new Float32Array(LIGHT_VOL);
const lightBGrid = new Float32Array(LIGHT_VOL);
const opaqueGrid = new Uint8Array(LIGHT_VOL);
const bfsQueue = new Int32Array(LIGHT_VOL * 3);

function gridIdx(px: number, py: number, pz: number): number {
  return (py * LIGHT_DIM + pz) * LIGHT_DIM + px;
}

export interface SubchunkLightResult {
  hasBlockLights: boolean;
  hasDarkInteriors: boolean;
}

/**
 * Computes true 15-level Java-style Voxel Block-Light BFS (decay 1/block, colored RGB)
 * AND Skylight 0..15 vertical column + lateral cave propagation for a 16x16x16 subchunk.
 */
export function computeSubchunkLighting(
  xBase: number,
  yBase: number,
  zBase: number,
  getBlock: LightBlockGetter,
): SubchunkLightResult {
  let bHead = 0;
  let bTail = 0;
  let sHead = 0;
  let sTail = 0;
  let hasBlockLights = false;
  let hasDarkInteriors = false;

  const D = LIGHT_DIM;
  const D2 = D * D;

  // 1. Scan padded volume for opacity & emissive light sources
  for (let py = 0; py < D; py++) {
    const wy = yBase + py - LIGHT_PAD;
    for (let pz = 0; pz < D; pz++) {
      const wz = zBase + pz - LIGHT_PAD;
      for (let px = 0; px < D; px++) {
        const wx = xBase + px - LIGHT_PAD;
        const idx = gridIdx(px, py, pz);
        const bid = getBlock(wx, wy, wz);
        opaqueGrid[idx] = isFullOpaqueCube(bid) ? 1 : 0;
        skyLvlGrid[idx] = 0;

        const em = getBlockLightEmission(bid);
        if (em.level > 0) {
          hasBlockLights = true;
          blockLvlGrid[idx] = Math.min(15, em.level);
          lightRGrid[idx] = em.r;
          lightGGrid[idx] = em.g;
          lightBGrid[idx] = em.b;
          bfsQueue[bTail++] = idx;
        } else {
          blockLvlGrid[idx] = 0;
        }
      }
    }
  }

  // 2. Block-light 15-level BFS propagation (decay = 1 per air/transparent block)
  while (bHead < bTail) {
    const cur = bfsQueue[bHead++];
    const curLvl = blockLvlGrid[cur];
    if (curLvl <= 1) continue;
    const nextLvl = curLvl - 1;

    const py = Math.floor(cur / D2);
    const rem = cur - py * D2;
    const pz = Math.floor(rem / D);
    const px = rem - pz * D;

    const r = lightRGrid[cur];
    const g = lightGGrid[cur];
    const b = lightBGrid[cur];

    const stepB = (nx: number, ny: number, nz: number) => {
      if (nx < 0 || nx >= D || ny < 0 || ny >= D || nz < 0 || nz >= D) return;
      const nIdx = gridIdx(nx, ny, nz);
      if (opaqueGrid[nIdx]) return;
      if (nextLvl > blockLvlGrid[nIdx]) {
        blockLvlGrid[nIdx] = nextLvl;
        lightRGrid[nIdx] = r;
        lightGGrid[nIdx] = g;
        lightBGrid[nIdx] = b;
        bfsQueue[bTail++] = nIdx;
      }
    };

    stepB(px + 1, py, pz);
    stepB(px - 1, py, pz);
    stepB(px, py + 1, pz);
    stepB(px, py - 1, pz);
    stepB(px, py, pz + 1);
    stepB(px, py, pz - 1);
  }

  // 3. Vertical Skylight seeding: probe up to 24 blocks above top of padded subchunk
  // to distinguish open sky (sky=15) from covered roofs/caves (sky=0 -> receives lateral BFS)
  const topProbeY = yBase + D - LIGHT_PAD;
  for (let pz = 0; pz < D; pz++) {
    const wz = zBase + pz - LIGHT_PAD;
    for (let px = 0; px < D; px++) {
      const wx = xBase + px - LIGHT_PAD;
      let litFromAbove = true;
      // Check roof cover above subchunk (sample every 2 blocks up to +24 for speed)
      for (let probe = 0; probe < 24; probe += 2) {
        if (isFullOpaqueCube(getBlock(wx, topProbeY + probe, wz))) {
          litFromAbove = false;
          break;
        }
      }
      for (let py = D - 1; py >= 0; py--) {
        const idx = gridIdx(px, py, pz);
        if (opaqueGrid[idx]) {
          litFromAbove = false;
          continue;
        }
        if (litFromAbove) {
          skyLvlGrid[idx] = 15;
          bfsQueue[sTail++] = idx;
        } else {
          hasDarkInteriors = true;
        }
      }
    }
  }

  // 4. Lateral Skylight BFS into cave mouths, porches, and overhangs (decay = 1)
  if (hasDarkInteriors && sTail > 0) {
    while (sHead < sTail) {
      const cur = bfsQueue[sHead++];
      const curLvl = skyLvlGrid[cur];
      if (curLvl <= 1) continue;
      const nextLvl = curLvl - 1;

      const py = Math.floor(cur / D2);
      const rem = cur - py * D2;
      const pz = Math.floor(rem / D);
      const px = rem - pz * D;

      const stepS = (nx: number, ny: number, nz: number) => {
        if (nx < 0 || nx >= D || ny < 0 || ny >= D || nz < 0 || nz >= D) return;
        const nIdx = gridIdx(nx, ny, nz);
        if (opaqueGrid[nIdx]) return;
        if (nextLvl > skyLvlGrid[nIdx]) {
          skyLvlGrid[nIdx] = nextLvl;
          bfsQueue[sTail++] = nIdx;
        }
      };

      stepS(px + 1, py, pz);
      stepS(px - 1, py, pz);
      stepS(px, py + 1, pz);
      stepS(px, py - 1, pz);
      stepS(px, py, pz + 1);
      stepS(px, py, pz - 1);
    }
  }

  return { hasBlockLights, hasDarkInteriors };
}

/**
 * Samples raw block-light (0..15) and skylight (0..15) at local subchunk coords (lx, ly, lz).
 */
export function sampleVoxelLightLevels(
  lx: number,
  ly: number,
  lz: number,
): { blockLight: number; skyLight: number; r: number; g: number; b: number } {
  const px = lx + LIGHT_PAD;
  const py = ly + LIGHT_PAD;
  const pz = lz + LIGHT_PAD;
  if (px < 0 || px >= LIGHT_DIM || py < 0 || py >= LIGHT_DIM || pz < 0 || pz >= LIGHT_DIM) {
    return { blockLight: 0, skyLight: 15, r: 0, g: 0, b: 0 };
  }
  const idx = gridIdx(px, py, pz);
  const blockLight = blockLvlGrid[idx];
  const skyLight = skyLvlGrid[idx];
  return {
    blockLight,
    skyLight,
    r: blockLight > 0 ? lightRGrid[idx] : 0,
    g: blockLight > 0 ? lightGGrid[idx] : 0,
    b: blockLight > 0 ? lightBGrid[idx] : 0,
  };
}

/**
 * Computes combined vertex color multiplier & warm RGB boost for a face facing empty cell (lx, ly, lz).
 * - Open sky (skyLight=15) => skyScale = 1.0 (full crisp daylight).
 * - Deep unlit cave (skyLight=0, blockLight=0) => skyScale = 0.42 (moody cave darkness, still playable).
 * - Torch / Glowstone / Sea Lantern (blockLight=15) => restores bright warm/colored illumination!
 */
export function sampleCombinedVertexLight(
  lx: number,
  ly: number,
  lz: number,
  lightState: SubchunkLightResult,
): { skyScale: number; boostR: number; boostG: number; boostB: number } {
  if (!lightState.hasBlockLights && !lightState.hasDarkInteriors) {
    return { skyScale: 1.0, boostR: 0, boostG: 0, boostB: 0 };
  }
  const { blockLight, skyLight, r, g, b } = sampleVoxelLightLevels(lx, ly, lz);
  const effectiveLvl = Math.max(skyLight, blockLight);
  // Smooth Java-like gamma curve from 0.42 (deep unlit cave) up to 1.0 (full light 15)
  const skyScale = 0.42 + (effectiveLvl / 15) * 0.58;
  if (blockLight <= 0) {
    return { skyScale, boostR: 0, boostG: 0, boostB: 0 };
  }
  const strength = (blockLight / 15) * 0.52;
  return {
    skyScale,
    boostR: r * strength,
    boostG: g * strength,
    boostB: b * strength,
  };
}
