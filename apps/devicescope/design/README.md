# Original design reference

Open `index.html` directly in a browser. It is a dependency-free, offline visual
reference for [UI_SPEC.md](../docs/UI_SPEC.md), not an Android app or collector.
All examples are persistently labeled **SAMPLE DATA · DESIGN PREVIEW**. No network
requests, saved measurements, analytics, external fonts, or dependencies are used.

Use the four navigation destinations, Battery/Thermals links, example-state
selector, and light-theme toggle. Monitor illustrates a discontinuous chart and
equivalent sample table; Reports illustrates the empty state. This is a subset
of the specified field inventory, not a promise that all collection exists.
The permission example exercises a generic row; normal battery temperature does
not require a runtime permission.

The native specification controls Compose implementation. In particular, its
compact bottom navigation, window inset handling, text scaling, TalkBack behavior
and full session controls cannot be validated by this browser reference. The
reference places navigation above the content so it remains usable at browser
zoom and narrow widths without a fixed web overlay.

Keep preview assets out of native production sources. Exact checks and unrun
native scenarios belong in the DS-002 task/handoff; do not infer physical-device
validation from these sample values.
