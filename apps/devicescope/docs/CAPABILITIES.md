# Capability and evidence matrix

The app must explain what Android exposes on the current phone, rather than promise every hardware reading on every model. Implementation decisions should cite official Android documentation at the time they are made. No device has been tested for DeviceScope yet.

## Known constraints to validate

- Battery temperature is commonly present in the sticky battery broadcast, but missing extras/OEM behavior must be handled.
- Thermal status and headroom are guarded by API level and platform support. Neither is a CPU/GPU thermometer.
- General access to CPU/GPU temperature, per-core frequency, system CPU load, and `/proc` or `/sys` nodes varies or is blocked. These are optional capabilities; a permission error is not a zero reading.
- Ambient temperature sensors are uncommon and represent ambient temperature, not the processor.
- Battery health status is a coarse platform enum. Current/capacity counters do not automatically establish design capacity or precise degradation percentage.
- Device serial, IMEI, and hardware MAC access is restricted on modern Android. Do not work around those restrictions or request privileged permissions for the MVP.
- Camera, connectivity, and sensor detail APIs differ by version and may require specific permissions for specific fields. Discover first; request access only for the invoked feature.

## Physical-device results

Append actual rows as devices become available. An entry must include the implementation commit, device/OS, source/API, conditions, observation, and result. Leave unknowns as `not tested`.

| Device family | Exact model / OS  | Battery temp | Thermal state/headroom | CPU/GPU temp | Evidence |
| ------------- | ----------------- | ------------ | ---------------------- | ------------ | -------- |
| Pixel         | Not available yet | Not tested   | Not tested             | Not tested   | None     |
| Samsung       | Not available yet | Not tested   | Not tested             | Not tested   | None     |
| Xiaomi        | Not available yet | Not tested   | Not tested             | Not tested   | None     |

For each real test record charging state, sample interval, at least one missing/unsupported-field scenario, and foreground/background behavior. Redact serials, SSIDs, account details, and other identifiers from screenshots/reports. Emulator results must be labeled emulator and cannot establish physical sensor accuracy.

## DS-003 public API implementation evidence

Implementation uses public [Build](https://developer.android.com/reference/android/os/Build),
[MemoryInfo](https://developer.android.com/reference/android/app/ActivityManager.MemoryInfo),
[StatFs](https://developer.android.com/reference/android/os/StatFs),
[Display](https://developer.android.com/reference/android/view/Display),
[CameraManager](https://developer.android.com/reference/android/hardware/camera2/CameraManager),
[SensorManager](https://developer.android.com/reference/android/hardware/SensorManager),
[ConnectivityManager](https://developer.android.com/reference/android/net/ConnectivityManager),
and [EGL14](https://developer.android.com/reference/android/opengl/EGL14).
These links document API semantics; they are not device observations.

SoC fields are API-31 guarded. No serial/IMEI/MAC/SSID/BSSID is collected. GPU strings
use a tiny offscreen GLES2 context on IO, restored/released in finally even on partial
initialization failure. Memory uses one MemoryInfo per snapshot; derived usage is
cache-inclusive, never per-app. Storage scopes the app data filesystem. Display mode
rate is Hz, not FPS. Camera2 inventory opens no camera; each characteristic fails
independently. Sensor inventory registers no listeners and labels native units.
Network uses the normal ACCESS_NETWORK_STATE permission only; no runtime permission
prompt, broad storage grant or internet permission is added.

CPU/GPU temperature, frequency and utilization are explicitly Unsupported in this
public-API MVP. No sysfs/proc scraping, estimates, battery relabeling or headroom
conversion is performed. Dynamic snapshots poll every 2 s only while collected;
inventory/EGL run once per collector start. No background service, retained receiver
or sensor listener. A rendezvous flow bounds in-flight work; cancellation terminates
polling, with at most an already-started synchronous API call to finish.

Physical and emulator observation rows remain untested: adb reported no attached
devices. JVM tests validate guards, invalid counters, field failure isolation and
stream cancellation, not vendor readings, EGL driver cleanup, hotplug behavior,
permission transitions or background/rotation on Android. Those require device
validation and remain explicit DS-009 checks. See DS-003 handoff for exact counts.
