import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';

const OUT_DIR = path.resolve('public/packs/mc116-nether-pack');
const BLOCK_DIR = path.join(OUT_DIR, 'assets/minecraft/textures/block');
const GUI_DIR = path.join(OUT_DIR, 'assets/minecraft/textures/gui');

fs.mkdirSync(BLOCK_DIR, { recursive: true });
fs.mkdirSync(GUI_DIR, { recursive: true });

// Pure JS PNG encoder (RGBA Uint8Array -> PNG Buffer)
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function makeCanvas(w = 16, h = 16) {
  const data = new Uint8Array(w * h * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    data[i + 3] = Math.max(0, Math.min(255, Math.round(a)));
  };
  const fill = (r, g, b, a = 255) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, r, g, b, a);
  };
  const rect = (x0, y0, rw, rh, r, g, b, a = 255) => {
    for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) set(x, y, r, g, b, a);
  };
  const hex = (x, y, hexStr, a = 255) => {
    const v = parseInt(hexStr.replace('#', ''), 16);
    set(x, y, (v >> 16) & 255, (v >> 8) & 255, v & 255, a);
  };
  return { w, h, data, set, fill, rect, hex };
}

function hash2(x, y, seed) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function noisyTex(baseRgb, variance, seed, opts = {}) {
  const c = makeCanvas(16, 16);
  const [br, bg, bb] = baseRgb;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let n = (hash2(x, y, seed) - 0.5) * 2 * variance;
      if (opts.streakX) n += (hash2(Math.floor(x / 2), y, seed + 19) - 0.5) * variance * 0.9;
      if (opts.streakY) n += (hash2(x, Math.floor(y / 2), seed + 31) - 0.5) * variance * 0.9;
      if (opts.specks && hash2(x, y, seed + 77) > 0.86) {
        const [sr, sg, sb] = opts.specks;
        c.set(x, y, sr, sg, sb, opts.alpha ?? 255);
      } else {
        c.set(x, y, br + n, bg + n, bb + n, opts.alpha ?? 255);
      }
    }
  }
  return c;
}

function oreTex(baseRgb, oreRgb, oreHiRgb, seed) {
  const c = noisyTex(baseRgb, 16, seed, { streakX: true });
  const spots = [
    [3, 3], [4, 3], [4, 4], [10, 2], [11, 2], [11, 3],
    [6, 8], [7, 8], [7, 9], [8, 9],
    [2, 11], [3, 11], [3, 12], [12, 11], [13, 11], [12, 12], [11, 13]
  ];
  for (const [x, y] of spots) {
    const hi = hash2(x, y, seed + 5) > 0.5;
    const col = hi ? oreHiRgb : oreRgb;
    c.set(x, y, col[0], col[1], col[2]);
  }
  return c;
}

function plankTex(baseRgb, darkRgb, seed) {
  const c = noisyTex(baseRgb, 11, seed, { streakX: true });
  for (let x = 0; x < 16; x++) {
    for (const row of [0, 4, 8, 12]) {
      c.set(x, row, darkRgb[0], darkRgb[1], darkRgb[2]);
    }
  }
  for (const [vx, y0] of [[5, 0], [11, 4], [3, 8], [13, 12]]) {
    for (let dy = 0; dy < 4; dy++) c.set(vx, y0 + dy, darkRgb[0], darkRgb[1], darkRgb[2]);
  }
  return c;
}

function brickTex(brickRgb, mortarRgb, seed) {
  const c = noisyTex(brickRgb, 14, seed);
  for (let y = 0; y < 16; y++) {
    if (y % 4 === 0) {
      for (let x = 0; x < 16; x++) c.set(x, y, mortarRgb[0], mortarRgb[1], mortarRgb[2]);
    } else {
      const offset = (Math.floor(y / 4) % 2) * 4;
      for (let x = 0; x < 16; x++) {
        if ((x + offset) % 8 === 0) c.set(x, y, mortarRgb[0], mortarRgb[1], mortarRgb[2]);
      }
    }
  }
  return c;
}

