import { ITEM_DEFS } from './blocks';
import { ItemStack, VillagerProfession, VillagerTradeOffer } from './types';

export const VILLAGER_PROFESSIONS: VillagerProfession[] = [
  'farmer',
  'librarian',
  'weaponsmith',
  'armorer',
  'cleric',
  'toolsmith',
];

export const VILLAGER_PROFESSION_LABELS: Record<VillagerProfession, string> = {
  farmer: 'Nông Dân',
  librarian: 'Thủ Thư',
  weaponsmith: 'Thợ Rèn Vũ Khí',
  armorer: 'Thợ Giáp',
  cleric: 'Giáo Sĩ',
  toolsmith: 'Thợ Công Cụ',
};

export const VILLAGER_LEVEL_LABELS: Record<number, string> = {
  1: 'Tập Sự',
  2: 'Học Việc',
  3: 'Thợ Lành Nghề',
  4: 'Chuyên Gia',
  5: 'Bậc Thầy',
};

function seededPick<T>(arr: readonly T[], seed: number): T {
  const idx = Math.abs(Math.imul(seed ^ 0x45d9f3b, 0x119de1f3)) % arr.length;
  return arr[idx];
}

const LIBRARIAN_BOOKS: readonly { label: string; enchants: Partial<Record<string, number>>; cost: number }[] = [
  { label: 'Sửa Chữa (Mending)', enchants: { mending: 1 }, cost: 14 },
  { label: 'Hiệu Suất IV', enchants: { efficiency: 4 }, cost: 16 },
  { label: 'Sắc Bén IV', enchants: { sharpness: 4 }, cost: 18 },
  { label: 'Bền Bỉ III', enchants: { unbreaking: 3 }, cost: 15 },
  { label: 'Gia Tài III', enchants: { fortune: 3 }, cost: 20 },
  { label: 'Bảo Vệ IV', enchants: { protection: 4 }, cost: 18 },
  { label: 'Nhặt Đồ III', enchants: { looting: 3 }, cost: 17 },
  { label: 'Vô Hạn (Infinity)', enchants: { infinity: 1 }, cost: 16 },
];

