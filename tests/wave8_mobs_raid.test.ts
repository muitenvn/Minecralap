import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { ITEM_DEFS } from '../src/game/blocks';
import { executeCommand } from '../src/game/commands';
import {
  buildMobMesh,
  MOB_SPECS,
  MobEntity,
  stepAllyGuardianCombat,
} from '../src/game/mobs';
import {
  applyHeroOfTheVillageDiscount,
  createRaid,
  getRaidWaveMobTypes,
  recordRaidKill,
} from '../src/game/raid';
import { DEFAULT_GAMERULES, VillagerTradeOffer } from '../src/game/types';

function makeDummyMob(partial: Partial<MobEntity> & Pick<MobEntity, 'id' | 'type' | 'x' | 'z'>): MobEntity {
  const spec = MOB_SPECS[partial.type];
  return {
    dimension: 'overworld',
    hostile: spec.hostile,
    y: 64,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    hp: spec.hp,
    maxHp: spec.hp,
    hurtTimer: 0,
    attackCooldown: 0,
    wanderTimer: 2,
    wanderAngle: 0,
    walkPhase: 0,
    fuseTimer: 0,
    mesh: new THREE.Group(),
    limbs: [],
    ...partial,
  };
}

test('Wave 8: Skeleton, Blaze, Wolf, Iron Golem, and Pillager exist with spawn eggs & 3D meshes', () => {
  const types = ['skeleton', 'blaze', 'wolf', 'iron_golem', 'pillager'] as const;
  for (const t of types) {
    assert.ok(MOB_SPECS[t], `MOB_SPECS missing ${t}`);
    assert.ok(ITEM_DEFS[`${t}_spawn_egg`], `Spawn egg missing for ${t}`);
    const built = buildMobMesh(t);
    assert.ok(built.group.children.length >= 4, `Procedural 3D mesh for ${t} should have >=4 parts`);
  }
  assert.equal(MOB_SPECS.blaze.drop, 'blaze_rod');
  assert.equal(MOB_SPECS.iron_golem.hp, 100);
  assert.equal(MOB_SPECS.skeleton.ranged, 'arrow');
  assert.equal(MOB_SPECS.pillager.ranged, 'arrow');
  assert.equal(MOB_SPECS.blaze.ranged, 'fireball');
});

test('Wave 8: 3-Wave Village Raid advances waves accurately and triggers Victory', () => {
  let state = createRaid(3);
  assert.equal(state.active, true);
  assert.equal(state.wave, 1);
  assert.equal(state.totalInWave, getRaidWaveMobTypes(1).length);

  // Clear Wave 1
  for (let i = 0; i < getRaidWaveMobTypes(1).length - 1; i++) {
    const step = recordRaidKill(state);
    state = step.state;
    assert.equal(step.victoryTriggered, false);
    assert.equal(step.spawnNextWave, undefined);
  }
  const toWave2 = recordRaidKill(state);
  state = toWave2.state;
  assert.equal(state.wave, 2);
  assert.deepEqual(toWave2.spawnNextWave, getRaidWaveMobTypes(2));

  // Clear Wave 2
  for (let i = 0; i < getRaidWaveMobTypes(2).length; i++) {
    const step = recordRaidKill(state);
    state = step.state;
  }
  assert.equal(state.wave, 3);

  // Clear Wave 3 -> Victory
  let victory = false;
  for (let i = 0; i < getRaidWaveMobTypes(3).length; i++) {
    const step = recordRaidKill(state);
    state = step.state;
    if (step.victoryTriggered) victory = true;
  }
  assert.equal(victory, true);
  assert.equal(state.active, false);
  assert.equal(state.victory, true);
});

test('Wave 8: Hero of the Village discounts emerald prices by 30% (minimum 1 emerald)', () => {
  const offers: VillagerTradeOffer[] = [
    { id: 'o1', buyA: { itemId: 'emerald', count: 10 }, sell: { itemId: 'diamond_sword', count: 1 }, uses: 0, maxUses: 12, xpReward: 5 },
    { id: 'o2', buyA: { itemId: 'emerald', count: 1 }, sell: { itemId: 'bread', count: 6 }, uses: 0, maxUses: 12, xpReward: 2 },
    { id: 'o3', buyA: { itemId: 'wheat', count: 20 }, sell: { itemId: 'emerald', count: 1 }, uses: 0, maxUses: 16, xpReward: 2 },
  ];

  const discounted = applyHeroOfTheVillageDiscount(offers, true);
  assert.equal(discounted[0].buyA.count, 7);
  assert.equal(discounted[1].buyA.count, 1);
  assert.equal(discounted[2].buyA.count, 20); // non-emerald cost unchanged

  const regular = applyHeroOfTheVillageDiscount(offers, false);
  assert.equal(regular[0].buyA.count, 10);
});

test('Wave 8: Iron Golem & Tamed Wolf protect against nearby hostiles while sitting Wolf stays idle', () => {
  const golem = makeDummyMob({ id: 'g1', type: 'iron_golem', x: 0, z: 0 });
  const tamedWolf = makeDummyMob({ id: 'w1', type: 'wolf', x: 0.5, z: 0, tamed: true, sitting: false });
  const sittingWolf = makeDummyMob({ id: 'w2', type: 'wolf', x: 0.5, z: 0.5, tamed: true, sitting: true });
  const pillager = makeDummyMob({ id: 'p1', type: 'pillager', x: 1.2, z: 0, hp: 24 });

  const events = stepAllyGuardianCombat([golem, tamedWolf, sittingWolf, pillager], 0.1);
  assert.equal(events.length, 2, 'Both Iron Golem and standing Tamed Wolf should strike the Pillager');
  assert.ok(events.some((e) => e.attacker.id === 'g1' && e.damage === 12));
  assert.ok(events.some((e) => e.attacker.id === 'w1' && e.damage === 4));
  assert.ok(!events.some((e) => e.attacker.id === 'w2'), 'Sitting Wolf should not attack');
  assert.equal(pillager.hp, 24 - 16);
  assert.ok(pillager.vy >= 7.5, 'Iron Golem should launch hostile mob upward');
});

test('Wave 8: /raid command triggers startRaid callback cleanly', () => {
  let raidStarted = false;
  let lastReply = '';
  executeCommand('/raid', {
    playerPos: [0, 70, 0],
    dimension: 'overworld',
    seed: 1,
    cheatsEnabled: true,
    worldBorderRadius: 1000,
    gamerules: DEFAULT_GAMERULES,
    teleport: () => {},
    setGameMode: () => {},
    setTime: () => {},
    addTime: () => {},
    getTime: () => 1000,
    setWeather: () => {},
    giveItem: () => true,
    clearInventory: () => 0,
    setBlock: () => {},
    getBlock: () => 0,
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
    startRaid: () => {
      raidStarted = true;
    },
    reply: (msg) => {
      lastReply = msg;
    },
  });
  assert.equal(raidStarted, true);
  assert.equal(lastReply, '');
});
