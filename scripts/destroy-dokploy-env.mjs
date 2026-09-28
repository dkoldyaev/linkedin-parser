#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE_PATH = path.join(ROOT_DIR, '.env');

// 1. Parse CLI arguments
const args = process.argv.slice(2);

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  const prefixArg = args.find((a) => a.startsWith(`${flag}=`));
  if (prefixArg) {
    return prefixArg.slice(flag.length + 1);
  }
  return null;
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  npm run dokploy:destroy -- [environment-name] [options]
  node scripts/destroy-dokploy-env.mjs [environment-name] [options]

Options:
  --branch <name>     Git branch name to derive environment from (default: current git branch)
  --force, -f, -y     Skip confirmation prompt
  --keep-network      Do not delete the isolated overlay network
  -h, --help          Show help

Examples:
  npm run dokploy:destroy -- feature-quiz
  npm run dokploy:destroy -- feature-quiz --force
  npm run dokploy:destroy
`);
  process.exit(0);
}

const force = args.includes('--force') || args.includes('-f') || args.includes('-y') || args.includes('--yes');
const keepNetwork = args.includes('--keep-network');
const customBranch = getArgValue('--branch');

const positionalArgs = args.filter((a) => {
  if (a.startsWith('--') || a.startsWith('-')) return false;
  const prevIdx = args.indexOf(a) - 1;
  if (prevIdx >= 0 && ['--branch'].includes(args[prevIdx])) {
    return false;
  }
  return true;
});

// 2. Detect Git Branch
function getCurrentGitBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
    if (branch) return branch;
  } catch {
    // ignore
  }
  throw new Error('Unable to determine current git branch. Please specify environment name or --branch <name>');
}

const gitBranch = customBranch !== null ? customBranch : getCurrentGitBranch();
const rawEnvName = positionalArgs.length > 0 ? positionalArgs[0] : gitBranch;
// Sanitize environment name for valid DNS / identifier label
const envName = rawEnvName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

// 3. Load .env file with strict validation
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`.env file not found at path: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envVars = loadEnv(ENV_FILE_PATH);
const projectName = envVars['PROJECT_NAME'] || 'linkedin-parser';

