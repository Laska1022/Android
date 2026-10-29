# Durable handoff records

Every session adds a new Markdown file here before stopping, for example `2026-10-29T173000Z-a-ds-001.md`. Use a unique UTC timestamp, slot, and task ID. Do not overwrite another session's record. Copy `TEMPLATE.md`, fill it with observed facts, and push it with the task update.

The code commit is the commit preceding the handoff update. The branch tip additionally includes the handoff itself. This avoids an impossible self-referential commit hash.

Read the newest record for the task on its actual remote branch. Sort filenames by UTC timestamp only within the task's history; dates do not grant ownership or prove integration.

The initial [repository setup handoff](2026-10-29-repository-setup.md) records the app isolation and planning work. No implementation-session handoffs exist yet; this plan does not count as a finished native app or claimed implementation task.
