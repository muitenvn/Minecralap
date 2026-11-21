import * as THREE from 'three';
import { unzipSync } from 'fflate';
import { ALL_TEXTURE_KEYS, BLOCK_DEFS, ITEM_DEFS } from './blocks';
import { CachedResourcePack, PackManifest } from './types';
import { saveResourcePack } from './storage';
import { paintHd32BlockCanvas } from './hdTextures32';
import { paintOriginalBlockCanvas } from './vanillaTextures';

export interface AtlasUV {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface CompiledResourcePack {
  meta: {
    name: string;
    version: string;
    sourceLabel: string;
    sourceType: CachedResourcePack['sourceType'];
    downloadedAt: number;
    totalBytes: number;
    blockCount: number;
    guiCount: number;
    soundCount: number;
  };
  atlasTexture: THREE.CanvasTexture;
  atlasCanvas: HTMLCanvasElement;
  uvMap: Record<string, AtlasUV>;
  itemIcons: Record<string, string>; // itemId -> dataURL
  entityTextures: Record<string, THREE.Texture>; // mob entity key -> THREE.Texture
  soundBlobs: Record<string, Blob>; // relative sound path (without ext) -> audio Blob from Resource Pack
  soundsRootUrl?: string; // optional GitHub raw sounds root for custom GitHub packs
  guiUrls: {
    widgets: string;
    icons: string;
    optionsBackground: string;
    containerInventory: string;
    containerCrafting: string;
    containerFurnace: string;
    containerSmithing: string;
    recipeButton: string;
    mapBackground: string;
    mapIcons: string;
  };
  previewTiles: { key: string; url: string }[];
  dispose: () => void;
}

export interface DownloadProgress {
  phase: 'manifest' | 'blocks' | 'gui' | 'caching' | 'compiling';
  loadedFiles: number;
  totalFiles: number;
  loadedBytes: number;
  totalBytes: number;
  currentFile: string;
}

const DEFAULT_PACK_BASE = './packs/mc116-nether-pack';

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  return res.blob();
}

export async function buildHd32DefaultPack(
  baseGuiBlobs?: Record<string, Blob>,
): Promise<CachedResourcePack> {
  const guiBlobs: Record<string, Blob> = { ...(baseGuiBlobs || {}) };
  const guiKeys: ('widgets' | 'icons' | 'options_background')[] = [
    'widgets',
    'icons',
    'options_background',
  ];
  await Promise.all(
    guiKeys.map(async (g) => {
      if (guiBlobs[g]) return;
      try {
        guiBlobs[g] = await fetchBlob(`${DEFAULT_PACK_BASE}/assets/minecraft/textures/gui/${g}.png`);
      } catch {
        // Optional GUI fallback handled cleanly by CSS
      }
    }),
  );
  let totalBytes = 0;
  for (const b of Object.values(guiBlobs)) totalBytes += b.size;

  const record: CachedResourcePack = {
    id: 'active_pack',
    name: 'NetherCraft 1.16 HD (32×32)',
    version: '1.16.5-hd32',
    sourceLabel: 'Texture 32×32 HD Mặc Định (Faithful Style)',
    sourceType: 'hd-32',
    downloadedAt: Date.now(),
    totalBytes,
    blockBlobs: {},
    guiBlobs,
  };
  await saveResourcePack(record);
  return record;
}

export async function downloadDefaultGithubPack(
  onProgress?: (p: DownloadProgress) => void,
): Promise<CachedResourcePack> {
  onProgress?.({
    phase: 'manifest',
    loadedFiles: 0,
    totalFiles: 1,
    loadedBytes: 0,
    totalBytes: 0,
    currentFile: 'manifest.json',
  });

  const manifestRes = await fetch(`${DEFAULT_PACK_BASE}/manifest.json`, { cache: 'no-cache' });
  if (!manifestRes.ok) {
    throw new Error(`Không thể tải manifest gói tài nguyên 1.16 (HTTP ${manifestRes.status})`);
  }
  const manifest = (await manifestRes.json()) as PackManifest;

  const blockBlobs: Record<string, Blob> = {};
  const guiBlobs: Record<string, Blob> = {};
  let loadedFiles = 0;
  let loadedBytes = 0;

  // Fetch in small parallel batches of 6 so progress bar updates smoothly and reliably on mobile
  const BATCH = 6;
  for (let i = 0; i < manifest.files.length; i += BATCH) {
    const slice = manifest.files.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (f) => {
        const blob = await fetchBlob(`${DEFAULT_PACK_BASE}/${f.path}`);
        if (f.category === 'block') blockBlobs[f.key] = blob;
        else guiBlobs[f.key] = blob;
        loadedFiles++;
        loadedBytes += blob.size;
        onProgress?.({
          phase: f.category === 'block' ? 'blocks' : 'gui',
          loadedFiles,
          totalFiles: manifest.files.length,
          loadedBytes,
          totalBytes: manifest.totalBytes,
          currentFile: f.path.split('/').pop() || f.key,
        });
      }),
    );
  }

  onProgress?.({
    phase: 'caching',
    loadedFiles,
    totalFiles: manifest.files.length,
    loadedBytes,
    totalBytes: manifest.totalBytes,
    currentFile: 'IndexedDB',
  });

  const record: CachedResourcePack = {
    id: 'active_pack',
    name: manifest.name,
    version: manifest.version,
    sourceLabel: 'GitHub Pages Static Pack (./packs/mc116-nether-pack)',
    sourceType: 'github-default',
    downloadedAt: Date.now(),
    totalBytes: loadedBytes,
    blockBlobs,
    guiBlobs,
  };
  await saveResourcePack(record);
  return record;
}

