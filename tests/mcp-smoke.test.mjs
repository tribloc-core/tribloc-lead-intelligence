// Mocked MCP smoke test: a minimal streamable-HTTP client completes initialize and tools/list against a local
// in-process server that answers from the committed fixtures. Nothing here contacts the hosted endpoint.
// Run with `node --test tests/*.test.mjs`.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOOLS_LIST = JSON.parse(readFileSync(join(ROOT, "tests", "fixtures", "tools-list.json"), "utf8"));
const INITIALIZE = JSON.parse(readFileSync(join(ROOT, "tests", "fixtures", "initialize.json"), "utf8"));
const PROTOCOL_VERSION = INITIALIZE.protocolVersion;

// ---- Mock server --------------------------------------------------------------------------------------------------
// Behaves like a stateless MCP streamable-HTTP endpoint: POST only, JSON-RPC 2.0, and it rejects requests without the
// headers the transport requires. `mode.sse` makes it answer tools/list as a text/event-stream.
const mode = { sse: false };
const seen = [];

function startMock() {
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ method: req.method, headers: req.headers, body });
      const fail = (status, msg) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32600, message: msg } }));
      };
      if (req.method !== "POST" || req.url !== "/mcp") return fail(405, "POST /mcp only");
      const accept = req.headers.accept ?? "";
      if (!accept.includes("application/json") || !accept.includes("text/event-stream")) {
        return fail(406, "Accept must include application/json and text/event-stream");
      }
      if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return fail(415, "Content-Type must be application/json");
      let msg;
      try {
        msg = JSON.parse(body);
      } catch {
        return fail(400, "invalid JSON");
      }
      if (msg.method !== "initialize" && req.headers["mcp-protocol-version"] !== PROTOCOL_VERSION) {
        return fail(400, "MCP-Protocol-Version header missing or unsupported");
      }
      if (msg.id === undefined) {
        res.writeHead(202);
        return res.end();
      }
      let result;
      if (msg.method === "initialize") result = INITIALIZE;
      else if (msg.method === "tools/list") result = TOOLS_LIST;
      else {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: "Method not found" } }));
      }
      const payload = JSON.stringify({ jsonrpc: "2.0", id: msg.id, result });
      if (mode.sse && msg.method === "tools/list") {
        res.writeHead(200, { "content-type": "text/event-stream" });
        return res.end(`event: message\ndata: ${payload}\n\n`);
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(payload);
    });
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

// ---- Minimal client -----------------------------------------------------------------------------------------------
// The same headers a streamable-HTTP MCP client sends. It accepts a JSON or an event-stream response.
export function createClient(url, { headers = {} } = {}) {
  let nextId = 1;
  let protocolVersion = null;
  let sessionId = null;

  async function post(message) {
    const h = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...headers,
    };
    if (protocolVersion) h["MCP-Protocol-Version"] = protocolVersion;
    if (sessionId) h["Mcp-Session-Id"] = sessionId;
    const res = await fetch(url, { method: "POST", headers: h, body: JSON.stringify(message) });
    sessionId = res.headers.get("mcp-session-id") ?? sessionId;
    return res;
  }

  async function parse(res, id) {
    const type = res.headers.get("content-type") ?? "";
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    let messages;
    if (type.startsWith("text/event-stream")) {
      messages = text.split(/\r?\n\r?\n/).map((evt) => evt.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n")).filter(Boolean).map((d) => JSON.parse(d));
    } else {
      messages = [JSON.parse(text)];
    }
    const reply = messages.find((m) => m.id === id);
    if (!reply) throw new Error(`no response for id ${id}`);
    if (reply.error) throw new Error(`JSON-RPC error ${reply.error.code}: ${reply.error.message}`);
    return reply.result;
  }

  async function request(method, params = {}) {
    const id = nextId++;
    return parse(await post({ jsonrpc: "2.0", id, method, params }), id);
  }

  return {
    async initialize() {
      const result = await request("initialize", {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "tli-contract-test", version: "0.0.0" },
      });
      protocolVersion = result.protocolVersion;
      const res = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
      if (res.status !== 202 && !res.ok) throw new Error(`initialized notification rejected: HTTP ${res.status}`);
      await res.text();
      return result;
    },
    listTools: () => request("tools/list"),
  };
}

let server;
let url;
before(async () => {
  server = await startMock();
  url = `http://127.0.0.1:${server.address().port}/mcp`;
});
after(() => new Promise((ok) => server.close(ok)));

test("the client talks only to the local mock server", () => {
  assert.equal(new URL(url).hostname, "127.0.0.1");
});

test("initialize then tools/list returns the analysis tool (JSON responses)", async () => {
  mode.sse = false;
  seen.length = 0;
  const client = createClient(url);
  const init = await client.initialize();
  assert.equal(init.protocolVersion, "2025-06-18");
  assert.equal(init.serverInfo.name, "tribloc-lead-intelligence");
  assert.equal(init.capabilities.tools.listChanged, false);

  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name), ["analyze_business_sales_opportunities"]);
  assert.deepEqual(tools[0].inputSchema.required, ["website"]);

  // The client sent the transport headers on every request.
  assert.equal(seen.length, 3);
  for (const r of seen) {
    assert.equal(r.method, "POST");
    assert.equal(r.headers["content-type"], "application/json");
    assert.equal(r.headers.accept, "application/json, text/event-stream");
    assert.equal(r.headers.authorization, undefined);
  }
  assert.equal(seen[2].headers["mcp-protocol-version"], "2025-06-18");
});

test("tools/list also works when the server answers with an event stream", async () => {
  mode.sse = true;
  try {
    const client = createClient(url);
    await client.initialize();
    const { tools } = await client.listTools();
    assert.equal(tools[0].name, "analyze_business_sales_opportunities");
  } finally {
    mode.sse = false;
  }
});

test("negative: a client without the streamable-HTTP Accept header is rejected", async () => {
  const client = createClient(url, { headers: { Accept: "application/json" } });
  await assert.rejects(client.initialize(), /HTTP 406/);
});

test("negative: an unknown method is a JSON-RPC error, not a tool list", async () => {
  const client = createClient(url);
  await client.initialize();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 99, method: "tools/lists" }),
  });
  const reply = await res.json();
  assert.equal(reply.error.code, -32601);
  assert.equal(reply.result, undefined);
});
