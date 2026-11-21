import React from 'react';
import {
  ArrowLeft,
  Bug,
  Download,
  Layers,
  LogOut,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Package,
  Play,
  RotateCcw,
  Settings,
  Skull,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CompiledResourcePack } from '../game/resourcePack';
import { DEFAULT_VIDEO_SETTINGS, MinimapMode, TexturePreset, VideoSettings } from '../game/types';
import { McButton, McDirtBackdrop } from './McSprites';

// --- 1. PAUSE MODAL (Authentic Classic Minecraft Pause Overlay) ---
interface PauseModalProps {
  worldName: string;
  pack: CompiledResourcePack;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onResume: () => void;
  onOpenOptions: () => void;
  onOpenResourcePack: () => void;
  onExportWorld: () => void;
  onSaveAndQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  worldName,
  pack,
  isFullscreen,
  onToggleFullscreen,
  onResume,
  onOpenOptions,
  onOpenResourcePack,
  onExportWorld,
  onSaveAndQuit,
}) => (
  <div className="fixed inset-0 z-30 bg-black/65 flex items-center justify-center p-4">
    <div className="w-full max-w-[360px] flex flex-col gap-2.5">
      <div className="text-center mb-2">
        <h2 className="font-mc text-xl font-bold text-white mc-text-shadow">
          Menu Trò Chơi
        </h2>
        <p className="text-xs text-zinc-300 font-mono-num mt-0.5 truncate">{worldName}</p>
      </div>

      <McButton
        variant="primary"
        widgetsUrl={pack.guiUrls.widgets}
        onClick={onResume}
        className="w-full h-11"
      >
        <Play className="w-4 h-4 fill-current" />
        Tiếp Tục
      </McButton>

      <div className="grid grid-cols-2 gap-2.5">
        <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onOpenOptions}>
          <Settings className="w-4 h-4" />
          Cài Đặt
        </McButton>
        <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onOpenResourcePack}>
          <Package className="w-4 h-4" />
          Texture
        </McButton>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {isFullscreen ? 'Thu Nhỏ' : 'Full Màn'}
        </McButton>
        <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onExportWorld}>
          <Download className="w-4 h-4" />
          Xuất File
        </McButton>
      </div>

      <McButton widgetsUrl={pack.guiUrls.widgets} onClick={onSaveAndQuit} className="mt-1">
        <LogOut className="w-4 h-4" />
        Lưu &amp; Thoát
      </McButton>
    </div>
  </div>
);

// --- 2. CLASSIC MINECRAFT OPTIONS SCREEN (Contains Skin & F3 toggle!) ---
interface VideoOptionsModalProps {
  settings: VideoSettings;
  pack: CompiledResourcePack | null;
  inGame: boolean;
  isFullscreen: boolean;
  showF3: boolean;
  onToggleF3: () => void;
  onOpenSkin: () => void;
  onToggleFullscreen: () => void;
  onChange: (next: VideoSettings) => void;
  onSwitchTexturePreset: (preset: TexturePreset) => Promise<void>;
  onClose: () => void;
}

