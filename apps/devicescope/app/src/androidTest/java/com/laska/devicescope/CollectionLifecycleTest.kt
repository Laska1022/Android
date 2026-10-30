package com.laska.devicescope

import android.util.Log
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.lifecycle.Lifecycle
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laska.devicescope.core.designsystem.DeviceScopeTheme
import com.laska.devicescope.core.model.*
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.flow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.atomic.AtomicInteger

@RunWith(AndroidJUnit4::class)
class CollectionLifecycleTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun leavingHardwareOrBackgroundingCancelsTheOnlyCollector() {
        val active = AtomicInteger()
        val starts = AtomicInteger()
        val maximum = AtomicInteger()
        val repository = object : HardwareRepository {
            override fun observe() = flow {
                starts.incrementAndGet()
                val count = active.incrementAndGet()
                Log.i("DeviceScopeLifecycleTest", "start: starts=${starts.get()}, active=$count")
                maximum.updateAndGet { maxOf(it, count) }
                try {
                    emit(HardwareSnapshot(emptyList(), emptyList()))
                    awaitCancellation()
                } finally { Log.i("DeviceScopeLifecycleTest", "stop: active=${active.decrementAndGet()}") }
            }
        }
        rule.setContent { DeviceScopeTheme { DeviceScopeRoute(repository, sampleData = true) } }
        rule.waitUntil(10_000) { active.get() == 1 }
        rule.onNodeWithTag("nav-2").performClick()
        rule.waitUntil(10_000) { active.get() == 0 }
        rule.onNodeWithTag("nav-0").performClick()
        rule.waitUntil(10_000) { starts.get() == 2 && active.get() == 1 }
        rule.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        rule.waitUntil(10_000) { active.get() == 0 }
        rule.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        rule.waitUntil(10_000) { starts.get() == 3 && active.get() == 1 }
        assertEquals(1, maximum.get())
    }

    @Test fun rediscoveryDoesNotShowOldPermissionRestrictedSnapshot() {
        val starts = AtomicInteger()
        val key = MetricKey<Long>("memory.available", MetricUnit.BYTES)
        val repository = object : HardwareRepository {
            override fun observe() = flow {
                if (starts.incrementAndGet() == 1) {
                    emit(HardwareSnapshot(listOf(Measurement(key, Reading.Available(1_073_741_824L),
                        "Sample previous authorized reading", Provenance.REPORTED, SampleTime(1_000, 1_000))), listOf(Capability(key))))
                }
                awaitCancellation() // Second discovery has not confirmed access or emitted data yet.
            }
        }
        rule.setContent { DeviceScopeTheme { DeviceScopeRoute(repository, sampleData = true) } }
        rule.waitUntil(10_000) { starts.get() == 1 }
        rule.onNodeWithContentDescription("Sample previous authorized reading", substring = true).assertExists()
        rule.onNodeWithTag("nav-2").performClick()
        rule.onNodeWithTag("nav-0").performClick()
        rule.waitUntil(10_000) { starts.get() == 2 }
        rule.onNodeWithContentDescription("Sample previous authorized reading", substring = true).assertDoesNotExist()
        rule.onNodeWithTag("metric-memory.available").assertExists()
    }
}
