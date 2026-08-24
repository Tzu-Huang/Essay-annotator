import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const [, , packageDirectory, exceptionFile] = process.argv;

if (!packageDirectory || !exceptionFile) {
  console.error("Usage: node audit-npm.mjs <package-directory> <exception-file>");
  process.exit(2);
}

const repositoryRoot = process.cwd();
const exceptionPath = isAbsolute(exceptionFile)
  ? exceptionFile
  : resolve(repositoryRoot, exceptionFile);
const config = JSON.parse(readFileSync(exceptionPath, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const exceptions = new Map(
  (config.exceptions ?? []).map((entry) => [entry.advisory, entry]),
);

for (const entry of exceptions.values()) {
  if (!entry.advisory || !entry.package || !entry.owner || !entry.reason || !entry.followUpIssue || !entry.expires) {
    console.error("Every npm audit exception must include advisory, package, owner, reason, followUpIssue, and expires.");
    process.exit(2);
  }
}

const npmExecutable = process.platform === "win32" ? process.env.ComSpec : "npm";
const npmArguments = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm audit --json"]
  : ["audit", "--json"];
const audit = spawnSync(npmExecutable, npmArguments, {
  cwd: resolve(repositoryRoot, packageDirectory),
  encoding: "utf8",
  shell: false,
});

if (audit.error) {
  console.error(`npm audit could not start: ${audit.error.message}`);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error("npm audit did not return valid JSON.");
  if (audit.stderr) console.error(audit.stderr.trim());
  process.exit(2);
}

const blockingSeverities = new Set(["high", "critical"]);
const blocked = [];
const accepted = [];

for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const advisory of vulnerability.via ?? []) {
    if (typeof advisory !== "object" || !blockingSeverities.has(advisory.severity)) continue;

    const advisoryId = advisory.url?.match(/(GHSA-[\w-]+)$/)?.[1] ?? String(advisory.source);
    const exception = exceptions.get(advisoryId);
    if (
      exception &&
      exception.package === advisory.name &&
      exception.expires >= today
    ) {
      accepted.push(`${advisory.name}: ${advisoryId} (expires ${exception.expires})`);
    } else {
      blocked.push(`${advisory.name}: ${advisoryId} (${advisory.severity})`);
    }
  }
}

for (const finding of accepted) console.warn(`Accepted temporary exception: ${finding}`);
for (const finding of blocked) console.error(`Blocking npm advisory: ${finding}`);

if (blocked.length > 0) process.exit(1);
console.log("No unexcepted high or critical npm advisories found.");
