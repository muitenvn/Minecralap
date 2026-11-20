import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bug,
  Camera,
  Hammer,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pause,
  Pickaxe,
  User,
} from 'lucide-react';

interface MobileTouchControlsProps {
  flying: boolean;
  sneaking: boolean;
  isFullscreen: boolean;
  onMove: (x: number, z: number) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onJump: (active: boolean) => void;
  onSneakToggle: () => void;
  onBreak: (active: boolean) => void;
  onUse: () => void;
  onOpenChat: () => void;
  onToggleF3: () => void;
  onCycleCamera: () => void;
  onOpenSkin: () => void;
  onToggleFullscreen: () => void;
  onPause: () => void;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  flying,
  sneaking,
  isFullscreen,
  onMove,
  onLookDelta,
  onJump,
  onSneakToggle,
  onBreak,
  onUse,
  onOpenChat,
  onToggleF3,
  onCycleCamera,
  onOpenSkin,
  onToggleFullscreen,
  onPause,
}) => {
  const [dirState, setDirState] = useState({ up: false, down: false, left: false, right: false });
  const [breaking, setBreaking] = useState(false);
  const [jumping, setJumping] = useState(false);

  // Track dedicated look pointer so multi-touch (left thumb D-pad + right thumb look) works smoothly
  const lookPointerId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lookMoved = useRef(false);

  const emitMove = (next: { up: boolean; down: boolean; left: boolean; right: boolean }) => {
    const x = (next.right ? 1 : 0) - (next.left ? 1 : 0);
    const z = (next.up ? 1 : 0) - (next.down ? 1 : 0);
    onMove(x, z);
  };

  const setDir = (key: 'up' | 'down' | 'left' | 'right', active: boolean) => {
    setDirState((prev) => {
      if (prev[key] === active) return prev;
      const next = { ...prev, [key]: active };
      emitMove(next);
      return next;
    });
  };

  const handleLookDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== null) return;
    lookPointerId.current = e.pointerId;
    lastLookPos.current = { x: e.clientX, y: e.clientY };
    lookMoved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleLookMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    const dx = e.clientX - lastLookPos.current.x;
    const dy = e.clientY - lastLookPos.current.y;
    if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) lookMoved.current = true;
    lastLookPos.current = { x: e.clientX, y: e.clientY };
    onLookDelta(dx * 1.15, dy * 1.15);
  };

  const handleLookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    lookPointerId.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const dpadBtnClass = (active: boolean) =>
    `w-[50px] h-[50px] flex items-center justify-center border-2 border-black select-none touch-none transition-colors ${
      active
        ? 'bg-[#2dd4bf]/80 text-black'
        : 'bg-[#120f1a]/65 text-white active:bg-white/30'
    }`;

  return (
    <div className="fixed inset-0 z-15 pointer-events-none select-none">
      {/* Full-screen transparent look drag surface behind buttons */}
      <div
        className="absolute inset-0 pointer-events-auto touch-none"
        onPointerDown={handleLookDown}
        onPointerMove={handleLookMove}
        onPointerUp={handleLookUp}
        onPointerCancel={handleLookUp}
      />

      {/* Top compact Minecraft Touch Bar */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={onOpenChat}
          aria-label="Mở Chat và Lệnh"
          className="min-w-[44px] min-h-[42px] px-2.5 bg-[#120f1a]/80 border-2 border-white/25 text-white flex items-center justify-center gap-1 text-xs font-mc cursor-pointer active:bg-white/25"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden xs:inline">Lệnh</span>
        </button>

        <button
          type="button"
          onClick={onCycleCamera}
          aria-label="Đổi góc nhìn F5"
          className="min-w-[44px] min-h-[42px] px-2.5 bg-[#120f1a]/80 border-2 border-white/25 text-[#5eead4] flex items-center justify-center gap-1 text-xs font-mc cursor-pointer active:bg-white/25"
        >
          <Camera className="w-4 h-4" />
          <span>F5</span>
        </button>

        <button
          type="button"
          onClick={onOpenSkin}
          aria-label="Đổi Skin và Model"
          className="min-w-[44px] min-h-[42px] px-2.5 bg-[#120f1a]/80 border-2 border-white/25 text-[#fde68a] flex items-center justify-center gap-1 text-xs font-mc cursor-pointer active:bg-white/25"
        >
          <User className="w-4 h-4" />
          <span>Skin</span>
        </button>

        <button
          type="button"
          onClick={onToggleF3}
          aria-label="Bật tắt F3"
          className="min-w-[44px] min-h-[42px] px-2.5 bg-[#120f1a]/80 border-2 border-white/25 text-white flex items-center justify-center gap-1 text-xs font-mono-num cursor-pointer active:bg-white/25"
        >
          <Bug className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          className="min-w-[44px] min-h-[42px] px-2.5 bg-[#120f1a]/80 border-2 border-white/25 text-[#5eead4] flex items-center justify-center gap-1 text-xs font-mc cursor-pointer active:bg-white/25"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onPause}
          aria-label="Tạm dừng"
          className="min-w-[44px] min-h-[42px] px-2.5 bg-[#120f1a]/80 border-2 border-white/25 text-white flex items-center justify-center gap-1 text-xs font-mc cursor-pointer active:bg-white/25"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom-Left Minecraft D-Pad (Thumb zone, above hotbar on small screens) */}
      <div className="absolute left-3 bottom-20 sm:bottom-16 grid grid-cols-3 gap-1 pointer-events-auto touch-none">
        <div />
        <button
          type="button"
          aria-label="Tiến"
          className={dpadBtnClass(dirState.up)}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDir('up', true);
          }}
          onPointerUp={() => setDir('up', false)}
          onPointerLeave={() => setDir('up', false)}
          onPointerCancel={() => setDir('up', false)}
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          type="button"
          aria-label="Trái"
          className={dpadBtnClass(dirState.left)}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDir('left', true);
          }}
          onPointerUp={() => setDir('left', false)}
          onPointerLeave={() => setDir('left', false)}
          onPointerCancel={() => setDir('left', false)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          aria-label="Cúi người"
          onClick={(e) => {
            e.stopPropagation();
            onSneakToggle();
          }}
          className={`w-[50px] h-[50px] flex items-center justify-center border-2 border-black text-[11px] font-mc font-bold touch-none ${
            sneaking ? 'bg-amber-400/85 text-black' : 'bg-black/45 text-zinc-200'
          }`}
        >
          CÚI
        </button>

        <button
          type="button"
          aria-label="Phải"
          className={dpadBtnClass(dirState.right)}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDir('right', true);
          }}
          onPointerUp={() => setDir('right', false)}
          onPointerLeave={() => setDir('right', false)}
          onPointerCancel={() => setDir('right', false)}
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <div />
        <button
          type="button"
          aria-label="Lùi"
          className={dpadBtnClass(dirState.down)}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDir('down', true);
          }}
          onPointerUp={() => setDir('down', false)}
          onPointerLeave={() => setDir('down', false)}
          onPointerCancel={() => setDir('down', false)}
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <div />
      </div>

      {/* Bottom-Right Action Cluster (Break, Place/Use, Jump/Fly) */}
      <div className="absolute right-3 bottom-20 sm:bottom-16 flex flex-col items-end gap-2 pointer-events-auto touch-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Đập khối hoặc Tấn công"
            onPointerDown={(e) => {
              e.stopPropagation();
              setBreaking(true);
              onBreak(true);
            }}
            onPointerUp={() => {
              setBreaking(false);
              onBreak(false);
            }}
            onPointerLeave={() => {
              setBreaking(false);
              onBreak(false);
            }}
            onPointerCancel={() => {
              setBreaking(false);
              onBreak(false);
            }}
            className={`w-[58px] h-[58px] border-2 border-black flex flex-col items-center justify-center gap-0.5 font-mc text-[11px] font-bold touch-none ${
              breaking ? 'bg-rose-500 text-white' : 'bg-black/60 text-rose-200'
            }`}
          >
            <Pickaxe className="w-5 h-5" />
            <span>ĐẬP</span>
          </button>

          <button
            type="button"
            aria-label="Đặt khối hoặc Dùng vật phẩm"
            onPointerDown={(e) => {
              e.stopPropagation();
              onUse();
            }}
            className="w-[58px] h-[58px] border-2 border-black bg-black/60 active:bg-[#2dd4bf] active:text-black text-[#5eead4] flex flex-col items-center justify-center gap-0.5 font-mc text-[11px] font-bold touch-none"
          >
            <Hammer className="w-5 h-5" />
            <span>ĐẶT</span>
          </button>
        </div>

        <button
          type="button"
          aria-label="Nhảy hoặc Bay"
          onPointerDown={(e) => {
            e.stopPropagation();
            setJumping(true);
            onJump(true);
          }}
          onPointerUp={() => {
            setJumping(false);
            onJump(false);
          }}
          onPointerLeave={() => {
            setJumping(false);
            onJump(false);
          }}
          onPointerCancel={() => {
            setJumping(false);
            onJump(false);
          }}
          className={`w-[124px] h-[52px] border-2 border-black flex items-center justify-center font-mc text-sm font-bold touch-none ${
            jumping ? 'bg-amber-400 text-black' : 'bg-black/60 text-white'
          }`}
        >
          {flying ? 'BAY LÊN (2× NHẢY)' : 'NHẢY'}
        </button>
      </div>
    </div>
  );
};
