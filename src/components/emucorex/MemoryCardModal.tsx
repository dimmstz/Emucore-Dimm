import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Trash2,
  Download,
  CheckCircle,
  RotateCw
} from 'lucide-react';

interface MemoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SaveBlock {
  id: string;
  game: string;
  title: string;
  sizeKb: number;
  date: string;
  iconColor: string;
}

const DEFAULT_SLOT_1: SaveBlock[] = [
  { id: '1', game: 'SLUS-21351', title: 'Need for Speed: Most Wanted (Carreira 85%)', sizeKb: 138, date: 'Hoje, 14:22', iconColor: 'bg-amber-500' },
  { id: '2', game: 'SLUS-21005', title: 'Tekken 5 (Todos Personagens Desbloqueados)', sizeKb: 412, date: 'Ontem, 20:15', iconColor: 'bg-blue-500' },
  { id: '3', game: 'SLUS-21242', title: 'Burnout Revenge (Rank Elite 100%)', sizeKb: 205, date: '21/10/2026', iconColor: 'bg-rose-500' },
  { id: '4', game: 'SLUS-20238', title: 'Crash Bandicoot: TWoC (Fase 18)', sizeKb: 115, date: '19/10/2026', iconColor: 'bg-orange-500' },
  { id: '5', game: 'SLUS-20454', title: 'Enter the Matrix (Capítulo 4 Neo)', sizeKb: 180, date: '18/10/2026', iconColor: 'bg-emerald-500' }
];

const DEFAULT_SLOT_2: SaveBlock[] = [
  { id: 's2-1', game: 'SLUS-21065', title: 'Need for Speed: Underground 2 (Garagem 100%)', sizeKb: 240, date: '12/10/2026', iconColor: 'bg-indigo-500' },
  { id: 's2-2', game: 'SLUS-20356', title: 'Blade II (Dificuldade Hard)', sizeKb: 96, date: '10/10/2026', iconColor: 'bg-slate-600' }
];

export const MemoryCardModal: React.FC<MemoryCardModalProps> = ({ isOpen, onClose }) => {
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const [slots, setSlots] = useState<{ 1: SaveBlock[]; 2: SaveBlock[] }>(() => {
    try {
      const saved = localStorage.getItem('emucorex_memcards_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { 1: DEFAULT_SLOT_1, 2: DEFAULT_SLOT_2 };
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('emucorex_memcards_v1', JSON.stringify(slots));
    } catch {
      // ignore
    }
  }, [slots]);

  if (!isOpen) return null;

  const saveBlocks = slots[activeSlot];
  const totalCapacityKb = activeSlot === 1 ? 8192 : 32768;
  const usedCapacityKb = saveBlocks.reduce((acc, b) => acc + b.sizeKb, 0);
  const freeCapacityKb = totalCapacityKb - usedCapacityKb;
  const usedPercent = Math.round((usedCapacityKb / totalCapacityKb) * 100);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeleteSave = (id: string) => {
    setSlots((prev) => ({
      ...prev,
      [activeSlot]: prev[activeSlot].filter((b) => b.id !== id)
    }));
    showFeedback(`Save removido do Memory Card ${activeSlot}.`);
  };

  const handleFormat = () => {
    setSlots((prev) => ({
      ...prev,
      [activeSlot]: []
    }));
    showFeedback(`Memory Card ${activeSlot} formatado com sucesso.`);
  };

  const handleExportCard = () => {
    const buffer = new Uint8Array(1024 * 64);
    buffer.fill(0xff);
    const header = `Sony PS2 Memory Card Format 1.2.0.0 [Slot ${activeSlot}]`;
    for (let i = 0; i < header.length; i++) {
      buffer[i] = header.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mcd00${activeSlot}_EmuStation.ps2`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback(`Arquivo Mcd00${activeSlot}_EmuStation.ps2 baixado.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Gerenciador de Memory Cards</h2>
              <p className="text-xs text-slate-500">Cartões de memória virtuais do PlayStation 2 (SCPH-10020)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Slot Selection Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSlot(1)}
            className={`min-h-[40px] flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSlot === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slot 1: Mcd001.ps2 (8 MB)
          </button>
          <button
            onClick={() => setActiveSlot(2)}
            className={`min-h-[40px] flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSlot === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slot 2: Mcd002.ps2 (32 MB)
          </button>
        </div>

        {/* Storage Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs tabular-nums">
            <span className="font-semibold text-slate-700">Espaço Utilizado</span>
            <span className="font-mono text-slate-500">
              <strong className="text-blue-600 font-bold">{(usedCapacityKb / 1024).toFixed(2)} MB</strong> de{' '}
              {(totalCapacityKb / 1024).toFixed(0)} MB ({usedPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, usedPercent)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 text-right font-mono tabular-nums">
            {(freeCapacityKb / 1024).toFixed(2)} MB livres · {saveBlocks.length} blocos gravados
          </div>
        </div>

        {/* Save Blocks List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700">
            Arquivos Salvos no Slot {activeSlot}
          </div>
          {saveBlocks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
              Nenhum dado salvo neste Memory Card.
            </div>
          ) : (
            <div className="space-y-2">
              {saveBlocks.map((block) => (
                <div
                  key={block.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${block.iconColor} shrink-0`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{block.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5 tabular-nums">
                        <span>{block.game}</span>
                        <span>·</span>
                        <span>{block.sizeKb} KB</span>
                        <span>·</span>
                        <span>{block.date}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSave(block.id)}
                    className="min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Excluir arquivo de save"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={handleFormat}
            className="min-h-[40px] flex items-center gap-1.5 text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 font-medium transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Formatar Slot {activeSlot}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCard}
              className="min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Exportar .ps2</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[40px] px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
