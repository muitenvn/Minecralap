import * as THREE from 'three';
import {
  BLOCK,
  BLOCK_DEFS,
  BlockShape,
  getBlockLightEmission,
  getBlockShape,
  isBlockLiquid,
  isFullOpaqueCube,
} from './blocks';
import { AtlasUV } from './resourcePack';
import { CHUNK_SIZE } from './types';
import { ChunkColumn, sectionIndex } from './worldGen';

export type BlockGetter = (wx: number, wy: number, wz: number) => number;

interface FaceSpec {
  dir: [number, number, number];
  corners: [number, number, number][];
  uvOrder: [number, number][];
  shade: number;
  faceType: 'top' | 'bottom' | 'side' | 'front';
}

const FACES: FaceSpec[] = [
  {
    // +Y top
    dir: [0, 1, 0],
    corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
    uvOrder: [[0, 0], [1, 0], [1, 1], [0, 1]],
    shade: 1.0,
    faceType: 'top',
  },
  {
    // -Y bottom
    dir: [0, -1, 0],
    corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
    uvOrder: [[0, 0], [1, 0], [1, 1], [0, 1]],
    shade: 0.56,
    faceType: 'bottom',
  },
  {
    // +Z front
    dir: [0, 0, 1],
    corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
    uvOrder: [[0, 0], [1, 0], [1, 1], [0, 1]],
    shade: 0.86,
    faceType: 'front',
  },
  {
    // -Z back
    dir: [0, 0, -1],
    corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
    uvOrder: [[0, 0], [1, 0], [1, 1], [0, 1]],
    shade: 0.78,
    faceType: 'side',
  },
  {
    // +X right
    dir: [1, 0, 0],
    corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
    uvOrder: [[0, 0], [1, 0], [1, 1], [0, 1]],
    shade: 0.88,
    faceType: 'side',
  },
  {
    // -X left
    dir: [-1, 0, 0],
    corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
    uvOrder: [[0, 0], [1, 0], [1, 1], [0, 1]],
    shade: 0.74,
    faceType: 'side',
  },
];

export interface SubChunkBuildResult {
  opaque: THREE.BufferGeometry | null;
  translucent: THREE.BufferGeometry | null;
  emissive: THREE.BufferGeometry | null;
}

interface MeshBuf {
  pos: number[];
  norm: number[];
  uv: number[];
  col: number[];
  idx: number[];
}

function makeBuf(): MeshBuf {
  return { pos: [], norm: [], uv: [], col: [], idx: [] };
}

function vertexAO(side1: boolean, side2: boolean, corner: boolean): number {
  if (side1 && side2) return 0.58;
  const occ = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
  if (occ === 0) return 1.0;
  if (occ === 1) return 0.87;
  if (occ === 2) return 0.73;
  return 0.58;
}

