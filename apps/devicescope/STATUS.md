# Integrated status

Updated: 2026-11-03. DeviceScope only.

## Completed milestones

- DS-001: independent Kotlin/Compose foundation, com.laska.devicescope, own wrapper,
  catalog/locks and dedicated CI. Code 605d6b8880229a14f1f9f277ff3c3d33005de919;
  main milestone ab7764e. Typed model + honest bootstrap screen.
- DS-003: public Android hardware repository, typed field registry, explicit
  unsupported CPU/GPU temperatures and other unavailable states. Code
  a24a8b629cb94c36178d1a6aec9509a0cfdddf19; main milestone ca41748.
- DS-002: B's original UI/state/accessibility specification and clearly labeled
  standalone design reference. B code c037034f6266ae1ed813ab14ee3932eeb6866af4;
  A integration 106c782f73a4827e5f3a827d5481a8a71b9cc971. Canonical collector IDs
  and mandatory timestamps in DATA_CONTRACT override provisional UI examples.

- DS-004: original adaptive Compose explorer using the real hardware repository,
  explicit availability/freshness/source details, lifecycle-safe collection and
  native regression coverage. Code c223fc837940e963d821c2ea758242e96474bcb8;
  main merge 6e675bc153005898db7763900a54bcc3440a1270.

- DS-010: A's capacity/sensor validity and GPU failure/cleanup fixes reviewed and
  integrated by B. Code c6f055eed0f7d215c8e0445e7542f3706abeef69;
  merge e94b69f0f1ecb832a19cdc13ccca7743452ed6d8. B integration test code
  bdcc090eed916c314ca3e16885a6d80553102c09.

## Actual validation

Combined DS-004/010 testDebugUnitTest/lintDebug/assembleDebug plus
:app:assembleDebugAndroidTest passed at 2d1ca98. 39 JVM tests (10 presenter,
22 hardware, 7 model), zero failures/errors/skips. Lint zero errors, six existing
app warnings (five dependency updates, DataExtractionRules); libraries clean.
Debug and instrumentation APKs assembled; signature, package and min26/target36
verified. The subsequent test-only synchronization change at bdcc090 compiled and
passed all four focused production/lifecycle instrumentation tests.

API 29 software emulator: 13/14 full-suite scenarios passed; the remaining Back
test was synchronized with navigation recomposition and passed in the final focused
2/2 Back/large-text rerun. All 14 scenarios have a passing result across runs,
not a single clean full-suite run. Final combined production/lifecycle rerun: 4/4 passed, no failures/skips, including
real GPU identification before/after backgrounding, production launch and honest
unsupported CPU temperature, rediscovery and serialized collector cleanup.
An earlier combined run hit an intermittent Compose activity-destruction exception;
an unchanged isolated GPU rerun passed. Test dialog-disposal synchronization was
added, but no production fix is claimed: unresolved follow-up DS-011. Native phone dark, tablet light and 320dp/200% text captures inspected;
merged accessibility semantics/actions checked. API 35 attempts were not a clean
pass. Manual TalkBack, physical sensor accuracy, OEM EGL behavior and release
performance/device matrix remain untested. Remote CI has not been observed.

B's DS-002 handoff separately records 42 browser layout cases, state/theme checks
and contrast checks; those are design reference evidence, not native device tests.
See tasks/DS-004.md and handoffs/2026-11-03T064700Z-b-ds004-ready.md for commands,
failures, corrections and scope. No Robots vs Aliens changes.

## Next work and ownership

B completed DS-004 and the requested DS-010 integration. There is no active B
integration lease after the final handoff; A may record the next integrator in its
claim. DS-011 is an unclaimed runtime cleanup investigation; review it before
release validation. B's source ownership remains separate from A's build/collectors.
A's DS-005 battery/thermal/sampling contract is still unclaimed/unimplemented.
B's DS-006 monitoring UI needs that agreed contract before production integration.
DS-007 session persistence/report interfaces and later DS-008 UI are also pending.
The app accurately labels these sections as not available in this version.

B owns app/src and core/designsystem/src. A retains model/collector and other build
ownership. DS-004 test dependency/runner edits were limited to the explicitly
authorized app/build.gradle.kts, gradle/libs.versions.toml and app locks; no new
modules or competing build. Read task branches and newest handoffs before new work.

Latest session record: [B review completion](handoffs/2026-11-03T070553Z-b-review-complete.md).
