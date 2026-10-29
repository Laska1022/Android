# DeviceScope UI specification — DS-002

Version 1.0 · 2026-10-29 · owner B / b-20261029T181128Z.

This is an implementation specification, not an implemented Android application.
The [interactive design reference](../design/index.html) is an original, offline
HTML mockup; every value in it is **sample data, not a phone measurement**. It has
no Android collectors and is not a runtime dependency or a competing app project.

Based on [PLAN](../PLAN.md), [capability limits](CAPABILITIES.md), and A's version
0.1 implementation agreement in `docs/DATA_CONTRACT.md` on
`devicescope/a/ds-001-foundation` at `e55967b89027a687d3ae93bf53efd3b23f25236f`.
The canonical [data contract](DATA_CONTRACT.md) remains owned by A. The symbols
below describe that agreement; proposed additions are explicitly listed at the end.

## 1. Product and visual direction

DeviceScope is a calm instrument panel for understanding a phone. The first view
answers what device this is, which measurements are available, and how recently
they were collected. A detail page explains each value's source and limits.
No aggregate health score, animated scanner, benchmark rank, simulated activity,
or temperature substitute appears in production.

Use an original rounded-square mark with two offset instrument ticks, generous
spacing, restrained teal accents, and readable tabular numerals. Avoid copying
CPU-Z/HWiNFO branding, logos, layouts, or assets. Native implementation uses
Compose Material 3 components with the tokens below; no custom font download.

### Tokens

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Canvas | `#F5F7FA` | `#0D151C` | Screen background |
| Surface | `#FFFFFF` | `#15212C` | Cards/sheets |
| Main text | `#17212E` | `#E8EFF4` | Values, headings, body |
| Secondary text | `#4B596B` | `#B1C2CF` | Units, source, explanatory copy |
| Accent | `#005B63` | `#7ED5D0` | Selected item, focus, available trace |
| Accent container | `#D9F1F0` | `#183E43` | Selection background |
| Warning text | `#7D4E00` | `#FFD18A` | Explicit caution with icon/text |
| Error text | `#AB2530` | `#FFB4B8` | Error with icon/text |
| Functional outline | `#697889` | `#8195A5` | Inputs, focus-independent borders |

- System theme by default; later Settings offers System / Light / Dark. Dynamic
  colors are deferred until contrast is checked. Unavailable data uses readable
  secondary text, not disabled low-contrast gray.
- Spacing: 4, 8, 12, 16, 24, 32 dp. Screen gutter 16 dp on compact widths,
  24 dp on larger widths. Cards use 16 dp padding, 20 dp radius; controls 12 dp.
- Text in sp: title 28/34, section 20/26, body 16/24, supporting 14/20,
  metric 32/40. Weights 400/500/600/700. Labels remain at least 14 sp.
  No fixed height around text; numbers use tabular figures where supported.
- Touch/focus target at least 48 × 48 dp, with at least 8 dp between unrelated
  icon targets. Visible focus outline 2 dp plus offset, not only a color change.
- Motion is optional and brief (150–200 ms). Honor system animation scale;
  no continuously pulsing measurements or shimmering loading requirements.

## 2. Navigation and adaptive layout

Four persistent destinations: **Overview, Hardware, Monitor, Reports**. Thermals
and Battery are full pages under Hardware, also linked directly from Overview.
This keeps all six product sections accessible without crowding a phone bar.

| Destination | Route intent / contents | Primary actions |
| --- | --- | --- |
| Overview | `overview`; identity, battery level/temperature, thermal status, RAM, storage | Open detail, open Monitor |
| Hardware | `hardware`; category list and selected detail | Select category, inspect source |
| Thermals | `hardware/thermals`; battery sensor separately identified, system thermal state/headroom, explicitly unavailable CPU/GPU temps | Inspect explanation, select supported metric for Monitor |
| Battery | `hardware/battery`; level/status/temperature/voltage/current/counter | Inspect provenance, select supported metric for Monitor |
| Monitor | `monitor`; metric selection, live session, charts/table | Start, Pause, Resume, Stop |
| Reports | `reports`; saved sessions and current-device report | Review report, export, delete saved session |

