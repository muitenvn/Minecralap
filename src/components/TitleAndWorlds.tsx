import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FolderOpen,
  Maximize2,
  Minimize2,
  Package,
  Play,
  Plus,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { CompiledResourcePack } from '../game/resourcePack';
import {
  createNewWorldRecord,
  deleteWorld,
  exportWorldToFile,
  parseImportedWorldFile,
  saveWorld,
} from '../game/storage';
import { GameMode, WorldSave } from '../game/types';
import { McButton, McDirtBackdrop, McTitleLogo } from './McSprites';

const SPLASHES = [
  'Nether Update 1.16.5!',
  'Chơi mượt trên PC & Mobile!',
  'Đầy đủ giáp & công cụ!',
  'Thế giới vô hạn!',
  'Hỗ trợ lệnh Minecraft!',
];

interface TitleAndWorldsProps {
  pack: CompiledResourcePack;
  worlds: WorldSave[];
  screen: 'title' | 'worlds' | 'create_world';
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onNavigate: (s: 'title' | 'worlds' | 'create_world' | 'resource_manager' | 'options') => void;
  onLaunchWorld: (w: WorldSave) => void;
  onRefreshWorlds: () => Promise<void>;
}

export const TitleAndWorlds: React.FC<TitleAndWorldsProps> = ({
  pack,
  worlds,
  screen,
  isFullscreen,
  onToggleFullscreen,
  onNavigate,
  onLaunchWorld,
  onRefreshWorlds,
}) => {
  const splash = useMemo(() => SPLASHES[Math.floor(Math.random() * SPLASHES.length)], []);
  const [selectedId, setSelectedId] = useState<string | null>(worlds[0]?.id ?? null);
  const [newName, setNewName] = useState('Thế Giới Mới');
  const [newSeed, setNewSeed] = useState('');
  const [newMode, setNewMode] = useState<GameMode>('survival');
  const [cheats, setCheats] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const selectedWorld = worlds.find((w) => w.id === selectedId) || worlds[0] || null;

  const handleCreate = async () => {
    let seedNum: number | undefined;
    if (newSeed.trim()) {
      const asNum = Number(newSeed.trim());
      if (Number.isFinite(asNum)) {
        seedNum = Math.floor(asNum);
      } else {
        let h = 0;
        for (let i = 0; i < newSeed.length; i++) h = (Math.imul(31, h) + newSeed.charCodeAt(i)) | 0;
        seedNum = h;
      }
    }
    const created = createNewWorldRecord({
      name: newName,
      seed: seedNum,
      gameMode: newMode,
      cheatsEnabled: cheats,
    });
    await saveWorld(created);
    await onRefreshWorlds();
    onLaunchWorld(created);
  };

  const handleDelete = async (id: string) => {
    await deleteWorld(id);
    await onRefreshWorlds();
    setSelectedId(null);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const parsed = await parseImportedWorldFile(file);
      await saveWorld(parsed);
      await onRefreshWorlds();
      setSelectedId(parsed.id);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Không thể nhập tệp thế giới.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  // --- 1. AUTHENTIC CLASSIC MINECRAFT TITLE SCREEN ---
  if (screen === 'title') {
    return (
      <div className="fixed inset-0 z-20 flex flex-col items-center justify-between px-4 py-8 sm:py-12 pointer-events-none">
        <div className="fixed top-3 right-3 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ (F11)' : 'Toàn màn hình (F11)'}
            aria-label="Toàn màn hình"
            className="mc-btn w-[38px] h-[38px] flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-2 sm:mt-6">
          <McTitleLogo splashText={splash} />
        </div>

        {/* Classic centered stone buttons — no heavy dark container, no Skin button on root */}
        <div className="w-full max-w-[360px] flex flex-col gap-2.5 pointer-events-auto">
          <McButton
            variant="primary"
            widgetsUrl={pack.guiUrls.widgets}
            onClick={() => onNavigate('worlds')}
            className="w-full h-11 text-base"
          >
            <Play className="w-4 h-4 fill-current" />
            Chơi Đơn
          </McButton>

          <div className="grid grid-cols-2 gap-2.5">
            <McButton
              widgetsUrl={pack.guiUrls.widgets}
              onClick={() => onNavigate('options')}
              className="h-11"
            >
              <Settings className="w-4 h-4" />
              Cài Đặt
            </McButton>

            <McButton
              widgetsUrl={pack.guiUrls.widgets}
              onClick={() => onNavigate('resource_manager')}
              className="h-11"
            >
              <Package className="w-4 h-4" />
              Texture
            </McButton>
          </div>
        </div>

        <div className="w-full flex items-center justify-between gap-2 text-xs text-white/90 mc-text-shadow-sm px-1">
          <span className="font-mono-num">NetherCraft 1.16.5</span>
          <span className="font-mono-num">{pack.meta.name}</span>
        </div>
      </div>
    );
  }

  // --- 2. SELECT WORLD SCREEN ---
  if (screen === 'worlds') {
    return (
      <McDirtBackdrop bgUrl={pack.guiUrls.optionsBackground}>
        <div className="px-4 py-3.5 border-b-2 border-black bg-black/50 flex items-center justify-between gap-3">
          <h1 className="font-mc text-lg font-bold text-white mc-text-shadow">Chọn Thế Giới</h1>
          <div className="text-xs font-mono-num text-zinc-300">{worlds.length} thế giới</div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-[700px] mx-auto space-y-2">
            {importError && (
              <div className="bg-red-950/85 border border-red-500 px-3 py-2 text-xs text-red-200">
                {importError}
              </div>
            )}

            {worlds.length === 0 ? (
              <div className="border-2 border-dashed border-zinc-600 bg-black/45 p-8 text-center">
                <p className="font-mc text-base text-zinc-200 mb-4">Chưa có thế giới nào</p>
                <McButton variant="primary" onClick={() => onNavigate('create_world')} className="mx-auto">
                  <Plus className="w-4 h-4" />
                  Tạo Mới
                </McButton>
              </div>
            ) : (
              worlds.map((w) => {
                const isSel = selectedWorld?.id === w.id;
                const modCount =
                  Object.keys(w.overworldMods || {}).length + Object.keys(w.netherMods || {}).length;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    onDoubleClick={() => onLaunchWorld(w)}
                    className={`p-3 border-2 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSel
                        ? 'bg-black/75 border-white'
                        : 'bg-black/45 border-zinc-700/80 hover:border-zinc-500'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mc font-bold text-base text-white truncate">{w.name}</div>
                      <div className="text-xs text-zinc-300 font-mono-num mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span>
                          {w.gameMode === 'creative'
                            ? 'Sáng tạo'
                            : w.gameMode === 'survival'
                              ? 'Sinh tồn'
                              : w.gameMode}
                        </span>
                        <span>·</span>
                        <span>{w.dimension === 'nether' ? 'Nether' : 'Overworld'}</span>
                        <span>·</span>
                        <span>Seed: {w.seed}</span>
                        <span>·</span>
                        <span>{modCount} khối</span>
                      </div>
                    </div>
                    <McButton
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunchWorld(w);
                      }}
                      className="shrink-0 px-3"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Chơi
                    </McButton>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Classic Action Bar */}
        <div className="px-4 py-3 border-t-2 border-black bg-black/65">
          <div className="max-w-[700px] mx-auto grid grid-cols-2 sm:grid-cols-5 gap-2">
            <McButton
              variant="primary"
              disabled={!selectedWorld}
              onClick={() => selectedWorld && onLaunchWorld(selectedWorld)}
              className="col-span-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Chơi
            </McButton>

            <McButton onClick={() => onNavigate('create_world')} className="col-span-2 sm:col-span-1">
              <Plus className="w-4 h-4" />
              Tạo Mới
            </McButton>

            <McButton
              disabled={!selectedWorld}
              onClick={() => selectedWorld && exportWorldToFile(selectedWorld)}
            >
              <Download className="w-4 h-4" />
              Xuất
            </McButton>

            <McButton onClick={() => importRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Nhập
            </McButton>

            <input
              ref={importRef}
              type="file"
              accept=".json,.mc116.json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          <div className="max-w-[700px] mx-auto flex items-center justify-between gap-2 mt-2">
            <McButton
              variant="crimson"
              disabled={!selectedWorld}
              onClick={() => selectedWorld && handleDelete(selectedWorld.id)}
              className="text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </McButton>

            <McButton onClick={() => onNavigate('title')}>
              <ArrowLeft className="w-4 h-4" />
              Quay Lại
            </McButton>
          </div>
        </div>
      </McDirtBackdrop>
    );
  }

  // --- 3. CREATE NEW WORLD SCREEN ---
  const cycleMode = () => {
    const order: GameMode[] = ['survival', 'creative', 'adventure', 'spectator'];
    setNewMode(order[(order.indexOf(newMode) + 1) % order.length]);
  };
  const modeLabel: Record<GameMode, string> = {
    survival: 'Sinh tồn',
    creative: 'Sáng tạo',
    adventure: 'Phiêu lưu',
    spectator: 'Khán giả',
  };

  return (
    <McDirtBackdrop bgUrl={pack.guiUrls.optionsBackground}>
      <div className="px-4 py-3.5 border-b-2 border-black bg-black/50 text-center">
        <h1 className="font-mc text-lg font-bold text-white mc-text-shadow">Tạo Thế Giới Mới</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-[500px] mx-auto space-y-4">
          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">Tên Thế Giới</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={40}
              className="w-full bg-black border-2 border-[#a0a0a0] focus:border-white outline-none px-3 py-2 text-sm text-white font-mc"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300 mb-1 font-medium">
              Seed (trống = ngẫu nhiên)
            </label>
            <input
              type="text"
              value={newSeed}
              onChange={(e) => setNewSeed(e.target.value)}
              placeholder="Ví dụ: 1162020"
              className="w-full bg-black border-2 border-[#a0a0a0] focus:border-white outline-none px-3 py-2 text-sm font-mono-num text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <McButton onClick={cycleMode}>Chế độ: {modeLabel[newMode]}</McButton>
            <McButton onClick={() => setCheats((c) => !c)}>
              Lệnh: {cheats ? 'BẬT' : 'TẮT'}
            </McButton>
          </div>
        </div>
      </div>

      <div className="px-4 py-3.5 border-t-2 border-black bg-black/65">
        <div className="max-w-[500px] mx-auto grid grid-cols-2 gap-2.5">
          <McButton variant="primary" onClick={handleCreate}>
            <FolderOpen className="w-4 h-4" />
            Tạo Thế Giới
          </McButton>
          <McButton onClick={() => onNavigate('worlds')}>Hủy</McButton>
        </div>
      </div>
    </McDirtBackdrop>
  );
};
