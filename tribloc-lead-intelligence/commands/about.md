---
description: Explain what this plugin does and does not do (no tool call)
---

Explain this plugin to the user in a few short lines, without calling any tool:

- It connects Claude Code to one remote MCP tool on `https://li.tribloc.co.uk/mcp`, free to use and without an
  account, login or key.
- For one company website at a time, it returns up to 5 observations and up to 3 opportunities, each with source URLs,
  each opportunity marked observed or hypothesis, plus coverage, confidence and limitations. A call takes up to about
  45 seconds.
- It reads only credential-free public sources: the website and a few open records (sitemap, DNS, domain registration,
  certificate logs, and the EU VAT and Swiss company registers where they apply).
- It does not send messages, return personal contact data, process lists of companies, rank prospects or access any
  internal system. The endpoint has hourly fair-use limits.
- What the user types (the website, and optionally a company name, country and industry) goes to the Tribloc
  endpoint. Results are cached in memory there for up to 24 hours.
- Usage: `/tribloc-lead-intelligence:analyze example.co.uk GB`.
