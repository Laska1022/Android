package com.laska.devicescope

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
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
        rule.onNodeWithContentDescription("No universal public Android API", substring = true).assertExists()
    }
}
