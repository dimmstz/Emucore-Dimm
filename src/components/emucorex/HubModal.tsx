import React from 'react';
import { Calendar, X, Flame, Layers } from 'lucide-react';
import { BiosRegion, HubPatchItem } from '../../types/settings';

interface HubModalProps {
  isOpen: boolean;
  onClose: () => void;
  patches: HubPatchItem[];
  biosRegion: BiosRegion;
  onTogglePatch: (patchId: string) => void;
  onNotify?: (msg: string) => void;
}

export const HubModal: React.FC<HubModalProps> = ({
  isOpen,
  onClose,
  patches,
  biosRegion,
  onTogglePatch,
  onNotify
}) => {
  if (!isOpen) return null;

  const biosLabelMap: Record<BiosRegion, string> = {
    'SCPH-39001': 'Sony PlayStation 2 BIOS SCPH-39001 (USA v01.60)',
    'SCPH-50004': 'Sony PlayStation 2 BIOS SCPH-50004 (EUR v01.90)',
    'SCPH-70000': 'Sony PlayStation 2 BIOS SCPH-70000 (JPN v02.00)'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Central de Patches</h2>
              <p className="text-xs text-slate-500">Ajustes de desempenho e BIOS configurada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Featured Card */}
        <div className="p-4 bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-200 font-mono">
            <span>Atualização Oficial v0.5.0</span>
            <span>Build 204</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Motor Multi-Dispositivo Adreno &amp; Mali Vulkan
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pipeline gráfico Vulkan 1.3 com detecção automática para Motorola Edge 60 Pro (Dimensity 8350 · Mali-G615), Galaxy M23 (Adreno 619), Snapdragon Flagships e GPUs Immortalis, com afinidade adaptativa e páginas de 16KB no Android 15.
          </p>
        </div>

        {/* Section 1: Interactive Patches */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Patches de 60 FPS &amp; Widescreen ({patches.filter((p) => p.enabled).length} ativos)</span>
          </div>

          <div className="space-y-2">
            {patches.map((patch) => (
              <label
                key={patch.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition-all min-h-[60px] ${
                  patch.enabled
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900">{patch.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {patch.gameSerial} · {patch.author} — {patch.description}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={patch.enabled}
                  onChange={() => {
                    onTogglePatch(patch.id);
                    onNotify?.(
                      `${patch.title.split('—')[0].trim()} ${!patch.enabled ? 'ativado' : 'desativado'}.`
                    );
                  }}
                  className="w-5 h-5 accent-emerald-600 rounded shrink-0 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Active BIOS */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>BIOS Configurada</span>
          </div>
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>{biosLabelMap[biosRegion]}</span>
              <span className="text-[11px] font-mono text-blue-700">Ativa</span>
            </div>
            <p className="text-[11px] text-blue-800/80">
              Checksum CRC32 validado. Você pode alternar a região da BIOS em Configurações → Geral.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