export function generateVillagerOffers(
  profession: VillagerProfession,
  seed: number,
  level = 1,
): VillagerTradeOffer[] {
  const offers: VillagerTradeOffer[] = [];
  const mk = (
    id: string,
    buyA: ItemStack,
    sell: ItemStack,
    maxUses: number,
    xpReward: number,
    buyB?: ItemStack,
  ): VillagerTradeOffer => ({
    id,
    buyA,
    buyB,
    sell,
    maxUses,
    uses: 0,
    xpReward,
  });

  switch (profession) {
    case 'farmer': {
      offers.push(
        mk('f_wheat', { itemId: 'wheat', count: 20 }, { itemId: 'emerald', count: 1 }, 16, 2),
        mk('f_bread', { itemId: 'emerald', count: 1 }, { itemId: 'bread', count: 6 }, 16, 1),
      );
      if (level >= 2) {
        offers.push(
          mk('f_carrot', { itemId: 'carrot', count: 16 }, { itemId: 'emerald', count: 1 }, 12, 4),
          mk('f_apple', { itemId: 'emerald', count: 1 }, { itemId: 'apple', count: 4 }, 12, 4),
        );
      }
      if (level >= 3) {
        offers.push(
          mk('f_gcarrot', { itemId: 'emerald', count: 3 }, { itemId: 'golden_carrot', count: 3 }, 12, 8),
          mk('f_cake', { itemId: 'emerald', count: 1 }, { itemId: 'cake', count: 1 }, 8, 10),
        );
      }
      break;
    }

    case 'librarian': {
      const book1 = seededPick(LIBRARIAN_BOOKS, seed + 1);
      const book2 = seededPick(LIBRARIAN_BOOKS, seed + 7);
      offers.push(
        mk('l_paper', { itemId: 'paper', count: 24 }, { itemId: 'emerald', count: 1 }, 16, 2),
        mk(
          'l_book1',
          { itemId: 'emerald', count: book1.cost },
          { itemId: 'enchanted_book', count: 1, enchants: book1.enchants as ItemStack['enchants'] },
          12,
          5,
          { itemId: 'book', count: 1 },
        ),
      );
      if (level >= 2) {
        offers.push(
          mk('l_shelf', { itemId: 'emerald', count: 9 }, { itemId: 'bookshelf', count: 1 }, 12, 4),
          mk('l_lantern', { itemId: 'emerald', count: 1 }, { itemId: 'lantern', count: 1 }, 12, 3),
        );
      }
      if (level >= 3) {
        offers.push(
          mk(
            'l_book2',
            { itemId: 'emerald', count: book2.cost },
            { itemId: 'enchanted_book', count: 1, enchants: book2.enchants as ItemStack['enchants'] },
            12,
            10,
            { itemId: 'book', count: 1 },
          ),
          mk('l_nametag', { itemId: 'emerald', count: 12 }, { itemId: 'name_tag', count: 1 }, 8, 12),
        );
      }
      break;
    }

    case 'weaponsmith': {
      offers.push(
        mk('w_coal', { itemId: 'coal', count: 15 }, { itemId: 'emerald', count: 1 }, 16, 2),
        mk('w_iron_sw', { itemId: 'emerald', count: 5 }, { itemId: 'iron_sword', count: 1 }, 12, 3),
      );
      if (level >= 2) {
        offers.push(
          mk('w_iron', { itemId: 'iron_ingot', count: 4 }, { itemId: 'emerald', count: 1 }, 12, 5),
        );
      }
      if (level >= 3) {
        offers.push(
          mk(
            'w_dia_sw',
            { itemId: 'emerald', count: 14 },
            { itemId: 'diamond_sword', count: 1, enchants: { sharpness: 3, unbreaking: 2 } },
            3,
            15,
          ),
        );
      }
      break;
    }

    case 'armorer': {
      offers.push(
        mk('a_coal', { itemId: 'coal', count: 15 }, { itemId: 'emerald', count: 1 }, 16, 2),
        mk('a_iron_ch', { itemId: 'emerald', count: 7 }, { itemId: 'iron_chestplate', count: 1 }, 12, 3),
      );
      if (level >= 2) {
        offers.push(
          mk('a_shield', { itemId: 'emerald', count: 5 }, { itemId: 'shield', count: 1 }, 12, 5),
        );
      }
      if (level >= 3) {
        offers.push(
          mk(
            'a_dia_ch',
            { itemId: 'emerald', count: 22 },
            { itemId: 'diamond_chestplate', count: 1, enchants: { protection: 3, unbreaking: 2 } },
            3,
            18,
          ),
        );
      }
      break;
    }

    case 'cleric': {
      offers.push(
        mk('c_flesh', { itemId: 'rotten_flesh', count: 32 }, { itemId: 'emerald', count: 1 }, 16, 2),
        mk('c_redstone', { itemId: 'emerald', count: 1 }, { itemId: 'redstone', count: 4 }, 12, 2),
      );
      if (level >= 2) {
        offers.push(
          mk('c_lapis', { itemId: 'emerald', count: 1 }, { itemId: 'lapis_lazuli', count: 2 }, 12, 4),
          mk('c_gold', { itemId: 'gold_ingot', count: 3 }, { itemId: 'emerald', count: 1 }, 12, 5),
        );
      }
      if (level >= 3) {
        offers.push(
          mk('c_pearl', { itemId: 'emerald', count: 5 }, { itemId: 'ender_pearl', count: 1 }, 12, 10),
          mk('c_xp', { itemId: 'emerald', count: 3 }, { itemId: 'experience_bottle', count: 2 }, 12, 12),
        );
      }
      break;
    }

    case 'toolsmith': {
      offers.push(
        mk('t_coal', { itemId: 'coal', count: 15 }, { itemId: 'emerald', count: 1 }, 16, 2),
        mk('t_iron_pk', { itemId: 'emerald', count: 6 }, { itemId: 'iron_pickaxe', count: 1 }, 12, 3),
      );
      if (level >= 2) {
        offers.push(
          mk('t_iron', { itemId: 'iron_ingot', count: 4 }, { itemId: 'emerald', count: 1 }, 12, 5),
        );
      }
      if (level >= 3) {
        offers.push(
          mk(
            't_dia_pk',
            { itemId: 'emerald', count: 16 },
            { itemId: 'diamond_pickaxe', count: 1, enchants: { efficiency: 3, unbreaking: 2 } },
            3,
            15,
          ),
        );
      }
      break;
    }
  }

  return offers;
}

