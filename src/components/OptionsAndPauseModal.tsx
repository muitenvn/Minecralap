import React from 'react';
import {
  ArrowLeft,
  Download,
  LogOut,
  Package,
  Play,
  RotateCcw,
  Settings,
  Skull,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CompiledResourcePack } from '../game/resourcePack';
import { DEFAULT_VIDEO_SETTINGS, VideoSettings } from '../game/types';
import { McButton, McDirtBackdrop } from './McSprites';

// --- 1. PAUSE MODAL (Esc in-game) ---
interface PauseModalProps {
  worldName: string;
  pack: CompiledResourcePack;
  onResume: () => void;
  onOpenOptions: () => void;
  onOpenResourcePack: () => void;
  onExportWorld: () => void;
  onSaveAndQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  worldName,
  pack,
  onResume,
  onOpenOptions,
  onOpenResourcePack,
  onExportWorld,
  onSaveAndQuit,
}) => (
  <div className="fixed inset-0 z-30 bg-black/65 flex items-center justify-center p-4">
    <div className="w-full max-w-[400px] flex flex-col gap-3">
      <div className="text-center mb-2">
        <h2 className="font-mc text-2xl font-bold text-white mc-text-shadow">
          Trò Chơi Tạm Dừng
        </h2>
        <p className="text-xs text-zinc-300 font-mono-num mt-1">
          Thế giới: {worldName} (Đã tự lưu vào IndexedDB)
        </p>
      </div>

      <McButton
        variant="primary"
        widgetsUrl={pack.guiUrls.widgets}
        onClick={onResume}
        className="w-full h-12"
      >
        <Play className="w-4 h-4 fill-current" />
        Tiếp Tục Chơi
      </McButton>

      <div className="grid grid-cols-2 gap-3">
        <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onOpenOptions}>
          <Settings className="w-4 h-4" />
          Cài Đặt
        </McButton>
        <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onOpenResourcePack}>
          <Package className="w-4 h-4" />
          Tài Nguyên
        </McButton>
      </div>

      <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onExportWorld}>
        <Download className="w-4 h-4" />
        Xuất Thế Giới (.mc116.json)
      </McButton>

      <McButton variant="crimson" onClick={onSaveAndQuit} className="mt-1">
        <LogOut className="w-4 h-4" />
        Lưu & Về Menu Chính
      </McButton>
    </div>
  </div>
);

// --- 2. FULL VIDEO SETTINGS & CONTROLS SCREEN ---
interface VideoOptionsModalProps {
  settings: VideoSettings;
  pack: CompiledResourcePack | null;
  inGame: boolean;
  onChange: (next: VideoSettings) => void;
  onClose: () => void;
}

