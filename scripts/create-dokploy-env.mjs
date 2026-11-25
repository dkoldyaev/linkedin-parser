#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';
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
  npm run dokploy:deploy -- [environment-name] [options]
  node scripts/create-dokploy-env.mjs [environment-name] [options]

Options:
  --branch <name>          Git branch to deploy (default: current git branch)
  --app-name <name>        Compose application name in Dokploy (default: app)
  --reset-db               Reset database volumes on deploy (freshVolumes)
  --mock-data              Enable fake mock vacancies generation via Symfony mock:create (CREATE_MOCK_DATA=true)
  --mock-llm               Use mock LLM service with random delay (LLM_PROVIDER=mock)
  --admin <email>          Assign admin role via Symfony user:make_admin (default: ADMIN_EMAILS from .env or dkoldyaev@gmail.com)
  --skip-deploy            Create and configure environment without triggering deploy
  --check                  Perform HTTP check of deployed services
  -h, --help               Show help

Examples:
  npm run dokploy:deploy
  npm run dokploy:deploy -- --mock-data
  npm run dokploy:deploy -- --admin user@example.com
  npm run dokploy:deploy -- dev
  npm run dokploy:deploy -- feature-quiz --branch feature-quiz
  npm run dokploy:deploy -- feature-quiz --mock-data
`);
  process.exit(0);
}

const resetDb = args.includes('--reset-db') || args.includes('--recreate-db') || args.includes('--fresh-volumes');
const enableMockData = args.includes('--mock-data') || args.includes('--mocks') || args.includes('--create-mock-data');
const enableMockLlm = args.includes('--mock-llm');
const skipDeploy = args.includes('--skip-deploy') || args.includes('--no-deploy');
const runCheck = args.includes('--check');
const customBranch = getArgValue('--branch');
const customAppName = getArgValue('--app-name') !== null ? getArgValue('--app-name') : 'app';
const customAdminArg = getArgValue('--admin');

const positionalArgs = args.filter((a) => {
  if (a.startsWith('--')) return false;
  const prevIdx = args.indexOf(a) - 1;
  if (
    prevIdx >= 0 &&
    [
      '--branch',
      '--app-name',
      '--admin',
    ].includes(args[prevIdx])
  ) {
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
  throw new Error('Unable to determine current git branch. Please specify --branch <branch-name>');
}

const gitBranch = customBranch !== null ? customBranch : getCurrentGitBranch();
const rawEnvName = positionalArgs.length > 0 ? positionalArgs[0] : gitBranch;
const envName = rawEnvName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

// 3. Load .env file with optional fallback to process.env / credentials.env
function loadEnv(filePath) {
  const env = {};
  const candidateFiles = [
    '/home/developer/.config/secrets/credentials.env',
    filePath,
  ];
  for (const candidate of candidateFiles) {
    if (!fs.existsSync(candidate)) continue;
    const content = fs.readFileSync(candidate, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const cleanLine = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
      const eqIdx = cleanLine.indexOf('=');
      if (eqIdx !== -1) {
        const key = cleanLine.substring(0, eqIdx).trim();
        let val = cleanLine.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const envVars = loadEnv(ENV_FILE_PATH);
const projectName = envVars['PROJECT_NAME'] || process.env.PROJECT_NAME || 'linkedin-parser';

function requireEnvVar(name) {
  const value = envVars[name] !== undefined && envVars[name] !== '' ? envVars[name] : process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Strict Configuration Error: Missing required environment variable "${name}"`);
  }
  return value;
}

const DOKPLOY_URL_RAW = envVars['DOKPLOY_URL'] || process.env.DOKPLOY_URL || 'https://dokploy.build.dkoldyaev.com';
const BASE_URL = `${DOKPLOY_URL_RAW.replace(/\/+$/, '')}/api`;
const API_KEY = requireEnvVar('DOKPLOY_API_KEY');

