# Azure AI continuation guide

The current game brief, parallel work assignments and hardware queue live in [HANDOFF.md](../HANDOFF.md). Follow [AGENTS.md](../AGENTS.md) for repository conventions and [TESTING.md](../TESTING.md) for build commands, browser tests and recorded Redmi results. Each work item names its owner, branch, dependencies and acceptance checks.

## Starting prompt for a cloud agent

```text
Continue Robots vs Aliens in Laska1022/Android. Read the repository AGENTS.md
and apps/robots-vs-aliens/{AGENTS,HANDOFF,TESTING}.md. Fetch remote branches,
check the task board and choose one unclaimed cloud assignment. Open its
suggested branch from the integrated game revision. Work within the listed
files and acceptance criteria. Report the actual unit, browser, emulator
or build checks. Leave physical verification for the device owner. Update
the PR with the checked revision and any findings needed by the next agent.
```

## Azure integration

Azure agents need a checkout, a shell, and scoped repository access to publish authorized work. The repository-root [Azure pipeline](../../../azure-pipelines.yml) builds and tests the web app from this game's directory. Configure pipeline capacity and service connections in the Azure organization. For Azure Static Web Apps, the app location is `/apps/robots-vs-aliens` and output is `dist/`. Put deployment credentials in the service's secret store.

For GitHub Actions, the [game workflow](../../../.github/workflows/ci.yml) builds the web game and the debug APK. The [Pages workflow](../../../.github/workflows/pages.yml) is a separate manual publishing action. See the [October cloud record](VALIDATION.md) for prior checks.
