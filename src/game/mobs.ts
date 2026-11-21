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
  | 'ghast'
  | 'warden'
  | 'breeze'
  | 'creaking'
  | 'allay'
  | 'frog'
  | 'bogged'
  | 'happy_ghast'
  | 'copper_golem'
  | 'axolotl'
  | 'goat'
  | 'glow_squid'
  | 'tadpole'
  | 'sniffer'
  | 'camel'
  | 'armadillo'
  | 'ghastling'
  | 'nautilus'
  | 'zombie_nautilus'
  | 'camel_husk'
  | 'parched'
  | 'zombie_horse'
  | 'sulfur_cube'
  | 'cold_sulfur_cube'
  | 'frostbite'
  | 'ender_dragon';

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
  absorbedBlockId?: number; // for 2026 Sulfur Cube block absorption
  armored?: boolean; // Wolf/Mount armor
  riddenByPlayer?: boolean;
  specialTick?: number;
  mesh: THREE.Group;
  limbs: THREE.Object3D[];
}

export interface MobSpec {
  nameVi: string;
  hp: number;
  hostile: boolean;
  speed: number;
  damage: number;
  drop: string;
  dropCount: number;
  width: number;
  height: number;
  rideable?: boolean;
  flying?: boolean;
  aquatic?: boolean;
  boss?: boolean;
}

export const MOB_SPECS: Record<MobType, MobSpec> = {
  pig: { nameVi: 'Heo', hp: 10, hostile: false, speed: 2.2, damage: 0, drop: 'raw_porkchop', dropCount: 2, width: 0.7, height: 0.9 },
  sheep: { nameVi: 'Cừu', hp: 8, hostile: false, speed: 2.1, damage: 0, drop: 'raw_porkchop', dropCount: 1, width: 0.7, height: 1.2 },
  zombie: { nameVi: 'Thây Ma (Zombie)', hp: 20, hostile: true, speed: 2.7, damage: 3, drop: 'iron_ingot', dropCount: 1, width: 0.65, height: 1.85 },
  creeper: { nameVi: 'Creeper', hp: 20, hostile: true, speed: 2.6, damage: 8, drop: 'coal', dropCount: 2, width: 0.65, height: 1.75 },
  piglin: { nameVi: 'Piglin', hp: 16, hostile: true, speed: 3.1, damage: 4, drop: 'gold_ingot', dropCount: 1, width: 0.65, height: 1.9 },
  strider: { nameVi: 'Strider', hp: 20, hostile: false, speed: 2.4, damage: 0, drop: 'obsidian', dropCount: 1, width: 0.85, height: 1.65, rideable: true },
  zombified_piglin: { nameVi: 'Zombified Piglin', hp: 20, hostile: false, speed: 2.6, damage: 5, drop: 'gold_ingot', dropCount: 1, width: 0.65, height: 1.9 },
  ghast: { nameVi: 'Ghast Nether', hp: 12, hostile: true, speed: 2.2, damage: 5, drop: 'quartz', dropCount: 3, width: 2.6, height: 2.6, flying: true },
  warden: { nameVi: 'Warden (Deep Dark)', hp: 85, hostile: true, speed: 3.3, damage: 10, drop: 'echo_shard', dropCount: 2, width: 1.1, height: 2.9, boss: true },
  breeze: { nameVi: 'Breeze (Phòng Thử Thách)', hp: 24, hostile: true, speed: 3.5, damage: 4, drop: 'breeze_rod', dropCount: 2, width: 0.75, height: 1.8 },
  creaking: { nameVi: 'Creaking (Vườn Nhợt Nhạt)', hp: 30, hostile: true, speed: 3.4, damage: 5, drop: 'resin_clump', dropCount: 3, width: 0.8, height: 2.65 },
  allay: { nameVi: 'Allay (Tiên Nhặt Đồ)', hp: 20, hostile: false, speed: 3.4, damage: 0, drop: 'amethyst_shard', dropCount: 1, width: 0.5, height: 0.7, flying: true },
  frog: { nameVi: 'Ếch (Frog)', hp: 10, hostile: false, speed: 2.3, damage: 0, drop: 'ochre_froglight', dropCount: 1, width: 0.6, height: 0.55 },
  bogged: { nameVi: 'Bogged (Xương Rêu Đầm Lầy)', hp: 16, hostile: true, speed: 2.6, damage: 4, drop: 'arrow', dropCount: 3, width: 0.65, height: 1.9 },
  happy_ghast: { nameVi: 'Happy Ghast (Ghast Vui Vẻ)', hp: 30, hostile: false, speed: 3.4, damage: 0, drop: 'dried_ghast', dropCount: 1, width: 2.6, height: 2.6, rideable: true, flying: true },
  copper_golem: { nameVi: 'Copper Golem (Người Máy Đồng)', hp: 24, hostile: false, speed: 2.2, damage: 0, drop: 'copper_ingot', dropCount: 2, width: 0.65, height: 1.15 },
  axolotl: { nameVi: 'Axolotl (Kỳ Nhông Hang Động)', hp: 14, hostile: false, speed: 2.5, damage: 0, drop: 'tropical_fish', dropCount: 1, width: 0.75, height: 0.45, aquatic: true },
  goat: { nameVi: 'Dê Núi (Goat)', hp: 10, hostile: false, speed: 2.8, damage: 2, drop: 'goat_horn', dropCount: 1, width: 0.9, height: 1.3 },
  glow_squid: { nameVi: 'Mực Phát Sáng (Glow Squid)', hp: 10, hostile: false, speed: 2.2, damage: 0, drop: 'glow_lichen', dropCount: 2, width: 0.8, height: 0.9, aquatic: true },
  tadpole: { nameVi: 'Nòng Nọc (Tadpole)', hp: 6, hostile: false, speed: 2.4, damage: 0, drop: 'slime_ball', dropCount: 1, width: 0.4, height: 0.35, aquatic: true },
  sniffer: { nameVi: 'Sniffer (Quái Thú Cổ Đại)', hp: 28, hostile: false, speed: 1.7, damage: 0, drop: 'torchflower', dropCount: 1, width: 1.7, height: 1.6 },
  camel: { nameVi: 'Lạc Đà (Camel)', hp: 32, hostile: false, speed: 3.2, damage: 0, drop: 'leather', dropCount: 2, width: 1.3, height: 2.2, rideable: true },
  armadillo: { nameVi: 'Tatu (Armadillo)', hp: 12, hostile: false, speed: 2.0, damage: 0, drop: 'armadillo_scute', dropCount: 2, width: 0.7, height: 0.65 },
  ghastling: { nameVi: 'Ghastling (Ghast Nhỏ)', hp: 14, hostile: false, speed: 3.1, damage: 0, drop: 'dried_ghast', dropCount: 1, width: 1.1, height: 1.1, flying: true },
  nautilus: { nameVi: 'Ốc Anh Vũ Khổng Lồ (Nautilus)', hp: 28, hostile: false, speed: 3.6, damage: 0, drop: 'nautilus_shell', dropCount: 2, width: 1.2, height: 1.2, rideable: true, aquatic: true },
  zombie_nautilus: { nameVi: 'Zombie Nautilus', hp: 24, hostile: true, speed: 3.0, damage: 4, drop: 'nautilus_shell', dropCount: 1, width: 1.2, height: 1.2, aquatic: true },
  camel_husk: { nameVi: 'Lạc Đà Xác Khô (Camel Husk)', hp: 28, hostile: true, speed: 2.9, damage: 5, drop: 'rotten_flesh', dropCount: 2, width: 1.3, height: 2.2 },
  parched: { nameVi: 'Parched (Xương Sa Mạc)', hp: 18, hostile: true, speed: 2.8, damage: 4, drop: 'arrow', dropCount: 3, width: 0.65, height: 1.9 },
  zombie_horse: { nameVi: 'Ngựa Xác Sống (Zombie Horse)', hp: 26, hostile: false, speed: 3.8, damage: 0, drop: 'rotten_flesh', dropCount: 2, width: 1.2, height: 1.6, rideable: true },
  sulfur_cube: { nameVi: 'Sulfur Cube (Khối Lưu Huỳnh 26.3)', hp: 22, hostile: true, speed: 2.5, damage: 4, drop: 'sulfur_dust', dropCount: 3, width: 1.0, height: 1.0 },
  cold_sulfur_cube: { nameVi: 'Cold Sulfur Cube (26.4 Băng)', hp: 24, hostile: true, speed: 2.6, damage: 4, drop: 'ice_crystal', dropCount: 2, width: 1.0, height: 1.0 },
  frostbite: { nameVi: 'Frostbite (Xác Băng 26.4)', hp: 22, hostile: true, speed: 2.7, damage: 4, drop: 'snow_bricks', dropCount: 2, width: 0.65, height: 1.9 },
  ender_dragon: { nameVi: 'Rồng Ender (Ender Dragon)', hp: 200, hostile: true, speed: 7.5, damage: 8, drop: 'dragon_egg', dropCount: 1, width: 4.5, height: 3.2, flying: true, boss: true },
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
    if (type === 'happy_ghast' || type === 'ghastling') {
      return buildTexturedHappyGhast(tex, type === 'ghastling' ? 0.48 : 0.95);
    }
    if (type === 'bogged' || type === 'parched' || type === 'frostbite') {
      return buildTexturedSkeleton(tex, type === 'frostbite' ? 0xcffafe : 0xffffff);
    }
    if (type === 'warden') return buildTexturedWarden(tex);
    if (type === 'breeze') return buildTexturedBreeze(tex);
    if (type === 'allay') return buildTexturedAllay(tex);
    if (type === 'creaking') return buildTexturedCreaking(tex);
    if (type === 'copper_golem') return buildTexturedCopperGolem(tex);
    // Apply crisp Minecraft 26.3 entity PNG skinning to all other 3D composite mobs (camel, sniffer, axolotl, goat, frog, tadpole, armadillo, glow_squid, nautilus, zombie_horse, ender_dragon, etc.)
    return buildTexturedProceduralComposite(type, tex);
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

// --- 8. TEXTURED HAPPY GHAST & GHASTLING (entity/ghast/happy_ghast.png — 64x64) ---
function buildTexturedHappyGhast(
  tex: THREE.Texture,
  scale = 0.95,
): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);
  const unit = (2.15 / 16) * scale;

  const body = texturedPart(createMobBoxGeometry(16, 16, 16, 0, 0, 64, 64, 0, unit), mat);
  body.position.set(0, 1.9 * scale, 0);
  group.add(body);

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const lenPx = 6 + ((i * 2 + j + 4) % 3) * 2;
      const pivot = new THREE.Group();
      pivot.position.set(i * 0.52 * scale, 0.92 * scale, j * 0.52 * scale);
      const tent = texturedPart(createMobBoxGeometry(2, lenPx, 2, 0, 0, 64, 64, 0, unit), mat);
      tent.position.y = -(lenPx * unit) * 0.5;
      pivot.add(tent);
      group.add(pivot);
      limbs.push(pivot);
    }
  }
  return { group, limbs };
}

