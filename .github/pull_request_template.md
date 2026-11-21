## What this changes

## Why

## Checklist

- [ ] `node --test tests/*.test.mjs` passes locally.
- [ ] The plugin folder still holds configuration and instructions only: no hooks, agents, scripts or executables.
- [ ] `.mcp.json` still has one HTTPS server and no headers or credentials (or the change explains why it differs).
- [ ] `CHANGELOG.md` has an entry under `Unreleased`.
- [ ] If this ships a new plugin version: `version` is updated in `plugin.json`, the marketplace entry, both READMEs
      and `CHANGELOG.md`.
- [ ] No personal data, secrets or tokens in the diff.
- [ ] No claims of results, users or adoption that the repository cannot show.