function blockBorder(c, borderRgb, highlightRgb) {
  for (let i = 0; i < 16; i++) {
    c.set(i, 0, highlightRgb[0], highlightRgb[1], highlightRgb[2]);
    c.set(0, i, highlightRgb[0], highlightRgb[1], highlightRgb[2]);
    c.set(i, 15, borderRgb[0], borderRgb[1], borderRgb[2]);
    c.set(15, i, borderRgb[0], borderRgb[1], borderRgb[2]);
  }
  return c;
}

const blocks = {};

// --- OVERWORLD BLOCKS ---
blocks['grass_block_top'] = noisyTex([98, 166, 62], 22, 101, { specks: [122, 190, 78] });
blocks['dirt'] = noisyTex([134, 96, 67], 18, 102, { specks: [102, 71, 48] });
blocks['grass_block_side'] = (() => {
  const c = noisyTex([134, 96, 67], 18, 103, { specks: [102, 71, 48] });
  for (let x = 0; x < 16; x++) {
    const drop = 3 + Math.floor(hash2(x, 0, 104) * 4);
    for (let y = 0; y < drop; y++) {
      const v = (hash2(x, y, 105) - 0.5) * 26;
      c.set(x, y, 96 + v, 162 + v, 60 + v);
    }
  }
  return c;
})();
blocks['stone'] = noisyTex([126, 126, 126], 18, 106, { streakX: true });
blocks['cobblestone'] = (() => {
  const c = noisyTex([116, 116, 116], 24, 107);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if ((x % 5 === 0 && y % 4 !== 0) || (y % 4 === 0 && (x + y) % 3 !== 0)) {
        c.set(x, y, 76, 76, 76);
      }
    }
  }
  return c;
})();
blocks['bedrock'] = noisyTex([62, 62, 62], 38, 108, { specks: [24, 24, 24] });
blocks['sand'] = noisyTex([219, 207, 163], 12, 109, { specks: [200, 186, 140] });
blocks['gravel'] = noisyTex([131, 127, 126], 28, 110, { specks: [94, 90, 90] });
blocks['oak_log'] = (() => {
  const c = noisyTex([108, 84, 52], 14, 111, { streakY: true });
  for (let x = 0; x < 16; x += 3) {
    for (let y = 0; y < 16; y++) {
      if (hash2(x, y, 112) > 0.28) c.set(x, y, 76, 56, 33);
    }
  }
  return c;
})();
blocks['oak_log_top'] = (() => {
  const c = noisyTex([176, 144, 96], 12, 113);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      if (d > 6.4) c.set(x, y, 92, 68, 41);
      else if (Math.floor(d) % 2 === 1) c.set(x, y, 146, 116, 72);
    }
  }
  return c;
})();
blocks['oak_planks'] = plankTex([162, 130, 78], [116, 88, 49], 114);
blocks['oak_leaves'] = (() => {
  const c = makeCanvas(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const r = hash2(x, y, 115);
      if (r < 0.16) c.set(x, y, 0, 0, 0, 0);
      else if (r < 0.5) c.set(x, y, 52, 108, 38, 255);
      else if (r < 0.82) c.set(x, y, 74, 138, 52, 255);
      else c.set(x, y, 98, 164, 68, 255);
    }
  }
  return c;
})();
blocks['water_still'] = noisyTex([48, 116, 218], 16, 116, { streakX: true, alpha: 196 });
blocks['lava_still'] = (() => {
  const c = noisyTex([224, 92, 24], 26, 117, { specks: [255, 204, 64] });
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (hash2(Math.floor(x / 2), Math.floor(y / 2), 118) > 0.72) c.set(x, y, 252, 186, 48);
      else if (hash2(x, y, 119) < 0.14) c.set(x, y, 168, 42, 12);
    }
  }
  return c;
})();
blocks['coal_ore'] = oreTex([126, 126, 126], [36, 36, 38], [58, 58, 62], 120);
blocks['iron_ore'] = oreTex([126, 126, 126], [198, 164, 136], [228, 198, 174], 121);
blocks['gold_ore'] = oreTex([126, 126, 126], [234, 190, 42], [255, 232, 98], 122);
blocks['diamond_ore'] = oreTex([126, 126, 126], [62, 216, 224], [150, 248, 252], 123);
blocks['glass'] = (() => {
  const c = makeCanvas(16, 16);
  c.fill(210, 238, 248, 38);
  for (let i = 0; i < 16; i++) {
    c.set(i, 0, 180, 216, 230, 230);
    c.set(i, 15, 180, 216, 230, 230);
    c.set(0, i, 180, 216, 230, 230);
    c.set(15, i, 180, 216, 230, 230);
  }
  for (const [x, y] of [[3, 3], [4, 2], [2, 4], [11, 12], [12, 11]]) c.set(x, y, 255, 255, 255, 220);
  return c;
})();
blocks['snow'] = noisyTex([240, 246, 250], 7, 124);
blocks['ice'] = noisyTex([144, 196, 248], 16, 125, { streakX: true, alpha: 215 });
blocks['bricks'] = brickTex([154, 84, 72], [202, 196, 186], 126);
blocks['iron_block'] = blockBorder(noisyTex([218, 220, 222], 8, 127), [158, 160, 164], [244, 246, 248]);
blocks['gold_block'] = blockBorder(noisyTex([244, 206, 58], 12, 128), [184, 134, 22], [255, 240, 136]);
blocks['diamond_block'] = blockBorder(noisyTex([96, 226, 224], 14, 129), [46, 162, 174], [176, 252, 250]);
blocks['tnt_side'] = (() => {
  const c = noisyTex([196, 48, 36], 12, 130, { streakY: true });
  c.rect(0, 5, 16, 6, 232, 228, 222);
  // pixel TNT letters
  c.rect(2, 6, 3, 1, 32, 32, 32); c.rect(3, 7, 1, 3, 32, 32, 32);
  c.rect(6, 6, 1, 4, 32, 32, 32); c.rect(7, 7, 1, 1, 32, 32, 32); c.rect(8, 8, 1, 1, 32, 32, 32); c.rect(9, 6, 1, 4, 32, 32, 32);
  c.rect(11, 6, 3, 1, 32, 32, 32); c.rect(12, 7, 1, 3, 32, 32, 32);
  return c;
})();
blocks['tnt_top'] = blockBorder(noisyTex([152, 42, 34], 14, 131), [96, 24, 18], [216, 80, 62]);

