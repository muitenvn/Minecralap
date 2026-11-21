import { BLOCK, BLOCK_BY_KEY, BLOCK_DEFS, ITEM_DEFS } from './blocks';
import { ItemStack } from './types';

export type NoteInstrument =
  | 'harp'
  | 'bass'
  | 'basedrum'
  | 'snare'
  | 'hat'
  | 'bell'
  | 'chime'
  | 'bit'
  | 'xylophone'
  | 'trumpet'; // Java Edition 26.1 Tiny Takeover (Note Block on Copper blocks!)

export const NOTE_INSTRUMENT_LABELS: Record<NoteInstrument, string> = {
  harp: 'Đàn Hạc',
  bass: 'Bass Gỗ',
  basedrum: 'Trống Bass',
  snare: 'Trống Snare',
  hat: 'Hi-Hat Kính',
  bell: 'Chuông Vàng',
  chime: 'Chuông Băng',
  bit: 'Chiptune 8-bit',
  xylophone: 'Đàn Phím Xương',
  trumpet: 'Kèn Đồng (26.1)',
};

export interface RedstoneWorldAccessor {
  getBlock(x: number, y: number, z: number): number;
  setBlock(x: number, y: number, z: number, blockId: number): void;
  getState(key: string): number;
  setState(key: string, value: number): void;
  getTimeOfDay(): number;
  igniteTnt(x: number, y: number, z: number): void;
  playNote?(x: number, y: number, z: number, pitch: number, instrument: NoteInstrument): void;
  getChestSlots?(key: string): (ItemStack | null)[] | null;
  setChestSlots?(key: string, slots: (ItemStack | null)[]): void;
  onDispense?(x: number, y: number, z: number, itemId: string, dir: [number, number, number]): void;
}

