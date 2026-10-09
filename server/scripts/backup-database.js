import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const uri = process.env.MONGODB_URI || "";
const output = process.env.BACKUP_DIR || "";

if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
  console.error("Set MONGODB_URI to the database you intend to back up. This script does not embed credentials.");
  process.exit(1);
}
if (!output) {
  console.error("Set BACKUP_DIR to a directory outside this repository.");
  process.exit(1);
}

const resolvedOutput = path.resolve(output);
const resolvedRepo = path.resolve(repoRoot);
const relative = path.relative(resolvedRepo, resolvedOutput);
if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
  console.error("BACKUP_DIR must be outside the repository. Do not store dumps in Git.");
  process.exit(1);
}

const child = spawn("mongodump", ["--uri", uri, "--out", resolvedOutput], { stdio: "inherit" });
child.on("error", () => {
  console.error("mongodump is not available. Install MongoDB Database Tools before relying on this backup.");
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
