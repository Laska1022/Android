# DeviceScope

A planned native Android hardware-information and monitoring application inspired by CPU-Z and HWiNFO. It will show the phone's hardware, battery, supported thermal readings, sensors, and live monitoring charts using an original interface.

**Current state: planning and coordination files only. No DeviceScope app, Gradle project, APK, or executed app tests exist yet.** The first implementation task is DS-001. Robots vs Aliens is a separate application at `../robots-vs-aliens/`.

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
- Planned stack: Kotlin, Jetpack Compose, Coroutines/Flow, local persistence.
- Planned minimum OS: Android 8 / API 26; newer APIs must be guarded.
- Compile/target SDK and plugin versions: choose compatible stable versions in DS-001, record them, and check current Google Play requirements before release.
- Future workflow: `.github/workflows/devicescope-ci.yml`, restricted to DeviceScope paths and its own configuration.
- Future artifacts: names beginning `devicescope-`, never the game's artifact names.

CPU/GPU temperatures, per-core clocks, precise battery wear, and some identifiers are not universally available to ordinary Android apps. Unsupported values must remain explicitly unavailable. Battery temperature must never be presented as CPU temperature. Thermal headroom is not a Celsius reading.

## Begin with two Codex Cloud sessions

Use [PROMPTS.md](PROMPTS.md) to start A with DS-001 and B with DS-002. Each session must claim its task on GitHub before edits, work on its own branch, and leave a pushed handoff before stopping. The initial plan does not reserve either task.

After the native foundation is integrated, this README must contain the **tested** build/run commands and toolchain versions. Planned verification commands are in DS-001; they are not executable in the current docs-only directory.
