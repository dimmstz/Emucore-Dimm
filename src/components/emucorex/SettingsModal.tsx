import React, { useState } from 'react';
import {
  Settings,
  X,
  Monitor,
  Cpu,
  Volume2,
  Gamepad2,
  Sliders,
  Check,
  Copy,
  Download,
  RotateCcw,
  VolumeX,
  Smartphone
} from 'lucide-react';
import { EmulatorSettings, PerformancePreset } from '../../types/settings';
import { TelemetryEstimate } from '../../hooks/useEmulatorSettings';
import {
  DEVICE_PROFILES,
  DeviceHardwareProfile,
  DeviceProfileId,
  DetectedHardwareInfo
} from '../../data/deviceProfiles';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EmulatorSettings;
  activeDevice: DeviceHardwareProfile;
  detectedHardware: DetectedHardwareInfo;
  telemetry: TelemetryEstimate;
  onUpdateSettings: (partial: Partial<EmulatorSettings>) => void;
  onSelectDeviceProfile: (id: DeviceProfileId, applyRecommended?: boolean) => void;
  onApplyPreset: (preset: Exclude<PerformancePreset, 'custom'>) => void;
  onResetAll: () => void;
  onOpenControlsModal: () => void;
  generateIniConfig: () => string;
  onNotify?: (msg: string) => void;
}

