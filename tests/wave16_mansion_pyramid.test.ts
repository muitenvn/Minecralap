import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK, BLOCK_BY_KEY } from '../src/game/blocks';
import {
  autocompleteCommand,
  CommandContext,
  executeCommand,
} from '../src/game/commands';
import { DEFAULT_GAMERULES } from '../src/game/types';
import {
  isDesertPyramidChunk,
  isWoodlandMansionChunk,
  WorldGenerator,
} from '../src/game/worldGen';

function countBlocksInChunk(
  gen: WorldGenerator,
  cx: number,
  cz: number,
  targetIds: number[],
): Record<number, number> {
  const col = gen.generateChunk('overworld', cx, cz, {});
  const counts: Record<number, number> = Object.fromEntries(targetIds.map((id) => [id, 0]));
  for (const sec of col.sections) {
    if (!sec) continue;
    for (let i = 0; i < sec.length; i++) {
      const id = sec[i];
      if (id in counts) counts[id]++;
    }
  }
  return counts;
}

test('Wave 16: Woodland Mansion deterministically generates 2-story Dark Oak hall, Bookshelves, Torches, and Diamond/Emerald Treasury at (3, -3)', () => {
  assert.equal(isWoodlandMansionChunk(3, -3), true);

  const darkPlanks = BLOCK_BY_KEY['dark_oak_planks']?.id ?? BLOCK.OAK_PLANKS;
  const bookshelf = BLOCK_BY_KEY['bookshelf']?.id ?? BLOCK.BOOKSHELF;
  const chestId = BLOCK_BY_KEY['chest']?.id ?? BLOCK.CHEST;
  const diamondBlk = BLOCK_BY_KEY['diamond_block']?.id ?? BLOCK.DIAMOND_BLOCK;
  const emeraldBlk = BLOCK_BY_KEY['emerald_block']?.id ?? BLOCK.EMERALD_BLOCK;

  const gen = new WorldGenerator(263111);
  const counts = countBlocksInChunk(gen, 3, -3, [
    darkPlanks,
    bookshelf,
    BLOCK.TORCH,
    chestId,
    diamondBlk,
    emeraldBlk,
  ]);

  assert.ok(counts[darkPlanks] >= 250, `Expected >=250 dark oak planks, got ${counts[darkPlanks]}`);
  assert.ok(counts[bookshelf] >= 30, `Expected >=30 bookshelves, got ${counts[bookshelf]}`);
  assert.ok(counts[BLOCK.TORCH] >= 8, `Expected >=8 torches, got ${counts[BLOCK.TORCH]}`);
  assert.ok(counts[chestId] >= 2, `Expected >=2 loot chests, got ${counts[chestId]}`);
  assert.ok(counts[diamondBlk] >= 1, 'Expected secret diamond block in 2nd-floor treasury');
  assert.ok(counts[emeraldBlk] >= 1, 'Expected secret emerald block in 2nd-floor treasury');
});

test('Wave 16: Desert Pyramid deterministically generates Sandstone temple, Terracotta emblem, and subterranean 3x3 TNT trap vault at (-3, 2)', () => {
  assert.equal(isDesertPyramidChunk(-3, 2), true);

  const sandstone = BLOCK_BY_KEY['sandstone']?.id ?? BLOCK.SAND;
  const chestId = BLOCK_BY_KEY['chest']?.id ?? BLOCK.CHEST;
  const plateId = BLOCK_BY_KEY['stone_pressure_plate']?.id ?? BLOCK.STONE;
  const diamondBlk = BLOCK_BY_KEY['diamond_block']?.id ?? BLOCK.DIAMOND_BLOCK;

  const gen = new WorldGenerator(263222);
  const counts = countBlocksInChunk(gen, -3, 2, [
    sandstone,
    BLOCK.TNT,
    chestId,
    plateId,
    diamondBlk,
  ]);

  assert.ok(counts[sandstone] >= 200, `Expected >=200 sandstone blocks, got ${counts[sandstone]}`);
  assert.equal(counts[BLOCK.TNT], 9, `Expected exact 3x3=9 TNT trap blocks, got ${counts[BLOCK.TNT]}`);
  assert.ok(counts[chestId] >= 4, `Expected 4 treasure chests, got ${counts[chestId]}`);
  assert.ok(counts[plateId] >= 1, 'Expected stone pressure plate trap trigger');
  assert.ok(counts[diamondBlk] >= 1, 'Expected diamond block in subterranean vault');
});

test('Wave 16: /locate and autocomplete support woodland_mansion and desert_pyramid', () => {
  assert.ok(autocompleteCommand('/locate w').includes('woodland_mansion'));
  assert.ok(autocompleteCommand('/locate d').includes('desert_pyramid'));

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
    summonMob: () => {},
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

  executeCommand('/locate woodland_mansion', ctx);
  executeCommand('/locate desert_pyramid', ctx);
  assert.equal(replies.length, 2);
  assert.ok(replies[0].includes('Woodland Mansion') && replies[0].includes('56'));
  assert.ok(replies[1].includes('Desert Pyramid') && replies[1].includes('-40'));
});
