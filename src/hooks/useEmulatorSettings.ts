import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  EmulatorSettings,
  DEFAULT_EMULATOR_SETTINGS,
  PerformancePreset
} from '../types/settings';
import { ControlsConfig } from '../components/emucorex/VectorTouchControls';
import {
  DeviceProfileId,
  DeviceHardwareProfile,
  DetectedHardwareInfo,
  detectBrowserHardware,
  resolveDeviceProfile
} from '../data/deviceProfiles';

const STORAGE_KEY = 'emucorex_unified_settings_v2';
const LEGACY_STORAGE_KEY = 'emucorex_unified_settings_v1';

export interface TelemetryEstimate {
  score: number;
  fps: number;
  latencyMs: number;
  wattage: number;
  thermalRisk: 'Excelente' | 'Moderado' | 'Alto (Throttling)';
}

export function useEmulatorSettings() {
  const detectedHardware: DetectedHardwareInfo = useMemo(() => detectBrowserHardware(), []);

  const [settings, setSettings] = useState<EmulatorSettings>(() => {
    const initialDevice = resolveDeviceProfile('auto', detectedHardware);
    const calibratedDefaults: EmulatorSettings = {
      ...DEFAULT_EMULATOR_SETTINGS,
      deviceProfileId: 'auto',
      preset: 'device-optimal',
      ...initialDevice.recommendedSettings
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate legacy m23-optimal preset seamlessly
        const migratedPreset: PerformancePreset =
          parsed.preset === 'm23-optimal' ? 'device-optimal' : parsed.preset || 'device-optimal';
        const migratedDeviceId: DeviceProfileId =
          parsed.deviceProfileId || (parsed.preset === 'm23-optimal' ? 'auto' : 'auto');

        return {
          ...calibratedDefaults,
          ...parsed,
          deviceProfileId: migratedDeviceId,
          preset: migratedPreset,
          controls: {
            ...DEFAULT_EMULATOR_SETTINGS.controls,
            ...(parsed.controls || {})
          },
          patches:
            Array.isArray(parsed.patches) && parsed.patches.length > 0
              ? parsed.patches
              : DEFAULT_EMULATOR_SETTINGS.patches
        };
      }
    } catch {
      // Fallback to calibrated defaults if storage unavailable or corrupted
    }
    return calibratedDefaults;
  });

  const activeDevice: DeviceHardwareProfile = useMemo(
    () => resolveDeviceProfile(settings.deviceProfileId, detectedHardware),
    [settings.deviceProfileId, detectedHardware]
  );

  // Persist automatically on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore quota errors
    }
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<EmulatorSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
      preset: partial.preset ?? 'custom'
    }));
  }, []);

  const selectDeviceProfile = useCallback(
    (deviceProfileId: DeviceProfileId, applyRecommended = true) => {
      const resolved = resolveDeviceProfile(deviceProfileId, detectedHardware);
      setSettings((prev) => ({
        ...prev,
        deviceProfileId,
        ...(applyRecommended
          ? {
              preset: 'device-optimal' as PerformancePreset,
              ...resolved.recommendedSettings,
              eeCycleSkip: 0,
              fastmemMode: 'DirectHostVirtual',
              audioBackend: 'aaudio',
              audioSync: 'timestretch'
            }
          : {})
      }));
    },
    [detectedHardware]
  );

  const updateControls = useCallback((partial: Partial<ControlsConfig>) => {
    setSettings((prev) => ({
      ...prev,
      controls: {
        ...prev.controls,
        ...partial
      }
    }));
  }, []);

  const togglePatch = useCallback((patchId: string) => {
    setSettings((prev) => ({
      ...prev,
      patches: prev.patches.map((p) =>
        p.id === patchId ? { ...p, enabled: !p.enabled } : p
      )
    }));
  }, []);

  const applyPreset = useCallback(
    (preset: Exclude<PerformancePreset, 'custom'>) => {
      setSettings((prev) => {
        const device = resolveDeviceProfile(prev.deviceProfileId, detectedHardware);
        if (preset === 'device-optimal') {
          return {
            ...prev,
            preset: 'device-optimal',
            ...device.recommendedSettings,
            bilinearFiltering: true,
            eeCycleSkip: 0,
            fastmemMode: 'DirectHostVirtual',
            audioBackend: 'aaudio',
            audioSync: 'timestretch'
          };
        }
        if (preset === 'high-quality') {
          const highUpscale = device.bigCores >= 3 ? 2.5 : 1.5;
          return {
            ...prev,
            preset: 'high-quality',
            renderer: 'vulkan',
            upscale: highUpscale,
            hwDownloadMode: 2,
            bilinearFiltering: true,
            vsyncQueue: 1,
            fxaa: true,
            mtvu: device.bigCores >= 3,
            eeCycleRate: 0,
            eeCycleSkip: 0,
            fastmemMode: 'DirectHostVirtual',
            audioBackend: 'aaudio',
            audioSync: 'timestretch'
          };
        }
        // battery-saver
        return {
          ...prev,
          preset: 'battery-saver',
          renderer: 'vulkan',
          upscale: 1.0,
          hwDownloadMode: 1,
          bilinearFiltering: false,
          vsyncQueue: 1,
          fxaa: false,
          mtvu: device.bigCores >= 4,
          eeCycleRate: -1,
          eeCycleSkip: 1,
          fastmemMode: 'DirectHostVirtual',
          audioBackend: 'oboe',
          audioSync: 'async'
        };
      });
    },
    [detectedHardware]
  );

  const resetAllSettings = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem('emucorex_control_positions');
    } catch {
      // Ignore
    }
    const defaultDevice = resolveDeviceProfile('auto', detectedHardware);
    setSettings({
      ...DEFAULT_EMULATOR_SETTINGS,
      deviceProfileId: 'auto',
      preset: 'device-optimal',
      ...defaultDevice.recommendedSettings
    });
  }, [detectedHardware]);

  const generateIniConfig = useCallback((): string => {
    const isDynamIQ = activeDevice.bigCores >= 3;
    const eeMask = isDynamIQ
      ? '0x80 ; Prime Core (EE)'
      : '0xC0 ; Big Cores (EE/GS)';
    const gsMask = isDynamIQ
      ? '0x40 ; Perf Core #2 (GS)'
      : '0x40 ; Big Core #1 (GS)';

    return `[EmuStation.${activeDevice.id}]
DeviceProfile = ${activeDevice.name}
SoC = ${activeDevice.soc}
GPU = ${activeDevice.gpuName}
GpuVendor = ${activeDevice.gpuVendor}
Preset = ${settings.preset}
BiosRegion = ${settings.biosRegion}
FastBoot = ${settings.fastBoot ? 'true' : 'false'}
AspectRatio = ${settings.widescreen16x9 ? '16:9' : '4:3'}

[EmuCore/GS]
Renderer = ${settings.renderer.toUpperCase()}
UpscaleMultiplier = ${settings.upscale}
HWDownloadMode = ${settings.hwDownloadMode}
BilinearFiltering = ${settings.bilinearFiltering ? '2' : '0'}
VsyncQueueSize = ${settings.vsyncQueue}
FXAA = ${settings.fxaa ? 'true' : 'false'}

[EmuCore/CPU]
MTVU_MultiThreadedVU1 = ${settings.mtvu ? 'true' : 'false'}
EECycleRate = ${settings.eeCycleRate}
EECycleSkip = ${settings.eeCycleSkip}
CPU_AffinityMask_EE = ${eeMask}
CPU_AffinityMask_GS = ${gsMask}
FastmemAlloc = ${settings.fastmemMode}

[SPU2/Output]
Backend = ${settings.audioBackend.toUpperCase()}
Volume = ${settings.audioMuted ? 0 : settings.masterVolume}
SyncMode = ${settings.audioSync}
`;
  }, [settings, activeDevice]);

  // Dynamic Multi-Device Telemetry Estimator (Adreno & Mali)
  const telemetry: TelemetryEstimate = useMemo(() => {
    const isHighBandwidth = activeDevice.bandwidthGbps >= 40;
    const isDynamIQ = activeDevice.bigCores >= 3;

    let baseScore = isDynamIQ ? 132 : 100;
    let inputLatencyMs = (isDynamIQ ? 24 : 36) + settings.vsyncQueue * 12;
    let thermalWattage = isDynamIQ ? 4.2 : 3.1;

    if (settings.renderer === 'vulkan') {
      baseScore += 18;
      thermalWattage += 0.3;
    } else {
      baseScore -= activeDevice.gpuVendor === 'MALI' ? 12 : 16;
      thermalWattage += 0.7;
      inputLatencyMs += 8;
    }

    if (settings.upscale === 1.0) {
      baseScore += 14;
    } else if (settings.upscale === 1.25) {
      baseScore -= isHighBandwidth ? 2 : 7;
      thermalWattage += 0.35;
    } else if (settings.upscale === 1.5) {
      baseScore -= isHighBandwidth ? 6 : 22;
      thermalWattage += isHighBandwidth ? 0.6 : 1.1;
    } else if (settings.upscale === 2.0) {
      baseScore -= isHighBandwidth ? 12 : 46;
      thermalWattage += isHighBandwidth ? 1.1 : 2.1;
    } else if (settings.upscale >= 2.5) {
      baseScore -= isHighBandwidth ? 24 : 62;
      thermalWattage += isHighBandwidth ? 1.7 : 2.7;
    }

    if (settings.fxaa) {
      baseScore -= isHighBandwidth ? 2 : 5;
      thermalWattage += 0.15;
    }

    if (isDynamIQ) {
      // 3+ Big/Prime cores (Motorola Edge 60 Pro, Flagships) benefit directly from MTVU
      if (settings.mtvu) {
        baseScore += 20;
        thermalWattage += 0.4;
      } else {
        baseScore -= 14;
      }
    } else {
      // 2-Big Core SoCs suffer GS starvation with MTVU enabled
      if (settings.mtvu) {
        baseScore -= 28;
        thermalWattage += 0.9;
      } else {
        baseScore += 18;
      }
    }

    if (settings.hwDownloadMode === 1) {
      baseScore += isHighBandwidth ? 10 : 22;
      thermalWattage -= 0.2;
    } else if (settings.hwDownloadMode === 2) {
      baseScore += isHighBandwidth ? 18 : 12;
      thermalWattage += 0.1;
    }

    if (settings.eeCycleRate < 0) {
      baseScore += 8;
      thermalWattage -= 0.3;
    } else if (settings.eeCycleRate > 0) {
      baseScore -= 8;
      thermalWattage += 0.5;
    }

    const estimatedFps = Math.min(60.0, Math.max(24.0, (baseScore / 100) * 46.5));
    const maxSafeWatt = activeDevice.thermalBudgetW;
    const thermalRisk: TelemetryEstimate['thermalRisk'] =
      thermalWattage > maxSafeWatt + 0.7
        ? 'Alto (Throttling)'
        : thermalWattage > maxSafeWatt - 0.1
        ? 'Moderado'
        : 'Excelente';

    return {
      score: Math.round(baseScore),
      fps: Number(estimatedFps.toFixed(1)),
      latencyMs: inputLatencyMs,
      wattage: Number(thermalWattage.toFixed(1)),
      thermalRisk
    };
  }, [settings, activeDevice]);

  return {
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
  };
}

