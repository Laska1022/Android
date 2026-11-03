# DeviceScope bug review — B integration checkpoint

- Session/slot: B / b-20261029T181128Z (continued 2026-11-03)
- Timestamp: 2026-11-03T06:53:25+00:00
- Tasks: DS-004 done; DS-010 integration verification pending
- Working branch: main (B is the delegated integrator)
- Durable B task branch: devicescope/b/ds-004-compose-ui
- DS-004 final UI code: c223fc837940e963d821c2ea758242e96474bcb8
- DS-004 integration: 6e675bc153005898db7763900a54bcc3440a1270; milestone bba29cffbbc7b37b507773cd4be1619bba9bc9ca
- DS-010 A code: c6f055eed0f7d215c8e0445e7542f3706abeef69
- DS-010 local merge: e94b69f0f1ecb832a19cdc13ccca7743452ed6d8
- Combined code/test commit: bdcc090eed916c314ca3e16885a6d80553102c09
- Integrated into remote main: DS-004 yes; DS-010 pending final runtime result/push

## Fixed behavior

B's native explorer uses real AndroidHardwareRepository readings with explicit
availability, units, provenance, source, timestamps and exact byte counts. Fixed
collector restart overlap, old snapshots displayed during rediscovery, Overview Back
being swallowed, error details reported as a missing feature, invalid percentage
formatting and lost integer precision. Tablet default selection, camera field
identity, 200% navigation word breaks and duplicate no-reading labels are corrected.
Fixture previews remain visibly labeled; production has no fake provider.

A's DS-010 was reviewed and merged as requested in its ready handoff. Unknown capacity
pairs cannot become zero free bytes; valid full storage still can. Sensor numeric
sentinels and one-shot/on-change delays have explicit meanings. GPU preflight/query
failures remain inside GPU fields; cleanup attempts each resource even after failure,
checks false results and preserves cancellation. No public interfaces/IDs changed.
A's collector source was integrated unchanged; B added the production GPU lifecycle
instrumentation check under B-owned app/src. No silent takeover of A's task branch.

## Validation actually performed

From apps/devicescope with JDK 21 / SDK 36:

```sh
./gradlew --no-daemon --max-workers=2 testDebugUnitTest lintDebug assembleDebug :app:assembleDebugAndroidTest
ANDROID_SERIAL=emulator-5556 ./gradlew --no-daemon --max-workers=2 :app:connectedDebugAndroidTest '-Pandroid.testInstrumentationRunnerArguments.class=com.laska.devicescope.ProductionLaunchTest,com.laska.devicescope.CollectionLifecycleTest'
```

The combined native gate passed: 39 JVM tests (10 presenter, 22 hardware, 7 model),
zero failures/errors/skips. Lint zero errors, six pre-existing app warnings (five
version notices and DataExtractionRules); hardware/designsystem clean. Debug and
instrumentation APKs assembled. apksigner verify passed; aapt verified package
com.laska.devicescope, min26/target36 and MainActivity launcher. git diff --check
passed; the entire review delta is under apps/devicescope. Other apps/workflows
are unchanged.

Combined runtime attempt: the real production-launch test passed, then the GPU
background/resume test completed its reads but crashed during activity destruction
with ArrayIndexOutOfBoundsException in Compose 1.9.3 SlotWriter.moveSlotGapTo.
The process crash prevented completion of the remaining lifecycle cases. This is
not a passing four-test run. An unchanged isolated GPU rerun then passed 1/1,
including background/resume and destruction. The fault did not reproduce in isolation.

The harness now explicitly waits for source-dialog removal and Compose idle before
Android lifecycle transitions (bdcc090). This is test synchronization, not a claimed
production crash fix. A combined four-test rerun is in progress; do not mark DS-010
done or push its integration to main until the result is reviewed. If it passes,
retain the intermittent cleanup failure as a follow-up rather than erasing it.

Earlier DS-004 API 29 run: 13/14 scenarios passed; Back harness failed because it
ran before navigation recomposition. Dispatch-after-idle correction plus large-text
padding change passed the focused final 2/2 Back/200% layout rerun. Those results
are not a single clean full-suite pass. Phone dark, tablet light and 320dp/200% text
native captures were inspected; labels stay whole after the fix. Accessibility
semantics, source/unit descriptions, click actions and state restoration are checked.
Earlier API 35 runs were incomplete/unstable and are not claimed as passing evidence.

Tests and captures use a software emulator, not physical phone measurements. Manual
TalkBack traversal, OEM EGL behavior/leak profiling, physical sensor accuracy,
release performance and the wider device matrix remain unrun. Remote CI status was
not observed because GitHub's API returned Forbidden. Native Git fetch/push works;
normal merges follow COLLABORATION.md's authorized fallback. No force pushes.
Local logs/screenshots are not committed or assumed available to another cloud.

## Next steps and ownership

DS-005 remains unclaimed. A should claim it normally and define the battery/thermal
sampling contract before B starts DS-006 production monitoring. DS-007 reports/
session storage and DS-008 UI remain pending. Current screens explain these missing
features without sample measurements, fabricated temperatures or pretend controls.
No new B task is claimed during this bug review while the sampling contract is absent.

A should coordinate updates to the older bootstrap/unimplemented wording in README,
root/app AGENTS and task index; B updated the authorized STATUS integration surface.
Read STATUS and individual remote task files as the current implementation record.
Future integration ownership is recorded after final verification below.

B retains the integration role while the combined runtime rerun is pending. The
checkpoint and code are pushed only to devicescope/b/ds-004-compose-ui; remote main
remains at completed DS-004 milestone bba29cf until DS-010 is validated. Next: inspect
/tmp/devicescope-b-combined-runtime-rerun.log and the connected test XML; fix a
reproducible issue or record a blocker, then publish a fresh final handoff. Confirm
remote tips with git ls-remote after the push; do not force-push.