Settings is a labeled top-bar action leading to a sheet/page in DS-008. Search
within the local hardware category/field labels is optional after DS-004; there
is no search box implying unavailable functionality in its initial scope.

- Compact, available window width <600 dp: bottom navigation, one scrolling
  column; two overview cards only when each retains at least 156 dp of usable
  width. At narrow width or larger text, stack cards. Hardware list pushes a
  detail page; Back returns to the list and retains selection/scroll position.
- Medium, 600–839 dp: labeled navigation rail. Hardware may use list + detail
  only if each pane has at least 280 dp after rail/gutters; otherwise single pane.
  Overview has two columns when content fits.
- Expanded, ≥840 dp: rail + 256 dp category pane + remaining detail pane when
  feasible; central content has max width 1200 dp. Overview has up to three
  columns. Monitor has chart + summary, stacking if insufficient width.
- The available content size and font scale override nominal breakpoints.
  At 200% font scaling, navigation labels and values remain complete; use fewer
  columns, larger rows, and scrolling instead of clipping or reduced font size.
  Landscape short-height windows scroll; bars respect system/cutout/IME insets.
- Main destinations preserve their own selection/scroll state. Back dismisses
  a modal, then returns from a detail, then follows Android's normal exit behavior.
  Rotation/resizing preserves route, selected metric and session identity; it
  must not start a second collection session. Do not lock orientation.
- RTL uses logical start/end alignment; layout mirrors, numeric strings retain
  locale formatting. Charts keep chronological order with explicit time labels
  rather than silently changing data order on a locale switch.

### Screen composition and interactions

**Overview:** title “DeviceScope”, compact manufacturer/model subtitle and Android
version; no device photo guess. Small collection status line (“Updated just now”,
“Monitoring paused”, or “Waiting for readings”). The principal battery-temperature
card explicitly says **Battery temperature**, followed by value/unit or its state,
source and age. A distinct thermal-status card uses a named Android severity,
never a temperature gauge. RAM and storage cards include their scope/definition.
Tap a card to open its detail; avoid nested buttons competing with a whole-card
click target. A summary is partial when some fields are unavailable; available
fields remain visible. Refresh requests a permitted one-shot refresh, never
circumvents a metric's minimum sampling interval.

**Hardware:** labeled categories Device & system, CPU & SoC, GPU, Memory, Storage,
Display, Cameras, Sensors, Connectivity, Battery, Thermals. A row contains a
name, value/state, unit when applicable, and a source/age affordance. A detail
sheet gives the exact public source, provenance, sample time, definition and
limitations. Long build strings wrap and can be copied explicitly; protected
identifiers are not collected to populate this UI. Multi-item data uses stable
IDs (volume, camera, sensor); duplicate display names must not collapse rows.

**Thermals:** separate “Temperature readings” and “Android thermal state” sections.
Show CPU and GPU temperature rows with “Not exposed to this app” when unsupported;
do not hide those limitations or reuse battery values. Battery temperature links
to the same canonical metric as Battery. Headroom has a dimensionless value and
help text: proximity to Android's severe-throttling threshold; `1.0` denotes that
threshold, values may exceed it, and it is not percent CPU load or degrees.
The requested forecast horizon belongs in source detail. Never infer a universal
safe/unsafe device temperature from a generic hardcoded threshold.

**Battery:** level percentage, charging/status text, reported health enum,
temperature, voltage, current and charge counter if supported. “Reported health:
Good” is not “100% capacity.” Current label describes platform-reported signed
current; do not infer charging direction from an unverified OEM sign convention.
No remaining-time or wear prediction in the first release.

**Monitor:** begins with “No session yet” and metric selection. Supported numeric
metrics are selectable; unsupported/permission-dependent rows explain their
state. No selection means Start is disabled with adjacent explanatory text.
Show effective interval per metric (a 2 s request does not promise 2 s headroom).
Start creates one foreground session. Pause stops sampling and retains its
history; Resume creates a visible gap and resumes the same session. Backgrounding
pauses collection, with an explicit Resume action on return. Stop ends collection
and presents a session summary; saving/export appears only after DS-007 exists.
Switching to another top-level destination pauses a screen-owned live monitor;
its session status remains visible when returning. This rule is a DS-005 contract
request, not a claim that the current `observe()` interface manages sessions.

