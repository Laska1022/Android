package com.laska.devicescope.core.hardware

import com.laska.devicescope.core.model.Reading
import kotlinx.coroutines.CancellationException
import org.junit.Assert.*
import org.junit.Test

class GpuFailureTest {
    @Test fun preflightExceptionsStayInsideGpuReadings() {
        val result = gpuReading { throw IllegalStateException("private driver detail") }
        assertTrue(result is Reading.Error)
        assertFalse(result.toString().contains("private driver detail"))
    }
    @Test fun cleanupContinuesAfterADriverThrows() {
        val attempted = mutableListOf<String>()
        val released = releaseGpuResources(
            { attempted += "restore"; throw IllegalStateException("driver") },
            { attempted += "unbind"; true },
            { attempted += "surface"; true },
            { attempted += "context"; true },
            { attempted += "display"; true },
        )
        assertFalse(released)
        assertEquals(listOf("restore", "unbind", "surface", "context", "display"), attempted)
    }
    @Test fun falseCleanupResultCannotBecomeASuccessfulReading() {
        var displayReleased = false
        val result = gpuReading {
            check(releaseGpuResources({ false }, { displayReleased = true; true }))
            Reading.Available(mapOf(1 to "test fixture GPU"))
        }
        assertTrue(displayReleased)
        assertTrue(result is Reading.Error)
    }
    @Test fun successfulCleanupPreservesRealResult() {
        val result = gpuReading {
            check(releaseGpuResources({ true }, { true }))
            Reading.Available(mapOf(1 to "test fixture GPU"))
        }
        assertEquals(Reading.Available(mapOf(1 to "test fixture GPU")), result)
    }
    @Test fun cleanupCancellationStillAttemptsRemainingResources() {
        var finalResourceReleased = false
        val cancelled = CancellationException("stop collection")
        assertSame(cancelled, assertThrows(CancellationException::class.java) {
            releaseGpuResources({ throw cancelled }, { finalResourceReleased = true; true })
        })
        assertTrue(finalResourceReleased)
    }
    @Test fun cancellationIsNotSwallowedByGpuErrorHandling() {
        val cancelled = CancellationException("stop collection")
        assertSame(cancelled, assertThrows(CancellationException::class.java) { gpuReading { throw cancelled } })
    }
}