// --- FUNCTIONAL BLOCKS (1.16) ---
blocks['crafting_table_top'] = (() => {
  const c = plankTex([158, 114, 68], [94, 62, 34], 132);
  for (let i = 1; i < 15; i++) {
    c.set(i, 5, 68, 44, 24); c.set(i, 10, 68, 44, 24);
    c.set(5, i, 68, 44, 24); c.set(10, i, 68, 44, 24);
  }
  return blockBorder(c, [66, 42, 22], [186, 144, 92]);
})();
blocks['crafting_table_side'] = (() => {
  const c = plankTex([144, 102, 58], [88, 58, 30], 133);
  c.rect(0, 0, 16, 4, 102, 68, 36);
  // saw & hammer silhouette
  c.rect(3, 6, 3, 6, 178, 184, 190);
  c.rect(10, 6, 4, 2, 164, 170, 178);
  c.rect(11, 8, 2, 5, 92, 62, 34);
  return c;
})();
blocks['furnace_side'] = brickTex([120, 120, 122], [82, 82, 84], 134);
blocks['furnace_top'] = blockBorder(noisyTex([128, 128, 130], 14, 135), [80, 80, 82], [164, 164, 166]);
blocks['furnace_front'] = (() => {
  const c = brickTex([120, 120, 122], [82, 82, 84], 136);
  c.rect(3, 3, 10, 4, 34, 34, 36);
  c.rect(3, 10, 10, 4, 42, 32, 28);
  c.rect(5, 11, 6, 2, 226, 118, 34);
  return c;
})();
blocks['smithing_table_top'] = (() => {
  const c = noisyTex([64, 68, 84], 12, 137);
  c.rect(2, 2, 12, 12, 52, 54, 68);
  c.rect(4, 5, 8, 3, 118, 124, 140);
  c.rect(6, 8, 4, 4, 96, 100, 114);
  return blockBorder(c, [34, 36, 46], [96, 102, 122]);
})();
blocks['smithing_table_side'] = (() => {
  const c = plankTex([76, 38, 44], [46, 20, 26], 138);
  c.rect(0, 0, 16, 4, 64, 68, 84);
  c.rect(3, 6, 4, 5, 140, 146, 160);
  c.rect(10, 6, 3, 6, 132, 138, 152);
  return c;
})();

