// Single source of truth for build-time extension configuration.
//
// Env resolution order (first wins):
//   1. process.env                     — e.g. `APP_URL=https://… npm run extension:build:prod`
//   2. <root>/.env.<mode>              — e.g. .env.production
//   3. <root>/.env
//
// Used by build.mjs and by popup-src/vite.config.js, so the popup, the
// service worker and the manifest always agree on the API origin.

import fs from 'node:fs'
import path from 'node:path'
import { parseEnv } from 'node:util'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const EXTENSION_DIR = path.resolve(__dirname, '..')
export const ROOT_DIR = path.resolve(EXTENSION_DIR, '..')
export const DIST_DIR = path.join(EXTENSION_DIR, 'dist')

export const MODES = ['development', 'production']

function readEnvFile(file) {
  const full = path.join(ROOT_DIR, file)
  return fs.existsSync(full) ? parseEnv(fs.readFileSync(full, 'utf8')) : {}
}

function isLocalHost(hostname) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
}

export function resolveConfig(mode = process.env.EXT_MODE || 'development') {
  if (!MODES.includes(mode)) {
    throw new Error(`Unknown mode "${mode}". Expected one of: ${MODES.join(', ')}`)
  }

  const env = { ...readEnvFile('.env'), ...readEnvFile(`.env.${mode}`), ...process.env }

  if (!env.APP_URL) {
    throw new Error(`APP_URL is not set (checked process.env, .env.${mode}, .env)`)
  }

  let appUrl
  try {
    appUrl = new URL(env.APP_URL)
  } catch {
    throw new Error(`APP_URL is not a valid URL: "${env.APP_URL}"`)
  }

  if (mode === 'production') {
    if (appUrl.protocol !== 'https:') {
      throw new Error(`Production build requires an https APP_URL, got "${env.APP_URL}"`)
    }
    if (isLocalHost(appUrl.hostname)) {
      throw new Error('Production build must not point to localhost')
    }
  }

  return {
    mode,
    apiBase: appUrl.origin, // no trailing slash, no path
    // Public key (base64, from the Chrome Web Store dashboard) to pin the
    // unpacked extension ID to the published one. Dev builds only — the store
    // rejects manifests containing "key".
    extensionKey: mode === 'development' ? env.EXTENSION_KEY || null : null,
  }
}
