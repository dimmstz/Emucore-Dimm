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
    id: 'cpu-topology-adaptive',
    title: '1. Alocação Adaptativa de CPU (big.LITTLE 2+6 vs DynamIQ 1+3+4)',
    severity: 'CRITICAL',
    component: 'VMManager.cpp (InitializeProcessorList / SetEmuThreadAffinities)',
    symptom: 'Em SoCs 2+6 (ex: Adreno 619), ativar MTVU empurra a thread GS para núcleos lentos A55. Já em SoCs 1+3+4 (ex: Motorola Edge 60 Pro / Dimensity 8350), desativar MTVU desperdiça os 3 núcleos Cortex-A715 extras.',
    solution: 'Detecção automática no bootstrap nativo: em 2 Big Cores desativa MTVU e fixa EE+GS nos dois núcleos grandes; em 3+ Big/Prime Cores ativa MTVU alocando EE no Prime Core (3.35GHz), VU1 no Perf #1 e GS no Perf #2.'
  },
  {
    id: 'mali-vs-adreno-readbacks',
    title: '2. Leitura de Memória de Vídeo (Tile-Based Deferred Rendering Adreno vs Mali)',
    severity: 'HIGH',
    component: 'PerformanceProfile.kt & GSRendererHW.cpp',
    symptom: 'Readbacks síncronos de framebuffer causam flushes de GMEM/Tile-Buffer para a RAM principal, gerando engasgos tanto em LPDDR4X (Adreno intermediárias) quanto em jogos pesados na Mali.',
    solution: 'Usar HWDownloadMode = 1 (Disable Readbacks) em SoCs LPDDR4X de banda limitada e HWDownloadMode = 2 (Async Non-Blocking) em GPUs Mali Valhall (G615/G715/G720) com LPDDR5X de alta largura de banda.'
  },
  {
    id: 'spirv-pipeline-cache',
    title: '3. Compilação de Shaders SPIR-V em Drivers Mali e Adreno',
    severity: 'HIGH',
    component: 'GSDeviceVK.cpp (VkPipelineCache)',
    symptom: 'Micro-travamentos de 80–250ms na primeira renderização de partículas, sombras ou explosões em drivers Qualcomm proprietários, Turnip e ARM Mali.',
    solution: 'Persistência de VkPipelineCache em cache local e pré-compilação assíncrona compatível tanto com Qualcomm Vulkan/Turnip quanto com drivers ARM Mali Valhall 1.3.'
  },
  {
    id: 'android15-16kb-paging',
    title: '4. Suporte a Páginas de 16KB no Android 15 (Motorola Edge 60 Pro e Novos Aparelhos)',
    severity: 'MEDIUM',
    component: 'CMakeLists.txt & Fastmem Virtual Allocator',
    symptom: 'Dispositivos modernos com Android 15 podem adotar page size de 16KB (0x4000), causando falhas em bibliotecas .so sem alinhamento ou em mapeamentos Fastmem antigos.',
    solution: 'Alinhamento ELF 16KB habilitado no NDK r29 e suporte dual a páginas de 4KB/16KB no alocador DirectHostVirtual do EmuStation.'
  }
];

export const TEST_BENCHMARK_MATRIX = [
  {
    game: 'God of War II (SCUS-97399)',
    genre: 'Ação / Hack & Slash',
    adrenoMid: '52–60 FPS (1.0x Vulkan)',
    edge60Pro: '60 FPS cravados (2.0x Vulkan + MTVU)',
    flagship: '60 FPS cravados (2.5x–3x Vulkan)'
  },
  {
    game: 'Need for Speed: Most Wanted (SLUS-21351)',
    genre: 'Corrida / Pós-processamento',
    adrenoMid: '44–54 FPS (1.0x · HWMode 1)',
    edge60Pro: '60 FPS estáveis (2.0x · Patch No-Blur)',
    flagship: '60 FPS estáveis (2.5x Vulkan)'
  },
  {
    game: 'Tekken 5 (SCES-53202)',
    genre: 'Luta 60 FPS',
    adrenoMid: '58–60 FPS (1.0x Vulkan)',
    edge60Pro: '60 FPS cravados (2.0x Vulkan + FXAA)',
    flagship: '60 FPS cravados (3.0x Vulkan)'
  },
  {
    game: 'Shadow of the Colossus (SCUS-97472)',
    genre: 'Aventura / Efeitos GS intensos',
    adrenoMid: '38–48 FPS (1.0x · HWMode 1)',
    edge60Pro: '55–60 FPS (1.5x–2.0x · Async HWMode)',
    flagship: '60 FPS estáveis (2.0x Vulkan)'
  },
  {
    game: 'Gran Turismo 4 (SCUS-97328)',
    genre: 'Simulação Automobilística',
    adrenoMid: '50–60 FPS (1.0x Vulkan)',
    edge60Pro: '60 FPS cravados (2.0x 16:9 Widescreen)',
    flagship: '60 FPS cravados (3.0x 16:9)'
  }
];
