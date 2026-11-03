package com.laska.devicescope

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.Lifecycle
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** Uses the actual application/repository. Emulator data is not physical-device accuracy evidence. */
@RunWith(AndroidJUnit4::class)
class ProductionLaunchTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    @Test fun productionLaunchUsesAndroidCollectorsWithoutSampleBanner() {
        rule.onNodeWithTag("sample-banner").assertDoesNotExist()
        rule.waitUntil(30_000) {
            rule.onAllNodes(hasContentDescription("ActivityManager.MemoryInfo", substring = true)).fetchSemanticsNodes().isNotEmpty()
        }
        rule.onNodeWithTag("metric-memory.available").assertExists()
        rule.onNodeWithTag("nav-1").performClick()
        rule.onNodeWithTag("section-cpu").performClick()
        rule.onNodeWithTag("detail-list").performScrollToNode(hasTestTag("metric-cpu.temperature"))
        rule.onNodeWithTag("metric-cpu.temperature")
            .assert(hasContentDescription("No universal public Android API", substring = true))
    }

    @Test fun gpuIdentificationSurvivesBackgroundAndResume() {
        rule.onNodeWithTag("nav-1").performClick()
        rule.onNodeWithTag("section-gpu").performClick()
        assertGpuReading()
        rule.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        rule.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        // Returning starts fresh discovery, including a new EGL context/query/cleanup.
        assertGpuReading()
        rule.onNodeWithTag("sample-banner").assertDoesNotExist()
    }

    private fun assertGpuReading() {
        rule.waitUntil(30_000) {
            rule.onAllNodes(hasTestTag("metric-gpu.renderer") and
                hasContentDescription(". Available.", substring = true) and
                hasContentDescription("EGL14 pbuffer / GLES20.glGetString", substring = true))
                .fetchSemanticsNodes().isNotEmpty()
        }
        rule.onNodeWithTag("metric-gpu.renderer").assertIsDisplayed().performClick()
        rule.onNodeWithText("Source: EGL14 pbuffer / GLES20.glGetString").assertExists()
        rule.onNodeWithText("Close").performClick()
    }
}
