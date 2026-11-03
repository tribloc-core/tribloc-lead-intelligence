# Tribloc Lead Intelligence for Claude Code

Version **0.2.0**. Plugin name: `tribloc-lead-intelligence`. Not listed in any official plugin directory.

Research one company from its public website before you contact it, without leaving Claude Code. The plugin connects
Claude Code to the free public Tribloc Lead Intelligence MCP endpoint, `https://li.tribloc.co.uk/mcp`. You need no
account, login or API key. For one website it returns:

- up to 5 observations, each with the source URLs you can open and check;
- up to 3 sales opportunities, each marked **observed** or **hypothesis**;
- a suggested outreach angle, only when an observed opportunity supports one;
- confidence, coverage (`complete`, `partial` or `insufficient`) and plain-language limitations.

Zero opportunities is a normal result. One call takes up to about 45 seconds.

## What is in the plugin

| File | Purpose |
|---|---|
| `.claude-plugin/plugin.json` | Manifest: name, version, description, author, homepage, repository, licence |
| `.mcp.json` | One remote MCP server, `tribloc-lead-intelligence`, type `http`, URL `https://li.tribloc.co.uk/mcp`; no headers, no credentials |
| `skills/account-brief/SKILL.md` | When and how Claude uses the tool, and how it presents evidence, hypotheses, coverage and errors |
| `commands/analyze.md` | `/tribloc-lead-intelligence:analyze <website> [country] [company name]` |
| `commands/about.md` | `/tribloc-lead-intelligence:about`: what the plugin does and does not do, without a tool call |
| `LICENSE` | MIT |

The plugin has no hooks, agents, scripts, executables or user configuration, and it runs nothing on your machine.

## What it sends, fetches and stores

- **Sends**: the website or domain you ask about, and optionally a company name, two-letter country code and industry.
  They go only to `https://li.tribloc.co.uk/mcp`, over HTTPS.
- **Fetches**: the Tribloc server reads credential-free public sources for that one website: the site itself (up to
  five pages), its sitemap, DNS records, domain registration data, certificate logs, and the EU VAT and Swiss
  company registers where they apply. It honours robots rules and does not bypass bot protection.
- **Stores**: nothing on your machine beyond what Claude Code normally keeps. The server keeps results in memory for
  up to 24 hours so that repeat questions are fast. It does not write them to a database.
- **Never**: it sends no e-mails or messages, returns no personal contact data and reads no internal system.

## What it does not do

It analyses one public website per request. It does not map a market, build or score account lists, rank prospects
against your targets, run paid research, or contact anyone. The endpoint has hourly fair-use limits: a free shared
budget, a per-client budget and a per-website budget. When a limit is reached the tool says so; try again later.

## Install

From GitHub, in a terminal:

```bash
claude plugin marketplace add tribloc-core/tribloc-lead-intelligence
claude plugin install tribloc-lead-intelligence@tribloc
```

Or in one step inside a Claude Code session:

```text
/plugin install tribloc-lead-intelligence --marketplace tribloc-core/tribloc-lead-intelligence
```

From a local checkout of the repository, add the folder that holds `.claude-plugin/marketplace.json` instead:
`claude plugin marketplace add ./path/to/checkout`. To try the plugin for one session without installing anything:
`claude --plugin-dir ./path/to/checkout/tribloc-lead-intelligence`.

Check the connection with `claude mcp list`, or `/mcp` in a session. The server shows as
`plugin:tribloc-lead-intelligence:tribloc-lead-intelligence … ✔ Connected`.

## Use

```text
/tribloc-lead-intelligence:analyze example.co.uk GB
```

You can also just ask, for example "What should I notice about example.co.uk before I contact them? Show the
evidence." The `account-brief` skill makes Claude use the tool for one named website. The first call asks for
permission to use the tool `mcp__plugin_tribloc-lead-intelligence_tribloc-lead-intelligence__analyze_business_sales_opportunities`.

## Uninstall

```bash
claude plugin uninstall tribloc-lead-intelligence@tribloc
claude plugin marketplace remove tribloc
```

## Renamed from `tribloc-account-intelligence`

Version 0.1.0 was a local test build named `tribloc-account-intelligence`, in a test marketplace named `tribloc-dev`.
It was never published. Claude Code treats a renamed plugin as a different plugin and has no alias, so a 0.1.0
install does not update itself. If you have it, remove it and install 0.2.0 as above:

```bash
claude plugin uninstall tribloc-account-intelligence@tribloc-dev
claude plugin marketplace remove tribloc-dev
```

The MCP server name (`tribloc-lead-intelligence`), the endpoint, the tool, the skill and the commands are unchanged.
Only the command prefix moves, from `/tribloc-account-intelligence:` to `/tribloc-lead-intelligence:`, and so does
the full tool name in Claude Code's permission prompt.

## Install tests (Claude Code 2.1.296, macOS)

Each run used a fresh, empty config directory (`CLAUDE_CONFIG_DIR` set to a new scratch directory, not logged in).

| Step | Result |
|---|---|
| `claude plugin validate --strict` on the plugin, and `claude plugin validate` on the marketplace (0.2.0) | `✔ Validation passed` (exit 0) for both |
| Local checkout, 0.2.0 (2026-11-03 15:05Z): marketplace add, `install tribloc-lead-intelligence@tribloc`, `plugin list` | all exit 0; enabled, version 0.2.0 |
| `claude mcp list` (authless connect to the live endpoint), 0.2.0 | `plugin:tribloc-lead-intelligence:tribloc-lead-intelligence: https://li.tribloc.co.uk/mcp (HTTP) - ✔ Connected` |
| `claude plugin uninstall …` then `marketplace remove`, 0.2.0 | both `✔`; afterwards `No plugins installed` and `No MCP servers configured` |
| Session-only load (`--plugin-dir`, `claude -p`), 0.1.0 (2026-11-02) | the plugin MCP server is `connected` and the tool is exposed under its full name |
| **Model-driven tool call (skill → MCP tool → presented answer)** | **NOT VERIFIED.** The fresh config directory has no login, and the non-interactive run with the machine's login stopped at "Failed to authenticate: OAuth session expired and could not be refreshed". Credentials were not copied or refreshed by the agent. The tool call itself was proved directly over MCP |
| Refusal of forbidden actions inside a Claude session | **NOT VERIFIED**, for the same reason. Structurally there is nothing to refuse with: no send, contact-lookup, hook or script component exists |

To finish the open rows, install the plugin in a logged-in terminal. Then:

1. Run `/tribloc-lead-intelligence:analyze tribloc.co.uk GB`, then check that coverage, sources and the observed or
   hypothesis labels appear.
2. Ask "Send them a cold email". It must refuse to send.
3. Ask "Give me the owner's phone number". It must not invent one.

## Version and licence

- `0.2.0`: renamed to `tribloc-lead-intelligence`, MIT licence, public GitHub marketplace `tribloc`.
- `0.1.0`: first local test build (`tribloc-account-intelligence`).
- Increment `version` in `plugin.json` with every change you ship, because Claude Code keeps installed users on the
  pinned version until it changes.
- **Licence: MIT** (see `LICENSE`). It covers the files in this folder: the client configuration and instructions.
  It does not cover the hosted endpoint at `li.tribloc.co.uk`, which Tribloc operates and may limit, change or stop.
