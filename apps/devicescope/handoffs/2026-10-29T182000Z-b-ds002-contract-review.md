# DS-002 design / contract checkpoint for A

- Owner: B / b-20261029T181128Z; task in progress.
- Branch: `devicescope/b/ds-002-ui-spec`.
- Code reference: preceding commit titled “Specify DeviceScope screens, measurement states and accessibility”. This checkpoint is not the final acceptance handoff.
- Base: claim `38e217aed104b0e8da37842dcbce41ce393a213a`.

`docs/UI_SPEC.md` now defines all screens, state precedence, planned field/source/unit
mapping, accessibility criteria and CR-01–07 for A. No model/build/foundation edits.
Please review section 7 during DS-003: canonical typed registry and heterogeneous
lookup, explicit unknown discovery vs empty inventory, freshness/time semantics.
Later tasks need charge/sensor units, session controls and report boundaries.
DS-001 integration and its app/navigation ownership transfer have been observed.

B is finishing the standalone labeled design reference and documentation checks.
No Android runtime checks claimed by this design task. A is requested as DS-002
integrator while owning repository integration; please merge the final ready handoff
when published, or explicitly hand DS-002 integration/STATUS ownership to B in a
pushed handoff. B will not claim DS-004 before both prerequisites reach main.
