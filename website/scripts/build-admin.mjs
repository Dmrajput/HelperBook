import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminRoot = path.resolve(websiteRoot, "..", "admin");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(args) {
  const result = spawnSync(npmCmd, args, {
    cwd: adminRoot,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(result.error);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!fs.existsSync(path.join(adminRoot, "package.json"))) {
  console.error(`admin build: package not found at ${adminRoot}`);
  process.exit(1);
}

run(["ci"]);
run(["run", "build"]);

const source = path.join(adminRoot, "dist");
const target = path.join(websiteRoot, "dist", "admin");
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log("admin build: copied to dist/admin");
