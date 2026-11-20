import * as THREE from 'three';
import { unzipSync } from 'fflate';
import { ALL_TEXTURE_KEYS, BLOCK_DEFS, ITEM_DEFS } from './blocks';
import { CachedResourcePack, PackManifest } from './types';
import { saveResourcePack } from './storage';

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
  };
  atlasTexture: THREE.CanvasTexture;
  atlasCanvas: HTMLCanvasElement;
  uvMap: Record<string, AtlasUV>;
  itemIcons: Record<string, string>; // itemId -> dataURL
  guiUrls: {
    widgets: string;
    icons: string;
    optionsBackground: string;
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
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  return res.blob();
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
): Promise<{ pack: CachedResourcePack; replacedBlocks: number; replacedGui: number }> {
  // Always ensure base fallback exists so missing textures never turn purple/black
  const fallback = basePack ?? (await downloadDefaultGithubPack(onProgress));
  const texturesRoot = normalizeGithubTexturesRoot(rawUrl);

  const blockBlobs: Record<string, Blob> = { ...fallback.blockBlobs };
  const guiBlobs: Record<string, Blob> = { ...fallback.guiBlobs };
  const keys = [...ALL_TEXTURE_KEYS];
  const guiKeys = ['widgets', 'icons', 'options_background'];
  const totalFiles = keys.length + guiKeys.length;

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

  for (const gKey of guiKeys) {
    try {
      const blob = await fetchBlob(`${texturesRoot}/gui/${gKey}.png`);
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
        currentFile: `gui/${gKey}.png`,
      });
    }
  }

  if (replacedBlocks === 0 && replacedGui === 0) {
    throw new Error(
      'Không tìm thấy tệp ảnh .png hợp lệ tại URL GitHub này (kiểm tra lại nhánh main/master hoặc cấu trúc assets/minecraft/textures/block/).',
    );
  }

  const record: CachedResourcePack = {
    id: 'active_pack',
    name: `GitHub Pack (${replacedBlocks} block · ${replacedGui} UI)`,
    version: '1.16.5 Custom',
    sourceLabel: texturesRoot,
    sourceType: 'github-raw',
    sourceUrl: rawUrl.trim(),
    downloadedAt: Date.now(),
    totalBytes: loadedBytes + fallback.totalBytes,
    blockBlobs,
    guiBlobs,
  };
  await saveResourcePack(record);
  return { pack: record, replacedBlocks, replacedGui };
}

