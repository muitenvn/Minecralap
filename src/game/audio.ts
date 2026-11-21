import { SoundMaterial } from './blocks';
import { DimensionId } from './types';

// Official Minecraft Java 1.21.4 sound mirrors (GitHub InventivetalentDev/minecraft-assets)
const VANILLA_SOUND_MIRRORS = [
  'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/sounds',
  'https://assets.mcasset.cloud/1.21.4/assets/minecraft/sounds',
  'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.4/assets/minecraft/sounds',
];

const SOUND_CACHE_NAME = 'nethercraft-mc-sounds-1.21.4-v1';

const SOUND_VARIANTS = {
  click: ['random/click_stereo', 'random/click'],

  stone_break: ['dig/stone1', 'dig/stone2', 'dig/stone3', 'dig/stone4'],
  stone_step: ['step/stone1', 'step/stone2', 'step/stone3', 'step/stone4'],

  wood_break: ['dig/wood1', 'dig/wood2', 'dig/wood3', 'dig/wood4'],
  wood_step: ['step/wood1', 'step/wood2', 'step/wood3', 'step/wood4'],

  grass_break: ['dig/grass1', 'dig/grass2', 'dig/grass3', 'dig/grass4'],
  grass_step: ['step/grass1', 'step/grass2', 'step/grass3', 'step/grass4'],

  dirt_break: ['dig/gravel1', 'dig/gravel2', 'dig/gravel3', 'dig/gravel4'],
  dirt_step: ['step/gravel1', 'step/gravel2', 'step/gravel3', 'step/gravel4'],

  sand_break: ['dig/sand1', 'dig/sand2', 'dig/sand3', 'dig/sand4'],
  sand_step: ['step/sand1', 'step/sand2', 'step/sand3', 'step/sand4'],

  glass_break: ['random/glass1', 'random/glass2', 'random/glass3'],

  metal_break: ['block/copper/break1', 'block/copper/break2', 'block/copper/break3', 'block/copper/break4'],
  metal_step: ['block/copper/step1', 'block/copper/step2', 'block/copper/step3', 'block/copper/step4'],

  nether_break: ['block/netherrack/break1', 'block/netherrack/break2', 'block/netherrack/break3', 'block/netherrack/break4'],
  nether_step: ['block/netherrack/step1', 'block/netherrack/step2', 'block/netherrack/step3', 'block/netherrack/step4'],

  liquid_step: ['liquid/swim5', 'liquid/swim6', 'liquid/swim7', 'liquid/swim8'],
  splash: ['liquid/splash', 'liquid/splash2'],

  hurt: ['damage/hit1', 'damage/hit2', 'damage/hit3'],
  attack_strong: ['entity/player/attack/strong1', 'entity/player/attack/strong2'],
  attack_crit: ['entity/player/attack/crit1'],
  attack_sweep: ['entity/player/attack/sweep1'],

  eat: ['random/eat1', 'random/eat2', 'random/eat3'],
  drink: ['random/drink'],
  xp_orb: ['random/orb'],
  levelup: ['random/levelup'],
  bow: ['random/bow'],
  explode: ['random/explode1', 'random/explode2', 'random/explode3', 'random/explode4'],
  thunder: ['ambient/weather/thunder1', 'ambient/weather/thunder2', 'ambient/weather/thunder3'],
  portal: ['portal/travel'],
  end_portal: ['block/end_portal/endportal'],
  anvil: ['random/anvil_use'],
  shield: ['item/shield/block1', 'item/shield/block2', 'item/shield/block3'],
  firework_launch: ['fireworks/launch1'],
  firework_blast: ['fireworks/blast1'],
  totem: ['item/totem/use_totem'],
  mace_smash: ['item/mace/smash_ground_heavy'],
  wind_burst: ['entity/wind_charge/wind_burst1'],
  ignite: ['fire/ignite'],
  warden_heartbeat: ['mob/warden/heartbeat_1', 'mob/warden/heartbeat_2'],
  warden_roar: ['mob/warden/roar_1'],
  sculk_click: ['block/sculk_sensor/sculk_clicking1'],
  sculk_shriek: ['block/sculk_shrieker/shriek1'],
  dragon_growl: ['mob/enderdragon/growl1', 'mob/enderdragon/growl2'],
  dragon_death: ['mob/enderdragon/end'],
  camel_dash: ['mob/camel/dash1', 'mob/camel/dash2'],
  copper_scrape: ['item/axe/scrape1'],
  wax_on: ['item/honeycomb/wax_on1'],
  chest_open: ['block/chest/open'],
} as const;

