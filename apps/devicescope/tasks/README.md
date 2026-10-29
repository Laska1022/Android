# DeviceScope task board

The records linked below are the authoritative task definitions. Initial state for every task is `todo`, owner `unclaimed`. Suggested lanes below are not locks; follow [the claim protocol](../COLLABORATION.md).

| Task                | Suggested lane                                     | Deliverable                                              | Prerequisites                                       |
| ------------------- | -------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| [DS-001](DS-001.md) | A                                                  | Independent native foundation, typed model, build and CI | None                                                |
| [DS-002](DS-002.md) | B                                                  | Original UI/state specification and accessibility plan   | None; coordinate with DS-001                        |
| [DS-003](DS-003.md) | A                                                  | Device/hardware collectors and capability discovery      | DS-001 integrated                                   |
| [DS-004](DS-004.md) | B                                                  | Compose shell, overview, and hardware details            | DS-001 and DS-002 integrated                        |
| [DS-005](DS-005.md) | A                                                  | Battery/thermal collectors and lifecycle-safe monitoring | DS-003 integrated                                   |
| [DS-006](DS-006.md) | B                                                  | Thermal/battery pages, graphs, session controls          | DS-004 integrated; final acceptance requires DS-005 |
| [DS-007](DS-007.md) | A                                                  | Session persistence, redacted reports, export APIs       | DS-005 integrated                                   |
| [DS-008](DS-008.md) | B                                                  | Report/history/settings UI and accessibility polish      | DS-006 integrated; final acceptance requires DS-007 |
| [DS-009](DS-009.md) | One named integrator; A/B supply assigned evidence | Integrated QA, device matrix, release candidate          | DS-001 through DS-008 integrated                    |

DS-004 may build UI against agreed test/preview fixtures while A develops collectors; production wiring and completion require actual supported readings or accurate unavailable states. DS-006 and DS-008 may proceed against integrated interfaces, but must stay `in_progress`/`blocked` until their final acceptance dependencies are verified. Do not merge pretend production readings to make a task look finished.

The two initial independent tasks are DS-001 and DS-002. Thereafter parallel lanes are collectors/storage (A) and screens/graphs (B), with shared interfaces owned explicitly.

Update the individual task file, not this index, for claims and progress. Update [STATUS.md](../STATUS.md) only for integrated milestones. State on an active task branch may be newer than the claim on main; consult the branch before choosing work.
