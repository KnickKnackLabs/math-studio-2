import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function checkArtifact(path = resolve(repoRoot, "dist/mim.html")): Promise<void> {
  const artifact = Bun.file(path);
  if (!(await artifact.exists())) throw new Error(`standalone artifact is missing: ${path}`);

  const html = await artifact.text();
  const problems: string[] = [];
  if (!html.includes('id="app"')) problems.push("app target is missing");
  if (!/<script\b(?![^>]*\bsrc=)[^>]*>/.test(html)) problems.push("inline script is missing");
  if (/<script\b[^>]*\bsrc=/.test(html)) problems.push("external script remains");
  if (/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=/.test(html)) {
    problems.push("external stylesheet remains");
  }

  const entries = await readdir(dirname(path));
  if (entries.length !== 1 || entries[0] !== "mim.html") {
    problems.push(`output directory is not single-file: ${entries.join(", ")}`);
  }

  if (problems.length > 0) throw new Error(problems.join("; "));
  console.log(`standalone artifact: ${path} (${artifact.size.toLocaleString()} bytes)`);
}

if (import.meta.main) await checkArtifact(process.argv[2]);
