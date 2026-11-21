import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyBrewingState,
  createEmptyChestSlots,
  createNewWorldRecord,
  CURRENT_SAVE_SCHEMA_VERSION,
  migrateWorldSave,
} from '../src/game/storage';
import { WorldSave } from '../src/game/types';

test('Wave 1: createNewWorldRecord creates valid Schema v2 world with chests, enderChest, brewingStands and offhand', () => {
  const w = createNewWorldRecord({
    name: 'Test World 26.3',
    seed: 123456,
    gameMode: 'survival',
    cheatsEnabled: true,
  });

  assert.equal(w.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(w.player.inventory.length, 36);
  assert.equal(w.player.armor.length, 4);
  assert.equal(w.player.offhand, null);
  assert.equal(w.enderChest?.length, 27);
  assert.deepEqual(w.chests, {});
  assert.deepEqual(w.brewingStands, {});
  assert.deepEqual(w.redstoneStates, {});
});

test('Wave 1: migrateWorldSave upgrades legacy v1 saves without losing inventory or mods', () => {
  const legacyV1: WorldSave = {
    id: 'legacy_1',
    name: 'Old v1 World',
    seed: 999,
    gameMode: 'survival',
    difficulty: 'normal',
    cheatsEnabled: false,
    dimension: 'overworld',
    createdAt: 1000,
    updatedAt: 2000,
    timeOfDay: 6000,
    weather: 'clear',
    worldBorderSize: 29_999_984,
    worldBorderCenter: [0, 0],
    player: {
      x: 10,
      y: 70,
      z: -5,
      yaw: 0,
      pitch: 0,
      hp: 20,
      maxHp: 20,
      hunger: 20,
      oxygen: 20,
      xp: 0.4,
      level: 7,
      selectedSlot: 0,
      spawnPoint: [0, 70, 0],
      spawnDimension: 'overworld',
      worldSpawn: [0, 70, 0],
      inventory: [{ itemId: 'diamond_sword', count: 1, enchants: { sharpness: 5 } }], // intentionally short legacy array
      armor: [{ itemId: 'netherite_helmet', count: 1 }],
      effects: [],
    },
    gamerules: {
      keepInventory: true,
      doDaylightCycle: true,
      doWeatherCycle: true,
      doMobSpawning: true,
      fallDamage: true,
      fireDamage: true,
      drowningDamage: true,
      naturalRegeneration: true,
    },
    furnace: { input: null, fuel: null, output: null, burnTime: 0, burnMax: 0, cookProgress: 0 },
    overworldMods: { '1,64,1': 4 },
    netherMods: {},
  };

  const migrated = migrateWorldSave(legacyV1);
  assert.equal(migrated.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(migrated.player.inventory.length, 36);
  assert.equal(migrated.player.inventory[0]?.itemId, 'diamond_sword');
  assert.equal(migrated.player.inventory[0]?.enchants?.sharpness, 5);
  assert.equal(migrated.player.armor.length, 4);
  assert.equal(migrated.player.armor[0]?.itemId, 'netherite_helmet');
  assert.equal(migrated.player.offhand, null);
  assert.equal(migrated.enderChest?.length, 27);
  assert.equal(migrated.overworldMods['1,64,1'], 4);
  assert.deepEqual(migrated.endMods, {});
  assert.deepEqual(migrated.chests, {});
});

test('Wave 1: chest & brewing state helpers initialize clean fixed-size arrays', () => {
  const chest = createEmptyChestSlots();
  assert.equal(chest.length, 27);
  assert.ok(chest.every((s) => s === null));

  const brew = createEmptyBrewingState();
  assert.equal(brew.bottles.length, 3);
  assert.equal(brew.fuelCharges, 0);
  assert.equal(brew.brewProgress, 0);
});
