import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Check,
  Code2,
  Globe,
  RotateCcw,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  getBuiltinSkins,
  loadCustomSkinsLibrary,
  loadSkinFromFile,
  loadSkinFromMinecraftUsername,
  loadSkinFromUrl,
  saveCustomSkinToLibrary,
} from '../game/playerSkin';
import {
  DEFAULT_MODEL_CODE,
  PlayerModelCode,
  PlayerSkinConfig,
  SkinArmModel,
} from '../game/types';
import { McButton } from './McSprites';
import { SkinPreview3D } from './SkinPreview3D';

interface SkinManagerModalProps {
  currentSkin: PlayerSkinConfig;
  onApplySkin: (next: PlayerSkinConfig) => void;
  onClose: () => void;
}

export const SkinManagerModal: React.FC<SkinManagerModalProps> = ({
  currentSkin,
  onApplySkin,
  onClose,
}) => {
  const builtinSkins = useMemo(() => getBuiltinSkins(), []);
  const [customLibrary, setCustomLibrary] = useState<PlayerSkinConfig[]>(() =>
    loadCustomSkinsLibrary(),
  );
  const [draft, setDraft] = useState<PlayerSkinConfig>(() => ({
    ...currentSkin,
    modelCode: { ...DEFAULT_MODEL_CODE, ...currentSkin.modelCode },
  }));

  const [tab, setTab] = useState<'presets' | 'import' | 'model_code'>('presets');
  const [walkingPreview, setWalkingPreview] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [skinUrlInput, setSkinUrlInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [glbUrlInput, setGlbUrlInput] = useState(draft.modelCode.externalGlbUrl || '');
  const [codeText, setCodeText] = useState(() => JSON.stringify(draft.modelCode, null, 2));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const skinFileRef = useRef<HTMLInputElement>(null);
  const glbFileRef = useRef<HTMLInputElement>(null);

  const syncDraft = (next: PlayerSkinConfig) => {
    setDraft(next);
    setCodeText(JSON.stringify(next.modelCode, null, 2));
    setGlbUrlInput(next.modelCode.externalGlbUrl || '');
  };

  const handleSelectSkin = (s: PlayerSkinConfig) => {
    setError(null);
    setNotice(`Đã chọn skin: ${s.name}`);
    syncDraft({
      ...s,
      modelCode: { ...DEFAULT_MODEL_CODE, ...s.modelCode },
    });
  };

  const handleArmToggle = (armModel: SkinArmModel) => {
    const next: PlayerSkinConfig = {
      ...draft,
      armModel,
      modelCode: { ...draft.modelCode, armWidth: armModel === 'slim' ? 3 : 4 },
    };
    syncDraft(next);
  };

  const handleCapeToggle = () => {
    const next: PlayerSkinConfig = {
      ...draft,
      modelCode: { ...draft.modelCode, showCape: !draft.modelCode.showCape },
    };
    syncDraft(next);
  };

  const handleUploadSkinFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const dataUrl = await loadSkinFromFile(file);
      const next: PlayerSkinConfig = {
        id: `custom_${Date.now()}`,
        name: customName.trim() || file.name.replace(/\.png$/i, ''),
        source: 'upload',
        armModel: draft.armModel,
        skinDataUrl: dataUrl,
        modelCode: { ...draft.modelCode, externalGlbUrl: '' },
      };
      setCustomLibrary(saveCustomSkinToLibrary(next));
      syncDraft(next);
      setNotice('Đã nhập skin của bạn thành công! Xoay nhân vật bên trái để xem thử.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đọc tệp skin PNG.');
    } finally {
      setLoading(false);
      if (skinFileRef.current) skinFileRef.current.value = '';
    }
  };

  const handleFetchUsername = async () => {
    if (!usernameInput.trim()) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const dataUrl = await loadSkinFromMinecraftUsername(usernameInput);
      const next: PlayerSkinConfig = {
        id: `mc_${usernameInput.trim().toLowerCase()}`,
        name: usernameInput.trim(),
        source: 'username',
        sourceRef: usernameInput.trim(),
        armModel: draft.armModel,
        skinDataUrl: dataUrl,
        modelCode: { ...draft.modelCode, externalGlbUrl: '' },
      };
      setCustomLibrary(saveCustomSkinToLibrary(next));
      syncDraft(next);
      setNotice(`Đã tải skin tài khoản "${usernameInput.trim()}" từ mạng thành công!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được skin từ tên người chơi.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSkinUrl = async () => {
    if (!skinUrlInput.trim()) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const dataUrl = await loadSkinFromUrl(skinUrlInput);
      const next: PlayerSkinConfig = {
        id: `url_${Date.now()}`,
        name: customName.trim() || 'Skin từ URL',
        source: 'url',
        sourceRef: skinUrlInput.trim(),
        armModel: draft.armModel,
        skinDataUrl: dataUrl,
        modelCode: { ...draft.modelCode, externalGlbUrl: '' },
      };
      setCustomLibrary(saveCustomSkinToLibrary(next));
      syncDraft(next);
      setNotice('Đã tải skin từ URL thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được ảnh skin từ URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleGlbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const nextCode: PlayerModelCode = {
      ...draft.modelCode,
      externalGlbUrl: blobUrl,
    };
    syncDraft({
      ...draft,
      name: file.name.replace(/\.(glb|gltf)$/i, ''),
      modelCode: nextCode,
    });
    setNotice(`Đã nạp model 3D "${file.name}"! Bạn có thể chỉnh scale/offset ở khung Code bên dưới.`);
    if (glbFileRef.current) glbFileRef.current.value = '';
  };

  const handleApplyGlbUrl = () => {
    setError(null);
    const nextCode: PlayerModelCode = {
      ...draft.modelCode,
      externalGlbUrl: glbUrlInput.trim(),
    };
    syncDraft({ ...draft, modelCode: nextCode });
    setNotice(
      glbUrlInput.trim()
        ? 'Đã nạp link Model 3D (.glb/.gltf) vào nhân vật!'
        : 'Đã quay về Model Minecraft 64×64 chuẩn.',
    );
  };

  const handleApplyModelCode = () => {
    setError(null);
    try {
      const parsed = JSON.parse(codeText) as Partial<PlayerModelCode>;
      const merged: PlayerModelCode = {
        ...DEFAULT_MODEL_CODE,
        ...parsed,
      };
      syncDraft({
        ...draft,
        armModel: merged.armWidth <= 3 ? 'slim' : 'classic',
        modelCode: merged,
      });
      setNotice('Đã biên dịch & áp dụng code Model 3D trực tiếp!');
    } catch {
      setError('Cú pháp JSON trong Model Code không hợp lệ. Hãy kiểm tra dấu phẩy và dấu ngoặc kép.');
    }
  };

  const handleSaveAndClose = () => {
    onApplySkin(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mc-dark-panel w-full max-w-[900px] my-auto overflow-hidden flex flex-col max-h-[94dvh]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#1c1628] via-[#241b33] to-[#172129] border-b-2 border-black flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-[#2dd4bf]/15 border border-[#2dd4bf]/50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#5eead4]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-mc text-base sm:text-lg font-bold text-[#fde68a] mc-text-shadow truncate">
                Kho Skin &amp; Tùy Chỉnh Model 3D
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-300 truncate">
                Chọn Steve / Alex, nhập skin của bạn, nạp Model 3D (.glb) trên mạng hoặc sửa code trực tiếp
              </p>
            </div>
          </div>
          <McButton onClick={onClose} className="min-h-[38px] px-3 py-1 text-xs shrink-0">
            <X className="w-4 h-4" />
            Đóng
          </McButton>
        </div>

        {/* Main 2-column content */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-[270px_1fr] gap-4">
          {/* Left: Live 3D Character Preview Stage */}
          <div className="bg-[#100d17] border-2 border-black shadow-[inset_0_0_24px_rgba(45,212,191,0.08)] flex flex-col justify-between p-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mc font-bold text-[#fde68a] truncate">{draft.name}</span>
              <span className="font-mono-num text-[11px] text-zinc-400">
                {draft.armModel === 'slim' ? 'Alex 3px' : 'Steve 4px'}
              </span>
            </div>

            <SkinPreview3D skin={draft} walking={walkingPreview} height={265} interactive />

            <div className="text-[11px] text-center text-zinc-400 mb-2">
              Kéo chuột / vuốt để xoay nhân vật 360° · Nhấn <strong className="text-[#5eead4]">F5</strong> trong game để xem góc nhìn thứ 3
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleArmToggle('classic')}
                className={`py-1.5 text-xs font-mc font-bold border border-black cursor-pointer ${
                  draft.armModel === 'classic'
                    ? 'bg-[#2dd4bf]/25 text-[#5eead4] border-[#2dd4bf]'
                    : 'bg-[#211d2b] text-zinc-300 hover:bg-[#2c2738]'
                }`}
              >
                Tay Steve (4px)
              </button>
              <button
                type="button"
                onClick={() => handleArmToggle('slim')}
                className={`py-1.5 text-xs font-mc font-bold border border-black cursor-pointer ${
                  draft.armModel === 'slim'
                    ? 'bg-[#2dd4bf]/25 text-[#5eead4] border-[#2dd4bf]'
                    : 'bg-[#211d2b] text-zinc-300 hover:bg-[#2c2738]'
                }`}
              >
                Tay Alex (3px)
              </button>
              <button
                type="button"
                onClick={() => setWalkingPreview((w) => !w)}
                className="py-1.5 text-xs font-mc bg-[#211d2b] hover:bg-[#2c2738] text-zinc-200 border border-black cursor-pointer"
              >
                {walkingPreview ? 'Đang đi bộ' : 'Đang đứng yên'}
              </button>
              <button
                type="button"
                onClick={handleCapeToggle}
                className={`py-1.5 text-xs font-mc border border-black cursor-pointer ${
                  draft.modelCode.showCape
                    ? 'bg-rose-900/60 text-amber-200 border-amber-500/60'
                    : 'bg-[#211d2b] text-zinc-300 hover:bg-[#2c2738]'
                }`}
              >
                Áo choàng: {draft.modelCode.showCape ? 'BẬT' : 'TẮT'}
              </button>
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="flex flex-col gap-3 min-w-0">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTab('presets')}
                className={`min-h-[42px] px-2 text-xs sm:text-sm font-mc font-bold border-2 border-black cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'presets'
                    ? 'bg-[#2dd4bf]/20 text-[#5eead4] border-[#2dd4bf]'
                    : 'bg-[#231e2e] text-zinc-300 hover:bg-[#2f293d]'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Skin Mặc Định</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('import')}
                className={`min-h-[42px] px-2 text-xs sm:text-sm font-mc font-bold border-2 border-black cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'import'
                    ? 'bg-[#2dd4bf]/20 text-[#5eead4] border-[#2dd4bf]'
                    : 'bg-[#231e2e] text-zinc-300 hover:bg-[#2f293d]'
                }`}
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>Nhập Skin</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('model_code')}
                className={`min-h-[42px] px-2 text-xs sm:text-sm font-mc font-bold border-2 border-black cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'model_code'
                    ? 'bg-[#2dd4bf]/20 text-[#5eead4] border-[#2dd4bf]'
                    : 'bg-[#231e2e] text-zinc-300 hover:bg-[#2f293d]'
                }`}
              >
                <Code2 className="w-4 h-4 shrink-0" />
                <span>Model 3D &amp; Code</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-950/85 border border-red-500/70 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
            {notice && !error && (
              <div className="bg-emerald-950/80 border border-emerald-500/60 px-3 py-2 text-xs text-emerald-200">
                {notice}
              </div>
            )}

            {/* TAB 1: Built-in Steve, Alex, Netherite + Saved Custom Skins */}
            {tab === 'presets' && (
              <div className="space-y-3">
                <div className="text-xs text-zinc-300">
                  Các skin có sẵn trong trò chơi (chuẩn UV 64×64 Minecraft):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {builtinSkins.map((s) => {
                    const active = draft.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSkin(s)}
                        className={`p-3 border-2 text-left transition-colors cursor-pointer flex flex-col gap-2 ${
                          active
                            ? 'bg-[#233238] border-[#2dd4bf]'
                            : 'bg-[#171320] border-black hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.skinDataUrl}
                            alt={s.name}
                            className="w-12 h-12 border border-black bg-[#0d0b12] pixelated shrink-0 object-contain"
                          />
                          <div className="min-w-0">
                            <div className="font-mc font-bold text-sm text-white truncate">
                              {s.name}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {s.armModel === 'slim' ? 'Dáng Slim (3px)' : 'Dáng Classic (4px)'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {customLibrary.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-xs text-zinc-300 mb-2">Skin bạn đã nhập:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {customLibrary.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSkin(s)}
                          className={`p-2 border-2 text-left cursor-pointer flex items-center gap-2 ${
                            draft.id === s.id
                              ? 'bg-[#233238] border-[#2dd4bf]'
                              : 'bg-[#171320] border-black hover:border-zinc-500'
                          }`}
                        >
                          <img
                            src={s.skinDataUrl}
                            alt={s.name}
                            className="w-9 h-9 border border-black pixelated shrink-0"
                          />
                          <span className="text-xs font-mc text-white truncate">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Import Custom Skin (PNG Upload, Minecraft Username, Direct URL) */}
            {tab === 'import' && (
              <div className="space-y-3">
                <div className="bg-[#14101c] border border-white/10 p-3 space-y-2">
                  <div className="text-xs font-mc font-bold text-[#fde68a]">
                    Cách 1 · Tải tệp Skin Minecraft (.png 64×64 hoặc 64×32) từ máy
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Đặt tên skin (tùy chọn)..."
                      className="flex-1 bg-black border-2 border-[#444] focus:border-[#2dd4bf] outline-none px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      ref={skinFileRef}
                      type="file"
                      accept="image/png"
                      onChange={handleUploadSkinFile}
                      className="hidden"
                    />
                    <McButton
                      variant="primary"
                      disabled={loading}
                      onClick={() => skinFileRef.current?.click()}
                      className="shrink-0 text-xs"
                    >
                      <Upload className="w-4 h-4" />
                      Chọn file .PNG
                    </McButton>
                  </div>
                </div>

                <div className="bg-[#14101c] border border-white/10 p-3 space-y-2">
                  <div className="text-xs font-mc font-bold text-[#fde68a]">
                    Cách 2 · Lấy Skin trực tiếp từ tên tài khoản Minecraft Java
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Ví dụ: Notch, Dream, Technoblade..."
                      className="flex-1 bg-black border-2 border-[#444] focus:border-[#2dd4bf] outline-none px-2.5 py-1.5 text-xs font-mono-num text-white"
                    />
                    <McButton
                      disabled={loading || !usernameInput.trim()}
                      onClick={handleFetchUsername}
                      className="shrink-0 text-xs"
                    >
                      <User className="w-4 h-4" />
                      Lấy Skin
                    </McButton>
                  </div>
                </div>

                <div className="bg-[#14101c] border border-white/10 p-3 space-y-2">
                  <div className="text-xs font-mc font-bold text-[#fde68a]">
                    Cách 3 · Dán đường dẫn ảnh Skin (.png) từ GitHub Raw / Web
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={skinUrlInput}
                      onChange={(e) => setSkinUrlInput(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/.../my-skin.png"
                      className="flex-1 bg-black border-2 border-[#444] focus:border-[#2dd4bf] outline-none px-2.5 py-1.5 text-xs font-mono-num text-white"
                    />
                    <McButton
                      disabled={loading || !skinUrlInput.trim()}
                      onClick={handleFetchSkinUrl}
                      className="shrink-0 text-xs"
                    >
                      <Globe className="w-4 h-4" />
                      Tải URL
                    </McButton>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: External Online 3D Model (.glb/.gltf) + Editable Model Code */}
            {tab === 'model_code' && (
              <div className="space-y-3">
                <div className="bg-[#14101c] border border-white/10 p-3 space-y-2">
                  <div className="text-xs font-mc font-bold text-[#fde68a] flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-[#5eead4]" />
                    Nạp Model 3D từ mạng (.glb / .gltf URL) hoặc tải tệp từ máy
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={glbUrlInput}
                      onChange={(e) => setGlbUrlInput(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/.../player.glb (để trống dùng Model Minecraft)"
                      className="flex-1 bg-black border-2 border-[#444] focus:border-[#2dd4bf] outline-none px-2.5 py-1.5 text-xs font-mono-num text-white"
                    />
                    <McButton onClick={handleApplyGlbUrl} className="text-xs shrink-0">
                      Nạp URL
                    </McButton>
                    <input
                      ref={glbFileRef}
                      type="file"
                      accept=".glb,.gltf"
                      onChange={handleGlbFileUpload}
                      className="hidden"
                    />
                    <McButton onClick={() => glbFileRef.current?.click()} className="text-xs shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      .GLB
                    </McButton>
                  </div>
                </div>

                <div className="bg-[#14101c] border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mc font-bold text-[#fde68a]">
                      Chỉnh Code Cấu Hình Model 3D Trực Tiếp (JSON)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const reset: PlayerModelCode = {
                          ...DEFAULT_MODEL_CODE,
                          armWidth: draft.armModel === 'slim' ? 3 : 4,
                        };
                        syncDraft({ ...draft, modelCode: reset });
                      }}
                      className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Mặc định
                    </button>
                  </div>
                  <textarea
                    value={codeText}
                    onChange={(e) => setCodeText(e.target.value)}
                    rows={8}
                    spellCheck={false}
                    className="w-full bg-[#09080d] border-2 border-[#3f3a4f] focus:border-[#2dd4bf] outline-none p-2.5 text-xs font-mono-num text-[#a7f3d0] leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <McButton variant="primary" onClick={handleApplyModelCode} className="text-xs min-h-[38px]">
                      <Code2 className="w-4 h-4" />
                      Biên Dịch &amp; Xem Trước Model Code
                    </McButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t-2 border-black bg-[#14101d] flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 hidden sm:block">
            Skin và Model 3D được lưu tự động và hiển thị ở cả góc nhìn thứ 1 (tay) lẫn góc nhìn thứ 3 (F5).
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <McButton onClick={onClose}>Hủy</McButton>
            <McButton variant="primary" onClick={handleSaveAndClose}>
              <Check className="w-4 h-4" />
              Lưu &amp; Dùng Skin Này
            </McButton>
          </div>
        </div>
      </div>
    </div>
  );
};
