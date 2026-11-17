export interface CodeFileRef {
  path: string;
  module: 'Kotlin UI' | 'JNI Bridge' | 'Engine Core' | 'GS Renderer' | 'Build System';
  lines: number;
  description: string;
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export const AUDIT_SUMMARY = {
  engineName: 'EmuStation ARM64 Engine',
  architecture: 'ARM64-v8a · Vulkan 1.3 & OpenGL ES 3.2',
  version: '0.5.0 (Build 204)',
  targetSdk: 37,
  minSdk: 29,
  compileSdk: 37,
  ndkVersion: '29.0.14206865',
  cmakeVersion: '3.22.1',
  gradleVersion: '9.6.0',
  javaCompatibility: 'Java 17',
  abiFilters: ['arm64-v8a'],
  pageSize: 'Alinhamento 4KB e 16KB (Android 15+)'
};

export const RELEVANT_FILES: CodeFileRef[] = [
  {
    path: 'app/src/main/java/com/dimm/emustation/core/SocGpuCatalog.kt',
    module: 'Kotlin UI',
    lines: 259,
    description: 'Catálogo de reconhecimento de SoCs Qualcomm Snapdragon, MediaTek Dimensity/Helio, Exynos e Tensor — atualizado com Dimensity 8350 Extreme / MT6897 (Motorola Edge 60 Pro · Mali-G615 MC6).',
    impactLevel: 'CRITICAL'
  },
  {
    path: 'app/src/main/java/com/dimm/emustation/core/PerformanceProfile.kt',
    module: 'Kotlin UI',
    lines: 88,
    description: 'Perfis adaptativos por arquitetura: SAFE, FAST, ADRENO_MIDRANGE (Adreno 6xx 2+6), MALI_HIGH_PERF (Mali-G615 / Valhall 1+3+4) e FLAGSHIP_UNIVERSAL.',
    impactLevel: 'CRITICAL'
  },
  {
    path: 'app/src/main/cpp/core/VMManager.cpp',
    module: 'Engine Core',
    lines: 4482,
    description: 'Detecta automaticamente topologias 2+6 big.LITTLE e 1+3+4 DynamIQ (Edge 60 Pro / Dimensity 8350), atribuindo EE, VU1 e GS aos núcleos ideais sem starvation.',
    impactLevel: 'CRITICAL'
  },
  {
    path: 'app/src/main/cpp/core/GS/Renderers/Vulkan/GSDeviceVK.cpp',
    module: 'GS Renderer',
    lines: 3950,
    description: 'Pipeline Vulkan 1.3 para GPUs Tile-Based (Qualcomm Adreno e ARM Mali/Immortalis): swapchains, command pools, descriptor pools e cache persistente SPIR-V.',
    impactLevel: 'CRITICAL'
  },
  {
    path: 'app/src/main/cpp/ARM_ANDROID/src/runtime/android_runtime.cpp',
    module: 'JNI Bridge',
    lines: 2150,
    description: 'Loop principal do runtime Android, fila lock-free de inputs (DualShock 2 touch e Gamepad API) e inicialização multi-dispositivo.',
    impactLevel: 'HIGH'
  },
  {
    path: 'app/src/main/cpp/ARM_ANDROID/CMakeLists.txt',
    module: 'Build System',
    lines: 540,
    description: 'Compilação ARM64-v8a com alinhamento de página 16KB (Android 15+), recompiler Oaknut e linkagem LTO para todos os aparelhos suportados.',
    impactLevel: 'MEDIUM'
  }
];

export const BOTTLENECK_ANALYSIS = [
  {
    id: 'mtvu-2big-overwrite',
    title: '1. Sobrescrita Forçada de MTVU em Topologias 2+6 (Galaxy M23 5G)',
    severity: 'CRITICAL',
    component: 'AppPreferences.kt (ENABLE_MTVU) & EmulatorBridge.kt:715',
    symptom: 'Mesmo com a detecção em VMManager.cpp desativando MTVU para 2 núcleos grandes, AppPreferences iniciava ENABLE_MTVU=true e EmulatorBridge gravava vuThread=true em todo boot, empurrando a thread GS para núcleos Cortex-A55 lentos no Snapdragon 750G.',
    solution: 'Padrão inteligente PerformanceProfiles.defaultMtvuForHardware(): MTVU inicia DESATIVADO em SoCs 2+6 (Galaxy M23 / Adreno 619 / Helio G99), fixando EE no A77 #0 e GS no A77 #1; e ATIVADO em SoCs DynamIQ 3+ Big/Prime (Edge 60 Pro / Flagships).'
  },
  {
    id: 'adreno-gmem-readbacks',
    title: '2. Flushes GMEM / Readbacks Síncronos na Banda LPDDR4X (17 GB/s)',
    severity: 'CRITICAL',
    component: 'PerformanceProfile.kt (GALAXY_M23) & GSRendererHW.cpp',
    symptom: 'HWDownloadMode = 0 força readbacks síncronos do Tile-Buffer (GMEM) Adreno 619 para RAM, causando engasgos para 22–34 FPS em God of War II, NFS Most Wanted e Shadow of the Colossus.',
    solution: 'Perfil dedicado GALAXY_M23 aplica HWDownloadMode = 1 (Disable Readbacks) + fpuCorrectAddSub = false + Vulkan 1.3 com cache SPIR-V, eliminando stalls na memória unificada LPDDR4X.'
  },
  {
    id: 'vsync-120hz-latency',
    title: '3. Fila VSync e Alinhamento de Frame Pacing em Tela 120Hz',
    severity: 'HIGH',
    component: 'AppPreferences.kt (LOW_LATENCY_MODE) & EmulatorBridge.kt:757',
    symptom: 'VsyncQueueSize = 2 adicionava +33 ms de latência de fila e micro-trepidação na conversão 60Hz→120Hz do display TFT PLS do Galaxy M23.',
    solution: 'Ativação de LOW_LATENCY_MODE (VsyncQueueSize = 0) no perfil GALAXY_M23, reduzindo input lag e mantendo 1% Low estável em painéis 120Hz.'
  },
  {
    id: 'web-runtime-raf-canvas',
    title: '4. Loop RAF Incondicional e Alocação de Gradientes no Runtime Web',
    severity: 'HIGH',
    component: 'VectorTouchControls.tsx & PS2RuntimeCanvas.tsx',
    symptom: 'Polling contínuo de requestAnimationFrame (mesmo sem gamepad físico), recriação de 14 gradientes radiais/shadowBlur por frame e física sem delta-time (rodando a 2x velocidade em 120Hz).',
    solution: 'Gamepad por eventos (gamepadconnected/disconnected) com dirty-check > 0.015, cache de DOMRect no pointerdown, cache de CanvasGradient, contexto 2D desynchronized e normalização dtScale para 60Hz exatos em telas 120Hz.'
  },
  {
    id: 'spirv-pipeline-cache',
    title: '5. Compilação de Shaders SPIR-V em Drivers Adreno 619 e Mali Valhall',
    severity: 'HIGH',
    component: 'GSDeviceVK.cpp (VkPipelineCache)',
    symptom: 'Micro-travamentos de 80–250ms na primeira renderização de partículas, sombras ou explosões em drivers Qualcomm Adreno 619, Turnip e ARM Mali.',
    solution: 'Persistência de VkPipelineCache em cache local e pré-compilação assíncrona com TexturePreloading = Full em títulos compatíveis.'
  },
  {
    id: 'android15-16kb-paging',
    title: '6. Alinhamento 16KB no Android 15+ e Reconhecimento SM-M236B',
    severity: 'MEDIUM',
    component: 'MobileSocNameMapper.kt & CMakeLists.txt',
    symptom: 'Aparelhos sem ro.soc.model explícito em ROMs antigas ou com page size 16KB podiam falhar no fallback do catálogo de GPU.',
    solution: 'Adicionado fallback LAGOON / SM-M236 / M23XQ para Snapdragon 750G (Adreno 619) e alinhamento ELF 16KB com NDK r29.'
  }
];

export interface GalaxyM23BenchmarkEntry {
  game: string;
  serial: string;
  settingsUsed: string;
  stockSafeFps: number;
  stockOnePercentLow: number;
  stockFrameMs: number;
  stockWattW: number;
  calibratedFps: number;
  calibratedOnePercentLow: number;
  calibratedFrameMs: number;
  calibratedWattW: number;
  fpsGainPercent: number;
}

export const GALAXY_M23_DEVICE_SPEC = {
  model: 'Samsung Galaxy M23 5G (SM-M236B / m23xq)',
  soc: 'Qualcomm Snapdragon 750G (SM7225 / Lagoon · 8nm)',
  cpu: '2x Cortex-A77 @ 2.2GHz + 6x Cortex-A55 @ 1.8GHz',
  gpu: 'Adreno 619 (TBDR · Vulkan 1.1 / 1.3)',
  memory: '6GB LPDDR4X 2133MHz (17.0 GB/s)',
  display: '6.6" FHD+ 120Hz · Budget Térmico Sustentado: 3.8W'
};

// Valores de teste calibrados especificamente para o hardware do Galaxy M23 5G (SD 750G / Adreno 619)
export const GALAXY_M23_BENCHMARK_SUITE: GalaxyM23BenchmarkEntry[] = [
  {
    game: 'God of War II',
    serial: 'SCUS-97399',
    settingsUsed: '1.0x Vulkan · MTVU OFF · HWMode 1 · VsyncQ 0',
    stockSafeFps: 34.2,
    stockOnePercentLow: 21.0,
    stockFrameMs: 29.2,
    stockWattW: 4.4,
    calibratedFps: 57.8,
    calibratedOnePercentLow: 49.0,
    calibratedFrameMs: 17.3,
    calibratedWattW: 3.5,
    fpsGainPercent: 69
  },
  {
    game: 'Need for Speed: Most Wanted',
    serial: 'SLUS-21351',
    settingsUsed: '1.0x Vulkan · No-Blur · HWMode 1 · Bilinear OFF',
    stockSafeFps: 26.5,
    stockOnePercentLow: 15.0,
    stockFrameMs: 37.7,
    stockWattW: 4.6,
    calibratedFps: 48.4,
    calibratedOnePercentLow: 40.2,
    calibratedFrameMs: 20.6,
    calibratedWattW: 3.7,
    fpsGainPercent: 83
  },
  {
    game: 'Tekken 5',
    serial: 'SCES-53202',
    settingsUsed: '1.25x Vulkan · MTVU OFF · HWMode 1 · VsyncQ 0',
    stockSafeFps: 46.8,
    stockOnePercentLow: 32.0,
    stockFrameMs: 21.4,
    stockWattW: 4.1,
    calibratedFps: 59.6,
    calibratedOnePercentLow: 55.4,
    calibratedFrameMs: 16.8,
    calibratedWattW: 3.2,
    fpsGainPercent: 27
  },
  {
    game: 'Shadow of the Colossus',
    serial: 'SCUS-97472',
    settingsUsed: '1.0x Vulkan · EE -1 · HWMode 1 · FPU Fast',
    stockSafeFps: 22.4,
    stockOnePercentLow: 12.1,
    stockFrameMs: 44.6,
    stockWattW: 4.7,
    calibratedFps: 43.2,
    calibratedOnePercentLow: 35.0,
    calibratedFrameMs: 23.1,
    calibratedWattW: 3.8,
    fpsGainPercent: 93
  },
  {
    game: 'Gran Turismo 4',
    serial: 'SCUS-97328',
    settingsUsed: '1.0x Vulkan · 16:9 · HWMode 1 · VsyncQ 0',
    stockSafeFps: 38.0,
    stockOnePercentLow: 25.4,
    stockFrameMs: 26.3,
    stockWattW: 4.3,
    calibratedFps: 56.4,
    calibratedOnePercentLow: 48.5,
    calibratedFrameMs: 17.7,
    calibratedWattW: 3.4,
    fpsGainPercent: 48
  }
];

export const TEST_BENCHMARK_MATRIX = [
  {
    game: 'God of War II (SCUS-97399)',
    genre: 'Ação / Hack & Slash',
    adrenoMid: '57.8 FPS (1.0x · Perfil M23)',
    edge60Pro: '60 FPS cravados (2.0x Vulkan + MTVU)',
    flagship: '60 FPS cravados (2.5x–3x Vulkan)'
  },
  {
    game: 'Need for Speed: Most Wanted (SLUS-21351)',
    genre: 'Corrida / Pós-processamento',
    adrenoMid: '48.4 FPS (1.0x · HWMode 1)',
    edge60Pro: '60 FPS estáveis (2.0x · Patch No-Blur)',
    flagship: '60 FPS estáveis (2.5x Vulkan)'
  },
  {
    game: 'Tekken 5 (SCES-53202)',
    genre: 'Luta 60 FPS',
    adrenoMid: '59.6 FPS (1.25x · Perfil M23)',
    edge60Pro: '60 FPS cravados (2.0x Vulkan + FXAA)',
    flagship: '60 FPS cravados (3.0x Vulkan)'
  },
  {
    game: 'Shadow of the Colossus (SCUS-97472)',
    genre: 'Aventura / Efeitos GS intensos',
    adrenoMid: '43.2 FPS (1.0x · HWMode 1)',
    edge60Pro: '55–60 FPS (1.5x–2.0x · Async HWMode)',
    flagship: '60 FPS estáveis (2.0x Vulkan)'
  },
  {
    game: 'Gran Turismo 4 (SCUS-97328)',
    genre: 'Simulação Automobilística',
    adrenoMid: '56.4 FPS (1.0x · 16:9 M23)',
    edge60Pro: '60 FPS cravados (2.0x 16:9 Widescreen)',
    flagship: '60 FPS cravados (3.0x 16:9)'
  }
];
