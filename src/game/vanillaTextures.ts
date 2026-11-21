import { ALL_TEXTURE_KEYS, ITEM_DEFS } from './blocks';
import { EXT_TEXTURE_SPECS } from './catalog116';
import { loadResourcePackById, saveResourcePack } from './storage';
import { CachedResourcePack } from './types';

function hash2d(x: number, y: number, seed: number): number {
  let n =
    Math.imul(x + 37, 374761393) +
    Math.imul(y + 17, 668265263) +
    Math.imul(seed, 1442695041);
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

// Complete, faithful 16x16 Minecraft 1.16 Classic Vanilla painter for all block texture keys
export function paintOriginalBlockCanvas(key: string): HTMLCanvasElement {
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

  const setHex = (x: number, y: number, hex: string, a = 255) => {
    const [r, g, b] = hexToRgb(hex);
    setPx(x, y, r, g, b, a);
  };

  const fillRect = (x0: number, y0: number, w: number, h: number, hex: string, a = 255) => {
    const [r, g, b] = hexToRgb(hex);
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) setPx(x, y, r, g, b, a);
    }
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
    paintNoise(['#7d7d7d', '#848484', '#757575', '#8f8f8f', '#6e6e6e'], seed);
    for (let y = 0; y < 16; y++) {
      const band = y % 4 === 0 ? -7 : y % 4 === 2 ? 6 : 0;
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

  const paintMetalBlock = (
    basePal: string[],
    lightEdge: string,
    darkEdge: string,
    seed: number,
  ) => {
    paintNoise(basePal, seed);
    for (let i = 0; i < 16; i++) {
      setHex(i, 0, lightEdge);
      setHex(0, i, lightEdge);
      setHex(i, 15, darkEdge);
      setHex(15, i, darkEdge);
    }
    for (let i = 2; i < 14; i++) {
      setHex(i, 2, darkEdge);
      setHex(2, i, darkEdge);
      setHex(i, 13, lightEdge);
      setHex(13, i, lightEdge);
    }
  };

  const paintRings = (outerHex: string, ringA: string, ringB: string, seed: number) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const ring = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        const baseHex = ring > 6.6 ? outerHex : Math.floor(ring) % 2 === 0 ? ringA : ringB;
        const [r, g, b] = hexToRgb(baseHex);
        const v = (hash2d(x, y, seed) - 0.5) * 14;
        setPx(x, y, r + v, g + v, b + v);
      }
    }
  };

  switch (key) {
    case 'grass_block_top': {
      paintNoise(['#5aa632', '#64b338', '#4f942a', '#70bf41', '#488825'], 21);
      break;
    }
    case 'dirt': {
      paintNoise(['#866043', '#79553a', '#966c4a', '#6d4b32', '#a07554'], 22);
      for (const [px, py] of [[3, 5], [11, 2], [7, 11], [13, 13], [2, 14]]) {
        setPx(px, py, 126, 122, 118);
      }
      break;
    }
    case 'grass_block_side': {
      paintNoise(['#866043', '#79553a', '#966c4a', '#6d4b32'], 23);
      const overhang = [4, 5, 4, 3, 5, 6, 4, 3, 4, 5, 4, 6, 5, 3, 4, 5];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < overhang[x]; y++) {
          const shade = y === overhang[x] - 1 ? '#458222' : y === 0 ? '#74c644' : '#5aa632';
          setHex(x, y, shade);
        }
      }
      break;
    }
    case 'stone': {
      paintStoneBase(31);
      break;
    }
    case 'cobblestone': {
      paintNoise(['#7f7f7f', '#6b6b6b', '#969696', '#5c5c5c'], 32);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const mortar =
            y === 0 ||
            y === 5 ||
            y === 10 ||
            y === 15 ||
            (y < 5 && (x === 0 || x === 7 || x === 13)) ||
            (y >= 5 && y < 10 && (x === 3 || x === 10)) ||
            (y >= 10 && (x === 1 || x === 6 || x === 12));
          if (mortar) setPx(x, y, 64, 64, 64);
          else if (y === 1 || y === 6 || y === 11) setPx(x, y, 162, 162, 162);
        }
      }
      break;
    }
    case 'bedrock': {
      paintNoise(['#1c1c1c', '#4a4a4a', '#696969', '#2b2b2b', '#0d0d0d'], 33);
      break;
    }
    case 'sand': {
      paintNoise(['#e3dbb0', '#dcd3a0', '#ebe4bf', '#d2c790'], 34);
      break;
    }
    case 'gravel': {
      paintNoise(['#837f7e', '#6f6c6b', '#9a9694', '#5c5a59', '#aba7a5'], 35);
      break;
    }
    case 'oak_log': {
      for (let x = 0; x < 16; x++) {
        const ridge = x % 4 === 0 ? '#4d3720' : x % 4 === 2 ? '#785a37' : '#654b2c';
        const [r, g, b] = hexToRgb(ridge);
        for (let y = 0; y < 16; y++) {
          const v = (hash2d(x, y, 41) - 0.5) * 18;
          setPx(x, y, r + v, g + v, b + v);
        }
      }
      break;
    }
    case 'oak_log_top': {
      paintRings('#543c22', '#b8945f', '#9c7c49', 42);
      break;
    }
    case 'oak_planks':
    case 'crimson_planks':
    case 'warped_planks': {
      const pal =
        key === 'crimson_planks'
          ? ['#753147', '#66283c', '#843952', '#4a1c2b']
          : key === 'warped_planks'
            ? ['#296d6b', '#225d5b', '#337f7d', '#184241']
            : ['#b49059', '#a6824d', '#c29d63', '#7a5c34'];
      const [c1, c2, c3, seam] = pal.map(hexToRgb);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const isSeam =
            y % 4 === 0 ||
            (Math.floor(y / 4) % 2 === 0 ? x === 0 || x === 8 : x === 4 || x === 12);
          const col = isSeam ? seam : y % 4 === 1 ? c3 : hash2d(x, y, 44) > 0.5 ? c1 : c2;
          setPx(x, y, col[0], col[1], col[2]);
        }
      }
      break;
    }
    case 'oak_leaves': {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const h = hash2d(x, y, 49);
          if (h < 0.2) setPx(x, y, 0, 0, 0, 0);
          else {
            const hex = h > 0.72 ? '#59a637' : h > 0.42 ? '#3f8426' : '#2d611a';
            setHex(x, y, hex, 255);
          }
        }
      }
      break;
    }
    case 'water_still': {
      paintNoise(['#2861cf', '#326ee0', '#2152b8', '#417df0'], 51, 182);
      for (let y = 0; y < 16; y += 4) {
        for (let x = 0; x < 16; x++) {
          if ((x + y) % 5 < 2) setPx(x, y, 96, 156, 252, 195);
        }
      }
      break;
    }
    case 'lava_still': {
      paintNoise(['#e35310', '#f58416', '#c43708', '#ffba26'], 52, 255);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if ((x * 3 + y * 5) % 13 === 0) setPx(x, y, 255, 232, 110, 255);
        }
      }
      break;
    }
    case 'coal_ore': {
      paintStoneBase(61);
      paintOreClusters('#1e1e1e', '#383838', 61);
      break;
    }
    case 'iron_ore': {
      paintStoneBase(62);
      paintOreClusters('#d4ab8c', '#f0cfb4', 62);
      break;
    }
    case 'gold_ore': {
      paintStoneBase(63);
      paintOreClusters('#f5c527', '#fff275', 63);
      break;
    }
    case 'diamond_ore': {
      paintStoneBase(64);
      paintOreClusters('#2be0e6', '#b5fcff', 64);
      break;
    }
    case 'glass': {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (x === 0 || y === 0 || x === 15 || y === 15) setPx(x, y, 188, 226, 240, 235);
          else if ((x === 3 && y === 3) || (x === 4 && y === 2) || (x === 12 && y === 11)) {
            setPx(x, y, 255, 255, 255, 215);
          } else {
            setPx(x, y, 200, 238, 255, 26);
          }
        }
      }
      break;
    }
    case 'snow': {
      paintNoise(['#f2f7fa', '#e6f0f5', '#ffffff', '#dce8ef'], 65);
      break;
    }
    case 'ice': {
      paintNoise(['#8db8f7', '#9cc4fc', '#7aa7eb', '#b5d6ff'], 66, 178);
      for (let i = 2; i < 7; i++) setPx(i, 8 - i, 232, 246, 255, 215);
      for (let i = 9; i < 13; i++) setPx(i, 21 - i, 232, 246, 255, 205);
      break;
    }
    case 'bricks': {
      paintNoise(['#9c4a38', '#8c3f2e', '#ad5642', '#7a3425'], 67);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const isMortar =
            y === 3 ||
            y === 7 ||
            y === 11 ||
            y === 15 ||
            (Math.floor(y / 4) % 2 === 0 ? x === 7 || x === 15 : x === 3 || x === 11);
          if (isMortar) setPx(x, y, 194, 188, 180);
        }
      }
      break;
    }
    case 'iron_block': {
      paintMetalBlock(['#dcdcdc', '#d2d2d2', '#e6e6e6', '#c8c8c8'], '#ffffff', '#949494', 68);
      break;
    }
    case 'gold_block': {
      paintMetalBlock(['#f5cc2c', '#ecc022', '#ffdc4a', '#d9a718'], '#fff6a6', '#a87810', 69);
      break;
    }
    case 'diamond_block': {
      paintMetalBlock(['#5ce2e6', '#4bd4d9', '#7ef2f5', '#34bfc7'], '#d1ffff', '#1e8a94', 70);
      break;
    }
    case 'tnt_side': {
      fillRect(0, 0, 16, 16, '#db3b2b');
      for (let x = 0; x < 16; x++) {
        if (x % 4 === 0) {
          for (let y = 0; y < 16; y++) setPx(x, y, 168, 34, 24);
        }
      }
      fillRect(0, 5, 16, 6, '#f0ece6');
      fillRect(0, 5, 16, 1, '#c8c2ba');
      fillRect(0, 10, 16, 1, '#c8c2ba');
      // Crisp pixel "T N T" letters on center white band
      const letters = [
        // T
        [1, 6], [2, 6], [3, 6], [2, 7], [2, 8], [2, 9],
        // N
        [6, 6], [6, 7], [6, 8], [6, 9], [7, 7], [8, 8], [9, 6], [9, 7], [9, 8], [9, 9],
        // T
        [12, 6], [13, 6], [14, 6], [13, 7], [13, 8], [13, 9],
      ];
      for (const [lx, ly] of letters) setPx(lx, ly, 24, 22, 26);
      break;
    }
    case 'tnt_top': {
      fillRect(0, 0, 16, 16, '#c43225');
      for (let y = 0; y < 16; y += 4) {
        for (let x = 0; x < 16; x += 4) {
          fillRect(x + 1, y + 1, 2, 2, '#e65040');
          setPx(x + 1, y + 1, 34, 34, 38);
          setPx(x, y, 92, 22, 18);
        }
      }
      break;
    }
    case 'crafting_table_top': {
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
      break;
    }
    case 'crafting_table_side': {
      paintNoise(['#a87f49', '#96703d', '#b58c55'], 94);
      fillRect(0, 0, 16, 3, '#6e4926');
      for (let y = 3; y < 16; y++) {
        setPx(0, y, 78, 52, 26);
        setPx(15, y, 78, 52, 26);
      }
      // Classic hanging iron saw & hammer silhouette
      fillRect(3, 5, 3, 7, '#b5bbc2');
      fillRect(3, 4, 2, 2, '#5c3c1e');
      fillRect(10, 5, 3, 2, '#4a4f59');
      fillRect(11, 7, 1, 6, '#6e4926');
      break;
    }
    case 'furnace_top': {
      paintStoneBase(95);
      for (let i = 0; i < 16; i++) {
        setPx(i, 0, 72, 72, 74);
        setPx(i, 15, 72, 72, 74);
        setPx(0, i, 72, 72, 74);
        setPx(15, i, 72, 72, 74);
      }
      for (let i = 2; i < 14; i++) {
        setPx(i, 2, 162, 162, 166);
        setPx(2, i, 162, 162, 166);
      }
      break;
    }
    case 'furnace_side': {
      paintStoneBase(96);
      for (let x = 0; x < 16; x++) {
        setPx(x, 0, 68, 68, 72);
        setPx(x, 8, 68, 68, 72);
        setPx(x, 15, 68, 68, 72);
      }
      for (let y = 0; y < 8; y++) setPx(8, y, 68, 68, 72);
      for (let y = 8; y < 16; y++) {
        setPx(3, y, 68, 68, 72);
        setPx(12, y, 68, 68, 72);
      }
      break;
    }
    case 'furnace_front': {
      paintStoneBase(92);
      for (let y = 2; y < 7; y++) for (let x = 3; x < 13; x++) setPx(x, y, 26, 26, 28);
      for (let y = 10; y < 14; y++) for (let x = 4; x < 12; x++) setPx(x, y, 22, 22, 24);
      for (let x = 4; x < 12; x++) setPx(x, 13, 64, 52, 44);
      break;
    }
    case 'smithing_table_top': {
      paintNoise(['#393c47', '#2e303a', '#454854'], 93);
      for (let i = 0; i < 16; i++) {
        setPx(i, 0, 20, 21, 26);
        setPx(i, 15, 20, 21, 26);
        setPx(0, i, 20, 21, 26);
        setPx(15, i, 20, 21, 26);
      }
      for (const [rx, ry] of [[2, 2], [13, 2], [2, 13], [13, 13]]) setPx(rx, ry, 118, 124, 138);
      break;
    }
    case 'smithing_table_side': {
      paintNoise(['#4a1f2d', '#3b1622', '#592637'], 97);
      fillRect(0, 0, 16, 4, '#363945');
      fillRect(0, 3, 16, 1, '#1d1f26');
      fillRect(3, 6, 4, 2, '#9ca3af');
      fillRect(4, 8, 2, 5, '#6b4226');
      fillRect(10, 6, 2, 7, '#9ca3af');
      break;
    }
    case 'obsidian':
    case 'crying_obsidian': {
      paintNoise(['#130d21', '#1c1430', '#0c0814', '#2e1f4d'], 71);
      if (key === 'crying_obsidian') {
        for (const [px, py] of [
          [3, 4], [4, 4], [4, 5], [11, 2], [11, 3], [12, 3],
          [6, 11], [7, 11], [7, 12], [13, 13],
        ]) {
          setPx(px, py, 168, 85, 247);
        }
        setPx(4, 4, 232, 180, 255);
        setPx(11, 3, 232, 180, 255);
      }
      break;
    }
    case 'nether_portal': {
      paintNoise(['#7e22ce', '#a855f7', '#581c87', '#c084fc'], 72, 185);
      break;
    }
    case 'netherrack': {
      paintNoise(['#6e2c2b', '#5e2322', '#7d3635', '#4c1b1a', '#8c4240'], 73);
      break;
    }
    case 'nether_quartz_ore': {
      paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 74);
      paintOreClusters('#e8e1d5', '#ffffff', 74);
      break;
    }
    case 'nether_gold_ore': {
      paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 75);
      paintOreClusters('#f5c527', '#fff275', 75);
      break;
    }
    case 'glowstone':
    case 'shroomlight': {
      const pal =
        key === 'shroomlight'
          ? ['#f29924', '#ffb838', '#d46b15', '#ffe278']
          : ['#c99642', '#e8c468', '#8c6428', '#fff0a6'];
      paintNoise(pal, 76);
      break;
    }
    case 'crimson_nylium': {
      paintNoise(['#8f202e', '#a82636', '#701824', '#bd3141'], 77);
      break;
    }
    case 'crimson_nylium_side': {
      paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 78);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 4 + (x % 3); y++) {
          setHex(x, y, y < 2 ? '#b8293b' : '#8a1f2d');
        }
      }
      break;
    }
    case 'crimson_stem':
    case 'warped_stem': {
      const pal =
        key === 'crimson_stem'
          ? ['#631d32', '#4a1424', '#852842', '#a83654']
          : ['#22595b', '#174042', '#317a7d', '#409e9f'];
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const vein = (x + Math.floor(Math.sin(y * 0.6) * 1.5) + 16) % 4;
          setHex(x, y, pal[vein]);
        }
      }
      break;
    }
    case 'crimson_stem_top': {
      paintRings('#4a1424', '#8f2d49', '#6b1e35', 79);
      break;
    }
    case 'warped_stem_top': {
      paintRings('#163b3d', '#338588', '#225e61', 80);
      break;
    }
    case 'nether_wart_block': {
      paintNoise(['#7a0e19', '#911420', '#630a13', '#a81c29'], 101);
      break;
    }
    case 'warped_nylium': {
      paintNoise(['#168a7a', '#21a896', '#106b5e', '#36c2ae'], 102);
      break;
    }
    case 'warped_nylium_side': {
      paintNoise(['#6e2c2b', '#5e2322', '#7d3635'], 103);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 4 + ((x + 1) % 3); y++) {
          setHex(x, y, y < 2 ? '#23b09c' : '#147568');
        }
      }
      break;
    }
    case 'warped_wart_block': {
      paintNoise(['#117572', '#178f8a', '#0c5c59', '#20aba5'], 104);
      break;
    }
    case 'basalt_side': {
      for (let x = 0; x < 16; x++) {
        const colHex = x % 4 === 0 ? '#32323a' : x % 4 === 2 ? '#595966' : '#464652';
        const [r, g, b] = hexToRgb(colHex);
        for (let y = 0; y < 16; y++) {
          const v = (hash2d(x, y, 105) - 0.5) * 18;
          setPx(x, y, r + v, g + v, b + v);
        }
      }
      break;
    }
    case 'basalt_top': {
      paintRings('#313138', '#5c5c69', '#454550', 106);
      break;
    }
    case 'bone_block_side': {
      for (let x = 0; x < 16; x++) {
        const colHex = x % 3 === 0 ? '#c9c4b0' : '#e6e1ce';
        const [r, g, b] = hexToRgb(colHex);
        for (let y = 0; y < 16; y++) {
          const v = (hash2d(x, y, 107) - 0.5) * 12;
          setPx(x, y, r + v, g + v, b + v);
        }
      }
      break;
    }
    case 'bone_block_top': {
      paintRings('#dbd6c1', '#ebe7d5', '#bab49d', 108);
      break;
    }
    case 'ancient_debris_top': {
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
      break;
    }
    case 'ancient_debris_side': {
      paintNoise(['#5e433a', '#4d352d', '#705248'], 82);
      for (let x = 0; x < 16; x++) {
        setPx(x, 2, 134, 102, 90);
        setPx(x, 3, 40, 26, 22);
        setPx(x, 12, 134, 102, 90);
        setPx(x, 13, 40, 26, 22);
      }
      break;
    }
    case 'netherite_block': {
      paintMetalBlock(['#433e47', '#3a353e', '#4f4954', '#312d35'], '#6e6675', '#211d24', 109);
      break;
    }
    case 'respawn_anchor_side': {
      paintNoise(['#181126', '#221836', '#100b1a'], 110);
      fillRect(0, 0, 16, 2, '#3a2b5c');
      fillRect(0, 14, 16, 2, '#3a2b5c');
      fillRect(4, 4, 8, 8, '#6d28d9');
      fillRect(5, 5, 6, 6, '#c084fc');
      fillRect(7, 6, 2, 4, '#fde047');
      break;
    }
    case 'respawn_anchor_top': {
      paintNoise(['#181126', '#221836', '#100b1a'], 111);
      fillRect(3, 3, 10, 10, '#6b21a8');
      fillRect(5, 5, 6, 6, '#a855f7');
      fillRect(6, 6, 4, 4, '#e9d5ff');
      break;
    }
    case 'blackstone':
    case 'polished_blackstone':
    case 'gilded_blackstone': {
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
      break;
    }
    case 'soul_sand':
    case 'soul_soil': {
      paintNoise(['#523e32', '#423127', '#614a3c', '#33241c'], 84);
      if (key === 'soul_sand') {
        for (const [fx, fy] of [[3, 3], [10, 8]]) {
          setPx(fx, fy, 28, 19, 15);
          setPx(fx + 2, fy, 28, 19, 15);
          setPx(fx + 1, fy + 2, 28, 19, 15);
          setPx(fx + 1, fy + 3, 28, 19, 15);
        }
      }
      break;
    }
    case 'magma': {
      paintNoise(['#4a1d19', '#381411', '#61251e'], 85);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if ((x + y * 2) % 7 === 0 || (x * 3 + y) % 11 === 0) {
            setPx(x, y, 255, 136, 22);
          }
        }
      }
      break;
    }
    case 'torch': {
      for (let y = 6; y < 16; y++) {
        setPx(7, y, 134, 94, 48);
        setPx(8, y, 108, 72, 34);
      }
      setPx(7, 4, 255, 220, 80);
      setPx(8, 4, 255, 160, 40);
      setPx(7, 5, 255, 140, 20);
      setPx(8, 5, 255, 240, 120);
      break;
    }
    case 'soul_lantern': {
      for (let y = 5; y < 15; y++) for (let x = 5; x < 11; x++) setPx(x, y, 42, 46, 56);
      for (let y = 7; y < 13; y++) for (let x = 6; x < 10; x++) setPx(x, y, 45, 212, 191);
      setPx(7, 3, 72, 78, 92);
      setPx(8, 3, 72, 78, 92);
      setPx(7, 4, 72, 78, 92);
      setPx(8, 4, 72, 78, 92);
      break;
    }
    case 'soul_fire': {
      for (let y = 5; y < 16; y++) {
        for (let x = 2; x < 14; x++) {
          if (hash2d(x, y, 99) > (16 - y) / 14) {
            setPx(x, y, 45, 212, 191, 235);
          }
        }
      }
      break;
    }
    // --- EXPANDED 1.16 BLOCK TEXTURES ---
    case 'spruce_log': {
      for (let x = 0; x < 16; x++) {
        const ridge = x % 4 === 0 ? '#2b1b0e' : x % 4 === 2 ? '#4a311c' : '#3b2514';
        const [r, g, b] = hexToRgb(ridge);
        for (let y = 0; y < 16; y++) {
          const v = (hash2d(x, y, 131) - 0.5) * 14;
          setPx(x, y, r + v, g + v, b + v);
        }
      }
      break;
    }
    case 'spruce_log_top': {
      paintRings('#332011', '#7d5b37', '#66492a', 132);
      break;
    }
    case 'spruce_planks': {
      const [c1, c2, c3, seam] = ['#785634', '#6b4c2d', '#87623c', '#4a331d'].map(hexToRgb);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const isSeam =
            y % 4 === 0 || (Math.floor(y / 4) % 2 === 0 ? x === 0 || x === 8 : x === 4 || x === 12);
          const col = isSeam ? seam : y % 4 === 1 ? c3 : hash2d(x, y, 133) > 0.5 ? c1 : c2;
          setPx(x, y, col[0], col[1], col[2]);
        }
      }
      break;
    }
    case 'birch_log': {
      paintNoise(['#e6e4de', '#dbd8d0', '#f0eee9'], 134);
      for (const [bx, by, bw] of [[2, 3, 4], [10, 6, 3], [4, 11, 5], [11, 13, 3], [1, 8, 2]]) {
        fillRect(bx, by, bw, 1, '#343336');
      }
      break;
    }
    case 'birch_log_top': {
      paintRings('#dedbd2', '#d6c69c', '#bfa878', 135);
      break;
    }
    case 'birch_planks': {
      const [c1, c2, c3, seam] = ['#d9cc9e', '#ccbe8f', '#e6dab0', '#a39368'].map(hexToRgb);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const isSeam =
            y % 4 === 0 || (Math.floor(y / 4) % 2 === 0 ? x === 0 || x === 8 : x === 4 || x === 12);
          const col = isSeam ? seam : y % 4 === 1 ? c3 : hash2d(x, y, 136) > 0.5 ? c1 : c2;
          setPx(x, y, col[0], col[1], col[2]);
        }
      }
      break;
    }
    case 'stone_bricks': {
      paintStoneBase(137);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const mortar = y === 7 || y === 15 || (y < 8 ? x === 7 : x === 0 || x === 15);
          if (mortar) setPx(x, y, 74, 74, 78);
          else if (y === 0 || y === 8) setPx(x, y, 158, 158, 162);
        }
      }
      break;
    }
    case 'mossy_cobblestone': {
      paintNoise(['#7a7a7a', '#666666', '#8f8f8f', '#527834', '#3f6326'], 138);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const mortar = y === 0 || y === 5 || y === 10 || y === 15;
          if (mortar) setPx(x, y, 58, 72, 48);
        }
      }
      break;
    }
    case 'quartz_block': {
      paintMetalBlock(['#ede9e1', '#e6e1d8', '#f2efe8', '#dcd6ca'], '#ffffff', '#c7bfb2', 139);
      break;
    }
    case 'nether_bricks':
    case 'red_nether_bricks': {
      const pal =
        key === 'red_nether_bricks'
          ? ['#5c1218', '#4f0d13', '#6e1820']
          : ['#361b20', '#2b1418', '#422228'];
      paintNoise(pal, 140);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const mortar =
            y === 3 || y === 7 || y === 11 || y === 15 ||
            (Math.floor(y / 4) % 2 === 0 ? x === 7 || x === 15 : x === 3 || x === 11);
          if (mortar) setPx(x, y, 24, 12, 14);
        }
      }
      break;
    }
    case 'redstone_ore': {
      paintStoneBase(141);
      paintOreClusters('#cc1818', '#ff4d4d', 141);
      break;
    }
    case 'redstone_block': {
      paintMetalBlock(['#b81818', '#a31212', '#d42222', '#8f0e0e'], '#ff6666', '#630909', 142);
      break;
    }
    case 'emerald_ore': {
      paintStoneBase(143);
      paintOreClusters('#10b954', '#86efac', 143);
      break;
    }
    case 'emerald_block': {
      paintMetalBlock(['#18cc5a', '#12b84e', '#2ee070', '#0ea142'], '#a7f3d0', '#0a6e2d', 144);
      break;
    }
    case 'lapis_ore': {
      paintStoneBase(145);
      paintOreClusters('#1d44a8', '#60a5fa', 145);
      break;
    }
    case 'lapis_block': {
      paintMetalBlock(['#1e459e', '#173a8a', '#2b57ba', '#132e70'], '#60a5fa', '#0e2254', 146);
      break;
    }
    case 'coal_block': {
      paintNoise(['#1c1c20', '#141418', '#26262b', '#0f0f12'], 147);
      break;
    }
    case 'chest_top':
    case 'chest_side':
    case 'chest_front': {
      paintNoise(['#a87431', '#99682a', '#b57e38'], 148);
      for (let i = 0; i < 16; i++) {
        setHex(i, 0, '#472c10');
        setHex(i, 15, '#472c10');
        setHex(0, i, '#472c10');
        setHex(15, i, '#472c10');
      }
      if (key !== 'chest_top') {
        fillRect(1, 5, 14, 1, '#3b240c');
      }
      if (key === 'chest_front') {
        fillRect(7, 4, 2, 4, '#d4d4d8');
        fillRect(7, 6, 2, 1, '#52525b');
      }
      break;
    }
    case 'bookshelf': {
      fillRect(0, 0, 16, 16, '#9c7847');
      fillRect(0, 2, 16, 5, '#3b2a19');
      fillRect(0, 9, 16, 5, '#3b2a19');
      const bookCols = ['#b91c1c', '#1d4ed8', '#15803d', '#b45309', '#7e22ce', '#0f766e'];
      for (let x = 1; x < 15; x += 2) {
        fillRect(x, 2, 2, 5, bookCols[x % bookCols.length]);
        fillRect(x, 9, 2, 5, bookCols[(x + 3) % bookCols.length]);
        setHex(x, 3, '#fde68a');
        setHex(x, 10, '#f4f4f5');
      }
      break;
    }
    case 'bed_top': {
      fillRect(0, 0, 16, 16, '#b82525');
      fillRect(1, 1, 14, 5, '#f4f4f5');
      fillRect(1, 5, 14, 1, '#d4d4d8');
      break;
    }
    case 'bed_side': {
      fillRect(0, 0, 16, 9, '#b82525');
      fillRect(0, 9, 16, 4, '#9c7847');
      fillRect(0, 13, 3, 3, '#6b4d28');
      fillRect(13, 13, 3, 3, '#6b4d28');
      break;
    }
    case 'lantern': {
      for (let y = 5; y < 15; y++) for (let x = 5; x < 11; x++) setPx(x, y, 42, 46, 56);
      for (let y = 7; y < 13; y++) for (let x = 6; x < 10; x++) setPx(x, y, 255, 196, 64);
      fillRect(7, 3, 2, 2, '#484e5c');
      break;
    }
    case 'soul_torch': {
      for (let y = 6; y < 16; y++) {
        setPx(7, y, 134, 94, 48);
        setPx(8, y, 108, 72, 34);
      }
      setPx(7, 4, 125, 249, 255);
      setPx(8, 4, 45, 212, 191);
      setPx(7, 5, 20, 184, 166);
      setPx(8, 5, 165, 243, 252);
      break;
    }
    case 'campfire_top':
    case 'campfire_side': {
      paintNoise(['#4f341b', '#3d2714', '#634124'], 149);
      fillRect(4, 3, 8, 7, '#f97316');
      fillRect(6, 2, 4, 5, '#fde047');
      break;
    }
    case 'enchanting_table_top': {
      paintNoise(['#161024', '#1f1633', '#0d0917'], 150);
      fillRect(2, 2, 12, 12, '#991b1b');
      fillRect(4, 4, 8, 8, '#b91c1c');
      fillRect(6, 5, 4, 6, '#e5e7eb');
      break;
    }
    case 'enchanting_table_side': {
      paintNoise(['#161024', '#1f1633', '#0d0917'], 151);
      fillRect(0, 0, 16, 4, '#991b1b');
      fillRect(2, 2, 2, 2, '#38bdf8');
      fillRect(12, 2, 2, 2, '#38bdf8');
      break;
    }
    case 'anvil_top':
    case 'anvil_side': {
      paintMetalBlock(['#43434a', '#393940', '#505059'], '#6b6b75', '#222228', 152);
      break;
    }
    case 'hay_block_side': {
      paintNoise(['#cfa227', '#bd901e', '#deb335'], 153);
      fillRect(0, 4, 16, 2, '#a3261d');
      fillRect(0, 11, 16, 2, '#a3261d');
      break;
    }
    case 'hay_block_top': {
      paintNoise(['#cfa227', '#bd901e', '#deb335', '#a67b14'], 154);
      break;
    }
    case 'pumpkin_top': {
      paintNoise(['#d97718', '#c46812', '#e68622'], 155);
      fillRect(7, 7, 2, 2, '#5c4d26');
      break;
    }
    case 'pumpkin_side':
    case 'pumpkin_front':
    case 'jack_o_lantern_front': {
      for (let x = 0; x < 16; x++) {
        const hex = x % 4 === 0 ? '#a8530c' : x % 4 === 2 ? '#eb8b23' : '#d67415';
        for (let y = 0; y < 16; y++) setHex(x, y, hex);
      }
      if (key === 'pumpkin_front' || key === 'jack_o_lantern_front') {
        const faceCol = key === 'jack_o_lantern_front' ? '#fff08a' : '#261408';
        fillRect(3, 4, 3, 3, faceCol);
        fillRect(10, 4, 3, 3, faceCol);
        fillRect(7, 7, 2, 2, faceCol);
        fillRect(3, 11, 10, 2, faceCol);
      }
      break;
    }
    case 'melon_top': {
      paintNoise(['#7ba62b', '#628a20', '#92bd3c'], 156);
      fillRect(7, 7, 2, 2, '#4a6b18');
      break;
    }
    case 'melon_side': {
      for (let x = 0; x < 16; x++) {
        const hex = x % 4 === 0 ? '#4d7319' : '#85b332';
        for (let y = 0; y < 16; y++) setHex(x, y, hex);
      }
      break;
    }
    case 'wool_white': {
      paintNoise(['#ededed', '#e2e2e2', '#f5f5f5', '#d9d9d9'], 160);
      break;
    }
    case 'wool_red': {
      paintNoise(['#b52a24', '#a1221d', '#c7342e', '#941e19'], 161);
      break;
    }
    case 'wool_blue': {
      paintNoise(['#2e419e', '#26368a', '#384eb3', '#1f2d75'], 162);
      break;
    }
    case 'wool_yellow': {
      paintNoise(['#f2c929', '#e3ba1e', '#fad440', '#d1a817'], 163);
      break;
    }
    case 'wool_green': {
      paintNoise(['#50781f', '#446619', '#5e8a26', '#3a5915'], 164);
      break;
    }
    case 'wool_black': {
      paintNoise(['#1c1c21', '#141418', '#25252b', '#0e0e12'], 165);
      break;
    }
    case 'oak_fence': {
      fillRect(6, 0, 4, 16, '#a6824d');
      fillRect(0, 4, 16, 3, '#b49059');
      fillRect(0, 10, 16, 3, '#b49059');
      break;
    }
    case 'ladder': {
      fillRect(2, 0, 2, 16, '#8f6a3b');
      fillRect(12, 0, 2, 16, '#8f6a3b');
      for (const ry of [2, 6, 10, 14]) fillRect(2, ry, 12, 2, '#b58d55');
      break;
    }
    default: {
      const spec = EXT_TEXTURE_SPECS[key];
      if (!spec) {
        paintStoneBase(120);
        break;
      }
      let seed = 31;
      for (let i = 0; i < key.length; i++) seed = (seed * 33 + key.charCodeAt(i)) & 0xffff;
      const [br, bg, bb] = hexToRgb(spec.base);
      const [ar, ag, ab] = hexToRgb(spec.accent);
      const [tr, tg, tb] = hexToRgb(spec.trim || spec.accent);
      const shadeHex = (r: number, g: number, b: number, delta: number) =>
        `#${[r + delta, g + delta, b + delta]
          .map((v) => clamp255(v).toString(16).padStart(2, '0'))
          .join('')}`;
      const darkBase = shadeHex(br, bg, bb, -26);
      const lightBase = shadeHex(br, bg, bb, 22);

      switch (spec.style) {
        case 'stone':
          paintNoise([spec.base, darkBase, lightBase, spec.accent], seed);
          for (let y = 0; y < 16; y += 4) {
            for (let x = 0; x < 16; x++) {
              if (hash2d(x, y, seed + 5) > 0.45) setHex(x, y, darkBase);
            }
          }
          if (spec.trim) {
            for (let i = 0; i < 16; i++) {
              setHex(i, 0, spec.trim);
              setHex(0, i, spec.trim);
              setHex(i, 15, darkBase);
              setHex(15, i, darkBase);
            }
          }
          break;
        case 'bricks':
          paintNoise([spec.base, lightBase, darkBase], seed);
          for (let y = 0; y < 16; y++) {
            if (y % 4 === 0) {
              fillRect(0, y, 16, 1, spec.accent);
            } else {
              const offset = Math.floor(y / 4) % 2 === 0 ? 0 : 4;
              for (let x = offset; x < 16; x += 8) setHex(x, y, spec.accent);
            }
          }
          break;
        case 'planks':
          paintNoise([spec.base, lightBase, darkBase], seed);
          for (const py of [0, 4, 8, 12]) fillRect(0, py, 16, 1, spec.accent);
          for (let row = 0; row < 4; row++) {
            const seamX = (row * 5 + 3) % 14 + 1;
            fillRect(seamX, row * 4, 1, 4, spec.accent);
          }
          break;
        case 'log':
          for (let x = 0; x < 16; x++) {
            const col = x % 3 === 0 ? spec.accent : x % 2 === 0 ? spec.base : darkBase;
            for (let y = 0; y < 16; y++) {
              const h = hash2d(x, y, seed);
              setHex(x, y, h > 0.78 ? lightBase : h < 0.22 ? darkBase : col);
            }
          }
          break;
        case 'log_top':
          fillRect(0, 0, 16, 16, spec.accent);
          fillRect(1, 1, 14, 14, spec.base);
          fillRect(3, 3, 10, 10, lightBase);
          fillRect(5, 5, 6, 6, spec.base);
          fillRect(7, 7, 2, 2, spec.accent);
          break;
        case 'wool':
          paintNoise([spec.base, lightBase, darkBase, spec.base], seed);
          for (let y = 0; y < 16; y += 2) {
            for (let x = (y / 2) % 2; x < 16; x += 2) {
              if (hash2d(x, y, seed + 9) > 0.55) setHex(x, y, lightBase);
            }
          }
          break;
        case 'glass':
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const border = x === 0 || x === 15 || y === 0 || y === 15;
              const innerBorder = x === 1 || x === 14 || y === 1 || y === 14;
              if (border) setPx(x, y, br, bg, bb, 235);
              else if (innerBorder) setPx(x, y, ar, ag, ab, 150);
              else setPx(x, y, br, bg, bb, 72);
            }
          }
          setPx(3, 3, ar, ag, ab, 210);
          setPx(4, 3, ar, ag, ab, 210);
          setPx(3, 4, ar, ag, ab, 210);
          setPx(11, 12, ar, ag, ab, 180);
          setPx(12, 11, ar, ag, ab, 180);
          break;
        case 'terracotta':
          paintNoise([spec.base, shadeHex(br, bg, bb, -12), shadeHex(br, bg, bb, 10)], seed);
          if (key.includes('glazed')) {
            fillRect(2, 2, 12, 12, spec.accent);
            fillRect(4, 4, 8, 8, spec.base);
            fillRect(6, 6, 4, 4, spec.trim || lightBase);
          }
          break;
        case 'concrete':
          paintNoise([spec.base, shadeHex(br, bg, bb, -6), shadeHex(br, bg, bb, 6)], seed);
          break;
        case 'powder':
          paintNoise([spec.base, lightBase, darkBase, spec.accent], seed);
          break;
        case 'station':
          paintNoise([spec.base, darkBase, lightBase], seed);
          for (let i = 0; i < 16; i++) {
            setHex(i, 0, spec.accent);
            setHex(i, 15, spec.accent);
            setHex(0, i, spec.accent);
            setHex(15, i, spec.accent);
          }
          fillRect(3, 3, 10, 10, darkBase);
          fillRect(4, 4, 8, 8, spec.trim || spec.accent);
          fillRect(6, 6, 4, 4, spec.base);
          break;
        case 'redstone':
          paintNoise([spec.base, darkBase, lightBase], seed);
          for (let i = 0; i < 16; i++) {
            setHex(i, 0, darkBase);
            setHex(i, 15, darkBase);
            setHex(0, i, darkBase);
            setHex(15, i, darkBase);
          }
          fillRect(5, 5, 6, 6, spec.accent);
          fillRect(7, 2, 2, 12, spec.trim || '#dc2626');
          fillRect(2, 7, 12, 2, spec.trim || '#dc2626');
          break;
        case 'ore':
          paintStoneBase(seed);
          paintOreClusters(spec.base, spec.accent, seed + 7);
          break;
        case 'metal':
          paintMetalBlock([spec.base, lightBase, darkBase], lightBase, darkBase, seed);
          if (spec.trim) fillRect(4, 4, 8, 8, spec.trim);
          break;
        case 'pillar':
          for (let x = 0; x < 16; x++) {
            const col = x % 4 === 0 ? darkBase : x % 4 === 2 ? lightBase : spec.base;
            for (let y = 0; y < 16; y++) setHex(x, y, col);
          }
          fillRect(0, 0, 16, 2, spec.accent);
          fillRect(0, 14, 16, 2, spec.accent);
          break;
        case 'plant':
          for (let y = 2; y < 16; y++) {
            const sway = Math.round(Math.sin(y * 0.6 + seed) * 1.4);
            setPx(7 + sway, y, br, bg, bb, 255);
            setPx(8 + sway, y, ar, ag, ab, 255);
            if (y % 3 === 0) {
              setPx(5 + sway, y, br, bg, bb, 255);
              setPx(10 + sway, y, ar, ag, ab, 255);
            }
          }
          fillRect(5, 2, 6, 4, spec.trim || spec.accent);
          break;
        case 'flat':
        default: {
          if (key.includes('rail')) {
            fillRect(2, 0, 2, 16, spec.base);
            fillRect(12, 0, 2, 16, spec.base);
            for (const ry of [2, 6, 10, 14]) fillRect(1, ry, 14, 2, spec.accent);
            if (spec.trim) fillRect(6, 0, 4, 16, spec.trim);
          } else if (key.includes('torch') || key.includes('rod') || key.includes('chain') || key.includes('lever')) {
            fillRect(7, 4, 2, 12, spec.base);
            fillRect(6, 2, 4, 4, spec.accent);
            if (spec.trim) fillRect(7, 3, 2, 2, spec.trim);
          } else if (key.includes('carpet') || key.includes('pressure_plate') || key.includes('slab')) {
            paintNoise([spec.base, lightBase, darkBase], seed);
            for (let y = 0; y < 8; y++) {
              for (let x = 0; x < 16; x++) setPx(x, y, 0, 0, 0, 0);
            }
            fillRect(0, 8, 16, 1, spec.accent);
          } else if (key.includes('door') || key.includes('bars') || key.includes('pane')) {
            fillRect(2, 0, 12, 16, spec.base);
            fillRect(4, 2, 8, 5, spec.accent);
            fillRect(4, 9, 8, 5, darkBase);
            setPx(11, 8, tr, tg, tb, 255);
          } else {
            fillRect(3, 3, 10, 10, spec.base);
            fillRect(5, 5, 6, 6, spec.accent);
            if (spec.trim) fillRect(7, 7, 2, 2, spec.trim);
          }
          break;
        }
      }
      break;
    }
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

