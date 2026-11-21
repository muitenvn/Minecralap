import assert from 'node:assert/strict';
import test from 'node:test';
import { ADVANCEMENTS } from '../src/game/advancements';
import { BLOCK, BLOCK_BY_KEY } from '../src/game/blocks';
import {
  computeSubchunkLighting,
  sampleCombinedVertexLight,
  sampleVoxelLightLevels,
} from '../src/game/lighting';

test('Wave 17: 15-level Voxel Block-Light BFS decays by 1 per air block and is occluded by opaque stone walls', () => {
  const blocks = new Map<string, number>();
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const set = (x: number, y: number, z: number, id: number) => blocks.set(key(x, y, z), id);
  const get = (x: number, y: number, z: number) => blocks.get(key(x, y, z)) ?? BLOCK.AIR;

  // Place Sea Lantern (level 15 emitter) at local (8, 8, 8) inside subchunk (0, 64, 0)
  const seaLanternId = BLOCK_BY_KEY['sea_lantern']?.id ?? BLOCK.GLOWSTONE;
  set(8, 72, 8, seaLanternId);

  // Build an opaque Stone dividing wall at x = 10 completely blocking +X side (y=60..84, z=0..16)
  for (let y = 60; y <= 84; y++) {
    for (let z = -4; z <= 20; z++) {
      set(10, y, z, BLOCK.STONE);
    }
  }

  const state = computeSubchunkLighting(0, 64, 0, get);
  assert.equal(state.hasBlockLights, true);

  // Verify exact Java 1-per-block decay on open -X side
  const l0 = sampleVoxelLightLevels(8, 8, 8).blockLight;
  const l1 = sampleVoxelLightLevels(7, 8, 8).blockLight;
  const l3 = sampleVoxelLightLevels(5, 8, 8).blockLight;
  const l6 = sampleVoxelLightLevels(2, 8, 8).blockLight;

  assert.equal(l0, 15);
  assert.equal(l1, 14);
  assert.equal(l3, 12);
  assert.equal(l6, 9);

  // Verify opaque stone wall at x=10 blocks light from leaking straight through to x=11
  const behindWall = sampleVoxelLightLevels(11, 8, 8).blockLight;
  assert.equal(behindWall, 0);
});

test('Wave 17: 15-level Skylight distinguishes open sky (15) from sealed cave interior (0) and lights up when a Torch is placed', () => {
  const blocks = new Map<string, number>();
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const set = (x: number, y: number, z: number, id: number) => blocks.set(key(x, y, z), id);
  const get = (x: number, y: number, z: number) => blocks.get(key(x, y, z)) ?? BLOCK.AIR;

  // Build a completely sealed 7x7x7 stone cave box around (8, 72, 8)
  for (let x = 4; x <= 12; x++) {
    for (let y = 68; y <= 76; y++) {
      for (let z = 4; z <= 12; z++) {
        const isShell = x === 4 || x === 12 || y === 68 || y === 76 || z === 4 || z === 12;
        if (isShell) set(x, y, z, BLOCK.STONE);
      }
    }
  }

  // Pass 1: Unlit sealed cave vs open sky outside
  const darkState = computeSubchunkLighting(0, 64, 0, get);
  assert.equal(darkState.hasDarkInteriors, true);

  const openSky = sampleVoxelLightLevels(1, 12, 1);
  assert.equal(openSky.skyLight, 15);
  assert.equal(sampleCombinedVertexLight(1, 12, 1, darkState).skyScale, 1.0);

  const caveCenterDark = sampleVoxelLightLevels(8, 8, 8);
  assert.equal(caveCenterDark.skyLight, 0);
  assert.equal(caveCenterDark.blockLight, 0);
  const darkCombined = sampleCombinedVertexLight(8, 8, 8, darkState);
  assert.ok(darkCombined.skyScale < 0.5, `Expected dark cave skyScale < 0.5, got ${darkCombined.skyScale}`);

  // Pass 2: Place a Torch inside the cave at (8, 72, 8) -> illuminates interior brightly!
  set(8, 72, 8, BLOCK.TORCH);
  const litState = computeSubchunkLighting(0, 64, 0, get);
  const caveCenterLit = sampleVoxelLightLevels(8, 8, 8);
  assert.ok(caveCenterLit.blockLight >= 14, `Expected torch blockLight >= 14, got ${caveCenterLit.blockLight}`);
  const litCombined = sampleCombinedVertexLight(7, 8, 8, litState);
  assert.ok(litCombined.skyScale > 0.9, `Expected torch-lit cave skyScale > 0.9, got ${litCombined.skyScale}`);
  assert.ok(litCombined.boostR > 0.3, 'Expected warm red/orange torch color boost');
});

test('Wave 17: Expanded 25 Java Advancements include Shulker Box, Evoker Totem, and Mansion Explorer', () => {
  assert.equal(ADVANCEMENTS.length, 25);
  const ids = new Set(ADVANCEMENTS.map((a) => a.id));
  assert.equal(ids.has('shulker_box_pack'), true);
  assert.equal(ids.has('evoker_totem'), true);
  assert.equal(ids.has('mansion_explorer'), true);
});
