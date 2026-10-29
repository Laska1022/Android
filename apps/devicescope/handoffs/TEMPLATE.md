# Handoff: <task ID> — <short outcome>

- Session/slot: <unique session label; A or B>
- Timestamp: <UTC ISO-8601>
- Task state: <claimed/in_progress/blocked/ready_for_review/done>
- Task branch: <exact branch>
- Code commit: <full SHA of already committed implementation>
- Base/integrated main commit: <full SHA>
- Owner after this handoff: <same owner or explicitly agreed reassignment>
- Integrated into main: <yes/no; integration reference if yes>

## What changed

<Concrete files, behavior, and decisions. Identify shared-interface changes.>

## Validation actually performed

| Command / device scenario             | Result                                  | Evidence / commit                                        |
| ------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| <exact command and working directory> | <passed/failed/skipped/not run; counts> | <report, CI link, redacted screenshot, or error summary> |

<Distinguish compilation from physical sensor validation.>

## Current limitations and blockers

<Missing prerequisites, known failing cases, unsupported readings, unanswered decisions.>

## Next concrete action

<One reproducible starting action, relevant files, and acceptance condition.>

## Coordination

<Files still owned by this task, changes another slot must wait for, branch to fetch, review/integration request, or explicit release/reassignment.>

## Upload confirmation

<After the push, report the remote branch tip in the session's final message. The committed handoff cannot assert its own final commit hash. If upload fails, report failure rather than claiming the other cloud can see it.>
