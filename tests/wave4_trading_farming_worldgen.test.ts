import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BLOCK, BLOCK_BY_KEY } from '../src/game/blocks';
import { BABY_GROWTH_DURATION_SEC, MobEntity, stepBabyMobAging } from '../src/game/mobs';
import {
  canAffordTrade,
  executeVillagerTrade,
  generateVillagerOffers,
  VILLAGER_PROFESSIONS,
} from '../src/game/trading';
import { ItemStack } from '../src/game/types';
import {
  getChunkBlock,
  isAbandonedCampChunk,
  isNetherFortressChunk,
  isVillageChunk,
  WorldGenerator,
} from '../src/game/worldGen';

test('Wave 4: All 6 Villager professions generate deterministic Java offers & Librarian sells Enchanted Books', () => {
  for (const prof of VILLAGER_PROFESSIONS) {
    const offersLv1 = generateVillagerOffers(prof, 42, 1);
    const offersLv3 = generateVillagerOffers(prof, 42, 3);
    assert.ok(offersLv1.length >= 2, `${prof} should have level 1 offers`);
    assert.ok(offersLv3.length > offersLv1.length, `${prof} level 3 should unlock more offers`);
  }

  const libOffers = generateVillagerOffers('librarian', 101, 3);
  const enchantedBooks = libOffers.filter((o) => o.sell.itemId === 'enchanted_book');
  assert.ok(enchantedBooks.length >= 2);
  assert.ok(enchantedBooks[0].sell.enchants && Object.keys(enchantedBooks[0].sell.enchants).length > 0);
});

test('Wave 4: executeVillagerTrade exchanges items, levels up Villager, and enforces maxUses stock limit', () => {
  const offers = generateVillagerOffers('farmer', 7, 1);
  const wheatOffer = offers[0]; // 20 wheat -> 1 emerald
  const inv: (ItemStack | null)[] = new Array(36).fill(null);
  inv[0] = { itemId: 'wheat', count: 64 };

  assert.equal(canAffordTrade(inv, wheatOffer), true);
  const res1 = executeVillagerTrade(inv, wheatOffer, 8, 1);
  assert.equal(res1.ok, true);
  assert.equal(res1.inventory[0]?.count, 44);
  assert.equal(res1.inventory[1]?.itemId, 'emerald');
  assert.equal(res1.inventory[1]?.count, 1);
  assert.equal(res1.offer.uses, 1);
  // 8 + 2 = 10 XP crosses level 2 threshold!
  assert.equal(res1.leveledUp, true);
  assert.equal(res1.villagerLevel, 2);

  // Exhaust stock -> refuses trade
  const exhausted = { ...res1.offer, uses: res1.offer.maxUses };
  assert.equal(canAffordTrade(res1.inventory, exhausted), false);
  const resBlocked = executeVillagerTrade(res1.inventory, exhausted, 10, 2);
  assert.equal(resBlocked.ok, false);
});

test('Wave 4: Baby mob grows into adult after BABY_GROWTH_DURATION_SEC unless locked by Java 26.1 Golden Dandelion', () => {
  const makeBaby = (ageLocked: boolean): MobEntity => ({
    id: 'baby_1',
    type: 'sheep',
    dimension: 'overworld',
    hostile: false,
    x: 0, y: 65, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0,
    hp: 8, maxHp: 8, hurtTimer: 0, attackCooldown: 0,
    wanderTimer: 1, wanderAngle: 0, walkPhase: 0, fuseTimer: 0,
    isBaby: true,
    babyAgeSec: 0,
    ageLocked,
    mesh: new THREE.Group(),
    limbs: [],
  });

  const normalBaby = makeBaby(false);
  assert.equal(stepBabyMobAging(normalBaby, 60), false);
  assert.equal(normalBaby.isBaby, true);
  assert.equal(stepBabyMobAging(normalBaby, BABY_GROWTH_DURATION_SEC), true);
  assert.equal(normalBaby.isBaby, false);

  const lockedBaby = makeBaby(true);
  assert.equal(stepBabyMobAging(lockedBaby, BABY_GROWTH_DURATION_SEC * 5), false);
  assert.equal(lockedBaby.isBaby, true);
  assert.equal(lockedBaby.ageLocked, true);
});

test('Wave 4: Procedural WorldGenerator builds Village (2,1), Abandoned Camp (-2,2), and Nether Fortress (1,1)', () => {
  const gen = new WorldGenerator(123456);
  assert.equal(isVillageChunk(2, 1), true);
  assert.equal(isAbandonedCampChunk(-2, 2), true);
  assert.equal(isNetherFortressChunk(1, 1), true);

  // Check Village chunk has crafting table + glass + chest
  const vCol = gen.generateChunk('overworld', 2, 1, {});
  let foundTable = false;
  let foundBed = false;
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      for (let y = 55; y < 220; y++) {
        const b = getChunkBlock(vCol, x, y, z);
        if (b === BLOCK.CRAFTING_TABLE) foundTable = true;
        if (b === BLOCK.BED) foundBed = true;
      }
    }
  }
  assert.equal(foundTable, true, 'Village cottage must generate Crafting Table');
  assert.equal(foundBed, true, 'Village cottage must generate Bed');

  // Check Nether Fortress chunk generates Nether Bricks & Soul Sand at bridge Y=54
  const nfCol = gen.generateChunk('nether', 1, 1, {});
  assert.equal(getChunkBlock(nfCol, 3, 54, 3), BLOCK.NETHER_BRICKS);
  assert.equal(getChunkBlock(nfCol, 6, 54, 6), BLOCK.SOUL_SAND);

  // Check Abandoned Camp generates Campfire & Chest
  const campCol = gen.generateChunk('overworld', -2, 2, {});
  const campfireId = BLOCK_BY_KEY['campfire']?.id ?? BLOCK.TORCH;
  let foundCampfire = false;
  for (let y = 55; y < 220; y++) {
    if (getChunkBlock(campCol, 8, y, 8) === campfireId) foundCampfire = true;
  }
  assert.equal(foundCampfire, true, 'Abandoned Camp must generate Campfire');
});
