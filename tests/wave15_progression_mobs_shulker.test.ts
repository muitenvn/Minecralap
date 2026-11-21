import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK, ITEM_DEFS } from '../src/game/blocks';
import { CommandContext, executeCommand } from '../src/game/commands';
import { buildMobMesh, MOB_SPECS, MobType } from '../src/game/mobs';
import { getRaidWaveMobTypes } from '../src/game/raid';
import {
  createEmptyChestSlots,
  packShulkerBoxItem,
  unpackShulkerBoxItem,
} from '../src/game/storage';
import { DEFAULT_GAMERULES } from '../src/game/types';

test('Wave 15: 5 Endgame & Structure Progression mobs define authentic Java drops, spawn eggs, and 3D meshes', () => {
  const expected: [MobType, string, string][] = [
    ['wither_skeleton', 'wither_skeleton_skull', 'wither_skeleton_spawn_egg'],
    ['evoker', 'totem_of_undying', 'evoker_spawn_egg'],
    ['vindicator', 'emerald', 'vindicator_spawn_egg'],
    ['guardian', 'prismarine_shard', 'guardian_spawn_egg'],
    ['shulker', 'shulker_shell', 'shulker_spawn_egg'],
  ];

  for (const [mobType, dropId, eggId] of expected) {
    const spec = MOB_SPECS[mobType];
    assert.ok(spec, `Missing MOB_SPECS.${mobType}`);
    assert.equal(spec.drop, dropId);
    assert.ok(ITEM_DEFS[eggId], `Missing spawn egg ${eggId}`);
    const built = buildMobMesh(mobType);
    assert.ok(built.group.children.length >= 4, `Expected procedural 3D mesh parts for ${mobType}`);
  }
});

test('Wave 15: Portable Shulker Box preserves all 27 slots and enchantments across break/place cycles without aliasing', () => {
  const slots = createEmptyChestSlots();
  slots[0] = { itemId: 'diamond_sword', count: 1, enchants: { sharpness: 5, mending: 1 } };
  slots[13] = { itemId: 'nether_star', count: 2 };
  slots[26] = { itemId: 'totem_of_undying', count: 1 };

  const packed = packShulkerBoxItem(slots);
  assert.equal(packed.itemId, 'shulker_box');
  assert.equal(packed.count, 1);
  assert.ok(packed.shulkerItems && packed.shulkerItems.length === 27);

  // Mutating original chest array must NOT affect packed item
  slots[13]!.count = 99;
  slots[0]!.enchants!.sharpness = 1;

  const restored = unpackShulkerBoxItem(packed);
  assert.equal(restored.length, 27);
  assert.equal(restored[0]?.itemId, 'diamond_sword');
  assert.equal(restored[0]?.enchants?.sharpness, 5);
  assert.equal(restored[0]?.enchants?.mending, 1);
  assert.equal(restored[13]?.itemId, 'nether_star');
  assert.equal(restored[13]?.count, 2);
  assert.equal(restored[26]?.itemId, 'totem_of_undying');

  // Empty Shulker Box omits shulkerItems payload cleanly
  const emptyPacked = packShulkerBoxItem(createEmptyChestSlots());
  assert.equal(emptyPacked.shulkerItems, undefined);
});

test('Wave 15: Village Raid waves escalate authentically with Vindicator (Wave 2) and Evoker (Wave 3) and /summon supports all 5 mobs', () => {
  const wave2 = getRaidWaveMobTypes(2);
  const wave3 = getRaidWaveMobTypes(3);
  assert.ok(wave2.includes('vindicator'));
  assert.ok(wave3.includes('vindicator'));
  assert.ok(wave3.includes('evoker'));

  const summoned: string[] = [];
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
    summonMob: (t) => summoned.push(t),
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
    reply: () => {},
  };

  executeCommand('/summon wither_skeleton', ctx);
  executeCommand('/summon evoker', ctx);
  executeCommand('/summon vindicator', ctx);
  executeCommand('/summon guardian', ctx);
  executeCommand('/summon shulker', ctx);
  assert.deepEqual(summoned, ['wither_skeleton', 'evoker', 'vindicator', 'guardian', 'shulker']);
});
