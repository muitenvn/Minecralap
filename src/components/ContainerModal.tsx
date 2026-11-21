import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Hammer, Search, Shield, Sparkles, Trash2, X } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { CreativeCategory, ITEM_DEFS } from '../game/blocks';
import {
  applyEnchantOffer,
  combineAnvilItems,
  EnchantOffer,
  formatEnchantLabel,
  formatItemEnchants,
  generateEnchantOffers,
  isEnchantableItem,
} from '../game/enchanting';
import {
  CRAFTING_RECIPES,
  CraftingRecipe,
  matchCraftingGrid,
  matchSmithing,
} from '../game/recipes';
import { CompiledResourcePack } from '../game/resourcePack';
import { ContainerType, FurnaceState, GameMode, ItemStack, PlayerSkinConfig } from '../game/types';
import { McButton, McItemSlot, McSpriteSlice } from './McSprites';
import { SkinPreview3D } from './SkinPreview3D';

interface ContainerModalProps {
  type: Exclude<ContainerType, 'none'>;
  gameMode: GameMode;
  inventory: (ItemStack | null)[];
  armor: (ItemStack | null)[];
  furnace: FurnaceState;
  playerLevel?: number;
  enchantBookshelves?: number;
  pack: CompiledResourcePack;
  playerSkin: PlayerSkinConfig;
  onUpdateInventory: (
    inventory: (ItemStack | null)[],
    armor?: (ItemStack | null)[],
    furnace?: FurnaceState,
  ) => void;
  onSpendLevels?: (levels: number) => void;
  onClose: () => void;
}

const ARMOR_LABELS = ['Mũ', 'Áo', 'Quần', 'Giày'];

const CREATIVE_TABS: { id: 'all' | CreativeCategory; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'building', label: 'Xây dựng' },
  { id: 'nether116', label: 'Nether' },
  { id: 'ores', label: 'Quặng' },
  { id: 'tools', label: 'Công cụ' },
  { id: 'armor_food', label: 'Giáp & Ăn' },
  { id: 'redstone', label: 'Redstone' },
  { id: 'decor_brew', label: 'Trang trí & Thuốc' },
];

function cloneStack(s: ItemStack | null): ItemStack | null {
  if (!s) return null;
  return {
    ...s,
    enchants: s.enchants ? { ...s.enchants } : undefined,
  };
}

function canStackTogether(a: ItemStack, b: ItemStack): boolean {
  if (a.itemId !== b.itemId) return false;
  const max = ITEM_DEFS[a.itemId]?.maxStack ?? 64;
  if (max <= 1) return false;
  if (a.enchants || b.enchants) return false;
  return true;
}

function addStackToArray(inv: (ItemStack | null)[], incoming: ItemStack): boolean {
  const max = ITEM_DEFS[incoming.itemId]?.maxStack ?? 64;
  let remaining = incoming.count;

  if (max > 1 && !incoming.enchants) {
    for (let i = 0; i < inv.length && remaining > 0; i++) {
      const slot = inv[i];
      if (slot && canStackTogether(slot, incoming) && slot.count < max) {
        const add = Math.min(remaining, max - slot.count);
        inv[i] = { ...slot, count: slot.count + add };
        remaining -= add;
      }
    }
  }
  for (let i = 0; i < inv.length && remaining > 0; i++) {
    if (!inv[i]) {
      const add = Math.min(remaining, max);
      inv[i] = {
        itemId: incoming.itemId,
        count: add,
        enchants: incoming.enchants ? { ...incoming.enchants } : undefined,
      };
      remaining -= add;
    }
  }
  return remaining === 0;
}

