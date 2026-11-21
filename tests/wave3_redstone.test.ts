import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK, BLOCK_BY_KEY } from '../src/game/blocks';
import { createEmptyChestSlots } from '../src/game/storage';
import {
  activatePiston,
  computeRedstonePowerAt,
  detectNoteInstrument,
  makeCoordKey,
  playNoteBlock,
  RedstoneWorldAccessor,
  stepHopperTransfer,
  toggleLever,
  updateRedstoneNetworkAround,
} from '../src/game/redstone';
import { ItemStack } from '../src/game/types';

function createMockRedstoneWorld(timeOfDay = 6000) {
  const blocks = new Map<string, number>();
  const states = new Map<string, number>();
  const chests = new Map<string, (ItemStack | null)[]>();
  const ignited: string[] = [];
  const playedNotes: { pitch: number; instrument: string }[] = [];

  const world: RedstoneWorldAccessor = {
    getBlock: (x, y, z) => blocks.get(makeCoordKey(x, y, z)) ?? BLOCK.AIR,
    setBlock: (x, y, z, id) => {
      if (id === BLOCK.AIR) blocks.delete(makeCoordKey(x, y, z));
      else blocks.set(makeCoordKey(x, y, z), id);
    },
    getState: (k) => states.get(k) ?? 0,
    setState: (k, v) => {
      if (v === 0) states.delete(k);
      else states.set(k, v);
    },
    getTimeOfDay: () => timeOfDay,
    igniteTnt: (x, y, z) => ignited.push(makeCoordKey(x, y, z)),
    playNote: (_x, _y, _z, pitch, instrument) => playedNotes.push({ pitch, instrument }),
    getChestSlots: (k) => chests.get(k) ?? null,
    setChestSlots: (k, slots) => chests.set(k, slots),
  };

  return { world, blocks, states, chests, ignited, playedNotes };
}

test('Wave 3: Redstone 0-15 power decay along redstone_wire and boost via repeater', () => {
  const { world } = createMockRedstoneWorld();
  const wireId = BLOCK_BY_KEY['redstone_wire'].id;
  const repeaterId = BLOCK_BY_KEY['repeater'].id;

  world.setBlock(0, 5, 0, BLOCK.REDSTONE_BLOCK);
  for (let x = 1; x <= 6; x++) {
    world.setBlock(x, 5, 0, wireId);
  }
  assert.equal(computeRedstonePowerAt(world, 0, 5, 0), 15);
  assert.equal(computeRedstonePowerAt(world, 1, 5, 0), 14);
  assert.equal(computeRedstonePowerAt(world, 5, 5, 0), 10);

  // Place repeater at x=6 to boost signal back up to 15!
  world.setBlock(6, 5, 0, repeaterId);
  world.setBlock(7, 5, 0, wireId);
  assert.equal(computeRedstonePowerAt(world, 7, 5, 0), 14);
});

test('Wave 3: Lever toggles Redstone Lamp ON/OFF and ignites TNT via wire', () => {
  const { world, ignited } = createMockRedstoneWorld();
  const leverId = BLOCK_BY_KEY['lever'].id;
  const wireId = BLOCK_BY_KEY['redstone_wire'].id;
  const lampOffId = BLOCK_BY_KEY['redstone_lamp'].id;
  const lampOnId = BLOCK_BY_KEY['redstone_lamp_on'].id;

  world.setBlock(0, 5, 0, leverId);
  world.setBlock(1, 5, 0, wireId);
  world.setBlock(2, 5, 0, lampOffId);
  world.setBlock(1, 5, 1, BLOCK.TNT);

  // Turn lever ON
  const onRes = toggleLever(world, 0, 5, 0);
  assert.equal(onRes.active, true);
  assert.equal(world.getBlock(2, 5, 0), lampOnId);
  assert.equal(onRes.ignitedTnt, 1);
  assert.deepEqual(ignited, ['1,5,1']);

  // Turn lever OFF -> lamp turns back OFF
  const offRes = toggleLever(world, 0, 5, 0);
  assert.equal(offRes.active, false);
  assert.equal(world.getBlock(2, 5, 0), lampOffId);
});

