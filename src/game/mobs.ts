import * as THREE from 'three';
import { BLOCK, isBlockSolid } from './blocks';
import { Difficulty, DimensionId } from './types';

export type MobType =
  | 'pig'
  | 'sheep'
  | 'zombie'
  | 'creeper'
  | 'piglin'
  | 'strider'
  | 'zombified_piglin'
  | 'ghast';

export interface MobEntity {
  id: string;
  type: MobType;
  dimension: DimensionId;
  hostile: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  hp: number;
  maxHp: number;
  hurtTimer: number;
  attackCooldown: number;
  wanderTimer: number;
  wanderAngle: number;
  walkPhase: number;
  fuseTimer: number; // for Creeper
  mesh: THREE.Group;
  limbs: THREE.Object3D[];
}

export const MOB_SPECS: Record<
  MobType,
  { nameVi: string; hp: number; hostile: boolean; speed: number; damage: number; drop: string; dropCount: number; width: number; height: number }
> = {
  pig: { nameVi: 'Heo', hp: 10, hostile: false, speed: 2.2, damage: 0, drop: 'raw_porkchop', dropCount: 2, width: 0.7, height: 0.9 },
  sheep: { nameVi: 'Cừu', hp: 8, hostile: false, speed: 2.1, damage: 0, drop: 'raw_porkchop', dropCount: 1, width: 0.7, height: 1.2 },
  zombie: { nameVi: 'Thây Ma (Zombie)', hp: 20, hostile: true, speed: 2.7, damage: 3, drop: 'iron_ingot', dropCount: 1, width: 0.65, height: 1.85 },
  creeper: { nameVi: 'Creeper', hp: 20, hostile: true, speed: 2.6, damage: 8, drop: 'coal', dropCount: 2, width: 0.65, height: 1.75 },
  piglin: { nameVi: 'Piglin (1.16)', hp: 16, hostile: true, speed: 3.1, damage: 4, drop: 'gold_ingot', dropCount: 1, width: 0.65, height: 1.9 },
  strider: { nameVi: 'Strider (1.16)', hp: 20, hostile: false, speed: 2.4, damage: 0, drop: 'obsidian', dropCount: 1, width: 0.85, height: 1.65 },
  zombified_piglin: { nameVi: 'Zombified Piglin (1.16)', hp: 20, hostile: false, speed: 2.6, damage: 5, drop: 'gold_ingot', dropCount: 1, width: 0.65, height: 1.9 },
  ghast: { nameVi: 'Ghast Nether', hp: 12, hostile: true, speed: 2.2, damage: 5, drop: 'quartz', dropCount: 3, width: 2.6, height: 2.6 },
};

const PX = 1 / 16;

// Maps Three.js BoxGeometry's 6 faces (+X, -X, +Y, -Y, +Z, -Z) to exact Minecraft entity UV coordinates.
// Works seamlessly across 16x Vanilla, 32x Faithful HD+, and any higher-res resource pack because UVs are normalized.
function createMobBoxGeometry(
  wPx: number,
  hPx: number,
  dPx: number,
  u: number,
  v: number,
  texW: number,
  texH: number,
  inflatePx = 0,
  unitScale = PX,
): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(
    (wPx + inflatePx * 2) * unitScale,
    (hPx + inflatePx * 2) * unitScale,
    (dPx + inflatePx * 2) * unitScale,
  );

  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  const eps = 0.015;
  const setFaceUV = (faceIdx: number, px: number, py: number, pw: number, ph: number) => {
    const u0 = (px + eps) / texW;
    const u1 = (px + pw - eps) / texW;
    const vTop = 1 - (py + eps) / texH;
    const vBot = 1 - (py + ph - eps) / texH;
    const base = faceIdx * 4;
    uvAttr.setXY(base + 0, u0, vTop);
    uvAttr.setXY(base + 1, u1, vTop);
    uvAttr.setXY(base + 2, u0, vBot);
    uvAttr.setXY(base + 3, u1, vBot);
  };

  // Three.js BoxGeometry faces (mob faces +Z):
  // 0: +X (mob's left)  -> (u + d + w, v + d, d, h)
  // 1: -X (mob's right) -> (u, v + d, d, h)
  // 2: +Y (top)         -> (u + d, v, w, d)
  // 3: -Y (bottom)      -> (u + d + w, v, w, d)
  // 4: +Z (front)       -> (u + d, v + d, w, h)
  // 5: -Z (back)        -> (u + d + w + d, v + d, w, h)
  setFaceUV(0, u + dPx + wPx, v + dPx, dPx, hPx);
  setFaceUV(1, u, v + dPx, dPx, hPx);
  setFaceUV(2, u + dPx, v, wPx, dPx);
  setFaceUV(3, u + dPx + wPx, v, wPx, dPx);
  setFaceUV(4, u + dPx, v + dPx, wPx, hPx);
  setFaceUV(5, u + dPx + wPx + dPx, v + dPx, wPx, hPx);

  uvAttr.needsUpdate = true;
  return geo;
}

