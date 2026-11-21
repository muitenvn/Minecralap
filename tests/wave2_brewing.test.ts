import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLAZE_POWDER_CHARGES,
  BREW_DURATION_SEC,
  canBrewState,
  resolveBrewOutput,
  stepBrewingStand,
} from '../src/game/brewing';
import { createEmptyBrewingState } from '../src/game/storage';

test('Wave 2: Official Java brewing matrix transitions (Awkward -> Effects -> Corrupted -> Splash -> Lingering)', () => {
  assert.equal(resolveBrewOutput('water_bottle', 'nether_wart'), 'awkward_potion');
  assert.equal(resolveBrewOutput('water_bottle', 'fermented_spider_eye'), 'potion_weakness');
  assert.equal(resolveBrewOutput('awkward_potion', 'sugar'), 'potion_swiftness');
  assert.equal(resolveBrewOutput('awkward_potion', 'blaze_powder'), 'potion_strength');
  assert.equal(resolveBrewOutput('awkward_potion', 'magma_cream'), 'potion_fire_resistance');
  assert.equal(resolveBrewOutput('awkward_potion', 'ghast_tear'), 'potion_regeneration');
  assert.equal(resolveBrewOutput('awkward_potion', 'golden_carrot'), 'potion_night_vision');
  assert.equal(resolveBrewOutput('awkward_potion', 'phantom_membrane'), 'potion_slow_falling');
  assert.equal(resolveBrewOutput('potion_night_vision', 'fermented_spider_eye'), 'potion_invisibility');
  assert.equal(resolveBrewOutput('potion_healing', 'fermented_spider_eye'), 'potion_harming');
  assert.equal(resolveBrewOutput('potion_healing', 'gunpowder'), 'splash_potion_healing');
  assert.equal(resolveBrewOutput('splash_potion_healing', 'dragon_breath'), 'lingering_potion_healing');
  assert.equal(resolveBrewOutput('water_bottle', 'sugar'), null);
});

test('Wave 2: stepBrewingStand consumes Blaze Powder fuel, progresses over BREW_DURATION_SEC, and brews 3 bottles simultaneously', () => {
  let state = createEmptyBrewingState();
  state.fuel = { itemId: 'blaze_powder', count: 2 };
  state.ingredient = { itemId: 'nether_wart', count: 1 };
  state.bottles = [
    { itemId: 'water_bottle', count: 1 },
    { itemId: 'water_bottle', count: 1 },
    { itemId: 'water_bottle', count: 1 },
  ];

  assert.equal(canBrewState(state), true);

  // Halfway tick
  const mid = stepBrewingStand(state, BREW_DURATION_SEC * 0.5);
  assert.equal(mid.changed, true);
  assert.equal(mid.completed, false);
  assert.equal(mid.state.fuelCharges, BLAZE_POWDER_CHARGES);
  assert.equal(mid.state.fuel?.count, 1);
  assert.ok(mid.state.brewProgress > 0.45 && mid.state.brewProgress < 0.55);

  // Complete tick
  const done = stepBrewingStand(mid.state, BREW_DURATION_SEC * 0.6);
  assert.equal(done.completed, true);
  assert.equal(done.state.ingredient, null);
  assert.equal(done.state.fuelCharges, BLAZE_POWDER_CHARGES - 1);
  assert.equal(done.state.brewProgress, 0);
  assert.deepEqual(
    done.state.bottles.map((b) => b?.itemId),
    ['awkward_potion', 'awkward_potion', 'awkward_potion'],
  );
});

test('Wave 2: stepBrewingStand refuses to brew without fuel and resets progress if ingredient removed', () => {
  const state = createEmptyBrewingState();
  state.ingredient = { itemId: 'nether_wart', count: 1 };
  state.bottles[0] = { itemId: 'water_bottle', count: 1 };
  state.brewProgress = 0.4;

  assert.equal(canBrewState(state), false);
  const res = stepBrewingStand(state, 1.0);
  assert.equal(res.completed, false);
  assert.equal(res.state.brewProgress, 0);
});
