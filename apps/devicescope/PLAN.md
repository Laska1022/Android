# DeviceScope implementation plan

## Product goal

Create an original, high-quality Android hardware inspector with a fast overview, detailed hardware pages, readable live graphs, and useful exports. Aim for the depth of CPU-Z/HWiNFO while accurately describing the limits of an ordinary Android application.

The interface must distinguish facts reported by Android, live measurements, optional estimates, and unavailable values. Root/privileged collection is a possible separate future feature, never a hidden requirement or a silent fallback.

## First-release scope

| Area          | Information/features                                                          | Important limits                                                                                                     |
| ------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Overview      | Model, Android version, battery, RAM/storage summary, thermal state           | No fabricated summary scores                                                                                         |
| Device/system | Manufacturer, model, build, patch level, uptime, supported ABIs               | Restrict serial/IMEI and other protected identifiers                                                                 |
| CPU/SoC       | Reported model/manufacturer where available, logical processors, architecture | Frequencies and total CPU utilization are device-dependent; available processors do not prove physical core topology |
| GPU           | EGL/OpenGL renderer, vendor, supported API capabilities                       | No universal GPU-load or GPU-temperature API                                                                         |
| RAM           | Total and available RAM, clearly defined derived usage                        | Cache-inclusive usage is not per-app RAM usage                                                                       |
| Storage       | Capacity/available space for accessible app/storage volumes                   | Do not request broad filesystem access to collect ordinary statistics                                                |
| Battery       | Level, status, temperature, voltage; supported current/counter values         | Firmware-dependent; battery health enum is not a measured capacity-wear percentage                                   |
| Thermals      | Available temperature sensors, thermal status, headroom where supported       | CPU/GPU temperature not guaranteed; status/headroom are not temperatures                                             |
| Display       | Resolution, density, supported modes/refresh rates, HDR capability            | Supported modes do not establish current rendered FPS                                                                |
| Cameras       | Publicly exposed lens and capture capabilities                                | Avoid requesting camera access solely for basic inventory unless the API requires it                                 |
| Sensors       | Sensor inventory, range/resolution/vendor, selected live graphs               | Sensor presence and accuracy vary; do not enable every sensor continuously                                           |
| Connectivity  | Connection type and supported capabilities; extra details on request          | Wi-Fi/location/nearby-device restrictions require feature-specific handling                                          |
| Reports       | Redacted human-readable report, CSV/JSON session export                       | Local user-directed export; no silent upload                                                                         |

Deferred: background monitoring, root mode, precise battery-wear claims, stress tests, cloud sync, ads/accounts, broad installed-app inventory, and benchmark rankings. Basic screen/touch/audio/vibration diagnostics are a later milestone after the inspector is reliable.

## Experience

- Original dark/light Compose interface with accessible typography, clear units, restrained color, and tablet/adaptive layouts.
- Sections: Overview, Hardware, Thermals, Battery, Monitor, Reports.
- Temperature cards show sensor identity and source; unsupported states explain why a reading is absent.
- Charts show gaps for unavailable samples, min/max/average over valid samples, a visible sampling interval, and a clear paused/stale state.
- A monitoring session begins and ends explicitly. The app stops unnecessary work when backgrounded.
- TalkBack descriptions, scalable fonts, useful touch targets, and color-independent state indicators are acceptance criteria, not later decoration.

## Architecture and ownership boundaries

Proposed independently buildable modules (DS-001 may simplify boundaries with a recorded reason):

| Path within DeviceScope                       | Responsibility                                           | Default lane                                                      |
| --------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `core/model/`                                 | Measurement, availability, capability, session contracts | A; shared changes coordinated with B                              |
| `core/hardware/`                              | Android collectors and capability discovery              | A                                                                 |
| `core/data/`                                  | Session persistence and report formatting/export         | A                                                                 |
| `core/designsystem/`                          | Theme, typography, cards, chart primitives               | B after foundation                                                |
| `feature/dashboard/`, `feature/details/`      | Overview and hardware details                            | B                                                                 |
| `feature/monitor/`, `feature/reports/`        | Graphs and session/report UI                             | B                                                                 |
| `app/`                                        | Entry point, navigation, lifecycle wiring                | A during bootstrap; B for UI, assigned explicitly for integration |
| Gradle settings, wrapper, version catalog, CI | Reproducible toolchain and independent build             | A during bootstrap; one named owner thereafter                    |

Use Coroutines/Flow and lifecycle-aware collection. Keep pure formatting/statistics logic independent of Android for deterministic tests. Choose Room or another appropriate local store only when session persistence needs it; document schema migration and bounded retention. Avoid a new dependency where a small platform API suffices.

## Delivery milestones

1. **Foundation and feasibility — DS-001 / DS-002.** Create the native build and shared model contract; in parallel define screen states and original visual design. Prototype public API access. Build a debug APK and app-specific CI. Establish a physical-device matrix, explicitly marking missing evidence.
2. **Hardware explorer — DS-003 / DS-004.** Implement collectors and the native UI against the agreed interface. Display honest unavailable/error/permission states. Validate real data and prevent other apps from entering this build.
3. **Thermals and live monitoring — DS-005 / DS-006.** Add battery/thermal collection, graphs, lifecycle-safe polling, valid-sample statistics, and unsupported-device handling. Test rotation, backgrounding, and permission changes.
4. **Sessions and reports — DS-007 / DS-008.** Save bounded monitoring sessions, implement redacted CSV/JSON/readable exports, and connect report/settings UI. Validate offline operation and export privacy.
5. **Integration and device validation — DS-009.** One integrator combines completed branches; both sessions can contribute separately assigned test evidence. Run automated checks and a real-device matrix, fix measured defects, and create a release checklist.

Planning estimate: 4–6 weeks for a polished first release, subject to developer availability, real-device access, and OEM API limitations. Two cloud sessions can work concurrently after the data contract is integrated; they cannot substitute for physical phones.

## Validation and release gates

- Unit tests cover unit conversions, unavailable/sentinel readings, permission errors, valid-sample statistics, timestamps, formatting, redaction, and persisted-session migration.
- UI tests cover navigation, loading/unsupported/stale states, rotation, permission denial, scalable text, and accessibility semantics.
- Build and lint from DeviceScope's own directory using its own wrapper. Do not use game tests as DeviceScope evidence.
- Record actual device/Android version and reading source for Samsung, Pixel, and Xiaomi where devices are available. Include an older supported Android release and a current release. Never invent a device test result to fill the matrix.
- Measure the monitor's own overhead on a representative phone at the default interval. Record CPU, memory, battery/energy method, session duration, and observed impact; tune the default using evidence.
- Verify cold start offline, foreground/background behavior, no leaked listeners, sensible storage retention, and no protected identifiers in default exports.
- Debug APKs are test artifacts. A store release requires secure signing, current target-SDK compliance, privacy/data-safety disclosures, device checks, and store assets.

The [task board](tasks/README.md) breaks this plan into independent assignments. Current integrated progress belongs in [STATUS.md](STATUS.md); each session publishes detailed evidence in its handoff.
