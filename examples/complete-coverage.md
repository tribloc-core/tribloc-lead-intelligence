# Example 1: complete coverage

> **Illustrative only.** This is not real output. The company, domain, URLs, hashes, statements and scores are
> invented to show the shape of a result. They follow the output schema in
> [`tribloc-lead-intelligence/MCP-CONTRACT.md`](../tribloc-lead-intelligence/MCP-CONTRACT.md). The `.example` top-level
> domain is reserved and never resolves. `tests/mcp-contract.test.mjs` checks the JSON below against the schema.

## Request

```text
/tribloc-lead-intelligence:analyze northwind-bakery.example GB Northwind Bakery
```

The command makes one tool call with these arguments:

```json
{
  "website": "northwind-bakery.example",
  "country": "GB",
  "company_name": "Northwind Bakery"
}
```

## Result (structured content)

```json
{
  "product": "Tribloc Lead Intelligence",
  "company": {
    "name": "Northwind Bakery",
    "name_source": "input",
    "domain": "northwind-bakery.example",
    "country": "GB"
  },
  "coverage": "complete",
  "observations": [
    {
      "statement": "The site offers online pre-orders for collection, with a form that asks for a pickup date.",
      "confidence": 0.8,
      "confidence_status": "not validated",
      "source_urls": ["https://www.northwind-bakery.example/order"],
      "sources": [
        {
          "source_url": "https://www.northwind-bakery.example/order",
          "observed_at": "2026-11-21T10:15:00Z",
          "content_sha256": "b849cf394a8160fc9234a78b61f38eded176d3db5467e873172838a9f55cb328"
        }
      ]
    },
    {
      "statement": "The contact page lists two shop locations with separate opening hours.",
      "confidence": 0.75,
      "confidence_status": "not validated",
      "source_urls": ["https://www.northwind-bakery.example/contact"],
      "sources": [
        {
          "source_url": "https://www.northwind-bakery.example/contact",
          "observed_at": "2026-11-21T10:15:02Z",
          "content_sha256": "d3e0b63f90e4c8e3916f0041751d8d6a9945a6f90458dbb349be64bd85446031"
        }
      ]
    },
    {
      "statement": "The site has a page about wholesale supply to cafes, with an enquiry form and no price list.",
      "confidence": 0.7,
      "confidence_status": "not validated",
      "source_urls": ["https://www.northwind-bakery.example/wholesale"],
      "sources": [
        {
          "source_url": "https://www.northwind-bakery.example/wholesale",
          "observed_at": "2026-11-21T10:15:04Z",
          "content_sha256": "534041a08cb8cf6902539ecad940e68f0662732bde1da2b00fee98d788224307"
        }
      ]
    }
  ],
  "opportunities": [
    {
      "title": "Wholesale enquiries handled by a form",
      "statement": "Wholesale enquiries arrive through a web form with no published price list, so each enquiry needs a manual reply.",
      "is_hypothesis": false,
      "confidence": 0.65,
      "confidence_status": "not validated",
      "source_urls": ["https://www.northwind-bakery.example/wholesale"]
    },
    {
      "title": "Pre-order volume across two shops",
      "statement": "With two locations taking pre-orders, the business may be coordinating collection slots by hand.",
      "is_hypothesis": true,
      "confidence": 0.4,
      "confidence_status": "not validated",
      "source_urls": [
        "https://www.northwind-bakery.example/order",
        "https://www.northwind-bakery.example/contact"
      ]
    }
  ],
  "suggested_outreach_angle": "Ask how wholesale enquiries from cafes are answered today, since the site sends them to a form without prices.",
  "confidence": 0.7,
  "confidence_status": "not validated",
  "limitations": ["Only public pages were read; order volumes and internal processes are unknown."],
  "sources_not_checked": [],
  "preview_note": "One company per request, public web sources only, no contact data."
}
```

## How the plugin's skill presents it

The `account-brief` skill asks Claude to present the result in this order. The wording below is an illustration of
that order, not a fixed template.

1. **Company:** Northwind Bakery (name given by you), `northwind-bakery.example`, GB.
2. **Coverage:** complete. Limitation: only public pages were read; order volumes and internal processes are unknown.
3. **Observations (evidence):**
   1. Online pre-orders for collection with a pickup date. Source: `https://www.northwind-bakery.example/order`
   2. Two shop locations with separate opening hours. Source: `https://www.northwind-bakery.example/contact`
   3. A wholesale page for cafes with an enquiry form and no price list. Source:
      `https://www.northwind-bakery.example/wholesale`
4. **Opportunities:**
   1. **Observed:** wholesale enquiries handled by a form without a price list.
   2. **Hypothesis (to verify):** collection slots across two shops may be coordinated by hand.
5. **Suggested angle:** ask how wholesale enquiries from cafes are answered today.
6. **Confidence:** 0.7, the tool's own evidence score, not validated.
