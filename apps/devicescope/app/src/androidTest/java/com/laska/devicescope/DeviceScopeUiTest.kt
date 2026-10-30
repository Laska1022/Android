package com.laska.devicescope

import android.graphics.Bitmap
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laska.devicescope.core.designsystem.DeviceScopeTheme
import com.laska.devicescope.core.hardware.HardwareMetrics as H
import com.laska.devicescope.core.model.*
import com.laska.devicescope.feature.dashboard.DeviceScopeScreen
import com.laska.devicescope.feature.dashboard.ExplorerState
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/** All visible fixtures use the sample banner. These are UI checks, not sensor evidence. */
@RunWith(AndroidJUnit4::class)
class DeviceScopeUiTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val sampled = SampleTime(1_700_000_000_000, 10_000)
    private fun fixture(memory: Reading<Long> = Reading.Available(3_435_973_837L)): ExplorerState {
        val measurements = listOf(
            Measurement(H.MEMORY_AVAILABLE, memory, "Sample ActivityManager", Provenance.MEASURED, sampled),
            Measurement(H.STORAGE_APP_DATA_AVAILABLE, Reading.Unsupported("Sample unavailable volume"), "Sample StatFs", Provenance.REPORTED, sampled),
            Measurement(H.CPU_SOC_MODEL, Reading.PermissionRequired("sample.permission", "Sample restricted field"), "Sample Build", Provenance.REPORTED, sampled),
            Measurement(H.DISPLAY_REFRESH_RATE, Reading.Error("Sample display read failure"), "Sample display", Provenance.REPORTED, sampled),
            Measurement(H.DEVICE_MANUFACTURER, Reading.Available("Sample manufacturer"), "Sample Build", Provenance.REPORTED, sampled),
            Measurement(H.CPU_TEMPERATURE, Reading.Unsupported("No public CPU temperature source"), "Sample SDK assessment", Provenance.REPORTED, sampled),
        )
        val capabilities = measurements.map { Capability(it.key, minimumIntervalMillis = if (it.key == H.MEMORY_AVAILABLE) 2_000 else 0) }
        return ExplorerState(HardwareSnapshot(measurements, capabilities), true, 10_000)
    }

    private fun show(state: ExplorerState = fixture(), width: Int = 360, fontScale: Float = 1f, dark: Boolean = true) {
        rule.setContent {
            CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, fontScale)) {
                DeviceScopeTheme(darkTheme = dark) {
                    Box(Modifier.requiredSize(width.dp, 700.dp).testTag("device-frame")) { DeviceScopeScreen(state, sampleData = true) }
                }
            }
        }
    }

    private fun description(tag: String): String = rule.onNodeWithTag(tag).fetchSemanticsNode()
        .config[SemanticsProperties.ContentDescription].joinToString(" ")

    @Test fun availableValueHasUnitSourceAndOneMergedAccessibleAction() {
        show()
        rule.onNodeWithTag("sample-banner").assertIsDisplayed()
        val card = rule.onNodeWithTag("metric-memory.available").assertHasClickAction()
        val text = description("metric-memory.available")
        assertTrue(text.contains("gibibytes")); assertTrue(text.contains("Sample ActivityManager"))
        assertEquals(1, Regex("Memory available").findAll(text).count())
        card.performClick()
        rule.onNodeWithTag("source-details").assertIsDisplayed()
        rule.onNodeWithText("Source: Sample ActivityManager").assertExists()
        rule.onNodeWithText("Close").performClick()
        card.assertExists()
    }

    @Test fun partialUnavailablePermissionAndErrorDoNotBecomeZero() {
        show()
        for ((id, expected) in listOf("storage.app_data.available" to "Unavailable", "cpu.soc_model" to "Permission needed", "display.refresh_rate" to "Couldn’t read this value")) {
            rule.onNodeWithTag("overview-list").performScrollToNode(hasTestTag("metric-$id"))
            val text = description("metric-$id")
            assertTrue(text.contains(expected)); assertFalse(text.contains("0 GiB")); assertFalse(text.contains("0 Hz"))
        }
        rule.onNodeWithTag("overview-list").performScrollToNode(hasTestTag("metric-cpu.soc_model"))
        rule.onNodeWithTag("metric-cpu.soc_model").performClick()
        rule.onNodeWithText("This version does not request additional access for this field.", substring = true).assertExists()
        rule.onNodeWithText("Allow access").assertDoesNotExist()
    }

    @Test fun navigationBackAndRestorationKeepTheSelectedCategory() {
        val restoration = StateRestorationTester(rule)
        restoration.setContent { DeviceScopeTheme { DeviceScopeScreen(fixture(), sampleData = true) } }
        rule.onNodeWithTag("nav-1").performClick()
        rule.onNodeWithTag("section-cpu").performClick()
        rule.onNodeWithTag("detail-list").performScrollToNode(hasTestTag("metric-cpu.temperature"))
        assertTrue(description("metric-cpu.temperature").contains("Unavailable"))
        restoration.emulateSavedInstanceStateRestore()
        rule.onNodeWithTag("detail-list").assertExists()
        rule.onNodeWithTag("nav-0").performClick()
        rule.onNodeWithTag("nav-1").performClick()
        rule.onNodeWithTag("detail-list").assertExists()
    }

    @Test fun stalePausedAndFreshStatesRetainTheActualSample() {
        val state = mutableStateOf(fixture())
        rule.setContent { DeviceScopeTheme { DeviceScopeScreen(state.value, sampleData = true) } }
        rule.runOnIdle { state.value = state.value.copy(nowElapsedMillis = 14_001) }
        assertTrue(description("metric-memory.available").contains("Stale"))
        rule.runOnIdle { state.value = state.value.copy(collecting = false) }
        assertTrue(description("metric-memory.available").contains("Paused"))
        assertTrue(description("metric-memory.available").contains("gibibytes"))
        rule.runOnIdle { state.value = state.value.copy(collecting = true, nowElapsedMillis = 10_000) }
        assertTrue(description("metric-memory.available").contains("Available"))
    }

    @Test fun loadingAndWholeStreamErrorHaveHonestActions() {
        val state = mutableStateOf(ExplorerState())
        var retries = 0
        rule.setContent { DeviceScopeTheme { DeviceScopeScreen(state.value, sampleData = true, onRetry = { retries++ }) } }
        assertTrue(description("metric-memory.available").contains("Loading"))
        rule.runOnIdle { state.value = ExplorerState(failed = true) }
        rule.onNodeWithTag("metric-memory.available").assertDoesNotExist()
        rule.onNodeWithTag("retry").performClick()
        rule.runOnIdle { assertEquals(1, retries) }
    }

    @Test fun monitorAndReportsDoNotPretendToStartCollection() {
        val requirements = mutableListOf<Boolean>()
        rule.setContent { DeviceScopeTheme { DeviceScopeScreen(fixture(), sampleData = true, onCollectionNeeded = { requirements.add(it) }) } }
        rule.onNodeWithTag("nav-2").performClick()
        rule.onNodeWithText("Live sessions are coming next").assertExists()
        rule.onNodeWithTag("nav-3").performClick()
        rule.onNodeWithText("Reports are not available yet").assertExists()
        rule.runOnIdle { assertEquals(false, requirements.last()) }
        rule.onNodeWithTag("nav-0").performClick()
        rule.runOnIdle { assertEquals(true, requirements.last()) }
    }

    @Test fun phoneAtTwoHundredPercentTextKeepsActionsAndValuesAccessible() {
        show(width = 320, fontScale = 2f)
        rule.onNodeWithTag("overview-list").performScrollToNode(hasTestTag("metric-memory.available"))
        val bounds = rule.onNodeWithTag("metric-memory.available").fetchSemanticsNode().boundsInRoot
        val root = rule.onNodeWithTag("device-frame").fetchSemanticsNode().boundsInRoot
        assertTrue(bounds.left >= root.left); assertTrue(bounds.right <= root.right)
        for (index in 0..3) rule.onNodeWithTag("nav-$index").assertIsDisplayed().assertHasClickAction()
        screenshot("phone-large-text.png")
    }

    @Test fun phoneDarkReference() { show(); screenshot("phone-dark.png") }

    @Test fun expandedLayoutKeepsCategoryAndDetailsVisible() {
        show(width = 900, dark = false)
        rule.onNodeWithTag("nav-1").performClick()
        rule.onNodeWithTag("hardware-list").assertIsDisplayed()
        rule.onNodeWithTag("detail-list").assertIsDisplayed()
        rule.onNodeWithTag("section-device").assertIsSelected()
        rule.onNodeWithTag("section-cpu").performClick()
        rule.onNodeWithTag("detail-list").assertExists()
        screenshot("tablet-light.png")
    }

    @Test fun overviewBackReachesTheHostEvenWithRetainedHardwareSelection() {
        var hostBacks = 0
        rule.setContent {
            BackHandler { hostBacks++ }
            DeviceScopeTheme { DeviceScopeScreen(fixture(), sampleData = true) }
        }
        rule.onNodeWithTag("nav-1").performClick()
        rule.onNodeWithTag("section-cpu").performClick()
        rule.onNodeWithTag("nav-0").performClick()
        rule.runOnUiThread { rule.activity.onBackPressedDispatcher.onBackPressed() }
        rule.runOnIdle { assertEquals(1, hostBacks) }
    }

    @Test fun openSourceDialogPreservesReadFailureInsteadOfCallingItMissingFeature() {
        val state = mutableStateOf(fixture())
        rule.setContent { DeviceScopeTheme { DeviceScopeScreen(state.value, sampleData = true) } }
        rule.onNodeWithTag("metric-memory.available").performClick()
        rule.runOnIdle { state.value = ExplorerState(failed = true) }
        rule.onNode(hasText("Couldn’t read this value") and hasAnyAncestor(hasTestTag("source-details"))).assertExists()
        rule.onNodeWithText("Not available in this version").assertDoesNotExist()
        rule.onNodeWithText("Source: Sample ActivityManager").assertDoesNotExist()
    }

    private fun screenshot(name: String) {
        rule.waitForIdle()
        val image = rule.onNodeWithTag("device-frame").captureToImage().asAndroidBitmap()
        File(rule.activity.cacheDir, name).outputStream().use { image.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
}
