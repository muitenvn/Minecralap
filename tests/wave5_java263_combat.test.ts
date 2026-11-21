import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK_BY_KEY, ITEM_DEFS } from '../src/game/blocks';
import {
  computeJavaMeleeAttack,
  getWeaponAttackSpeed,
  stepAttackCooldown,
} from '../src/game/combat';
import { matchCraftingGrid } from '../src/game/recipes';
import { BIOME_LABELS, WorldGenerator } from '../src/game/worldGen';

test('Wave 5: Java Edition 26.1 Tiny Takeover craftable Name Tag & Golden Dandelion', () => {
  // Craftable Name Tag (26.1): Paper + Iron Nugget
  const tagGrid = [
    { itemId: 'paper', count: 1 },
    { itemId: 'iron_nugget', count: 1 },
    null,
    null,
  ];
  const tagMatch = matchCraftingGrid(tagGrid, 2);
  assert.ok(tagMatch, 'Paper + Iron Nugget must craft Name Tag (26.1)');
  assert.equal(tagMatch.output.itemId, 'name_tag');

  // Golden Dandelion (26.1): Dandelion surrounded by 8 Gold Nuggets
  const gdGrid = [
    { itemId: 'gold_nugget', count: 1 }, { itemId: 'gold_nugget', count: 1 }, { itemId: 'gold_nugget', count: 1 },
    { itemId: 'gold_nugget', count: 1 }, { itemId: 'dandelion', count: 1 }, { itemId: 'gold_nugget', count: 1 },
    { itemId: 'gold_nugget', count: 1 }, { itemId: 'gold_nugget', count: 1 }, { itemId: 'gold_nugget', count: 1 },
  ];
  const gdMatch = matchCraftingGrid(gdGrid, 3);
  assert.ok(gdMatch, 'Dandelion + 8 Gold Nuggets must craft Golden Dandelion (26.1)');
  assert.equal(gdMatch.output.itemId, 'golden_dandelion');
  assert.ok(BLOCK_BY_KEY['golden_dandelion']);
});

test('Wave 5: Java Edition 26.3 Wilderness Bound blocks, recipes & Dappled Forest biome', () => {
  const required263 = [
    'poplar_log',
    'poplar_planks',
    'poplar_leaves',
    'poplar_sapling',
    'poplar_slab',
    'poplar_stairs',
    'poplar_fence',
    'shelf_mushroom',
    'straw_bed',
    'cushion',
    'white_wool_slab',
    'red_wool_slab',
  ];
  for (const key of required263) {
    assert.ok(BLOCK_BY_KEY[key], `Missing 26.3 block: ${key}`);
    assert.ok(ITEM_DEFS[key], `Missing 26.3 item: ${key}`);
  }
  assert.ok(ITEM_DEFS['villager_spawn_egg'], 'Missing Villager Spawn Egg');

  // Craft Poplar Planks from Poplar Log
  const plankMatch = matchCraftingGrid([{ itemId: 'poplar_log', count: 1 }, null, null, null], 2);
  assert.equal(plankMatch?.output.itemId, 'poplar_planks');
  assert.equal(plankMatch?.output.count, 4);

  // Craft Straw Bed (3 Wheat + 3 Poplar Planks)
  const bedGrid = [
    { itemId: 'wheat', count: 1 }, { itemId: 'wheat', count: 1 }, { itemId: 'wheat', count: 1 },
    { itemId: 'poplar_planks', count: 1 }, { itemId: 'poplar_planks', count: 1 }, { itemId: 'poplar_planks', count: 1 },
    null, null, null,
  ];
  const bedMatch = matchCraftingGrid(bedGrid, 3);
  assert.equal(bedMatch?.output.itemId, 'straw_bed');

  // Verify Dappled Forest biome exists and generates deterministically
  assert.ok(BIOME_LABELS['dappled_forest'].includes('26.3'));
  const gen = new WorldGenerator(202609);
  let foundDappled = false;
  for (let x = -2000; x <= 2000 && !foundDappled; x += 64) {
    for (let z = -2000; z <= 2000 && !foundDappled; z += 64) {
      if (gen.getOverworldBiome(x, z) === 'dappled_forest') foundDappled = true;
    }
  }
  assert.equal(foundDappled, true, 'WorldGenerator must generate Dappled Forest biome (26.3)');
});

test('Wave 5: Java Edition Combat Cooldown scaling, Aerial Critical Hit 1.5x, and Sword Sweeping', () => {
  assert.equal(getWeaponAttackSpeed('diamond_sword'), 1.6);
  assert.equal(getWeaponAttackSpeed('netherite_axe'), 1.0);
  assert.equal(getWeaponAttackSpeed('mace'), 0.6);

  // Cooldown recharge
  assert.equal(stepAttackCooldown(0, 0.5, 'diamond_sword'), 0.8);
  assert.equal(stepAttackCooldown(0.8, 0.5, 'diamond_sword'), 1.0);

  // Weak spam click (cooldown = 0.2) scales down to 0.2 + 0.8*0.04 = 0.232x
  const spam = computeJavaMeleeAttack({
    baseDamage: 10,
    cooldown: 0.2,
    onGround: true,
    vy: 0,
    sprinting: false,
    inLiquid: false,
    itemId: 'diamond_sword',
  });
  assert.ok(spam.damage < 3, `Spam attack should deal reduced damage, got ${spam.damage}`);
  assert.equal(spam.isCritical, false);
  assert.equal(spam.isSweep, false);

  // Full-charge falling attack -> 1.5x Aerial Critical Hit!
  const crit = computeJavaMeleeAttack({
    baseDamage: 10,
    cooldown: 1.0,
    onGround: false,
    vy: -3.2,
    sprinting: false,
    inLiquid: false,
    itemId: 'diamond_sword',
  });
  assert.equal(crit.isCritical, true);
  assert.equal(crit.damage, 15);

  // Full-charge grounded sword attack -> Sweeping splash!
  const sweep = computeJavaMeleeAttack({
    baseDamage: 10,
    cooldown: 1.0,
    onGround: true,
    vy: 0,
    sprinting: false,
    inLiquid: false,
    itemId: 'diamond_sword',
    sweepingLevel: 1,
  });
  assert.equal(sweep.isSweep, true);
  assert.ok(sweep.sweepDamage >= 2);
});
