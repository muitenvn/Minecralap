import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK, BLOCK_BY_KEY } from '../src/game/blocks';
import {
  isGravityBlock,
  settleFallingBlocks,
  stepFluidSpread,
  WorldBlockIO,
} from '../src/game/physicsWorld';

function createSparseWorld(): { world: WorldBlockIO; map: Map<string, number> } {
  const map = new Map<string, number>();
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const world: WorldBlockIO = {
    getBlock: (x, y, z) => map.get(key(x, y, z)) ?? BLOCK.AIR,
    setBlock: (x, y, z, id) => {
      const k = key(x, y, z);
      if (id === BLOCK.AIR) map.delete(k);
      else map.set(k, id);
    },
  };
  return { world, map };
}

test('Wave 11: Gravity block detector identifies Sand, Red Sand, Gravel, Anvil, and Concrete Powder', () => {
  assert.equal(isGravityBlock(BLOCK.SAND), true);
  assert.equal(isGravityBlock(BLOCK_BY_KEY['red_sand'].id), true);
  assert.equal(isGravityBlock(BLOCK_BY_KEY['gravel'].id), true);
  assert.equal(isGravityBlock(BLOCK_BY_KEY['anvil'].id), true);
  assert.equal(isGravityBlock(BLOCK_BY_KEY['white_concrete_powder'].id), true);

  assert.equal(isGravityBlock(BLOCK.STONE), false);
  assert.equal(isGravityBlock(BLOCK.DIRT), false);
  assert.equal(isGravityBlock(BLOCK_BY_KEY['white_concrete'].id), false);
});

test('Wave 11: Stacked Sand, Gravel, and Anvil collapse downward onto solid floor when undermined', () => {
  const { world } = createSparseWorld();
  const gravelId = BLOCK_BY_KEY['gravel'].id;
  const anvilId = BLOCK_BY_KEY['anvil'].id;

  // Solid floor at y=60, gap at y=61..62, stack at y=63..65
  world.setBlock(4, 60, 4, BLOCK.STONE);
  world.setBlock(4, 63, 4, BLOCK.SAND);
  world.setBlock(4, 64, 4, gravelId);
  world.setBlock(4, 65, 4, anvilId);

  const res = settleFallingBlocks(world, 4, 63, 4);
  assert.equal(res.movedCount, 3);
  assert.equal(world.getBlock(4, 61, 4), BLOCK.SAND);
  assert.equal(world.getBlock(4, 62, 4), gravelId);
  assert.equal(world.getBlock(4, 63, 4), anvilId);
  assert.equal(world.getBlock(4, 64, 4), BLOCK.AIR);
  assert.equal(world.getBlock(4, 65, 4), BLOCK.AIR);
});

test('Wave 11: Concrete Powder hardens into Concrete upon touching Water', () => {
  const { world } = createSparseWorld();
  const powderId = BLOCK_BY_KEY['blue_concrete_powder'].id;
  const concreteId = BLOCK_BY_KEY['blue_concrete'].id;

  world.setBlock(0, 60, 0, BLOCK.STONE);
  world.setBlock(1, 61, 0, BLOCK.WATER);
  world.setBlock(0, 63, 0, powderId);

  const res = settleFallingBlocks(world, 0, 63, 0);
  assert.equal(res.movedCount, 1);
  assert.equal(res.hardenedConcrete, 1);
  assert.equal(world.getBlock(0, 61, 0), concreteId);
  assert.equal(world.getBlock(0, 63, 0), BLOCK.AIR);
});

test('Wave 11: Fluid spread enables Cobblestone Generator and Water-on-Lava Obsidian solidification', () => {
  const { world } = createSparseWorld();

  // 1) Classic Cobblestone Generator: Water at (-1,64,0), Lava at (1,64,0), player mines (0,64,0) -> AIR
  for (let x = -2; x <= 2; x++) world.setBlock(x, 63, 0, BLOCK.STONE);
  world.setBlock(-1, 64, 0, BLOCK.WATER);
  world.setBlock(1, 64, 0, BLOCK.LAVA);

  const cobbleRes = stepFluidSpread(world, 0, 64, 0);
  assert.equal(cobbleRes.createdCobblestone, 1);
  assert.equal(world.getBlock(0, 64, 0), BLOCK.COBBLESTONE);

  // 2) Water placed directly on top of Lava solidifies Lava into Obsidian
  world.setBlock(10, 63, 10, BLOCK.STONE);
  world.setBlock(10, 64, 10, BLOCK.LAVA);
  world.setBlock(10, 65, 10, BLOCK.WATER);

  const obsRes = stepFluidSpread(world, 10, 65, 10);
  assert.ok(obsRes.createdObsidian >= 1);
  assert.equal(world.getBlock(10, 64, 10), BLOCK.OBSIDIAN);

  // 3) Water placed in mid-air flows downward to floor and spreads bounded horizontally
  for (let x = 20; x <= 26; x++) {
    for (let z = 20; z <= 26; z++) {
      world.setBlock(x, 60, z, BLOCK.STONE);
    }
  }
  world.setBlock(23, 62, 23, BLOCK.WATER);
  const spreadRes = stepFluidSpread(world, 23, 62, 23, 2);
  assert.ok(spreadRes.placedFluid >= 2);
  assert.equal(world.getBlock(23, 61, 23), BLOCK.WATER);
});
