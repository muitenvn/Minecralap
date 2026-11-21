import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  DEFAULT_MODEL_CODE,
  ItemStack,
  PlayerModelCode,
  PlayerSkinConfig,
  SkinArmModel,
} from './types';

const SKIN_STORAGE_KEY = 'nethercraft_116_active_skin_v1';
const SKIN_LIBRARY_KEY = 'nethercraft_116_skin_library_v1';

// Helper to paint rectangles onto a 64x64 Minecraft skin canvas
function createSkinCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 64, 64);
  return [c, ctx];
}

function fillBoxSkin(
  ctx: CanvasRenderingContext2D,
  u: number,
  v: number,
  w: number,
  h: number,
  d: number,
  base: string,
  shade: string,
  highlight: string,
) {
  // Top (u+d, v, w, d)
  ctx.fillStyle = highlight;
  ctx.fillRect(u + d, v, w, d);
  // Bottom (u+d+w, v, w, d)
  ctx.fillStyle = shade;
  ctx.fillRect(u + d + w, v, w, d);
  // Right (u, v+d, d, h)
  ctx.fillStyle = shade;
  ctx.fillRect(u, v + d, d, h);
  // Front (u+d, v+d, w, h)
  ctx.fillStyle = base;
  ctx.fillRect(u + d, v + d, w, h);
  // Left (u+d+w, v+d, d, h)
  ctx.fillStyle = shade;
  ctx.fillRect(u + d + w, v + d, d, h);
  // Back (u+d+w+d, v+d, w, h)
  ctx.fillStyle = base;
  ctx.fillRect(u + d + w + d, v + d, w, h);

  // Subtle pixel texture variation
  for (let py = v + d; py < v + d + h; py++) {
    for (let px = u; px < u + 2 * (w + d); px++) {
      if ((px * 7 + py * 13) % 11 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(px, py, 1, 1);
      } else if ((px * 5 + py * 17) % 13 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }
}

// --- 1. BUILT-IN STEVE (Classic 4px arms, authentic 64x64 Minecraft layout) ---
export function generateSteveSkinDataUrl(): string {
  const [c, ctx] = createSkinCanvas();

  // Head (0,0) 8x8x8
  fillBoxSkin(ctx, 0, 0, 8, 8, 8, '#c6906b', '#b27c58', '#3c2514');
  // Hair cap (top, back, sides, forehead)
  ctx.fillStyle = '#3c2514';
  ctx.fillRect(8, 0, 8, 8); // top
  ctx.fillRect(24, 8, 8, 6); // back
  ctx.fillRect(0, 8, 8, 3); // right side
  ctx.fillRect(0, 11, 4, 2);
  ctx.fillRect(16, 8, 8, 3); // left side
  ctx.fillRect(20, 11, 4, 2);
  ctx.fillRect(8, 8, 8, 2); // forehead
  ctx.fillRect(8, 10, 1, 1);
  ctx.fillRect(15, 10, 1, 1);
  // Face (front: 8..15, 8..15)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(9, 12, 1, 1);
  ctx.fillRect(14, 12, 1, 1);
  ctx.fillStyle = '#493c98'; // iconic Steve indigo eyes
  ctx.fillRect(10, 12, 1, 1);
  ctx.fillRect(13, 12, 1, 1);
  ctx.fillStyle = '#9e6b4c'; // nose
  ctx.fillRect(11, 13, 2, 1);
  ctx.fillStyle = '#5c361d'; // goatee/smile
  ctx.fillRect(10, 14, 4, 1);
  ctx.fillRect(10, 15, 1, 1);
  ctx.fillRect(13, 15, 1, 1);
  ctx.fillStyle = '#8b573c';
  ctx.fillRect(11, 15, 2, 1);

  // Body (16,16) 8x12x4 — iconic cyan tee
  fillBoxSkin(ctx, 16, 16, 8, 12, 4, '#00a8b5', '#008c97', '#13c4d1');
  // V-neck skin collar
  ctx.fillStyle = '#c6906b';
  ctx.fillRect(22, 20, 4, 1);
  ctx.fillRect(23, 21, 2, 1);
  // Untucked shirt hem shadow
  ctx.fillStyle = '#007d87';
  ctx.fillRect(20, 30, 8, 2);

  // Right Arm (40,16) 4x12x4 & Left Arm (32,48) 4x12x4
  for (const [ax, ay] of [[40, 16], [32, 48]]) {
    fillBoxSkin(ctx, ax, ay, 4, 12, 4, '#c6906b', '#b27c58', '#00a8b5');
    // Cyan short sleeve (top 4 rows)
    ctx.fillStyle = '#00a8b5';
    ctx.fillRect(ax, ay + 4, 16, 4);
    ctx.fillStyle = '#008c97';
    ctx.fillRect(ax, ay + 7, 16, 1);
  }

  // Right Leg (0,16) 4x12x4 & Left Leg (16,48) 4x12x4 — indigo jeans + grey shoes
  for (const [lx, ly] of [[0, 16], [16, 48]]) {
    fillBoxSkin(ctx, lx, ly, 4, 12, 4, '#3a3492', '#2c2773', '#4942ab');
    // Grey sneakers at bottom 2 rows
    ctx.fillStyle = '#6b6b73';
    ctx.fillRect(lx, ly + 14, 16, 2);
    ctx.fillStyle = '#4a4a52';
    ctx.fillRect(lx, ly + 15, 16, 1);
  }

  return c.toDataURL('image/png');
}

// --- 2. BUILT-IN ALEX (Slim 3px arms, authentic 64x64 Minecraft layout) ---
export function generateAlexSkinDataUrl(): string {
  const [c, ctx] = createSkinCanvas();

  // Head (0,0) 8x8x8 — fair skin + bright orange-ginger hair
  fillBoxSkin(ctx, 0, 0, 8, 8, 8, '#f0c4a8', '#dfb092', '#d97228');
  ctx.fillStyle = '#d97228';
  ctx.fillRect(8, 0, 8, 8); // top
  ctx.fillRect(24, 8, 8, 8); // back full ginger hair
  ctx.fillRect(0, 8, 8, 4); // right side
  ctx.fillRect(0, 12, 5, 3);
  ctx.fillRect(16, 8, 8, 5); // left side ponytail sweep
  ctx.fillRect(19, 13, 5, 3);
  // Forehead side-part bangs
  ctx.fillRect(8, 8, 8, 2);
  ctx.fillRect(8, 10, 3, 1);
  ctx.fillRect(14, 10, 2, 1);
  ctx.fillStyle = '#eb8d3b';
  ctx.fillRect(10, 8, 4, 1);
  // Face — emerald green eyes + soft smile
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(9, 12, 1, 1);
  ctx.fillRect(14, 12, 1, 1);
  ctx.fillStyle = '#3b8c3b';
  ctx.fillRect(10, 12, 1, 1);
  ctx.fillRect(13, 12, 1, 1);
  ctx.fillStyle = '#d98f7c';
  ctx.fillRect(11, 14, 2, 1);

  // Outer Hat Layer (32,0) — Alex side braid highlight
  ctx.fillStyle = '#eb8d3b';
  ctx.fillRect(40, 8, 3, 2);
  ctx.fillRect(50, 12, 3, 4);

  // Body (16,16) 8x12x4 — sage green tunic + leather belt
  fillBoxSkin(ctx, 16, 16, 8, 12, 4, '#6d9b44', '#587f35', '#82b554');
  // Tunic neckline
  ctx.fillStyle = '#527332';
  ctx.fillRect(22, 20, 4, 2);
  ctx.fillStyle = '#f0c4a8';
  ctx.fillRect(23, 20, 2, 1);
  // Leather belt with brass buckle
  ctx.fillStyle = '#5e3c23';
  ctx.fillRect(16, 28, 24, 2);
  ctx.fillStyle = '#d4a64a';
  ctx.fillRect(23, 28, 2, 2);

  // Slim 3px Arms: Right Arm (40,16) 3x12x4 & Left Arm (32,48) 3x12x4
  for (const [ax, ay] of [[40, 16], [32, 48]]) {
    fillBoxSkin(ctx, ax, ay, 3, 12, 4, '#f0c4a8', '#dfb092', '#6d9b44');
    // Green long-ish sleeve (top 6 rows)
    ctx.fillStyle = '#6d9b44';
    ctx.fillRect(ax, ay + 4, 14, 6);
    ctx.fillStyle = '#92c060';
    ctx.fillRect(ax, ay + 9, 14, 1);
  }

  // Legs: Right (0,16) & Left (16,48) — dark taupe pants + brown boots
  for (const [lx, ly] of [[0, 16], [16, 48]]) {
    fillBoxSkin(ctx, lx, ly, 4, 12, 4, '#594b42', '#473c35', '#6b5b51');
    ctx.fillStyle = '#754e34';
    ctx.fillRect(lx, ly + 12, 16, 4);
    ctx.fillStyle = '#4a3120';
    ctx.fillRect(lx, ly + 15, 16, 1);
  }

  return c.toDataURL('image/png');
}

// --- 3. BUILT-IN NETHERITE KNIGHT 1.16 (Bonus built-in 1.16 skin) ---
export function generateNetheriteSkinDataUrl(): string {
  const [c, ctx] = createSkinCanvas();

  // Head — dark forged Netherite helmet with glowing Soul Cyan visor
  fillBoxSkin(ctx, 0, 0, 8, 8, 8, '#3f3842', '#2d2730', '#584f5c');
  ctx.fillStyle = '#18141c';
  ctx.fillRect(9, 11, 6, 3);
  ctx.fillStyle = '#2dd4bf'; // Soul fire cyan eyes
  ctx.fillRect(10, 12, 2, 1);
  ctx.fillRect(13, 12, 2, 1);
  ctx.fillStyle = '#f59e0b'; // Gold crest on hat overlay
  ctx.fillRect(43, 8, 2, 3);
  ctx.fillRect(42, 7, 4, 1);

  // Body — forged Netherite plate + crimson sash + gold trim
  fillBoxSkin(ctx, 16, 16, 8, 12, 4, '#443d48', '#302a33', '#5c5361');
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(21, 21, 6, 8);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(23, 27, 2, 2);
  ctx.fillRect(20, 20, 8, 1);

  // Arms — armored pauldrons
  for (const [ax, ay] of [[40, 16], [32, 48]]) {
    fillBoxSkin(ctx, ax, ay, 4, 12, 4, '#3d3740', '#2b262e', '#991b1b');
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(ax, ay + 4, 16, 4);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(ax, ay + 7, 16, 1);
  }

  // Legs — dark greaves + gilded knee plates
  for (const [lx, ly] of [[0, 16], [16, 48]]) {
    fillBoxSkin(ctx, lx, ly, 4, 12, 4, '#332d36', '#241f26', '#4a424f');
    ctx.fillStyle = '#eab308';
    ctx.fillRect(lx + 4, ly + 9, 4, 2);
    ctx.fillStyle = '#1c191f';
    ctx.fillRect(lx, ly + 13, 16, 3);
  }

  return c.toDataURL('image/png');
}

export function getBuiltinSkins(): PlayerSkinConfig[] {
  return [
    {
      id: 'builtin_steve',
      name: 'Steve (Mặc định)',
      source: 'builtin-steve',
      armModel: 'classic',
      skinDataUrl: generateSteveSkinDataUrl(),
      modelCode: { ...DEFAULT_MODEL_CODE, armWidth: 4, showCape: false },
    },
    {
      id: 'builtin_alex',
      name: 'Alex (Mặc định)',
      source: 'builtin-alex',
      armModel: 'slim',
      skinDataUrl: generateAlexSkinDataUrl(),
      modelCode: { ...DEFAULT_MODEL_CODE, armWidth: 3, showCape: false },
    },
    {
      id: 'builtin_netherite',
      name: 'Chiến Binh Nether 1.16',
      source: 'builtin-netherite',
      armModel: 'classic',
      skinDataUrl: generateNetheriteSkinDataUrl(),
      modelCode: { ...DEFAULT_MODEL_CODE, armWidth: 4, showCape: true, capeColor: '#991b1b' },
    },
  ];
}

// Convert any uploaded 64x64 or legacy 64x32 Minecraft skin image into a normalized 64x64 PNG Data URL
export function normalizeSkinImageTo64(img: HTMLImageElement): string {
  const [c, ctx] = createSkinCanvas();
  if (img.width === 64 && img.height === 32) {
    // Legacy 64x32 Minecraft skin: draw top half and mirror right limbs onto left limbs
    ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);
    ctx.drawImage(img, 0, 16, 16, 16, 16, 48, 16, 16); // Right leg -> Left leg
    ctx.drawImage(img, 40, 16, 16, 16, 32, 48, 16, 16); // Right arm -> Left arm
  } else {
    // Standard 64x64 or HD 128x128 skin scaled crisp to 64x64
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 64, 64);
  }
  return c.toDataURL('image/png');
}

