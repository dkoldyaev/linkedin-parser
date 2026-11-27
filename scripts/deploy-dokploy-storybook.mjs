#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
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
  pnpm run dokploy:deploy:storybook -- [environment-name] [options]
  node scripts/deploy-dokploy-storybook.mjs [environment-name] [options]

Options:
  --branch <name>          Git branch to deploy (default: current git branch)
  --app-name <name>        Application name in Dokploy (default: storybook)
  --dockerfile <path>      Dockerfile path (default: frontend/Dockerfile.storybook)
  --domain <host>          Custom domain host (default: storybook-<env>.<base-domain> or storybook.<base-domain>)
  --skip-deploy            Create and configure application without triggering deploy
  --check                  Perform HTTP check of deployed Storybook
  -h, --help               Show help

Examples:
  pnpm run dokploy:deploy:storybook
  pnpm run dokploy:deploy:storybook -- storybook
  pnpm run dokploy:deploy:storybook -- dev --branch main
  pnpm run dokploy:deploy:storybook -- --check
`);
  process.exit(0);
}

const skipDeploy = args.includes('--skip-deploy') || args.includes('--no-deploy');
const runCheck = args.includes('--check');
const customBranch = getArgValue('--branch');
const customAppName = getArgValue('--app-name') !== null ? getArgValue('--app-name') : 'storybook';
const customDockerfile =
  getArgValue('--dockerfile') !== null
    ? getArgValue('--dockerfile')
    : 'frontend/Dockerfile.storybook';
const customDomainArg = getArgValue('--domain');

const positionalArgs = args.filter((a) => {
  if (a.startsWith('--')) return false;
  const prevIdx = args.indexOf(a) - 1;
  if (
    prevIdx >= 0 &&
    ['--branch', '--app-name', '--dockerfile', '--domain'].includes(args[prevIdx])
  ) {
    return false;
  }
  return true;
});

// 2. Detect Git Branch
function getCurrentGitBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    }).trim();
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
  const candidateFiles = ['/home/developer/.config/secrets/credentials.env', filePath];
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
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
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
  const value =
    envVars[name] !== undefined && envVars[name] !== '' ? envVars[name] : process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Strict Configuration Error: Missing required environment variable "${name}"`);
  }
  return value;
}

const DOKPLOY_URL_RAW =
  envVars['DOKPLOY_URL'] || process.env.DOKPLOY_URL || 'https://dokploy.build.dkoldyaev.com';
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
            reject(
              new Error(`[${res.statusCode}] ${endpoint}: ${json.message || JSON.stringify(json)}`),
            );
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

function resolveStorybookDomainHost() {
  if (customDomainArg) return customDomainArg;
  const DOKPLOY_BASE_DOMAIN =
    envVars['DOKPLOY_BASE_DOMAIN'] ||
    process.env.DOKPLOY_BASE_DOMAIN ||
    '.linkedinparser.build.dkoldyaev.com';
  const normalizedBase = DOKPLOY_BASE_DOMAIN.startsWith('.')
    ? DOKPLOY_BASE_DOMAIN
    : `.${DOKPLOY_BASE_DOMAIN}`;
  const projectSlug = projectName.replace(/[^a-zA-Z0-9]/g, '');
  const subLabel =
    envName === 'storybook' || envName === 'main' || envName === 'master'
      ? 'storybook'
      : `storybook-${envName}`;

  return normalizedBase.includes(projectSlug)
    ? `${subLabel}${normalizedBase}`
    : `${subLabel}.${projectSlug}${normalizedBase}`;
}

