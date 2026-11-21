import React, { useEffect, useRef, useState } from 'react';
import { Camera, Maximize2, Minimize2, Pause } from 'lucide-react';
import { autocompleteCommand } from '../game/commands';
import { CompiledResourcePack } from '../game/resourcePack';
import { ChatMessage, HudSnapshot, MinimapMode, TitleBanner } from '../game/types';
import { McButton, McHudIcon, McItemSlot, McSpriteSlice } from './McSprites';
import { MinimapHud } from './MinimapHud';

interface HudOverlayProps {
  hud: HudSnapshot;
  pack: CompiledResourcePack;
  showF3: boolean;
  chatOpen: boolean;
  chatInitial: string;
  chatMessages: ChatMessage[];
  titleBanner: TitleBanner | null;
  guiScale: 'auto' | 'small' | 'medium' | 'large';
  minimapMode: MinimapMode;
  touchVisible: boolean;
  isFullscreen: boolean;
  onSelectSlot: (idx: number) => void;
  onChangeMinimapMode: (next: MinimapMode) => void;
  onRenderMinimap: (canvas: HTMLCanvasElement, scaleBlocksPerPx: number) => void;
  onSubmitChat: (text: string) => void;
  onCloseChat: () => void;
  onRequestLock: () => void;
  onOpenInventory: () => void;
  onCycleCamera: () => void;
  onToggleFullscreen: () => void;
  onOpenPause: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  pack,
  showF3,
  chatOpen,
  chatInitial,
  chatMessages,
  titleBanner,
  guiScale,
  minimapMode,
  touchVisible,
  isFullscreen,
  onSelectSlot,
  onChangeMinimapMode,
  onRenderMinimap,
  onSubmitChat,
  onCloseChat,
  onRequestLock,
  onOpenInventory,
  onCycleCamera,
  onToggleFullscreen,
  onOpenPause,
}) => {
  const [chatText, setChatText] = useState(chatInitial);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (chatOpen) {
      setChatText(chatInitial);
      setSuggestions(autocompleteCommand(chatInitial));
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [chatOpen, chatInitial]);

  const handleChatChange = (val: string) => {
    setChatText(val);
    setSuggestions(autocompleteCommand(val));
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCloseChat();
      return;
    }
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      const parts = chatText.split(/\s+/);
      if (parts.length <= 1) {
        handleChatChange(suggestions[0] + ' ');
      } else {
        parts[parts.length - 1] = suggestions[0];
        handleChatChange(parts.join(' ') + ' ');
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (chatText.trim()) onSubmitChat(chatText);
      setChatText('');
      onCloseChat();
    }
  };

  const now = performance.now();
  const showToast = hud.heldItemToast && now - hud.heldItemToastAt < 2400;
  const showBanner = titleBanner && Date.now() < titleBanner.expiresAt;
  const baseSlotSize =
    guiScale === 'small' ? 36 : guiScale === 'large' ? 46 : touchVisible ? 38 : 42;
  const hotbarCount = touchVisible ? 10 : 9;
  const maxFitSlot = Math.floor((viewportWidth - 28) / hotbarCount);
  const slotSize = Math.max(28, Math.min(baseSlotSize, maxFitSlot));

  // Pixel-exact scaling for Minecraft widgets.png (182x22) and icons.png XP bar (182x5)
  const uiScale = slotSize / 20;
  const hotbarW = Math.round(182 * uiScale);
  const hotbarH = Math.round(22 * uiScale);
  const hotbarPad = Math.max(1, Math.round(uiScale));
  const xpBarH = Math.max(8, Math.round(5 * uiScale));
  const xpPercent = Math.min(100, Math.max(0, hud.xp * 100));

  const isSurvival = hud.gameMode === 'survival' || hud.gameMode === 'adventure';
  const compassDirs = ['Nam (+Z)', 'Tây (-X)', 'Bắc (-Z)', 'Đông (+X)'];
  const deg = (((-hud.yaw * 180) / Math.PI) % 360 + 360) % 360;
  const dirLabel = compassDirs[Math.floor(((deg + 45) % 360) / 90)];

  const widgetsUrl = pack.guiUrls.widgets;
  const iconsUrl = pack.guiUrls.icons;

  return (
    <div className="fixed inset-0 z-[25] pointer-events-none select-none overflow-hidden">
      {/* Red Damage Flash Vignette */}
      {hud.damageFlash > 0.02 && (
        <div
          className="absolute inset-0 bg-red-600"
          style={{ opacity: hud.damageFlash * 0.36 }}
        />
      )}

      {/* Underwater Blue Tint */}
      {hud.underwater && <div className="absolute inset-0 bg-blue-900/35" />}

      {/* Purple Nether Portal Warp Overlay */}
      {hud.portalProgress > 0.02 && (
        <div
          className="absolute inset-0 mc-portal-overlay flex items-center justify-center"
          style={{ opacity: Math.min(0.9, hud.portalProgress) }}
        >
          <div className="font-mc text-xl sm:text-2xl text-purple-100 mc-text-shadow">
            {hud.dimension === 'overworld' ? 'Đang vào The Nether...' : 'Đang về Overworld...'}
          </div>
        </div>
      )}

      {/* Authentic Classic Minecraft Center Crosshair (+ with difference invert over bright/dark) */}
      {!hud.dead && !chatOpen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[18px] h-[18px] mix-blend-difference opacity-95">
            <span className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-white" />
            <span className="absolute top-1/2 left-0 -translate-y-1/2 h-[2px] w-full bg-white" />
          </div>
        </div>
      )}

      {/* Compact Top-Left Action Bar on PC when mouse unlocked (leaves Top-Right clean for Minimap) */}
      {!touchVisible && !hud.pointerLocked && !hud.dead && !chatOpen && !showF3 && (
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5 pointer-events-auto">
          <McButton
            variant="primary"
            widgetsUrl={widgetsUrl}
            onClick={onRequestLock}
            className="min-h-[36px] h-[36px] px-4 py-1 text-xs sm:text-sm"
          >
            Chơi
          </McButton>
          <McButton
            widgetsUrl={widgetsUrl}
            onClick={onCycleCamera}
            title="Đổi góc nhìn (F5)"
            aria-label="F5"
            className="min-h-[36px] w-[36px] h-[36px] px-0 py-0"
          >
            <Camera className="w-4 h-4" />
          </McButton>
          <McButton
            widgetsUrl={widgetsUrl}
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ (F11)' : 'Toàn màn hình (F11)'}
            aria-label="Toàn màn hình"
            className="min-h-[36px] w-[36px] h-[36px] px-0 py-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </McButton>
          <McButton
            widgetsUrl={widgetsUrl}
            onClick={onOpenPause}
            title="Menu (Esc)"
            aria-label="Menu"
            className="min-h-[36px] w-[36px] h-[36px] px-0 py-0"
          >
            <Pause className="w-4 h-4" />
          </McButton>
        </div>
      )}

      {/* F3 Debug Screen (Authentic Minecraft 1.16 Layout) */}
      {showF3 && (
        <div className="absolute top-2 left-2 right-2 flex justify-between gap-4 text-[11px] sm:text-xs font-mono-num text-white mc-text-shadow-sm">
          <div className="space-y-0.5 bg-black/55 px-2 py-1.5">
            <div>NetherCraft 26.3 (1.16–26.3 · Static WebGL · Sub-Chunk 16³)</div>
            <div>{hud.fps} fps · Chunks: {hud.loadedChunks} · Mobs: {hud.mobCount}</div>
            <div>
              XYZ: {hud.x.toFixed(2)} / {hud.y.toFixed(2)} / {hud.z.toFixed(2)}
            </div>
            <div>
              Chunk: {Math.floor(hud.x / 16)}, {Math.floor(hud.y / 16)}, {Math.floor(hud.z / 16)}
            </div>
            <div>Hướng: {dirLabel} ({deg.toFixed(0)}°)</div>
            <div>Chiều: {hud.dimension === 'nether' ? 'minecraft:the_nether' : 'minecraft:overworld'}</div>
            <div>Quần xã: {hud.biome}</div>
          </div>

          <div className="hidden sm:block space-y-0.5 bg-black/55 px-2 py-1.5 text-right h-fit">
            <div>World Border: ±{hud.worldBorderRadius.toLocaleString('vi-VN')}</div>
            <div>Chế độ: {hud.gameMode.toUpperCase()} · {hud.difficulty.toUpperCase()}</div>
            <div>Thời tiết: {hud.weather} · Ticks: {Math.floor(hud.timeOfDay)}</div>
            {hud.targetBlock && (
              <div className="text-[#5eead4]">
                Khối chỉ tới: {hud.targetBlock.name} ({hud.targetBlock.x}, {hud.targetBlock.y}, {hud.targetBlock.z})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top-Right Stack: Sleek Resource-Pack Map HUD + Active Potion Effects */}
      {!showF3 && !hud.dead && (
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
          <MinimapHud
            hud={hud}
            pack={pack}
            mode={minimapMode}
            touchVisible={touchVisible}
            onChangeMode={onChangeMinimapMode}
            onRenderMap={onRenderMinimap}
          />

          {hud.effects.length > 0 && (
            <div className="flex flex-col gap-1 items-end">
              {hud.effects.map((eff) => (
                <div
                  key={eff.id}
                  className="bg-black/65 border border-white/20 px-2 py-0.5 text-[11px] font-mono-num text-[#5eead4]"
                >
                  {eff.id} {eff.amplifier + 1} · {Math.ceil(eff.remainingSec)}s
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* /title & /subtitle Banner */}
      {showBanner && (titleBanner.title || titleBanner.subtitle) && (
        <div className="absolute inset-x-0 top-[24%] flex flex-col items-center text-center px-4">
          {titleBanner.title && (
            <div className="font-mc text-3xl sm:text-5xl font-bold text-[#fde68a] mc-text-shadow">
              {titleBanner.title}
            </div>
          )}
          {titleBanner.subtitle && (
            <div className="font-mc text-sm sm:text-lg text-white mc-text-shadow mt-1.5">
              {titleBanner.subtitle}
            </div>
          )}
        </div>
      )}

      {/* Recent Chat Log (Bottom-Left above controls) */}
      <div className="absolute left-2 sm:left-4 bottom-[172px] sm:bottom-24 w-[min(460px,82vw)] flex flex-col gap-1">
        {chatMessages
          .filter((m) => chatOpen || Date.now() - m.timestamp < 8000)
          .slice(-6)
          .map((m) => (
            <div
              key={m.id}
              className={`px-2 py-0.5 bg-black/60 text-xs sm:text-sm leading-snug mc-text-shadow-sm break-words ${
                m.tone === 'error'
                  ? 'text-red-300'
                  : m.tone === 'success'
                    ? 'text-emerald-300'
                    : m.tone === 'gold'
                      ? 'text-amber-300'
                      : 'text-zinc-100'
              }`}
            >
              {m.text}
            </div>
          ))}
      </div>

      {/* Chat & 26-Command Input Bar */}
      {chatOpen && (
        <div className="absolute inset-x-2 sm:left-4 sm:right-auto bottom-4 sm:w-[540px] pointer-events-auto z-30">
          {suggestions.length > 0 && (
            <div className="bg-black/85 border border-white/20 px-2 py-1 mb-1 flex flex-wrap gap-2 text-xs font-mono-num">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const parts = chatText.split(/\s+/);
                    if (parts.length <= 1) handleChatChange(s + ' ');
                    else {
                      parts[parts.length - 1] = s;
                      handleChatChange(parts.join(' ') + ' ');
                    }
                    inputRef.current?.focus();
                  }}
                  className="text-amber-300 hover:text-white cursor-pointer"
                >
                  {s}
                </button>
              ))}
              <span className="text-zinc-400 ml-auto">Tab để chọn</span>
            </div>
          )}
          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={chatText}
              onChange={(e) => handleChatChange(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Nhập tin nhắn hoặc lệnh (/help, /tp, /gamemode, /weather, /give...)"
              className="flex-1 bg-black/85 border-2 border-white/40 focus:border-[#2dd4bf] outline-none px-3 py-2 text-sm font-mono-num text-white"
            />
            <McButton
              variant="primary"
              widgetsUrl={widgetsUrl}
              onClick={() => {
                if (chatText.trim()) onSubmitChat(chatText);
                setChatText('');
                onCloseChat();
              }}
              className="px-4 text-sm min-h-[40px]"
            >
              Gửi
            </McButton>
          </div>
        </div>
      )}

      {/* Bottom Survival Bars & Authentic Resource Pack Hotbar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-auto">
        {showBanner && titleBanner.actionbar && (
          <div className="text-xs sm:text-sm font-mc text-amber-200 mc-text-shadow-sm mb-1">
            {titleBanner.actionbar}
          </div>
        )}

        {showToast && (
          <div className="text-xs sm:text-sm font-mc text-white mc-text-shadow-sm mb-0.5">
            {hud.heldItemToast}
          </div>
        )}

        {isSurvival && (
          <div
            className="flex flex-col gap-0.5 pointer-events-none"
            style={{ width: hotbarW }}
          >
            {/* Armor + Oxygen Row */}
            <div className="flex items-center justify-between min-h-[14px]">
              <div className="flex items-center gap-[1px]">
                {hud.armorPoints > 0 &&
                  Array.from({ length: 10 }).map((_, i) => {
                    const val = hud.armorPoints - i * 2;
                    return (
                      <McHudIcon
                        key={i}
                        iconsUrl={iconsUrl}
                        sx={val >= 2 ? 34 : val === 1 ? 25 : 16}
                        sy={9}
                        size={touchVisible ? 13 : 15}
                        fallbackColor={val > 0 ? '#cbd5e1' : '#334155'}
                      />
                    );
                  })}
              </div>
              <div className="flex items-center gap-[1px]">
                {hud.underwater &&
                  Array.from({ length: Math.ceil(hud.oxygen / 2) }).map((_, i) => (
                    <McHudIcon
                      key={i}
                      iconsUrl={iconsUrl}
                      sx={16}
                      sy={18}
                      size={touchVisible ? 13 : 15}
                      fallbackColor="#38bdf8"
                    />
                  ))}
              </div>
            </div>

            {/* Layered Hearts (Left) & Drumsticks (Right) from icons.png */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-[1px]">
                {Array.from({ length: 10 }).map((_, i) => {
                  const val = hud.hp - i * 2;
                  return (
                    <McHudIcon
                      key={i}
                      iconsUrl={iconsUrl}
                      bgSx={16}
                      bgSy={0}
                      sx={val >= 2 ? 52 : val === 1 ? 61 : 16}
                      sy={0}
                      size={touchVisible ? 13 : 15}
                      fallbackColor={val > 0 ? '#ef4444' : '#3f1d1d'}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-[1px]">
                {Array.from({ length: 10 }).map((_, i) => {
                  const idx = 9 - i;
                  const val = hud.hunger - idx * 2;
                  return (
                    <McHudIcon
                      key={i}
                      iconsUrl={iconsUrl}
                      bgSx={16}
                      bgSy={27}
                      sx={val >= 2 ? 52 : val === 1 ? 61 : 16}
                      sy={27}
                      size={touchVisible ? 13 : 15}
                      fallbackColor={val > 0 ? '#d97706' : '#3f2e1d'}
                    />
                  );
                })}
              </div>
            </div>

            {/* Authentic Resource Pack XP Bar (icons.png 0,64 & 0,69 182x5) + Level */}
            <div
              className="relative mt-0.5"
              style={{ width: hotbarW, height: xpBarH }}
            >
              {iconsUrl ? (
                <>
                  <McSpriteSlice
                    src={iconsUrl}
                    sx={0}
                    sy={64}
                    sw={182}
                    sh={5}
                    width={hotbarW}
                    height={xpBarH}
                    className="block"
                  />
                  <div
                    className="absolute left-0 top-0 bottom-0 overflow-hidden"
                    style={{ width: `${xpPercent}%` }}
                  >
                    <McSpriteSlice
                      src={iconsUrl}
                      sx={0}
                      sy={69}
                      sw={182}
                      sh={5}
                      width={hotbarW}
                      height={xpBarH}
                      className="block"
                    />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-[#161c16] border border-black">
                  <div className="h-full bg-[#7ee64a]" style={{ width: `${xpPercent}%` }} />
                </div>
              )}

              {hud.level > 0 && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 font-mono-num text-xs font-bold text-[#80ff20] mc-text-shadow">
                  {hud.level}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Authentic Resource Pack 9-Slot Hotbar (widgets.png 0,0 182x22) + Mobile Inventory Button */}
        <div
          className="flex items-center gap-1 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            style={
              widgetsUrl
                ? {
                    width: hotbarW,
                    height: hotbarH,
                    padding: hotbarPad,
                    backgroundImage: `url(${widgetsUrl})`,
                    backgroundSize: `${256 * uiScale}px ${256 * uiScale}px`,
                    backgroundPosition: '0px 0px',
                    backgroundRepeat: 'no-repeat',
                  }
                : undefined
            }
            className={`relative flex items-center pixelated ${
              widgetsUrl ? '' : 'mc-hotbar-shell p-1 gap-0.5'
            }`}
          >
            {Array.from({ length: 9 }).map((_, idx) => (
              <McItemSlot
                key={idx}
                stack={hud.inventory[idx]}
                pack={pack}
                hotbarMode={Boolean(widgetsUrl)}
                active={hud.selectedSlot === idx}
                size={slotSize}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectSlot(idx);
                }}
                onClick={() => onSelectSlot(idx)}
              />
            ))}
          </div>

          {touchVisible && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenInventory();
              }}
              title="Mở Túi Đồ & Chế Tạo"
              aria-label="Mở Túi Đồ và Chế Tạo"
              style={{
                width: slotSize,
                height: slotSize,
                ...(pack.guiUrls.containerInventory
                  ? {
                      backgroundImage: `url(${pack.guiUrls.containerInventory})`,
                      backgroundSize: `${(256 * slotSize) / 18}px ${(256 * slotSize) / 18}px`,
                      backgroundPosition: `-${(7 * slotSize) / 18}px -${(7 * slotSize) / 18}px`,
                    }
                  : {}),
              }}
              className="mc-slot border border-black/80 pixelated flex items-center justify-center font-mc font-bold text-[#fde68a] mc-text-shadow-sm cursor-pointer active:brightness-125 touch-manipulation"
            >
              ···
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
