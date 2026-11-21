import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK, BLOCK_BY_KEY, ITEM_DEFS } from '../src/game/blocks';
import {
  autocompleteCommand,
  CommandContext,
  executeCommand,
} from '../src/game/commands';
import { MOB_SPECS } from '../src/game/mobs';
import { DEFAULT_GAMERULES } from '../src/game/types';
import { isOceanMonumentChunk, WorldGenerator } from '../src/game/worldGen';

function makeMockCommandCtx(replies: string[], summoned: string[]): CommandContext {
  return {
    playerPos: [0, 70, 0],
    dimension: 'overworld',
    seed: 42,
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
}

test('Wave 13: Classic Survival Loop mobs (Enderman, Spider, Slime) define Java drops, spawn eggs, and /summon support', () => {
  assert.equal(MOB_SPECS.enderman.hp, 40);
  assert.equal(MOB_SPECS.enderman.drop, 'ender_pearl');
  assert.equal(MOB_SPECS.spider.hp, 16);
  assert.equal(MOB_SPECS.spider.drop, 'string');
  assert.equal(MOB_SPECS.slime.hp, 16);
  assert.equal(MOB_SPECS.slime.drop, 'slime_ball');

  assert.ok(ITEM_DEFS['enderman_spawn_egg']);
  assert.ok(ITEM_DEFS['spider_spawn_egg']);
  assert.ok(ITEM_DEFS['slime_spawn_egg']);

  const replies: string[] = [];
  const summoned: string[] = [];
  const ctx = makeMockCommandCtx(replies, summoned);
  executeCommand('/summon enderman', ctx);
  executeCommand('/summon spider', ctx);
  executeCommand('/summon slime', ctx);
  assert.deepEqual(summoned, ['enderman', 'spider', 'slime']);
});

test('Wave 13: Ocean Monument deterministically generates Prismarine, Sea Lanterns, and Gold Block vault at chunk (-3, -3)', () => {
  assert.equal(isOceanMonumentChunk(-3, -3), true);

  const gen = new WorldGenerator(2632026);
  const col = gen.generateChunk('overworld', -3, -3, {});

  const prismarineIds = new Set([
    BLOCK_BY_KEY['prismarine']?.id,
    BLOCK_BY_KEY['prismarine_bricks']?.id,
    BLOCK_BY_KEY['dark_prismarine']?.id,
  ]);
  const seaLanternId = BLOCK_BY_KEY['sea_lantern']?.id;
  const goldBlockId = BLOCK_BY_KEY['gold_block']?.id;

  let prismarineCount = 0;
  let seaLanternCount = 0;
  let goldBlockCount = 0;

  for (const sec of col.sections) {
    if (!sec) continue;
    for (let i = 0; i < sec.length; i++) {
      const id = sec[i];
      if (prismarineIds.has(id)) prismarineCount++;
      if (id === seaLanternId) seaLanternCount++;
      if (id === goldBlockId) goldBlockCount++;
    }
  }

  assert.ok(prismarineCount >= 120, `Expected >=120 prismarine blocks, got ${prismarineCount}`);
  assert.ok(seaLanternCount >= 4, `Expected >=4 sea lanterns, got ${seaLanternCount}`);
  assert.ok(goldBlockCount >= 8, `Expected 8 gold blocks in central vault, got ${goldBlockCount}`);
});

test('Wave 13: /locate command and autocomplete support Ocean Monument, Village, Nether Fortress, and Abandoned Camp', () => {
  const suggestions = autocompleteCommand('/locate o');
  assert.ok(suggestions.includes('ocean_monument'));

  const replies: string[] = [];
  const ctx = makeMockCommandCtx(replies, []);

  executeCommand('/locate ocean_monument', ctx);
  executeCommand('/locate village', ctx);
  executeCommand('/locate nether_fortress', ctx);
  executeCommand('/locate abandoned_camp', ctx);

  assert.equal(replies.length, 4);
  assert.ok(replies[0].includes('Ocean Monument') && replies[0].includes('-40'));
  assert.ok(replies[1].includes('Village'));
  assert.ok(replies[2].includes('Nether Fortress'));
  assert.ok(replies[3].includes('Abandoned Camp'));
});
