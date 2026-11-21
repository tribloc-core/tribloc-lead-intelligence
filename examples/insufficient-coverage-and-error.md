# Example 2: insufficient coverage, and an error

> **Illustrative only.** This is not real output. The company, domain, URLs, hashes, statements and scores are
> invented to show the shape of a result. They follow the output schema in
> [`tribloc-lead-intelligence/MCP-CONTRACT.md`](../tribloc-lead-intelligence/MCP-CONTRACT.md). The `.example` top-level
> domain is reserved and never resolves. `tests/mcp-contract.test.mjs` checks the JSON below against the schema.

## Part 1: insufficient coverage

### Request

```text
/tribloc-lead-intelligence:analyze quiet-harbour.example
```

No country and no company name were given, so the tool guesses the name from the domain.

```json
{
  "website": "quiet-harbour.example"
}
```

### Result (structured content)

```json
{
  "product": "Tribloc Lead Intelligence",
  "company": {
    "name": "Quiet Harbour",
    "name_source": "domain",
    "domain": "quiet-harbour.example",
    "country": null
  },
  "coverage": "insufficient",
  "observations": [
    {
      "statement": "The home page shows a single holding message and no other pages are linked.",
      "confidence": 0.5,
      "confidence_status": "not validated",
      "source_urls": ["https://quiet-harbour.example/"],
      "sources": [
        {
          "source_url": "https://quiet-harbour.example/",
          "observed_at": "2026-11-21T11:02:00Z",
          "content_sha256": "0588b81c2ee40d10e4bc9121a5c996717d5f3e62d184ec00b985c0d7ca4350e1"
        }
      ]
    }
  ],
  "opportunities": [],
  "suggested_outreach_angle": null,
  "confidence": 0.2,
  "confidence_status": "not validated",
  "limitations": [
    "The website has too little public content to support any opportunity.",
    "The company name was derived from the domain and may be wrong."
  ],
  "sources_not_checked": ["Company register: no country was given."]
}
```

### How the plugin's skill presents it

1. **Company:** Quiet Harbour. The name is only a guess from the domain (`name_source: domain`).
2. **Coverage:** insufficient. Every limitation is repeated: the site has too little public content to support any
   opportunity; the name was derived from the domain and may be wrong. Not checked: company register, because no
   country was given.
3. **Observations (evidence):** the home page shows a holding message and links no other pages. Source:
   `https://quiet-harbour.example/`
4. **Opportunities:** none. This is a normal result; nothing is filled in.
5. **Suggested angle:** none, because no observed opportunity supports one.
6. **Confidence:** 0.2, the tool's own evidence score, not validated.

A signal the tool did not detect is unknown, not missing. The user can try again with a country code, or check the
company another way.

## Part 2: an error

### Request

```text
/tribloc-lead-intelligence:analyze localhost
```

```json
{
  "website": "localhost"
}
```

### What happens

`localhost` is not a public website, so the server returns an error instead of a result. Error responses are not
described in the 2026-11-21 snapshot, so no exact message or format is shown here. Per the plugin's skill, Claude
then:

1. tells the user that the input is not a public website;
2. asks for one public domain, such as `northwind-bakery.example`;
3. does not retry the same input and does not guess a domain.

The same pattern applies to the other error cases the skill names: for a busy service or a reached hourly limit,
Claude says to try again later and does not retry in a loop; for "The analysis could not be completed", it tells the
user and retries at most once.