**Reports:** empty state “No saved sessions” + “Start a monitoring session”; a
separate “Current device report” action is available only once export is wired.
List items show user-safe title, start time/time zone, duration, metric count and
sample coverage. Review shows included fields and “Sensitive identifiers excluded”.
CSV/JSON/readable choices state format and destination action. Save uses system
document picker; Share uses Android chooser after explicit action. Cancellation
keeps the report available and is not an error. Do not auto-upload or add an
internet/account prompt. Confirm local deletion; deleting a local session cannot
recall a previously shared copy. Detailed persistence UI belongs to DS-008.

During staged delivery, destinations whose implementation is absent show explicit
“Not implemented in this build” copy, not “Unsupported on your phone”. No active
export/start/permission action may imply a backend or collector that is missing.

## 3. Measurement presentation state machine

The UI maps the canonical typed model; it does not invent another collector
model. Loading, route selection, dialog visibility and empty session are UI
state. Reading availability, sample time, provenance and freshness remain data
state. A screen can contain several different reading states simultaneously.

| Input / situation | Visible representation | Action and accessibility |
| --- | --- | --- |
| Before first snapshot | “Loading device information”; static placeholder shapes without numbers | One polite loading announcement; do not announce every placeholder |
| `Available` + `FRESH` | Typed formatted value + unit, provenance and last sample age | Detail exposes source/time; numeric zero remains valid when the collector validated it |
| `Available` + `STALE` | “Stale · last reading …”, retained value visibly qualified, actual age | Refresh if supported; never move sample time forward on a UI timer |
| `Available` + `PAUSED` | “Paused · last reading …”, retained value/time | Resume only where session controller supports it; no trace extension |
| `Unsupported` | “Unavailable” + concrete explanation, e.g. “CPU temperature is not exposed to ordinary apps” | No retry or permission request pretending to unlock an unsupported API |
| `PermissionRequired` | “Permission needed” + feature-specific reason, no value | “Allow access” only on intentional action with rationale; denial retains useful other data |
| `TemporarilyUnavailable` | “Waiting for a reading” + safe reason; no zero or endless spinner | Optional refresh under rate limit; do not call permanently unsupported hardware “loading” |
| `Error` | “Couldn’t read this value” + safe explanation, no current value | Retry if repository supports it; no raw exception/identifier/log in UI |
| Empty hardware inventory | “No accessible sensors/cameras/volumes reported” appropriate to domain | If discovery failed or permission is needed, use that state rather than empty |
| Empty session / no valid samples | “No session yet” / “No valid samples yet” | Explain next action; min/max/average say “No data”, never zero |
| Preview/test fixture | Persistent “SAMPLE DATA · DESIGN PREVIEW” banner | Banner is visible and in semantics; never wired into a production repository |

**Precedence:** evaluate reading availability first. `Unsupported`, permission,
temporary-unavailable and error contain no current numeric value, even when a
cached prior sample exists. Freshness qualifies only an available or explicitly
separated historical reading. If a repository retains the last valid sample
across an error, label it “Previous reading” with its old timestamp below the
current error; never cast it back to Available or plot it as a new sample. Do not
invent a history field or infer it from a new error timestamp.

Capability `UNKNOWN` means discovery is unresolved, not available. A missing key
in an incomplete snapshot is “Waiting for discovery”; a complete inventory with
no metric needs an explicit supported/unsupported decision from the repository.
Do not infer absence from a null alone. A null `sampledAt` has “Sample time not
provided”, not “just now”. Static facts use “Reported at …”/“Read on this visit”
when their actual timestamp exists; they do not become stale on the live cadence.

