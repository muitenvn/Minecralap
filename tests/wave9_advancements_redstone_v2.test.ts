import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADVANCEMENTS,
  getAdvancementProgress,
  unlockAdvancement,
} from '../src/game/advancements';
import { BLOCK, BLOCK_BY_KEY } from '../src/game/blocks';
import {
  makeCoordKey,
  RedstoneWorldAccessor,
  triggerDispenser,
  triggerDropper,
  triggerObserverPulse,
} from '../src/game/redstone';
import {
  createEmptyChestSlots,
  createNewWorldRecord,
  CURRENT_SAVE_SCHEMA_VERSION,
  migrateWorldSave,
} from '../src/game/storage';
import { ItemStack } from '../src/game/types';

function createMockRedstoneWorld(): {
  world: RedstoneWorldAccessor;
  blocks: Map<string, number>;
  states: Map<string, number>;
  chests: Map<string, (ItemStack | null)[]>;
  dispensed: string[];
  ignitedTnt: string[];
} {
  const blocks = new Map<string, number>();
  const states = new Map<string, number>();
  const chests = new Map<string, (ItemStack | null)[]>();
  const dispensed: string[] = [];
  const ignitedTnt: string[] = [];

  const world: RedstoneWorldAccessor = {
    getBlock: (x, y, z) => blocks.get(makeCoordKey(x, y, z)) ?? BLOCK.AIR,
    setBlock: (x, y, z, id) => {
      const k = makeCoordKey(x, y, z);
      if (id === BLOCK.AIR) blocks.delete(k);
      else blocks.set(k, id);
    },
    getState: (k) => states.get(k) ?? 0,
    setState: (k, v) => {
      if (v === 0) states.delete(k);
      else states.set(k, v);
    },
    getTimeOfDay: () => 6000,
    igniteTnt: (x, y, z) => ignitedTnt.push(makeCoordKey(x, y, z)),
    getChestSlots: (k) => chests.get(k) ?? null,
    setChestSlots: (k, slots) => chests.set(k, slots),
    onDispense: (_x, _y, _z, itemId) => dispensed.push(itemId),
  };

  return { world, blocks, states, chests, dispensed, ignitedTnt };
}

test('Wave 9: Java Advancements catalog has 22 unique advancements and unlocks idempotently', () => {
  assert.equal(ADVANCEMENTS.length, 22);
  const ids = new Set(ADVANCEMENTS.map((a) => a.id));
  assert.equal(ids.size, 22);

  let map: Record<string, number> = {};
  const first = unlockAdvancement(map, 'mine_wood', 1000);
  assert.equal(first.newlyUnlocked, true);
  assert.equal(first.def?.id, 'mine_wood');
  map = first.nextMap;

  // Second unlock of same advancement is idempotent
  const dup = unlockAdvancement(map, 'mine_wood', 2000);
  assert.equal(dup.newlyUnlocked, false);
  assert.equal(dup.nextMap.mine_wood, 1000);

  // Unlock Java 26.1 & 26.3 advancements
  map = unlockAdvancement(map, 'copper_trumpet_261', 3000).nextMap;
  map = unlockAdvancement(map, 'wilderness_263', 4000).nextMap;
  const prog = getAdvancementProgress(map);
  assert.equal(prog.unlocked, 3);
  assert.equal(prog.total, 22);
  assert.equal(prog.percent, Math.round((3 / 22) * 100));
});

test('Wave 9: Save Schema v3 initializes and migrates composterLevels, cauldronLevels, and advancements', () => {
  assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 3);
  const fresh = createNewWorldRecord({
    name: 'Schema v3 World',
    seed: 263,
    gameMode: 'survival',
    cheatsEnabled: true,
  });
  assert.equal(fresh.schemaVersion, 3);
  assert.deepEqual(fresh.composterLevels, {});
  assert.deepEqual(fresh.cauldronLevels, {});
  assert.deepEqual(fresh.advancements, {});

  // Legacy v2 world without advancements migrates safely
  const v2 = { ...fresh, schemaVersion: 2, advancements: undefined, composterLevels: undefined, cauldronLevels: undefined };
  const migrated = migrateWorldSave(v2);
  assert.equal(migrated.schemaVersion, 3);
  assert.deepEqual(migrated.advancements, {});
  assert.deepEqual(migrated.composterLevels, {});
  assert.deepEqual(migrated.cauldronLevels, {});
});

test('Wave 9: Observer detects neighbor block update and powers an adjacent Redstone Lamp', () => {
  const { world, blocks } = createMockRedstoneWorld();
  const observerId = BLOCK_BY_KEY['observer'].id;
  const lampOffId = BLOCK_BY_KEY['redstone_lamp'].id;
  const lampOnId = BLOCK_BY_KEY['redstone_lamp_on'].id;

  blocks.set(makeCoordKey(1, 64, 0), observerId);
  blocks.set(makeCoordKey(2, 64, 0), lampOffId);

  // Neighbor block at (0, 64, 0) changes -> Observer at (1, 64, 0) pulses -> Lamp turns ON
  const res = triggerObserverPulse(world, 0, 64, 0);
  assert.equal(res.triggeredObservers, 1);
  assert.equal(world.getBlock(2, 64, 0), lampOnId);
});

test('Wave 9: Dispenser fires TNT/Water/Arrows and Dropper transfers items to adjacent container', () => {
  const { world, chests, dispensed, ignitedTnt } = createMockRedstoneWorld();

  // Dispenser loaded with TNT & Water Bucket
  const dispSlots = createEmptyChestSlots();
  dispSlots[0] = { itemId: 'tnt', count: 1 };
  dispSlots[1] = { itemId: 'water_bucket', count: 1 };
  chests.set(makeCoordKey(5, 64, 5), dispSlots);

  const d1 = triggerDispenser(world, 5, 64, 5, 0, 1, 0);
  assert.equal(d1.itemId, 'tnt');
  assert.equal(ignitedTnt.length, 1);

  const d2 = triggerDispenser(world, 5, 64, 5, 0, 1, 0);
  assert.equal(d2.itemId, 'water_bucket');
  assert.equal(world.getBlock(5, 65, 5), BLOCK.WATER);
  assert.deepEqual(dispensed, ['tnt', 'water_bucket']);

  // Dropper pushes 1 diamond from (10, 64, 10) into chest at (10, 65, 10)
  const dropSrc = createEmptyChestSlots();
  dropSrc[0] = { itemId: 'diamond', count: 3 };
  const dropDst = createEmptyChestSlots();
  chests.set(makeCoordKey(10, 64, 10), dropSrc);
  chests.set(makeCoordKey(10, 65, 10), dropDst);

  const moved = triggerDropper(world, 10, 64, 10, 0, 1, 0);
  assert.equal(moved, true);
  assert.equal(chests.get(makeCoordKey(10, 64, 10))?.[0]?.count, 2);
  assert.equal(chests.get(makeCoordKey(10, 65, 10))?.[0]?.itemId, 'diamond');
  assert.equal(chests.get(makeCoordKey(10, 65, 10))?.[0]?.count, 1);
});