const FAITHFUL_32X_MIRRORS = [
  'https://cdn.jsdelivr.net/gh/Faithful-Resource-Pack/Faithful-32x-Java@java-latest/assets/minecraft/textures',
  'https://raw.githubusercontent.com/Faithful-Resource-Pack/Faithful-32x-Java/java-latest/assets/minecraft/textures',
];

const OFFICIAL_MC116_MIRRORS = [
  'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@26.3/assets/minecraft/textures',
  'https://assets.mcasset.cloud/1.21.11/assets/minecraft/textures',
  'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.3/assets/minecraft/textures',
];

// Legacy 1.16.5/1.19 GUI atlas mirrors for widgets.png, icons.png, options_background.png & map_icons.png (split into sprites in 1.20.2+)
const LEGACY_FAITHFUL_GUI_MIRROR =
  'https://cdn.jsdelivr.net/gh/Faithful-Resource-Pack/Faithful-32x-Java@1.16.5/assets/minecraft/textures';
const LEGACY_OFFICIAL_GUI_MIRROR =
  'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.16.5/assets/minecraft/textures';

const FAITHFUL_CACHE_ID = 'faithful_32x_hd_plus_26_3_v1';
const FAITHFUL_CACHE_VERSION = '26.3-faithful32-hdplus-v1';