Error/permission copy is resource-backed. Unknown extension enums/keys render
“Unknown value” with source details and no guessed number; the screen must remain
usable. If invalid/non-finite values reach a UI boundary despite model validation,
show a safe unavailable/error state, exclude from plots, and record a test failure.
Model numeric sentinels and validation belong to A.

### Permissions and retry behavior

Baseline system/battery/thermal views request no broad storage, phone-identity,
camera capture or location access. Optional connectivity details offer an
explanation only when opened. Never request permission at launch or during normal
recomposition. After denial retain the reason; after “don’t ask again” offer
“Open app settings” only when Android's current permission state supports it.
Recheck after returning from settings; revocation while visible immediately
clears protected values. Do not export a cached protected field after revocation.
Retries are user driven and respect minimum intervals; no automatic retry storm.

## 4. Field-to-capability map

IDs below are **semantic proposals** unless already in A's model. A confirms
the canonical registry before DS-004 binds fields; UI must not hardcode a second
incompatible key set. Each row's unavailable/error/permission handling follows
section 3, independently of neighboring fields.

| Screen / field (proposed ID) | Public source / typed value and canonical unit | Presentation and additional fallback |
| --- | --- | --- |
| Identity `device.manufacturer`, `device.model` | `Build.MANUFACTURER`, `MODEL`; text | Reported device identity; missing/unknown stays unknown |
| System `system.android`, `system.api`, `system.build`, `system.securityPatch` | `Build.VERSION.RELEASE`, `SDK_INT`, `Build.DISPLAY`, `SECURITY_PATCH`; text/count | Reported OS/API/build/patch; preserve invalid/unset patch as unknown, not a parsed fake date |
| Uptime `system.uptime` | `SystemClock.elapsedRealtime`; milliseconds | Time since boot including deep sleep, live age; not app session length |
| SoC `soc.manufacturer`, `soc.model` | `Build.SOC_MANUFACTURER`, `SOC_MODEL`, API 31+; text | Earlier API/unknown returns explicit unavailable; no model-name guess |
| CPU `cpu.abis`, `cpu.logicalProcessors` | `Build.SUPPORTED_ABIS`, `Runtime.availableProcessors`; text list/count | Label “Supported ABIs” / “Available logical processors”; no physical topology or live CPU-load claim |
| CPU optional clocks/load | No universal public source in first release | “Not exposed to this app”; do not derive utilization from core count |
| GPU `gpu.vendor`, `gpu.renderer`, `gpu.version` | EGL/GLES strings on managed off-main context; text | Reported driver capabilities; initialization failure is error, not unsupported GPU |
| Memory `memory.total`, `memory.available` | `ActivityManager.MemoryInfo.totalMem`, `availMem`; bytes | GiB/MiB with exact bytes in detail; available includes Android's reclaimable memory semantics |
| Memory `memory.used` | Derived `total − available`, both valid from one snapshot; bytes | Label “Used (derived)”, not per-app usage; absent/inconsistent inputs make result unavailable |
| Storage `storage.<id>.total`, `.available` | `StatFs` accessible-volume total/available bytes | Show volume scope; user-available space is not whole-device physical flash or another app's files |
| Battery `battery.level`, `.status`, `.health` | Battery broadcast level/scale, status/health; ratio/enums | Percentage from valid level/scale; reported enum, no capacity-wear percent |
| Battery `battery.temperature` | `ACTION_BATTERY_CHANGED` temperature; Celsius after A converts tenths °C | Explicit “Battery temperature”; valid zero is permitted, missing extras not zero |
| Battery `battery.voltage` | Battery broadcast voltage; millivolts | Display volts with two decimals; detail preserves mV/source |
| Battery `battery.current` | `BATTERY_PROPERTY_CURRENT_NOW`; microamps | Signed mA in UI; unsupported sentinel rejected by collector; don't assume charge direction |
| Battery `battery.chargeCounter` | `BATTERY_PROPERTY_CHARGE_COUNTER`; microamp-hours | Display mAh; needs explicit new unit before binding, not MICROAMPS |
| Thermal `thermal.status` | `PowerManager` thermal status, API 29+; enum | None/Light/Moderate/Severe/Critical/Emergency/Shutdown (platform terminology), no °C or app-issued health verdict |
| Thermal `thermal.headroom` | `PowerManager.getThermalHeadroom`, API 30+; dimensionless ratio | Two decimals + explanation/horizon; never clamp to 0–1, handle NaN; ≥10 s between queries |
| Thermal `cpu.temperature`, `gpu.temperature` | No universal public API | Explicit unavailable; no battery substitution, guessed values or empty fake traces |
| Display `display.<id>.resolution`, `.density`, `.currentMode`, `.supportedModes`, `.hdr` | Public display/mode/configuration APIs, guarded; pixels/dpi/Hz/enums | Identify display and current vs supported modes; Hz is not measured FPS; distinguish window size from physical mode |
| Cameras `camera.<id>.*` | `CameraManager` inventory/characteristics; facing, formats/sizes/ranges | Public inventory only; each restricted characteristic handles permission separately; no camera stream for inventory |
| Sensors `sensor.<id>.*` | `SensorManager` list; name/vendor/type/range/resolution/minDelay | Each sensor retains type-specific unit; inventory presence doesn't prove a valid live sample |
| Sensor live values | Selected `SensorEvent` values/time/accuracy | Axis name/unit per channel; needs units/vector contract (request below); no unitless placeholder for acceleration |
| Connectivity `network.transport`, `.capabilities` | `ConnectivityManager`; typed transport/capability values | “No active network” is a valid state, separate from API error; capability is not a speed measurement |
| Optional Wi-Fi details | Guarded Wi-Fi API and feature permissions | Explicit permission/OS limitation; SSID/BSSID/MAC redacted by default, never quietly unlocked |
| Report/session metadata | DS-005 session controller and DS-007 local store | Actual recorded UTC time plus display zone, duration, selected IDs, sample count/coverage; unavailable until interfaces exist |

