# Changelog

All notable changes to the `tribloc-lead-intelligence` plugin and this marketplace are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the plugin uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). The version that counts is `version` in
`tribloc-lead-intelligence/.claude-plugin/plugin.json`.

## [Unreleased]

## [0.2.2] - 2026-11-21

Repository hardening. The plugin's behaviour is unchanged: `.mcp.json`, the skill and the commands are untouched.

### Added

- `CONTRIBUTING.md`: how to report issues, run the tests, and the scope rules for plugin changes.
- `SECURITY.md`: private vulnerability reporting, and the boundary between the plugin files and the hosted service.
- Issue templates (bug report, feature request) and a pull request template under `.github/`.
- `tribloc-lead-intelligence/MCP-CONTRACT.md`: the interface of the tool `analyze_business_sales_opportunities`, as
  listed by the hosted endpoint on 2026-11-21.
- `tests/`: zero-dependency tests for Node's built-in test runner (`node --test tests/*.test.mjs`): manifests
  and version agreement, `.mcp.json`, plugin shape, the documented MCP contract against a committed `tools/list`
  fixture, and a mocked MCP smoke test against a local server. No test contacts the hosted endpoint.
- `package.json` (private, no dependencies) with a `test` script.
- `.github/workflows/ci.yml`: runs the tests and a JSON validity check on push and pull request, with actions pinned
  to full commit SHAs and read-only permissions.
- `examples/`: two illustrative results built from the output schema, with fictional domains.
- "Development and tests" sections in both READMEs, and a more precise licence boundary paragraph.

### Changed

- `.claude-plugin/marketplace.json`: the plugin entry now also states `version`, `license` and `repository`, equal to
  `plugin.json`. The tests fail if they drift apart.

## [0.2.1] - 2026-11-03

### Changed

- The `account-brief` skill no longer offers to work through a longer list of companies one by one. It says the tool
  researches one company at a time and asks which one, two or three to start with.
- Plugin README: the model-driven tool call and the refusal of forbidden actions are recorded as proved on 0.2.0, with
  the steps to repeat them.

## [0.2.0] - 2026-11-03

### Added

- First public release: the Claude Code marketplace `tribloc` with one plugin, `tribloc-lead-intelligence`.
- `.mcp.json`: one remote MCP server, type `http`, `https://li.tribloc.co.uk/mcp`, with no headers or credentials.
- The `account-brief` skill and the commands `/tribloc-lead-intelligence:analyze` and
  `/tribloc-lead-intelligence:about`.
- MIT licence, at the repository root and in the plugin folder.
- Install, uninstall and verification notes in the plugin README.

### Changed

- Renamed from the unpublished local test build `tribloc-account-intelligence` 0.1.0 (test marketplace
  `tribloc-dev`). Claude Code treats a renamed plugin as a different plugin, so a 0.1.0 install has to be removed by
  hand.

[Unreleased]: https://github.com/tribloc-core/tribloc-lead-intelligence/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/tribloc-core/tribloc-lead-intelligence/compare/0267003...v0.2.2
[0.2.1]: https://github.com/tribloc-core/tribloc-lead-intelligence/commit/026700348207804558b8f621b53aa28ee3be2943
[0.2.0]: https://github.com/tribloc-core/tribloc-lead-intelligence/commit/b14701128cb65de627890f773aaa67b2083e10c8
