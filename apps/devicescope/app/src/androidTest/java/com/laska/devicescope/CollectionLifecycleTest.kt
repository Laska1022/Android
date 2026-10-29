package com.laska.devicescope

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.lifecycle.Lifecycle
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laska.devicescope.core.designsystem.DeviceScopeTheme
import com.laska.devicescope.core.model.HardwareRepository
import com.laska.devicescope.core.model.HardwareSnapshot
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
                maximum.updateAndGet { maxOf(it, count) }
                try {
                    emit(HardwareSnapshot(emptyList(), emptyList()))
                    awaitCancellation()
                } finally { active.decrementAndGet() }
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
}