export function makeCoordKey(x: number, y: number, z: number): string {
  return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

const NEIGHBORS_6: readonly [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const IMMOVABLE_KEYS = new Set<string>([
  'air',
  'bedrock',
  'obsidian',
  'crying_obsidian',
  'respawn_anchor',
  'end_portal',
  'end_portal_frame',
  'end_gateway',
  'command_block',
  'chest',
  'ender_chest',
  'trapped_chest',
  'furnace',
  'enchanting_table',
  'brewing_stand',
  'spawner',
  'water',
  'lava',
]);

export function isCopperBlockKey(key: string): boolean {
  return (
    key.includes('copper_block') ||
    key.includes('cut_copper') ||
    key === 'copper_bulb' ||
    key === 'copper_grate' ||
    key === 'exposed_copper' ||
    key === 'weathered_copper' ||
    key === 'oxidized_copper' ||
    key === 'chiseled_copper'
  );
}

export function detectNoteInstrument(underBlockKey: string): NoteInstrument {
  if (!underBlockKey) return 'harp';
  if (isCopperBlockKey(underBlockKey)) return 'trumpet';
  if (underBlockKey === 'gold_block') return 'bell';
  if (underBlockKey === 'emerald_block') return 'bit';
  if (underBlockKey === 'packed_ice' || underBlockKey === 'blue_ice') return 'chime';
  if (underBlockKey === 'bone_block') return 'xylophone';
  if (
    underBlockKey.includes('glass') ||
    underBlockKey === 'sea_lantern' ||
    underBlockKey === 'beacon'
  ) {
    return 'hat';
  }
  if (
    underBlockKey.includes('sand') ||
    underBlockKey === 'gravel' ||
    underBlockKey.endsWith('_concrete_powder')
  ) {
    return 'snare';
  }
  if (
    underBlockKey.includes('log') ||
    underBlockKey.includes('planks') ||
    underBlockKey.includes('wood') ||
    underBlockKey.includes('stem') ||
    underBlockKey === 'note_block' ||
    underBlockKey === 'bookshelf' ||
    underBlockKey === 'crafting_table'
  ) {
    return 'bass';
  }
  if (
    underBlockKey.includes('stone') ||
    underBlockKey.includes('deepslate') ||
    underBlockKey.includes('brick') ||
    underBlockKey.includes('obsidian') ||
    underBlockKey.includes('netherrack') ||
    underBlockKey.includes('basalt')
  ) {
    return 'basedrum';
  }
  return 'harp';
}

export function getDirectPowerSource(
  world: RedstoneWorldAccessor,
  x: number,
  y: number,
  z: number,
): number {
  const id = world.getBlock(x, y, z);
  const key = BLOCK_DEFS[id]?.key;
  if (!key) return 0;

  if (key === 'redstone_block' || key === 'redstone_torch') return 15;
  if (key === 'lever' || key === 'oak_pressure_plate' || key === 'stone_pressure_plate' || key === 'observer' || key === 'target') {
    return world.getState(makeCoordKey(x, y, z)) > 0 ? 15 : 0;
  }
  if (key === 'daylight_detector') {
    const t = ((world.getTimeOfDay() % 24000) + 24000) % 24000;
    return t < 12500 || t > 23500 ? 12 : 0;
  }
  return 0;
}

/**
 * Computes Java-like 0..15 redstone signal strength arriving at (tx, ty, tz)
 * via BFS over nearby sources, redstone_wire (decay 1/block), and repeaters (boost to 15).
 */
export function computeRedstonePowerAt(
  world: RedstoneWorldAccessor,
  tx: number,
  ty: number,
  tz: number,
): number {
  const own = getDirectPowerSource(world, tx, ty, tz);
  if (own >= 15) return 15;

  // Bounded local BFS (radius 15) from all power sources around target
  const maxRadius = 15;
  const powerMap = new Map<string, number>();
  const queue: [number, number, number, number][] = [];

  for (let dx = -maxRadius; dx <= maxRadius; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dz = -maxRadius; dz <= maxRadius; dz++) {
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > maxRadius) continue;
        const sx = tx + dx;
        const sy = ty + dy;
        const sz = tz + dz;
        const p = getDirectPowerSource(world, sx, sy, sz);
        if (p > 0) {
          const k = makeCoordKey(sx, sy, sz);
          powerMap.set(k, p);
          queue.push([sx, sy, sz, p]);
        }
      }
    }
  }

  let bestAtTarget = own;
  let head = 0;

  while (head < queue.length) {
    const [cx, cy, cz, p] = queue[head++];
    if (cx === tx && cy === ty && cz === tz && p > bestAtTarget) {
      bestAtTarget = p;
    }
    if (p <= 1) continue;

    for (const [nx, ny, nz] of NEIGHBORS_6) {
      const xx = cx + nx;
      const yy = cy + ny;
      const zz = cz + nz;
      if (Math.abs(xx - tx) + Math.abs(yy - ty) + Math.abs(zz - tz) > maxRadius + 1) continue;

      const nbId = world.getBlock(xx, yy, zz);
      const nbKey = BLOCK_DEFS[nbId]?.key;
      if (!nbKey) continue;

      // Target itself receives power directly from any adjacent powered wire/source/repeater
      if (xx === tx && yy === ty && zz === tz) {
        const received = nbKey === 'redstone_wire' ? p - 1 : p;
        if (received > bestAtTarget) bestAtTarget = received;
        continue;
      }

      if (nbKey === 'redstone_wire') {
        const nextP = p - 1;
        const nk = makeCoordKey(xx, yy, zz);
        if (nextP > (powerMap.get(nk) ?? 0)) {
          powerMap.set(nk, nextP);
          queue.push([xx, yy, zz, nextP]);
        }
      } else if (nbKey === 'repeater') {
        const nextP = 15;
        const nk = makeCoordKey(xx, yy, zz);
        if (nextP > (powerMap.get(nk) ?? 0)) {
          powerMap.set(nk, nextP);
          queue.push([xx, yy, zz, nextP]);
        }
      }
    }
  }

  return Math.max(0, Math.min(15, bestAtTarget));
}

export function playNoteBlock(
  world: RedstoneWorldAccessor,
  x: number,
  y: number,
  z: number,
  incrementPitch = true,
): { pitch: number; instrument: NoteInstrument; labelVi: string } {
  const key = makeCoordKey(x, y, z);
  const cur = world.getState(`note:${key}`);
  const pitch = incrementPitch ? (cur + 1) % 25 : cur % 25;
  world.setState(`note:${key}`, pitch);

  const underId = world.getBlock(x, y - 1, z);
  const underKey = BLOCK_DEFS[underId]?.key ?? 'air';
  const instrument = detectNoteInstrument(underKey);
  world.playNote?.(x, y, z, pitch, instrument);
  return {
    pitch,
    instrument,
    labelVi: NOTE_INSTRUMENT_LABELS[instrument],
  };
}

/**
 * Piston / Sticky Piston push & retract mechanics (up to 12 blocks, respects immovable blocks).
 */