const ORIGINAL_CACHE_ID = 'original_mc26_3_cache_v1';
const ORIGINAL_CACHE_VERSION = '26.3-official-v1';

// Map internal texture keys to exact official Minecraft Java Edition 1.16.5 block filenames
function mapKeyToOfficialMc116Block(key: string): string {
  const exactMap: Record<string, string> = {
    wool_white: 'white_wool',
    wool_red: 'red_wool',
    wool_blue: 'blue_wool',
    wool_yellow: 'yellow_wool',
    wool_green: 'green_wool',
    wool_black: 'black_wool',
    bed_top: 'red_wool',
    bed_side: 'red_wool',
    chest_top: 'oak_planks',
    chest_side: 'oak_planks',
    chest_front: 'barrel_side',
    campfire_top: 'campfire_log_lit',
    campfire_side: 'campfire_log',
    soul_campfire: 'soul_campfire_log_lit',
    anvil_side: 'anvil',
    pumpkin_front: 'carved_pumpkin',
    jack_o_lantern_front: 'jack_o_lantern',
    magma: 'magma',
    blast_furnace: 'blast_furnace_front',
    smoker: 'smoker_front',
    stonecutter: 'stonecutter_side',
    loom: 'loom_front',
    cartography_table: 'cartography_table_top',
    fletching_table: 'fletching_table_front',
    grindstone: 'grindstone_side',
    lectern: 'lectern_front',
    composter: 'composter_side',
    barrel: 'barrel_side',
    dispenser: 'dispenser_front',
    dropper: 'dropper_front',
    observer: 'observer_front',
    piston: 'piston_side',
    sticky_piston: 'piston_top_sticky',
    target: 'target_side',
    jukebox: 'jukebox_side',
    bell: 'gold_block',
    lodestone: 'lodestone_side',
    ender_chest: 'obsidian',
    bee_nest: 'bee_nest_front',
    beehive: 'beehive_front',
    dried_kelp_block: 'dried_kelp_side',
    polished_basalt: 'polished_basalt_side',
    smooth_stone_slab: 'smooth_stone_slab_side',
    stone_slab: 'stone',
    stone_stairs: 'stone',
    cobblestone_slab: 'cobblestone',
    cobblestone_stairs: 'cobblestone',
    cobblestone_wall: 'cobblestone',
    stone_brick_slab: 'stone_bricks',
    stone_brick_stairs: 'stone_bricks',
    stone_brick_wall: 'stone_bricks',
    oak_slab: 'oak_planks',
    oak_stairs: 'oak_planks',
    oak_fence: 'oak_planks',
    oak_fence_gate: 'oak_planks',
    oak_button: 'oak_planks',
    oak_pressure_plate: 'oak_planks',
    oak_sign: 'oak_planks',
    stone_button: 'stone',
    stone_pressure_plate: 'stone',
    heavy_weighted_pressure_plate: 'iron_block',
    light_weighted_pressure_plate: 'gold_block',
    daylight_detector: 'daylight_detector_top',
    scaffolding: 'scaffolding_side',
    cake: 'cake_side',
    glass_pane: 'glass',
    oak_door: 'oak_door_top',
    iron_door: 'iron_door_top',
    crimson_door: 'crimson_door_top',
    warped_door: 'warped_door_top',
    conduit: 'prismarine_bricks',
    hopper: 'hopper_outside',
    cauldron: 'cauldron_side',
    repeater: 'repeater',
    comparator: 'comparator',
    crimson_nylium: 'crimson_nylium',
    warped_nylium: 'warped_nylium',
    respawn_anchor_top: 'respawn_anchor_top',
    respawn_anchor_side: 'respawn_anchor_side4',
    beacon: 'beacon',
    quartz_block: 'quartz_block_side',
    sandstone: 'sandstone',
    red_sandstone: 'red_sandstone',
    smooth_sandstone: 'sandstone_top',
    smooth_red_sandstone: 'red_sandstone_top',
    chiseled_sandstone: 'chiseled_sandstone',
    cut_sandstone: 'cut_sandstone',
    tnt_top: 'tnt_top',
    tnt_side: 'tnt_side',
    bamboo: 'bamboo_stalk',
    redstone_lamp: 'redstone_lamp_on',
    podzol: 'podzol_side',
    mycelium: 'mycelium_side',
    farmland: 'farmland_moist',
    grass_path: 'grass_path_side',
    trapped_chest: 'barrel_side',
    weeping_vines: 'weeping_vines_plant',
    twisting_vines: 'twisting_vines_plant',
    mossy_stone_brick_wall: 'mossy_stone_bricks',
    nether_brick_wall: 'nether_bricks',
    blackstone_stairs: 'blackstone',
    blackstone_slab: 'blackstone',
    sunflower: 'sunflower_front',
    rose_bush: 'rose_bush_top',
    tall_grass: 'short_grass',
    wheat_crop: 'wheat_stage7',
    nether_wart_crop: 'nether_wart_stage2',
    sweet_berry_bush: 'sweet_berry_bush_stage3',
    sculk_catalyst: 'sculk_catalyst_top',
    ochre_froglight: 'ochre_froglight_side',
    verdant_froglight: 'verdant_froglight_side',
    pearlescent_froglight: 'pearlescent_froglight_side',
    chiseled_bookshelf: 'chiseled_bookshelf_occupied',
    copper_bulb: 'copper_bulb_lit',
    trial_spawner: 'trial_spawner_side_active',
    vault: 'vault_front_on',
    crafter: 'crafter_top',
    creaking_heart: 'creaking_heart_awake',
    dried_ghast: 'dried_ghast_hydration_0_north',
    pointed_dripstone: 'pointed_dripstone_up_tip',
    sculk_sensor: 'sculk_sensor_top',
    sculk_shrieker: 'sculk_shrieker_top',
    mangrove_roots: 'mangrove_roots_side',
    suspicious_sand: 'suspicious_sand_0',
    suspicious_gravel: 'suspicious_gravel_0',
    copper_door: 'copper_door_bottom',
    moss_carpet: 'moss_block',
  };
  if (exactMap[key]) return exactMap[key];
  if (key.endsWith('_carpet')) return key.replace('_carpet', '_wool');
  return key;
}

