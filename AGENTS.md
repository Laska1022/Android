# Repository instructions — independent apps

## Scope

- Read the requested app's `AGENTS.md` and `README.md` before making changes. These root rules apply repository-wide; app rules add requirements for that app only.
- App code lives under `apps/<app-id>/`. DeviceScope is `apps/devicescope/`; Robots vs Aliens is `apps/robots-vs-aliens/`.
- Work only in the requested app and its dedicated workflow. Do not modify another app's source, dependencies, tests, package identity, assets, or release configuration as part of an unrelated task.
- Root documentation, the app catalog, `.gitignore`, and shared workflows are integration surfaces. Name the intended shared-file edits in the task claim and coordinate their ownership before concurrent edits.
- Use the existing checkout. Cloud tasks already run in isolated environments; do not create a worktree unless the user explicitly requests one.
- Keep each application's dependency graph and build root independent. Never run another application's initializer in the repository root. Do not add cross-app source dependencies by convenience.

## GitHub is the durable handoff

- Fetch remote state at the start of each session. Check `git status` and preserve existing local work before switching branches or pulling.
- For DeviceScope, follow `apps/devicescope/COLLABORATION.md`. Use task claims, distinct branches, and committed handoffs; do not assume the other Codex can see this chat or local files.
- Use normal, non-force pushes. On rejection, fetch and inspect competing changes; do not reset remote work or resolve conflicts by discarding the other session's edits.
- Push authorized work and its handoff before ending. If upload is blocked, report the actual failure and do not claim the work is available on GitHub.
- Never commit credentials, environment secret files, SDK installations, caches, local SDK paths, signing keys, or build output. Publish app-specific APK/AAB artifacts through CI or releases when authorized.

## Validation

- Run the affected app's documented checks from its own directory. A docs-only plan does not require inventing tests or claiming an app exists.
- After relocating an app or changing its build/CI paths, run its existing checks and validate its native build where configured.
- Keep passed, failed, skipped, and unrun checks distinct. Update the task and handoff with evidence and remaining blockers.
- All metrics in DeviceScope must report real availability, units, source, and timestamp. Never present demo readings as measurements from the user's phone.

## Current commands

- Game: `cd apps/robots-vs-aliens && npm ci && npm run check`; native: `npm run android:sync`, then `cd android && ./gradlew --no-daemon --max-workers=2 assembleDebug lintDebug`.
- DeviceScope: implementation has not started. Begin with its task board; build commands become valid only after DS-001 is integrated. Do not run the game's Node/Capacitor tooling for DeviceScope.
