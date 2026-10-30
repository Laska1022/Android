package com.laska.devicescope.core.hardware

import com.laska.devicescope.core.model.*
import kotlinx.coroutines.CancellationException

/** Field failures are isolated and exception text (potentially identifying) never leaves here. */
internal class ReadingCollector(private val api: Int, private val time: SampleTime) {
    private val measurements = mutableListOf<Measurement<*>>()
    private val capabilities = mutableListOf<Capability>()
    fun <T : Any> field(key: MetricKey<T>, source: String, minApi: Int = 26,
        permission: String? = null, interval: Long = 0, provenance: Provenance = Provenance.REPORTED,
        read: () -> Reading<T>) {
        val result = if (api < minApi) Reading.Unsupported("Requires Android API $minApi or newer") else try {
            read()
        } catch (cancelled: CancellationException) { throw cancelled
        } catch (_: SecurityException) {
            if (permission != null) Reading.PermissionRequired(permission, "Android requires permission for this field")
            else Reading.Unsupported("Android restricts this field for ordinary applications")
        } catch (_: Exception) { Reading.Error("Android could not provide this field") }
        measurements += Measurement(key, result, source, provenance, time)
        capabilities += Capability(key, minApi, permission, interval, when (result) {
            is Reading.Available -> Availability.AVAILABLE
            is Reading.Unsupported -> Availability.UNSUPPORTED
            else -> Availability.UNKNOWN
        })
    }
    fun snapshot() = HardwareSnapshot(measurements.toList(), capabilities.toList())
}

internal fun textReading(value: String?): Reading<String> =
    if (value.isNullOrBlank() || value.equals("unknown", ignoreCase = true))
        Reading.TemporarilyUnavailable("Android did not report a value")
    else Reading.Available(value)

internal fun nonNegative(value: Long): Reading<Long> = if (value < 0)
    Reading.TemporarilyUnavailable("Android returned an invalid or sentinel value") else Reading.Available(value)

internal fun positive(value: Long): Reading<Long> = if (value <= 0)
    Reading.TemporarilyUnavailable("Android did not report a positive value") else Reading.Available(value)

internal fun positive(value: Double): Reading<Double> = if (!value.isFinite() || value <= 0)
    Reading.TemporarilyUnavailable("Android did not report a finite positive value") else Reading.Available(value)

internal fun usedMemory(total: Long, available: Long): Reading<Long> = if (total <= 0 || available < 0 || available > total)
    Reading.TemporarilyUnavailable("Android returned inconsistent RAM counters") else Reading.Available(total - available)

// Shared path for RAM and app-data storage capacity pairs.
internal fun availableCapacity(total: Long, available: Long): Reading<Long> =
    if (total <= 0 || available < 0 || available > total)
        Reading.TemporarilyUnavailable("Android returned unavailable or inconsistent capacity counters")
    else Reading.Available(available)
