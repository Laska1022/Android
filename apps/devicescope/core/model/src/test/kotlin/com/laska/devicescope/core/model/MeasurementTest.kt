package com.laska.devicescope.core.model

import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class MeasurementTest {
    private val key = MetricKey<Double>("battery.temperature", MetricUnit.CELSIUS)
    @Test fun availableRetainsMetadata() {
        val reading = Measurement(key, Reading.Available(25.0), "test fixture: battery broadcast", Provenance.REPORTED, SampleTime(1000, 50))
        assertEquals(25.0, (reading.result as Reading.Available).value, 0.0)
        assertEquals(MetricUnit.CELSIUS, reading.key.unit)
        assertEquals(50, reading.sampledAt.elapsedRealtimeMillis)
        assertEquals(Freshness.PAUSED, reading.copy(freshness = Freshness.PAUSED).freshness)
    }
    @Test fun unsupportedHasReasonInsteadOfValue() {
        val reading: Reading<Double> = Reading.Unsupported("No public CPU thermometer API")
        assertFalse(reading is Reading.Available)
    }
    @Test fun unavailableStatesRemainDistinct() {
        val states = listOf(Reading.Unsupported("absent"), Reading.PermissionRequired("permission", "denied"),
            Reading.TemporarilyUnavailable("retry"), Reading.Error("failed"))
        assertEquals(4, states.map { it.javaClass }.distinct().size)
    }
    @Test fun nonFiniteValuesRejected() {
        listOf(Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY).forEach { value ->
            assertThrows(IllegalArgumentException::class.java) { Reading.Available(value) }
        }
    }
    @Test fun invalidMetadataRejected() {
        assertThrows(IllegalArgumentException::class.java) { SampleTime(1, -1) }
        assertThrows(IllegalArgumentException::class.java) { Reading.Unsupported("") }
        assertThrows(IllegalArgumentException::class.java) { MetricKey<Long>("", MetricUnit.BYTES) }
    }
    @Test fun duplicateMetricIdsRejected() {
        val m = Measurement(key, Reading.Unsupported("test fixture"), "test", Provenance.REPORTED, SampleTime(1, 1))
        assertThrows(IllegalArgumentException::class.java) { HardwareSnapshot(listOf(m, m), emptyList()) }
    }
    @Test fun deterministicFakeIsTestOnly() = runBlocking {
        val expected = HardwareSnapshot(emptyList(), listOf(Capability(key)))
        val fake = object : HardwareRepository { override fun observe() = flowOf(expected) }
        assertEquals(expected, fake.observe().first())
        assertEquals(Availability.UNKNOWN, expected.capabilities.single().availability)
    }
}
