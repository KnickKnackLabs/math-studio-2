/** @jsxImportSource jsx-md */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  Badge,
  Badges,
  Bold,
  Cell,
  Center,
  Code,
  CodeBlock,
  Heading,
  LineBreak,
  Paragraph,
  Section,
  Sub,
  Table,
  TableHead,
  TableRow,
} from "readme";

const repoRoot = resolve(import.meta.dirname);
const taskRoot = join(repoRoot, ".mise/tasks");

interface TaskInfo {
  description: string;
  name: string;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function tasks(): TaskInfo[] {
  return walk(taskRoot).flatMap((path) => {
    const source = readFileSync(path, "utf8");
    const description = source.match(/^#MISE description="(.+)"$/m)?.[1];
    if (!description) return [];
    const relative = path.slice(taskRoot.length + 1).replace(/\/_default$/, "");
    return [{ name: relative.replaceAll("/", ":"), description }];
  }).sort((left, right) => left.name.localeCompare(right.name));
}

const unitTests = walk(join(repoRoot, "src")).filter((path) => path.endsWith(".test.ts")).length;
const publicTasks = tasks();

const readme = (
  <>
    <Center>
      <Heading level={1}>mim</Heading>
      <Paragraph><Bold>A keyboard-driven visual mathematics instrument.</Bold></Paragraph>
      <Paragraph>Modular source. One portable HTML artifact.</Paragraph>
      <Badges>
        <Badge label="UI" value="Svelte" color="ff3e00" />
        <Badge label="core" value="TypeScript" color="3178c6" />
        <Badge label="renderer" value="Canvas 2D" color="175e7a" />
        <Badge label="unit suites" value={`${unitTests}`} color="brightgreen" />
        <Badge label="License" value="MIT" color="blue" href="LICENSE" />
      </Badges>
    </Center>

    <LineBreak />

    <Section title="What this is">
      <Paragraph>
        <Code>mim</Code>{" is an interactive square-grid instrument for exploring mathematical structure. The first instrument evaluates exact GCD and LCM values, highlights prime results, and supports pointer or keyboard movement."}
      </Paragraph>
      <Paragraph>
        {"Svelte owns the interface shell. Plain TypeScript owns state, commands, mathematics, the display pipeline, and Canvas rendering. Vite compiles the maintained source into one direct-open "}<Code>dist/mim.html</Code>{" file."}
      </Paragraph>
    </Section>

    <Section title="Start">
      <CodeBlock lang="bash">{`mise trust
mise install
bun install --frozen-lockfile
mise run mim:dev

# Build and open the portable artifact.
mise run mim`}</CodeBlock>
    </Section>

    <Section title="Architecture">
      <Table>
        <TableHead><Cell>Owner</Cell><Cell>Responsibility</Cell></TableHead>
        <TableRow><Cell><Code>src/core</Code></Cell><Cell>State, semantic commands, reducer</Cell></TableRow>
        <TableRow><Cell><Code>src/instruments</Code></Cell><Cell>Exact mathematics and display classifications</Cell></TableRow>
        <TableRow><Cell><Code>src/input</Code></Cell><Cell>Keyboard and pointer input translated into commands</Cell></TableRow>
        <TableRow><Cell><Code>src/render</Code></Cell><Cell>Canvas pixels from prepared display data</Cell></TableRow>
        <TableRow><Cell><Code>src/ui</Code></Cell><Cell>Svelte controls and Canvas host</Cell></TableRow>
        <TableRow><Cell><Code>scripts</Code></Cell><Cell>Standalone build and aggregate validation</Cell></TableRow>
      </Table>
    </Section>

    <Section title="Tasks">
      <Table>
        <TableHead><Cell>Task</Cell><Cell>Description</Cell></TableHead>
        {publicTasks.map((task) => (
          <TableRow><Cell><Code>{`mise run ${task.name}`}</Code></Cell><Cell>{task.description}</Cell></TableRow>
        ))}
      </Table>
    </Section>

    <Section title="Validation">
      <CodeBlock lang="bash">{`mise run test
codebase lint "$PWD"
readme build --check
git diff --check`}</CodeBlock>
      <Paragraph>
        {"The aggregate path runs Bun unit tests, Svelte checks, the real standalone build, artifact inspection, and narrow BATS task-boundary tests."}
      </Paragraph>
    </Section>

    <Center>
      <Sub>Built as one file, operated as an instrument.</Sub>
    </Center>
  </>
);

console.log(readme);