export function activatePiston(
  world: RedstoneWorldAccessor,
  x: number,
  y: number,
  z: number,
  dx: number,
  dy: number,
  dz: number,
  sticky: boolean,
  retract = false,
): boolean {
  if (retract) {
    if (!sticky) return false;
    const pullX = x + dx * 2;
    const pullY = y + dy * 2;
    const pullZ = z + dz * 2;
    const destX = x + dx;
    const destY = y + dy;
    const destZ = z + dz;
    const pullId = world.getBlock(pullX, pullY, pullZ);
    const pullKey = BLOCK_DEFS[pullId]?.key ?? 'air';
    if (pullId === BLOCK.AIR || IMMOVABLE_KEYS.has(pullKey)) return false;
    if (world.getBlock(destX, destY, destZ) !== BLOCK.AIR) return false;
    world.setBlock(destX, destY, destZ, pullId);
    world.setBlock(pullX, pullY, pullZ, BLOCK.AIR);
    return true;
  }

  // Push up to 12 blocks along (dx, dy, dz)
  const chain: { x: number; y: number; z: number; id: number }[] = [];
  for (let i = 1; i <= 12; i++) {
    const cx = x + dx * i;
    const cy = y + dy * i;
    const cz = z + dz * i;
    const id = world.getBlock(cx, cy, cz);
    if (id === BLOCK.AIR) break;
    const key = BLOCK_DEFS[id]?.key ?? 'air';
    if (IMMOVABLE_KEYS.has(key)) return false;
    chain.push({ x: cx, y: cy, z: cz, id });
  }

  if (chain.length === 0) return false;
  // Verify space right after the chain is empty (and within 12 block limit)
  const endX = x + dx * (chain.length + 1);
  const endY = y + dy * (chain.length + 1);
  const endZ = z + dz * (chain.length + 1);
  if (world.getBlock(endX, endY, endZ) !== BLOCK.AIR) return false;

  // Shift blocks from far end back toward piston
  for (let i = chain.length - 1; i >= 0; i--) {
    const item = chain[i];
    world.setBlock(item.x + dx, item.y + dy, item.z + dz, item.id);
  }
  world.setBlock(x + dx, y + dy, z + dz, BLOCK.AIR);
  return true;
}

export function updateRedstoneNetworkAround(
  world: RedstoneWorldAccessor,
  cx: number,
  cy: number,
  cz: number,
  pistonDir: [number, number, number] = [0, 1, 0],
): { updatedBlocks: number; ignitedTnt: number } {
  const lampOffId = BLOCK_BY_KEY['redstone_lamp']?.id;
  const lampOnId = BLOCK_BY_KEY['redstone_lamp_on']?.id;
  let updatedBlocks = 0;
  let ignitedTnt = 0;

  // Scan within 12-block radius for redstone consumers
  const R = 12;
  for (let dx = -R; dx <= R; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dz = -R; dz <= R; dz++) {
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > R) continue;
        const x = cx + dx;
        const y = cy + dy;
        const z = cz + dz;
        const id = world.getBlock(x, y, z);
        const key = BLOCK_DEFS[id]?.key;
        if (!key) continue;

        if (key === 'redstone_lamp' || key === 'redstone_lamp_on') {
          const p = computeRedstonePowerAt(world, x, y, z);
          if (p > 0 && lampOnId !== undefined && id !== lampOnId) {
            world.setBlock(x, y, z, lampOnId);
            updatedBlocks++;
          } else if (p === 0 && lampOffId !== undefined && id !== lampOffId) {
            world.setBlock(x, y, z, lampOffId);
            updatedBlocks++;
          }
        } else if (key === 'tnt') {
          const p = computeRedstonePowerAt(world, x, y, z);
          if (p > 0) {
            world.setBlock(x, y, z, BLOCK.AIR);
            world.igniteTnt(x, y, z);
            ignitedTnt++;
            updatedBlocks++;
          }
        } else if (key === 'note_block') {
          const p = computeRedstonePowerAt(world, x, y, z);
          const pKey = `pwr:${makeCoordKey(x, y, z)}`;
          const was = world.getState(pKey) > 0;
          world.setState(pKey, p > 0 ? 1 : 0);
          if (p > 0 && !was) {
            playNoteBlock(world, x, y, z, false);
            updatedBlocks++;
          }
        } else if (key === 'piston' || key === 'sticky_piston') {
          const p = computeRedstonePowerAt(world, x, y, z);
          const pKey = `pwr:${makeCoordKey(x, y, z)}`;
          const was = world.getState(pKey) > 0;
          world.setState(pKey, p > 0 ? 1 : 0);
          if (p > 0 && !was) {
            if (activatePiston(world, x, y, z, pistonDir[0], pistonDir[1], pistonDir[2], key === 'sticky_piston', false)) {
              updatedBlocks++;
            }
          } else if (p === 0 && was && key === 'sticky_piston') {
            if (activatePiston(world, x, y, z, pistonDir[0], pistonDir[1], pistonDir[2], true, true)) {
              updatedBlocks++;
            }
          }
        } else if (key === 'iron_door' || key === 'iron_trapdoor' || key === 'copper_bulb') {
          const p = computeRedstonePowerAt(world, x, y, z);
          const sKey = `open:${makeCoordKey(x, y, z)}`;
          const prev = world.getState(sKey);
          const next = p > 0 ? 1 : 0;
          if (prev !== next) {
            world.setState(sKey, next);
            updatedBlocks++;
          }
        } else if (key === 'dispenser') {
          const p = computeRedstonePowerAt(world, x, y, z);
          const pKey = `pwr:${makeCoordKey(x, y, z)}`;
          const was = world.getState(pKey) > 0;
          world.setState(pKey, p > 0 ? 1 : 0);
          if (p > 0 && !was) {
            if (triggerDispenser(world, x, y, z, pistonDir[0], pistonDir[1], pistonDir[2])) {
              updatedBlocks++;
            }
          }
        } else if (key === 'dropper') {
          const p = computeRedstonePowerAt(world, x, y, z);
          const pKey = `pwr:${makeCoordKey(x, y, z)}`;
          const was = world.getState(pKey) > 0;
          world.setState(pKey, p > 0 ? 1 : 0);
          if (p > 0 && !was) {
            if (triggerDropper(world, x, y, z, pistonDir[0], pistonDir[1], pistonDir[2])) {
              updatedBlocks++;
            }
          }
        }
      }
    }
  }

  return { updatedBlocks, ignitedTnt };
}

