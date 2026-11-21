# Contributing

This repository is a Claude Code plugin marketplace (`tribloc`) with one plugin, `tribloc-lead-intelligence`. The
plugin is configuration and instructions for Claude Code. The analysis itself runs on a hosted endpoint that is not
part of this repository (see [What is not in this repository](#what-is-not-in-this-repository)).

## Reporting an issue

- Use the issue templates: **Bug report** for something that does not work as documented, **Feature request** for a
  change you would like.
- Say which plugin version (`claude plugin list`), Claude Code version (`claude --version`) and operating system you
  used, and what you typed.
- Do not paste personal data, private contact details, API keys or tokens into an issue. A public company domain is
  fine.
- A security problem does not belong in a public issue. Follow [`SECURITY.md`](SECURITY.md).

## Running the tests

You need Node.js 20 or newer. There are no npm dependencies, so there is nothing to install.

```bash
node --test tests/*.test.mjs
```

`npm test` runs the same command. Pass the test files, not the folder: from Node.js 22 on, `node --test tests/` treats
the folder as a module path and fails. The tests read the files in this repository only. No test, and no CI job,
contacts the hosted endpoint: the MCP tests use a committed fixture (`tests/fixtures/tools-list.json`) and a local
server started inside the test.

What the tests check:

| File | Checks |
|---|---|
| `tests/manifest.test.mjs` | `marketplace.json` and `plugin.json` parse and have their required fields; name, version, licence and repository agree across both manifests, both READMEs and `CHANGELOG.md`; the marketplace source path exists |
| `tests/mcp-json.test.mjs` | `.mcp.json` has exactly one server, type `http`, an `https` URL, and no headers or credential fields |
| `tests/plugin-shape.test.mjs` | the plugin folder holds only the expected entries; no hooks, agents, scripts or executable files; command and skill frontmatter is well formed |
| `tests/mcp-contract.test.mjs` | `MCP-CONTRACT.md` matches the fixture: tool name, inputs, required fields, output fields, enums and annotations; the JSON in `examples/` validates against the fixture schemas and uses only `.example` domains |
| `tests/mcp-smoke.test.mjs` | a minimal streamable-HTTP client completes `initialize` and `tools/list` against a local mock server |

If you have Claude Code installed, `claude plugin validate --strict ./tribloc-lead-intelligence` and
`claude plugin validate .` are also worth running before a pull request. CI does not run them.

## Scope rules for plugin changes

1. **Configuration and instructions only.** The plugin folder holds `.claude-plugin/plugin.json`, `.mcp.json`, Markdown
   commands and skills, `README.md`, `MCP-CONTRACT.md` and `LICENSE`. No hooks, agents, scripts, binaries or
   executable files. `tests/plugin-shape.test.mjs` enforces this.
2. **One remote server, no credentials.** `.mcp.json` points at one HTTPS endpoint and carries no headers, tokens or
   keys.
3. **No new capabilities that act for the user.** The plugin does not send messages, look up personal contact data or
   process lists of companies. A change that adds any of these will not be accepted.
4. **Version every shipped change.** Claude Code keeps installed users on the version they have until `version`
   changes. A release updates `version` in `plugin.json` and in the marketplace entry, the version line in both
   READMEs and a new section in `CHANGELOG.md`. The manifest test fails if these disagree.
5. **Plain, verifiable wording.** Document what the plugin does and does not do. Do not claim results, users or
   adoption that the repository cannot show.

## Pull requests

- Keep a pull request to one change, and fill in the pull request template.
- Add an entry under `Unreleased` in `CHANGELOG.md`.
- Run `node --test tests/*.test.mjs` before you push. CI runs the same tests on every push and pull request.

## What is not in this repository

The hosted endpoint at `https://li.tribloc.co.uk/mcp` is operated by Tribloc. Its source code is not open and is not
in this repository. Pull requests here cannot change how it analyses a website. Its current interface is documented
in [`tribloc-lead-intelligence/MCP-CONTRACT.md`](tribloc-lead-intelligence/MCP-CONTRACT.md), so you can build a
compatible client or server. You can still report a wrong or unexpected result as a bug: say which public website you
asked about and what the result said.

By contributing you agree that your contribution is licensed under the MIT licence of this repository.
