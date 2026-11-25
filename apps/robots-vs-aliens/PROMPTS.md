# Codex Cloud assignments for Robots vs Aliens

Start one agent per assignment in the GitHub repository `Laska1022/Android`. Both sessions use the integrated 1.2.0 game and work on separate branches and files. Each block is a complete starting prompt. See the [handoff](HANDOFF.md), [agent guide](AGENTS.md) and [testing guide](TESTING.md).

## Codex A · RVA-01 · Later-sector balance

```text
Work independently in Laska1022/Android on RVA-01, later-sector campaign balance
tests for Robots vs Aliens 1.2.0. Fetch origin in the existing cloud checkout.
Read root AGENTS.md, then apps/robots-vs-aliens/{AGENTS,HANDOFF,TESTING}.md.
Work only in apps/robots-vs-aliens/.

Use origin/main if it contains 1.2.0. Before the visual release merges,
use origin/codex/outpost-redmi-polish as the base and PR target. Record the
base SHA in your PR. Check for existing work, then use the branch
codex/rva-campaign-balance. Own one new file, tests/unit/campaign-strategy.test.ts.
Codex B owns the browser input tests.

Read src/game/engine.ts and tests/unit/engine.test.ts. The existing suite
already wins First Contact on three seeds at the normal budget. Extend coverage
to sectors 2–5 under Cadet and Veteran with at least three fixed seeds per
sector. Drive a documented strategy using the actual starting budget, normal
placement and pickup actions, a fixed timestep and a bounded simulation time.
Capture completion, simulated duration, breaches, remaining energy and defender
mix. Report outcomes and reproducible difficulty spikes. A losing strategy is
a valid observation. Keep those observations separate from engine invariants.

Run npm ci, your focused Vitest test and npm run check. Use Chromium as
described in TESTING.md. Publish a normal commit and PR with test counts,
seeds, strategy and measured outcomes. Put tuning proposals in the PR for
a separate reviewed change. Report only checks that ran. Physical Redmi
validation belongs to RVA-04.
```

## Codex B · RVA-02 · Touch accuracy at the battlefield edges

```text
Work independently in Laska1022/Android on RVA-02, mobile touch regression
coverage for Robots vs Aliens 1.2.0. Fetch origin in the existing cloud
checkout. Read root AGENTS.md, then apps/robots-vs-aliens/{AGENTS,HANDOFF,TESTING}.md.
Work only in apps/robots-vs-aliens/.

Use origin/main if it contains 1.2.0. Before the visual release merges,
use origin/codex/outpost-redmi-polish as the base and PR target. Record the
base SHA in your PR. Check for existing work, then use the branch
codex/rva-mobile-layout. Own one new file, tests/e2e/viewport.spec.ts.
Codex A owns the campaign balance tests. Record any product defect with
reproduction evidence in your PR so the integrator can assign the fix.

Read tests/e2e/presentation.spec.ts and game.spec.ts first. Version 1.2.0
already tests offline art, center placement, rotation, accessible controls,
pause and Survival. Add touch tests for all four corner cells, in a short
landscape layout and a tall portrait layout. Use normal Cadet preparation,
and tap measured screen coordinates inside each intended edge tile using
Playwright's touchscreen. Assert the resulting lane/column and its neighbor's
occupancy, then recycle and verify the tile and energy update. Exercise a tap
after page scrolling or viewport resizing so coordinate mapping uses a real
offset. Check that the board and controls remain reachable. Save a screenshot
or trace to diagnose any overlap. Use the mobile project and its local preview.

Run npm ci, npm run build, your new mobile spec and npm run check. Use Chromium
as described in TESTING.md. Publish a normal commit and PR with exact viewport
sizes, input method, test counts, outcomes and any actionable defect. Label
your results as browser emulation. Physical Redmi checks belong to RVA-04.
```
