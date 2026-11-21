# MCP contract: Tribloc Lead Intelligence

This file documents the interface of the hosted MCP endpoint that the plugin connects to, so that others can build a
compatible client or server.

**Snapshot.** Everything below reflects the `initialize` and `tools/list` responses of `https://li.tribloc.co.uk/mcp`
captured on 2026-11-21. The hosted service is operated by Tribloc, is not open source, and may change, limit or stop
at any time; this document does not promise that it stays as described. The machine-readable copy of the same
snapshot is [`tests/fixtures/tools-list.json`](../tests/fixtures/tools-list.json) (the `tools/list` result) and
[`tests/fixtures/initialize.json`](../tests/fixtures/initialize.json) (the `initialize` result).
`tests/mcp-contract.test.mjs` fails if the tables in this file and the fixture disagree.

## Endpoint

| Property | Value |
|---|---|
| URL | `https://li.tribloc.co.uk/mcp` |
| Transport | MCP streamable HTTP: JSON-RPC 2.0 messages sent with `POST` |
| Authentication | none: no account, key, token or header |
| Protocol version | `2025-06-18` |
| Server name | `tribloc-lead-intelligence` (server version `0.2.0`, which is separate from the plugin version) |
| Capabilities | `tools` with `listChanged: false`; `prompts` and `resources` are declared with `listChanged: false` |
| Tools | one, described below |

A client sends `Content-Type: application/json` and `Accept: application/json, text/event-stream`, as the MCP
streamable HTTP transport requires. In the snapshot the server answered `initialize` with a plain
`application/json` body and sent no `Mcp-Session-Id` header. A client should still accept a `text/event-stream`
response and a session id, because the transport allows both.

The server's `instructions` (returned by `initialize`) ask the client to present observations as evidence with their
source URLs, label every opportunity with `is_hypothesis: true` as an inference, treat missing signals as unknown,
repeat the limitations when coverage is `partial` or `insufficient`, and never invent contacts, figures or claims.

## Tool

| Property | Value |
|---|---|
| Name | `analyze_business_sales_opportunities` |
| Title | Analyse a business for sales opportunities |

The tool analyses one public business website and returns up to 5 evidence-backed observations, up to 3 sales
opportunities (each observed or hypothesis), source URLs, an optional outreach angle, confidence, coverage and
limitations. It uses public web sources only and takes up to about 45 seconds. It does not send messages, reveal
private contact data or access any internal sales system.

### Annotations

| Annotation | Value |
|---|---|
| `readOnlyHint` | `true` |
| `destructiveHint` | `false` |
| `idempotentHint` | `true` |
| `openWorldHint` | `true` |

In plain terms: the tool does not modify anything, calling it twice with the same input has no further effect, and it
reads from the open web. Annotations are hints from the server; a client should not treat them as a security
guarantee.

## Input

Schema title `analyze_business_sales_opportunitiesArguments`, a JSON object. An empty Default cell means the field has
no default. Limits use JSON Schema keyword names.

| Field | Type | Required | Default | Limits | Description |
|---|---|---|---|---|---|
| `website` | string | yes | | `minLength: 4`, `maxLength: 2048` | Public company website or domain, for example `example.com` |
| `company_name` | string or null | no | `null` | `maxLength: 300` | Company name, if known |
| `country` | string or null | no | `null` | `minLength: 2`, `maxLength: 2`, `pattern: ^[A-Za-z]{2}$` | ISO 3166-1 alpha-2 country code, for example `GB`, `CH`, `DE` |
| `industry` | string or null | no | `null` | `maxLength: 300` | Industry or niche, if known |

## Output

The schema is `outputSchema` in `tools/list`. Nested objects are listed in their own tables below.

### PublicAnalysisResult

The top-level result object.

