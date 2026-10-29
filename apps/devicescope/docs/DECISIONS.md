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