function normalizeGithubTexturesRoot(rawUrl: string): string {
  let clean = rawUrl.trim().replace(/\/+$/, '');
  // Convert github.com/user/repo/tree/branch/... -> raw.githubusercontent.com/user/repo/branch/...
  const treeMatch = clean.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)(.*)$/);
  if (treeMatch) {
    clean = `https://raw.githubusercontent.com/${treeMatch[1]}/${treeMatch[2]}/${treeMatch[3]}${treeMatch[4]}`;
  }
  if (clean.endsWith('/block')) {
    clean = clean.slice(0, -6);
  }
  if (!clean.endsWith('/textures')) {
    if (clean.endsWith('/assets/minecraft')) clean += '/textures';
    else if (!clean.includes('/textures')) clean += '/assets/minecraft/textures';
  }
  return clean;
}

export async function downloadCustomGithubRawPack(
  rawUrl: string,
  basePack: CachedResourcePack | null,
  onProgress?: (p: DownloadProgress) => void,
): Promise<{ pack: CachedResourcePack; replacedBlocks: number; replacedGui: number; replacedSounds: number }> {
  // Always ensure base fallback exists so missing textures never turn purple/black
  const fallback = basePack ?? (await downloadDefaultGithubPack(onProgress));
  const texturesRoot = normalizeGithubTexturesRoot(rawUrl);
  const soundsRootUrl = texturesRoot.replace(/\/textures$/, '/sounds');

  const blockBlobs: Record<string, Blob> = { ...fallback.blockBlobs };
  const entityBlobs: Record<string, Blob> = { ...(fallback.entityBlobs || {}) };
  const guiBlobs: Record<string, Blob> = { ...fallback.guiBlobs };
  const soundBlobs: Record<string, Blob> = {};
  const keys = [...ALL_TEXTURE_KEYS];
  const entityTargets: [string, string][] = [
    ['pig', 'entity/pig/pig.png'],
    ['sheep', 'entity/sheep/sheep.png'],
    ['sheep_fur', 'entity/sheep/sheep_fur.png'],
    ['zombie', 'entity/zombie/zombie.png'],
    ['creeper', 'entity/creeper/creeper.png'],
    ['piglin', 'entity/piglin/piglin.png'],
    ['zombified_piglin', 'entity/piglin/zombified_piglin.png'],
    ['strider', 'entity/strider/strider.png'],
    ['ghast', 'entity/ghast/ghast.png'],
  ];
  const guiTargets: [string, string][] = [
    ['widgets', 'gui/widgets.png'],
    ['icons', 'gui/icons.png'],
    ['options_background', 'gui/options_background.png'],
    ['container_inventory', 'gui/container/inventory.png'],
    ['container_crafting', 'gui/container/crafting_table.png'],
    ['container_furnace', 'gui/container/furnace.png'],
    ['container_smithing', 'gui/container/smithing.png'],
    ['recipe_button', 'gui/recipe_button.png'],
    ['map_background', 'map/map_background.png'],
    ['map_icons', 'map/map_icons.png'],
  ];
  const totalFiles = keys.length + entityTargets.length + guiTargets.length;

  let loadedFiles = 0;
  let loadedBytes = 0;
  let replacedBlocks = 0;
  let replacedGui = 0;

  const BATCH = 8;
  for (let i = 0; i < keys.length; i += BATCH) {
    const slice = keys.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (key) => {
        try {
          const blob = await fetchBlob(`${texturesRoot}/block/${key}.png`);
          if (blob.size > 40) {
            blockBlobs[key] = blob;
            replacedBlocks++;
            loadedBytes += blob.size;
          }
        } catch {
          // fallback retained
        } finally {
          loadedFiles++;
          onProgress?.({
            phase: 'blocks',
            loadedFiles,
            totalFiles,
            loadedBytes,
            totalBytes: Math.max(loadedBytes, fallback.totalBytes),
            currentFile: `${key}.png`,
          });
        }
      }),
    );
  }

  for (const [eKey, relPath] of entityTargets) {
    try {
      const blob = await fetchBlob(`${texturesRoot}/${relPath}`);
      if (blob.size > 40) {
        entityBlobs[eKey] = blob;
        loadedBytes += blob.size;
      }
    } catch {
      // fallback retained
    } finally {
      loadedFiles++;
      onProgress?.({
        phase: 'blocks',
        loadedFiles,
        totalFiles,
        loadedBytes,
        totalBytes: Math.max(loadedBytes, fallback.totalBytes),
        currentFile: relPath,
      });
    }
  }

  for (const [gKey, relPath] of guiTargets) {
    try {
      const blob = await fetchBlob(`${texturesRoot}/${relPath}`);
      if (blob.size > 40) {
        guiBlobs[gKey] = blob;
        replacedGui++;
        loadedBytes += blob.size;
      }
    } catch {
      // fallback retained
    } finally {
      loadedFiles++;
      onProgress?.({
        phase: 'gui',
        loadedFiles,
        totalFiles,
        loadedBytes,
        totalBytes: Math.max(loadedBytes, fallback.totalBytes),
        currentFile: relPath,
      });
    }
  }

  // Probe core sounds from the GitHub Resource Pack if it ships assets/minecraft/sounds/
  const soundProbePaths = [
    'random/click_stereo',
    'random/click',
    'dig/stone1',
    'dig/wood1',
    'dig/grass1',
    'damage/hit1',
    'random/orb',
    'random/explode1',
  ];
  let replacedSounds = 0;
  await Promise.all(
    soundProbePaths.map(async (sp) => {
      try {
        const blob = await fetchBlob(`${soundsRootUrl}/${sp}.ogg`);
        if (blob.size > 64) {
          soundBlobs[sp] = blob;
          replacedSounds++;
          loadedBytes += blob.size;
        }
      } catch {
        // Pack does not override this sound — official Vanilla Minecraft GitHub sound will be used
      }
    }),
  );

  if (replacedBlocks === 0 && replacedGui === 0 && replacedSounds === 0) {
    throw new Error(
      'Không tìm thấy tệp ảnh .png hay âm thanh .ogg hợp lệ tại URL GitHub này (kiểm tra lại nhánh main/master hoặc cấu trúc assets/minecraft/).',
    );
  }

  const record: CachedResourcePack = {
    id: 'active_pack',
    name: `GitHub Pack (${replacedBlocks} block · ${replacedGui} UI${replacedSounds > 0 ? ` · ${replacedSounds}+ âm thanh` : ''})`,
    version: '26.3 Custom',
    sourceLabel: texturesRoot,
    sourceType: 'github-raw',
    sourceUrl: rawUrl.trim(),
    downloadedAt: Date.now(),
    totalBytes: loadedBytes + fallback.totalBytes,
    blockBlobs,
    itemBlobs: fallback.itemBlobs,
    entityBlobs,
    guiBlobs,
    soundBlobs,
    soundsRootUrl: replacedSounds > 0 ? soundsRootUrl : undefined,
  };
  await saveResourcePack(record);
  return { pack: record, replacedBlocks, replacedGui, replacedSounds };
}