// Block items that have dedicated iconic 2D item/*.png sprites in Minecraft 1.16.5
const BLOCK_ITEM_SPRITES: Record<string, string> = {
  oak_door: 'item/oak_door',
  iron_door: 'item/iron_door',
  crimson_door: 'item/crimson_door',
  warped_door: 'item/warped_door',
  oak_sign: 'item/oak_sign',
  brewing_stand: 'item/brewing_stand',
  cauldron: 'item/cauldron',
  campfire: 'item/campfire',
  soul_campfire: 'item/soul_campfire',
  lantern: 'item/lantern',
  soul_lantern: 'item/soul_lantern',
  chain: 'item/chain',
  cake: 'item/cake',
  flower_pot: 'item/flower_pot',
  bell: 'item/bell',
  repeater: 'item/repeater',
  comparator: 'item/comparator',
  hopper: 'item/hopper',
  sugar_cane: 'item/sugar_cane',
  bamboo: 'item/bamboo',
  turtle_egg: 'item/turtle_egg',
};

// Map every non-block item ID in ITEM_DEFS to its exact official Minecraft 1.16.5 texture path
function mapItemIdToOfficialMc116Path(itemId: string): string | null {
  if (BLOCK_ITEM_SPRITES[itemId]) return BLOCK_ITEM_SPRITES[itemId];

  const def = ITEM_DEFS[itemId];
  if (!def || def.blockId !== undefined) return null;

  // Potions & banners are composited from base + tinted overlay separately
  // Note: Minecraft 1.21.5+ / 26.3 includes dedicated custom-illustrated item/*_spawn_egg.png textures!
  if (
    itemId.startsWith('potion_') ||
    itemId === 'water_bottle' ||
    itemId === 'awkward_potion' ||
    itemId.startsWith('splash_potion') ||
    itemId.startsWith('lingering_potion') ||
    itemId === 'tipped_arrow' ||
    itemId.endsWith('_banner')
  ) {
    return null;
  }

  const exactItemMap: Record<string, string> = {
    gold_helmet: 'item/golden_helmet',
    gold_chestplate: 'item/golden_chestplate',
    gold_leggings: 'item/golden_leggings',
    gold_boots: 'item/golden_boots',
    raw_porkchop: 'item/porkchop',
    raw_beef: 'item/beef',
    steak: 'item/cooked_beef',
    raw_chicken: 'item/chicken',
    raw_mutton: 'item/mutton',
    raw_rabbit: 'item/rabbit',
    raw_cod: 'item/cod',
    raw_salmon: 'item/salmon',
    enchanted_golden_apple: 'item/golden_apple',
    clock: 'item/clock_00',
    compass: 'item/compass_00',
    lodestone_compass: 'item/compass_00',
    recovery_compass: 'item/recovery_compass_00',
    crossbow: 'item/crossbow_standby',
    warped_fungus_on_a_stick: 'item/warped_fungus_on_a_stick',
    carrot_on_a_stick: 'item/carrot_on_a_stick',
    fishing_rod: 'item/fishing_rod',
    skull_banner_pattern: 'item/skull_banner_pattern',
    creeper_banner_pattern: 'item/creeper_banner_pattern',
    flower_banner_pattern: 'item/flower_banner_pattern',
    piglin_banner_pattern: 'item/piglin_banner_pattern',
    poppy: 'block/poppy',
    dandelion: 'block/dandelion',
    blue_orchid: 'block/blue_orchid',
    allium: 'block/allium',
    oxeye_daisy: 'block/oxeye_daisy',
    cornflower: 'block/cornflower',
    lily_of_the_valley: 'block/lily_of_the_valley',
    sunflower: 'block/sunflower_front',
    rose_bush: 'block/rose_bush_top',
    crimson_fungus: 'block/crimson_fungus',
    warped_fungus: 'block/warped_fungus',
    red_mushroom: 'block/red_mushroom',
    brown_mushroom: 'block/brown_mushroom',
    wither_rose: 'block/wither_rose',
    sweet_berries: 'item/sweet_berries',
    honeycomb: 'item/honeycomb',
    honey_bottle: 'item/honey_bottle',
    nether_wart: 'item/nether_wart',
    ender_eye: 'item/ender_eye',
    eye_of_ender: 'item/ender_eye',
    dragon_head: 'item/dragon_breath',
    wither_skeleton_skull: 'item/wither_rose',
    shield: 'item/iron_ingot', // skip shield fallback below
  };
  if (itemId === 'shield' || itemId === 'dragon_head' || itemId === 'wither_skeleton_skull') {
    return null; // Keep crisp custom icon for 3D entity items that have no 2D item PNG
  }
  if (exactItemMap[itemId]) return exactItemMap[itemId];
  return `item/${itemId}`;
}

