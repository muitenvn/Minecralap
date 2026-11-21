import { MobType } from './mobs';
import { VillagerTradeOffer } from './types';

export interface RaidState {
  active: boolean;
  wave: number;
  maxWaves: number;
  totalInWave: number;
  remainingInWave: number;
  victory: boolean;
}

export function getRaidWaveMobTypes(wave: number): MobType[] {
  if (wave <= 1) {
    return ['pillager', 'pillager', 'pillager'];
  }
  if (wave === 2) {
    return ['pillager', 'pillager', 'vindicator', 'skeleton'];
  }
  return ['pillager', 'pillager', 'vindicator', 'vindicator', 'evoker'];
}

export function createRaid(maxWaves = 3): RaidState {
  const wave1 = getRaidWaveMobTypes(1);
  return {
    active: true,
    wave: 1,
    maxWaves,
    totalInWave: wave1.length,
    remainingInWave: wave1.length,
    victory: false,
  };
}

export interface RaidKillOutcome {
  state: RaidState;
  spawnNextWave?: MobType[];
  victoryTriggered: boolean;
}

export function recordRaidKill(state: RaidState): RaidKillOutcome {
  if (!state.active || state.victory) {
    return { state, victoryTriggered: false };
  }
  const remaining = Math.max(0, state.remainingInWave - 1);
  if (remaining > 0) {
    return {
      state: { ...state, remainingInWave: remaining },
      victoryTriggered: false,
    };
  }
  if (state.wave < state.maxWaves) {
    const nextWave = state.wave + 1;
    const nextMobs = getRaidWaveMobTypes(nextWave);
    return {
      state: {
        ...state,
        wave: nextWave,
        totalInWave: nextMobs.length,
        remainingInWave: nextMobs.length,
      },
      spawnNextWave: nextMobs,
      victoryTriggered: false,
    };
  }
  return {
    state: {
      ...state,
      active: false,
      remainingInWave: 0,
      victory: true,
    },
    victoryTriggered: true,
  };
}

/**
 * Applies authentic Java Edition Hero of the Village emerald discount (30% off, min 1 emerald).
 */
export function applyHeroOfTheVillageDiscount(
  offers: VillagerTradeOffer[],
  hasHeroEffect: boolean,
): VillagerTradeOffer[] {
  return offers.map((o) => {
    const buyA = { ...o.buyA };
    const buyB = o.buyB ? { ...o.buyB } : undefined;
    const sell = { ...o.sell, enchants: o.sell.enchants ? { ...o.sell.enchants } : undefined };
    if (hasHeroEffect) {
      if (buyA.itemId === 'emerald') {
        buyA.count = Math.max(1, Math.floor(buyA.count * 0.7));
      }
      if (buyB && buyB.itemId === 'emerald') {
        buyB.count = Math.max(1, Math.floor(buyB.count * 0.7));
      }
    }
    return { ...o, buyA, buyB, sell };
  });
}