export function countItemInInventory(inv: (ItemStack | null)[], itemId: string): number {
  let total = 0;
  for (const s of inv) {
    if (s && s.itemId === itemId) total += s.count;
  }
  return total;
}

export function canAffordTrade(inv: (ItemStack | null)[], offer: VillagerTradeOffer): boolean {
  if (offer.uses >= offer.maxUses) return false;
  if (countItemInInventory(inv, offer.buyA.itemId) < offer.buyA.count) return false;
  if (offer.buyB && countItemInInventory(inv, offer.buyB.itemId) < offer.buyB.count) return false;
  return true;
}

function removeItems(inv: (ItemStack | null)[], itemId: string, count: number): void {
  let rem = count;
  for (let i = 0; i < inv.length && rem > 0; i++) {
    const s = inv[i];
    if (s && s.itemId === itemId) {
      const take = Math.min(rem, s.count);
      s.count -= take;
      rem -= take;
      if (s.count <= 0) inv[i] = null;
    }
  }
}

function addItemToInv(inv: (ItemStack | null)[], item: ItemStack): boolean {
  const max = ITEM_DEFS[item.itemId]?.maxStack ?? 64;
  let rem = item.count;
  if (max > 1 && !item.enchants) {
    for (let i = 0; i < inv.length && rem > 0; i++) {
      const s = inv[i];
      if (s && s.itemId === item.itemId && !s.enchants && s.count < max) {
        const add = Math.min(rem, max - s.count);
        s.count += add;
        rem -= add;
      }
    }
  }
  for (let i = 0; i < inv.length && rem > 0; i++) {
    if (!inv[i]) {
      const add = Math.min(rem, max);
      inv[i] = {
        itemId: item.itemId,
        count: add,
        enchants: item.enchants ? { ...item.enchants } : undefined,
        durability: item.durability,
      };
      rem -= add;
    }
  }
  return rem === 0;
}

export interface TradeResult {
  ok: boolean;
  inventory: (ItemStack | null)[];
  offer: VillagerTradeOffer;
  villagerXp: number;
  villagerLevel: number;
  leveledUp: boolean;
  error?: string;
}

export function executeVillagerTrade(
  inventory: (ItemStack | null)[],
  offer: VillagerTradeOffer,
  villagerXp: number,
  villagerLevel: number,
): TradeResult {
  if (offer.uses >= offer.maxUses) {
    return { ok: false, inventory, offer, villagerXp, villagerLevel, leveledUp: false, error: 'Đã hết hàng giao dịch này!' };
  }
  if (!canAffordTrade(inventory, offer)) {
    return { ok: false, inventory, offer, villagerXp, villagerLevel, leveledUp: false, error: 'Không đủ vật phẩm để trao đổi!' };
  }

  const nextInv = inventory.map((s) =>
    s ? { ...s, enchants: s.enchants ? { ...s.enchants } : undefined } : null,
  );
  removeItems(nextInv, offer.buyA.itemId, offer.buyA.count);
  if (offer.buyB) {
    removeItems(nextInv, offer.buyB.itemId, offer.buyB.count);
  }
  if (!addItemToInv(nextInv, offer.sell)) {
    return { ok: false, inventory, offer, villagerXp, villagerLevel, leveledUp: false, error: 'Túi đồ đã đầy!' };
  }

  const nextOffer: VillagerTradeOffer = { ...offer, uses: offer.uses + 1 };
  const nextXp = villagerXp + offer.xpReward;
  const thresholds = [0, 10, 35, 80, 150];
  let nextLevel = villagerLevel;
  while (nextLevel < 5 && nextXp >= thresholds[nextLevel]) {
    nextLevel++;
  }

  return {
    ok: true,
    inventory: nextInv,
    offer: nextOffer,
    villagerXp: nextXp,
    villagerLevel: nextLevel,
    leveledUp: nextLevel > villagerLevel,
  };
}
