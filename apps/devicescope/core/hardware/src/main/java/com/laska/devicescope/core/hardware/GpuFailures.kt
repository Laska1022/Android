package com.laska.devicescope.core.hardware

import com.laska.devicescope.core.model.Reading
import kotlinx.coroutines.CancellationException

/** Includes EGL preflight and cleanup, not just context creation/query. */
internal fun gpuReading(query: () -> Reading<Map<Int, String?>>): Reading<Map<Int, String?>> = try {
    query()
} catch (cancelled: CancellationException) {
    throw cancelled
} catch (_: Exception) {
    Reading.Error("Android could not complete the public OpenGL query")
}

/** One broken release must not prevent independent resources from being released. */
internal fun releaseGpuResources(vararg releases: () -> Boolean): Boolean {
    var released = true
    var cancellation: CancellationException? = null
    releases.forEach { release ->
        try {
            if (!release()) released = false
        } catch (cancelled: CancellationException) {
            cancellation = cancelled
        } catch (_: Exception) {
            released = false
        }
    }
    cancellation?.let { throw it }
    return released
}
