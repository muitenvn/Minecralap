import assert from 'node:assert/strict';
import test from 'node:test';
import { ADVANCEMENTS } from '../src/game/advancements';
import { BLOCK, BLOCK_BY_KEY, ITEM_DEFS } from '../src/game/blocks';
import {
  checkWitherSummonPattern,
  evaluateBeaconPyramid,
} from '../src/game/bossesAndBeacon';
import { CommandContext, executeCommand } from '../src/game/commands';
import { MOB_SPECS } from '../src/game/mobs';
import { DEFAULT_GAMERULES } from '../src/game/types';

function createBlockGrid(): {
  getBlock: (x: number, y: number, z: number) => number;
  setBlock: (x: number, y: number, z: number, id: number) => void;
} {
  const map = new Map<string, number>();
  return {
    getBlock: (x, y, z) => map.get(`${x},${y},${z}`) ?? BLOCK.AIR,
    setBlock: (x, y, z, id) => {
      const k = `${x},${y},${z}`;
      if (id === BLOCK.AIR) map.delete(k);
      else map.set(k, id);
    },
  };
}

test('Wave 12: Wither Soul Sand / Soul Soil T-shape summoning altar validates X/Z orientation and rejects incomplete frames', () => {
  const { getBlock, setBlock } = createBlockGrid();

  // Build X-axis T-shape centered at (0, 65, 0)
  setBlock(0, 64, 0, BLOCK.SOUL_SAND); // base
  setBlock(0, 65, 0, BLOCK.SOUL_SOIL); // center
  setBlock(-1, 65, 0, BLOCK.SOUL_SAND); // left arm
  setBlock(1, 65, 0, BLOCK.SOUL_SOIL); // right arm

  const matchCenter = checkWitherSummonPattern(getBlock, 0, 66, 0);
  assert.ok(matchCenter && matchCenter.length === 4);

  const matchSideSkull = checkWitherSummonPattern(getBlock, -1, 66, 0);
  assert.ok(matchSideSkull && matchSideSkull.length === 4);

  // Removing right arm invalidates pattern
  setBlock(1, 65, 0, BLOCK.AIR);
  assert.equal(checkWitherSummonPattern(getBlock, 0, 66, 0), null);

  // Build Z-axis T-shape centered at (10, 65, 10)
  setBlock(10, 64, 10, BLOCK.SOUL_SAND);
  setBlock(10, 65, 10, BLOCK.SOUL_SAND);
  setBlock(10, 65, 9, BLOCK.SOUL_SAND);
  setBlock(10, 65, 11, BLOCK.SOUL_SAND);
  const matchZ = checkWitherSummonPattern(getBlock, 10, 66, 10);
  assert.ok(matchZ && matchZ.length === 4);
});

test('Wave 12: 4-Tier Java Beacon pyramid evaluates Tiers 0..4 with exact radius, effects, and Level II unlock', () => {
  const { getBlock, setBlock } = createBlockGrid();
  const bx = 0;
  const by = 70;
  const bz = 0;

  // Tier 0: no pyramid
  const t0 = evaluateBeaconPyramid(getBlock, bx, by, bz);
  assert.equal(t0.tier, 0);
  assert.equal(t0.radius, 0);
  assert.equal(t0.unlockedEffects.length, 0);

  // Tier 1: 3x3 Iron Block at y=69
  const ironId = BLOCK_BY_KEY['iron_block'].id;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      setBlock(bx + dx, by - 1, bz + dz, ironId);
    }
  }
  const t1 = evaluateBeaconPyramid(getBlock, bx, by, bz);
  assert.equal(t1.tier, 1);
  assert.equal(t1.radius, 20);
  assert.equal(t1.maxAmplifier, 0);
  assert.deepEqual(t1.unlockedEffects, ['speed', 'haste']);

  // Tier 2: + 5x5 Gold Block at y=68
  const goldId = BLOCK_BY_KEY['gold_block'].id;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      setBlock(bx + dx, by - 2, bz + dz, goldId);
    }
  }
  const t2 = evaluateBeaconPyramid(getBlock, bx, by, bz);
  assert.equal(t2.tier, 2);
  assert.equal(t2.radius, 30);
  assert.ok(t2.unlockedEffects.includes('resistance'));
  assert.ok(t2.unlockedEffects.includes('jump_boost'));

  // Tier 3: + 7x7 Emerald/Diamond Block at y=67
  const emeraldId = BLOCK_BY_KEY['emerald_block'].id;
  const diamondId = BLOCK_BY_KEY['diamond_block'].id;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      setBlock(bx + dx, by - 3, bz + dz, (dx + dz) % 2 === 0 ? emeraldId : diamondId);
    }
  }
  const t3 = evaluateBeaconPyramid(getBlock, bx, by, bz);
  assert.equal(t3.tier, 3);
  assert.equal(t3.radius, 40);
  assert.ok(t3.unlockedEffects.includes('strength'));
  assert.equal(t3.maxAmplifier, 0);

  // Tier 4: + 9x9 Netherite Block at y=66
  const netheriteId = BLOCK_BY_KEY['netherite_block'].id;
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      setBlock(bx + dx, by - 4, bz + dz, netheriteId);
    }
  }
  const t4 = evaluateBeaconPyramid(getBlock, bx, by, bz);
  assert.equal(t4.tier, 4);
  assert.equal(t4.radius, 50);
  assert.equal(t4.maxAmplifier, 1); // Level II unlocked
  assert.ok(t4.unlockedEffects.includes('regeneration'));
});

test('Wave 12: Boss Wither spec, Nether Star drop, Spawn Egg, /summon wither, and Wither/Beacon advancements exist', () => {
  const wither = MOB_SPECS.wither;
  assert.ok(wither);
  assert.equal(wither.hp, 300);
  assert.equal(wither.boss, true);
  assert.equal(wither.flying, true);
  assert.equal(wither.drop, 'nether_star');
  assert.ok(ITEM_DEFS['wither_spawn_egg']);
  assert.ok(ITEM_DEFS['nether_star']);

  const advIds = new Set(ADVANCEMENTS.map((a) => a.id));
  assert.equal(advIds.has('summon_wither'), true);
  assert.equal(advIds.has('activate_beacon'), true);

  const summoned: string[] = [];
  const replies: string[] = [];
  const ctx: CommandContext = {
    playerPos: [0, 70, 0],
    dimension: 'overworld',
    seed: 1,
    cheatsEnabled: true,
    worldBorderRadius: 30000000,
    gamerules: { ...DEFAULT_GAMERULES },
    teleport: () => {},
    setGameMode: () => {},
    setTime: () => {},
    addTime: () => {},
    getTime: () => 0,
    setWeather: () => {},
    giveItem: () => true,
    clearInventory: () => 0,
    setBlock: () => {},
    getBlock: () => BLOCK.AIR,
    summonMob: (type) => summoned.push(type),
    giveEffect: () => {},
    clearEffects: () => {},
    enchantHeld: () => '',
    addXp: () => '',
    setDifficulty: () => {},
    setGameRule: () => {},
    setSpawnPoint: () => {},
    setWorldBorder: () => {},
    locateBiome: () => null,
    killTarget: () => '',
    showTitle: () => {},
    playSound: () => {},
    reply: (msg) => replies.push(msg),
  };

  executeCommand('/summon wither', ctx);
  assert.deepEqual(summoned, ['wither']);
  assert.ok(replies.some((r) => r.includes('wither')));
});