// --- 9. TEXTURED SKELETON VARIANTS (Bogged / Parched / Frostbite — 64x32) ---
function buildTexturedSkeleton(
  tex: THREE.Texture,
  tintHex = 0xffffff,
): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = new THREE.MeshLambertMaterial({ map: tex, color: tintHex });

  for (const lx of [-2, 2]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * PX, 12 * PX, 0);
    const leg = texturedPart(createMobBoxGeometry(2, 12, 2, 0, 16, 64, 32), mat);
    leg.position.y = -6 * PX;
    pivot.add(leg);
    group.add(pivot);
    limbs.push(pivot);
  }
  const torso = texturedPart(createMobBoxGeometry(8, 12, 4, 16, 16, 64, 32), mat);
  torso.position.set(0, 18 * PX, 0);
  group.add(torso);

  const head = texturedPart(createMobBoxGeometry(8, 8, 8, 0, 0, 64, 32), mat);
  head.position.set(0, 28 * PX, 0);
  group.add(head);

  for (const ax of [-5, 5]) {
    const pivot = new THREE.Group();
    pivot.position.set(ax * PX, 22 * PX, 0);
    pivot.rotation.x = -Math.PI * 0.35;
    const arm = texturedPart(createMobBoxGeometry(2, 12, 2, 40, 16, 64, 32), mat);
    arm.position.y = -5 * PX;
    pivot.add(arm);
    group.add(pivot);
    limbs.push(pivot);
  }
  return { group, limbs };
}

// --- 10. TEXTURED WARDEN BOSS (entity/warden/warden.png — 128x128) ---
function buildTexturedWarden(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);
  const s = PX * 1.04;

  for (const lx of [-5.5, 5.5]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * s, 13 * s, 0);
    const leg = texturedPart(createMobBoxGeometry(6, 13, 6, 76, 48, 128, 128, 0, s), mat);
    leg.position.y = -6.5 * s;
    pivot.add(leg);
    group.add(pivot);
    limbs.push(pivot);
  }

  const chest = texturedPart(createMobBoxGeometry(18, 21, 11, 0, 0, 128, 128, 0, s), mat);
  chest.position.set(0, 23.5 * s, 0);
  group.add(chest);

  const head = texturedPart(createMobBoxGeometry(16, 16, 10, 0, 32, 128, 128, 0, s), mat);
  head.position.set(0, 41 * s, 1 * s);
  group.add(head);

  // Sculk Tendril Horns
  for (const hx of [-11, 11]) {
    const tendril = texturedPart(createMobBoxGeometry(6, 12, 2, 58, 0, 128, 128, 0, s), mat);
    tendril.position.set(hx * s, 45 * s, 0);
    group.add(tendril);
  }

  for (const ax of [-13, 13]) {
    const pivot = new THREE.Group();
    pivot.position.set(ax * s, 32 * s, 0);
    const arm = texturedPart(createMobBoxGeometry(8, 28, 8, 44, 50, 128, 128, 0, s), mat);
    arm.position.y = -13 * s;
    pivot.add(arm);
    group.add(pivot);
    limbs.push(pivot);
  }
  return { group, limbs };
}

