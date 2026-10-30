package com.laska.devicescope.core.hardware

import android.Manifest
import android.app.ActivityManager
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import android.hardware.camera2.CameraCharacteristics as Camera
import android.hardware.camera2.CameraManager
import android.hardware.display.DisplayManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.StatFs
import android.os.SystemClock
import android.view.Display
import com.laska.devicescope.core.model.*

/** Production factory. UI owns STARTED lifecycle collection; no background service. */
class AndroidHardwareRepository(context: Context) : HardwareRepository by
    PollingHardwareRepository(AndroidHardwareSource(context.applicationContext))

internal class AndroidHardwareSource(private val context: Context) : HardwareSource {
    private fun collector() = ReadingCollector(Build.VERSION.SDK_INT,
        SampleTime(System.currentTimeMillis(), SystemClock.elapsedRealtime()))
    private fun text(id: String) = MetricKey<String>(id, MetricUnit.TEXT)
    private fun texts(id: String) = MetricKey<List<String>>(id, MetricUnit.TEXT)
    private fun whole(id: String, unit: MetricUnit) = MetricKey<Long>(id, unit)
    private fun decimal(id: String, unit: MetricUnit) = MetricKey<Double>(id, unit)

    override fun inventory(): HardwareSnapshot = collector().apply {
        field(HardwareMetrics.DEVICE_MANUFACTURER, "Build.MANUFACTURER") { textReading(Build.MANUFACTURER) }
        field(HardwareMetrics.DEVICE_MODEL, "Build.MODEL") { textReading(Build.MODEL) }
        field(HardwareMetrics.SYSTEM_ANDROID_VERSION, "Build.VERSION.RELEASE") { textReading(Build.VERSION.RELEASE) }
        field(HardwareMetrics.SYSTEM_SECURITY_PATCH, "Build.VERSION.SECURITY_PATCH") { textReading(Build.VERSION.SECURITY_PATCH) }
        field(HardwareMetrics.SYSTEM_BUILD, "Build.DISPLAY") { textReading(Build.DISPLAY) }
        field(HardwareMetrics.CPU_SOC_MODEL, "Build.SOC_MODEL", minApi = 31) {
            if (Build.VERSION.SDK_INT >= 31) textReading(Build.SOC_MODEL) else Reading.Unsupported("Requires API 31")
        }
        field(HardwareMetrics.CPU_SOC_MANUFACTURER, "Build.SOC_MANUFACTURER", minApi = 31) {
            if (Build.VERSION.SDK_INT >= 31) textReading(Build.SOC_MANUFACTURER) else Reading.Unsupported("Requires API 31")
        }
        field(HardwareMetrics.CPU_ABIS, "Build.SUPPORTED_ABIS") {
            val abis = Build.SUPPORTED_ABIS.filter { it.isNotBlank() }
            if (abis.isEmpty()) Reading.TemporarilyUnavailable("No ABI reported") else Reading.Available(abis)
        }
        field(HardwareMetrics.CPU_LOGICAL_PROCESSORS, "Runtime.availableProcessors") {
            positive(Runtime.getRuntime().availableProcessors().toLong())
        }
        for ((id, unit) in listOf("cpu.temperature" to MetricUnit.CELSIUS, "gpu.temperature" to MetricUnit.CELSIUS,
            "cpu.frequency" to MetricUnit.HERTZ, "cpu.utilization" to MetricUnit.RATIO)) {
            field(decimal(id, unit), "Android public SDK capability assessment") {
                Reading.Unsupported("No universal public Android API for this reading; no estimate is substituted")
            }
        }
        // A pbuffer/context exists only for this call, on the repository's IO dispatcher.
        val gpu = readGpuStrings()
        for ((id, enum) in listOf("gpu.renderer" to android.opengl.GLES20.GL_RENDERER,
            "gpu.vendor" to android.opengl.GLES20.GL_VENDOR, "gpu.opengl_version" to android.opengl.GLES20.GL_VERSION)) {
            field(text(id), "EGL14 pbuffer / GLES20.glGetString") {
                when (gpu) {
                    is Reading.Available -> textReading(gpu.value[enum])
                    is Reading.Error -> gpu
                    else -> Reading.TemporarilyUnavailable("OpenGL strings unavailable")
                }
            }
        }
        field(HardwareMetrics.SENSOR_INVENTORY, "SensorManager.getSensorList(TYPE_ALL)") {
            val manager = context.getSystemService(SensorManager::class.java)
                ?: return@field Reading.Unsupported("Sensor service unavailable")
            Reading.Available(manager.getSensorList(Sensor.TYPE_ALL).map { sensor ->
                formatSensorMetadata(sensor.name, sensor.vendor, sensor.stringType, sensorUnit(sensor.type),
                    sensor.maximumRange, sensor.resolution, sensor.power, sensor.minDelay)
            })
        }
        var manager: CameraManager? = null
        var ids = emptyList<String>()
        field(HardwareMetrics.CAMERA_INVENTORY, "CameraManager.cameraIdList", permission = Manifest.permission.CAMERA) {
            manager = context.getSystemService(CameraManager::class.java)
            if (manager == null) Reading.Unsupported("Camera service unavailable") else {
                val reported = manager!!.cameraIdList
                if (reported.any { it.isBlank() }) return@field Reading.TemporarilyUnavailable("Camera IDs not reported consistently")
                ids = reported.toList()
                Reading.Available(ids.sorted().map { "Camera ${HardwareMetrics.cameraToken(it)}" })
            }
        }
        // Encode public Camera2 IDs so keys remain stable across inventory ordering changes.
        ids.sorted().forEach { id ->
            field(HardwareMetrics.cameraField(id, "facing"), "CameraCharacteristics.LENS_FACING", permission = Manifest.permission.CAMERA) {
                val value = manager!!.getCameraCharacteristics(id).get(Camera.LENS_FACING)
                textReading(when (value) { Camera.LENS_FACING_BACK -> "Back"; Camera.LENS_FACING_FRONT -> "Front";
                    Camera.LENS_FACING_EXTERNAL -> "External"; else -> null })
            }
            field(HardwareMetrics.cameraField(id, "hardware_level"), "CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL", permission = Manifest.permission.CAMERA) {
                val value = manager!!.getCameraCharacteristics(id).get(Camera.INFO_SUPPORTED_HARDWARE_LEVEL)
                textReading(when (value) { Camera.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY -> "Legacy";
                    Camera.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED -> "Limited"; Camera.INFO_SUPPORTED_HARDWARE_LEVEL_FULL -> "Full";
                    Camera.INFO_SUPPORTED_HARDWARE_LEVEL_3 -> "Level 3"; Camera.INFO_SUPPORTED_HARDWARE_LEVEL_EXTERNAL -> "External";
                    else -> null })
            }
            field(HardwareMetrics.cameraField(id, "focal_lengths"), "CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS", permission = Manifest.permission.CAMERA) {
                val values = manager!!.getCameraCharacteristics(id).get(Camera.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
                if ((values == null || values.isEmpty()) || values.any { !it.isFinite() || it <= 0 }) Reading.TemporarilyUnavailable("Focal lengths not reported")
                else Reading.Available(values.joinToString { "$it mm" })
            }
        }
    }.snapshot()

    override fun current(): HardwareSnapshot = collector().apply {
        field(HardwareMetrics.SYSTEM_UPTIME, "SystemClock.elapsedRealtime", interval = 2_000) {
            nonNegative(SystemClock.elapsedRealtime())
        }
        // Each independent field catches service/permission failure without hiding other domains.
        var memory: ActivityManager.MemoryInfo? = null
        fun memoryInfo(): ActivityManager.MemoryInfo {
            if (memory == null) memory = ActivityManager.MemoryInfo().also {
                checkNotNull(context.getSystemService(ActivityManager::class.java)).getMemoryInfo(it)
            }
            return checkNotNull(memory)
        }
        field(HardwareMetrics.MEMORY_TOTAL, "ActivityManager.MemoryInfo.totalMem", interval = 2_000) { positive(memoryInfo().totalMem) }
        field(HardwareMetrics.MEMORY_AVAILABLE, "ActivityManager.MemoryInfo.availMem", interval = 2_000) {
            val m = memoryInfo()
            availableCapacity(m.totalMem, m.availMem)
        }
        field(HardwareMetrics.MEMORY_USED, "MemoryInfo.totalMem - availMem (cache-inclusive)", interval = 2_000, provenance = Provenance.ESTIMATED) {
            val m = memoryInfo(); usedMemory(m.totalMem, m.availMem)
        }
        var storage: StatFs? = null
        fun stat(): StatFs { if (storage == null) storage = StatFs(context.filesDir.absolutePath); return checkNotNull(storage) }
        field(HardwareMetrics.STORAGE_APP_DATA_TOTAL, "StatFs(app data filesystem).totalBytes", interval = 2_000) { positive(stat().totalBytes) }
        field(HardwareMetrics.STORAGE_APP_DATA_AVAILABLE, "StatFs(app data filesystem).availableBytes", interval = 2_000) {
            availableCapacity(stat().totalBytes, stat().availableBytes)
        }
        fun display() = checkNotNull(context.getSystemService(DisplayManager::class.java)?.getDisplay(Display.DEFAULT_DISPLAY))
        field(HardwareMetrics.DISPLAY_WIDTH, "Display.Mode.physicalWidth", interval = 2_000) { positive(display().mode.physicalWidth.toLong()) }
        field(HardwareMetrics.DISPLAY_HEIGHT, "Display.Mode.physicalHeight", interval = 2_000) { positive(display().mode.physicalHeight.toLong()) }
        field(HardwareMetrics.DISPLAY_REFRESH_RATE, "Display.Mode.refreshRate (not rendered FPS)", interval = 2_000) { positive(display().mode.refreshRate.toDouble()) }
        field(HardwareMetrics.DISPLAY_DENSITY, "Resources.displayMetrics.densityDpi", interval = 2_000) { positive(context.resources.displayMetrics.densityDpi.toLong()) }
        field(HardwareMetrics.DISPLAY_SUPPORTED_MODES, "Display.supportedModes", interval = 2_000) {
            Reading.Available(display().supportedModes.map { "${it.physicalWidth} x ${it.physicalHeight} pixels @ ${it.refreshRate} Hz" })
        }
        field(HardwareMetrics.DISPLAY_HDR_TYPES, "Display.HdrCapabilities.supportedHdrTypes", interval = 2_000) {
            Reading.Available(display().hdrCapabilities.supportedHdrTypes.map { when(it) {
                Display.HdrCapabilities.HDR_TYPE_DOLBY_VISION -> "Dolby Vision"
                Display.HdrCapabilities.HDR_TYPE_HDR10 -> "HDR10"
                Display.HdrCapabilities.HDR_TYPE_HLG -> "HLG"
                Display.HdrCapabilities.HDR_TYPE_HDR10_PLUS -> "HDR10+"
                else -> "Platform HDR type $it"
            } })
        }
        field(HardwareMetrics.NETWORK_TRANSPORTS, "ConnectivityManager active NetworkCapabilities", permission = Manifest.permission.ACCESS_NETWORK_STATE, interval = 2_000) {
            val manager = context.getSystemService(ConnectivityManager::class.java)
                ?: return@field Reading.Unsupported("Connectivity service unavailable")
            val active = manager.activeNetwork ?: return@field Reading.Available(listOf("No active network"))
            val caps = manager.getNetworkCapabilities(active) ?: return@field Reading.TemporarilyUnavailable("Network capabilities changing")
            val names = listOf(NetworkCapabilities.TRANSPORT_WIFI to "Wi-Fi", NetworkCapabilities.TRANSPORT_CELLULAR to "Cellular",
                NetworkCapabilities.TRANSPORT_ETHERNET to "Ethernet", NetworkCapabilities.TRANSPORT_VPN to "VPN",
                NetworkCapabilities.TRANSPORT_BLUETOOTH to "Bluetooth").filter { caps.hasTransport(it.first) }.map { it.second }
            Reading.Available(names.ifEmpty { listOf("Other transport") })
        }
    }.snapshot()
}

private fun sensorUnit(type: Int): String = when (type) {
    Sensor.TYPE_ACCELEROMETER, Sensor.TYPE_GRAVITY, Sensor.TYPE_LINEAR_ACCELERATION -> "m/s²"
    Sensor.TYPE_GYROSCOPE, Sensor.TYPE_GYROSCOPE_UNCALIBRATED -> "rad/s"
    Sensor.TYPE_MAGNETIC_FIELD, Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED -> "µT"
    Sensor.TYPE_LIGHT -> "lx"
    Sensor.TYPE_PRESSURE -> "hPa"
    Sensor.TYPE_PROXIMITY -> "cm"
    Sensor.TYPE_AMBIENT_TEMPERATURE -> "°C (ambient)"
    Sensor.TYPE_RELATIVE_HUMIDITY -> "%"
    Sensor.TYPE_STEP_COUNTER -> "steps"
    Sensor.TYPE_HEART_RATE -> "beats/min"
    else -> "(sensor-specific units; see Android sensor type)"
}
