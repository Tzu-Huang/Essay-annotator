import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyRequestSeries,
  embeddingCoveragePercent,
  extractOfficialCostBuckets,
  formatDate,
  initialFromName,
  isAdminEmailAllowed,
  isConfirmIdMatch,
  isContentDirty,
  isEditorDirty,
  parseMetadataDraft,
  PROJECT_ADMIN_EMAILS,
  readSidebarCollapsed,
  usageDashboard,
  writeSidebarCollapsed,
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
    "amanda.tsai11@gmail.com",
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

const essaysTabSource = readFileSync(new URL("./admin/EssaysTab.jsx", import.meta.url), "utf8");
const essayEditorSource = readFileSync(new URL("./admin/EssayEditorPage.jsx", import.meta.url), "utf8");

test("essays tab renders a table with pagination and an inline peek row", () => {
  assert.match(essaysTabSource, /admin-essay-table/);
  assert.match(essaysTabSource, /admin-essay-pager/);
  assert.match(essaysTabSource, /admin-peek-row/);
});

test("essay editor page supports content edit-toggle and metadata JSON editing", () => {
  assert.match(essayEditorSource, /parseMetadataDraft/);
  assert.match(essayEditorSource, /isContentDirty/);
  assert.match(essayEditorSource, /onMetadataErrorChange/);
  assert.match(essayEditorSource, /saveDisabled/);
  assert.match(essayEditorSource, /Regenerate Embedding/);
  assert.match(essayEditorSource, /Soft Delete/);
});

test("admin console tracks unsaved edits across every editor field, not just content", () => {
  assert.match(source, /isEditorDirty/);
  assert.match(source, /savedEditorSnapshot/);
});

test("admin console essays list uses a page size of 15", () => {
  assert.match(source, /page_size:\s*15/);
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
  assert.match(styles, /admin-essay-table/);
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

test("isConfirmIdMatch requires an exact match", () => {
  assert.equal(isConfirmIdMatch("essay_0042", "essay_0042"), true);
  assert.equal(isConfirmIdMatch("essay_004", "essay_0042"), false);
  assert.equal(isConfirmIdMatch("", "essay_0042"), false);
  assert.equal(isConfirmIdMatch(" essay_0042 ", "essay_0042"), false);
});

test("admin console exposes new essay management actions", () => {
  const combined = source + essaysTabSource + essayEditorSource;
  for (const needle of ["restore", "hard-delete", "regenerate-embedding", "import-new-essays", "sort_dir"]) {
    assert.match(combined, new RegExp(needle));
  }
});

test("formatDate renders a short month/day/time string", () => {
  assert.equal(formatDate(null), "none");
  assert.match(formatDate("2026-07-17T12:04:00Z"), /Jul 17/);
});

test("initialFromName returns an uppercase first letter or a fallback", () => {
  assert.equal(initialFromName("Amanda Tsai"), "A");
  assert.equal(initialFromName("  bob"), "B");
  assert.equal(initialFromName(""), "?");
  assert.equal(initialFromName(undefined), "?");
});

test("embeddingCoveragePercent computes rounded current-vs-total percentage", () => {
  assert.equal(embeddingCoveragePercent({ essays: 200, stale_embeddings: 0 }), 100);
  assert.equal(embeddingCoveragePercent({ essays: 200, stale_embeddings: 50 }), 75);
  assert.equal(embeddingCoveragePercent({ essays: 0, stale_embeddings: 0 }), 100);
});

test("buildDailyRequestSeries sorts ascending and coerces request counts", () => {
  const series = buildDailyRequestSeries([
    { date: "2026-07-16", requests: "3" },
    { date: "2026-07-14", requests: 1 },
    { date: null, requests: 5 },
  ]);
  assert.deepEqual(series, [
    { date: "2026-07-14", requests: 1 },
    { date: "2026-07-16", requests: 3 },
  ]);
});

test("sidebar-collapsed storage helpers round-trip through a Storage-like object", () => {
  const store = new Map();
  const fakeStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  assert.equal(readSidebarCollapsed(fakeStorage), false);
  writeSidebarCollapsed(fakeStorage, true);
  assert.equal(readSidebarCollapsed(fakeStorage), true);
  assert.equal(readSidebarCollapsed(undefined), false);
});

test("isContentDirty compares original vs draft content", () => {
  assert.equal(isContentDirty("hello", "hello"), false);
  assert.equal(isContentDirty("hello", "hello!"), true);
  assert.equal(isContentDirty(null, ""), false);
});

test("parseMetadataDraft accepts JSON objects and rejects everything else", () => {
  assert.deepEqual(parseMetadataDraft('{"a": 1}'), { ok: true, value: { a: 1 } });
  assert.deepEqual(parseMetadataDraft(""), { ok: true, value: {} });
  assert.equal(parseMetadataDraft("not json").ok, false);
  assert.equal(parseMetadataDraft("[1,2,3]").ok, false);
  assert.equal(parseMetadataDraft("null").ok, false);
});

test("isEditorDirty compares every editable field, not just content", () => {
  const saved = {
    topic: "T", type: "Personal Statement", school: "MIT", source_file: "online",
    public: true, content: "body", metadata: { generated_title: "T" },
  };
  assert.equal(isEditorDirty(saved, { ...saved }), false);
  assert.equal(isEditorDirty(saved, { ...saved, topic: "Changed" }), true);
  assert.equal(isEditorDirty(saved, { ...saved, public: false }), true);
  assert.equal(isEditorDirty(saved, { ...saved, metadata: { generated_title: "Changed" } }), true);
  assert.equal(isEditorDirty(saved, { ...saved, metadata: { generated_title: "T" } }), false);
  assert.equal(isEditorDirty(null, saved), true);
});

const sidebarSource = readFileSync(new URL("./admin/AdminSidebar.jsx", import.meta.url), "utf8");

test("sidebar is collapsible via a toggle button and persists via localStorage", () => {
  assert.match(sidebarSource, /onToggleCollapsed/);
  assert.match(source, /readSidebarCollapsed/);
  assert.match(source, /writeSidebarCollapsed/);
});

const auditLogSource = readFileSync(new URL("./admin/AuditLogList.jsx", import.meta.url), "utf8");

test("audit log renders as an expandable typewriter-style list with action tags", () => {
  assert.match(auditLogSource, /admin-audit-log/);
  assert.match(auditLogSource, /admin-audit-tag/);
  assert.match(auditLogSource, /export function AuditLogList/);
});
