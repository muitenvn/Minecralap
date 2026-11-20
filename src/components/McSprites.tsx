import React from 'react';
import { ITEM_DEFS } from '../game/blocks';
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

  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) soundEngine.playClick();
        onClick?.(e);
      }}
      style={{
        ...(variant === 'stone' && widgetsUrl && !disabled
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.06), rgba(0,0,0,0.06)), url(${widgetsUrl})`,
              backgroundSize: '128% 1280%',
              backgroundPosition: '0% 28.4%',
            }
          : {}),
        ...style,
      }}
      className={`mc-btn ${variantClass} min-h-[44px] px-4 py-2 text-sm sm:text-base whitespace-nowrap select-none touch-manipulation flex items-center justify-center gap-2 ${className}`}
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

// Renders a precise 9x9 sprite from Minecraft 1.16 icons.png (256x256)
export const McHudIcon: React.FC<{
  iconsUrl?: string;
  sx: number;
  sy: number;
  size?: number;
  fallbackColor: string;
}> = ({ iconsUrl, sx, sy, size = 16, fallbackColor }) => {
  if (!iconsUrl) {
    return (
      <span
        className="inline-block border border-black/80"
        style={{ width: size, height: size, backgroundColor: fallbackColor }}
      />
    );
  }
  const scale = size / 9;
  return (
    <span
      className="inline-block pixelated shrink-0"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${iconsUrl})`,
        backgroundSize: `${256 * scale}px ${256 * scale}px`,
        backgroundPosition: `-${sx * scale}px -${sy * scale}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
};

interface McItemSlotProps {
  stack: ItemStack | null;
  pack: CompiledResourcePack | null;
  active?: boolean;
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
  size = 44,
  placeholder,
  onClick,
  onPointerDown,
  onContextMenu,
  title,
}) => {
  const def = stack ? ITEM_DEFS[stack.itemId] : null;
  const iconUrl = stack && pack ? pack.itemIcons[stack.itemId] : undefined;
  const hasEnchant = Boolean(stack?.enchants && Object.keys(stack.enchants).length > 0);
  const enchantText = hasEnchant
    ? ' · ' +
      Object.entries(stack!.enchants!)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ')
    : '';

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
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none touch-manipulation shrink-0 cursor-pointer ${
        active ? 'mc-slot-active' : 'mc-slot'
      } ${hasEnchant ? 'mc-enchant-glint' : ''}`}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={def?.nameVi || stack?.itemId || ''}
          draggable={false}
          className="w-[74%] h-[74%] object-contain pixelated pointer-events-none"
        />
      ) : placeholder ? (
        <span className="text-[10px] font-mc text-[#555555] pointer-events-none">{placeholder}</span>
      ) : null}

      {stack && stack.count > 1 && (
        <span className="absolute bottom-0.5 right-1 text-[11px] leading-none font-mono-num font-bold text-white mc-text-shadow-sm pointer-events-none">
          {stack.count}
        </span>
      )}
      {hasEnchant && (
        <span className="absolute top-0.5 left-1 text-[9px] leading-none font-bold text-purple-200 mc-text-shadow-sm pointer-events-none">
          ✦
        </span>
      )}
    </button>
  );
};

export const McTitleLogo: React.FC<{ splashText: string }> = ({ splashText }) => (
  <div className="relative flex flex-col items-center select-none pointer-events-none">
    <svg
      viewBox="0 0 560 112"
      className="w-[min(520px,90vw)] h-auto drop-shadow-[0_8px_0_rgba(0,0,0,0.75)]"
      aria-label="NetherCraft 1.16"
    >
      <defs>
        <linearGradient id="mcStoneGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="48%" stopColor="#b8b8c2" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
        <linearGradient id="mcNetherGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      {/* 3D extruded shadow */}
      <text
        x="280"
        y="68"
        textAnchor="middle"
        fill="#1a171f"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="62"
        letterSpacing="4"
      >
        NETHERCRAFT
      </text>
      <text
        x="280"
        y="62"
        textAnchor="middle"
        fill="url(#mcStoneGrad)"
        stroke="#0f0e13"
        strokeWidth="3.5"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="62"
        letterSpacing="4"
      >
        NETHERCRAFT
      </text>
      {/* 1.16 Nether Update Subtitle Plate */}
      <rect x="135" y="76" width="290" height="26" fill="#18131d" stroke="#000000" strokeWidth="2.5" />
      <rect x="137" y="78" width="286" height="2" fill="url(#mcNetherGrad)" />
      <text
        x="280"
        y="94"
        textAnchor="middle"
        fill="#fde68a"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="14"
        letterSpacing="3.5"
      >
        NETHER UPDATE · 1.16.5
      </text>
    </svg>
    <div className="mc-splash absolute -bottom-2 right-1 sm:right-6 text-[#ffff55] font-mc font-bold text-xs sm:text-sm whitespace-nowrap">
      {splashText}
    </div>
  </div>
);
