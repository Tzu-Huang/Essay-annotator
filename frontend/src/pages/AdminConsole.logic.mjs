export function isAdminEmailAllowed(email, configuredEmails) {
  return configuredEmails.length === 0 || configuredEmails.includes("*") || (email && configuredEmails.includes(email));
}

export function isConfirmIdMatch(inputValue, essayId) {
  return typeof inputValue === "string" && inputValue === essayId;
}

export const PROJECT_ADMIN_EMAILS = [
  "zackeryliu98@gmail.com",
  "zackery032895@gmail.com",
  "tzuhuangliu@gmail.com",
  "amanda.tsai11@gmail.com",
];

// Matches the canonical values already used across the existing essay
// dataset (see get_essay_type() in BackEnd/scripts/add_to_database.py),
// so the editor dropdown stays consistent with what's already stored
// and searchable rather than introducing new label strings.
export const ESSAY_TYPES = ["Personal Statement", "Supplemental", "University of California"];

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

export function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function bucketDate(bucket) {
  const raw = bucket.start_time ?? bucket.startTime ?? bucket.start ?? bucket.date;
  if (typeof raw === "number") {
    return new Date(raw * 1000).toISOString().slice(0, 10);
  }
  if (typeof raw === "string" && raw.length >= 10) {
    return raw.slice(0, 10);
  }
  return "unknown";
}

function amountFromResult(result) {
  if (!result || typeof result !== "object") return { value: 0, currency: "USD" };
  if (typeof result.amount?.value === "number") {
    return { value: result.amount.value, currency: result.amount.currency || "USD" };
  }
  if (typeof result.amount === "number") {
    return { value: result.amount, currency: result.currency || "USD" };
  }
  if (typeof result.cost === "number") {
    return { value: result.cost, currency: result.currency || "USD" };
  }
  return { value: 0, currency: result.currency || "USD" };
}

export function extractOfficialCostBuckets(official) {
  const data = official?.data?.data || official?.data || [];
  const buckets = Array.isArray(data) ? data : [];
  return buckets.map((bucket) => {
    const results = Array.isArray(bucket.results) ? bucket.results : [];
    const summarized = results.reduce(
      (acc, result) => {
        const amount = amountFromResult(result);
        acc.cost += amount.value;
        acc.currency = amount.currency || acc.currency;
        return acc;
      },
      { cost: 0, currency: "USD" }
    );
    return {
      date: bucketDate(bucket),
      cost: summarized.cost,
      currency: summarized.currency,
    };
  });
}

export function summarizeLocalUsage(rows = []) {
  return rows.reduce(
    (acc, row) => {
      acc.requests += Number(row.requests || 0);
      acc.inputTokens += Number(row.input_tokens || 0);
      acc.outputTokens += Number(row.output_tokens || 0);
      acc.estimatedCost += Number(row.estimated_cost || 0);
      return acc;
    },
    { requests: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 }
  );
}

export function usageDashboard(usage) {
  const officialBuckets = extractOfficialCostBuckets(usage?.official);
  const local = summarizeLocalUsage(usage?.local || []);
  const officialCost = officialBuckets.reduce((sum, bucket) => sum + bucket.cost, 0);
  const currency = officialBuckets.find((bucket) => bucket.currency)?.currency || "USD";
  return {
    officialBuckets,
    local,
    currentSpend: officialBuckets.length ? officialCost : local.estimatedCost,
    currency,
    hasOfficialCost: Boolean(officialBuckets.length),
    officialError: usage?.official?.error || "",
    officialConfigured: Boolean(usage?.official?.configured),
  };
}

export function formatDate(value) {
  if (!value) return "none";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function initialFromName(name) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

export function embeddingCoveragePercent(counts) {
  const total = Number(counts?.essays || 0);
  const stale = Number(counts?.stale_embeddings || 0);
  if (total <= 0) return 100;
  const current = Math.max(total - stale, 0);
  return Math.round((current / total) * 100);
}

export function buildDailyRequestSeries(localDaily = []) {
  return localDaily
    .filter((row) => row && row.date)
    .map((row) => ({ date: row.date, requests: Number(row.requests || 0) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

const SIDEBAR_STORAGE_KEY = "admin_sidebar_collapsed";

export function readSidebarCollapsed(storage) {
  if (!storage) return false;
  return storage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

export function writeSidebarCollapsed(storage, collapsed) {
  if (!storage) return;
  storage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "true" : "false");
}

export function isContentDirty(original, draft) {
  return (original || "") !== (draft || "");
}

const EDITOR_DIRTY_FIELDS = ["topic", "type", "school", "source_file", "public", "content"];

export function isEditorDirty(saved, current) {
  if (!saved || !current) return Boolean(saved) !== Boolean(current);
  for (const field of EDITOR_DIRTY_FIELDS) {
    if ((saved[field] || "") !== (current[field] || "")) return true;
  }
  return JSON.stringify(saved.metadata || {}) !== JSON.stringify(current.metadata || {});
}

export function draftToEditorPayload(draft) {
  return {
    topic: draft.topic || "",
    content: draft.content || "",
    type: draft.type || "",
    school: draft.school || "",
    public: false,
    source_file: draft.filename || "",
    metadata: null,
  };
}

export function advanceDraftQueue(currentIndex, totalDrafts) {
  const nextIndex = currentIndex + 1;
  return nextIndex < totalDrafts ? { done: false, nextIndex } : { done: true, nextIndex: null };
}
