# Android apps

Independent applications maintained in one repository. Each app owns its source, dependencies, Android package identity, documentation, tests, and build outputs.

| App              | Directory                                          | Current state                                                | Start here                                        |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| Robots vs Aliens | [`apps/robots-vs-aliens/`](apps/robots-vs-aliens/) | Playable web/Android game                                    | [Run and build](apps/robots-vs-aliens/README.md)  |
| DeviceScope      | [`apps/devicescope/`](apps/devicescope/)           | Plan and collaboration workspace; implementation not started | [Plan and task board](apps/devicescope/README.md) |

The game previously lived at the repository root. Its working directory is now `apps/robots-vs-aliens/`; its gameplay source and dependency versions are unchanged by the move. There is no root application build. Run each app's commands from its own directory.

```bash
# Robots vs Aliens
cd apps/robots-vs-aliens
npm ci
npm run dev
```

## Two Codex Cloud sessions for DeviceScope

Connect both environments to **Laska1022/Android**, using their existing checkouts. Give each session a different slot: **A** or **B**. Their shared memory is the files and branches pushed to GitHub, not the previous chat or cloud filesystem.

1. Read [repository instructions](AGENTS.md) and [DeviceScope instructions](apps/devicescope/AGENTS.md).
2. Follow [the collaboration procedure](apps/devicescope/COLLABORATION.md) to claim a task before writing code.
3. Use the ready-to-paste [Codex A/B starting prompts](apps/devicescope/PROMPTS.md).
4. Commit and push work with a [handoff record](apps/devicescope/handoffs/README.md) before ending a session. Fetch remote branches when continuing another session's work.

Start A on the native foundation (**DS-001**) and B on the UI specification (**DS-002**). These tasks can run concurrently. The UI implementation waits for the shared foundation/data contract to be integrated. No tasks are claimed automatically by this plan.

## Adding another application

Create `apps/<unique-app-id>/` with an app-specific `README.md`, `AGENTS.md`, dependencies, tests, and documentation. Add its entry to [`apps/catalog.json`](apps/catalog.json). Use a unique Android application ID, artifact names, and an independent Gradle root/wrapper where needed. Do not reuse another app's `android/`, lockfile, signing configuration, or build output folder.

GitHub workflows belong in `.github/workflows/` and must have app-specific paths and working directories. Shared infrastructure changes require coordination through the relevant task record. The game CI and its manual Pages publication target only the game. DeviceScope has no build workflow until its native foundation exists.
