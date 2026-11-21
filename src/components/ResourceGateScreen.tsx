import React, { useRef, useState } from 'react';
import { Download, FolderArchive, Globe, RefreshCw, ShieldCheck, Trash2, ArrowLeft } from 'lucide-react';
import {
  buildHd32DefaultPack,
  CompiledResourcePack,
  DownloadProgress,
  downloadCustomGithubRawPack,
  importZipResourcePack,
} from '../game/resourcePack';
import { clearResourcePackCache, loadActiveResourcePack } from '../game/storage';
import { CachedResourcePack, TexturePreset } from '../game/types';
import { buildFaithfulHdPlusPack } from '../game/vanillaTextures';
import { McButton, McTitleLogo } from './McSprites';

interface ResourceGateScreenProps {
  compiledPack: CompiledResourcePack | null;
  mode: 'gate' | 'manager';
  texturePreset: TexturePreset;
  onSelectPreset: (preset: TexturePreset) => Promise<void>;
  onPackReady: (cached: CachedResourcePack) => Promise<void>;
  onProceedToTitle: () => void;
  onBack?: () => void;
  onPackCleared: () => void;
}

function formatKB(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export const ResourceGateScreen: React.FC<ResourceGateScreenProps> = ({
  compiledPack,
  mode,
  texturePreset,
  onSelectPreset,
  onPackReady,
  onProceedToTitle,
  onBack,
  onPackCleared,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [sourceTab, setSourceTab] = useState<'default' | 'github' | 'zip'>('default');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadDefault = async () => {
    setError(null);
    setNotice(null);
    setDownloading(true);
    try {
      const existing = await loadActiveResourcePack();
      const cached = await buildFaithfulHdPlusPack(existing?.guiBlobs);
      await onPackReady(cached);
      setNotice('Đã nạp thành công gói chính thức HD+ Faithful 32x (Block + Vật phẩm)!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi nạp gói HD+ Faithful 32x.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSwitchPreset = async (preset: TexturePreset) => {
    setError(null);
    setNotice(null);
    setDownloading(true);
    try {
      await onSelectPreset(preset);
      setNotice(
        preset === 'hd_plus'
          ? 'Đã áp dụng HD+ Faithful 32x (Block + Vật phẩm + Thuốc + UI)!'
          : preset === 'original'
            ? 'Đã chuyển sang Minecraft 26.3 Chính Gốc (Block + Vật phẩm)!'
            : 'Đã chuyển sang 32×32 Offline (Nhẹ)!',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể chuyển bộ texture.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadGithubRaw = async () => {
    if (!githubUrl.trim()) {
      setError('Vui lòng nhập đường dẫn GitHub Raw tới thư mục textures (hoặc thư mục gốc kho chứa assets/minecraft/textures/).');
      return;
    }
    setError(null);
    setNotice(null);
    setDownloading(true);
    try {
      const existing = await loadActiveResourcePack();
      const res = await downloadCustomGithubRawPack(githubUrl, existing, (p) => setProgress({ ...p }));
      await onPackReady(res.pack);
      setNotice(`Đã nạp thành công ${res.replacedBlocks} ảnh Block và ${res.replacedGui} tệp giao diện UI từ GitHub!`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải gói tài nguyên từ URL GitHub.');
    } finally {
      setDownloading(false);
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    setDownloading(true);
    try {
      const existing = await loadActiveResourcePack();
      const res = await importZipResourcePack(file, existing, (p) => setProgress({ ...p }));
      await onPackReady(res.pack);
      setNotice(`Đã giải nén & áp dụng ${res.replacedBlocks} ảnh Block và ${res.replacedGui} tệp UI từ ${file.name}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đọc tệp .zip Resource Pack.');
    } finally {
      setDownloading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClearCache = async () => {
    await clearResourcePackCache();
    onPackCleared();
    setNotice('Đã xóa bộ nhớ đệm tài nguyên. Cần tải lại gói 26.3 trước khi chơi.');
  };

  const pct =
    progress && progress.totalFiles > 0
      ? Math.min(100, Math.round((progress.loadedFiles / progress.totalFiles) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-30 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/65 overflow-y-auto">
      <div className="w-full max-w-[720px] my-auto flex flex-col items-center gap-5">
        {mode === 'gate' && <McTitleLogo splashText="Minecraft 26.3 · Mới Nhất!" />}

        <div className="mc-dark-panel w-full p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 mb-4">
            <div>
              <h2 className="font-mc text-lg sm:text-xl font-bold text-[#fde68a] mc-text-shadow">
                {mode === 'gate'
                  ? 'Chọn Gói Texture & Tài Nguyên 26.3'
                  : 'Quản Lý Texture & Resource Pack 26.3'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                Chuyển nhanh giữa 2 dạng Texture 26.3 có sẵn hoặc nạp Resource Pack từ GitHub / tệp .ZIP.
              </p>
            </div>
            {mode === 'manager' && onBack && (
              <McButton widgetsUrl={compiledPack?.guiUrls.widgets} onClick={onBack} className="shrink-0">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </McButton>
            )}
          </div>

          {/* Source selector tabs */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSourceTab('default')}
              className={`min-h-[42px] px-2 py-2 text-xs sm:text-sm font-mc font-bold border-2 border-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                sourceTab === 'default'
                  ? 'bg-[#2dd4bf]/20 text-[#5eead4] border-[#2dd4bf]'
                  : 'bg-[#262230] text-zinc-300 hover:bg-[#312c3e]'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">HD+ &amp; Chính Gốc</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceTab('github')}
              className={`min-h-[42px] px-2 py-2 text-xs sm:text-sm font-mc font-bold border-2 border-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                sourceTab === 'github'
                  ? 'bg-[#2dd4bf]/20 text-[#5eead4] border-[#2dd4bf]'
                  : 'bg-[#262230] text-zinc-300 hover:bg-[#312c3e]'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span className="truncate">Link GitHub Raw</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceTab('zip')}
              className={`min-h-[42px] px-2 py-2 text-xs sm:text-sm font-mc font-bold border-2 border-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                sourceTab === 'zip'
                  ? 'bg-[#2dd4bf]/20 text-[#5eead4] border-[#2dd4bf]'
                  : 'bg-[#262230] text-zinc-300 hover:bg-[#312c3e]'
              }`}
            >
              <FolderArchive className="w-4 h-4 shrink-0" />
              <span className="truncate">File .ZIP</span>
            </button>
          </div>

          {/* Tab contents: Official HD+ Faithful 32x + Original 26.3 + Offline 32x */}
          {sourceTab === 'default' && (
            <div className="space-y-3 mb-4">
              {/* Featured Official HD+ Section */}
              <div
                className={`p-3.5 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  texturePreset === 'hd_plus'
                    ? 'bg-[#1a292b] border-[#fde047]'
                    : 'bg-[#15121c] border-amber-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mc font-bold px-1.5 py-0.5 bg-[#eab308] text-black">
                      HD+ · CHÍNH THỨC
                    </span>
                    <span className="text-sm font-mc font-bold text-[#fde68a]">
                      Faithful 32x (Minecraft 26.3 HD+)
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 mt-1">
                    Gói chính thức 32×32 sắc nét bản mới nhất cho cả <strong>Block, Vật phẩm, Vũ khí, Giáp, Thuốc &amp; UI</strong>, tối ưu màu biome và lưu cache đổi tức thì.
                  </div>
                </div>
                <McButton
                  variant={texturePreset === 'hd_plus' ? 'primary' : 'stone'}
                  disabled={downloading}
                  onClick={() =>
                    compiledPack ? handleSwitchPreset('hd_plus') : handleDownloadDefault()
                  }
                  className="shrink-0 sm:min-w-[165px] text-xs"
                  widgetsUrl={compiledPack?.guiUrls.widgets}
                >
                  {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {texturePreset === 'hd_plus' && compiledPack ? 'Đang dùng HD+' : 'Dùng HD+ (32x)'}
                </McButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3 border-2 flex flex-col justify-between gap-2.5 ${
                    texturePreset === 'original'
                      ? 'bg-[#1a292b] border-[#2dd4bf]'
                      : 'bg-[#110f16] border-white/10'
                  }`}
                >
                  <div>
                    <div className="text-sm font-mc font-bold text-[#5eead4]">
                      Chính Gốc (Minecraft 26.3)
                    </div>
                    <div className="text-xs text-zinc-300 mt-1">
                      Bộ texture 16×16 gốc thật của Minecraft Java 26.3 mới nhất (đủ cả Block, Vật phẩm, Mob &amp; Thuốc).
                    </div>
                  </div>
                  <McButton
                    variant={texturePreset === 'original' ? 'primary' : 'stone'}
                    disabled={downloading}
                    onClick={() => handleSwitchPreset('original')}
                    className="w-full text-xs"
                    widgetsUrl={compiledPack?.guiUrls.widgets}
                  >
                    {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {texturePreset === 'original' && compiledPack ? 'Đang dùng' : 'Dùng Chính Gốc'}
                  </McButton>
                </div>

                <div
                  className={`p-3 border-2 flex flex-col justify-between gap-2.5 ${
                    texturePreset === 'current'
                      ? 'bg-[#1a292b] border-[#2dd4bf]'
                      : 'bg-[#110f16] border-white/10'
                  }`}
                >
                  <div>
                    <div className="text-sm font-mc font-bold text-zinc-100">
                      32×32 Offline (Nhẹ)
                    </div>
                    <div className="text-xs text-zinc-300 mt-1">
                      Gói 32×32 tích hợp sẵn trong app, chạy không cần tải mạng.
                    </div>
                  </div>
                  <McButton
                    variant={texturePreset === 'current' ? 'primary' : 'stone'}
                    disabled={downloading}
                    onClick={async () => {
                      if (compiledPack) {
                        await handleSwitchPreset('current');
                      } else {
                        setDownloading(true);
                        try {
                          const existing = await loadActiveResourcePack();
                          const cached = await buildHd32DefaultPack(existing?.guiBlobs);
                          await onPackReady(cached);
                        } finally {
                          setDownloading(false);
                        }
                      }
                    }}
                    className="w-full text-xs"
                    widgetsUrl={compiledPack?.guiUrls.widgets}
                  >
                    {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {texturePreset === 'current' && compiledPack ? 'Đang dùng' : 'Dùng 32×32 Offline'}
                  </McButton>
                </div>
              </div>
            </div>
          )}

          {sourceTab === 'github' && (
            <div className="bg-[#110f16] border border-white/10 p-3.5 mb-4 space-y-2.5">
              <div className="text-xs text-zinc-300">
                Dán URL kho GitHub hoặc link <span className="font-mono-num text-[#5eead4]">raw.githubusercontent.com</span> chứa cấu trúc chuẩn <span className="font-mono-num text-amber-300">assets/minecraft/textures/</span>. Game sẽ tải cả ảnh Block lẫn giao diện UI (`widgets.png`, `icons.png`, `options_background.png`).
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/user/pack-1.16/main/assets/minecraft/textures/"
                  className="flex-1 bg-black border-2 border-[#555] focus:border-[#2dd4bf] outline-none px-3 py-2 text-xs sm:text-sm font-mono-num text-white"
                />
                <McButton
                  variant="primary"
                  widgetsUrl={compiledPack?.guiUrls.widgets}
                  disabled={downloading}
                  onClick={handleDownloadGithubRaw}
                  className="shrink-0"
                >
                  <Globe className="w-4 h-4" />
                  Tải từ GitHub
                </McButton>
              </div>
            </div>
          )}

          {sourceTab === 'zip' && (
            <div className="bg-[#110f16] border border-white/10 p-3.5 mb-4 space-y-2.5">
              <div className="text-xs text-zinc-300">
                Chọn trực tiếp tệp <span className="font-mono-num text-amber-300">.zip</span> Resource Pack Minecraft Java 26.3 từ máy tính hoặc điện thoại. Trình duyệt tự giải nén 100% cục bộ, trích xuất cả ảnh khối lẫn giao diện UI và lưu vào IndexedDB.
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".zip,application/zip"
                onChange={handleZipUpload}
                className="hidden"
              />
              <McButton
                variant="primary"
                widgetsUrl={compiledPack?.guiUrls.widgets}
                disabled={downloading}
                onClick={() => fileRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <FolderArchive className="w-4 h-4" />
                Chọn tệp .zip Resource Pack
              </McButton>
            </div>
          )}

          {/* Download Progress Bar */}
          {downloading && progress && (
            <div className="mb-4 bg-black/70 border border-white/15 p-3">
              <div className="flex items-center justify-between text-xs font-mono-num text-zinc-200 mb-1.5">
                <span className="truncate">
                  Đang tải: {progress.currentFile} ({progress.loadedFiles}/{progress.totalFiles})
                </span>
                <span className="shrink-0 ml-2 text-[#5eead4]">
                  {pct}% · {formatKB(progress.loadedBytes)}
                </span>
              </div>
              <div className="w-full h-3 bg-[#1f1f24] border border-black overflow-hidden">
                <div
                  className="h-full bg-[#4ade80] transition-transform duration-100 origin-left"
                  style={{ transform: `scaleX(${Math.max(0.03, pct / 100)})` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-950/80 border border-red-500/60 px-3 py-2 text-xs sm:text-sm text-red-200">
              {error}
            </div>
          )}

          {notice && !error && (
            <div className="mb-4 bg-emerald-950/75 border border-emerald-500/50 px-3 py-2 text-xs sm:text-sm text-emerald-200">
              {notice}
            </div>
          )}

          {/* Verified Pack Status & Block Preview Strip */}
          {compiledPack ? (
            <div className="bg-[#110f16] border border-emerald-500/35 p-3.5 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{compiledPack.meta.name}</span>
                </div>
                <div className="text-xs font-mono-num text-zinc-400">
                  {compiledPack.meta.blockCount} block · {compiledPack.meta.guiCount} UI · {formatKB(compiledPack.meta.totalBytes)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {compiledPack.previewTiles.map((tile) => (
                  <img
                    key={tile.key}
                    src={tile.url}
                    alt={tile.key}
                    title={tile.key}
                    className="w-8 h-8 border border-black pixelated shrink-0 bg-zinc-900"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#110f16] border border-amber-500/35 p-3 mb-4 text-xs sm:text-sm text-amber-200">
              Chưa có gói tài nguyên 26.3 trong bộ nhớ trình duyệt. Hãy bấm <strong>Dùng HD+ (32x)</strong> để mở khóa trò chơi.
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {compiledPack ? (
              <McButton
                variant="crimson"
                widgetsUrl={compiledPack.guiUrls.widgets}
                disabled={downloading}
                onClick={handleClearCache}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Xóa cache tài nguyên
              </McButton>
            ) : (
              <div className="text-xs text-zinc-400 font-mono-num">
                Hỗ trợ PC & Điện thoại · Chạy 100% tĩnh
              </div>
            )}

            <McButton
              variant="primary"
              widgetsUrl={compiledPack?.guiUrls.widgets}
              disabled={!compiledPack || downloading}
              onClick={onProceedToTitle}
              className="flex-1 sm:flex-none min-w-[210px]"
            >
              {mode === 'gate' ? 'Vào Màn Hình Chính' : 'Áp Dụng & Quay Lại'}
            </McButton>
          </div>
        </div>
      </div>
    </div>
  );
};
