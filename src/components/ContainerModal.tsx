import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Hammer, Search, Trash2, User, X } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { CreativeCategory, ITEM_DEFS } from '../game/blocks';
import {
  CRAFTING_RECIPES,
  CraftingRecipe,
  matchCraftingGrid,
  matchSmithing,
} from '../game/recipes';
import { CompiledResourcePack } from '../game/resourcePack';
import { ContainerType, FurnaceState, GameMode, ItemStack, PlayerSkinConfig } from '../game/types';
import { McButton, McItemSlot } from './McSprites';
import { SkinPreview3D } from './SkinPreview3D';

interface ContainerModalProps {
  type: Exclude<ContainerType, 'none'>;
  gameMode: GameMode;
  inventory: (ItemStack | null)[];
  armor: (ItemStack | null)[];
  furnace: FurnaceState;
  pack: CompiledResourcePack;
  playerSkin: PlayerSkinConfig;
  onOpenSkin: () => void;
  onUpdateInventory: (
    inventory: (ItemStack | null)[],
    armor?: (ItemStack | null)[],
    furnace?: FurnaceState,
  ) => void;
  onClose: () => void;
}

const ARMOR_LABELS = ['Mũ', 'Áo', 'Quần', 'Giày'];

const CREATIVE_TABS: { id: 'all' | CreativeCategory; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'nether116', label: 'Nether 1.16' },
  { id: 'building', label: 'Xây dựng' },
  { id: 'ores', label: 'Quặng & Đá' },
  { id: 'tools', label: 'Công cụ' },
  { id: 'armor_food', label: 'Giáp & Đồ ăn' },
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
  pack,
  playerSkin,
  onOpenSkin,
  onUpdateInventory,
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

  // Creative filters
  const [creativeTab, setCreativeTab] = useState<'all' | CreativeCategory>('nether116');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Responsive slot size so 9 columns never overflow narrow phones (320px–390px)
  const invSlotSize = Math.max(30, Math.min(44, Math.floor((viewportWidth - 52 - 32) / 9)));

  // Reset local grids if container type changes
  useEffect(() => {
    setCraftGrid(Array.from({ length: gridSize * gridSize }, () => null));
    setSmithBase(null);
    setSmithAdd(null);
  }, [type, gridSize]);

  // Escape or E closes modal and returns temp items to inventory
  const handleSafeClose = () => {
    const nextInv = inventory.map(cloneStack);
    if (cursor) addStackToArray(nextInv, cursor);
    for (const s of craftGrid) if (s) addStackToArray(nextInv, s);
    if (smithBase) addStackToArray(nextInv, smithBase);
    if (smithAdd) addStackToArray(nextInv, smithAdd);
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

  // Generic slot interaction (left click swap/merge, right click or mobile splitMode = split/place 1)
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
        // Pick up half
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

    // Left click
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
    // Swap
    setter(hand);
    setCursor(cur);
  };

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
    const nextF: FurnaceState = {
      ...furnace,
      [key]: next,
    };
    onUpdateInventory(inventory, undefined, nextF);
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

    // Consume 1 from each occupied slot in craftGrid
    setCraftGrid((prev) =>
      prev.map((st) => {
        if (!st) return null;
        return st.count > 1 ? { ...st, count: st.count - 1 } : null;
      }),
    );
    soundEngine.playClick();
  };

  // Recipe book helper: counts total available items in inventory + craftGrid
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

  // Auto-fill crafting grid from player inventory for a chosen recipe (PC & Mobile convenience)
  const handleQuickFillRecipe = (recipe: CraftingRecipe) => {
    const nextInv = inventory.map(cloneStack);
    // Return current craftGrid items back to inventory first
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

  // --- Smithing Table 1.16 ---
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

  const handlePickCreativeItem = (itemId: string) => {
    const def = ITEM_DEFS[itemId];
    if (!def) return;
    const stack: ItemStack = { itemId, count: def.maxStack };
    // If cursor empty, put in cursor; otherwise quick-add to hotbar/inventory
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
    inventory: isCreativeCatalog ? 'Kho Sáng Tạo 1.16 (Creative)' : 'Túi Đồ & Chế Tạo 2×2',
    crafting: 'Bàn Chế Tạo 3×3 (Crafting Table)',
    furnace: 'Lò Nung (Furnace)',
    smithing: 'Bàn Rèn Netherite 1.16 (Smithing Table)',
  };

  const relevantRecipes = useMemo(
    () =>
      CRAFTING_RECIPES.filter((r) => {
        if (r.pattern) return r.pattern.length <= gridSize && r.pattern[0].length <= gridSize;
        if (r.shapeless) return r.shapeless.length <= gridSize * gridSize;
        return true;
      }),
    [gridSize],
  );

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
            <h2 className="font-mc font-bold text-sm sm:text-lg text-[#262626] truncate">
              {titleMap[type]}
            </h2>
            {cursor && (
              <span className="text-[11px] sm:text-xs font-mono-num bg-[#52525b] text-white px-2 py-0.5 truncate max-w-[180px] sm:max-w-none">
                Đang cầm: {ITEM_DEFS[cursor.itemId]?.nameVi || cursor.itemId} ×{cursor.count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSplitMode((v) => !v)}
              className={`min-h-[36px] px-2.5 py-1 text-xs font-mc font-bold border-2 border-black cursor-pointer touch-manipulation ${
                splitMode ? 'bg-[#0f766e] text-white' : 'bg-[#a8a8a8] text-[#222]'
              }`}
            >
              {splitMode ? 'Chạm: Đặt 1 / Chia đôi' : 'Chạm: Cầm hết'}
            </button>
            <button
              type="button"
              onClick={handleSafeClose}
              aria-label="Đóng"
              className="mc-btn min-h-[36px] min-w-[36px] px-2.5 py-1 text-xs"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Đóng</span>
            </button>
          </div>
        </div>

        {/* --- CREATIVE CATALOG --- */}
        {isCreativeCatalog && (
          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {CREATIVE_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCreativeTab(t.id)}
                  className={`px-2.5 py-1.5 text-xs font-mc font-bold border-2 border-black cursor-pointer ${
                    creativeTab === t.id
                      ? 'bg-[#3f3f46] text-[#fde68a]'
                      : 'bg-[#a8a8a8] text-[#222] hover:bg-[#b8b8b8]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="relative flex-1 min-w-[160px] ml-auto">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khối / vật phẩm 1.16..."
                  className="w-full bg-[#222] text-white border-2 border-black pl-8 pr-2 py-1 text-xs outline-none"
                />
              </div>
            </div>

            <div className="bg-[#8b8b8b] border-2 border-[#373737] p-2 max-h-[210px] overflow-y-auto">
              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 gap-1">
                {catalogItems.map((item) => (
                  <McItemSlot
                    key={item.id}
                    stack={{ itemId: item.id, count: 1 }}
                    pack={pack}
                    size={42}
                    title={`${item.nameVi} (${item.id}) — Nhấn để lấy`}
                    onClick={() => handlePickCreativeItem(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- SURVIVAL INVENTORY (ARMOR + 2x2 CRAFTING) --- */}
        {type === 'inventory' && !isCreativeCatalog && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#b8b8b8] border-2 border-[#8b8b8b] p-3">
              {/* Armor column */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  {ARMOR_LABELS.map((label, idx) => (
                    <McItemSlot
                      key={label}
                      stack={armor[idx]}
                      pack={pack}
                      size={42}
                      placeholder={label}
                      onClick={() =>
                        interactSlot(armor[idx], (n) => setArmorSlot(idx, n), false, (st) => {
                          return ITEM_DEFS[st.itemId]?.armorSlot === idx;
                        })
                      }
                    />
                  ))}
                </div>
                <div className="bg-[#120f1a] border-2 border-black w-[114px] flex flex-col items-center justify-between p-1.5">
                  <SkinPreview3D skin={playerSkin} armor={armor} walking={false} height={138} interactive />
                  <div className="text-[10px] font-mono-num text-zinc-300">
                    Giáp: {totalDefense}/20
                  </div>
                  <button
                    type="button"
                    onClick={onOpenSkin}
                    className="mt-1 w-full py-1 bg-[#252035] hover:bg-[#322b47] border border-white/20 text-[10px] font-mc text-[#fde68a] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <User className="w-3 h-3" />
                    Đổi Skin
                  </button>
                </div>
              </div>

              {/* 2x2 Crafting */}
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-xs font-mc font-bold mb-1">Chế tạo 2×2</div>
                  <div className="grid grid-cols-2 gap-1">
                    {craftGrid.map((st, idx) => (
                      <McItemSlot
                        key={idx}
                        stack={st}
                        pack={pack}
                        size={42}
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
                <div className="text-xl font-bold text-[#444]">→</div>
                <div>
                  <div className="text-xs font-mc font-bold mb-1">Kết quả</div>
                  <McItemSlot
                    stack={
                      matchedRecipe
                        ? { itemId: matchedRecipe.output.itemId, count: matchedRecipe.output.count }
                        : null
                    }
                    pack={pack}
                    size={46}
                    active={Boolean(matchedRecipe)}
                    onClick={handleTakeCraftOutput}
                  />
                </div>
              </div>
            </div>

            {/* Quick 2x2 Recipe Book */}
            <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-2 max-h-[206px] overflow-y-auto">
              <div className="text-xs font-mc font-bold mb-1.5 text-[#222]">
                Sổ công thức 2×2 (Nhấn để điền)
              </div>
              <div className="space-y-1">
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
          <div className="grid grid-cols-1 md:grid-cols-[1fr_270px] gap-4 mb-4">
            <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-4 flex items-center justify-center gap-4">
              <div className="grid grid-cols-3 gap-1">
                {craftGrid.map((st, idx) => (
                  <McItemSlot
                    key={idx}
                    stack={st}
                    pack={pack}
                    size={46}
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
              <div className="text-2xl font-bold text-[#444]">→</div>
              <McItemSlot
                stack={
                  matchedRecipe
                    ? { itemId: matchedRecipe.output.itemId, count: matchedRecipe.output.count }
                    : null
                }
                pack={pack}
                size={52}
                active={Boolean(matchedRecipe)}
                onClick={handleTakeCraftOutput}
              />
            </div>

            <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-2 max-h-[210px] overflow-y-auto">
              <div className="text-xs font-mc font-bold mb-1.5 text-[#222]">
                Sổ Công Thức 1.16 (Nhấn để điền nhanh)
              </div>
              <div className="space-y-1">
                {CRAFTING_RECIPES.map((r) => {
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
          <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-4 mb-4">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs font-mc font-bold">Nguyên liệu</div>
                <McItemSlot
                  stack={furnace.input}
                  pack={pack}
                  size={48}
                  placeholder="Quặng"
                  onClick={() =>
                    interactSlot(furnace.input, (n) => setFurnaceSlot('input', n))
                  }
                  onContextMenu={() =>
                    interactSlot(furnace.input, (n) => setFurnaceSlot('input', n), true)
                  }
                />
                <div className="flex items-center gap-1 text-xs font-mono-num">
                  <Flame
                    className={`w-5 h-5 ${furnace.burnTime > 0 ? 'text-orange-600 fill-amber-400' : 'text-zinc-500'}`}
                  />
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
                <div className="text-[11px] text-[#444]">Nhiên liệu (Than / Gỗ)</div>
              </div>

              <div className="flex flex-col items-center gap-1.5 min-w-[110px]">
                <div className="w-24 h-3.5 bg-[#555] border border-black overflow-hidden">
                  <div
                    className="h-full bg-[#f59e0b]"
                    style={{ width: `${Math.round(furnace.cookProgress * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono-num text-[#333]">
                  {Math.round(furnace.cookProgress * 100)}%
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="text-xs font-mc font-bold">Thành phẩm</div>
                <McItemSlot
                  stack={furnace.output}
                  pack={pack}
                  size={54}
                  active={Boolean(furnace.output)}
                  onClick={() => {
                    if (!furnace.output) return;
                    interactSlot(furnace.output, (n) => setFurnaceSlot('output', n));
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- 1.16 SMITHING TABLE --- */}
        {type === 'smithing' && (
          <div className="bg-[#b8b8b8] border-2 border-[#8b8b8b] p-4 mb-4">
            <div className="flex items-center gap-2 justify-center mb-3 text-xs sm:text-sm font-mc font-bold text-[#222]">
              <Hammer className="w-4 h-4" />
              Nâng cấp Trang Bị Kim Cương + Thỏi Netherite → Trang Bị Netherite 1.16 (Giữ nguyên Phù Phép)
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-bold">Đồ Kim Cương</span>
                <McItemSlot
                  stack={smithBase}
                  pack={pack}
                  size={50}
                  placeholder="KC"
                  onClick={() => interactSlot(smithBase, setSmithBase)}
                />
              </div>
              <span className="text-xl font-bold">+</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-bold">Thỏi Netherite</span>
                <McItemSlot
                  stack={smithAdd}
                  pack={pack}
                  size={50}
                  placeholder="Neth."
                  onClick={() => interactSlot(smithAdd, setSmithAdd)}
                />
              </div>
              <span className="text-xl font-bold">→</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-bold">Netherite 1.16</span>
                <McItemSlot
                  stack={smithOutput}
                  pack={pack}
                  size={54}
                  active={Boolean(smithOutput)}
                  onClick={handleForgeSmithing}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- PLAYER MAIN INVENTORY (27 SLOTS) --- */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mc font-bold text-[#333]">Túi đồ chính</span>
            {cursor && (
              <McButton
                variant="crimson"
                onClick={() => setCursor(null)}
                className="min-h-[30px] px-2 py-0.5 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa vật phẩm đang cầm
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
                  onClick={() =>
                    interactSlot(inventory[slotIdx], (n) => setInvSlot(slotIdx, n))
                  }
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
          <div className="text-xs font-mc font-bold text-[#333] mb-1">Thanh công cụ nhanh (1–9)</div>
          <div className="grid grid-cols-9 gap-1 justify-items-center">
            {Array.from({ length: 9 }).map((_, idx) => (
              <McItemSlot
                key={idx}
                stack={inventory[idx]}
                pack={pack}
                size={invSlotSize}
                onClick={() => interactSlot(inventory[idx], (n) => setInvSlot(idx, n))}
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