async function fetchWithTimeout(url: string, timeoutMs = 3200): Promise<Blob | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { mode: 'cors', signal: controller.signal });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size > 40 ? blob : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function pickFastestMirror(mirrors: string[]): Promise<string | null> {
  try {
    return await Promise.any(
      mirrors.map(async (base) => {
        const probe = await fetchWithTimeout(`${base}/block/grass_block_top.png`, 3000);
        if (!probe) throw new Error('unreachable');
        return base;
      }),
    );
  } catch {
    return null;
  }
}

function blobToImg(blob: Blob): Promise<HTMLImageElement> {
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

// Multiply-tint a grayscale official Minecraft texture with authentic biome/material color
async function tintBlob(
  blob: Blob,
  hexColor: string,
  vibrancyBoost = false,
): Promise<Blob> {
  try {
    const img = await blobToImg(blob);
    const s = Math.min(img.width, img.height);
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, s, s, 0, 0, s, s);
    const imgData = ctx.getImageData(0, 0, s, s);
    const data = imgData.data;
    const [tr, tg, tb] = hexToRgb(hexColor);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      let r = (data[i] * tr) / 255;
      let g = (data[i + 1] * tg) / 255;
      let b = (data[i + 2] * tb) / 255;
      if (vibrancyBoost) {
        const avg = (r + g + b) / 3;
        r = clamp255(avg + (r - avg) * 1.14 + 3);
        g = clamp255(avg + (g - avg) * 1.14 + 3);
        b = clamp255(avg + (b - avg) * 1.14 + 3);
      }
      data[i] = clamp255(r);
      data[i + 1] = clamp255(g);
      data[i + 2] = clamp255(b);
    }
    ctx.putImageData(imgData, 0, 0);
    return await canvasToBlob(c);
  } catch {
    return blob;
  }
}

