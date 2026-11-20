/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ContainerModal } from './components/ContainerModal';
import { HudOverlay } from './components/HudOverlay';
import { MobileTouchControls } from './components/MobileTouchControls';
import {
  DeathModal,
  PauseModal,
  VideoOptionsModal,
} from './components/OptionsAndPauseModal';
import { ResourceGateScreen } from './components/ResourceGateScreen';
import { SkinManagerModal } from './components/SkinManagerModal';
import { TitleAndWorlds } from './components/TitleAndWorlds';
import { NetherCraftEngine } from './game/engine';
import { loadSavedSkinConfig, saveSkinConfig } from './game/playerSkin';
import {
  CompiledResourcePack,
  DownloadProgress,
  compileResourcePack,
  downloadDefaultGithubPack,
} from './game/resourcePack';
import {
  createNewWorldRecord,
  exportWorldToFile,
  listWorlds,
  loadActiveResourcePack,
  loadVideoSettings,
  saveVideoSettings,
  saveWorld,
} from './game/storage';
import {
  CachedResourcePack,
  ChatMessage,
  ContainerType,
  HudSnapshot,
  PlayerSkinConfig,
  TexturePreset,
  TitleBanner,
  VideoSettings,
  WorldSave,
} from './game/types';
import { buildOriginalMinecraftPack } from './game/vanillaTextures';

