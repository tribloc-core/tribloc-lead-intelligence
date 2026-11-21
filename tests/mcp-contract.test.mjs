// MCP contract test: the tables in tribloc-lead-intelligence/MCP-CONTRACT.md must match the committed tools/list
// snapshot in tests/fixtures/tools-list.json, field by field. Run with `node --test tests/*.test.mjs`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT = join(ROOT, "tribloc-lead-intelligence", "MCP-CONTRACT.md");
const TOOLS_LIST = join(ROOT, "tests", "fixtures", "tools-list.json");
const INITIALIZE = join(ROOT, "tests", "fixtures", "initialize.json");
const TOOL_NAME = "analyze_business_sales_opportunities";
const SNAPSHOT_DATE = "2026-11-21";

const loadDoc = () => readFileSync(CONTRACT, "utf8");
const loadTools = () => JSON.parse(readFileSync(TOOLS_LIST, "utf8"));
const loadInit = () => JSON.parse(readFileSync(INITIALIZE, "utf8"));

// Returns the rows of the first Markdown table after the heading `heading`, as objects keyed by header cell.
export function tableAfter(doc, heading) {
  const lines = doc.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return null;
  let i = start + 1;
  while (i < lines.length && !lines[i].startsWith("|")) {
    if (/^#{1,6} /.test(lines[i])) return null; // next section began before any table
    i++;
  }
  const rows = [];
  for (; i < lines.length && lines[i].startsWith("|"); i++) rows.push(lines[i]);
  if (rows.length < 2) return null;
  const split = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const header = split(rows[0]);
  return rows.slice(2).map((r) => Object.fromEntries(split(r).map((c, k) => [header[k], c])));
}

const unquote = (cell) => cell.replace(/^`(.*)`$/, "$1");
const ticks = (cell) => [...(cell ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]).sort();

function typeOf(prop) {
  if (prop.$ref) return prop.$ref.split("/").pop();
  if (prop.anyOf) return prop.anyOf.map(typeOf).join(" or ");
  if (prop.type === "array") return `array of ${typeOf(prop.items)}`;
  return prop.type;
}

function limitsOf(prop) {
  const out = [];
  const branches = prop.anyOf ? prop.anyOf.filter((b) => b.type !== "null") : [prop];
  for (const b of branches) {
    for (const key of ["minLength", "maxLength", "pattern", "minimum", "maximum", "minItems", "maxItems", "format", "const"]) {
      if (key in b) out.push(`${key}: ${b[key]}`);
    }
    if (b.enum) out.push(`enum: ${b.enum.join(", ")}`);
  }
  return out.sort();
}

function defaultOf(prop) {
  if (!("default" in prop)) return "";
  return prop.default === null ? "null" : String(prop.default);
}

// Compares one documented field table with one object schema.
function compareTable(label, rows, schema, errors) {
  if (!rows) {
    errors.push(`${label}: table not found in MCP-CONTRACT.md`);
    return;
  }
  const documented = new Map(rows.map((r) => [unquote(r.Field ?? ""), r]));
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  for (const name of Object.keys(props)) {
    if (!documented.has(name)) errors.push(`${label}: field ${name} is in the schema but not documented`);
  }
  for (const [name, row] of documented) {
    const prop = props[name];
    if (!prop) {
      errors.push(`${label}: field ${name} is documented but not in the schema`);
      continue;
    }
    const want = {
      Type: typeOf(prop),
      Required: required.has(name) ? "yes" : "no",
      Default: defaultOf(prop),
    };
    for (const [col, value] of Object.entries(want)) {
      const got = col === "Type" ? row[col] : unquote(row[col] ?? "");
      if (got !== value) errors.push(`${label}: ${name} ${col} is "${got}", schema says "${value}"`);
    }
    const gotLimits = ticks(row.Limits).join(" ; ");
    const wantLimits = limitsOf(prop).join(" ; ");
    if (gotLimits !== wantLimits) errors.push(`${label}: ${name} Limits are "${gotLimits}", schema says "${wantLimits}"`);
  }
}

export function checkContract(doc, toolsList, init) {
  const errors = [];
  const tools = toolsList?.tools ?? [];
  if (tools.length !== 1) errors.push(`fixture: expected one tool, found ${tools.length}`);
  const tool = tools[0] ?? {};

  // Fixed facts the contract must state, checked against the fixture as well.
  if (tool.name !== TOOL_NAME) errors.push(`fixture: tool name is ${tool.name}, expected ${TOOL_NAME}`);
  if (!(tool.inputSchema?.required ?? []).includes("website")) errors.push("fixture: website is not a required input");
  for (const f of ["company", "coverage", "confidence"]) {
    if (!(tool.outputSchema?.required ?? []).includes(f)) errors.push(`fixture: output field ${f} is not required`);
  }
  if (JSON.stringify(tool.outputSchema?.properties?.coverage?.enum) !== JSON.stringify(["complete", "partial", "insufficient"])) {
    errors.push("fixture: coverage enum is not complete, partial, insufficient");
  }

  if (!doc.includes(SNAPSHOT_DATE)) errors.push(`MCP-CONTRACT.md: does not state the snapshot date ${SNAPSHOT_DATE}`);
  if (!/may change/i.test(doc)) errors.push("MCP-CONTRACT.md: does not say that the server may change");

  const toolRows = tableAfter(doc, "## Tool");
  const toolProps = Object.fromEntries((toolRows ?? []).map((r) => [r.Property, r.Value]));
  if (unquote(toolProps.Name ?? "") !== tool.name) errors.push(`Tool: Name is ${toolProps.Name}, fixture says ${tool.name}`);
  if (toolProps.Title !== tool.title) errors.push(`Tool: Title is ${toolProps.Title}, fixture says ${tool.title}`);

  const endpoint = Object.fromEntries((tableAfter(doc, "## Endpoint") ?? []).map((r) => [r.Property, r.Value]));
  if (init && unquote(endpoint["Protocol version"] ?? "") !== init.protocolVersion) {
    errors.push(`Endpoint: protocol version is ${endpoint["Protocol version"]}, fixture says ${init.protocolVersion}`);
  }
  if (init && !(endpoint["Server name"] ?? "").startsWith(`\`${init.serverInfo?.name}\``)) {
    errors.push(`Endpoint: server name does not start with ${init.serverInfo?.name}`);
  }

  const annotations = tableAfter(doc, "### Annotations");
  const docAnn = Object.fromEntries((annotations ?? []).map((r) => [unquote(r.Annotation), unquote(r.Value)]));
  const fixAnn = Object.fromEntries(Object.entries(tool.annotations ?? {}).map(([k, v]) => [k, String(v)]));
  if (JSON.stringify(Object.entries(docAnn).sort()) !== JSON.stringify(Object.entries(fixAnn).sort())) {
    errors.push(`Annotations: documented ${JSON.stringify(docAnn)}, fixture ${JSON.stringify(fixAnn)}`);
  }
  for (const [k, v] of [["readOnlyHint", "true"], ["idempotentHint", "true"], ["destructiveHint", "false"]]) {
    if (fixAnn[k] !== v) errors.push(`fixture: ${k} is ${fixAnn[k]}, expected ${v}`);
  }

  compareTable("Input", tableAfter(doc, "## Input"), tool.inputSchema ?? {}, errors);
  const out = tool.outputSchema ?? {};
  compareTable(out.title ?? "Output", tableAfter(doc, `### ${out.title}`), out, errors);
  for (const [name, def] of Object.entries(out.$defs ?? {})) {
    compareTable(name, tableAfter(doc, `### ${name}`), def, errors);
  }
  return errors;
}

test("MCP-CONTRACT.md matches the tools/list fixture", () => {
  assert.deepEqual(checkContract(loadDoc(), loadTools(), loadInit()), []);
});

test("the fixture states the contract the plugin relies on", () => {
  const [tool] = loadTools().tools;
  assert.equal(tool.name, TOOL_NAME);
  assert.deepEqual(tool.inputSchema.required, ["website"]);
  assert.deepEqual([...tool.outputSchema.required].sort(), ["company", "confidence", "coverage"]);
  assert.deepEqual(tool.outputSchema.properties.coverage.enum, ["complete", "partial", "insufficient"]);
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal(tool.annotations.idempotentHint, true);
  assert.equal(tool.annotations.destructiveHint, false);
});

test("negative: a changed server schema is caught", () => {
  const tools = structuredClone(loadTools());
  const [tool] = tools.tools;
  tool.outputSchema.properties.coverage.enum.push("unknown");
  tool.inputSchema.required = [];
  tool.inputSchema.properties.website.maxLength = 512;
  tool.outputSchema.$defs.PublicOpportunity.properties.priority = { type: "integer" };
  tool.annotations.destructiveHint = true;
  const errors = checkContract(loadDoc(), tools, loadInit());
  const has = (s) => assert.ok(errors.some((e) => e.includes(s)), `expected an error containing "${s}":\n${errors.join("\n")}`);
  has("coverage Limits");
  has("website Required");
  has("website Limits");
  has("field priority is in the schema but not documented");
  has("Annotations: documented");
  has("fixture: website is not a required input");
});

test("negative: a wrong or incomplete document is caught", () => {
  const doc = loadDoc()
    .replace("| Name | `analyze_business_sales_opportunities` |", "| Name | `analyze_company` |")
    .replace("| `confidence` | number | yes | | `minimum: 0`, `maximum: 1` | The tool's own", "| `confidence` | number | no | | `minimum: 0`, `maximum: 1` | The tool's own")
    .replace(/^\| `industry` .*\n/m, "")
    .replace("### PublicEvidenceSource", "### EvidenceSource");
  const errors = checkContract(doc, loadTools(), loadInit());
  const has = (s) => assert.ok(errors.some((e) => e.includes(s)), `expected an error containing "${s}":\n${errors.join("\n")}`);
  has("Tool: Name is `analyze_company`");
  has("PublicAnalysisResult: confidence Required");
  has("Input: field industry is in the schema but not documented");
  has("PublicEvidenceSource: table not found");
});

// ---- Examples ------------------------------------------------------------------------------------------------------
// The JSON blocks in examples/*.md must validate against the fixture's schemas, and use only reserved .example domains.

// A small JSON Schema subset validator: the keywords the fixture uses. It is stricter than the schema in one way:
// a field the schema does not define is an error, so that examples contain only documented fields.
export function validate(schema, value, root = schema, path = "$") {
  const errors = [];
  if (schema.$ref) return validate(root.$defs[schema.$ref.split("/").pop()], value, root, path);
  if (schema.anyOf) {
    const ok = schema.anyOf.some((s) => validate(s, value, root, path).length === 0);
    return ok ? [] : [`${path}: matches none of anyOf`];
  }
  const typeOk = {
    object: (v) => v !== null && typeof v === "object" && !Array.isArray(v),
    array: Array.isArray,
    string: (v) => typeof v === "string",
    number: (v) => typeof v === "number",
    integer: Number.isInteger,
    boolean: (v) => typeof v === "boolean",
    null: (v) => v === null,
  };
  if (schema.type && !typeOk[schema.type](value)) return [`${path}: expected ${schema.type}`];
  if ("const" in schema && value !== schema.const) errors.push(`${path}: expected const ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: ${value} is not one of ${schema.enum.join(", ")}`);
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path}: longer than ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: does not match ${schema.pattern}`);
    if (schema.format === "date-time" && Number.isNaN(Date.parse(value))) errors.push(`${path}: not a date-time`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: above ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: more than ${schema.maxItems} items`);
    value.forEach((item, i) => errors.push(...validate(schema.items ?? {}, item, root, `${path}[${i}]`)));
  }
  if (typeOk.object(value) && schema.properties) {
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${path}: missing required ${key}`);
    for (const [key, v] of Object.entries(value)) {
      if (!schema.properties[key]) errors.push(`${path}: unknown field ${key}`);
      else errors.push(...validate(schema.properties[key], v, root, `${path}.${key}`));
    }
  }
  return errors;
}

const EXAMPLES_DIR = join(ROOT, "examples");
function exampleBlocks() {
  const out = [];
  for (const name of readdirSync(EXAMPLES_DIR).filter((n) => n.endsWith(".md"))) {
    const text = readFileSync(join(EXAMPLES_DIR, name), "utf8");
    for (const m of text.matchAll(/```json\n([\s\S]*?)\n```/g)) out.push({ name, json: JSON.parse(m[1]) });
    out.push({ name, text });
  }
  return out;
}

test("examples are marked illustrative, use only .example domains, and match the schemas", () => {
  const [tool] = loadTools().tools;
  const blocks = exampleBlocks();
  const results = blocks.filter((b) => b.json && "coverage" in b.json);
  const inputs = blocks.filter((b) => b.json && "website" in b.json);
  assert.ok(results.length >= 2, "expected at least two example results");
  assert.ok(results.some((b) => b.json.coverage === "complete"), "no complete-coverage example");
  assert.ok(results.some((b) => b.json.coverage === "insufficient"), "no insufficient-coverage example");
  for (const b of results) assert.deepEqual(validate(tool.outputSchema, b.json), [], `${b.name}: result`);
  for (const b of inputs) assert.deepEqual(validate(tool.inputSchema, b.json), [], `${b.name}: input`);
  for (const b of blocks.filter((x) => x.text)) {
    assert.match(b.text, /Illustrative only/, `${b.name}: not marked illustrative`);
    for (const m of b.text.matchAll(/https?:\/\/([^/\s`"')]+)/g)) {
      assert.ok(m[1].endsWith(".example") || m[0].startsWith("https://github.com/tribloc-core/"), `${b.name}: real-looking host ${m[1]}`);
    }
    for (const m of b.text.matchAll(/\b([a-z0-9-]+(?:\.[a-z0-9-]+)+)\.(?:com|co\.uk|org|net|io|de|ch|hu)\b/gi)) {
      assert.fail(`${b.name}: real-looking domain ${m[0]}`);
    }
  }
});

test("negative: a result that breaks the output schema is caught", () => {
  const [tool] = loadTools().tools;
  const bad = {
    company: { name: "X", name_source: "guess" },
    coverage: "mostly",
    confidence: 1.5,
    observations: Array.from({ length: 6 }, () => ({ statement: "s", confidence: 0.5 })),
    opportunities: [{ title: "t", statement: "s", confidence: 0.5 }],
    contact_email: "someone@example.test",
  };
  const errors = validate(tool.outputSchema, bad);
  const has = (s) => assert.ok(errors.some((e) => e.includes(s)), `expected an error containing "${s}":\n${errors.join("\n")}`);
  has("$.coverage: mostly is not one of");
  has("$.confidence: above 1");
  has("$.company.name_source");
  has("$.observations: more than 5 items");
  has("$.opportunities[0]: missing required is_hypothesis");
  has("$: unknown field contact_email");
  assert.ok(validate(tool.inputSchema, {}).includes("$: missing required website"));
  assert.ok(validate(tool.inputSchema, { website: "x.example", country: "GBR" }).length > 0);
});
