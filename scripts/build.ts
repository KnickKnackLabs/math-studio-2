import { rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkArtifact } from "./check-artifact";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(repoRoot, "dist");

await rm(dist, { force: true, recursive: true });
const vite = Bun.spawn([process.execPath, "x", "vite", "build"], {
  cwd: repoRoot,
  stderr: "inherit",
  stdout: "inherit",
});
const status = await vite.exited;
if (status !== 0) process.exit(status);

await rename(resolve(dist, "index.html"), resolve(dist, "mim.html"));
await checkArtifact(resolve(dist, "mim.html"));
