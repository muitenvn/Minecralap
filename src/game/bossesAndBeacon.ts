import { BLOCK, BLOCK_DEFS } from './blocks';
import { EffectId } from './types';

export const BEACON_MINERAL_KEYS = new Set<string>([
  'iron_block',
  'gold_block',
  'emerald_block',
  'diamond_block',
  'netherite_block',
]);

export const BEACON_EFFECT_ORDER: EffectId[] = [
  'speed',
  'haste',
  'resistance',
  'jump_boost',
  'strength',
  'regeneration',
];

export const BEACON_EFFECT_LABELS_VI: Record<string, string> = {
  speed: 'Tốc Độ (Speed)',
  haste: 'Đào Nhanh (Haste)',
  resistance: 'Kháng Sát Thương (Resistance)',
  jump_boost: 'Nhảy Cao (Jump Boost)',
  strength: 'Sức Mạnh (Strength)',
  regeneration: 'Hồi Máu (Regeneration)',
};

export interface BeaconEvaluation {
  tier: number; // 0 (inactive) .. 4 (full 9x9 pyramid)
  radius: number; // 20, 30, 40, 50 blocks
  maxAmplifier: number; // 0 for tier 1..3, 1 (level II) for tier 4
  unlockedEffects: EffectId[];
}

function isSoulBlock(blockId: number): boolean {
  return blockId === BLOCK.SOUL_SAND || blockId === BLOCK.SOUL_SOIL;
}

/**
 * Checks whether placing a Wither Skeleton Skull at (sx, sy, sz) completes the classic
 * Java Edition T-shape Soul Sand / Soul Soil Wither summoning altar!
 *
 * Pattern (along X or Z axis):
 *   Row y-1: [Soul, Soul, Soul]  (armL, center, armR)
 *   Row y-2: [Air,  Soul, Air ]  (base)
 * Returns the 4 soul block coordinates to consume when valid, or null if not matched.
 */
export function checkWitherSummonPattern(
  getBlock: (x: number, y: number, z: number) => number,
  sx: number,
  sy: number,
  sz: number,
): [number, number, number][] | null {
  const cy = sy - 1;
  const by = sy - 2;
  if (by < 1) return null;

  // Check center stem directly underneath skull (or either side of the T)
  for (const axis of ['x', 'z'] as const) {
    for (const shift of [-1, 0, 1]) {
      const cx = axis === 'x' ? sx + shift : sx;
      const cz = axis === 'z' ? sz + shift : sz;
      const arm1: [number, number, number] = axis === 'x' ? [cx - 1, cy, cz] : [cx, cy, cz - 1];
      const arm2: [number, number, number] = axis === 'x' ? [cx + 1, cy, cz] : [cx, cy, cz + 1];
      const center: [number, number, number] = [cx, cy, cz];
      const base: [number, number, number] = [cx, by, cz];

      if (
        isSoulBlock(getBlock(...center)) &&
        isSoulBlock(getBlock(...arm1)) &&
        isSoulBlock(getBlock(...arm2)) &&
        isSoulBlock(getBlock(...base))
      ) {
        return [base, center, arm1, arm2];
      }
    }
  }

  return null;
}

/**
 * Evaluates a Beacon pyramid beneath (bx, by, bz) according to official Java Edition tiers:
 * - Tier 1: 3x3 mineral base at by-1 (radius 20, Speed / Haste)
 * - Tier 2: + 5x5 at by-2 (radius 30, + Resistance / Jump Boost)
 * - Tier 3: + 7x7 at by-3 (radius 40, + Strength)
 * - Tier 4: + 9x9 at by-4 (radius 50, + Regeneration & Level II amplifier)
 */
export function evaluateBeaconPyramid(
  getBlock: (x: number, y: number, z: number) => number,
  bx: number,
  by: number,
  bz: number,
): BeaconEvaluation {
  let tier = 0;

  for (let level = 1; level <= 4; level++) {
    const y = by - level;
    if (y < 1) break;
    let solidLayer = true;
    for (let dx = -level; dx <= level && solidLayer; dx++) {
      for (let dz = -level; dz <= level; dz++) {
        const key = BLOCK_DEFS[getBlock(bx + dx, y, bz + dz)]?.key;
        if (!key || !BEACON_MINERAL_KEYS.has(key)) {
          solidLayer = false;
          break;
        }
      }
    }
    if (!solidLayer) break;
    tier = level;
  }

  if (tier === 0) {
    return { tier: 0, radius: 0, maxAmplifier: 0, unlockedEffects: [] };
  }

  const unlockedEffects: EffectId[] = ['speed', 'haste'];
  if (tier >= 2) unlockedEffects.push('resistance', 'jump_boost');
  if (tier >= 3) unlockedEffects.push('strength');
  if (tier >= 4) unlockedEffects.push('regeneration');

  return {
    tier,
    radius: 10 + tier * 10,
    maxAmplifier: tier >= 4 ? 1 : 0,
    unlockedEffects,
  };
}
