import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  extractOfficialCostBuckets,
  isAdminEmailAllowed,
  PROJECT_ADMIN_EMAILS,
  usageDashboard,
} from "./AdminConsole.logic.mjs";

const source = readFileSync(new URL("./AdminConsole.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../styles/admin.css", import.meta.url), "utf8");

test("admin console sends the signed-in email through the admin header", () => {
  assert.match(source, /"X-Admin-Email": email \|\| ""/);
});

test("admin console supports wildcard local admin access", () => {
  assert.equal(isAdminEmailAllowed("anyone@example.com", ["*"]), true);
});

test("admin console exposes required operational tabs", () => {
  for (const label of ["Overview", "Essays", "Usage", "Logs", "Audit"]) {
    assert.match(source, new RegExp(`> ${label}|${label}`));
  }
});

test("admin console has the project admin allowlist and AWS API fallback", () => {
  assert.deepEqual(PROJECT_ADMIN_EMAILS, [
    "zackeryliu98@gmail.com",
    "zackery032895@gmail.com",
    "tzuhuangliu@gmail.com",
  ]);
  assert.match(source, /http:\/\/44\.201\.62\.0:8000/);
  assert.match(source, /FALLBACK_ADMIN_EMAILS/);
});

test("admin console provides a direct sign-in action on denied admin access", () => {
  assert.match(source, /useGoogleSignIn/);
  assert.match(source, /Sign in with Google/);
});

test("admin console explains when the AWS admin API is not deployed", () => {
  assert.match(source, /Admin API is not deployed on the AWS backend yet/);
});

test("admin console renders ID-first essay list and read panel", () => {
  assert.match(source, /admin-id-list/);
  assert.match(source, /EssayReadPanel/);
  assert.match(source, /essay\.id/);
  assert.match(source, /Metadata/);
  assert.match(source, /Recent audit/);
});

test("usage dashboard parses official daily cost buckets", () => {
  const buckets = extractOfficialCostBuckets({
    data: {
      data: [
        {
          start_time: 1767139200,
          results: [{ amount: { value: 1.25, currency: "USD" } }],
        },
        {
          start_time: 1767225600,
          results: [{ amount: { value: 2.75, currency: "USD" } }],
        },
      ],
    },
  });
  assert.equal(buckets.length, 2);
  assert.equal(buckets[0].cost, 1.25);
  assert.equal(usageDashboard({ official: { configured: true, data: { data: [] } }, local: [] }).hasOfficialCost, false);
});

test("usage dashboard falls back to local estimated cost when official buckets are unavailable", () => {
  const dashboard = usageDashboard({
    official: { configured: false, error: "missing credentials" },
    local: [{ requests: 3, input_tokens: 10, output_tokens: 5, estimated_cost: 0.02 }],
  });
  assert.equal(dashboard.currentSpend, 0.02);
  assert.equal(dashboard.local.requests, 3);
  assert.equal(dashboard.officialError, "missing credentials");
});

test("admin console includes CloudWatch setup state", () => {
  assert.match(source, /CloudWatch log ingestion is not configured/);
  assert.match(source, /AWS_CLOUDWATCH_LOG_GROUP/);
});

test("admin console has responsive dashboard layout rules", () => {
  assert.match(styles, /admin-sidebar/);
  assert.match(styles, /admin-essay-layout/);
  assert.match(styles, /@media \(max-width: 1120px\)/);
  assert.match(styles, /@media \(max-width: 720px\)/);
});

test("admin console includes essay mutation workflows", () => {
  for (const endpoint of [
    "/admin/essays",
    "regenerate-embedding",
    "\"PATCH\"",
    "method: \"DELETE\"",
  ]) {
    assert.match(source, new RegExp(endpoint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