// --- NETHER 1.16 BLOCKS ---
blocks['obsidian'] = noisyTex([26, 18, 42], 14, 201, { specks: [66, 42, 106] });
blocks['crying_obsidian'] = (() => {
  const c = noisyTex([32, 20, 52], 16, 202, { specks: [148, 62, 242] });
  for (const [x, y] of [[3, 4], [4, 4], [4, 5], [11, 2], [12, 3], [8, 9], [9, 10], [9, 11], [2, 12], [13, 12]]) {
    c.set(x, y, 188, 92, 255);
  }
  return c;
})();
blocks['nether_portal'] = (() => {
  const c = makeCanvas(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const swirl = Math.sin((x - 7.5) * 0.65 + (y - 7.5) * 0.65) * 0.5 + 0.5;
      c.set(x, y, 128 + swirl * 92, 34 + swirl * 44, 210 + swirl * 45, 205);
    }
  }
  return c;
})();
blocks['netherrack'] = noisyTex([116, 46, 44], 20, 203, { specks: [82, 28, 28] });
blocks['nether_quartz_ore'] = oreTex([116, 46, 44], [224, 216, 204], [248, 244, 236], 204);
blocks['nether_gold_ore'] = oreTex([116, 46, 44], [238, 184, 38], [255, 228, 92], 205);
blocks['glowstone'] = (() => {
  const c = noisyTex([218, 172, 82], 28, 206, { specks: [255, 242, 174] });
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (hash2(x, y, 207) < 0.18) c.set(x, y, 134, 88, 38);
  }
  return c;
})();

// Crimson Forest (1.16)
blocks['crimson_nylium'] = noisyTex([142, 36, 44], 22, 208, { specks: [186, 56, 62] });
blocks['crimson_nylium_side'] = (() => {
  const c = noisyTex([116, 46, 44], 18, 209, { specks: [82, 28, 28] });
  for (let x = 0; x < 16; x++) {
    const drop = 3 + Math.floor(hash2(x, 0, 210) * 4);
    for (let y = 0; y < drop; y++) c.set(x, y, 152 + (hash2(x, y, 211) - 0.5) * 32, 36, 46);
  }
  return c;
})();
blocks['crimson_stem'] = (() => {
  const c = noisyTex([106, 36, 58], 16, 212, { streakY: true });
  for (let x = 1; x < 16; x += 3) for (let y = 0; y < 16; y++) {
    if (hash2(x, y, 213) > 0.35) c.set(x, y, 152, 54, 78);
  }
  return c;
})();
blocks['crimson_stem_top'] = (() => {
  const c = noisyTex([126, 44, 66], 14, 214);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 6.3) c.set(x, y, 82, 24, 42);
    else if (Math.floor(d) % 2 === 0) c.set(x, y, 158, 56, 82);
  }
  return c;
})();
blocks['crimson_planks'] = plankTex([124, 52, 82], [82, 30, 52], 215);
blocks['nether_wart_block'] = noisyTex([124, 18, 22], 24, 216, { specks: [164, 30, 34] });

