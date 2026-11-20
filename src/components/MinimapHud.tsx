import React, { useEffect, useRef } from 'react';
import { Map as MapIcon, X } from 'lucide-react';
import { CompiledResourcePack } from '../game/resourcePack';
import { HudSnapshot, MinimapMode } from '../game/types';

interface MinimapHudProps {
  hud: HudSnapshot;
  pack: CompiledResourcePack;
  mode: MinimapMode;
  touchVisible: boolean;
  onChangeMode: (next: MinimapMode) => void;
  onRenderMap: (canvas: HTMLCanvasElement, scaleBlocksPerPx: number) => void;
}

export const MinimapHud: React.FC<MinimapHudProps> = ({
  hud,
  pack,
  mode,
  touchVisible,
  onChangeMode,
  onRenderMap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderMapRef = useRef(onRenderMap);
  renderMapRef.current = onRenderMap;

  const isExpanded = mode === 'expanded';
  const blocksPerPx = isExpanded ? 3 : 2;

  useEffect(() => {
    if (mode === 'off') return;
    const draw = () => {
      if (canvasRef.current) {
        renderMapRef.current(canvasRef.current, blocksPerPx);
      }
    };
    draw();
    const id = window.setInterval(draw, 220);
    return () => window.clearInterval(id);
  }, [mode, blocksPerPx, hud.dimension]);

  // Compact icon button when minimap is hidden
  if (mode === 'off') {
    return (
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onChangeMode('compact');
        }}
        title="Mở Bản Đồ (M)"
        aria-label="Mở Bản Đồ"
        style={
          pack.guiUrls.widgets
            ? ({ '--mc-widgets-url': `url(${pack.guiUrls.widgets})` } as React.CSSProperties)
            : undefined
        }
        className={`mc-btn ${pack.guiUrls.widgets ? 'mc-btn-textured' : ''} w-[36px] h-[36px] flex items-center justify-center pointer-events-auto`}
      >
        <MapIcon className="w-4 h-4" />
      </button>
    );
  }

  const frameSize = isExpanded
    ? touchVisible
      ? 148
      : 176
    : touchVisible
      ? 92
      : 112;

  // Player heading: yaw=0 faces -Z (North, up on map); yaw increases turning left (-X, West)
  // In map_icons.png (128x128), the white player arrow at (0,0,8,8) points South (+Y down), so rotate (180 - yawDeg)
  const yawDeg = (hud.yaw * 180) / Math.PI;
  const arrowAngle = 180 - yawDeg;
  const compassIdx = Math.floor(((((-yawDeg % 360) + 360) % 360) + 45) / 90) % 4;
  const compassShort = ['B', 'Đ', 'N', 'T'][compassIdx];

  const mapBg = pack.guiUrls.mapBackground;
  const mapIcons = pack.guiUrls.mapIcons;
  const cursorSize = isExpanded ? 14 : 12;

  return (
    <div
      className="pointer-events-auto select-none flex flex-col items-end"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Authentic Minecraft map/map_background.png parchment container */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onChangeMode(isExpanded ? 'compact' : 'expanded');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChangeMode(isExpanded ? 'compact' : 'expanded');
          }
        }}
        title={isExpanded ? 'Thu gọn bản đồ (M)' : 'Phóng to bản đồ (M)'}
        style={{
          width: frameSize,
          height: frameSize,
          backgroundImage: mapBg ? `url(${mapBg})` : undefined,
          backgroundSize: '100% 100%',
        }}
        className={`relative pixelated cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,0.55)] transition-[width,height] duration-150 ${
          mapBg ? '' : 'bg-[#d4bc8c] border-2 border-[#5c4328]'
        }`}
      >
        {/* Live Pixel Terrain Canvas inset cleanly inside the parchment border */}
        <div className="absolute inset-[6.5%] overflow-hidden border border-[#4a351f]/45 bg-[#201912]">
          <canvas
            ref={canvasRef}
            width={64}
            height={64}
            className="w-full h-full block pixelated"
          />

          {/* Subtle North indicator at top center */}
          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-mc font-bold leading-none text-[#fef08a] mc-text-shadow-sm pointer-events-none">
            B
          </span>

          {/* Authentic Minecraft map/map_icons.png player directional pointer */}
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: cursorSize,
              height: cursorSize,
              transform: `translate(-50%, -50%) rotate(${arrowAngle}deg)`,
            }}
          >
            {mapIcons ? (
              <span
                className="block w-full h-full pixelated"
                style={{
                  backgroundImage: `url(${mapIcons})`,
                  backgroundSize: `${cursorSize * 16}px ${cursorSize * 16}px`,
                  backgroundPosition: '0px 0px',
                  backgroundRepeat: 'no-repeat',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.85))',
                }}
              />
            ) : (
              <svg viewBox="0 0 12 12" className="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                <polygon points="6,11 1,2 6,4 11,2" fill="#ffffff" stroke="#111111" strokeWidth="1.2" />
              </svg>
            )}
          </div>

          {/* Sleek compact coordinates strip tucked neatly inside bottom of map */}
          <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-[1px] flex items-center justify-between text-[9px] sm:text-[10px] font-mono-num text-white leading-tight pointer-events-none">
            <span className="truncate">
              {Math.floor(hud.x)} {Math.floor(hud.y)} {Math.floor(hud.z)}
            </span>
            <span className="text-[#fde68a] font-bold ml-1 shrink-0">{compassShort}</span>
          </div>
        </div>

        {/* Tiny corner Hide button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChangeMode('off');
          }}
          title="Ẩn bản đồ (M)"
          aria-label="Ẩn bản đồ"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#241b12]/90 hover:bg-[#3f2c1c] border border-[#b9996b] text-[#f5e7c9] flex items-center justify-center cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* When expanded, show compact Biome name directly underneath */}
      {isExpanded && (
        <div className="mt-1 px-1.5 py-0.5 bg-black/65 border border-[#a88b5f]/60 text-[10px] font-mc text-[#f5e7c9] max-w-[176px] truncate mc-text-shadow-sm">
          {hud.biome}
        </div>
      )}
    </div>
  );
};