export async function loadSkinFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(normalizeSkinImageTo64(img));
      img.onerror = () => reject(new Error('Tệp ảnh skin không hợp lệ (cần ảnh PNG chuẩn Minecraft 64×64 hoặc 64×32).'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh skin.'));
    reader.readAsDataURL(file);
  });
}

export async function loadSkinFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        resolve(normalizeSkinImageTo64(img));
      } catch {
        reject(new Error('Không thể đọc pixel từ URL skin do giới hạn CORS. Hãy dùng link GitHub Raw hoặc tải file PNG lên.'));
      }
    };
    img.onerror = () => reject(new Error('Không thể tải ảnh skin từ đường dẫn này.'));
    img.src = url.trim();
  });
}

export async function loadSkinFromMinecraftUsername(username: string): Promise<string> {
  const clean = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean) throw new Error('Vui lòng nhập tên người chơi Minecraft hợp lệ.');
  const candidates = [
    `https://minotar.net/skin/${encodeURIComponent(clean)}`,
    `https://mc-heads.net/skin/${encodeURIComponent(clean)}`,
  ];
  for (const url of candidates) {
    try {
      return await loadSkinFromUrl(url);
    } catch {
      // try next mirror
    }
  }
  throw new Error(`Không tìm thấy skin cho tài khoản "${clean}" (hoặc máy chủ skin đang chặn CORS). Bạn có thể tải trực tiếp tệp .png lên.`);
}

