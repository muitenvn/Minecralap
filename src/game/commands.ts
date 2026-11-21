import { BLOCK_BY_KEY, ITEM_DEFS } from './blocks';
import { MobType } from './mobs';
import {
  Difficulty,
  DimensionId,
  EffectId,
  EnchantmentId,
  GameMode,
  GameRules,
  WeatherType,
  WORLD_BORDER_DEFAULT,
  WORLD_HEIGHT_MAX,
} from './types';
import { AnyBiome, BIOME_LABELS } from './worldGen';

export interface CommandContext {
  playerPos: [number, number, number];
  dimension: DimensionId;
  seed: number;
  cheatsEnabled: boolean;
  worldBorderRadius: number;
  gamerules: GameRules;
  teleport: (x: number, y: number, z: number) => void;
  setGameMode: (mode: GameMode) => void;
  setTime: (ticks: number) => void;
  addTime: (ticks: number) => void;
  getTime: () => number;
  setWeather: (weather: WeatherType) => void;
  giveItem: (itemId: string, count: number) => boolean;
  clearInventory: (itemId?: string) => number;
  setBlock: (x: number, y: number, z: number, blockId: number) => void;
  getBlock: (x: number, y: number, z: number) => number;
  summonMob: (type: MobType | 'lightning_bolt', x: number, y: number, z: number) => void;
  giveEffect: (id: EffectId, seconds: number, amplifier: number) => void;
  clearEffects: () => void;
  enchantHeld: (ench: EnchantmentId, level: number) => string;
  addXp: (amount: number, levels: boolean, setMode: boolean) => string;
  setDifficulty: (d: Difficulty) => void;
  setGameRule: (rule: keyof GameRules, val: boolean) => void;
  setSpawnPoint: (x: number, y: number, z: number, worldDefault: boolean) => void;
  setWorldBorder: (radius: number, center?: [number, number]) => void;
  locateBiome: (biome: AnyBiome) => [number, number] | null;
  killTarget: (selector: string) => string;
  showTitle: (kind: 'title' | 'subtitle' | 'actionbar', text: string) => void;
  playSound: (name: string) => void;
  switchDimension?: (dim: DimensionId) => void;
  reply: (text: string, tone?: 'system' | 'chat' | 'success' | 'error' | 'gold') => void;
}

export const ALL_COMMAND_NAMES = [
  '/tp',
  '/teleport',
  '/dimension',
  '/spawnpoint',
  '/setworldspawn',
  '/worldborder',
  '/seed',
  '/locate',
  '/locatebiome',
  '/gamemode',
  '/time',
  '/weather',
  '/difficulty',
  '/gamerule',
  '/setblock',
  '/fill',
  '/clone',
  '/give',
  '/clear',
  '/enchant',
  '/xp',
  '/experience',
  '/summon',
  '/effect',
  '/kill',
  '/title',
  '/playsound',
  '/say',
  '/me',
  '/help',
];

function parseCoord(token: string, base: number): number | null {
  if (!token) return null;
  if (token.startsWith('~')) {
    const delta = token.length === 1 ? 0 : Number(token.slice(1));
    return Number.isFinite(delta) ? base + delta : null;
  }
  const n = Number(token);
  return Number.isFinite(n) ? n : null;
}

const VALID_EFFECTS: EffectId[] = [
  'speed', 'slowness', 'haste', 'strength', 'jump_boost', 'regeneration',
  'resistance', 'fire_resistance', 'water_breathing', 'night_vision', 'levitation', 'slow_falling', 'darkness',
];

const VALID_ENCHANTS: EnchantmentId[] = [
  'efficiency', 'sharpness', 'unbreaking', 'protection', 'fortune', 'fire_aspect',
];

const VALID_MOBS: (MobType | 'lightning_bolt')[] = [
  'pig',
  'sheep',
  'zombie',
  'creeper',
  'piglin',
  'strider',
  'zombified_piglin',
  'ghast',
  'warden',
  'breeze',
  'creaking',
  'allay',
  'frog',
  'bogged',
  'happy_ghast',
  'copper_golem',
  'axolotl',
  'goat',
  'glow_squid',
  'tadpole',
  'sniffer',
  'camel',
  'armadillo',
  'ghastling',
  'nautilus',
  'zombie_nautilus',
  'camel_husk',
  'parched',
  'zombie_horse',
  'sulfur_cube',
  'cold_sulfur_cube',
  'frostbite',
  'ender_dragon',
  'lightning_bolt',
];

