import * as THREE from 'three';
import { BLOCK, BLOCK_DEFS, isBlockTransparent } from './blocks';
import { AtlasUV } from './resourcePack';
import { CHUNK_SIZE } from './types';
import { ChunkColumn, sectionIndex } from './worldGen';

export type BlockGetter = (wx: number, wy: number, wz: number) => number;

interface FaceSpec {
  dir: [number, number, number];
  // 4 corners in CCW order looking at outward face
  corners: [number, number, number][];
  uvOrder: [number, number][]; // (0/1, 0/1)
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
    shade: 0.52,
    faceType: 'bottom',
  },
  {
    // +Z front
    dir: [0, 0, 1],
    corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
    uvOrder: [[0, 0], [1, 0], [1, 1], [0, 1]],
    shade: 0.84,
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
    shade: 0.72,
    faceType: 'side',
  },
];

export interface SubChunkBuildResult {
  opaque: THREE.BufferGeometry | null;
  translucent: THREE.BufferGeometry | null;
}

function isOpaqueSolid(id: number): boolean {
  return id !== BLOCK.AIR && !isBlockTransparent(id);
}

function vertexAO(side1: boolean, side2: boolean, corner: boolean): number {
  if (side1 && side2) return 0.56;
  const occ = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
  if (occ === 0) return 1.0;
  if (occ === 1) return 0.86;
  if (occ === 2) return 0.72;
  return 0.56;
}