// --- Persistence ---
export function loadSavedSkinConfig(): PlayerSkinConfig {
  try {
    const raw = localStorage.getItem(SKIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerSkinConfig>;
      if (parsed.skinDataUrl && parsed.name) {
        return {
          id: parsed.id || 'custom_skin',
          name: parsed.name,
          source: parsed.source || 'upload',
          armModel: parsed.armModel === 'slim' ? 'slim' : 'classic',
          skinDataUrl: parsed.skinDataUrl,
          sourceRef: parsed.sourceRef,
          modelCode: { ...DEFAULT_MODEL_CODE, ...(parsed.modelCode || {}) },
        };
      }
    }
  } catch {
    // fallback to Steve
  }
  return getBuiltinSkins()[0];
}

export function saveSkinConfig(config: PlayerSkinConfig): void {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage quota ignored
  }
}

export function loadCustomSkinsLibrary(): PlayerSkinConfig[] {
  try {
    const raw = localStorage.getItem(SKIN_LIBRARY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCustomSkinToLibrary(skin: PlayerSkinConfig): PlayerSkinConfig[] {
  const list = loadCustomSkinsLibrary().filter((s) => s.id !== skin.id);
  const next = [skin, ...list].slice(0, 10);
  try {
    localStorage.setItem(SKIN_LIBRARY_KEY, JSON.stringify(next));
  } catch {
    // quota fallback
  }
  return next;
}

// ============================================================================
// EXACT MINECRAFT 64x64 UV-MAPPED 3D PLAYER MODEL + EXTERNAL GLB MODEL SUPPORT
// ============================================================================

// Maps Three.js BoxGeometry's 6 faces (+X, -X, +Y, -Y, +Z, -Z) to exact Minecraft 64x64 skin UV coordinates
function createMinecraftBoxGeometry(
  wPx: number,
  hPx: number,
  dPx: number,
  u: number,
  v: number,
  inflate = 0,
): THREE.BoxGeometry {
  const PX = 1 / 16; // 1 Minecraft pixel = 1/16 block (total player height = 30px = 1.875m, scaled to 1.80m)
  const geo = new THREE.BoxGeometry(
    wPx * PX + inflate * 2,
    hPx * PX + inflate * 2,
    dPx * PX + inflate * 2,
  );

  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  const setFaceUV = (faceIdx: number, px: number, py: number, pw: number, ph: number, flipX = false) => {
    const u0 = (px + 0.02) / 64;
    const u1 = (px + pw - 0.02) / 64;
    const vTop = 1 - (py + 0.02) / 64;
    const vBot = 1 - (py + ph - 0.02) / 64;
    const base = faceIdx * 4;
    const left = flipX ? u1 : u0;
    const right = flipX ? u0 : u1;
    // BoxGeometry vertex order per face: TL, TR, BL, BR
    uvAttr.setXY(base + 0, left, vTop);
    uvAttr.setXY(base + 1, right, vTop);
    uvAttr.setXY(base + 2, left, vBot);
    uvAttr.setXY(base + 3, right, vBot);
  };

  // Three.js BoxGeometry faces:
  // 0: +X (character's left side when facing +Z) -> Minecraft Left (u+d+w, v+d, d, h)
  // 1: -X (character's right side) -> Minecraft Right (u, v+d, d, h)
  // 2: +Y (top) -> Minecraft Top (u+d, v, w, d)
  // 3: -Y (bottom) -> Minecraft Bottom (u+d+w, v, w, d)
  // 4: +Z (front face) -> Minecraft Front (u+d, v+d, w, h)
  // 5: -Z (back face) -> Minecraft Back (u+d+w+d, v+d, w, h)
  setFaceUV(0, u + dPx + wPx, v + dPx, dPx, hPx);
  setFaceUV(1, u, v + dPx, dPx, hPx);
  setFaceUV(2, u + dPx, v, wPx, dPx);
  setFaceUV(3, u + dPx + wPx, v, wPx, dPx);
  setFaceUV(4, u + dPx, v + dPx, wPx, hPx);
  setFaceUV(5, u + dPx + wPx + dPx, v + dPx, wPx, hPx);

  uvAttr.needsUpdate = true;
  return geo;
}

export interface PlayerRig {
  root: THREE.Group;
  bodyRoot: THREE.Group;
  headPivot: THREE.Group;
  torsoGroup: THREE.Group;
  rightArmPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  capePivot: THREE.Group | null;
  heldSlotGroup: THREE.Group;
  armorMeshes: {
    helmet: THREE.Mesh;
    chest: THREE.Mesh;
    legs: THREE.Group;
    boots: THREE.Group;
  };
  externalGroup: THREE.Group;
  skinTexture: THREE.Texture;
  modelCode: PlayerModelCode;
  dispose: () => void;
}

function createSkinTexture(dataUrl: string): THREE.Texture {
  const tex = new THREE.Texture();
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;

  const img = new Image();
  img.onload = () => {
    tex.image = img;
    tex.needsUpdate = true;
  };
  img.src = dataUrl;
  return tex;
}

function getArmorHex(itemId?: string): number | null {
  if (!itemId) return null;
  if (itemId.startsWith('netherite_')) return 0x453e48;
  if (itemId.startsWith('diamond_')) return 0x3ce0e8;
  if (itemId.startsWith('gold_')) return 0xf5c531;
  if (itemId.startsWith('iron_')) return 0xd4d8dc;
  if (itemId.startsWith('chainmail_')) return 0x9ca3af;
  if (itemId.startsWith('leather_')) return 0x9c5a32;
  if (itemId.startsWith('turtle_')) return 0x4d9c46;
  if (itemId === 'elytra') return 0x8d8b9e;
  if (itemId === 'dragon_head') return 0x1f1b24;
  if (itemId.startsWith('wither_')) return 0x2c2b30;
  return null;
}

export function buildMinecraftPlayerRig(config: PlayerSkinConfig): PlayerRig {
  const code = { ...DEFAULT_MODEL_CODE, ...config.modelCode };
  const armW = config.armModel === 'slim' || code.armWidth <= 3 ? 3 : 4;
  const PX = 1 / 16;

  const root = new THREE.Group();
  const bodyRoot = new THREE.Group();
  // Minecraft player height is 32px = 2.0m raw -> scale to 0.92 * user scale = 1.84m exact Minecraft proportion
  const baseScale = 0.92 * THREE.MathUtils.clamp(code.scale, 0.5, 2.0);
  bodyRoot.scale.setScalar(baseScale);
  root.add(bodyRoot);

  const skinTexture = createSkinTexture(config.skinDataUrl);
  const baseMat = new THREE.MeshStandardMaterial({
    map: skinTexture,
    roughness: 0.85,
    metalness: 0.04,
  });
  const overlayMat = new THREE.MeshStandardMaterial({
    map: skinTexture,
    transparent: true,
    alphaTest: 0.45,
    roughness: 0.85,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const legLenScale = THREE.MathUtils.clamp(code.limbLength, 0.7, 1.4);
  const hipY = 12 * PX * legLenScale;

  // --- TORSO ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, hipY, 0);
  bodyRoot.add(torsoGroup);

  const torsoMesh = new THREE.Mesh(createMinecraftBoxGeometry(8, 12, 4, 16, 16), baseMat);
  torsoMesh.position.y = 6 * PX;
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  if (code.showOverlays) {
    const jacketMesh = new THREE.Mesh(createMinecraftBoxGeometry(8, 12, 4, 16, 32, 0.016), overlayMat);
    jacketMesh.position.y = 6 * PX;
    torsoGroup.add(jacketMesh);
  }

  // --- HEAD ---
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 12 * PX, 0);
  headPivot.scale.setScalar(THREE.MathUtils.clamp(code.headScale, 0.65, 1.6));
  torsoGroup.add(headPivot);

  const headMesh = new THREE.Mesh(createMinecraftBoxGeometry(8, 8, 8, 0, 0), baseMat);
  headMesh.position.y = 4 * PX;
  headMesh.castShadow = true;
  headPivot.add(headMesh);

  if (code.showOverlays) {
    const hatMesh = new THREE.Mesh(createMinecraftBoxGeometry(8, 8, 8, 32, 0, 0.028), overlayMat);
    hatMesh.position.y = 4 * PX;
    headPivot.add(hatMesh);
  }

  // --- ARMS (Right = -X, Left = +X in +Z facing space) ---
  const armOffsetX = (4 + armW / 2) * PX;

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(-armOffsetX, 10.5 * PX, 0);
  torsoGroup.add(rightArmPivot);

  const rightArmMesh = new THREE.Mesh(createMinecraftBoxGeometry(armW, 12, 4, 40, 16), baseMat);
  rightArmMesh.position.y = -4.5 * PX;
  rightArmMesh.castShadow = true;
  rightArmPivot.add(rightArmMesh);

  if (code.showOverlays) {
    const rSleeve = new THREE.Mesh(createMinecraftBoxGeometry(armW, 12, 4, 40, 32, 0.016), overlayMat);
    rSleeve.position.y = -4.5 * PX;
    rightArmPivot.add(rSleeve);
  }

  // Held item attachment on Right Hand
  const heldSlotGroup = new THREE.Group();
  heldSlotGroup.position.set(0, -10 * PX, 3 * PX);
  const heldBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x3ee0e8, roughness: 0.3, metalness: 0.6 }),
  );
  heldBox.name = 'playerHeldMesh';
  heldSlotGroup.add(heldBox);
  rightArmPivot.add(heldSlotGroup);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(armOffsetX, 10.5 * PX, 0);
  torsoGroup.add(leftArmPivot);

  const leftArmMesh = new THREE.Mesh(createMinecraftBoxGeometry(armW, 12, 4, 32, 48), baseMat);
  leftArmMesh.position.y = -4.5 * PX;
  leftArmMesh.castShadow = true;
  leftArmPivot.add(leftArmMesh);

  if (code.showOverlays) {
    const lSleeve = new THREE.Mesh(createMinecraftBoxGeometry(armW, 12, 4, 48, 48, 0.016), overlayMat);
    lSleeve.position.y = -4.5 * PX;
    leftArmPivot.add(lSleeve);
  }

  // --- LEGS ---
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-2 * PX, hipY, 0);
  rightLegPivot.scale.y = legLenScale;
  bodyRoot.add(rightLegPivot);

  const rightLegMesh = new THREE.Mesh(createMinecraftBoxGeometry(4, 12, 4, 0, 16), baseMat);
  rightLegMesh.position.y = -6 * PX;
  rightLegMesh.castShadow = true;
  rightLegPivot.add(rightLegMesh);

  if (code.showOverlays) {
    const rPants = new THREE.Mesh(createMinecraftBoxGeometry(4, 12, 4, 0, 32, 0.015), overlayMat);
    rPants.position.y = -6 * PX;
    rightLegPivot.add(rPants);
  }

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(2 * PX, hipY, 0);
  leftLegPivot.scale.y = legLenScale;
  bodyRoot.add(leftLegPivot);

  const leftLegMesh = new THREE.Mesh(createMinecraftBoxGeometry(4, 12, 4, 16, 48), baseMat);
  leftLegMesh.position.y = -6 * PX;
  leftLegMesh.castShadow = true;
  leftLegPivot.add(leftLegMesh);

  if (code.showOverlays) {
    const lPants = new THREE.Mesh(createMinecraftBoxGeometry(4, 12, 4, 0, 48, 0.015), overlayMat);
    lPants.position.y = -6 * PX;
    leftLegPivot.add(lPants);
  }

  // --- OPTIONAL 1.16 NETHER CAPE ---
  let capePivot: THREE.Group | null = null;
  if (code.showCape) {
    capePivot = new THREE.Group();
    capePivot.position.set(0, 11.5 * PX, -2.3 * PX);
    const capeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(code.capeColor || '#991b1b'),
      roughness: 0.72,
      metalness: 0.15,
    });
    const capeMesh = new THREE.Mesh(new THREE.BoxGeometry(10 * PX, 16 * PX, 0.8 * PX), capeMat);
    capeMesh.position.y = -8 * PX;
    // Gold emblem on cape
    const emblem = new THREE.Mesh(
      new THREE.BoxGeometry(4 * PX, 4 * PX, 1.0 * PX),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.7 }),
    );
    emblem.position.set(0, -5 * PX, 0);
    capePivot.add(capeMesh, emblem);
    torsoGroup.add(capePivot);
  }

  // --- EQUIPPED ARMOR VISUAL OVERLAYS ---
  const armorMat = () =>
    new THREE.MeshStandardMaterial({ color: 0x3ce0e8, roughness: 0.35, metalness: 0.65 });
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(8.9 * PX, 8.9 * PX, 8.9 * PX), armorMat());
  helmet.position.y = 4.1 * PX;
  helmet.visible = false;
  headPivot.add(helmet);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(8.8 * PX, 12.2 * PX, 4.9 * PX), armorMat());
  chest.position.y = 6 * PX;
  chest.visible = false;
  torsoGroup.add(chest);

  const legs = new THREE.Group();
  const rLegArm = new THREE.Mesh(new THREE.BoxGeometry(4.6 * PX, 7.5 * PX, 4.6 * PX), armorMat());
  rLegArm.position.y = -3.8 * PX;
  rightLegPivot.add(rLegArm);
  const lLegArm = new THREE.Mesh(new THREE.BoxGeometry(4.6 * PX, 7.5 * PX, 4.6 * PX), armorMat());
  lLegArm.position.y = -3.8 * PX;
  leftLegPivot.add(lLegArm);
  rLegArm.visible = false;
  lLegArm.visible = false;
  legs.userData = { parts: [rLegArm, lLegArm] };

  const boots = new THREE.Group();
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(4.8 * PX, 4.4 * PX, 4.8 * PX), armorMat());
  rBoot.position.y = -9.9 * PX;
  rightLegPivot.add(rBoot);
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(4.8 * PX, 4.4 * PX, 4.8 * PX), armorMat());
  lBoot.position.y = -9.9 * PX;
  leftLegPivot.add(lBoot);
  rBoot.visible = false;
  lBoot.visible = false;
  boots.userData = { parts: [rBoot, lBoot] };

  // --- EXTERNAL ONLINE 3D MODEL (.glb / .gltf) OVERRIDE ---
  const externalGroup = new THREE.Group();
  root.add(externalGroup);

  if (code.externalGlbUrl && code.externalGlbUrl.trim()) {
    const loader = new GLTFLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      code.externalGlbUrl.trim(),
      (gltf) => {
        const model = gltf.scene;
        // Auto-normalize bounding box height to ~1.8m then apply user externalScale
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const norm = size.y > 0.01 ? 1.8 / size.y : 1;
        const finalScale = norm * THREE.MathUtils.clamp(code.externalScale, 0.2, 5);
        model.scale.setScalar(finalScale);
        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y = -box2.min.y + code.externalYOffset;
        model.rotation.y = code.externalRotY;
        model.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });
        externalGroup.add(model);
        bodyRoot.visible = false; // Replace block character with loaded online 3D model!
      },
      undefined,
      () => {
        // Keep built-in Minecraft skin model visible if external URL fails
        bodyRoot.visible = true;
      },
    );
  }

  return {
    root,
    bodyRoot,
    headPivot,
    torsoGroup,
    rightArmPivot,
    leftArmPivot,
    rightLegPivot,
    leftLegPivot,
    capePivot,
    heldSlotGroup,
    armorMeshes: { helmet, chest, legs, boots },
    externalGroup,
    skinTexture,
    modelCode: code,
    dispose: () => {
      skinTexture.dispose();
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    },
  };
}

