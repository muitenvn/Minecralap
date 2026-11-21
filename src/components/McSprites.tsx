import React from 'react';
import { ITEM_DEFS } from '../game/blocks';
import { formatItemEnchants } from '../game/enchanting';
import { CompiledResourcePack } from '../game/resourcePack';
import { ItemStack } from '../game/types';
import { soundEngine } from '../game/audio';

interface McButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'stone' | 'primary' | 'crimson';
  widgetsUrl?: string;
}

export const McButton: React.FC<McButtonProps> = ({
  variant = 'stone',
  widgetsUrl,
  className = '',
  onClick,
  children,
  disabled,
  style,
  ...rest
}) => {
  const variantClass =
    variant === 'primary'
      ? 'mc-btn-primary'
      : variant === 'crimson'
        ? 'mc-btn-crimson'
        : '';

  const texturedStyle = widgetsUrl
    ? ({ '--mc-widgets-url': `url(${widgetsUrl})` } as React.CSSProperties)
    : undefined;

  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) soundEngine.playClick();
        onClick?.(e);
      }}
      style={{
        ...texturedStyle,
        ...style,
      }}
      className={`mc-btn ${widgetsUrl ? 'mc-btn-textured' : ''} ${variantClass} min-h-[44px] px-4 py-2 text-sm sm:text-base whitespace-nowrap select-none touch-manipulation flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
};

export const McDirtBackdrop: React.FC<{
  bgUrl?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ bgUrl, children, className = '' }) => (
  <div
    className={`fixed inset-0 z-30 flex flex-col overflow-hidden ${className}`}
    style={{
      backgroundColor: '#1a1514',
      backgroundImage: bgUrl
        ? `linear-gradient(rgba(12, 10, 14, 0.72), rgba(12, 10, 14, 0.82)), url(${bgUrl})`
        : 'radial-gradient(circle at top, #28202b 0%, #121016 100%)',
      backgroundRepeat: 'repeat',
      backgroundSize: bgUrl ? '64px 64px' : 'cover',
      imageRendering: 'pixelated',
    }}
  >
    {children}
  </div>
);

// Precision sprite slicer for any Minecraft GUI texture sheet (works identically for 16x, 32x, 64x+ packs)
export const McSpriteSlice: React.FC<{
  src?: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  width: number;
  height: number;
  sheetW?: number;
  sheetH?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  src,
  sx,
  sy,
  sw,
  sh,
  width,
  height,
  sheetW = 256,
  sheetH = 256,
  className = '',
  style,
}) => {
  if (!src) return null;
  const scaleX = width / sw;
  const scaleY = height / sh;
  return (
    <span
      className={`inline-block pixelated shrink-0 ${className}`}
      style={{
        width,
        height,
        backgroundImage: `url(${src})`,
        backgroundSize: `${sheetW * scaleX}px ${sheetH * scaleY}px`,
        backgroundPosition: `-${sx * scaleX}px -${sy * scaleY}px`,
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    />
  );
};

// Renders a precise 9x9 sprite (with optional container underlay) from Minecraft 1.16 icons.png
export const McHudIcon: React.FC<{
  iconsUrl?: string;
  sx: number;
  sy: number;
  bgSx?: number;
  bgSy?: number;
  size?: number;
  fallbackColor: string;
}> = ({ iconsUrl, sx, sy, bgSx, bgSy, size = 16, fallbackColor }) => {
  if (!iconsUrl) {
    return (
      <span
        className="inline-block border border-black/80"
        style={{ width: size, height: size, backgroundColor: fallbackColor }}
      />
    );
  }
  const scale = size / 9;
  const hasUnderlay = bgSx !== undefined && bgSy !== undefined && (bgSx !== sx || bgSy !== sy);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {hasUnderlay && (
        <span
          className="absolute inset-0 pixelated"
          style={{
            backgroundImage: `url(${iconsUrl})`,
            backgroundSize: `${256 * scale}px ${256 * scale}px`,
            backgroundPosition: `-${bgSx! * scale}px -${bgSy! * scale}px`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      <span
        className="absolute inset-0 pixelated"
        style={{
          backgroundImage: `url(${iconsUrl})`,
          backgroundSize: `${256 * scale}px ${256 * scale}px`,
          backgroundPosition: `-${sx * scale}px -${sy * scale}px`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </span>
  );
};

interface McItemSlotProps {
  stack: ItemStack | null;
  pack: CompiledResourcePack | null;
  active?: boolean;
  hotbarMode?: boolean;
  size?: number;
  placeholder?: string;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  title?: string;
}

export const McItemSlot: React.FC<McItemSlotProps> = ({
  stack,
  pack,
  active = false,
  hotbarMode = false,
  size = 44,
  placeholder,
  onClick,
  onPointerDown,
  onContextMenu,
  title,
}) => {
  const def = stack ? ITEM_DEFS[stack.itemId] : null;
  const iconUrl = stack && pack ? pack.itemIcons[stack.itemId] : undefined;
  const enchantLabels = stack?.enchants ? formatItemEnchants(stack.enchants) : [];
  const hasEnchant = enchantLabels.length > 0;
  const enchantText = hasEnchant ? ' · ' + enchantLabels.join(', ') : '';
  const maxDur = def?.maxDurability;
  const durRatio =
    stack && maxDur && stack.durability !== undefined && stack.durability < maxDur
      ? Math.max(0, Math.min(1, stack.durability / maxDur))
      : null;

  const invTex = pack?.guiUrls.containerInventory;
  const widgetsTex = pack?.guiUrls.widgets;

  // Use real Minecraft recessed 18x18 slot sprite from gui/container/inventory.png when not in hotbarMode
  const slotScale = size / 18;
  const slotBgStyle: React.CSSProperties | undefined =
    !hotbarMode && invTex
      ? {
          backgroundImage: `url(${invTex})`,
          backgroundSize: `${256 * slotScale}px ${256 * slotScale}px`,
          backgroundPosition: `-${7 * slotScale}px -${7 * slotScale}px`,
          backgroundRepeat: 'no-repeat',
          boxShadow: active ? '0 0 0 2px #ffffff, 0 0 0 3px #1e1e1e' : undefined,
        }
      : undefined;

  // Real widgets.png active selector frame (24x24 around 20x20 hotbar slot)
  const selectorSize = Math.round(size * 1.2);
  const selectorScale = selectorSize / 24;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(e);
        }
      }}
      title={title || (def ? `${def.nameVi}${enchantText}` : placeholder)}
      style={{ width: size, height: size, ...slotBgStyle }}
      className={`relative flex items-center justify-center select-none touch-manipulation shrink-0 cursor-pointer pixelated ${
        hotbarMode
          ? active && !widgetsTex
            ? 'mc-slot-active'
            : 'bg-transparent hover:bg-white/10'
          : invTex
            ? 'hover:brightness-110'
            : active
              ? 'mc-slot-active'
              : 'mc-slot'
      } ${hasEnchant ? 'mc-enchant-glint' : ''}`}
    >
      {/* Real Resource Pack widgets.png Active Hotbar Selector Frame */}
      {hotbarMode && active && widgetsTex && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pixelated"
          style={{
            width: selectorSize,
            height: selectorSize,
            backgroundImage: `url(${widgetsTex})`,
            backgroundSize: `${256 * selectorScale}px ${256 * selectorScale}px`,
            backgroundPosition: `0px -${22 * selectorScale}px`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}

      {iconUrl ? (
        <img
          src={iconUrl}
          alt={def?.nameVi || stack?.itemId || ''}
          draggable={false}
          className="w-[74%] h-[74%] object-contain pixelated pointer-events-none relative z-[1]"
        />
      ) : placeholder ? (
        <span className="text-[10px] font-mc text-[#555555] pointer-events-none relative z-[1]">
          {placeholder}
        </span>
      ) : null}

      {stack && stack.count > 1 && (
        <span className="absolute bottom-0.5 right-1 z-[2] text-[11px] leading-none font-mono-num font-bold text-white mc-text-shadow-sm pointer-events-none">
          {stack.count}
        </span>
      )}
      {hasEnchant && (
        <>
          <span className="pointer-events-none absolute inset-[2px] z-[1] bg-purple-500/20 ring-1 ring-purple-400/65" />
          <span className="absolute top-0.5 left-1 z-[2] text-[9px] leading-none font-bold text-purple-200 mc-text-shadow-sm pointer-events-none">
            ✦
          </span>
        </>
      )}
      {durRatio !== null && (
        <span className="pointer-events-none absolute bottom-[3px] left-[4px] right-[4px] h-[3px] bg-black z-[3]">
          <span
            className="block h-full"
            style={{
              width: `${Math.round(durRatio * 100)}%`,
              backgroundColor: durRatio > 0.5 ? '#4ade80' : durRatio > 0.25 ? '#facc15' : '#ef4444',
            }}
          />
        </span>
      )}
    </button>
  );
};

export const McTitleLogo: React.FC<{ splashText: string }> = ({ splashText }) => (
  <div className="relative flex flex-col items-center select-none pointer-events-none">
    <svg
      viewBox="0 0 560 98"
      className="w-[min(500px,88vw)] h-auto drop-shadow-[0_6px_0_rgba(0,0,0,0.85)]"
      aria-label="NetherCraft 1.16"
    >
      <defs>
        <linearGradient id="mcStoneGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9d9d9" />
          <stop offset="52%" stopColor="#a8a8a8" />
          <stop offset="100%" stopColor="#727272" />
        </linearGradient>
      </defs>
      {/* Classic thick blocky extrusion */}
      <text
        x="280"
        y="68"
        textAnchor="middle"
        fill="#242424"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="60"
        letterSpacing="4"
      >
        NETHERCRAFT
      </text>
      <text
        x="280"
        y="61"
        textAnchor="middle"
        fill="url(#mcStoneGrad)"
        stroke="#141414"
        strokeWidth="3.5"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="60"
        letterSpacing="4"
      >
        NETHERCRAFT
      </text>
      <text
        x="280"
        y="86"
        textAnchor="middle"
        fill="#d4d4d4"
        stroke="#000000"
        strokeWidth="2.5"
        paintOrder="stroke"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="14"
        letterSpacing="4"
      >
        26.3 LATEST EDITION
      </text>
    </svg>
    <div className="mc-splash absolute -bottom-2 right-1 sm:right-6 text-[#ffff55] font-mc font-bold text-xs sm:text-sm whitespace-nowrap">
      {splashText}
    </div>
  </div>
);
