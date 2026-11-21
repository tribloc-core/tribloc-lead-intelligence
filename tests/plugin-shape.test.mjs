// Plugin-shape test: the plugin folder holds configuration and instructions only. No hooks, agents, scripts or
// executable files; command and skill frontmatter is well formed. Run with `node --test tests/*.test.mjs`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_DIR = join(ROOT, "tribloc-lead-intelligence");

// Every entry allowed at the top of the plugin folder.
const ALLOWED_TOP = new Set([".claude-plugin", ".mcp.json", "LICENSE", "README.md", "MCP-CONTRACT.md", "commands", "skills"]);
const FORBIDDEN_DIRS = new Set(["hooks", "agents", "bin", "scripts", "node_modules", "dist", "lib", "src"]);
const SCRIPT_EXT = /\.(?:sh|bash|zsh|fish|ps1|bat|cmd|exe|com|js|mjs|cjs|ts|mts|cts|jsx|tsx|py|rb|pl|php|lua|go|rs|jar|wasm|so|dylib|dll|bin|node)$/i;
const ALLOWED_FILE = /(?:\.md|\.json|^LICENSE)$/;
// The one binary file the plugin may hold: the directory listing icon (claude plugin validate, ICON_MISSING).
const ICON_PATH = ".claude-plugin/icon.png";

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === ".DS_Store") continue; // macOS Finder metadata, never committed
    const p = join(dir, name);
    const st = statSync(p);
    out.push({ path: p, name, isDir: st.isDirectory(), mode: st.mode });
    if (st.isDirectory()) out.push(...walk(p));
  }
  return out;
}

// Minimal frontmatter check for the flat `key: value` form that commands and skills use.
export function checkFrontmatter(text, { requireKeys = [] } = {}) {
  const errors = [];
  if (!text.startsWith("---")) {
    if (requireKeys.length) errors.push("frontmatter is required but missing");
    return { errors, data: null };
  }
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return { errors: ["the opening --- line has extra characters"], data: null };
  const end = lines.indexOf("---", 1);
  if (end === -1) return { errors: ["frontmatter is not closed with ---"], data: null };
  const data = {};
  for (const [i, line] of lines.slice(1, end).entries()) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const m = /^([A-Za-z][A-Za-z0-9_-]*):(?: (.*))?$/.exec(line);
    if (!m) {
      errors.push(`line ${i + 2}: not a "key: value" line: ${line}`);
      continue;
    }
    const [, key, raw = ""] = m;
    if (key in data) errors.push(`line ${i + 2}: duplicate key ${key}`);
    const value = raw.trim();
    const quoted = /^"(?:[^"\\]|\\.)*"$/.test(value) || /^'(?:[^']|'')*'$/.test(value);
    if (!quoted) {
      if (/^[[\]{}&*!|>'"%@`,#]/.test(value)) errors.push(`line ${i + 2}: value of ${key} starts with a YAML indicator; quote it`);
      if (/: /.test(value) || / #/.test(value)) errors.push(`line ${i + 2}: value of ${key} contains ": " or " #"; quote it`);
    }
    data[key] = quoted ? value.slice(1, -1) : value;
  }
  for (const key of requireKeys) {
    if (!data[key]) errors.push(`required key ${key} is missing or empty`);
  }
  return { errors, data };
}

export function checkShape(entries, pluginDir) {
  const errors = [];
  for (const e of entries) {
    const rel = relative(pluginDir, e.path);
    const top = rel.split("/")[0];
    if (rel === top && !ALLOWED_TOP.has(top)) errors.push(`${rel}: not an allowed top-level entry of the plugin`);
    if (e.isDir && FORBIDDEN_DIRS.has(e.name)) errors.push(`${rel}: ${e.name}/ directories are not allowed in the plugin`);
    if (!e.isDir) {
      if (e.mode & 0o111) errors.push(`${rel}: is executable`);
      if (SCRIPT_EXT.test(e.name)) errors.push(`${rel}: script or binary file type is not allowed`);
      if (!ALLOWED_FILE.test(e.name) && rel !== ICON_PATH) errors.push(`${rel}: only Markdown, JSON and LICENSE files are allowed`);
      if (/^hooks?\.json$/i.test(e.name)) errors.push(`${rel}: hook configuration is not allowed`);
    }
  }
  return errors;
}

test("plugin folder holds configuration and instructions only", () => {
  const entries = walk(PLUGIN_DIR);
  assert.deepEqual(checkShape(entries, PLUGIN_DIR), []);
  for (const e of entries.filter((x) => !x.isDir)) {
    const head = readFileSync(e.path, "utf8").slice(0, 2);
    assert.notEqual(head, "#!", `${relative(PLUGIN_DIR, e.path)} starts with a shebang`);
  }
});

test("every command and skill file has valid frontmatter", () => {
  const commandsDir = join(PLUGIN_DIR, "commands");
  const commands = readdirSync(commandsDir).filter((n) => n.endsWith(".md"));
  assert.ok(commands.length > 0, "no commands found");
  for (const name of commands) {
    const { errors, data } = checkFrontmatter(readFileSync(join(commandsDir, name), "utf8"));
    assert.deepEqual(errors, [], `commands/${name}`);
    if (data) assert.ok(data.description, `commands/${name}: description is empty`);
  }

  const skillsDir = join(PLUGIN_DIR, "skills");
  const skills = readdirSync(skillsDir).filter((n) => statSync(join(skillsDir, n)).isDirectory());
  assert.ok(skills.length > 0, "no skills found");
  for (const skill of skills) {
    const file = join(skillsDir, skill, "SKILL.md");
    const { errors, data } = checkFrontmatter(readFileSync(file, "utf8"), { requireKeys: ["name", "description"] });
    assert.deepEqual(errors, [], `skills/${skill}/SKILL.md`);
    assert.equal(data.name, skill, `skills/${skill}/SKILL.md: name must equal the folder name`);
  }
});

test("negative: hooks, agents, scripts and executables are caught", () => {
  const dir = "/p";
  const fake = [
    { path: "/p/hooks", name: "hooks", isDir: true, mode: 0o40755 },
    { path: "/p/hooks/hooks.json", name: "hooks.json", isDir: false, mode: 0o100644 },
    { path: "/p/agents", name: "agents", isDir: true, mode: 0o40755 },
    { path: "/p/commands/run.sh", name: "run.sh", isDir: false, mode: 0o100755 },
    { path: "/p/commands/notes.md", name: "notes.md", isDir: false, mode: 0o100755 },
  ];
  const errors = checkShape(fake, dir);
  assert.ok(errors.some((e) => e.startsWith("hooks: hooks/ directories")), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("agents: agents/ directories")), errors.join("\n"));
  assert.ok(errors.some((e) => e.includes("hook configuration")), errors.join("\n"));
  assert.ok(errors.some((e) => e === "commands/run.sh: script or binary file type is not allowed"), errors.join("\n"));
  assert.ok(errors.some((e) => e === "commands/notes.md: is executable"), errors.join("\n"));
});

