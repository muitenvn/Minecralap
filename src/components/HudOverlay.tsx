import React, { useEffect, useRef, useState } from 'react';
import { Camera, Layers, Pause, User } from 'lucide-react';
import { autocompleteCommand } from '../game/commands';
import { CompiledResourcePack } from '../game/resourcePack';
import { ChatMessage, HudSnapshot, TexturePreset, TitleBanner } from '../game/types';
import { McHudIcon, McItemSlot } from './McSprites';

interface HudOverlayProps {
  hud: HudSnapshot;
  pack: CompiledResourcePack;
  showF3: boolean;
  chatOpen: boolean;
  chatInitial: string;
  chatMessages: ChatMessage[];
  titleBanner: TitleBanner | null;
  guiScale: 'auto' | 'small' | 'medium' | 'large';
  touchVisible: boolean;
  texturePreset: TexturePreset;
  onSelectSlot: (idx: number) => void;
  onSubmitChat: (text: string) => void;
  onCloseChat: () => void;
  onRequestLock: () => void;
  onOpenInventory: () => void;
  onCycleCamera: () => void;
  onOpenSkin: () => void;
  onToggleTexturePreset: () => void;
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
  touchVisible,
  texturePreset,
  onSelectSlot,
  onSubmitChat,
  onCloseChat,
  onRequestLock,
  onOpenInventory,
  onCycleCamera,
  onOpenSkin,
  onToggleTexturePreset,
  onOpenPause,
}) => {
  const [chatText, setChatText] = useState(chatInitial);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const slotSize =
    guiScale === 'small' ? 36 : guiScale === 'large' ? 48 : touchVisible ? 38 : 44;

  const isSurvival = hud.gameMode === 'survival' || hud.gameMode === 'adventure';
  const compassDirs = ['Nam (+Z)', 'Tây (-X)', 'Bắc (-Z)', 'Đông (+X)'];
  const deg = (((-hud.yaw * 180) / Math.PI) % 360 + 360) % 360;
  const dirLabel = compassDirs[Math.floor(((deg + 45) % 360) / 90)];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none overflow-hidden">
      {/* Red Damage Flash Vignette */}
      {hud.damageFlash > 0.02 && (
        <div
          className="absolute inset-0 bg-red-600"
          style={{ opacity: hud.damageFlash * 0.36 }}
        />
      )}

      {/* Underwater Blue Tint */}
      {hud.underwater && (
        <div className="absolute inset-0 bg-blue-900/35" />
      )}

      {/* Purple Nether Portal Warp Overlay */}
      {hud.portalProgress > 0.02 && (
        <div
          className="absolute inset-0 mc-portal-overlay flex items-center justify-center"
          style={{ opacity: Math.min(0.9, hud.portalProgress) }}
        >
          <div className="font-mc text-xl sm:text-2xl text-purple-100 mc-text-shadow">
            {hud.dimension === 'overworld' ? 'Đang bước vào The Nether 1.16...' : 'Đang trở về Overworld...'}
          </div>
        </div>
      )}

      {/* Center Crosshair */}
      {!hud.dead && !chatOpen && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-5 h-5">
            <span className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-white/90 shadow-[0_0_2px_#000]" />
            <span className="absolute top-1/2 left-0 -translate-y-1/2 h-[2px] w-full bg-white/90 shadow-[0_0_2px_#000]" />
          </div>
        </div>
      )}

      {/* Clean Top Bar on PC when mouse unlocked (Click to play + Skin / F5 Camera / Texture / Menu) */}
      {!touchVisible && !hud.pointerLocked && !hud.dead && !chatOpen && (
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={onRequestLock}
              className="mc-btn mc-btn-primary min-h-[38px] px-4 py-1.5 text-xs sm:text-sm"
            >
              Vào Chơi (Khóa Chuột)
            </button>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={onCycleCamera}
              title="Đổi góc nhìn thứ 1 / thứ 3 (F5)"
              className="mc-btn min-h-[38px] px-2.5 py-1 text-xs flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-[#5eead4]" />
              <span>
                {hud.cameraMode === 'first'
                  ? 'Góc 1 (F5)'
                  : hud.cameraMode === 'third_back'
                    ? 'Góc 3 Sau'
                    : 'Góc 3 Trước'}
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenSkin}
              title="Đổi Skin Steve / Alex / Skin của bạn & Model 3D"
              className="mc-btn min-h-[38px] px-2.5 py-1 text-xs flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#fde68a]" />
              <span>Skin &amp; Model</span>
            </button>
            <button
              type="button"
              onClick={onToggleTexturePreset}
              title="Chuyển giữa Texture Hiện Tại và Texture Chính Gốc 1.16"
              className="mc-btn min-h-[38px] px-2.5 py-1 text-xs hidden md:flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>{texturePreset === 'original' ? 'Texture: Chính Gốc' : 'Texture: Hiện Tại'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenPause}
              title="Mở Menu Tạm Dừng (Esc)"
              className="mc-btn min-h-[38px] px-2.5 py-1 text-xs flex items-center gap-1"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      )}

      {/* F3 Debug Screen (Authentic Minecraft 1.16 Layout) */}
      {showF3 && (
        <div className="absolute top-2 left-2 right-2 flex justify-between gap-4 text-[11px] sm:text-xs font-mono-num text-white mc-text-shadow-sm">
          <div className="space-y-0.5 bg-black/55 px-2 py-1.5">
            <div>NetherCraft 1.16.5 (Static WebGL · Sub-Chunk 16³)</div>
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

      {/* Active Potion Effects (Top-Right) */}
      {hud.effects.length > 0 && !showF3 && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {hud.effects.map((eff) => (
            <div
              key={eff.id}
              className="bg-black/65 border border-white/20 px-2.5 py-1 text-xs font-mono-num text-[#5eead4]"
            >
              {eff.id} {eff.amplifier + 1} · {Math.ceil(eff.remainingSec)}s
            </div>
          ))}
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
            <button
              type="button"
              onClick={() => {
                if (chatText.trim()) onSubmitChat(chatText);
                setChatText('');
                onCloseChat();
              }}
              className="mc-btn mc-btn-primary px-4 text-sm"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      {/* Bottom Survival Bars & 9-Slot Hotbar */}
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
          <div className="w-full max-w-[404px] px-1 flex flex-col gap-1 pointer-events-none">
            {/* Armor + Oxygen Row */}
            <div className="flex items-center justify-between min-h-[14px]">
              <div className="flex items-center gap-0.5">
                {hud.armorPoints > 0 &&
                  Array.from({ length: 10 }).map((_, i) => {
                    const val = hud.armorPoints - i * 2;
                    return (
                      <McHudIcon
                        key={i}
                        iconsUrl={pack.guiUrls.icons}
                        sx={val >= 2 ? 34 : val === 1 ? 25 : 16}
                        sy={9}
                        size={14}
                        fallbackColor={val > 0 ? '#cbd5e1' : '#334155'}
                      />
                    );
                  })}
              </div>
              <div className="flex items-center gap-0.5">
                {hud.underwater &&
                  Array.from({ length: Math.ceil(hud.oxygen / 2) }).map((_, i) => (
                    <McHudIcon
                      key={i}
                      iconsUrl={pack.guiUrls.icons}
                      sx={16}
                      sy={18}
                      size={14}
                      fallbackColor="#38bdf8"
                    />
                  ))}
              </div>
            </div>

            {/* Hearts (Left) & Drumsticks (Right) */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const val = hud.hp - i * 2;
                  return (
                    <McHudIcon
                      key={i}
                      iconsUrl={pack.guiUrls.icons}
                      sx={val >= 2 ? 52 : val === 1 ? 61 : 16}
                      sy={0}
                      size={touchVisible ? 13 : 15}
                      fallbackColor={val > 0 ? '#ef4444' : '#3f1d1d'}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const idx = 9 - i;
                  const val = hud.hunger - idx * 2;
                  return (
                    <McHudIcon
                      key={i}
                      iconsUrl={pack.guiUrls.icons}
                      sx={val >= 2 ? 52 : val === 1 ? 61 : 16}
                      sy={27}
                      size={touchVisible ? 13 : 15}
                      fallbackColor={val > 0 ? '#d97706' : '#3f2e1d'}
                    />
                  );
                })}
              </div>
            </div>

            {/* Green Experience Bar + Level */}
            <div className="relative w-full h-[7px] bg-[#161c16] border border-black mt-0.5">
              <div
                className="h-full bg-[#7ee64a]"
                style={{ width: `${Math.min(100, Math.max(0, hud.xp * 100))}%` }}
              />
              {hud.level > 0 && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 font-mono-num text-xs font-bold text-[#80ff20] mc-text-shadow">
                  {hud.level}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9-Slot Minecraft Hotbar + Mobile Inventory Button */}
        <div className="mc-hotbar-shell flex items-center p-1 gap-0.5">
          {Array.from({ length: 9 }).map((_, idx) => (
            <McItemSlot
              key={idx}
              stack={hud.inventory[idx]}
              pack={pack}
              active={hud.selectedSlot === idx}
              size={slotSize}
              onClick={() => onSelectSlot(idx)}
            />
          ))}
          {touchVisible && (
            <button
              type="button"
              onClick={onOpenInventory}
              title="Mở Túi Đồ"
              style={{ width: slotSize, height: slotSize }}
              className="mc-slot flex items-center justify-center font-mc font-bold text-white mc-text-shadow-sm cursor-pointer"
            >
              ···
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