### Formatting rules

- Preserve canonical numeric values; format at the display boundary with locale
  grouping/decimal separators. Counts use integers, percentages one decimal only
  when the source precision supports it, temperature one decimal, headroom two.
  Never imply more accuracy than the source supplies. Locale formatting does
  not change canonical JSON units or CSV schema.
- Default temperature °C; a later °F preference converts available values, axes
  and summaries consistently and retains Celsius as source unit in detail/export.
  Ratios are percentages only for a named bounded fraction such as battery level;
  thermal headroom remains dimensionless. Text/enum values never receive units.
- Storage/memory use explicitly labeled binary GiB/MiB (powers of 1024); exact bytes
  in detail. Battery current converts µA to mA, voltage mV to V, charge counter
  µAh to mAh. Never use the current unit for a charge amount.
- Source detail exposes provenance Reported / Measured / Estimated. Derived RAM
  usage is explained as derived, not passed off as a sensor measurement; A chooses
  canonical provenance treatment. Estimates, if later added, must say “Estimated”.
- Time uses localized absolute timestamp with zone in detail/reports; relative
  age uses monotonic time. Announcements do not update every second. Missing or
  discontinuous monotonic timestamps produce gaps, not negative durations.

## 5. Graphs and monitoring semantics (DS-006)

One metric/unit per plot by default; no dual-axis graph that suggests unrelated
metrics share a scale. A selected multi-axis sensor uses labeled x/y/z traces,
distinct line styles/markers as well as color, and a textual legend.

- Horizontal axis is elapsed monotonic session time, with visible unit. Vertical
  axis is labeled with metric/unit. Battery level has 0–100%; other metrics use
  honest padded bounds and labels. Flat data receives finite padding; headroom
  may exceed 1.0. A threshold marker at 1.0 is labeled Android's severe-throttling
  reference, not a temperature safety limit. Do not truncate without showing bounds.
- Do not connect across unavailable/error/permission/paused intervals, missed
  expected intervals, clock reset, or a unit/source change. Plot only distinct
  valid sampled points; a stale display refresh creates no new point. A gap gets
  a reason when known. Do not interpolate to imply measured data.
