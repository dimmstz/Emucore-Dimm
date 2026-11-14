export type DeviceProfileId =
  | 'auto'
  | 'motorola-edge-60-pro'
  | 'galaxy-m23-5g'
  | 'adreno-flagship'
  | 'mali-flagship'
  | 'adreno-midrange'
  | 'mali-midrange';

export type GpuVendorType = 'ADRENO' | 'MALI' | 'AUTO';

export interface DeviceHardwareProfile {
  id: DeviceProfileId;
  name: string;
  shortName: string;
  brand: string;
  soc: string;
  cpuTopology: string;
  bigCores: number;
  gpuName: string;
  gpuVendor: GpuVendorType;
  gpuTier: 'GREEN' | 'YELLOW' | 'BLUE';
  ramSpec: string;
  bandwidthGbps: number;
  displayHz: number;
  thermalBudgetW: number;
  driverNote: string;
  recommendedSettings: {
    renderer: 'vulkan' | 'opengl';
    upscale: number;
    mtvu: boolean;
    hwDownloadMode: number;
    vsyncQueue: number;
    eeCycleRate: number;
    fxaa: boolean;
  };
  affinitySummary: string;
}

export const DEVICE_PROFILES: DeviceHardwareProfile[] = [
  {
    id: 'motorola-edge-60-pro',
    name: 'Motorola Edge 60 Pro',
    shortName: 'Edge 60 Pro',
    brand: 'Motorola',
    soc: 'MediaTek Dimensity 8350 Extreme (4nm)',
    cpuTopology: '1x A715 @ 3.35GHz + 3x A715 @ 3.20GHz + 4x A510 @ 2.20GHz',
    bigCores: 4,
    gpuName: 'ARM Mali-G615 MC6 (Valhall)',
    gpuVendor: 'MALI',
    gpuTier: 'GREEN',
    ramSpec: '12 GB LPDDR5X',
    bandwidthGbps: 68,
    displayHz: 120,
    thermalBudgetW: 6.2,
    driverNote: 'Driver Vulkan 1.3 nativo Mali Valhall + suporte a páginas 16KB (Android 15).',
    recommendedSettings: {
      renderer: 'vulkan',
      upscale: 2.0,
      mtvu: true,
      hwDownloadMode: 2,
      vsyncQueue: 0,
      eeCycleRate: 0,
      fxaa: true
    },
    affinitySummary: 'EE -> Prime A715 (3.35GHz), VU1 -> Perf #1, GS -> Perf #2'
  },
  {
    id: 'galaxy-m23-5g',
    name: 'Samsung Galaxy M23 5G',
    shortName: 'Galaxy M23 5G',
    brand: 'Samsung',
    soc: 'Qualcomm Snapdragon 750G 5G (8nm)',
    cpuTopology: '2x Kryo 570 Gold (A77 @ 2.2GHz) + 6x Kryo 570 Silver (A55 @ 1.8GHz)',
    bigCores: 2,
    gpuName: 'Qualcomm Adreno 619',
    gpuVendor: 'ADRENO',
    gpuTier: 'YELLOW',
    ramSpec: '6 GB LPDDR4X',
    bandwidthGbps: 17,
    displayHz: 120,
    thermalBudgetW: 3.8,
    driverNote: 'Vulkan Qualcomm v512+ ou Turnip Mesa; readbacks desativados para evitar stalls.',
    recommendedSettings: {
      renderer: 'vulkan',
      upscale: 1.0,
      mtvu: false,
      hwDownloadMode: 1,
      vsyncQueue: 0,
      eeCycleRate: 0,
      fxaa: false
    },
    affinitySummary: 'EE -> A77 #0, GS -> A77 #1 (MTVU desativado para proteger GS)'
  },
  {
    id: 'adreno-flagship',
    name: 'Adreno Flagship (Snapdragon 8 Gen 2/3 / Elite)',
    shortName: 'Adreno Flagship',
    brand: 'Qualcomm Snapdragon',
    soc: 'Snapdragon 8 Gen 2 / 8 Gen 3 / 8 Elite',
    cpuTopology: 'Arquitetura ARMv9 / Oryon (4+ Big/Prime Cores)',
    bigCores: 5,
    gpuName: 'Adreno 740 / 750 / 830',
    gpuVendor: 'ADRENO',
    gpuTier: 'GREEN',
    ramSpec: '12–16 GB LPDDR5X',
    bandwidthGbps: 76,
    displayHz: 120,
    thermalBudgetW: 7.0,
    driverNote: 'Vulkan nativo ou Turnip AdrenoTools para compatibilidade máxima e 2x–3x upscale.',
    recommendedSettings: {
      renderer: 'vulkan',
      upscale: 2.0,
      mtvu: true,
      hwDownloadMode: 2,
      vsyncQueue: 0,
      eeCycleRate: 0,
      fxaa: true
    },
    affinitySummary: 'EE -> Prime Core, VU1 -> Big #1, GS -> Big #2 (MTVU Ativo)'
  },
  {
    id: 'mali-flagship',
    name: 'Mali / Immortalis Flagship (Dimensity 9xxx)',
    shortName: 'Immortalis / Mali High',
    brand: 'MediaTek / Google Tensor',
    soc: 'Dimensity 9200 / 9300 / 9400 · Tensor G4',
    cpuTopology: 'All-Big-Core ou 1+3+4 DynamIQ ARMv9',
    bigCores: 4,
    gpuName: 'Immortalis-G715 / G720 / G925',
    gpuVendor: 'MALI',
    gpuTier: 'GREEN',
    ramSpec: '12–16 GB LPDDR5X',
    bandwidthGbps: 72,
    displayHz: 120,
    thermalBudgetW: 6.5,
    driverNote: 'Pipeline Vulkan 1.3 TBDR com Async Readbacks e compilação paralela de SPIR-V.',
    recommendedSettings: {
      renderer: 'vulkan',
      upscale: 2.0,
      mtvu: true,
      hwDownloadMode: 2,
      vsyncQueue: 0,
      eeCycleRate: 0,
      fxaa: true
    },
    affinitySummary: 'EE -> Cortex-X Prime, VU1 -> A7xx #1, GS -> A7xx #2'
  },
  {
    id: 'adreno-midrange',
    name: 'Adreno Intermediário / Entrada (SD 680 / 695)',
    shortName: 'Adreno 6xx Mid',
    brand: 'Qualcomm Snapdragon',
    soc: 'Snapdragon 680 / 685 / 695 / 4 Gen 2',
    cpuTopology: '2x Performance + 6x Efficiency (big.LITTLE)',
    bigCores: 2,
    gpuName: 'Adreno 610 / 613 / 619L',
    gpuVendor: 'ADRENO',
    gpuTier: 'YELLOW',
    ramSpec: '4–8 GB LPDDR4X',
    bandwidthGbps: 17,
    displayHz: 90,
    thermalBudgetW: 3.5,
    driverNote: 'Vulkan 1.0x Nativo + Disable Readbacks para manter 50–60 FPS estáveis.',
    recommendedSettings: {
      renderer: 'vulkan',
      upscale: 1.0,
      mtvu: false,
      hwDownloadMode: 1,
      vsyncQueue: 0,
      eeCycleRate: 0,
      fxaa: false
    },
    affinitySummary: 'EE -> Core Big #0, GS -> Core Big #1 (MTVU Off)'
  },
  {
    id: 'mali-midrange',
    name: 'Mali Intermediário (Helio G99 / Dimensity 6xxx / Exynos)',
    shortName: 'Mali G57 / G68',
    brand: 'MediaTek / Exynos',
    soc: 'Helio G99 / Dimensity 6300 / Exynos 1380',
    cpuTopology: '2x A76/A78 + 6x A55 (ou 4x A78 + 4x A55)',
    bigCores: 2,
    gpuName: 'ARM Mali-G57 MC2 / Mali-G68 MP5',
    gpuVendor: 'MALI',
    gpuTier: 'YELLOW',
    ramSpec: '6–8 GB LPDDR4X',
    bandwidthGbps: 18,
    displayHz: 120,
    thermalBudgetW: 3.9,
    driverNote: 'Vulkan recomendado na Mali G57/G68; OpenGL ES disponível como fallback em drivers antigos.',
    recommendedSettings: {
      renderer: 'vulkan',
      upscale: 1.0,
      mtvu: false,
      hwDownloadMode: 1,
      vsyncQueue: 0,
      eeCycleRate: 0,
      fxaa: false
    },
    affinitySummary: 'EE -> Performance #0, GS -> Performance #1'
  }
];

