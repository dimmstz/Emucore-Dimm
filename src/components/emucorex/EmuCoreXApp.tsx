import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Menu,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCw,
  ArrowDownAZ,
  ArrowUpAZ,
  Clock,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Tv,
  Check,
  Home,
  Search,
  Calendar,
  Star,
  User,
  Play,
  FolderSync,
  ArrowLeftRight,
  Settings,
  Cpu,
  X,
  Gamepad2,
  Zap,
  Pause,
  Plus,
  Trash2,
  Disc,
  Volume2,
  VolumeX
} from 'lucide-react';
import { EMUCOREX_LIBRARY, PS2Game } from '../../data/emucorexGames';
import { useEmulatorSettings } from '../../hooks/useEmulatorSettings';
import { VectorTouchControls } from './VectorTouchControls';
import { ControlsSettingsModal } from './ControlsSettingsModal';
import { SettingsModal } from './SettingsModal';
import { GameDbModal } from './GameDbModal';
import { MemoryCardModal } from './MemoryCardModal';
import { HubModal } from './HubModal';
import { RetroAchievementsModal } from './RetroAchievementsModal';
import { ProfileModal } from './ProfileModal';
import { DataTransferModal } from './DataTransferModal';
import { TechnicalDiagnosticsView } from './TechnicalDiagnosticsView';
import { PS2GameCover } from './PS2GameCover';
import { PS2RuntimeCanvas, LiveInputState } from './PS2RuntimeCanvas';

type SortOption =
  | 'title-asc'
  | 'title-desc'
  | 'recent-desc'
  | 'recent-asc'
  | 'size-desc'
  | 'size-asc'
  | 'platform';