export function autocompleteCommand(input: string): string[] {
  const trimmed = input.trimStart();
  if (!trimmed.startsWith('/')) return [];
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return ALL_COMMAND_NAMES.filter((c) => c.startsWith(parts[0].toLowerCase())).slice(0, 8);
  }
  const cmd = parts[0].toLowerCase();
  const last = (parts[parts.length - 1] || '').toLowerCase();
  if (cmd === '/gamemode') return ['survival', 'creative', 'adventure', 'spectator'].filter((s) => s.startsWith(last));
  if (cmd === '/weather') return ['clear', 'rain', 'thunder'].filter((s) => s.startsWith(last));
  if (cmd === '/difficulty') return ['peaceful', 'easy', 'normal', 'hard'].filter((s) => s.startsWith(last));
  if (cmd === '/time') return ['set', 'add', 'query', 'day', 'noon', 'sunset', 'night', 'midnight'].filter((s) => s.startsWith(last));
  if (cmd === '/give') return Object.keys(ITEM_DEFS).filter((k) => k.startsWith(last)).slice(0, 8);
  if (cmd === '/setblock' || cmd === '/fill') return Object.keys(BLOCK_BY_KEY).filter((k) => k.startsWith(last)).slice(0, 8);
  if (cmd === '/summon') return VALID_MOBS.filter((m) => m.startsWith(last));
  if (cmd === '/effect') return ['give', 'clear', ...VALID_EFFECTS].filter((e) => e.startsWith(last)).slice(0, 8);
  if (cmd === '/enchant') return VALID_ENCHANTS.filter((e) => e.startsWith(last));
  if (cmd === '/gamerule') {
    return ['keepInventory', 'doDaylightCycle', 'doWeatherCycle', 'doMobSpawning', 'fallDamage', 'fireDamage', 'drowningDamage', 'naturalRegeneration']
      .filter((r) => r.toLowerCase().startsWith(last));
  }
  if (cmd === '/locatebiome') return Object.keys(BIOME_LABELS).filter((b) => b.startsWith(last));
  if (cmd === '/locate') return ['ruined_portal', 'trial_chamber', 'ancient_city', 'trail_ruins', 'stronghold', 'end_city'].filter((s) => s.startsWith(last));
  if (cmd === '/dimension') return ['overworld', 'nether', 'end'].filter((d) => d.startsWith(last));
  return [];
}

