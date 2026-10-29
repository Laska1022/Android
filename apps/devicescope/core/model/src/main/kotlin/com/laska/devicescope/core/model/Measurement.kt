package com.laska.devicescope.core.model

import kotlinx.coroutines.flow.Flow

enum class MetricUnit { CELSIUS, RATIO, BYTES, MICROAMPS, MILLIVOLTS, MILLISECONDS, COUNT, HERTZ, PIXELS, DPI, TEXT }
enum class Provenance { REPORTED, MEASURED, ESTIMATED }
enum class Freshness { FRESH, STALE, PAUSED }
enum class Availability { AVAILABLE, UNSUPPORTED, UNKNOWN }

data class MetricKey<T : Any>(val id: String, val unit: MetricUnit) {
    init { require(id.matches(Regex("[a-z][a-z0-9_.]*"))) }
}

sealed interface Reading<out T : Any> {
    data class Available<T : Any>(val value: T) : Reading<T> {
        init {
            require(value !is Double || value.isFinite()) { "Non-finite readings are unavailable" }
            require(value !is Float || value.isFinite()) { "Non-finite readings are unavailable" }
        }
    }
    data class Unsupported(val explanation: String) : Reading<Nothing> { init { require(explanation.isNotBlank()) } }
    data class PermissionRequired(val permission: String, val explanation: String) : Reading<Nothing> {
        init { require(permission.isNotBlank() && explanation.isNotBlank()) }
    }
    data class TemporarilyUnavailable(val explanation: String) : Reading<Nothing> { init { require(explanation.isNotBlank()) } }
    data class Error(val explanation: String) : Reading<Nothing> { init { require(explanation.isNotBlank()) } }
}

data class SampleTime(val epochMillis: Long, val elapsedRealtimeMillis: Long) {
    init { require(epochMillis >= 0 && elapsedRealtimeMillis >= 0) }
}

data class Measurement<T : Any>(
    val key: MetricKey<T>, val result: Reading<T>, val source: String,
    val provenance: Provenance, val sampledAt: SampleTime, val freshness: Freshness = Freshness.FRESH,
) { init { require(source.isNotBlank()) } }

data class Capability(
    val key: MetricKey<*>, val minimumApi: Int = 26, val permission: String? = null,
    val minimumIntervalMillis: Long = 0, val availability: Availability = Availability.UNKNOWN,
) { init { require(minimumApi >= 1 && minimumIntervalMillis >= 0) } }

data class HardwareSnapshot(val measurements: List<Measurement<*>>, val capabilities: List<Capability>) {
    init {
        require(measurements.map { it.key.id }.distinct().size == measurements.size)
        require(capabilities.map { it.key.id }.distinct().size == capabilities.size)
    }
}

/** Cold, read-only stream. Cancellation must release collector resources. */
interface HardwareRepository { fun observe(): Flow<HardwareSnapshot> }
