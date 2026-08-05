import { resolve } from "node:path";

interface Step {
  command: string[];
  name: string;
}

const repoRoot = resolve(import.meta.dir, "..");
const steps: Step[] = [
  { name: "unit", command: [process.execPath, "test", "src"] },
  { name: "svelte", command: [process.execPath, "run", "check"] },
  { name: "standalone build", command: [process.execPath, "run", "build"] },
  { name: "BATS", command: ["mise", "run", "bats"] },
];

for (const step of steps) {
  console.log(`\n==> ${step.name}`);
  const child = Bun.spawn(step.command, {
    cwd: repoRoot,
    stderr: "inherit",
    stdout: "inherit",
  });
  const status = await child.exited;
  if (status !== 0) process.exit(status);
}
