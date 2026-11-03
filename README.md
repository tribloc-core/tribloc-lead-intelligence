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

Licence: MIT (see `LICENSE`). It covers the files in this repository, not the hosted endpoint at `li.tribloc.co.uk`,
which Tribloc operates and may limit, change or stop.
