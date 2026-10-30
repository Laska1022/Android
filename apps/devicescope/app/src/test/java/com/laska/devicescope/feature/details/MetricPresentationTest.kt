package com.laska.devicescope.feature.details

import com.laska.devicescope.core.model.*
import org.junit.Assert.*
import org.junit.Test
import java.util.Locale

class MetricPresentationTest {
    private val key = MetricKey<Double>("battery.temperature", MetricUnit.CELSIUS)
    private val time = SampleTime(1_000_000, 10_000)
    private val capability = Capability(key, minimumIntervalMillis = 2_000)
    private fun sample(reading: Reading<Double>, freshness: Freshness = Freshness.FRESH) =
        Measurement(key, reading, "Battery broadcast", Provenance.MEASURED, time, freshness)
    private fun present(reading: Reading<Double>, now: Long = 10_000, active: Boolean = true, freshness: Freshness = Freshness.FRESH) =
        presentMetric(sample(reading, freshness), capability, now, active, true, Locale.US)

    @Test fun validZeroIsAReadingButUnavailableNeverBecomesZero() {
        assertEquals("0 °C", present(Reading.Available(0.0)).value)
        for (reading in listOf(Reading.Unsupported("No public source"), Reading.PermissionRequired("permission", "Denied"),
            Reading.TemporarilyUnavailable("Waiting"), Reading.Error("Read failed"))) {
            val result = present(reading)
            assertNull(result.value)
            assertNull(result.spokenValue)
            assertNotNull(result.explanation)
        }
    }

    @Test fun allUnavailableStatesRetainIdentityAndOverrideFreshness() {
        val inputs = listOf(Reading.Unsupported("No public source") to DisplayState.UNSUPPORTED,
            Reading.PermissionRequired("permission", "Denied") to DisplayState.PERMISSION,
            Reading.TemporarilyUnavailable("Waiting") to DisplayState.WAITING,
            Reading.Error("Read failed") to DisplayState.ERROR)
        for ((reading, expected) in inputs) {
            val result = present(reading, now = 80_000, active = false, freshness = Freshness.STALE)
            assertEquals(expected, result.state)
            assertEquals("Battery broadcast", result.source)
            assertEquals(time, result.sampledAt)
            assertNull(result.value)
        }
    }

    @Test fun dynamicFreshnessUsesActualMonotonicAgeAndStopsAtPause() {
        val reading = Reading.Available(34.6)
        assertEquals(DisplayState.AVAILABLE, present(reading, now = 14_000).state)
        assertEquals(DisplayState.STALE, present(reading, now = 14_001).state)
        assertEquals(DisplayState.STALE, present(reading, now = 9_999).state)
        val paused = present(reading, now = 80_000, active = false)
        assertEquals(DisplayState.PAUSED, paused.state)
        assertEquals("34.6 °C", paused.value)
        assertEquals(time, paused.sampledAt)
        assertEquals(DisplayState.PAUSED, present(reading, freshness = Freshness.PAUSED).state)
    }

    @Test fun staticFactsDoNotAgeWithDynamicPolling() {
        val result = presentMetric(sample(Reading.Available(34.6)), Capability(key), Long.MAX_VALUE,
            false, true, Locale.US)
        assertEquals(DisplayState.AVAILABLE, result.state)
    }

    @Test fun loadingDiscoveryAndUnimplementedDomainAreDistinct() {
        assertEquals(DisplayState.LOADING, presentMetric(null, null, 0, true, false, Locale.US).state)
        assertEquals(DisplayState.WAITING, presentMetric(null, capability, 0, true, true, Locale.US).state)
        assertEquals(DisplayState.NOT_IMPLEMENTED, presentMetric(null, null, 0, true, true, Locale.US).state)
        assertEquals(DisplayState.UNSUPPORTED, presentMetric(null,
            capability.copy(availability = Availability.UNSUPPORTED), 0, true, true, Locale.US).state)
    }

    @Test fun unitConversionsPreserveSignedCurrentAndHeadroomAboveOne() {
        assertEquals("-125 mA", formatValue(-125_000L, MetricUnit.MICROAMPS, "battery.current", Locale.US)?.first)
        assertEquals("4.02 V", formatValue(4_020L, MetricUnit.MILLIVOLTS, "battery.voltage", Locale.US)?.first)
        assertEquals("1.25", formatValue(1.25, MetricUnit.RATIO, "thermal.headroom", Locale.US)?.first)
        assertEquals("75 %", formatValue(.75, MetricUnit.RATIO, "battery.level", Locale.US)?.first)
        assertEquals("8 GiB", formatValue(8_589_934_592L, MetricUnit.BYTES, "memory.total", Locale.US)?.first)
    }

    @Test fun emptyInventoryIsSuccessfulAndUnknownTypesAreRejected() {
        assertEquals("", formatValue(emptyList<String>(), MetricUnit.TEXT, "sensor.inventory", Locale.US)?.first)
        assertNull(formatValue(listOf("sensor", 10), MetricUnit.TEXT, "sensor.inventory", Locale.US))
        assertNull(formatValue(Any(), MetricUnit.COUNT, "cpu.logical_processors", Locale.US))
        assertNull(formatValue(Double.NaN, MetricUnit.CELSIUS, "battery.temperature", Locale.US))
        assertNull(formatValue(-1L, MetricUnit.BYTES, "memory.total", Locale.US))
    }

    @Test fun localeChangesDisplayWithoutChangingCanonicalData() {
        val reading = sample(Reading.Available(34.6))
        val result = presentMetric(reading, capability, 10_000, true, true, Locale.GERMANY)
        assertEquals("34,6 °C", result.value)
        assertEquals(Reading.Available(34.6), reading.result)
        assertEquals("34,6 degrees Celsius", result.spokenValue)
    }

    @Test fun boundedPercentagesCannotOverflowAndHeadroomRemainsUnbounded() {
        for (value in listOf(-0.1, 1.01, Double.MAX_VALUE)) {
            assertNull(formatValue(value, MetricUnit.RATIO, "battery.level", Locale.US))
            assertNull(formatValue(value, MetricUnit.RATIO, "cpu.utilization", Locale.US))
        }
        assertEquals("1.25", formatValue(1.25, MetricUnit.RATIO, "thermal.headroom", Locale.US)?.first)
    }

    @Test fun integerCountsAndExactBytesDoNotLoseLongPrecision() {
        assertEquals("9,223,372,036,854,775,807", formatValue(Long.MAX_VALUE, MetricUnit.COUNT, "sensor.count", Locale.US)?.first)
        assertNull(formatValue(1.5, MetricUnit.COUNT, "sensor.count", Locale.US))
        assertNull(formatValue(-1L, MetricUnit.COUNT, "sensor.count", Locale.US))
        val bytes = MetricKey<Long>("memory.total", MetricUnit.BYTES)
        val reading = Measurement(bytes, Reading.Available(Long.MAX_VALUE), "Sample memory", Provenance.REPORTED, time)
        assertEquals("9,223,372,036,854,775,807 bytes", presentMetric(reading, Capability(bytes), 10_000, true, true, Locale.US).exactValue)
    }
}
