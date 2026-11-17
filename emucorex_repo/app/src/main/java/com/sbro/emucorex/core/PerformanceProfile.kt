package com.sbro.emucorex.core

import android.os.Build
import java.util.Locale

data class PerformanceProfileConfig(
    val id: Int,
    val renderer: Int = RendererDefaults.defaultForHardware(),
    val eeCycleRate: Int,
    val eeCycleSkip: Int,
    val hwDownloadMode: Int,
    val fpuCorrectAddSub: Boolean,
    val vsyncQueueSize: Int = 2,
    val enableMtvuDefault: Boolean? = null
)

object PerformanceProfiles {
    const val SAFE = 0
    const val FAST = 1
    const val GALAXY_M23 = 2

    val safeConfig = PerformanceProfileConfig(
        id = SAFE,
        eeCycleRate = 0,
        eeCycleSkip = 0,
        hwDownloadMode = GsHackDefaults.HW_DOWNLOAD_MODE_DEFAULT,
        fpuCorrectAddSub = true,
        vsyncQueueSize = 2,
        enableMtvuDefault = null
    )

    val fastConfig = PerformanceProfileConfig(
        id = FAST,
        eeCycleRate = -1,
        eeCycleSkip = 2,
        hwDownloadMode = GsHackDefaults.HW_DOWNLOAD_MODE_DEFAULT,
        fpuCorrectAddSub = false,
        vsyncQueueSize = 1,
        enableMtvuDefault = null
    )

    val galaxyM23Config = PerformanceProfileConfig(
        id = GALAXY_M23,
        renderer = RendererDefaults.VULKAN,
        eeCycleRate = 0,
        eeCycleSkip = 0,
        hwDownloadMode = 1, // Disable Readbacks: prevents Adreno 619 GMEM stalls on LPDDR4X
        fpuCorrectAddSub = false,
        vsyncQueueSize = 0, // Low-latency 120Hz frame pacing
        enableMtvuDefault = false // Prevents GS starvation on 2x A77 + 6x A55
    )

    fun isAdrenoMidrange2BigCore(): Boolean {
        val model = Build.MODEL.orEmpty().uppercase(Locale.US)
        val device = Build.DEVICE.orEmpty().uppercase(Locale.US)
        val product = Build.PRODUCT.orEmpty().uppercase(Locale.US)
        val board = Build.BOARD.orEmpty().uppercase(Locale.US)
        if (model.startsWith("SM-M236") || device.contains("M23XQ") || product.contains("M23XQ") || board == "LAGOON") {
            return true
        }
        val socName = MobileSocNameMapper.currentDeviceName()
        return socName.equals("Snapdragon 750G", ignoreCase = true) ||
            socName.equals("Snapdragon 695", ignoreCase = true) ||
            socName.equals("Snapdragon 4 Gen 1", ignoreCase = true)
    }

    fun defaultForDevice(): Int = if (isAdrenoMidrange2BigCore()) GALAXY_M23 else SAFE

    fun defaultMtvuForHardware(): Boolean = !isAdrenoMidrange2BigCore()

    fun normalize(profileId: Int): Int {
        return when (profileId) {
            FAST -> FAST
            GALAXY_M23 -> GALAXY_M23
            else -> SAFE
        }
    }

    fun configFor(profileId: Int): PerformanceProfileConfig {
        return when (normalize(profileId)) {
            FAST -> fastConfig
            GALAXY_M23 -> galaxyM23Config
            else -> safeConfig
        }
    }
}
