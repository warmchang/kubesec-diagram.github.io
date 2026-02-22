import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const rootDir = process.cwd();
const dataPath = path.join(rootDir, "data.js");
const outputPath = path.join(rootDir, "dist", "app.bundle.js");

function loadRuntimeScriptsFromConfig() {
  const dataSource = fs.readFileSync(dataPath, "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${dataSource}\nthis.__CONFIG__ = config;`, sandbox, {
    filename: "data.js",
  });

  const runtimeScripts = sandbox.__CONFIG__?.runtime?.scripts;
  if (!Array.isArray(runtimeScripts) || runtimeScripts.length === 0) {
    throw new Error("config.runtime.scripts must be a non-empty array in data.js");
  }

  return runtimeScripts;
}

function normalizeRelativePath(relPath) {
  return relPath.replace(/^\.\//, "");
}

function buildBundle() {
  const scripts = loadRuntimeScriptsFromConfig();
  const chunks = [];

  chunks.push("// Auto-generated bundle. Do not edit manually.\n");

  for (const relPath of scripts) {
    const normalizedRelPath = normalizeRelativePath(relPath);
    const absolutePath = path.join(rootDir, normalizedRelPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Missing script from config.runtime.scripts: ${relPath}`);
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    chunks.push(`\n// ---- ${relPath} ----\n`);
    chunks.push(content.endsWith("\n") ? content : `${content}\n`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, chunks.join(""), "utf8");
  console.log(`Built ${path.relative(rootDir, outputPath)}`);
}

buildBundle();
