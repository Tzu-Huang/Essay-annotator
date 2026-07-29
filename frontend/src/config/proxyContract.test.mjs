import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const viteConfig = readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8')

test('Vite proxies the public /api namespace to loopback FastAPI', () => {
  assert.match(viteConfig, /['"]\/api['"]\s*:/)
  assert.match(viteConfig, /target:\s*['"]http:\/\/127\.0\.0\.1:8000['"]/)
  assert.match(viteConfig, /replace\(\/\^\\\/api\/,\s*['"]['"]\)/)
})

test('Vite proxy keeps methods, headers, bodies, and query strings on one rewrite', () => {
  assert.match(viteConfig, /changeOrigin:\s*true/)
  assert.doesNotMatch(viteConfig, /configure:|proxyReq|bodyParser/)
})
