import React, { useState } from 'react';
import { Disc, Sparkles } from 'lucide-react';
import { PS2Game } from '../../data/emucorexGames';

interface PS2GameCoverProps {
  game: PS2Game;
  className?: string;
  priority?: boolean;
}

export const PS2GameCover: React.FC<PS2GameCoverProps> = ({ game, className = '', priority = false }) => {
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  // Generate deterministic gradient colors based on game title for procedural fallback
  const getGradientForTitle = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 45) % 360;
    return `linear-gradient(145deg, hsl(${hue1}, 75%, 16%) 0%, hsl(${hue2}, 65%, 8%) 100%)`;
  };

  const isBios = game.id === 'bios-ps2' || game.serial === 'SCPH-39001';

  return (
    <div
      className={`relative w-full aspect-[2/3] rounded-md overflow-hidden bg-black border border-slate-800 shadow-md group-hover:shadow-xl transition-all duration-200 select-none ${className}`}
    >
      {/* Real Image If Available and Not Failed */}
      {!imageFailed && game.coverUrl && !isBios ? (
        <img
          src={game.coverUrl}
          alt={game.title}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover"
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : isBios ? (
        /* Dedicated Authentic Sony PlayStation 2 BIOS Case */
        <div className="w-full h-full bg-gradient-to-b from-blue-950 via-slate-950 to-black text-white flex flex-col justify-between p-2.5 relative overflow-hidden">
          {/* Subtle 3D grid & glow */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

          {/* PS2 Silver Header Ribbon */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-1">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[11px] tracking-tight text-white font-mono">
                PlayStation<span className="text-[9px]">.2</span>
              </span>
            </div>
            <span className="text-[8px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-1 rounded border border-cyan-700/50">
              BIOS
            </span>
          </div>

          {/* Center Graphic: PS2 Monolith & Celestial Orbs */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5 my-auto text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40">
              <Disc className="w-6 h-6 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <h4 className="text-[12px] font-extrabold tracking-tight text-white font-mono leading-tight px-1">
              System BIOS
            </h4>
            <span className="text-[9px] text-cyan-400 font-mono tracking-wider">SCPH-39001</span>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] font-mono text-slate-400">
            <span>SONY CORP</span>
            <span>NTSC-U</span>
          </div>
        </div>
      ) : (
        /* Procedural High-Fidelity PS2 DVD Case for Custom Uploaded Games or Fallbacks */
        <div
          className="w-full h-full text-white flex flex-col justify-between p-2.5 relative overflow-hidden"
          style={{ background: getGradientForTitle(game.title) }}
        >
          {/* Authentic PS2 Silver Header Ribbon */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/25 pb-1">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[11px] tracking-tight text-slate-100 font-mono">
                PlayStation<span className="text-[9px]">.2</span>
              </span>
            </div>
            <span className="text-[7.5px] font-mono text-white/90 font-bold bg-black/60 px-1 py-0.5 rounded border border-white/20">
              {game.region || 'NTSC-U'}
            </span>
          </div>

          {/* Game Title Artwork Area */}
          <div className="relative z-10 my-auto text-center space-y-1 px-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20 text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-[11px] font-black tracking-tight text-white uppercase leading-snug drop-shadow-md line-clamp-3">
              {game.title}
            </h4>
            <div className="inline-block text-[8px] font-mono text-slate-300 px-1.5 py-0.5 rounded bg-black/40 border border-white/15">
              {game.genre}
            </div>
          </div>

          {/* Footer: Serial Code, DVD-ROM logo, ESRB badge */}
          <div className="relative z-10 pt-1 border-t border-white/15 flex items-center justify-between text-[8px] font-mono text-slate-300">
            <span className="truncate max-w-[65px]">{game.serial}</span>
            <div className="flex items-center gap-1">
              <span className="px-1 py-0.2 rounded bg-black/60 text-[7px] border border-white/20 font-bold">
                DVD
              </span>
              <span className="px-1 py-0.2 rounded bg-white text-black text-[7px] font-bold">
                T
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Realistic Plastic Gloss Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
      {/* Left Case Spine Shadow */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
    </div>
  );
};
