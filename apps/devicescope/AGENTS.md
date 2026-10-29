# DeviceScope agent instructions

Read the repository-root `AGENTS.md`, this directory's `README.md`, `STATUS.md`, `COLLABORATION.md`, `tasks/README.md`, and the newest relevant handoff before beginning. All paths below are relative to `apps/devicescope/` unless explicitly repository-relative.

## Scope and implementation

- Work under `apps/devicescope/`. Use `.github/workflows/devicescope-ci.yml` for this app's CI once its build exists. Do not modify the game's files, dependencies, workflows, or outputs.
- This is a native Kotlin/Compose app, not a Capacitor app. Do not copy the game's Android host or install a Node workspace here.
- Keep a separate Gradle root, wrapper, version catalog, dependency locks/verification configuration as appropriate, and signing setup. Package ID: `com.laska.devicescope`.
- DS-001 owns the shared foundation and build configuration. Agree on contract changes in `docs/DATA_CONTRACT.md` before changing collector/UI interfaces across ownership boundaries.
- Prefer official public Android APIs and use API-level guards. Root access, hidden APIs, privileged permissions, and invented hardware estimates are outside the first release.
- Real readings carry availability, provenance, units, and timestamps. Unsupported, stale, permission-denied, and error states must not turn into zero readings or fake temperature charts.
- A Compose preview or test fixture may contain sample values only when visibly labeled as demo data; it must not replace collectors in a production build.
- Collect only while required by a visible screen/session. Release receivers/listeners on lifecycle stop. Thermal-headroom polling must respect Android's minimum interval. Do not add background services by default.
- No accounts, ads, analytics, cloud backend, or mandatory internet access in the MVP. Ask for feature-specific permissions only when the user invokes that feature. Reports exclude sensitive identifiers by default.

## Coordination and completion

- Follow the claim procedure; slot labels alone are not claims. Never take over a task or branch based only on an old timestamp.
- Each code task has its own branch and primary owner. Push WIP and a truthful handoff if you cannot finish. Never force-push a branch another session may be using.
- Include actual commands and results in task/handoff files. Distinguish JVM tests, emulator checks, physical-device measurements, lint, and compilation.
- A task becomes `done` only after acceptance criteria and integration checks pass and its code is integrated into `main`. Otherwise use `in_progress`, `blocked`, or `ready_for_review`.
- Update `STATUS.md` when integrating a milestone, not on every concurrent worker commit. Keep task-specific work in the individual task file and append-only handoff records.
- The app is currently unimplemented. Do not report a working APK until the native project actually builds and the artifact is verified. Hardware accuracy requires real-device evidence.