export const VideoOptionsModal: React.FC<VideoOptionsModalProps> = ({
  settings,
  pack,
  inGame,
  isFullscreen,
  showF3,
  onToggleF3,
  onOpenSkin,
  onToggleFullscreen,
  onChange,
  onSwitchTexturePreset,
  onClose,
}) => {
  const [switchingPack, setSwitchingPack] = React.useState(false);

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

  const cycleMinimap = () => {
    const order: MinimapMode[] = ['compact', 'expanded', 'off'];
    const cur = settings.minimapMode || 'compact';
    update('minimapMode', order[(order.indexOf(cur) + 1) % order.length]);
  };

  const cloudsLabel = { fancy: 'Đẹp', fast: 'Nhanh', off: 'Tắt' }[settings.clouds];
  const particlesLabel = { all: 'Đầy đủ', decreased: 'Ít', minimal: 'Tối thiểu' }[
    settings.particles
  ];
  const guiLabel = { auto: 'Tự động', small: 'Nhỏ', medium: 'Vừa', large: 'Lớn' }[
    settings.guiScale
  ];
  const touchLabel = { auto: 'Tự động', on: 'Bật', off: 'Tắt' }[settings.touchMode];
  const minimapLabel = { compact: 'Gọn', expanded: 'Lớn', off: 'Tắt' }[
    settings.minimapMode || 'compact'
  ];

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b-2 border-black bg-black/55 flex items-center justify-between gap-3">
        <h2 className="font-mc text-lg font-bold text-white mc-text-shadow">Cài Đặt</h2>
        <McButton
          widgetsUrl={pack?.guiUrls.widgets}
          onClick={() => onChange({ ...DEFAULT_VIDEO_SETTINGS })}
          className="min-h-[36px] text-xs px-3"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Mặc định
        </McButton>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[700px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Skin & Model — exclusively accessible from Settings! */}
          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={onOpenSkin}
            className="sm:col-span-2"
          >
            <User className="w-4 h-4" />
            Skin &amp; Model 3D
          </McButton>

          {/* Render Distance */}
          <div className="bg-black/55 border-2 border-black px-3 py-2">
            <div className="flex justify-between text-xs font-mc text-white mb-1">
              <span>Tầm nhìn</span>
              <span className="font-mono-num text-[#ffffa0]">{settings.renderDistance} chunk</span>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={settings.renderDistance}
              onChange={(e) => update('renderDistance', Number(e.target.value))}
              className="w-full accent-[#a8a8a8] cursor-pointer"
            />
          </div>

          {/* FOV */}
          <div className="bg-black/55 border-2 border-black px-3 py-2">
            <div className="flex justify-between text-xs font-mc text-white mb-1">
              <span>Góc nhìn (FOV)</span>
              <span className="font-mono-num text-[#ffffa0]">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min={50}
              max={110}
              step={1}
              value={settings.fov}
              onChange={(e) => update('fov', Number(e.target.value))}
              className="w-full accent-[#a8a8a8] cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div className="bg-black/55 border-2 border-black px-3 py-2">
            <div className="flex justify-between text-xs font-mc text-white mb-1">
              <span>Độ sáng</span>
              <span className="font-mono-num text-[#ffffa0]">
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
              className="w-full accent-[#a8a8a8] cursor-pointer"
            />
          </div>

          {/* Sensitivity */}
          <div className="bg-black/55 border-2 border-black px-3 py-2">
            <div className="flex justify-between text-xs font-mc text-white mb-1">
              <span>Độ nhạy</span>
              <span className="font-mono-num text-[#ffffa0]">
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
              className="w-full accent-[#a8a8a8] cursor-pointer"
            />
          </div>

          {/* Volume + Mute */}
          <div className="bg-black/55 border-2 border-black px-3 py-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-mc text-white">
                Âm lượng: {settings.muted ? 'Tắt' : `${Math.round(settings.volume * 100)}%`}
              </span>
              <McButton
                widgetsUrl={pack?.guiUrls.widgets}
                onClick={() => update('muted', !settings.muted)}
                className="min-h-[30px] h-[30px] px-2.5 py-0.5 text-xs"
              >
                {settings.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {settings.muted ? 'Bật' : 'Tắt'}
              </McButton>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => update('volume', Number(e.target.value))}
              className="w-full accent-[#a8a8a8] cursor-pointer"
            />
          </div>

          {/* Classic Minecraft Toggle Buttons */}
          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('graphics', settings.graphics === 'fancy' ? 'fast' : 'fancy')}
          >
            Đồ họa: {settings.graphics === 'fancy' ? 'Đẹp' : 'Nhanh'}
          </McButton>

          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('smoothLighting', !settings.smoothLighting)}
          >
            Ánh sáng mịn: {settings.smoothLighting ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleClouds}>
            Mây: {cloudsLabel}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleParticles}>
            Hạt: {particlesLabel}
          </McButton>

          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('viewBobbing', !settings.viewBobbing)}
          >
            Rung tay: {settings.viewBobbing ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={() => update('shadows', !settings.shadows)}
          >
            Đổ bóng: {settings.shadows ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleGuiScale}>
            Cỡ UI: {guiLabel}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleTouch}>
            Cảm ứng: {touchLabel}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={onToggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            Full màn: {isFullscreen ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={onToggleF3}>
            <Bug className="w-4 h-4" />
            Tọa độ F3: {showF3 ? 'BẬT' : 'TẮT'}
          </McButton>

          <McButton widgetsUrl={pack?.guiUrls.widgets} onClick={cycleMinimap} className="sm:col-span-2">
            <MapIcon className="w-4 h-4" />
            Bản đồ nhỏ (M): {minimapLabel}
          </McButton>

          <McButton
            disabled={switchingPack}
            widgetsUrl={pack?.guiUrls.widgets}
            onClick={async () => {
              setSwitchingPack(true);
              try {
                const order: TexturePreset[] = ['hd_plus', 'original', 'current'];
                const nextPreset = order[(order.indexOf(settings.texturePreset) + 1) % order.length];
                await onSwitchTexturePreset(nextPreset);
              } finally {
                setSwitchingPack(false);
              }
            }}
            className="sm:col-span-2"
          >
            <Layers className="w-4 h-4" />
            {switchingPack
              ? 'Đang đổi Texture...'
              : settings.texturePreset === 'hd_plus'
                ? 'Texture: HD+ (Faithful 32x)'
                : settings.texturePreset === 'original'
                  ? 'Texture: Chính Gốc 26.3'
                  : 'Texture: 32×32 Offline'}
          </McButton>
        </div>
      </div>

      <div className="px-4 py-3.5 border-t-2 border-black bg-black/65 flex justify-center">
        <McButton
          widgetsUrl={pack?.guiUrls.widgets}
          onClick={onClose}
          className="w-full max-w-[300px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Xong
        </McButton>
      </div>
    </div>
  );

  if (inGame) {
    return <div className="fixed inset-0 z-[35] bg-black/80">{content}</div>;
  }

  return <McDirtBackdrop bgUrl={pack?.guiUrls.optionsBackground}>{content}</McDirtBackdrop>;
};