export const EmuCoreXApp: React.FC = () => {
  // Unified Persistent Settings & Multi-Device Hardware Telemetry
  const {
    settings,
    activeDevice,
    detectedHardware,
    telemetry,
    updateSettings,
    selectDeviceProfile,
    updateControls,
    togglePatch,
    applyPreset,
    resetAllSettings,
    generateIniConfig
  } = useEmulatorSettings();

  // Navigation & View States
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeSort, setActiveSort] = useState<SortOption>('title-asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Modals State
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [controlsModalOpen, setControlsModalOpen] = useState<boolean>(false);
  const [gameDbModalOpen, setGameDbModalOpen] = useState<boolean>(false);
  const [memoryCardModalOpen, setMemoryCardModalOpen] = useState<boolean>(false);
  const [hubModalOpen, setHubModalOpen] = useState<boolean>(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [dataTransferModalOpen, setDataTransferModalOpen] = useState<boolean>(false);

  // Custom User Games (Persisted in localStorage)
  const [customGames, setCustomGames] = useState<PS2Game[]>(() => {
    try {
      const saved = localStorage.getItem('emucorex_custom_games');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic Recently Played IDs (Persisted in localStorage)
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('emucorex_recent_ids');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return EMUCOREX_LIBRARY.filter((g) => g.isRecent).map((g) => g.id);
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Running Game State
  const [runningGame, setRunningGame] = useState<PS2Game | null>(null);
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Shared real-time input state (Touch Controls + Keyboard + Gamepad API -> PS2RuntimeCanvas)
  const liveInputRef = useRef<LiveInputState>({
    buttons: {},
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 }
  });

  const handleInputPress = useCallback((btn: string) => {
    liveInputRef.current.buttons[btn] = true;
  }, []);

  const handleInputRelease = useCallback((btn: string) => {
    liveInputRef.current.buttons[btn] = false;
  }, []);

  const handleAnalogMove = useCallback((stick: 'left' | 'right', x: number, y: number) => {
    if (stick === 'left') liveInputRef.current.leftStick = { x, y };
    else liveInputRef.current.rightStick = { x, y };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  // Combined games library
  const allGames = useMemo(() => {
    return [...customGames, ...EMUCOREX_LIBRARY];
  }, [customGames]);

  // Complete Sort & Filter Logic for all 7 SortOptions
  const sortedGames = useMemo(() => {
    let list = [...allGames];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.serial.toLowerCase().includes(q) ||
          g.genre.toLowerCase().includes(q)
      );
    }

    const getRecentRank = (id: string) => {
      const idx = recentIds.indexOf(id);
      return idx === -1 ? 999 : idx;
    };

    switch (activeSort) {
      case 'title-asc':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return list.sort((a, b) => b.title.localeCompare(a.title));
      case 'recent-desc':
        return list.sort((a, b) => getRecentRank(a.id) - getRecentRank(b.id));
      case 'recent-asc':
        return list.sort((a, b) => getRecentRank(b.id) - getRecentRank(a.id));
      case 'size-desc':
        return list.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
      case 'size-asc':
        return list.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
      case 'platform':
        return list.sort((a, b) => a.region.localeCompare(b.region) || a.title.localeCompare(b.title));
      default:
        return list;
    }
  }, [allGames, activeSort, searchQuery, recentIds]);

  const recentGames = useMemo(() => {
    const mapped = recentIds
      .map((id) => allGames.find((g) => g.id === id))
      .filter((g): g is PS2Game => Boolean(g));
    return mapped.length > 0 ? mapped : allGames.filter((g) => g.isRecent);
  }, [allGames, recentIds]);

  const handleLaunchGame = useCallback((game: PS2Game) => {
    // Reset input state cleanly on launch
    liveInputRef.current = { buttons: {}, leftStick: { x: 0, y: 0 }, rightStick: { x: 0, y: 0 } };
    setRunningGame(game);
    setIsGamePaused(false);
    setIsTurbo(false);

    // Track in recently played (excluding BIOS)
    if (game.id !== 'bios-ps2') {
      setRecentIds((prev) => {
        const next = [game.id, ...prev.filter((id) => id !== game.id)].slice(0, 6);
        try {
          localStorage.setItem('emucorex_recent_ids', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, []);

  const handleAddGameToLibrary = useCallback((newGame: PS2Game) => {
    const exists = allGames.some(
      (g) => g.id === newGame.id || g.serial.toLowerCase() === newGame.serial.toLowerCase()
    );
    if (exists) {
      showToast(`"${newGame.title}" já está na sua biblioteca.`);
      return;
    }
    setCustomGames((prev) => {
      const updated = [newGame, ...prev];
      try {
        localStorage.setItem('emucorex_custom_games', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast(`"${newGame.title}" adicionado à biblioteca.`);
  }, [allGames, showToast]);

  // Real ISO / CHD / ELF File Selection
  const handleImportIsoFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const ext = file.name.split('.').pop()?.toUpperCase() || 'ISO';
    const sizeInGb = (file.size / (1024 * 1024 * 1024)).toFixed(1);
    const randomSerialNum = Math.floor(10000 + Math.random() * 90000);

    const newGame: PS2Game = {
      id: `custom-${Date.now()}`,
      title: fileName,
      serial: `SLUS-${randomSerialNum}`,
      coverUrl: '',
      size: `${sizeInGb} GB (${ext})`,
      genre: 'PlayStation 2 Disc',
      region: 'NTSC-U',
      lastPlayed: 'Agora mesmo',
      isRecent: true,
      fpsTarget: 60.0
    };

    handleAddGameToLibrary(newGame);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleAddGameToLibrary]);

  const handleDeleteCustomGame = useCallback((id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomGames((prev) => {
      const filtered = prev.filter((g) => g.id !== id);
      try {
        localStorage.setItem('emucorex_custom_games', JSON.stringify(filtered));
      } catch {
        // ignore
      }
      return filtered;
    });
    showToast(`"${title}" removido da biblioteca.`);
  }, [showToast]);

  // Technical Diagnostics & Hardware Tuning View
  if (isDiagnosticsOpen) {
    return (
      <TechnicalDiagnosticsView
        onBackToLibrary={() => setIsDiagnosticsOpen(false)}
        settings={settings}
        activeDevice={activeDevice}
        detectedHardware={detectedHardware}
        telemetry={telemetry}
        onUpdateSettings={updateSettings}
        onSelectDeviceProfile={selectDeviceProfile}
        generateIniConfig={generateIniConfig}
      />
    );
  }

  const sortOptionsList: { id: SortOption; label: string; icon: React.ReactNode }[] = [
    { id: 'title-asc', label: 'Título A-Z', icon: <ArrowDownAZ className="w-4 h-4 text-slate-500" /> },
    { id: 'title-desc', label: 'Título Z-A', icon: <ArrowUpAZ className="w-4 h-4 text-slate-500" /> },
    { id: 'recent-desc', label: 'Abertos recentemente', icon: <Clock className="w-4 h-4 text-slate-500" /> },
    { id: 'recent-asc', label: 'Mais antigos primeiro', icon: <Clock className="w-4 h-4 text-slate-500" /> },
    { id: 'size-desc', label: 'Maior tamanho', icon: <ArrowDownWideNarrow className="w-4 h-4 text-slate-500" /> },
    { id: 'size-asc', label: 'Menor tamanho', icon: <ArrowUpWideNarrow className="w-4 h-4 text-slate-500" /> },
    { id: 'platform', label: 'Por região / plataforma', icon: <Tv className="w-4 h-4 text-slate-500" /> }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans selection:bg-blue-100 flex flex-col justify-start relative overflow-x-hidden">
      {/* Hidden File Input for Real PS2 ROM / ISO Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".iso,.chd,.cso,.bin,.elf,.gz,.zip"
        onChange={handleImportIsoFile}
        className="hidden"
      />

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl border border-slate-700/80 flex items-center gap-2 max-w-[90vw]">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          TOP ACTION BAR (Clean One UI Header — Responsive Width)
         ========================================================================= */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-[#EEF2F6] hover:bg-slate-200/80 flex items-center justify-center text-slate-700 transition-colors cursor-pointer border border-slate-200/50 shrink-0"
            title="Menu Principal"
            aria-label="Abrir menu principal"
          >
            <Menu className="w-5 h-5 text-slate-800" strokeWidth={2.2} />
          </button>

          {/* Title & Subtitle with EmuStation Brand Emblem */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pl-0.5">
            <div className="w-9 h-9 rounded-full bg-black overflow-hidden ring-1 ring-slate-200/90 shadow-xs shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/file_00000000e108820ebd0c993f45fc28b9_7f7680c5.png"
                alt="EmuStation"
                className="w-full h-full object-cover scale-[1.06]"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight tracking-tight truncate">
                Biblioteca
              </h1>
              <p className="text-xs text-slate-500 font-medium tabular-nums truncate">
                Total de jogos: {allGames.length} · {settings.renderer.toUpperCase()} {settings.upscale}x
              </p>
            </div>
          </div>

          {/* Right Action Toolbar: Search + Sort/Filter + Grid + List */}
          <div className="bg-[#EEF2F6] rounded-2xl p-1 flex items-center gap-0.5 border border-slate-200/60 relative shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/60 flex items-center justify-center transition-all cursor-pointer"
              title="Buscar jogos na biblioteca"
              aria-label="Buscar jogos"
            >
              <Search className="w-4 h-4" strokeWidth={2} />
            </button>

            <button
              onClick={() => setSortDropdownOpen((prev) => !prev)}
              className={`min-w-[40px] min-h-[40px] p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                sortDropdownOpen ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Classificar e Filtrar"
              aria-label="Classificar e filtrar"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`min-w-[40px] min-h-[40px] p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Modo Grade"
              aria-label="Modo grade"
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={2} />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`min-w-[40px] min-h-[40px] p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Modo Lista"
              aria-label="Modo lista"
            >
              <List className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* Sort & Filter Dropdown Menu */}
            {sortDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-50 bg-black/10"
                  onClick={() => setSortDropdownOpen(false)}
                />
                <div className="absolute right-0 top-14 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 px-2 z-50">
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setSortDropdownOpen(false);
                        showToast('Biblioteca de jogos atualizada.');
                      }}
                      className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50/80 rounded-2xl transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <RotateCw className="w-4 h-4" />
                      </div>
                      <span>Atualizar biblioteca</span>
                    </button>

                    <div className="h-px bg-slate-100 my-1 mx-2" />

                    {sortOptionsList.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setActiveSort(opt.id);
                          setSortDropdownOpen(false);
                        }}
                        className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100/80 rounded-2xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {opt.icon}
                          <span>{opt.label}</span>
                        </div>
                        {activeSort === opt.id && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Responsive Android One UI Library */}
      <main className="max-w-5xl w-full mx-auto px-4 py-5 space-y-6 flex-1">


        {/* Section: Abertos recentemente */}
        {recentGames.length > 0 && !searchQuery && (
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Abertos recentemente
              </h2>
              <div className="flex-1 h-px bg-slate-200/90" />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
              {recentGames.slice(0, 6).map((game) => (
                <button
                  key={`recent-${game.id}`}
                  onClick={() => handleLaunchGame(game)}
                  className="group relative cursor-pointer transform hover:scale-[1.03] transition-transform duration-200 text-left"
                >
                  <PS2GameCover game={game} priority={true} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Section: Todos os Jogos */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
                Todos os Títulos ({sortedGames.length})
              </h2>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-600 hover:underline font-medium cursor-pointer shrink-0"
                >
                  Limpar filtro
                </button>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[40px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              title="Adicionar arquivo .iso, .chd, .cso ou .bin do dispositivo"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar ISO</span>
            </button>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
              {sortedGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleLaunchGame(game)}
                  className="group relative cursor-pointer transform hover:scale-[1.03] transition-transform duration-200"
                >
                  <PS2GameCover game={game} />
                  {game.id.startsWith('custom-') && (
                    <button
                      onClick={(e) => handleDeleteCustomGame(game.id, game.title, e)}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/75 hover:bg-rose-600 text-white transition-colors cursor-pointer z-10"
                      title="Excluir este jogo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sortedGames.map((game) => (
                <div
                  key={`list-${game.id}`}
                  onClick={() => handleLaunchGame(game)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-blue-400 transition-all flex items-center gap-3.5 cursor-pointer"
                >
                  <div className="w-14 h-20 shrink-0">
                    <PS2GameCover game={game} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{game.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                      <span>{game.serial}</span>
                      <span>·</span>
                      <span>{game.size}</span>
                      <span>·</span>
                      <span>{game.region}</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium block">
                      Última sessão: {game.lastPlayed}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {game.id.startsWith('custom-') && (
                      <button
                        onClick={(e) => handleDeleteCustomGame(game.id, game.title, e)}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


      </main>

      {/* =========================================================================
          DRAWER (Menu Lateral One UI)
         ========================================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-80 max-w-[85%] bg-[#F2F4F7] h-full shadow-2xl p-5 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-md relative overflow-hidden ring-1 ring-slate-300/80 shrink-0">
                  <img
                    src="/assets/aistudio/file_00000000e108820ebd0c993f45fc28b9_7f7680c5.png"
                    alt="EmuStation"
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">EmuStation</h2>
                  <span className="text-[11px] text-slate-500 font-mono">v0.5.0 · Build 204</span>
                </div>
              </div>

              {/* Section: Navegação */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 block px-1">
                  Menu Principal
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#D6E3F8] text-[#1A4EA0] font-semibold text-sm transition-all cursor-pointer"
                  >
                    <Home className="w-4 h-4 fill-current text-[#1A4EA0]" />
                    <span>Biblioteca</span>
                  </button>

                  <button
                    onClick={() => {
                      setGameDbModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-slate-600" />
                    <span>Catálogo de Jogos</span>
                  </button>

                  <button
                    onClick={() => {
                      setHubModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>Central de Patches</span>
                  </button>

                  <button
                    onClick={() => {
                      setAchievementsModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-slate-600" />
                    <span>Conquistas</span>
                  </button>
                </div>
              </div>

              {/* Section: Execução Rápida */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 block px-1">
                  Execução Rápida
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      handleLaunchGame(allGames[0]);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-blue-600 fill-current" />
                    <span className="truncate">Iniciar {allGames[0]?.title.split(':')[0]}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      handleLaunchGame({
                        id: 'bios-ps2',
                        title: `Sony PlayStation 2 System (${settings.biosRegion})`,
                        serial: settings.biosRegion,
                        coverUrl: '',
                        size: '4.0 MB',
                        genre: 'System BIOS',
                        region: settings.biosRegion === 'SCPH-50004' ? 'PAL' : 'NTSC',
                        lastPlayed: 'Agora',
                        isRecent: false,
                        fpsTarget: 60.0
                      });
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <Disc className="w-4 h-4 text-blue-600" />
                    <span>Iniciar BIOS</span>
                  </button>
                </div>
              </div>

              {/* Section: Configurações & Ferramentas */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 block px-1">
                  Sistema &amp; Ferramentas
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setSettingsModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white hover:bg-blue-50/80 text-blue-700 font-bold text-sm transition-all cursor-pointer border border-blue-200"
                  >
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>Configurações</span>
                  </button>

                  <button
                    onClick={() => {
                      setControlsModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <Gamepad2 className="w-4 h-4 text-blue-600" />
                    <span>Controles e Gamepad</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-600" />
                    <span>Perfil do Dispositivo</span>
                  </button>

                  <button
                    onClick={() => {
                      setMemoryCardModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <FolderSync className="w-4 h-4 text-slate-600" />
                    <span>Memory Cards</span>
                  </button>

                  <button
                    onClick={() => {
                      setDataTransferModalOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-slate-600" />
                    <span>Transferência de Dados</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDiagnosticsOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#E6EBF2] hover:bg-slate-200/80 text-slate-700 font-medium text-sm transition-all cursor-pointer"
                  >
                    <Cpu className="w-4 h-4 text-slate-600" />
                    <span>Diagnóstico do Sistema</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 font-mono">
                EmuStation · Adreno &amp; Mali Vulkan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EMULATION SCREEN (Running Game with DualShock 2 Controls & HUD)
         ========================================================================= */}
      {runningGame && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden">
          {/* Top Bar */}
          <div className="h-14 shrink-0 px-3 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between gap-2 z-40">
            <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-mono tabular-nums text-white flex items-center gap-2.5 min-w-0">
              <span className={`font-bold shrink-0 ${isTurbo ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isTurbo ? '120 FPS' : '60 FPS'}
              </span>
              <span className={`hidden sm:inline shrink-0 ${isTurbo ? 'text-amber-300 font-bold' : 'text-cyan-300'}`}>
                {isTurbo ? '200%' : '100%'}
              </span>
              <span className="text-slate-400 hidden sm:inline truncate">
                {settings.renderer.toUpperCase()} ({settings.upscale}x)
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => updateSettings({ audioMuted: !settings.audioMuted })}
                className="min-h-[38px] min-w-[38px] p-2 rounded-full bg-black/65 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title={settings.audioMuted ? 'Ativar Áudio' : 'Silenciar Áudio'}
              >
                {settings.audioMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
              </button>
              <button
                onClick={() => setControlsModalOpen(true)}
                className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-full bg-black/65 border border-white/25 text-white hover:bg-white/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Configurar Controles & Gamepad"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Controles</span>
              </button>
              <button
                onClick={() => setSettingsModalOpen(true)}
                className="min-h-[38px] min-w-[38px] p-2 rounded-full bg-black/65 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsGamePaused((prev) => !prev)}
                className="min-h-[38px] min-w-[38px] p-2 rounded-full bg-black/65 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title={isGamePaused ? 'Retomar' : 'Pausar'}
              >
                {isGamePaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setRunningGame(null);
                  setIsTurbo(false);
                }}
                className="min-h-[38px] min-w-[38px] p-2 rounded-full bg-rose-600/85 text-white hover:bg-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar Jogo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive PS2 Canvas Render Engine wired to Touch/Keyboard/Gamepad */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden pb-[312px] sm:pb-0">
            <PS2RuntimeCanvas
              game={runningGame}
              isPaused={isGamePaused}
              isTurbo={isTurbo}
              upscaleMultiplier={settings.upscale}
              widescreen16x9={settings.widescreen16x9}
              showFpsHud={settings.showFpsHud}
              masterVolume={settings.masterVolume}
              audioMuted={settings.audioMuted}
              liveInputRef={liveInputRef}
              activeHardwareLabel={`${activeDevice.shortName} · ${activeDevice.gpuName.split('(')[0].trim()}`}
            />
          </div>

          {/* Vector Touch Controls Overlay with Full DualShock 2 Layout */}
          <VectorTouchControls
            config={settings.controls}
            onUpdateConfig={updateControls}
            onButtonPress={handleInputPress}
            onButtonRelease={handleInputRelease}
            onAnalogMove={handleAnalogMove}
            onTurboToggle={(turbo) => setIsTurbo(turbo)}
            onQuickSave={() => showToast('State 1 salvo com sucesso no armazenamento local.')}
            onQuickLoad={() => showToast('State 1 carregado com sucesso.')}
            onOpenSettings={() => setControlsModalOpen(true)}
          />
        </div>
      )}

      {/* Categorized System Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        activeDevice={activeDevice}
        detectedHardware={detectedHardware}
        telemetry={telemetry}
        onUpdateSettings={updateSettings}
        onSelectDeviceProfile={selectDeviceProfile}
        onApplyPreset={applyPreset}
        onResetAll={resetAllSettings}
        onOpenControlsModal={() => setControlsModalOpen(true)}
        generateIniConfig={generateIniConfig}
        onNotify={showToast}
      />

      {/* Controls Settings Modal */}
      <ControlsSettingsModal
        isOpen={controlsModalOpen}
        onClose={() => setControlsModalOpen(false)}
        config={settings.controls}
        onUpdateConfig={updateControls}
        onResetLayout={() => {
          localStorage.removeItem('emustation_control_positions_v2');
          localStorage.removeItem('emucorex_control_positions');
          window.dispatchEvent(new Event('emustation-reset-controls'));
          showToast('Layout de controles restaurado para o padrão.');
        }}
      />

      {/* GameDb Modal (Pesquisa PS2) */}
      <GameDbModal
        isOpen={gameDbModalOpen}
        onClose={() => setGameDbModalOpen(false)}
        onLaunchGame={handleLaunchGame}
        onAddToLibrary={handleAddGameToLibrary}
      />

      {/* Memory Card Modal */}
      <MemoryCardModal
        isOpen={memoryCardModalOpen}
        onClose={() => setMemoryCardModalOpen(false)}
      />

      {/* Hub Modal */}
      <HubModal
        isOpen={hubModalOpen}
        onClose={() => setHubModalOpen(false)}
        patches={settings.patches}
        biosRegion={settings.biosRegion}
        onTogglePatch={togglePatch}
        onNotify={showToast}
      />

      {/* RetroAchievements Modal */}
      <RetroAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        onNotify={showToast}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        gamesCount={allGames.length}
        selectedProfileId={settings.deviceProfileId}
        activeDevice={activeDevice}
        detectedHardware={detectedHardware}
        onSelectDeviceProfile={selectDeviceProfile}
        onNotify={showToast}
      />

      {/* Data Transfer Modal */}
      <DataTransferModal
        isOpen={dataTransferModalOpen}
        onClose={() => setDataTransferModalOpen(false)}
        onNotify={showToast}
      />

      {/* Library Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-4 space-y-3 z-10 border border-slate-200">
            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2.5 rounded-2xl">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nome, serial ou gênero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
              {sortedGames.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Nenhum jogo encontrado na biblioteca.
                </div>
              ) : (
                sortedGames.map((game) => (
                  <button
                    key={`search-${game.id}`}
                    onClick={() => {
                      handleLaunchGame(game);
                      setIsSearchOpen(false);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-2.5 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer text-left"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-slate-800 block truncate">{game.title}</span>
                      <span className="text-[11px] text-slate-400">{game.genre}</span>
                    </div>
                    <span className="text-slate-500 font-mono shrink-0">{game.serial}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