export function toggleLever(
  world: RedstoneWorldAccessor,
  x: number,
  y: number,
  z: number,
  pistonDir: [number, number, number] = [0, 1, 0],
): { active: boolean; updatedBlocks: number; ignitedTnt: number } {
  const key = makeCoordKey(x, y, z);
  const next = world.getState(key) > 0 ? 0 : 1;
  world.setState(key, next);
  const res = updateRedstoneNetworkAround(world, x, y, z, pistonDir);
  return { active: next === 1, ...res };
}

/**
 * Transfers 1 item from chest above hopper (x, y+1, z) into chest below hopper (x, y-1, z).
 * Disabled when the hopper itself is powered by redstone (authentic Java Edition hopper locking!).
 */
export function stepHopperTransfer(
  world: RedstoneWorldAccessor,
  x: number,
  y: number,
  z: number,
): boolean {
  if (!world.getChestSlots || !world.setChestSlots) return false;
  // Authentic Java mechanic: powered hopper is locked!
  if (computeRedstonePowerAt(world, x, y, z) > 0) return false;

  const srcKey = makeCoordKey(x, y + 1, z);
  const dstKey = makeCoordKey(x, y - 1, z);
  const srcSlots = world.getChestSlots(srcKey);
  const dstSlots = world.getChestSlots(dstKey);
  if (!srcSlots || !dstSlots) return false;

  const srcIdx = srcSlots.findIndex((s) => s !== null && s.count > 0);
  if (srcIdx === -1) return false;

  const srcItem = srcSlots[srcIdx]!;
  const maxStack = ITEM_DEFS[srcItem.itemId]?.maxStack ?? 64;

  // Find destination slot (stack first if non-enchanted, then empty slot)
  let dstIdx = -1;
  if (maxStack > 1 && !srcItem.enchants) {
    dstIdx = dstSlots.findIndex(
      (s) => s !== null && s.itemId === srcItem.itemId && !s.enchants && s.count < maxStack,
    );
  }
  if (dstIdx === -1) {
    dstIdx = dstSlots.findIndex((s) => s === null);
  }
  if (dstIdx === -1) return false;

  const nextSrc = srcSlots.map((s) => (s ? { ...s } : null));
  const nextDst = dstSlots.map((s) => (s ? { ...s } : null));

  const target = nextDst[dstIdx];
  if (target) {
    target.count += 1;
  } else {
    nextDst[dstIdx] = {
      itemId: srcItem.itemId,
      count: 1,
      enchants: srcItem.enchants ? { ...srcItem.enchants } : undefined,
      durability: srcItem.durability,
    };
  }

  const remaining = srcItem.count - 1;
  nextSrc[srcIdx] = remaining > 0 ? { ...srcItem, count: remaining } : null;

  world.setChestSlots(srcKey, nextSrc);
  world.setChestSlots(dstKey, nextDst);
  return true;
}

/**
 * Observer pulse (Java Edition): when an adjacent block changes, emits a 15-power pulse
 * and updates the surrounding redstone network.
 */
