import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const internalRequestFiles = [
  '../hooks/useGoogleSignIn.jsx',
  '../pages/AdminConsole.jsx',
  '../pages/ComparePage.jsx',
  '../pages/Editor.jsx',
  '../pages/EssayPage.jsx',
  '../pages/Home.jsx',
]

const sources = internalRequestFiles.map((path) => ({
  path,
  source: readFileSync(new URL(path, import.meta.url), 'utf8'),
}))

test('internal frontend requests use the shared apiUrl helper', () => {
  for (const { path, source } of sources) {
    assert.match(source, /apiUrl\(/, `${path} must use apiUrl`)
    assert.doesNotMatch(source, /VITE_API_URL/, `${path} must not read VITE_API_URL`)
  }
})

test('application request code has no hard-coded AWS API host or IP fallback', () => {
  for (const { path, source } of sources) {
    assert.doesNotMatch(
      source,
      /https?:\/\/(?:44\.201\.62\.0|[^/"']*amazonaws\.com)/,
      `${path} contains a deployment-specific API host`,
    )
  }
})

test('admin upload and authenticated requests preserve their required headers', () => {
  const admin = sources.find(({ path }) => path.endsWith('AdminConsole.jsx')).source

  assert.match(admin, /Authorization: `Bearer \$\{accessToken\}`/)
  assert.match(admin, /fetch\(apiUrl\("\/admin\/essays\/upload-drafts"\)/)
  assert.match(admin, /body: formData/)
})
