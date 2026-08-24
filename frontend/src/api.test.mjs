import assert from "node:assert/strict";
import test from "node:test";

import { API_BASE, apiUrl } from "./api.mjs";

test("uses the same-origin API prefix", () => {
  assert.equal(API_BASE, "/api");
  assert.equal(apiUrl("/essays/123?include_content=true"), "/api/essays/123?include_content=true");
  assert.equal(apiUrl("search"), "/api/search");
});

test("does not duplicate an existing API prefix", () => {
  assert.equal(apiUrl("/api/users?email=test@example.com"), "/api/users?email=test@example.com");
  assert.equal(apiUrl("/api"), "/api");
});
