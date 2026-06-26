export function isAdminEmailAllowed(email, configuredEmails) {
  return configuredEmails.length === 0 || configuredEmails.includes("*") || (email && configuredEmails.includes(email));
}

export const PROJECT_ADMIN_EMAILS = [
  "zackeryliu98@gmail.com",
  "zackery032895@gmail.com",
  "tzuhuangliu@gmail.com",
];

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
