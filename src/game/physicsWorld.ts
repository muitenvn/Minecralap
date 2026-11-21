import { BLOCK, BLOCK_BY_KEY, BLOCK_DEFS, isBlockSolid } from './blocks';
import { WORLD_HEIGHT_MAX } from './types';

export interface WorldBlockIO {
  getBlock(x: number, y: number, z: number): number;
  setBlock(x: number, y: number, z: number, blockId: number): void;
}

const GRAVITY_BLOCK_KEYS = new Set<string>([
  'sand',
  'red_sand',
  'gravel',
  'anvil',
  'suspicious_sand',
  'suspicious_gravel',
]);

export function isGravityBlock(blockId: number): boolean {
  const key = BLOCK_DEFS[blockId]?.key;
  if (!key) return false;
  return GRAVITY_BLOCK_KEYS.has(key) || key.endsWith('_concrete_powder');
}

function canFallThrough(blockId: number): boolean {
  return blockId === BLOCK.AIR || blockId === BLOCK.WATER || blockId === BLOCK.LAVA || !isBlockSolid(blockId);
}

/**
 * Settles a vertical column of gravity-affected blocks (Sand, Red Sand, Gravel, Anvil, Concrete Powder)
 * starting at (x, startY, z) and scanning upward so stacked sand collapses authentically like Java Edition.
 */
export function settleFallingBlocks(
  world: WorldBlockIO,
  x: number,
  startY: number,
  z: number,
): { movedCount: number; landedY: number | null; hardenedConcrete: number } {
  let movedCount = 0;
  let landedY: number | null = null;
  let hardenedConcrete = 0;

  // Scan upward from startY while blocks above are gravity blocks
  const maxScanY = Math.min(WORLD_HEIGHT_MAX - 2, startY + 24);
  for (let y = Math.max(1, startY); y <= maxScanY; y++) {
    const id = world.getBlock(x, y, z);
    if (!isGravityBlock(id)) {
      if (y > startY) break;
      continue;
    }

    let targetY = y;
    let touchedWater = false;
    while (targetY > 1) {
      const below = world.getBlock(x, targetY - 1, z);
      if (below === BLOCK.WATER) touchedWater = true;
      if (!canFallThrough(below)) break;
      targetY--;
    }

    const key = BLOCK_DEFS[id]?.key ?? '';
    let placedId = id;
    if (key.endsWith('_concrete_powder')) {
      const adjacentWater =
        touchedWater ||
        world.getBlock(x + 1, targetY, z) === BLOCK.WATER ||
        world.getBlock(x - 1, targetY, z) === BLOCK.WATER ||
        world.getBlock(x, targetY, z + 1) === BLOCK.WATER ||
        world.getBlock(x, targetY, z - 1) === BLOCK.WATER;
      if (adjacentWater) {
        const concreteKey = key.replace('_concrete_powder', '_concrete');
        const concreteId = BLOCK_BY_KEY[concreteKey]?.id;
        if (concreteId !== undefined) {
          placedId = concreteId;
          hardenedConcrete++;
        }
      }
    }

    if (targetY < y) {
      world.setBlock(x, y, z, BLOCK.AIR);
      world.setBlock(x, targetY, z, placedId);
      movedCount++;
      landedY = targetY;
    } else if (placedId !== id) {
      world.setBlock(x, y, z, placedId);
    }
  }

  return { movedCount, landedY, hardenedConcrete };
}

const HORIZONTAL_4: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Bounded Java-inspired fluid spread & Water + Lava solidification:
 * - Water + Lava interactions produce Cobblestone (side contact) or Obsidian (water onto lava source).
 * - Spreads downward first, then horizontally up to maxSpread (default 3 for water, 2 for lava)
 *   to keep WebGL2 chunk remeshing responsive while enabling working Cobblestone/Obsidian generators!
 */
