// Generates manifest.json for the given build config.
// Edit this file instead of dist/manifest.json (which is overwritten on every build).

import fs from 'node:fs'
import path from 'node:path'
import { EXTENSION_DIR } from './config.mjs'

import { registry } from '../../packages/parsers/src/index.ts'

const { version } = JSON.parse(
  fs.readFileSync(path.join(EXTENSION_DIR, 'popup-src', 'package.json'), 'utf8'),
)

// Origins of the web app allowed to talk to the extension via
// chrome.runtime.sendMessage(EXTENSION_ID, …) — see externally_connectable.
// Chrome match patterns without an explicit port match any port,
// so "http://localhost/*" covers both Vite (5173) and the backend (8000).
function webAppMatches({ mode, apiBase }) {
  if (mode === 'development') {
    return ['http://localhost/*', 'http://127.0.0.1/*']
  }
  return [`${apiBase}/*`]
}

function getParserPermissions() {
  const permissions = new Set()
  for (const parser of registry.allParsers()) {
    if (parser.domains) {
      for (const domain of parser.domains) {
        permissions.add(`*://*.${domain}/*`)
        permissions.add(`*://${domain}/*`)
      }
    }
  }
  return Array.from(permissions)
}

export function buildManifest(config) {
  const manifest = {
    manifest_version: 3,
    name: config.mode === 'development' ? 'Job Tracker Extractor (dev)' : 'Job Tracker Extractor',
    version,
    description: 'Parse job vacancies and sync with Job Tracker.',
    permissions: [
      'activeTab',
      'scripting',
      'tabs',
      'alarms',
      'contextMenus',
      'notifications',
      'storage',
      'offscreen',
    ],
    host_permissions: [
      // API origin: lets the service worker call the backend with cookies, bypassing CORS.
      `${config.apiBase}/*`,
      // Dynamically generated parser permissions
      ...getParserPermissions()
    ],
    background: {
      service_worker: 'background.js',
      type: 'module',
    },
    action: {
      default_popup: 'popup/index.html',
      default_title: 'Add to Job Tracker',
    },
    externally_connectable: {
      matches: webAppMatches(config),
    },
  }

  if (config.extensionKey) {
    manifest.key = config.extensionKey
  }

  return manifest
}
