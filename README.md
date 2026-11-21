# Tribloc plugins for Claude Code

This repository is a Claude Code plugin marketplace named `tribloc`. It holds one plugin:

- [`tribloc-lead-intelligence`](tribloc-lead-intelligence/README.md): research one company from its public website
  before sales outreach. It connects Claude Code to the free public Tribloc Lead Intelligence MCP endpoint and returns
  evidence-backed observations with source URLs, opportunities marked observed or hypothesis, and the coverage and
  limitations of each analysis. No account, login or API key.

Install:

```bash
claude plugin marketplace add tribloc-core/tribloc-lead-intelligence
claude plugin install tribloc-lead-intelligence@tribloc
```

The plugin contains configuration and instructions only: no hooks, scripts or executables. What it sends, fetches and
stores, what it does not do, and how to uninstall it are in the [plugin README](tribloc-lead-intelligence/README.md).

Current plugin version: `0.2.2`. Changes are listed in [`CHANGELOG.md`](CHANGELOG.md).

## Development and tests

The tests use Node.js 20 or newer and have no npm dependencies:

```bash
node --test tests/*.test.mjs
```

They check the manifests and that version, licence and repository agree across files, the `.mcp.json` server
entry, the plugin's shape (configuration and instructions only), the documented MCP contract against a committed
snapshot, and a mocked MCP handshake against a local server. No test contacts the hosted endpoint. CI runs the same
tests on every push and pull request. How to report issues and propose changes: [`CONTRIBUTING.md`](CONTRIBUTING.md).
Security reports: [`SECURITY.md`](SECURITY.md).

## Licence and boundary

Licence: MIT (see `LICENSE`). The MIT licence covers the files in this repository. The hosted endpoint
`https://li.tribloc.co.uk/mcp` that the plugin connects to is operated by Tribloc. It is not open source, its code is
not in this repository, and it may be limited, changed or stopped at any time. Its interface, as listed on
2026-11-21, is documented in [`tribloc-lead-intelligence/MCP-CONTRACT.md`](tribloc-lead-intelligence/MCP-CONTRACT.md).