// Composite official grass_block_side.png + tinted grass_block_side_overlay.png
async function compositeGrassSide(
  baseBlob: Blob,
  overlayBlob: Blob,
  vibrancyBoost = false,
): Promise<Blob> {
  try {
    const [baseImg, overImg] = await Promise.all([blobToImg(baseBlob), blobToImg(overlayBlob)]);
    const s = Math.min(baseImg.width, baseImg.height);
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(baseImg, 0, 0, s, s, 0, 0, s, s);

    const oc = document.createElement('canvas');
    oc.width = s;
    oc.height = s;
    const octx = oc.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    octx.drawImage(overImg, 0, 0, s, s, 0, 0, s, s);
    const oData = octx.getImageData(0, 0, s, s);
    const [tr, tg, tb] = hexToRgb(vibrancyBoost ? '#82cf5f' : '#79c05a');
    for (let i = 0; i < oData.data.length; i += 4) {
      if (oData.data[i + 3] === 0) continue;
      oData.data[i] = Math.round((oData.data[i] * tr) / 255);
      oData.data[i + 1] = Math.round((oData.data[i + 1] * tg) / 255);
      oData.data[i + 2] = Math.round((oData.data[i + 2] * tb) / 255);
    }
    octx.putImageData(oData, 0, 0);
    ctx.drawImage(oc, 0, 0);
    return await canvasToBlob(c);
  } catch {
    return baseBlob;
  }
}