export interface DetectedHardwareInfo {
  suggestedProfileId: Exclude<DeviceProfileId, 'auto'>;
  detectedGpuLabel: string;
  detectedVendor: GpuVendorType;
  cpuThreads: number;
  deviceMemoryGb: number | null;
  platformNote: string;
}

export function detectBrowserHardware(): DetectedHardwareInfo {
  let gpuLabel = 'GPU Vulkan / WebGL Universal';
  let vendor: GpuVendorType = 'AUTO';
  let suggested: Exclude<DeviceProfileId, 'auto'> = 'motorola-edge-60-pro';

  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const rawRenderer = dbg
        ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
        : String(gl.getParameter(gl.RENDERER) || '');

      if (rawRenderer) {
        gpuLabel = rawRenderer.replace(/ANGLE \((.*)\)/, '$1').trim();
        const lower = rawRenderer.toLowerCase();

        if (lower.includes('mali-g615') || ua.toLowerCase().includes('edge 60 pro')) {
          vendor = 'MALI';
          suggested = 'motorola-edge-60-pro';
        } else if (lower.includes('immortalis') || lower.includes('mali-g7') || lower.includes('mali-g9')) {
          vendor = 'MALI';
          suggested = 'mali-flagship';
        } else if (lower.includes('mali')) {
          vendor = 'MALI';
          suggested = 'mali-midrange';
        } else if (lower.includes('adreno') && (lower.includes('740') || lower.includes('750') || lower.includes('830') || lower.includes('730'))) {
          vendor = 'ADRENO';
          suggested = 'adreno-flagship';
        } else if (lower.includes('adreno') && lower.includes('619')) {
          vendor = 'ADRENO';
          suggested = 'galaxy-m23-5g';
        } else if (lower.includes('adreno')) {
          vendor = 'ADRENO';
          suggested = 'adreno-midrange';
        }
      }
    }

    if (ua.toLowerCase().includes('sm-m236')) {
      vendor = 'ADRENO';
      suggested = 'galaxy-m23-5g';
    } else if (ua.toLowerCase().includes('edge 60 pro') || ua.toLowerCase().includes('xt2507')) {
      vendor = 'MALI';
      suggested = 'motorola-edge-60-pro';
    }
  } catch {
    // fallback silently
  }

  const cpuThreads =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 8;

  const navMem =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null
      : null;

  return {
    suggestedProfileId: suggested,
    detectedGpuLabel: gpuLabel,
    detectedVendor: vendor,
    cpuThreads,
    deviceMemoryGb: navMem,
    platformNote:
      vendor === 'MALI'
        ? 'GPU ARM Mali detectada — Perfil Mali TBDR calibrado'
        : vendor === 'ADRENO'
        ? 'GPU Qualcomm Adreno detectada — Perfil Adreno calibrado'
        : 'Ambiente multi-dispositivo pronto (Adreno & Mali)'
  };
}

export function resolveDeviceProfile(
  profileId: DeviceProfileId,
  detected?: DetectedHardwareInfo
): DeviceHardwareProfile {
  if (profileId === 'auto') {
    const fallbackId = detected?.suggestedProfileId ?? 'motorola-edge-60-pro';
    return DEVICE_PROFILES.find((p) => p.id === fallbackId) || DEVICE_PROFILES[0];
  }
  return DEVICE_PROFILES.find((p) => p.id === profileId) || DEVICE_PROFILES[0];
}
