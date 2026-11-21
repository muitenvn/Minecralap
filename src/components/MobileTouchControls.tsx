import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  ChevronDown,
  Crosshair,
  Hammer,
  Hand,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pause,
  Pickaxe,
} from 'lucide-react';
import { TouchControlStyle } from '../game/types';

interface MobileTouchControlsProps {
  flying: boolean;
  sneaking: boolean;
  isFullscreen: boolean;
  controlStyle: TouchControlStyle;
  onToggleControlStyle: () => void;
  onMove: (x: number, z: number) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onJump: (active: boolean) => void;
  onSneakToggle: () => void;
  onBreak: (active: boolean) => void;
  onUse: () => void;
  onTouchScreenBreak: (active: boolean, x?: number, y?: number) => void;
  onTouchScreenTap: (x: number, y: number) => void;
  onOpenChat: () => void;
  onCycleCamera: () => void;
  onToggleFullscreen: () => void;
  onPause: () => void;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  flying,
  sneaking,
  isFullscreen,
  controlStyle,
  onToggleControlStyle,
  onMove,
  onLookDelta,
  onJump,
  onSneakToggle,
  onBreak,
  onUse,
  onTouchScreenBreak,
  onTouchScreenTap,
  onOpenChat,
  onCycleCamera,
  onToggleFullscreen,
  onPause,
}) => {
  const isTouchScreenMode = controlStyle === 'touch_screen';
  const [dirState, setDirState] = useState({ up: false, down: false, left: false, right: false });
  const [breaking, setBreaking] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [jumping, setJumping] = useState(false);

  // Full-screen look / touch-anywhere pointer
  const lookPointerId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    dragged: boolean;
    holdBreaking: boolean;
  }>({ x: 0, y: 0, time: 0, dragged: false, holdBreaking: false });
  const holdTimerRef = useRef<number | null>(null);

  // Swipe-while-holding pointers for Break, Place, Jump
  const breakPtr = useRef<{ id: number | null; x: number; y: number }>({ id: null, x: 0, y: 0 });
  const placePtr = useRef<{ id: number | null; x: number; y: number }>({ id: null, x: 0, y: 0 });
  const jumpPtr = useRef<{ id: number | null; x: number; y: number }>({ id: null, x: 0, y: 0 });
  const placeRepeatRef = useRef<number | null>(null);

  const onTouchScreenBreakRef = useRef(onTouchScreenBreak);
  onTouchScreenBreakRef.current = onTouchScreenBreak;

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearHoldTimer();
      onTouchScreenBreakRef.current(false);
      if (placeRepeatRef.current !== null) {
        window.clearInterval(placeRepeatRef.current);
        placeRepeatRef.current = null;
      }
    };
  }, []);

  // Cancel active touch-anywhere mining when switching control styles
  useEffect(() => {
    clearHoldTimer();
    touchStartRef.current.holdBreaking = false;
    onTouchScreenBreakRef.current(false);
  }, [controlStyle]);

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

  // --- Full-screen camera drag & Minecraft PE Touch-Anywhere mining/tapping ---
  const handleLookDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Never swallow real desktop mouse events
    if (e.pointerType === 'mouse') return;
    if (lookPointerId.current !== null) return;
    lookPointerId.current = e.pointerId;
    lastLookPos.current = { x: e.clientX, y: e.clientY };
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      dragged: false,
      holdBreaking: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);

    if (isTouchScreenMode) {
      const startX = e.clientX;
      const startY = e.clientY;
      clearHoldTimer();
      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null;
        if (lookPointerId.current !== null && !touchStartRef.current.dragged) {
          touchStartRef.current.holdBreaking = true;
          onTouchScreenBreak(true, lastLookPos.current.x || startX, lastLookPos.current.y || startY);
        }
      }, 170);
    }
  };

  const handleLookMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    const dx = e.clientX - lastLookPos.current.x;
    const dy = e.clientY - lastLookPos.current.y;
    lastLookPos.current = { x: e.clientX, y: e.clientY };

    if (isTouchScreenMode) {
      const totalDist = Math.hypot(
        e.clientX - touchStartRef.current.x,
        e.clientY - touchStartRef.current.y,
      );
      if (touchStartRef.current.holdBreaking) {
        if (totalDist > 52) {
          // Finger moved far away: stop mining and seamlessly look around
          touchStartRef.current.holdBreaking = false;
          touchStartRef.current.dragged = true;
          onTouchScreenBreak(false);
          onLookDelta(dx * 1.15, dy * 1.15);
        } else {
          // Keep mining block directly under finger
          onTouchScreenBreak(true, e.clientX, e.clientY);
        }
        return;
      }
      if (totalDist > 12) {
        touchStartRef.current.dragged = true;
        clearHoldTimer();
      }
      if (touchStartRef.current.dragged) {
        onLookDelta(dx * 1.15, dy * 1.15);
      }
      return;
    }

    onLookDelta(dx * 1.15, dy * 1.15);
  };

  const handleLookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    lookPointerId.current = null;
    clearHoldTimer();

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (isTouchScreenMode) {
      if (touchStartRef.current.holdBreaking) {
        touchStartRef.current.holdBreaking = false;
        onTouchScreenBreak(false);
      } else if (!touchStartRef.current.dragged) {
        const dt = performance.now() - touchStartRef.current.time;
        if (dt < 280) {
          onTouchScreenTap(e.clientX, e.clientY);
        }
      }
    }
  };

  // --- Break button: hold + swipe to rotate camera while breaking ---
  const handleBreakDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    breakPtr.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setBreaking(true);
    onBreak(true);
  };

  const handleBreakMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (breakPtr.current.id !== e.pointerId) return;
    e.stopPropagation();
    const dx = e.clientX - breakPtr.current.x;
    const dy = e.clientY - breakPtr.current.y;
    breakPtr.current.x = e.clientX;
    breakPtr.current.y = e.clientY;
    onLookDelta(dx * 1.15, dy * 1.15);
  };

  const handleBreakUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (breakPtr.current.id !== e.pointerId) return;
    e.stopPropagation();
    breakPtr.current.id = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setBreaking(false);
    onBreak(false);
  };

  // --- Place/Use button: hold + swipe to rotate camera while placing continuously ---
  const stopPlaceRepeat = () => {
    if (placeRepeatRef.current !== null) {
      window.clearInterval(placeRepeatRef.current);
      placeRepeatRef.current = null;
    }
  };

  const handlePlaceDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    placePtr.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPlacing(true);
    onUse();
    stopPlaceRepeat();
    placeRepeatRef.current = window.setInterval(() => {
      onUse();
    }, 220);
  };

  const handlePlaceMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (placePtr.current.id !== e.pointerId) return;
    e.stopPropagation();
    const dx = e.clientX - placePtr.current.x;
    const dy = e.clientY - placePtr.current.y;
    placePtr.current.x = e.clientX;
    placePtr.current.y = e.clientY;
    onLookDelta(dx * 1.15, dy * 1.15);
  };

  const handlePlaceUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (placePtr.current.id !== e.pointerId) return;
    e.stopPropagation();
    placePtr.current.id = null;
    stopPlaceRepeat();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setPlacing(false);
  };

  // --- Jump button: hold + swipe to look while jumping ---
  const handleJumpDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    jumpPtr.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setJumping(true);
    onJump(true);
  };

  const handleJumpMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (jumpPtr.current.id !== e.pointerId) return;
    e.stopPropagation();
    const dx = e.clientX - jumpPtr.current.x;
    const dy = e.clientY - jumpPtr.current.y;
    jumpPtr.current.x = e.clientX;
    jumpPtr.current.y = e.clientY;
    onLookDelta(dx * 1.15, dy * 1.15);
  };

  const handleJumpUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (jumpPtr.current.id !== e.pointerId) return;
    e.stopPropagation();
    jumpPtr.current.id = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setJumping(false);
    onJump(false);
  };

  const dpadBtnClass = (active: boolean) =>
    `w-[48px] h-[48px] flex items-center justify-center select-none touch-none ${
      active ? 'mc-touch-pad-active' : 'mc-touch-pad'
    }`;

  return (
    <>
      {/* Full-screen transparent look / touch-anywhere mining surface at z-10 */}
      <div
        className="fixed inset-0 z-10 pointer-events-auto touch-none select-none"
        onPointerDown={handleLookDown}
        onPointerMove={handleLookMove}
        onPointerUp={handleLookUp}
        onPointerCancel={handleLookUp}
      />

      {/* Classic Minecraft PE Touch Controls at z-20 */}
      <div className="fixed inset-0 z-20 pointer-events-none select-none">
        {/* Top-Center: Chat, F5, Touch Style Toggle, Fullscreen, Pause */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onOpenChat}
            aria-label="Chat"
            className="w-[38px] h-[34px] mc-touch-pad flex items-center justify-center cursor-pointer active:bg-white/50 touch-manipulation"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCycleCamera}
            aria-label="F5"
            className="w-[38px] h-[34px] mc-touch-pad flex items-center justify-center cursor-pointer active:bg-white/50 touch-manipulation"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleControlStyle}
            title={
              isTouchScreenMode
                ? 'Đang dùng: Chạm đè màn hình (Bấm để đổi sang Nút Đập/Đặt)'
                : 'Đang dùng: Nút Đập/Đặt (Bấm để đổi sang Chạm đè màn hình)'
            }
            aria-label="Đổi kiểu điều khiển"
            className={`w-[38px] h-[34px] flex items-center justify-center cursor-pointer active:bg-white/50 touch-manipulation ${
              isTouchScreenMode ? 'mc-touch-pad-active' : 'mc-touch-pad'
            }`}
          >
            {isTouchScreenMode ? <Hand className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label="Toàn màn hình"
            className="w-[38px] h-[34px] mc-touch-pad flex items-center justify-center cursor-pointer active:bg-white/50 touch-manipulation"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Tạm dừng"
            className="w-[38px] h-[34px] mc-touch-pad flex items-center justify-center cursor-pointer active:bg-white/50 touch-manipulation"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom-Left Classic Minecraft PE D-Pad */}
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
            <ArrowUp className="w-5 h-5" />
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
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            aria-label="Cúi"
            onClick={(e) => {
              e.stopPropagation();
              onSneakToggle();
            }}
            className={`w-[48px] h-[48px] flex items-center justify-center touch-none ${
              sneaking ? 'mc-touch-pad-active' : 'mc-touch-pad'
            }`}
          >
            <ChevronDown className="w-5 h-5" />
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
            <ArrowRight className="w-5 h-5" />
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
            <ArrowDown className="w-5 h-5" />
          </button>
          <div />
        </div>

        {/* Bottom-Right Action Pad (Mode 1: Đập + Đặt + Nhảy; Mode 2: Nhảy/Bay only, tap/hold anywhere on screen) */}
        <div className="absolute right-2.5 bottom-16 sm:bottom-14 flex flex-col items-end gap-1 pointer-events-auto touch-none">
          {!isTouchScreenMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Đập"
                onPointerDown={handleBreakDown}
                onPointerMove={handleBreakMove}
                onPointerUp={handleBreakUp}
                onPointerCancel={handleBreakUp}
                className={`w-[50px] h-[50px] flex flex-col items-center justify-center gap-0.5 font-mc text-[10px] font-bold touch-none ${
                  breaking ? 'mc-touch-pad-active' : 'mc-touch-pad'
                }`}
              >
                <Pickaxe className="w-4 h-4" />
                <span>Đập</span>
              </button>

              <button
                type="button"
                aria-label="Đặt"
                onPointerDown={handlePlaceDown}
                onPointerMove={handlePlaceMove}
                onPointerUp={handlePlaceUp}
                onPointerCancel={handlePlaceUp}
                className={`w-[50px] h-[50px] flex flex-col items-center justify-center gap-0.5 font-mc text-[10px] font-bold touch-none ${
                  placing ? 'mc-touch-pad-active' : 'mc-touch-pad'
                }`}
              >
                <Hammer className="w-4 h-4" />
                <span>Đặt</span>
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label="Nhảy"
            onPointerDown={handleJumpDown}
            onPointerMove={handleJumpMove}
            onPointerUp={handleJumpUp}
            onPointerCancel={handleJumpUp}
            className={`${
              isTouchScreenMode ? 'w-[62px] h-[62px] flex-col gap-0.5' : 'w-[104px] h-[40px] gap-1'
            } flex items-center justify-center font-mc text-xs font-bold touch-none ${
              jumping ? 'mc-touch-pad-active' : 'mc-touch-pad'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
            <span>{flying ? 'Bay' : 'Nhảy'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
