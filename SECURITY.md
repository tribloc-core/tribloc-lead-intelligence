# Security policy

## Reporting a vulnerability

Report a vulnerability privately through GitHub private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**, or go directly to
   <https://github.com/tribloc-core/tribloc-lead-intelligence/security/advisories/new>.
3. Describe the problem, the affected file or endpoint, and how to reproduce it.

Do not open a public issue, pull request or discussion with the details. If the private reporting form is not
available to you, open a public issue that only asks for a private channel, without any details of the problem.

Do not include personal data, credentials or tokens in a report unless they are needed to show the problem, and then
only test values.

## What this policy covers

There are two separate parts, and a report should say which one it concerns.

| Part | What it is | Who changes it |
|---|---|---|
| **Plugin files** in this repository | `.claude-plugin/marketplace.json`, `tribloc-lead-intelligence/.claude-plugin/plugin.json`, `.mcp.json`, the skill, the commands and the documentation | fixed here, through a new plugin version |
| **Hosted service** at `https://li.tribloc.co.uk/mcp` | the MCP endpoint the plugin connects to; operated by Tribloc, not open source, not in this repository | fixed by Tribloc on the server; no plugin release needed |

Examples for the plugin files: the configuration points somewhere it should not, a skill or command instruction makes
Claude do something it should not (for example send data elsewhere or act for the user), or a file in the plugin
could run code on the user's machine. The plugin is meant to contain no hooks, scripts or executables.

Examples for the hosted service: it returns private or personal data, it can be made to fetch something other than
public web sources, its fair-use limits can be bypassed, or it leaks data between requests. Report these through the
same private channel. Please do not run load tests or automated scans against the hosted endpoint; it is a shared
service with hourly limits.

## Supported versions

Only the latest released plugin version receives fixes. Claude Code users get a fix by updating the plugin once
`version` changes. A fix on the hosted service applies to every plugin version at once.
