import React, { useState } from 'react';
import {
  ArrowLeft,
  Cpu,
  FileCode2,
  Activity,
  Sliders,
  Copy,
  Check,
  Code2,
  Terminal,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import {
  TEST_BENCHMARK_MATRIX,
  AUDIT_SUMMARY,
  BOTTLENECK_ANALYSIS,
  RELEVANT_FILES
} from '../../data/auditData';
import {
  DEVICE_PROFILES,
  DeviceHardwareProfile,
  DeviceProfileId,
  DetectedHardwareInfo
} from '../../data/deviceProfiles';
import { EmulatorSettings } from '../../types/settings';
import { TelemetryEstimate } from '../../hooks/useEmulatorSettings';

interface TechnicalDiagnosticsViewProps {
  onBackToLibrary: () => void;
  settings: EmulatorSettings;
  activeDevice: DeviceHardwareProfile;
  detectedHardware: DetectedHardwareInfo;
  telemetry: TelemetryEstimate;
  onUpdateSettings: (partial: Partial<EmulatorSettings>) => void;
  onSelectDeviceProfile: (id: DeviceProfileId, applyRecommended?: boolean) => void;
  generateIniConfig: () => string;
}

type TabType = 'profiler' | 'audit' | 'patches' | 'benchmarks' | 'code' | 'build';

const CPP_TOPOLOGY_SNIPPET = `// app/src/main/cpp/core/VMManager.cpp — Alocação Adaptativa de CPU
static void InitializeProcessorList() {
#if defined(__ANDROID__)
  const u64 max_cap = *std::max_element(capacities.begin(), capacities.end());
  const u64 big_threshold = (max_cap * 65) / 100;
  for (const cpuinfo_processor* proc : processors) {
    if (GetAndroidProcessorCapacity(proc) >= big_threshold)
      s_big_cores_android++; // Ex: 4 big/prime cores (Edge 60 Pro) ou 2 big (SD 750G)
    else
      s_small_cores_android++;
  }
  if (s_big_cores_android >= 3) {
    // Motorola Edge 60 Pro (Dimensity 8350 1+3+4) & Flagships
    // EE -> Prime A715 (3.35GHz), VU1 -> Perf #1, GS -> Perf #2
    si.SetBoolValue("EmuCore", "MTVU", true);
    si.SetIntValue("EmuCore/GS", "HWDownloadMode", 2); // Async Non-Blocking
    INFO_LOG("DynamIQ Multi-Core Profile: MTVU Enabled");
  } else {
    // 2+6 big.LITTLE (Adreno 619 / Intermediários)
    si.SetBoolValue("EmuCore", "MTVU", false);
    si.SetIntValue("EmuCore/GS", "HWDownloadMode", 1); // Disable Readbacks
    INFO_LOG("2+6 big.LITTLE Profile: EE->Big#0, GS->Big#1, MTVU Disabled");
  }
#endif
}`;

export const TechnicalDiagnosticsView: React.FC<TechnicalDiagnosticsViewProps> = ({
  onBackToLibrary,
  settings,
  activeDevice,
  detectedHardware,
  telemetry,
  onUpdateSettings,
  onSelectDeviceProfile,
  generateIniConfig
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profiler');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyIni = () => {
    navigator.clipboard.writeText(generateIniConfig()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const isDynamIQ = activeDevice.bigCores >= 3;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans selection:bg-blue-100 flex flex-col justify-start">
      {/* Top Bar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToLibrary}
              className="min-w-[44px] min-h-[44px] rounded-2xl bg-[#EEF2F6] hover:bg-blue-50 text-slate-700 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60 shrink-0"
              title="Voltar à Biblioteca"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                Diagnóstico &amp; Engenharia Hardware
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">
                {activeDevice.name} · {activeDevice.gpuName} · Adreno &amp; Mali
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyIni}
            className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1.5 border border-blue-200/80 transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Copiar Perfil INI Otimizado"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Exportar INI'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto mt-3 overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1">
          {[
            { id: 'profiler', label: 'Ajuste Rápido', icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: 'audit', label: 'Diagnóstico', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'patches', label: 'Motor Nativo', icon: <Code2 className="w-3.5 h-3.5" /> },
            { id: 'benchmarks', label: 'Comparativo GPU', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: 'code', label: 'Arquitetura', icon: <FileCode2 className="w-3.5 h-3.5" /> },
            { id: 'build', label: 'Sistema Android', icon: <Terminal className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#D6E3F8] text-[#1A4EA0] shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {activeTab === 'profiler' && (
          <div className="space-y-6">
            {/* Quick Device Profile Switcher Strip */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  Simular / Selecionar Dispositivo Alvo (Adreno &amp; Mali)
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  WebGL Detectado: {detectedHardware.detectedGpuLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => onSelectDeviceProfile('auto', true)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                    settings.deviceProfileId === 'auto'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Auto ({detectedHardware.detectedVendor})
                </button>
                {DEVICE_PROFILES.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => onSelectDeviceProfile(dev.id, true)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                      settings.deviceProfileId === dev.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dev.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Synchronized Hardware Telemetry Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 text-white shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-blue-200 block">
                    {activeDevice.name} · {activeDevice.soc}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    Telemetria Estimada em Tempo Real
                  </h2>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                    <span className="text-[11px] text-blue-200 font-mono block">FPS Alvo</span>
                    <span className="text-2xl font-black text-emerald-300 font-mono">
                      {telemetry.fps}
                    </span>
                  </div>
                  <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                    <span className="text-[11px] text-blue-200 font-mono block">Consumo</span>
                    <span className="text-2xl font-black text-cyan-200 font-mono">
                      {telemetry.wattage}W
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15 text-xs font-mono">
                <div className="bg-white/10 rounded-xl p-3">
                  <span className="text-blue-200 block text-[11px]">Arquitetura CPU</span>
                  <span className="font-bold leading-snug block">{activeDevice.cpuTopology}</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <span className="text-blue-200 block text-[11px]">GPU Ativa ({activeDevice.gpuVendor})</span>
                  <span className="font-bold leading-snug block">
                    {activeDevice.gpuName} ({settings.renderer.toUpperCase()})
                  </span>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <span className="text-blue-200 block text-[11px]">Memória &amp; Latência</span>
                  <span className="font-bold tabular-nums block">
                    {activeDevice.ramSpec} · {telemetry.latencyMs}ms
                  </span>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <span className="text-blue-200 block text-[11px]">Estado Térmico</span>
                  <span className="font-bold text-emerald-300 block">{telemetry.thermalRisk}</span>
                </div>
              </div>
            </div>

            {/* Interactive Hardware Tuning synchronized directly with global settings */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Ajuste Direto do Motor EmuStation</span>
                </h3>
                <span className="text-xs text-slate-500">Alterações salvas automaticamente</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    API Gráfica ({activeDevice.gpuName})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdateSettings({ renderer: 'vulkan' })}
                      className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        settings.renderer === 'vulkan'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Vulkan 1.3 (Recomendado)
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ renderer: 'opengl' })}
                      className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        settings.renderer === 'opengl'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      OpenGL ES 3.2
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{activeDevice.driverNote}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Resolução Interna: <span className="text-blue-600 font-mono">{settings.upscale}x ({Math.round(640 * settings.upscale)}×{Math.round(448 * settings.upscale)})</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1.0, 1.25, 1.5, 2.0, 2.5].map((val) => (
                      <button
                        key={val}
                        onClick={() => onUpdateSettings({ upscale: val })}
                        className={`min-h-[44px] py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          settings.upscale === val
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {activeDevice.bandwidthGbps >= 40
                      ? `Banda ${activeDevice.ramSpec} (${activeDevice.bandwidthGbps} GB/s) suporta 2.0x–2.5x com folga.`
                      : `Banda ${activeDevice.ramSpec} (${activeDevice.bandwidthGbps} GB/s): 1.0x–1.25x recomendado para 60 FPS estáveis.`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-between gap-4 md:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      MTVU (Multi-Threaded VU1) — {activeDevice.bigCores} Núcleos Performance/Prime
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isDynamIQ
                        ? `${activeDevice.affinitySummary} — MTVU recomendado neste aparelho.`
                        : `${activeDevice.affinitySummary} — Desative MTVU em SoCs com apenas 2 Big Cores.`}
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ mtvu: !settings.mtvu })}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      settings.mtvu === isDynamIQ
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {settings.mtvu ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      HW Download Mode ({activeDevice.gpuVendor} TBDR)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Controla readbacks do framebuffer entre GPU e memória unificada.
                    </p>
                  </div>
                  <select
                    value={settings.hwDownloadMode}
                    onChange={(e) => onUpdateSettings({ hwDownloadMode: Number(e.target.value) })}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value={1}>1 · Desabilitar Readbacks (Ideal Adreno 6xx / Mali Mid)</option>
                    <option value={2}>2 · Assíncrono Multi-Queue (Ideal Edge 60 Pro / Flagships)</option>
                    <option value={0}>0 · Sincronizado (Preciso / Pesado)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Diagnóstico Multi-Dispositivo Adreno &amp; Mali
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-mono text-blue-600 font-semibold">{AUDIT_SUMMARY.engineName}</span> · {AUDIT_SUMMARY.architecture} · Versão {AUDIT_SUMMARY.version}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {BOTTLENECK_ANALYSIS.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 leading-snug">{item.title}</span>
                    <span className="text-[11px] font-mono font-bold text-amber-700 shrink-0">
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.symptom}</p>
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-950 leading-relaxed">
                    <strong>Otimização ativa:</strong> {item.solution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'patches' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Escalonamento Nativo &amp; Detecção Multi-Dispositivo
                </h3>
                <p className="text-xs text-slate-500">
                  Suporte nativo a Dimensity 8350 Extreme (Motorola Edge 60 Pro · Mali-G615), Adreno 6xx/7xx/8xx e Mali/Immortalis
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-bold">
                Otimização Ativa
              </span>
            </div>

            <div className="p-4 bg-slate-950 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
              <pre>{CPP_TOPOLOGY_SNIPPET}</pre>
            </div>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Matriz Comparativa Adreno &amp; Mali
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo entre Intermediários (Adreno 619 / Mali-G57), Motorola Edge 60 Pro (Mali-G615) e Flagships
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {TEST_BENCHMARK_MATRIX.map((item, idx) => (
                <div
                  key={idx}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-4 gap-3 items-center"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.game}</h4>
                    <span className="text-xs text-slate-500">{item.genre}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/60">
                    <span className="text-[10px] text-slate-500 block font-semibold">
                      Adreno 619 / Mali Mid
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800">{item.adrenoMid}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70">
                    <span className="text-[10px] text-blue-700 block font-semibold">
                      Motorola Edge 60 Pro
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-900">{item.edge60Pro}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                    <span className="text-[10px] text-emerald-700 block font-semibold">
                      Flagships (8 Gen 3 / D9400)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-900">{item.flagship}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Módulos Principais do Sistema
              </h3>
              <p className="text-xs text-slate-500">
                {RELEVANT_FILES.length} componentes do motor gráfico e controle de hardware multi-dispositivo
              </p>
            </div>

            <div className="space-y-2.5">
              {RELEVANT_FILES.map((file, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="text-xs font-bold text-blue-700 font-mono break-all">{file.path}</code>
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      {file.impactLevel} · {file.lines} linhas · {file.module}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{file.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'build' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Compilação do APK Universal ARM64 (Adreno &amp; Mali)
              </h3>
              <p className="text-xs text-slate-500">
                Pipeline Gradle {AUDIT_SUMMARY.gradleVersion} · Android NDK {AUDIT_SUMMARY.ndkVersion} · {AUDIT_SUMMARY.pageSize}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900 block">1. Ferramentas &amp; Compatibilidade Android 15 (16KB Pages)</span>
                <p className="text-slate-600">
                  Android Studio, NDK {AUDIT_SUMMARY.ndkVersion}, CMake {AUDIT_SUMMARY.cmakeVersion}, {AUDIT_SUMMARY.javaCompatibility}. O alinhamento de página 16KB garante execução nativa no Motorola Edge 60 Pro (Android 15) e aparelhos Galaxy/Pixel/Xiaomi recentes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
                <span className="font-bold text-slate-900 block">2. Comando de Compilação Release Universal</span>
                <div className="p-3 bg-slate-950 text-cyan-300 rounded-xl font-mono text-xs overflow-x-auto">
                  ./gradlew assembleRelease -PtargetArch=arm64-v8a -PpageAlignment16kb=true
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-900 block">3. Saída do Pacote APK</span>
                <p className="text-slate-600 font-mono break-all">
                  app/build/outputs/apk/release/EmuStation-v0.5.0-universal-arm64.apk
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

