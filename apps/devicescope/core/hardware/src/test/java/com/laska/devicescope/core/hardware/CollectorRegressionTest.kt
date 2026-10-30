package com.laska.devicescope.core.hardware

import com.laska.devicescope.core.model.Reading
import org.junit.Assert.*
import org.junit.Test

class CollectorRegressionTest {
    @Test fun unknownCapacityNeverLooksLikeZeroFreeBytes() {
        assertTrue(availableCapacity(0, 0) is Reading.TemporarilyUnavailable)
        assertTrue(availableCapacity(-1, 0) is Reading.TemporarilyUnavailable)
        assertTrue(availableCapacity(10, -1) is Reading.TemporarilyUnavailable)
        assertTrue(availableCapacity(10, 11) is Reading.TemporarilyUnavailable)
    }
    @Test fun exhaustedValidCapacityIsStillARealZero() {
        assertEquals(Reading.Available(0L), availableCapacity(100, 0))
        assertEquals(Reading.Available(100L), availableCapacity(100, 100))
    }
    @Test fun sensorMetadataDoesNotPrintInvalidNumbersAsReadings() {
        val result = formatSensorMetadata("test sensor", "test vendor", "test.type", "m/s²", Float.NaN, Float.POSITIVE_INFINITY, -1f, -5)
        assertFalse(result.contains("NaN"))
        assertFalse(result.contains("Infinity"))
        assertFalse(result.contains("-1.0 mA"))
        assertFalse(result.contains("-5 us"))
        assertTrue(result.contains("unavailable"))
    }
    @Test fun oneShotDelaySentinelIsNotANegativeInterval() {
        val result = formatSensorMetadata("test sensor", "test vendor", "test.type", "count", 1f, 1f, 0f, -1)
        assertFalse(result.contains("-1 us"))
        assertTrue(result.contains("one-shot"))
        assertTrue(result.contains("power=0.0 mA"))
    }
    @Test fun zeroSensorDelayDescribesNonPeriodicReporting() {
        val result = formatSensorMetadata("test sensor", "test vendor", "test.type", "count", 1f, 1f, 0f, 0)
        assertTrue(result.contains("not periodic"))
    }
    @Test fun validSensorMetadataRetainsValuesAndUnits() {
        val result = formatSensorMetadata("test sensor", "test vendor", "test.type", "m/s²", 20f, 0.1f, 0f, 10000)
        assertTrue(result.contains("range=20.0 m/s²"))
        assertTrue(result.contains("resolution=0.1 m/s²"))
        assertTrue(result.contains("minimum delay=10000 us"))
    }
}
