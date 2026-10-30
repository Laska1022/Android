package com.laska.devicescope.core.hardware

/** Metadata is still reported data: strings must not disguise invalid numeric sentinels. */
internal fun formatSensorMetadata(name: String, vendor: String, type: String, unit: String,
    maximumRange: Float, resolution: Float, powerMilliAmps: Float, minimumDelayMicros: Int): String {
    fun quantity(value: Float, suffix: String): String =
        if (value.isFinite() && value >= 0f) "$value $suffix" else "unavailable (invalid Android metadata)"
    // Sensor.getMinDelay documents -1 for one-shot sensors and 0 for non-periodic reporting.
    val delay = when {
        minimumDelayMicros == -1 -> "not applicable (one-shot sensor)"
        minimumDelayMicros == 0 -> "not periodic (on-change or special trigger)"
        minimumDelayMicros > 0 -> "$minimumDelayMicros us"
        else -> "unavailable (invalid Android metadata)"
    }
    return "$name | vendor=$vendor | type=$type | range=${quantity(maximumRange, unit)} | " +
        "resolution=${quantity(resolution, unit)} | power=${quantity(powerMilliAmps, "mA")} | minimum delay=$delay"
}