export const VideoOptionsModal: React.FC<VideoOptionsModalProps> = ({
  settings,
  pack,
  inGame,
  onChange,
  onClose,
}) => {
  const update = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const cycleClouds = () => {
    const order: VideoSettings['clouds'][] = ['fancy', 'fast', 'off'];
    update('clouds', order[(order.indexOf(settings.clouds) + 1) % order.length]);
  };

  const cycleParticles = () => {
    const order: VideoSettings['particles'][] = ['all', 'decreased', 'minimal'];
    update('particles', order[(order.indexOf(settings.particles) + 1) % order.length]);
  };

  const cycleGuiScale = () => {
    const order: VideoSettings['guiScale'][] = ['auto', 'small', 'medium', 'large'];
    update('guiScale', order[(order.indexOf(settings.guiScale) + 1) % order.length]);
  };

  const cycleTouch = () => {
    const order: VideoSettings['touchMode'][] = ['auto', 'on', 'off'];
    update('touchMode', order[(order.indexOf(settings.touchMode) + 1) % order.length]);
  };

  const cloudsLabel = { fancy: 'Đẹp (3D)', fast: 'Nhanh (2D)', off: 'Tắt' }[settings.clouds];
  const particlesLabel = { all: 'Đầy đủ', decreased: 'Giảm bớt', minimal: 'Tối thiểu' }[
    settings.particles
  ];
  const guiLabel = { auto: 'Tự động', small: 'Nhỏ', medium: 'Vừa', large: 'Lớn' }[
    settings.guiScale
  ];
  const touchLabel = { auto: 'Tự động (PC/Mobile)', on: 'Luôn Bật Cảm Ứng', off: 'Tắt Cảm Ứng' }[
    settings.touchMode
  ];

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b-2 border-black bg-black/55 flex items-center justify-between gap-3">
        <h2 className="font-mc text-lg sm:text-xl font-bold text-white mc-text-shadow">
          Cài Đặt Đồ Họa & Điều Khiển 1.16
        </h2>
        <McButton
          onClick={() => onChange({ ...DEFAULT_VIDEO_SETTINGS })}
          className="text-xs sm:text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Mặc định
        </McButton>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-[760px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Render Distance */}
          <div className="bg-black/55 border-2 border-[#555] px-3 py-2.5">
            <div className="flex justify-between text-xs sm:text-sm font-mc text-white mb-1.5">
              <span>Khoảng cách hiển thị (Chunks)</span>
              <span className="font-mono-num text-[#5eead4]">{settings.renderDistance} chunks</span>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={settings.renderDistance}
              onChange={(e) => update('renderDistance', Number(e.target.value))}
              className="w-full accent-[#2dd4bf] cursor-pointer"
            />
          </div>

          {/* FOV */}
          <div className="bg-black/55 border-2 border-[#555] px-3 py-2.5">
            <div className="flex justify-between text-xs sm:text-sm font-mc text-white mb-1.5">
              <span>Góc nhìn (FOV)</span>
              <span className="font-mono-num text-[#5eead4]">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min={50}
              max={110}
              step={1}
              value={settings.fov}
              onChange={(e) => update('fov', Number(e.target.value))}
              className="w-full accent-[#2dd4bf] cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div className="bg-black/55 border-2 border-[#555] px-3 py-2.5">
            <div className="flex justify-between text-xs sm:text-sm font-mc text-white mb-1.5">
              <span>Độ sáng (Brightness)</span>
              <span className="font-mono-num text-[#5eead4]">
                {Math.round(settings.brightness * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1.3}
              step={0.05}
              value={settings.brightness}
              onChange={(e) => update('brightness', Number(e.target.value))}
              className="w-full accent-[#2dd4bf] cursor-pointer"
            />
          </div>

          {/* Sensitivity */}
          <div className="bg-black/55 border-2 border-[#555] px-3 py-2.5">
            <div className="flex justify-between text-xs sm:text-sm font-mc text-white mb-1.5">
              <span>Độ nhạy Chuột / Cảm ứng</span>
              <span className="font-mono-num text-[#5eead4]">
                {Math.round(settings.sensitivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.sensitivity}
              onChange={(e) => update('sensitivity', Number(e.target.value))}
              className="w-full accent-[#2dd4bf] cursor-pointer"
            />
          </div>

          {/* Volume + Mute */}
          <div className="bg-black/55 border-2 border-[#555] px-3 py-2.5 sm:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-xs sm:text-sm font-mc text-white">
                Âm lượng tổng: {settings.muted ? 'Đang tắt tiếng' : `${Math.round(settings.volume * 100)}%`}
              </span>
              <button
                type="button"
                onClick={() => update('muted', !settings.muted)}
                className="mc-btn min-h-[34px] px-3 py-1 text-xs"
              >
                {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {settings.muted ? 'Bật tiếng' : 'Tắt tiếng'}
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => update('volume', Number(e.target.value))}
              className="w-full accent-[#2dd4bf] cursor-pointer"
            />
          </div>

          {/* Toggle Buttons matching Minecraft 1.16 Video Settings */}
          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('graphics', settings.graphics === 'fancy' ? 'fast' : 'fancy')}
          >
            Đồ họa: {settings.graphics === 'fancy' ? 'Đẹp (Fancy)' : 'Nhanh (Fast)'}
          </McButton>

          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('smoothLighting', !settings.smoothLighting)}
          >
            Ánh sáng mịn (AO): {settings.smoothLighting ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleClouds}>
            Mây trời: {cloudsLabel}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleParticles}>
            Hiệu ứng hạt: {particlesLabel}
          </McButton>

          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('viewBobbing', !settings.viewBobbing)}
          >
            Rung tay khi đi: {settings.viewBobbing ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('shadows', !settings.shadows)}
          >
            Đổ bóng thời gian thực: {settings.shadows ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleGuiScale}>
            Tỉ lệ giao diện (GUI): {guiLabel}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleTouch}>
            Phím cảm ứng Mobile: {touchLabel}
          </McButton>
        </div>
      </div>

      <div className="px-4 py-4 border-t-2 border-black bg-black/65 flex justify-center">
        <McButton
          variant="primary"
          widgetsUrl={pack?.guiUrls.widgets}
          onClick={onClose}
          className="w-full max-w-[340px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Xong (Áp dụng ngay)
        </McButton>
      </div>
    </div>
  );

  if (inGame) {
    return <div className="fixed inset-0 z-35 bg-[#120f17]/92">{content}</div>;
  }

  return <McDirtBackdrop bgUrl={pack?.guiUrls.optionsBackground}>{content}</McDirtBackdrop>;
};

// --- 3. MINECRAFT DEATH & RESPAWN SCREEN ---
interface DeathModalProps {
  x: number;
  y: number;
  z: number;
  level: number;
  onRespawn: () => void;
  onQuitToTitle: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  x,
  y,
  z,
  level,
  onRespawn,
  onQuitToTitle,
}) => (
  <div className="fixed inset-0 z-35 bg-[#5c0d0d]/78 flex items-center justify-center p-4">
    <div className="w-full max-w-[400px] text-center flex flex-col items-center gap-4">
      <Skull className="w-14 h-14 text-red-200 drop-shadow-[0_4px_0_rgba(0,0,0,0.8)]" />
      <h1 className="font-mc text-4xl font-bold text-white mc-text-shadow">Bạn Đã Chết!</h1>
      <p className="text-sm font-mono-num text-red-100 mc-text-shadow-sm">
        Vị trí: {Math.floor(x)}, {Math.floor(y)}, {Math.floor(z)} · Cấp độ XP: {level}
      </p>
      <div className="w-full flex flex-col gap-3 mt-2">
        <McButton variant="primary" onClick={onRespawn} className="w-full h-12">
          Hồi Sinh (Respawn)
        </McButton>
        <McButton variant="crimson" onClick={onQuitToTitle} className="w-full h-11">
          Về Màn Hình Chính
        </McButton>
      </div>
    </div>
  </div>
);
