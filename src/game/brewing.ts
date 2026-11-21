import { BrewingStandState, ItemStack } from './types';

export interface BrewingRecipeRule {
  input: string;
  ingredient: string;
  output: string;
  labelVi: string;
}

// Official Minecraft Java Edition Brewing Matrix
export const BREWING_RULES: BrewingRecipeRule[] = [
  // Base transitions
  { input: 'water_bottle', ingredient: 'nether_wart', output: 'awkward_potion', labelVi: 'Thuốc Thô (Awkward)' },
  { input: 'water_bottle', ingredient: 'fermented_spider_eye', output: 'potion_weakness', labelVi: 'Thuốc Suy Yếu' },

  // Primary effects from Awkward Potion
  { input: 'awkward_potion', ingredient: 'ghast_tear', output: 'potion_regeneration', labelVi: 'Thuốc Hồi Phục' },
  { input: 'awkward_potion', ingredient: 'blaze_powder', output: 'potion_strength', labelVi: 'Thuốc Sức Mạnh' },
  { input: 'awkward_potion', ingredient: 'sugar', output: 'potion_swiftness', labelVi: 'Thuốc Tốc Độ' },
  { input: 'awkward_potion', ingredient: 'rabbit_foot', output: 'potion_leaping', labelVi: 'Thuốc Nhảy Cao' },
  { input: 'awkward_potion', ingredient: 'glistering_melon_slice', output: 'potion_healing', labelVi: 'Thuốc Chữa Trị' },
  { input: 'awkward_potion', ingredient: 'melon_slice', output: 'potion_healing', labelVi: 'Thuốc Chữa Trị' },
  { input: 'awkward_potion', ingredient: 'magma_cream', output: 'potion_fire_resistance', labelVi: 'Thuốc Kháng Lửa' },
  { input: 'awkward_potion', ingredient: 'pufferfish', output: 'potion_water_breathing', labelVi: 'Thuốc Thở Dưới Nước' },
  { input: 'awkward_potion', ingredient: 'pufferfish_bucket', output: 'potion_water_breathing', labelVi: 'Thuốc Thở Dưới Nước' },
  { input: 'awkward_potion', ingredient: 'golden_carrot', output: 'potion_night_vision', labelVi: 'Thuốc Nhìn Đêm' },
  { input: 'awkward_potion', ingredient: 'phantom_membrane', output: 'potion_slow_falling', labelVi: 'Thuốc Rơi Chậm' },
  { input: 'awkward_potion', ingredient: 'spider_eye', output: 'potion_poison', labelVi: 'Thuốc Độc' },
  { input: 'awkward_potion', ingredient: 'turtle_helmet', output: 'potion_turtle_master', labelVi: 'Thuốc Bậc Thầy Rùa' },

  // Corrupted potions via Fermented Spider Eye
  { input: 'potion_night_vision', ingredient: 'fermented_spider_eye', output: 'potion_invisibility', labelVi: 'Thuốc Tàng Hình' },
  { input: 'potion_swiftness', ingredient: 'fermented_spider_eye', output: 'potion_slowness', labelVi: 'Thuốc Làm Chậm' },
  { input: 'potion_leaping', ingredient: 'fermented_spider_eye', output: 'potion_slowness', labelVi: 'Thuốc Làm Chậm' },
  { input: 'potion_healing', ingredient: 'fermented_spider_eye', output: 'potion_harming', labelVi: 'Thuốc Sát Thương' },
  { input: 'potion_poison', ingredient: 'fermented_spider_eye', output: 'potion_harming', labelVi: 'Thuốc Sát Thương' },

  // Splash Potions via Gunpowder
  { input: 'potion_healing', ingredient: 'gunpowder', output: 'splash_potion_healing', labelVi: 'Thuốc Ném Hồi Máu' },
  { input: 'potion_regeneration', ingredient: 'gunpowder', output: 'splash_potion_regeneration', labelVi: 'Thuốc Ném Hồi Phục' },
  { input: 'potion_swiftness', ingredient: 'gunpowder', output: 'splash_potion_swiftness', labelVi: 'Thuốc Ném Tốc Độ' },
  { input: 'potion_strength', ingredient: 'gunpowder', output: 'splash_potion_strength', labelVi: 'Thuốc Ném Sức Mạnh' },
  { input: 'potion_fire_resistance', ingredient: 'gunpowder', output: 'splash_potion_fire_resistance', labelVi: 'Thuốc Ném Kháng Lửa' },
  { input: 'potion_night_vision', ingredient: 'gunpowder', output: 'splash_potion_night_vision', labelVi: 'Thuốc Ném Nhìn Đêm' },
  { input: 'potion_poison', ingredient: 'gunpowder', output: 'splash_potion_poison', labelVi: 'Thuốc Ném Độc' },
  { input: 'potion_harming', ingredient: 'gunpowder', output: 'splash_potion_harming', labelVi: 'Thuốc Ném Sát Thương' },

  // Lingering Potions via Dragon's Breath
  { input: 'splash_potion_healing', ingredient: 'dragon_breath', output: 'lingering_potion_healing', labelVi: 'Thuốc Đọng Hồi Máu' },
];

