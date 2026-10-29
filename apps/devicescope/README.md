# DeviceScope

A native Android hardware-information and monitoring application inspired by CPU-Z and HWiNFO. It will show the phone's hardware, battery, supported thermal readings, sensors, and live monitoring charts using an original interface.

**Current state: native Kotlin/Compose foundation with a bootstrap screen and typed measurement contract.** Collectors and full screens are subsequent tasks. Robots vs Aliens is a separate application at `../robots-vs-aliens/`.

## Start here

| Document                                       | Purpose                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| [PLAN.md](PLAN.md)                             | Product scope, milestones, architecture, acceptance criteria     |
| [AGENTS.md](AGENTS.md)                         | Instructions for every coding session                            |
| [COLLABORATION.md](COLLABORATION.md)           | Two-session ownership, Git branches, safe integration, recovery  |
| [PROMPTS.md](PROMPTS.md)                       | Starting prompts for Codex A, Codex B, and a replacement session |
| [STATUS.md](STATUS.md)                         | Current integrated state and next steps                          |
| [tasks/README.md](tasks/README.md)             | Ordered task board with dependencies and file boundaries         |
| [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md) | Initial agreement between collectors and UI                      |
| [docs/CAPABILITIES.md](docs/CAPABILITIES.md)   | Android API limits and physical-device evidence matrix           |
| [docs/DECISIONS.md](docs/DECISIONS.md)         | Architecture decisions and their reasons                         |
| [handoffs/README.md](handoffs/README.md)       | Permanent, per-session handoff records                           |

## Isolated app identity

- Directory: `apps/devicescope/`.
- Reserved application ID: `com.laska.devicescope`.
- Stack: Kotlin, Jetpack Compose, Coroutines/Flow, local persistence.
- Minimum OS: Android 8 / API 26; newer APIs must be guarded.
- Compile/target SDK 36, Build Tools 35.0.0, JDK 21, Gradle 8.14.3, AGP 8.13.0, Kotlin/Compose compiler 2.2.20, Compose BOM 2025.10.00. Check Google Play requirements again before release.
- Workflow: `.github/workflows/devicescope-ci.yml`, restricted to DeviceScope paths and its own configuration.
- Artifacts: names beginning `devicescope-`, never the game's artifact names.

CPU/GPU temperatures, per-core clocks, precise battery wear, and some identifiers are not universally available to ordinary Android apps. Unsupported values must remain explicitly unavailable. Battery temperature must never be presented as CPU temperature. Thermal headroom is not a Celsius reading.

## Begin with two Codex Cloud sessions

Use [PROMPTS.md](PROMPTS.md) to start A with DS-001 and B with DS-002. Each session must claim its task on GitHub before edits, work on its own branch, and leave a pushed handoff before stopping. The initial plan does not reserve either task.

## Build and validate

Use Java 21, SDK platform 36 and Build Tools 35.0.0. Set `ANDROID_HOME` externally or use ignored `local.properties`. From this directory:

```bash
./gradlew --no-daemon --max-workers=2 testDebugUnitTest lintDebug assembleDebug
```

The test gate includes `core:model` JVM tests. The APK is `app/build/outputs/apk/debug/app-debug.apk`, package `com.laska.devicescope`. With an attached Android 8+ device, install with `adb install -r app/build/outputs/apk/debug/app-debug.apk` and launch with `adb shell am start -n com.laska.devicescope/.MainActivity`. Installation/startup requires separate device evidence; a successful build does not establish sensor accuracy.

In the prepared cloud instance, `source /workspace/toolchains/activate.sh` selects the local JDK/SDK and proxy trust configuration; this machine-local path is not required on other hosts. No npm or game build is involved. Latest actual results are in the DS-001 task/handoff.

`core:model` is pure JVM Kotlin; `core:hardware` owns Android API collection; `core:designsystem` owns theme primitives; `app` owns entry/navigation. The reserved data and feature directories become modules only when their owning tasks implement them. No fake provider is wired into production.