// Composite real Minecraft potion flask (potion.png) + liquid overlay (potion_overlay.png) tinted with potion color
async function compositeTwoLayerItem(
  baseBlob: Blob,
  overlayBlob: Blob,
  overlayHex: string,
  overlayFirst = true,
  baseHex?: string,
): Promise<Blob> {
  try {
    const [baseImg, overImg] = await Promise.all([blobToImg(baseBlob), blobToImg(overlayBlob)]);
    const s = Math.min(baseImg.width, baseImg.height);
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const tintLayer = (img: HTMLImageElement, hex?: string): HTMLCanvasElement => {
      const lc = document.createElement('canvas');
      lc.width = s;
      lc.height = s;
      const lctx = lc.getContext('2d')!;
      lctx.imageSmoothingEnabled = false;
      lctx.drawImage(img, 0, 0, s, s, 0, 0, s, s);
      if (hex) {
        const lData = lctx.getImageData(0, 0, s, s);
        const [tr, tg, tb] = hexToRgb(hex);
        for (let i = 0; i < lData.data.length; i += 4) {
          if (lData.data[i + 3] === 0) continue;
          lData.data[i] = Math.round((lData.data[i] * tr) / 255);
          lData.data[i + 1] = Math.round((lData.data[i + 1] * tg) / 255);
          lData.data[i + 2] = Math.round((lData.data[i + 2] * tb) / 255);
        }
        lctx.putImageData(lData, 0, 0);
      }
      return lc;
    };

    const bc = tintLayer(baseImg, baseHex);
    const oc = tintLayer(overImg, overlayHex);

    if (overlayFirst) {
      ctx.drawImage(oc, 0, 0);
      ctx.drawImage(bc, 0, 0);
    } else {
      ctx.drawImage(bc, 0, 0);
      ctx.drawImage(oc, 0, 0);
    }
    return await canvasToBlob(c);
  } catch {
    return baseBlob;
  }
}

// Add purple enchantment glint sheen to Enchanted Golden Apple
async function addEnchantGlintBlob(blob: Blob): Promise<Blob> {
  try {
    const img = await blobToImg(blob);
    const s = Math.min(img.width, img.height);
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, s, s, 0, 0, s, s);
    const imgData = ctx.getImageData(0, 0, s, s);
    const d = imgData.data;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        if (d[i + 3] === 0) continue;
        const band = ((x + y) % 8 < 3) ? 44 : 18;
        d[i] = clamp255(d[i] * 0.88 + band * 1.15);
        d[i + 1] = clamp255(d[i + 1] * 0.72 + band * 0.35);
        d[i + 2] = clamp255(d[i + 2] * 0.92 + band * 1.65);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return await canvasToBlob(c);
  } catch {
    return blob;
  }
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

