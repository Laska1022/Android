# Codex Cloud assignments for Robots vs Aliens

## Second AI · Animation and skins

```text
Continue your existing animation and skin work in Laska1022/Android. Fetch origin.
Read apps/robots-vs-aliens/ART_HANDOFF.md from main if present, or from
codex/rva-landscape-loadouts. Keep your existing art commits. Follow the handover
to integrate your work with the 1.4 skin registry and saved Settings choices.
Implement and test new artwork and animations, document sources and evidence,
then push your branch and open a PR. Leave physical Redmi testing to the local developer.
```

## Other independent assignments

Start one agent per assignment in the GitHub repository `Laska1022/Android`. Both sessions start from the integrated 1.3.0 game or later and work on separate branches and files. Each block is a complete starting prompt. See the [handoff](HANDOFF.md), [agent guide](AGENTS.md) and [testing guide](TESTING.md).

## Codex A · RVA-01 · Later-sector balance

```text
Work independently in Laska1022/Android on RVA-01, later-sector campaign balance
tests for Robots vs Aliens. Fetch origin in the existing cloud checkout.
Read root AGENTS.md, then apps/robots-vs-aliens/{AGENTS,HANDOFF,TESTING}.md.
Work only in apps/robots-vs-aliens/.

Start from the latest origin/main with version 1.3.0 or later. Target main
in your PR and record the base SHA. Check for existing work, then use branch
codex/rva-campaign-balance. Own tests/unit/campaign-strategy.test.ts and any
evidence-based Cadet tuning in src/game/engine.ts. Codex B owns mobile input.

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
seeds, strategy and measured outcomes. If multiple seeds and plausible squad
choices expose a difficulty spike, make a focused Cadet adjustment and rerun
the same scenarios. Preserve Veteran and Survival pressure. Report only
checks that ran. Physical Redmi
validation belongs to RVA-04.
```

## Codex B · RVA-02 · Touch accuracy at the battlefield edges

```text
Work independently in Laska1022/Android on RVA-02, mobile touch regression
coverage for Robots vs Aliens. Fetch origin in the existing cloud
checkout. Read root AGENTS.md, then apps/robots-vs-aliens/{AGENTS,HANDOFF,TESTING}.md.
Work only in apps/robots-vs-aliens/.

Start from the latest origin/main with version 1.3.0 or later. Target main
in your PR and record the base SHA. Check for existing work, then use branch
codex/rva-mobile-layout. Own tests/e2e/viewport.spec.ts and any touch or layout
fixes in src/main.ts and src/style.css. Codex A owns campaign balance.
If you reproduce a missed tap or obscured control, fix it, keep the regression
test, and include the failing and corrected behavior in your PR.

Read tests/e2e/presentation.spec.ts and tests/e2e/game.spec.ts first. The existing suite
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