type AppScreen =
  | 'boot'
  | 'gate'
  | 'title'
  | 'worlds'
  | 'create_world'
  | 'resource_manager'
  | 'options'
  | 'playing';

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NetherCraftEngine | null>(null);
  const compiledPackRef = useRef<CompiledResourcePack | null>(null);

  const [screen, setScreen] = useState<AppScreen>('boot');
  const [bootStatus, setBootStatus] = useState('Đang khởi động NetherCraft 1.16...');
  const [bootProgress, setBootProgress] = useState<DownloadProgress | null>(null);
  const [returnScreen, setReturnScreen] = useState<AppScreen>('title');
  const [compiledPack, setCompiledPack] = useState<CompiledResourcePack | null>(null);
  const [settings, setSettings] = useState<VideoSettings>(() => loadVideoSettings());
  const [playerSkin, setPlayerSkin] = useState<PlayerSkinConfig>(() => loadSavedSkinConfig());
  const [skinModalOpen, setSkinModalOpen] = useState(false);
  const [worlds, setWorlds] = useState<WorldSave[]>([]);
  const [activeWorldName, setActiveWorldName] = useState('');

  // In-game live states
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const [inGameModal, setInGameModal] = useState<'none' | 'options' | 'resources'>('none');
  const [containerType, setContainerType] = useState<ContainerType>('none');
  const [showF3, setShowF3] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitial, setChatInitial] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [titleBanner, setTitleBanner] = useState<TitleBanner | null>(null);

  // Refs for stable engine callbacks
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const containerRef = useRef(containerType);
  containerRef.current = containerType;
  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;
  const inGameModalRef = useRef(inGameModal);
  inGameModalRef.current = inGameModal;

  const [hasTouchCapable, setHasTouchCapable] = useState(() => isTouchDevice());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onResize = () => setHasTouchCapable(isTouchDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };

    try {
      const currentlyFull = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      if (currentlyFull) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } else {
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        }
      }
    } catch {
      // Ignore browser-restricted fullscreen rejections
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F11') {
        e.preventDefault();
        void handleToggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleFullscreen]);

  const touchVisible =
    settings.touchMode === 'on' || (settings.touchMode === 'auto' && hasTouchCapable);

  const refreshWorlds = useCallback(async () => {
    const list = await listWorlds();
    setWorlds(list);
  }, []);

  const applyCompiledPack = useCallback(async (cached: CachedResourcePack) => {
    const nextCompiled = await compileResourcePack(cached);
    const prevPack = compiledPackRef.current;
    compiledPackRef.current = nextCompiled;
    engineRef.current?.setResourcePack(nextCompiled);
    setCompiledPack(nextCompiled);
    if (prevPack) {
      setTimeout(() => prevPack.dispose(), 250);
    }
  }, []);

  const handleLaunchWorld = useCallback((world: WorldSave, requestLock = true) => {
    setActiveWorldName(world.name);
    setChatMessages([]);
    setContainerType('none');
    setPaused(false);
    setInGameModal('none');
    setChatOpen(false);
    setScreen('playing');
    engineRef.current?.loadWorld(world);
    if (requestLock && !isTouchDevice()) {
      setTimeout(() => engineRef.current?.requestPointerLock(), 80);
    }
  }, []);

  // Mount isolated 3D WebGL engine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new NetherCraftEngine(canvasMountRef.current, settings, {
      onHudUpdate: (snap) => {
        setHud(snap);
      },
      onChatMessage: (text, tone) => {
        setChatMessages((prev) => [
          ...prev.slice(-29),
          {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            text,
            tone,
            timestamp: Date.now(),
          },
        ]);
      },
      onTitleBanner: (kind, text) => {
        setTitleBanner((prev) => ({
          title: kind === 'title' ? text : prev?.title || '',
          subtitle: kind === 'subtitle' ? text : prev?.subtitle || '',
          actionbar: kind === 'actionbar' ? text : prev?.actionbar || '',
          expiresAt: Date.now() + 4500,
        }));
      },
      onOpenContainer: (type) => {
        if (screenRef.current !== 'playing' || pausedRef.current || chatOpenRef.current) return;
        setContainerType(type);
        engineRef.current?.setPaused(true);
      },
      onPauseRequest: () => {
        if (screenRef.current !== 'playing') return;
        if (chatOpenRef.current) {
          setChatOpen(false);
          engineRef.current?.setPaused(false);
          return;
        }
        if (containerRef.current !== 'none') {
          setContainerType('none');
          engineRef.current?.setPaused(false);
          return;
        }
        if (inGameModalRef.current !== 'none') {
          setInGameModal('none');
          return;
        }
        const nextPaused = !pausedRef.current;
        setPaused(nextPaused);
        engineRef.current?.setPaused(nextPaused);
      },
      onToggleF3: () => {
        setShowF3((prev) => !prev);
      },
      onOpenChat: (prefill = '') => {
        if (screenRef.current !== 'playing' || pausedRef.current || containerRef.current !== 'none') {
          return;
        }
        setChatInitial(prefill);
        setChatOpen(true);
        engineRef.current?.setPaused(true);
      },
    });

    engineRef.current = engine;
    if (compiledPackRef.current) {
      engine.setResourcePack(compiledPackRef.current);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // Intentionally mounted once for stable WebGL lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zero-click automatic boot: auto-download 1.16 Resource Pack if needed, then auto-launch directly into world
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setBootStatus('Đang kiểm tra gói tài nguyên 1.16...');
        let [cachedPack, savedWorlds] = await Promise.all([
          loadActiveResourcePack(),
          listWorlds(),
        ]);
        if (!alive) return;

        if (!cachedPack) {
          setBootStatus('Đang tự động tải gói tài nguyên Block & UI 1.16...');
          cachedPack = await downloadDefaultGithubPack((p) => {
            if (alive) setBootProgress({ ...p });
          });
          if (!alive) return;
        }

        setBootStatus('Đang biên dịch Texture Atlas 16×16 & giao diện 1.16...');
        await applyCompiledPack(cachedPack);
        if (!alive) return;

        const detectedPreset: TexturePreset =
          cachedPack.sourceType === 'original-classic' ? 'original' : 'current';
        setSettings((prev) => {
          if (prev.texturePreset === detectedPreset) return prev;
          const synced = { ...prev, texturePreset: detectedPreset };
          saveVideoSettings(synced);
          return synced;
        });

        let targetWorld = savedWorlds[0];
        if (!targetWorld) {
          setBootStatus('Đang khởi tạo thế giới NetherCraft 1.16...');
          targetWorld = createNewWorldRecord({
            name: 'Thế Giới Nether 1.16',
            gameMode: 'survival',
            cheatsEnabled: true,
          });
          await saveWorld(targetWorld);
          savedWorlds = [targetWorld];
        }
        if (!alive) return;

        setWorlds(savedWorlds);
        // Launch straight into playable 3D world (without forcing pointer lock outside user gesture)
        handleLaunchWorld(targetWorld, false);
      } catch {
        if (alive) setScreen('gate');
      }
    })();

    return () => {
      alive = false;
    };
  }, [applyCompiledPack, handleLaunchWorld]);

  const handleSettingsChange = useCallback((next: VideoSettings) => {
    setSettings(next);
    saveVideoSettings(next);
    engineRef.current?.updateSettings(next);
  }, []);

  const handleApplySkin = useCallback((nextSkin: PlayerSkinConfig) => {
    setPlayerSkin(nextSkin);
    saveSkinConfig(nextSkin);
    engineRef.current?.setPlayerSkin(nextSkin);
  }, []);

  const handleOpenSkinModal = useCallback(() => {
    if (screenRef.current === 'playing') {
      engineRef.current?.setPaused(true);
    }
    setSkinModalOpen(true);
  }, []);

  const handleCloseSkinModal = useCallback(() => {
    setSkinModalOpen(false);
    if (screenRef.current === 'playing' && !pausedRef.current && containerRef.current === 'none') {
      engineRef.current?.setPaused(false);
    }
  }, []);

  const handleSwitchTexturePreset = useCallback(
    async (preset: TexturePreset) => {
      const existing = await loadActiveResourcePack();
      let nextCached: CachedResourcePack;
      if (preset === 'original') {
        nextCached = await buildOriginalMinecraftPack(existing?.guiBlobs);
      } else {
        nextCached = await downloadDefaultGithubPack();
      }
      await applyCompiledPack(nextCached);
      setSettings((prev) => {
        const next = { ...prev, texturePreset: preset };
        saveVideoSettings(next);
        engineRef.current?.updateSettings(next);
        return next;
      });
    },
    [applyCompiledPack],
  );

  const handleSaveAndQuit = useCallback(async () => {
    engineRef.current?.enterPanoramaMode();
    setPaused(false);
    setContainerType('none');
    setInGameModal('none');
    setChatOpen(false);
    await refreshWorlds();
    setScreen('title');
  }, [refreshWorlds]);

  const handleCloseContainer = useCallback(() => {
    setContainerType('none');
    engineRef.current?.setPaused(false);
  }, []);

  const handleResumeGame = useCallback(() => {
    setPaused(false);
    setInGameModal('none');
    engineRef.current?.setPaused(false);
    if (!touchVisible) {
      engineRef.current?.requestPointerLock();
    }
  }, [touchVisible]);

  const handleExportCurrentWorld = useCallback(() => {
    const snap = engineRef.current?.getWorldSnapshot();
    if (snap) exportWorldToFile(snap);
  }, []);

  const handlePackCleared = useCallback(() => {
    if (compiledPackRef.current) {
      compiledPackRef.current.dispose();
      compiledPackRef.current = null;
    }
    setCompiledPack(null);
    if (screenRef.current === 'playing') {
      engineRef.current?.enterPanoramaMode();
    }
    setPaused(false);
    setInGameModal('none');
    setScreen('gate');
  }, []);

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#120e17] select-none">
      {/* Permanent Isolated WebGL Canvas Mount */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {/* Automatic Boot & Resource Pack Download Splash */}
      {screen === 'boot' && (
        <div className="fixed inset-0 z-40 bg-[#141019]/92 flex flex-col items-center justify-center px-6 gap-4 text-white">
          <div className="font-mc text-2xl sm:text-3xl font-bold text-[#fde68a] mc-text-shadow tracking-wider">
            NETHERCRAFT 1.16.5
          </div>
          <div className="w-full max-w-[380px] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-num text-zinc-200">
              <span className="truncate">{bootStatus}</span>
              {bootProgress && bootProgress.totalFiles > 0 && (
                <span className="shrink-0 ml-2 text-[#5eead4]">
                  {Math.min(100, Math.round((bootProgress.loadedFiles / bootProgress.totalFiles) * 100))}%
                </span>
              )}
            </div>
            <div className="w-full h-3.5 bg-[#1f1f24] border-2 border-black overflow-hidden">
              <div
                className="h-full bg-[#4ade80] transition-transform duration-100 origin-left"
                style={{
                  transform: `scaleX(${
                    bootProgress && bootProgress.totalFiles > 0
                      ? Math.max(0.08, bootProgress.loadedFiles / bootProgress.totalFiles)
                      : 0.35
                  })`,
                }}
              />
            </div>
            {bootProgress?.currentFile && (
              <div className="text-[11px] font-mono-num text-zinc-400 text-center truncate">
                {bootProgress.currentFile} ({bootProgress.loadedFiles}/{bootProgress.totalFiles})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory 1.16 Resource Pack Gate / Manager */}
      {(screen === 'gate' || screen === 'resource_manager') && (
        <ResourceGateScreen
          compiledPack={compiledPack}
          mode={screen === 'gate' ? 'gate' : 'manager'}
          texturePreset={settings.texturePreset}
          onSelectPreset={handleSwitchTexturePreset}
          onPackReady={applyCompiledPack}
          onProceedToTitle={() => {
            if (compiledPack) {
              setScreen(screen === 'resource_manager' ? returnScreen : 'title');
            }
          }}
          onBack={
            screen === 'resource_manager' && compiledPack
              ? () => setScreen(returnScreen)
              : undefined
          }
          onPackCleared={handlePackCleared}
        />
      )}

      {/* Title Screen, Worlds, Create World */}
      {compiledPack &&
        (screen === 'title' ||
          screen === 'worlds' ||
          screen === 'create_world') && (
          <TitleAndWorlds
            pack={compiledPack}
            worlds={worlds}
            screen={screen}
            onNavigate={(next) => {
              if (next === 'resource_manager' || next === 'options') {
                setReturnScreen(screen);
              }
              setScreen(next);
            }}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onLaunchWorld={handleLaunchWorld}
            onRefreshWorlds={refreshWorlds}
          />
        )}

      {/* Video Options (from Title Screen — Skin & F3 inside Settings) */}
      {screen === 'options' && (
        <VideoOptionsModal
          settings={settings}
          pack={compiledPack}
          inGame={false}
          isFullscreen={isFullscreen}
          showF3={showF3}
          onToggleF3={() => setShowF3((prev) => !prev)}
          onOpenSkin={handleOpenSkinModal}
          onToggleFullscreen={handleToggleFullscreen}
          onChange={handleSettingsChange}
          onSwitchTexturePreset={handleSwitchTexturePreset}
          onClose={() => setScreen(returnScreen)}
        />
      )}

      {/* --- ACTIVE GAMEPLAY OVERLAYS --- */}
      {screen === 'playing' && hud && compiledPack && (
        <>
          <HudOverlay
            hud={hud}
            pack={compiledPack}
            showF3={showF3}
            chatOpen={chatOpen}
            chatInitial={chatInitial}
            chatMessages={chatMessages}
            titleBanner={titleBanner}
            guiScale={settings.guiScale}
            touchVisible={touchVisible}
            isFullscreen={isFullscreen}
            onSelectSlot={(idx) => engineRef.current?.selectHotbarSlot(idx)}
            onSubmitChat={(text) => engineRef.current?.runCommand(text)}
            onCloseChat={() => {
              setChatOpen(false);
              engineRef.current?.setPaused(false);
            }}
            onRequestLock={() => engineRef.current?.requestPointerLock()}
            onOpenInventory={() => {
              setContainerType('inventory');
              engineRef.current?.setPaused(true);
            }}
            onCycleCamera={() => engineRef.current?.cycleCameraMode()}
            onToggleFullscreen={handleToggleFullscreen}
            onOpenPause={() => {
              setPaused(true);
              engineRef.current?.setPaused(true);
            }}
          />

          {/* Mobile Multi-Touch Controls */}
          {touchVisible &&
            !paused &&
            !chatOpen &&
            !skinModalOpen &&
            containerType === 'none' &&
            !hud.dead && (
              <MobileTouchControls
                flying={hud.flying}
                sneaking={hud.sneaking}
                isFullscreen={isFullscreen}
                onMove={(x, z) => engineRef.current?.setTouchMovement(x, z)}
                onLookDelta={(dx, dy) => engineRef.current?.addTouchLookDelta(dx, dy)}
                onJump={(active) => engineRef.current?.setTouchJump(active)}
                onSneakToggle={() => engineRef.current?.setTouchSneak(!hud.sneaking)}
                onBreak={(active) => engineRef.current?.setTouchBreak(active)}
                onUse={() => engineRef.current?.triggerTouchUseOrPlace()}
                onOpenChat={() => {
                  setChatInitial('/');
                  setChatOpen(true);
                  engineRef.current?.setPaused(true);
                }}
                onCycleCamera={() => engineRef.current?.cycleCameraMode()}
                onToggleFullscreen={handleToggleFullscreen}
                onPause={() => {
                  setPaused(true);
                  engineRef.current?.setPaused(true);
                }}
              />
            )}

          {/* Inventory / Crafting Table / Furnace / 1.16 Smithing Table */}
          {containerType !== 'none' && !hud.dead && (
            <ContainerModal
              type={containerType}
              gameMode={hud.gameMode}
              inventory={hud.inventory}
              armor={hud.armor}
              furnace={hud.furnace}
              pack={compiledPack}
              playerSkin={playerSkin}
              onUpdateInventory={(inv, arm, furn) =>
                engineRef.current?.applyInventoryUpdate(inv, arm, furn)
              }
              onClose={handleCloseContainer}
            />
          )}

          {/* Pause Menu */}
          {paused &&
            inGameModal === 'none' &&
            !skinModalOpen &&
            containerType === 'none' &&
            !chatOpen &&
            !hud.dead && (
              <PauseModal
                worldName={activeWorldName}
                pack={compiledPack}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                onResume={handleResumeGame}
                onOpenOptions={() => setInGameModal('options')}
                onOpenResourcePack={() => setInGameModal('resources')}
                onExportWorld={handleExportCurrentWorld}
                onSaveAndQuit={handleSaveAndQuit}
              />
            )}

          {/* In-Game Video Settings (Skin & F3 inside Settings) */}
          {paused && inGameModal === 'options' && (
            <VideoOptionsModal
              settings={settings}
              pack={compiledPack}
              inGame
              isFullscreen={isFullscreen}
              showF3={showF3}
              onToggleF3={() => setShowF3((prev) => !prev)}
              onOpenSkin={handleOpenSkinModal}
              onToggleFullscreen={handleToggleFullscreen}
              onChange={handleSettingsChange}
              onSwitchTexturePreset={handleSwitchTexturePreset}
              onClose={() => setInGameModal('none')}
            />
          )}

          {/* In-Game Resource Pack Manager */}
          {paused && inGameModal === 'resources' && (
            <ResourceGateScreen
              compiledPack={compiledPack}
              mode="manager"
              texturePreset={settings.texturePreset}
              onSelectPreset={handleSwitchTexturePreset}
              onPackReady={applyCompiledPack}
              onProceedToTitle={() => setInGameModal('none')}
              onBack={() => setInGameModal('none')}
              onPackCleared={handlePackCleared}
            />
          )}

          {/* Death & Respawn Screen */}
          {hud.dead && (
            <DeathModal
              x={hud.x}
              y={hud.y}
              z={hud.z}
              level={hud.level}
              onRespawn={() => engineRef.current?.respawnPlayer()}
              onQuitToTitle={handleSaveAndQuit}
            />
          )}
        </>
      )}

      {/* Global Skin & 3D Model Studio Modal */}
      {skinModalOpen && (
        <SkinManagerModal
          currentSkin={playerSkin}
          onApplySkin={handleApplySkin}
          onClose={handleCloseSkinModal}
        />
      )}
    </div>
  );
}