// Reads width and height from a PNG header (signature + IHDR), or returns null when it is not a PNG.
export function pngSize(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || !sig.every((b, i) => buf[i] === b) || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test("the listing icon is a square PNG of 512 to 2048 px, under 2 MB", () => {
  const buf = readFileSync(join(PLUGIN_DIR, ICON_PATH));
  const size = pngSize(buf);
  assert.ok(size, "icon.png is not a PNG");
  assert.equal(size.width, size.height, "icon.png is not square");
  assert.ok(size.width >= 512 && size.width <= 2048, `icon.png is ${size.width} px, outside 512-2048`);
  assert.ok(buf.length < 2 * 1024 * 1024, "icon.png is 2 MB or larger");
});

test("negative: only the icon path may hold a PNG, and a non-PNG is not an icon", () => {
  const dir = "/p";
  const fake = [
    { path: "/p/.claude-plugin/icon.png", name: "icon.png", isDir: false, mode: 0o100644 },
    { path: "/p/commands/shot.png", name: "shot.png", isDir: false, mode: 0o100644 },
  ];
  const errors = checkShape(fake, dir);
  assert.ok(!errors.some((e) => e.startsWith(".claude-plugin/icon.png")), errors.join("\n"));
  assert.ok(errors.some((e) => e === "commands/shot.png: only Markdown, JSON and LICENSE files are allowed"), errors.join("\n"));
  assert.equal(pngSize(Buffer.from("not a png at all, just text")), null);
});

test("negative: broken frontmatter is caught", () => {
  assert.ok(checkFrontmatter("---\ndescription: ok\n").errors.some((e) => e.includes("not closed")));
  assert.ok(checkFrontmatter("---\ndescription: a: b\n---\n").errors.some((e) => e.includes("quote it")));
  assert.ok(checkFrontmatter("---\nname: x\nname: y\n---\n").errors.some((e) => e.includes("duplicate key")));
  assert.ok(checkFrontmatter("---\njust text\n---\n").errors.some((e) => e.includes("not a \"key: value\"")));
  assert.ok(checkFrontmatter("# no frontmatter", { requireKeys: ["name"] }).errors.length === 1);
  assert.ok(checkFrontmatter("---\nname: x\n---\n", { requireKeys: ["name", "description"] })
    .errors.includes("required key description is missing or empty"));
  assert.deepEqual(checkFrontmatter("# plain command, no frontmatter").errors, []);
});
