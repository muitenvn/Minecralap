import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPFIRE_COOK_MAP,
  getFishingWaitSeconds,
  getFurnaceSpeedMultiplier,
  getStonecutterOutputs,
  interactCauldron,
  rollFishingLoot,
  stepComposter,
} from '../src/game/stations';

test('Wave 7: Java Fishing loot table respects Luck of the Sea, Lure wait reduction, and generates Enchanted Books', () => {
  // Lure III reduces wait time substantially
  const wait0 = getFishingWaitSeconds(0, () => 0.5);
  const wait3 = getFishingWaitSeconds(3, () => 0.5);
  assert.ok(wait3 < wait0, `Lure III (${wait3}s) must be faster than Lure 0 (${wait0}s)`);

  // Roll treasure branch (roll = 0.01 < 0.05) -> Enchanted Book with real enchantment
  let call = 0;
  const seq = [0.01, 0.1, 0.0]; // treasure -> enchanted_book -> mending
  const treasure = rollFishingLoot(3, () => seq[call++] ?? 0);
  assert.equal(treasure.category, 'treasure');
  assert.equal(treasure.item.itemId, 'enchanted_book');
  assert.ok(treasure.item.enchants && Object.keys(treasure.item.enchants).length > 0);

  // Fish branch (roll = 0.5) -> Raw Cod / Salmon
  const fish = rollFishingLoot(0, () => 0.5);
  assert.equal(fish.category, 'fish');
  assert.equal(fish.item.itemId, 'raw_cod');
});

test('Wave 7: Composter progresses 0 -> 7 with compostables and harvests Bone Meal on level 7', () => {
  // Cake always increases level (100% chance)
  let level = 0;
  for (let i = 0; i < 7; i++) {
    const res = stepComposter(level, 'cake', () => 0.5);
    assert.equal(res.accepted, true);
    assert.equal(res.increased, true);
    level = res.level;
  }
  assert.equal(level, 7);

  // Interacting at level 7 harvests Bone Meal and resets to 0
  const harvest = stepComposter(level, null);
  assert.equal(harvest.producedBoneMeal, true);
  assert.equal(harvest.level, 0);

  // Non-compostable item (stone) rejected
  const bad = stepComposter(2, 'stone');
  assert.equal(bad.accepted, false);
  assert.equal(bad.level, 2);
});

test('Wave 7: Cauldron supports Water Bucket fill (0->3), 3x Glass Bottle scoop (3->0), and Bucket refill', () => {
  const fill = interactCauldron(0, 'water_bucket');
  assert.equal(fill.changed, true);
  assert.equal(fill.waterLevel, 3);
  assert.equal(fill.giveItem, 'bucket');

  const b1 = interactCauldron(fill.waterLevel, 'glass_bottle');
  assert.equal(b1.waterLevel, 2);
  assert.equal(b1.giveItem, 'water_bottle');

  const b2 = interactCauldron(b1.waterLevel, 'glass_bottle');
  assert.equal(b2.waterLevel, 1);

  const b3 = interactCauldron(b2.waterLevel, 'glass_bottle');
  assert.equal(b3.waterLevel, 0);

  // Cannot scoop from empty cauldron
  const empty = interactCauldron(0, 'glass_bottle');
  assert.equal(empty.changed, false);
});

test('Wave 7: Stonecutter direct recipes, Campfire cooking map, and Blast Furnace/Smoker 2x speed', () => {
  const copperCuts = getStonecutterOutputs('copper_block');
  assert.ok(copperCuts.some((o) => o.itemId === 'cut_copper' && o.count === 4));
  assert.ok(copperCuts.some((o) => o.itemId === 'cut_copper_slab' && o.count === 8));

  assert.equal(CAMPFIRE_COOK_MAP['raw_cod'], 'cooked_cod');
  assert.equal(CAMPFIRE_COOK_MAP['raw_porkchop'], 'cooked_porkchop');

  assert.equal(getFurnaceSpeedMultiplier('blast_furnace', 'raw_iron'), 2.0);
  assert.equal(getFurnaceSpeedMultiplier('smoker', 'raw_porkchop'), 2.0);
  assert.equal(getFurnaceSpeedMultiplier('furnace', 'raw_iron'), 1.0);
});