// Warped Forest (1.16)
blocks['warped_nylium'] = noisyTex([38, 128, 118], 22, 217, { specks: [58, 178, 162] });
blocks['warped_nylium_side'] = (() => {
  const c = noisyTex([116, 46, 44], 18, 218, { specks: [82, 28, 28] });
  for (let x = 0; x < 16; x++) {
    const drop = 3 + Math.floor(hash2(x, 0, 219) * 4);
    for (let y = 0; y < drop; y++) c.set(x, y, 36, 138 + (hash2(x, y, 220) - 0.5) * 32, 126);
  }
  return c;
})();
blocks['warped_stem'] = (() => {
  const c = noisyTex([44, 98, 98], 16, 221, { streakY: true });
  for (let x = 1; x < 16; x += 3) for (let y = 0; y < 16; y++) {
    if (hash2(x, y, 222) > 0.35) c.set(x, y, 64, 158, 148);
  }
  return c;
})();
blocks['warped_stem_top'] = (() => {
  const c = noisyTex([56, 124, 120], 14, 223);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 6.3) c.set(x, y, 30, 74, 76);
    else if (Math.floor(d) % 2 === 0) c.set(x, y, 76, 166, 156);
  }
  return c;
})();
blocks['warped_planks'] = plankTex([44, 114, 110], [28, 76, 74], 224);
blocks['warped_wart_block'] = noisyTex([22, 128, 126], 24, 225, { specks: [42, 174, 162] });
blocks['shroomlight'] = (() => {
  const c = noisyTex([244, 168, 66], 24, 226, { specks: [255, 228, 122] });
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (hash2(x, y, 227) < 0.16) c.set(x, y, 206, 98, 42);
  }
  return c;
})();

