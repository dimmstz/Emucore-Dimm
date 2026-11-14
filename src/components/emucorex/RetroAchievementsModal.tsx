import React, { useState } from 'react';
import { Award, Star, CheckCircle2, Lock, X, Sparkles, Shield, User } from 'lucide-react';

interface RetroAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string) => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  badgeUrl: string;
}

export const RetroAchievementsModal: React.FC<RetroAchievementsModalProps> = ({ isOpen, onClose, onNotify }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'nfs-01',
      title: 'Blacklist #15 Derrotado',
      description: 'Vença Sonny e conquiste seu Volkswagen Golf GTI no Need for Speed Most Wanted.',
      points: 10,
      unlocked: true,
      unlockedDate: 'Hoje, 05:30',
      badgeUrl: '🏆'
    },
    {
      id: 'nfs-02',
      title: 'Fuga Épica Nível 5',
      description: 'Escape de uma perseguição policial de nível 5 com duração superior a 10 minutos.',
      points: 25,
      unlocked: true,
      unlockedDate: 'Ontem, 22:10',
      badgeUrl: '🚨'
    },
    {
      id: 'burnout-01',
      title: 'Mestre do Takedown',
      description: 'Execute 50 Takedowns em sequência no modo Road Rage do Burnout Revenge.',
      points: 15,
      unlocked: true,
      unlockedDate: '18 Out',
      badgeUrl: '💥'
    },
    {
      id: 'tekken-01',
      title: 'Campeão do Punho de Ferro',
      description: 'Complete o modo Arcade no Tekken 5 sem perder nenhum round.',
      points: 50,
      unlocked: false,
      badgeUrl: '🥋'
    },
    {
      id: 'bios-01',
      title: 'Nostalgia SCPH-39001',
      description: 'Inicie a BIOS original do PlayStation 2 e configure a data e hora do sistema.',
      points: 5,
      unlocked: true,
      unlockedDate: '15 Out',
      badgeUrl: '💾'
    },
    {
      id: 'matrix-01',
      title: 'Desvio de Balas no Ar',
      description: 'Ative o Focus Mode durante uma queda e elimine 3 agentes simultaneamente.',
      points: 20,
      unlocked: false,
      badgeUrl: '🕶️'
    }
  ]);

  if (!isOpen) return null;

  const totalPoints = achievements.filter((a) => a.unlocked).reduce((acc, curr) => acc + curr.points, 0);
  const maxPoints = achievements.reduce((acc, curr) => acc + curr.points, 0);

  const handleUnlockTest = (id: string) => {
    setAchievements((prev) =>
      prev.map((ach) => {
        if (ach.id === id && !ach.unlocked) {
          if (onNotify) onNotify(`🏅 Conquista Desbloqueada: ${ach.title} (+${ach.points} pts)!`);
          return { ...ach, unlocked: true, unlockedDate: 'Agora mesmo' };
        }
        return ach;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Conquistas</h2>
              <p className="text-xs text-slate-500 font-medium">Sincronização em tempo real de troféus PS2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Stats Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-black overflow-hidden ring-2 ring-white/40 shadow-sm shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/file_00000000e108820ebd0c993f45fc28b9_7f7680c5.png"
                  alt="EmuStation"
                  className="w-full h-full object-cover scale-[1.06]"
                />
              </div>
              <div>
                <span className="font-bold text-sm block">Jogador_EmuStation</span>
                <span className="text-[10px] text-amber-100 font-mono">ID: #98421 · Modo Hardcore Ativo</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono">{totalPoints}</span>
              <span className="text-[10px] text-amber-100 block">/ {maxPoints} Pontos</span>
            </div>
          </div>

          <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${(totalPoints / maxPoints) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Troféus Disponíveis ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
          </span>

          <div className="space-y-2">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  ach.unlocked
                    ? 'bg-amber-50/50 border-amber-200/80 shadow-2xs'
                    : 'bg-slate-50/80 border-slate-200/60 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl shrink-0 p-1 rounded-xl bg-white shadow-xs border border-slate-100">
                    {ach.badgeUrl}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{ach.title}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">
                        +{ach.points} pts
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{ach.description}</p>
                    {ach.unlocked && (
                      <span className="text-[10px] text-emerald-600 font-semibold font-mono block mt-1">
                        Desbloqueado em {ach.unlockedDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {ach.unlocked ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUnlockTest(ach.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Testar Desbloqueio"
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Testar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
