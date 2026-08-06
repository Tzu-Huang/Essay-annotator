export const API_BASE = "/api";

export function apiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const withoutDuplicatePrefix = normalizedPath.startsWith("/api/")
    ? normalizedPath.slice(4)
    : normalizedPath === "/api"
      ? ""
      : normalizedPath;

  return `${API_BASE}${withoutDuplicatePrefix}`;
}
