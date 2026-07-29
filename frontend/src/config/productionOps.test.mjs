import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readRepoFile = (path) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8')

const nginx = readRepoFile('deploy/nginx.conf.example')
const service = readRepoFile('deploy/essay-api.service.example')
const environment = readRepoFile('deploy/ENVIRONMENT.md')
const makefile = readRepoFile('Makefile')

test('Nginx serves the SPA and strips the public /api prefix', () => {
  assert.match(nginx, /location \/api\//)
  assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:8000\//)
  assert.match(nginx, /try_files \$uri \$uri\/ \/index\.html/)
  assert.match(nginx, /proxy_set_header Authorization \$http_authorization/)
})

test('production commands avoid development servers and reload mode', () => {
  assert.match(makefile, /api-prod:/)
  assert.match(makefile, /web-build:/)
  assert.match(service, /python -m uvicorn app\.main:app/)
  assert.doesNotMatch(service, /--reload|npm run dev|vite preview/)
})

test('environment documentation separates build-time and runtime variables', () => {
  for (const name of [
    'VITE_API_BASE',
    'VITE_GOOGLE_LOGIN_ID',
    'APP_ENV',
    'POSTGRES_URL',
    'OPENAI_API_KEY',
    'GOOGLE_CLIENT_ID',
    'ADMIN_EMAILS',
    'CORS_ORIGINS',
  ]) {
    assert.match(environment, new RegExp(`\\b${name}\\b`))
  }
  assert.match(environment, /must never\s+contain secrets/i)
  assert.match(environment, /Same-origin production needs none/)
})