const VALID_BOTTLES = new Set([
  'water_bottle',
  'awkward_potion',
  ...BREWING_RULES.map((r) => r.input),
  ...BREWING_RULES.map((r) => r.output),
]);

const VALID_INGREDIENTS = new Set(BREWING_RULES.map((r) => r.ingredient));

export const BREW_DURATION_SEC = 8.0; // Crisp playable brewing speed (Java is 20s; 8s feels great in browser)
export const BLAZE_POWDER_CHARGES = 20;

export function isBrewableBottle(itemId: string): boolean {
  return VALID_BOTTLES.has(itemId);
}

export function isBrewingIngredient(itemId: string): boolean {
  return VALID_INGREDIENTS.has(itemId);
}

export function resolveBrewOutput(bottleItemId: string, ingredientItemId: string): string | null {
  const found = BREWING_RULES.find(
    (r) => r.input === bottleItemId && r.ingredient === ingredientItemId,
  );
  return found ? found.output : null;
}

export function canBrewState(state: BrewingStandState): boolean {
  if (!state.ingredient || state.ingredient.count <= 0) return false;
  const hasFuel =
    state.fuelCharges > 0 || (state.fuel?.itemId === 'blaze_powder' && state.fuel.count > 0);
  if (!hasFuel) return false;
  return state.bottles.some(
    (b) => b !== null && resolveBrewOutput(b.itemId, state.ingredient!.itemId) !== null,
  );
}

export interface BrewingTickResult {
  state: BrewingStandState;
  changed: boolean;
  completed: boolean;
}

export function stepBrewingStand(state: BrewingStandState, dtSec: number): BrewingTickResult {
  const next: BrewingStandState = {
    ingredient: state.ingredient ? { ...state.ingredient } : null,
    fuel: state.fuel ? { ...state.fuel } : null,
    bottles: state.bottles.map((b) => (b ? { ...b } : null)),
    fuelCharges: state.fuelCharges,
    brewProgress: state.brewProgress,
  };
  let changed = false;
  let completed = false;

  // Auto-consume 1 Blaze Powder into 20 fuel charges when empty
  if (next.fuelCharges <= 0 && next.fuel?.itemId === 'blaze_powder' && next.fuel.count > 0) {
    next.fuelCharges = BLAZE_POWDER_CHARGES;
    next.fuel = next.fuel.count > 1 ? { ...next.fuel, count: next.fuel.count - 1 } : null;
    changed = true;
  }

  if (!canBrewState(next)) {
    if (next.brewProgress > 0) {
      next.brewProgress = 0;
      changed = true;
    }
    return { state: next, changed, completed };
  }

  next.brewProgress = Math.min(1, next.brewProgress + dtSec / BREW_DURATION_SEC);
  changed = true;

  if (next.brewProgress >= 1) {
    const ingId = next.ingredient!.itemId;
    next.bottles = next.bottles.map((b): ItemStack | null => {
      if (!b) return null;
      const out = resolveBrewOutput(b.itemId, ingId);
      return out ? { itemId: out, count: 1 } : b;
    });
    next.ingredient =
      next.ingredient!.count > 1
        ? { ...next.ingredient!, count: next.ingredient!.count - 1 }
        : null;
    next.fuelCharges = Math.max(0, next.fuelCharges - 1);
    next.brewProgress = 0;
    completed = true;
  }

  return { state: next, changed, completed };
}
