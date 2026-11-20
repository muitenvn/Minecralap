import { ALL_TEXTURE_KEYS } from './blocks';
import { saveResourcePack } from './storage';
import { CachedResourcePack } from './types';

function hash2d(x: number, y: number, seed: number): number {
  let n = Math.imul(x + 37, 374761393) + Math.imul(y + 17, 668265263) + Math.imul(seed, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Không thể tạo PNG blob.'));
    }, 'image/png');
  });
}

// High-contrast, authentic Classic / Vanilla 1.16 Jappa-style 16x16 texture painter
function paintOriginalBlockCanvas(key: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(16, 16);
  const d = img.data;

  const setPx = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
    if (x < 0 || x >= 16 || y < 0 || y >= 16) return;
    const i = (y * 16 + x) * 4;
    d[i] = clamp255(r);
    d[i + 1] = clamp255(g);
    d[i + 2] = clamp255(b);
    d[i + 3] = clamp255(a);
  };

  const paintNoise = (palette: string[], seed: number, alpha = 255) => {
    const rgbs = palette.map(hexToRgb);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const h = hash2d(x, y, seed);
        const col = rgbs[Math.min(rgbs.length - 1, Math.floor(h * rgbs.length))];
        setPx(x, y, col[0], col[1], col[2], alpha);
      }
    }
  };

  const paintStoneBase = (seed = 11) => {
    const pal = ['#7d7d7d', '#848484', '#757575', '#8f8f8f', '#6e6e6e'];
    paintNoise(pal, seed);
    // Horizontal layered Minecraft stone strata
    for (let y = 0; y < 16; y++) {
      const band = (y % 4 === 0 ? -7 : y % 4 === 2 ? 6 : 0);
      for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4;
        d[i] = clamp255(d[i] + band);
        d[i + 1] = clamp255(d[i + 1] + band);
        d[i + 2] = clamp255(d[i + 2] + band);
      }
    }
  };

  const paintOreClusters = (oreHex: string, brightHex: string, seed: number) => {
    const [r, g, b] = hexToRgb(oreHex);
    const [br, bg, bb] = hexToRgb(brightHex);
    const pts = [
      [3, 3], [4, 3], [4, 4], [10, 2], [11, 2], [11, 3],
      [6, 8], [7, 8], [7, 9], [8, 9], [12, 10], [13, 10], [12, 11],
      [2, 12], [3, 12], [3, 13],
    ];
    for (let idx = 0; idx < pts.length; idx++) {
      const [ox, oy] = pts[idx];
      const bright = hash2d(ox, oy, seed) > 0.45;
      setPx(ox, oy, bright ? br : r, bright ? bg : g, bright ? bb : b);
    }
  };

  if (key === 'grass_block_top') {
    paintNoise(['#5aa632', '#64b338', '#4f942a', '#70bf41', '#488825'], 21);
  } else if (key === 'dirt') {
    paintNoise(['#866043', '#79553a', '#966c4a', '#6d4b32', '#a07554'], 22);
    // Classic Minecraft tiny grey pebbles inside dirt
    for (const [px, py] of [[3, 5], [11, 2], [7, 11], [13, 13], [2, 14]]) {
      setPx(px, py, 126, 122, 118);
    }
  } else if (key === 'grass_block_side') {
    paintNoise(['#866043', '#79553a', '#966c4a', '#6d4b32'], 23);
    const overhang = [4, 5, 4, 3, 5, 6, 4, 3, 4, 5, 4, 6, 5, 3, 4, 5];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < overhang[x]; y++) {
        const shade = y === overhang[x] - 1 ? '#458222' : y === 0 ? '#74c644' : '#5aa632';
        const [r, g, b] = hexToRgb(shade);
        setPx(x, y, r, g, b);
      }
    }
  } else if (key === 'stone') {
    paintStoneBase(31);
  } else if (key === 'cobblestone') {
    paintNoise(['#7f7f7f', '#6b6b6b', '#969696', '#5c5c5c'], 32);
    // Classic interlocking cobble mortar lines
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const mortar = y === 0 || y === 5 || y === 10 || y === 15 ||
          (y < 5 && (x === 0 || x === 7 || x === 13)) ||
          (y >= 5 && y < 10 && (x === 3 || x === 10)) ||
          (y >= 10 && (x === 1 || x === 6 || x === 12));
        if (mortar) setPx(x, y, 64, 64, 64);
        else if (y === 1 || y === 6 || y === 11) setPx(x, y, 162, 162, 162);
      }
    }
  } else if (key === 'bedrock') {
    paintNoise(['#1c1c1c', '#4a4a4a', '#696969', '#2b2b2b', '#0d0d0d'], 33);
  } else if (key === 'sand') {
    paintNoise(['#e3dbb0', '#dcd3a0', '#ebe4bf', '#d2c790'], 34);
  } else if (key === 'gravel') {
    paintNoise(['#837f7e', '#6f6c6b', '#9a9694', '#5c5a59', '#aba7a5'], 35);
  } else if (key === 'oak_log') {
    for (let x = 0; x < 16; x++) {
      const ridge = x % 4 === 0 ? '#4d3720' : x % 4 === 2 ? '#785a37' : '#654b2c';
      const [r, g, b] = hexToRgb(ridge);
      for (let y = 0; y < 16; y++) {
        const v = (hash2d(x, y, 41) - 0.5) * 18;
        setPx(x, y, r + v, g + v, b + v);
      }
    }
  } else if (key === 'oak_log_top') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const ring = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        const col = ring > 6.6 ? '#543c22' : Math.floor(ring) % 2 === 0 ? '#b8945f' : '#9c7c49';
        const [r, g, b] = hexToRgb(col);
        setPx(x, y, r, g, b);
      }
    }
  } else if (key === 'oak_planks' || key === 'crimson_planks' || key === 'warped_planks') {
    const pal =
      key === 'crimson_planks'
        ? ['#753147', '#66283c', '#843952', '#4a1c2b']
        : key === 'warped_planks'
          ? ['#296d6b', '#225d5b', '#337f7d', '#184241']
          : ['#b49059', '#a6824d', '#c29d63', '#7a5c34'];
    const [c1, c2, c3, seam] = pal.map(hexToRgb);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isSeam = y % 4 === 0 || (Math.floor(y / 4) % 2 === 0 ? x === 0 || x === 8 : x === 4 || x === 12);
        const col = isSeam ? seam : y % 4 === 1 ? c3 : hash2d(x, y, 44) > 0.5 ? c1 : c2;
        setPx(x, y, col[0], col[1], col[2]);
      }
    }
  } else if (key === 'oak_leaves') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const h = hash2d(x, y, 49);
        if (h < 0.18) setPx(x, y, 0, 0, 0, 0);
        else {
          const [r, g, b] = hexToRgb(h > 0.72 ? '#59a637' : h > 0.4 ? '#3f8426' : '#2d611a');
          setPx(x, y, r, g, b, 255);
        }
      }
    }
  } else if (key === 'water') {
    paintNoise(['#2e65d6', '#3671e3', '#2759c4', '#4682f2'], 51, 185);
  } else if (key === 'lava') {
    paintNoise(['#e85a12', '#f78816', '#c93c08', '#ffba26'], 52, 245);
  } else if (key === 'coal_ore') {
    paintStoneBase(61);
    paintOreClusters('#1e1e1e', '#383838', 61);
  } else if (key === 'iron_ore') {
    paintStoneBase(62);
    paintOreClusters('#d4ab8c', '#f0cfb4', 62);
  } else if (key === 'gold_ore') {
    paintStoneBase(63);
    paintOreClusters('#f5c527', '#fff275', 63);
  } else if (key === 'diamond_ore') {
    paintStoneBase(64);
    paintOreClusters('#2be0e6', '#b5fcff', 64);
  } else if (key === 'glass') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (x === 0 || y === 0 || x === 15 || y === 15) setPx(x, y, 188, 226, 240, 235);
        else if ((x === 3 && y === 3) || (x === 4 && y === 2) || (x === 12 && y === 11)) setPx(x, y, 255, 255, 255, 210);
        else setPx(x, y, 200, 238, 255, 28);
      }
    }
  } else if (key === 'obsidian' || key === 'crying_obsidian') {
    paintNoise(['#130d21', '#1c1430', '#0c0814', '#2e1f4d'], 71);
    if (key === 'crying_obsidian') {
      for (const [px, py] of [[3, 4], [4, 4], [4, 5], [11, 2], [11, 3], [12, 3], [6, 11], [7, 11], [7, 12], [13, 13]]) {
        setPx(px, py, 168, 85, 247);
      }
    }
  } else if (key === 'nether_portal') {
    paintNoise(['#7e22ce', '#a855f7', '#581c87', '#c084fc'], 72, 185);
  } else if (key === 'netherrack') {
    paintNoise(['#6e2c2b', '#5e2322', '#7d3635', '#4c1b1a', '#8c4240'], 73);
  } else if (key === 'nether_quartz_ore') {
    paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 74);
    paintOreClusters('#e8e1d5', '#ffffff', 74);
  } else if (key === 'nether_gold_ore') {
    paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 75);
    paintOreClusters('#f5c527', '#fff275', 75);
  } else if (key === 'glowstone' || key === 'shroomlight') {
    const pal = key === 'shroomlight'
      ? ['#f29924', '#ffb838', '#d46b15', '#ffe278']
      : ['#c99642', '#e8c468', '#8c6428', '#fff0a6'];
    paintNoise(pal, 76);
  } else if (key === 'crimson_nylium') {
    paintNoise(['#8f202e', '#a82636', '#701824', '#bd3141'], 77);
  } else if (key === 'crimson_nylium_side') {
    paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 78);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 4 + (x % 3); y++) {
        const [r, g, b] = hexToRgb(y < 2 ? '#b8293b' : '#8a1f2d');
        setPx(x, y, r, g, b);
      }
    }
  } else if (key === 'warped_nylium') {
    paintNoise(['#168a7a', '#21a896', '#106b5e', '#36c2ae'], 79);
  } else if (key === 'warped_nylium_side') {
    paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 80);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 4 + ((x + 1) % 3); y++) {
        const [r, g, b] = hexToRgb(y < 2 ? '#23b09c' : '#147568');
        setPx(x, y, r, g, b);
      }
    }
  } else if (key === 'crimson_stem' || key === 'warped_stem') {
    const pal = key === 'crimson_stem'
      ? ['#631d32', '#4a1424', '#852842', '#a83654']
      : ['#22595b', '#174042', '#317a7d', '#409e9f'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const vein = (x + Math.floor(Math.sin(y * 0.6) * 1.5) + 16) % 4;
        const [r, g, b] = hexToRgb(pal[vein]);
        setPx(x, y, r, g, b);
      }
    }
  } else if (key === 'ancient_debris_top') {
    // Classic 1.16 cinnamon-roll spiral top!
    paintNoise(['#5e433a', '#4d352d', '#705248'], 81);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const ring = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        if (Math.abs(ring - 2.5) < 0.6 || Math.abs(ring - 5.5) < 0.6) {
          setPx(x, y, 42, 28, 24);
        } else if (Math.abs(ring - 4) < 0.6) {
          setPx(x, y, 128, 96, 84);
        }
      }
    }
  } else if (key === 'ancient_debris_side') {
    paintNoise(['#5e433a', '#4d352d', '#705248'], 82);
    for (let x = 0; x < 16; x++) {
      setPx(x, 2, 134, 102, 90);
      setPx(x, 3, 40, 26, 22);
      setPx(x, 12, 134, 102, 90);
      setPx(x, 13, 40, 26, 22);
    }
  } else if (key === 'blackstone' || key === 'polished_blackstone' || key === 'gilded_blackstone') {
    paintNoise(['#2a2730', '#1f1d24', '#383440', '#17151c'], 83);
    if (key === 'polished_blackstone') {
      for (let i = 0; i < 16; i++) {
        setPx(i, 0, 74, 70, 84);
        setPx(0, i, 74, 70, 84);
        setPx(i, 15, 18, 16, 22);
        setPx(15, i, 18, 16, 22);
      }
    } else if (key === 'gilded_blackstone') {
      paintOreClusters('#eab308', '#fef08a', 83);
    }
  } else if (key === 'soul_sand' || key === 'soul_soil') {
    paintNoise(['#523e32', '#423127', '#614a3c', '#33241c'], 84);
    if (key === 'soul_sand') {
      // Subtle classic screaming soul faces
      for (const [fx, fy] of [[3, 3], [10, 8]]) {
        setPx(fx, fy, 28, 19, 15);
        setPx(fx + 2, fy, 28, 19, 15);
        setPx(fx + 1, fy + 2, 28, 19, 15);
        setPx(fx + 1, fy + 3, 28, 19, 15);
      }
    }
  } else if (key === 'magma') {
    paintNoise(['#4a1d19', '#381411', '#61251e'], 85);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x + y * 2) % 7 === 0 || (x * 3 + y) % 11 === 0) {
          setPx(x, y, 255, 136, 22);
        }
      }
    }
  } else if (key === 'crafting_table_top') {
    paintNoise(['#b58b52', '#a37c46', '#c4985c'], 91);
    for (let i = 0; i < 16; i++) {
      setPx(i, 0, 72, 48, 24);
      setPx(i, 15, 72, 48, 24);
      setPx(0, i, 72, 48, 24);
      setPx(15, i, 72, 48, 24);
      if (i > 1 && i < 14) {
        setPx(i, 5, 72, 48, 24);
        setPx(i, 10, 72, 48, 24);
        setPx(5, i, 72, 48, 24);
        setPx(10, i, 72, 48, 24);
      }
    }
  } else if (key === 'furnace_front') {
    paintStoneBase(92);
    for (let y = 2; y < 7; y++) for (let x = 3; x < 13; x++) setPx(x, y, 26, 26, 28);
    for (let y = 10; y < 14; y++) for (let x = 4; x < 12; x++) setPx(x, y, 22, 22, 24);
  } else if (key === 'smithing_table_top') {
    paintNoise(['#393c47', '#2e303a', '#454854'], 93);
    for (let i = 0; i < 16; i++) {
      setPx(i, 0, 20, 21, 26);
      setPx(i, 15, 20, 21, 26);
    }
  } else if (key === 'torch' || key === 'soul_lantern' || key === 'soul_fire') {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) setPx(x, y, 0, 0, 0, 0);
    if (key === 'torch') {
      for (let y = 6; y < 16; y++) { setPx(7, y, 134, 94, 48); setPx(8, y, 108, 72, 34); }
      setPx(7, 4, 255, 220, 80); setPx(8, 4, 255, 160, 40);
      setPx(7, 5, 255, 140, 20); setPx(8, 5, 255, 240, 120);
    } else if (key === 'soul_lantern') {
      for (let y = 5; y < 15; y++) for (let x = 5; x < 11; x++) setPx(x, y, 42, 46, 56);
      for (let y = 7; y < 13; y++) for (let x = 6; x < 10; x++) setPx(x, y, 45, 212, 191);
    } else {
      for (let y = 5; y < 16; y++) {
        for (let x = 2; x < 14; x++) {
          if (hash2d(x, y, 99) > (16 - y) / 14) {
            setPx(x, y, 45, 212, 191, 235);
          }
        }
      }
    }
  } else {
    // Rich faithful fallback keyed deterministically by block name
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
    const baseHue = Math.abs(h) % 360;
    const palette: string[] = [];
    for (let k = 0; k < 4; k++) {
      const l = 34 + k * 9;
      palette.push(`#${((baseHue * 3 + k * 29) % 180 + 55).toString(16).padStart(2, '0')}${((l * 4) % 180 + 45).toString(16).padStart(2, '0')}${((baseHue + l * 3) % 180 + 50).toString(16).padStart(2, '0')}`);
    }
    paintNoise(palette, Math.abs(h) % 999);
    // Add crisp classic pixel border
    for (let i = 0; i < 16; i++) {
      setPx(i, 0, d[i * 4] + 18, d[i * 4 + 1] + 18, d[i * 4 + 2] + 18);
      setPx(i, 15, d[(15 * 16 + i) * 4] - 24, d[(15 * 16 + i) * 4 + 1] - 24, d[(15 * 16 + i) * 4 + 2] - 24);
    }
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

function paintClassicOptionsBgCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  const dirt = paintOriginalBlockCanvas('dirt');
  ctx.drawImage(dirt, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, 16, 16);
  return c;
}

export async function buildOriginalMinecraftPack(
  baseGuiBlobs?: Record<string, Blob>,
): Promise<CachedResourcePack> {
  const blockBlobs: Record<string, Blob> = {};
  let totalBytes = 0;

  for (const key of ALL_TEXTURE_KEYS) {
    const canvas = paintOriginalBlockCanvas(key);
    const blob = await canvasToBlob(canvas);
    blockBlobs[key] = blob;
    totalBytes += blob.size;
  }

  const guiBlobs: Record<string, Blob> = { ...(baseGuiBlobs || {}) };
  const bgBlob = await canvasToBlob(paintClassicOptionsBgCanvas());
  guiBlobs.options_background = bgBlob;
  totalBytes += bgBlob.size;

  const cached: CachedResourcePack = {
    id: 'active_pack',
    name: 'Minecraft 1.16 Chính Gốc (Classic Vanilla)',
    version: '1.16.5-vanilla',
    sourceLabel: 'Texture Chính Gốc 1.16 (Tích hợp sẵn)',
    sourceType: 'original-classic',
    downloadedAt: Date.now(),
    totalBytes,
    blockBlobs,
    guiBlobs,
  };

  await saveResourcePack(cached);
  return cached;
}