export function updateRigArmorVisuals(rig: PlayerRig, armor: (ItemStack | null)[]): void {
  const setMesh = (mesh: THREE.Mesh, hex: number | null) => {
    mesh.visible = hex !== null;
    if (hex !== null) (mesh.material as THREE.MeshStandardMaterial).color.setHex(hex);
  };
  setMesh(rig.armorMeshes.helmet, getArmorHex(armor[0]?.itemId));
  setMesh(rig.armorMeshes.chest, getArmorHex(armor[1]?.itemId));

  const legHex = getArmorHex(armor[2]?.itemId);
  for (const p of (rig.armorMeshes.legs.userData.parts as THREE.Mesh[]) || []) {
    setMesh(p, legHex);
  }
  const bootHex = getArmorHex(armor[3]?.itemId);
  for (const p of (rig.armorMeshes.boots.userData.parts as THREE.Mesh[]) || []) {
    setMesh(p, bootHex);
  }
}

export function animatePlayerRig(
  rig: PlayerRig,
  timeSec: number,
  opts: {
    walkPhase: number;
    moveSpeed: number;
    headPitch: number;
    sneaking: boolean;
    handSwing: number;
    flying: boolean;
  },
): void {
  const speedAmt = Math.min(1, opts.moveSpeed / 4.2);
  const swingMult = rig.modelCode.swingSpeed || 1;
  const legSwing = Math.sin(opts.walkPhase * 1.15 * swingMult) * 0.72 * speedAmt;
  const idleArm = Math.sin(timeSec * 2.1) * 0.04;
  const punchSwing = Math.sin(opts.handSwing * Math.PI) * 1.35;

  rig.headPivot.rotation.x = THREE.MathUtils.clamp(-opts.headPitch * 0.85, -0.85, 0.85);
  rig.rightLegPivot.rotation.x = legSwing;
  rig.leftLegPivot.rotation.x = -legSwing;

  rig.leftArmPivot.rotation.x = legSwing * 0.85;
  rig.leftArmPivot.rotation.z = 0.05 + idleArm;

  rig.rightArmPivot.rotation.x = -legSwing * 0.85 - punchSwing;
  rig.rightArmPivot.rotation.z = -0.05 - idleArm;

  // Sneaking crouch tilt
  rig.torsoGroup.rotation.x = opts.sneaking ? 0.32 : opts.flying ? 0.14 : 0;
  rig.torsoGroup.position.y = (opts.sneaking ? 10.6 : 12) * (1 / 16) * THREE.MathUtils.clamp(rig.modelCode.limbLength, 0.7, 1.4);

  if (rig.capePivot) {
    rig.capePivot.rotation.x = -0.14 - speedAmt * 0.55 - Math.sin(timeSec * 3.5) * 0.04;
  }
}