function buildGeometryFromBuf(b: MeshBuf): THREE.BufferGeometry | null {
  if (b.pos.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.norm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
  geo.setIndex(b.idx);
  geo.computeBoundingSphere();
  return geo;
}

// Reused scratch buffers for fast local voxel block-light BFS (padded 16 + 2*PAD = 28^3)
const LIGHT_PAD = 6;
const LIGHT_DIM = 16 + LIGHT_PAD * 2; // 28
const LIGHT_VOL = LIGHT_DIM * LIGHT_DIM * LIGHT_DIM;
const lightLvlGrid = new Uint8Array(LIGHT_VOL);
const lightRGrid = new Float32Array(LIGHT_VOL);
const lightGGrid = new Float32Array(LIGHT_VOL);
const lightBGrid = new Float32Array(LIGHT_VOL);
const opaqueGrid = new Uint8Array(LIGHT_VOL);
const bfsQueue = new Int32Array(LIGHT_VOL * 2);

function lIdx(x: number, y: number, z: number): number {
  return (y * LIGHT_DIM + z) * LIGHT_DIM + x;
}

function computeLocalBlockLight(
  xBase: number,
  yBase: number,
  zBase: number,
  getBlock: BlockGetter,
): boolean {
  let qHead = 0;
  let qTail = 0;
  let hasLights = false;

  // Quick pre-scan padded volume for emitters
  for (let py = 0; py < LIGHT_DIM; py++) {
    const wy = yBase + py - LIGHT_PAD;
    for (let pz = 0; pz < LIGHT_DIM; pz++) {
      const wz = zBase + pz - LIGHT_PAD;
      for (let px = 0; px < LIGHT_DIM; px++) {
        const wx = xBase + px - LIGHT_PAD;
        const idx = lIdx(px, py, pz);
        const bid = getBlock(wx, wy, wz);
        opaqueGrid[idx] = isFullOpaqueCube(bid) ? 1 : 0;
        const em = getBlockLightEmission(bid);
        if (em.level > 0) {
          hasLights = true;
          lightLvlGrid[idx] = em.level;
          lightRGrid[idx] = em.r;
          lightGGrid[idx] = em.g;
          lightBGrid[idx] = em.b;
          bfsQueue[qTail++] = idx;
        } else {
          lightLvlGrid[idx] = 0;
        }
      }
    }
  }

  if (!hasLights) return false;

  const D = LIGHT_DIM;
  const D2 = D * D;
  while (qHead < qTail) {
    const cur = bfsQueue[qHead++];
    const curLvl = lightLvlGrid[cur];
    if (curLvl <= 2) continue;
    const nextLvl = curLvl - 2; // crisp ~7-block warm radius

    const py = Math.floor(cur / D2);
    const rem = cur - py * D2;
    const pz = Math.floor(rem / D);
    const px = rem - pz * D;

    const r = lightRGrid[cur];
    const g = lightGGrid[cur];
    const b = lightBGrid[cur];

    const step = (nx: number, ny: number, nz: number) => {
      if (nx < 0 || nx >= D || ny < 0 || ny >= D || nz < 0 || nz >= D) return;
      const nIdx = lIdx(nx, ny, nz);
      if (opaqueGrid[nIdx]) return;
      if (nextLvl > lightLvlGrid[nIdx]) {
        lightLvlGrid[nIdx] = nextLvl;
        lightRGrid[nIdx] = r;
        lightGGrid[nIdx] = g;
        lightBGrid[nIdx] = b;
        bfsQueue[qTail++] = nIdx;
      }
    };

    step(px + 1, py, pz);
    step(px - 1, py, pz);
    step(px, py + 1, pz);
    step(px, py - 1, pz);
    step(px, py, pz + 1);
    step(px, py, pz - 1);
  }

  return true;
}

// Emits a custom pixel-sized sub-block box (coordinates in 0..16 Minecraft pixel units) with accurate cropped UVs!
function emitSubBox(
  buf: MeshBuf,
  lx: number,
  wy: number,
  lz: number,
  x0Px: number,
  y0Px: number,
  z0Px: number,
  x1Px: number,
  y1Px: number,
  z1Px: number,
  tiles: { top: AtlasUV; bottom: AtlasUV; side: AtlasUV; front?: AtlasUV },
  lr: number,
  lg: number,
  lb: number,
  uvCropMode: 'auto' | 'full' | 'torch' | 'lantern_body' | 'lantern_cap' = 'auto',
): void {
  const x0 = x0Px / 16;
  const y0 = y0Px / 16;
  const z0 = z0Px / 16;
  const x1 = x1Px / 16;
  const y1 = y1Px / 16;
  const z1 = z1Px / 16;

  for (let f = 0; f < 6; f++) {
    const face = FACES[f];
    let tile = tiles.side;
    if (face.faceType === 'top') tile = tiles.top;
    else if (face.faceType === 'bottom') tile = tiles.bottom;
    else if (face.faceType === 'front' && tiles.front) tile = tiles.front;

    // Sub-tile UV fractions in [0..1] (0 = left/bottom, 1 = right/top)
    let fu0 = 0;
    let fu1 = 1;
    let fv0 = 0;
    let fv1 = 1;

    if (uvCropMode === 'auto') {
      if (face.faceType === 'top' || face.faceType === 'bottom') {
        fu0 = x0;
        fu1 = x1;
        fv0 = z0;
        fv1 = z1;
      } else if (face.dir[2] !== 0) {
        fu0 = x0;
        fu1 = x1;
        fv0 = y0;
        fv1 = y1;
      } else {
        fu0 = z0;
        fu1 = z1;
        fv0 = y0;
        fv1 = y1;
      }
    } else if (uvCropMode === 'torch') {
      // Official Minecraft torch texture: vertical stick sits at x=7..9, y=0..10 (bottom=0, top=10)
      if (face.faceType === 'top') {
        fu0 = 7 / 16;
        fu1 = 9 / 16;
        fv0 = 8 / 16;
        fv1 = 10 / 16;
      } else if (face.faceType === 'bottom') {
        fu0 = 7 / 16;
        fu1 = 9 / 16;
        fv0 = 0;
        fv1 = 2 / 16;
      } else {
        fu0 = 7 / 16;
        fu1 = 9 / 16;
        fv0 = 0;
        fv1 = 10 / 16;
      }
    } else if (uvCropMode === 'lantern_body') {
      // Official Minecraft lantern texture (16x16 top frame): body sides at u=0..6, v=7..14 (in bottom-up: 2..9? No: in lantern.png top-left 6x7 is body!)
      // Top-down pixel rows: body is x=0..6, y=2..9 (bottom-up: v = 7/16 .. 14/16), top/bottom cap is x=0..6, y=9..15
      if (face.faceType === 'top' || face.faceType === 'bottom') {
        fu0 = 0 / 16;
        fu1 = 6 / 16;
        fv0 = 1 / 16;
        fv1 = 7 / 16;
      } else {
        fu0 = 0 / 16;
        fu1 = 6 / 16;
        fv0 = 7 / 16;
        fv1 = 14 / 16;
      }
    } else if (uvCropMode === 'lantern_cap') {
      fu0 = 1 / 16;
      fu1 = 5 / 16;
      fv0 = 14 / 16;
      fv1 = 16 / 16;
    }

    const uSpan = tile.u1 - tile.u0;
    const vSpan = tile.v1 - tile.v0;
    const uMin = tile.u0 + uSpan * fu0;
    const uMax = tile.u0 + uSpan * fu1;
    const vMin = tile.v0 + vSpan * fv0;
    const vMax = tile.v0 + vSpan * fv1;

    const vStart = buf.pos.length / 3;
    const r = lr * face.shade;
    const g = lg * face.shade;
    const b = lb * face.shade;

    for (let k = 0; k < 4; k++) {
      const c = face.corners[k];
      buf.pos.push(
        lx + (c[0] === 0 ? x0 : x1),
        wy + (c[1] === 0 ? y0 : y1),
        lz + (c[2] === 0 ? z0 : z1),
      );
      buf.norm.push(face.dir[0], face.dir[1], face.dir[2]);
      buf.uv.push(
        face.uvOrder[k][0] === 0 ? uMin : uMax,
        face.uvOrder[k][1] === 0 ? vMin : vMax,
      );
      buf.col.push(r, g, b);
    }
    buf.idx.push(vStart, vStart + 1, vStart + 2, vStart, vStart + 2, vStart + 3);
  }
}

// Emits crossed diagonal planes (flowers, saplings, tall grass, fire, cobweb, chains, campfire flames)
function emitCrossQuad(
  buf: MeshBuf,
  lx: number,
  wy: number,
  lz: number,
  tile: AtlasUV,
  lr: number,
  lg: number,
  lb: number,
  inset = 0.14,
  y0 = 0,
  y1 = 0.96,
  uFrac0 = 0,
  uFrac1 = 1,
  vFrac0 = 0,
  vFrac1 = 1,
): void {
  const a = inset;
  const b = 1 - inset;
  const uSpan = tile.u1 - tile.u0;
  const vSpan = tile.v1 - tile.v0;
  const uMin = tile.u0 + uSpan * uFrac0;
  const uMax = tile.u0 + uSpan * uFrac1;
  const vMin = tile.v0 + vSpan * vFrac0;
  const vMax = tile.v0 + vSpan * vFrac1;

  const quads: [number, number, number][][] = [
    [[a, y0, a], [b, y0, b], [b, y1, b], [a, y1, a]],
    [[b, y0, b], [a, y0, a], [a, y1, a], [b, y1, b]],
    [[b, y0, a], [a, y0, b], [a, y1, b], [b, y1, a]],
    [[a, y0, b], [b, y0, a], [b, y1, a], [a, y1, b]],
  ];

  for (const q of quads) {
    const vStart = buf.pos.length / 3;
    for (let k = 0; k < 4; k++) {
      buf.pos.push(lx + q[k][0], wy + q[k][1], lz + q[k][2]);
      buf.norm.push(0, 1, 0);
      buf.uv.push(
        k === 0 || k === 3 ? uMin : uMax,
        k === 0 || k === 1 ? vMin : vMax,
      );
      buf.col.push(lr, lg, lb);
    }
    buf.idx.push(vStart, vStart + 1, vStart + 2, vStart, vStart + 2, vStart + 3);
  }
}

function canFenceConnect(neighborId: number): boolean {
  if (neighborId === BLOCK.AIR) return false;
  if (isFullOpaqueCube(neighborId)) return true;
  const s = getBlockShape(neighborId);
  return s === 'fence' || s === 'wall' || s === 'fence_gate';
}

function canPaneConnect(neighborId: number): boolean {
  if (neighborId === BLOCK.AIR) return false;
  if (isFullOpaqueCube(neighborId)) return true;
  if (neighborId === BLOCK.GLASS || BLOCK_DEFS[neighborId]?.key.endsWith('_stained_glass')) return true;
  const s = getBlockShape(neighborId);
  return s === 'pane' || s === 'wall';
}

export function buildSubChunkGeometry(
  col: ChunkColumn,
  sy: number,
  getBlock: BlockGetter,
  uvMap: Record<string, AtlasUV>,
  smoothLighting: boolean,
  fancyLeaves: boolean,
): SubChunkBuildResult {
  const sec = col.sections[sy];
  if (!sec) return { opaque: null, translucent: null, emissive: null };

  const xBase = col.cx * CHUNK_SIZE;
  const yBase = sy * 16;
  const zBase = col.cz * CHUNK_SIZE;

  const hasLocalLights = computeLocalBlockLight(xBase, yBase, zBase, getBlock);

  const oBuf = makeBuf();
  const tBuf = makeBuf();
  const eBuf = makeBuf();

  const fallbackTile = uvMap.stone || Object.values(uvMap)[0];
  const tileOf = (key: string): AtlasUV => uvMap[key] || fallbackTile;

  // Helper to sample warm/colored block light at a local coordinate (lx, ly, lz) in 0..15
  const sampleLightBoost = (
    gx: number,
    gy: number,
    gz: number,
  ): [number, number, number] => {
    if (!hasLocalLights) return [0, 0, 0];
    const px = gx + LIGHT_PAD;
    const py = gy + LIGHT_PAD;
    const pz = gz + LIGHT_PAD;
    if (px < 0 || px >= LIGHT_DIM || py < 0 || py >= LIGHT_DIM || pz < 0 || pz >= LIGHT_DIM) {
      return [0, 0, 0];
    }
    const idx = lIdx(px, py, pz);
    const lvl = lightLvlGrid[idx];
    if (lvl <= 0) return [0, 0, 0];
    const strength = (lvl / 15) * 0.58;
    return [lightRGrid[idx] * strength, lightGGrid[idx] * strength, lightBGrid[idx] * strength];
  };

  for (let ly = 0; ly < 16; ly++) {
    const wy = yBase + ly;
    for (let lz = 0; lz < 16; lz++) {
      const wz = zBase + lz;
      for (let lx = 0; lx < 16; lx++) {
        const id = sec[sectionIndex(lx, ly, lz)];
        if (id === BLOCK.AIR) continue;
        const def = BLOCK_DEFS[id];
        if (!def) continue;

        const wx = xBase + lx;
        const shape: BlockShape = getBlockShape(id);
        const emission = getBlockLightEmission(id);
        const isLightSource = emission.level >= 10;

        const tiles = {
          top: tileOf(def.textures.top),
          bottom: tileOf(def.textures.bottom),
          side: tileOf(def.textures.side),
          front: def.textures.front ? tileOf(def.textures.front) : undefined,
        };

        // Compute base lighting tint for custom non-cube models
        const [br, bg, bb] = sampleLightBoost(lx, ly, lz);
        const subR = Math.min(1.35, 1.0 + br);
        const subG = Math.min(1.35, 1.0 + bg);
        const subB = Math.min(1.35, 1.0 + bb);

        // =====================================================================
        // CUSTOM NON-CUBE MINECRAFT 3D BLOCK GEOMETRY (SMALL & SHAPED BLOCKS!)
        // =====================================================================
        if (shape !== 'cube' && shape !== 'liquid') {
          if (shape === 'torch') {
            // Authentic 3D 2x10px vertical Minecraft torch stick rendered into emissive buffer so flame glows!
            emitSubBox(eBuf, lx, wy, lz, 7, 0, 7, 9, 10, 9, tiles, 1.0, 1.0, 1.0, 'torch');
            continue;
          }

          if (shape === 'lantern') {
            // Standing vs Hanging Lantern (checks if block above is solid!)
            const hanging = isFullOpaqueCube(getBlock(wx, wy + 1, wz)) || getBlockShape(getBlock(wx, wy + 1, wz)) === 'chain';
            const yOff = hanging ? 1 : 0;
            // Glowing lantern body 6x7x6
            emitSubBox(eBuf, lx, wy, lz, 5, yOff, 5, 11, 7 + yOff, 11, tiles, 1.0, 1.0, 1.0, 'lantern_body');
            // Metal cap 4x2x4
            emitSubBox(oBuf, lx, wy, lz, 6, 7 + yOff, 6, 10, 9 + yOff, 10, tiles, subR, subG, subB, 'lantern_cap');
            // Hanging ring / chain link on top
            const chainTile = tileOf('chain');
            emitCrossQuad(
              tBuf,
              lx,
              wy,
              lz,
              chainTile,
              subR,
              subG,
              subB,
              0.38,
              (9 + yOff) / 16,
              hanging ? 1.0 : (12 + yOff) / 16,
              0,
              0.25,
              0,
              0.5,
            );
            continue;
          }

          if (shape === 'cross') {
            const target = isLightSource ? eBuf : tBuf;
            const cR = isLightSource ? 1.0 : subR;
            const cG = isLightSource ? 1.0 : subG;
            const cB = isLightSource ? 1.0 : subB;
            emitCrossQuad(target, lx, wy, lz, tiles.side, cR, cG, cB, 0.14, 0, 0.96);
            continue;
          }

          if (shape === 'chain') {
            emitCrossQuad(tBuf, lx, wy, lz, tiles.side, subR, subG, subB, 0.36, 0, 1.0, 0, 0.25, 0, 1);
            continue;
          }

          if (shape === 'end_rod') {
            emitSubBox(oBuf, lx, wy, lz, 6, 0, 6, 10, 1, 10, tiles, subR, subG, subB, 'full');
            emitSubBox(eBuf, lx, wy, lz, 7, 1, 7, 9, 16, 9, tiles, 1.0, 1.0, 1.0, 'full');
            continue;
          }

          if (shape === 'slab') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 8, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'stairs') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 8, 16, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 8, 0, 16, 16, 8, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'fence') {
            // Center wooden/nether post (4x16x4)
            emitSubBox(oBuf, lx, wy, lz, 6, 0, 6, 10, 16, 10, tiles, subR, subG, subB);
            // Auto-connect horizontal rails to adjacent fences/walls/blocks
            if (canFenceConnect(getBlock(wx + 1, wy, wz))) {
              emitSubBox(oBuf, lx, wy, lz, 10, 6, 7, 16, 9, 9, tiles, subR, subG, subB);
              emitSubBox(oBuf, lx, wy, lz, 10, 12, 7, 16, 15, 9, tiles, subR, subG, subB);
            }
            if (canFenceConnect(getBlock(wx - 1, wy, wz))) {
              emitSubBox(oBuf, lx, wy, lz, 0, 6, 7, 6, 9, 9, tiles, subR, subG, subB);
              emitSubBox(oBuf, lx, wy, lz, 0, 12, 7, 6, 15, 9, tiles, subR, subG, subB);
            }
            if (canFenceConnect(getBlock(wx, wy, wz + 1))) {
              emitSubBox(oBuf, lx, wy, lz, 7, 6, 10, 9, 9, 16, tiles, subR, subG, subB);
              emitSubBox(oBuf, lx, wy, lz, 7, 12, 10, 9, 15, 16, tiles, subR, subG, subB);
            }
            if (canFenceConnect(getBlock(wx, wy, wz - 1))) {
              emitSubBox(oBuf, lx, wy, lz, 7, 6, 0, 9, 9, 6, tiles, subR, subG, subB);
              emitSubBox(oBuf, lx, wy, lz, 7, 12, 0, 9, 15, 6, tiles, subR, subG, subB);
            }
            continue;
          }

          if (shape === 'wall') {
            emitSubBox(oBuf, lx, wy, lz, 4, 0, 4, 12, 16, 12, tiles, subR, subG, subB);
            if (canFenceConnect(getBlock(wx + 1, wy, wz))) emitSubBox(oBuf, lx, wy, lz, 12, 0, 5, 16, 14, 11, tiles, subR, subG, subB);
            if (canFenceConnect(getBlock(wx - 1, wy, wz))) emitSubBox(oBuf, lx, wy, lz, 0, 0, 5, 4, 14, 11, tiles, subR, subG, subB);
            if (canFenceConnect(getBlock(wx, wy, wz + 1))) emitSubBox(oBuf, lx, wy, lz, 5, 0, 12, 11, 14, 16, tiles, subR, subG, subB);
            if (canFenceConnect(getBlock(wx, wy, wz - 1))) emitSubBox(oBuf, lx, wy, lz, 5, 0, 0, 11, 14, 4, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'fence_gate') {
            emitSubBox(oBuf, lx, wy, lz, 0, 5, 7, 2, 16, 9, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 14, 5, 7, 16, 16, 9, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 2, 6, 7, 14, 9, 9, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 2, 12, 7, 14, 15, 9, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 6, 9, 7, 10, 12, 9, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'pane') {
            const pBuf = tBuf;
            emitSubBox(pBuf, lx, wy, lz, 7, 0, 7, 9, 16, 9, tiles, subR, subG, subB);
            if (canPaneConnect(getBlock(wx + 1, wy, wz))) emitSubBox(pBuf, lx, wy, lz, 9, 0, 7, 16, 16, 9, tiles, subR, subG, subB);
            if (canPaneConnect(getBlock(wx - 1, wy, wz))) emitSubBox(pBuf, lx, wy, lz, 0, 0, 7, 7, 16, 9, tiles, subR, subG, subB);
            if (canPaneConnect(getBlock(wx, wy, wz + 1))) emitSubBox(pBuf, lx, wy, lz, 7, 0, 9, 9, 16, 16, tiles, subR, subG, subB);
            if (canPaneConnect(getBlock(wx, wy, wz - 1))) emitSubBox(pBuf, lx, wy, lz, 7, 0, 0, 9, 16, 7, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'carpet') {
            const target = def.transparent ? tBuf : oBuf;
            emitSubBox(target, lx, wy, lz, 0, 0, 0, 16, 1, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'pressure_plate') {
            emitSubBox(oBuf, lx, wy, lz, 1, 0, 1, 15, 1, 15, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'button') {
            emitSubBox(oBuf, lx, wy, lz, 5, 0, 6, 11, 2, 10, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'rail') {
            // Flat rail panel resting cleanly at y = 0.05
            const target = isLightSource ? eBuf : tBuf;
            const vStart = target.pos.length / 3;
            const t = tiles.side;
            const yRail = 0.05;
            const r = isLightSource ? 1.0 : subR;
            const g = isLightSource ? 1.0 : subG;
            const b = isLightSource ? 1.0 : subB;
            target.pos.push(
              lx, wy + yRail, lz + 1,
              lx + 1, wy + yRail, lz + 1,
              lx + 1, wy + yRail, lz,
              lx, wy + yRail, lz,
            );
            target.norm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
            target.uv.push(t.u0, t.v0, t.u1, t.v0, t.u1, t.v1, t.u0, t.v1);
            target.col.push(r, g, b, r, g, b, r, g, b, r, g, b);
            target.idx.push(vStart, vStart + 1, vStart + 2, vStart, vStart + 2, vStart + 3);
            continue;
          }

          if (shape === 'ladder') {
            // Hug whichever adjacent solid block exists (default -Z back wall)
            if (isFullOpaqueCube(getBlock(wx, wy, wz + 1))) {
              emitSubBox(tBuf, lx, wy, lz, 0, 0, 14.5, 16, 16, 16, tiles, subR, subG, subB, 'full');
            } else if (isFullOpaqueCube(getBlock(wx - 1, wy, wz))) {
              emitSubBox(tBuf, lx, wy, lz, 0, 0, 0, 1.5, 16, 16, tiles, subR, subG, subB, 'full');
            } else if (isFullOpaqueCube(getBlock(wx + 1, wy, wz))) {
              emitSubBox(tBuf, lx, wy, lz, 14.5, 0, 0, 16, 16, 16, tiles, subR, subG, subB, 'full');
            } else {
              emitSubBox(tBuf, lx, wy, lz, 0, 0, 0, 16, 16, 1.5, tiles, subR, subG, subB, 'full');
            }
            continue;
          }

          if (shape === 'trapdoor') {
            emitSubBox(tBuf, lx, wy, lz, 0, 0, 0, 16, 3, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'door') {
            emitSubBox(tBuf, lx, wy, lz, 0, 0, 0, 16, 16, 3, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'campfire') {
            const logTile = tileOf('oak_log');
            const logTiles = { top: logTile, bottom: logTile, side: logTile };
            // 4 crossed campfire logs
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 1, 16, 4, 5, logTiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 11, 16, 4, 15, logTiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 1, 3, 0, 5, 7, 16, logTiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 11, 3, 0, 15, 7, 16, logTiles, subR, subG, subB);
            // Glowing ember bed + crossed flames!
            emitSubBox(eBuf, lx, wy, lz, 4, 0.5, 4, 12, 3, 12, tiles, 1.0, 1.0, 1.0);
            const flameTile = def.key === 'soul_campfire' ? tileOf('soul_fire') : tiles.top;
            emitCrossQuad(eBuf, lx, wy, lz, flameTile, 1.0, 1.0, 1.0, 0.16, 0.2, 1.0);
            continue;
          }

          if (shape === 'bed') {
            const woodTile = tileOf('oak_planks');
            const legTiles = { top: woodTile, bottom: woodTile, side: woodTile };
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 3, 3, 3, legTiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 13, 0, 0, 16, 3, 3, legTiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 13, 3, 3, 16, legTiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 13, 0, 13, 16, 3, 16, legTiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 3, 0, 16, 9, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'anvil') {
            emitSubBox(oBuf, lx, wy, lz, 2, 0, 2, 14, 4, 14, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 4, 4, 3, 12, 10, 13, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 10, 3, 16, 16, 13, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'enchanting_table') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 12, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'cake') {
            emitSubBox(oBuf, lx, wy, lz, 1, 0, 1, 15, 8, 15, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'chest') {
            emitSubBox(oBuf, lx, wy, lz, 1, 0, 1, 15, 14, 15, tiles, subR, subG, subB, 'full');
            const latchTile = tileOf('iron_block');
            emitSubBox(oBuf, lx, wy, lz, 7, 7, 15, 9, 11, 16, { top: latchTile, bottom: latchTile, side: latchTile }, subR, subG, subB);
            continue;
          }

          if (shape === 'bell') {
            const beamTile = tileOf('oak_log');
            emitSubBox(oBuf, lx, wy, lz, 0, 13, 7, 16, 15, 9, { top: beamTile, bottom: beamTile, side: beamTile }, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 4, 3, 4, 12, 13, 12, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 3, 1, 3, 13, 3, 13, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'flower_pot') {
            emitSubBox(oBuf, lx, wy, lz, 5, 0, 5, 11, 6, 11, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'lever') {
            const baseTile = tileOf('cobblestone');
            emitSubBox(oBuf, lx, wy, lz, 5, 0, 4, 11, 3, 12, { top: baseTile, bottom: baseTile, side: baseTile }, subR, subG, subB);
            const stickTile = tileOf('oak_planks');
            emitSubBox(oBuf, lx, wy, lz, 7, 3, 7, 9, 11, 9, { top: stickTile, bottom: stickTile, side: stickTile }, subR, subG, subB);
            continue;
          }

          if (shape === 'sign') {
            emitSubBox(oBuf, lx, wy, lz, 7, 0, 7, 9, 9, 9, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 9, 7, 16, 16, 9, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'bamboo') {
            emitSubBox(oBuf, lx, wy, lz, 6, 0, 6, 10, 16, 10, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'cactus') {
            emitSubBox(oBuf, lx, wy, lz, 1, 0, 1, 15, 16, 15, tiles, subR, subG, subB, 'full');
            continue;
          }

          if (shape === 'repeater') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 2, 16, tiles, subR, subG, subB);
            const rtTile = tileOf('redstone_torch');
            emitSubBox(eBuf, lx, wy, lz, 7, 2, 3, 9, 6, 5, { top: rtTile, bottom: rtTile, side: rtTile }, 1, 1, 1, 'torch');
            emitSubBox(eBuf, lx, wy, lz, 7, 2, 11, 9, 6, 13, { top: rtTile, bottom: rtTile, side: rtTile }, 1, 1, 1, 'torch');
            continue;
          }

          if (shape === 'daylight_detector') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 6, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'stonecutter') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 9, 16, tiles, subR, subG, subB);
            const ironTile = tileOf('iron_block');
            emitSubBox(oBuf, lx, wy, lz, 2, 9, 7.5, 14, 15, 8.5, { top: ironTile, bottom: ironTile, side: ironTile }, subR, subG, subB);
            continue;
          }

          if (shape === 'grindstone') {
            const legTile = tileOf('oak_planks');
            emitSubBox(oBuf, lx, wy, lz, 2, 0, 6, 4, 9, 10, { top: legTile, bottom: legTile, side: legTile }, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 12, 0, 6, 14, 9, 10, { top: legTile, bottom: legTile, side: legTile }, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 4, 4, 2, 12, 16, 14, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'lectern') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 2, 16, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 4, 2, 4, 12, 13, 12, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 12, 1, 16, 15, 15, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'cauldron') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 3, 16, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 0, 3, 0, 2, 16, 16, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 14, 3, 0, 16, 16, 16, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 2, 3, 0, 14, 16, 2, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 2, 3, 14, 14, 16, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'hopper') {
            emitSubBox(oBuf, lx, wy, lz, 0, 10, 0, 16, 16, 16, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 4, 4, 4, 12, 10, 12, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 6, 0, 6, 10, 4, 10, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'end_portal_frame') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 13, 16, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'conduit') {
            emitSubBox(eBuf, lx, wy, lz, 5, 5, 5, 11, 11, 11, tiles, 1, 1, 1, 'full');
            continue;
          }

          if (shape === 'dragon_egg') {
            emitSubBox(oBuf, lx, wy, lz, 1, 0, 1, 15, 8, 15, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 3, 8, 3, 13, 13, 13, tiles, subR, subG, subB);
            emitSubBox(oBuf, lx, wy, lz, 5, 13, 5, 11, 16, 11, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'turtle_egg') {
            emitSubBox(oBuf, lx, wy, lz, 5, 0, 5, 11, 7, 11, tiles, subR, subG, subB);
            continue;
          }

          if (shape === 'farmland') {
            emitSubBox(oBuf, lx, wy, lz, 0, 0, 0, 16, 15, 16, tiles, subR, subG, subB);
            continue;
          }
        }

        // =====================================================================
        // FULL CUBE & LIQUID BLOCKS (WITH REAL NEIGHBOR CULLING + BLOCK LIGHT!)
        // =====================================================================
        const isLiquid = isBlockLiquid(id);
        const isTrans = Boolean(def.transparent) && (id !== BLOCK.OAK_LEAVES || fancyLeaves);
        // Glowing solid cubes (Glowstone, Shroomlight, Sea Lantern, Jack o'Lantern, Lava, Redstone Lamp, Beacon, Nether Portal)
        // go to emissive buffer so they shine brightly even at midnight!
        const useEmissiveBuf = isLightSource && !isTrans;
        const targetBuf = useEmissiveBuf ? eBuf : isTrans ? tBuf : oBuf;

        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const nx = wx + face.dir[0];
          const ny = wy + face.dir[1];
          const nz = wz + face.dir[2];

          const neighbor = getBlock(nx, ny, nz);
          if (
            neighbor === id &&
            (isLiquid ||
              id === BLOCK.GLASS ||
              id === BLOCK.ICE ||
              id === BLOCK.NETHER_PORTAL ||
              def.key.endsWith('_stained_glass'))
          ) {
            continue;
          }

          // CRITICAL TERRAIN FIX: ONLY genuine full opaque cubes can cull adjacent faces!
          // Non-cube small blocks (lanterns, slabs, stairs, fences, campfires, carpets...) NEVER cause X-ray holes!
          const neighborOpaqueCube = isFullOpaqueCube(neighbor) && !(neighbor === BLOCK.OAK_LEAVES && fancyLeaves);
          if (neighborOpaqueCube) {
            continue;
          }

          let texKey = def.textures.side;
          if (face.faceType === 'top') texKey = def.textures.top;
          else if (face.faceType === 'bottom') texKey = def.textures.bottom;
          else if (face.faceType === 'front' && def.textures.front) texKey = def.textures.front;

          const tile = tileOf(texKey);
          const vStart = targetBuf.pos.length / 3;
          const aoVals = [1, 1, 1, 1];

          // Sample propagated voxel light in the empty neighbor air cell facing this quad!
          const [lr, lg, lb] = useEmissiveBuf
            ? [0, 0, 0]
            : sampleLightBoost(lx + face.dir[0], ly + face.dir[1], lz + face.dir[2]);

          for (let k = 0; k < 4; k++) {
            const c = face.corners[k];
            const cy = isLiquid && c[1] === 1 && getBlock(wx, wy + 1, wz) !== id ? 0.88 : c[1];
            targetBuf.pos.push(lx + c[0], wy + cy, lz + c[2]);
            targetBuf.norm.push(face.dir[0], face.dir[1], face.dir[2]);

            const u = face.uvOrder[k][0] === 0 ? tile.u0 : tile.u1;
            const v = face.uvOrder[k][1] === 0 ? tile.v0 : tile.v1;
            targetBuf.uv.push(u, v);

            let ao = 1.0;
            if (smoothLighting && !useEmissiveBuf && !isLiquid) {
              const dx = c[0] === 1 ? 1 : -1;
              const dy = c[1] === 1 ? 1 : -1;
              const dz = c[2] === 1 ? 1 : -1;
              if (face.dir[1] !== 0) {
                const s1 = isFullOpaqueCube(getBlock(wx + dx, ny, wz));
                const s2 = isFullOpaqueCube(getBlock(wx, ny, wz + dz));
                const cr = isFullOpaqueCube(getBlock(wx + dx, ny, wz + dz));
                ao = vertexAO(s1, s2, cr);
              } else if (face.dir[0] !== 0) {
                const s1 = isFullOpaqueCube(getBlock(nx, wy + dy, wz));
                const s2 = isFullOpaqueCube(getBlock(nx, wy, wz + dz));
                const cr = isFullOpaqueCube(getBlock(nx, wy + dy, wz + dz));
                ao = vertexAO(s1, s2, cr);
              } else {
                const s1 = isFullOpaqueCube(getBlock(wx + dx, wy, nz));
                const s2 = isFullOpaqueCube(getBlock(wx, wy + dy, nz));
                const cr = isFullOpaqueCube(getBlock(wx + dx, wy + dy, nz));
                ao = vertexAO(s1, s2, cr);
              }
            }
            aoVals[k] = ao;

            if (useEmissiveBuf) {
              const s = 0.88 + face.shade * 0.12;
              targetBuf.col.push(s, s, s);
            } else if (id === BLOCK.WATER) {
              const base = face.shade * ao;
              targetBuf.col.push(
                Math.min(1.45, base * 0.78 + lr),
                Math.min(1.45, base * 0.96 + lg),
                Math.min(1.45, base * 1.24 + lb),
              );
            } else {
              const base = face.shade * ao;
              targetBuf.col.push(
                Math.min(1.45, base + lr),
                Math.min(1.45, base + lg),
                Math.min(1.45, base + lb),
              );
            }
          }

          if (aoVals[0] + aoVals[2] > aoVals[1] + aoVals[3]) {
            targetBuf.idx.push(vStart, vStart + 1, vStart + 2, vStart, vStart + 2, vStart + 3);
          } else {
            targetBuf.idx.push(vStart + 1, vStart + 2, vStart + 3, vStart + 1, vStart + 3, vStart);
          }
        }
      }
    }
  }

  return {
    opaque: buildGeometryFromBuf(oBuf),
    translucent: buildGeometryFromBuf(tBuf),
    emissive: buildGeometryFromBuf(eBuf),
  };
}
