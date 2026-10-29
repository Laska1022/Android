# Measurement contract — version 0.1 design

This is a proposed contract, not implemented Kotlin. DS-001 owns its first implementation. A and B agree on changes here before modifying interfaces consumed by both lanes.

## A measurement

Represent the value/state with a sealed result rather than magic numbers. An available result carries a typed value; unavailable results do not have a numeric zero substitute.

| Field         | Meaning                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`          | Stable semantic key, such as `battery.temperature` or `memory.available`; never relabel battery data as CPU data |
| `state`       | Available, unsupported, permission-required, temporarily-unavailable, or error                                   |
| `value`       | Typed numeric/text/enum value only when available                                                                |
| `unit`        | Explicit canonical unit: degrees Celsius, bytes, microamps, millivolts, milliseconds, ratio, etc.                |
| `source`      | Public Android API or documented device-provided source; identify sensor vendor/type where relevant              |
| `provenance`  | Reported, measured, or estimated; independent of availability                                                    |
| `sampledAt`   | Wall-clock time for reports plus monotonic session-relative time for plotting                                    |
| `freshness`   | Fresh/stale/paused according to collector lifecycle and expected interval                                        |
| `explanation` | User-facing reason for unsupported/permission/error states; no raw secret values or stack traces                 |

Static capability metadata includes API-level requirements, optional permission requirements, sampling constraints, and whether a field is present on this device. A successful capability lookup is not evidence of a fresh sample.

## Boundaries

- Collectors expose read-only `Flow` streams of immutable snapshots. Screen state is derived from snapshots; composables do not read sysfs/proc or call hardware APIs directly.
- Public models do not import Compose. The UI can use deterministic fakes in tests/previews, visibly labeled; production injection uses actual collectors.
- A foreground monitoring session has a stable ID, start/end times, selected metric IDs, interval, and bounded sample retention. Do not persist an unbounded stream.
- Cancel collection and unregister listeners when the owning lifecycle stops. Keep the last sample visibly stale/paused instead of letting a timer imply new readings.
- Handle partial capability: a missing current counter must not hide battery percentage or cause the whole snapshot to fail.
- Statistics operate only on finite, valid samples with consistent units. Unavailable readings form gaps. Do not average sentinel values, empty datasets, or NaN.

## Initial API mapping and guardrails

| Domain           | Public API starting point                                                | Semantics to preserve                                                                                                  |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Device           | `Build`, `Build.VERSION`, guarded `Build.SOC_MODEL` / `SOC_MANUFACTURER` | SoC fields require API 31; older-device absence is explicit                                                            |
| CPU architecture | `Build.SUPPORTED_ABIS`, `Runtime.availableProcessors()`                  | ABIs and available logical processors, not physical topology or measured utilization                                   |
| RAM              | `ActivityManager.MemoryInfo`                                             | `totalMem`, `availMem`, and clearly labeled derived usage                                                              |
| Storage          | `StatFs` on accessible volumes                                           | Scope of each volume; bytes, no broad file permission by default                                                       |
| Battery          | `ACTION_BATTERY_CHANGED`, `BatteryManager` properties                    | Temperature in tenths of Celsius, voltage in mV, supported current in µA; validate presence/sentinels                  |
| Thermal state    | `PowerManager` thermal-status APIs, API 29+                              | Named severity/status, not degrees Celsius                                                                             |
| Thermal headroom | `PowerManager.getThermalHeadroom`, API 30+                               | Dimensionless value; handle NaN, platform limits, and at least 10 seconds between queries; never poll at UI frame rate |
| Sensors          | `SensorManager` inventory/listeners                                      | Device presence, vendor, unit, accuracy, and rate; one selected stream at a time by default                            |
| Display          | Public display/mode APIs with API guards                                 | Supported/current display mode is not an FPS counter                                                                   |
| GPU              | EGL context and GLES capability strings                                  | Renderer/vendor/version; initialize off the UI thread and release context/resources                                    |
| Camera           | `CameraManager` characteristics                                          | Handle limited/permission-dependent fields separately                                                                  |
| Network          | `ConnectivityManager`, optional guarded Wi-Fi APIs                       | Redact SSID/BSSID/MAC by default; handle API/permission limits                                                         |

Default monitoring interval proposal: 2 seconds for ordinary polled metrics, with collector-specific minimums overriding it. Sensor streams use explicit bounded rates suitable for the selected chart, not raw maximum rates. Validate sign conventions for battery current by device; do not silently invert current to match an assumption.

Shared interface changes require: a version note here, named downstream task impact, migration of affected fakes/tests, and notification through the pushed task/handoff. Do not resolve contract differences by maintaining incompatible duplicate model classes.

## Version 0.1 implementation agreement — DS-001, slot A

The existing design above is the bootstrap agreement; no downstream Kotlin exists yet.
Package `com.laska.devicescope.core.model` is pure Kotlin/JVM and has no Android/Compose imports.

- `MetricKey<T>(id, unit)` and `Measurement<T>(key, result, source, provenance, sampledAt, freshness)` keep values typed. `Reading<T>` is sealed: `Available(value)`, `Unsupported(explanation)`, `PermissionRequired(permission, explanation)`, `TemporarilyUnavailable(explanation)`, `Error(explanation)`. Only Available has a value. Invalid numeric values are rejected, never rendered as zero.
- `SampleTime(epochMillis, elapsedRealtimeMillis)` uses UTC wall time plus Android monotonic time since boot. Plot session-relative time by subtracting session start's monotonic time; never subtract wall times for intervals.
- `Freshness` is FRESH, STALE or PAUSED. `Provenance` is REPORTED, MEASURED or ESTIMATED. `MetricUnit` distinguishes CELSIUS, RATIO, BYTES, MICROAMPS, MILLIVOLTS, MILLISECONDS, COUNT, HERTZ, PIXELS, DPI and TEXT.
- `Capability(key, minimumApi, permission, minimumIntervalMillis, availability)` uses explicit availability (AVAILABLE, UNSUPPORTED, UNKNOWN). UNKNOWN discovery does not imply a fresh sample.
- `HardwareSnapshot(measurements, capabilities)` and `HardwareRepository.observe(): Flow<HardwareSnapshot>` form the read-only UI boundary. Production repositories are cold and stop when collection is cancelled. DS-003 supplies the factory `AndroidHardwareRepository(context)` in `core:hardware`; DS-004 should collect inside `repeatOnLifecycle(STARTED)`/`collectAsStateWithLifecycle`.
- DS-001 app is an honest bootstrap screen, with no numeric demo readings or production fake provider. Fakes live in test source sets only. Session persistence/selection contracts will be added by DS-005/DS-007 before consumers implement them.

Ownership: A owns shared models/build configuration and core:hardware. B owns core:designsystem and feature UI after DS-001 integration; B may take app/navigation wiring in DS-004. A will not edit that wiring during DS-003. B should commit requested contract amendments in its task/handoff; A will review remote handoffs before integration. These additive Kotlin names formalize the existing 0.1 design; downstream impact is DS-003/004/005/006/007/008. No competing models should be introduced.