async function main() {
  const domainHost = resolveStorybookDomainHost();

  console.log(`\n\x1b[36m=== Dokploy Storybook Deployment: "${envName}" ===\x1b[0m\n`);
  console.log(`📌 Git branch:       \x1b[32m${gitBranch}\x1b[0m`);
  console.log(`📌 Environment name: \x1b[32m${envName}\x1b[0m`);
  console.log(`📌 Application name: \x1b[32m${customAppName}\x1b[0m`);
  console.log(`📌 Dockerfile:       \x1b[32m${customDockerfile}\x1b[0m`);
  console.log(`📌 Target domain:    \x1b[32mhttps://${domainHost}\x1b[0m`);

  // 1. Fetch Project and GitHub provider
  console.log(`\n🔍 Connecting to Dokploy and searching for project "${projectName}"...`);
  const projects = await dokployRequest('/project.all');
  const project = (projects || []).find((p) => p.name?.toLowerCase() === projectName.toLowerCase());
  if (!project) {
    throw new Error(`Project "${projectName}" not found in Dokploy!`);
  }
  const projectId = project.projectId;

  const githubProviders = await dokployRequest('/github.githubProviders');
  const githubProvider =
    (githubProviders || []).find(
      (g) =>
        g.gitProvider?.name?.includes('Dokploy-dkoldyaev') ||
        g.githubAppName?.includes('dokploy-dkoldyaev'),
    ) || (githubProviders || [])[0];

  if (!githubProvider) {
    throw new Error('GitHub provider not found in Dokploy!');
  }
  const githubId = githubProvider.githubId;

  console.log(`✅ Project: ${project.name} (${projectId})`);
  console.log(
    `✅ GitHub Provider: ${githubProvider.githubAppName || githubProvider.gitProvider?.name} (${githubId})`,
  );

  // 2. Find or Create Environment
  const projectDetails = await dokployRequest(`/project.one?projectId=${projectId}`);
  let env = (projectDetails.environments || []).find((e) => e.name === envName);

  if (!env) {
    console.log(`\n🚀 Creating new environment "${envName}"...`);
    env = await dokployRequest('/environment.create', 'POST', {
      name: envName,
      projectId: projectId,
      description: `Automatically created for branch ${gitBranch} (Storybook)`,
    });
    console.log(`✅ Environment created (ID: ${env.environmentId})`);
  } else {
    console.log(`\nℹ️  Environment already exists (ID: ${env.environmentId})`);
  }

  const environmentId = env.environmentId;
  const envDetails = await dokployRequest(`/environment.one?environmentId=${environmentId}`);

  // 3. Find or Create Dokploy Application for Storybook
  console.log(`\n📦 Checking Storybook application "${customAppName}"...`);
  const existingApps = envDetails.applications || envDetails.application || [];
  let storybookApp = existingApps.find((a) => a.name === customAppName);

  if (!storybookApp) {
    console.log(`🚀 Creating application "${customAppName}"...`);
    storybookApp = await dokployRequest('/application.create', 'POST', {
      name: customAppName,
      environmentId: environmentId,
      description: `Blueprint UI-Kit Storybook (${gitBranch})`,
    });
    console.log(`✅ Application created (ID: ${storybookApp.applicationId})`);
  } else {
    console.log(
      `ℹ️  Application already exists (ID: ${storybookApp.applicationId}, name: ${storybookApp.name})`,
    );
  }

  const applicationId = storybookApp.applicationId;

  // 4. Configure GitHub Provider and Dockerfile Build Type
  console.log('\n⚙️  Configuring Storybook application settings...');
  await dokployRequest('/application.saveGithubProvider', 'POST', {
    applicationId,
    repository: projectName,
    owner: 'dkoldyaev',
    branch: gitBranch,
    githubId,
    buildPath: '/',
    enableSubmodules: true,
    triggerType: 'push',
  });

  await dokployRequest('/application.saveBuildType', 'POST', {
    applicationId,
    buildType: 'dockerfile',
    dockerfile: customDockerfile,
    dockerContextPath: '.',
    dockerBuildStage: '',
    herokuVersion: null,
    railpackVersion: null,
  });

  await dokployRequest('/application.update', 'POST', {
    applicationId,
    name: customAppName,
    sourceType: 'github',
    repository: projectName,
    owner: 'dkoldyaev',
    branch: gitBranch,
    githubId,
    buildPath: '/',
    enableSubmodules: true,
    buildType: 'dockerfile',
    dockerfile: customDockerfile,
    dockerContextPath: '.',
    dockerBuildStage: '',
    autoDeploy: true,
    triggerType: 'push',
  });

  console.log(
    `✅ Repository dkoldyaev/${projectName} (${gitBranch}), dockerfile: ${customDockerfile}`,
  );

  // 5. Setup Traefik Domain (Port 80 for nginx static container)
  console.log('\n🌐 Configuring Traefik domain route...');
  const existingDomains =
    (await dokployRequest(`/domain.byApplicationId?applicationId=${applicationId}`)) || [];

  const targetPort = 80;
  const targetPath = '/';
  const existing = existingDomains.find(
    (d) => d.host === domainHost && (d.path === targetPath || !d.path),
  );

  if (existing) {
    console.log(`  🔄 Updating existing domain https://${domainHost} -> :${targetPort}...`);
    await dokployRequest('/domain.update', 'POST', {
      domainId: existing.domainId,
      host: domainHost,
      path: targetPath,
      port: targetPort,
      https: true,
      certificateType: 'letsencrypt',
      domainType: 'application',
    });
    console.log('  ✅ Domain updated');
  } else {
    console.log(`  ➕ Creating domain https://${domainHost} -> :${targetPort}...`);
    await dokployRequest('/domain.create', 'POST', {
      applicationId,
      host: domainHost,
      path: targetPath,
      port: targetPort,
      domainType: 'application',
      https: true,
      certificateType: 'letsencrypt',
    });
    console.log('  ✅ Domain created');
  }

  for (const dom of existingDomains) {
    if (dom.host !== domainHost) {
      console.log(`  🗑️  Deleting obsolete domain https://${dom.host}${dom.path || ''}...`);
      await dokployRequest('/domain.delete', 'POST', { domainId: dom.domainId });
    }
  }

  // 6. Trigger Deploy
  if (skipDeploy) {
    console.log('\n⏩ Flag --skip-deploy: deployment skipped.');
  } else {
    console.log('\n🚀 Triggering Storybook build and deployment...');
    const deployTriggerTime = Date.now() - 2000;
    await dokployRequest('/application.deploy', 'POST', {
      applicationId,
      title: `Deploy Storybook (${envName})`,
      description: `Deploy Storybook for environment ${envName}, branch ${gitBranch}`,
    });
    console.log('✅ Deployment triggered!');

    console.log('\n⏳ Waiting for Storybook build and deployment to finish...');
    const deployTimeoutMs = 15 * 60 * 1000;
    const deployStart = Date.now();
    let finishedDeployment = null;

    while (Date.now() - deployStart < deployTimeoutMs) {
      let deployments = null;
      try {
        deployments = await dokployRequest(`/deployment.all?applicationId=${applicationId}`);
      } catch (pollErr) {
        process.stdout.write(
          `  ... waiting for Dokploy API (${Math.round((Date.now() - deployStart) / 1000)}s): ${pollErr.message.slice(0, 60)}\r`,
        );
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      const latest = deployments?.[0];

      if (latest && new Date(latest.createdAt).getTime() >= deployTriggerTime) {
        if (latest.status === 'done') {
          finishedDeployment = latest;
          console.log(
            `\n\n\x1b[32m✅ Storybook deployment completed in ${Math.round((Date.now() - deployStart) / 1000)}s!\x1b[0m`,
          );
          break;
        }
        if (latest.status === 'error') {
          let errorLog = '';
          try {
            errorLog = await dokployRequest(
              `/deployment.readLogs?deploymentId=${latest.deploymentId}&tail=50`,
            );
          } catch {
            // ignore
          }
          console.error(
            `\n\n\x1b[31m❌ Storybook deployment failed: ${latest.errorMessage || 'Docker build failed'}\x1b[0m`,
          );
          if (errorLog) {
            console.error('\nBuild logs:\n', errorLog);
          }
          console.error(
            `\n🌐 View detailed build logs in Dokploy dashboard:\n  ${DOKPLOY_URL_RAW}/dashboard/project/${projectId}/environment/${environmentId}/services/application/${applicationId}\n`,
          );
          process.exit(1);
        }
        process.stdout.write(
          `  ... deployment status: \x1b[33m${latest.status}\x1b[0m (${Math.round((Date.now() - deployStart) / 1000)}s)\r`,
        );
      }

      await new Promise((r) => setTimeout(r, 4000));
    }

    if (!finishedDeployment) {
      throw new Error('Deployment timeout reached (15 minutes). Please check Dokploy dashboard.');
    }
  }

  // 7. Optional Health Check
  if (runCheck) {
    console.log('\n--- VERIFYING DEPLOYED STORYBOOK ---');
    try {
      const sbRes = await fetch(`https://${domainHost}/`);
      console.log(`Storybook UI (https://${domainHost}/): ${sbRes.status} ${sbRes.statusText}`);
    } catch (err) {
      console.error(`❌ Storybook check failed: ${err.message}`);
    }
  }

  // Summary
  console.log('\n\x1b[32m🎉 Storybook successfully configured!\x1b[0m\n');
  console.log(
    `🌐 Dokploy Dashboard: ${DOKPLOY_URL_RAW}/dashboard/project/${projectId}/environment/${environmentId}/services/application/${applicationId}`,
  );
  console.log(`📚 Storybook URL:     https://${domainHost}`);
  console.log(`🐳 Dockerfile:        ${customDockerfile}`);
  console.log(`🌿 Git Branch:        ${gitBranch}\n`);
}

main().catch((err) => {
  console.error('\n\x1b[31m❌ Script execution error:\x1b[0m', err.message);
  process.exit(1);
});
