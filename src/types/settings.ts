import { ControlsConfig } from '../components/emucorex/VectorTouchControls';
import { DeviceProfileId } from '../data/deviceProfiles';

export type PerformancePreset = 'device-optimal' | 'high-quality' | 'battery-saver' | 'custom';
export type RendererBackend = 'vulkan' | 'opengl';
export type BiosRegion = 'SCPH-39001' | 'SCPH-50004' | 'SCPH-70000';
export type AudioBackend = 'aaudio' | 'oboe' | 'opensles';
export type AudioSyncMode = 'timestretch' | 'async';

export interface HubPatchItem {
  id: string;
  title: string;
  gameSerial: string;
  author: string;
  description: string;
  enabled: boolean;
}

export interface EmulatorSettings {
  deviceProfileId: DeviceProfileId;
  preset: PerformancePreset;
  // Geral & Sistema
  fastBoot: boolean;
  widescreen16x9: boolean;
  showFpsHud: boolean;
  biosRegion: BiosRegion;
  // Gráficos (GS / Vulkan Adreno & Mali)
  renderer: RendererBackend;
  upscale: number; // 1.0 | 1.25 | 1.5 | 2.0 | 2.5
  hwDownloadMode: number; // 0 = Accurate, 1 = Disable Readbacks, 2 = Async
  bilinearFiltering: boolean;
  vsyncQueue: number; // 0 | 1 | 2
  fxaa: boolean;
  // CPU & Emulação (big.LITTLE / DynamIQ)
  mtvu: boolean;
  eeCycleRate: number; // -2 | -1 | 0 | 1
  eeCycleSkip: number; // 0 | 1 | 2
  fastmemMode: 'DirectHostVirtual' | 'Mmap';
  // Áudio (SPU2)
  audioBackend: AudioBackend;
  masterVolume: number; // 0 - 100
  audioMuted: boolean;
  audioSync: AudioSyncMode;
  // Patches
  patches: HubPatchItem[];
  // Controles Touch & Gamepad
  controls: ControlsConfig;
}

export const DEFAULT_HUB_PATCHES: HubPatchItem[] = [
  {
    id: 'nfs-mw-60fps',
    title: 'Need for Speed: Most Wanted — 60 FPS Sem Blur',
    gameSerial: 'SLUS-21351',
    author: 'Patch Oficial',
    description: 'Remove motion blur pesado e estabiliza 60 FPS em GPUs Adreno e Mali.',
    enabled: true
  },
  {
    id: 'burnout-ws',
    title: 'Burnout Revenge — Widescreen 16:9',
    gameSerial: 'SLUS-21242',
    author: 'EmuStation',
    description: 'Correção de proporção anamórfica sem esticar a interface em telas panorâmicas.',
    enabled: true
  },
  {
    id: 'tekken5-60hz',
    title: 'Tekken 5 — Desempenho 60 Hz Estável',
    gameSerial: 'SCES-53202',
    author: 'EmuStation',
    description: 'Desativa efeitos de pós-processamento redundantes em arenas com partículas.',
    enabled: true
  },
  {
    id: 'gow2-noblur',
    title: 'God of War II — Otimização de Memória',
    gameSerial: 'SCUS-97399',
    author: 'Otimizador GPU',
    description: 'Evita quedas de FPS durante transições de câmera em GPUs Adreno e Mali.',
    enabled: false
  }
];

export const DEFAULT_CONTROLS_CONFIG: ControlsConfig = {
  style: 'vector',
  opacity: 0.85,
  scale: 1.0,
  haptics: true,
  showAnalogSticks: true,
  showShoulderButtons: true,
  showTurboButton: true,
  deadzone: 0.15
};

export const DEFAULT_EMULATOR_SETTINGS: EmulatorSettings = {
  deviceProfileId: 'auto',
  preset: 'device-optimal',
  fastBoot: true,
  widescreen16x9: false,
  showFpsHud: true,
  biosRegion: 'SCPH-39001',
  renderer: 'vulkan',
  upscale: 1.5,
  hwDownloadMode: 2,
  bilinearFiltering: true,
  vsyncQueue: 0,
  fxaa: false,
  mtvu: true,
  eeCycleRate: 0,
  eeCycleSkip: 0,
  fastmemMode: 'DirectHostVirtual',
  audioBackend: 'aaudio',
  masterVolume: 85,
  audioMuted: false,
  audioSync: 'timestretch',
  patches: DEFAULT_HUB_PATCHES,
  controls: DEFAULT_CONTROLS_CONFIG
};
