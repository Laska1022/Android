package com.laska.devicescope.core.hardware

import com.laska.devicescope.core.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.junit.Assert.*
import org.junit.Test

class HardwareContractTest {
    private val time = SampleTime(1000, 50)
    private val key = MetricKey<Long>("memory.available", MetricUnit.BYTES)
    @Test fun registryLookupAndCameraKeysPreserveIdentity() {
        val key = HardwareMetrics.MEMORY_AVAILABLE
        val m = Measurement(key, Reading.Available(42L), "test", Provenance.REPORTED, time)
        val snapshot = HardwareSnapshot(listOf(m), emptyList())
        assertSame(m, snapshot.findMetric(key.id))
        assertNull(snapshot.findMetric("missing"))
        assertNotEquals(HardwareMetrics.cameraField("0", "facing"), HardwareMetrics.cameraField("1", "facing"))
        assertEquals(HardwareMetrics.cameraField("USB:0", "facing"), HardwareMetrics.cameraField("USB:0", "facing"))
        assertEquals(MetricUnit.CELSIUS, HardwareMetrics.CPU_TEMPERATURE.unit)
    }
    @Test fun apiGuardDoesNotInvokeUnsupportedApi() {
        val collector = ReadingCollector(26, time)
        collector.field(key, "test", minApi = 31) { error("must not run") }
        assertTrue(collector.snapshot().measurements.single().result is Reading.Unsupported)
        assertEquals(Availability.UNSUPPORTED, collector.snapshot().capabilities.single().availability)
    }
    @Test fun permissionFailureIsIsolatedAndSanitized() {
        val collector = ReadingCollector(36, time)
        collector.field(key, "test", permission = "android.permission.CAMERA") { throw SecurityException("private identifier") }
        collector.field(MetricKey<String>("device.model", MetricUnit.TEXT), "Build.MODEL") { textReading("Example") }
        val result = collector.snapshot()
        assertTrue(result.measurements[0].result is Reading.PermissionRequired)
        assertTrue(result.measurements[1].result is Reading.Available)
        assertFalse(result.toString().contains("private identifier"))
        assertEquals(Availability.UNKNOWN, result.capabilities[0].availability)
    }
    @Test fun errorsDoNotBecomeZero() {
        val collector = ReadingCollector(36, time)
        collector.field(key, "test") { throw IllegalStateException("private path") }
        assertTrue(collector.snapshot().measurements.single().result is Reading.Error)
        assertFalse(collector.snapshot().toString().contains("private path"))
    }
    @Test fun cancellationIsNeverConvertedToAReading() {
        val collector = ReadingCollector(36, time)
        assertThrows(CancellationException::class.java) {
            collector.field(key, "test") { throw CancellationException("stop") }
        }
    }
    @Test fun textSentinelsAndMissingValuesAreUnavailable() {
        listOf(null, "", " ", "unknown", "UNKNOWN").forEach { assertTrue(textReading(it) is Reading.TemporarilyUnavailable) }
        assertEquals(Reading.Available("Pixel"), textReading("Pixel"))
    }
    @Test fun numericSentinelsAndNonFiniteValuesAreUnavailable() {
        assertTrue(nonNegative(Long.MIN_VALUE) is Reading.TemporarilyUnavailable)
        assertEquals(Reading.Available(0L), nonNegative(0)) // exhausted storage is a valid zero
        assertTrue(positive(0L) is Reading.TemporarilyUnavailable)
        listOf(Double.NaN, Double.POSITIVE_INFINITY, -1.0, 0.0).forEach {
            assertTrue(positive(it) is Reading.TemporarilyUnavailable)
        }
    }
    @Test fun memoryDerivationChecksCounterConsistency() {
        assertEquals(Reading.Available(60L), usedMemory(100, 40))
        assertEquals(Reading.Available(0L), usedMemory(100, 100))
        listOf(0L to 0L, 10L to 11L, 10L to -1L).forEach { (total, available) ->
            assertTrue(usedMemory(total, available) is Reading.TemporarilyUnavailable)
        }
    }
    @Test fun metadataAndCapabilityAreRetained() {
        val collector = ReadingCollector(36, time)
        collector.field(key, "MemoryInfo.availMem", interval = 2000) { nonNegative(42) }
        val snapshot = collector.snapshot()
        assertEquals(time, snapshot.measurements.single().sampledAt)
        assertEquals("MemoryInfo.availMem", snapshot.measurements.single().source)
        assertEquals(MetricUnit.BYTES, snapshot.measurements.single().key.unit)
        assertEquals(2000L, snapshot.capabilities.single().minimumIntervalMillis)
    }
    @Test fun streamIsColdReopensInventoryAndStopsPollingAfterCancellation() = runBlocking {
        var inventoryCalls = 0
        var currentCalls = 0
        val empty = HardwareSnapshot(emptyList(), emptyList())
        val source = object : HardwareSource {
            override fun inventory(): HardwareSnapshot { inventoryCalls++; return empty }
            override fun current(): HardwareSnapshot { currentCalls++; return empty }
        }
        val repository = PollingHardwareRepository(source, 1, Dispatchers.Unconfined)
        val flow = repository.observe()
        assertEquals(0, inventoryCalls)
        assertEquals(2, flow.take(2).toList().size)
        assertEquals(1, inventoryCalls)
        val stoppedAt = currentCalls
        assertTrue(stoppedAt in 2..3) // At most one rendezvous emission was in flight.
        delay(10)
        assertEquals(stoppedAt, currentCalls)
        flow.first()
        assertEquals(2, inventoryCalls)
        val reopenedAt = currentCalls
        assertTrue(reopenedAt in (stoppedAt + 1)..(stoppedAt + 2))
        delay(10)
        assertEquals(reopenedAt, currentCalls)
    }
}
