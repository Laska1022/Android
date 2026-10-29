package com.laska.devicescope

import android.os.Bundle
import android.os.SystemClock
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import com.laska.devicescope.core.designsystem.DeviceScopeTheme
import com.laska.devicescope.core.hardware.AndroidHardwareRepository
import com.laska.devicescope.core.model.HardwareRepository
import com.laska.devicescope.feature.dashboard.DeviceScopeScreen
import com.laska.devicescope.feature.dashboard.ExplorerState
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val repository: HardwareRepository = AndroidHardwareRepository(applicationContext)
        setContent { DeviceScopeTheme { DeviceScopeRoute(repository) } }
    }
}

/** One cold repository collection, only for visible hardware screens while STARTED. */
@Composable
internal fun DeviceScopeRoute(repository: HardwareRepository, sampleData: Boolean = false) {
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var state by remember { mutableStateOf(ExplorerState()) }
    var required by remember { mutableStateOf(true) }
    var retry by remember { mutableIntStateOf(0) }
    var lastRetry by remember { mutableLongStateOf(-2_000) }
    LaunchedEffect(repository, lifecycle, required, retry) {
        if (!required) {
            state = state.copy(collecting = false)
            return@LaunchedEffect
        }
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            state = state.copy(collecting = true, failed = false)
            val clock = launch {
                while (true) {
                    state = state.copy(nowElapsedMillis = SystemClock.elapsedRealtime())
                    delay(1_000)
                }
            }
            try {
                repository.observe().collect { snapshot ->
                    state = ExplorerState(snapshot, true, SystemClock.elapsedRealtime())
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                // A failed whole stream must not masquerade as current cached measurements.
                state = ExplorerState(failed = true)
            } finally {
                clock.cancel()
                state = state.copy(collecting = false)
            }
        }
    }
    DeviceScopeScreen(state, sampleData = sampleData, onCollectionNeeded = { required = it }, onRetry = {
        val now = SystemClock.elapsedRealtime()
        if (now - lastRetry >= 2_000) { lastRetry = now; retry++ }
    })
}
