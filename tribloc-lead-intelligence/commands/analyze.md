---
description: Research one company website before outreach (public sources, with evidence links)
argument-hint: <website or domain> [country code] [company name]
---

Use the `account-brief` skill of this plugin to research exactly one company with the
`analyze_business_sales_opportunities` tool.

Input from the user: $ARGUMENTS

- The first word is the website or domain. If it is missing, ask for one public website and stop.
- A two-letter word after it is the country code; any remaining words are the company name.
- Make one tool call, then present the result as the skill describes: coverage and limitations first, observations
  with their source URLs, opportunities labelled observed or hypothesis, the outreach angle only if there is one.
- Send nothing and contact no one.
