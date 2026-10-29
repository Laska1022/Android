package com.laska.devicescope.core.hardware

import com.laska.devicescope.core.model.*

/** Canonical typed IDs; UI may format Reading.Available<*> by runtime scalar/list type. */
object HardwareMetrics {
    val GPU_RENDERER = MetricKey<String>("gpu.renderer", MetricUnit.TEXT)
    val GPU_VENDOR = MetricKey<String>("gpu.vendor", MetricUnit.TEXT)
    val GPU_OPENGL_VERSION = MetricKey<String>("gpu.opengl_version", MetricUnit.TEXT)
    val DEVICE_MANUFACTURER = MetricKey<String>("device.manufacturer", MetricUnit.TEXT)
    val DEVICE_MODEL = MetricKey<String>("device.model", MetricUnit.TEXT)
    val SYSTEM_ANDROID_VERSION = MetricKey<String>("system.android_version", MetricUnit.TEXT)
    val SYSTEM_SECURITY_PATCH = MetricKey<String>("system.security_patch", MetricUnit.TEXT)
    val SYSTEM_BUILD = MetricKey<String>("system.build", MetricUnit.TEXT)
    val CPU_SOC_MODEL = MetricKey<String>("cpu.soc_model", MetricUnit.TEXT)
    val CPU_SOC_MANUFACTURER = MetricKey<String>("cpu.soc_manufacturer", MetricUnit.TEXT)
    val CPU_ABIS = MetricKey<List<String>>("cpu.abis", MetricUnit.TEXT)
    val CPU_LOGICAL_PROCESSORS = MetricKey<Long>("cpu.logical_processors", MetricUnit.COUNT)
    val SENSOR_INVENTORY = MetricKey<List<String>>("sensor.inventory", MetricUnit.TEXT)
    val CAMERA_INVENTORY = MetricKey<List<String>>("camera.inventory", MetricUnit.TEXT)
    val SYSTEM_UPTIME = MetricKey<Long>("system.uptime", MetricUnit.MILLISECONDS)
    val MEMORY_TOTAL = MetricKey<Long>("memory.total", MetricUnit.BYTES)
    val MEMORY_AVAILABLE = MetricKey<Long>("memory.available", MetricUnit.BYTES)
    val MEMORY_USED = MetricKey<Long>("memory.used", MetricUnit.BYTES)
    val STORAGE_APP_DATA_TOTAL = MetricKey<Long>("storage.app_data.total", MetricUnit.BYTES)
    val STORAGE_APP_DATA_AVAILABLE = MetricKey<Long>("storage.app_data.available", MetricUnit.BYTES)
    val DISPLAY_WIDTH = MetricKey<Long>("display.width", MetricUnit.PIXELS)
    val DISPLAY_HEIGHT = MetricKey<Long>("display.height", MetricUnit.PIXELS)
    val DISPLAY_REFRESH_RATE = MetricKey<Double>("display.refresh_rate", MetricUnit.HERTZ)
    val DISPLAY_DENSITY = MetricKey<Long>("display.density", MetricUnit.DPI)
    val DISPLAY_SUPPORTED_MODES = MetricKey<List<String>>("display.supported_modes", MetricUnit.TEXT)
    val DISPLAY_HDR_TYPES = MetricKey<List<String>>("display.hdr_types", MetricUnit.TEXT)
    val NETWORK_TRANSPORTS = MetricKey<List<String>>("network.transports", MetricUnit.TEXT)
    val CPU_TEMPERATURE = MetricKey<Double>("cpu.temperature", MetricUnit.CELSIUS)
    val GPU_TEMPERATURE = MetricKey<Double>("gpu.temperature", MetricUnit.CELSIUS)
    val CPU_FREQUENCY = MetricKey<Double>("cpu.frequency", MetricUnit.HERTZ)
    val CPU_UTILIZATION = MetricKey<Double>("cpu.utilization", MetricUnit.RATIO)
    fun cameraToken(id: String): String {
        require(id.isNotEmpty())
        return "id_" + id.encodeToByteArray().joinToString("") { "%02x".format(it) }
    }
    fun cameraField(id: String, field: String): MetricKey<String> {
        require(field in setOf("facing", "hardware_level", "focal_lengths"))
        return MetricKey("camera.${cameraToken(id)}.$field", MetricUnit.TEXT)
    }
}

/** Preserve availability and metadata; no unchecked generic cast or default zero. */
fun HardwareSnapshot.findMetric(id: String): Measurement<*>? = measurements.firstOrNull { it.key.id == id }
