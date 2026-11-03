package com.laska.devicescope.feature.details

import androidx.annotation.StringRes
import com.laska.devicescope.R
import com.laska.devicescope.core.hardware.HardwareMetrics as H

data class MetricField(val id: String, @param:StringRes val label: Int, @param:StringRes val hint: Int? = null)
data class HardwareSection(val id: String, @param:StringRes val title: Int, val fields: List<MetricField>)

val hardwareSections = listOf(
    HardwareSection("device", R.string.device_system, listOf(
        MetricField(H.DEVICE_MANUFACTURER.id, R.string.manufacturer), MetricField(H.DEVICE_MODEL.id, R.string.model),
        MetricField(H.SYSTEM_ANDROID_VERSION.id, R.string.android_version), MetricField(H.SYSTEM_SECURITY_PATCH.id, R.string.security_patch),
        MetricField(H.SYSTEM_BUILD.id, R.string.build_version), MetricField(H.SYSTEM_UPTIME.id, R.string.uptime, R.string.uptime_hint))),
    HardwareSection("cpu", R.string.cpu_soc, listOf(
        MetricField(H.CPU_SOC_MANUFACTURER.id, R.string.soc_manufacturer), MetricField(H.CPU_SOC_MODEL.id, R.string.soc_model),
        MetricField(H.CPU_ABIS.id, R.string.abis), MetricField(H.CPU_LOGICAL_PROCESSORS.id, R.string.logical_processors, R.string.logical_hint),
        MetricField(H.CPU_FREQUENCY.id, R.string.cpu_frequency), MetricField(H.CPU_UTILIZATION.id, R.string.cpu_utilization),
        MetricField(H.CPU_TEMPERATURE.id, R.string.cpu_temperature))),
    HardwareSection("gpu", R.string.gpu, listOf(
        MetricField(H.GPU_VENDOR.id, R.string.vendor), MetricField(H.GPU_RENDERER.id, R.string.renderer),
        MetricField(H.GPU_OPENGL_VERSION.id, R.string.opengl_version), MetricField(H.GPU_TEMPERATURE.id, R.string.gpu_temperature))),
    HardwareSection("memory", R.string.memory, listOf(
        MetricField(H.MEMORY_AVAILABLE.id, R.string.memory_available), MetricField(H.MEMORY_TOTAL.id, R.string.memory_total),
        MetricField(H.MEMORY_USED.id, R.string.memory_used, R.string.memory_hint))),
    HardwareSection("storage", R.string.storage, listOf(
        MetricField(H.STORAGE_APP_DATA_AVAILABLE.id, R.string.storage_available, R.string.storage_hint),
        MetricField(H.STORAGE_APP_DATA_TOTAL.id, R.string.storage_total, R.string.storage_hint))),
    HardwareSection("display", R.string.display, listOf(
        MetricField(H.DISPLAY_WIDTH.id, R.string.display_width), MetricField(H.DISPLAY_HEIGHT.id, R.string.display_height),
        MetricField(H.DISPLAY_REFRESH_RATE.id, R.string.refresh_rate, R.string.refresh_hint), MetricField(H.DISPLAY_DENSITY.id, R.string.density),
        MetricField(H.DISPLAY_SUPPORTED_MODES.id, R.string.display_modes), MetricField(H.DISPLAY_HDR_TYPES.id, R.string.hdr_types))),
    HardwareSection("cameras", R.string.cameras, listOf(MetricField(H.CAMERA_INVENTORY.id, R.string.camera_inventory))),
    HardwareSection("sensors", R.string.sensors, listOf(MetricField(H.SENSOR_INVENTORY.id, R.string.sensor_inventory))),
    HardwareSection("network", R.string.connectivity, listOf(MetricField(H.NETWORK_TRANSPORTS.id, R.string.network_transports))),
    HardwareSection("battery", R.string.battery, emptyList()),
    HardwareSection("thermals", R.string.thermals, listOf(
        MetricField(H.CPU_TEMPERATURE.id, R.string.cpu_temperature), MetricField(H.GPU_TEMPERATURE.id, R.string.gpu_temperature))),
)

val overviewFields = listOf(
    MetricField(H.MEMORY_AVAILABLE.id, R.string.memory_available, R.string.memory_hint),
    MetricField(H.STORAGE_APP_DATA_AVAILABLE.id, R.string.storage_available, R.string.storage_hint),
    MetricField(H.CPU_SOC_MODEL.id, R.string.soc_model),
    MetricField(H.DISPLAY_REFRESH_RATE.id, R.string.refresh_rate, R.string.refresh_hint),
)