function dokployRequest(endpoint, method, body) {
  const httpMethod = method || 'GET';
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      method: httpMethod,
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

// 4. Generate Compose environment variables
function generateComposeEnv({ domainHost, composeAppName, pgAppName, pgUser, pgPassword, pgDbName, redisAppName, redisPassword, adminEmails }) {
  const postgresUrl = `postgresql://${pgUser}:${pgPassword}@${pgAppName}:5432/${pgDbName}?serverVersion=16&charset=utf8`;
  const redisUrl = `redis://default:${redisPassword}@${redisAppName}:6379/0`;
  const fullDomain = `https://${domainHost}`;
  const createMockData = enableMockData ? 'true' : (envVars['CREATE_MOCK_DATA'] || 'false');
  const llmProvider = (enableMockLlm || enableMockData) ? 'mock' : (envVars['LLM_PROVIDER'] || 'mistral');
  const appPrefix = composeAppName || envName;
  const backendInternalHost = `${appPrefix}-linkedin-parser-app`;
  const mercureInternalHost = `${appPrefix}-linkedin-parser-mercure`;
  const parserInternalHost = `${appPrefix}-linkedin-parser-parser-api`;

  const jwtSecret = envVars['JWT_SECRET'] || process.env.JWT_SECRET || crypto.randomBytes(36).toString('base64url');
  const mercureJwtSecret = envVars['MERCURE_JWT_SECRET'] || process.env.MERCURE_JWT_SECRET || crypto.randomBytes(36).toString('base64url');

  return [
    `APP_ENV=prod`,
    `APP_SECRET=${jwtSecret}`,
    `SERVER_NAME=:8000`,
    `APP_NAME_PREFIX=${appPrefix}`,
    `APP_URL=${fullDomain}`,
    `DEFAULT_URI=${fullDomain}`,
    `BACKEND_INTERNAL_URL=http://${backendInternalHost}:8000`,
    `DATABASE_URL=${postgresUrl}`,
    `BROKER_URL=${redisUrl}`,
    `MESSENGER_TRANSPORT_DSN=doctrine://default?auto_setup=0`,
    `PARSER_API_URL=http://${parserInternalHost}:4000`,
    `LLM_PROVIDER=${llmProvider}`,
    `MISTRAL_API_KEY=${envVars['MISTRAL_API_KEY'] || ''}`,
    `MISTRAL_MODEL=${envVars['MISTRAL_MODEL'] || 'mistral-small-latest'}`,
    `GEMINI_API_KEY=${envVars['GEMINI_API_KEY'] || ''}`,
    `GEMINI_MODEL=${envVars['GEMINI_MODEL'] || 'gemini-2.5-flash'}`,
    `MERCURE_URL=http://${mercureInternalHost}/.well-known/mercure`,
    `MERCURE_PUBLIC_URL=${fullDomain}/.well-known/mercure`,
    `MERCURE_JWT_SECRET=${mercureJwtSecret}`,
    `MERCURE_JWT_ISSUER=linkedin-parser`,
    `GOOGLE_CLIENT_ID=${envVars['GOOGLE_CLIENT_ID'] || ''}`,
    `GOOGLE_CLIENT_SECRET=${envVars['GOOGLE_CLIENT_SECRET'] || ''}`,
    `GOOGLE_REDIRECT_URI=${envVars['GOOGLE_REDIRECT_URI'] || ''}`,
    `JWT_SECRET=${jwtSecret}`,
    `DEV_AUTH=true`,
    `CREATE_MOCK_DATA=${createMockData}`,
    `EXTENSION_ID=${envVars['EXTENSION_ID'] || ''}`,
    `ADMIN_EMAILS=${adminEmails || ''}`,
    `ADMIN_EMAIL=${envVars['ADMIN_EMAIL'] || adminEmails || 'dkoldyaev@gmail.com'}`,
    `ADMIN_PASSWORD=${envVars['ADMIN_PASSWORD'] || 'AdminSecure2026!'}`,
    `PORT=8000`,
  ].join('\n');
}

async function runSymfonyCliCommandsViaSchedule(composeId, composeAppName, adminEmails, shouldCreateMocks) {
  const cliParts = [];
  if (adminEmails) {
    for (const email of adminEmails.split(',').map((e) => e.trim()).filter(Boolean)) {
      cliParts.push(`php bin/console user:create ${email} --admin --no-interaction`);
      cliParts.push(`php bin/console user:make_admin ${email} --no-interaction`);
    }
  }
  if (shouldCreateMocks) {
    cliParts.push('php bin/console mock:create --force --no-interaction');
  }

  if (cliParts.length === 0) return;

  const fullCommand = cliParts.join(' && ');
  console.log(`\n⚙️  Running Symfony CLI commands inside container (${fullCommand})...`);

  try {
    const existingSchedules = (await dokployRequest(`/schedule.list?id=${composeId}&scheduleType=compose`)) || [];
    let cliSchedule = Array.isArray(existingSchedules)
      ? existingSchedules.find((s) => s.name === 'symfony-cli-init')
      : null;

    if (!cliSchedule) {
      cliSchedule = await dokployRequest('/schedule.create', 'POST', {
        name: 'symfony-cli-init',
        cronExpression: '0 0 31 2 *',
        appName: composeAppName,
        serviceName: 'app',
        shellType: 'sh',
        scheduleType: 'compose',
        command: fullCommand,
        composeId: composeId,
        enabled: false,
      });
    } else {
      await dokployRequest('/schedule.update', 'POST', {
        scheduleId: cliSchedule.scheduleId,
        name: 'symfony-cli-init',
        cronExpression: '0 0 31 2 *',
        appName: composeAppName,
        serviceName: 'app',
        shellType: 'sh',
        scheduleType: 'compose',
        command: fullCommand,
        composeId: composeId,
        enabled: false,
      });
    }

    const scheduleId = cliSchedule?.scheduleId || (
      ((await dokployRequest(`/schedule.list?id=${composeId}&scheduleType=compose`)) || []).find((s) => s.name === 'symfony-cli-init')?.scheduleId
    );

    if (scheduleId) {
      await dokployRequest('/schedule.runManually', 'POST', { scheduleId });
      console.log('  ✅ Symfony CLI commands (user:create, user:make_admin, mock:create) executed!');
    }
  } catch (err) {
    console.log(`  ℹ️  Note: Symfony CLI commands are also executed automatically by docker-entrypoint.sh on startup (${err.message}).`);
  }
}

async function main() {
  console.log(`\n\x1b[36m=== Dokploy Deployment: "${envName}" ===\x1b[0m\n`);
  console.log(`📌 Git branch: \x1b[32m${gitBranch}\x1b[0m`);
  console.log(`📌 Environment name: \x1b[32m${envName}\x1b[0m`);
  if (enableMockData) {
    console.log(`📌 Mock data generation: \x1b[33mENABLED (CREATE_MOCK_DATA=true + php bin/console mock:create)\x1b[0m`);
  }
  if (enableMockLlm) {
    console.log(`📌 Mock LLM service: \x1b[33mENABLED (LLM_PROVIDER=mock)\x1b[0m`);
  }

  // 1. Fetch Project and GitHub provider
  console.log(`🔍 Connecting to Dokploy and searching for project "${projectName}"...`);
  const projects = await dokployRequest('/project.all');
  const project = (projects || []).find((p) => p.name?.toLowerCase() === projectName.toLowerCase());
  if (!project) {
    throw new Error(`Project "${projectName}" not found in Dokploy!`);
  }
  const projectId = project.projectId;

  const githubProviders = await dokployRequest('/github.githubProviders');
  const githubProvider = (githubProviders || []).find(
    (g) =>
      g.gitProvider?.name?.includes('Dokploy-dkoldyaev') ||
      g.githubAppName?.includes('dokploy-dkoldyaev')
  ) || (githubProviders || [])[0];

  if (!githubProvider) {
    throw new Error('GitHub provider not found in Dokploy!');
  }
  const githubId = githubProvider.githubId;

  console.log(`✅ Project: ${project.name} (${projectId})`);
  console.log(`✅ GitHub Provider: ${githubProvider.githubAppName || githubProvider.gitProvider?.name} (${githubId})`);

  // 2. Find or Create Environment
  let projectDetails = await dokployRequest(`/project.one?projectId=${projectId}`);
  let env = (projectDetails.environments || []).find((e) => e.name === envName);

  if (!env) {
    console.log(`\n🚀 Creating new environment "${envName}"...`);
    env = await dokployRequest('/environment.create', 'POST', {
      name: envName,
      projectId: projectId,
      description: `Automatically created for branch ${gitBranch}`,
    });
    console.log(`✅ Environment created (ID: ${env.environmentId})`);
  } else {
    console.log(`\nℹ️  Environment already exists (ID: ${env.environmentId})`);
  }

  const environmentId = env.environmentId;
  const envDetails = await dokployRequest(`/environment.one?environmentId=${environmentId}`);

  // 3. Setup Isolated Environment Overlay Network
  console.log(`\n🌐 Checking isolated network for environment "${envName}"...`);
  const envNetName = `${envName}-net`;
  const allNetworks = (await dokployRequest('/network.all')) || [];
  let envNet = allNetworks.find((n) => n.name === envNetName);

  if (!envNet) {
    console.log(`🚀 Creating isolated overlay network "${envNetName}"...`);
    envNet = await dokployRequest('/network.create', 'POST', {
      name: envNetName,
      driver: 'overlay',
      attachable: true,
    });
    console.log(`✅ Network created (ID: ${envNet.networkId})`);
  } else {
    console.log(`ℹ️  Network "${envNetName}" already exists (ID: ${envNet.networkId})`);
  }

  // 4. Find or Create PostgreSQL Database
  console.log('\n🐘 Checking PostgreSQL database service...');
  const existingPgList = envDetails.postgres || [];
  let pgService = existingPgList.find((p) => p.name === 'db') || existingPgList[0];

  if (!pgService) {
    console.log('🚀 Creating PostgreSQL service "db"...');
    const pgPassword = crypto.randomBytes(12).toString('hex');
    const createdPg = await dokployRequest('/postgres.create', 'POST', {
      name: 'db',
      databaseName: 'postgres',
      databaseUser: 'postgres',
      databasePassword: pgPassword,
      dockerImage: 'postgres:16-alpine',
      environmentId: environmentId,
    });
    console.log(`✅ PostgreSQL created (ID: ${createdPg.postgresId}). Attaching to ${envNetName}...`);
    await dokployRequest('/postgres.update', 'POST', {
      postgresId: createdPg.postgresId,
      networkIds: [envNet.networkId],
      detachDokployNetwork: true,
    });
    await dokployRequest('/postgres.deploy', 'POST', {
      postgresId: createdPg.postgresId,
    });
    pgService = await dokployRequest(`/postgres.one?postgresId=${createdPg.postgresId}`);
    console.log(`✅ PostgreSQL deployed: ${pgService.appName}`);
  } else {
    pgService = await dokployRequest(`/postgres.one?postgresId=${pgService.postgresId}`);
    if (!pgService.networkIds?.includes(envNet.networkId) || !pgService.detachDokployNetwork) {
      console.log(`🔄 Updating PostgreSQL to attach to ${envNetName} and detach from dokploy-network...`);
      await dokployRequest('/postgres.update', 'POST', {
        postgresId: pgService.postgresId,
        networkIds: [envNet.networkId],
        detachDokployNetwork: true,
      });
      await dokployRequest('/postgres.deploy', 'POST', {
        postgresId: pgService.postgresId,
      });
      pgService = await dokployRequest(`/postgres.one?postgresId=${pgService.postgresId}`);
    }
    console.log(`ℹ️  PostgreSQL ready: ${pgService.appName}`);
  }

  // 5. Find or Create Redis Service
  console.log('\n🔴 Checking Redis service...');
  const existingRedisList = envDetails.redis || [];
  let redisService = existingRedisList.find((r) => r.name === 'redis') || existingRedisList[0];

  if (!redisService) {
    console.log('🚀 Creating Redis service "redis"...');
    const redisPassword = crypto.randomBytes(12).toString('hex');
    const createdRedis = await dokployRequest('/redis.create', 'POST', {
      name: 'redis',
      databasePassword: redisPassword,
      dockerImage: 'redis:7',
      environmentId: environmentId,
    });
    console.log(`✅ Redis created (ID: ${createdRedis.redisId}). Attaching to ${envNetName}...`);
    await dokployRequest('/redis.update', 'POST', {
      redisId: createdRedis.redisId,
      networkIds: [envNet.networkId],
      detachDokployNetwork: true,
    });
    await dokployRequest('/redis.deploy', 'POST', {
      redisId: createdRedis.redisId,
    });
    redisService = await dokployRequest(`/redis.one?redisId=${createdRedis.redisId}`);
    console.log(`✅ Redis deployed: ${redisService.appName}`);
  } else {
    redisService = await dokployRequest(`/redis.one?redisId=${redisService.redisId}`);
    if (!redisService.networkIds?.includes(envNet.networkId) || !redisService.detachDokployNetwork) {
      console.log(`🔄 Updating Redis to attach to ${envNetName} and detach from dokploy-network...`);
      await dokployRequest('/redis.update', 'POST', {
        redisId: redisService.redisId,
        networkIds: [envNet.networkId],
        detachDokployNetwork: true,
      });
      await dokployRequest('/redis.deploy', 'POST', {
        redisId: redisService.redisId,
      });
      redisService = await dokployRequest(`/redis.one?redisId=${redisService.redisId}`);
    }
    console.log(`ℹ️  Redis ready: ${redisService.appName}`);
  }

  // 6. Find or Create Compose Application
  console.log('\n📦 Checking Compose application...');
  const existingComposes = envDetails.compose || [];
  let composeApp = existingComposes.find((c) => c.name === customAppName) || existingComposes[0];

  if (!composeApp) {
    console.log(`🚀 Creating compose application "${customAppName}"...`);
    composeApp = await dokployRequest('/compose.create', 'POST', {
      name: customAppName,
      environmentId: environmentId,
      sourceType: 'github',
      composeType: 'docker-compose',
    });
    console.log(`✅ Compose application created (ID: ${composeApp.composeId})`);
  } else {
    console.log(`ℹ️  Compose application already exists (ID: ${composeApp.composeId}, name: ${composeApp.name})`);
  }

  const composeId = composeApp.composeId;
  composeApp = await dokployRequest(`/compose.one?composeId=${composeId}`);

  // 7. Generate and save environment variables
  const DOKPLOY_BASE_DOMAIN = envVars['DOKPLOY_BASE_DOMAIN'] || process.env.DOKPLOY_BASE_DOMAIN || '.linkedinparser.build.dkoldyaev.com';
  const normalizedBase = DOKPLOY_BASE_DOMAIN.startsWith('.') ? DOKPLOY_BASE_DOMAIN : `.${DOKPLOY_BASE_DOMAIN}`;
  const projectSlug = projectName.replace(/[^a-zA-Z0-9]/g, '');
  const domainHost = normalizedBase.includes(projectSlug)
    ? `${envName}${normalizedBase}`
    : `${envName}.${projectSlug}${normalizedBase}`;
  const adminEmails = customAdminArg || envVars['ADMIN_EMAILS'] || 'dkoldyaev@gmail.com';

  const composeEnv = generateComposeEnv({
    domainHost,
    composeAppName: composeApp.appName,
    pgAppName: pgService.appName,
    pgUser: pgService.databaseUser,
    pgPassword: pgService.databasePassword,
    pgDbName: pgService.databaseName,
    redisAppName: redisService.appName,
    redisPassword: redisService.databasePassword,
    adminEmails,
  });

  const serviceNetworks = [
    { serviceName: 'frontend', networkIds: [envNet.networkId], detachDokployNetwork: false },
    { serviceName: 'app', networkIds: [envNet.networkId], detachDokployNetwork: false },
    { serviceName: 'mercure', networkIds: [envNet.networkId], detachDokployNetwork: false },
    { serviceName: 'parser-api', networkIds: [envNet.networkId], detachDokployNetwork: false },
  ];

  console.log('\n⚙️  Configuring Compose application settings...');
  await dokployRequest('/compose.update', 'POST', {
    composeId: composeId,
    name: customAppName,
    sourceType: 'github',
    repository: projectName,
    owner: 'dkoldyaev',
    branch: gitBranch,
    githubId: githubId,
    composePath: './docker-compose.yml',
    composeType: 'docker-compose',
    isolatedDeployment: false,
    autoDeploy: true,
    triggerType: 'push',
    command: '',
    env: composeEnv,
    serviceNetworks,
  });

  await dokployRequest('/compose.saveEnvironment', 'POST', {
    composeId: composeId,
    env: composeEnv,
    createEnvFile: true,
  });

  await dokployRequest('/environment.update', 'POST', {
    environmentId: environmentId,
    env: composeEnv,
  });

  console.log(`✅ Repository dkoldyaev/${projectName} (${gitBranch}), composePath: ./docker-compose.yml`);
  console.log('✅ Environment variables saved (compose + environment level)');
  console.log(`✅ Connected services (frontend, app, mercure, parser-api) to isolated network "${envNetName}"`);

  // 8. Setup Traefik Domains
  console.log('\n🌐 Configuring Traefik domain routes...');
  const existingDomains = (await dokployRequest(`/domain.byComposeId?composeId=${composeId}`)) || [];

  const requiredDomains = [
    { host: domainHost, path: '/', port: 3000, serviceName: 'frontend', label: 'Vite SPA Frontend' },
    { host: domainHost, path: '/api', port: 8000, serviceName: 'app', label: 'Symfony Backend API' },
    { host: domainHost, path: '/admin', port: 8000, serviceName: 'app', label: 'Symfony EasyAdmin' },
    { host: domainHost, path: '/bundles', port: 8000, serviceName: 'app', label: 'Symfony Bundle Assets' },
    { host: domainHost, path: '/admin-assets', port: 8000, serviceName: 'app', label: 'Symfony Admin Assets' },
    { host: domainHost, path: '/extension.zip', port: 8000, serviceName: 'app', label: 'Browser Extension Zip' },
    { host: domainHost, path: '/.well-known/mercure', port: 80, serviceName: 'mercure', label: 'Mercure SSE' },
  ];

  for (const dom of requiredDomains) {
    const existing = existingDomains.find(
      (d) => d.host === dom.host && (d.path === dom.path || (!d.path && dom.path === '/')) && d.serviceName === dom.serviceName
    );

    if (existing) {
      console.log(`  🔄 Updating existing domain for ${dom.label} (${dom.path} -> ${dom.serviceName}:${dom.port})...`);
      await dokployRequest('/domain.update', 'POST', {
        domainId: existing.domainId,
        host: dom.host,
        path: dom.path,
        port: dom.port,
        serviceName: dom.serviceName,
        https: true,
        certificateType: 'letsencrypt',
        domainType: 'compose',
        enabled: true,
        stripPath: false,
      });
      console.log('  ✅ Domain updated');
    } else {
      console.log(`  ➕ Creating domain https://${dom.host}${dom.path} -> ${dom.serviceName}:${dom.port} (${dom.label})...`);
      await dokployRequest('/domain.create', 'POST', {
        composeId: composeId,
        host: dom.host,
        path: dom.path,
        port: dom.port,
        serviceName: dom.serviceName,
        domainType: 'compose',
        https: true,
        certificateType: 'letsencrypt',
        stripPath: false,
      });
      console.log('  ✅ Domain created');
    }
  }

  for (const existing of existingDomains) {
    const isRequired = requiredDomains.some(
      (dom) => dom.host === existing.host && (dom.path === existing.path || (!existing.path && dom.path === '/')) && dom.serviceName === existing.serviceName
    );
    if (!isRequired) {
      console.log(`  🗑️  Deleting obsolete domain https://${existing.host}${existing.path || ''} -> ${existing.serviceName}:${existing.port}...`);
      await dokployRequest('/domain.delete', 'POST', { domainId: existing.domainId });
    }
  }

  // 9. Trigger Deploy
  if (skipDeploy) {
    console.log('\n⏩ Flag --skip-deploy: deployment skipped.');
  } else {
    console.log('\n🚀 Triggering compose stack deployment...');
    const deployTriggerTime = Date.now() - 2000;
    await dokployRequest('/compose.deploy', 'POST', {
      composeId: composeId,
      title: `Deploy Compose (${envName})`,
      description: `Deploy compose for environment ${envName}, branch ${gitBranch}`,
      freshVolumes: resetDb,
    });
    console.log('✅ Deployment triggered!');

    console.log('\n⏳ Waiting for build and deployment to finish...');
    const deployTimeoutMs = 20 * 60 * 1000;
    const deployStart = Date.now();
    let finishedDeployment = null;

    while (Date.now() - deployStart < deployTimeoutMs) {
      let deployments = null;
      try {
        deployments = await dokployRequest(`/deployment.allByCompose?composeId=${composeId}`);
      } catch (pollErr) {
        process.stdout.write(`  ... waiting for Dokploy API during heavy build (${Math.round((Date.now() - deployStart) / 1000)}s): ${pollErr.message.slice(0, 60)}\r`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      const latest = deployments?.[0];

      if (latest && new Date(latest.createdAt).getTime() >= deployTriggerTime) {
        if (latest.status === 'done') {
          finishedDeployment = latest;
          console.log(`\n\n\x1b[32m✅ Deployment successfully completed in ${Math.round((Date.now() - deployStart) / 1000)}s!\x1b[0m`);
          break;
        }
        if (latest.status === 'error') {
          let errorLog = '';
          try {
            errorLog = await dokployRequest(`/deployment.readLogs?deploymentId=${latest.deploymentId}&tail=50`);
          } catch {
            // ignore
          }
          console.error(`\n\n\x1b[31m❌ Deployment failed with error: ${latest.errorMessage || 'Docker command failed'}\x1b[0m`);
          if (errorLog) {
            console.error('\nBuild logs:\n', errorLog);
          }
          console.error(`\n🌐 View detailed build logs in Dokploy dashboard:\n  ${DOKPLOY_URL_RAW}/dashboard/project/${projectId}/environment/${environmentId}/compose/${composeId}\n`);
          process.exit(1);
        }
        process.stdout.write(`  ... deployment status: \x1b[33m${latest.status}\x1b[0m (${Math.round((Date.now() - deployStart) / 1000)}s)\r`);
      }

      await new Promise((r) => setTimeout(r, 4000));
    }

    if (!finishedDeployment) {
      throw new Error('Deployment timeout reached (20 minutes). Please check Dokploy dashboard.');
    }
  }

  // 10. Wait for app and frontend containers to start and become ready
  if (!skipDeploy) {
    console.log('\n\x1b[34m🔍 Waiting for app and frontend containers to start up...\x1b[0m');
    const containerWaitStart = Date.now();
    let appContainerId = null;

    while (Date.now() - containerWaitStart < 120000) {
      const containers = (await dokployRequest('/docker.getContainers')) || [];
      const running = containers.find(
        (c) => c.name && c.name.includes(composeApp.appName) && c.name.includes('-app') && c.state === 'running'
      );
      if (running) {
        appContainerId = running.containerId;
        console.log(`  ✅ Found running Symfony app container: ${running.name}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    if (appContainerId) {
      console.log('  ⏳ Waiting for Symfony FrankenPHP startup log...');
      const startupWaitStart = Date.now();
      while (Date.now() - startupWaitStart < 120000) {
        try {
          const logs = await dokployRequest(`/compose.readLogs?composeId=${composeId}&containerId=${appContainerId}&tail=100`);
          if (logs && (logs.includes('Starting FrankenPHP') || logs.includes('Caddy') || logs.includes('Database initialized successfully'))) {
            console.log('\n\x1b[32m✅ Symfony Backend container started and initialized!\x1b[0m');
            break;
          }
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
    }

    // 11. Execute Symfony CLI commands (user:create, user:make_admin, mock:create)
    await runSymfonyCliCommandsViaSchedule(
      composeId,
      composeApp.appName,
      adminEmails,
      enableMockData || envVars['CREATE_MOCK_DATA'] === 'true'
    );
  }

  // 12. Optional Health Check
  if (runCheck) {
    console.log('\n--- VERIFYING DEPLOYED ENVIRONMENT ---');
    try {
      const feRes = await fetch(`https://${domainHost}/`);
      console.log(`Frontend SPA (https://${domainHost}/): ${feRes.status} ${feRes.statusText}`);
    } catch (err) {
      console.error(`❌ Frontend check failed: ${err.message}`);
    }

    try {
      const apiRes = await fetch(`https://${domainHost}/api/health`);
      const apiBody = await apiRes.text();
      console.log(`Symfony API Health (https://${domainHost}/api/health): ${apiRes.status} ${apiRes.statusText} -> ${apiBody}`);
    } catch (err) {
      console.error(`❌ API Health check failed: ${err.message}`);
    }

    try {
      const corsRes = await fetch(`https://${domainHost}/.well-known/mercure`, {
        method: 'OPTIONS',
        headers: {
          Origin: `https://${domainHost}`,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization',
        },
      });
      console.log(`Mercure OPTIONS preflight: ${corsRes.status}`);
    } catch (err) {
      console.error(`❌ Mercure check failed: ${err.message}`);
    }
  }

  // Summary
  console.log('\n\x1b[32m🎉 Environment successfully configured!\x1b[0m\n');
  console.log(`🌐 Dokploy Dashboard: ${DOKPLOY_URL_RAW}/dashboard/project/${projectId}/environment/${environmentId}/compose/${composeId}`);
  console.log(`💻 Frontend (SPA):     https://${domainHost}`);
  console.log(`🔗 Backend API:        https://${domainHost}/api/health`);
  console.log(`🛡️  Admin Panel:        https://${domainHost}/admin`);
  console.log(`📡 Mercure SSE:        https://${domainHost}/.well-known/mercure`);
  console.log(`🐘 Postgres AppName:   ${pgService.appName}`);
  console.log(`🔴 Redis AppName:      ${redisService.appName}`);
  console.log(`🌿 Git Branch:         ${gitBranch}\n`);
}

main().catch((err) => {
  console.error('\n\x1b[31m❌ Script execution error:\x1b[0m', err.message);
  process.exit(1);
});