// Crisp offline fallback for Minecraft map/map_background.png parchment frame
function paintFallbackMapBackgroundCanvas(): HTMLCanvasElement {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(s, s);
  const d = img.data;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const edge = Math.min(x, y, s - 1 - x, s - 1 - y);
      const n = (hash2d(x, y, 712) - 0.5) * 18;
      let r = 217;
      let g = 194;
      let b = 152;
      if (edge === 0) {
        r = 104;
        g = 78;
        b = 50;
      } else if (edge === 1) {
        r = 154;
        g = 123;
        b = 82;
      } else if (edge <= 3) {
        r = 196;
        g = 168;
        b = 122;
      } else if (edge === 4) {
        r = 168;
        g = 138;
        b = 96;
      }
      d[i] = clamp255(r + n);
      d[i + 1] = clamp255(g + n);
      d[i + 2] = clamp255(b + n);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

async function fetchDefaultGuiBlob(name: 'widgets' | 'icons' | 'options_background'): Promise<Blob | null> {
  try {
    const res = await fetch(`./packs/mc116-nether-pack/assets/minecraft/textures/gui/${name}.png`, {
      cache: 'force-cache',
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

async function downloadFullMinecraftPackFromMirrors(opts: {
  mirrors: string[];
  cacheId: string;
  version: string;
  sourceType: 'faithful-32x' | 'original-classic';
  onlineName: string;
  offlineName: string;
  onlineLabelPrefix: string;
  offlineLabel: string;
  hdPlusVibrancy: boolean;
  baseGuiBlobs?: Record<string, Blob>;
  forceRefresh?: boolean;
}): Promise<CachedResourcePack> {
  // 1. Instant return from persistent IndexedDB cache if already downloaded with full GUI + Map + Mob Entity assets!
  if (!opts.forceRefresh) {
    const existingCache = await loadResourcePackById(opts.cacheId);
    if (
      existingCache &&
      existingCache.version === opts.version &&
      Object.keys(existingCache.blockBlobs).length > 30 &&
      Object.keys(existingCache.itemBlobs || {}).length > 50 &&
      Object.keys(existingCache.entityBlobs || {}).length >= 8 &&
      Boolean(existingCache.guiBlobs.map_background) &&
      Boolean(existingCache.guiBlobs.container_inventory)
    ) {
      const promoted: CachedResourcePack = {
        ...existingCache,
        id: 'active_pack',
      };
      await saveResourcePack(promoted);
      return promoted;
    }
  }

  const blockBlobs: Record<string, Blob> = {};
  const itemBlobs: Record<string, Blob> = {};
  const entityBlobs: Record<string, Blob> = {};
  const guiBlobs: Record<string, Blob> = { ...(opts.baseGuiBlobs || {}) };
  let totalBytes = 0;

  // 2. Pick fastest CDN mirror
  const mirror = await pickFastestMirror(opts.mirrors);

  if (mirror) {
    // Collect unique block paths
    const blockNameToKeys = new Map<string, string[]>();
    for (const key of ALL_TEXTURE_KEYS) {
      const mcName = mapKeyToOfficialMc116Block(key);
      const list = blockNameToKeys.get(mcName);
      if (list) list.push(key);
      else blockNameToKeys.set(mcName, [key]);
    }

    // Collect unique item paths
    const itemPathToIds = new Map<string, string[]>();
    for (const item of Object.values(ITEM_DEFS)) {
      const relPath = mapItemIdToOfficialMc116Path(item.id);
      if (!relPath) continue;
      const list = itemPathToIds.get(relPath);
      if (list) list.push(item.id);
      else itemPathToIds.set(relPath, [item.id]);
    }

    // Build unified deduplicated fetch list: blocks + items + special overlay textures
    const uniqueRelPaths = new Set<string>();
    for (const bName of blockNameToKeys.keys()) uniqueRelPaths.add(`block/${bName}`);
    for (const iPath of itemPathToIds.keys()) uniqueRelPaths.add(iPath);
    uniqueRelPaths.add('block/grass_block_side_overlay');
    uniqueRelPaths.add('item/potion');
    uniqueRelPaths.add('item/splash_potion');
    uniqueRelPaths.add('item/lingering_potion');
    uniqueRelPaths.add('item/potion_overlay');
    uniqueRelPaths.add('item/tipped_arrow_base');
    uniqueRelPaths.add('item/tipped_arrow_head');
    uniqueRelPaths.add('item/spawn_egg');
    uniqueRelPaths.add('item/spawn_egg_overlay');

    const fetchedByPath = new Map<string, Blob>();
    const pathList = Array.from(uniqueRelPaths);

    // High-concurrency parallel fetch over HTTP/2 (batches of 36)
    const BATCH = 36;
    for (let i = 0; i < pathList.length; i += BATCH) {
      const slice = pathList.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (relPath) => {
          const blob = await fetchWithTimeout(`${mirror}/${relPath}.png`, 3000);
          if (blob) fetchedByPath.set(relPath, blob);
        }),
      );
    }

    // --- Biome-tint grayscale blocks ---
    const tintedBlocks = new Map<string, Blob>();
    const tintTargets: [string, string][] = [
      ['grass_block_top', opts.hdPlusVibrancy ? '#82cf5f' : '#79c05a'],
      ['oak_leaves', opts.hdPlusVibrancy ? '#5fb835' : '#59ae30'],
      ['vine', opts.hdPlusVibrancy ? '#5fb835' : '#59ae30'],
      ['lily_pad', '#4ea832'],
      ['sugar_cane', '#79c05a'],
      ['water_still', opts.hdPlusVibrancy ? '#3a7df0' : '#3f76e4'],
    ];
    await Promise.all(
      tintTargets.map(async ([name, hex]) => {
        const raw = fetchedByPath.get(`block/${name}`);
        if (raw) tintedBlocks.set(name, await tintBlob(raw, hex, opts.hdPlusVibrancy));
      }),
    );

    const rawGrassSide = fetchedByPath.get('block/grass_block_side');
    const grassOverlay = fetchedByPath.get('block/grass_block_side_overlay');
    if (rawGrassSide && grassOverlay) {
      tintedBlocks.set(
        'grass_block_side',
        await compositeGrassSide(rawGrassSide, grassOverlay, opts.hdPlusVibrancy),
      );
    }

    for (const [mcName, keys] of blockNameToKeys.entries()) {
      const finalBlob = tintedBlocks.get(mcName) || fetchedByPath.get(`block/${mcName}`);
      if (!finalBlob) continue;
      totalBytes += finalBlob.size;
      for (const key of keys) blockBlobs[key] = finalBlob;
    }

    // --- Map fetched item blobs + tint leather armor & enchanted golden apple ---
    const leatherIds = [
      'leather_helmet',
      'leather_chestplate',
      'leather_leggings',
      'leather_boots',
      'leather_horse_armor',
    ];
    const specialItems = new Map<string, Blob>();
    await Promise.all([
      ...leatherIds.map(async (lid) => {
        const raw = fetchedByPath.get(`item/${lid}`);
        if (raw) specialItems.set(lid, await tintBlob(raw, '#a06540', opts.hdPlusVibrancy));
      }),
      (async () => {
        const gapple = fetchedByPath.get('item/golden_apple');
        if (gapple) specialItems.set('enchanted_golden_apple', await addEnchantGlintBlob(gapple));
      })(),
    ]);

    for (const [relPath, ids] of itemPathToIds.entries()) {
      const raw = fetchedByPath.get(relPath);
      if (!raw) continue;
      totalBytes += raw.size;
      for (const id of ids) {
        itemBlobs[id] = specialItems.get(id) || raw;
      }
    }

    // --- Composite ALL Potions, Splash Potions, Lingering Potions & Tipped Arrow ---
    const potionBase = fetchedByPath.get('item/potion');
    const splashBase = fetchedByPath.get('item/splash_potion') || potionBase;
    const lingerBase = fetchedByPath.get('item/lingering_potion') || potionBase;
    const potionOverlay = fetchedByPath.get('item/potion_overlay');
    if (potionBase && potionOverlay) {
      const potionItems = Object.values(ITEM_DEFS).filter(
        (it) =>
          it.id.startsWith('potion_') ||
          it.id === 'water_bottle' ||
          it.id === 'awkward_potion' ||
          it.id.startsWith('splash_potion') ||
          it.id.startsWith('lingering_potion'),
      );
      await Promise.all(
        potionItems.map(async (it) => {
          const flask =
            it.id.startsWith('splash_potion')
              ? splashBase!
              : it.id.startsWith('lingering_potion')
                ? lingerBase!
                : potionBase;
          const comp = await compositeTwoLayerItem(
            flask,
            potionOverlay,
            it.iconColor || '#38bdf8',
            true,
          );
          itemBlobs[it.id] = comp;
          totalBytes += comp.size;
        }),
      );
    }

    // --- Fallback Spawn Egg compositing only if custom 26.3 spawn_egg PNG wasn't fetched ---
    const eggBase = fetchedByPath.get('item/spawn_egg');
    const eggOverlay = fetchedByPath.get('item/spawn_egg_overlay');
    if (eggBase && eggOverlay) {
      const eggItems = Object.values(ITEM_DEFS).filter((it) => it.id.endsWith('_spawn_egg') && !itemBlobs[it.id]);
      await Promise.all(
        eggItems.map(async (it) => {
          const comp = await compositeTwoLayerItem(
            eggBase,
            eggOverlay,
            it.iconAccent || '#ffffff',
            false,
            it.iconColor || '#9ca3af',
          );
          itemBlobs[it.id] = comp;
          totalBytes += comp.size;
        }),
      );
    }

    const tipBase = fetchedByPath.get('item/tipped_arrow_base');
    const tipHead = fetchedByPath.get('item/tipped_arrow_head');
    if (tipBase && tipHead) {
      const comp = await compositeTwoLayerItem(tipBase, tipHead, '#22c55e', false);
      itemBlobs['tipped_arrow'] = comp;
      totalBytes += comp.size;
    }

    // --- Official Resource Pack Mob Entity Textures (11 Mobs incl. Warden, Breeze, Creaking + Sheep Wool) ---
    const entityFetchMap: [string, string][] = [
      ['pig', 'entity/pig/pig.png'],
      ['sheep', 'entity/sheep/sheep.png'],
      ['sheep_fur', 'entity/sheep/sheep_fur.png'],
      ['zombie', 'entity/zombie/zombie.png'],
      ['creeper', 'entity/creeper/creeper.png'],
      ['piglin', 'entity/piglin/piglin.png'],
      ['zombified_piglin', 'entity/piglin/zombified_piglin.png'],
      ['strider', 'entity/strider/strider.png'],
      ['ghast', 'entity/ghast/ghast.png'],
      ['warden', 'entity/warden/warden.png'],
      ['breeze', 'entity/breeze/breeze.png'],
      ['creaking', 'entity/creaking/creaking.png'],
    ];

    // --- Official Resource Pack GUI, Container & Map sprites ---
    const guiFetchMap: [string, string][] = [
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
    const legacyGuiMirror =
      opts.sourceType === 'faithful-32x' ? LEGACY_FAITHFUL_GUI_MIRROR : LEGACY_OFFICIAL_GUI_MIRROR;
    await Promise.all([
      ...entityFetchMap.map(async ([eKey, relPath]) => {
        const blob = await fetchWithTimeout(`${mirror}/${relPath}`, 3000);
        if (blob) {
          entityBlobs[eKey] = blob;
          totalBytes += blob.size;
        }
      }),
      ...guiFetchMap.map(async ([gKey, relPath]) => {
        const blob =
          (await fetchWithTimeout(`${mirror}/${relPath}`, 2600)) ||
          (await fetchWithTimeout(`${legacyGuiMirror}/${relPath}`, 2600));
        if (blob) guiBlobs[gKey] = blob;
      }),
    ]);
  }

  // Ensure GUI & Map fallbacks always exist
  if (!guiBlobs.widgets) {
    const w = await fetchDefaultGuiBlob('widgets');
    if (w) guiBlobs.widgets = w;
  }
  if (!guiBlobs.icons) {
    const ic = await fetchDefaultGuiBlob('icons');
    if (ic) guiBlobs.icons = ic;
  }
  if (!guiBlobs.options_background) {
    guiBlobs.options_background = await canvasToBlob(paintClassicOptionsBgCanvas());
  }
  if (!guiBlobs.map_background) {
    guiBlobs.map_background = await canvasToBlob(paintFallbackMapBackgroundCanvas());
  }
  for (const b of Object.values(guiBlobs)) totalBytes += b.size;

  const blockCount = Object.keys(blockBlobs).length;
  const itemCount = Object.keys(itemBlobs).length;
  const entityCount = Object.keys(entityBlobs).length;
  const isOnlineReady = blockCount > 30;

  const cached: CachedResourcePack = {
    id: 'active_pack',
    name: isOnlineReady ? opts.onlineName : opts.offlineName,
    version: opts.version,
    sourceLabel: isOnlineReady
      ? `${opts.onlineLabelPrefix} (${blockCount} block · ${itemCount} vật phẩm · ${entityCount} mob)`
      : opts.offlineLabel,
    sourceType: opts.sourceType,
    downloadedAt: Date.now(),
    totalBytes,
    blockBlobs,
    itemBlobs,
    entityBlobs,
    guiBlobs,
  };

  await Promise.all([
    saveResourcePack(cached),
    isOnlineReady ? saveResourcePack({ ...cached, id: opts.cacheId }) : Promise.resolve(),
  ]);
  return cached;
}

/**
 * Official HD+ Resource Pack: Faithful 32x (Minecraft 1.16.5) with HD+ vibrancy,
 * full 32x32 blocks + 32x32 items + 32x32 potions + GUI + instant IndexedDB cache.
 */
export async function buildFaithfulHdPlusPack(
  baseGuiBlobs?: Record<string, Blob>,
  forceRefresh = false,
): Promise<CachedResourcePack> {
  return downloadFullMinecraftPackFromMirrors({
    mirrors: FAITHFUL_32X_MIRRORS,
    cacheId: FAITHFUL_CACHE_ID,
    version: FAITHFUL_CACHE_VERSION,
    sourceType: 'faithful-32x',
    onlineName: 'HD+ Faithful 32×32 (26.3 Mới Nhất)',
    offlineName: 'HD+ 32×32 (Ngoại Tuyến)',
    onlineLabelPrefix: 'Faithful 32x 26.3 HD+',
    offlineLabel: 'HD+ 32×32 (Chế độ ngoại tuyến)',
    hdPlusVibrancy: true,
    baseGuiBlobs,
    forceRefresh,
  });
}

/**
 * Official Minecraft Java 26.3 Vanilla Pack (full blocks + items + potions + mobs + GUI).
 */
export async function buildOriginalMinecraftPack(
  baseGuiBlobs?: Record<string, Blob>,
  forceRefresh = false,
): Promise<CachedResourcePack> {
  return downloadFullMinecraftPackFromMirrors({
    mirrors: OFFICIAL_MC116_MIRRORS,
    cacheId: ORIGINAL_CACHE_ID,
    version: ORIGINAL_CACHE_VERSION,
    sourceType: 'original-classic',
    onlineName: 'Minecraft 26.3 Chính Gốc (Vanilla)',
    offlineName: 'Minecraft 26.3 Chính Gốc (Ngoại Tuyến)',
    onlineLabelPrefix: 'Minecraft 26.3 Chính Gốc',
    offlineLabel: 'Texture 26.3 Chính Gốc (Chế độ ngoại tuyến)',
    hdPlusVibrancy: false,
    baseGuiBlobs,
    forceRefresh,
  });
}
