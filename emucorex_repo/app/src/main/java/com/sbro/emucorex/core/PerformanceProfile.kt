package com.sbro.emucorex.core

data class PerformanceProfileConfig(
    val id: Int,
    val renderer: Int = RendererDefaults.defaultForHardware(),
    val eeCycleRate: Int,
    val eeCycleSkip: Int,
    val hwDownloadMode: Int,
    val fpuCorrectAddSub: Boolean,
    val vsyncQueueSize: Int = 2,
    val upscaleMultiplier: Float = 1.0f
)

object PerformanceProfiles {
    const val SAFE = 0
    const val FAST = 1
    const val ADRENO_MIDRANGE = 2
    const val MALI_HIGH_PERF = 3
    const val FLAGSHIP_UNIVERSAL = 4

    // Legacy alias kept only for backward preferences compatibility
    @Deprecated("Use ADRENO_MIDRANGE instead")
    const val GALAXY_M23 = ADRENO_MIDRANGE

    val safeConfig = PerformanceProfileConfig(
        id = SAFE,
        eeCycleRate = 0,
        eeCycleSkip = 0,
        hwDownloadMode = GsHackDefaults.HW_DOWNLOAD_MODE_DEFAULT,
        fpuCorrectAddSub = true,
        vsyncQueueSize = 2,
        upscaleMultiplier = 1.0f
    )

    val fastConfig = PerformanceProfileConfig(
        id = FAST,
        eeCycleRate = -1,
        eeCycleSkip = 2,
        hwDownloadMode = GsHackDefaults.HW_DOWNLOAD_MODE_DEFAULT,
        fpuCorrectAddSub = false,
        vsyncQueueSize = 2,
        upscaleMultiplier = 1.0f
    )

    // Calibrated for mid-range 2+6 Adreno SoCs (e.g. Snapdragon 750G / 695 / Adreno 619)
    val adrenoMidrangeConfig = PerformanceProfileConfig(
        id = ADRENO_MIDRANGE,
        renderer = RendererDefaults.VULKAN,
        eeCycleRate = 0,
        eeCycleSkip = 0,
        hwDownloadMode = 1, // Disable synchronous readbacks to prevent LPDDR4X stalls
        fpuCorrectAddSub = false,
        vsyncQueueSize = 0, // Low latency for 120Hz panels
        upscaleMultiplier = 1.0f
    )

    // Calibrated for modern ARM Mali / Immortalis Valhall GPUs (e.g. Motorola Edge 60 Pro / Dimensity 8350 / Mali-G615 MC6)
    val maliHighPerfConfig = PerformanceProfileConfig(
        id = MALI_HIGH_PERF,
        renderer = RendererDefaults.VULKAN,
        eeCycleRate = 0,
        eeCycleSkip = 0,
        hwDownloadMode = 2, // Async non-blocking readbacks ideal for Mali Valhall TBDR + LPDDR5X
        fpuCorrectAddSub = false,
        vsyncQueueSize = 0, // Low latency for 120Hz/144Hz P-OLED displays
        upscaleMultiplier = 2.0f // 2x (1280x896) stable on 6-core Mali-G615 & Immortalis
    )

    // Flagship Universal (Adreno 7xx/8xx & Immortalis-G7xx/G9xx)
    val flagshipUniversalConfig = PerformanceProfileConfig(
        id = FLAGSHIP_UNIVERSAL,
        renderer = RendererDefaults.VULKAN,
        eeCycleRate = 0,
        eeCycleSkip = 0,
        hwDownloadMode = 2,
        fpuCorrectAddSub = true,
        vsyncQueueSize = 0,
        upscaleMultiplier = 2.5f
    )

    fun normalize(profileId: Int): Int {
        return when (profileId) {
            FAST -> FAST
            ADRENO_MIDRANGE -> ADRENO_MIDRANGE
            MALI_HIGH_PERF -> MALI_HIGH_PERF
            FLAGSHIP_UNIVERSAL -> FLAGSHIP_UNIVERSAL
            else -> SAFE
        }
    }

    fun configFor(profileId: Int): PerformanceProfileConfig {
        return when (normalize(profileId)) {
            FAST -> fastConfig
            ADRENO_MIDRANGE -> adrenoMidrangeConfig
            MALI_HIGH_PERF -> maliHighPerfConfig
            FLAGSHIP_UNIVERSAL -> flagshipUniversalConfig
            else -> safeConfig
        }
    }
}