export function executeCommand(rawInput: string, ctx: CommandContext): void {
  const input = rawInput.trim();
  if (!input) return;

  if (!input.startsWith('/')) {
    ctx.reply(`<Người chơi> ${input}`, 'chat');
    return;
  }

  const parts = input.slice(1).split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Non-cheat informational commands
  if (cmd === 'help') {
    ctx.reply('=== 26 Lệnh Minecraft 26.3 Khả Dụng (nhấn Tab để gợi ý) ===', 'gold');
    ctx.reply('Thế giới: /tp, /spawnpoint, /setworldspawn, /worldborder, /seed, /locate, /locatebiome', 'system');
    ctx.reply('Luật chơi: /gamemode, /time, /weather, /difficulty, /gamerule', 'system');
    ctx.reply('Khối & Đồ: /setblock, /fill, /clone, /give, /clear, /enchant, /xp', 'system');
    ctx.reply('Thực thể: /summon, /effect, /kill, /title, /playsound, /say, /me', 'system');
    return;
  }

  if (cmd === 'seed') {
    ctx.reply(`Seed thế giới: [${ctx.seed}]`, 'success');
    return;
  }

  if (cmd === 'say') {
    ctx.reply(`[Người chơi] ${args.join(' ')}`, 'chat');
    return;
  }

  if (cmd === 'me') {
    ctx.reply(`* Người chơi ${args.join(' ')}`, 'chat');
    return;
  }

  if (!ctx.cheatsEnabled) {
    ctx.reply('Lệnh đã bị tắt trong thế giới này (bật Cheats khi tạo thế giới).', 'error');
    return;
  }

  const [px, py, pz] = ctx.playerPos;

  switch (cmd) {
    case 'tp':
    case 'teleport': {
      const cleanArgs = args[0] === '@s' || args[0] === '@p' ? args.slice(1) : args;
      if (cleanArgs.length < 3) {
        ctx.reply('Cú pháp: /tp <x> <y> <z> (hỗ trợ ~, ví dụ /tp 29999950 80 0)', 'error');
        return;
      }
      const tx = parseCoord(cleanArgs[0], px);
      const ty = parseCoord(cleanArgs[1], py);
      const tz = parseCoord(cleanArgs[2], pz);
      if (tx === null || ty === null || tz === null) {
        ctx.reply('Tọa độ không hợp lệ.', 'error');
        return;
      }
      const maxB = WORLD_BORDER_DEFAULT;
      const cx = Math.max(-maxB, Math.min(maxB, tx));
      const cy = Math.max(1, Math.min(WORLD_HEIGHT_MAX - 1, ty));
      const cz = Math.max(-maxB, Math.min(maxB, tz));
      ctx.teleport(cx, cy, cz);
      ctx.reply(`Đã dịch chuyển tới ${cx.toFixed(1)}, ${cy.toFixed(1)}, ${cz.toFixed(1)}`, 'success');
      return;
    }

    case 'gamemode': {
      const m = (args[0] || '').toLowerCase();
      const map: Record<string, GameMode> = {
        survival: 'survival', s: 'survival', '0': 'survival',
        creative: 'creative', c: 'creative', '1': 'creative',
        adventure: 'adventure', a: 'adventure', '2': 'adventure',
        spectator: 'spectator', sp: 'spectator', '3': 'spectator',
      };
      if (!map[m]) {
        ctx.reply('Cú pháp: /gamemode <survival|creative|adventure|spectator>', 'error');
        return;
      }
      ctx.setGameMode(map[m]);
      ctx.reply(`Đã đổi chế độ chơi sang ${map[m].toUpperCase()}`, 'success');
      return;
    }

    case 'time': {
      const sub = (args[0] || '').toLowerCase();
      const val = (args[1] || '').toLowerCase();
      const presets: Record<string, number> = { day: 1000, noon: 6000, sunset: 12000, night: 13500, midnight: 18000 };
      if (sub === 'query') {
        ctx.reply(`Thời gian hiện tại: ${Math.floor(ctx.getTime())} ticks`, 'system');
        return;
      }
      if (sub === 'set') {
        const ticks = presets[val] !== undefined ? presets[val] : Number(val);
        if (!Number.isFinite(ticks)) {
          ctx.reply('Cú pháp: /time set <day|noon|sunset|night|midnight|số>', 'error');
          return;
        }
        ctx.setTime(((ticks % 24000) + 24000) % 24000);
        ctx.reply(`Đã đặt thời gian thành ${ticks} ticks`, 'success');
        return;
      }
      if (sub === 'add') {
        const delta = Number(val);
        if (!Number.isFinite(delta)) {
          ctx.reply('Cú pháp: /time add <số ticks>', 'error');
          return;
        }
        ctx.addTime(delta);
        ctx.reply(`Đã cộng thêm ${delta} ticks`, 'success');
        return;
      }
      ctx.reply('Cú pháp: /time <set|add|query> <giá_trị>', 'error');
      return;
    }

    case 'weather': {
      const w = (args[0] || '').toLowerCase() as WeatherType;
      if (w !== 'clear' && w !== 'rain' && w !== 'thunder') {
        ctx.reply('Cú pháp: /weather <clear|rain|thunder>', 'error');
        return;
      }
      ctx.setWeather(w);
      ctx.reply(`Đã đổi thời tiết sang: ${w}`, 'success');
      return;
    }

    case 'give': {
      const cleanArgs = args[0]?.startsWith('@') ? args.slice(1) : args;
      const itemId = (cleanArgs[0] || '').replace(/^minecraft:/, '').toLowerCase();
      const count = Math.max(1, Math.min(640, parseInt(cleanArgs[1] || '1', 10) || 1));
      if (!ITEM_DEFS[itemId]) {
        ctx.reply(`Không tìm thấy vật phẩm "${itemId}". Ví dụ: netherite_ingot, ancient_debris, diamond_pickaxe, obsidian, flint_and_steel`, 'error');
        return;
      }
      ctx.giveItem(itemId, count);
      ctx.reply(`Đã trao ${count}x ${ITEM_DEFS[itemId].nameVi}`, 'success');
      return;
    }

    case 'clear': {
      const cleanArgs = args[0]?.startsWith('@') ? args.slice(1) : args;
      const itemId = cleanArgs[0]?.replace(/^minecraft:/, '').toLowerCase();
      const removed = ctx.clearInventory(itemId);
      ctx.reply(`Đã xóa ${removed} vật phẩm khỏi túi đồ.`, 'success');
      return;
    }

    case 'setblock': {
      if (args.length < 4) {
        ctx.reply('Cú pháp: /setblock <x> <y> <z> <tên_khối>', 'error');
        return;
      }
      const bx = parseCoord(args[0], Math.floor(px));
      const by = parseCoord(args[1], Math.floor(py));
      const bz = parseCoord(args[2], Math.floor(pz));
      const bKey = args[3].replace(/^minecraft:/, '').toLowerCase();
      const bDef = BLOCK_BY_KEY[bKey];
      if (bx === null || by === null || bz === null || !bDef) {
        ctx.reply(`Tọa độ hoặc khối "${bKey}" không hợp lệ.`, 'error');
        return;
      }
      ctx.setBlock(Math.floor(bx), Math.floor(by), Math.floor(bz), bDef.id);
      ctx.reply(`Đã đặt ${bDef.nameVi} tại (${Math.floor(bx)}, ${Math.floor(by)}, ${Math.floor(bz)})`, 'success');
      return;
    }

    case 'fill': {
      if (args.length < 7) {
        ctx.reply('Cú pháp: /fill <x1> <y1> <z1> <x2> <y2> <z2> <khối> [replace|hollow|outline]', 'error');
        return;
      }
      const x1 = parseCoord(args[0], Math.floor(px));
      const y1 = parseCoord(args[1], Math.floor(py));
      const z1 = parseCoord(args[2], Math.floor(pz));
      const x2 = parseCoord(args[3], Math.floor(px));
      const y2 = parseCoord(args[4], Math.floor(py));
      const z2 = parseCoord(args[5], Math.floor(pz));
      const bKey = args[6].replace(/^minecraft:/, '').toLowerCase();
      const mode = (args[7] || 'replace').toLowerCase();
      const bDef = BLOCK_BY_KEY[bKey];
      if ([x1, y1, z1, x2, y2, z2].some((v) => v === null) || !bDef) {
        ctx.reply('Tham số /fill không hợp lệ.', 'error');
        return;
      }
      const minX = Math.floor(Math.min(x1!, x2!)), maxX = Math.floor(Math.max(x1!, x2!));
      const minY = Math.max(0, Math.floor(Math.min(y1!, y2!))), maxY = Math.min(255, Math.floor(Math.max(y1!, y2!)));
      const minZ = Math.floor(Math.min(z1!, z2!)), maxZ = Math.floor(Math.max(z1!, z2!));
      const vol = (maxX - minX + 1) * (maxY - minY + 1) * (maxZ - minZ + 1);
      if (vol > 4096) {
        ctx.reply(`Vùng /fill quá lớn (${vol} khối). Giới hạn an toàn tối đa 4.096 khối/lần.`, 'error');
        return;
      }
      let placed = 0;
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          for (let z = minZ; z <= maxZ; z++) {
            const onShell = x === minX || x === maxX || y === minY || y === maxY || z === minZ || z === maxZ;
            if (mode === 'outline' && !onShell) continue;
            if (mode === 'hollow' && !onShell) {
              ctx.setBlock(x, y, z, 0);
            } else {
              ctx.setBlock(x, y, z, bDef.id);
            }
            placed++;
          }
        }
      }
      ctx.reply(`Đã điền ${placed} khối ${bDef.nameVi}.`, 'success');
      return;
    }

    case 'clone': {
      if (args.length < 9) {
        ctx.reply('Cú pháp: /clone <x1> <y1> <z1> <x2> <y2> <z2> <dx> <dy> <dz>', 'error');
        return;
      }
      const nums = args.slice(0, 9).map((t, i) => parseCoord(t, Math.floor(i % 3 === 0 ? px : i % 3 === 1 ? py : pz)));
      if (nums.some((n) => n === null)) {
        ctx.reply('Tọa độ /clone không hợp lệ.', 'error');
        return;
      }
      const [x1, y1, z1, x2, y2, z2, dx, dy, dz] = nums.map((n) => Math.floor(n!));
      const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      const minY = Math.max(0, Math.min(y1, y2)), maxY = Math.min(255, Math.max(y1, y2));
      const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);
      const vol = (maxX - minX + 1) * (maxY - minY + 1) * (maxZ - minZ + 1);
      if (vol > 4096) {
        ctx.reply(`Vùng /clone quá lớn (${vol} > 4.096 khối).`, 'error');
        return;
      }
      const snapshot: [number, number, number, number][] = [];
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          for (let z = minZ; z <= maxZ; z++) {
            snapshot.push([dx + (x - minX), dy + (y - minY), dz + (z - minZ), ctx.getBlock(x, y, z)]);
          }
        }
      }
      for (const [tx, ty, tz, bid] of snapshot) ctx.setBlock(tx, ty, tz, bid);
      ctx.reply(`Đã sao chép ${snapshot.length} khối tới (${dx}, ${dy}, ${dz}).`, 'success');
      return;
    }

    case 'summon': {
      const mType = (args[0] || '').replace(/^minecraft:/, '').toLowerCase() as MobType | 'lightning_bolt';
      if (!VALID_MOBS.includes(mType)) {
        ctx.reply(`Mob hỗ trợ: ${VALID_MOBS.join(', ')}`, 'error');
        return;
      }
      const sx = args[1] ? parseCoord(args[1], px) ?? px : px + 3;
      const sy = args[2] ? parseCoord(args[2], py) ?? py : py;
      const sz = args[3] ? parseCoord(args[3], pz) ?? pz : pz + 3;
      ctx.summonMob(mType, sx, sy, sz);
      ctx.reply(`Đã triệu hồi ${mType} tại (${sx.toFixed(1)}, ${sy.toFixed(1)}, ${sz.toFixed(1)})`, 'success');
      return;
    }

    case 'effect': {
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'clear') {
        ctx.clearEffects();
        ctx.reply('Đã xóa toàn bộ hiệu ứng thuốc.', 'success');
        return;
      }
      const clean = sub === 'give' ? args.slice(1) : args;
      const noTarget = clean[0]?.startsWith('@') ? clean.slice(1) : clean;
      const eff = (noTarget[0] || '').replace(/^minecraft:/, '').toLowerCase() as EffectId;
      if (!VALID_EFFECTS.includes(eff)) {
        ctx.reply(`Hiệu ứng hỗ trợ: ${VALID_EFFECTS.join(', ')}`, 'error');
        return;
      }
      const sec = Math.max(1, Math.min(3600, parseInt(noTarget[1] || '60', 10) || 60));
      const amp = Math.max(0, Math.min(4, parseInt(noTarget[2] || '0', 10) || 0));
      ctx.giveEffect(eff, sec, amp);
      ctx.reply(`Đã áp dụng ${eff} cấp ${amp + 1} trong ${sec}s`, 'success');
      return;
    }

    case 'enchant': {
      const clean = args[0]?.startsWith('@') ? args.slice(1) : args;
      const ench = (clean[0] || '').replace(/^minecraft:/, '').toLowerCase() as EnchantmentId;
      const lvl = Math.max(1, Math.min(5, parseInt(clean[1] || '1', 10) || 1));
      if (!VALID_ENCHANTS.includes(ench)) {
        ctx.reply(`Phù phép hỗ trợ: ${VALID_ENCHANTS.join(', ')}`, 'error');
        return;
      }
      const msg = ctx.enchantHeld(ench, lvl);
      ctx.reply(msg, msg.startsWith('Đã') ? 'gold' : 'error');
      return;
    }

    case 'xp':
    case 'experience': {
      const sub = (args[0] || '').toLowerCase();
      const clean = args[1]?.startsWith('@') ? [sub, ...args.slice(2)] : args;
      const op = clean[0]?.toLowerCase();
      if (op === 'query') {
        ctx.reply(ctx.addXp(0, false, false), 'system');
        return;
      }
      const amt = parseInt(clean[1] || '0', 10);
      const isLevels = (clean[2] || '').toLowerCase().startsWith('level');
      if ((op !== 'add' && op !== 'set') || !Number.isFinite(amt)) {
        ctx.reply('Cú pháp: /xp <add|set|query> <số> [points|levels]', 'error');
        return;
      }
      ctx.reply(ctx.addXp(amt, isLevels, op === 'set'), 'success');
      return;
    }

    case 'difficulty': {
      const d = (args[0] || '').toLowerCase() as Difficulty;
      if (!['peaceful', 'easy', 'normal', 'hard'].includes(d)) {
        ctx.reply('Cú pháp: /difficulty <peaceful|easy|normal|hard>', 'error');
        return;
      }
      ctx.setDifficulty(d);
      ctx.reply(`Đã đổi độ khó sang ${d.toUpperCase()}`, 'success');
      return;
    }

    case 'gamerule': {
      const key = args[0] as keyof GameRules;
      if (!(key in ctx.gamerules)) {
        ctx.reply(`Luật hỗ trợ: ${Object.keys(ctx.gamerules).join(', ')}`, 'error');
        return;
      }
      if (!args[1]) {
        ctx.reply(`gamerule ${key} = ${ctx.gamerules[key]}`, 'system');
        return;
      }
      const val = args[1].toLowerCase() === 'true';
      ctx.setGameRule(key, val);
      ctx.reply(`Đã đặt gamerule ${key} = ${val}`, 'success');
      return;
    }

    case 'spawnpoint':
    case 'setworldspawn': {
      const sx = args[0] ? parseCoord(args[0], px) ?? px : px;
      const sy = args[1] ? parseCoord(args[1], py) ?? py : py;
      const sz = args[2] ? parseCoord(args[2], pz) ?? pz : pz;
      const isWorld = cmd === 'setworldspawn';
      ctx.setSpawnPoint(sx, sy, sz, isWorld);
      ctx.reply(
        `Đã đặt ${isWorld ? 'điểm sinh thế giới' : 'điểm hồi sinh'} tại (${Math.floor(sx)}, ${Math.floor(sy)}, ${Math.floor(sz)})`,
        'success',
      );
      return;
    }

    case 'worldborder': {
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'get') {
        ctx.reply(`Bán kính World Border hiện tại: ±${ctx.worldBorderRadius.toLocaleString('vi-VN')} khối`, 'system');
        return;
      }
      if (sub === 'set') {
        const size = Number(args[1]);
        if (!Number.isFinite(size) || size < 16) {
          ctx.reply('Cú pháp: /worldborder set <bán_kính >= 16>', 'error');
          return;
        }
        const clamped = Math.min(WORLD_BORDER_DEFAULT, Math.floor(size));
        ctx.setWorldBorder(clamped);
        ctx.reply(`Đã đặt World Border thành ±${clamped.toLocaleString('vi-VN')} khối`, 'success');
        return;
      }
      if (sub === 'center' && args.length >= 3) {
        const cx = parseCoord(args[1], px);
        const cz = parseCoord(args[2], pz);
        if (cx !== null && cz !== null) {
          ctx.setWorldBorder(ctx.worldBorderRadius, [Math.floor(cx), Math.floor(cz)]);
          ctx.reply(`Đã chuyển tâm World Border về (${Math.floor(cx)}, ${Math.floor(cz)})`, 'success');
          return;
        }
      }
      ctx.reply('Cú pháp: /worldborder <get|set <kích_thước>|center <x> <z>>', 'error');
      return;
    }

    case 'dimension': {
      const dim = (args[0] || '').toLowerCase() as DimensionId;
      if (dim !== 'overworld' && dim !== 'nether' && dim !== 'end') {
        ctx.reply('Cú pháp: /dimension <overworld|nether|end>', 'error');
        return;
      }
      if (ctx.switchDimension) {
        ctx.switchDimension(dim);
        ctx.reply(`Đã dịch chuyển sang chiều không gian: ${dim.toUpperCase()}`, 'gold');
      }
      return;
    }

    case 'locate': {
      const target = (args[0] || '').toLowerCase();
      if (target.includes('trial')) {
        ctx.reply('Phòng Thử Thách (Trial Chamber 1.21) tại (39, 30, 7) — dùng /tp 39 30 7', 'gold');
      } else if (target.includes('ancient') || target.includes('deep')) {
        ctx.reply('Đền Cổ Deep Dark (Ancient City 1.19) tại (-25, 16, 7) — dùng /tp -25 16 7', 'gold');
      } else if (target.includes('ruin') && target.includes('trail')) {
        ctx.reply('Di Tích Khảo Cổ (Trail Ruins 1.20) tại (7, 72, 39) — dùng /tp 7 75 39', 'gold');
      } else if (target.includes('stronghold') || target.includes('end_portal')) {
        ctx.reply('Pháo Đài Cổng The End (Stronghold) tại (7, 26, -25) — dùng /tp 7 27 -29', 'gold');
      } else if (target.includes('end_city')) {
        ctx.reply('Thành Phố The End (End City Purpur) ở chiều The End tại (103, 64, 7) — dùng /tp 103 65 4', 'gold');
      } else if (target.includes('portal')) {
        ctx.reply('Tàn tích Cổng Nether tại (11, ~68, 10) ở Overworld!', 'gold');
      } else {
        ctx.reply('Cấu trúc: /locate <ruined_portal|trial_chamber|ancient_city|trail_ruins|stronghold|end_city>', 'system');
      }
      return;
    }

    case 'locatebiome': {
      const b = (args[0] || '').replace(/^minecraft:/, '').toLowerCase() as AnyBiome;
      if (!(b in BIOME_LABELS)) {
        ctx.reply(`Quần xã: ${Object.keys(BIOME_LABELS).join(', ')}`, 'error');
        return;
      }
      const found = ctx.locateBiome(b);
      if (!found) {
        ctx.reply(`Không tìm thấy ${BIOME_LABELS[b]} trong bán kính tìm kiếm ở chiều không gian hiện tại.`, 'error');
      } else {
        ctx.reply(`Tìm thấy ${BIOME_LABELS[b]} tại tọa độ (${found[0]}, ~, ${found[1]}) — dùng /tp ${found[0]} 75 ${found[1]}`, 'gold');
      }
      return;
    }

    case 'kill': {
      const msg = ctx.killTarget(args[0] || '@s');
      ctx.reply(msg, 'success');
      return;
    }

    case 'title': {
      const clean = args[0]?.startsWith('@') ? args.slice(1) : args;
      const kind = (clean[0] || '').toLowerCase();
      const text = clean.slice(1).join(' ');
      if ((kind !== 'title' && kind !== 'subtitle' && kind !== 'actionbar') || !text) {
        ctx.reply('Cú pháp: /title <title|subtitle|actionbar> <nội_dung>', 'error');
        return;
      }
      ctx.showTitle(kind, text);
      return;
    }

    case 'playsound': {
      const name = (args[0] || 'levelup').toLowerCase();
      ctx.playSound(name);
      ctx.reply(`Đã phát âm thanh: ${name}`, 'system');
      return;
    }

    default:
      ctx.reply(`Lệnh không tồn tại: /${cmd}. Gõ /help để xem toàn bộ 26 lệnh 1.16.`, 'error');
  }
}