// --- 11. TEXTURED BREEZE (entity/breeze/breeze.png — 32x32) ---
function buildTexturedBreeze(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex, true);

  const head = texturedPart(createMobBoxGeometry(8, 8, 8, 0, 0, 32, 32), mat);
  head.position.set(0, 24 * PX, 0);
  group.add(head);

  const rod = texturedPart(createMobBoxGeometry(4, 18, 4, 0, 16, 32, 32), mat);
  rod.position.set(0, 11 * PX, 0);
  group.add(rod);
  limbs.push(rod);

  const windMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45 });
  const swirl = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.36, 0.92), windMat);
  swirl.position.set(0, 12 * PX, 0);
  group.add(swirl);
  limbs.push(swirl);
  return { group, limbs };
}

// --- 12. TEXTURED ALLAY (entity/allay/allay.png — 32x32) ---
function buildTexturedAllay(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex, true);
  const s = PX * 1.15;

  const head = texturedPart(createMobBoxGeometry(5, 5, 5, 0, 0, 32, 32, 0, s), mat);
  head.position.set(0, 14 * s, 0);
  group.add(head);

  const body = texturedPart(createMobBoxGeometry(3, 6, 2, 0, 10, 32, 32, 0, s), mat);
  body.position.set(0, 8.5 * s, 0);
  group.add(body);

  for (const wx of [-1, 1]) {
    const wingPivot = new THREE.Group();
    wingPivot.position.set(wx * 1.5 * s, 11 * s, -1.5 * s);
    const wing = texturedPart(createMobBoxGeometry(6, 5, 0.5, 16, 14, 32, 32, 0, s), mat);
    wing.position.set(wx * 3 * s, 0, 0);
    wingPivot.add(wing);
    group.add(wingPivot);
    limbs.push(wingPivot);
  }
  return { group, limbs };
}

// --- 13. TEXTURED CREAKING (entity/creaking/creaking.png — 64x64) ---
function buildTexturedCreaking(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);
  const s = PX * 1.12;

  for (const lx of [-3, 3]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * s, 16 * s, 0);
    const leg = texturedPart(createMobBoxGeometry(3, 16, 3, 0, 34, 64, 64, 0, s), mat);
    leg.position.y = -8 * s;
    pivot.add(leg);
    group.add(pivot);
    limbs.push(pivot);
  }
  const torso = texturedPart(createMobBoxGeometry(8, 14, 5, 0, 16, 64, 64, 0, s), mat);
  torso.position.set(0, 23 * s, 0);
  group.add(torso);

  const head = texturedPart(createMobBoxGeometry(6, 10, 6, 0, 0, 64, 64, 0, s), mat);
  head.position.set(0, 35 * s, 0.5 * s);
  group.add(head);

  for (const ax of [-6, 6]) {
    const pivot = new THREE.Group();
    pivot.position.set(ax * s, 28 * s, 0);
    const arm = texturedPart(createMobBoxGeometry(3, 18, 3, 30, 40, 64, 64, 0, s), mat);
    arm.position.y = -8 * s;
    pivot.add(arm);
    group.add(pivot);
    limbs.push(pivot);
  }
  return { group, limbs };
}

// --- 14. TEXTURED COPPER GOLEM (entity/copper_golem/copper_golem.png — 64x64) ---
function buildTexturedCopperGolem(tex: THREE.Texture): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const group = new THREE.Group();
  const limbs: THREE.Object3D[] = [];
  const mat = createEntityMaterial(tex);

  for (const lx of [-2.2, 2.2]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx * PX, 6 * PX, 0);
    const leg = texturedPart(createMobBoxGeometry(3, 6, 3, 0, 27, 64, 64), mat);
    leg.position.y = -3 * PX;
    pivot.add(leg);
    group.add(pivot);
    limbs.push(pivot);
  }
  const body = texturedPart(createMobBoxGeometry(7, 6, 6, 0, 15, 64, 64), mat);
  body.position.set(0, 9 * PX, 0);
  group.add(body);

  const head = texturedPart(createMobBoxGeometry(8, 6, 8, 0, 0, 64, 64), mat);
  head.position.set(0, 15 * PX, 0);
  group.add(head);

  const rod = texturedPart(createMobBoxGeometry(2, 5, 2, 32, 0, 64, 64), mat);
  rod.position.set(0, 20.5 * PX, 0);
  group.add(rod);

  for (const ax of [-5.2, 5.2]) {
    const pivot = new THREE.Group();
    pivot.position.set(ax * PX, 11.5 * PX, 0);
    const arm = texturedPart(createMobBoxGeometry(3, 9, 3, 36, 16, 64, 64), mat);
    arm.position.y = -4 * PX;
    pivot.add(arm);
    group.add(pivot);
    limbs.push(pivot);
  }
  return { group, limbs };
}