function createMobPlaneGeometry(
  wPx: number,
  hPx: number,
  u: number,
  v: number,
  uvW: number,
  uvH: number,
  texW: number,
  texH: number,
  unitScale = PX,
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(wPx * unitScale, hPx * unitScale);
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  const eps = 0.015;
  const u0 = (u + eps) / texW;
  const u1 = (u + uvW - eps) / texW;
  const vTop = 1 - (v + eps) / texH;
  const vBot = 1 - (v + uvH - eps) / texH;
  uvAttr.setXY(0, u0, vTop);
  uvAttr.setXY(1, u1, vTop);
  uvAttr.setXY(2, u0, vBot);
  uvAttr.setXY(3, u1, vBot);
  uvAttr.needsUpdate = true;
  return geo;
}

function createEntityMaterial(tex: THREE.Texture, transparent = false): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.86,
    metalness: 0.04,
    transparent,
    alphaTest: transparent ? 0.35 : 0,
    side: transparent ? THREE.DoubleSide : THREE.FrontSide,
  });
}

function texturedPart(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  castShadow = true,
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = castShadow;
  m.receiveShadow = true;
  return m;
}

function partBox(
  w: number,
  h: number,
  d: number,
  color: number,
  roughness: number,
  metalness = 0,
  emissive = 0x000000,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 0.45 : 0 });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Build authentic Minecraft 1.16.5 UV-mapped 3D mobs from active Resource Pack textures (with offline procedural fallback)
export function buildMobMesh(
  type: MobType,
  entityTextures?: Record<string, THREE.Texture>,
): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const tex = entityTextures?.[type];

  if (tex) {
    if (type === 'pig') return buildTexturedPig(tex);
    if (type === 'sheep') return buildTexturedSheep(tex, entityTextures?.sheep_fur);
    if (type === 'zombie') return buildTexturedZombie(tex);
    if (type === 'creeper') return buildTexturedCreeper(tex);
    if (type === 'piglin' || type === 'zombified_piglin') return buildTexturedPiglin(tex, type === 'piglin');
    if (type === 'strider') return buildTexturedStrider(tex);
    if (type === 'ghast') return buildTexturedGhast(tex);
  }

  return buildFallbackProceduralMob(type);
}

// --- 1. TEXTURED PIG (entity/pig/pig.png — 64x32 virtual) ---
function buildTexturedPig(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);

  // Body: 10x16x8 at (28, 8) rotated horizontal
  const body = texturedPart(createMobBoxGeometry(10, 16, 8, 28, 8, 64, 32), mat);
  body.position.set(0, 10 * PX, 0);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Head: 8x8x8 at (0, 0) + Snout: 4x3x1 at (16, 16)
  const head = texturedPart(createMobBoxGeometry(8, 8, 8, 0, 0, 64, 32), mat);
  head.position.set(0, 12 * PX, 9.5 * PX);
  group.add(head);

  const snout = texturedPart(createMobBoxGeometry(4, 3, 1, 16, 16, 64, 32), mat);
  snout.position.set(0, 10.5 * PX, 14 * PX);
  group.add(snout);

  // 4 Legs: 4x6x4 at (0, 16), pivoted at hips (y = 6*PX)
  for (const [lx, lz] of [[-3, 5], [3, 5], [-3, -6], [3, -6]]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * PX, 6 * PX, lz * PX);
    const leg = texturedPart(createMobBoxGeometry(4, 6, 4, 0, 16, 64, 32), mat);
    leg.position.y = -3 * PX;
    pivot.add(leg);
    group.add(pivot);
    limbs.push(pivot);
  }

  return { group, limbs };
}