export function triggerObserverPulse(
  world: RedstoneWorldAccessor,
  changedX: number,
  changedY: number,
  changedZ: number,
  pistonDir: [number, number, number] = [0, 1, 0],
): { triggeredObservers: number; updatedBlocks: number; ignitedTnt: number } {
  let triggeredObservers = 0;
  let updatedBlocks = 0;
  let ignitedTnt = 0;

  for (const [dx, dy, dz] of NEIGHBORS_6) {
    const ox = changedX + dx;
    const oy = changedY + dy;
    const oz = changedZ + dz;
    const id = world.getBlock(ox, oy, oz);
    if (BLOCK_DEFS[id]?.key !== 'observer') continue;
    const oKey = makeCoordKey(ox, oy, oz);
    world.setState(oKey, 15);
    triggeredObservers++;
    const res = updateRedstoneNetworkAround(world, ox, oy, oz, pistonDir);
    updatedBlocks += res.updatedBlocks;
    ignitedTnt += res.ignitedTnt;
  }

  return { triggeredObservers, updatedBlocks, ignitedTnt };
}

/**
 * Dispenser action (Java Edition): fires arrows/TNT/water from its inventory (or shoots a default arrow if empty).
 */
export function triggerDispenser(
  world: RedstoneWorldAccessor,
  x: number,
  y: number,
  z: number,
  dx = 0,
  dy = 1,
  dz = 0,
): { dispensed: boolean; itemId: string } {
  const key = makeCoordKey(x, y, z);
  const slots = world.getChestSlots?.(key) ?? null;
  let itemId = 'arrow';

  if (slots) {
    const idx = slots.findIndex((s) => s !== null && s.count > 0);
    if (idx !== -1) {
      const picked = slots[idx]!;
      itemId = picked.itemId;
      const next = slots.map((s) => (s ? { ...s } : null));
      next[idx] = picked.count > 1 ? { ...picked, count: picked.count - 1 } : null;
      world.setChestSlots?.(key, next);
    }
  }

  const tx = x + dx;
  const ty = y + dy;
  const tz = z + dz;
  if (itemId === 'tnt') {
    world.igniteTnt(tx, ty, tz);
  } else if (itemId === 'water_bucket' && world.getBlock(tx, ty, tz) === BLOCK.AIR) {
    world.setBlock(tx, ty, tz, BLOCK.WATER);
  }
  world.onDispense?.(x, y, z, itemId, [dx, dy, dz]);
  return { dispensed: true, itemId };
}

/**
 * Dropper action (Java Edition): pushes 1 item from its storage into an adjacent container at (x+dx, y+dy, z+dz).
 */
export function triggerDropper(
  world: RedstoneWorldAccessor,
  x: number,
  y: number,
  z: number,
  dx = 0,
  dy = 1,
  dz = 0,
): boolean {
  if (!world.getChestSlots || !world.setChestSlots) return false;
  const srcKey = makeCoordKey(x, y, z);
  const dstKey = makeCoordKey(x + dx, y + dy, z + dz);
  const srcSlots = world.getChestSlots(srcKey);
  const dstSlots = world.getChestSlots(dstKey);
  if (!srcSlots || !dstSlots) return false;

  const srcIdx = srcSlots.findIndex((s) => s !== null && s.count > 0);
  if (srcIdx === -1) return false;

  const srcItem = srcSlots[srcIdx]!;
  const maxStack = ITEM_DEFS[srcItem.itemId]?.maxStack ?? 64;
  let dstIdx = -1;
  if (maxStack > 1 && !srcItem.enchants) {
    dstIdx = dstSlots.findIndex(
      (s) => s !== null && s.itemId === srcItem.itemId && !s.enchants && s.count < maxStack,
    );
  }
  if (dstIdx === -1) dstIdx = dstSlots.findIndex((s) => s === null);
  if (dstIdx === -1) return false;

  const nextSrc = srcSlots.map((s) => (s ? { ...s } : null));
  const nextDst = dstSlots.map((s) => (s ? { ...s } : null));
  const existing = nextDst[dstIdx];
  if (existing) {
    existing.count += 1;
  } else {
    nextDst[dstIdx] = {
      itemId: srcItem.itemId,
      count: 1,
      enchants: srcItem.enchants ? { ...srcItem.enchants } : undefined,
      durability: srcItem.durability,
    };
  }
  nextSrc[srcIdx] = srcItem.count > 1 ? { ...srcItem, count: srcItem.count - 1 } : null;
  world.setChestSlots(srcKey, nextSrc);
  world.setChestSlots(dstKey, nextDst);
  return true;
}