function buildGeometryFromBuffers(
  pos: number[],
  norm: number[],
  uv: number[],
  col: number[],
  idx: number[],
): THREE.BufferGeometry | null {
  if (pos.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
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
  if (!sec) return { opaque: null, translucent: null };

  const xBase = col.cx * CHUNK_SIZE;
  const yBase = sy * 16;
  const zBase = col.cz * CHUNK_SIZE;

  const oPos: number[] = [];
  const oNorm: number[] = [];
  const oUv: number[] = [];
  const oCol: number[] = [];
  const oIdx: number[] = [];

  const tPos: number[] = [];
  const tNorm: number[] = [];
  const tUv: number[] = [];
  const tCol: number[] = [];
  const tIdx: number[] = [];

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
        const isTrans = Boolean(def.transparent) && (id !== BLOCK.OAK_LEAVES || fancyLeaves);
        const posArr = isTrans ? tPos : oPos;
        const normArr = isTrans ? tNorm : oNorm;
        const uvArr = isTrans ? tUv : oUv;
        const colArr = isTrans ? tCol : oCol;
        const idxArr = isTrans ? tIdx : oIdx;

        // Cross-quad rendering for Torch & Soul Fire
        if (id === BLOCK.TORCH || id === BLOCK.SOUL_FIRE) {
          const tile = uvMap[def.textures.side] || uvMap.stone;
          const quads: [number, number, number][][] = [
            [[0.15, 0, 0.15], [0.85, 0, 0.85], [0.85, 0.9, 0.85], [0.15, 0.9, 0.15]],
            [[0.85, 0, 0.85], [0.15, 0, 0.15], [0.15, 0.9, 0.15], [0.85, 0.9, 0.85]],
            [[0.85, 0, 0.15], [0.15, 0, 0.85], [0.15, 0.9, 0.85], [0.85, 0.9, 0.15]],
            [[0.15, 0, 0.85], [0.85, 0, 0.15], [0.85, 0.9, 0.15], [0.15, 0.9, 0.85]],
          ];
          for (const q of quads) {
            const vStart = tPos.length / 3;
            for (let k = 0; k < 4; k++) {
              tPos.push(lx + q[k][0], wy + q[k][1], lz + q[k][2]);
              tNorm.push(0, 1, 0);
              const u = k === 0 || k === 3 ? tile.u0 : tile.u1;
              const v = k === 0 || k === 1 ? tile.v0 : tile.v1;
              tUv.push(u, v);
              tCol.push(1.15, 1.15, 1.15);
            }
            tIdx.push(vStart, vStart + 1, vStart + 2, vStart, vStart + 2, vStart + 3);
          }
          continue;
        }

        const isLiquid = Boolean(def.liquid);

        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const nx = wx + face.dir[0];
          const ny = wy + face.dir[1];
          const nz = wz + face.dir[2];

          const neighbor = getBlock(nx, ny, nz);
          if (neighbor === id && (isLiquid || id === BLOCK.GLASS || id === BLOCK.ICE || id === BLOCK.NETHER_PORTAL)) {
            continue;
          }
          if (!isTrans && neighbor !== BLOCK.AIR && !isBlockTransparent(neighbor) && !(neighbor === BLOCK.OAK_LEAVES && fancyLeaves)) {
            continue;
          }
          if (isTrans && !isLiquid && neighbor !== BLOCK.AIR && !isBlockTransparent(neighbor)) {
            continue;
          }

          let texKey = def.textures.side;
          if (face.faceType === 'top') texKey = def.textures.top;
          else if (face.faceType === 'bottom') texKey = def.textures.bottom;
          else if (face.faceType === 'front' && def.textures.front) texKey = def.textures.front;

          const tile = uvMap[texKey] || uvMap.stone;
          const vStart = posArr.length / 3;
          const aoVals = [1, 1, 1, 1];

          for (let k = 0; k < 4; k++) {
            const c = face.corners[k];
            const cy = isLiquid && c[1] === 1 && getBlock(wx, wy + 1, wz) !== id ? 0.88 : c[1];
            posArr.push(lx + c[0], wy + cy, lz + c[2]);
            normArr.push(face.dir[0], face.dir[1], face.dir[2]);

            const u = face.uvOrder[k][0] === 0 ? tile.u0 : tile.u1;
            const v = face.uvOrder[k][1] === 0 ? tile.v0 : tile.v1;
            uvArr.push(u, v);

            let ao = 1.0;
            if (smoothLighting && !def.emissive && !isLiquid) {
              // Fast axis-aligned corner AO check
              const dx = c[0] === 1 ? 1 : -1;
              const dy = c[1] === 1 ? 1 : -1;
              const dz = c[2] === 1 ? 1 : -1;
              if (face.dir[1] !== 0) {
                const s1 = isOpaqueSolid(getBlock(wx + dx, ny, wz));
                const s2 = isOpaqueSolid(getBlock(wx, ny, wz + dz));
                const cr = isOpaqueSolid(getBlock(wx + dx, ny, wz + dz));
                ao = vertexAO(s1, s2, cr);
              } else if (face.dir[0] !== 0) {
                const s1 = isOpaqueSolid(getBlock(nx, wy + dy, wz));
                const s2 = isOpaqueSolid(getBlock(nx, wy, wz + dz));
                const cr = isOpaqueSolid(getBlock(nx, wy + dy, wz + dz));
                ao = vertexAO(s1, s2, cr);
              } else {
                const s1 = isOpaqueSolid(getBlock(wx + dx, wy, nz));
                const s2 = isOpaqueSolid(getBlock(wx, wy + dy, nz));
                const cr = isOpaqueSolid(getBlock(wx + dx, wy + dy, nz));
                ao = vertexAO(s1, s2, cr);
              }
            }
            aoVals[k] = ao;
            const boost = def.emissive ? 1.2 : 1.0;
            const light = face.shade * ao * boost;
            colArr.push(light, light, light);
          }

          // Flip quad diagonal to prevent AO interpolation artifacts
          if (aoVals[0] + aoVals[2] > aoVals[1] + aoVals[3]) {
            idxArr.push(vStart, vStart + 1, vStart + 2, vStart, vStart + 2, vStart + 3);
          } else {
            idxArr.push(vStart + 1, vStart + 2, vStart + 3, vStart + 1, vStart + 3, vStart);
          }
        }
      }
    }
  }

  return {
    opaque: buildGeometryFromBuffers(oPos, oNorm, oUv, oCol, oIdx),
    translucent: buildGeometryFromBuffers(tPos, tNorm, tUv, tCol, tIdx),
  };
}