// --- 2. TEXTURED SHEEP (entity/sheep/sheep.png + sheep_fur.png — 64x32 virtual) ---
function buildTexturedSheep(
  skinTex: THREE.Texture,
  furTex?: THREE.Texture,
): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const skinMat = createEntityMaterial(skinTex);
  const furMat = furTex ? createEntityMaterial(furTex, true) : null;

  // Body: 8x16x6 at (28, 8) rotated horizontal
  const body = texturedPart(createMobBoxGeometry(8, 16, 6, 28, 8, 64, 32), skinMat);
  body.position.set(0, 14.5 * PX, 0);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  if (furMat) {
    const woolBody = texturedPart(createMobBoxGeometry(8, 16, 6, 28, 8, 64, 32, 1.55), furMat, false);
    woolBody.position.set(0, 14.5 * PX, 0);
    woolBody.rotation.x = Math.PI / 2;
    group.add(woolBody);
  }

  // Head: 6x6x8 at (0, 0) + fluffy wool cap: 6x6x6 at (0, 0)
  const head = texturedPart(createMobBoxGeometry(6, 6, 8, 0, 0, 64, 32), skinMat);
  head.position.set(0, 18 * PX, 9.5 * PX);
  group.add(head);

  if (furMat) {
    const woolHead = texturedPart(createMobBoxGeometry(6, 6, 6, 0, 0, 64, 32, 0.55), furMat, false);
    woolHead.position.set(0, 18 * PX, 8.6 * PX);
    group.add(woolHead);
  }

  // 4 Legs: 4x12x4 at (0, 16) + upper wool cuff 4x6x4 at (0, 16)
  for (const [lx, lz] of [[-3, 5], [3, 5], [-3, -6.5], [3, -6.5]]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * PX, 12 * PX, lz * PX);
    const leg = texturedPart(createMobBoxGeometry(4, 12, 4, 0, 16, 64, 32), skinMat);
    leg.position.y = -6 * PX;
    pivot.add(leg);

    if (furMat) {
      const woolLeg = texturedPart(createMobBoxGeometry(4, 6, 4, 0, 16, 64, 32, 0.48), furMat, false);
      woolLeg.position.y = -3 * PX;
      pivot.add(woolLeg);
    }

    group.add(pivot);
    limbs.push(pivot);
  }

  return { group, limbs };
}

// --- 3. TEXTURED ZOMBIE (entity/zombie/zombie.png — 64x64 virtual, classic layout in top 32px) ---
function buildTexturedZombie(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const root = new THREE.Group();
  root.scale.setScalar(0.94);
  group.add(root);
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);
  const overlayMat = createEntityMaterial(tex, true);

  // Legs: 4x12x4 at (0, 16)
  for (const lx of [-2, 2]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * PX, 12 * PX, 0);
    const leg = texturedPart(createMobBoxGeometry(4, 12, 4, 0, 16, 64, 64), mat);
    leg.position.y = -6 * PX;
    pivot.add(leg);
    root.add(pivot);
    limbs.push(pivot);
  }

  // Torso: 8x12x4 at (16, 16)
  const torso = texturedPart(createMobBoxGeometry(8, 12, 4, 16, 16, 64, 64), mat);
  torso.position.set(0, 18 * PX, 0);
  root.add(torso);

  // Head: 8x8x8 at (0, 0) + Hat overlay at (32, 0)
  const head = texturedPart(createMobBoxGeometry(8, 8, 8, 0, 0, 64, 64), mat);
  head.position.set(0, 28 * PX, 0);
  root.add(head);

  const hat = texturedPart(createMobBoxGeometry(8, 8, 8, 32, 0, 64, 64, 0.35), overlayMat, false);
  hat.position.set(0, 28 * PX, 0);
  root.add(hat);

  // Outstretched Zombie Arms: 4x12x4 at (40, 16)
  for (const ax of [-6, 6]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(ax * PX, 22 * PX, 0);
    armPivot.rotation.x = -Math.PI * 0.45;
    const arm = texturedPart(createMobBoxGeometry(4, 12, 4, 40, 16, 64, 64), mat);
    arm.position.y = -4 * PX;
    armPivot.add(arm);
    root.add(armPivot);
  }

  return { group, limbs };
}

// --- 4. TEXTURED CREEPER (entity/creeper/creeper.png — 64x32 virtual) ---
function buildTexturedCreeper(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);

  // 4 Short Legs: 4x6x4 at (0, 16)
  for (const [lx, lz] of [[-2, 4], [2, 4], [-2, -4], [2, -4]]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * PX, 6 * PX, lz * PX);
    const leg = texturedPart(createMobBoxGeometry(4, 6, 4, 0, 16, 64, 32), mat);
    leg.position.y = -3 * PX;
    pivot.add(leg);
    group.add(pivot);
    limbs.push(pivot);
  }

  // Torso: 8x12x4 at (16, 16)
  const torso = texturedPart(createMobBoxGeometry(8, 12, 4, 16, 16, 64, 32), mat);
  torso.position.set(0, 12 * PX, 0);
  group.add(torso);

  // Head: 8x8x8 at (0, 0)
  const head = texturedPart(createMobBoxGeometry(8, 8, 8, 0, 0, 64, 32), mat);
  head.position.set(0, 22 * PX, 0);
  group.add(head);

  return { group, limbs };
}