// --- 3. MINECRAFT DEATH & RESPAWN SCREEN ---
interface DeathModalProps {
  x: number;
  y: number;
  z: number;
  level: number;
  widgetsUrl?: string;
  onRespawn: () => void;
  onQuitToTitle: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  x,
  y,
  z,
  level,
  widgetsUrl,
  onRespawn,
  onQuitToTitle,
}) => (
  <div className="fixed inset-0 z-[35] bg-[#5c0d0d]/75 flex items-center justify-center p-4">
    <div className="w-full max-w-[340px] text-center flex flex-col items-center gap-3.5">
      <Skull className="w-12 h-12 text-red-200 drop-shadow-[0_4px_0_rgba(0,0,0,0.8)]" />
      <h1 className="font-mc text-3xl sm:text-4xl font-bold text-white mc-text-shadow">
        Bạn Đã Chết!
      </h1>
      <p className="text-xs font-mono-num text-red-100 mc-text-shadow-sm">
        {Math.floor(x)}, {Math.floor(y)}, {Math.floor(z)} · XP: {level}
      </p>
      <div className="w-full flex flex-col gap-2.5 mt-1">
        <McButton widgetsUrl={widgetsUrl} onClick={onRespawn} className="w-full h-11">
          Hồi Sinh
        </McButton>
        <McButton widgetsUrl={widgetsUrl} onClick={onQuitToTitle} className="w-full h-11">
          Menu Chính
        </McButton>
      </div>
    </div>
  </div>
);
