# Repository setup handoff — DeviceScope planning

- Date: 2026-10-29.
- Scope: app isolation, planning, and two-session coordination; no DeviceScope implementation task claimed.
- Delivery branch: `main`.
- Starting repository commit: `3fe9e0fc00691791c9becc58d2bf612362a17a7f`.
- Resulting repository revision: the commit containing this record; confirm its remote SHA after push. This record does not reference its own commit hash.
- Implementation owner: unclaimed. Slots A and B must follow the claim protocol.

## Completed

- Moved Robots vs Aliens into `apps/robots-vs-aliens/`, retaining its own source, dependencies, tests, native host, and documentation.
- Updated its GitHub/Azure paths and artifact names; game CI filters on game paths. Updated cloud setup/start instructions for the new working directory.
- Added root app registry and app-boundary instructions.
- Added the DeviceScope plan, data contract, API limitations, decision log, task board, status snapshot, and collaboration/continuation prompts.
- Created nine `todo`/unclaimed tasks with explicit dependencies and file ownership. No native DeviceScope build exists yet.

## Validation

- Compared the game's source, public assets, tests, package manifest, and lockfile against the starting commit: byte-for-byte preserved.
- Relocated game: 14 unit tests passed; type checking and production build passed; browser suite passed 5 tests with 1 intentional mobile keyboard skip.
- Relocated game Android host: `assembleDebug lintDebug` passed. This is game validation, not DeviceScope validation.
- App registry paths/unique package IDs, planning-document links, and pipeline YAML were checked locally.
- An obsolete preview process using the old root was stopped; tests were rerun successfully from the new app directory. The preview test command now uses `--strictPort` to avoid silently selecting a different port.

## Next action

1. Session A reads `../PROMPTS.md` and claims DS-001 on GitHub before creating the native foundation.
2. Session B reads the same file and claims DS-002 before creating the UI specification.
3. Both push their branches and unique handoff records at the end of each session.

Physical phones remain necessary for accurate sensor validation. No sensor availability, APK, or runtime behavior has been validated for DeviceScope. Do not treat the existing game's APK or tests as evidence for this app.
