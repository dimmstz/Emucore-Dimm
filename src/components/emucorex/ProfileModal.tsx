import React from 'react';
import { User, Cpu, Smartphone, HardDrive, Activity, X, Trash2 } from 'lucide-react';
import {
  DEVICE_PROFILES,
  DeviceHardwareProfile,
  DeviceProfileId,
  DetectedHardwareInfo
} from '../../data/deviceProfiles';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamesCount: number;
  selectedProfileId: DeviceProfileId;
  activeDevice: DeviceHardwareProfile;
  detectedHardware: DetectedHardwareInfo;
  onSelectDeviceProfile: (id: DeviceProfileId, applyRecommended?: boolean) => void;
  onNotify?: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  gamesCount,
  selectedProfileId,
  activeDevice,
  detectedHardware,
  onSelectDeviceProfile,
  onNotify
}) => {
  if (!isOpen) return null;

  const handleClearCache = () => {
    localStorage.removeItem('emucorex_control_positions');
    onNotify?.('Cache de shaders e posições de controle limpo com sucesso.');
  };

  const badgeText =
    activeDevice.gpuVendor === 'MALI'
      ? 'MALI'
      : activeDevice.gpuVendor === 'ADRENO'
      ? 'ADRENO'
      : 'ARM64';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                Perfil do Dispositivo
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate">
                {activeDevice.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Hardware Identity Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-black tracking-tight shadow-md shrink-0">
            {badgeText}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">{activeDevice.name}</h3>
            <span className="text-[11px] text-emerald-700 font-semibold font-mono block truncate">
              {activeDevice.gpuName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block truncate">
              {selectedProfileId === 'auto' ? 'Modo Automático · ' : 'Perfil Manual · '}
              {detectedHardware.cpuThreads} Threads · Browser GPU: {detectedHardware.detectedGpuLabel}
            </span>
          </div>
        </div>

        {/* Target Device Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 block">
            Dispositivo / Arquitetura Alvo (Adreno &amp; Mali)
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => {
              const id = e.target.value as DeviceProfileId;
              onSelectDeviceProfile(id, true);
              const label =
                id === 'auto'
                  ? 'Detecção Automática'
                  : DEVICE_PROFILES.find((p) => p.id === id)?.name || id;
              onNotify?.(`Perfil calibrado para: ${label}.`);
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] text-xs font-bold text-slate-800 cursor-pointer"
          >
            <option value="auto">
              Automático (Detectado: {detectedHardware.detectedVendor} · {detectedHardware.cpuThreads} cores)
            </option>
            {DEVICE_PROFILES.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name} — {dev.gpuName}
              </option>
            ))}
          </select>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Processador (SoC)</span>
            </div>
            <span className="font-bold text-slate-900 block leading-snug">{activeDevice.soc}</span>
            <span className="text-[10px] text-slate-500 font-mono block leading-tight">
              {activeDevice.cpuTopology}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-purple-600" />
              <span>Memória &amp; Banda</span>
            </div>
            <span className="font-bold text-slate-900 block">{activeDevice.ramSpec}</span>
            <span className="text-[10px] text-slate-500 font-mono">
              ~{activeDevice.bandwidthGbps}.0 GB/s · TDP {activeDevice.thermalBudgetW}W
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Afinidade Recomendada</span>
            </div>
            <span className="font-bold text-slate-900 block">
              {activeDevice.bigCores >= 3 ? 'DynamIQ (MTVU On)' : '2+6 big.LITTLE (MTVU Off)'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono leading-tight block">
              {activeDevice.affinitySummary}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Jogos na Biblioteca</span>
            </div>
            <span className="font-bold text-slate-900 block">{gamesCount} Títulos</span>
            <span className="text-[10px] text-slate-500 font-mono">
              Display até {activeDevice.displayHz} Hz
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 bg-blue-50/70 border border-blue-100 rounded-2xl p-3 leading-relaxed">
          {activeDevice.driverNote}
        </p>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handleClearCache}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Limpar Cache</span>
          </button>
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