- If the collector skips expected samples, derive a visible discontinuity from
  actual sample timestamps and the effective interval (request: >2× interval).
  Metadata/config changes start a new segment. Long/high-rate datasets may use
  bounded min/max-preserving rendering; statistics always use retained valid
  samples, and dropped/evicted history is disclosed.
- Show minimum, maximum, **sample mean**, valid count and actual time span for
  the selected window; no statistics on zero valid samples. Label single-sample
  summaries as one sample. Do not call sample mean a time-weighted mean. Show
  coverage/gaps; never average NaN, sentinel readings or missing slots as zero.
- Buttons choose time window; textual sample list is always an alternative to
  gestures/canvas. Tap/keyboard selection announces time, value/unit, provenance
  and state. Multi-touch zoom is optional, never the sole access to a reading.
- Paused state appears above the plot and in semantics; animation/time axis stops
  extending data. Return from background requires explicit Resume. Confirm before
  abandoning unsaved session history; persistence/retention details wait for A.

## 6. Accessibility acceptance criteria

These are executable acceptance requirements for DS-004/006/008/009, not claims
that TalkBack or Android layouts have already passed. The HTML reference cannot
validate native Compose semantics.

| ID | Scenario / acceptance | Verification owner |
| --- | --- | --- |
| A11Y-01 | Normal text ≥4.5:1 contrast, large text ≥3:1, functional boundaries/focus/graph traces ≥3:1 against adjacent backgrounds in both themes. Color never conveys state alone. | B: token checks now; native themed screenshot review in DS-004/006 |
| A11Y-02 | System font scales 100%, 130%, 200% at 320/360/412 dp phone and 600/840 dp windows; no clipped values/actions, overlapping text or horizontal page scrolling. Resizing/landscape retains access. | B: native layout tests/screenshots in DS-004; manual DS-009 |
| A11Y-03 | TalkBack traversal: page title, session status, section heading, card/row, then actions; merged metric semantics announce label, value/state, unit, freshness and source once. Decorative icons have null description; action icons have meaningful labels. | B: Compose semantics assertions + real TalkBack in DS-004/009 |
| A11Y-04 | All actions reachable by keyboard/D-pad/Switch Access, visible focus, logical order. Open detail returns focus to invoking row after close; navigation announces selected destination and page title. Modal focus is contained. | B: native UI checks + manual assistive input |
| A11Y-05 | Every interactive hit target ≥48 dp; 8 dp spacing where applicable. Disabled actions have readable adjacent reason, not a tooltip-only explanation. No hidden swipe/long-press-only operation. | B: semantics/layout and touch inspection |
| A11Y-06 | Live metrics do not steal focus or issue repeated TalkBack announcements. User actions/loading completion/errors may announce once politely; thermal state changes are text, not alarm claims. Charts have a summary and accessible sample table. | B: DS-006 semantics + TalkBack session |
| A11Y-07 | Permission denial/permanent denial/revocation, unknown capability, partial data, error, stale and paused remain distinguishable and actionable. No numeric placeholder zero. | B: state parameterized UI tests; A: collector tests |
| A11Y-08 | Dark/light/system themes, RTL, longer translated labels, locale decimal separators, system animation scale 0, and high text scale are usable; numeric semantics speak full unit names. | B: previews/UI tests, DS-009 manual matrix |
| A11Y-09 | Graph gaps and trace identities remain understandable in grayscale; each plotted selection is available without sight or precision drag. No data produces “No valid samples”, not a zero baseline. | B: DS-006 charts + accessible list assertions |
| A11Y-10 | Export preview discloses included fields; cancellation and deletion confirmations have focus and clear action names. No identifiers appear in the default report or spoken summaries. | B/A: DS-008 UI + DS-007 redaction tests |

Example TalkBack output (all values **sample data**): “Battery temperature,
34.6 degrees Celsius, measured, paused, last reading 18 seconds ago. Battery
broadcast. Open details.” The canonical freshness state supplies “paused”; the
example does not validate that any physical device reports this reading.

### Implementation validation matrix