// ============================================================================
// AUTHENTIC 3D PIXEL-EXTRUDED MINECRAFT HELD ITEM GEOMETRY (16x16 / 32x32)
// Converts any 2D item icon (sword, pickaxe, axe, torch, food, etc.) into a
// chunky 3D voxel-extruded mesh with shaded pixel thickness, just like Minecraft!
// ============================================================================
export function buildExtrudedItemGeometry(
  source: HTMLImageElement | HTMLCanvasElement,
  maxRes = 32,
): THREE.BufferGeometry {
  const natW = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  const natH = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
  // Choose crisp native grid resolution (16 for 16x vanilla, 32 for Faithful 32x/HD+)
  const grid = natW >= 24 || natH >= 24 ? Math.min(maxRes, 32) : 16;

  const canvas = document.createElement('canvas');
  canvas.width = grid;
  canvas.height = grid;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, grid, grid);
  ctx.drawImage(source, 0, 0, grid, grid);
  const data = ctx.getImageData(0, 0, grid, grid).data;

  const opaque = new Uint8Array(grid * grid);
  for (let i = 0; i < grid * grid; i++) {
    if (data[i * 4 + 3] >= 96) opaque[i] = 1;
  }

  const pos: number[] = [];
  const norm: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const tmpColor = new THREE.Color();

  const step = 1 / grid;
  const halfDepth = 1 / 32; // Authentic Minecraft 1/16 block thickness (-1/32 .. +1/32)

  const pushQuad = (
    v0: [number, number, number],
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    nx: number,
    ny: number,
    nz: number,
    r: number,
    g: number,
    b: number,
    shade: number,
  ) => {
    const base = pos.length / 3;
    pos.push(
      v0[0], v0[1], v0[2],
      v1[0], v1[1], v1[2],
      v2[0], v2[1], v2[2],
      v3[0], v3[1], v3[2],
    );
    for (let k = 0; k < 4; k++) {
      norm.push(nx, ny, nz);
      col.push(r * shade, g * shade, b * shade);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  for (let py = 0; py < grid; py++) {
    for (let px = 0; px < grid; px++) {
      const pi = py * grid + px;
      if (!opaque[pi]) continue;

      const r8 = data[pi * 4];
      const g8 = data[pi * 4 + 1];
      const b8 = data[pi * 4 + 2];
      tmpColor.setRGB(r8 / 255, g8 / 255, b8 / 255, THREE.SRGBColorSpace);
      const r = tmpColor.r;
      const g = tmpColor.g;
      const b = tmpColor.b;

      const x0 = px * step - 0.5;
      const x1 = x0 + step;
      // py = 0 is top of image (+0.5 Y), py = grid-1 is bottom (-0.5 Y)
      const y1 = 0.5 - py * step;
      const y0 = y1 - step;
      const z0 = -halfDepth;
      const z1 = halfDepth;

      // Front face (+Z)
      pushQuad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1, r, g, b, 1.0);
      // Back face (-Z)
      pushQuad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0, 0, -1, r, g, b, 0.92);

      // Exposed perimeter side faces (gives genuine chunky 3D pixel edges!)
      if (px === 0 || !opaque[py * grid + (px - 1)]) {
        pushQuad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], -1, 0, 0, r, g, b, 0.84);
      }
      if (px === grid - 1 || !opaque[py * grid + (px + 1)]) {
        pushQuad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 1, 0, 0, r, g, b, 0.88);
      }
      if (py === 0 || !opaque[(py - 1) * grid + px]) {
        pushQuad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], 0, 1, 0, r, g, b, 1.04);
      }
      if (py === grid - 1 || !opaque[(py + 1) * grid + px]) {
        pushQuad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 0, -1, 0, r, g, b, 0.72);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

