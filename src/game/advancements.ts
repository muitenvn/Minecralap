export type AdvancementCategory = 'story' | 'nether' | 'end' | 'adventure' | 'java26';

export interface AdvancementDef {
  id: string;
  category: AdvancementCategory;
  titleVi: string;
  descVi: string;
  iconColor: string;
  xpReward: number;
}

export const ADVANCEMENTS: AdvancementDef[] = [
  // Story / Progression
  {
    id: 'mine_wood',
    category: 'story',
    titleVi: 'Khởi Đầu Chặt Gỗ',
    descVi: 'Thu thập khối gỗ đầu tiên trong thế giới.',
    iconColor: '#a16207',
    xpReward: 5,
  },
  {
    id: 'craft_table',
    category: 'story',
    titleVi: 'Bàn Chế Tạo Thủ Công',
    descVi: 'Chế tạo hoặc mở Bàn Chế Tạo 3x3.',
    iconColor: '#b45309',
    xpReward: 5,
  },
  {
    id: 'mine_iron',
    category: 'story',
    titleVi: 'Kỷ Nguyên Sắt',
    descVi: 'Khai thác quặng sắt hoặc nhận thỏi sắt.',
    iconColor: '#cbd5e1',
    xpReward: 10,
  },
  {
    id: 'mine_diamond',
    category: 'story',
    titleVi: 'Kim Cương Lấp Lánh!',
    descVi: 'Tìm và khai thác Kim Cương quý hiếm.',
    iconColor: '#22d3ee',
    xpReward: 20,
  },
  {
    id: 'enchant_item',
    category: 'story',
    titleVi: 'Phù Thủy Phù Phép',
    descVi: 'Phù phép vũ khí hoặc công cụ tại Bàn Phù Phép.',
    iconColor: '#a855f7',
    xpReward: 15,
  },
  // Nether
  {
    id: 'enter_nether',
    category: 'nether',
    titleVi: 'Tiến Vào Địa Ngục (Nether)',
    descVi: 'Bước qua Cổng Hắc Diện Thạch tới chiều không gian Nether.',
    iconColor: '#dc2626',
    xpReward: 20,
  },
  {
    id: 'brew_potion',
    category: 'nether',
    titleVi: 'Nhà Giả Kim Địa Ngục',
    descVi: 'Pha chế thành công một bình thuốc bằng Giàn Pha Thuốc.',
    iconColor: '#f43f5e',
    xpReward: 15,
  },
  {
    id: 'piglin_barter',
    category: 'nether',
    titleVi: 'Giao Dịch Vàng Với Piglin',
    descVi: 'Trao đổi Thỏi Vàng với Piglin để lấy báu vật Nether.',
    iconColor: '#eab308',
    xpReward: 12,
  },
  // The End
  {
    id: 'enter_end',
    category: 'end',
    titleVi: 'Hồi Kết? (The End)',
    descVi: 'Bước vào Cổng End và đặt chân lên đảo The End.',
    iconColor: '#9333ea',
    xpReward: 25,
  },
  {
    id: 'slay_dragon',
    category: 'end',
    titleVi: 'Giải Phóng The End!',
    descVi: 'Đánh bại Boss Rồng Ender (Ender Dragon).',
    iconColor: '#c084fc',
    xpReward: 60,
  },
  // Adventure & Village
  {
    id: 'trade_villager',
    category: 'adventure',
    titleVi: 'Thương Nhân Ngọc Lục Bảo',
    descVi: 'Hoàn thành một giao dịch với Dân Làng.',
    iconColor: '#10b981',
    xpReward: 12,
  },
  {
    id: 'tame_wolf',
    category: 'adventure',
    titleVi: 'Người Bạn Bốn Chân',
    descVi: 'Thuần hóa một chú Sói bằng Xương.',
    iconColor: '#f87171',
    xpReward: 12,
  },
  {
    id: 'win_raid',
    category: 'adventure',
    titleVi: 'Anh Hùng Của Làng',
    descVi: 'Đẩy lùi thành công cả 3 đợt Đột Kích Làng (Village Raid).',
    iconColor: '#22c55e',
    xpReward: 40,
  },
  {
    id: 'catch_fish',
    category: 'adventure',
    titleVi: 'Cần Thủ Đại Dương',
    descVi: 'Câu được cá hoặc kho báu bằng Cần Câu.',
    iconColor: '#38bdf8',
    xpReward: 10,
  },
  {
    id: 'mace_smash',
    category: 'adventure',
    titleVi: 'Cú Đập Chùy Sấm Sét (1.21)',
    descVi: 'Tung đòn đập Chùy Chiến (Mace) từ trên không.',
    iconColor: '#94a3b8',
    xpReward: 18,
  },
  {
    id: 'redstone_engineer',
    category: 'adventure',
    titleVi: 'Kỹ Sư Redstone',
    descVi: 'Kích hoạt cơ chế Redstone (Cần gạt, Piston, Máy quan sát).',
    iconColor: '#ef4444',
    xpReward: 12,
  },
  // Java 26.1 – 26.3 Showcase
  {
    id: 'copper_trumpet_261',
    category: 'java26',
    titleVi: 'Kèn Đồng 26.1 (Tiny Takeover)',
    descVi: 'Chơi Hộp Nhạc đặt trên khối Đồng để tạo tiếng Kèn Đồng.',
    iconColor: '#ea580c',
    xpReward: 15,
  },
  {
    id: 'golden_dandelion_261',
    category: 'java26',
    titleVi: 'Mãi Mãi Tuổi Thơ (26.1)',
    descVi: 'Dùng Bồ Công Anh Vàng khóa tuổi một chú thú non.',
    iconColor: '#facc15',
    xpReward: 15,
  },
  {
    id: 'wilderness_263',
    category: 'java26',
    titleVi: 'Dã Ngoại Rừng Dương (26.3)',
    descVi: 'Thu thập gỗ Dương (Poplar) hoặc khám phá Rừng Dương Lốm Đốm.',
    iconColor: '#84cc16',
    xpReward: 15,
  },
  {
    id: 'sleep_straw_bed',
    category: 'java26',
    titleVi: 'Giấc Ngủ Giường Rơm (26.3)',
    descVi: 'Nghỉ ngơi đặt điểm hồi sinh trên Giường Rơm 26.3.',
    iconColor: '#d97706',
    xpReward: 12,
  },
  {
    id: 'summon_wither',
    category: 'nether',
    titleVi: 'Khởi Đầu Tận Thế (Wither)',
    descVi: 'Triệu hồi hoặc tiêu diệt Boss Wither để lấy Ngôi Sao Địa Ngục.',
    iconColor: '#18181b',
    xpReward: 50,
  },
  {
    id: 'activate_beacon',
    category: 'story',
    titleVi: 'Ánh Sáng Đèn Hiệu (Beacon)',
    descVi: 'Kích hoạt Đèn Hiệu trên Kim Tự Tháp khoáng sản (Sắt/Vàng/Kim Cương).',
    iconColor: '#38bdf8',
    xpReward: 30,
  },
];

