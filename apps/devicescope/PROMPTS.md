# Starting prompts

Give the first prompt to one Codex Cloud environment and the second to the other. Both need this GitHub repository checked out and permission to push their work. Keep their slot identities distinct. Neither prompt assigns ownership until the claim is pushed.

## Codex A — native foundation and collectors

```text
Work on DeviceScope in Laska1022/Android. You are slot A.
Use the existing checkout. Fetch origin and inspect local changes first.
Read root AGENTS.md and apps/devicescope/{AGENTS.md,README.md,STATUS.md,
COLLABORATION.md,PLAN.md}, the task board, and relevant remote handoffs.

Claim DS-001 using the GitHub claim procedure if it remains unclaimed.
Implement the independent Kotlin/Compose foundation only in
apps/devicescope/ and its dedicated workflow. Coordinate the shared
measurement contracts with slot B through committed docs. Do not change
Robots vs Aliens, reuse its package ID, or create a root-level app build.

Once DS-001 is integrated, take the next available A task whose dependencies
are done. Use real public Android APIs and explicit unavailable states.
Never manufacture CPU/GPU temperatures or treat headroom as Celsius.

Commit and push code, update the task, and add a unique handoff before every
session ends. Record actual check results, the code commit, blockers, and
the next action. Confirm the remote branch exists and matches your work.
Do not force-push or overwrite the other session's changes.
```

## Codex B — design and native UI

```text
Work on DeviceScope in Laska1022/Android. You are slot B.
Use the existing checkout. Fetch origin and inspect local changes first.
Read root AGENTS.md and apps/devicescope/{AGENTS.md,README.md,STATUS.md,
COLLABORATION.md,PLAN.md}, the task board, and relevant remote handoffs.

Claim DS-002 using the GitHub claim procedure if it remains unclaimed.
Create the original UI/state specification and accessibility criteria in
your assigned DeviceScope docs. Slot A owns DS-001 and the native build.
Do not create a competing Gradle project or edit slot A's foundation files.

After DS-001 and DS-002 are integrated, claim DS-004 to implement the Compose
UI against the agreed typed contract. Continue with available B tasks.
Keep preview fixtures visibly labeled; production screens use real
collectors and accurate unavailable/error/permission/stale states.
Do not modify Robots vs Aliens or its build configuration.

Commit and push code/docs, update the task, and add a unique handoff before
every session ends. Include actual checks, branch, code commit, blockers,
and next steps so A or a replacement session can continue your work.
Do not force-push or silently take over another task.
```

## Replacement / continuation session

```text
Continue the assigned DeviceScope task in Laska1022/Android.
Read repository/app instructions and COLLABORATION.md. Fetch all relevant
remote state; read the task's claim on main and its latest handoff on the
recorded branch. Confirm ownership/reassignment before editing.

Preserve the existing implementation and history. Reproduce the recorded
test/build result, then perform the documented next action. Use the task's
branch or a documented continuation branch, not a fresh rewrite.
Push a new handoff and truthful status before ending. Keep changes scoped
to DeviceScope and explicitly assigned shared files.
```