// --- 15. TEXTURED COMPOSITE SKINNING FOR REMAINING 26.3 MOBS (Camel, Sniffer, Axolotl, Goat, Frog, Tadpole, Armadillo, Glow Squid, Nautilus, Zombie Horse, Ender Dragon) ---
function buildTexturedProceduralComposite(
  type: MobType,
  tex: THREE.Texture,
): { group: THREE.Group; limbs: THREE.Object3D[] } {
  const built = buildFallbackProceduralMob(type);
  const skinnedMat = createEntityMaterial(tex, true);
  built.group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const oldMat = obj.material as THREE.MeshLambertMaterial | THREE.MeshBasicMaterial;
    // Keep bright emissive eyes/beacons intact, skin all body/limb/wing boxes with official 26.3 texture tinted gently
    if (oldMat instanceof THREE.MeshBasicMaterial) return;
    const c = oldMat.color ? oldMat.color.clone() : new THREE.Color(0xffffff);
    // Blend 70% white + 30% structural tint so the real 26.3 PNG artwork shines cleanly
    c.lerp(new THREE.Color(0xffffff), 0.72);
    const mat = skinnedMat.clone();
    mat.color.copy(c);
    obj.material = mat;
    oldMat.dispose();
  });
  return built;
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

  // --- Modern Minecraft 1.19–26.3 Boss & Biome Mobs: Warden, Breeze, Creaking ---
  if (type === 'warden') {
    const bodyCol = 0x0d2b33;
    const boneCol = 0xd6d3c4;
    const glowCol = 0x2dd4bf;
    for (const sx of [-0.26, 0.26]) {
      const leg = partBox(0.36, 0.9, 0.38, bodyCol, 0.75);
      leg.position.set(sx, 0.45, 0);
      group.add(leg);
      limbs.push(leg);
    }
    const torso = partBox(0.95, 1.15, 0.62, bodyCol, 0.72);
    torso.position.set(0, 1.45, 0);
    const core = partBox(0.46, 0.48, 0.08, glowCol, 0.15, 0, glowCol);
    core.position.set(0, 1.48, 0.31);
    const ribs = partBox(0.68, 0.78, 0.66, boneCol, 0.8);
    ribs.position.set(0, 1.48, 0);
    const head = partBox(0.76, 0.76, 0.56, bodyCol, 0.75);
    head.position.set(0, 2.38, 0.04);
    const mouth = partBox(0.46, 0.22, 0.06, 0x051418, 0.4);
    mouth.position.set(0, 2.22, 0.31);
    for (const sx of [-0.48, 0.48]) {
      const horn = partBox(0.28, 0.46, 0.12, glowCol, 0.2, 0, 0x0ea5a4);
      horn.position.set(sx, 2.58, 0.02);
      horn.rotation.z = sx < 0 ? 0.25 : -0.25;
      group.add(horn);
      const arm = partBox(0.34, 1.32, 0.36, bodyCol, 0.76);
      arm.position.set(sx * 1.35, 1.32, 0.1);
      group.add(arm);
      limbs.push(arm);
    }
    group.add(torso, ribs, core, head, mouth);
    return { group, limbs };
  }

  if (type === 'breeze') {
    const skinCol = 0xaf94df;
    const windCol = 0xdbeafe;
    const eyeCol = 0xfef08a;
    const head = partBox(0.52, 0.52, 0.52, skinCol, 0.6);
    head.position.set(0, 1.42, 0);
    const brow = partBox(0.56, 0.12, 0.56, 0x6d529e, 0.65);
    brow.position.set(0, 1.54, 0);
    const eyeL = partBox(0.11, 0.09, 0.05, eyeCol, 0.15, 0, 0xfacc15);
    eyeL.position.set(-0.12, 1.42, 0.26);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.12;
    const rod = partBox(0.22, 0.92, 0.22, 0x8b6dc4, 0.5, 0.2);
    rod.position.set(0, 0.72, 0);
    const swirlTop = partBox(0.76, 0.24, 0.76, windCol, 0.3, 0, 0x93c5fd);
    swirlTop.position.set(0, 0.92, 0);
    const swirlMid = partBox(0.56, 0.22, 0.56, windCol, 0.3, 0, 0x7dd3fc);
    swirlMid.position.set(0, 0.6, 0);
    const swirlBot = partBox(0.36, 0.18, 0.36, windCol, 0.3, 0, 0x60a5fa);
    swirlBot.position.set(0, 0.32, 0);
    group.add(head, brow, eyeL, eyeR, rod, swirlTop, swirlMid, swirlBot);
    limbs.push(swirlTop, swirlMid, swirlBot);
    return { group, limbs };
  }

  if (type === 'creaking') {
    const barkCol = 0x4f4c4d;
    const mossCol = 0x787d76;
    const eyeCol = 0xf97316;
    for (const sx of [-0.2, 0.2]) {
      const leg = partBox(0.2, 1.2, 0.22, barkCol, 0.9);
      leg.position.set(sx, 0.6, 0);
      group.add(leg);
      limbs.push(leg);
    }
    const torso = partBox(0.58, 1.05, 0.32, barkCol, 0.9);
    torso.position.set(0, 1.68, 0);
    const heartGlow = partBox(0.24, 0.32, 0.34, eyeCol, 0.2, 0, 0xea580c);
    heartGlow.position.set(0, 1.72, 0);
    const head = partBox(0.46, 0.58, 0.42, barkCol, 0.88);
    head.position.set(0.06, 2.38, 0);
    head.rotation.z = -0.14;
    const crown = partBox(0.56, 0.22, 0.46, mossCol, 0.9);
    crown.position.set(0.08, 2.66, 0);
    for (const [ex, ey] of [[-0.08, 2.44], [0.14, 2.42], [0.03, 2.28]] as [number, number][]) {
      const eye = partBox(0.08, 0.08, 0.05, eyeCol, 0.15, 0, 0xf97316);
      eye.position.set(ex, ey, 0.22);
      group.add(eye);
    }
    const armL = partBox(0.18, 1.25, 0.18, barkCol, 0.9);
    armL.position.set(-0.42, 1.55, 0.1);
    const armR = partBox(0.18, 1.25, 0.18, barkCol, 0.9);
    armR.position.set(0.42, 1.55, 0.1);
    group.add(torso, heartGlow, head, crown, armL, armR);
    limbs.push(armL, armR);
    return { group, limbs };
  }

  if (type === 'allay') {
    const cyan = 0x38e8ff;
    const head = partBox(0.36, 0.36, 0.36, cyan, 0.2, 0, 0x0ea5e9);
    head.position.set(0, 1.35, 0);
    const body = partBox(0.24, 0.34, 0.18, 0x06b6d4, 0.25, 0, 0x0284c7);
    body.position.set(0, 1.02, 0);
    const wingL = partBox(0.04, 0.34, 0.5, 0xbae6fd, 0.15, 0, 0x38bdf8);
    wingL.position.set(-0.18, 1.15, -0.18);
    wingL.rotation.y = 0.4;
    const wingR = wingL.clone();
    wingR.position.x = 0.18;
    wingR.rotation.y = -0.4;
    group.add(head, body, wingL, wingR);
    limbs.push(wingL, wingR);
    return { group, limbs };
  }

  if (type === 'frog') {
    const bodyCol = 0xd97742;
    const bellyCol = 0xfef3c7;
    const body = partBox(0.56, 0.28, 0.58, bodyCol, 0.75);
    body.position.set(0, 0.24, 0);
    const belly = partBox(0.48, 0.1, 0.48, bellyCol, 0.8);
    belly.position.set(0, 0.11, 0);
    for (const sx of [-0.18, 0.18]) {
      const eye = partBox(0.14, 0.14, 0.14, bodyCol, 0.6);
      eye.position.set(sx, 0.42, 0.16);
      const pupil = partBox(0.08, 0.08, 0.04, 0x18181b, 0.2);
      pupil.position.set(sx, 0.42, 0.23);
      const leg = partBox(0.16, 0.14, 0.24, bodyCol, 0.8);
      leg.position.set(sx * 1.6, 0.08, -0.1);
      group.add(eye, pupil, leg);
      limbs.push(leg);
    }
    group.add(body, belly);
    return { group, limbs };
  }

  if (type === 'bogged') {
    const boneCol = 0x9aa88c;
    const mossCol = 0x4d7c2e;
    for (const sx of [-0.15, 0.15]) {
      const leg = partBox(0.14, 0.72, 0.14, boneCol, 0.8);
      leg.position.set(sx, 0.36, 0);
      group.add(leg);
      limbs.push(leg);
    }
    const torso = partBox(0.46, 0.68, 0.24, mossCol, 0.85);
    torso.position.set(0, 1.04, 0);
    const head = partBox(0.48, 0.48, 0.48, boneCol, 0.78);
    head.position.set(0, 1.62, 0);
    const mush = partBox(0.16, 0.16, 0.16, 0xdc2626, 0.7);
    mush.position.set(0.14, 1.92, 0);
    const armL = partBox(0.14, 0.66, 0.14, boneCol, 0.8);
    armL.position.set(-0.34, 1.06, 0.22);
    armL.rotation.x = -Math.PI * 0.42;
    const armR = armL.clone();
    armR.position.x = 0.34;
    group.add(torso, head, mush, armL, armR);
    return { group, limbs };
  }

  if (type === 'happy_ghast') {
    const head = partBox(2.2, 2.2, 2.2, 0xf8fafc, 0.82);
    head.position.set(0, 2.1, 0);
    const harness = partBox(2.3, 0.6, 2.3, 0x2563eb, 0.6);
    harness.position.set(0, 2.75, 0);
    const goggleL = partBox(0.46, 0.3, 0.12, 0x38bdf8, 0.2, 0.4);
    goggleL.position.set(-0.5, 2.32, 1.12);
    const goggleR = goggleL.clone();
    goggleR.position.x = 0.5;
    const smile = partBox(0.66, 0.18, 0.08, 0xf472b6, 0.4);
    smile.position.set(0, 1.72, 1.12);
    group.add(head, harness, goggleL, goggleR, smile);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const len = 0.78 + ((i + j + 4) % 2) * 0.2;
        const tent = partBox(0.24, len, 0.24, 0xe2e8f0, 0.86);
        tent.position.set(i * 0.62, 0.98 - len * 0.5, j * 0.62);
        group.add(tent);
        limbs.push(tent);
      }
    }
    return { group, limbs };
  }

  if (type === 'copper_golem') {
    const copperCol = 0xc46c4a;
    const oxCol = 0x52a384;
    for (const sx of [-0.14, 0.14]) {
      const leg = partBox(0.18, 0.34, 0.18, copperCol, 0.35, 0.75);
      leg.position.set(sx, 0.17, 0);
      group.add(leg);
      limbs.push(leg);
    }
    const torso = partBox(0.44, 0.44, 0.32, copperCol, 0.35, 0.75);
    torso.position.set(0, 0.56, 0);
    const head = partBox(0.44, 0.36, 0.38, oxCol, 0.4, 0.65);
    head.position.set(0, 0.96, 0);
    const rod = partBox(0.08, 0.32, 0.08, 0xf97316, 0.2, 0.85, 0xea580c);
    rod.position.set(0, 1.28, 0);
    const nose = partBox(0.12, 0.16, 0.12, copperCol, 0.35, 0.75);
    nose.position.set(0, 0.9, 0.22);
    const armL = partBox(0.14, 0.44, 0.14, copperCol, 0.35, 0.75);
    armL.position.set(-0.31, 0.56, 0);
    const armR = armL.clone();
    armR.position.x = 0.31;
    group.add(torso, head, rod, nose, armL, armR);
    limbs.push(armL, armR);
    return { group, limbs };
  }

  // --- 1.17–1.21 + 2025–2026 + 26.4 + The End 3D Composite Mobs ---
  if (type === 'axolotl') {
    const pink = 0xf9a8d4;
    const gillCol = 0xec4899;
    const body = partBox(0.36, 0.22, 0.66, pink, 0.45);
    body.position.set(0, 0.18, 0);
    const head = partBox(0.42, 0.24, 0.3, pink, 0.45);
    head.position.set(0, 0.22, 0.44);
    const tail = partBox(0.08, 0.22, 0.52, gillCol, 0.5);
    tail.position.set(0, 0.2, -0.56);
    for (const sx of [-0.26, 0.26]) {
      const gill = partBox(0.14, 0.26, 0.06, gillCol, 0.5);
      gill.position.set(sx, 0.26, 0.36);
      const eye = partBox(0.06, 0.06, 0.04, 0x18181b, 0.2);
      eye.position.set(sx * 0.55, 0.24, 0.59);
      group.add(gill, eye);
    }
    for (const [lx, lz] of [[-0.2, 0.22], [0.2, 0.22], [-0.2, -0.22], [0.2, -0.22]]) {
      const leg = partBox(0.1, 0.14, 0.1, pink, 0.55);
      leg.position.set(lx, 0.07, lz);
      group.add(leg);
      limbs.push(leg);
    }
    group.add(body, head, tail);
    limbs.push(tail);
    return { group, limbs };
  }

  if (type === 'goat') {
    const wool = 0xf1ede4;
    const hornCol = 0x574c41;
    const body = partBox(0.56, 0.58, 1.0, wool, 0.92);
    body.position.set(0, 0.72, 0);
    const head = partBox(0.38, 0.42, 0.58, wool, 0.85);
    head.position.set(0, 1.08, 0.62);
    const beard = partBox(0.12, 0.22, 0.12, 0xd6d3d1, 0.9);
    beard.position.set(0, 0.82, 0.78);
    for (const sx of [-0.14, 0.14]) {
      const horn = partBox(0.08, 0.42, 0.1, hornCol, 0.65);
      horn.position.set(sx, 1.42, 0.52);
      horn.rotation.x = -0.35;
      const eye = partBox(0.06, 0.06, 0.05, 0xfacc15, 0.2);
      eye.position.set(sx * 1.15, 1.12, 0.86);
      group.add(horn, eye);
    }
    for (const [lx, lz] of [[-0.18, 0.34], [0.18, 0.34], [-0.18, -0.34], [0.18, -0.34]]) {
      const leg = partBox(0.16, 0.52, 0.16, 0x9c8f81, 0.85);
      leg.position.set(lx, 0.26, lz);
      group.add(leg);
      limbs.push(leg);
    }
    group.add(body, head, beard);
    return { group, limbs };
  }

  if (type === 'glow_squid') {
    const body = partBox(0.58, 0.72, 0.58, 0x164e63, 0.25, 0.1, 0x22d3ee);
    body.position.set(0, 0.92, 0);
    const spot = partBox(0.61, 0.24, 0.61, 0x67e8f9, 0.15, 0, 0x38bdf8);
    spot.position.set(0, 1.0, 0);
    group.add(body, spot);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const tent = partBox(0.1, 0.56, 0.1, 0x0891b2, 0.3, 0, 0x22d3ee);
      tent.position.set(Math.cos(ang) * 0.2, 0.32, Math.sin(ang) * 0.2);
      group.add(tent);
      limbs.push(tent);
    }
    return { group, limbs };
  }

  if (type === 'tadpole') {
    const body = partBox(0.24, 0.18, 0.28, 0x5c4738, 0.5);
    body.position.set(0, 0.14, 0.06);
    const tail = partBox(0.05, 0.14, 0.34, 0x7c6352, 0.6);
    tail.position.set(0, 0.14, -0.22);
    group.add(body, tail);
    limbs.push(tail);
    return { group, limbs };
  }

  if (type === 'sniffer') {
    const red = 0x991b1b;
    const moss = 0x4d7c0f;
    const snoutCol = 0xd97706;
    const body = partBox(1.35, 0.82, 1.85, red, 0.88);
    body.position.set(0, 0.82, 0);
    const backMoss = partBox(1.42, 0.28, 1.9, moss, 0.95);
    backMoss.position.set(0, 1.24, 0);
    const head = partBox(0.95, 0.68, 0.72, red, 0.85);
    head.position.set(0, 0.78, 1.15);
    const snout = partBox(0.84, 0.38, 0.42, snoutCol, 0.75);
    snout.position.set(0, 0.72, 1.62);
    for (const sx of [-0.54, 0.54]) {
      const ear = partBox(0.12, 0.52, 0.44, red, 0.9);
      ear.position.set(sx, 0.86, 1.12);
      ear.rotation.z = sx < 0 ? 0.28 : -0.28;
      group.add(ear);
    }
    for (const [lx, lz] of [[-0.48, 0.62], [0.48, 0.62], [-0.48, 0], [0.48, 0], [-0.48, -0.62], [0.48, -0.62]]) {
      const leg = partBox(0.32, 0.48, 0.32, 0x5f1515, 0.88);
      leg.position.set(lx, 0.24, lz);
      group.add(leg);
      limbs.push(leg);
    }
    group.add(body, backMoss, head, snout);
    return { group, limbs };
  }

  if (type === 'camel' || type === 'camel_husk') {
    const isHusk = type === 'camel_husk';
    const sand = isHusk ? 0x8b7e5f : 0xd6a662;
    const dark = isHusk ? 0x5c5340 : 0xb08042;
    const body = partBox(0.86, 0.74, 1.68, sand, 0.86);
    body.position.set(0, 1.28, 0);
    const hump = partBox(0.68, 0.42, 0.72, dark, 0.9);
    hump.position.set(0, 1.78, -0.05);
    const neck = partBox(0.38, 0.88, 0.42, sand, 0.85);
    neck.position.set(0, 1.64, 0.96);
    neck.rotation.x = 0.28;
    const head = partBox(0.46, 0.44, 0.78, sand, 0.82);
    head.position.set(0, 2.04, 1.22);
    for (const sx of [-0.26, 0.26]) {
      const ear = partBox(0.14, 0.14, 0.12, dark, 0.85);
      ear.position.set(sx, 2.26, 0.98);
      const eye = partBox(0.08, 0.08, 0.05, isHusk ? 0x4ade80 : 0x1c1917, 0.2, 0, isHusk ? 0x22c55e : 0);
      eye.position.set(sx * 0.85, 2.08, 1.58);
      group.add(ear, eye);
    }
    for (const [lx, lz] of [[-0.28, 0.62], [0.28, 0.62], [-0.28, -0.62], [0.28, -0.62]]) {
      const leg = partBox(0.22, 1.05, 0.22, dark, 0.88);
      leg.position.set(lx, 0.525, lz);
      group.add(leg);
      limbs.push(leg);
    }
    group.add(body, hump, neck, head);
    return { group, limbs };
  }

  if (type === 'armadillo') {
    const shellCol = 0x9a6b5c;
    const skinCol = 0xd6a593;
    const shell = partBox(0.58, 0.42, 0.72, shellCol, 0.65, 0.12);
    shell.position.set(0, 0.34, 0);
    const plate = partBox(0.62, 0.22, 0.48, 0x7c5244, 0.6);
    plate.position.set(0, 0.44, -0.04);
    const head = partBox(0.28, 0.24, 0.34, skinCol, 0.8);
    head.position.set(0, 0.28, 0.46);
    const tail = partBox(0.1, 0.1, 0.38, shellCol, 0.75);
    tail.position.set(0, 0.18, -0.5);
    for (const [lx, lz] of [[-0.18, 0.22], [0.18, 0.22], [-0.18, -0.22], [0.18, -0.22]]) {
      const leg = partBox(0.12, 0.2, 0.12, skinCol, 0.82);
      leg.position.set(lx, 0.1, lz);
      group.add(leg);
      limbs.push(leg);
    }
    group.add(shell, plate, head, tail);
    return { group, limbs };
  }

  if (type === 'ghastling') {
    const head = partBox(0.95, 0.95, 0.95, 0xf8fafc, 0.82);
    head.position.set(0, 1.35, 0);
    const eyeL = partBox(0.16, 0.14, 0.06, 0x1e293b, 0.2);
    eyeL.position.set(-0.22, 1.44, 0.49);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.22;
    const smile = partBox(0.3, 0.1, 0.06, 0xf472b6, 0.4);
    smile.position.set(0, 1.18, 0.49);
    group.add(head, eyeL, eyeR, smile);
    for (const [tx, tz] of [[-0.25, -0.2], [0.25, -0.2], [0, 0.2], [-0.25, 0.2], [0.25, 0.2]]) {
      const t = partBox(0.12, 0.42, 0.12, 0xe2e8f0, 0.86);
      t.position.set(tx, 0.7, tz);
      group.add(t);
      limbs.push(t);
    }
    return { group, limbs };
  }

  if (type === 'nautilus' || type === 'zombie_nautilus') {
    const isZ = type === 'zombie_nautilus';
    const shellMain = isZ ? 0x4d6b47 : 0xf2e4cf;
    const stripe = isZ ? 0x2d422a : 0xb45309;
    const bodyCol = isZ ? 0x65a30d : 0xfda4af;
    const shell = partBox(0.95, 1.05, 1.05, shellMain, 0.5, 0.15);
    shell.position.set(0, 0.72, -0.15);
    const ring = partBox(1.02, 0.36, 0.82, stripe, 0.55);
    ring.position.set(0, 0.86, -0.18);
    const hood = partBox(0.68, 0.52, 0.54, bodyCol, 0.6);
    hood.position.set(0, 0.56, 0.54);
    for (const sx of [-0.36, 0.36]) {
      const eye = partBox(0.12, 0.16, 0.14, isZ ? 0xef4444 : 0x0ea5e9, 0.2, 0, isZ ? 0xdc2626 : 0x38bdf8);
      eye.position.set(sx, 0.62, 0.66);
      group.add(eye);
    }
    for (let i = -2; i <= 2; i++) {
      const tent = partBox(0.1, 0.12, 0.52, bodyCol, 0.65);
      tent.position.set(i * 0.14, 0.38, 0.92);
      group.add(tent);
      limbs.push(tent);
    }
    group.add(shell, ring, hood);
    return { group, limbs };
  }

  if (type === 'parched' || type === 'frostbite') {
    const isFrost = type === 'frostbite';
    const skinCol = isFrost ? 0x7dd3fc : 0xd6c39c;
    const clothCol = isFrost ? 0x1e3a8a : 0xa1865e;
    const accentCol = isFrost ? 0xbae6fd : 0xfef08a;
    for (const sx of [-0.15, 0.15]) {
      const leg = partBox(0.2, 0.72, 0.2, clothCol, 0.78);
      leg.position.set(sx, 0.36, 0);
      group.add(leg);
      limbs.push(leg);
    }
    const torso = partBox(0.5, 0.68, 0.28, clothCol, 0.75);
    torso.position.set(0, 1.04, 0);
    const head = partBox(0.48, 0.48, 0.48, skinCol, 0.65, isFrost ? 0.15 : 0);
    head.position.set(0, 1.62, 0);
    const crown = partBox(0.54, 0.18, 0.54, accentCol, 0.3, 0, isFrost ? 0x38bdf8 : 0);
    crown.position.set(0, 1.88, 0);
    for (const sx of [-0.12, 0.12]) {
      const eye = partBox(0.1, 0.08, 0.05, isFrost ? 0xe0f2fe : 0x451a03, 0.2, 0, isFrost ? 0x38bdf8 : 0);
      eye.position.set(sx, 1.66, 0.25);
      group.add(eye);
    }
    for (const sx of [-0.36, 0.36]) {
      const arm = partBox(0.18, 0.66, 0.18, skinCol, 0.72);
      arm.position.set(sx, 1.04, 0.22);
      arm.rotation.x = -Math.PI * 0.42;
      group.add(arm);
    }
    group.add(torso, head, crown);
    return { group, limbs };
  }

  if (type === 'zombie_horse') {
    const skin = 0x5c8c4c;
    const mane = 0x2d4a26;
    const body = partBox(0.76, 0.68, 1.48, skin, 0.8);
    body.position.set(0, 1.12, 0);
    const neck = partBox(0.34, 0.78, 0.38, skin, 0.8);
    neck.position.set(0, 1.54, 0.68);
    neck.rotation.x = 0.35;
    const head = partBox(0.36, 0.36, 0.68, skin, 0.78);
    head.position.set(0, 1.84, 0.98);
    const maneStrip = partBox(0.14, 0.76, 0.2, mane, 0.9);
    maneStrip.position.set(0, 1.6, 0.48);
    maneStrip.rotation.x = 0.35;
    for (const [lx, lz] of [[-0.26, 0.54], [0.26, 0.54], [-0.26, -0.54], [0.26, -0.54]]) {
      const leg = partBox(0.2, 0.84, 0.2, mane, 0.84);
      leg.position.set(lx, 0.42, lz);
      group.add(leg);
      limbs.push(leg);
    }
    group.add(body, neck, head, maneStrip);
    return { group, limbs };
  }

  if (type === 'sulfur_cube' || type === 'cold_sulfur_cube') {
    const isCold = type === 'cold_sulfur_cube';
    const outerCol = isCold ? 0x67e8f9 : 0xfacc15;
    const coreCol = isCold ? 0x0284c7 : 0xea580c;
    const outerGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const outerMat = new THREE.MeshStandardMaterial({
      color: outerCol,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
      emissive: isCold ? 0x06b6d4 : 0xca8a04,
      emissiveIntensity: 0.35,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.name = 'sulfurOuter';
    outer.position.set(0, 0.48, 0);
    outer.castShadow = true;
    const core = partBox(0.54, 0.54, 0.54, coreCol, 0.35, 0.2, coreCol);
    core.name = 'sulfurCore';
    core.position.set(0, 0.48, 0);
    for (const sx of [-0.18, 0.18]) {
      const eye = partBox(0.14, 0.14, 0.06, 0x18181b, 0.15);
      eye.position.set(sx, 0.56, 0.48);
      group.add(eye);
    }
    group.add(outer, core);
    limbs.push(outer);
    return { group, limbs };
  }

  if (type === 'ender_dragon') {
    const scale = 0x18181b;
    const ridge = 0x3f3f46;
    const eyeGlow = 0xd946ef;
    const wingMembrane = 0x272033;

    const torso = partBox(1.5, 1.2, 3.4, scale, 0.55, 0.25);
    torso.position.set(0, 1.5, 0);
    const spine = partBox(0.32, 0.45, 3.0, ridge, 0.45, 0.35);
    spine.position.set(0, 2.25, 0);
    const neck = partBox(0.75, 0.72, 1.8, scale, 0.55, 0.2);
    neck.position.set(0, 1.72, 2.3);
    const head = partBox(1.05, 0.88, 1.35, scale, 0.5, 0.25);
    head.position.set(0, 1.75, 3.6);
    const snout = partBox(0.72, 0.48, 0.9, ridge, 0.55);
    snout.position.set(0, 1.55, 4.55);
    for (const sx of [-0.34, 0.34]) {
      const eye = partBox(0.22, 0.14, 0.08, eyeGlow, 0.1, 0, eyeGlow);
      eye.position.set(sx, 1.9, 4.26);
      const horn = partBox(0.18, 0.45, 0.65, ridge, 0.4, 0.4);
      horn.position.set(sx * 1.15, 2.32, 3.25);
      group.add(eye, horn);
    }
    // Massive flapping left & right wing pivots
    const wingLPivot = new THREE.Group();
    wingLPivot.position.set(-0.75, 1.9, 0.4);
    const wingLFrame = partBox(3.8, 0.18, 0.32, scale, 0.5, 0.3);
    wingLFrame.position.set(-1.9, 0, 0.6);
    const wingLSkin = partBox(3.8, 0.08, 2.4, wingMembrane, 0.75);
    wingLSkin.position.set(-1.9, -0.05, -0.5);
    wingLPivot.add(wingLFrame, wingLSkin);

    const wingRPivot = new THREE.Group();
    wingRPivot.position.set(0.75, 1.9, 0.4);
    const wingRFrame = partBox(3.8, 0.18, 0.32, scale, 0.5, 0.3);
    wingRFrame.position.set(1.9, 0, 0.6);
    const wingRSkin = partBox(3.8, 0.08, 2.4, wingMembrane, 0.75);
    wingRSkin.position.set(1.9, -0.05, -0.5);
    wingRPivot.add(wingRFrame, wingRSkin);

    // Segmented dragon tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 1.5, -1.8);
    for (let t = 0; t < 4; t++) {
      const seg = partBox(0.75 - t * 0.12, 0.65 - t * 0.1, 1.0, scale, 0.55);
      seg.position.set(0, 0, -0.5 - t * 0.95);
      const spike = partBox(0.18, 0.28, 0.35, ridge, 0.4);
      spike.position.set(0, 0.42 - t * 0.05, -0.5 - t * 0.95);
      tailPivot.add(seg, spike);
    }
    group.add(torso, spine, neck, head, snout, wingLPivot, wingRPivot, tailPivot);
    limbs.push(wingLPivot, wingRPivot, tailPivot);
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
  onAttackPlayer: (
    dmg: number,
    mobName: string,
    explode?: { x: number; y: number; z: number },
    inflictEffect?: 'slowness' | 'darkness',
  ) => void,
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

  // If currently ridden by the player, engine.ts controls velocity & position directly
  if (mob.riddenByPlayer) {
    mob.walkPhase += dt * (Math.hypot(mob.vx, mob.vz) * 2.2 + 2.5);
    mob.limbs.forEach((limb, idx) => {
      limb.rotation.x = Math.sin(mob.walkPhase + (idx % 2 === 0 ? 0 : Math.PI)) * 0.45;
    });
    return;
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
    dist < (mob.type === 'ender_dragon' ? 72 : mob.type === 'warden' ? 24 : 18);

  // --- ENDER DRAGON BOSS FLIGHT & SWOOP AI ---
  if (mob.type === 'ender_dragon') {
    mob.walkPhase += dt * 4.8;
    const flap = Math.sin(mob.walkPhase) * 0.58;
    if (mob.limbs[0]) mob.limbs[0].rotation.z = flap;
    if (mob.limbs[1]) mob.limbs[1].rotation.z = -flap;
    if (mob.limbs[2]) mob.limbs[2].rotation.y = Math.sin(mob.walkPhase * 0.7) * 0.35;

    mob.wanderAngle += dt * 0.42;
    const swooping = isAggro && Math.sin(mob.wanderAngle * 0.6) > 0.45;
    const targetX = swooping ? playerPos.x : Math.cos(mob.wanderAngle) * 26;
    const targetZ = swooping ? playerPos.z : Math.sin(mob.wanderAngle) * 26;
    const targetY = swooping ? Math.max(60, playerPos.y + 2.2) : 76 + Math.sin(mob.wanderAngle * 2) * 5;

    const toX = targetX - mob.x;
    const toY = targetY - mob.y;
    const toZ = targetZ - mob.z;
    const toLen = Math.max(0.01, Math.hypot(toX, toY, toZ));
    mob.yaw = Math.atan2(toX, toZ);
    const spd = swooping ? spec.speed * 1.2 : spec.speed;
    mob.x += (toX / toLen) * spd * dt;
    mob.y += (toY / toLen) * spd * 0.65 * dt;
    mob.z += (toZ / toLen) * spd * dt;

    if (isAggro && dist < 5.5 && Math.abs(dy) < 4.5 && mob.attackCooldown <= 0) {
      mob.attackCooldown = 2.4;
      const dmgScale = difficulty === 'hard' ? 1.4 : difficulty === 'easy' ? 0.65 : 1.0;
      onAttackPlayer(Math.max(2, Math.round(spec.damage * dmgScale)), spec.nameVi);
    }
    return;
  }

  // --- FLYING MOBS (Ghast, Happy Ghast, Ghastling, Allay) ---
  if (spec.flying) {
    mob.wanderTimer -= dt;
    if (mob.wanderTimer <= 0) {
      mob.wanderTimer = 3 + Math.random() * 4;
      mob.wanderAngle = Math.random() * Math.PI * 2;
    }
    const targetYaw = isAggro ? Math.atan2(dx, dz) : mob.wanderAngle;
    mob.yaw = targetYaw;
    mob.x += Math.sin(mob.yaw) * spec.speed * dt;
    mob.z += Math.cos(mob.yaw) * spec.speed * dt;
    mob.y += Math.sin(performance.now() * (mob.type === 'allay' ? 0.006 : 0.0018) + mob.x) * 0.45 * dt;
    mob.walkPhase += dt * (mob.type === 'allay' ? 12 : 3);
    mob.limbs.forEach((l, idx) => {
      l.rotation.x = Math.sin(mob.walkPhase + idx * 0.7) * (mob.type === 'allay' ? 0.55 : 0.25);
    });
    if (mob.type === 'ghast' && isAggro && dist < 8 && Math.abs(dy) < 6 && mob.attackCooldown <= 0) {
      mob.attackCooldown = 2.6;
      onAttackPlayer(spec.damage, spec.nameVi);
    }
    return;
  }

  // --- AQUATIC MOBS (Axolotl, Glow Squid, Tadpole, Nautilus, Zombie Nautilus) ---
  const curBlock = getBlock(Math.floor(mob.x), Math.floor(mob.y + 0.3), Math.floor(mob.z));
  const inWater = curBlock === BLOCK.WATER;
  if (spec.aquatic && inWater) {
    mob.wanderTimer -= dt;
    if (mob.wanderTimer <= 0) {
      mob.wanderTimer = 2.5 + Math.random() * 3.5;
      mob.wanderAngle = Math.random() * Math.PI * 2;
    }
    mob.yaw = isAggro ? Math.atan2(dx, dz) : mob.wanderAngle;
    mob.x += Math.sin(mob.yaw) * spec.speed * 0.75 * dt;
    mob.z += Math.cos(mob.yaw) * spec.speed * 0.75 * dt;
    mob.y += Math.sin(performance.now() * 0.003 + mob.z) * 0.3 * dt;
    mob.walkPhase += dt * 7;
    mob.limbs.forEach((l, idx) => {
      l.rotation.y = Math.sin(mob.walkPhase + idx * 0.6) * 0.38;
    });
    if (isAggro && dist < 2.4 && Math.abs(dy) < 2.2 && mob.attackCooldown <= 0) {
      mob.attackCooldown = 1.4;
      onAttackPlayer(spec.damage, spec.nameVi);
    }
    return;
  }

  // --- GROUND MOBS ---
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

  // --- 2026 CHAOS CUBED: SULFUR CUBE BLOCK ABSORPTION MUTATION ---
  if ((mob.type === 'sulfur_cube' || mob.type === 'cold_sulfur_cube') && onSolid && below !== BLOCK.AIR && mob.absorbedBlockId !== below) {
    mob.absorbedBlockId = below;
    const outer = mob.mesh.getObjectByName('sulfurOuter') as THREE.Mesh | undefined;
    if (outer && outer.material instanceof THREE.MeshStandardMaterial) {
      if (below === BLOCK.MAGMA || below === BLOCK.LAVA || below === BLOCK.NETHERRACK) {
        outer.material.color.setHex(0xf97316);
        outer.material.emissive.setHex(0xea580c);
      } else if (below === BLOCK.ICE || below === BLOCK.SNOW) {
        outer.material.color.setHex(0x38bdf8);
        outer.material.emissive.setHex(0x0284c7);
      } else if (below === BLOCK.OBSIDIAN || below === BLOCK.BEDROCK) {
        outer.material.color.setHex(0x7e22ce);
        outer.material.emissive.setHex(0x581c87);
        mob.hp = Math.min(mob.maxHp + 8, mob.hp + 6);
      } else if (below === BLOCK.GRASS) {
        outer.material.color.setHex(0x84cc16);
        outer.material.emissive.setHex(0x4d7c0f);
      } else if (below === BLOCK.GOLD_BLOCK || below === BLOCK.GOLD_ORE) {
        outer.material.color.setHex(0xfef08a);
        outer.material.emissive.setHex(0xeab308);
      }
    }
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

  // Limb walk cycle & signature mob animations
  if (mob.type === 'breeze') {
    mob.walkPhase += dt * 7;
    mob.limbs.forEach((swirl, idx) => {
      swirl.rotation.y = mob.walkPhase * (idx % 2 === 0 ? 1 : -1.4);
    });
    if (onSolid && Math.random() < dt * 0.8) {
      mob.vy = 8.2;
    }
  } else if (mob.type === 'sulfur_cube' || mob.type === 'cold_sulfur_cube') {
    mob.walkPhase += dt * 6;
    if (onSolid && Math.random() < dt * 1.1) {
      mob.vy = 6.5; // Bouncy slime/sulfur cube hop!
    }
    const squish = onSolid ? 1 + Math.sin(mob.walkPhase) * 0.08 : 0.9;
    mob.mesh.scale.set(1 / Math.sqrt(squish), squish, 1 / Math.sqrt(squish));
  } else {
    if (mob.type === 'goat' && onSolid && Math.random() < dt * 0.35) {
      mob.vy = 10.2; // High mountain Goat leap!
    }
    if (mob.type === 'frog' && onSolid && Math.random() < dt * 0.5) {
      mob.vy = 6.8;
    }
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
  }

  // Creeper fuse & melee attack (plus Frostbite/Cold Sulfur Cube Slowness & Warden Darkness!)
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
      const inflict =
        mob.type === 'frostbite' || mob.type === 'cold_sulfur_cube'
          ? 'slowness'
          : mob.type === 'warden'
            ? 'darkness'
            : undefined;
      onAttackPlayer(Math.max(1, Math.round(spec.damage * dmgScale)), spec.nameVi, undefined, inflict);
    }
  } else if (mob.type === 'creeper' && mob.fuseTimer > 0) {
    mob.fuseTimer = Math.max(0, mob.fuseTimer - dt * 2);
    mob.mesh.scale.set(1, 1, 1);
  }
}