export const ADVANCEMENT_BY_ID: Record<string, AdvancementDef> = Object.fromEntries(
  ADVANCEMENTS.map((a) => [a.id, a]),
);

export const ADVANCEMENT_CATEGORY_LABELS: Record<AdvancementCategory, string> = {
  story: 'Cốt Truyện',
  nether: 'Địa Ngục (Nether)',
  end: 'The End',
  adventure: 'Phiêu Lưu & Làng',
  java26: 'Java 26.1 – 26.3',
};

export interface UnlockAdvancementResult {
  newlyUnlocked: boolean;
  def?: AdvancementDef;
  nextMap: Record<string, number>;
}

export function unlockAdvancement(
  unlockedMap: Record<string, number> | undefined,
  id: string,
  now = Date.now(),
): UnlockAdvancementResult {
  const base = unlockedMap ? { ...unlockedMap } : {};
  const def = ADVANCEMENT_BY_ID[id];
  if (!def || base[id]) {
    return { newlyUnlocked: false, nextMap: base };
  }
  base[id] = now;
  return { newlyUnlocked: true, def, nextMap: base };
}

export function getAdvancementProgress(unlockedMap: Record<string, number> | undefined): {
  unlocked: number;
  total: number;
  percent: number;
} {
  const total = ADVANCEMENTS.length;
  const unlocked = unlockedMap
    ? Object.keys(unlockedMap).filter((k) => Boolean(ADVANCEMENT_BY_ID[k])).length
    : 0;
  return {
    unlocked,
    total,
    percent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
  };
}