type SettingsTab = 'general' | 'graphics' | 'cpu' | 'audio' | 'controls';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  activeDevice,
  detectedHardware,
  telemetry,
  onUpdateSettings,
  onSelectDeviceProfile,
  onApplyPreset,
  onResetAll,
  onOpenControlsModal,
  generateIniConfig,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [copiedIni, setCopiedIni] = useState(false);

  if (!isOpen) return null;

  const handleCopyIni = () => {
    navigator.clipboard.writeText(generateIniConfig()).then(() => {
      setCopiedIni(true);
      setTimeout(() => setCopiedIni(false), 2000);
      onNotify?.(`Perfil .ini (${activeDevice.shortName}) copiado.`);
    });
  };

  const handleDownloadIni = () => {
    const blob = new Blob([generateIniConfig()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EmuStation_${activeDevice.id}_${settings.preset}.ini`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify?.(`Arquivo EmuStation_${activeDevice.id}.ini baixado.`);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'Geral', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'graphics', label: 'Gráficos', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'cpu', label: 'Desempenho', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'audio', label: 'Áudio', icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: 'controls', label: 'Controles', icon: <Gamepad2 className="w-3.5 h-3.5" /> }
  ];

  const presets: { id: Exclude<PerformancePreset, 'custom'>; label: string; sub: string }[] = [
    {
      id: 'device-optimal',
      label: `Recomendado (${activeDevice.shortName})`,
      sub: `Vulkan · ${activeDevice.recommendedSettings.upscale}x · ${activeDevice.recommendedSettings.mtvu ? 'Multi-Thread Ativo' : 'Modo Padrão'}`
    },
    {
      id: 'high-quality',
      label: 'Alta Qualidade',
      sub: `Vulkan · ${activeDevice.bigCores >= 3 ? '2.5x' : '1.5x'} · Bordas Suaves`
    },
    {
      id: 'battery-saver',
      label: 'Economia de Bateria',
      sub: 'Menor consumo · 1.0x'
    }
  ];

  const isDynamIQ = activeDevice.bigCores >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                Configurações
              </h2>
              <p className="text-xs text-slate-500 font-mono tabular-nums truncate">
                {activeDevice.shortName} · {telemetry.fps} FPS est. · {telemetry.wattage}W · {telemetry.thermalRisk}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 pb-2 bg-[#F8FAFC] border-b border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#D6E3F8] text-[#1A4EA0] shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Hardware Device Selector + Presets */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Aparelho / Perfil de Desempenho
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {activeDevice.gpuVendor} · {activeDevice.bandwidthGbps} GB/s
                </span>
              </div>
              <select
                value={settings.deviceProfileId}
                onChange={(e) => {
                  const id = e.target.value as DeviceProfileId;
                  onSelectDeviceProfile(id, true);
                  const label =
                    id === 'auto'
                      ? 'Auto'
                      : DEVICE_PROFILES.find((p) => p.id === id)?.shortName || id;
                  onNotify?.(`Perfil calibrado para ${label}.`);
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="auto">
                  Automático (Detectado: {detectedHardware.detectedGpuLabel})
                </option>
                {DEVICE_PROFILES.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} — {dev.gpuName} ({dev.soc.split('(')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Modo de Desempenho</span>
              <span className="text-[11px] font-mono text-slate-400">
                {settings.preset === 'custom' ? 'Personalizado' : 'Calibrado'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presets.map((p) => {
                const active = settings.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onApplyPreset(p.id)}
                    className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-50/90 border-blue-500 text-blue-950 shadow-2xs'
                        : 'bg-[#F8FAFC] border-slate-200/80 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{p.label}</span>
                      {active && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{p.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* =====================================================================
              TAB 1: GERAL & SISTEMA
             ===================================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* BIOS Region */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Região da BIOS
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SCPH-39001', label: 'EUA', sub: 'NTSC-U' },
                    { id: 'SCPH-50004', label: 'Europa', sub: 'PAL' },
                    { id: 'SCPH-70000', label: 'Japão', sub: 'NTSC-J' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onUpdateSettings({ biosRegion: b.id as EmulatorSettings['biosRegion'] })}
                      className={`min-h-[44px] p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        settings.biosRegion === b.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold block">{b.label}</span>
                      <span className={`text-[10px] ${settings.biosRegion === b.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        {b.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 cursor-pointer min-h-[56px]">
                  <div className="pr-4">
                    <span className="text-xs font-bold text-slate-900 block">Pular Abertura da BIOS</span>
                    <span className="text-[11px] text-slate-500">Inicia o jogo diretamente sem a tela inicial do console</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.fastBoot}
                    onChange={(e) => onUpdateSettings({ fastBoot: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 cursor-pointer min-h-[56px]">
                  <div className="pr-4">
                    <span className="text-xs font-bold text-slate-900 block">Tela Widescreen (16:9)</span>
                    <span className="text-[11px] text-slate-500">Expande a imagem para preencher telas panorâmicas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.widescreen16x9}
                    onChange={(e) => onUpdateSettings({ widescreen16x9: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 cursor-pointer min-h-[56px]">
                  <div className="pr-4">
                    <span className="text-xs font-bold text-slate-900 block">Mostrar FPS na Tela</span>
                    <span className="text-[11px] text-slate-500">Exibe o contador de desempenho durante o jogo</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showFpsHud}
                    onChange={(e) => onUpdateSettings({ showFpsHud: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: GRÁFICOS (GS / ADRENO & MALI)
             ===================================================================== */}
          {activeTab === 'graphics' && (
            <div className="space-y-4">
              {/* Renderer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Motor Gráfico ({activeDevice.gpuName})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ renderer: 'vulkan' })}
                    className={`min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      settings.renderer === 'vulkan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Vulkan (Recomendado)
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ renderer: 'opengl' })}
                    className={`min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      settings.renderer === 'opengl'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    OpenGL ES
                  </button>
                </div>
              </div>

              {/* Upscale */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Qualidade de Imagem (Resolução): <span className="text-blue-600 font-mono">{settings.upscale}x ({Math.round(640 * settings.upscale)}×{Math.round(448 * settings.upscale)})</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1.0, 1.25, 1.5, 2.0, 2.5].map((val) => (
                    <button
                      key={val}
                      onClick={() => onUpdateSettings({ upscale: val })}
                      className={`min-h-[44px] py-2 rounded-2xl text-xs font-bold font-mono transition-all cursor-pointer ${
                        settings.upscale === val
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* HW Download Mode */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Leitura de Memória de Vídeo</span>
                  <span className="text-[11px] text-slate-500">
                    {activeDevice.bandwidthGbps >= 40
                      ? 'Modo Assíncrono recomendado para seu aparelho'
                      : 'Modo Rápido evita gargalos e aumenta o FPS'}
                  </span>
                </div>
                <select
                  value={settings.hwDownloadMode}
                  onChange={(e) => onUpdateSettings({ hwDownloadMode: Number(e.target.value) })}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value={1}>Rápido (Menos Travamentos)</option>
                  <option value={2}>Assíncrono (Equilibrado)</option>
                  <option value={0}>Sincronizado (Máxima Precisão)</option>
                </select>
              </div>

              {/* VSync Queue */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Sincronização de Tela ({activeDevice.displayHz}Hz)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Resposta rápida reduz o atraso dos comandos na tela
                  </span>
                </div>
                <select
                  value={settings.vsyncQueue}
                  onChange={(e) => onUpdateSettings({ vsyncQueue: Number(e.target.value) })}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value={0}>Resposta Rápida (Recomendado)</option>
                  <option value={1}>Buffer Duplo</option>
                  <option value={2}>Buffer Triplo</option>
                </select>
              </div>

              {/* Bilinear + FXAA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 cursor-pointer min-h-[56px]">
                  <span className="text-xs font-bold text-slate-800">Suavização de Texturas</span>
                  <input
                    type="checkbox"
                    checked={settings.bilinearFiltering}
                    onChange={(e) => onUpdateSettings({ bilinearFiltering: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 cursor-pointer min-h-[56px]">
                  <span className="text-xs font-bold text-slate-800">Suavização de Bordas (FXAA)</span>
                  <input
                    type="checkbox"
                    checked={settings.fxaa}
                    onChange={(e) => onUpdateSettings({ fxaa: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: CPU & ARQUITETURA ADAPTATIVA
             ===================================================================== */}
          {activeTab === 'cpu' && (
            <div className="space-y-4">
              {/* MTVU Switch */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Processamento Multi-Thread (MTVU)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {isDynamIQ
                      ? `Recomendado para o ${activeDevice.shortName}: distribui tarefas pesadas em vários núcleos de desempenho.`
                      : `No ${activeDevice.shortName}, manter desativado evita perda de velocidade em jogos pesados.`}
                  </p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ mtvu: !settings.mtvu })}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    settings.mtvu === isDynamIQ
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {settings.mtvu ? 'Ativado' : 'Desativado'}
                </button>
              </div>

              {/* EE Cycle Rate */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Velocidade do Processador
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: -2, label: '50%' },
                    { val: -1, label: '75%' },
                    { val: 0, label: '100% (Padrão)' },
                    { val: 1, label: '130%' }
                  ].map((rate) => (
                    <button
                      key={rate.val}
                      onClick={() => onUpdateSettings({ eeCycleRate: rate.val })}
                      className={`min-h-[44px] py-2 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        settings.eeCycleRate === rate.val
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* EE Cycle Skip */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Pulo de Ciclos (Aceleração)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: 'Desligado' },
                    { val: 1, label: 'Moderado' },
                    { val: 2, label: 'Alto' }
                  ].map((skip) => (
                    <button
                      key={skip.val}
                      onClick={() => onUpdateSettings({ eeCycleSkip: skip.val })}
                      className={`min-h-[44px] py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        settings.eeCycleSkip === skip.val
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {skip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fastmem */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Gerenciamento de Memória</span>
                  <span className="text-[11px] text-slate-500">Otimizado para Android moderno (4KB / 16KB)</span>
                </div>
                <select
                  value={settings.fastmemMode}
                  onChange={(e) => onUpdateSettings({ fastmemMode: e.target.value as EmulatorSettings['fastmemMode'] })}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="DirectHostVirtual">Acesso Rápido (Recomendado)</option>
                  <option value="Mmap">Compatibilidade Ampliada</option>
                </select>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: ÁUDIO
             ===================================================================== */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              {/* Volume Slider */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.audioMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs font-bold text-slate-900">Volume Principal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">
                      {settings.audioMuted ? 'Mudo' : `${settings.masterVolume}%`}
                    </span>
                    <button
                      onClick={() => onUpdateSettings({ audioMuted: !settings.audioMuted })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                        settings.audioMuted
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {settings.audioMuted ? 'Ativar Som' : 'Mutar'}
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={settings.audioMuted}
                  value={settings.masterVolume}
                  onChange={(e) => onUpdateSettings({ masterVolume: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Audio Backend */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Saída de Áudio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'aaudio', label: 'AAudio', sub: 'Baixa Latência' },
                    { id: 'oboe', label: 'Oboe', sub: 'Automático' },
                    { id: 'opensles', label: 'OpenSL ES', sub: 'Compatível' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onUpdateSettings({ audioBackend: b.id as EmulatorSettings['audioBackend'] })}
                      className={`min-h-[44px] p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        settings.audioBackend === b.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold block">{b.label}</span>
                      <span className={`text-[10px] ${settings.audioBackend === b.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        {b.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sync Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Sincronização de Áudio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ audioSync: 'timestretch' })}
                    className={`min-h-[44px] py-2.5 px-3 rounded-2xl text-xs font-bold cursor-pointer ${
                      settings.audioSync === 'timestretch'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#F8FAFC] text-slate-700 border border-slate-200'
                    }`}
                  >
                    Suave (Sem cortes)
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ audioSync: 'async' })}
                    className={`min-h-[44px] py-2.5 px-3 rounded-2xl text-xs font-bold cursor-pointer ${
                      settings.audioSync === 'async'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#F8FAFC] text-slate-700 border border-slate-200'
                    }`}
                  >
                    Leve (Mais FPS)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: CONTROLES & GAMEPAD
             ===================================================================== */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estilo dos Botões:</span>
                  <span className="font-bold text-slate-900 capitalize">{settings.controls.style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Opacidade / Tamanho:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {Math.round(settings.controls.opacity * 100)}% · {Math.round(settings.controls.scale * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vibração ao Tocar:</span>
                  <span className="font-bold text-slate-900">{settings.controls.haptics ? 'Ativa' : 'Desativada'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenControlsModal();
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Personalizar Controles na Tela e Gamepad</span>
              </button>
            </div>
          )}
        </div>

        {/* Sticky Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-100 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResetAll();
                onNotify?.(`Configurações restauradas para detecção automática (${activeDevice.shortName}).`);
              }}
              className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              onClick={handleCopyIni}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar EmuStation.ini"
            >
              {copiedIni ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIni ? 'Copiado' : 'Copiar .INI'}</span>
            </button>

            <button
              onClick={handleDownloadIni}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 hidden sm:flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Baixar arquivo .ini"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar .INI</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