function requireEnvVar(name) {
  const value = envVars[name] !== undefined ? envVars[name] : process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Strict Configuration Error: Missing required environment variable "${name}" in ${ENV_FILE_PATH}`);
  }
  return value;
}

const DOKPLOY_URL_RAW = requireEnvVar('DOKPLOY_URL');
const BASE_URL = `${DOKPLOY_URL_RAW.replace(/\/+$/, '')}/api`;
const API_KEY = requireEnvVar('DOKPLOY_API_KEY');

// Helper to make API requests to Dokploy
function dokployRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    };

    let bodyData = null;
    if (body) {
      bodyData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`[${res.statusCode}] ${endpoint}: ${json.message || JSON.stringify(json)}`));
          } else {
            resolve(json.data !== undefined ? json.data : json);
          }
        } catch {
          if (res.statusCode >= 400) {
            reject(new Error(`[${res.statusCode}] ${endpoint}: ${data}`));
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log(`\n\x1b[31m=== Dokploy Environment Destruction: "${envName}" ===\x1b[0m\n`);

  // Protected environments check
  const protectedEnvs = ['production', 'prod', 'master', 'main'];
  if (protectedEnvs.includes(envName) && !force) {
    console.error(`\x1b[31m❌ Environment "${envName}" is protected! Deletion requires explicit --force flag.\x1b[0m\n`);
    process.exit(1);
  }

  // 1. Fetch Project and find Environment
  console.log(`🔍 Connecting to Dokploy and searching for project "${projectName}"...`);
  const projects = await dokployRequest('/project.all');
  const project = (projects || []).find((p) => p.name?.toLowerCase() === projectName.toLowerCase());
  if (!project) {
    throw new Error(`Project "${projectName}" not found in Dokploy!`);
  }
  const projectId = project.projectId;

  const projectDetails = await dokployRequest(`/project.one?projectId=${projectId}`);
  const env = (projectDetails.environments || []).find((e) => e.name === envName);

  if (!env) {
    console.log(`\x1b[33mℹ️  Environment "${envName}" does not exist in project "${projectName}". Nothing to destroy.\x1b[0m\n`);
    process.exit(0);
  }

  const environmentId = env.environmentId;
  console.log(`✅ Found environment "${envName}" (ID: ${environmentId})`);

  // Fetch full environment details to inspect services
  const envDetails = await dokployRequest(`/environment.one?environmentId=${environmentId}`);
  const composes = envDetails.compose || [];
  const postgreSqls = envDetails.postgres || [];
  const redises = envDetails.redis || [];
  const applications = envDetails.applications || envDetails.application || [];

  console.log('\nResources found in environment:');
  console.log(`  📦 Compose stacks:   ${composes.length} (${composes.map((c) => c.name).join(', ') || 'none'})`);
  console.log(`  🐘 PostgreSQL DBs:   ${postgreSqls.length} (${postgreSqls.map((p) => p.name).join(', ') || 'none'})`);
  console.log(`  🔴 Redis instances:  ${redises.length} (${redises.map((r) => r.name).join(', ') || 'none'})`);
  if (applications.length > 0) {
    console.log(`  🚀 Applications:     ${applications.length} (${applications.map((a) => a.name).join(', ')})`);
  }
  console.log(`  🌐 Network:          ${envName}-net`);

  // Confirmation prompt (if interactive and --force not supplied)
  if (!force) {
    const answer = await askConfirmation(
      `\n\x1b[33m⚠️  Are you sure you want to completely STOP and DELETE all resources in "${envName}"? (y/N): \x1b[0m`
    );
    if (answer !== 'y' && answer !== 'yes') {
      console.log('\n❌ Aborted by user.');
      process.exit(0);
    }
  }

  // 2. Step 1: Stop all services
  console.log('\n\x1b[33m--- STEP 1: STOPPING SERVICES ---\x1b[0m');

  for (const c of composes) {
    console.log(`⏹️  Stopping compose stack "${c.name}" (${c.composeId})...`);
    try {
      await dokployRequest('/compose.stop', 'POST', { composeId: c.composeId });
      console.log(`  ✅ Stopped compose stack "${c.name}"`);
    } catch (err) {
      console.warn(`  ⚠️  Warning while stopping compose "${c.name}": ${err.message}`);
    }
  }

  for (const pg of postgreSqls) {
    console.log(`⏹️  Stopping PostgreSQL "${pg.name}" (${pg.postgresId})...`);
    try {
      await dokployRequest('/postgres.stop', 'POST', { postgresId: pg.postgresId });
      console.log(`  ✅ Stopped PostgreSQL "${pg.name}"`);
    } catch (err) {
      console.warn(`  ⚠️  Warning while stopping PostgreSQL "${pg.name}": ${err.message}`);
    }
  }

  for (const r of redises) {
    console.log(`⏹️  Stopping Redis "${r.name}" (${r.redisId})...`);
    try {
      await dokployRequest('/redis.stop', 'POST', { redisId: r.redisId });
      console.log(`  ✅ Stopped Redis "${r.name}"`);
    } catch (err) {
      console.warn(`  ⚠️  Warning while stopping Redis "${r.name}": ${err.message}`);
    }
  }

  for (const app of applications) {
    console.log(`⏹️  Stopping application "${app.name}" (${app.applicationId})...`);
    try {
      await dokployRequest('/application.stop', 'POST', { applicationId: app.applicationId });
      console.log(`  ✅ Stopped application "${app.name}"`);
    } catch (err) {
      console.warn(`  ⚠️  Warning while stopping application "${app.name}": ${err.message}`);
    }
  }

  // Brief pause to allow container runtimes to release resources
  await new Promise((r) => setTimeout(r, 2500));

  // 3. Step 2: Delete Traefik Domains
  console.log('\n\x1b[33m--- STEP 2: REMOVING DOMAINS ---\x1b[0m');
  for (const c of composes) {
    try {
      const domains = (await dokployRequest(`/domain.byComposeId?composeId=${c.composeId}`)) || [];
      for (const dom of domains) {
        console.log(`🌐 Removing domain https://${dom.host}${dom.path || ''} (${dom.domainId})...`);
        try {
          await dokployRequest('/domain.delete', 'POST', { domainId: dom.domainId });
          console.log('  ✅ Domain removed');
        } catch (err) {
          console.warn(`  ⚠️  Could not remove domain: ${err.message}`);
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Step 3: Delete Services and their Volumes
  console.log('\n\x1b[33m--- STEP 3: DELETING APPLICATIONS AND SERVICES ---\x1b[0m');

  for (const c of composes) {
    console.log(`🗑️  Deleting compose stack "${c.name}" (${c.composeId})...`);
    try {
      await dokployRequest('/compose.delete', 'POST', {
        composeId: c.composeId,
        deleteVolumes: true,
      });
      console.log(`  ✅ Deleted compose stack "${c.name}"`);
    } catch (err) {
      console.error(`  ❌ Failed to delete compose "${c.name}": ${err.message}`);
    }
  }

  for (const pg of postgreSqls) {
    console.log(`🗑️  Deleting PostgreSQL "${pg.name}" (${pg.postgresId})...`);
    try {
      await dokployRequest('/postgres.remove', 'POST', { postgresId: pg.postgresId });
      console.log(`  ✅ Deleted PostgreSQL "${pg.name}"`);
    } catch (err) {
      console.error(`  ❌ Failed to delete PostgreSQL "${pg.name}": ${err.message}`);
    }
  }

  for (const r of redises) {
    console.log(`🗑️  Deleting Redis "${r.name}" (${r.redisId})...`);
    try {
      await dokployRequest('/redis.remove', 'POST', { redisId: r.redisId });
      console.log(`  ✅ Deleted Redis "${r.name}"`);
    } catch (err) {
      console.error(`  ❌ Failed to delete Redis "${r.name}": ${err.message}`);
    }
  }

  for (const app of applications) {
    console.log(`🗑️  Deleting application "${app.name}" (${app.applicationId})...`);
    try {
      await dokployRequest('/application.delete', 'POST', { applicationId: app.applicationId });
      console.log(`  ✅ Deleted application "${app.name}"`);
    } catch (err) {
      console.error(`  ❌ Failed to delete application "${app.name}": ${err.message}`);
    }
  }

  // Brief pause for Docker daemon to detach endpoints from overlay network
  await new Promise((r) => setTimeout(r, 3000));

  // 5. Step 4: Remove Isolated Overlay Network
  if (keepNetwork) {
    console.log(`\n⏩ Flag --keep-network: network removal skipped.`);
  } else {
    console.log('\n\x1b[33m--- STEP 4: REMOVING ISOLATED NETWORK ---\x1b[0m');
    const envNetName = `${envName}-net`;
    const allNetworks = (await dokployRequest('/network.all')) || [];
    const envNet = allNetworks.find((n) => n.name === envNetName);

    if (envNet) {
      console.log(`🌐 Removing overlay network "${envNetName}" (${envNet.networkId})...`);
      let removed = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await dokployRequest('/network.remove', 'POST', { networkId: envNet.networkId });
          console.log(`  ✅ Network "${envNetName}" removed.`);
          removed = true;
          break;
        } catch (err) {
          if (attempt < 5) {
            console.log(`  ... network still in use, retrying in 2s (attempt ${attempt}/5)...`);
            await new Promise((r) => setTimeout(r, 2000));
          } else {
            console.warn(`  ⚠️  Could not remove network "${envNetName}": ${err.message}`);
          }
        }
      }
      if (!removed) {
        console.warn(`  ℹ️  Network may be automatically cleaned up once all container records expire.`);
      }
    } else {
      console.log(`ℹ️  Network "${envNetName}" was not found or was already removed.`);
    }
  }

  // 6. Step 5: Remove Environment from Project
  console.log('\n\x1b[33m--- STEP 5: REMOVING ENVIRONMENT ---\x1b[0m');
  console.log(`🗑️  Removing environment "${envName}" (ID: ${environmentId})...`);
  await dokployRequest('/environment.remove', 'POST', { environmentId });
  console.log(`✅ Environment "${envName}" removed from project.`);

  console.log(`\n\x1b[32m🎉 Environment "${envName}" successfully destroyed!\x1b[0m\n`);
}

main().catch((err) => {
  console.error('\n\x1b[31m❌ Script execution error:\x1b[0m', err.message);
  process.exit(1);
});
