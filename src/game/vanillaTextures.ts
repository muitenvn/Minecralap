import { ALL_TEXTURE_KEYS } from './blocks';
import { saveResourcePack } from './storage';
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

// Complete, faithful 16x16 Minecraft 1.16 Classic Vanilla painter for all 72 block texture keys
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
    default: {
      paintStoneBase(120);
      break;
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

async function fetchDefaultGuiBlob(name: 'widgets' | 'icons'): Promise<Blob | null> {
  try {
    const res = await fetch(`./packs/mc116-nether-pack/assets/minecraft/textures/gui/${name}.png`, {
      cache: 'no-cache',
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
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
  if (!guiBlobs.widgets) {
    const w = await fetchDefaultGuiBlob('widgets');
    if (w) guiBlobs.widgets = w;
  }
  if (!guiBlobs.icons) {
    const ic = await fetchDefaultGuiBlob('icons');
    if (ic) guiBlobs.icons = ic;
  }
  const bgBlob = await canvasToBlob(paintClassicOptionsBgCanvas());
  guiBlobs.options_background = bgBlob;
  for (const b of Object.values(guiBlobs)) totalBytes += b.size;

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