For each implemented detail row, test Available (including valid zero), Unsupported,
PermissionRequired, TemporarilyUnavailable and Error. For available rows also test
FRESH/STALE/PAUSED, null timestamp and old timestamp. Cover partial snapshots,
unknown enum/key, long source/reason, first load and empty inventory. Cover
navigation/back/restoration, rotation during session, lifecycle stop/resume,
permission revocation, and rate-limited retry without creating more collectors.

Use deterministic fixtures in test/preview source sets with a persistent sample
banner on visible fixture screens. Production injection must be traceable to A's
real repository; if integration is absent, show an honest unavailable/bootstrap
screen and keep completion blocked. Record JVM tests, Compose instrumentation,
emulator launch, and physical phone checks separately. No phone accuracy or
accessibility result is established by a screenshot or passing unit test alone.

## 7. Contract requests and ownership handoff to A

The proposed version 0.1 is sufficient to design DS-004. It is not yet an agreed
complete implementation interface. B requests the following decisions through
this document and its handoff; **B has not edited the model or canonical contract**.
These are integration requirements, not a request for A to expose hidden APIs.

| Request | Needed by | Action for A / acceptable resolution |
| --- | --- | --- |
| CR-01 Canonical metric registry and heterogeneity | DS-003/004 | Publish stable keys/value types and enum types, plus a safe lookup for heterogeneous `HardwareSnapshot.measurements`; clarify scalar/list representations. B can use a pure UI formatting adapter without duplicate collector models. |
| CR-02 Discovery and empty vs missing | DS-003/004 | Define snapshot discovery completion and empty inventory/error distinction, or emit explicit capability/reading entries for all agreed fields. UNKNOWN must remain distinguishable from absent/unsupported. |
| CR-03 Freshness/time validity | DS-003/004/005 | Confirm nullable sample-time semantics, per-metric aging policy, static vs live freshness, and error precedence; current `Available + Freshness` works without last-valid history. No retained-history API required for DS-004. |
| CR-04 Accurate units and derived provenance | DS-005/006 | Add microamp-hours for charge counter and sensor-specific units/vector channels before those fields are used; define representation of RAM's derived usage. B leaves unsupported fields unavailable until agreement. Do not encode charge as current or sensor values as unitless. |
| CR-05 Session/controller/chart contract | DS-005/006 | Publish start/pause/resume/stop, lifecycle ownership, effective intervals/forecast horizon, discontinuities, bounded sample retention and valid-sample statistics; confirm explicit resume after background/route leave. Minimum headroom interval remains ≥10 s. No speculative UI controller implementation before agreement. |
| CR-06 Report/settings boundary | DS-007/008 | Provide redacted report/session APIs, export result/cancellation/error and retention/delete behavior. Keep unit/theme preferences UI-side until persistence boundary is agreed. |
| CR-07 File ownership transfer and production factory | DS-004 | After foundation integration, name the exact app/navigation files handed to B, module dependencies already available, real repository factory path and checks. A retains all Gradle/model/collector ownership unless a specific edit is reassigned. |

CR-01/02/03/07 need an answer before final DS-004 integration; CR-04/05 gate DS-006,
CR-06 gates DS-008. They do not block publishing this design task. If A chooses a
simpler equivalent, record it in DATA_CONTRACT and handoff, then update this spec
at the next B task. Avoid parallel incompatible model definitions.

### Delivery split

1. DS-002: this spec and standalone reference; state/field/accessibility review.
   No Gradle, Kotlin, collector, app wiring or shared documentation edits.
2. A integrates DS-001 and reviews/integrates DS-002 as the named integration
   owner. B checks both remote task states and integration ancestry before claim.
3. DS-004: B claims, then implements theme/navigation/overview/hardware in the
   exact assigned files using integrated typed models. Missing collectors remain
   explicit; final acceptance checks real production wiring.
4. DS-006: B claims after DS-004 integration and consumes A's DS-005 contracts.
   DS-008 follows DS-006 with DS-007 export contract. Unmet prerequisites remain
   blockers; fixture screens are not a substitute for their completion.
