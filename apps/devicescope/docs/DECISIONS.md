# Decision log

## D-001 — Independent application directory (2026-10-29)

DeviceScope owns `apps/devicescope/`, package ID `com.laska.devicescope`, a future independent Gradle root, and app-specific CI. The game owns `apps/robots-vs-aliens/`. This prevents shared package IDs, dependency updates, and build outputs from coupling unrelated apps.

## D-002 — Native Kotlin and Compose (2026-10-29)

Use native Android APIs for hardware access, Kotlin/Flow for lifecycle-aware collection, and Compose for the UI. The game's TypeScript/Capacitor runtime is not a dependency. Pin actual compatible toolchain versions in DS-001; this planning document does not imply they have been installed or validated.

## D-003 — Honest availability and privacy (2026-10-29)

Use public APIs without root in the MVP. Missing, blocked, stale, and invalid readings have explicit states. Collect locally; use user-directed, redacted exports. No backend, analytics, or account is required.

## D-004 — GitHub-based coordination (2026-10-29)

Two cloud sessions use task claims on main, distinct task branches, a defined shared model contract, per-session handoffs, and one integrator at a time. Pushes never use force. Chat transcripts and local-only artifacts are not shared state. See `../COLLABORATION.md` for race handling and recovery.

## Adding a decision

Append an ID, date, owner/task, context, decision, alternatives, affected paths/interfaces, and validation/migration impact. Reversing an earlier decision requires a new entry linking to it; do not erase the earlier rationale.

## D-005 — Reproducible native bootstrap (2026-10-29, A / DS-001)

Pin AGP 8.13.0 / Gradle 8.14.3 / Kotlin and Compose compiler 2.2.20,
Compose BOM 2025.10.00, Java 21, compile/target 36 and min 26. Keep the version
catalog and checksum-pinned wrapper entirely within DeviceScope. A dedicated CI
workflow runs tests, lint and APK assembly from this build root.

Implement app, model, hardware and designsystem modules now. Model remains pure
Kotlin/JVM for deterministic tests; a root testDebugUnitTest aggregate includes its
tests. Data/feature paths remain documented boundaries until implementation needs
them, avoiding empty Android modules. No cross-app dependencies or production fakes.
DS-004/B takes app navigation and designsystem ownership after DS-001 integration;
DS-003/A touches hardware only. Existing design contract 0.1 is formalized with exact
Kotlin names in DATA_CONTRACT.md; B amendments arrive through committed handoffs.

Gradle dependency locking records resolved debug/test/lint configurations in each
module. Refresh deliberately with `--write-locks` on the documented gate when
updating dependencies; commit resulting locks with the catalog change. TLS and the
Gradle distribution checksum remain enabled.
