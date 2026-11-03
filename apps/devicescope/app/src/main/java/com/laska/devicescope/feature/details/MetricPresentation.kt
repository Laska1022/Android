package com.laska.devicescope.feature.details

import com.laska.devicescope.core.model.*
import java.text.NumberFormat
import java.util.Locale

/** UI formatting only. Availability and values always come from the canonical model. */
enum class DisplayState { AVAILABLE, STALE, PAUSED, UNSUPPORTED, PERMISSION, WAITING, ERROR, LOADING, NOT_IMPLEMENTED }

data class MetricPresentation(
    val state: DisplayState,
    val value: String? = null,
    val spokenValue: String? = null,
    val explanation: String? = null,
    val source: String? = null,
    val provenance: Provenance? = null,
    val sampledAt: SampleTime? = null,
    val intervalMillis: Long = 0,
    val exactValue: String? = null,
)

fun presentMetric(
    measurement: Measurement<*>?,
    capability: Capability?,
    nowElapsedMillis: Long,
    collecting: Boolean,
    discovered: Boolean,
    locale: Locale,
): MetricPresentation {
    if (measurement == null) return MetricPresentation(when {
        !discovered -> DisplayState.LOADING
        capability?.availability == Availability.UNSUPPORTED -> DisplayState.UNSUPPORTED
        capability != null -> DisplayState.WAITING
        else -> DisplayState.NOT_IMPLEMENTED
    })
    val interval = capability?.minimumIntervalMillis ?: 0
    val base = MetricPresentation(DisplayState.AVAILABLE, source = measurement.source,
        provenance = measurement.provenance, sampledAt = measurement.sampledAt, intervalMillis = interval)
    return when (val reading = measurement.result) {
        is Reading.Unsupported -> base.copy(state = DisplayState.UNSUPPORTED, explanation = reading.explanation)
        is Reading.PermissionRequired -> base.copy(state = DisplayState.PERMISSION, explanation = reading.explanation)
        is Reading.TemporarilyUnavailable -> base.copy(state = DisplayState.WAITING, explanation = reading.explanation)
        is Reading.Error -> base.copy(state = DisplayState.ERROR, explanation = reading.explanation)
        is Reading.Available<*> -> {
            val formatted = formatValue(reading.value, measurement.key.unit, measurement.key.id, locale)
                ?: return base.copy(state = DisplayState.ERROR)
            val age = nowElapsedMillis - measurement.sampledAt.elapsedRealtimeMillis
            val state = when {
                measurement.freshness == Freshness.PAUSED || (!collecting && interval > 0) -> DisplayState.PAUSED
                measurement.freshness == Freshness.STALE || (interval > 0 && (age < 0 || (age > interval && age - interval > interval))) -> DisplayState.STALE
                else -> DisplayState.AVAILABLE
            }
            base.copy(state = state, value = formatted.first, spokenValue = formatted.second,
                exactValue = if (measurement.key.unit == MetricUnit.BYTES && reading.value is Number)
                    "${NumberFormat.getIntegerInstance(locale).format(reading.value)} bytes" else null)
        }
    }
}

/** Do not coerce unknown value types, non-finite numbers, or unavailable values to zero. */
internal fun formatValue(value: Any, unit: MetricUnit, id: String, locale: Locale): Pair<String, String>? {
    if (unit == MetricUnit.TEXT) return when (value) {
        is String -> value.takeIf { it.isNotBlank() }?.let { it to it }
        is List<*> -> if (value.all { it is String }) value.joinToString("\n").let { it to it } else null
        else -> null
    }
    val number = when (value) {
        is Long -> value.toDouble()
        is Int -> value.toDouble()
        is Double -> value
        is Float -> value.toDouble()
        else -> return null
    }
    if (!number.isFinite()) return null
    fun n(v: Double, digits: Int = 0) = NumberFormat.getNumberInstance(locale).apply {
        minimumFractionDigits = 0; maximumFractionDigits = digits
    }.format(v)
    fun result(v: Double, suffix: String, spoken: String, digits: Int = 0): Pair<String, String> =
        "${n(v, digits)} $suffix" to "${n(v, digits)} $spoken"
    return when (unit) {
        MetricUnit.CELSIUS -> result(number, "°C", "degrees Celsius", 1)
        MetricUnit.BYTES -> when {
            number < 0 -> null
            number >= 1_073_741_824 -> result(number / 1_073_741_824, "GiB", "gibibytes", 2)
            number >= 1_048_576 -> result(number / 1_048_576, "MiB", "mebibytes", 2)
            else -> result(number, "B", "bytes")
        }
        MetricUnit.MICROAMPS -> result(number / 1_000, "mA", "milliamps", 1)
        MetricUnit.MILLIVOLTS -> result(number / 1_000, "V", "volts", 2)
        // Only named bounded fractions may be percentages. Headroom is dimensionless.
        MetricUnit.RATIO -> if (id == "battery.level" || id == "cpu.utilization") {
            if (number in 0.0..1.0) result(number * 100, "%", "percent", 1) else null
        } else n(number, 2).let { it to it }
        MetricUnit.COUNT -> if (number < 0 || number % 1.0 != 0.0) null else
            NumberFormat.getIntegerInstance(locale).format(value).let { it to it }
        MetricUnit.HERTZ -> result(number, "Hz", "hertz", 2)
        MetricUnit.PIXELS -> result(number, "px", "pixels")
        MetricUnit.DPI -> result(number, "dpi", "dots per inch")
        MetricUnit.MILLISECONDS -> {
            if (number < 0) null else {
                val minutes = number.toLong() / 60_000
                "${n((minutes / 60).toDouble())} h ${n((minutes % 60).toDouble())} min" to
                    "${n((minutes / 60).toDouble())} hours ${n((minutes % 60).toDouble())} minutes"
            }
        }
        MetricUnit.TEXT -> null
    }
}