// --- 5. TEXTURED PIGLIN & ZOMBIFIED PIGLIN (64x64 virtual with 2nd clothing layer + floppy ears + snout/tusks) ---
function buildTexturedPiglin(
  tex: THREE.Texture,
  isLivingPiglin: boolean,
): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const root = new THREE.Group();
  root.scale.setScalar(0.96);
  group.add(root);
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);
  const overlayMat = createEntityMaterial(tex, true);

  // Legs: Right (-X) at (0, 16)/(0, 32), Left (+X) at (16, 48)/(0, 48)
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-2 * PX, 12 * PX, 0);
  const rightLeg = texturedPart(createMobBoxGeometry(4, 12, 4, 0, 16, 64, 64), mat);
  rightLeg.position.y = -6 * PX;
  const rightPants = texturedPart(createMobBoxGeometry(4, 12, 4, 0, 32, 64, 64, 0.25), overlayMat, false);
  rightPants.position.y = -6 * PX;
  rightLegPivot.add(rightLeg, rightPants);
  root.add(rightLegPivot);
  limbs.push(rightLegPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(2 * PX, 12 * PX, 0);
  const leftLeg = texturedPart(createMobBoxGeometry(4, 12, 4, 16, 48, 64, 64), mat);
  leftLeg.position.y = -6 * PX;
  const leftPants = texturedPart(createMobBoxGeometry(4, 12, 4, 0, 48, 64, 64, 0.25), overlayMat, false);
  leftPants.position.y = -6 * PX;
  leftLegPivot.add(leftLeg, leftPants);
  root.add(leftLegPivot);
  limbs.push(leftLegPivot);

  // Torso: 8x12x4 at (16, 16) + Jacket overlay at (16, 32)
  const torso = texturedPart(createMobBoxGeometry(8, 12, 4, 16, 16, 64, 64), mat);
  torso.position.set(0, 18 * PX, 0);
  const jacket = texturedPart(createMobBoxGeometry(8, 12, 4, 16, 32, 64, 64, 0.28), overlayMat, false);
  jacket.position.set(0, 18 * PX, 0);
  root.add(torso, jacket);

  // Wide Piglin Head: 10x8x8 at (0, 0) + Snout 4x4x1 at (31, 1) + Tusks + Floppy Ears
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 24 * PX, 0);
  root.add(headGroup);

  const head = texturedPart(createMobBoxGeometry(10, 8, 8, 0, 0, 64, 64), mat);
  head.position.y = 4 * PX;
  headGroup.add(head);

  const snout = texturedPart(createMobBoxGeometry(4, 4, 1, 31, 1, 64, 64), mat);
  snout.position.set(0, 2 * PX, 4.5 * PX);
  headGroup.add(snout);

  const tuskL = texturedPart(createMobBoxGeometry(1, 2, 1, 2, 0, 64, 64), mat, false);
  tuskL.position.set(2.5 * PX, 1 * PX, 4.5 * PX);
  const tuskR = texturedPart(createMobBoxGeometry(1, 2, 1, 2, 4, 64, 64), mat, false);
  tuskR.position.set(-2.5 * PX, 1 * PX, 4.5 * PX);
  headGroup.add(tuskL, tuskR);

  // Left Ear (+X): 1x5x4 at (51, 6)
  const earLPivot = new THREE.Group();
  earLPivot.position.set(5 * PX, 6 * PX, 0);
  earLPivot.rotation.z = 0.5;
  const earL = texturedPart(createMobBoxGeometry(1, 5, 4, 51, 6, 64, 64), mat);
  earL.position.y = -2.5 * PX;
  earLPivot.add(earL);
  headGroup.add(earLPivot);

  // Right Ear (-X): 1x5x4 at (39, 6)
  const earRPivot = new THREE.Group();
  earRPivot.position.set(-5 * PX, 6 * PX, 0);
  earRPivot.rotation.z = -0.5;
  const earR = texturedPart(createMobBoxGeometry(1, 5, 4, 39, 6, 64, 64), mat);
  earR.position.y = -2.5 * PX;
  earRPivot.add(earR);
  headGroup.add(earRPivot);

  // Right Arm (-X): 4x12x4 at (40, 16) + Sleeve at (40, 32) + Gold Sword
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(-6 * PX, 22 * PX, 0);
  const rightArm = texturedPart(createMobBoxGeometry(4, 12, 4, 40, 16, 64, 64), mat);
  rightArm.position.y = -4 * PX;
  const rightSleeve = texturedPart(createMobBoxGeometry(4, 12, 4, 40, 32, 64, 64, 0.25), overlayMat, false);
  rightSleeve.position.y = -4 * PX;
  rightArmPivot.add(rightArm, rightSleeve);

  // Classic Nether 1.16 golden sword in right hand
  const sword = partBox(0.08, 0.1, 0.65, isLivingPiglin ? 0xfacc15 : 0xeab308, 0.2, 0.9);
  sword.position.set(0, -9 * PX, 4.5 * PX);
  rightArmPivot.add(sword);
  root.add(rightArmPivot);
  limbs.push(rightArmPivot);

  // Left Arm (+X): 4x12x4 at (32, 48) + Sleeve at (48, 48)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(6 * PX, 22 * PX, 0);
  const leftArm = texturedPart(createMobBoxGeometry(4, 12, 4, 32, 48, 64, 64), mat);
  leftArm.position.y = -4 * PX;
  const leftSleeve = texturedPart(createMobBoxGeometry(4, 12, 4, 48, 48, 64, 64, 0.25), overlayMat, false);
  leftSleeve.position.y = -4 * PX;
  leftArmPivot.add(leftArm, leftSleeve);
  root.add(leftArmPivot);
  limbs.push(leftArmPivot);

  return { group, limbs };
}

