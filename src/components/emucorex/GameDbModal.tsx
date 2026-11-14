import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Play,
  Disc,
  Plus
} from 'lucide-react';
import { PS2Game } from '../../data/emucorexGames';

interface GameDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchGame: (game: PS2Game) => void;
  onAddToLibrary?: (game: PS2Game) => void;
}

interface CompatGame {
  serial: string;
  title: string;
  region: string;
  status: 'PERFECT' | 'PLAYABLE';
  genre: string;
  size: string;
  fpsTarget: number;
  coverUrl?: string;
}

const SAMPLE_DATABASE: CompatGame[] = [
  { serial: 'SLUS-20355', title: 'Blade II', region: 'NTSC-U', status: 'PLAYABLE', genre: 'Ação / Hack & Slash', size: '2.1 GB', fpsTarget: 59.9, coverUrl: '/covers/blade2.jpg' },
  { serial: 'SLUS-21242', title: 'Burnout Revenge', region: 'NTSC-U', status: 'PERFECT', genre: 'Corrida Arcade', size: '3.8 GB', fpsTarget: 59.9, coverUrl: '/covers/burnout_revenge.jpg' },
  { serial: 'SLUS-20238', title: 'Crash Bandicoot: The Wrath of Cortex', region: 'NTSC-U', status: 'PERFECT', genre: 'Plataforma 3D', size: '1.2 GB', fpsTarget: 59.9, coverUrl: '/covers/crash_bandicoot.jpg' },
  { serial: 'SLUS-20454', title: 'Enter the Matrix', region: 'NTSC-U', status: 'PLAYABLE', genre: 'Ação / Tiro', size: '3.4 GB', fpsTarget: 59.9, coverUrl: '/covers/enter_the_matrix.jpg' },
  { serial: 'SLUS-21351', title: 'Need for Speed: Most Wanted (Black Edition)', region: 'NTSC-U', status: 'PERFECT', genre: 'Corrida Noturna', size: '3.9 GB', fpsTarget: 59.9, coverUrl: '/covers/nfs_most_wanted.jpg' },
  { serial: 'SLUS-21065', title: 'Need for Speed: Underground 2', region: 'NTSC-U', status: 'PERFECT', genre: 'Corrida Tuning', size: '4.1 GB', fpsTarget: 59.9, coverUrl: '/covers/nfs_underground_2.jpg' },
  { serial: 'SCES-53202', title: 'Tekken 5', region: 'PAL / NTSC', status: 'PERFECT', genre: 'Luta 3D', size: '4.2 GB', fpsTarget: 59.9, coverUrl: '/covers/tekken5.jpg' },
  { serial: 'SCUS-97399', title: 'God of War II', region: 'NTSC-U', status: 'PLAYABLE', genre: 'Ação Épica', size: '7.9 GB', fpsTarget: 59.9 },
  { serial: 'SLUS-21115', title: 'Grand Theft Auto: San Andreas', region: 'NTSC-U', status: 'PERFECT', genre: 'Mundo Aberto', size: '4.2 GB', fpsTarget: 29.9 },
  { serial: 'SCUS-97490', title: 'Shadow of the Colossus', region: 'NTSC-U', status: 'PLAYABLE', genre: 'Aventura / Chefes', size: '3.2 GB', fpsTarget: 29.9 },
  { serial: 'SCUS-97328', title: 'Gran Turismo 4', region: 'NTSC-U', status: 'PERFECT', genre: 'Corrida Simulação', size: '5.2 GB', fpsTarget: 59.9 },
  { serial: 'SLUS-20066', title: 'Final Fantasy X', region: 'NTSC-U', status: 'PERFECT', genre: 'JRPG', size: '4.1 GB', fpsTarget: 59.9 },
  { serial: 'SLUS-20672', title: 'Def Jam: Fight for NY', region: 'NTSC-U', status: 'PERFECT', genre: 'Luta Urbana', size: '3.7 GB', fpsTarget: 59.9 },
  { serial: 'SLUS-20963', title: "Devil May Cry 3: Dante's Awakening", region: 'NTSC-U', status: 'PERFECT', genre: 'Ação Estilizada', size: '4.3 GB', fpsTarget: 59.9 }
];

export const GameDbModal: React.FC<GameDbModalProps> = ({
  isOpen,
  onClose,
  onLaunchGame,
  onAddToLibrary
}) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PERFECT' | 'PLAYABLE'>('ALL');

  const filteredGames = useMemo(() => {
    return SAMPLE_DATABASE.filter((game) => {
      const matchQuery =
        game.title.toLowerCase().includes(search.toLowerCase()) ||
        game.serial.toLowerCase().includes(search.toLowerCase()) ||
        game.genre.toLowerCase().includes(search.toLowerCase());
      const matchFilter = selectedFilter === 'ALL' || game.status === selectedFilter;
      return matchQuery && matchFilter;
    });
  }, [search, selectedFilter]);

  if (!isOpen) return null;

  const toPS2Game = (game: CompatGame): PS2Game => ({
    id: `custom-db-${game.serial.toLowerCase()}`,
    title: game.title,
    serial: game.serial,
    coverUrl: game.coverUrl || '',
    size: game.size,
    genre: game.genre,
    region: game.region,
    lastPlayed: 'Agora',
    isRecent: true,
    fpsTarget: game.fpsTarget
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Catálogo de Jogos</h2>
              <p className="text-xs text-slate-500">Compatibilidade otimizada para Adreno e Mali</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do jogo, serial (SLUS/SCUS) ou gênero..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({SAMPLE_DATABASE.length})
            </button>
            <button
              onClick={() => setSelectedFilter('PERFECT')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedFilter === 'PERFECT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Perfeito (60 FPS)
            </button>
            <button
              onClick={() => setSelectedFilter('PLAYABLE')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedFilter === 'PLAYABLE'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Jogável
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[280px]">
          {filteredGames.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Disc className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs">Nenhum título encontrado com esse termo.</p>
            </div>
          ) : (
            filteredGames.map((game) => (
              <div
                key={game.serial}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3 bg-white"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{game.title}</h4>
                    <span
                      className={`text-[11px] font-mono font-bold shrink-0 ${
                        game.status === 'PERFECT' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {game.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-0.5 tabular-nums">
                    <span>{game.serial}</span>
                    <span>·</span>
                    <span>{game.region}</span>
                    <span>·</span>
                    <span>{game.genre}</span>
                    <span>·</span>
                    <span>{game.size}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onAddToLibrary && (
                    <button
                      onClick={() => onAddToLibrary(toPS2Game(game))}
                      className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Adicionar à Biblioteca"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onLaunchGame(toPS2Game(game));
                      onClose();
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Iniciar este jogo no emulador"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Catálogo Oficial EmuStation</span>
          <span>Adreno &amp; Mali Ready</span>
        </div>
      </div>
    </div>
  );
};