export const ContainerModal: React.FC<ContainerModalProps> = ({
  type,
  gameMode,
  inventory,
  armor,
  furnace,
  playerLevel = 0,
  enchantBookshelves = 0,
  pack,
  playerSkin,
  onUpdateInventory,
  onSpendLevels,
  onClose,
}) => {
  const isCreativeCatalog = type === 'inventory' && gameMode === 'creative';
  const gridSize: 2 | 3 = type === 'crafting' ? 3 : 2;

  const [cursor, setCursor] = useState<ItemStack | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>(() =>
    Array.from({ length: gridSize * gridSize }, () => null),
  );
  const [smithBase, setSmithBase] = useState<ItemStack | null>(null);
  const [smithAdd, setSmithAdd] = useState<ItemStack | null>(null);
  const [enchItem, setEnchItem] = useState<ItemStack | null>(null);
  const [enchLapis, setEnchLapis] = useState<ItemStack | null>(null);
  const [enchantSeed, setEnchantSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [anvilLeft, setAnvilLeft] = useState<ItemStack | null>(null);
  const [anvilRight, setAnvilRight] = useState<ItemStack | null>(null);

  // Creative & Recipe Book filters
  const [creativeTab, setCreativeTab] = useState<'all' | CreativeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipeQuery, setRecipeQuery] = useState('');

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const invSlotSize = Math.max(30, Math.min(44, Math.floor((viewportWidth - 52 - 32) / 9)));

  useEffect(() => {
    setCraftGrid(Array.from({ length: gridSize * gridSize }, () => null));
    setSmithBase(null);
    setSmithAdd(null);
    setEnchItem(null);
    setEnchLapis(null);
    setAnvilLeft(null);
    setAnvilRight(null);
  }, [type, gridSize]);

  const handleSafeClose = () => {
    const nextInv = inventory.map(cloneStack);
    if (cursor) addStackToArray(nextInv, cursor);
    for (const s of craftGrid) if (s) addStackToArray(nextInv, s);
    if (smithBase) addStackToArray(nextInv, smithBase);
    if (smithAdd) addStackToArray(nextInv, smithAdd);
    if (enchItem) addStackToArray(nextInv, enchItem);
    if (enchLapis) addStackToArray(nextInv, enchLapis);
    if (anvilLeft) addStackToArray(nextInv, anvilLeft);
    if (anvilRight) addStackToArray(nextInv, anvilRight);
    onUpdateInventory(nextInv);
    onClose();
  };

  const safeCloseRef = useRef(handleSafeClose);
  safeCloseRef.current = handleSafeClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.code === 'KeyE' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        safeCloseRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setInvSlot = (idx: number, next: ItemStack | null) => {
    const copy = inventory.map(cloneStack);
    copy[idx] = next;
    onUpdateInventory(copy);
  };

  const setArmorSlot = (idx: number, next: ItemStack | null) => {
    const copy = armor.map(cloneStack);
    copy[idx] = next;
    onUpdateInventory(inventory, copy);
  };

  const setFurnaceSlot = (key: 'input' | 'fuel' | 'output', next: ItemStack | null) => {
    const nextF: FurnaceState = { ...furnace, [key]: next };
    onUpdateInventory(inventory, undefined, nextF);
  };

  // Quick-equip held cursor armor piece in 1 click/tap
  const cursorArmorSlot = cursor ? ITEM_DEFS[cursor.itemId]?.armorSlot : undefined;
  const handleQuickEquipCursorArmor = () => {
    if (!cursor || cursorArmorSlot === undefined) return;
    const nextArmor = armor.map(cloneStack);
    const prev = nextArmor[cursorArmorSlot];
    nextArmor[cursorArmorSlot] = { ...cursor, count: 1 };
    setCursor(prev);
    onUpdateInventory(inventory, nextArmor);
    soundEngine.playClick();
  };

  // Shift+Click inventory slot to instantly equip armor
  const handleInvSlotClick = (slotIdx: number, e?: React.MouseEvent) => {
    const cur = inventory[slotIdx];
    if (e?.shiftKey && cur && !cursor) {
      const aSlot = ITEM_DEFS[cur.itemId]?.armorSlot;
      if (aSlot !== undefined) {
        const nextInv = inventory.map(cloneStack);
        const nextArmor = armor.map(cloneStack);
        const prevArmor = nextArmor[aSlot];
        nextArmor[aSlot] = { ...cur, count: 1 };
        nextInv[slotIdx] = prevArmor;
        onUpdateInventory(nextInv, nextArmor);
        soundEngine.playClick();
        return;
      }
    }
    interactSlot(cur, (n) => setInvSlot(slotIdx, n));
  };

  // Shift+Click armor slot to quickly unequip back to inventory
  const handleArmorSlotClick = (idx: number, e?: React.MouseEvent) => {
    const cur = armor[idx];
    if (e?.shiftKey && cur && !cursor) {
      const nextInv = inventory.map(cloneStack);
      if (addStackToArray(nextInv, cur)) {
        const nextArmor = armor.map(cloneStack);
        nextArmor[idx] = null;
        onUpdateInventory(nextInv, nextArmor);
        soundEngine.playClick();
        return;
      }
    }
    interactSlot(cur, (n) => setArmorSlot(idx, n), false, (st) => {
      return ITEM_DEFS[st.itemId]?.armorSlot === idx;
    });
  };

  // Generic slot interaction
  const interactSlot = (
    current: ItemStack | null,
    setter: (next: ItemStack | null) => void,
    rightClick = false,
    filter?: (stack: ItemStack) => boolean,
  ) => {
    const useSplit = rightClick || splitMode;
    const cur = cloneStack(current);
    const hand = cloneStack(cursor);

    if (useSplit) {
      if (!hand && cur) {
        const take = Math.ceil(cur.count / 2);
        const left = cur.count - take;
        setCursor({ ...cur, count: take });
        setter(left > 0 ? { ...cur, count: left } : null);
      } else if (hand) {
        if (filter && !filter(hand)) return;
        if (!cur) {
          setter({ ...hand, count: 1 });
          setCursor(hand.count > 1 ? { ...hand, count: hand.count - 1 } : null);
        } else if (canStackTogether(cur, hand)) {
          const max = ITEM_DEFS[cur.itemId]?.maxStack ?? 64;
          if (cur.count < max) {
            setter({ ...cur, count: cur.count + 1 });
            setCursor(hand.count > 1 ? { ...hand, count: hand.count - 1 } : null);
          }
        }
      }
      return;
    }

    if (!hand) {
      if (cur) {
        setCursor(cur);
        setter(null);
      }
      return;
    }
    if (filter && !filter(hand)) return;

    if (!cur) {
      setter(hand);
      setCursor(null);
      return;
    }
    if (canStackTogether(cur, hand)) {
      const max = ITEM_DEFS[cur.itemId]?.maxStack ?? 64;
      const space = max - cur.count;
      if (space > 0) {
        const move = Math.min(space, hand.count);
        setter({ ...cur, count: cur.count + move });
        setCursor(hand.count > move ? { ...hand, count: hand.count - move } : null);
        return;
      }
    }
    setter(hand);
    setCursor(cur);
  };

  // --- Crafting match & craft execution ---
  const matchedRecipe = useMemo(() => {
    if (type !== 'crafting' && (type !== 'inventory' || isCreativeCatalog)) return null;
    return matchCraftingGrid(craftGrid, gridSize);
  }, [craftGrid, gridSize, type, isCreativeCatalog]);

  const handleTakeCraftOutput = () => {
    if (!matchedRecipe) return;
    const outDef = ITEM_DEFS[matchedRecipe.output.itemId];
    const maxStack = outDef?.maxStack ?? 64;
    const outStack: ItemStack = {
      itemId: matchedRecipe.output.itemId,
      count: matchedRecipe.output.count,
    };

    if (cursor) {
      if (!canStackTogether(cursor, outStack) || cursor.count + outStack.count > maxStack) return;
      setCursor({ ...cursor, count: cursor.count + outStack.count });
    } else {
      setCursor(outStack);
    }

    setCraftGrid((prev) =>
      prev.map((st) => {
        if (!st) return null;
        return st.count > 1 ? { ...st, count: st.count - 1 } : null;
      }),
    );
    soundEngine.playClick();
  };

  const itemCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const st of [...inventory, ...craftGrid]) {
      if (st) map[st.itemId] = (map[st.itemId] || 0) + st.count;
    }
    return map;
  }, [inventory, craftGrid]);

  const canAffordRecipe = (recipe: CraftingRecipe): boolean => {
    if (recipe.pattern) {
      if (recipe.pattern.length > gridSize || recipe.pattern[0].length > gridSize) return false;
    } else if (recipe.shapeless) {
      if (recipe.shapeless.length > gridSize * gridSize) return false;
    }
    const needed: Record<string, number> = {};
    if (recipe.shapeless) {
      for (const id of recipe.shapeless) needed[id] = (needed[id] || 0) + 1;
    } else if (recipe.pattern) {
      for (const row of recipe.pattern) {
        for (const id of row) if (id) needed[id] = (needed[id] || 0) + 1;
      }
    }
    return Object.entries(needed).every(([id, count]) => (itemCounts[id] || 0) >= count);
  };

  const handleQuickFillRecipe = (recipe: CraftingRecipe) => {
    const nextInv = inventory.map(cloneStack);
    for (const s of craftGrid) {
      if (s) addStackToArray(nextInv, s);
    }

    const pullOne = (itemId: string): boolean => {
      for (let i = 0; i < nextInv.length; i++) {
        const st = nextInv[i];
        if (st && st.itemId === itemId) {
          nextInv[i] = st.count > 1 ? { ...st, count: st.count - 1 } : null;
          return true;
        }
      }
      return false;
    };

    const nextGrid: (ItemStack | null)[] = Array.from({ length: gridSize * gridSize }, () => null);
    let ok = true;

    if (recipe.shapeless) {
      recipe.shapeless.forEach((id, idx) => {
        if (idx >= nextGrid.length || !pullOne(id)) ok = false;
        else nextGrid[idx] = { itemId: id, count: 1 };
      });
    } else if (recipe.pattern) {
      for (let r = 0; r < recipe.pattern.length; r++) {
        for (let c = 0; c < recipe.pattern[r].length; c++) {
          const id = recipe.pattern[r][c];
          if (!id) continue;
          if (r >= gridSize || c >= gridSize || !pullOne(id)) {
            ok = false;
          } else {
            nextGrid[r * gridSize + c] = { itemId: id, count: 1 };
          }
        }
      }
    }

    if (!ok) return;
    onUpdateInventory(nextInv);
    setCraftGrid(nextGrid);
    soundEngine.playClick();
  };

  // --- Smithing Table ---
  const smithOutput = useMemo(
    () => (type === 'smithing' ? matchSmithing(smithBase, smithAdd) : null),
    [type, smithBase, smithAdd],
  );

  const handleForgeSmithing = () => {
    if (!smithOutput || !smithBase || !smithAdd) return;
    if (cursor) return;
    setCursor(smithOutput);
    setSmithBase(null);
    setSmithAdd(smithAdd.count > 1 ? { ...smithAdd, count: smithAdd.count - 1 } : null);
    soundEngine.playAnvil();
  };

  // --- Enchanting Table ---
  const canEnchantCurrent =
    type === 'enchanting' &&
    Boolean(enchItem) &&
    isEnchantableItem(enchItem!.itemId) &&
    (!enchItem!.enchants || Object.keys(enchItem!.enchants).length === 0);

  const enchantOffers = useMemo(() => {
    if (!canEnchantCurrent || !enchItem) return [];
    return generateEnchantOffers(enchItem.itemId, enchantBookshelves, enchantSeed);
  }, [canEnchantCurrent, enchItem, enchantBookshelves, enchantSeed]);

  const handleApplyEnchant = (offer: EnchantOffer) => {
    if (!enchItem || !canEnchantCurrent) return;
    const isCreative = gameMode === 'creative';
    const lapisCount = enchLapis?.itemId === 'lapis_lazuli' ? enchLapis.count : 0;
    if (!isCreative && (playerLevel < offer.minLevel || lapisCount < offer.lapisCost)) return;

    const enchanted = applyEnchantOffer(enchItem, offer);
    setEnchItem(enchanted);
    if (!isCreative) {
      if (enchLapis && enchLapis.itemId === 'lapis_lazuli') {
        const left = enchLapis.count - offer.lapisCost;
        setEnchLapis(left > 0 ? { ...enchLapis, count: left } : null);
      }
      onSpendLevels?.(offer.xpCost);
    }
    setEnchantSeed((s) => s + 17);
    soundEngine.playLevelUp();
  };

  // --- Anvil ---
  const anvilResult = useMemo(
    () => (type === 'anvil' ? combineAnvilItems(anvilLeft, anvilRight) : null),
    [type, anvilLeft, anvilRight],
  );

  const handleTakeAnvilOutput = () => {
    if (!anvilResult || !anvilLeft || !anvilRight) return;
    if (cursor) return;
    const isCreative = gameMode === 'creative';
    if (!isCreative && playerLevel < anvilResult.xpCost) return;

    setCursor(anvilResult.output);
    setAnvilLeft(null);
    setAnvilRight(anvilRight.count > 1 ? { ...anvilRight, count: anvilRight.count - 1 } : null);
    if (!isCreative) {
      onSpendLevels?.(anvilResult.xpCost);
    }
    soundEngine.playAnvil();
  };

  // --- Creative Catalog items ---
  const catalogItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return Object.values(ITEM_DEFS).filter((item) => {
      if (creativeTab !== 'all' && item.category !== creativeTab) return false;
      if (q && !item.nameVi.toLowerCase().includes(q) && !item.id.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [creativeTab, searchQuery]);

  const handlePickCreativeItem = (itemId: string, e?: React.MouseEvent) => {
    const def = ITEM_DEFS[itemId];
    if (!def) return;
    // Shift-click armor in Creative to equip immediately!
    if (e?.shiftKey && def.armorSlot !== undefined) {
      const nextArmor = armor.map(cloneStack);
      nextArmor[def.armorSlot] = { itemId, count: 1 };
      onUpdateInventory(inventory, nextArmor);
      soundEngine.playClick();
      return;
    }
    const stack: ItemStack = { itemId, count: def.maxStack };
    if (!cursor) {
      setCursor(stack);
    } else {
      const copy = inventory.map(cloneStack);
      addStackToArray(copy, stack);
      onUpdateInventory(copy);
    }
    soundEngine.playClick();
  };

  const totalDefense = armor.reduce(
    (sum, st) => sum + (st ? ITEM_DEFS[st.itemId]?.armorDefense || 0 : 0),
    0,
  );

  const titleMap: Record<Exclude<ContainerType, 'none'>, string> = {
    inventory: isCreativeCatalog ? 'Kho Sáng Tạo' : 'Túi Đồ',
    crafting: 'Bàn Chế Tạo',
    furnace: 'Lò Nung',
    smithing: 'Bàn Rèn',
    enchanting: 'Bàn Phù Phép',
    anvil: 'Đe Rèn',
  };

  const relevantRecipes = useMemo(() => {
    const q = recipeQuery.trim().toLowerCase();
    return CRAFTING_RECIPES.filter((r) => {
      if (r.pattern && (r.pattern.length > gridSize || r.pattern[0].length > gridSize)) return false;
      if (r.shapeless && r.shapeless.length > gridSize * gridSize) return false;
      if (q && !r.nameVi.toLowerCase().includes(q) && !r.output.itemId.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    }).sort((a, b) => Number(canAffordRecipe(b)) - Number(canAffordRecipe(a)));
  }, [gridSize, recipeQuery, itemCounts]);

  return (
    <div
      className="fixed inset-0 z-30 bg-black/65 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
    >
      <div className="mc-window w-full max-w-[780px] p-2.5 sm:p-4 my-auto text-[#3f3f3f]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b-2 border-[#8b8b8b]">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-mc font-bold text-sm sm:text-base text-[#262626] truncate">
              {titleMap[type]}
            </h2>
            {cursor && (
              <span className="text-[11px] font-mono-num bg-[#525252] text-white px-2 py-0.5 truncate max-w-[160px] sm:max-w-none">
                {ITEM_DEFS[cursor.itemId]?.nameVi || cursor.itemId} ×{cursor.count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {cursorArmorSlot !== undefined && (
              <McButton
                variant="primary"
                widgetsUrl={pack.guiUrls.widgets}
                onClick={handleQuickEquipCursorArmor}
                className="min-h-[34px] h-[34px] px-2.5 py-1 text-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Mặc giáp</span>
              </McButton>
            )}
            <McButton
              variant={splitMode ? 'primary' : 'stone'}
              widgetsUrl={pack.guiUrls.widgets}
              onClick={() => setSplitMode((v) => !v)}
              className="min-h-[34px] h-[34px] px-2.5 py-1 text-xs"
            >
              {splitMode ? 'Tách 1' : 'Cầm hết'}
            </McButton>
            <McButton
              widgetsUrl={pack.guiUrls.widgets}
              onClick={handleSafeClose}
              aria-label="Đóng"
              className="min-h-[34px] min-w-[34px] h-[34px] px-2 py-1 text-xs"
            >
              <X className="w-4 h-4" />
            </McButton>
          </div>
        </div>

        {/* --- CREATIVE CATALOG + ARMOR BAR --- */}
        {isCreativeCatalog && (
          <div className="space-y-2.5 mb-3">
            {/* Compact Armor Equip Strip in Creative */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#b8b8b8] border-2 border-[#8b8b8b] px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#3f3f3f]" />
                <span className="text-xs font-mc font-bold text-[#222]">
                  Giáp ({totalDefense}/20)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {ARMOR_LABELS.map((label, idx) => (
                  <McItemSlot
                    key={label}
                    stack={armor[idx]}
                    pack={pack}
                    size={38}
                    placeholder={label}
                    onClick={(e) => handleArmorSlotClick(idx, e)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {CREATIVE_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCreativeTab(t.id)}
                  className={`px-2 py-1 text-xs font-mc font-bold border-2 border-black cursor-pointer ${
                    creativeTab === t.id
                      ? 'bg-[#c6c6c6] text-[#111] shadow-[inset_2px_2px_0_#fff]'
                      : 'bg-[#8b8b8b] text-[#e8e8e8] hover:bg-[#9e9e9e]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="relative flex-1 min-w-[140px] ml-auto">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full bg-[#222] text-white border-2 border-black pl-7 pr-2 py-1 text-xs outline-none"
                />
              </div>
            </div>

            <div className="bg-[#8b8b8b] border-2 border-[#373737] p-2 max-h-[205px] overflow-y-auto">
              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 gap-1">
                {catalogItems.map((item) => (
                  <McItemSlot
                    key={item.id}
                    stack={{ itemId: item.id, count: 1 }}
                    pack={pack}
                    size={42}
                    title={item.nameVi}
                    onClick={(e) => handlePickCreativeItem(item.id, e)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- SURVIVAL INVENTORY (ARMOR + 2x2 CRAFTING) --- */}
        {type === 'inventory' && !isCreativeCatalog && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#b8b8b8] border-2 border-[#8b8b8b] p-2.5">
              {/* Armor column + classic black 3D character box (NO Skin button here!) */}
              <div className="flex items-center gap-2.5">
                <div className="flex flex-col gap-1">
                  {ARMOR_LABELS.map((label, idx) => (
                    <McItemSlot
                      key={label}
                      stack={armor[idx]}
                      pack={pack}
                      size={40}
                      placeholder={label}
                      onClick={(e) => handleArmorSlotClick(idx, e)}
                    />
                  ))}
                </div>
                <div className="bg-black border-2 border-[#373737] w-[108px] flex flex-col items-center justify-between p-1">
                  <SkinPreview3D skin={playerSkin} armor={armor} walking={false} height={144} interactive />
                  <div className="text-[10px] font-mono-num text-zinc-300">
                    Giáp: {totalDefense}/20
                  </div>
                </div>
              </div>

              {/* 2x2 Crafting */}
              <div className="flex items-center gap-2.5">
                <div>
                  <div className="text-xs font-mc font-bold mb-1">Chế tạo</div>
                  <div className="grid grid-cols-2 gap-1">
                    {craftGrid.map((st, idx) => (
                      <McItemSlot
                        key={idx}
                        stack={st}
                        pack={pack}
                        size={40}
                        onClick={() =>
                          interactSlot(st, (n) =>
                            setCraftGrid((prev) => prev.map((v, i) => (i === idx ? n : v))),
                          )
                        }
                        onContextMenu={() =>
                          interactSlot(
                            st,
                            (n) => setCraftGrid((prev) => prev.map((v, i) => (i === idx ? n : v))),
                            true,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
                {pack.guiUrls.containerCrafting ? (
                  <McSpriteSlice
                    src={pack.guiUrls.containerCrafting}
                    sx={90}
                    sy={35}
                    sw={22}
                    sh={15}
                    width={33}
                    height={22}
                  />
                ) : (
                  <div className="text-lg font-bold text-[#444]">→</div>
                )}
                <McItemSlot
                  stack={
                    matchedRecipe
                      ? { itemId: matchedRecipe.output.itemId, count: matchedRecipe.output.count }
                      : null
                  }
                  pack={pack}
                  size={44}
                  active={Boolean(matchedRecipe)}
                  onClick={handleTakeCraftOutput}
                />
              </div>
            </div>

            {/* Quick 2x2 Recipe Book */}
            <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-2 max-h-[192px] flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
                {pack.guiUrls.recipeButton && (
                  <span
                    className="inline-block w-5 h-[18px] pixelated shrink-0"
                    style={{
                      backgroundImage: `url(${pack.guiUrls.recipeButton})`,
                      backgroundSize: '100% 200%',
                      backgroundPosition: '0% 0%',
                    }}
                  />
                )}
                <span className="text-xs font-mc font-bold text-[#222]">Công thức</span>
                <input
                  type="text"
                  value={recipeQuery}
                  onChange={(e) => setRecipeQuery(e.target.value)}
                  placeholder="Tìm..."
                  className="flex-1 min-w-0 bg-[#222] text-white border border-black px-1.5 py-0.5 text-[11px] outline-none"
                />
              </div>
              <div className="space-y-1 overflow-y-auto flex-1">
                {relevantRecipes.map((r) => {
                  const ok = canAffordRecipe(r);
                  const icon = pack.itemIcons[r.output.itemId];
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={!ok}
                      onClick={() => handleQuickFillRecipe(r)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs border border-black/40 ${
                        ok
                          ? 'bg-[#d4d4d4] hover:bg-white text-black cursor-pointer'
                          : 'bg-[#9a9a9a] text-[#555] opacity-65 cursor-not-allowed'
                      }`}
                    >
                      {icon && <img src={icon} alt="" className="w-5 h-5 pixelated shrink-0" />}
                      <span className="truncate font-medium flex-1">{r.nameVi}</span>
                      <span className="font-mono-num text-[10px]">×{r.output.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- CRAFTING TABLE 3x3 --- */}
        {type === 'crafting' && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_270px] gap-3 mb-3">
            <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-3 flex items-center justify-center gap-4">
              <div className="grid grid-cols-3 gap-1">
                {craftGrid.map((st, idx) => (
                  <McItemSlot
                    key={idx}
                    stack={st}
                    pack={pack}
                    size={44}
                    onClick={() =>
                      interactSlot(st, (n) =>
                        setCraftGrid((prev) => prev.map((v, i) => (i === idx ? n : v))),
                      )
                    }
                    onContextMenu={() =>
                      interactSlot(
                        st,
                        (n) => setCraftGrid((prev) => prev.map((v, i) => (i === idx ? n : v))),
                        true,
                      )
                    }
                  />
                ))}
              </div>
              {pack.guiUrls.containerCrafting ? (
                <McSpriteSlice
                  src={pack.guiUrls.containerCrafting}
                  sx={90}
                  sy={35}
                  sw={22}
                  sh={15}
                  width={44}
                  height={30}
                />
              ) : (
                <div className="text-2xl font-bold text-[#444]">→</div>
              )}
              <McItemSlot
                stack={
                  matchedRecipe
                    ? { itemId: matchedRecipe.output.itemId, count: matchedRecipe.output.count }
                    : null
                }
                pack={pack}
                size={50}
                active={Boolean(matchedRecipe)}
                onClick={handleTakeCraftOutput}
              />
            </div>

            <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-2 max-h-[210px] flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
                {pack.guiUrls.recipeButton && (
                  <span
                    className="inline-block w-5 h-[18px] pixelated shrink-0"
                    style={{
                      backgroundImage: `url(${pack.guiUrls.recipeButton})`,
                      backgroundSize: '100% 200%',
                      backgroundPosition: '0% 0%',
                    }}
                  />
                )}
                <span className="text-xs font-mc font-bold text-[#222]">
                  Công thức ({relevantRecipes.length})
                </span>
                <input
                  type="text"
                  value={recipeQuery}
                  onChange={(e) => setRecipeQuery(e.target.value)}
                  placeholder="Tìm..."
                  className="flex-1 min-w-0 bg-[#222] text-white border border-black px-1.5 py-0.5 text-[11px] outline-none"
                />
              </div>
              <div className="space-y-1 overflow-y-auto flex-1">
                {relevantRecipes.map((r) => {
                  const ok = canAffordRecipe(r);
                  const icon = pack.itemIcons[r.output.itemId];
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={!ok}
                      onClick={() => handleQuickFillRecipe(r)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs border border-black/40 ${
                        ok
                          ? 'bg-[#e2e2e2] hover:bg-white text-black cursor-pointer'
                          : 'bg-[#9a9a9a] text-[#555] opacity-65 cursor-not-allowed'
                      }`}
                    >
                      {icon && <img src={icon} alt="" className="w-5 h-5 pixelated shrink-0" />}
                      <span className="truncate font-medium flex-1">{r.nameVi}</span>
                      <span className="font-mono-num text-[10px]">×{r.output.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- FURNACE --- */}
        {type === 'furnace' && (
          <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-4 mb-3">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <McItemSlot
                  stack={furnace.input}
                  pack={pack}
                  size={48}
                  placeholder="Quặng"
                  onClick={() => interactSlot(furnace.input, (n) => setFurnaceSlot('input', n))}
                  onContextMenu={() =>
                    interactSlot(furnace.input, (n) => setFurnaceSlot('input', n), true)
                  }
                />
                <div className="flex items-center gap-1.5 text-xs font-mono-num">
                  {pack.guiUrls.containerFurnace ? (
                    <div className="relative w-[28px] h-[28px]">
                      <McSpriteSlice
                        src={pack.guiUrls.containerFurnace}
                        sx={56}
                        sy={36}
                        sw={14}
                        sh={14}
                        width={28}
                        height={28}
                        className="block"
                      />
                      {furnace.burnTime > 0 && (
                        <div
                          className="absolute inset-x-0 bottom-0 overflow-hidden"
                          style={{
                            height: `${Math.min(
                              100,
                              Math.max(12, Math.round((furnace.burnTime / Math.max(1, furnace.burnMax || 10)) * 100)),
                            )}%`,
                          }}
                        >
                          <div className="absolute inset-x-0 bottom-0 h-[28px]">
                            <McSpriteSlice
                              src={pack.guiUrls.containerFurnace}
                              sx={176}
                              sy={0}
                              sw={14}
                              sh={14}
                              width={28}
                              height={28}
                              className="block"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Flame
                      className={`w-5 h-5 ${furnace.burnTime > 0 ? 'text-orange-600 fill-amber-400' : 'text-zinc-500'}`}
                    />
                  )}
                  <span>{furnace.burnTime > 0 ? `${Math.ceil(furnace.burnTime)}s` : 'Tắt'}</span>
                </div>
                <McItemSlot
                  stack={furnace.fuel}
                  pack={pack}
                  size={48}
                  placeholder="Than"
                  onClick={() => interactSlot(furnace.fuel, (n) => setFurnaceSlot('fuel', n))}
                  onContextMenu={() =>
                    interactSlot(furnace.fuel, (n) => setFurnaceSlot('fuel', n), true)
                  }
                />
              </div>

              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                {pack.guiUrls.containerFurnace ? (
                  <div className="relative w-[48px] h-[34px]">
                    <McSpriteSlice
                      src={pack.guiUrls.containerFurnace}
                      sx={79}
                      sy={34}
                      sw={24}
                      sh={17}
                      width={48}
                      height={34}
                      className="block"
                    />
                    <div
                      className="absolute left-0 top-0 bottom-0 overflow-hidden"
                      style={{ width: `${Math.round(furnace.cookProgress * 100)}%` }}
                    >
                      <McSpriteSlice
                        src={pack.guiUrls.containerFurnace}
                        sx={176}
                        sy={14}
                        sw={24}
                        sh={17}
                        width={48}
                        height={34}
                        className="block"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-3.5 bg-[#555] border border-black overflow-hidden">
                    <div
                      className="h-full bg-[#f59e0b]"
                      style={{ width: `${Math.round(furnace.cookProgress * 100)}%` }}
                    />
                  </div>
                )}
                <span className="text-xs font-mono-num text-[#333]">
                  {Math.round(furnace.cookProgress * 100)}%
                </span>
              </div>

              <McItemSlot
                stack={furnace.output}
                pack={pack}
                size={52}
                active={Boolean(furnace.output)}
                onClick={() => {
                  if (!furnace.output) return;
                  interactSlot(furnace.output, (n) => setFurnaceSlot('output', n));
                }}
              />
            </div>
          </div>
        )}

        {/* --- SMITHING TABLE --- */}
        {type === 'smithing' && (
          <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-4 mb-3">
            <div className="flex items-center gap-2.5 justify-center mb-3 text-xs font-mc font-bold text-[#222]">
              {pack.guiUrls.containerSmithing ? (
                <McSpriteSlice
                  src={pack.guiUrls.containerSmithing}
                  sx={17}
                  sy={7}
                  sw={30}
                  sh={30}
                  width={34}
                  height={34}
                />
              ) : (
                <Hammer className="w-4 h-4" />
              )}
              <span>Nâng cấp Netherite</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <McItemSlot
                stack={smithBase}
                pack={pack}
                size={48}
                placeholder="KC"
                onClick={() => interactSlot(smithBase, setSmithBase)}
              />
              {pack.guiUrls.containerSmithing ? (
                <McSpriteSlice
                  src={pack.guiUrls.containerSmithing}
                  sx={53}
                  sy={49}
                  sw={13}
                  sh={13}
                  width={22}
                  height={22}
                />
              ) : (
                <span className="text-xl font-bold">+</span>
              )}
              <McItemSlot
                stack={smithAdd}
                pack={pack}
                size={48}
                placeholder="Neth"
                onClick={() => interactSlot(smithAdd, setSmithAdd)}
              />
              {pack.guiUrls.containerSmithing ? (
                <McSpriteSlice
                  src={pack.guiUrls.containerSmithing}
                  sx={99}
                  sy={48}
                  sw={22}
                  sh={15}
                  width={40}
                  height={27}
                />
              ) : (
                <span className="text-xl font-bold">→</span>
              )}
              <McItemSlot
                stack={smithOutput}
                pack={pack}
                size={52}
                active={Boolean(smithOutput)}
                onClick={handleForgeSmithing}
              />
            </div>
          </div>
        )}

        {/* --- ENCHANTING TABLE (BÀN PHÙ PHÉP) --- */}
        {type === 'enchanting' && (
          <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-3 sm:p-4 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mc font-bold text-[#222]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>Bàn Phù Phép</span>
              </div>
              <div className="font-mono-num text-[11px] bg-[#2a2335] text-purple-200 px-2 py-0.5 border border-black">
                Kệ sách: {enchantBookshelves}/15 · Cấp XP: {gameMode === 'creative' ? '∞' : playerLevel}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 items-center">
              <div className="flex flex-col items-center gap-2 bg-[#a8a8a8] border-2 border-[#757575] p-3">
                <div className="flex items-center gap-2.5">
                  <McItemSlot
                    stack={enchItem}
                    pack={pack}
                    size={50}
                    placeholder="Đồ"
                    onClick={() => interactSlot(enchItem, setEnchItem)}
                  />
                  <McItemSlot
                    stack={enchLapis}
                    pack={pack}
                    size={50}
                    placeholder="Ngọc"
                    onClick={() =>
                      interactSlot(enchLapis, setEnchLapis, false, (s) => s.itemId === 'lapis_lazuli')
                    }
                    onContextMenu={() =>
                      interactSlot(enchLapis, setEnchLapis, true, (s) => s.itemId === 'lapis_lazuli')
                    }
                  />
                </div>
                <div className="text-[11px] text-center text-[#2f2f2f] leading-tight">
                  Đặt vũ khí, dụng cụ, giáp hoặc Sách + Ngọc Lưu Ly
                </div>
                {enchItem?.enchants && Object.keys(enchItem.enchants).length > 0 && (
                  <div className="w-full bg-[#241933] border border-black px-2 py-1 text-[11px] text-purple-200 text-center">
                    {formatItemEnchants(enchItem.enchants).join(' · ')}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {enchantOffers.length > 0 ? (
                  enchantOffers.map((offer) => {
                    const isCreative = gameMode === 'creative';
                    const lapisCount = enchLapis?.itemId === 'lapis_lazuli' ? enchLapis.count : 0;
                    const canAfford =
                      isCreative || (playerLevel >= offer.minLevel && lapisCount >= offer.lapisCost);
                    return (
                      <button
                        key={offer.tier}
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handleApplyEnchant(offer)}
                        className={`w-full px-3 py-2 border-2 border-black text-left transition-colors flex items-center justify-between gap-2 ${
                          canAfford
                            ? 'bg-[#6b5344] hover:bg-[#7d5ba6] text-[#fde68a] cursor-pointer shadow-[inset_2px_2px_0_rgba(255,255,255,0.22)]'
                            : 'bg-[#5c514a] text-[#b4a89e] opacity-70 cursor-not-allowed'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] tracking-widest opacity-80 truncate">
                            {offer.runes}
                          </div>
                          <div className="font-mc text-xs sm:text-sm font-bold text-white mc-text-shadow-sm truncate">
                            {formatEnchantLabel(offer.primaryId, offer.primaryLevel)}
                            {offer.bonus ? ' + ...' : ''}
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 font-mono-num text-[11px]">
                          <span className={canAfford ? 'text-[#80ff20] font-bold' : 'text-red-300'}>
                            Cấp {offer.minLevel}
                          </span>
                          <span className="text-sky-200 text-[10px]">
                            {isCreative ? 'Miễn phí' : `${offer.lapisCost} Ngọc · -${offer.xpCost} XP`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="bg-[#5c514a] border-2 border-black p-4 text-center text-xs text-zinc-200">
                    {!enchItem
                      ? 'Đặt kiếm, cuốc, rìu, cung, nỏ, đinh ba, chùy, giáp hoặc sách vào ô bên trái.'
                      : enchItem.enchants && Object.keys(enchItem.enchants).length > 0
                        ? 'Vật phẩm đã được phù phép! Hãy lấy ra hoặc ghép thêm trên Đe Rèn.'
                        : 'Vật phẩm này không thể phù phép trên Bàn Phù Phép.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ANVIL (ĐE RÈN) --- */}
        {type === 'anvil' && (
          <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-3 sm:p-4 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mc font-bold text-[#222]">
              <div className="flex items-center gap-1.5">
                <Hammer className="w-4 h-4" />
                <span>Đe Rèn · Sửa Chữa &amp; Ghép Phù Phép</span>
              </div>
              <div className="font-mono-num text-[11px] bg-[#2a2a2a] text-[#80ff20] px-2 py-0.5 border border-black">
                Cấp XP: {gameMode === 'creative' ? '∞' : playerLevel}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <McItemSlot
                stack={anvilLeft}
                pack={pack}
                size={50}
                placeholder="Trang bị"
                onClick={() => interactSlot(anvilLeft, setAnvilLeft)}
              />
              <span className="text-xl font-bold text-[#333]">+</span>
              <McItemSlot
                stack={anvilRight}
                pack={pack}
                size={50}
                placeholder="Sách/Đồ"
                onClick={() => interactSlot(anvilRight, setAnvilRight)}
              />
              <span className="text-xl font-bold text-[#333]">→</span>
              <McItemSlot
                stack={anvilResult ? anvilResult.output : null}
                pack={pack}
                size={54}
                active={Boolean(anvilResult)}
                onClick={handleTakeAnvilOutput}
              />
            </div>

            <div className="mt-3 text-center text-xs">
              {anvilResult ? (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-[#231d2c] border border-black px-3 py-1.5 text-white">
                  <span className="text-purple-200 font-bold">{anvilResult.label}:</span>
                  {anvilResult.output.enchants && (
                    <span className="text-amber-200">
                      {formatItemEnchants(anvilResult.output.enchants).join(' · ')}
                    </span>
                  )}
                  <span
                    className={`font-mono-num font-bold ${
                      gameMode === 'creative' || playerLevel >= anvilResult.xpCost
                        ? 'text-[#80ff20]'
                        : 'text-red-400'
                    }`}
                  >
                    {gameMode === 'creative' ? 'Miễn phí' : `Chi phí: ${anvilResult.xpCost} cấp`}
                  </span>
                </div>
              ) : (
                <span className="text-[#444]">
                  Ghép Sách Phù Phép vào vũ khí/giáp, ghép 2 đồ giống nhau lên cấp cao hơn, hoặc sửa độ bền bằng phôi/kim cương.
                </span>
              )}
            </div>
          </div>
        )}

        {/* --- PLAYER MAIN INVENTORY (27 SLOTS) --- */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mc font-bold text-[#3f3f3f]">Túi đồ</span>
            {cursor && (
              <McButton
                variant="crimson"
                widgetsUrl={pack.guiUrls.widgets}
                onClick={() => setCursor(null)}
                className="min-h-[28px] h-[28px] px-2 py-0.5 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa
              </McButton>
            )}
          </div>
          <div className="grid grid-cols-9 gap-1 justify-items-center">
            {Array.from({ length: 27 }).map((_, i) => {
              const slotIdx = i + 9;
              return (
                <McItemSlot
                  key={slotIdx}
                  stack={inventory[slotIdx]}
                  pack={pack}
                  size={invSlotSize}
                  onClick={(e) => handleInvSlotClick(slotIdx, e)}
                  onContextMenu={() =>
                    interactSlot(inventory[slotIdx], (n) => setInvSlot(slotIdx, n), true)
                  }
                />
              );
            })}
          </div>
        </div>

        {/* --- HOTBAR (9 SLOTS) --- */}
        <div className="pt-2 border-t-2 border-[#8b8b8b]">
          <div className="grid grid-cols-9 gap-1 justify-items-center">
            {Array.from({ length: 9 }).map((_, idx) => (
              <McItemSlot
                key={idx}
                stack={inventory[idx]}
                pack={pack}
                size={invSlotSize}
                onClick={(e) => handleInvSlotClick(idx, e)}
                onContextMenu={() =>
                  interactSlot(inventory[idx], (n) => setInvSlot(idx, n), true)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