const MUSIC_DISC_PATHS: Record<string, string> = {
  music_disc_pigstep: 'records/pigstep',
  music_disc_cat: 'records/cat',
  music_disc_blocks: 'records/blocks',
  music_disc_chirp: 'records/chirp',
  music_disc_stal: 'records/stal',
  music_disc_ward: 'records/ward',
  music_disc_wait: 'records/wait',
  music_disc_otherside: 'records/otherside',
  music_disc_creator: 'records/creator',
  music_disc_precipice: 'records/precipice',
  music_disc_flurry: 'records/precipice',
};

const DIMENSION_BGM: Record<DimensionId, string[]> = {
  overworld: ['music/game/clark', 'music/game/danny', 'music/game/sweden'],
  nether: ['music/game/nether/concrete_halls', 'music/game/nether/dead_voxel', 'music/game/nether/warmth'],
  end: ['music/game/end/the_end', 'music/game/end/boss'],
};

const CORE_PRELOAD_PATHS: string[] = [
  'random/click_stereo',
  'dig/stone1', 'dig/stone2', 'dig/stone3', 'dig/stone4',
  'step/stone1', 'step/stone2',
  'dig/wood1', 'dig/wood2', 'dig/wood3',
  'step/wood1', 'step/wood2',
  'dig/grass1', 'dig/grass2', 'dig/grass3',
  'step/grass1', 'step/grass2',
  'dig/gravel1', 'dig/gravel2',
  'step/gravel1', 'step/gravel2',
  'dig/sand1', 'dig/sand2',
  'step/sand1', 'step/sand2',
  'random/glass1', 'random/glass2',
  'block/copper/break1', 'block/copper/step1',
  'block/netherrack/break1', 'block/netherrack/step1',
  'liquid/swim5', 'liquid/splash',
  'damage/hit1', 'damage/hit2',
  'entity/player/attack/strong1', 'entity/player/attack/crit1',
  'random/eat1', 'random/eat2',
  'random/orb', 'random/levelup', 'random/bow',
  'random/explode1', 'ambient/weather/thunder1',
  'item/shield/block1', 'portal/travel',
];