// --- 6. TEXTURED STRIDER (entity/strider/strider.png — 64x128 virtual!) ---
function buildTexturedStrider(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);
  const bristleMat = createEntityMaterial(tex, true);

  // Body: 16x14x16 at (0, 0) on 64x128 sheet
  const body = texturedPart(createMobBoxGeometry(16, 14, 16, 0, 0, 64, 128), mat);
  body.position.set(0, 22 * PX, 0);
  group.add(body);

  // 3 Pairs of Strider Hair Bristles hanging off both sides of the head-body
  const bristleRows: [number, number, number][] = [
    [27.5, 4, 33],
    [23.5, 4, 49],
    [19.5, 4, 65],
  ];
  for (const [by, uR, vRow] of bristleRows) {
    // Right side (-X)
    const rPlane = texturedPart(createMobPlaneGeometry(12, 16, uR, vRow, 12, 16, 64, 128), bristleMat, false);
    rPlane.rotation.x = -Math.PI / 2;
    rPlane.rotation.y = 0.65;
    rPlane.position.set(-11.5 * PX, by * PX, 0);
    group.add(rPlane);

    // Left side (+X)
    const lPlane = texturedPart(createMobPlaneGeometry(12, 16, uR + 12, vRow, 12, 16, 64, 128), bristleMat, false);
    lPlane.rotation.x = -Math.PI / 2;
    lPlane.rotation.y = -0.65;
    lPlane.position.set(11.5 * PX, by * PX, 0);
    group.add(lPlane);
  }

  // Right Leg (-X): 4x17x4 at (0, 32) on 64x128
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-4 * PX, 15.5 * PX, 0);
  const rightLeg = texturedPart(createMobBoxGeometry(4, 17, 4, 0, 32, 64, 128), mat);
  rightLeg.position.y = -8 * PX;
  rightLegPivot.add(rightLeg);
  group.add(rightLegPivot);
  limbs.push(rightLegPivot);

  // Left Leg (+X): 4x17x4 at (0, 55) on 64x128
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(4 * PX, 15.5 * PX, 0);
  const leftLeg = texturedPart(createMobBoxGeometry(4, 17, 4, 0, 55, 64, 128), mat);
  leftLeg.position.y = -8 * PX;
  leftLegPivot.add(leftLeg);
  group.add(leftLegPivot);
  limbs.push(leftLegPivot);

  return { group, limbs };
}

// --- 7. TEXTURED GHAST (entity/ghast/ghast.png — 64x32 virtual) ---
function buildTexturedGhast(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);
  const ghastScale = 2.4 / 16; // 16px body -> 2.4 blocks wide

  // Main Cube Body: 16x16x16 at (0, 0)
  const body = texturedPart(createMobBoxGeometry(16, 16, 16, 0, 0, 64, 32, 0, ghastScale), mat);
  body.position.set(0, 2.2, 0);
  group.add(body);

  // 9 Dangling Tentacles mapped to (0, 0) clean pale ghast texture region
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const lenPx = 7 + ((i * 3 + j + 5) % 3) * 2.5;
      const pivot = new THREE.Group();
      pivot.position.set(i * 0.65, 1.05, j * 0.65);
      const tent = texturedPart(createMobBoxGeometry(2, lenPx, 2, 0, 0, 64, 32, 0, ghastScale), mat);
      tent.position.y = -(lenPx * ghastScale) * 0.5;
      pivot.add(tent);
      group.add(pivot);
      limbs.push(pivot);
    }
  }

  return { group, limbs };
}