export function stepFluidSpread(
  world: WorldBlockIO,
  originX: number,
  originY: number,
  originZ: number,
  maxSpread?: number,
): { placedFluid: number; createdCobblestone: number; createdObsidian: number } {
  const originId = world.getBlock(originX, originY, originZ);
  if (originId !== BLOCK.WATER && originId !== BLOCK.LAVA) {
    // Check if an adjacent fluid can flow into this newly vacated air cell!
    let placedFluid = 0;
    let createdCobblestone = 0;
    let createdObsidian = 0;
    if (originId === BLOCK.AIR) {
      const above = world.getBlock(originX, originY + 1, originZ);
      if (above === BLOCK.WATER || above === BLOCK.LAVA) {
        world.setBlock(originX, originY, originZ, above);
        const sub = stepFluidSpread(world, originX, originY, originZ, maxSpread);
        return {
          placedFluid: 1 + sub.placedFluid,
          createdCobblestone: sub.createdCobblestone,
          createdObsidian: sub.createdObsidian,
        };
      }
      let hasWater = false;
      let hasLava = false;
      for (const [dx, dz] of HORIZONTAL_4) {
        const nb = world.getBlock(originX + dx, originY, originZ + dz);
        if (nb === BLOCK.WATER) hasWater = true;
        if (nb === BLOCK.LAVA) hasLava = true;
      }
      if (hasWater && hasLava) {
        // Classic Minecraft Cobblestone Generator!
        world.setBlock(originX, originY, originZ, BLOCK.COBBLESTONE);
        createdCobblestone++;
      } else if (hasWater) {
        world.setBlock(originX, originY, originZ, BLOCK.WATER);
        placedFluid++;
      } else if (hasLava) {
        world.setBlock(originX, originY, originZ, BLOCK.LAVA);
        placedFluid++;
      }
    }
    return { placedFluid, createdCobblestone, createdObsidian };
  }

  const isWater = originId === BLOCK.WATER;
  const oppositeId = isWater ? BLOCK.LAVA : BLOCK.WATER;
  const limit = maxSpread ?? (isWater ? 3 : 2);

  let placedFluid = 0;
  let createdCobblestone = 0;
  let createdObsidian = 0;

  // 1. Check immediate solidification against adjacent opposite fluid
  const neighbors6: [number, number, number][] = [
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  for (const [dx, dy, dz] of neighbors6) {
    const nx = originX + dx;
    const ny = originY + dy;
    const nz = originZ + dz;
    if (world.getBlock(nx, ny, nz) === oppositeId) {
      if (isWater && dy === -1) {
        // Water falling directly onto Lava -> Obsidian!
        world.setBlock(nx, ny, nz, BLOCK.OBSIDIAN);
        createdObsidian++;
      } else if (isWater) {
        // Water touching Lava laterally -> Obsidian on source or Cobblestone on contact
        world.setBlock(nx, ny, nz, BLOCK.OBSIDIAN);
        createdObsidian++;
      } else {
        // Lava flowing into Water -> Cobblestone!
        world.setBlock(nx, ny, nz, BLOCK.COBBLESTONE);
        createdCobblestone++;
      }
    }
  }

  // 2. Bounded BFS downward + horizontal spread
  const visited = new Set<string>([`${originX},${originY},${originZ}`]);
  const queue: [number, number, number, number][] = [[originX, originY, originZ, 0]];
  let head = 0;

  while (head < queue.length && placedFluid < 14) {
    const [cx, cy, cz, dist] = queue[head++];

    // Flow downward first (up to 6 blocks below origin)
    if (cy > 1 && originY - cy < 6) {
      const below = world.getBlock(cx, cy - 1, cz);
      if (below === BLOCK.AIR) {
        world.setBlock(cx, cy - 1, cz, originId);
        placedFluid++;
        const k = `${cx},${cy - 1},${cz}`;
        if (!visited.has(k)) {
          visited.add(k);
          queue.push([cx, cy - 1, cz, dist]);
        }
        continue;
      } else if (below === oppositeId) {
        world.setBlock(cx, cy - 1, cz, isWater ? BLOCK.OBSIDIAN : BLOCK.COBBLESTONE);
        if (isWater) createdObsidian++;
        else createdCobblestone++;
        continue;
      }
    }

    if (dist >= limit) continue;

    // Spread horizontally on top of solid support
    for (const [dx, dz] of HORIZONTAL_4) {
      const nx = cx + dx;
      const nz = cz + dz;
      const k = `${nx},${cy},${nz}`;
      if (visited.has(k)) continue;
      const target = world.getBlock(nx, cy, nz);
      if (target === oppositeId) {
        world.setBlock(nx, cy, nz, BLOCK.COBBLESTONE);
        createdCobblestone++;
        visited.add(k);
      } else if (target === BLOCK.AIR) {
        world.setBlock(nx, cy, nz, originId);
        placedFluid++;
        visited.add(k);
        queue.push([nx, cy, nz, dist + 1]);
      }
    }
  }

  return { placedFluid, createdCobblestone, createdObsidian };
}
