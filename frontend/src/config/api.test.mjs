import assert from 'node:assert/strict'
import test from 'node:test'

import { API_BASE, apiUrl, normalizeApiBase } from './api.js'

test('API base defaults to same-origin /api', () => {
  assert.equal(API_BASE, '/api')
  assert.equal(normalizeApiBase(), '/api')
  assert.equal(apiUrl('/health'), '/api/health')
})

test('API base normalization removes trailing slashes', () => {
  assert.equal(normalizeApiBase('https://example.test/base///'), 'https://example.test/base')
  assert.equal(normalizeApiBase('  /gateway/  '), '/gateway')
})

test('apiUrl accepts route paths with or without a leading slash', () => {
  assert.equal(apiUrl('admin/essays'), '/api/admin/essays')
  assert.equal(apiUrl('/search'), '/api/search')
})