// Soul Sand Valley & Basalt Deltas & Netherite (1.16)
blocks['soul_sand'] = (() => {
  const c = noisyTex([84, 64, 52], 16, 228);
  // subtle haunting face hollows
  for (const [x, y] of [[3, 4], [5, 4], [4, 6], [10, 9], [12, 9], [11, 11], [11, 12]]) c.set(x, y, 48, 36, 28);
  return c;
})();
blocks['soul_soil'] = noisyTex([74, 58, 46], 16, 229, { streakX: true, specks: [54, 42, 34] });
blocks['soul_fire'] = (() => {
  const c = makeCanvas(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const h = (15 - y) / 15;
      const flame = Math.sin(x * 0.9) * 0.2 + hash2(x, y, 230) * 0.35;
      if (h + flame > 0.42) {
        c.set(x, y, 80 + (1 - h) * 120, 215 + (1 - h) * 35, 250, 235);
      } else {
        c.set(x, y, 0, 0, 0, 0);
      }
    }
  }
  return c;
})();
blocks['basalt_side'] = noisyTex([78, 78, 86], 18, 231, { streakY: true, specks: [52, 52, 60] });
blocks['basalt_top'] = (() => {
  const c = noisyTex([84, 84, 92], 16, 232);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 5.8 || d < 2.2) c.set(x, y, 56, 56, 64);
  }
  return c;
})();
blocks['blackstone'] = noisyTex([44, 40, 48], 16, 233, { specks: [66, 62, 74] });
blocks['polished_blackstone'] = blockBorder(noisyTex([56, 52, 62], 10, 234), [32, 30, 38], [78, 74, 88]);
blocks['gilded_blackstone'] = oreTex([44, 40, 48], [234, 186, 44], [255, 228, 96], 235);
blocks['magma'] = (() => {
  const c = noisyTex([56, 30, 24], 16, 236);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const r = hash2(x, y, 237);
    if (r > 0.78) c.set(x, y, 248, 152, 32);
    else if (r > 0.68) c.set(x, y, 188, 66, 18);
  }
  return c;
})();
blocks['bone_block_side'] = noisyTex([218, 214, 194], 12, 238, { streakY: true, specks: [188, 184, 166] });
blocks['bone_block_top'] = (() => {
  const c = noisyTex([224, 220, 202], 10, 239);
  c.rect(4, 4, 8, 8, 186, 180, 162);
  c.rect(6, 6, 4, 4, 152, 146, 130);
  return c;
})();
blocks['ancient_debris_side'] = (() => {
  const c = noisyTex([98, 72, 62], 16, 240, { streakX: true });
  c.rect(0, 4, 16, 2, 64, 46, 40);
  c.rect(0, 10, 16, 2, 64, 46, 40);
  for (let x = 2; x < 15; x += 4) {
    c.set(x, 6, 136, 104, 88);
    c.set(x + 1, 7, 136, 104, 88);
  }
  return c;
})();
blocks['ancient_debris_top'] = (() => {
  const c = noisyTex([94, 70, 60], 14, 241);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (Math.floor(d) % 2 === 1) c.set(x, y, 64, 46, 40);
    else if (d < 2) c.set(x, y, 138, 108, 92);
  }
  return c;
})();
blocks['netherite_block'] = blockBorder(noisyTex([66, 62, 68], 12, 242, { specks: [94, 88, 98] }), [40, 36, 42], [108, 100, 112]);
blocks['respawn_anchor_side'] = (() => {
  const c = noisyTex([34, 22, 54], 14, 243, { specks: [152, 66, 244] });
  c.rect(0, 0, 16, 3, 244, 198, 62);
  c.rect(2, 6, 12, 4, 168, 78, 252);
  return c;
})();
blocks['respawn_anchor_top'] = (() => {
  const c = noisyTex([32, 20, 50], 12, 244);
  c.rect(2, 2, 12, 12, 188, 92, 255);
  c.rect(5, 5, 6, 6, 248, 214, 96);
  return blockBorder(c, [20, 12, 34], [92, 56, 138]);
})();
blocks['soul_lantern'] = (() => {
  const c = makeCanvas(16, 16);
  c.fill(44, 52, 60, 255);
  c.rect(3, 3, 10, 10, 72, 228, 240);
  c.rect(5, 5, 6, 6, 180, 252, 255);
  return blockBorder(c, [26, 30, 36], [88, 96, 108]);
})();
blocks['torch'] = (() => {
  const c = makeCanvas(16, 16);
  c.fill(0, 0, 0, 0);
  c.rect(7, 6, 2, 10, 132, 92, 52);
  c.rect(6, 2, 4, 4, 255, 196, 52);
  c.rect(7, 3, 2, 2, 255, 246, 164);
  return c;
})();

// --- GUI SPRITES (Minecraft 1.16 layout) ---
// 1. options_background.png (16x16 dark dirt/blackstone tile)
const guiOptionsBg = noisyTex([56, 46, 42], 12, 301, { specks: [40, 32, 30] });

// 2. widgets.png (256x256):
//    (0,0)-(182,22): 9-slot hotbar bar
//    (0,22)-(24,46): active hotbar slot frame
//    (0,46)-(200,66): disabled stone button
//    (0,66)-(200,86): normal stone button
//    (0,86)-(200,106): hovered stone button
const guiWidgets = makeCanvas(256, 256);
// Hotbar background (182x22)
guiWidgets.rect(0, 0, 182, 22, 28, 28, 30, 220);
for (let i = 0; i < 9; i++) {
  const sx = 1 + i * 20;
  guiWidgets.rect(sx, 1, 20, 20, 62, 62, 66, 230);
  guiWidgets.rect(sx + 1, 2, 18, 18, 34, 34, 38, 190);
}
// Outer border of hotbar
guiWidgets.rect(0, 0, 182, 1, 14, 14, 16, 255);
guiWidgets.rect(0, 21, 182, 1, 14, 14, 16, 255);
// Active slot selector (24x24 at 0,22)
guiWidgets.rect(0, 22, 24, 24, 232, 232, 236, 255);
guiWidgets.rect(1, 23, 22, 22, 180, 180, 188, 255);
guiWidgets.rect(3, 25, 18, 18, 0, 0, 0, 0);