export async function importZipResourcePack(
  file: File,
  basePack: CachedResourcePack | null,
  onProgress?: (p: DownloadProgress) => void,
): Promise<{ pack: CachedResourcePack; replacedBlocks: number; replacedGui: number }> {
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
  const guiBlobs: Record<string, Blob> = { ...fallback.guiBlobs };
  const keySet = new Set(ALL_TEXTURE_KEYS);

  let replacedBlocks = 0;
  let replacedGui = 0;
  let loadedBytes = 0;

  for (const [entryPath, data] of Object.entries(unzipped)) {
    const lower = entryPath.toLowerCase().replace(/\\/g, '/');
    if (!lower.endsWith('.png') || data.byteLength < 40) continue;

    // Match block textures (both 1.16 "block/" and legacy "blocks/")
    const blockMatch = lower.match(/(?:textures\/blocks?\/)([^/]+)\.png$/);
    if (blockMatch && keySet.has(blockMatch[1])) {
      blockBlobs[blockMatch[1]] = new Blob([data], { type: 'image/png' });
      replacedBlocks++;
      loadedBytes += data.byteLength;
      continue;
    }

    // Match GUI textures (widgets.png, icons.png, options_background.png)
    const guiMatch = lower.match(/(?:textures\/gui\/)(widgets|icons|options_background)\.png$/);
    if (guiMatch) {
      guiBlobs[guiMatch[1]] = new Blob([data], { type: 'image/png' });
      replacedGui++;
      loadedBytes += data.byteLength;
    }
  }

  if (replacedBlocks === 0 && replacedGui === 0) {
    throw new Error(
      'File .zip không chứa thư mục textures/block/*.png hoặc textures/gui/*.png chuẩn Minecraft 1.16.',
    );
  }

  const record: CachedResourcePack = {
    id: 'active_pack',
    name: file.name.replace(/\.zip$/i, ''),
    version: '1.16.5 ZIP',
    sourceLabel: `Gói ZIP cục bộ (${replacedBlocks} block · ${replacedGui} UI)`,
    sourceType: 'zip-upload',
    downloadedAt: Date.now(),
    totalBytes: loadedBytes || file.size,
    blockBlobs,
    guiBlobs,
  };
  await saveResourcePack(record);
  return { pack: record, replacedBlocks, replacedGui };
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
  const TILE = 16;
  const cols = Math.ceil(Math.sqrt(keys.length));
  const atlasDim = Math.pow(2, Math.ceil(Math.log2(cols * TILE)));
  const tilesPerRow = atlasDim / TILE;

  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = atlasDim;
  atlasCanvas.height = atlasDim;
  const ctx = atlasCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, atlasDim, atlasDim);

  const uvMap: Record<string, AtlasUV> = {};
  const tileImages: Record<string, HTMLImageElement> = {};
  const previewTiles: { key: string; url: string }[] = [];

  await Promise.all(
    keys.map(async (key, idx) => {
      const col = idx % tilesPerRow;
      const row = Math.floor(idx / tilesPerRow);
      const px = col * TILE;
      const py = row * TILE;
      const blob = cached.blockBlobs[key];
      if (blob) {
        try {
          const img = await blobToImage(blob);
          tileImages[key] = img;
          // Draw scaled to 16x16 (works with 16x16, 32x32, 64x64 resource packs cleanly; crops animated strips to frame 0)
          const srcSize = Math.min(img.width, img.height);
          ctx.drawImage(img, 0, 0, srcSize, srcSize, px, py, TILE, TILE);
        } catch {
          ctx.fillStyle = '#8b5cf6';
          ctx.fillRect(px, py, TILE, TILE);
        }
      } else {
        ctx.fillStyle = '#52525b';
        ctx.fillRect(px, py, TILE, TILE);
      }
      // Small inset to prevent UV bleeding across neighbor tiles
      const eps = 0.0008;
      uvMap[key] = {
        u0: px / atlasDim + eps,
        u1: (px + TILE) / atlasDim - eps,
        v0: 1 - (py + TILE) / atlasDim + eps,
        v1: 1 - py / atlasDim - eps,
      };
    }),
  );

  // Build crisp 2D item icon cache for Inventory / Hotbar / Crafting UI
  const itemIcons: Record<string, string> = {};
  const iconCanvas = document.createElement('canvas');
  iconCanvas.width = 32;
  iconCanvas.height = 32;
  const iconCtx = iconCanvas.getContext('2d')!;
  iconCtx.imageSmoothingEnabled = false;

  for (const item of Object.values(ITEM_DEFS)) {
    if (item.blockId !== undefined) {
      const bdef = BLOCK_DEFS[item.blockId];
      const topImg = tileImages[bdef.textures.top];
      const sideImg = tileImages[bdef.textures.front || bdef.textures.side];
      iconCtx.clearRect(0, 0, 32, 32);
      if (bdef.key === 'torch' || bdef.key === 'soul_lantern') {
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
      pc.width = 16;
      pc.height = 16;
      const pctx = pc.getContext('2d')!;
      pctx.imageSmoothingEnabled = false;
      const s = Math.min(img.width, img.height);
      pctx.drawImage(img, 0, 0, s, s, 0, 0, 16, 16);
      previewTiles.push({ key: pk, url: pc.toDataURL('image/png') });
    }
  }

  const widgetsUrl = cached.guiBlobs.widgets ? URL.createObjectURL(cached.guiBlobs.widgets) : '';
  const iconsUrl = cached.guiBlobs.icons ? URL.createObjectURL(cached.guiBlobs.icons) : '';
  const optionsBackgroundUrl = cached.guiBlobs.options_background
    ? URL.createObjectURL(cached.guiBlobs.options_background)
    : '';

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
      blockCount: Object.keys(cached.blockBlobs).length,
      guiCount: Object.keys(cached.guiBlobs).length,
    },
    atlasTexture,
    atlasCanvas,
    uvMap,
    itemIcons,
    guiUrls: {
      widgets: widgetsUrl,
      icons: iconsUrl,
      optionsBackground: optionsBackgroundUrl,
    },
    previewTiles,
    dispose: () => {
      atlasTexture.dispose();
      if (widgetsUrl) URL.revokeObjectURL(widgetsUrl);
      if (iconsUrl) URL.revokeObjectURL(iconsUrl);
      if (optionsBackgroundUrl) URL.revokeObjectURL(optionsBackgroundUrl);
    },
  };
}
