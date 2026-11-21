// .mcp.json test: exactly one remote server, type http, an https URL, and nothing that carries credentials.
// Run with `node --test tests/*.test.mjs`. This test only reads the file; it never contacts the URL.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MCP_JSON = join(ROOT, "tribloc-lead-intelligence", ".mcp.json");

const ALLOWED_SERVER_KEYS = new Set(["type", "url"]);
const CREDENTIAL_KEY = /header|auth|token|secret|key|password|credential|cookie|bearer|env|oauth/i;

export function checkMcpJson(config) {
  const errors = [];
  const need = (cond, msg) => {
    if (!cond) errors.push(msg);
  };
  need(config && typeof config === "object" && !Array.isArray(config), ".mcp.json is not an object");
  const topKeys = Object.keys(config ?? {});
  need(topKeys.length === 1 && topKeys[0] === "mcpServers", `.mcp.json: top-level keys are ${topKeys.join(", ")}, expected only mcpServers`);
  const servers = config?.mcpServers ?? {};
  const names = Object.keys(servers);
  need(names.length === 1, `.mcp.json: expected exactly one server, found ${names.length}`);

  for (const name of names) {
    const server = servers[name] ?? {};
    need(server.type === "http", `${name}: type is ${server.type}, expected http`);
    let url = null;
    try {
      url = new URL(server.url);
    } catch {
      errors.push(`${name}: url ${server.url} is not a valid URL`);
    }
    if (url) {
      need(url.protocol === "https:", `${name}: url must use https, got ${url.protocol}`);
      need(url.username === "" && url.password === "", `${name}: url must not contain user info`);
      need(url.search === "" && url.hash === "", `${name}: url must not carry a query string or fragment`);
    }
    for (const key of Object.keys(server)) {
      need(ALLOWED_SERVER_KEYS.has(key), `${name}: unexpected field ${key} (only type and url are allowed)`);
      need(!CREDENTIAL_KEY.test(key), `${name}: field ${key} looks like a credential or header field`);
    }
  }
  // A credential could also hide in a value anywhere in the file.
  const text = JSON.stringify(config ?? {});
  need(!/\$\{|Bearer |sk-[A-Za-z0-9]|ghp_|api[_-]?key/i.test(text), ".mcp.json: contains something that looks like a credential or a variable reference");
  return errors;
}

test(".mcp.json has one https http-type server and no credentials", () => {
  const config = JSON.parse(readFileSync(MCP_JSON, "utf8"));
  assert.deepEqual(checkMcpJson(config), []);
  const [server] = Object.values(config.mcpServers);
  assert.equal(new URL(server.url).hostname, "li.tribloc.co.uk");
});

test("negative: headers, a second server, plain http and a token in the URL are caught", () => {
  const withHeaders = { mcpServers: { a: { type: "http", url: "https://example.test/mcp", headers: { Authorization: "Bearer x" } } } };
  assert.ok(checkMcpJson(withHeaders).some((e) => e.includes("unexpected field headers")));

  const twoServers = { mcpServers: { a: { type: "http", url: "https://a.example/mcp" }, b: { type: "http", url: "https://b.example/mcp" } } };
  assert.ok(checkMcpJson(twoServers).some((e) => e.includes("exactly one server")));

  const plainHttp = { mcpServers: { a: { type: "http", url: "http://a.example/mcp" } } };
  assert.ok(checkMcpJson(plainHttp).some((e) => e.includes("must use https")));

  const stdio = { mcpServers: { a: { type: "stdio", command: "node", args: ["x.js"] } } };
  const stdioErrors = checkMcpJson(stdio);
  assert.ok(stdioErrors.some((e) => e.includes("expected http")));
  assert.ok(stdioErrors.some((e) => e.includes("unexpected field command")));

  const tokenInUrl = { mcpServers: { a: { type: "http", url: "https://a.example/mcp?api_key=abc" } } };
  assert.ok(checkMcpJson(tokenInUrl).some((e) => e.includes("query string")));
});