function drawGuiButton(y0, base, hi, lo, seed) {
  guiWidgets.rect(0, y0, 200, 20, 0, 0, 0, 255);
  for (let y = 1; y < 19; y++) {
    for (let x = 1; x < 199; x++) {
      const n = (hash2(x, y, seed) - 0.5) * 14;
      guiWidgets.set(x, y0 + y, base[0] + n, base[1] + n, base[2] + n, 255);
    }
  }
  guiWidgets.rect(1, y0 + 1, 198, 2, hi[0], hi[1], hi[2], 255);
  guiWidgets.rect(1, y0 + 1, 2, 18, hi[0], hi[1], hi[2], 255);
  guiWidgets.rect(1, y0 + 17, 198, 2, lo[0], lo[1], lo[2], 255);
  guiWidgets.rect(197, y0 + 1, 2, 18, lo[0], lo[1], lo[2], 255);
}
drawGuiButton(46, [66, 66, 68], [82, 82, 86], [42, 42, 44], 302);
drawGuiButton(66, [112, 112, 114], [164, 164, 168], [68, 68, 72], 303);
drawGuiButton(86, [120, 132, 174], [174, 186, 228], [66, 74, 110], 304);

// 3. icons.png (256x256) matching exact Minecraft 1.16 sprite UV coordinates:
//    (0,0,16,16) crosshair
//    (16,0,9,9) heart bg, (52,0,9,9) full heart, (61,0,9,9) half heart
//    (16,9,9,9) armor bg, (34,9,9,9) armor full, (25,9,9,9) armor half
//    (16,27,9,9) hunger bg, (52,27,9,9) hunger full, (61,27,9,9) hunger half
//    (16,18,9,9) bubble full
//    (0,64,182,5) xp bar bg, (0,69,182,5) xp bar fill
const guiIcons = makeCanvas(256, 256);
// Crosshair
guiIcons.rect(7, 3, 2, 10, 255, 255, 255, 255);
guiIcons.rect(3, 7, 10, 2, 255, 255, 255, 255);

function drawPixelMask(canvas, ox, oy, rows, palette) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (palette[ch]) {
        const [r, g, b, a = 255] = palette[ch];
        canvas.set(ox + x, oy + y, r, g, b, a);
      }
    }
  }
}

const HEART_MASK = [
  '.##...##.',
  '#XX#.#XX#',
  '#XXX#XXX#',
  '#XXXXXXX#',
  '#XXXXXXX#',
  '.#XXXXX#.',
  '..#XXX#..',
  '...#X#...',
  '....#....',
];
drawPixelMask(guiIcons, 16, 0, HEART_MASK, { '#': [22, 22, 22], 'X': [48, 36, 36] });
drawPixelMask(guiIcons, 52, 0, HEART_MASK, { '#': [22, 10, 10], 'X': [228, 38, 46] });
guiIcons.set(54, 2, 255, 168, 168); // highlight
const HALF_HEART_MASK = [
  '.##...##.',
  '#XX#.#..#',
  '#XXX#...#',
  '#XXXX...#',
  '#XXXX...#',
  '.#XXX..#.',
  '..#XX.#..',
  '...#X#...',
  '....#....',
];
drawPixelMask(guiIcons, 61, 0, HALF_HEART_MASK, { '#': [22, 10, 10], 'X': [228, 38, 46] });