| Field | Type | Required | Default | Limits | Description |
|---|---|---|---|---|---|
| `product` | string | no | `Tribloc Lead Intelligence` | | Product name |
| `company` | PublicCompany | yes | | | The company that was analysed |
| `coverage` | string | yes | | `enum: complete, partial, insufficient` | How much of the planned public evidence could be checked |
| `observations` | array of PublicObservation | no | | `maxItems: 5` | Evidence-backed observations |
| `opportunities` | array of PublicOpportunity | no | | `maxItems: 3` | Sales opportunities; zero is a normal result |
| `suggested_outreach_angle` | string or null | no | `null` | | A suggested angle; `null` when no observed opportunity supports one |
| `confidence` | number | yes | | `minimum: 0`, `maximum: 1` | The tool's own evidence score; not an accuracy figure and not a probability of winning a deal |
| `confidence_status` | string | no | `not validated` | `const: not validated` | States that the score is not validated |
| `limitations` | array of string | no | | `maxItems: 4` | Plain-language limitations of this analysis |
| `sources_not_checked` | array of string | no | | `maxItems: 7` | Sources that were not checked for this analysis |
| `preview_note` | string | no | `One company per request, public web sources only, no contact data.` | | Fixed note about the scope of the service |
| `learn_more_url` | string | no | `https://tribloc.co.uk/lead-intelligence?utm_source=tli-mcp&utm_medium=assistant&utm_campaign=one-company-brief&utm_content=result` | | Link to the product page |

### PublicCompany

| Field | Type | Required | Default | Limits | Description |
|---|---|---|---|---|---|
| `name` | string | yes | | | Company name |
| `name_source` | string | no | `input` | `enum: input, domain` | `input` if the caller gave the name; `domain` if it is only a guess from the domain |
| `domain` | string or null | no | `null` | | The domain that was analysed |
| `country` | string or null | no | `null` | | Country code, if known |

### PublicObservation

| Field | Type | Required | Default | Limits | Description |
|---|---|---|---|---|---|
| `statement` | string | yes | | | What was observed |
| `confidence` | number | yes | | `minimum: 0`, `maximum: 1` | Evidence score for this observation |
| `confidence_status` | string | no | `not validated` | `const: not validated` | States that the score is not validated |
| `source_urls` | array of string | no | | `maxItems: 3` | Public URLs the observation is based on |
| `sources` | array of PublicEvidenceSource | no | | | The same sources with fetch time and content hash |

### PublicOpportunity

| Field | Type | Required | Default | Limits | Description |
|---|---|---|---|---|---|
| `title` | string | yes | | | Short title |
| `statement` | string | yes | | | The opportunity in one or two sentences |
| `is_hypothesis` | boolean | yes | | | `true`: an inference to verify; `false`: directly observed |
| `confidence` | number | yes | | `minimum: 0`, `maximum: 1` | Evidence score for this opportunity |
| `confidence_status` | string | no | `not validated` | `const: not validated` | States that the score is not validated |
| `source_urls` | array of string | no | | `maxItems: 3` | Public URLs the opportunity is based on |
| `sources` | array of PublicEvidenceSource | no | | | The same sources with fetch time and content hash |

### PublicEvidenceSource

| Field | Type | Required | Default | Limits | Description |
|---|---|---|---|---|---|
| `source_url` | string | yes | | | The public URL that was read |
| `observed_at` | string | yes | | `format: date-time` | When it was read |
| `content_sha256` | string | yes | | `pattern: ^[0-9a-f]{64}$` | SHA-256 of the content that was read, lowercase hex |

## Limits and behaviour

These points come from the plugin documentation, not from the schema:

- One company per request. A call takes up to about 45 seconds, so a client should allow a request timeout of at
  least 60 seconds.
- The endpoint has hourly fair-use limits: a shared budget, a per-client budget and a per-website budget. When a limit
  is reached the tool returns an error that says so.
- The server keeps results in memory for up to 24 hours, so a repeated request for the same website can be answered
  from that cache.
- The snapshot does not describe error responses. The plugin's skill expects a clear error, not a partial result, for
  an invalid or non-public website (an IP address, `localhost`, a private or reserved name), for a busy service or a
  reached limit, and for an analysis that could not be completed.

## Notes for a compatible client or server

1. Only `company`, `coverage` and `confidence` are required in a result. Treat a missing `observations`,
   `opportunities`, `limitations` or `sources_not_checked` as an empty list, and a missing `suggested_outreach_angle`
   as `null`.
2. A server that declares this `outputSchema` must return a `structuredContent` object that conforms to it (MCP
   `2025-06-18`), and should also return the same result as text content for older clients.
3. `confidence` values are scores between 0 and 1 marked `not validated`. Present them as the tool's own evidence
   score.
4. The plugin calls this server `tribloc-lead-intelligence`, so in Claude Code the full tool name is
   `mcp__plugin_tribloc-lead-intelligence_tribloc-lead-intelligence__analyze_business_sales_opportunities`.