// Offline fallback if no resource pack entity texture was fetched
function buildFallbackProceduralMob(type: MobType): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];

  if (type === 'pig' || type === 'sheep') {
    const isPig = type === 'pig';
    const bodyCol = isPig ? 0xf2a1a1 : 0xe9e6df;
    const headCol = isPig ? 0xf5b1b1 : 0xd6bfa9;
    const body = partBox(0.65, 0.55, 0.95, bodyCol, isPig ? 0.72 : 0.95);
    body.position.set(0, 0.62, 0);
    group.add(body);

    const head = partBox(0.46, 0.44, 0.46, headCol, 0.75);
    head.position.set(0, 0.78, 0.6);
    group.add(head);

    const snout = partBox(0.24, 0.16, 0.12, isPig ? 0xd97d87 : 0x33302d, 0.45);
    snout.position.set(0, 0.7, 0.86);
    group.add(snout);

    const eyeL = partBox(0.08, 0.08, 0.05, 0x18181b, 0.2);
    eyeL.position.set(-0.14, 0.84, 0.84);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.14;
    group.add(eyeL, eyeR);

    for (const [lx, lz] of [[-0.2, 0.3], [0.2, 0.3], [-0.2, -0.32], [0.2, -0.32]]) {
      const leg = partBox(0.18, 0.38, 0.18, isPig ? 0xe08d8d : 0x8b7765, 0.8);
      leg.position.set(lx, 0.19, lz);
      group.add(leg);
      limbs.push(leg);
    }
    return { group, limbs };
  }

  if (type === 'strider') {
    const body = partBox(0.95, 0.72, 0.95, 0xb83b4b, 0.82);
    body.position.set(0, 1.15, 0);
    group.add(body);

    const brow = partBox(0.98, 0.12, 0.16, 0x6b2232, 0.9);
    brow.position.set(0, 1.32, 0.44);
    group.add(brow);

    for (const sx of [-0.52, 0.52]) {
      const bristle = partBox(0.14, 0.46, 0.72, 0x9e95a8, 0.92);
      bristle.position.set(sx, 1.25, 0);
      group.add(bristle);
    }

    const eyeL = partBox(0.14, 0.14, 0.06, 0xfdf2f8, 0.25);
    eyeL.position.set(-0.24, 1.16, 0.48);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.24;
    group.add(eyeL, eyeR);

    for (const lx of [-0.25, 0.25]) {
      const leg = partBox(0.24, 0.85, 0.24, 0x6e2532, 0.88);
      leg.position.set(lx, 0.425, 0);
      group.add(leg);
      limbs.push(leg);
    }
    return { group, limbs };
  }

  if (type === 'ghast') {
    const head = partBox(2.3, 2.3, 2.3, 0xf0eef2, 0.88);
    head.position.set(0, 2.15, 0);
    group.add(head);

    const eyeL = partBox(0.36, 0.22, 0.08, 0x262228, 0.3);
    eyeL.position.set(-0.55, 2.25, 1.16);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.55;
    const mouth = partBox(0.46, 0.36, 0.08, 0x7c1d2a, 0.4, 0, 0x991b1b);
    mouth.position.set(0, 1.65, 1.16);
    group.add(eyeL, eyeR, mouth);

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const len = 0.85 + ((i * 3 + j + 5) % 3) * 0.28;
        const tent = partBox(0.24, len, 0.24, 0xd8d4de, 0.9);
        tent.position.set(i * 0.65, 1.0 - len * 0.5, j * 0.65);
        group.add(tent);
        limbs.push(tent);
      }
    }
    return { group, limbs };
  }

  const isCreeper = type === 'creeper';
  const isPiglin = type === 'piglin';
  const isZPiglin = type === 'zombified_piglin';

  const skinCol = isCreeper ? 0x4ba843 : isPiglin ? 0xe5a48e : isZPiglin ? 0x789c5a : 0x5c8c4c;
  const torsoCol = isCreeper ? 0x3b8c36 : isPiglin ? 0x7a4236 : isZPiglin ? 0x624438 : 0x2a7886;
  const legCol = isCreeper ? 0x32752e : isPiglin ? 0x4b2f28 : isZPiglin ? 0x4a332b : 0x37417a;

  const legCoords = isCreeper ? [[-0.18, 0.16], [0.18, 0.16], [-0.18, -0.16], [0.18, -0.16]] : [[-0.15, 0], [0.15, 0]];
  for (const [lx, lz] of legCoords) {
    const leg = partBox(0.24, 0.68, 0.24, legCol, 0.85);
    leg.position.set(lx, 0.34, lz);
    group.add(leg);
    limbs.push(leg);
  }

  const torso = partBox(0.52, 0.68, 0.28, torsoCol, 0.78);
  torso.position.set(0, 1.02, 0);
  group.add(torso);

  const head = partBox(0.48, 0.48, 0.48, skinCol, 0.72);
  head.position.set(0, 1.6, 0);
  group.add(head);

  const eyeCol = isPiglin ? 0xfef9c3 : 0x18181b;
  const eyeL = partBox(0.1, 0.1, 0.05, eyeCol, 0.2, 0, isPiglin ? 0xfacc15 : 0);
  eyeL.position.set(-0.12, 1.64, 0.24);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;
  group.add(eyeL, eyeR);

  if (isPiglin || isZPiglin) {
    const snout = partBox(0.24, 0.16, 0.1, isPiglin ? 0xd98c7a : 0x996d6b, 0.65);
    snout.position.set(0, 1.54, 0.28);
    const earL = partBox(0.08, 0.24, 0.22, skinCol, 0.8);
    earL.position.set(-0.28, 1.64, 0);
    earL.rotation.z = 0.32;
    const earR = earL.clone();
    earR.position.x = 0.28;
    earR.rotation.z = -0.32;
    group.add(snout, earL, earR);

    if (isPiglin) {
      const belt = partBox(0.55, 0.12, 0.31, 0xf5c531, 0.2, 0.88);
      belt.position.set(0, 0.76, 0);
      group.add(belt);
    }
  } else if (isCreeper) {
    const mouth = partBox(0.22, 0.18, 0.05, 0x18181b, 0.3);
    mouth.position.set(0, 1.48, 0.24);
    group.add(mouth);
  }

  if (!isCreeper) {
    const armL = partBox(0.2, 0.66, 0.2, skinCol, 0.78);
    armL.position.set(-0.37, 1.04, type === 'zombie' ? 0.24 : 0);
    if (type === 'zombie') armL.rotation.x = -Math.PI * 0.45;
    const armR = partBox(0.2, 0.66, 0.2, skinCol, 0.78);
    armR.position.set(0.37, 1.04, type === 'zombie' ? 0.24 : 0);
    if (type === 'zombie') armR.rotation.x = -Math.PI * 0.45;
    if (isPiglin || isZPiglin) {
      const sword = partBox(0.08, 0.1, 0.65, 0xfacc15, 0.18, 0.92);
      sword.position.set(0, -0.24, 0.32);
      armR.add(sword);
    }
    group.add(armL, armR);
    if (type !== 'zombie') limbs.push(armL, armR);
  }

  return { group, limbs };
}