export async function importZipResourcePack(
  file: File,
  basePack: CachedResourcePack | null,
  onProgress?: (p: DownloadProgress) => void,
): Promise<{ pack: CachedResourcePack; replacedBlocks: number; replacedGui: number; replacedSounds: number }> {
  const fallback = basePack ?? (await downloadDefaultGithubPack(onProgress));
  onProgress?.({
    phase: 'blocks',
    loadedFiles: 0,
    totalFiles: 1,
    loadedBytes: 0,
    totalBytes: file.size,
    currentFile: file.name,
  });

  const buf = new Uint8Array(await file.arrayBuffer());
  const unzipped = unzipSync(buf);
  const blockBlobs: Record<string, Blob> = { ...fallback.blockBlobs };
  const itemBlobs: Record<string, Blob> = { ...(fallback.itemBlobs || {}) };
  const entityBlobs: Record<string, Blob> = { ...(fallback.entityBlobs || {}) };
  const guiBlobs: Record<string, Blob> = { ...fallback.guiBlobs };
  // Start fresh for soundBlobs so image-only packs cleanly fall back to official Vanilla Minecraft GitHub sounds
  const soundBlobs: Record<string, Blob> = {};
  const keySet = new Set(ALL_TEXTURE_KEYS);
  const zipItemAlias: Record<string, string> = {
    golden_helmet: 'gold_helmet',
    golden_chestplate: 'gold_chestplate',
    golden_leggings: 'gold_leggings',
    golden_boots: 'gold_boots',
    porkchop: 'raw_porkchop',
    beef: 'raw_beef',
    cooked_beef: 'steak',
    chicken: 'raw_chicken',
    mutton: 'raw_mutton',
    rabbit: 'raw_rabbit',
    cod: 'raw_cod',
    salmon: 'raw_salmon',
    clock_00: 'clock',
    compass_00: 'compass',
    crossbow_standby: 'crossbow',
    ender_eye: 'eye_of_ender',
  };

  let replacedBlocks = 0;
  let replacedItems = 0;
  let replacedEntities = 0;
  let replacedGui = 0;
  let replacedSounds = 0;
  let loadedBytes = 0;

  const zipEntityPaths: Record<string, string> = {
    'pig/pig': 'pig',
    'sheep/sheep': 'sheep',
    'sheep/sheep_fur': 'sheep_fur',
    'zombie/zombie': 'zombie',
    'creeper/creeper': 'creeper',
    'piglin/piglin': 'piglin',
    'piglin/zombified_piglin': 'zombified_piglin',
    'strider/strider': 'strider',
    'ghast/ghast': 'ghast',
  };

  for (const [entryPath, data] of Object.entries(unzipped)) {
    const lower = entryPath.toLowerCase().replace(/\\/g, '/');
    if (data.byteLength < 40) continue;

    // Match Resource Pack audio files (assets/minecraft/sounds/**/*.ogg|wav|mp3 or sounds/**/*.ogg|wav|mp3)
    const soundMatch = lower.match(/(?:^|\/)sounds\/(.+)\.(ogg|wav|mp3)$/);
    if (soundMatch) {
      const relSoundKey = soundMatch[1];
      const ext = soundMatch[2];
      const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/ogg';
      soundBlobs[relSoundKey] = new Blob([data], { type: mime });
      replacedSounds++;
      loadedBytes += data.byteLength;
      continue;
    }

    if (!lower.endsWith('.png')) continue;

    // Match block textures (both 1.16 "block/" and legacy "blocks/")
    const blockMatch = lower.match(/(?:textures\/blocks?\/)([^/]+)\.png$/);
    if (blockMatch && keySet.has(blockMatch[1])) {
      blockBlobs[blockMatch[1]] = new Blob([data], { type: 'image/png' });
      replacedBlocks++;
      loadedBytes += data.byteLength;
      continue;
    }

    // Match item textures (both 1.16 "item/" and legacy "items/")
    const itemMatch = lower.match(/(?:textures\/items?\/)([^/]+)\.png$/);
    if (itemMatch) {
      const rawName = itemMatch[1];
      const mappedId = ITEM_DEFS[rawName] ? rawName : zipItemAlias[rawName];
      if (mappedId && ITEM_DEFS[mappedId]) {
        itemBlobs[mappedId] = new Blob([data], { type: 'image/png' });
        replacedItems++;
        loadedBytes += data.byteLength;
        continue;
      }
    }

    // Match mob entity textures (textures/entity/<folder>/<name>.png)
    const entityMatch = lower.match(/(?:textures\/entity\/)([^/]+\/[^/]+)\.png$/);
    if (entityMatch && zipEntityPaths[entityMatch[1]]) {
      entityBlobs[zipEntityPaths[entityMatch[1]]] = new Blob([data], { type: 'image/png' });
      replacedEntities++;
      loadedBytes += data.byteLength;
      continue;
    }

    // Match GUI, Container & Map textures (exclude realms/ textures so realms/gui/icons.png never overwrites minecraft/gui/icons.png!)
    const guiMatch = !lower.includes('realms/')
      ? lower.match(/(?:textures\/gui\/)(widgets|icons|options_background|recipe_button)\.png$/)
      : null;
    if (guiMatch) {
      guiBlobs[guiMatch[1]] = new Blob([data], { type: 'image/png' });
      replacedGui++;
      loadedBytes += data.byteLength;
      continue;
    }

    const containerMatch = lower.match(
      /(?:textures\/gui\/container\/)(inventory|crafting_table|furnace|smithing)\.png$/,
    );
    if (containerMatch) {
      const mapKey =
        containerMatch[1] === 'crafting_table'
          ? 'container_crafting'
          : `container_${containerMatch[1]}`;
      guiBlobs[mapKey] = new Blob([data], { type: 'image/png' });
      replacedGui++;
      loadedBytes += data.byteLength;
      continue;
    }

    const mapMatch = lower.match(/(?:textures\/map\/)(map_background|map_icons)\.png$/);
    if (mapMatch) {
      guiBlobs[mapMatch[1]] = new Blob([data], { type: 'image/png' });
      replacedGui++;
      loadedBytes += data.byteLength;
    }
  }

  if (
    replacedBlocks === 0 &&
    replacedItems === 0 &&
    replacedEntities === 0 &&
    replacedGui === 0 &&
    replacedSounds === 0
  ) {
    throw new Error(
      'File .zip không chứa thư mục textures/ hoặc sounds/ chuẩn Minecraft Resource Pack.',
    );
  }

  const record: CachedResourcePack = {
    id: 'active_pack',
    name: file.name.replace(/\.zip$/i, ''),
    version: '26.3 ZIP',
    sourceLabel: `Gói ZIP (${replacedBlocks} block · ${replacedItems} vật phẩm · ${replacedEntities} mob · ${replacedGui} UI${
      replacedSounds > 0 ? ` · ${replacedSounds} âm thanh` : ' · âm thanh MC gốc'
    })`,
    sourceType: 'zip-upload',
    downloadedAt: Date.now(),
    totalBytes: loadedBytes || file.size,
    blockBlobs,
    itemBlobs,
    entityBlobs,
    guiBlobs,
    soundBlobs,
  };
  await saveResourcePack(record);
  return { pack: record, replacedBlocks, replacedGui, replacedSounds };
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function drawToolIconDataUrl(shape: string, color: string, accent: string): string {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const p = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  const stick = '#8b5e34';

  if (shape === 'pickaxe') {
    for (let i = 0; i < 9; i++) p(3 + i, 12 - i, 2, 2, stick);
    p(4, 2, 8, 2, color);
    p(11, 3, 2, 2, color);
    p(12, 5, 2, 6, color);
    p(5, 2, 5, 1, accent);
    p(12, 4, 1, 4, accent);
  } else if (shape === 'sword') {
    p(2, 12, 2, 2, stick);
    p(4, 10, 2, 2, stick);
    p(3, 8, 5, 2, '#5c4028');
    p(6, 11, 2, 2, '#5c4028');
    for (let i = 0; i < 7; i++) {
      p(6 + i, 8 - i, 2, 2, color);
      p(7 + i, 8 - i, 1, 1, accent);
    }
  } else if (shape === 'axe') {
    for (let i = 0; i < 9; i++) p(3 + i, 12 - i, 2, 2, stick);
    p(6, 2, 6, 4, color);
    p(9, 6, 4, 3, color);
    p(7, 3, 4, 2, accent);
  } else if (shape === 'shovel') {
    for (let i = 0; i < 8; i++) p(3 + i, 12 - i, 2, 2, stick);
    p(9, 2, 5, 5, color);
    p(10, 3, 3, 2, accent);
  } else if (shape === 'ingot') {
    p(2, 6, 12, 6, color);
    p(4, 4, 8, 2, accent);
    p(3, 6, 10, 2, accent);
    p(2, 11, 12, 1, '#1f1f24');
  } else if (shape === 'gem') {
    p(5, 2, 6, 12, color);
    p(3, 4, 10, 8, color);
    p(5, 4, 4, 4, accent);
  } else if (shape === 'stick') {
    for (let i = 0; i < 10; i++) p(3 + i, 12 - i, 2, 2, i % 2 === 0 ? color : accent);
  } else if (shape === 'flint_steel') {
    p(3, 4, 4, 7, color);
    p(5, 3, 6, 2, color);
    p(9, 5, 3, 5, '#3f3f46');
    p(11, 4, 2, 2, accent);
  } else if (shape === 'food') {
    p(3, 4, 10, 8, color);
    p(5, 3, 6, 10, color);
    p(5, 5, 4, 3, accent);
  } else if (shape === 'helmet') {
    p(3, 4, 10, 8, color);
    p(5, 9, 6, 3, '#1f1f24');
    p(4, 5, 8, 2, accent);
  } else if (shape === 'chestplate') {
    p(2, 3, 12, 11, color);
    p(6, 3, 4, 3, '#1f1f24');
    p(4, 6, 8, 3, accent);
  } else if (shape === 'leggings') {
    p(3, 2, 10, 5, color);
    p(3, 7, 4, 7, color);
    p(9, 7, 4, 7, color);
    p(4, 3, 8, 2, accent);
  } else if (shape === 'boots') {
    p(2, 6, 5, 7, color);
    p(9, 6, 5, 7, color);
    p(2, 11, 5, 2, accent);
    p(9, 11, 5, 2, accent);
  } else if (shape === 'hoe') {
    for (let i = 0; i < 9; i++) p(3 + i, 12 - i, 2, 2, stick);
    p(6, 2, 7, 2, color);
    p(11, 4, 2, 2, color);
    p(7, 2, 5, 1, accent);
  } else if (shape === 'bucket' || shape === 'bucket_water' || shape === 'bucket_lava') {
    p(3, 4, 10, 2, '#71717a');
    p(3, 6, 10, 7, color);
    p(5, 12, 6, 2, color);
    p(4, 6, 2, 6, accent);
    if (shape === 'bucket_water') p(4, 4, 8, 3, '#3b82f6');
    if (shape === 'bucket_lava') p(4, 4, 8, 3, '#f97316');
  } else if (shape === 'bow') {
    p(4, 2, 3, 2, color);
    p(2, 4, 2, 8, color);
    p(4, 12, 3, 2, color);
    p(7, 3, 1, 10, accent);
  } else if (shape === 'arrow') {
    for (let i = 0; i < 8; i++) p(4 + i, 11 - i, 2, 2, stick);
    p(10, 2, 4, 4, color);
    p(2, 11, 3, 3, accent);
  } else if (shape === 'shield') {
    p(3, 2, 10, 12, accent);
    p(4, 3, 8, 10, color);
    p(7, 4, 2, 8, '#6b4d28');
  } else if (shape === 'shears') {
    p(2, 9, 4, 4, accent);
    p(9, 9, 4, 4, accent);
    p(4, 4, 3, 6, color);
    p(8, 4, 3, 6, color);
  } else if (shape === 'book') {
    p(3, 2, 10, 12, color);
    p(5, 3, 7, 10, accent);
    p(3, 2, 2, 12, '#4a2b14');
  } else if (shape === 'paper') {
    p(3, 2, 10, 12, color);
    p(5, 5, 6, 1, '#a1a1aa');
    p(5, 8, 6, 1, '#a1a1aa');
    p(5, 11, 4, 1, '#a1a1aa');
  } else if (shape === 'bone') {
    p(3, 3, 3, 3, color);
    p(10, 10, 3, 3, color);
    for (let i = 0; i < 7; i++) p(5 + i, 5 + i, 2, 2, accent);
  } else if (shape === 'string') {
    p(4, 3, 8, 2, color);
    p(3, 5, 2, 6, accent);
    p(5, 11, 7, 2, color);
    p(10, 5, 2, 5, accent);
  } else if (shape === 'totem') {
    p(5, 2, 6, 5, color);
    p(2, 6, 12, 3, color);
    p(5, 7, 6, 7, color);
    p(6, 4, 1, 1, accent);
    p(9, 4, 1, 1, accent);
  } else if (shape === 'rod') {
    for (let i = 0; i < 10; i++) p(3 + i, 12 - i, 2, 2, i % 2 === 0 ? color : accent);
  } else if (shape === 'apple') {
    p(7, 2, 2, 3, '#6b4226');
    p(4, 5, 8, 8, color);
    p(5, 4, 6, 10, color);
    p(5, 6, 2, 2, accent);
  } else if (shape === 'bread') {
    p(2, 6, 12, 6, color);
    p(4, 5, 8, 7, color);
    p(4, 6, 3, 2, accent);
    p(9, 6, 3, 2, accent);
  } else if (shape === 'pearl') {
    p(5, 3, 6, 10, color);
    p(3, 5, 10, 6, color);
    p(5, 5, 3, 3, accent);
  } else if (shape === 'feather') {
    for (let i = 0; i < 9; i++) p(3 + i, 12 - i, 3, 2, i < 3 ? '#a1a1aa' : color);
    p(8, 3, 4, 4, accent);
  } else if (shape === 'potion') {
    // Glass bottle neck & cork
    p(6, 2, 4, 2, '#9c6b3b');
    p(6, 4, 4, 2, '#cbd5e1');
    // Glass flask outline
    p(4, 6, 8, 8, '#e2e8f0');
    p(3, 7, 10, 6, '#e2e8f0');
    // Glowing liquid inside
    p(5, 7, 6, 6, color);
    p(4, 8, 8, 4, color);
    p(5, 8, 2, 2, accent);
  } else if (shape === 'elytra') {
    p(6, 3, 4, 2, accent);
    p(2, 4, 5, 9, color);
    p(9, 4, 5, 9, color);
    p(3, 5, 3, 6, accent);
    p(10, 5, 3, 6, accent);
  } else if (shape === 'trident') {
    for (let i = 0; i < 9; i++) p(3 + i, 12 - i, 2, 2, color);
    p(9, 2, 2, 5, accent);
    p(12, 3, 2, 4, accent);
    p(10, 5, 5, 2, accent);
  } else if (shape === 'compass') {
    p(4, 2, 8, 12, color);
    p(2, 4, 12, 8, color);
    p(4, 4, 8, 8, '#1e293b');
    p(7, 4, 2, 5, accent);
    p(7, 9, 2, 3, '#cbd5e1');
  } else if (shape === 'clock') {
    p(4, 2, 8, 12, color);
    p(2, 4, 12, 8, color);
    p(4, 4, 8, 8, '#1d4ed8');
    p(4, 4, 8, 4, '#38bdf8');
    p(7, 4, 2, 2, accent);
  } else if (shape === 'bowl') {
    p(2, 7, 12, 4, color);
    p(4, 11, 8, 2, '#5c3b1e');
    p(4, 7, 8, 2, accent);
  } else if (shape === 'boat') {
    p(2, 7, 12, 5, color);
    p(4, 12, 8, 2, '#5c3b1e');
    p(4, 8, 8, 2, accent);
    p(6, 4, 4, 3, color);
  } else if (shape === 'banner') {
    p(7, 11, 2, 4, '#8d6438');
    p(4, 2, 8, 10, color);
    p(5, 4, 6, 4, accent);
  } else if (shape === 'disc') {
    p(4, 3, 8, 10, color);
    p(3, 4, 10, 8, color);
    p(6, 6, 4, 4, accent);
    p(7, 7, 2, 2, '#111827');
  } else {
    p(4, 4, 8, 8, color);
    p(5, 5, 4, 4, accent);
  }
  return c.toDataURL('image/png');
}

export async function compileResourcePack(
  cached: CachedResourcePack,
  maxAnisotropy = 4,
): Promise<CompiledResourcePack> {
  const keys = ALL_TEXTURE_KEYS;
  // Crisp 32x32 HD tile atlas (1024x1024 RGBA = 4MB VRAM, 4x sharper than 16x16)
  const TILE = 32;
  const cols = Math.ceil(Math.sqrt(keys.length));
  const atlasDim = Math.pow(2, Math.ceil(Math.log2(cols * TILE)));
  const tilesPerRow = atlasDim / TILE;
  const useHd32Only = cached.sourceType === 'hd-32';
  const useHd32Fallback = cached.sourceType === 'hd-32' || cached.sourceType === 'faithful-32x';

  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = atlasDim;
  atlasCanvas.height = atlasDim;
  const ctx = atlasCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, atlasDim, atlasDim);

  const uvMap: Record<string, AtlasUV> = {};
  const tileImages: Record<string, HTMLImageElement | HTMLCanvasElement> = {};
  const previewTiles: { key: string; url: string }[] = [];

  // Deduplicate blob decoding when multiple keys share the same Blob instance (e.g. planks/stairs/slabs)
  const decodedBlobCache = new Map<Blob, Promise<HTMLImageElement>>();
  const decodeSharedBlob = (blob: Blob): Promise<HTMLImageElement> => {
    let p = decodedBlobCache.get(blob);
    if (!p) {
      p = blobToImage(blob);
      decodedBlobCache.set(blob, p);
    }
    return p;
  };

  await Promise.all(
    keys.map(async (key, idx) => {
      const col = idx % tilesPerRow;
      const row = Math.floor(idx / tilesPerRow);
      const px = col * TILE;
      const py = row * TILE;
      const blob = useHd32Only ? undefined : cached.blockBlobs[key];
      let drawn = false;
      if (blob) {
        try {
          const img = await decodeSharedBlob(blob);
          tileImages[key] = img;
          const srcSize = Math.min(img.width, img.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, srcSize, srcSize, px, py, TILE, TILE);
          drawn = true;
        } catch {
          drawn = false;
        }
      }
      if (!drawn) {
        const fallbackCanvas = useHd32Fallback
          ? paintHd32BlockCanvas(key)
          : paintOriginalBlockCanvas(key);
        tileImages[key] = fallbackCanvas;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          fallbackCanvas,
          0,
          0,
          fallbackCanvas.width,
          fallbackCanvas.height,
          px,
          py,
          TILE,
          TILE,
        );
      }
      const eps = 0.0005;
      uvMap[key] = {
        u0: px / atlasDim + eps,
        u1: (px + TILE) / atlasDim - eps,
        v0: 1 - (py + TILE) / atlasDim + eps,
        v1: 1 - py / atlasDim - eps,
      };
    }),
  );

  // Decode all real item PNG textures in parallel (Faithful 32x / Official 1.16.5 / Custom ZIP)
  const decodedItemImages: Record<string, HTMLImageElement> = {};
  if (cached.itemBlobs) {
    await Promise.all(
      Object.entries(cached.itemBlobs).map(async ([itemId, blob]) => {
        try {
          decodedItemImages[itemId] = await decodeSharedBlob(blob);
        } catch {
          // fallback icon will be used
        }
      }),
    );
  }

  // Build crisp 32x32 2D item icon cache for Inventory / Hotbar / Crafting / Held Hand
  const itemIcons: Record<string, string> = {};
  const iconCanvas = document.createElement('canvas');
  iconCanvas.width = 32;
  iconCanvas.height = 32;
  const iconCtx = iconCanvas.getContext('2d')!;
  iconCtx.imageSmoothingEnabled = false;

  for (const item of Object.values(ITEM_DEFS)) {
    const realItemImg = decodedItemImages[item.id];
    if (realItemImg) {
      iconCtx.clearRect(0, 0, 32, 32);
      iconCtx.imageSmoothingEnabled = false;
      const s = Math.min(realItemImg.width, realItemImg.height);
      iconCtx.drawImage(realItemImg, 0, 0, s, s, 0, 0, 32, 32);
      itemIcons[item.id] = iconCanvas.toDataURL('image/png');
      continue;
    }
    if (item.blockId !== undefined) {
      const bdef = BLOCK_DEFS[item.blockId];
      const topImg = tileImages[bdef.textures.top];
      const sideImg = tileImages[bdef.textures.front || bdef.textures.side];
      iconCtx.clearRect(0, 0, 32, 32);
      if (
        bdef.key === 'torch' ||
        bdef.key === 'soul_torch' ||
        bdef.key === 'redstone_torch' ||
        bdef.key === 'soul_lantern' ||
        bdef.key === 'lantern' ||
        bdef.key === 'ladder' ||
        bdef.key.includes('rail') ||
        bdef.key === 'chain' ||
        bdef.key === 'end_rod' ||
        bdef.key === 'lever' ||
        bdef.key === 'tripwire_hook' ||
        bdef.key === 'flower_pot' ||
        bdef.key === 'vine' ||
        bdef.key === 'sugar_cane' ||
        bdef.key === 'bamboo' ||
        bdef.key === 'cobweb' ||
        bdef.key === 'brewing_stand' ||
        bdef.key === 'bell' ||
        bdef.key.includes('_door') ||
        bdef.key.includes('bars') ||
        bdef.key === 'glass_pane' ||
        bdef.key === 'lily_pad' ||
        bdef.key.endsWith('_sapling') ||
        bdef.key.endsWith('_roots') ||
        bdef.key.endsWith('_vines') ||
        bdef.key === 'nether_sprouts' ||
        bdef.key === 'sea_pickle' ||
        bdef.key === 'turtle_egg'
      ) {
        if (sideImg) {
          const s = Math.min(sideImg.width, sideImg.height);
          iconCtx.drawImage(sideImg, 0, 0, s, s, 4, 4, 24, 24);
        }
      } else if (topImg && sideImg) {
        // Crisp isometric 3-face mini voxel icon
        const sTop = Math.min(topImg.width, topImg.height);
        const sSide = Math.min(sideImg.width, sideImg.height);
        // Top diamond
        iconCtx.save();
        iconCtx.transform(0.86, 0.43, -0.86, 0.43, 16, 2);
        iconCtx.drawImage(topImg, 0, 0, sTop, sTop, 0, 0, 14, 14);
        iconCtx.restore();
        // Left face
        iconCtx.save();
        iconCtx.transform(0.86, 0.43, 0, 1.0, 4, 8);
        iconCtx.drawImage(sideImg, 0, 0, sSide, sSide, 0, 0, 14, 15);
        iconCtx.fillStyle = 'rgba(0,0,0,0.16)';
        iconCtx.fillRect(0, 0, 14, 15);
        iconCtx.restore();
        // Right face
        iconCtx.save();
        iconCtx.transform(0.86, -0.43, 0, 1.0, 16, 14);
        iconCtx.drawImage(sideImg, 0, 0, sSide, sSide, 0, 0, 14, 15);
        iconCtx.fillStyle = 'rgba(0,0,0,0.34)';
        iconCtx.fillRect(0, 0, 14, 15);
        iconCtx.restore();
      }
      itemIcons[item.id] = iconCanvas.toDataURL('image/png');
    } else if (item.iconShape) {
      itemIcons[item.id] = drawToolIconDataUrl(
        item.iconShape,
        item.iconColor || '#d4d8dc',
        item.iconAccent || '#ffffff',
      );
    }
  }

  // Build preview strip of iconic 1.16 blocks
  const previewKeys = [
    'grass_block_side',
    'obsidian',
    'crying_obsidian',
    'netherrack',
    'crimson_nylium_side',
    'warped_nylium_side',
    'ancient_debris_side',
    'netherite_block',
    'shroomlight',
    'gilded_blackstone',
    'soul_sand',
    'respawn_anchor_side',
  ];
  for (const pk of previewKeys) {
    const img = tileImages[pk];
    if (img) {
      const pc = document.createElement('canvas');
      pc.width = 32;
      pc.height = 32;
      const pctx = pc.getContext('2d')!;
      pctx.imageSmoothingEnabled = false;
      const s = Math.min(img.width, img.height);
      pctx.drawImage(img, 0, 0, s, s, 0, 0, 32, 32);
      previewTiles.push({ key: pk, url: pc.toDataURL('image/png') });
    }
  }

  const mkUrl = (blob?: Blob) => (blob ? URL.createObjectURL(blob) : '');
  const widgetsUrl = mkUrl(cached.guiBlobs.widgets);
  const iconsUrl = mkUrl(cached.guiBlobs.icons);
  const optionsBackgroundUrl = mkUrl(cached.guiBlobs.options_background);
  const containerInventoryUrl = mkUrl(cached.guiBlobs.container_inventory);
  const containerCraftingUrl = mkUrl(cached.guiBlobs.container_crafting);
  const containerFurnaceUrl = mkUrl(cached.guiBlobs.container_furnace);
  const containerSmithingUrl = mkUrl(cached.guiBlobs.container_smithing);
  const recipeButtonUrl = mkUrl(cached.guiBlobs.recipe_button);
  const mapBackgroundUrl = mkUrl(cached.guiBlobs.map_background);
  const mapIconsUrl = mkUrl(cached.guiBlobs.map_icons);

  const allGuiUrls = [
    widgetsUrl,
    iconsUrl,
    optionsBackgroundUrl,
    containerInventoryUrl,
    containerCraftingUrl,
    containerFurnaceUrl,
    containerSmithingUrl,
    recipeButtonUrl,
    mapBackgroundUrl,
    mapIconsUrl,
  ];

  // Decode all real 3D Mob Entity PNG textures into crisp NearestFilter SRGB THREE.Textures
  const entityTextures: Record<string, THREE.Texture> = {};
  if (cached.entityBlobs) {
    await Promise.all(
      Object.entries(cached.entityBlobs).map(async ([eKey, blob]) => {
        try {
          const img = await decodeSharedBlob(blob);
          const tex = new THREE.Texture(img);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          tex.generateMipmaps = false;
          tex.needsUpdate = true;
          entityTextures[eKey] = tex;
        } catch {
          // fallback procedural mob colors
        }
      }),
    );
  }

  const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.magFilter = THREE.NearestFilter;
  atlasTexture.minFilter = THREE.NearestFilter;
  atlasTexture.generateMipmaps = false;
  atlasTexture.anisotropy = Math.min(maxAnisotropy, 4);
  atlasTexture.needsUpdate = true;

  return {
    meta: {
      name: cached.name,
      version: cached.version,
      sourceLabel: cached.sourceLabel,
      sourceType: cached.sourceType,
      downloadedAt: cached.downloadedAt,
      totalBytes: cached.totalBytes,
      blockCount: useHd32Only ? keys.length : Math.max(Object.keys(cached.blockBlobs).length, keys.length),
      guiCount: Object.keys(cached.guiBlobs).length,
      soundCount: Object.keys(cached.soundBlobs || {}).length,
    },
    atlasTexture,
    atlasCanvas,
    uvMap,
    itemIcons,
    entityTextures,
    soundBlobs: cached.soundBlobs || {},
    soundsRootUrl: cached.soundsRootUrl,
    guiUrls: {
      widgets: widgetsUrl,
      icons: iconsUrl,
      optionsBackground: optionsBackgroundUrl,
      containerInventory: containerInventoryUrl,
      containerCrafting: containerCraftingUrl,
      containerFurnace: containerFurnaceUrl,
      containerSmithing: containerSmithingUrl,
      recipeButton: recipeButtonUrl,
      mapBackground: mapBackgroundUrl,
      mapIcons: mapIconsUrl,
    },
    previewTiles,
    dispose: () => {
      atlasTexture.dispose();
      for (const tex of Object.values(entityTextures)) {
        tex.dispose();
      }
      for (const u of allGuiUrls) {
        if (u) URL.revokeObjectURL(u);
      }
    },
  };
}
