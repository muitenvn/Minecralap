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
import { TitleAndWorlds } from './components/TitleAndWorlds';
import { NetherCraftEngine } from './game/engine';
import {
  CompiledResourcePack,
  compileResourcePack,
} from './game/resourcePack';
import {
  exportWorldToFile,
  listWorlds,
  loadActiveResourcePack,
  loadVideoSettings,
  saveVideoSettings,
} from './game/storage';
import {
  CachedResourcePack,
  ChatMessage,
  ContainerType,
  HudSnapshot,
  TitleBanner,
  VideoSettings,
  WorldSave,
} from './game/types';

type AppScreen =
  | 'boot'
  | 'gate'
  | 'title'
  | 'worlds'
  | 'create_world'
  | 'github_guide'
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
  const [returnScreen, setReturnScreen] = useState<AppScreen>('title');
  const [compiledPack, setCompiledPack] = useState<CompiledResourcePack | null>(null);
  const [settings, setSettings] = useState<VideoSettings>(() => loadVideoSettings());
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

  useEffect(() => {
    const onResize = () => setHasTouchCapable(isTouchDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const touchVisible =
    settings.touchMode === 'on' || (settings.touchMode === 'auto' && hasTouchCapable);

  const refreshWorlds = useCallback(async () => {
    const list = await listWorlds();
    setWorlds(list);
  }, []);

  const applyCompiledPack = useCallback(async (cached: CachedResourcePack) => {
    const nextCompiled = await compileResourcePack(cached);
    if (compiledPackRef.current) {
      compiledPackRef.current.dispose();
    }
    compiledPackRef.current = nextCompiled;
    setCompiledPack(nextCompiled);
    engineRef.current?.setResourcePack(nextCompiled);
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

  // Boot sequence: check IndexedDB for mandatory 1.16 resource pack + worlds
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cachedPack, savedWorlds] = await Promise.all([
          loadActiveResourcePack(),
          listWorlds(),
        ]);
        if (!alive) return;
        setWorlds(savedWorlds);
        if (cachedPack) {
          await applyCompiledPack(cachedPack);
          if (alive) setScreen('title');
        } else {
          setScreen('gate');
        }
      } catch {
        if (alive) setScreen('gate');
      }
    })();

    return () => {
      alive = false;
    };
  }, [applyCompiledPack]);

  const handleSettingsChange = useCallback((next: VideoSettings) => {
    setSettings(next);
    saveVideoSettings(next);
    engineRef.current?.updateSettings(next);
  }, []);

  const handleLaunchWorld = useCallback((world: WorldSave) => {
    setActiveWorldName(world.name);
    setChatMessages([
      {
        id: `welcome_${Date.now()}`,
        text: `Đã vào thế giới "${world.name}" (Biên giới ±${world.worldBorderSize.toLocaleString('vi-VN')} khối). Gõ /help để xem 26 lệnh 1.16.`,
        tone: 'gold',
        timestamp: Date.now(),
      },
    ]);
    setContainerType('none');
    setPaused(false);
    setInGameModal('none');
    setChatOpen(false);
    setScreen('playing');
    engineRef.current?.loadWorld(world);
    if (!isTouchDevice()) {
      setTimeout(() => engineRef.current?.requestPointerLock(), 80);
    }
  }, []);

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

      {/* Boot Splash */}
      {screen === 'boot' && (
        <div className="fixed inset-0 z-40 bg-[#141019] flex flex-col items-center justify-center gap-3 text-white">
          <div className="font-mc text-2xl font-bold text-[#fde68a] mc-text-shadow">
            NETHERCRAFT 1.16.5
          </div>
          <div className="text-xs font-mono-num text-zinc-400">
            Đang kiểm tra gói tài nguyên IndexedDB...
          </div>
        </div>
      )}

      {/* Mandatory 1.16 Resource Pack Gate / Manager */}
      {(screen === 'gate' || screen === 'resource_manager') && (
        <ResourceGateScreen
          compiledPack={compiledPack}
          mode={screen === 'gate' ? 'gate' : 'manager'}
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

      {/* Title Screen, Worlds, Create World, GitHub Guide */}
      {compiledPack &&
        (screen === 'title' ||
          screen === 'worlds' ||
          screen === 'create_world' ||
          screen === 'github_guide') && (
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
            onLaunchWorld={handleLaunchWorld}
            onRefreshWorlds={refreshWorlds}
          />
        )}

      {/* Video Options (from Title Screen) */}
      {screen === 'options' && (
        <VideoOptionsModal
          settings={settings}
          pack={compiledPack}
          inGame={false}
          onChange={handleSettingsChange}
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
          />

          {/* Mobile Multi-Touch Controls */}
          {touchVisible && !paused && !chatOpen && containerType === 'none' && !hud.dead && (
            <MobileTouchControls
              flying={hud.flying}
              sneaking={hud.sneaking}
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
              onToggleF3={() => setShowF3((prev) => !prev)}
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
              onUpdateInventory={(inv, arm, furn) =>
                engineRef.current?.applyInventoryUpdate(inv, arm, furn)
              }
              onClose={handleCloseContainer}
            />
          )}

          {/* Pause Menu */}
          {paused && inGameModal === 'none' && containerType === 'none' && !chatOpen && !hud.dead && (
            <PauseModal
              worldName={activeWorldName}
              pack={compiledPack}
              onResume={handleResumeGame}
              onOpenOptions={() => setInGameModal('options')}
              onOpenResourcePack={() => setInGameModal('resources')}
              onExportWorld={handleExportCurrentWorld}
              onSaveAndQuit={handleSaveAndQuit}
            />
          )}

          {/* In-Game Video Settings */}
          {paused && inGameModal === 'options' && (
            <VideoOptionsModal
              settings={settings}
              pack={compiledPack}
              inGame
              onChange={handleSettingsChange}
              onClose={() => setInGameModal('none')}
            />
          )}

          {/* In-Game Resource Pack Manager */}
          {paused && inGameModal === 'resources' && (
            <ResourceGateScreen
              compiledPack={compiledPack}
              mode="manager"
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
    </div>
  );
}
