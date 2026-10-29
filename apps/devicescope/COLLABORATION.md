# Two Codex Cloud sessions: coordination protocol

## The shared workspace

GitHub is the shared source of truth. Separate cloud machines do not share local files, running processes, chat history, or unpushed commits. Each session uses its existing checkout and reads the current remote state before deciding what to work on.

Use slots **A** and **B** as readable identities. A session ID/date in each handoff distinguishes replacements. Slot A initially owns platform/build work and slot B initially owns UI work; these are suggested assignments until a task is actually claimed.

Only one session writes a given task branch at a time. Use branches such as `devicescope/a/ds-001-foundation` and `devicescope/b/ds-002-ui-spec`. Keep `main` usable and preserve every other app.

## 1. Start by reading, not overwriting

From the repository root:

```bash
git status --short --branch
git fetch origin --prune
git log -5 --oneline origin/main
git branch -r --list 'origin/devicescope/*'
```

Preserve existing local work. Do not reset or discard it to get a clean tree. With a clean checkout, switch to main and fast-forward it with `git switch main` and `git pull --ff-only origin main`. Read root/app agent instructions, `STATUS.md`, the individual task files, and relevant handoffs on main **and on an existing task branch**.

Claim state on main identifies the owner/branch. Work-in-progress details may be newer on that branch; inspect them with `git show origin/<branch>:apps/devicescope/tasks/<task-file>` and its handoff directory before continuing. A snapshot in `STATUS.md` can lag active task work.

## 2. Claim one task before implementation

Choose an unclaimed task whose dependencies are integrated. Edit only its file on main:

- State: `claimed`.
- Owner: slot A or B plus a unique session label.
- Branch: the exact proposed remote task branch.
- Claimed/updated time: current UTC time.
- Files: intended owned directories and any shared-file changes.

Commit that task file and push normally to main. A claim is established only after a successful push. The ordinary non-force push is the concurrency check: two sessions claiming the same base cannot silently overwrite each other.

If push is rejected, fetch main and inspect the remote task file **before retrying**. If another session claimed it, stop competing for that task, preserve your local claim commit, and choose a different task. If unrelated changes caused the rejection, merge the new main, recheck the task is still unclaimed, and push the claim. Do not force-push or automatically choose one side of a claim conflict.

If main is protected, submit the claim as a PR and wait for that reservation to be integrated before overlapping implementation. A pending PR is not a lock. Independent work on a different properly claimed task can continue.

After claiming, create and publish the task branch from the latest main:

```bash
# Example for A; use your claimed task's exact branch name.
git switch -c devicescope/a/ds-001-foundation
git push -u origin devicescope/a/ds-001-foundation
```

## 3. Work inside the claimed boundary

- A owns collector/model/storage work; B owns screen/design work, as specified per task.
- Shared contracts, Gradle files, `app/` wiring, and app CI have one named owner for each change. The other session requests a change through its task/handoff instead of editing the same file concurrently.
- During DS-001, B works on DS-002 design documentation only. B starts Kotlin UI work after the foundation and contract are integrated.
- Keep code, tests, docs, and dependency changes within DeviceScope. Its only planned repository-level build change is `.github/workflows/devicescope-ci.yml`.
- Push small meaningful commits regularly. A task branch may hold WIP if its handoff states which checks fail; do not merge that WIP into main as completed work.
- Use fixtures for UI tests/previews when waiting for collectors, but clearly label them and keep production injection honest. Incomplete integration is a blocker, not a fake successful measurement.

## 4. Leave a durable handoff every session

Before stopping:

1. Commit your implementation/tests so there is a concrete code commit to reference.
2. Update your task file on the task branch with state, progress, blockers, commands/results, and the next small action.
3. Add a uniquely named record under `handoffs/`, following the template. Include the branch and the code commit from step 1. Do not try to reference the handoff commit's own hash.
4. Commit and push the task update and handoff. Confirm the remote branch tip matches local HEAD using `git ls-remote origin refs/heads/<branch>`.
5. Report the pushed branch, task ID, handoff path, and whether it is integrated. Local files alone are not a handoff to the other cloud.

If a push is blocked, preserve the local commits, report the failure, and do not mark them uploaded. No secrets, APKs, logs containing identifiers, or SDK directories belong in task/handoff commits. Reference CI artifacts or redacted evidence instead.

## 5. Integrate one task at a time

Mark the task `ready_for_review` on its branch when acceptance criteria pass. The other slot reviews when available. Assign one integrator in the task record; never have two sessions merge competing work simultaneously.

The integrator fetches, reads the diff/handoff, merges the latest main into the task branch without rewriting shared history, resolves conflicts deliberately, and reruns the affected DeviceScope checks. If shared CI/repository paths changed, validate affected apps too.

Prefer a PR to main. If PR tooling is unavailable and direct pushes are authorized, integrate with a normal merge on an up-to-date local main, run the relevant checks against the merged tree, and push without force. A rejected push requires fetching and retesting the updated integration; do not overwrite the other session's main.

Set the task to `done`, add the tested code/integration reference, and update `STATUS.md` as part of the integration. If a claim must be released unfinished, record why and where its WIP lives. Do not delete a task branch until its work is integrated and the handoff remains recoverable.

## 6. Continue someone else's task

A replacement session first reads the latest remote task/handoff. Obtain an explicit handoff from the current owner or a user reassignment, then record the new owner on main. An old timestamp alone does not authorize takeover.

Fetch and switch to the exact recorded branch, preserving its history. If the original owner may still be active, use a new continuation branch after ownership is settled, and record the superseded branch. Reproduce the last recorded result before extending it; do not restart the feature from scratch or assume the chat contained everything.

## State meanings

`todo` → `claimed` → `in_progress` → `ready_for_review` → `done`.

`blocked` may replace an active state when a prerequisite prevents progress. The owner remains responsible until a documented release/reassignment. `done` means implemented, validated to the task's stated standard, and integrated; it does not automatically mean physical-device validation or a store release.