const ARMOR_MASK = [
  '.##...##.',
  '#########',
  '##XXXXX##',
  '.#XXXXX#.',
  '.#XXXXX#.',
  '.#XXXXX#.',
  '.#XXXXX#.',
  '..#####..',
  '.........',
];
drawPixelMask(guiIcons, 16, 9, ARMOR_MASK, { '#': [24, 24, 28], 'X': [56, 56, 62] });
drawPixelMask(guiIcons, 34, 9, ARMOR_MASK, { '#': [28, 30, 36], 'X': [198, 206, 218] });
drawPixelMask(guiIcons, 25, 9, ARMOR_MASK, { '#': [28, 30, 36], 'X': [128, 134, 146] });

const FOOD_MASK = [
  '....###..',
  '...#XXX#.',
  '..#XXXX#.',
  '.#XXXX#..',
  '.#XXX#...',
  '..##B#...',
  '.#BB#....',
  '#B#......',
  '##.......',
];
drawPixelMask(guiIcons, 16, 27, FOOD_MASK, { '#': [28, 20, 14], 'X': [54, 42, 34], 'B': [74, 66, 58] });
drawPixelMask(guiIcons, 52, 27, FOOD_MASK, { '#': [36, 18, 10], 'X': [198, 114, 52], 'B': [236, 224, 198] });
drawPixelMask(guiIcons, 61, 27, FOOD_MASK, { '#': [36, 18, 10], 'X': [144, 78, 36], 'B': [236, 224, 198] });

const BUBBLE_MASK = [
  '..#####..',
  '.#WWXXX#.',
  '#WWXXXXX#',
  '#XXXXXXX#',
  '#XXXXXXX#',
  '#XXXXXXX#',
  '.#XXXXX#.',
  '..#####..',
  '.........',
];
drawPixelMask(guiIcons, 16, 18, BUBBLE_MASK, { '#': [26, 92, 174], 'X': [74, 176, 246], 'W': [214, 244, 255] });

// XP bar bg & fill
guiIcons.rect(0, 64, 182, 5, 16, 22, 16, 255);
guiIcons.rect(1, 65, 180, 3, 44, 58, 44, 255);
guiIcons.rect(0, 69, 182, 5, 38, 108, 30, 255);
guiIcons.rect(1, 70, 180, 3, 128, 232, 74, 255);
for (let x = 10; x < 180; x += 10) {
  guiIcons.rect(x, 65, 1, 3, 22, 30, 22, 255);
  guiIcons.rect(x, 70, 1, 3, 72, 166, 46, 255);
}

// Write all files and build manifest.json with real sizes + sha256 checksums
const filesList = [];

for (const [name, canvas] of Object.entries(blocks)) {
  const rel = `assets/minecraft/textures/block/${name}.png`;
  const buf = encodePNG(canvas.w, canvas.h, canvas.data);
  fs.writeFileSync(path.join(OUT_DIR, rel), buf);
  filesList.push({
    key: name,
    category: 'block',
    path: rel,
    bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16),
  });
}

const guiFiles = [
  ['options_background', guiOptionsBg],
  ['widgets', guiWidgets],
  ['icons', guiIcons],
];
for (const [name, canvas] of guiFiles) {
  const rel = `assets/minecraft/textures/gui/${name}.png`;
  const buf = encodePNG(canvas.w, canvas.h, canvas.data);
  fs.writeFileSync(path.join(OUT_DIR, rel), buf);
  filesList.push({
    key: name,
    category: 'gui',
    path: rel,
    bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16),
  });
}

const totalBytes = filesList.reduce((acc, f) => acc + f.bytes, 0);
const manifest = {
  id: 'mc116-nether-pack',
  name: 'Nether Update 1.16 Resource Pack',
  version: '1.16.5',
  pack_format: 6,
  description: 'Gói tài nguyên 16×16 Block + Giao diện UI chuẩn Minecraft 1.16 (Nether Update) tự lưu trữ cho GitHub Pages.',
  totalBytes,
  fileCount: filesList.length,
  files: filesList,
};

fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Generated ${filesList.length} PNG assets (${totalBytes} bytes) in ${OUT_DIR}`);
