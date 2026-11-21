// Manifest test: marketplace.json and plugin.json parse, have their required fields, and agree with each other,
// with both READMEs and with CHANGELOG.md. Run with `node --test tests/*.test.mjs`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_NAME = "tribloc-lead-intelligence";
const REPOSITORY = "https://github.com/tribloc-core/tribloc-lead-intelligence";
const REPO_SLUG = "tribloc-core/tribloc-lead-intelligence";
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

function loadRepo() {
  return {
    marketplace: JSON.parse(read(".claude-plugin/marketplace.json")),
    plugin: JSON.parse(read(`${PLUGIN_NAME}/.claude-plugin/plugin.json`)),
    rootReadme: read("README.md"),
    pluginReadme: read(`${PLUGIN_NAME}/README.md`),
    changelog: read("CHANGELOG.md"),
  };
}

// Returns a list of problems; an empty list means the repository is consistent.
export function checkManifests({ marketplace, plugin, rootReadme, pluginReadme, changelog }, root = ROOT) {
  const errors = [];
  const need = (cond, msg) => {
    if (!cond) errors.push(msg);
  };
  const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

  // marketplace.json
  need(nonEmpty(marketplace?.name), "marketplace.json: name is missing");
  need(nonEmpty(marketplace?.owner?.name), "marketplace.json: owner.name is missing");
  need(Array.isArray(marketplace?.plugins) && marketplace.plugins.length > 0, "marketplace.json: plugins is empty");
  const entries = (marketplace?.plugins ?? []).filter((p) => p?.name === PLUGIN_NAME);
  need(entries.length === 1, `marketplace.json: expected exactly one entry named ${PLUGIN_NAME}, found ${entries.length}`);
  const entry = entries[0] ?? {};
  need(nonEmpty(entry.source), "marketplace.json: plugin source is missing");
  need(nonEmpty(entry.description), "marketplace.json: plugin description is missing");
  if (nonEmpty(entry.source)) {
    need(entry.source.startsWith("./"), "marketplace.json: plugin source must be a relative path starting with ./");
    const src = resolve(root, entry.source);
    need(src.startsWith(root + "/") && existsSync(src) && statSync(src).isDirectory(),
      `marketplace.json: source ${entry.source} is not a directory inside the repository`);
    need(existsSync(join(src, ".claude-plugin", "plugin.json")),
      `marketplace.json: source ${entry.source} has no .claude-plugin/plugin.json`);
  }

  // plugin.json
  for (const field of ["name", "version", "description", "license", "repository", "homepage"]) {
    need(nonEmpty(plugin?.[field]), `plugin.json: ${field} is missing`);
  }
  need(nonEmpty(plugin?.author?.name), "plugin.json: author.name is missing");
  need(plugin?.name === PLUGIN_NAME, `plugin.json: name is ${plugin?.name}, expected ${PLUGIN_NAME}`);
  need(SEMVER.test(plugin?.version ?? ""), `plugin.json: version ${plugin?.version} is not semver`);
  need(plugin?.license === "MIT", `plugin.json: license is ${plugin?.license}, expected MIT`);
  need(plugin?.repository === REPOSITORY, `plugin.json: repository is ${plugin?.repository}, expected ${REPOSITORY}`);
  for (const key of ["hooks", "agents"]) {
    need(!(key in (plugin ?? {})), `plugin.json: must not declare ${key}`);
  }

  // marketplace entry agrees with plugin.json
  need(entry.version === plugin?.version, `marketplace.json: version ${entry.version} != plugin.json ${plugin?.version}`);
  need(entry.license === plugin?.license, `marketplace.json: license ${entry.license} != plugin.json ${plugin?.license}`);
  need(entry.repository === plugin?.repository,
    `marketplace.json: repository ${entry.repository} != plugin.json ${plugin?.repository}`);

  const version = plugin?.version;

  // plugin README
  const pv = /^Version \*\*([^*]+)\*\*\./m.exec(pluginReadme ?? "");
  need(pv?.[1] === version, `plugin README: version line says ${pv?.[1]}, expected ${version}`);
  const firstHistory = /^- `(\d+\.\d+\.\d+[^`]*)`:/m.exec(pluginReadme ?? "");
  need(firstHistory?.[1] === version, `plugin README: newest version history entry is ${firstHistory?.[1]}, expected ${version}`);
  need((pluginReadme ?? "").includes(`Plugin name: \`${PLUGIN_NAME}\``), "plugin README: plugin name line is missing");

  // root README
  const rv = /^Current plugin version: `([^`]+)`/m.exec(rootReadme ?? "");
  need(rv?.[1] === version, `root README: current version says ${rv?.[1]}, expected ${version}`);

  for (const [label, text] of [["root README", rootReadme], ["plugin README", pluginReadme]]) {
    need((text ?? "").includes(PLUGIN_NAME), `${label}: does not name ${PLUGIN_NAME}`);
    need((text ?? "").includes(REPO_SLUG), `${label}: does not name the repository ${REPO_SLUG}`);
    need(/Licen[cs]e:? \*{0,2}MIT/.test(text ?? ""), `${label}: does not state the MIT licence`);
  }
  need((rootReadme ?? "").includes(`claude plugin install ${PLUGIN_NAME}@${marketplace?.name}`),
    "root README: install command does not match the marketplace and plugin names");
  need((pluginReadme ?? "").includes(`claude plugin install ${PLUGIN_NAME}@${marketplace?.name}`),
    "plugin README: install command does not match the marketplace and plugin names");

  // CHANGELOG
  const released = [...(changelog ?? "").matchAll(/^## \[(\d+\.\d+\.\d+[^\]]*)\]/gm)].map((m) => m[1]);
  need(/^## \[Unreleased\]/m.test(changelog ?? ""), "CHANGELOG: Unreleased section is missing");
  need(released[0] === version, `CHANGELOG: newest released section is ${released[0]}, expected ${version}`);
  for (const v of released) {
    need(new RegExp(`^\\[${v.replace(/\./g, "\\.")}\\]: ${REPOSITORY}/`, "m").test(changelog ?? ""),
      `CHANGELOG: link for ${v} is missing or points outside ${REPOSITORY}`);
  }

  return errors;
}

test("manifests and documentation agree", () => {
  assert.deepEqual(checkManifests(loadRepo()), []);
});

test("negative: a version bump in plugin.json alone is caught", () => {
  const repo = loadRepo();
  repo.plugin = { ...repo.plugin, version: "9.9.9" };
  const errors = checkManifests(repo);
  assert.ok(errors.some((e) => e.includes("marketplace.json: version")), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("CHANGELOG")), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("plugin README")), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("root README")), errors.join("\n"));
});

test("negative: wrong licence, repository and missing source path are caught", () => {
  const repo = loadRepo();
  repo.plugin = { ...repo.plugin, license: "Apache-2.0", repository: "https://github.com/someone/else" };
  repo.marketplace = structuredClone(repo.marketplace);
  repo.marketplace.plugins[0].source = "./does-not-exist";
  const errors = checkManifests(repo);
  assert.ok(errors.some((e) => e.includes("license is Apache-2.0")), errors.join("\n"));
  assert.ok(errors.some((e) => e.includes("repository is https://github.com/someone/else")), errors.join("\n"));
  assert.ok(errors.some((e) => e.includes("./does-not-exist is not a directory")), errors.join("\n"));
});

test("negative: missing required fields are caught", () => {
  const repo = loadRepo();
  repo.plugin = { ...repo.plugin };
  delete repo.plugin.description;
  repo.marketplace = { ...repo.marketplace, owner: {} };
  const errors = checkManifests(repo);
  assert.ok(errors.includes("plugin.json: description is missing"), errors.join("\n"));
  assert.ok(errors.includes("marketplace.json: owner.name is missing"), errors.join("\n"));
});