// Note: entity textures belong to CompiledResourcePack and are disposed in pack.dispose(), NOT here.
export function disposeMobMesh(mesh: THREE.Group): void {
  const disposedMaterials = new Set<THREE.Material>();
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (!disposedMaterials.has(m)) {
          disposedMaterials.add(m);
          m.dispose();
        }
      }
    }
  });
}

export function updateMobAI(
  mob: MobEntity,
  dt: number,
  playerPos: { x: number; y: number; z: number },
  playerSurvival: boolean,
  playerWearingGold: boolean,
  difficulty: Difficulty,
  getBlock: (x: number, y: number, z: number) => number,
  onAttackPlayer: (dmg: number, mobName: string, explode?: { x: number; y: number; z: number }) => void,
): void {
  const spec = MOB_SPECS[mob.type];
  mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);

  if (mob.hurtTimer > 0) {
    mob.hurtTimer = Math.max(0, mob.hurtTimer - dt);
    const red = mob.hurtTimer > 0 ? 0.55 : 0;
    mob.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
        o.material.emissive.setRGB(red, 0, 0);
      }
    });
  }

  const dx = playerPos.x - mob.x;
  const dy = playerPos.y - mob.y;
  const dz = playerPos.z - mob.z;
  const distSq = dx * dx + dz * dz;
  const dist = Math.sqrt(distSq);

  const isAggro =
    playerSurvival &&
    difficulty !== 'peaceful' &&
    mob.hostile &&
    !(mob.type === 'piglin' && playerWearingGold) &&
    dist < 18;

  if (mob.type === 'ghast') {
    mob.wanderTimer -= dt;
    if (mob.wanderTimer <= 0) {
      mob.wanderTimer = 3 + Math.random() * 4;
      mob.wanderAngle = Math.random() * Math.PI * 2;
    }
    const targetYaw = isAggro ? Math.atan2(dx, dz) : mob.wanderAngle;
    mob.yaw = targetYaw;
    mob.x += Math.sin(mob.yaw) * spec.speed * dt;
    mob.z += Math.cos(mob.yaw) * spec.speed * dt;
    mob.y += Math.sin(performance.now() * 0.0018 + mob.x) * 0.45 * dt;
    mob.walkPhase += dt * 3;
    mob.limbs.forEach((l, idx) => {
      l.rotation.x = Math.sin(mob.walkPhase + idx * 0.7) * 0.25;
    });
    if (isAggro && dist < 8 && Math.abs(dy) < 6 && mob.attackCooldown <= 0) {
      mob.attackCooldown = 2.6;
      onAttackPlayer(spec.damage, spec.nameVi);
    }
    return;
  }

  // Ground mobs
  let moveX = 0;
  let moveZ = 0;
  if (isAggro && dist > 1.2) {
    mob.yaw = Math.atan2(dx, dz);
    moveX = (dx / dist) * spec.speed;
    moveZ = (dz / dist) * spec.speed;
  } else {
    mob.wanderTimer -= dt;
    if (mob.wanderTimer <= 0) {
      mob.wanderTimer = 2 + Math.random() * 4;
      mob.wanderAngle = Math.random() < 0.35 ? -999 : Math.random() * Math.PI * 2;
    }
    if (mob.wanderAngle > -900) {
      mob.yaw = mob.wanderAngle;
      moveX = Math.sin(mob.yaw) * spec.speed * 0.45;
      moveZ = Math.cos(mob.yaw) * spec.speed * 0.45;
    }
  }

  mob.vx = THREE.MathUtils.lerp(mob.vx, moveX, Math.min(1, dt * 8));
  mob.vz = THREE.MathUtils.lerp(mob.vz, moveZ, Math.min(1, dt * 8));

  // Gravity & Strider lava walking
  const below = getBlock(Math.floor(mob.x), Math.floor(mob.y - 0.1), Math.floor(mob.z));
  const onSolid = isBlockSolid(below) || (mob.type === 'strider' && below === BLOCK.LAVA);
  if (onSolid && mob.vy <= 0) {
    mob.vy = 0;
    mob.y = Math.floor(mob.y - 0.1) + 1;
  } else {
    mob.vy = Math.max(-24, mob.vy - 24 * dt);
  }

  const nextX = mob.x + mob.vx * dt;
  const nextZ = mob.z + mob.vz * dt;
  const frontFoot = getBlock(Math.floor(nextX), Math.floor(mob.y + 0.2), Math.floor(nextZ));
  const frontHead = getBlock(Math.floor(nextX), Math.floor(mob.y + 1.2), Math.floor(nextZ));

  if (isBlockSolid(frontFoot)) {
    if (!isBlockSolid(frontHead) && onSolid) {
      mob.vy = 7.4;
    } else {
      mob.wanderAngle = mob.yaw + Math.PI * 0.7;
      mob.vx = 0;
      mob.vz = 0;
    }
  } else {
    mob.x = nextX;
    mob.z = nextZ;
  }
  mob.y += mob.vy * dt;

  // Limb walk cycle
  const speedNow = Math.hypot(mob.vx, mob.vz);
  if (speedNow > 0.25) {
    mob.walkPhase += dt * speedNow * 2.6;
    mob.limbs.forEach((limb, idx) => {
      limb.rotation.x = Math.sin(mob.walkPhase + (idx % 2 === 0 ? 0 : Math.PI)) * 0.55;
    });
  } else {
    mob.limbs.forEach((limb) => {
      limb.rotation.x *= 0.85;
    });
  }

  // Creeper fuse & melee attack
  if (isAggro && dist < 2.2 && Math.abs(dy) < 2.2) {
    if (mob.type === 'creeper') {
      mob.fuseTimer += dt;
      const pulse = Math.sin(mob.fuseTimer * 24) > 0 ? 1.1 : 1.0;
      mob.mesh.scale.set(pulse, 1 / pulse, pulse);
      if (mob.fuseTimer >= 1.4) {
        mob.hp = 0;
        const dmgScale = difficulty === 'hard' ? 1.4 : difficulty === 'easy' ? 0.6 : 1.0;
        onAttackPlayer(Math.round(spec.damage * dmgScale), spec.nameVi, { x: mob.x, y: mob.y, z: mob.z });
      }
    } else if (mob.attackCooldown <= 0) {
      mob.attackCooldown = 1.25;
      const dmgScale = difficulty === 'hard' ? 1.5 : difficulty === 'easy' ? 0.65 : 1.0;
      onAttackPlayer(Math.max(1, Math.round(spec.damage * dmgScale)), spec.nameVi);
    }
  } else if (mob.type === 'creeper' && mob.fuseTimer > 0) {
    mob.fuseTimer = Math.max(0, mob.fuseTimer - dt * 2);
    mob.mesh.scale.set(1, 1, 1);
  }
}
