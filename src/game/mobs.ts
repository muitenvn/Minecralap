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

// Build composite 6-10 part procedural 3D voxel mobs pivoted at bottom-center
export function buildMobMesh(type: MobType): { group: THREE.Group; limbs: THREE.Object3D[] } {
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
    // 1.16 Nether Strider: squat crimson body + shaggy hair strands + 2 tall stilt legs
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
    // Floating 3D Ghast with 9 dangling tentacles + sad eyes
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

  // Humanoid mobs: Zombie, Creeper, Piglin, Zombified Piglin
  const isCreeper = type === 'creeper';
  const isPiglin = type === 'piglin';
  const isZPiglin = type === 'zombified_piglin';

  const skinCol = isCreeper ? 0x4ba843 : isPiglin ? 0xe5a48e : isZPiglin ? 0x789c5a : 0x5c8c4c;
  const torsoCol = isCreeper ? 0x3b8c36 : isPiglin ? 0x7a4236 : isZPiglin ? 0x624438 : 0x2a7886;
  const legCol = isCreeper ? 0x32752e : isPiglin ? 0x4b2f28 : isZPiglin ? 0x4a332b : 0x37417a;

  // Legs
  const legCoords = isCreeper ? [[-0.18, 0.16], [0.18, 0.16], [-0.18, -0.16], [0.18, -0.16]] : [[-0.15, 0], [0.15, 0]];
  for (const [lx, lz] of legCoords) {
    const leg = partBox(0.24, 0.68, 0.24, legCol, 0.85);
    leg.position.set(lx, 0.34, lz);
    group.add(leg);
    limbs.push(leg);
  }

  // Torso
  const torso = partBox(0.52, 0.68, 0.28, torsoCol, 0.78);
  torso.position.set(0, 1.02, 0);
  group.add(torso);

  // Head
  const head = partBox(0.48, 0.48, 0.48, skinCol, 0.72);
  head.position.set(0, 1.6, 0);
  group.add(head);

  // Face details
  const eyeCol = isPiglin ? 0xfef9c3 : 0x18181b;
  const eyeL = partBox(0.1, 0.1, 0.05, eyeCol, 0.2, 0, isPiglin ? 0xfacc15 : 0);
  eyeL.position.set(-0.12, 1.64, 0.24);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;
  group.add(eyeL, eyeR);

  if (isPiglin || isZPiglin) {
    // Piglin snout + floppy ears + shiny metallic gold sword!
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
      // Metallic gold belt trim (roughness delta >= 0.5 vs leather tunic)
      const belt = partBox(0.55, 0.12, 0.31, 0xf5c531, 0.2, 0.88);
      belt.position.set(0, 0.76, 0);
      group.add(belt);
    }
  } else if (isCreeper) {
    const mouth = partBox(0.22, 0.18, 0.05, 0x18181b, 0.3);
    mouth.position.set(0, 1.48, 0.24);
    group.add(mouth);
  }

  // Arms (non-creeper)
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
    limbs.push(armL, armR);
  }

  return { group, limbs };
}

export function disposeMobMesh(mesh: THREE.Group): void {
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
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
    // Float in Nether sky
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
      mob.vy = 7.4; // Hop up 1-block ledge
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
