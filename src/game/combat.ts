/**
 * Wave 5 — Official Minecraft: Java Edition Combat Cooldown, Aerial Critical Hits & Sweeping Edge.
 */

export function getWeaponAttackSpeed(itemId?: string | null): number {
  if (!itemId) return 4.0; // Bare hand / block: 4.0 attacks/sec
  if (itemId === 'mace') return 0.6;
  if (itemId.endsWith('_axe')) return 1.0;
  if (itemId === 'trident') return 1.1;
  if (itemId.endsWith('_spear')) return 1.25;
  if (itemId.endsWith('_pickaxe') || itemId.endsWith('_shovel')) return 1.2;
  if (itemId.endsWith('_sword')) return 1.6;
  if (itemId.endsWith('_hoe')) return 2.5;
  return 4.0;
}

export function stepAttackCooldown(
  currentCooldown: number,
  dt: number,
  itemId?: string | null,
): number {
  const speed = getWeaponAttackSpeed(itemId);
  return Math.max(0, Math.min(1, currentCooldown + dt * speed));
}

export interface JavaMeleeInput {
  baseDamage: number;
  cooldown: number; // 0..1
  onGround: boolean;
  vy: number;
  sprinting: boolean;
  inLiquid: boolean;
  itemId?: string | null;
  sweepingLevel?: number;
}

export interface JavaMeleeResult {
  damage: number;
  isCritical: boolean;
  isSweep: boolean;
  sweepDamage: number;
  cooldownScale: number;
}

/**
 * Computes Java Edition melee attack damage:
 * - Cooldown multiplier: 0.2 + 0.8 * cooldown^2
 * - Aerial Critical Hit: !onGround && vy < -0.5 && !inLiquid && !sprinting && cooldown >= 0.85 -> 1.5x
 * - Sword Sweeping Attack: sword && onGround && !sprinting && cooldown >= 0.85 -> splash nearby mobs
 */
export function computeJavaMeleeAttack(input: JavaMeleeInput): JavaMeleeResult {
  const cd = Math.max(0, Math.min(1, input.cooldown));
  const cooldownScale = 0.2 + 0.8 * cd * cd;
  let dmg = input.baseDamage * cooldownScale;

  const isCritical =
    !input.onGround &&
    input.vy < -0.5 &&
    !input.inLiquid &&
    !input.sprinting &&
    cd >= 0.85;

  if (isCritical) {
    dmg *= 1.5;
  }

  const isSword = Boolean(input.itemId && input.itemId.endsWith('_sword'));
  const isSweep = isSword && input.onGround && !input.sprinting && cd >= 0.85;
  const sweepLv = input.sweepingLevel ?? 0;
  const sweepDamage = isSweep
    ? Math.max(1, Math.round(1 + dmg * (sweepLv / (sweepLv + 1))))
    : 0;

  return {
    damage: Math.max(1, Math.round(dmg * 10) / 10),
    isCritical,
    isSweep,
    sweepDamage,
    cooldownScale,
  };
}