// Build authentic Minecraft First-Person Rig:
// 1. fpBareArm   — clean Steve/Alex/Custom bare right arm shown ONLY when hand is empty
// 2. fpHeldBlock — authentic 6-face 3D isometric cube shown when holding full blocks
// 3. fpHeldItem  — authentic 3D pixel-extruded voxel item mesh for swords, tools, torches, food
export function buildFirstPersonSkinArm(config: PlayerSkinConfig): {
  group: THREE.Group;
  skinTexture: THREE.Texture;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const armW = config.armModel === 'slim' || config.modelCode.armWidth <= 3 ? 3 : 4;
  const skinTexture = createSkinTexture(config.skinDataUrl);

  // 1. Bare Right Arm (authentic lower-right Minecraft angle)
  const armPivot = new THREE.Group();
  armPivot.name = 'fpBareArm';
  const armMat = new THREE.MeshStandardMaterial({
    map: skinTexture,
    roughness: 0.86,
    metalness: 0.02,
  });
  const armMesh = new THREE.Mesh(createMinecraftBoxGeometry(armW, 12, 4, 40, 16), armMat);
  armMesh.position.set(0.50, -0.44, -0.66);
  armMesh.rotation.set(-0.82, -0.42, 0.34);
  armMesh.scale.setScalar(0.88);

  if (config.modelCode.showOverlays) {
    const sleeveMat = new THREE.MeshStandardMaterial({
      map: skinTexture,
      transparent: true,
      alphaTest: 0.45,
      roughness: 0.86,
      side: THREE.DoubleSide,
    });
    const sleeve = new THREE.Mesh(createMinecraftBoxGeometry(armW, 12, 4, 40, 32, 0.016), sleeveMat);
    armMesh.add(sleeve);
  }
  armPivot.add(armMesh);
  group.add(armPivot);

  // 2. Held 3D Block (6 independent face materials: +X, -X, +Y, -Y, +Z, -Z)
  const blockMats = Array.from({ length: 6 }, () =>
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0.04,
    }),
  );
  const heldBlock = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), blockMats);
  heldBlock.name = 'fpHeldBlock';
  heldBlock.position.set(0.52, -0.38, -0.78);
  heldBlock.rotation.set(0.14, -Math.PI / 4, 0.02);
  heldBlock.visible = false;
  group.add(heldBlock);

  // 3. Held 3D Pixel-Extruded Item (geometry hot-swapped per item from cached voxel mesh!)
  const itemMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.56,
    metalness: 0.12,
  });
  const heldItem = new THREE.Mesh(new THREE.BufferGeometry(), itemMat);
  heldItem.name = 'fpHeldItem';
  heldItem.rotation.order = 'YXZ';
  heldItem.position.set(0.50, -0.28, -0.76);
  heldItem.rotation.set(0.02, -1.24, 1.12);
  heldItem.visible = false;
  group.add(heldItem);

  return {
    group,
    skinTexture,
    dispose: () => {
      skinTexture.dispose();
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          // Do not dispose shared cached extruded item geometries held by engine
          if (obj.name !== 'fpHeldItem') {
            obj.geometry.dispose();
          }
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    },
  };
}