function normalizeSoundPath(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\.(ogg|wav|mp3)$/i, '');
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.75;
  private muted = false;

  // Resource pack audio overrides (Tier 1: ZIP Blobs, Tier 2: Custom GitHub raw sounds root)
  private packSoundBlobs: Record<string, Blob> = {};
  private packSoundsRootUrl = '';
  private packRootMisses = new Set<string>();
  private packObjectUrls: string[] = [];

  // Decoded WebAudio buffer cache (keyed by "pack:<path>" or "vanilla:<path>")
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingMap = new Map<string, Promise<AudioBuffer | null>>();
  private failedPaths = new Set<string>();
  private oggUnsupported = false;

  // Variant anti-repeat tracking & preload guard
  private lastVariantIdx = new Map<string, number>();
  private corePreloaded = false;
  private stepCooldownAt = 0;

  // Streaming music disc + ambient dimension BGM
  private discAudio: HTMLAudioElement | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmTimer: number | null = null;
  private currentDimension: DimensionId | null = null;
  private bgmActive = false;
  private userUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockOnce = () => {
        this.userUnlocked = true;
        this.ensureCtx();
        if (this.bgmActive && this.currentDimension && !this.bgmAudio && !this.discAudio) {
          this.scheduleBgm(2500);
        }
      };
      window.addEventListener('pointerdown', unlockOnce, { passive: true });
      window.addEventListener('keydown', unlockOnce, { passive: true });
    }
  }

  setSettings(volume: number, muted: boolean): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    this.syncGains();
  }

  private syncGains(): void {
    const eff = this.muted ? 0 : this.volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(eff, this.ctx.currentTime, 0.015);
    }
    if (this.discAudio) {
      this.discAudio.volume = Math.min(1, eff * 0.55);
    }
    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.min(1, eff * 0.24);
    }
  }

  /**
   * Apply sounds bundled inside the active Resource Pack (ZIP Blobs or Custom GitHub root).
   * Any sound NOT provided by the Resource Pack automatically falls back to official Vanilla Minecraft sounds on GitHub.
   */
  setResourcePackSounds(
    soundBlobs?: Record<string, Blob>,
    soundsRootUrl?: string,
  ): void {
    // Clean up previous pack buffers and blob URLs
    for (const key of [...this.bufferCache.keys()]) {
      if (key.startsWith('pack:')) this.bufferCache.delete(key);
    }
    for (const key of [...this.loadingMap.keys()]) {
      if (key.startsWith('pack:')) this.loadingMap.delete(key);
    }
    for (const url of this.packObjectUrls) {
      URL.revokeObjectURL(url);
    }
    this.packObjectUrls = [];
    this.packRootMisses.clear();

    const normalized: Record<string, Blob> = {};
    if (soundBlobs) {
      for (const [k, blob] of Object.entries(soundBlobs)) {
        normalized[normalizeSoundPath(k)] = blob;
      }
      // Alias classic random/click <-> random/click_stereo so older resource packs override UI clicks
      if (normalized['random/click'] && !normalized['random/click_stereo']) {
        normalized['random/click_stereo'] = normalized['random/click'];
      } else if (normalized['random/click_stereo'] && !normalized['random/click']) {
        normalized['random/click'] = normalized['random/click_stereo'];
      }
    }
    this.packSoundBlobs = normalized;
    this.packSoundsRootUrl = (soundsRootUrl || '').trim().replace(/\/+$/, '');

    // Preload any newly overridden core sounds silently
    if (this.corePreloaded) {
      this.preloadCoreSounds(true);
    }
  }

  private ensureCtx(): AudioContext | null {
    if (this.muted || this.volume <= 0.001) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -10;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.12;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume;
        this.masterGain.connect(compressor);
        compressor.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureCtxEvenIfMuted(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -10;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.12;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume;
        this.masterGain.connect(compressor);
        compressor.connect(this.ctx.destination);
      }
    }
    return this.ctx;
  }

  preloadCoreSounds(force = false): void {
    if (this.corePreloaded && !force) return;
    this.corePreloaded = true;
    const ctx = this.ensureCtxEvenIfMuted();
    if (!ctx) return;

    // Staggered batches of 6 so we never saturate bandwidth while loading chunks
    const paths = [...CORE_PRELOAD_PATHS];
    const runBatch = async () => {
      for (let i = 0; i < paths.length; i += 6) {
        const slice = paths.slice(i, i + 6);
        await Promise.all(slice.map((p) => this.loadSoundBuffer(p).catch(() => null)));
      }
    };
    void runBatch();
  }

  private async fetchArrayBufferCached(url: string): Promise<ArrayBuffer | null> {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open(SOUND_CACHE_NAME);
        const cached = await cache.match(url);
        if (cached && cached.ok) {
          return await cached.arrayBuffer();
        }
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return null;
        const clone = res.clone();
        cache.put(url, clone).catch(() => {});
        return await res.arrayBuffer();
      }
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }

  private async fetchSoundBytes(path: string): Promise<{ bytes: ArrayBuffer; source: 'pack' | 'vanilla' } | null> {
    const clean = normalizeSoundPath(path);

    // Tier 1: Active Resource Pack ZIP Blob
    const packBlob = this.packSoundBlobs[clean];
    if (packBlob) {
      try {
        return { bytes: await packBlob.arrayBuffer(), source: 'pack' };
      } catch {
        // Fall through to mirror
      }
    }

    // Tier 2: Active Custom GitHub Resource Pack sounds root URL
    if (this.packSoundsRootUrl && !this.packRootMisses.has(clean)) {
      const customUrl = `${this.packSoundsRootUrl}/${clean}.ogg`;
      const customBytes = await this.fetchArrayBufferCached(customUrl);
      if (customBytes && customBytes.byteLength > 64) {
        return { bytes: customBytes, source: 'pack' };
      }
      this.packRootMisses.add(clean);
    }

    // Tier 3: Official Vanilla Minecraft Sounds from GitHub (multi-mirror with Cache API)
    for (const mirror of VANILLA_SOUND_MIRRORS) {
      const url = `${mirror}/${clean}.ogg`;
      const bytes = await this.fetchArrayBufferCached(url);
      if (bytes && bytes.byteLength > 64) {
        return { bytes, source: 'vanilla' };
      }
    }
    return null;
  }

  private loadSoundBuffer(path: string): Promise<AudioBuffer | null> {
    const clean = normalizeSoundPath(path);
    const hasPack = Boolean(
      this.packSoundBlobs[clean] ||
        (this.packSoundsRootUrl && !this.packRootMisses.has(clean)),
    );
    const cacheKey = `${hasPack ? 'pack' : 'vanilla'}:${clean}`;

    const cached = this.bufferCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    // If not in pack, check vanilla cache too
    if (!hasPack && this.failedPaths.has(clean)) return Promise.resolve(null);

    const existing = this.loadingMap.get(cacheKey);
    if (existing) return existing;

    const promise = (async (): Promise<AudioBuffer | null> => {
      const ctx = this.ensureCtxEvenIfMuted();
      if (!ctx) return null;

      const fetched = await this.fetchSoundBytes(clean);
      if (!fetched) {
        if (!hasPack) this.failedPaths.add(clean);
        return null;
      }

      try {
        // Slice to detach safely in case AudioContext transfers the buffer
        const decoded = await ctx.decodeAudioData(fetched.bytes.slice(0));
        const finalKey = `${fetched.source}:${clean}`;
        this.bufferCache.set(finalKey, decoded);
        if (finalKey !== cacheKey) this.bufferCache.set(cacheKey, decoded);
        return decoded;
      } catch {
        // Browser may not support Ogg Vorbis decoding (e.g. legacy iOS Safari)
        if (!this.packSoundBlobs[clean]) {
          this.oggUnsupported = true;
        }
        return null;
      } finally {
        this.loadingMap.delete(cacheKey);
      }
    })();

    this.loadingMap.set(cacheKey, promise);
    return promise;
  }

  private pickVariant(groupKey: string, list: readonly string[]): string {
    if (list.length <= 1) return list[0];
    const prev = this.lastVariantIdx.get(groupKey) ?? -1;
    let idx = Math.floor(Math.random() * list.length);
    if (idx === prev) idx = (idx + 1) % list.length;
    this.lastVariantIdx.set(groupKey, idx);
    return list[idx];
  }

  private playBufferNode(
    buffer: AudioBuffer,
    volume: number,
    pitch: number,
    delaySec = 0,
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = Math.max(0.25, Math.min(2.5, pitch));

    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1.8, volume));
    src.connect(gain).connect(this.masterGain);
    src.start(ctx.currentTime + delaySec);
  }

  /**
   * Plays a real Minecraft sound immediately if cached, or fetches+decodes+plays seamlessly.
   * Only uses an ultra-gentle soft fallback if OGG decoding is unsupported by the browser.
   */
  private playGroup(
    groupKey: string,
    variants: readonly string[],
    volume = 0.8,
    pitchMin = 0.92,
    pitchMax = 1.08,
    fallback?: () => void,
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const chosen = this.pickVariant(groupKey, variants);
    const pitch = pitchMin + Math.random() * (pitchMax - pitchMin);
    const clean = normalizeSoundPath(chosen);

    // Instant zero-latency playback if already decoded in RAM
    const packHit = this.bufferCache.get(`pack:${clean}`);
    if (packHit) {
      this.playBufferNode(packHit, volume, pitch);
      return;
    }
    if (!this.packSoundBlobs[clean]) {
      const vanillaHit = this.bufferCache.get(`vanilla:${clean}`);
      if (vanillaHit) {
        this.playBufferNode(vanillaHit, volume, pitch);
        return;
      }
    }

    if (this.oggUnsupported) {
      fallback?.();
      return;
    }

    // Fetch, decode, cache, and play on first use
    void this.loadSoundBuffer(clean).then((buf) => {
      if (buf) {
        this.playBufferNode(buf, volume, pitch);
      } else {
        fallback?.();
      }
    });
  }

  // Soft, unobtrusive fallback ONLY for environments unable to decode OGG or fully offline uncached
  private softThud(freq: number, duration: number, gainPeak: number): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), now + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainPeak * 0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(g).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // --- Public Sound API (100% compatible with all existing callers + new authentic SFX) ---

  playClick(): void {
    this.playGroup('click', SOUND_VARIANTS.click, 0.55, 0.98, 1.02, () =>
      this.softThud(520, 0.035, 0.12),
    );
  }

  playBlock(material: SoundMaterial, kind: 'break' | 'place' | 'step'): void {
    if (kind === 'step') {
      const now = performance.now();
      if (now - this.stepCooldownAt < 180) return;
      this.stepCooldownAt = now;
    }

    const vol = kind === 'step' ? 0.28 : kind === 'place' ? 0.72 : 0.85;
    const pMin = kind === 'place' ? 0.76 : kind === 'step' ? 0.92 : 0.82;
    const pMax = kind === 'place' ? 0.92 : kind === 'step' ? 1.08 : 1.02;

    switch (material) {
      case 'stone':
        this.playGroup(
          `stone_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.stone_step : SOUND_VARIANTS.stone_break,
          vol,
          pMin,
          pMax,
          () => this.softThud(160, 0.06, vol * 0.4),
        );
        break;
      case 'nether':
        this.playGroup(
          `nether_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.nether_step : SOUND_VARIANTS.nether_break,
          vol,
          pMin,
          pMax,
          () => this.softThud(140, 0.07, vol * 0.4),
        );
        break;
      case 'wood':
        this.playGroup(
          `wood_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.wood_step : SOUND_VARIANTS.wood_break,
          vol,
          pMin,
          pMax,
          () => this.softThud(220, 0.06, vol * 0.4),
        );
        break;
      case 'grass':
        this.playGroup(
          `grass_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.grass_step : SOUND_VARIANTS.grass_break,
          vol,
          pMin,
          pMax,
          () => this.softThud(180, 0.05, vol * 0.3),
        );
        break;
      case 'dirt':
        this.playGroup(
          `dirt_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.dirt_step : SOUND_VARIANTS.dirt_break,
          vol,
          pMin,
          pMax,
          () => this.softThud(160, 0.05, vol * 0.3),
        );
        break;
      case 'sand':
        this.playGroup(
          `sand_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.sand_step : SOUND_VARIANTS.sand_break,
          vol,
          pMin,
          pMax,
          () => this.softThud(260, 0.06, vol * 0.25),
        );
        break;
      case 'glass':
        if (kind === 'break') {
          this.playGroup('glass_break', SOUND_VARIANTS.glass_break, 0.85, 0.9, 1.1, () =>
            this.softThud(900, 0.06, 0.3),
          );
        } else {
          this.playGroup(
            `glass_${kind}`,
            kind === 'step' ? SOUND_VARIANTS.stone_step : SOUND_VARIANTS.stone_break,
            vol * 0.85,
            1.15,
            1.3,
          );
        }
        break;
      case 'metal':
        this.playGroup(
          `metal_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.metal_step : SOUND_VARIANTS.metal_break,
          vol,
          pMin,
          pMax,
          () => this.softThud(360, 0.07, vol * 0.35),
        );
        break;
      case 'liquid':
        this.playGroup(
          `liquid_${kind}`,
          kind === 'step' ? SOUND_VARIANTS.liquid_step : SOUND_VARIANTS.splash,
          kind === 'step' ? 0.32 : 0.65,
          0.85,
          1.15,
        );
        break;
    }
  }

  playHurt(): void {
    this.playGroup('hurt', SOUND_VARIANTS.hurt, 0.82, 0.88, 1.12, () =>
      this.softThud(140, 0.1, 0.4),
    );
  }

  playAttack(crit = false): void {
    this.playGroup(
      crit ? 'attack_crit' : 'attack_strong',
      crit ? SOUND_VARIANTS.attack_crit : SOUND_VARIANTS.attack_strong,
      0.85,
      0.92,
      1.08,
    );
  }

  playPortal(): void {
    this.playGroup('portal', SOUND_VARIANTS.portal, 0.55, 0.9, 1.1);
  }

  playEndPortal(): void {
    this.playGroup('end_portal', SOUND_VARIANTS.end_portal, 0.72, 0.95, 1.05);
  }

  playThunder(): void {
    this.playGroup('thunder', SOUND_VARIANTS.thunder, 0.95, 0.82, 1.05);
  }

  playExplosion(): void {
    this.playGroup('explode', SOUND_VARIANTS.explode, 0.95, 0.78, 1.02);
  }

  playAnvil(): void {
    this.playGroup('anvil', SOUND_VARIANTS.anvil, 0.78, 0.92, 1.08);
  }

  playLevelUp(): void {
    this.playGroup('levelup', SOUND_VARIANTS.levelup, 0.72, 0.98, 1.05);
  }

  playEat(): void {
    this.playGroup('eat', SOUND_VARIANTS.eat, 0.75, 0.85, 1.15);
  }

  playDrink(): void {
    this.playGroup('drink', SOUND_VARIANTS.drink, 0.75, 0.9, 1.1);
  }

  playXpOrb(): void {
    // Iconic Minecraft Java XP orb pitch spread (0.55 .. 1.25)
    this.playGroup('xp_orb', SOUND_VARIANTS.xp_orb, 0.52, 0.55, 1.25);
  }

  playThrow(): void {
    // Minecraft Java uses random/bow at lower pitch for throwing snowballs, pearls & potions
    this.playGroup('throw', SOUND_VARIANTS.bow, 0.55, 0.38, 0.52);
  }

  playBowShoot(): void {
    this.playGroup('bow', SOUND_VARIANTS.bow, 0.8, 0.85, 1.15);
  }

  playSplash(): void {
    this.playGroup('splash', SOUND_VARIANTS.splash, 0.72, 0.85, 1.15);
  }

  playFirework(): void {
    this.playGroup('firework_launch', SOUND_VARIANTS.firework_launch, 0.72, 0.95, 1.08);
    setTimeout(() => {
      this.playGroup('firework_blast', SOUND_VARIANTS.firework_blast, 0.82, 0.9, 1.12);
    }, 280);
  }

  playShieldBlock(): void {
    this.playGroup('shield', SOUND_VARIANTS.shield, 0.85, 0.88, 1.12);
  }

  playTotem(): void {
    this.playGroup('totem', SOUND_VARIANTS.totem, 0.92, 0.98, 1.02);
  }

  playMaceSmash(): void {
    this.playGroup('mace_smash', SOUND_VARIANTS.mace_smash, 0.95, 0.92, 1.08);
  }

  playWindBurst(): void {
    this.playGroup('wind_burst', SOUND_VARIANTS.wind_burst, 0.85, 0.85, 1.15);
  }

  playIgnite(): void {
    this.playGroup('ignite', SOUND_VARIANTS.ignite, 0.78, 0.85, 1.15);
  }

  playWardenHeartbeat(): void {
    this.playGroup('warden_heartbeat', SOUND_VARIANTS.warden_heartbeat, 0.92, 0.92, 1.05);
  }

  playWardenRoar(): void {
    this.playGroup('warden_roar', SOUND_VARIANTS.warden_roar, 0.88, 0.9, 1.08);
  }

  playSculkVibration(): void {
    this.playGroup('sculk_click', SOUND_VARIANTS.sculk_click, 0.8, 0.88, 1.15);
  }

  playSculkShriek(): void {
    this.playGroup('sculk_shriek', SOUND_VARIANTS.sculk_shriek, 0.85, 0.9, 1.1);
  }

  playDragonRoar(): void {
    this.playGroup('dragon_growl', SOUND_VARIANTS.dragon_growl, 0.9, 0.85, 1.08);
  }

  playDragonDeath(): void {
    this.playGroup('dragon_death', SOUND_VARIANTS.dragon_death, 0.95, 0.98, 1.02);
  }

  playDash(): void {
    this.playGroup('camel_dash', SOUND_VARIANTS.camel_dash, 0.85, 0.92, 1.08);
  }

  playCopperScrape(): void {
    this.playGroup('copper_scrape', SOUND_VARIANTS.copper_scrape, 0.82, 0.92, 1.1);
  }

  playWaxOn(): void {
    this.playGroup('wax_on', SOUND_VARIANTS.wax_on, 0.82, 0.92, 1.1);
  }

  playChestOpen(): void {
    this.playGroup('chest_open', SOUND_VARIANTS.chest_open, 0.62, 0.9, 1.05);
  }

  // --- Streaming Real Minecraft Music Discs & Dimension Ambient Music ---

  private resolveStreamingUrls(soundPath: string): string[] {
    const clean = normalizeSoundPath(soundPath);
    const urls: string[] = [];

    // Tier 1: Resource pack ZIP blob
    const packBlob = this.packSoundBlobs[clean];
    if (packBlob) {
      const objUrl = URL.createObjectURL(packBlob);
      this.packObjectUrls.push(objUrl);
      urls.push(objUrl);
    }

    // Tier 2: Custom GitHub Resource Pack sounds root
    if (this.packSoundsRootUrl && !this.packRootMisses.has(clean)) {
      urls.push(`${this.packSoundsRootUrl}/${clean}.ogg`);
    }

    // Tier 3: Official Vanilla Minecraft GitHub mirrors
    for (const mirror of VANILLA_SOUND_MIRRORS) {
      urls.push(`${mirror}/${clean}.ogg`);
    }
    return urls;
  }

  private playStreamingUrls(
    urls: string[],
    volumeFactor: number,
    onAssign: (audio: HTMLAudioElement | null) => void,
    onEnded?: () => void,
  ): void {
    if (typeof window === 'undefined' || urls.length === 0) return;
    let idx = 0;
    const tryNext = () => {
      if (idx >= urls.length) {
        onAssign(null);
        return;
      }
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.src = urls[idx++];
      audio.volume = this.muted ? 0 : Math.min(1, this.volume * volumeFactor);
      audio.onended = () => {
        onAssign(null);
        onEnded?.();
      };
      audio.onerror = () => {
        audio.src = '';
        tryNext();
      };
      onAssign(audio);
      audio.play().catch(() => {
        // Autoplay policy or decode error; try next mirror only if not NotAllowedError
        if (!this.userUnlocked) {
          onAssign(null);
        }
      });
    };
    tryNext();
  }

  playMusicDisc(discId: string): void {
    if (this.muted || this.volume <= 0.001) return;
    const path = MUSIC_DISC_PATHS[discId] || 'records/pigstep';

    // Stop previous disc and pause ambient BGM so they never clash
    this.stopDisc();
    this.pauseBgm();

    const urls = this.resolveStreamingUrls(path);
    this.playStreamingUrls(
      urls,
      0.55,
      (a) => {
        this.discAudio = a;
      },
      () => {
        // Resume ambient music peacefully after disc finishes
        if (this.bgmActive && this.currentDimension) {
          this.scheduleBgm(12_000);
        }
      },
    );
  }

  setDimensionMusic(dim: DimensionId): void {
    const changed = this.currentDimension !== dim;
    this.currentDimension = dim;
    this.bgmActive = true;
    if (changed) {
      this.pauseBgm();
      if (!this.discAudio) {
        this.scheduleBgm(this.userUnlocked ? 3500 : 6000);
      }
    } else if (!this.bgmAudio && !this.discAudio && this.bgmTimer === null) {
      this.scheduleBgm(6000);
    }
  }

  stopMusic(): void {
    this.bgmActive = false;
    this.currentDimension = null;
    this.stopDisc();
    this.pauseBgm();
  }

  private stopDisc(): void {
    if (this.discAudio) {
      this.discAudio.pause();
      this.discAudio.src = '';
      this.discAudio = null;
    }
  }

  private pauseBgm(): void {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.src = '';
      this.bgmAudio = null;
    }
  }

  private scheduleBgm(delayMs: number): void {
    if (typeof window === 'undefined') return;
    if (this.bgmTimer !== null) window.clearTimeout(this.bgmTimer);
    this.bgmTimer = window.setTimeout(() => {
      this.bgmTimer = null;
      if (!this.bgmActive || !this.currentDimension || this.discAudio || !this.userUnlocked) {
        return;
      }
      const tracks = DIMENSION_BGM[this.currentDimension];
      const track = this.pickVariant(`bgm_${this.currentDimension}`, tracks);
      const urls = this.resolveStreamingUrls(track);
      this.playStreamingUrls(
        urls,
        0.24,
        (a) => {
          this.bgmAudio = a;
        },
        () => {
          if (this.bgmActive && this.currentDimension && !this.discAudio) {
            // Peaceful Minecraft pause between ambient music tracks (20–45s)
            this.scheduleBgm(20_000 + Math.random() * 25_000);
          }
        },
      );
    }, delayMs);
  }

  playNoteBlockSound(pitchSemitones: number, instrument: string = 'harp'): void {
    const ctx = this.ensureCtx();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    // Minecraft Note Block base frequency F#3 (185 Hz) to F#5 (740 Hz) across 0..24 semitones
    const freq = 185 * Math.pow(2, Math.max(0, Math.min(24, pitchSemitones)) / 12);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    let wave: OscillatorType = 'triangle';
    let duration = 0.35;
    let peak = 0.22;
    if (instrument === 'trumpet') {
      // Java 26.1 Copper Trumpet: bright brassy sawtooth with filter envelope
      wave = 'sawtooth';
      duration = 0.45;
      peak = 0.2;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4.5, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.8), now + duration);
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
      return;
    } else if (instrument === 'bass') {
      wave = 'triangle';
      osc.frequency.setValueAtTime(freq * 0.5, now);
      duration = 0.38;
    } else if (instrument === 'basedrum') {
      wave = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.16);
      duration = 0.18;
      peak = 0.3;
    } else if (instrument === 'bell' || instrument === 'chime') {
      wave = 'sine';
      osc.frequency.setValueAtTime(freq * 2, now);
      duration = 0.55;
      peak = 0.2;
    } else if (instrument === 'bit') {
      wave = 'square';
      osc.frequency.setValueAtTime(freq, now);
      duration = 0.28;
      peak = 0.15;
    } else {
      osc.frequency.setValueAtTime(freq, now);
    }

    osc.type = wave;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playByName(name: string): void {
    switch (name) {
      case 'portal': this.playPortal(); break;
      case 'end_portal': this.playEndPortal(); break;
      case 'anvil': this.playAnvil(); break;
      case 'explosion': this.playExplosion(); break;
      case 'levelup': this.playLevelUp(); break;
      case 'thunder': this.playThunder(); break;
      case 'hurt': this.playHurt(); break;
      case 'attack': this.playAttack(); break;
      case 'xp': this.playXpOrb(); break;
      case 'splash': this.playSplash(); break;
      case 'firework': this.playFirework(); break;
      case 'warden': this.playWardenHeartbeat(); break;
      case 'dragon': this.playDragonRoar(); break;
      case 'totem': this.playTotem(); break;
      case 'mace': this.playMaceSmash(); break;
      case 'wind': this.playWindBurst(); break;
      default: this.playClick(); break;
    }
  }
}

export const soundEngine = new SoundEngine();