test('Wave 3: Piston pushes blocks, refuses bedrock/obsidian, and Sticky Piston retracts', () => {
  const { world } = createMockRedstoneWorld();
  // Push 3 stone blocks along +X
  world.setBlock(1, 5, 0, BLOCK.STONE);
  world.setBlock(2, 5, 0, BLOCK.DIRT);
  world.setBlock(3, 5, 0, BLOCK.OAK_PLANKS);

  const pushed = activatePiston(world, 0, 5, 0, 1, 0, 0, true, false);
  assert.equal(pushed, true);
  assert.equal(world.getBlock(1, 5, 0), BLOCK.AIR);
  assert.equal(world.getBlock(2, 5, 0), BLOCK.STONE);
  assert.equal(world.getBlock(3, 5, 0), BLOCK.DIRT);
  assert.equal(world.getBlock(4, 5, 0), BLOCK.OAK_PLANKS);

  // Sticky retract pulls STONE from x=2 back to x=1
  const pulled = activatePiston(world, 0, 5, 0, 1, 0, 0, true, true);
  assert.equal(pulled, true);
  assert.equal(world.getBlock(1, 5, 0), BLOCK.STONE);
  assert.equal(world.getBlock(2, 5, 0), BLOCK.AIR);

  // Refuse pushing obsidian
  world.setBlock(2, 5, 0, BLOCK.OBSIDIAN);
  const blocked = activatePiston(world, 0, 5, 0, 1, 0, 0, false, false);
  assert.equal(blocked, false);
  assert.equal(world.getBlock(2, 5, 0), BLOCK.OBSIDIAN);
});

test('Wave 3: Note Block Java 26.1 Copper Trumpet instrument detection & pitch cycling', () => {
  const { world, playedNotes } = createMockRedstoneWorld();
  const noteId = BLOCK_BY_KEY['note_block'].id;
  const copperId = BLOCK_BY_KEY['copper_block'].id;

  world.setBlock(5, 4, 5, copperId);
  world.setBlock(5, 5, 5, noteId);

  const note1 = playNoteBlock(world, 5, 5, 5, true);
  assert.equal(note1.instrument, 'trumpet');
  assert.equal(note1.pitch, 1);
  assert.equal(note1.labelVi, 'Kèn Đồng (26.1)');
  assert.equal(playedNotes.length, 1);

  assert.equal(detectNoteInstrument('gold_block'), 'bell');
  assert.equal(detectNoteInstrument('oak_planks'), 'bass');
  assert.equal(detectNoteInstrument('waxed_copper_block'), 'trumpet');
});

test('Wave 3: Hopper transfers items from top chest to bottom chest and locks when powered', () => {
  const { world, chests } = createMockRedstoneWorld();
  const src = createEmptyChestSlots();
  src[0] = { itemId: 'diamond', count: 5 };
  const dst = createEmptyChestSlots();

  chests.set('0,6,0', src);
  chests.set('0,4,0', dst);

  // Unpowered hopper transfers 1 diamond
  assert.equal(stepHopperTransfer(world, 0, 5, 0), true);
  assert.equal(chests.get('0,6,0')![0]?.count, 4);
  assert.equal(chests.get('0,4,0')![0]?.itemId, 'diamond');
  assert.equal(chests.get('0,4,0')![0]?.count, 1);

  // Power the hopper with adjacent Redstone Block -> hopper locks (Java Edition parity!)
  world.setBlock(1, 5, 0, BLOCK.REDSTONE_BLOCK);
  updateRedstoneNetworkAround(world, 1, 5, 0);
  assert.equal(stepHopperTransfer(world, 0, 5, 0), false);
  assert.equal(chests.get('0,6,0')![0]?.count, 4);
});
