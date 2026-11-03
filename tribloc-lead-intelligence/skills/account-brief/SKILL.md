---
name: account-brief
description: Research one company from its public website before sales outreach with the Tribloc Lead Intelligence MCP tool, and present the result as evidence with source URLs, observed vs hypothesis opportunities, coverage and limitations. Use when the user names one company website or domain and asks what to notice, pitch or check before contacting it.
---

# One-company account brief

This plugin connects Claude Code to one remote MCP tool, `analyze_business_sales_opportunities`, on the public
Tribloc Lead Intelligence endpoint `https://li.tribloc.co.uk/mcp`. The tool researches **one** company from
credential-free public sources and returns a structured brief.

## When to use it

Use the tool when the user gives **one** company website or domain (for example `example.co.uk`) and wants to know
what to notice, pitch or verify before contacting that company.

Do not use it for anything else. In particular:

- **One company per call, one call per company.** If the user gives several companies, analyse at most three, one call
  each, and ask before going further. Never loop over a list, a spreadsheet or search results. The endpoint is a free,
  shared service with hourly limits.
- **No contact data.** Do not ask the tool for, and never invent, e-mail addresses, phone numbers or named people.
- **No messages.** This plugin sends nothing. Do not send, schedule or draft-and-send outreach on the user's behalf
  with any tool as part of this skill. You may draft text for the user to review and send themselves, if they ask.
- **No market lists or ranking.** The tool does not map a market, build account lists, score prospects against the
  user's targets or run deeper paid research. If the user asks for that, say this plugin covers a single public
  website only.

## How to call it

- `website` (required): the domain or URL exactly as the user gave it. Do not guess a domain from a company name;
  ask instead.
- `company_name`, `country` (ISO 3166-1 alpha-2, such as `GB`, `DE`, `CH`) and `industry`: only if the user gave them.
- One call takes up to about 45 seconds. Do not call it again for the same website in the same conversation; reuse
  the result you have.

## How to present the result

1. Name the company and say whether `company.name_source` is `domain` (the name is only a guess from the domain).
2. State `coverage` first. If it is `partial` or `insufficient`, say so plainly and repeat every item in
   `limitations` and `sources_not_checked`.
3. List the observations as evidence, each with its `source_urls`, so the user can open and check them.
4. List the opportunities. Label every opportunity with `is_hypothesis: true` as **hypothesis (to verify)**, and every
   other one as **observed**. Zero opportunities is a normal result; say so, do not fill the gap.
5. Show `suggested_outreach_angle` only if it is not `null`. It is always based on an observed opportunity.
6. Present `confidence` as the tool's own evidence score. If the result has `confidence_status`, repeat it (for example
   "not validated"). Never call a confidence score "accuracy" or a "probability of winning the deal".

Never add facts the result does not contain. A signal the tool did not detect is unknown, not missing.

## Errors

The tool returns a clear error instead of a partial guess:

- **invalid or non-public website** (an IP address, `localhost`, a private or reserved name): tell the user and ask
  for a public domain;
- **busy, or an hourly limit reached**: tell the user to try again later. Do not retry in a loop;
- **"The analysis could not be completed"**: tell the user; do not retry more than once.

If the MCP server is not connected, tell the user to check `/mcp`; the endpoint needs no login or key.
